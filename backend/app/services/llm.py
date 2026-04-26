"""LLM provider abstraction.

Providers:
  • gemini  — FREE tier (google-generativeai)
  • openai  — paid (OpenAI SDK)
  • stub    — no API; returns placeholder text

Transcription:
  • local   — faster-whisper (FREE, local)
  • openai  — paid Whisper API
  • none    — disabled

Robustness layers added on top:
  • Auto-discovery of the best available Gemini model (handles deprecation
    of pinned model names without code changes).
  • Defensive JSON parsing: strips markdown fences, fixes single-quoted
    JSON, recovers from truncation.
  • Single retry with a simpler prompt on parse failure.
"""

import asyncio
import base64
import json
import random
import re
import time
from pathlib import Path
from typing import Any

from loguru import logger

from app.core.config import get_settings


settings = get_settings()

# Priority list — first one that exists in the user's account wins.
# 2.0 models are listed first because the 2.5 family requires a paid tier
# or explicit enablement on most projects.
GEMINI_FALLBACK_CHAIN = [
    "gemini-2.0-flash-lite",  # most permissive free quota
    "gemini-2.0-flash",
    "gemini-flash-lite-latest",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
]

# Free Groq models that work for our use case
GROQ_FALLBACK_CHAIN = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]


# ── Gemini multi-model rotation ──────────────────────────────────────────
_gemini_available: list[str] | None = None
_gemini_cooldown: dict[str, float] = {}  # model_id → unix-time when usable again


def _list_gemini_models() -> list[str]:
    """List models available to this account, ordered by our preference chain."""
    global _gemini_available
    if _gemini_available is not None:
        return _gemini_available
    if not settings.GEMINI_API_KEY:
        _gemini_available = []
        return _gemini_available
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        avail = {
            m.name.replace("models/", "")
            for m in genai.list_models()
            if "generateContent" in m.supported_generation_methods
        }
        # Order: explicit config first, then preference chain, then everything else
        ordered: list[str] = []
        for cand in [settings.GEMINI_MODEL, *GEMINI_FALLBACK_CHAIN]:
            if cand in avail and cand not in ordered:
                ordered.append(cand)
        for cand in sorted(avail):
            if cand not in ordered:
                ordered.append(cand)
        _gemini_available = ordered
        logger.info(f"Gemini models discovered: {ordered[:5]}{'…' if len(ordered) > 5 else ''}")
    except Exception as e:
        logger.warning(f"Could not list Gemini models, falling back to config: {e}")
        _gemini_available = [settings.GEMINI_MODEL] + GEMINI_FALLBACK_CHAIN
    return _gemini_available


def _next_usable_model() -> str | None:
    """Return the next model whose cool-down has expired."""
    now = time.time()
    for m in _list_gemini_models():
        if _gemini_cooldown.get(m, 0) <= now:
            return m
    return None


def _cool_off(model_id: str, seconds: float) -> None:
    until = time.time() + max(seconds, 5)
    _gemini_cooldown[model_id] = until
    logger.warning(
        f"Cooling off Gemini model '{model_id}' for {seconds:.0f}s "
        f"(remaining models: {sum(1 for m in _list_gemini_models() if _gemini_cooldown.get(m,0) <= time.time())})"
    )


# Cached configured client and per-model cache to avoid recreating instances.
_gemini_models_cache: dict[str, tuple[Any, Any, Any]] = {}


def _get_gemini_for(model_id: str):
    cached = _gemini_models_cache.get(model_id)
    if cached:
        return cached
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    text = genai.GenerativeModel(model_id)
    vision = genai.GenerativeModel(model_id)
    text_json = genai.GenerativeModel(
        model_id, generation_config={"response_mime_type": "application/json"}
    )
    _gemini_models_cache[model_id] = (text, vision, text_json)
    logger.info(f"Gemini model ready: {model_id}")
    return text, vision, text_json


def _resolve_gemini_model() -> str | None:
    """Back-compat: return the currently-preferred usable model id (or None)."""
    return _next_usable_model()


def _get_gemini():
    """Back-compat tuple. Returns (text, vision, text_json) for the current
    usable model — or (None, None, None) if nothing is available."""
    m = _next_usable_model()
    if not m:
        return None, None, None
    return _get_gemini_for(m)


