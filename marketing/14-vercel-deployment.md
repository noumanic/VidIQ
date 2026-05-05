# 14 — Deployment Guide (Vercel + Render)

> The plan: **frontend on Vercel** (public showcase URL), **backend on Render
> free tier** (also free), **local laptop as backup** for demo day.
>
> Total cost: **$0**. Total time: **~45 minutes** end-to-end.

## Architecture in showcase mode

```
                                 ┌─────────────────────────────────┐
                                 │  Public showcase URL on Vercel  │
                                 │  https://vidiq.vercel.app       │
                                 │  (Next.js · static + SSR)       │
                                 └────────────────┬────────────────┘
                                                  │ proxied /proxy/api/* + /proxy/media/*
                                                  ▼
                              ┌───────────────────────────────────────┐
                              │  Backend on Render free tier          │
                              │  https://vidiq-backend.onrender.com   │
                              │  (FastAPI · uvicorn · ffmpeg · OpenCV)│
                              └────────────────────┬──────────────────┘
                                                   │
                                ┌──────────────────┴──────────────────┐
                                │  External free APIs                  │
                                │   • Gemini (LLM + vision)            │
                                │   • Groq (fallback)                  │
                                │   • YouTube Transcript API           │
                                │   • faster-whisper (local on Render) │
                                └─────────────────────────────────────┘
```

> Vercel **cannot** host the backend — FastAPI needs persistent processes,
> `ffmpeg`, OpenCV native libs, and yt-dlp downloads. Render handles all of
> that on its free tier.

## Step 1 — Push the repo to GitHub *(5 min)*

```powershell
cd "C:\Users\Nouman Hafeez\Desktop\VidIQ"
git init                                    # if not already
git add .
git commit -m "feat: marketing deliverables and SEO"
git branch -M main
git remote add origin https://github.com/<your-username>/vidiq.git
git push -u origin main
```

## Step 2 — Deploy backend to Render *(15 min)*

### 2.1 Create the service

1. Go to **<https://render.com>** → sign in with GitHub.
2. **New +** → **Web Service** → connect the `vidiq` repo.
3. Configure:

| Field | Value |
|---|---|
| Name | `vidiq-backend` |
| Region | Oregon (or closest to your audience) |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Docker *(uses your `backend/Dockerfile`)* |
| Instance Type | **Free** |

### 2.2 Environment variables

Click **Advanced** → **Add Environment Variable**:

| Key | Value |
|---|---|
| `LLM_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | *paste from <https://aistudio.google.com/app/apikey>* |
| `GEMINI_MODEL` | `gemini-flash-latest` |
| `GEMINI_VISION_MODEL` | `gemini-flash-latest` |
| `GROQ_API_KEY` | *paste from <https://console.groq.com/keys>* (optional but recommended) |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` |
| `TRANSCRIPTION_PROVIDER` | `local` |
| `WHISPER_LOCAL_MODEL` | `tiny` *(keep it small — Render free tier has 512 MB RAM)* |
| `DATABASE_URL` | `sqlite+aiosqlite:///./vidiq.db` |
| `MEDIA_DIR` | `./media` |
| `APP_HOST` | `0.0.0.0` |
| `APP_PORT` | `10000` |
| `CORS_ORIGINS` | *(set after Step 3 — your Vercel URL)* |

> **Render quirk:** the free tier expects port `10000`. The Dockerfile
> currently exposes `8000`; Render's HTTP layer doesn't actually need this to
> match — they detect the port from `$PORT`. If your service won't bind, edit
> `backend/Dockerfile`'s last line to:
> ```
> CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
> ```

4. Click **Create Web Service**. First build takes ~5–8 minutes (it's
   downloading ffmpeg + OpenCV + Whisper).
5. When the log shows `Application startup complete`, copy the URL — looks
   like `https://vidiq-backend.onrender.com`.

### 2.3 Smoke test

Open `https://vidiq-backend.onrender.com/api/health` — should return JSON
with `"status": "ok"` and your provider info.

### 2.4 Free-tier caveats (important for demo day)

- **Cold start:** Render free spins down after 15 min idle. First request
  after sleep takes **~30–45 s** to wake. *Mitigation:* hit the `/api/health`
  endpoint **2 minutes before your demo starts**.
- **Ephemeral disk:** SQLite + media files are wiped on every redeploy. For
  a 1-presentation demo this is fine. If you want persistence, attach a
  Render persistent disk (1 GB free) and mount it at `/app/media`.
- **RAM ceiling:** 512 MB. The `tiny` Whisper model fits; `base` won't.

## Step 3 — Deploy frontend to Vercel *(10 min)*

1. Go to **<https://vercel.com>** → sign in with GitHub.
2. **Add New** → **Project** → import the `vidiq` repo.
3. Configure:

