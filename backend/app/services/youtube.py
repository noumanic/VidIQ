"""YouTube acquisition: metadata, audio, transcript."""

import asyncio
import json
import re
import shutil
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import httpx
import yt_dlp
from loguru import logger
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
from app.core.config import get_settings
from app.services.youtube_policy import (
    YouTubeBlockedError,
    assert_audio_download_allowed,
    assert_media_download_allowed,
    is_youtube_block_error,
)


YT_ID_RE = re.compile(r"(?:v=|youtu\.be/|/embed/|/shorts/)([\w-]{11})")


class YouTubeAccessError(YouTubeBlockedError):
    """Backward-compatible alias for user-facing YouTube extraction failures."""


def hardened_ytdlp_opts(**overrides: Any) -> dict[str, Any]:
    """Default yt-dlp options for hosted extraction.

    These do not use browser cookies because the deployed backend has no
    logged-in browser. They make public-video extraction more resilient and
    keep failures bounded when YouTube rate-limits or closes TLS connections.
    """
    opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "retries": 5,
        "fragment_retries": 5,
        "extractor_retries": 5,
        "socket_timeout": 30,
        "force_ipv4": True,
        "geo_bypass": True,
        "extractor_args": {
            "youtube": {
                "player_client": ["android", "web", "mweb"],
            },
        },
        "http_headers": {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/125.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        },
    }
    settings = get_settings()
    cookie_file = (settings.YTDLP_COOKIE_FILE or "").strip()
    if cookie_file:
        opts["cookiefile"] = cookie_file

    cookies_from_browser = (settings.YTDLP_COOKIES_FROM_BROWSER or "").strip()
    if cookies_from_browser:
        browser, _, profile = cookies_from_browser.partition(":")
        opts["cookiesfrombrowser"] = (
            (browser.strip(), profile.strip()) if profile.strip() else (browser.strip(),)
        )

    opts.update(overrides)
    return opts


def _friendly_ytdlp_error(exc: Exception) -> YouTubeAccessError:
    raw = str(exc)
    low = raw.lower()
    if "sign in to confirm" in low or "not a bot" in low:
        msg = (
            "YouTube blocked automated access for this video. Try another public "
            "video, or run the backend locally with browser cookies for videos "
            "that require a signed-in YouTube session."
        )
    elif "ssl" in low or "unexpected_eof_while_reading" in low or "eof occurred" in low:
        msg = (
            "YouTube closed the network connection while fetching this video. "
            "This is usually transient rate limiting or host blocking; try again "
            "later or use another video."
        )
    else:
        msg = f"YouTube extraction failed: {raw}"
    if is_youtube_block_error(raw):
        return YouTubeBlockedError(msg)
    return YouTubeAccessError(msg)


def _is_browser_cookie_copy_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return (
        ("could not copy" in text and "cookie database" in text)
        or ("failed to decrypt with dpapi" in text)
    )


def _drop_cookie_options(opts: dict[str, Any]) -> dict[str, Any]:
    fallback = dict(opts)
    fallback.pop("cookiesfrombrowser", None)
    fallback.pop("cookiefile", None)
    return fallback


def _extract_with_ytdlp(url: str, opts: dict[str, Any], *, download: bool) -> dict[str, Any]:
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            return ydl.extract_info(url, download=download)
    except Exception as exc:
        if _is_browser_cookie_copy_error(exc) and (
            opts.get("cookiesfrombrowser") or opts.get("cookiefile")
        ):
            logger.warning(f"yt-dlp cookie extraction failed; retrying without cookies: {exc}")
            try:
                with yt_dlp.YoutubeDL(_drop_cookie_options(opts)) as ydl:
                    return ydl.extract_info(url, download=download)
            except Exception as retry_exc:
                raise _friendly_ytdlp_error(retry_exc) from retry_exc
        raise _friendly_ytdlp_error(exc) from exc


def _ffmpeg_dir() -> str | None:
    """Return the directory containing ffmpeg/ffprobe, or None."""
    exe = shutil.which("ffmpeg")
    return str(Path(exe).parent) if exe else None


def extract_video_id(url: str) -> str | None:
    m = YT_ID_RE.search(url)
    return m.group(1) if m else None


async def fetch_metadata(url: str) -> dict[str, Any]:
    def _run() -> dict[str, Any]:
        opts = hardened_ytdlp_opts(skip_download=True, ignore_no_formats_error=True)
        info = _extract_with_ytdlp(url, opts, download=False)
        return {
            "title": info.get("title"),
            "channel": info.get("uploader") or info.get("channel"),
            "duration_sec": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "is_live": info.get("is_live", False),
            "webpage_url": info.get("webpage_url", url),
        }

    return await asyncio.to_thread(_run)