# ── OpenAI lazy ──────────────────────────────────────────────────────────
_openai_client = None


def _get_openai():
    global _openai_client
    if _openai_client is None and settings.OPENAI_API_KEY:
        from openai import AsyncOpenAI
        _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


# ── Groq lazy + cool-down (FREE, very fast) ──────────────────────────────
_groq_client = None
_groq_cooldown: dict[str, float] = {}


def _get_groq():
    global _groq_client
    if _groq_client is None and settings.GROQ_API_KEY:
        from groq import Groq
        _groq_client = Groq(api_key=settings.GROQ_API_KEY)
    return _groq_client


def _next_usable_groq() -> str | None:
    if not settings.GROQ_API_KEY:
        return None
    now = time.time()
    chain = [settings.GROQ_MODEL, *GROQ_FALLBACK_CHAIN]
    seen: set[str] = set()
    for m in chain:
        if m in seen:
            continue
        seen.add(m)
        if _groq_cooldown.get(m, 0) <= now:
            return m
    return None


def _cool_off_groq(model_id: str, seconds: float) -> None:
    _groq_cooldown[model_id] = time.time() + max(seconds, 5)


def _groq_chat_json(system: str, user: str) -> dict[str, Any]:
    """Groq JSON-mode call with model rotation."""
    cli = _get_groq()
    if cli is None:
        return {}
    last_err: Exception | None = None
    tried: set[str] = set()
    for _ in range(4):
        model_id = _next_usable_groq()
        if not model_id or model_id in tried:
            break
        tried.add(model_id)
        try:
            resp = cli.chat.completions.create(
                model=model_id,
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.2,
            )
            text = (resp.choices[0].message.content or "").strip()
            parsed = _safe_json(text)
            if parsed:
                return parsed
            last_err = ValueError("unparseable JSON")
        except Exception as e:
            last_err = e
            msg = str(e).lower()
            if "rate" in msg or "429" in msg or "quota" in msg:
                _cool_off_groq(model_id, 60)
            elif "model" in msg and ("not" in msg or "decommission" in msg):
                _cool_off_groq(model_id, 24 * 3600)
            else:
                _cool_off_groq(model_id, 30)
    logger.warning(f"Groq exhausted (json); last error: {last_err}")
    return {}


def _groq_chat_text(system: str, user: str) -> str:
    cli = _get_groq()
    if cli is None:
        return ""
    last_err: Exception | None = None
    tried: set[str] = set()
    for _ in range(4):
        model_id = _next_usable_groq()
        if not model_id or model_id in tried:
            break
        tried.add(model_id)
        try:
            resp = cli.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.3,
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception as e:
            last_err = e
            msg = str(e).lower()
            if "rate" in msg or "429" in msg or "quota" in msg:
                _cool_off_groq(model_id, 60)
            elif "model" in msg:
                _cool_off_groq(model_id, 24 * 3600)
            else:
                _cool_off_groq(model_id, 30)
    logger.warning(f"Groq exhausted (text); last error: {last_err}")
    return ""


# ── Local Whisper lazy ───────────────────────────────────────────────────
_whisper_local = None


def _get_local_whisper():
    global _whisper_local
    if _whisper_local is not None:
        return _whisper_local
    try:
        from faster_whisper import WhisperModel
        logger.info(f"Loading local Whisper model: {settings.WHISPER_LOCAL_MODEL}")
        _whisper_local = WhisperModel(
            settings.WHISPER_LOCAL_MODEL,
            device=settings.WHISPER_LOCAL_DEVICE,
            compute_type=settings.WHISPER_LOCAL_COMPUTE,
        )
        return _whisper_local
    except Exception as e:
        logger.warning(f"faster-whisper not available: {e}")
        return None


# ══════════════════════════════════════════════════════════════════════════
#  Public API
# ══════════════════════════════════════════════════════════════════════════

def _provider_chain() -> list[str]:
    """Order in which to try providers — explicit choice first, then any other
    provider that has a key configured. This lets a single video analysis
    transparently fail over from Gemini (quota) to Groq, etc."""
    chain = [settings.LLM_PROVIDER]
    for p in ("gemini", "groq", "openai"):
        if p in chain:
            continue
        if p == "gemini" and settings.GEMINI_API_KEY:
            chain.append(p)
        elif p == "groq" and settings.GROQ_API_KEY:
            chain.append(p)
        elif p == "openai" and settings.OPENAI_API_KEY:
            chain.append(p)
    return chain


