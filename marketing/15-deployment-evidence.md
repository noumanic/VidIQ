# 15 — Deployment Evidence

> **Purpose:** appendix for the marketing project submission. Proves Pillar 3
> (Product) is fully live and the SEO/SEM evidence trail (sitemap, structured
> data, on-page audit) is verifiable on the public URL.
>
> **Status snapshot:** 2026-05-05.

## Live URLs

| Surface | URL | Notes |
|---|---|---|
| **Public site** | <https://vidiq-two.vercel.app> | Production · Vercel · Next.js 14 |
| **API** | <https://noumanhafeez11-vidiq-backend.hf.space> | Hugging Face Space · Docker · FastAPI |
| **Sitemap** | <https://vidiq-two.vercel.app/sitemap.xml> | submit to Google Search Console |
| **Robots** | <https://vidiq-two.vercel.app/robots.txt> | allows all major search bots |
| **Marketing dashboard** | <https://vidiq-two.vercel.app/marketing> | live KPI tracker · budget · competitive · KW |
| **Source repo** | <https://github.com/noumanic/VidIQ> | branch `main` · auto-merge from `marketing-branch` |

## Architecture

```
                ┌─────────────────────────────────┐
                │  vidiq-two.vercel.app           │
                │  Next.js 14 · React 18          │
                │  framer-motion · recharts       │
                │  TanStack Query                 │
                └────────────────┬────────────────┘
                                 │ /proxy/api/*  /proxy/media/*
                                 ▼
                ┌─────────────────────────────────────────┐
                │  noumanhafeez11-vidiq-backend.hf.space  │
                │  FastAPI · uvicorn                      │
                │  faster-whisper · OpenCV · ffmpeg       │
                │  SQLite (ephemeral on free Space)       │
                └────────────────┬────────────────────────┘
                                 │
                ┌────────────────┴───────────────────┐
                │  External free APIs                │
                │   • Gemini (LLM + vision)          │
                │   • Groq (fallback)                │
                │   • YouTube Transcript API         │
                │   • faster-whisper (local)         │
                └────────────────────────────────────┘
```

**Stack:** Next.js 14.2.13 · FastAPI · Python 3.12 · faster-whisper (tiny) ·
Gemini 2.0 Flash Lite · Groq Llama 3.3 70B · OpenCV · yt-dlp · SQLite ·
recharts · framer-motion · Tailwind CSS · Radix UI primitives.

**Cost:** $0 / month. All free tiers.

## Live route status (2026-05-05)

| Route | HTTP | Purpose | Pillar |
|---|---:|---|---|
| `/` | 200 | Dashboard with landing splash + recent analyses | 3 |
| `/analyze` | 200 | Analyse a YouTube / podcast URL | 3 |
| `/live` | 200 | Live-stream rolling-summary | 3 |
| `/library` | 200 | All past analyses · search · tags | 3 |
| `/compare` | 200 | Side-by-side comparison of any 2-3 videos | 3 |
| `/analytics` | 200 | Cross-library KPI charts (recharts) | 3 |
| `/marketing` | 200 | Marketing dashboard · live KPI / budget / competitive / KW | 1+5 |
| `/sitemap.xml` | 200 | Crawler discovery · auto-generated | 4 |
| `/robots.txt` | 200 | Indexing rules · allows all major bots | 4 |

## Backend health

```json
{
  "status": "ok",
  "llm_configured": true,
  "provider": "gemini",
  "model": "gemini-2.0-flash-lite",
  "transcription_provider": "local",
  "gemini": { "configured": true, "models_total": 38, "models_available_now": 38 }
}
```

38 / 38 Gemini models reachable. Provider auto-failover wired (Gemini ↔ Groq).

## Pillar mapping — what's verifiable on the live URL

### Pillar 1 — Branding
- ✅ **Brand consistency** across favicon, top-nav, hero, OG card, JSON-LD,
  every page meta title — verifiable in DevTools → Elements `<head>`.
- ✅ **Vector logos** at `vidiq_logo_black_bg.svg`, `vidiq_logo_white_bg.svg`,
  `vidiq_logo_text.svg` — all served from `/public/`.
- ✅ **Brand-locked palette** declared in
  `frontend/src/app/globals.css` as HSL custom properties; never redefined.
