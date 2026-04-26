"""Retrieval-style Q&A grounded in transcript + frame captions."""

import re
from app.services import llm


SYSTEM = (
    "You answer questions about a video using ONLY the provided transcript and visual "
    "frame captions. Cite supporting timestamps in [m:ss] form inline. If the answer "
    "isn't supported by the source, say so honestly."
)


def _tokenize(s: str) -> list[str]:
    return [w.lower() for w in re.findall(r"\w+", s)]


def _retrieve(question: str, segments: list[dict], k: int = 12) -> list[dict]:
    q_tokens = set(_tokenize(question))
    if not q_tokens:
        return segments[:k]
    scored = []
    for s in segments:
        toks = set(_tokenize(s["text"]))
        score = len(q_tokens & toks)
        if score:
            scored.append((score, s))
    scored.sort(key=lambda x: x[0], reverse=True)
    top = [s for _, s in scored[:k]]
    if not top:
        # fallback: return spaced samples to give the LLM some context
        step = max(1, len(segments) // k)
        top = segments[::step][:k]
    return top


def _fmt(sec: float) -> str:
    sec = int(sec)
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    return f"{h:d}:{m:02d}:{s:02d}" if h else f"{m:d}:{s:02d}"


async def answer(
    question: str,
    *,
    transcript: list[dict],
    frames: list[dict],
    title: str | None = None,
    history: list[dict] | None = None,
) -> tuple[str, list[dict]]:
    relevant = _retrieve(question, transcript)
    relevant.sort(key=lambda s: s["start"])
    transcript_block = "\n".join(f"[{_fmt(s['start'])}] {s['text']}" for s in relevant)
    frames_block = "\n".join(
        f"[{_fmt(f['timestamp'])}] {f.get('caption','')}" for f in frames[:20]
    ) or "(none)"
    hist_block = ""
    if history:
        hist_block = "\n\nCONVERSATION HISTORY:\n" + "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in history[-6:]
        )

    user = f"""Video title: {title or "(unknown)"}

TRANSCRIPT (relevant excerpts):
{transcript_block}

FRAME CAPTIONS:
{frames_block}{hist_block}

QUESTION: {question}

Answer concisely. Cite timestamps like [m:ss] when grounding a claim."""
    text = await llm.chat_text(SYSTEM, user)
    citations = [{"timestamp": s["start"], "text": s["text"][:140]} for s in relevant[:5]]
    return text, citations