async def chat_json(system: str, user: str, *, schema_hint: str = "") -> dict[str, Any]:
    """Strict-JSON response with cross-provider fallback."""
    prompt = user + (f"\n\nReturn ONLY valid JSON matching: {schema_hint}" if schema_hint else "")
    last_provider: str | None = None

    for provider in _provider_chain():
        if provider == "gemini":
            _, _, model_json = _get_gemini()
            if model_json is None:
                continue
            r = await asyncio.to_thread(_gemini_chat_json_with_retry, model_json, system, prompt)
            if r:
                return r
            last_provider = provider
            logger.info(f"Gemini exhausted for this call — falling back to next provider")

        elif provider == "groq":
            if not settings.GROQ_API_KEY:
                continue
            r = await asyncio.to_thread(_groq_chat_json, system, prompt)
            if r:
                return r
            last_provider = provider

        elif provider == "openai":
            cli = _get_openai()
            if cli is None:
                continue
            try:
                resp = await cli.chat.completions.create(
                    model=settings.LLM_MODEL,
                    response_format={"type": "json_object"},
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.2,
                )
                parsed = _safe_json(resp.choices[0].message.content or "{}")
                if parsed:
                    return parsed
            except Exception as e:
                logger.warning(f"OpenAI JSON call failed: {e}")
            last_provider = provider

    if last_provider is None:
        return _stub_json(system, prompt)
    return {}


async def chat_text(system: str, user: str, *, citations: list | None = None) -> str:
    last_provider: str | None = None

    for provider in _provider_chain():
        if provider == "gemini":
            model, _, _ = _get_gemini()
            if model is None:
                continue
            r = await asyncio.to_thread(_gemini_chat_text_sync, model, system, user)
            if r:
                return r
            last_provider = provider

        elif provider == "groq":
            if not settings.GROQ_API_KEY:
                continue
            r = await asyncio.to_thread(_groq_chat_text, system, user)
            if r:
                return r
            last_provider = provider

        elif provider == "openai":
            cli = _get_openai()
            if cli is None:
                continue
            try:
                resp = await cli.chat.completions.create(
                    model=settings.LLM_MODEL,
                    messages=[
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    temperature=0.3,
                )
                t = resp.choices[0].message.content or ""
                if t.strip():
                    return t
            except Exception as e:
                logger.warning(f"OpenAI text call failed: {e}")
            last_provider = provider

    if last_provider is None:
        return _stub_text(user, citations)
    return ""


async def vision_caption(image_path: Path, hint: str = "") -> dict[str, Any]:
    """Caption a frame and extract tags/events. Returns {caption, tags, event}."""
    provider = settings.LLM_PROVIDER
    prompt = (
        "Describe this video frame for a multimodal summarisation system. "
        f"Context hint: {hint or 'general'}. "
        'Return JSON: {"caption": str, "tags": [str], '
        '"event": null | {"title": str, "description": str, "severity": "info|notice|warning"}}'
    )

    if provider == "gemini":
        _, vision, _ = _get_gemini()
        if vision is None:
            return {"caption": "", "tags": [], "event": None}
        return await asyncio.to_thread(_gemini_vision_sync, vision, image_path, prompt)

    if provider == "openai":
        cli = _get_openai()
        if cli is None:
            return {"caption": "", "tags": [], "event": None}
        try:
            img_b64 = base64.b64encode(image_path.read_bytes()).decode()
            resp = await cli.chat.completions.create(
                model=settings.VISION_MODEL,
                response_format={"type": "json_object"},
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{img_b64}"},
                            },
                        ],
                    }
                ],
                temperature=0.2,
            )
            return _safe_json(resp.choices[0].message.content or "{}")
        except Exception as e:
            logger.warning(f"OpenAI vision call failed: {e}")
            return {"caption": "", "tags": [], "event": None}

    return {"caption": "", "tags": [], "event": None}


