"""End-to-end pipeline orchestration for recorded video analysis."""

import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any

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
from app.services.youtube_policy import (
    YouTubeBlockedError,
    YouTubeMediaDownloadDisabled,
    is_audio_download_disabled,
    is_safe_mode,
    is_video_download_disabled,
    is_youtube_block_error,
)


settings = get_settings()

UPLOAD_REQUIRED_MESSAGE = (
    "YouTube blocked automated access. For local full analysis, make sure browser "
    "cookies are available to yt-dlp, paste a transcript, upload a transcript file, "
    "upload audio/video, or try another public video with available captions."
)
UPLOAD_ACTIONS = ["paste_transcript", "upload_transcript", "upload_audio", "upload_video"]


def _rel_media(p: str | Path) -> str:
    """Return path relative to MEDIA_DIR, with forward slashes for the URL layer."""
    try:
        rel = Path(p).resolve().relative_to(settings.media_path)
    except ValueError:
        rel = Path(p)
    return str(rel).replace("\\", "/")


def _fallback_metadata(url: str) -> dict[str, Any]:
    yt_id = yt_svc.extract_video_id(url)
    return {
        "title": f"YouTube video {yt_id}" if yt_id else "YouTube video",
        "channel": None,
        "duration_sec": None,
        "thumbnail": f"https://i.ytimg.com/vi/{yt_id}/hqdefault.jpg" if yt_id else None,
        "is_live": False,
        "webpage_url": url,
    }


async def _mark_needs_upload(
    video_id: str,
    *,
    meta: dict[str, Any],
    reason: str,
) -> None:
    async with SessionLocal() as db:
        v = await db.get(Video, video_id)
        if v:
            v.title = meta.get("title")
            v.channel = meta.get("channel")
            v.duration_sec = meta.get("duration_sec")
            v.thumbnail = meta.get("thumbnail")
            v.status = "needs_upload"
            v.progress = 1.0
            v.stage = "needs_upload"
            v.error = f"{reason}: {UPLOAD_REQUIRED_MESSAGE}"
            await db.commit()
    await bus.publish(
        f"video:{video_id}",
        {
            "video_id": video_id,
            "type": "needs_upload",
            "status": "needs_upload",
            "reason": reason,
            "message": UPLOAD_REQUIRED_MESSAGE,
            "available_actions": UPLOAD_ACTIONS,
        },
    )