| Field | Value |
|---|---|
| Framework Preset | **Next.js** *(auto-detected)* |
| Root Directory | `frontend` |
| Build Command | (leave default — `next build`) |
| Output Directory | (leave default — `.next`) |
| Install Command | `npm install --legacy-peer-deps` |

### 3.1 Environment variables

Click **Environment Variables**:

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `https://vidiq-backend.onrender.com` *(from Step 2)* | Production, Preview, Development |
| `NEXT_PUBLIC_SITE_URL` | `https://vidiq.vercel.app` *(set after first deploy — see Step 4)* | Production |

4. Click **Deploy**. First deploy: ~2 minutes.
5. When green, copy the URL — it'll be `https://<auto-name>.vercel.app`. You
   can rename it: **Project Settings → Domains → Edit** to claim
   `vidiq.vercel.app` if available.

## Step 4 — Wire the two together *(5 min)*

1. Go back to **Render → vidiq-backend → Environment** and set:
   - `CORS_ORIGINS` = `https://vidiq.vercel.app` *(your Vercel URL, no trailing slash)*
2. Render will redeploy automatically (~2 min).
3. Go to **Vercel → Settings → Environment Variables** and update:
   - `NEXT_PUBLIC_SITE_URL` = `https://vidiq.vercel.app` *(your real Vercel URL)*
4. Trigger a Vercel redeploy: **Deployments → … → Redeploy** *(needed so the
   new env var bakes into the build — `NEXT_PUBLIC_*` vars are inlined at
   build time)*.

### 4.1 End-to-end smoke test

1. Open `https://vidiq.vercel.app` in incognito → dashboard renders, logo
   shows, no console errors.
2. Open DevTools → Network → click **Analyse** in the nav → verify
   `/proxy/api/health` returns 200.
3. Paste a short YouTube URL (e.g. a 2-minute video) → submit → watch the
   pipeline run end-to-end.
4. **If the first request times out** → that's the Render cold start. Wait
   45 s, refresh, try again.

## Step 5 — Submit to search engines (optional, 5 min) — for real Pillar 4 evidence

1. **Google Search Console** → <https://search.google.com/search-console> →
   add property `https://vidiq.vercel.app`.
2. Verify via the **HTML tag** method (paste a meta tag into
   `frontend/src/app/layout.tsx` `metadata.other`, redeploy).
3. Submit `https://vidiq.vercel.app/sitemap.xml` under **Sitemaps**.
4. Bing Webmaster Tools → repeat with the same URL.
5. Screenshot the *"Sitemap submitted successfully"* panels for slide 11 of
   the deck (`12-presentation-outline.md`).

## Step 6 — Demo day prep

The **morning of** your presentation:

- [ ] Wake the backend: open `https://vidiq-backend.onrender.com/api/health`
- [ ] Click through `/`, `/analyze`, `/live`, `/library` — confirm no errors
- [ ] Pre-load **two test videos** in `/library` so the dashboard doesn't
      look empty during the live demo (suggest: a 3-min lecture clip and a
      6-min podcast highlight)
- [ ] Open the slide deck in **presentation mode** on your laptop
- [ ] Open `https://vidiq.vercel.app/analyze` in a fresh incognito tab,
      ready to demo
- [ ] **Backup plan:** have the local stack already running on your laptop
      (`uvicorn ... &` + `npm run dev`) so if WiFi fails you can switch the
      browser to `http://localhost:3000`

## Showcase-mode reminder

You are **not** required to:

- Run live ad spend on Meta or Google — just *build the campaign Setup pages
  and screenshot them* (see `marketing/13-self-do-checklist.md` items B8 & D4).
- Install Meta Pixel or GA4 — those are stretch goals only.
- Connect a payment method to either Ads Manager.

You **are** required to (for the rubric):

- Have a **deployed, working website** the instructor can click → covered by
  Steps 1–4 above.
- Have **brand consistency** between site, ads, video, calendar → already
  verified in `01-brand-guide.md` §8.
- Defend each pillar in Q&A → talking points in `12-presentation-outline.md`.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| 502 / 504 on `/proxy/api/*` | Render backend asleep | Hit `/api/health` directly to wake it |
| CORS error in browser console | `CORS_ORIGINS` doesn't match Vercel domain | Update Render env var; redeploy |
| OG image shows a broken icon on share | `NEXT_PUBLIC_SITE_URL` still localhost | Set to Vercel URL → **redeploy** (not just save) |
| `keytar` / native module build fails on Vercel | npm peer-dep mismatch | Set Install Command to `npm install --legacy-peer-deps` (Step 3) |
| Render build OOMs on Whisper download | Trying to load `base` or larger | Set `WHISPER_LOCAL_MODEL=tiny` |
| Live stream / long video kills Render free tier | RAM/CPU ceiling | Demo with videos **under 10 minutes** |
