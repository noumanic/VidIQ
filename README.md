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

# 🏛 Architecture

## System Overview

```mermaid
flowchart LR
    subgraph Client["🌐  Browser"]
        UI["Next.js 14 SPA\nApp Router · Tailwind\nTanStack Query"]
    end

    subgraph Edge["⚡  Edge / Proxy"]
        Rewrite["Next.js Rewrites\n/proxy/api → :8000\n/proxy/media → :8000"]
    end

    subgraph Backend["🐍  Backend — FastAPI async"]
        REST["REST Routes\n/api/videos · /api/live"]
        WS["WebSocket\n/ws/videos/{id}"]
        Bus["EventBus\nin-process pub/sub"]
        Workers["Background Workers\nBackgroundTasks · LiveSession"]
    end

    subgraph Pipeline["🤖  AI Pipeline"]
        YT["yt-dlp\nmetadata · audio · video"]
        TC["Transcription\nYT API → Whisper"]
        FR["Frame Extraction\nOpenCV scene-change"]
        VS["Vision Captioning\nGemini Vision"]
        SUM["Summarisation\nMap → Reduce → Synth"]
        QA["Q&A Retrieval\nKeyword + LLM"]
    end

    subgraph LLM["🧠  LLM Providers — auto-fallback"]
        GEM["Google Gemini\nfree tier"]
        GRQ["Groq\nfree tier"]
        OAI["OpenAI\npaid"]
        STUB["Stub\noffline demo"]
    end

    subgraph Storage["💾  Storage"]
        DB[("SQLite / Postgres\nSQLAlchemy 2 async")]
        Media["/media static mount\nframes · audio · video"]
    end

    UI -->|HTTPS| Rewrite
    UI -.->|WebSocket| WS
    Rewrite --> REST
    REST --> Workers
    Workers --> Pipeline
    Workers --> Bus
    Bus -.-> WS
    WS -.->|live updates| UI

    Pipeline --> YT
    Pipeline --> TC
    Pipeline --> FR
    Pipeline --> VS
    Pipeline --> SUM
    Pipeline --> QA

    SUM --> LLM
    QA --> LLM
    VS --> LLM
    LLM -.->|on quota/4xx| LLM

    Pipeline --> Storage
    Workers --> Storage
    REST --> Storage
    Rewrite --> Media

    classDef client   fill:#7c3aed,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef edge     fill:#0891b2,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef backend  fill:#059669,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef pipeline fill:#d97706,stroke:#000000,stroke-width:3px,color:#000000,font-weight:bold
    classDef llm      fill:#db2777,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef storage  fill:#4338ca,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold

    %% Light subgraph backgrounds so GitHub's hardcoded teal title text (#3387a3) is readable
    classDef sgClient   fill:#ede9fe,stroke:#7c3aed,stroke-width:2px,color:#3387a3
    classDef sgEdge     fill:#e0f7fa,stroke:#0891b2,stroke-width:2px,color:#3387a3
    classDef sgBackend  fill:#d1fae5,stroke:#059669,stroke-width:2px,color:#3387a3
    classDef sgPipeline fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#3387a3
    classDef sgLLM      fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#3387a3
    classDef sgStorage  fill:#e0e7ff,stroke:#4338ca,stroke-width:2px,color:#3387a3

    class Client sgClient
    class Edge sgEdge
    class Backend sgBackend
    class Pipeline sgPipeline
    class LLM sgLLM
    class Storage sgStorage

    class UI client
    class Rewrite edge
    class REST,WS,Bus,Workers backend
    class YT,TC,FR,VS,SUM,QA pipeline
    class GEM,GRQ,OAI,STUB llm
    class DB,Media storage

    linkStyle 0  stroke:#7c3aed,stroke-width:3px,color:#ffffff
    linkStyle 1  stroke:#7c3aed,stroke-width:3px,stroke-dasharray:6,color:#ffffff
    linkStyle 2  stroke:#0891b2,stroke-width:3px
    linkStyle 3  stroke:#059669,stroke-width:3px
    linkStyle 4  stroke:#059669,stroke-width:3px
    linkStyle 5  stroke:#059669,stroke-width:3px
    linkStyle 6  stroke:#059669,stroke-width:3px,stroke-dasharray:6
    linkStyle 7  stroke:#7c3aed,stroke-width:3px,stroke-dasharray:6,color:#ffffff
    linkStyle 8  stroke:#d97706,stroke-width:3px
    linkStyle 9  stroke:#d97706,stroke-width:3px
    linkStyle 10 stroke:#d97706,stroke-width:3px
    linkStyle 11 stroke:#d97706,stroke-width:3px
    linkStyle 12 stroke:#d97706,stroke-width:3px
    linkStyle 13 stroke:#d97706,stroke-width:3px
    linkStyle 14 stroke:#db2777,stroke-width:3px
    linkStyle 15 stroke:#db2777,stroke-width:3px
    linkStyle 16 stroke:#db2777,stroke-width:3px
    linkStyle 17 stroke:#db2777,stroke-width:3px,stroke-dasharray:6,color:#ffffff
    linkStyle 18 stroke:#4338ca,stroke-width:3px
    linkStyle 19 stroke:#4338ca,stroke-width:3px
    linkStyle 20 stroke:#4338ca,stroke-width:3px
    linkStyle 21 stroke:#0891b2,stroke-width:3px
```