async def transcribe_audio(audio_path: Path) -> list[dict[str, Any]]:
    """Returns list of {start, end, text}."""
    provider = settings.TRANSCRIPTION_PROVIDER

    if provider == "local":
        model = _get_local_whisper()
        if model is None:
            return _stub_transcript("install faster-whisper or set TRANSCRIPTION_PROVIDER=openai")
        return await asyncio.to_thread(_local_whisper_sync, model, audio_path)

    if provider == "openai":
        cli = _get_openai()
        if cli is None:
            return _stub_transcript("set OPENAI_API_KEY or use TRANSCRIPTION_PROVIDER=local")
        with audio_path.open("rb") as f:
            resp = await cli.audio.transcriptions.create(
                model=settings.TRANSCRIPTION_MODEL,
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )
        segs = []
        for s in getattr(resp, "segments", []) or []:
            segs.append({"start": float(s["start"]), "end": float(s["end"]), "text": s["text"].strip()})
        if not segs and getattr(resp, "text", None):
            segs.append({"start": 0.0, "end": 0.0, "text": resp.text})
        return segs

    return _stub_transcript("transcription disabled (TRANSCRIPTION_PROVIDER=none)")


# ══════════════════════════════════════════════════════════════════════════
#  Sync helpers (run in worker threads)
# ══════════════════════════════════════════════════════════════════════════

def _extract_retry_delay(err: Exception) -> float | None:
    """Pull the suggested retry_delay from a Gemini 429 error (seconds)."""
    msg = str(err)
    m = re.search(r"retry_delay\s*\{\s*seconds:\s*(\d+)", msg)
    if m:
        return float(m.group(1))
    return None


def _is_quota_error(err: Exception) -> bool:
    msg = str(err)
    return "429" in msg or "quota" in msg.lower() or "rate" in msg.lower()


def _is_denied_error(err: Exception) -> bool:
    msg = str(err)
    return "403" in msg or "denied" in msg.lower() or "permission" in msg.lower()


def _gemini_chat_json_with_retry(_unused, system: str, user: str) -> dict[str, Any]:
    """JSON-mode call. Rotates through every available Gemini model when one
    hits a quota or denial error, so a single exhausted model doesn't sink
    the whole pipeline.
    """
    last_err: Exception | None = None
    tried: set[str] = set()

    for _ in range(len(_list_gemini_models()) + 1):
        model_id = _next_usable_model()
        if not model_id or model_id in tried:
            break
        tried.add(model_id)
        _, _, text_json = _get_gemini_for(model_id)

        for attempt in range(2):
            try:
                resp = text_json.generate_content([system, user])
                text = (resp.text or "").strip()
                parsed = _safe_json(text)
                if parsed:
                    return parsed
                logger.warning(f"[{model_id}] returned unparseable JSON ({len(text)} chars)")
                last_err = ValueError("unparseable JSON")
                break  # don't retry parse failures on the same model
            except Exception as e:
                last_err = e
                if _is_denied_error(e):
                    _cool_off(model_id, 24 * 3600)  # denied — give up for the day
                    break
                if _is_quota_error(e):
                    delay = _extract_retry_delay(e)
                    if delay is None or delay > 30:
                        # Daily quota or long backoff — rotate to next model
                        _cool_off(model_id, max(delay or 0, 6 * 3600))
                        break
                    # Short backoff — actually wait
                    logger.warning(f"[{model_id}] quota; sleeping {delay:.1f}s")
                    time.sleep(min(delay, 30))
                    continue
                logger.warning(f"[{model_id}] failed (attempt {attempt + 1}/2): {e}")
                time.sleep(0.5 + attempt)

    logger.warning(f"All Gemini models exhausted; last error: {last_err}")
    return {}


def _gemini_chat_text_sync(_unused, system: str, user: str) -> str:
    """Plain-text chat with model rotation."""
    last_err: Exception | None = None
    tried: set[str] = set()
    for _ in range(len(_list_gemini_models()) + 1):
        model_id = _next_usable_model()
        if not model_id or model_id in tried:
            break
        tried.add(model_id)
        text, _, _ = _get_gemini_for(model_id)
        try:
            resp = text.generate_content([system, user])
            return (resp.text or "").strip()
        except Exception as e:
            last_err = e
            if _is_denied_error(e):
                _cool_off(model_id, 24 * 3600)
            elif _is_quota_error(e):
                delay = _extract_retry_delay(e) or 6 * 3600
                _cool_off(model_id, delay)
            else:
                _cool_off(model_id, 30)
    logger.warning(f"All Gemini models exhausted (text); last error: {last_err}")
    return ""


