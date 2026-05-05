from datetime import datetime
from pydantic import BaseModel, ConfigDict, HttpUrl


class AnalyzeRequest(BaseModel):
    url: str
    domain: str | None = None  # e.g. "education", "trading", "medical"
    extract_pseudocode: bool = False


class TranscriptSegmentDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    start: float
    end: float
    text: str
    speaker: str | None = None


class KeyframeDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    timestamp: float
    image_path: str
    caption: str | None = None
    tags: list[str] = []


class EventDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    timestamp: float
    title: str
    description: str
    severity: str = "info"
    category: str | None = None


class ChapterDTO(BaseModel):
    start: float
    end: float
    title: str


class SummaryDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    overview: str
    key_points: list[str] = []
    topics: list[str] = []
    chapters: list[ChapterDTO] = []
    sentiment: str | None = None
    pseudocode: str | None = None


class VideoSummaryDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    source_type: str
    source_url: str
    title: str | None = None
    channel: str | None = None
    duration_sec: float | None = None
    thumbnail: str | None = None
    status: str
    progress: float
    stage: str | None = None
    error: str | None = None
    created_at: datetime


class VideoDetailDTO(VideoSummaryDTO):
    summary: SummaryDTO | None = None
    transcript: list[TranscriptSegmentDTO] = []
    keyframes: list[KeyframeDTO] = []
    events: list[EventDTO] = []


class ChatRequest(BaseModel):
    message: str


class ChatMessageDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: str
    content: str
    citations: list = []
    created_at: datetime


class LiveStartRequest(BaseModel):
    url: str
    chunk_seconds: int = 30


class LiveChunkDTO(BaseModel):
    timestamp: float
    transcript: str
    rolling_summary: str
    new_events: list[EventDTO] = []
