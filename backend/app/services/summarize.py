"""Token-efficient, free-tier-friendly video summarisation.

Strategy:
  • SHORT videos (transcript fits in one window) → ONE consolidated LLM call
    that emits overview, key points, chapters, topics, sentiment and events
    in a single JSON. Minimises round-trips and stays well under per-minute
    token limits.

  • LONG videos → SEQUENTIAL map-reduce with a small inter-call delay so we
    don't trip per-minute token quotas. Each chunk produces a mini summary
    + chunk-local events; one final synthesis pass merges them.

  • CHAPTERS — derived from the same final pass for short videos; for long
    videos derived from the chunk boundaries (cheap, no extra LLM call).

  • EVENTS — combined from chunk-local events + frame-level vision events
    + final-pass events, then deduped and capped.

  • PSEUDOCODE — only when explicitly requested; one focused call.

Why this design:
  - Free-tier TPM caps mean fewer/smaller calls are massively more reliable.
  - Each call has a deterministic schema and is independently parseable.
  - Failures degrade gracefully: chapter extraction failure ≠ summary failure.
  - The chunk pacing respects 429 retry_delay hints from the LLM client layer.
"""

import asyncio
from typing import Any

from loguru import logger

from app.services import llm


SYSTEM_ANALYST = (
    "You are an expert video analyst. You combine the spoken transcript with "
    "visual frame captions to produce concise, faithful, structured insights. "
    "Never invent content not present in the transcript or captions. "
    "Always respond with valid JSON only — no commentary, no markdown fences."
)


# ── helpers ───────────────────────────────────────────────────────────────

def _fmt_ts(sec: float) -> str:
    sec = int(max(0, sec))
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h:d}:{m:02d}:{s:02d}" if h else f"{m:d}:{s:02d}"


def _format_segments(segments: list[dict], max_chars: int) -> str:
    out, used = [], 0
    for s in segments:
        line = f"[{_fmt_ts(s['start'])}] {s.get('text', '').strip()}"
        if used + len(line) > max_chars:
            out.append("…[truncated]…")
            break
        out.append(line)
        used += len(line) + 1
    return "\n".join(out)


def _format_frames(frames: list[dict], max_chars: int = 1500) -> str:
    if not frames:
        return "(no frames analysed)"
    out, used = [], 0
    for f in frames:
        line = f"[{_fmt_ts(f['timestamp'])}] {(f.get('caption') or '').strip()}"
        if used + len(line) > max_chars:
            out.append("…")
            break
        out.append(line)
        used += len(line) + 1
    return "\n".join(out)


def _coerce_event(e: dict, default_ts: float = 0.0) -> dict | None:
    if not isinstance(e, dict):
        return None
    title = (e.get("title") or "").strip()
    desc = (e.get("description") or "").strip()
    if not title and not desc:
        return None
    sev = (e.get("severity") or "info").lower()
    if sev not in {"info", "notice", "warning"}:
        sev = "info"
    try:
        ts = float(e.get("timestamp", default_ts))
    except (TypeError, ValueError):
        ts = default_ts
    return {
        "timestamp": ts,
        "title": title or "Event",
        "description": desc or title,
        "severity": sev,
        "category": (e.get("category") or "").strip() or None,
    }


def _coerce_chapter(c: dict) -> dict | None:
    if not isinstance(c, dict):
        return None
    title = (c.get("title") or "").strip()
    if not title:
        return None
    try:
        start = float(c.get("start", 0))
        end = float(c.get("end", start + 60))
    except (TypeError, ValueError):
        return None
    return {"start": start, "end": end, "title": title}


def _chunk_segments(
    segments: list[dict], max_chars_per_chunk: int = 4500
) -> list[list[dict]]:
    chunks: list[list[dict]] = []
    cur: list[dict] = []
    cur_chars = 0
    for seg in segments:
        line_len = len(seg.get("text", "")) + 16
        if cur and (cur_chars + line_len) > max_chars_per_chunk:
            chunks.append(cur)
            cur = []
            cur_chars = 0
        cur.append(seg)
        cur_chars += line_len
    if cur:
        chunks.append(cur)
    return chunks


