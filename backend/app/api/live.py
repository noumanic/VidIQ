"""Live stream analysis routes."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.video import Video
from app.schemas.video import LiveStartRequest, VideoSummaryDTO
from app.services import live as live_svc
from app.services import youtube as yt_svc


router = APIRouter(prefix="/api/live", tags=["live"])


@router.post("", response_model=VideoSummaryDTO, status_code=201)
async def start_live(
    body: LiveStartRequest, db: Annotated[AsyncSession, Depends(get_db)]
) -> Video:
    if not body.url:
        raise HTTPException(400, "url is required")

    vid_id = "live_" + uuid.uuid4().hex[:10]
    try:
        meta = await yt_svc.fetch_metadata(body.url)
    except Exception:
        meta = {}

    v = Video(
        id=vid_id,
        source_type="live",
        source_url=body.url,
        title=meta.get("title") or "Live stream",
        channel=meta.get("channel"),
        thumbnail=meta.get("thumbnail"),
        status="live",
        progress=0.0,
        stage="starting",
    )
    db.add(v)
    await db.commit()
    await db.refresh(v)

    session = live_svc.LiveSession(vid_id, body.url, body.chunk_seconds)
    live_svc.register_session(session)
    await session.start()
    return v


@router.post("/{video_id}/stop", status_code=204)
async def stop_live(video_id: str, db: Annotated[AsyncSession, Depends(get_db)]) -> None:
    session = live_svc.get_session(video_id)
    if session is None:
        raise HTTPException(404, "No active live session")
    await session.stop()
    live_svc.unregister_session(video_id)

    v = await db.get(Video, video_id)
    if v:
        v.status = "completed"
        v.stage = "stopped"
        v.progress = 1.0
        await db.commit()
