"""Recorded video analysis routes."""

import asyncio
import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.video import Video, ChatMessage
from app.schemas.video import (
    AnalyzeRequest,
    ChatMessageDTO,
    ChatRequest,
    VideoDetailDTO,
    VideoSummaryDTO,
)
from app.services import qa as qa_svc
from app.services.pipeline import run_youtube_pipeline


router = APIRouter(prefix="/api/videos", tags=["videos"])


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
        "created_at": v.created_at,
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
