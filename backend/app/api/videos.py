"""Recorded video analysis routes."""

import asyncio
import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import SessionLocal, get_db
from app.core.config import get_settings
from app.models.video import Video, ChatMessage, Translation
from app.schemas.video import (
    AnalyzeRequest,
    ChatMessageDTO,
    ChatRequest,
    TagsUpdateRequest,
    TranscriptSubmitRequest,
    TranslationResponse,
    VideoDetailDTO,
    VideoSummaryDTO,
)
from app.services import qa as qa_svc
from app.services import translate as translate_svc
from app.services.pipeline import (
    run_transcript_pipeline,
    run_uploaded_media_pipeline,
    run_youtube_pipeline,
)


router = APIRouter(prefix="/api/videos", tags=["videos"])
settings = get_settings()

UPLOAD_REQUIRED_MESSAGE = (
    "YouTube blocked automated access. For local full analysis, make sure browser "
    "cookies are available to yt-dlp, or use one of the upload or transcript options."
)
UPLOAD_ACTIONS = ["paste_transcript", "upload_transcript", "upload_audio", "upload_video"]


def _upload_required_fields(v: Video) -> dict:
    if v.status != "needs_upload":
        return {
            "upload_required_reason": None,
            "upload_message": None,
            "available_actions": [],
        }
    reason = (v.error or "youtube_transcript_unavailable_or_blocked").split(":", 1)[0]
    return {
        "upload_required_reason": reason,
        "upload_message": UPLOAD_REQUIRED_MESSAGE,
        "available_actions": UPLOAD_ACTIONS,
    }


def _is_transcript_upload(file: UploadFile) -> bool:
    suffix = Path(file.filename or "").suffix.lower()
    content_type = (file.content_type or "").lower()
    return suffix in {".txt", ".srt", ".vtt", ".md"} or content_type.startswith("text/")