def _gemini_vision_sync(_unused, image_path: Path, prompt: str) -> dict[str, Any]:
    """Vision call with model rotation."""
    from PIL import Image
    last_err: Exception | None = None
    tried: set[str] = set()
    img = Image.open(image_path)
    for _ in range(len(_list_gemini_models()) + 1):
        model_id = _next_usable_model()
        if not model_id or model_id in tried:
            break
        tried.add(model_id)
        _, vision, _ = _get_gemini_for(model_id)
        try:
            resp = vision.generate_content(
                [prompt, img],
                generation_config={"response_mime_type": "application/json"},
            )
            return _safe_json((resp.text or "").strip())
        except Exception as e:
            last_err = e
            if _is_denied_error(e):
                _cool_off(model_id, 24 * 3600)
            elif _is_quota_error(e):
                delay = _extract_retry_delay(e) or 6 * 3600
                _cool_off(model_id, delay)
            else:
                _cool_off(model_id, 30)
    logger.warning(f"All Gemini models exhausted (vision); last error: {last_err}")
    return {"caption": "", "tags": [], "event": None}


def gemini_status() -> dict[str, Any]:
    """Snapshot of Gemini availability for the /api/health endpoint."""
    now = time.time()
    models = _list_gemini_models()
    statuses = []
    for m in models:
        cd = _gemini_cooldown.get(m, 0)
        statuses.append({
            "model": m,
            "available": cd <= now,
            "cooldown_seconds": max(0, int(cd - now)),
        })
    available_count = sum(1 for s in statuses if s["available"])
    return {
        "configured": bool(settings.GEMINI_API_KEY),
        "models_total": len(models),
        "models_available_now": available_count,
        "models": statuses[:8],
    }


def _local_whisper_sync(model, audio_path: Path) -> list[dict[str, Any]]:
    segments_iter, _info = model.transcribe(str(audio_path), beam_size=1, vad_filter=True)
    segs = []
    for s in segments_iter:
        segs.append({"start": float(s.start), "end": float(s.end), "text": s.text.strip()})
    return segs


# ══════════════════════════════════════════════════════════════════════════
#  Defensive JSON parser
# ══════════════════════════════════════════════════════════════════════════

_JSON_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE | re.MULTILINE)


def _safe_json(text: str) -> dict[str, Any]:
    """Tolerate Gemini's various output quirks."""
    if not text:
        return {}
    s = text.strip()

    # 1) Strip markdown fences
    if s.startswith("```"):
        s = _JSON_FENCE_RE.sub("", s).strip()

    # 2) Direct parse
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        pass

    # 3) Extract first balanced {...} block
    start = s.find("{")
    end = s.rfind("}")
    if start != -1 and end > start:
        try:
            return json.loads(s[start : end + 1])
        except json.JSONDecodeError:
            pass

    # 4) Try first balanced [...] (in case the LLM returned an array)
    start = s.find("[")
    end = s.rfind("]")
    if start != -1 and end > start:
        try:
            arr = json.loads(s[start : end + 1])
            return {"items": arr} if isinstance(arr, list) else {}
        except json.JSONDecodeError:
            pass

    return {}


# ══════════════════════════════════════════════════════════════════════════
#  Stub fallbacks
# ══════════════════════════════════════════════════════════════════════════

def _stub_json(system: str, prompt: str) -> dict[str, Any]:
    if "summary" in system.lower() or "summarize" in prompt.lower():
        return {
            "overview": "(stub) Set GEMINI_API_KEY (free) or OPENAI_API_KEY in backend/.env to generate real summaries.",
            "key_points": ["Stub key point 1", "Stub key point 2"],
            "topics": ["demo", "stub"],
            "chapters": [],
            "sentiment": "neutral",
            "events": [],
        }
    return {}


def _stub_text(prompt: str, citations: list | None) -> str:
    return (
        "I'm running in demo/offline mode. Add a free GEMINI_API_KEY (from "
        "https://aistudio.google.com/app/apikey) to backend/.env to enable real "
        "Q&A grounded in this video's transcript and frames."
    )


def _stub_transcript(reason: str) -> list[dict[str, Any]]:
    return [{"start": 0.0, "end": 5.0, "text": f"(stub transcript — {reason})"}]