---

## Recorded Video Pipeline

```mermaid
flowchart TD
    User(["👤 User"]):::actor
    UI["Next.js UI"]:::fe
    API["FastAPI\n/api/videos"]:::be
    DB[("SQLAlchemy\nDB")]:::store
    W["Background\nWorker"]:::be
    WS["WebSocket\n/ws/videos"]:::be

    User -->|Paste YouTube URL| UI
    UI -->|POST /api/videos| API
    API -->|INSERT Video\nstatus=processing| DB
    API -->|202 Accepted\nvideo_id| UI
    API -->|schedule\nrun_youtube_pipeline| W
    UI -->|subscribe\nws/videos/id| WS

    S1{{"🟣 Stage 1\nMetadata"}}:::stage1
    YT1["yt-dlp\nfetch_metadata"]:::ingest
    DB1["UPDATE\nmetadata"]:::store
    BUS1["EventBus emit\nstage=metadata"]:::be

    W --> S1
    S1 --> YT1
    YT1 -->|title · duration\nthumbnail| W
    W --> DB1
    W --> BUS1
    BUS1 -->|broadcast| WS

    S2{{"🔵 Stage 2\nTranscript"}}:::stage2
    YT2["fetch_youtube\ntranscript"]:::ingest
    WH["faster-whisper\ntranscribe audio"]:::ingest
    DB2["INSERT\ntranscript_segments"]:::store
    BUS2["EventBus emit\nstage=transcript"]:::be

    BUS1 --> S2
    S2 --> YT2
    YT2 -->|no transcript| WH
    YT2 -->|timed segments| DB2
    WH -->|timed segments| DB2
    DB2 --> BUS2

    S3{{"🟢 Stage 3\nVision"}}:::stage3
    CV["OpenCV\nscene keyframes"]:::proc
    VIS["Vision LLM\ncaption + tag"]:::ai
    DB3["INSERT\nkeyframes"]:::store
    BUS3["EventBus emit\nstage=vision"]:::be

    BUS2 --> S3
    S3 --> CV
    CV -->|top-N frames| VIS
    VIS -->|caption · tags · event| DB3
    DB3 --> BUS3

    S4{{"🟠 Stage 4\nSummary"}}:::stage4
    LLM["Text LLM\nmap-reduce summarise"]:::ai
    DB4["INSERT summary\n+ events"]:::store
    BUS4["EventBus emit\nstage=done"]:::be

    BUS3 --> S4
    S4 --> LLM
    LLM -->|overview · key_points\nchapters · events| DB4
    DB4 --> BUS4
    BUS4 -->|broadcast completion| WS
    WS -->|render summary tabs| UI

    classDef actor  fill:#1e293b,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef fe     fill:#7c3aed,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef be     fill:#059669,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef ingest fill:#0891b2,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef proc   fill:#d97706,stroke:#000000,stroke-width:3px,color:#000000,font-weight:bold
    classDef ai     fill:#db2777,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef store  fill:#4338ca,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef stage1 fill:#7c3aed,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold
    classDef stage2 fill:#0891b2,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold
    classDef stage3 fill:#059669,stroke:#000000,stroke-width:4px,color:#ffffff,font-weight:bold
    classDef stage4 fill:#d97706,stroke:#000000,stroke-width:4px,color:#000000,font-weight:bold
```

---

## LLM Provider Auto-Failover

