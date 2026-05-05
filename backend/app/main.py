from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import analytics as analytics_routes
from app.api import live as live_routes
from app.api import search as search_routes
from app.api import videos as video_routes
from app.api import ws as ws_routes
from app.core.config import get_settings
from app.core.database import init_db
from app.core.ffmpeg_setup import ensure_ffmpeg_on_path


settings = get_settings()
ensure_ffmpeg_on_path()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Pre-warm the local Whisper model so the first transcription request
    # doesn't block while the HuggingFace download runs. Non-fatal on failure.
    if settings.TRANSCRIPTION_PROVIDER == "local":
        import asyncio
        from app.services.llm import _get_local_whisper
        from loguru import logger
        try:
            await asyncio.to_thread(_get_local_whisper)
            logger.info("Whisper model pre-loaded")
        except Exception as e:
            logger.warning(f"Could not pre-load Whisper: {e}")
    yield


app = FastAPI(
    title="VidIQ — AI Video Understanding",
    description="End-to-end pipeline for live and recorded video summarization, "
    "event detection, and Q&A.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve extracted frames so the frontend can show keyframe thumbnails directly
media_dir: Path = settings.media_path
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

app.include_router(video_routes.router)
app.include_router(live_routes.router)
app.include_router(ws_routes.router)
app.include_router(analytics_routes.router)
app.include_router(search_routes.router)


@app.get("/api/health")
async def health() -> dict:
    payload = {
        "status": "ok",
        "llm_configured": settings.llm_configured,
        "provider": settings.LLM_PROVIDER,
        "model": settings.llm_display_model,
        "transcription_provider": settings.TRANSCRIPTION_PROVIDER,
    }
    if settings.LLM_PROVIDER == "gemini":
        from app.services.llm import gemini_status
        payload["gemini"] = gemini_status()
    return payload
