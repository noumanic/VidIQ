from app.core.config import get_settings


class YouTubeBlockedError(RuntimeError):
    pass


class YouTubeMediaDownloadDisabled(RuntimeError):
    pass


def youtube_download_mode() -> str:
    return get_settings().YOUTUBE_DOWNLOAD_MODE.lower().strip()


def is_safe_mode() -> bool:
    """Full safe mode: blocks ALL automated access including transcript fetching."""
    return youtube_download_mode() == "safe"


def is_media_download_disabled() -> bool:
    """True in any mode except 'full' - prevents audio/video download."""
    return youtube_download_mode() != "full"


def is_youtube_block_error(error: object) -> bool:
    text = str(error).lower()
    patterns = [
        "sign in to confirm",
        "confirm you're not a bot",
        "not a bot",
        "bot check",
        "captcha",
        "unable to download api page",
        "unexpected_eof_while_reading",
        "eof occurred in violation of protocol",
        "youtube closed the network connection",
        "http error 403",
        "403 forbidden",
        "http error 429",
        "429 too many requests",
        "too many requests",
        "rate limiting",
        "host blocking",
        "access denied",
    ]
    return any(pattern in text for pattern in patterns)


def raise_youtube_blocked() -> None:
    raise YouTubeBlockedError(
        "YouTube blocked automated access. For local full analysis, make sure "
        "browser cookies are available to yt-dlp, paste a transcript, or upload "
        "an audio/video file."
    )


def assert_media_download_allowed() -> None:
    if is_media_download_disabled():
        raise YouTubeMediaDownloadDisabled(
            "YouTube media download is disabled unless YOUTUBE_DOWNLOAD_MODE=full. "
            "Use transcript, pasted transcript, or uploaded audio/video instead."
        )