@router.post("", response_model=VideoSummaryDTO, status_code=202)
async def analyze_video(
    body: AnalyzeRequest,
    background: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Video:
    if not body.url:
        raise HTTPException(400, "url is required")

    vid_id = uuid.uuid4().hex[:12]
    v = Video(
        id=vid_id,
        source_type="youtube",
        source_url=body.url,
        status="processing",
        progress=0.0,
        stage="queued",
    )
    db.add(v)
    await db.commit()
    await db.refresh(v)

    background.add_task(
        _run_pipeline_safe,
        vid_id,
        body.url,
        body.domain,
        body.extract_pseudocode,
    )
    return v


async def _run_pipeline_safe(vid_id: str, url: str, domain: str | None, extract_pseudocode: bool) -> None:
    try:
        await run_youtube_pipeline(vid_id, url, domain=domain, extract_pseudocode=extract_pseudocode)
    except Exception:
        # already logged & persisted inside the pipeline
        pass


async def _mark_background_failed(vid_id: str, error: Exception) -> None:
    async with SessionLocal() as db:
        v = await db.get(Video, vid_id)
        if v:
            v.status = "failed"
            v.stage = "error"
            v.error = str(error)
            await db.commit()


async def _run_transcript_safe(
    vid_id: str,
    transcript: str,
    title: str | None,
    domain: str | None,
    extract_pseudocode: bool,
) -> None:
    try:
        await run_transcript_pipeline(
            vid_id,
            transcript,
            title=title,
            domain=domain,
            extract_pseudocode=extract_pseudocode,
        )
    except Exception as e:
        await _mark_background_failed(vid_id, e)


async def _run_uploaded_media_safe(
    vid_id: str,
    path: Path,
    is_video: bool,
    domain: str | None,
    extract_pseudocode: bool,
) -> None:
    try:
        await run_uploaded_media_pipeline(
            vid_id,
            path,
            is_video=is_video,
            domain=domain,
            extract_pseudocode=extract_pseudocode,
        )
    except Exception as e:
        await _mark_background_failed(vid_id, e)


@router.post("/{video_id}/transcript", response_model=VideoSummaryDTO, status_code=202)
async def submit_transcript(
    video_id: str,
    body: TranscriptSubmitRequest,
    background: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Video:
    v = await db.get(Video, video_id)
    if not v:
        raise HTTPException(404, "Video not found")
    if not body.transcript.strip():
        raise HTTPException(400, "transcript is required")
    v.status = "processing"
    v.stage = "queued"
    v.progress = 0.05
    v.error = None
    await db.commit()
    await db.refresh(v)
    background.add_task(
        _run_transcript_safe,
        video_id,
        body.transcript,
        body.title,
        body.domain,
        body.extract_pseudocode,
    )
    return v


@router.post("/{video_id}/upload", response_model=VideoSummaryDTO, status_code=202)
async def upload_analysis_source(
    video_id: str,
    background: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
    domain: str | None = Form(None),
    extract_pseudocode: bool = Form(False),
) -> Video:
    v = await db.get(Video, video_id)
    if not v:
        raise HTTPException(404, "Video not found")

    upload_dir = settings.media_path / video_id / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "upload").suffix
    target = upload_dir / f"source{suffix or '.bin'}"
    data = await file.read()
    if not data:
        raise HTTPException(400, "uploaded file is empty")
    target.write_bytes(data)

    v.status = "processing"
    v.source_type = "upload"
    v.stage = "queued"
    v.progress = 0.05
    v.error = None
    await db.commit()
    await db.refresh(v)

    if _is_transcript_upload(file):
        transcript = data.decode("utf-8", errors="ignore")
        background.add_task(_run_transcript_safe, video_id, transcript, v.title, domain, extract_pseudocode)
    else:
        is_video = (file.content_type or "").lower().startswith("video/") or suffix.lower() in {
            ".mp4",
            ".mov",
            ".mkv",
            ".webm",
        }
        background.add_task(_run_uploaded_media_safe, video_id, target, is_video, domain, extract_pseudocode)
    return v


@router.get("", response_model=list[VideoSummaryDTO])
async def list_videos(db: Annotated[AsyncSession, Depends(get_db)]) -> list[Video]:
    res = await db.execute(select(Video).order_by(desc(Video.created_at)).limit(100))
    return list(res.scalars().all())


@router.get("/{video_id}", response_model=VideoDetailDTO)
async def get_video(video_id: str, db: Annotated[AsyncSession, Depends(get_db)]) -> dict:
    res = await db.execute(
        select(Video)
        .options(
            selectinload(Video.summary),
            selectinload(Video.transcript_segments),
            selectinload(Video.keyframes),
            selectinload(Video.events),
        )
        .where(Video.id == video_id)
    )
    v = res.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Video not found")

    return {
        "id": v.id,
        "source_type": v.source_type,
        "source_url": v.source_url,
        "title": v.title,
        "channel": v.channel,
        "duration_sec": v.duration_sec,
        "thumbnail": v.thumbnail,
        "status": v.status,
        "progress": v.progress,
        "stage": v.stage,
        "error": v.error,
        "tags": v.tags or [],
        "created_at": v.created_at,
        **_upload_required_fields(v),
        "summary": v.summary,
        "transcript": sorted(v.transcript_segments, key=lambda s: s.start),
        "keyframes": sorted(v.keyframes, key=lambda k: k.timestamp),
        "events": sorted(v.events, key=lambda e: e.timestamp),
    }


@router.delete("/{video_id}", status_code=204)
async def delete_video(video_id: str, db: Annotated[AsyncSession, Depends(get_db)]) -> None:
    v = await db.get(Video, video_id)
    if not v:
        raise HTTPException(404, "Video not found")
    await db.delete(v)
    await db.commit()


@router.get("/{video_id}/chat", response_model=list[ChatMessageDTO])
async def chat_history(video_id: str, db: Annotated[AsyncSession, Depends(get_db)]) -> list[ChatMessage]:
    res = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.video_id == video_id)
        .order_by(ChatMessage.created_at)
    )
    return list(res.scalars().all())


