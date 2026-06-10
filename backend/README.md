---
title: VidIQ Backend
emoji: 🎬
colorFrom: purple
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
short_description: AI video intelligence — transcript + summary + Q&A pipeline
license: mit
---

# VidIQ — Backend

FastAPI service that powers the VidIQ frontend (deployed on Vercel).
Pipeline: yt-dlp → faster-whisper → Gemini vision → grounded Q&A + summary.

This folder doubles as a **Hugging Face Space** (`sdk: docker`).
The frontmatter above is read by HF when this directory is pushed
to a Space repo. Locally + on Render the same Dockerfile works
because `CMD` honours `${PORT:-8000}`.

## Required environment variables

Set these in **Settings → Repository secrets** for the Space:

| Key | Value | Notes |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | |
| `GEMINI_API_KEY` | *your free Gemini key* | Primary key. You can also set numbered keys such as `GEMINI_API_KEY1`, `GEMINI_API_KEY2`, `GEMINI_API_KEY3`, etc. for automatic quota failover. |
| `GEMINI_MODEL` | `gemini-flash-latest` | or `gemini-2.0-flash-lite` |
| `GEMINI_VISION_MODEL` | `gemini-flash-latest` | |
| `GROQ_API_KEY` | *your free Groq key* | <https://console.groq.com/keys> — fallback |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | |
| `TRANSCRIPTION_PROVIDER` | `local` | uses faster-whisper |
| `WHISPER_LOCAL_MODEL` | `tiny` | bump to `base` if your Space has 8 GB+ RAM |
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/vidiq.db` | ephemeral on Space restart |
| `MEDIA_DIR` | `/app/media` | ephemeral; fine for demos |
| `CORS_ORIGINS` | *your Vercel URL, no trailing slash* | e.g. `https://vidiq.vercel.app` |

Optional YouTube authentication:

| Key | Value | Notes |
|---|---|---|
| `YTDLP_COOKIE_FILE` | `/app/secrets/cookies.txt` | Netscape-format cookies file for private/sign-in-gated videos |
| `YTDLP_COOKIES_TEXT` | *cookies.txt contents* | Use this as a Hugging Face secret when you cannot mount a cookie file |
| `YTDLP_COOKIES_FROM_BROWSER` | `chrome` or `firefox` | Local development only; hosted Docker spaces usually do not have a browser profile |
| `YOUTUBE_DOWNLOAD_MODE` | `auto` | `auto` tries transcripts/captions, then audio + Whisper fallback. Use `full` to also download video for frame analysis. Use `safe` to require upload/transcript. |

## Health check

`GET /api/health` returns provider status. Hit it once after a redeploy
to make sure the Space is wired correctly.
