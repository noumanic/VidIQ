"""Transcript translation via the configured LLM provider.

Strategy: chunk the transcript into ~3500-char windows so we stay under
free-tier token caps, translate each window with strict alignment to the
input segment count, fall back to original text on any malformed chunk.
"""

import asyncio
from typing import Iterable

from loguru import logger

from app.services import llm


SYSTEM_TRANSLATOR = (
    "You are a professional translator. Translate the given numbered list of "
    "transcript lines into the target language while preserving meaning, "
    "tone and meaningful punctuation. Do NOT add, remove, merge or reorder "
    "lines. Always respond with valid JSON only."
)

INTER_CALL_DELAY_SEC = 1.0


def _chunk_segments(
    segments: list[dict], max_chars: int = 3500
) -> Iterable[list[dict]]:
    cur: list[dict] = []
    used = 0
    for s in segments:
        line_len = len(s.get("text", "")) + 16
        if cur and used + line_len > max_chars:
            yield cur
            cur, used = [], 0
        cur.append(s)
        used += line_len
    if cur:
        yield cur


async def _translate_chunk(chunk: list[dict], language: str) -> list[str]:
    numbered = "\n".join(
        f"{i + 1}. {s.get('text', '').strip()}" for i, s in enumerate(chunk)
    )
    user = f"""Target language: {language}
You will receive {len(chunk)} numbered transcript lines.
Translate every line. Preserve the order. Do not invent content.

INPUT:
{numbered}

Return JSON of EXACTLY this shape:
{{
  "lines": [
    "line 1 translated",
    "line 2 translated",
    ...
  ]
}}
The "lines" array must have exactly {len(chunk)} elements.
JSON only — no commentary, no markdown fences."""
    res = await llm.chat_json(SYSTEM_TRANSLATOR, user)
    raw = res.get("lines") if isinstance(res, dict) else None
    if not isinstance(raw, list):
        raise ValueError("Translator returned no 'lines' array")
    out = [str(x).strip() for x in raw]
    if len(out) != len(chunk):
        # Pad / truncate gracefully so timestamps still align
        if len(out) < len(chunk):
            out += [s.get("text", "") for s in chunk[len(out) :]]
        else:
            out = out[: len(chunk)]
    return out


async def translate_segments(
    segments: list[dict], target_language: str
) -> list[dict]:
    """Translate transcript segments. Returns segments with `text` replaced
    by the translation; timestamps and speaker fields are preserved."""
    if not segments:
        return []
    chunks = list(_chunk_segments(segments, max_chars=3500))
    out: list[dict] = []
    for i, chunk in enumerate(chunks):
        try:
            translated = await _translate_chunk(chunk, target_language)
        except Exception as e:
            logger.warning(f"Translation chunk {i + 1}/{len(chunks)} failed: {e}")
            translated = [s.get("text", "") for s in chunk]
        for src, txt in zip(chunk, translated):
            out.append({
                "start": src.get("start", 0.0),
                "end": src.get("end", 0.0),
                "text": txt,
                "speaker": src.get("speaker"),
            })
        if i < len(chunks) - 1:
            await asyncio.sleep(INTER_CALL_DELAY_SEC)
    return out


# Convenience: shape used by Translation.segments JSON column.
def to_serialisable(segments: list[dict]) -> list[dict]:
    return [
        {
            "start": float(s.get("start", 0.0)),
            "end": float(s.get("end", 0.0)),
            "text": str(s.get("text", "")),
            "speaker": s.get("speaker"),
        }
        for s in segments
    ]


__all__ = ["translate_segments", "to_serialisable", "SYSTEM_TRANSLATOR"]
