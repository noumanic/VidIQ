from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Provider selection: gemini | openai | stub
    LLM_PROVIDER: str = "gemini"

    # OpenAI (optional)
    OPENAI_API_KEY: str | None = None
    LLM_MODEL: str = "gpt-4o-mini"
    VISION_MODEL: str = "gpt-4o-mini"

    # Google Gemini (free tier, recommended)
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-flash-latest"
    GEMINI_VISION_MODEL: str = "gemini-flash-latest"

    # Groq (FREE, no credit card, very fast text inference)
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Transcription: local | openai | none
    TRANSCRIPTION_PROVIDER: str = "local"
    TRANSCRIPTION_MODEL: str = "whisper-1"  # only used if provider=openai
    WHISPER_LOCAL_MODEL: str = "tiny"
    WHISPER_LOCAL_DEVICE: str = "cpu"
    WHISPER_LOCAL_COMPUTE: str = "int8"

    # App
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    DATABASE_URL: str = "sqlite+aiosqlite:///./vidiq.db"
    MEDIA_DIR: str = "./media"
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def media_path(self) -> Path:
        p = Path(self.MEDIA_DIR).resolve()
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def llm_configured(self) -> bool:
        # Configured if ANY usable provider key exists — the runtime auto-falls
        # back across providers when one is unavailable.
        if self.GEMINI_API_KEY or self.GROQ_API_KEY or self.OPENAI_API_KEY:
            return True
        return False

    @property
    def llm_display_model(self) -> str:
        if self.LLM_PROVIDER == "gemini":
            return self.GEMINI_MODEL
        if self.LLM_PROVIDER == "groq":
            return self.GROQ_MODEL
        if self.LLM_PROVIDER == "openai":
            return self.LLM_MODEL
        return "stub"


@lru_cache
def get_settings() -> Settings:
    return Settings()
