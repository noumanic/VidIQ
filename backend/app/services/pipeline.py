"""End-to-end pipeline orchestration for recorded video analysis."""

import asyncio
from datetime import datetime
from pathlib import Path

from loguru import logger
from sqlalchemy import delete

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.events import bus
from app.models.video import (
    Video,
    Summary,
    TranscriptSegment,
    Keyframe,
    DetectedEvent,
)
from app.services import frames as frames_svc
from app.services import llm
from app.services import summarize as sum_svc
from app.services import youtube as yt_svc


settings = get_settings()


def _rel_media(p: str | Path) -> str:
    """Return path relative to MEDIA_DIR, with forward slashes for the URL layer."""
    try:
        rel = Path(p).resolve().relative_to(settings.media_path)
    except ValueError:
        rel = Path(p)
    return str(rel).replace("\\", "/")


async def _emit(video_id: str, *, stage: str, progress: float, message: str = "") -> None:
    payload = {
        "video_id": video_id,
        "stage": stage,
        "progress": round(progress, 3),
        "message": message,
        "ts": datetime.utcnow().isoformat() + "Z",
    }
    async with SessionLocal() as db:
        v = await db.get(Video, video_id)
        if v:
            v.stage = stage
            v.progress = progress
            await db.commit()
    await bus.publish(f"video:{video_id}", payload)


async def run_youtube_pipeline(
    video_id: str, url: str, *, domain: str | None = None, extract_pseudocode: bool = False
) -> None:
    media_root = settings.media_path / video_id
    media_root.mkdir(parents=True, exist_ok=True)

    try:
        await _emit(video_id, stage="metadata", progress=0.05, message="Fetching video metadata")
        meta = await yt_svc.fetch_metadata(url)

        async with SessionLocal() as db:
            v = await db.get(Video, video_id)
            if v:
                v.title = meta.get("title")
                v.channel = meta.get("channel")
                v.duration_sec = meta.get("duration_sec")
                v.thumbnail = meta.get("thumbnail")
                await db.commit()

        # 1. Transcript: try YouTube native first, then Whisper fallback
        await _emit(video_id, stage="transcript", progress=0.15, message="Fetching transcript")
        segments = await yt_svc.fetch_youtube_transcript(url)

        audio_path: Path | None = None
        if not segments:
            try:
                await _emit(video_id, stage="audio", progress=0.20, message="Downloading audio")
                audio_path = await yt_svc.download_audio(url, media_root / "audio")
                await _emit(video_id, stage="transcribe", progress=0.30, message="Transcribing audio (Whisper)")
                segments = await llm.transcribe_audio(audio_path)
            except Exception as e:
                logger.warning(f"Audio fallback failed: {e}")
                segments = []

        if not segments:
            # Last resort: continue with metadata-only analysis so the user gets
            # at least frames + a partial summary instead of a hard failure.
            segments = [{
                "start": 0.0, "end": 0.0,
                "text": f"(No spoken transcript available for this video. "
                        f"Title: {meta.get('title') or 'unknown'}.)"
            }]

        async with SessionLocal() as db:
            await db.execute(delete(TranscriptSegment).where(TranscriptSegment.video_id == video_id))
            for s in segments:
                db.add(TranscriptSegment(
                    video_id=video_id, start=s["start"], end=s["end"], text=s["text"]
                ))
            await db.commit()

        # 2. Video download for frames (use lowest reasonable quality if not already)
        await _emit(video_id, stage="frames-download", progress=0.45, message="Downloading video for frame analysis")
        try:
            video_path = await yt_svc.download_video(url, media_root / "video")
        except Exception as e:
            logger.warning(f"Video download failed, skipping frame extraction: {e}")
            video_path = None

        frame_records: list[dict] = []
        if video_path and video_path.exists():
            await _emit(video_id, stage="keyframes", progress=0.55, message="Extracting keyframes")
            frame_records = await frames_svc.extract_keyframes(
                video_path, media_root / "frames", max_frames=10
            )
            await _emit(video_id, stage="vision", progress=0.70, message="Analyzing keyframes (vision)")
            for i, fr in enumerate(frame_records):
                vis = await llm.vision_caption(Path(fr["image_path"]), hint=meta.get("title", ""))
                fr["caption"] = vis.get("caption", "")
                fr["tags"] = vis.get("tags", []) or []
                fr["event"] = vis.get("event")
                await _emit(
                    video_id,
                    stage="vision",
                    progress=0.70 + 0.10 * (i + 1) / max(len(frame_records), 1),
                    message=f"Analyzing frame {i+1}/{len(frame_records)}",
                )

        async with SessionLocal() as db:
            await db.execute(delete(Keyframe).where(Keyframe.video_id == video_id))
            for fr in frame_records:
                db.add(Keyframe(
                    video_id=video_id,
                    timestamp=fr["timestamp"],
                    image_path=_rel_media(fr["image_path"]),
                    caption=fr.get("caption"),
                    tags=fr.get("tags") or [],
                ))
            await db.commit()

        # 3. Multimodal summarization
        await _emit(video_id, stage="summarize", progress=0.85, message="Generating summary & insights")
        result = await sum_svc.summarize_video(
            title=meta.get("title"),
            duration=meta.get("duration_sec"),
            transcript=segments,
            frame_analyses=frame_records,
            domain=domain,
            extract_pseudocode=extract_pseudocode,
        )

        async with SessionLocal() as db:
            existing = await db.get(Summary, video_id)
            if existing:
                await db.delete(existing)
                await db.commit()
            db.add(Summary(
                video_id=video_id,
                overview=result.get("overview", ""),
                key_points=result.get("key_points", []) or [],
                topics=result.get("topics", []) or [],
                chapters=result.get("chapters", []) or [],
                sentiment=result.get("sentiment"),
                pseudocode=result.get("pseudocode"),
            ))
            await db.execute(delete(DetectedEvent).where(DetectedEvent.video_id == video_id))
            for ev in result.get("events", []) or []:
                db.add(DetectedEvent(
                    video_id=video_id,
                    timestamp=float(ev.get("timestamp", 0)),
                    title=ev.get("title", "Event"),
                    description=ev.get("description", ""),
                    severity=ev.get("severity", "info"),
                    category=ev.get("category"),
                ))
            # also surface vision-detected events
            for fr in frame_records:
                ev = fr.get("event")
                if ev:
                    db.add(DetectedEvent(
                        video_id=video_id,
                        timestamp=float(fr["timestamp"]),
                        title=ev.get("title", "Visual event"),
                        description=ev.get("description", ""),
                        severity=ev.get("severity", "info"),
                        category="visual",
                    ))
            await db.commit()

        async with SessionLocal() as db:
            v = await db.get(Video, video_id)
            if v:
                v.status = "completed"
                v.progress = 1.0
                v.stage = "done"
                await db.commit()

        await _emit(video_id, stage="done", progress=1.0, message="Analysis complete")
        await bus.publish(f"video:{video_id}", {"video_id": video_id, "type": "completed"})

    except Exception as e:
        logger.exception(f"Pipeline failed for {video_id}")
        async with SessionLocal() as db:
            v = await db.get(Video, video_id)
            if v:
                v.status = "failed"
                v.error = str(e)
                v.stage = "error"
                await db.commit()
        await bus.publish(
            f"video:{video_id}",
            {"video_id": video_id, "type": "error", "error": str(e)},
        )