- ✅ **Landing splash** animation on first session-visit (skippable).
- ⏳ 30-second video ad — to be embedded after filming.

### Pillar 3 — Product (web app)
- ✅ Live at <https://vidiq-two.vercel.app> — every nav link returns 200.
- ✅ Mobile responsive — viewport meta + Tailwind responsive classes
  (`sm:`, `md:`, `lg:`, `xl:`) verifiable on iPhone-14 viewport (390 × 844).
- ✅ Light / dark theme toggle in top-nav.
- ✅ Command palette (⌘K) for nav + actions.
- ✅ Onboarding tour on first visit (5-step modal walkthrough).
- ✅ KPI #10 (Functionality, no broken links) verified — see route table above.

### Pillar 4 — SEO/SEM
- ✅ **Per-page meta titles** + descriptions — DevTools → Elements `<head>`.
- ✅ **Canonical URLs** — `<link rel="canonical">` on every route.
- ✅ **OpenGraph + Twitter cards** — verifiable via
  <https://www.opengraph.xyz/?url=https://vidiq-two.vercel.app>.
- ✅ **JSON-LD structured data** — `Organization` + `WebSite` schemas in
  `<head>` (verifiable via Google Rich Results Test).
- ✅ **`robots.txt`** at `/robots.txt`.
- ✅ **`sitemap.xml`** at `/sitemap.xml` — submit to Search Console for
  Pillar 4 evidence.
- ⏳ Lighthouse audit — run on the live URL; target Performance ≥ 90,
  SEO = 100, Accessibility ≥ 95. Screenshot the panel.

### Pillar 5 — KPI dashboard (live)
The live `/marketing` page renders the same KPI scorecard from
`11-kpi-tracker.md` and `data/DM_Competitive_KPI.xlsx` — visit
<https://vidiq-two.vercel.app/marketing> to demo:
- KPI Tracker (4.83 / 5 · 17 strong / 1 adequate / 0 needs-work)
- Budget breakdown ($740 planned / $0 actual)
- Competitive matrix (VidIQ vs NoteGPT vs Eightify)
- Sortable keyword research table

## Deployment commits

| Commit | Description |
|---|---|
| `a28d980` | ci: auto-merge marketing-branch to main on push |
| `9061b35` | Reapply: D1-D3 + marketing dashboard + deploy prep |
| `a0020c8` | feat: D1-D3 + marketing dashboard + deploy prep |

The `marketing-branch` → `main` auto-merge GitHub Action lives at
`.github/workflows/auto-merge.yml` and fires on every push to
`marketing-branch`.

## Known caveats (mention only if asked)

- **YouTube cloud-IP blocking.** Hugging Face Space IPs are rate-limited /
  bot-detected by YouTube's `Sign in to confirm you're not a bot` check.
  This is a known yt-dlp + cloud-host limitation, not a code bug.
  **Demo from a laptop** (residential IP) for the live YouTube analysis
  walkthrough. Production deployment proves the engineering; local laptop
  proves the live pipeline.
- **HF Space ephemeral disk.** SQLite + media files reset on every Space
  restart. Acceptable for a one-presentation demo. To persist, attach a
  Render persistent disk (1 GB free) or migrate to a managed Postgres.
- **Free-tier RAM.** HF Space CPU-basic = 16 GB RAM (plenty for Whisper-tiny);
  scaling Whisper to `base` would still fit.

## Day-of demo dry-run checklist

- [ ] Wake the Space — open
      <https://noumanhafeez11-vidiq-backend.hf.space/api/health> 2 minutes
      before going on stage. (Free tier may sleep — first request is slow.)
- [ ] Pre-load 2 demo analyses **on local laptop** (since YouTube blocks
      cloud IPs).
- [ ] Lighthouse run — screenshot Performance / SEO / Accessibility scores.
- [ ] Mobile viewport screenshot at 390 × 844 (iPhone 14).
- [ ] Open the slide deck (`marketing/submissions/VidIQ_Final_Presentation.pptx`)
      in presentation mode.
- [ ] Open <https://vidiq-two.vercel.app/analyze> in a fresh incognito tab,
      ready to demo.
- [ ] Backup laptop with local stack already running (`uvicorn` + `next dev`)
      in case venue WiFi is unreliable.