def _frames_in_window(frames: list[dict], start: float, end: float) -> list[dict]:
    return [f for f in frames if start <= f["timestamp"] <= end + 5.0]


def _merge_events(*event_lists: list[dict]) -> list[dict]:
    all_events: list[dict] = []
    for lst in event_lists:
        for e in lst or []:
            ev = _coerce_event(e if isinstance(e, dict) else {})
            if ev:
                all_events.append(ev)

    deduped: list[dict] = []
    for ev in sorted(all_events, key=lambda e: e["timestamp"]):
        is_dup = any(
            abs(ev["timestamp"] - d["timestamp"]) < 12.0
            and ev["title"].lower()[:24] == d["title"].lower()[:24]
            for d in deduped
        )
        if not is_dup:
            deduped.append(ev)

    if len(deduped) > 30:
        step = len(deduped) / 30
        deduped = [deduped[int(i * step)] for i in range(30)]
    return deduped


# ══════════════════════════════════════════════════════════════════════════
#  SHORT-video path: one consolidated call
# ══════════════════════════════════════════════════════════════════════════

async def _all_in_one(
    *,
    title: str | None,
    duration: float | None,
    transcript: list[dict],
    frame_analyses: list[dict],
    domain: str | None,
) -> dict[str, Any]:
    domain_hint = f"\nDomain focus: {domain}" if domain else ""
    user = f"""Title: {title or "(unknown)"}
Duration: {_fmt_ts(duration or 0)}{domain_hint}

TRANSCRIPT (timestamped):
{_format_segments(transcript, max_chars=4500)}

VISUAL FRAME CAPTIONS:
{_format_frames(frame_analyses, max_chars=1200)}

Produce a JSON object with EXACTLY this shape:
{{
  "overview": "3-5 sentence faithful overview that captures the arc",
  "key_points": ["6-10 specific bullet takeaways, ordered by importance"],
  "topics": ["3-7 short lowercase topic tags"],
  "chapters": [
    {{"start": <seconds>, "end": <seconds>, "title": "concise descriptive title"}}
  ],
  "sentiment": "positive|neutral|negative|mixed",
  "events": [
    {{"timestamp": <seconds>, "title": "<short>", "description": "<one sentence>",
      "severity": "info|notice|warning",
      "category": "demo|claim|definition|action|example|question|insight"}}
  ]
}}

Rules:
- 3 to 8 chapters covering the full video, no gaps. First chapter starts at 0.
- 5 to 15 events surfacing the most notable moments (demos, claims, definitions,
  actions, examples, questions, insights). Skip small talk.
- All timestamps in SECONDS as numbers.
- Do not invent content beyond the transcript and frame captions.
- Output JSON only.
"""
    return await llm.chat_json(SYSTEM_ANALYST, user)


# ══════════════════════════════════════════════════════════════════════════
#  LONG-video path: sequential chunks + final synth
# ══════════════════════════════════════════════════════════════════════════

async def _chunk_pass(chunk: list[dict], frames: list[dict], i: int, n: int) -> dict[str, Any]:
    start_ts = chunk[0]["start"]
    end_ts = chunk[-1]["end"]
    user = f"""Window {i + 1}/{n} ({_fmt_ts(start_ts)} → {_fmt_ts(end_ts)}).

TRANSCRIPT:
{_format_segments(chunk, max_chars=3500)}

FRAMES:
{_format_frames(frames, max_chars=600)}

Return JSON:
{{
  "mini_summary": "2-3 sentences",
  "key_points": ["1-3 specific points"],
  "events": [
    {{"timestamp": <sec in [{start_ts:.0f},{end_ts:.0f}]>,
      "title": "<short>", "description": "<one sentence>",
      "severity": "info|notice|warning",
      "category": "demo|claim|definition|action|example|question|insight"}}
  ]
}}
JSON only."""
    return await llm.chat_json(SYSTEM_ANALYST, user)