@router.post("/{video_id}/chat", response_model=ChatMessageDTO)
async def chat(
    video_id: str,
    body: ChatRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatMessage:
    res = await db.execute(
        select(Video)
        .options(
            selectinload(Video.transcript_segments),
            selectinload(Video.keyframes),
        )
        .where(Video.id == video_id)
    )
    v = res.scalar_one_or_none()
    if not v:
        raise HTTPException(404, "Video not found")

    # save user message
    db.add(ChatMessage(video_id=video_id, role="user", content=body.message, citations=[]))
    await db.commit()

    transcript = [{"start": s.start, "end": s.end, "text": s.text} for s in v.transcript_segments]
    frames = [{"timestamp": k.timestamp, "caption": k.caption or ""} for k in v.keyframes]

    history_res = await db.execute(
        select(ChatMessage).where(ChatMessage.video_id == video_id).order_by(ChatMessage.created_at)
    )
    history = [{"role": m.role, "content": m.content} for m in history_res.scalars().all()]

    answer_text, citations = await qa_svc.answer(
        body.message,
        transcript=transcript,
        frames=frames,
        title=v.title,
        history=history,
    )

    msg = ChatMessage(
        video_id=video_id, role="assistant", content=answer_text, citations=citations
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


# ── Tag CRUD ──────────────────────────────────────────────────────────────


@router.patch("/{video_id}/tags", response_model=VideoSummaryDTO)
async def update_tags(
    video_id: str,
    body: TagsUpdateRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Video:
    v = await db.get(Video, video_id)
    if not v:
        raise HTTPException(404, "Video not found")
    # Sanitise: trim, dedupe (case-insensitive), cap length and count
    seen: set[str] = set()
    cleaned: list[str] = []
    for t in body.tags:
        if not isinstance(t, str):
            continue
        s = t.strip().lower()[:32]
        if not s or s in seen:
            continue
        seen.add(s)
        cleaned.append(s)
        if len(cleaned) >= 12:
            break
    v.tags = cleaned
    await db.commit()
    await db.refresh(v)
    return v


# ── Transcript translation ────────────────────────────────────────────────


@router.post("/{video_id}/translate", response_model=TranslationResponse)
async def translate_transcript(
    video_id: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    lang: str = "ur",
    refresh: bool = False,
) -> TranslationResponse:
    """Translate the video's transcript into `lang`. Caches in the
    `translations` table — returns the cached copy unless ?refresh=true."""
    lang = (lang or "").strip().lower()[:8]
    if not lang:
        raise HTTPException(400, "lang is required")

    v = await db.execute(
        select(Video)
        .options(selectinload(Video.transcript_segments))
        .where(Video.id == video_id)
    )
    video = v.scalar_one_or_none()
    if not video:
        raise HTTPException(404, "Video not found")
    if not video.transcript_segments:
        raise HTTPException(400, "Video has no transcript yet")

    if not refresh:
        cached_q = await db.execute(
            select(Translation)
            .where(Translation.video_id == video_id, Translation.language == lang)
        )
        existing = cached_q.scalar_one_or_none()
        if existing and existing.segments:
            return TranslationResponse(
                language=lang, cached=True, segments=existing.segments
            )

    src_segments = [
        {"start": s.start, "end": s.end, "text": s.text, "speaker": s.speaker}
        for s in sorted(video.transcript_segments, key=lambda s: s.start)
    ]
    translated = await translate_svc.translate_segments(src_segments, target_language=lang)
    payload = translate_svc.to_serialisable(translated)

    # Upsert
    existing_q = await db.execute(
        select(Translation)
        .where(Translation.video_id == video_id, Translation.language == lang)
    )
    existing = existing_q.scalar_one_or_none()
    if existing:
        existing.segments = payload
    else:
        db.add(Translation(video_id=video_id, language=lang, segments=payload))
    await db.commit()

    return TranslationResponse(language=lang, cached=False, segments=payload)
