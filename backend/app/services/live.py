"""Live stream analysis: chunked download → transcribe → vision → rolling summary.

Uses yt-dlp to grab a short live segment at intervals; the same primitives
work for any HLS/HTTP live stream URL.
"""

import asyncio
from datetime import datetime
from pathlib import Path

import yt_dlp
from loguru import logger

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.core.events import bus
from app.models.video import Video, TranscriptSegment, Keyframe, DetectedEvent, Summary
from app.services import frames as frames_svc
from app.services import llm
from app.services import summarize as sum_svc


settings = get_settings()


class LiveSession:
    def __init__(self, video_id: str, url: str, chunk_seconds: int = 30):
        self.video_id = video_id
        self.url = url
        self.chunk_seconds = max(15, min(chunk_seconds, 120))
        self.running = False
        self.task: asyncio.Task | None = None
        self.elapsed = 0.0
        self.rolling = ""

    async def start(self) -> None:
        self.running = True
        self.task = asyncio.create_task(self._loop())

    async def stop(self) -> None:
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        await bus.publish(f"video:{self.video_id}", {"type": "live_stopped"})

    async def _loop(self) -> None:
        media_root = settings.media_path / self.video_id / "live"
        media_root.mkdir(parents=True, exist_ok=True)
        chunk_idx = 0
        while self.running:
            try:
                chunk_path = await self._grab_chunk(media_root, chunk_idx)
                if chunk_path:
                    await self._process_chunk(chunk_path, chunk_idx)
                chunk_idx += 1
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.exception("Live chunk failed")
                await bus.publish(
                    f"video:{self.video_id}",
                    {"type": "live_error", "error": str(e)},
                )
                await asyncio.sleep(5)

    async def _grab_chunk(self, out_dir: Path, idx: int) -> Path | None:
        out_template = str(out_dir / f"chunk_{idx:05d}.%(ext)s")

        def _run() -> Path | None:
            import shutil as _sh
            from app.services.youtube import _ffmpeg_dir
            opts = {
                "format": "bv*[height<=720]+ba/b[height<=720]/bv*+ba/b",
                "outtmpl": out_template,
                "quiet": True,
                "no_warnings": True,
                "live_from_start": False,
                "download_ranges": yt_dlp.utils.download_range_func(None, [(0, self.chunk_seconds)]),
                "force_keyframes_at_cuts": True,
                "merge_output_format": "mp4",
            }
            ff_dir = _ffmpeg_dir()
            if ff_dir:
                opts["ffmpeg_location"] = ff_dir
            try:
                with yt_dlp.YoutubeDL(opts) as ydl:
                    info = ydl.extract_info(self.url, download=True)
                ext = info.get("ext", "mp4")
                p = out_dir / f"chunk_{idx:05d}.{ext}"
                return p if p.exists() else None
            except Exception as e:
                logger.warning(f"yt-dlp live chunk failed: {e}")
                return None

        return await asyncio.to_thread(_run)

    async def _process_chunk(self, chunk_path: Path, idx: int) -> None:
        # 1) frames from this chunk
        frames_dir = chunk_path.parent / f"frames_{idx:05d}"
        frame_records = await frames_svc.extract_keyframes(
            chunk_path, frames_dir, max_frames=2, min_gap_sec=2.0
        )
        for fr in frame_records:
            fr["timestamp"] += self.elapsed
            vis = await llm.vision_caption(Path(fr["image_path"]))
            fr["caption"] = vis.get("caption", "")
            fr["tags"] = vis.get("tags", []) or []

        # 2) transcribe — extract audio with ffmpeg via opencv? Simpler: pass mp4 to whisper directly works.
        segs = await llm.transcribe_audio(chunk_path)
        for s in segs:
            s["start"] += self.elapsed
            s["end"] += self.elapsed

        # 3) rolling summary update
        roll = await sum_svc.rolling_summary(
            prior_summary=self.rolling, new_transcript=segs, new_frames=frame_records
        )
        self.rolling = roll.get("rolling_summary", self.rolling)
        new_events = roll.get("new_events", []) or []

        # 4) persist
        async with SessionLocal() as db:
            for s in segs:
                db.add(TranscriptSegment(
                    video_id=self.video_id, start=s["start"], end=s["end"], text=s["text"]
                ))
            for fr in frame_records:
                try:
                    rel = str(Path(fr["image_path"]).resolve().relative_to(settings.media_path)).replace("\\", "/")
                except ValueError:
                    rel = fr["image_path"]
                db.add(Keyframe(
                    video_id=self.video_id,
                    timestamp=fr["timestamp"],
                    image_path=rel,
                    caption=fr.get("caption"),
                    tags=fr.get("tags") or [],
                ))
            for ev in new_events:
                db.add(DetectedEvent(
                    video_id=self.video_id,
                    timestamp=float(ev.get("timestamp", self.elapsed)),
                    title=ev.get("title", "Event"),
                    description=ev.get("description", ""),
                    severity=ev.get("severity", "info"),
                    category=ev.get("category"),
                ))
            existing = await db.get(Summary, self.video_id)
            if existing:
                existing.overview = self.rolling
            else:
                db.add(Summary(video_id=self.video_id, overview=self.rolling))
            v = await db.get(Video, self.video_id)
            if v:
                v.duration_sec = self.elapsed + self.chunk_seconds
                v.status = "live"
                v.stage = f"live chunk {idx + 1}"
                v.progress = 0.5  # indeterminate
            await db.commit()

        # 5) push event
        await bus.publish(
            f"video:{self.video_id}",
            {
                "type": "live_chunk",
                "chunk": idx,
                "elapsed": self.elapsed + self.chunk_seconds,
                "rolling_summary": self.rolling,
                "new_key_points": roll.get("new_key_points", []) or [],
                "new_events": new_events,
                "ts": datetime.utcnow().isoformat() + "Z",
            },
        )

        self.elapsed += self.chunk_seconds


# session registry
_sessions: dict[str, LiveSession] = {}


def get_session(video_id: str) -> LiveSession | None:
    return _sessions.get(video_id)


def register_session(s: LiveSession) -> None:
    _sessions[s.video_id] = s


def unregister_session(video_id: str) -> None:
    _sessions.pop(video_id, None)