def _write_summary(summary: Summary, result: dict) -> None:
    summary.overview = result.get("overview", "")
    summary.key_points = result.get("key_points", []) or []
    summary.topics = result.get("topics", []) or []
    summary.chapters = result.get("chapters", []) or []
    summary.sentiment = result.get("sentiment")
    summary.pseudocode = result.get("pseudocode")
    summary.action_items = result.get("action_items", []) or []
    summary.questions = result.get("questions", []) or []


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
        safe_mode = is_safe_mode()
        audio_disabled = is_audio_download_disabled()
        video_disabled = is_video_download_disabled()
        if safe_mode:
            await _mark_needs_upload(
                video_id,
                meta=_fallback_metadata(url),
                reason="youtube_safe_mode_enabled",
            )
            return
        try:
            meta = await yt_svc.fetch_oembed_metadata(url)
        except Exception as e:
            if is_youtube_block_error(e) and safe_mode:
                await _mark_needs_upload(
                    video_id,
                    meta=_fallback_metadata(url),
                    reason="youtube_metadata_blocked",
                )
                return
            logger.info(f"oEmbed metadata failed, trying metadata-only yt-dlp fallback: {e}")
            try:
                meta = await yt_svc.fetch_limited_metadata(url) if safe_mode else await yt_svc.fetch_metadata(url)
            except Exception as fallback_error:
                if is_youtube_block_error(fallback_error) and safe_mode:
                    await _mark_needs_upload(
                        video_id,
                        meta=_fallback_metadata(url),
                        reason="youtube_metadata_blocked",
                    )
                    return
                logger.warning(f"Metadata fallback failed, using URL-only metadata: {fallback_error}")
                meta = _fallback_metadata(url)

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
        try:
            segments = await yt_svc.fetch_youtube_transcript(url)
        except Exception as e:
            if is_youtube_block_error(e) and safe_mode:
                await _mark_needs_upload(
                    video_id,
                    meta=meta,
                    reason="youtube_transcript_blocked",
                )
                return
            logger.info(f"Transcript fetch failed: {e}")
            segments = None

        if not segments:
            await _emit(video_id, stage="captions", progress=0.18, message="Checking public caption tracks")
            try:
                segments = await yt_svc.fetch_ytdlp_caption_transcript(url)
            except Exception as e:
                if is_youtube_block_error(e) and safe_mode:
                    await _mark_needs_upload(
                        video_id,
                        meta=meta,
                        reason="youtube_captions_blocked",
                    )
                    return
                logger.info(f"Caption track fetch failed: {e}")
                segments = None

        if not segments:
            await _emit(video_id, stage="timedtext", progress=0.19, message="Checking timedtext captions")
            try:
                segments = await yt_svc.fetch_timedtext_caption_transcript(url)
            except Exception as e:
                if is_youtube_block_error(e) and safe_mode:
                    await _mark_needs_upload(
                        video_id,
                        meta=meta,
                        reason="youtube_timedtext_blocked",
                    )
                    return
                logger.info(f"Timedtext caption fetch failed: {e}")
                segments = None

        audio_path: Path | None = None
        if not segments:
            if audio_disabled:
                logger.info("No transcript/caption segments found and audio download is disabled")
                segments = []
            else:
                try:
                    await _emit(video_id, stage="audio", progress=0.20, message="Downloading audio")
                    audio_path = await yt_svc.download_audio(url, media_root / "audio")
                    await _emit(video_id, stage="transcribe", progress=0.30, message="Transcribing audio (Whisper)")
                    segments = await llm.transcribe_audio(audio_path)
                except (YouTubeBlockedError, YouTubeMediaDownloadDisabled) as e:
                    logger.warning(f"Audio fallback unavailable, continuing metadata-only: {e}")
                    segments = []
                except Exception as e:
                    if is_youtube_block_error(e):
                        logger.warning(f"Audio fallback blocked, continuing metadata-only: {e}")
                        segments = []
                    else:
                        logger.warning(f"Audio fallback failed: {e}")
                        segments = []

        if not segments:
            # Last resort: continue with metadata-only analysis so the user gets
            # at least frames + a partial summary instead of a hard failure.
            segments = [{
                "start": 0.0, "end": 0.0,
                "text": f"(No spoken transcript available for this video. "
                        f"Title: {meta.get('title') or 'unknown'}. "
                        f"Automated YouTube access may have been blocked.)"
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
        if video_disabled:
            video_path = None
        else:
            try:
                video_path = await yt_svc.download_video(url, media_root / "video")
            except (YouTubeBlockedError, YouTubeMediaDownloadDisabled) as e:
                logger.warning(f"Video download blocked/disabled, skipping frame extraction: {e}")
                video_path = None
            except Exception as e:
                if is_youtube_block_error(e):
                    logger.warning(f"Video download blocked, skipping frame extraction: {e}")
                    video_path = None
                else:
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
                _write_summary(existing, result)
            else:
                summary = Summary(video_id=video_id, overview="")
                _write_summary(summary, result)
                db.add(summary)
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


def _segments_from_text(text: str) -> list[dict]:
    segments: list[dict] = []
    idx = 0
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.isdigit() or "-->" in line:
            continue
        start = float(idx * 5)
        segments.append({"start": start, "end": start + 5.0, "text": line})
        idx += 1
    if not segments and text.strip():
        segments.append({"start": 0.0, "end": 5.0, "text": text.strip()})
    return segments


async def run_transcript_pipeline(
    video_id: str,
    transcript_text: str,
    *,
    title: str | None = None,
    domain: str | None = None,
    extract_pseudocode: bool = False,
) -> None:
    segments = _segments_from_text(transcript_text)
    if not segments:
        raise ValueError("Transcript is empty")

    async with SessionLocal() as db:
        v = await db.get(Video, video_id)
        if v:
            v.status = "processing"
            v.stage = "summarize"
            v.progress = 0.70
            v.error = None
            if title:
                v.title = title
            await db.execute(delete(TranscriptSegment).where(TranscriptSegment.video_id == video_id))
            for s in segments:
                db.add(TranscriptSegment(video_id=video_id, start=s["start"], end=s["end"], text=s["text"]))
            await db.commit()

    result = await sum_svc.summarize_video(
        title=title,
        duration=segments[-1]["end"] if segments else None,
        transcript=segments,
        frame_analyses=[],
        domain=domain,
        extract_pseudocode=extract_pseudocode,
    )

    async with SessionLocal() as db:
        existing = await db.get(Summary, video_id)
        if existing:
            _write_summary(existing, result)
        else:
            summary = Summary(video_id=video_id, overview="")
            _write_summary(summary, result)
            db.add(summary)
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
        v = await db.get(Video, video_id)
        if v:
            v.status = "completed"
            v.progress = 1.0
            v.stage = "done"
        await db.commit()

    await bus.publish(f"video:{video_id}", {"video_id": video_id, "type": "completed"})


async def run_uploaded_media_pipeline(
    video_id: str,
    media_path: Path,
    *,
    is_video: bool,
    domain: str | None = None,
    extract_pseudocode: bool = False,
) -> None:
    await _emit(video_id, stage="transcribe", progress=0.25, message="Transcribing uploaded media")
    segments = await llm.transcribe_audio(media_path)

    frame_records: list[dict] = []
    if is_video:
        await _emit(video_id, stage="keyframes", progress=0.45, message="Extracting uploaded video keyframes")
        frame_records = await frames_svc.extract_keyframes(
            media_path,
            settings.media_path / video_id / "uploaded_frames",
            max_frames=10,
        )
        await _emit(video_id, stage="vision", progress=0.65, message="Analyzing uploaded video frames")
        for fr in frame_records:
            vis = await llm.vision_caption(Path(fr["image_path"]))
            fr["caption"] = vis.get("caption", "")
            fr["tags"] = vis.get("tags", []) or []

    async with SessionLocal() as db:
        await db.execute(delete(TranscriptSegment).where(TranscriptSegment.video_id == video_id))
        for s in segments:
            db.add(TranscriptSegment(video_id=video_id, start=s["start"], end=s["end"], text=s["text"]))
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

    await _emit(video_id, stage="summarize", progress=0.85, message="Summarizing uploaded media")
    result = await sum_svc.summarize_video(
        title=None,
        duration=segments[-1]["end"] if segments else None,
        transcript=segments,
        frame_analyses=frame_records,
        domain=domain,
        extract_pseudocode=extract_pseudocode,
    )
    async with SessionLocal() as db:
        existing = await db.get(Summary, video_id)
        if existing:
            _write_summary(existing, result)
        else:
            summary = Summary(video_id=video_id, overview="")
            _write_summary(summary, result)
            db.add(summary)
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
        v = await db.get(Video, video_id)
        if v:
            v.status = "completed"
            v.progress = 1.0
            v.stage = "done"
            v.error = None
        await db.commit()
    await bus.publish(f"video:{video_id}", {"video_id": video_id, "type": "completed"})
