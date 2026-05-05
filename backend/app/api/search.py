"""Cross-library search — title, channel, topics, transcript text.

Single endpoint: `GET /api/search?q=...` returning matching videos with a
short transcript snippet around the first hit. SQLite-friendly LIKE
queries; for richer search we'd swap to FTS5 later.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.video import Summary, TranscriptSegment, Video
from app.schemas.video import SearchHitDTO, SearchResponse


router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse)
async def search(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1, max_length=120),
    limit: int = Query(20, ge=1, le=100),
) -> SearchResponse:
    needle = q.strip().lower()
    like = f"%{needle}%"

    # Match against video metadata: title / channel / source_url
    meta_match = (
        select(Video)
        .where(
            or_(
                func.lower(Video.title).like(like),
                func.lower(Video.channel).like(like),
                func.lower(Video.source_url).like(like),
            )
        )
        .order_by(desc(Video.created_at))
        .limit(limit)
    )
    meta_rows = (await db.execute(meta_match)).scalars().all()

    # Match against transcript text — pull DISTINCT video_ids that have a
    # segment containing the needle, then resolve.
    seg_q = (
        select(TranscriptSegment.video_id, TranscriptSegment.text)
        .where(func.lower(TranscriptSegment.text).like(like))
        .limit(limit * 4)
    )
    seg_rows = (await db.execute(seg_q)).all()
    seen_ids: dict[str, str] = {}
    for vid_id, text in seg_rows:
        if vid_id not in seen_ids:
            seen_ids[vid_id] = _snippet(text, needle)

    # Match against topics JSON — string LIKE on JSON column works for SQLite.
    topic_q = (
        select(Summary.video_id)
        .where(func.lower(Summary.topics).like(like))
    )
    topic_ids = {vid_id for (vid_id,) in (await db.execute(topic_q)).all()}

    # Combine, preserving meta-match priority
    combined: dict[str, Video] = {v.id: v for v in meta_rows}
    extra_ids = (set(seen_ids) | topic_ids) - set(combined)
    if extra_ids:
        extras = (
            await db.execute(
                select(Video).where(Video.id.in_(extra_ids)).order_by(desc(Video.created_at))
            )
        ).scalars().all()
        for v in extras:
            combined[v.id] = v

    results: list[SearchHitDTO] = []
    for vid in list(combined.values())[:limit]:
        snippet = seen_ids.get(vid.id)
        results.append(
            SearchHitDTO(
                id=vid.id,
                source_type=vid.source_type,
                source_url=vid.source_url,
                title=vid.title,
                channel=vid.channel,
                duration_sec=vid.duration_sec,
                thumbnail=vid.thumbnail,
                status=vid.status,
                progress=vid.progress,
                stage=vid.stage,
                error=vid.error,
                tags=vid.tags or [],
                created_at=vid.created_at,
                snippet=snippet,
            )
        )

    return SearchResponse(query=q, total=len(results), results=results)


def _snippet(text: str, needle: str, radius: int = 60) -> str:
    """Return a short window of `text` around the first occurrence of needle."""
    if not text:
        return ""
    idx = text.lower().find(needle)
    if idx < 0:
        return text[: radius * 2].strip() + ("…" if len(text) > radius * 2 else "")
    start = max(0, idx - radius)
    end = min(len(text), idx + len(needle) + radius)
    out = text[start:end].strip()
    if start > 0:
        out = "…" + out
    if end < len(text):
        out = out + "…"
    return out