async def fetch_limited_metadata(url: str) -> dict[str, Any]:
    def _run() -> dict[str, Any]:
        opts = hardened_ytdlp_opts(
            skip_download=True,
            ignore_no_formats_error=True,
            retries=1,
            fragment_retries=1,
            extractor_retries=1,
            socket_timeout=8,
        )
        info = _extract_with_ytdlp(url, opts, download=False)
        return {
            "title": info.get("title"),
            "channel": info.get("uploader") or info.get("channel"),
            "duration_sec": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "is_live": info.get("is_live", False),
            "webpage_url": info.get("webpage_url", url),
        }

    return await asyncio.to_thread(_run)


async def fetch_oembed_metadata(url: str) -> dict[str, Any]:
    api = "https://www.youtube.com/oembed"
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        r = await client.get(api, params={"url": url, "format": "json"})
        r.raise_for_status()
        data = r.json()
    return {
        "title": data.get("title"),
        "channel": data.get("author_name"),
        "duration_sec": None,
        "thumbnail": data.get("thumbnail_url"),
        "is_live": False,
        "webpage_url": url,
    }


async def download_audio(url: str, out_dir: Path) -> Path:
    """Download just the audio. Whisper handles m4a/webm/mp3 natively, so we
    skip the FFmpegExtractAudio postprocessor unless explicitly asked."""
    assert_audio_download_allowed()
    out_dir.mkdir(parents=True, exist_ok=True)
    out_template = str(out_dir / "%(id)s.%(ext)s")

    def _run() -> Path:
        opts = hardened_ytdlp_opts(
            format="bestaudio/best",
            outtmpl=out_template,
        )
        ff_dir = _ffmpeg_dir()
        if ff_dir:
            opts["ffmpeg_location"] = ff_dir
        info = _extract_with_ytdlp(url, opts, download=True)
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
    assert_media_download_allowed()
    out_dir.mkdir(parents=True, exist_ok=True)
    out_template = str(out_dir / "%(id)s.%(ext)s")

    def _run() -> Path:
        opts = hardened_ytdlp_opts(
            format="bv*[height<=720]+ba/b[height<=720]/bv*+ba/b",
            outtmpl=out_template,
            merge_output_format="mp4",
        )
        ff_dir = _ffmpeg_dir()
        if ff_dir:
            opts["ffmpeg_location"] = ff_dir
        info = _extract_with_ytdlp(url, opts, download=True)
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


def _caption_track_priority(track: dict[str, Any]) -> tuple[int, int]:
    ext = (track.get("ext") or "").lower()
    name = (track.get("name") or "").lower()
    ext_rank = {"json3": 0, "vtt": 1, "srv3": 2, "ttml": 3}.get(ext, 9)
    name_rank = 0 if "default" in name else 1
    return (ext_rank, name_rank)


def _choose_caption_track(info: dict[str, Any]) -> dict[str, Any] | None:
    pools = [
        info.get("subtitles") or {},
        info.get("automatic_captions") or {},
    ]
    language_order = ("en", "en-US", "en-GB")
    for pool in pools:
        for lang in language_order:
            tracks = pool.get(lang)
            if tracks:
                return sorted(tracks, key=_caption_track_priority)[0]
        for lang, tracks in pool.items():
            if str(lang).lower().startswith("en") and tracks:
                return sorted(tracks, key=_caption_track_priority)[0]
    return None


