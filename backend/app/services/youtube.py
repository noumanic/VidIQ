"""YouTube acquisition: metadata, audio, transcript."""

import asyncio
import re
import shutil
from pathlib import Path
from typing import Any

import yt_dlp
from loguru import logger
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound


YT_ID_RE = re.compile(r"(?:v=|youtu\.be/|/embed/|/shorts/)([\w-]{11})")


def _ffmpeg_dir() -> str | None:
    """Return the directory containing ffmpeg/ffprobe, or None."""
    exe = shutil.which("ffmpeg")
    return str(Path(exe).parent) if exe else None


def extract_video_id(url: str) -> str | None:
    m = YT_ID_RE.search(url)
    return m.group(1) if m else None


async def fetch_metadata(url: str) -> dict[str, Any]:
    def _run() -> dict[str, Any]:
        opts = {"quiet": True, "skip_download": True, "no_warnings": True}
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
        return {
            "title": info.get("title"),
            "channel": info.get("uploader") or info.get("channel"),
            "duration_sec": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "is_live": info.get("is_live", False),
            "webpage_url": info.get("webpage_url", url),
        }

    return await asyncio.to_thread(_run)


async def download_audio(url: str, out_dir: Path) -> Path:
    """Download just the audio. Whisper handles m4a/webm/mp3 natively, so we
    skip the FFmpegExtractAudio postprocessor unless explicitly asked."""
    out_dir.mkdir(parents=True, exist_ok=True)
    out_template = str(out_dir / "%(id)s.%(ext)s")

    def _run() -> Path:
        opts = {
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "quiet": True,
            "no_warnings": True,
        }
        ff_dir = _ffmpeg_dir()
        if ff_dir:
            opts["ffmpeg_location"] = ff_dir
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            vid = info["id"]
            for p in out_dir.glob(f"{vid}.*"):
                if p.suffix.lower() in {".m4a", ".webm", ".mp3", ".opus", ".mp4", ".aac", ".ogg"}:
                    return p
            ext = info.get("ext", "m4a")
            return out_dir / f"{vid}.{ext}"

    return await asyncio.to_thread(_run)


async def download_video(url: str, out_dir: Path) -> Path:
    """Download the video for frame extraction.

    Uses yt-dlp's modern `bv*+ba/b` selector which:
      • Prefers best video + best audio (merged via ffmpeg)
      • Falls back to best pre-merged stream
      • Caps to ≤720p to keep frames lightweight
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    out_template = str(out_dir / "%(id)s.%(ext)s")

    def _run() -> Path:
        opts = {
            "format": "bv*[height<=720]+ba/b[height<=720]/bv*+ba/b",
            "outtmpl": out_template,
            "quiet": True,
            "no_warnings": True,
            "merge_output_format": "mp4",
        }
        ff_dir = _ffmpeg_dir()
        if ff_dir:
            opts["ffmpeg_location"] = ff_dir
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=True)
            vid = info["id"]
            for p in out_dir.glob(f"{vid}.*"):
                if p.suffix.lower() in {".mp4", ".mkv", ".webm"}:
                    return p
            ext = info.get("ext", "mp4")
            return out_dir / f"{vid}.{ext}"

    return await asyncio.to_thread(_run)


async def fetch_youtube_transcript(url: str) -> list[dict[str, Any]] | None:
    """Try YouTube's native transcript first — much faster than Whisper."""
    vid = extract_video_id(url)
    if not vid:
        return None

    def _run() -> list[dict[str, Any]] | None:
        try:
            entries = YouTubeTranscriptApi.get_transcript(vid, languages=["en", "en-US"])
        except (TranscriptsDisabled, NoTranscriptFound):
            try:
                entries = YouTubeTranscriptApi.get_transcript(vid)
            except Exception as e:
                logger.info(f"No youtube transcript for {vid}: {e}")
                return None
        except Exception as e:
            logger.info(f"Transcript fetch failed for {vid}: {e}")
            return None
        return [
            {"start": float(e["start"]), "end": float(e["start"]) + float(e.get("duration", 0)), "text": e["text"]}
            for e in entries
        ]

    return await asyncio.to_thread(_run)
