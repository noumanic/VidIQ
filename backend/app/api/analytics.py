"""Analytics aggregation endpoint — powers the /analytics dashboard.

Computes overview stats across all analysed videos in a single round-trip:
KPIs, daily volume series, source / status / sentiment breakdowns, top
topics, top event categories. SQLite-friendly (no window functions).
"""

from collections import Counter
from datetime import datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.video import DetectedEvent, Summary, Video


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class KPI(BaseModel):
    videos_total: int
    videos_completed: int
    videos_processing: int
    videos_failed: int
    hours_processed: float
    events_detected: int
    keyframes_extracted: int
    transcript_segments: int
    chat_messages: int
    avg_duration_sec: float
    completion_rate: float  # 0..1


class TimePoint(BaseModel):
    date: str  # YYYY-MM-DD
    count: int


class LabelValue(BaseModel):
    label: str
    value: int


class AnalyticsOverview(BaseModel):
    kpi: KPI
    daily_volume: list[TimePoint]
    source_mix: list[LabelValue]
    status_breakdown: list[LabelValue]
    top_topics: list[LabelValue]
    event_categories: list[LabelValue]
    event_severity: list[LabelValue]
    sentiment_distribution: list[LabelValue]
    duration_buckets: list[LabelValue]


def _bucket_duration(seconds: float | None) -> str:
    if not seconds:
        return "Unknown"
    m = seconds / 60.0
    if m < 5:
        return "< 5 min"
    if m < 15:
        return "5–15 min"
    if m < 30:
        return "15–30 min"
    if m < 60:
        return "30–60 min"
    if m < 120:
        return "1–2 hr"
    return "> 2 hr"


_DURATION_ORDER = [
    "< 5 min",
    "5–15 min",
    "15–30 min",
    "30–60 min",
    "1–2 hr",
    "> 2 hr",
    "Unknown",
]