```mermaid
flowchart TD
    Start([Input: chat_json or chat_text]):::startend --> Chain{Select provider}:::decision

    Chain -->|1 - Try Gemini first| G["Google Gemini"]:::gemini
    G -->|success| Done([Return result]):::startend
    G -->|429 quota exceeded| GR["Cool-off model\n6h to 24h backoff"]:::warn
    GR --> GN{More Gemini\nmodels available?}:::decision
    GN -->|yes| G
    GN -->|no| TryGroq{GROQ_API_KEY set?}:::decision

    Chain -->|2 - Try Groq| TryGroq
    TryGroq -->|yes| Q["Groq\nllama-3.3-70b-versatile"]:::groq
    Q -->|success| Done
    Q -->|fail| QR["Cool-off then try\nllama-3.1-8b\nthen gemma2-9b"]:::warn
    QR --> QN{Any Groq\nmodel OK?}:::decision
    QN -->|yes| Q
    QN -->|no| TryOAI{OPENAI_API_KEY set?}:::decision

    TryGroq -->|no| TryOAI
    TryOAI -->|yes| O["OpenAI\ngpt-4o-mini"]:::openai
    O -->|success| Done
    O -->|fail| Stub
    TryOAI -->|no| Stub(["Stub response\noffline demo"]):::stub

    classDef startend  fill:#1e293b,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef decision  fill:#fbbf24,stroke:#000000,stroke-width:3px,color:#000000,font-weight:bold
    classDef gemini    fill:#4285f4,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef groq      fill:#7c3aed,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef openai    fill:#059669,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef warn      fill:#f97316,stroke:#000000,stroke-width:3px,color:#000000,font-weight:bold
    classDef stub      fill:#dc2626,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold

    linkStyle 0  stroke:#94a3b8,stroke-width:3px,color:#ffffff
    linkStyle 1  stroke:#4285f4,stroke-width:3px,color:#ffffff
    linkStyle 2  stroke:#059669,stroke-width:3px,color:#ffffff
    linkStyle 3  stroke:#f97316,stroke-width:3px,color:#ffffff
    linkStyle 4  stroke:#f97316,stroke-width:3px,color:#ffffff
    linkStyle 5  stroke:#4285f4,stroke-width:3px,color:#ffffff
    linkStyle 6  stroke:#94a3b8,stroke-width:3px,color:#ffffff
    linkStyle 7  stroke:#7c3aed,stroke-width:3px,color:#ffffff
    linkStyle 8  stroke:#7c3aed,stroke-width:3px,color:#ffffff
    linkStyle 9  stroke:#059669,stroke-width:3px,color:#ffffff
    linkStyle 10 stroke:#f97316,stroke-width:3px,color:#ffffff
    linkStyle 11 stroke:#f97316,stroke-width:3px,color:#ffffff
    linkStyle 12 stroke:#7c3aed,stroke-width:3px,color:#ffffff
    linkStyle 13 stroke:#94a3b8,stroke-width:3px,color:#ffffff
    linkStyle 14 stroke:#94a3b8,stroke-width:3px,color:#ffffff
    linkStyle 15 stroke:#059669,stroke-width:3px,color:#ffffff
    linkStyle 16 stroke:#059669,stroke-width:3px,color:#ffffff
    linkStyle 17 stroke:#dc2626,stroke-width:3px,color:#ffffff
    linkStyle 18 stroke:#dc2626,stroke-width:3px,color:#ffffff
```

---

## Live Stream Pipeline

```mermaid
flowchart LR
    Start([POST /api/live]):::startend --> Session["LiveSession task"]:::backend
    Session --> Loop{running?}:::decision
    Loop -->|yes| Chunk["yt-dlp\ngrab N-sec chunk"]:::ingest
    Chunk --> Frames["OpenCV\nkeyframes"]:::process
    Chunk --> Audio["faster-whisper\ntranscribe"]:::process
    Frames --> Vision["Gemini Vision\ncaption frame"]:::ai
    Audio --> Roll["LLM\nrolling_summary"]:::ai
    Vision --> Roll
    Roll --> Save[("Persist\ntranscript · frames\nevents · summary")]:::storage
    Save --> Emit["EventBus\nto WebSocket"]:::backend
    Emit --> UI["UI updates\nLive tab"]:::frontend
    Save --> Loop
    Loop -->|stopped| End([Cleanup + finalise]):::startend

    classDef startend  fill:#1e293b,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef decision  fill:#fbbf24,stroke:#000000,stroke-width:3px,color:#000000,font-weight:bold
    classDef ingest    fill:#0891b2,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef process   fill:#d97706,stroke:#000000,stroke-width:3px,color:#000000,font-weight:bold
    classDef ai        fill:#db2777,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef backend   fill:#059669,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef storage   fill:#4338ca,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold
    classDef frontend  fill:#7c3aed,stroke:#000000,stroke-width:3px,color:#ffffff,font-weight:bold

    linkStyle 0  stroke:#059669,stroke-width:3px,color:#ffffff
    linkStyle 1  stroke:#059669,stroke-width:3px,color:#ffffff
    linkStyle 2  stroke:#fbbf24,stroke-width:3px,color:#000000
    linkStyle 3  stroke:#0891b2,stroke-width:3px
    linkStyle 4  stroke:#0891b2,stroke-width:3px
    linkStyle 5  stroke:#db2777,stroke-width:3px
    linkStyle 6  stroke:#db2777,stroke-width:3px
    linkStyle 7  stroke:#db2777,stroke-width:3px
    linkStyle 8  stroke:#4338ca,stroke-width:3px
    linkStyle 9  stroke:#059669,stroke-width:3px
    linkStyle 10 stroke:#7c3aed,stroke-width:3px
    linkStyle 11 stroke:#fbbf24,stroke-width:3px,stroke-dasharray:6,color:#ffffff
    linkStyle 12 stroke:#94a3b8,stroke-width:3px,color:#ffffff
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