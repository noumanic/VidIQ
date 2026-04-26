"""Make portable ffmpeg + ffprobe available to yt-dlp / faster-whisper / OpenCV.

Tries in order:
  1. System-installed ffmpeg (already on PATH)
  2. `static-ffmpeg` package — bundles BOTH ffmpeg AND ffprobe (preferred)
  3. `imageio-ffmpeg` package — bundles only ffmpeg (fallback)

yt-dlp specifically needs ffprobe to merge DASH streams, so static-ffmpeg
is the right choice on most installs.
"""

import os
import shutil
from pathlib import Path

from loguru import logger


def ensure_ffmpeg_on_path() -> str | None:
    if shutil.which("ffmpeg") and shutil.which("ffprobe"):
        logger.info(f"Using system ffmpeg: {shutil.which('ffmpeg')}")
        return shutil.which("ffmpeg")

    # 1) static-ffmpeg (downloads ffmpeg + ffprobe on first call)
    try:
        from static_ffmpeg import add_paths
        add_paths()
        if shutil.which("ffmpeg") and shutil.which("ffprobe"):
            logger.info(f"Using bundled static-ffmpeg: {shutil.which('ffmpeg')}")
            return shutil.which("ffmpeg")
    except Exception as e:
        logger.warning(f"static-ffmpeg not available: {e}")

    # 2) imageio-ffmpeg (ffmpeg only, no ffprobe)
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        ffmpeg_dir = str(Path(exe).parent)
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
        os.environ.setdefault("FFMPEG_LOCATION", exe)
        logger.warning(
            f"Using imageio-ffmpeg ({exe}) — but ffprobe is missing, so "
            "yt-dlp won't be able to merge DASH streams. "
            "Run `pip install static-ffmpeg` for full support."
        )
        return exe
    except Exception as e:
        logger.warning(f"imageio-ffmpeg not available: {e}")

    logger.error(
        "No ffmpeg available. Install one of: static-ffmpeg, imageio-ffmpeg, "
        "or system ffmpeg."
    )
    return None
