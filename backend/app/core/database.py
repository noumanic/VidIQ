from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings


settings = get_settings()

engine = create_async_engine(settings.DATABASE_URL, echo=False, future=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session


async def init_db() -> None:
    from app.models import video  # noqa: F401  ensure models are imported

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _migrate_added_columns(conn)


async def _migrate_added_columns(conn) -> None:
    """Apply lightweight ALTER TABLE migrations for SQLite — `create_all`
    only emits CREATE for tables that don't exist, so columns added to
    existing models stay missing on a pre-existing DB. Runs on every
    startup; idempotent (NO-OPS when the column already exists)."""
    from sqlalchemy import text

    new_columns = [
        ("videos", "tags", "JSON DEFAULT '[]'"),
        ("summaries", "action_items", "JSON DEFAULT '[]'"),
        ("summaries", "questions", "JSON DEFAULT '[]'"),
    ]
    for table, col, decl in new_columns:
        # PRAGMA table_info returns one row per column with `name` as 2nd field.
        rows = await conn.execute(text(f"PRAGMA table_info({table})"))
        existing = {r[1] for r in rows.fetchall()}
        if col in existing:
            continue
        try:
            await conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {decl}"))
        except Exception as e:
            from loguru import logger
            logger.warning(f"Could not add {table}.{col}: {e}")
