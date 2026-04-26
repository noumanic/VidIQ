<div align="center">

<img src="frontend/public/vidiq_logo_black_bg.png" alt="VidIQ" width="120" height="120" />

# VidIQ | AI Video Intelligence

**An end-to-end multimodal AI platform for understanding live and recorded online videos.**

Transcribe, analyse keyframes, summarise, detect events, and converse with any YouTube video or live stream — all from a modern web dashboard.

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Quick Start](#-quick-start) ·
[Architecture](#-architecture) ·
[API](#-api-reference) ·
[Configuration](#%EF%B8%8F-configuration) ·
[Roadmap](#-roadmap)

</div>

---

## ✨ Overview

VidIQ converts any video — a YouTube URL or a live stream — into structured, queryable intelligence. The platform fuses **speech-to-text**, **vision**, and **large language models** into a single pipeline that produces a faithful summary, time-stamped key points, detected events, and an interactive Q&A grounded in the source.

The system is designed around three principles:

1. **Provider-agnostic** — every external service (LLM, vision, transcription) sits behind an abstraction with automatic failover across providers.
2. **Free-tier first** — the default deployment uses only free services (Google Gemini, Groq, local Whisper, YouTube transcripts).
3. **Production-shaped** — the in-process event bus, queueing, and storage layers are drop-in compatible with Redis, Celery, and PostgreSQL.

---

## 🎯 Capabilities

| Capability | Implementation |
|---|---|
| **Recorded video analysis** | YouTube URL → metadata → transcript → keyframes → vision captions → multimodal summary |
| **Live stream analysis** | Chunked download (yt-dlp) → rolling transcription → rolling vision → rolling LLM summary |
| **Speech understanding** | YouTube native transcripts (primary) → faster-whisper local fallback |
| **Visual understanding** | Scene-change keyframe extraction (OpenCV) → vision-LLM captioning + tagging |
| **Multimodal summarisation** | Map-reduce LLM pipeline producing overview, key points, chapters, sentiment |
| **Event detection** | LLM-extracted demonstrations, claims, definitions, examples + vision-flagged moments |
| **Time-stamped insights** | Every chapter, event, and chat citation seeks the embedded player to the moment |
| **Conversational Q&A** | Retrieval-grounded chat with timestamp citations |
| **Strategy → pseudocode** | Optional pseudocode extraction for tutorial videos |

---

## 🏛 Architecture

### System overview

```mermaid
flowchart LR
    subgraph Client["🌐 Browser"]
        UI["Next.js 14 SPA<br/>App Router · Tailwind · shadcn/ui<br/>TanStack Query · Framer Motion"]
    end

    subgraph Edge["⚡ Edge / Proxy"]
        Rewrite["Next.js Rewrites<br/>/proxy/api/* → :8000<br/>/proxy/media/* → :8000"]
    end

    subgraph Backend["🐍 Backend (FastAPI · async)"]
        REST["REST Routes<br/>/api/videos · /api/live"]
        WS["WebSocket<br/>/ws/videos/{id}"]
        Bus["EventBus<br/>(in-process pub/sub)"]
        Workers["Background Workers<br/>BackgroundTasks · LiveSession"]
    end

    subgraph Pipeline["🤖 AI Pipeline"]
        YT["yt-dlp<br/>metadata · audio · video"]
        TC["Transcription<br/>YT API → Whisper local"]
        FR["Frame Extraction<br/>OpenCV scene-change"]
        VS["Vision Captioning<br/>Gemini Vision"]
        SUM["Summarisation<br/>Map → Reduce → Synth"]
        QA["Q&A Retrieval<br/>Keyword + LLM"]
    end

    subgraph LLM["🧠 LLM Providers (auto-fallback chain)"]
        GEM["Google Gemini<br/>(free tier)"]
        GRQ["Groq<br/>(free tier)"]
        OAI["OpenAI<br/>(paid)"]
        STUB["Stub<br/>(offline demo)"]
    end

    subgraph Storage["💾 Storage"]
        DB[("SQLite / Postgres<br/>SQLAlchemy 2 async")]
        Media["/media static mount<br/>frames · audio · video"]
    end

    UI -- HTTPS --> Rewrite
    UI -. WebSocket .-> WS
    Rewrite --> REST
    REST --> Workers
    Workers --> Pipeline
    Workers --> Bus
    Bus -.-> WS
    WS -. live updates .-> UI

    Pipeline --> YT
    Pipeline --> TC
    Pipeline --> FR
    Pipeline --> VS
    Pipeline --> SUM
    Pipeline --> QA

    SUM --> LLM
    QA --> LLM
    VS --> LLM
    LLM -. on quota / 4xx .-> LLM

    Pipeline --> Storage
    Workers --> Storage
    REST --> Storage
    Rewrite --> Media

    classDef client fill:#a855f7,stroke:#7e22ce,color:#fff
    classDef edge fill:#06b6d4,stroke:#0891b2,color:#fff
    classDef backend fill:#10b981,stroke:#047857,color:#fff
    classDef pipeline fill:#f59e0b,stroke:#b45309,color:#fff
    classDef llm fill:#ec4899,stroke:#be185d,color:#fff
    classDef storage fill:#6366f1,stroke:#4338ca,color:#fff

    class UI client
    class Rewrite edge
    class REST,WS,Bus,Workers backend
    class YT,TC,FR,VS,SUM,QA pipeline
    class GEM,GRQ,OAI,STUB llm
    class DB,Media storage
```

### Recorded video pipeline

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Next.js UI
    participant API as FastAPI<br/>/api/videos
    participant Worker as Background Worker
    participant YT as yt-dlp
    participant Whisper as faster-whisper
    participant CV as OpenCV
    participant Vision as Vision LLM
    participant LLM as Text LLM
    participant DB as SQLAlchemy
    participant Bus as EventBus
    participant WS as WebSocket

    User->>UI: paste YouTube URL
    UI->>API: POST /api/videos { url }
    API->>DB: INSERT Video (status=processing)
    API-->>UI: 202 Accepted (video_id)
    API->>Worker: schedule run_youtube_pipeline

    UI->>WS: subscribe ws/videos/{id}

    Worker->>YT: fetch_metadata
    YT-->>Worker: title · duration · thumbnail
    Worker->>DB: UPDATE metadata
    Worker->>Bus: emit stage=metadata
    Bus->>WS: broadcast → UI

    Worker->>YT: fetch_youtube_transcript
    alt transcript available
        YT-->>Worker: timed segments
    else no transcript
        Worker->>YT: download_audio
        Worker->>Whisper: transcribe(audio)
        Whisper-->>Worker: timed segments
    end
    Worker->>DB: INSERT transcript_segments
    Worker->>Bus: emit stage=transcript

    Worker->>YT: download_video (≤720p)
    Worker->>CV: extract scene-change keyframes
    CV-->>Worker: top-N frames
    loop each frame
        Worker->>Vision: caption + tag + detect event
        Vision-->>Worker: caption, tags, event
    end
    Worker->>DB: INSERT keyframes
    Worker->>Bus: emit stage=vision

    Worker->>LLM: summarise_video (map-reduce)
    Note right of LLM: short videos: 1 call<br/>long videos: chunk → synth
    LLM-->>Worker: overview, key_points, chapters, events
    Worker->>DB: INSERT summary + events
    Worker->>Bus: emit stage=done

    Bus->>WS: broadcast completion
    WS->>UI: render summary tabs
```

### LLM provider auto-failover

```mermaid
flowchart TD
    Start([chat_json or chat_text]) --> Chain{provider chain}
    Chain -->|"1️⃣ Gemini"| G[Gemini]
    G -->|success| Done([return result])
    G -->|429 quota| GR[cool-off model<br/>6h–24h]
    GR --> GN{more Gemini<br/>models?}
    GN -->|yes| G
    GN -->|no| TryGroq{"GROQ_API_KEY<br/>set?"}

    Chain -->|"2️⃣ Groq"| TryGroq
    TryGroq -->|yes| Q[Groq<br/>llama-3.3-70b-versatile]
    Q -->|success| Done
    Q -->|fail| QR[cool-off + try<br/>llama-3.1-8b<br/>then gemma2-9b]
    QR --> QN{any Groq<br/>model OK?}
    QN -->|yes| Q
    QN -->|no| TryOAI{"OPENAI_API_KEY<br/>set?"}

    TryGroq -->|no| TryOAI
    TryOAI -->|yes| O[OpenAI<br/>gpt-4o-mini]
    O -->|success| Done
    O -->|fail| Stub
    TryOAI -->|no| Stub
    Stub([stub response])

    classDef ok fill:#10b981,stroke:#047857,color:#fff
    classDef warn fill:#f59e0b,stroke:#b45309,color:#fff
    classDef fail fill:#ef4444,stroke:#b91c1c,color:#fff
    class G,Q,O ok
    class GR,QR warn
    class Stub fail
```

### Live stream pipeline

```mermaid
flowchart LR
    Start([POST /api/live]) --> Session[LiveSession task]
    Session --> Loop{running?}
    Loop -->|yes| Chunk[yt-dlp grab N-sec chunk]
    Chunk --> Frames[OpenCV keyframes]
    Frames --> Vision[Gemini vision caption]
    Chunk --> Audio[faster-whisper transcribe]
    Vision --> Roll[rolling_summary LLM]
    Audio --> Roll
    Roll --> Save[(persist transcript<br/>frames · events<br/>rolling summary)]
    Save --> Emit[EventBus → WebSocket]
    Emit --> UI[UI updates Live tab]
    Save --> Loop
    Loop -->|stopped| End([cleanup + finalise])

    classDef proc fill:#a855f7,stroke:#7e22ce,color:#fff
    classDef store fill:#6366f1,stroke:#4338ca,color:#fff
    class Chunk,Frames,Vision,Audio,Roll proc
    class Save store
```

### Data model

```mermaid
erDiagram
    VIDEOS ||--o| SUMMARIES : has
    VIDEOS ||--o{ TRANSCRIPT_SEGMENTS : contains
    VIDEOS ||--o{ KEYFRAMES : contains
    VIDEOS ||--o{ EVENTS : contains
    VIDEOS ||--o{ CHAT_MESSAGES : has

    VIDEOS {
        string id PK
        string source_type "youtube live upload"
        text source_url
        text title
        text channel
        float duration_sec
        text thumbnail
        string status
        float progress
        string stage
        text error
        datetime created_at
        datetime updated_at
    }

    SUMMARIES {
        int id PK
        string video_id FK
        text overview
        json key_points
        json topics
        json chapters
        string sentiment
        text pseudocode
    }

    TRANSCRIPT_SEGMENTS {
        int id PK
        string video_id FK
        float start
        float end
        text text
        string speaker
    }

    KEYFRAMES {
        int id PK
        string video_id FK
        float timestamp
        text image_path
        text caption
        json tags
    }

    EVENTS {
        int id PK
        string video_id FK
        float timestamp
        text title
        text description
        string severity
        string category
    }

    CHAT_MESSAGES {
        int id PK
        string video_id FK
        string role
        text content
        json citations
        datetime created_at
    }
```

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | Next.js 14 (App Router) · TypeScript 5 · React 18 |
| **Styling** | Tailwind CSS 3 · shadcn/ui-style primitives · Radix UI |
| **State / data** | TanStack Query 5 · WebSocket |
| **Animation** | Framer Motion · CSS keyframes |
| **Backend framework** | FastAPI 0.115 · Uvicorn · Pydantic 2 |
| **ORM / database** | SQLAlchemy 2 (async) · SQLite (dev) · PostgreSQL (prod-ready) |
| **AI — text** | Google Gemini · Groq Llama 3.3 · OpenAI (interchangeable) |
| **AI — vision** | Gemini Vision (extensible to GPT-4o, LLaVA) |
| **AI — speech** | YouTube Transcript API · faster-whisper (local) · OpenAI Whisper (paid) |
| **Video / media** | yt-dlp · OpenCV · static-ffmpeg |
| **Containerisation** | Docker · docker-compose |

---

## 🚀 Quick Start

> **Zero paid API required.** The default configuration uses Google Gemini + Groq (both free tiers) and faster-whisper running locally.

### Prerequisites

- Python **3.10+**
- Node.js **18+**
- A free **Gemini API key** — <https://aistudio.google.com/app/apikey>
- A free **Groq API key** *(recommended fallback)* — <https://console.groq.com/keys>

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# → edit .env and paste your free API key(s)

uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend → **http://127.0.0.1:8000** · Swagger UI → **http://127.0.0.1:8000/docs**

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local

npm run dev
```

UI → **http://localhost:3000**

### Docker (one command)

```bash
GEMINI_API_KEY=your-key GROQ_API_KEY=your-key docker compose up --build
```

---

## ⚙️ Configuration

All backend configuration is environment-driven via `backend/.env`.

### Provider selection

```env
# Primary provider (auto-falls back to others if a key is set)
LLM_PROVIDER=gemini                              # gemini | groq | openai | stub

# Google Gemini (free)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-flash-latest
GEMINI_VISION_MODEL=gemini-flash-latest

# Groq (free, fast — best fallback)
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile

# OpenAI (paid, optional)
OPENAI_API_KEY=...
LLM_MODEL=gpt-4o-mini
VISION_MODEL=gpt-4o-mini
```

### Transcription

```env
TRANSCRIPTION_PROVIDER=local                      # local | openai | none
WHISPER_LOCAL_MODEL=tiny                          # tiny | base | small | medium
WHISPER_LOCAL_DEVICE=cpu                          # cpu | cuda
WHISPER_LOCAL_COMPUTE=int8                        # int8 | float16
```

### App

```env
APP_HOST=0.0.0.0
APP_PORT=8000
DATABASE_URL=sqlite+aiosqlite:///./vidiq.db       # postgresql+asyncpg://… in prod
MEDIA_DIR=./media
CORS_ORIGINS=http://localhost:3000
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service status, configured provider, available models |
| `POST` | `/api/videos` | Start analysis · body `{ url, domain?, extract_pseudocode? }` |
| `GET` | `/api/videos` | List analyses (newest first) |
| `GET` | `/api/videos/{id}` | Full detail — summary, transcript, keyframes, events |
| `DELETE` | `/api/videos/{id}` | Remove analysis + media |
| `GET` | `/api/videos/{id}/chat` | Conversation history |
| `POST` | `/api/videos/{id}/chat` | Ask a question · body `{ message }` |
| `POST` | `/api/live` | Start live-stream session · body `{ url, chunk_seconds }` |
| `POST` | `/api/live/{id}/stop` | Stop a live session |
| `WS` | `/ws/videos/{id}` | Real-time progress + live-chunk events |

Interactive documentation: **http://localhost:8000/docs**

---

## 📁 Project Structure

```
VidIQ/
├── backend/                       FastAPI service + AI pipeline
│   ├── app/
│   │   ├── api/                   REST + WebSocket routes
│   │   │   ├── videos.py
│   │   │   ├── live.py
│   │   │   └── ws.py
│   │   ├── core/                  Config, DB, EventBus, ffmpeg setup
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   ├── events.py
│   │   │   └── ffmpeg_setup.py
│   │   ├── models/                SQLAlchemy 2 ORM
│   │   │   └── video.py
│   │   ├── schemas/               Pydantic DTOs
│   │   │   └── video.py
│   │   ├── services/              Domain logic
│   │   │   ├── llm.py             Multi-provider LLM with rotation
│   │   │   ├── youtube.py         yt-dlp wrappers
│   │   │   ├── frames.py          OpenCV keyframe extraction
│   │   │   ├── summarize.py       Map-reduce summarisation
│   │   │   ├── qa.py              Retrieval-grounded chat
│   │   │   ├── pipeline.py        Recorded-video orchestration
│   │   │   └── live.py            Live-stream orchestration
│   │   └── main.py                FastAPI app + lifespan
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                      Next.js dashboard
│   ├── src/
│   │   ├── app/                   App Router pages
│   │   │   ├── page.tsx           Dashboard
│   │   │   ├── analyze/           Recorded video form
│   │   │   ├── live/              Live stream form
│   │   │   ├── library/           Past analyses
│   │   │   └── videos/[id]/       Video workspace
│   │   ├── components/
│   │   │   ├── ui/                Primitives (Button, Card, Tabs, …)
│   │   │   ├── layout/            Top nav
│   │   │   ├── dashboard/         Hero CTA, stats, recent grid
│   │   │   ├── marketing/         Feature card, stat strip
│   │   │   ├── fx/                Aurora bg, logo
│   │   │   └── video/             Workspace, panels, chat
│   │   └── lib/                   API client, utils
│   ├── public/                    Logos, static assets
│   ├── tailwind.config.ts
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml
├── LICENSE
├── .gitignore
└── README.md
```

---

## 🧠 Design Notes

### Provider abstraction
Every external dependency (LLM, vision, transcription) is wrapped in a thin adapter in `app/services/llm.py`. The dispatcher walks a configurable provider chain (`gemini → groq → openai`) and rotates models within a provider when one hits a quota or denial error. A single API failure is invisible to callers.

### Map-reduce summarisation
For long videos, the transcript is chunked into ~4500-char windows. Each chunk is summarised independently (map), then a final synthesis call merges the mini-summaries into the canonical overview, key points, topics, and sentiment (reduce). Chapters are derived from chunk boundaries to avoid an extra LLM round-trip.

### Defensive JSON parsing
LLMs occasionally wrap JSON in markdown fences or emit arrays where objects are expected. `_safe_json()` strips fences, finds the first balanced `{...}` block, and falls back to wrapping arrays — making the pipeline robust to provider quirks.

### Real-time updates
A lightweight in-process pub/sub (`app/core/events.py`) fans pipeline progress events out to subscribed WebSocket clients. The frontend uses `invalidateQueries` on each event so React Query refetches in the background — the UI updates without unmounting components or replaying entry animations.

### Static media serving
Extracted keyframes are written under `MEDIA_DIR` and served via FastAPI's `StaticFiles` mount at `/media/*`. The Next.js rewrite layer proxies these through `/proxy/media/*` so the frontend has zero knowledge of the backend host.

---

## 🗺 Roadmap

### Production hardening
- [ ] PostgreSQL swap (`DATABASE_URL=postgresql+asyncpg://…`)
- [ ] Redis-backed EventBus for multi-worker WebSocket fan-out
- [ ] Celery / RQ / Temporal for distributed pipeline workers
- [ ] S3 / CloudFront for `/media`
- [ ] Authentication (NextAuth + FastAPI JWT) and per-user libraries
- [ ] Per-user rate limits and quotas
- [ ] OpenTelemetry tracing across pipeline stages

### Feature expansion
- [ ] Speaker diarisation (pyannote-audio)
- [ ] Multi-language translation pass
- [ ] Embeddings + semantic transcript search
- [ ] Automatic clip generation from detected events
- [ ] Public share links for analyses
- [ ] Slack / Notion / Linear export integrations

---

## 📄 License

[MIT](LICENSE) © VidIQ contributors