@router.get("/overview", response_model=AnalyticsOverview)
async def overview(
    db: Annotated[AsyncSession, Depends(get_db)],
    days: int = Query(30, ge=1, le=365, description="Window for the daily-volume series"),
) -> AnalyticsOverview:
    # ── KPI counters via cheap aggregates (one row each) ────────────────
    total_q = await db.execute(select(func.count(Video.id)))
    videos_total = int(total_q.scalar() or 0)

    status_rows_q = await db.execute(
        select(Video.status, func.count(Video.id)).group_by(Video.status)
    )
    status_counts = {s: int(c) for s, c in status_rows_q.all()}
    completed = status_counts.get("completed", 0)
    processing = status_counts.get("processing", 0) + status_counts.get("pending", 0)
    failed = status_counts.get("failed", 0)
    live = status_counts.get("live", 0)

    duration_q = await db.execute(
        select(func.coalesce(func.sum(Video.duration_sec), 0.0))
    )
    total_duration = float(duration_q.scalar() or 0.0)

    avg_duration_q = await db.execute(
        select(func.coalesce(func.avg(Video.duration_sec), 0.0))
        .where(Video.duration_sec.is_not(None))
    )
    avg_duration = float(avg_duration_q.scalar() or 0.0)

    # ── Source mix (youtube / live / upload) ────────────────────────────
    source_q = await db.execute(
        select(Video.source_type, func.count(Video.id)).group_by(Video.source_type)
    )
    source_mix = [LabelValue(label=s or "unknown", value=int(c)) for s, c in source_q.all()]

    # ── Status breakdown (full set, ordered by funnel) ──────────────────
    funnel_order = ["pending", "processing", "live", "completed", "failed"]
    status_breakdown = [
        LabelValue(label=s, value=status_counts.get(s, 0)) for s in funnel_order
    ]

    # ── Daily volume (last N days, gap-filled) ──────────────────────────
    cutoff = datetime.utcnow() - timedelta(days=days - 1)
    daily_q = await db.execute(
        select(func.date(Video.created_at), func.count(Video.id))
        .where(Video.created_at >= cutoff.replace(hour=0, minute=0, second=0, microsecond=0))
        .group_by(func.date(Video.created_at))
    )
    raw_daily: dict[str, int] = {str(d): int(c) for d, c in daily_q.all() if d is not None}
    daily_volume: list[TimePoint] = []
    today = datetime.utcnow().date()
    for i in range(days):
        d = today - timedelta(days=days - 1 - i)
        daily_volume.append(TimePoint(date=d.isoformat(), count=raw_daily.get(d.isoformat(), 0)))

    # ── Topic frequencies (from Summary.topics JSON) ────────────────────
    topics_q = await db.execute(
        select(Summary.topics).join(Video, Summary.video_id == Video.id)
    )
    topic_counter: Counter[str] = Counter()
    for row in topics_q.scalars().all():
        if isinstance(row, list):
            for t in row:
                if isinstance(t, str) and t.strip():
                    topic_counter[t.strip().lower()] += 1
    top_topics = [
        LabelValue(label=t, value=c) for t, c in topic_counter.most_common(10)
    ]

    # ── Sentiment distribution ──────────────────────────────────────────
    sentiment_q = await db.execute(
        select(Summary.sentiment, func.count(Summary.id))
        .where(Summary.sentiment.is_not(None))
        .group_by(Summary.sentiment)
    )
    sentiment_distribution = [
        LabelValue(label=str(s), value=int(c)) for s, c in sentiment_q.all()
    ]

    # ── Event aggregates ────────────────────────────────────────────────
    events_total_q = await db.execute(select(func.count(DetectedEvent.id)))
    events_total = int(events_total_q.scalar() or 0)

    cat_q = await db.execute(
        select(DetectedEvent.category, func.count(DetectedEvent.id))
        .group_by(DetectedEvent.category)
    )
    event_categories = sorted(
        [
            LabelValue(label=c or "uncategorised", value=int(n))
            for c, n in cat_q.all()
        ],
        key=lambda x: x.value,
        reverse=True,
    )[:10]

    sev_q = await db.execute(
        select(DetectedEvent.severity, func.count(DetectedEvent.id))
        .group_by(DetectedEvent.severity)
    )
    event_severity = [
        LabelValue(label=str(s or "info"), value=int(c)) for s, c in sev_q.all()
    ]

    # ── Cross-table counts (cheap, single SELECT each) ──────────────────
    from app.models.video import ChatMessage, Keyframe, TranscriptSegment

    kf_q = await db.execute(select(func.count(Keyframe.id)))
    keyframes_extracted = int(kf_q.scalar() or 0)

    seg_q = await db.execute(select(func.count(TranscriptSegment.id)))
    transcript_segments = int(seg_q.scalar() or 0)

    chat_q = await db.execute(select(func.count(ChatMessage.id)))
    chat_messages = int(chat_q.scalar() or 0)

    # ── Duration histogram (bucketed in Python, dataset is small) ───────
    durations_q = await db.execute(select(Video.duration_sec))
    bucket_counter: Counter[str] = Counter()
    for (d,) in durations_q.all():
        bucket_counter[_bucket_duration(d)] += 1
    duration_buckets = [
        LabelValue(label=lbl, value=bucket_counter.get(lbl, 0))
        for lbl in _DURATION_ORDER
        if bucket_counter.get(lbl, 0) > 0
    ]

    completion_rate = (completed / videos_total) if videos_total else 0.0

    return AnalyticsOverview(
        kpi=KPI(
            videos_total=videos_total,
            videos_completed=completed,
            videos_processing=processing + live,
            videos_failed=failed,
            hours_processed=round(total_duration / 3600.0, 2),
            events_detected=events_total,
            keyframes_extracted=keyframes_extracted,
            transcript_segments=transcript_segments,
            chat_messages=chat_messages,
            avg_duration_sec=round(avg_duration, 1),
            completion_rate=round(completion_rate, 4),
        ),
        daily_volume=daily_volume,
        source_mix=source_mix,
        status_breakdown=status_breakdown,
        top_topics=top_topics,
        event_categories=event_categories,
        event_severity=event_severity,
        sentiment_distribution=sentiment_distribution,
        duration_buckets=duration_buckets,
    )