async def _final_synth(
    *,
    title: str | None,
    duration: float | None,
    chunk_results: list[dict],
    domain: str | None,
) -> dict[str, Any]:
    bullets = []
    for i, ch in enumerate(chunk_results):
        if mini := (ch.get("mini_summary") or "").strip():
            bullets.append(f"[w{i + 1}] {mini}")
    block = "\n".join(bullets) or "(no mini summaries)"
    domain_hint = f"\nDomain focus: {domain}" if domain else ""
    user = f"""Title: {title or "(unknown)"}
Duration: {_fmt_ts(duration or 0)}{domain_hint}

WINDOW SUMMARIES:
{block}

Synthesise:
{{
  "overview": "3-5 sentence overview that flows naturally",
  "key_points": ["6-10 specific takeaways, ordered by importance, no duplicates"],
  "topics": ["3-7 short lowercase topic tags"],
  "sentiment": "positive|neutral|negative|mixed"
}}
JSON only."""
    return await llm.chat_json(SYSTEM_ANALYST, user)


# ── chapters from chunk boundaries (no extra LLM call) ───────────────────

def _chapters_from_chunks(
    chunks: list[list[dict]], chunk_results: list[dict], duration: float | None
) -> list[dict]:
    chapters = []
    for i, (chunk, res) in enumerate(zip(chunks, chunk_results)):
        title = (res.get("mini_summary") or "").strip().split(". ")[0][:50]
        if not title:
            title = f"Part {i + 1}"
        chapters.append({
            "start": chunk[0]["start"],
            "end": chunk[-1]["end"],
            "title": title,
        })
    return chapters


# ── pseudocode (optional) ────────────────────────────────────────────────

async def _extract_pseudocode(
    title: str | None, segments: list[dict], domain: str | None
) -> str | None:
    user = f"""Video title: {title or "(unknown)"}
Domain: {domain or "general"}

TRANSCRIPT:
{_format_segments(segments, max_chars=4000)}

If this video teaches a process, strategy or algorithm, extract it as
pseudocode or a numbered workflow. If it doesn't, return an empty string.

Return JSON:
{{ "pseudocode": "..." }}
JSON only."""
    res = await llm.chat_json(SYSTEM_ANALYST, user)
    code = (res.get("pseudocode") or "").strip()
    return code or None


# ══════════════════════════════════════════════════════════════════════════
#  Public entry point
# ══════════════════════════════════════════════════════════════════════════

# Threshold: if the whole transcript fits in one chunk, do it in one shot.
SHORT_VIDEO_MAX_CHARS = 4500
INTER_CALL_DELAY_SEC = 1.5  # gentle pacing for free tier