def _clean_caption_text(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _parse_json3_captions(raw: str) -> list[dict[str, Any]]:
    data = json.loads(raw)
    segments: list[dict[str, Any]] = []
    for event in data.get("events", []):
        parts = event.get("segs") or []
        text = _clean_caption_text("".join(str(part.get("utf8", "")) for part in parts))
        if not text:
            continue
        start = float(event.get("tStartMs", 0)) / 1000.0
        duration = float(event.get("dDurationMs", 0)) / 1000.0
        segments.append({"start": start, "end": start + duration, "text": text})
    return segments


def _parse_vtt_timestamp(value: str) -> float:
    value = value.strip().replace(",", ".")
    pieces = value.split(":")
    seconds = float(pieces[-1])
    minutes = int(pieces[-2]) if len(pieces) >= 2 else 0
    hours = int(pieces[-3]) if len(pieces) >= 3 else 0
    return hours * 3600 + minutes * 60 + seconds


def _parse_vtt_captions(raw: str) -> list[dict[str, Any]]:
    segments: list[dict[str, Any]] = []
    lines = raw.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if "-->" not in line:
            i += 1
            continue
        start_raw, end_raw = line.split("-->", 1)
        end_raw = end_raw.strip().split(" ", 1)[0]
        start = _parse_vtt_timestamp(start_raw)
        end = _parse_vtt_timestamp(end_raw)
        i += 1
        text_lines: list[str] = []
        while i < len(lines) and lines[i].strip():
            text_lines.append(lines[i].strip())
            i += 1
        text = _clean_caption_text(" ".join(text_lines))
        if text:
            segments.append({"start": start, "end": end, "text": text})
        i += 1
    return segments


def _parse_xml_captions(raw: str) -> list[dict[str, Any]]:
    root = ET.fromstring(raw)
    segments: list[dict[str, Any]] = []
    for node in root.findall(".//text"):
        text = _clean_caption_text("".join(node.itertext()))
        if not text:
            continue
        start = float(node.attrib.get("start", 0))
        duration = float(node.attrib.get("dur", 0))
        segments.append({"start": start, "end": start + duration, "text": text})
    return segments


def _pick_timedtext_track(raw: str) -> dict[str, str] | None:
    root = ET.fromstring(raw)
    tracks: list[dict[str, str]] = []
    for node in root.findall(".//track"):
        attrs = {str(k): str(v) for k, v in node.attrib.items()}
        if attrs.get("lang_code"):
            tracks.append(attrs)
    if not tracks:
        return None
    for lang in ("en", "en-US", "en-GB"):
        for track in tracks:
            if track.get("lang_code") == lang:
                return track
    for track in tracks:
        if track.get("lang_code", "").lower().startswith("en"):
            return track
    return tracks[0]


async def fetch_timedtext_caption_transcript(url: str) -> list[dict[str, Any]] | None:
    """Fetch public captions through YouTube's timedtext endpoint."""
    vid = extract_video_id(url)
    if not vid:
        return None

    headers = hardened_ytdlp_opts().get("http_headers", {})
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True, headers=headers) as client:
        track_list = await client.get(
            "https://www.youtube.com/api/timedtext",
            params={"type": "list", "v": vid},
        )
        track_list.raise_for_status()
        track = _pick_timedtext_track(track_list.text)
        if not track:
            return None

        base_params = {"v": vid, "lang": track["lang_code"]}
        if track.get("kind"):
            base_params["kind"] = track["kind"]
        if track.get("name"):
            base_params["name"] = track["name"]

        for fmt, parser in (
            ("json3", _parse_json3_captions),
            ("vtt", _parse_vtt_captions),
            ("", _parse_xml_captions),
        ):
            params = dict(base_params)
            if fmt:
                params["fmt"] = fmt
            try:
                response = await client.get("https://www.youtube.com/api/timedtext", params=params)
                response.raise_for_status()
                segments = parser(response.text)
                if segments:
                    return segments
            except Exception as exc:
                logger.info(f"Timedtext caption fetch failed ({fmt or 'xml'}): {exc}")
    return None


async def fetch_ytdlp_caption_transcript(url: str) -> list[dict[str, Any]] | None:
    """Fetch public subtitle/auto-caption tracks through yt-dlp metadata."""

    def _get_caption_track() -> dict[str, Any] | None:
        opts = hardened_ytdlp_opts(
            skip_download=True,
            ignore_no_formats_error=True,
            writesubtitles=True,
            writeautomaticsub=True,
            subtitleslangs=["en", "en.*"],
            retries=1,
            fragment_retries=1,
            extractor_retries=1,
            socket_timeout=8,
        )
        info = _extract_with_ytdlp(url, opts, download=False)
        return _choose_caption_track(info)

    try:
        track = await asyncio.wait_for(asyncio.to_thread(_get_caption_track), timeout=25.0)
    except asyncio.TimeoutError:
        logger.info("Timed out while fetching yt-dlp caption metadata")
        return None
    if not track or not track.get("url"):
        return None

    headers = hardened_ytdlp_opts().get("http_headers", {})
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=headers) as client:
        response = await client.get(track["url"])
        response.raise_for_status()
        raw = response.text

    ext = (track.get("ext") or "").lower()
    try:
        segments = _parse_json3_captions(raw) if ext == "json3" else _parse_vtt_captions(raw)
    except Exception as exc:
        logger.info(f"Failed to parse yt-dlp caption track ({ext}): {exc}")
        return None
    return segments or None