async def summarize_video(
    *,
    title: str | None,
    duration: float | None,
    transcript: list[dict],
    frame_analyses: list[dict],
    domain: str | None = None,
    extract_pseudocode: bool = False,
) -> dict[str, Any]:
    chunks = _chunk_segments(transcript, max_chars_per_chunk=SHORT_VIDEO_MAX_CHARS)
    is_short = len(chunks) <= 1
    logger.info(
        f"Summarising: {len(transcript)} segments, {len(chunks)} chunks, "
        f"{'SHORT' if is_short else 'LONG'} path"
    )

    overview = ""
    key_points: list[str] = []
    topics: list[str] = []
    chapters: list[dict] = []
    sentiment: str | None = None
    chunk_events: list[dict] = []

    if is_short:
        # ── ONE consolidated call ─────────────────────────────────────────
        try:
            r = await _all_in_one(
                title=title, duration=duration,
                transcript=transcript, frame_analyses=frame_analyses, domain=domain,
            )
            overview = (r.get("overview") or "").strip()
            key_points = [k for k in (r.get("key_points") or []) if isinstance(k, str) and k.strip()]
            topics = [t for t in (r.get("topics") or []) if isinstance(t, str) and t.strip()]
            sentiment = (r.get("sentiment") or "").strip() or None
            chapters = [c for c in (_coerce_chapter(c) for c in (r.get("chapters") or [])) if c]
            chunk_events = r.get("events") or []
        except Exception as e:
            logger.warning(f"All-in-one summarisation failed: {e}")
    else:
        # ── SEQUENTIAL chunk pass + final synth ───────────────────────────
        chunk_results: list[dict] = []
        for i, chunk in enumerate(chunks):
            window_frames = _frames_in_window(frame_analyses, chunk[0]["start"], chunk[-1]["end"])
            try:
                r = await _chunk_pass(chunk, window_frames, i, len(chunks))
            except Exception as e:
                logger.warning(f"Chunk {i + 1} failed: {e}")
                r = {}
            chunk_results.append(r)
            chunk_events.extend(r.get("events", []) or [])
            if i < len(chunks) - 1:
                await asyncio.sleep(INTER_CALL_DELAY_SEC)

        try:
            await asyncio.sleep(INTER_CALL_DELAY_SEC)
            synth = await _final_synth(
                title=title, duration=duration,
                chunk_results=chunk_results, domain=domain,
            )
            overview = (synth.get("overview") or "").strip()
            key_points = [k for k in (synth.get("key_points") or []) if isinstance(k, str) and k.strip()]
            topics = [t for t in (synth.get("topics") or []) if isinstance(t, str) and t.strip()]
            sentiment = (synth.get("sentiment") or "").strip() or None
        except Exception as e:
            logger.warning(f"Final synthesis failed: {e}")

        chapters = _chapters_from_chunks(chunks, chunk_results, duration)

    # ── Optional pseudocode (separate call) ──────────────────────────────
    pseudocode: str | None = None
    if extract_pseudocode:
        try:
            await asyncio.sleep(INTER_CALL_DELAY_SEC)
            pseudocode = await _extract_pseudocode(title, transcript, domain)
        except Exception as e:
            logger.warning(f"Pseudocode extraction failed: {e}")

    # ── Merge events: chunk + frame ───────────────────────────────────────
    frame_events = [
        {**(f.get("event") or {}), "timestamp": f["timestamp"], "category": "visual"}
        for f in frame_analyses
        if f.get("event")
    ]
    events = _merge_events(chunk_events, frame_events)

    # ── Final fallbacks so the UI is never blank ─────────────────────────
    if not overview:
        # Compose a synthetic overview from whatever transcript we have
        sample = " ".join(s.get("text", "") for s in transcript[:6]).strip()
        overview = (
            f"Summary unavailable from the LLM (likely rate-limited). "
            f"Excerpt from the start of the video: \"{sample[:280]}…\""
            if sample
            else "Summary unavailable."
        )

    if not chapters and transcript:
        # Synthesise simple chapters from transcript thirds
        n = len(transcript)
        if n >= 3:
            third = n // 3
            chapters = [
                {"start": transcript[0]["start"], "end": transcript[third - 1]["end"], "title": "Opening"},
                {"start": transcript[third]["start"], "end": transcript[2 * third - 1]["end"], "title": "Middle"},
                {"start": transcript[2 * third]["start"], "end": transcript[-1]["end"], "title": "Closing"},
            ]

    return {
        "overview": overview,
        "key_points": key_points[:10],
        "topics": topics[:7],
        "chapters": chapters,
        "sentiment": sentiment or "neutral",
        "events": events,
        "pseudocode": pseudocode,
    }


# ══════════════════════════════════════════════════════════════════════════
#  Live: rolling summary
# ══════════════════════════════════════════════════════════════════════════

async def rolling_summary(
    *, prior_summary: str, new_transcript: list[dict], new_frames: list[dict]
) -> dict[str, Any]:
    user = f"""You are maintaining a ROLLING LIVE SUMMARY of an ongoing stream.

PRIOR SUMMARY:
{prior_summary or "(none yet)"}

NEW TRANSCRIPT CHUNK:
{_format_segments(new_transcript, max_chars=3500)}

NEW FRAME CAPTIONS:
{_format_frames(new_frames, max_chars=800)}

Return JSON:
{{
  "rolling_summary": "updated 3-5 sentence running summary",
  "new_key_points": ["1-3 new bullets just added in this chunk"],
  "new_events": [
    {{"timestamp": <seconds>, "title": "...", "description": "...",
      "severity": "info|notice|warning", "category": "..."}}
  ]
}}
JSON only."""
    res = await llm.chat_json(SYSTEM_ANALYST, user)
    res["new_events"] = [
        e for e in (_coerce_event(x) for x in (res.get("new_events") or [])) if e
    ]
    return res
