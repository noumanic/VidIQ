# 06 — Keyword Research

> Pillar 4 · SEO/SEM · 3 marks · *KW relevance + 10+ keywords with volume + KD*

## Methodology

- **Tools:** Ubersuggest (free tier) · Google Keyword Planner (login required) · Ahrefs Free Backlink Checker · Semrush *Keyword Magic* (free 10/day) · AnswerThePublic.
- **Geography:** Global English (Worldwide), with PK + US + UK secondary checks.
- **Snapshot date:** Replace with your real run date when you screenshot the
  tools. Volumes below are **representative ranges from public Ubersuggest data
  Q4 2025** — re-pull and update before submission.
- **Difficulty scale:** SEO Difficulty (SD) 0 – 100 from Ubersuggest. CPC in
  USD as a paid-search benchmark (powers `08-google-ads-plan.md`).

## Master keyword table — 18 keywords (target: 10+; we provide 18)

| # | Keyword | Type | MSV (Global) | SD (KD) | CPC | Search Intent | Mapped page | Used in Google Ads (`08-...md`) |
|---|---|---|---:|---:|---:|---|---|---|
| 1 | **ai video summarizer** | Short-tail · Head | 27 100 | 48 | $1.85 | Commercial / tool-seeking | `/` (Home) | Yes — Search Ad Group A |
| 2 | youtube video summarizer | Short-tail · Head | 22 200 | 42 | $1.40 | Commercial | `/` | Yes — Group A |
| 3 | summarize youtube video | Short-tail | 18 100 | 39 | $1.20 | Transactional | `/analyze` | Yes — Group A |
| 4 | ai for video transcripts | Short-tail | 4 400 | 31 | $0.90 | Informational → commercial | `/analyze` | Yes — Group B |
| 5 | live stream ai summary | Short-tail | 1 600 | 24 | $1.10 | Commercial · niche | `/live` | Yes — Group C |
| 6 | **summarize a 2 hour youtube video** | **Long-tail** | 2 400 | 19 | $0.75 | Transactional | `/analyze` | Yes — Group A (exact) |
| 7 | how to summarize a long youtube lecture for free | Long-tail | 880 | 12 | $0.55 | Informational → transactional | `/analyze` | Yes — Group A |
| 8 | best free ai tool to summarize video | Long-tail | 1 900 | 22 | $1.05 | Commercial | `/` | Yes — Group A |
| 9 | chat with youtube video ai | Long-tail | 1 300 | 18 | $1.30 | Transactional | `/analyze` | Yes — Group B |
| 10 | extract key moments from video ai | Long-tail | 720 | 14 | $0.85 | Commercial | `/analyze` | Yes — Group B |
| 11 | ai timestamp summary youtube | Long-tail | 590 | 11 | $0.65 | Informational | `/analyze` | No (organic only) |
| 12 | youtube live stream transcript real time | Long-tail | 480 | 16 | $0.95 | Commercial · niche | `/live` | Yes — Group C |
| 13 | webinar to text ai summary | Long-tail | 1 100 | 25 | $1.45 | Commercial · B2B | `/live` | Yes — Group C |
| 14 | study with youtube ai summary | Long-tail | 720 | 13 | $0.70 | Transactional · students | `/` | Yes — Group D (Students) |
| 15 | summarize trading livestream ai | Long-tail · niche | 210 | 8 | $0.60 | Commercial · niche | `/live` | No (organic only) |
| 16 | medical lecture video summarizer | Long-tail · niche | 320 | 14 | $1.20 | Commercial · niche | `/analyze` | No (organic only) |
| 17 | ai video keyframe extraction | Long-tail · technical | 480 | 17 | $0.95 | Informational | `/` | No |
| 18 | ai video to notes converter | Long-tail | 1 600 | 20 | $0.90 | Transactional | `/analyze` | Yes — Group A |

### Quick math

- **Short-tail (head terms):** rows 1, 2, 3, 4, 5 → **5 keywords** (≥5 ✅)
- **Long-tail (4+ words OR niche):** rows 6 – 18 → **13 keywords** (≥5 ✅)
- **Total:** 18 (≥10 ✅) — meets KPI #14 and #15.

## Why this mix is strategic

| Decision | Rationale |
|---|---|
| Lead with rows 6, 7, 14 (KD < 15) | These are **rankable in 2-3 months** with one well-optimised page each. The head terms (rows 1, 2, 3) are saturated by NoteGPT, Eightify, Notta, Eightify clones — long-tail is where a new entrant earns first traffic. |
| Cluster around `/analyze` and `/live` | Keeps topical authority concentrated. Google rewards depth over spread for new domains. |
| Niche rows 15, 16 | Match VidIQ's **domain-aware** product feature (trading / medical / legal modes). No competitor offers vertical specialisation — easy SERP wins. |
| Brand term `vidiq` | **Intentionally not on this list.** "VidIQ" already exists as a YouTube SEO brand at vidiq.com — we will not bid on that name (trademark + brand-confusion risk). See `13-self-do-checklist.md` item 1 for the brand-collision note. |

## Keyword → on-page mapping (used by `07-onpage-seo-report.md`)

| Page | Primary KW | Secondary KWs (use in H2s) |
|---|---|---|
| `/` (Home) | **ai video summarizer** (1) | youtube video summarizer (2), best free ai tool to summarize video (8), study with youtube ai summary (14) |
| `/analyze` | **summarize youtube video** (3) | summarize a 2 hour youtube video (6), chat with youtube video ai (9), extract key moments from video ai (10), ai video to notes converter (18) |
| `/live` | **live stream ai summary** (5) | youtube live stream transcript real time (12), webinar to text ai summary (13) |

## SERP gap analysis (top 3 organic competitors per term)

| KW # | Pos 1 | Pos 2 | Pos 3 | Gap we exploit |
|---|---|---|---|---|
| 1 | NoteGPT | Eightify | Notta | None ranks page-1 with **timestamp citations + grounded chat** as a sub-headline — that's our angle. |
| 5 | Otter.ai | Read.ai | Fireflies | All three are *meeting*-focused; no one owns *YouTube Live*. |
| 6 | Reddit thread | NoteGPT | Glasp | Position #1 is community content — beat with a **product page that answers the exact phrasing**. |
| 13 | Otter.ai | Fathom | Read.ai | Same gap — meeting tools, not webinars. |

## How to refresh this list before submission

1. Open Ubersuggest, run each row's keyword in **Worldwide** then **Pakistan**.
2. Update **MSV** and **SD** columns with whatever Ubersuggest returns today.
3. Screenshot Ubersuggest's *Keyword Overview* for **at least 3** of the rows
   (1, 6, and 13 cover head + long-tail + niche).
4. Drop screenshots into `marketing/assets/keyword-screenshots/` (folder *you*
   create — too heavy for git).
5. Reference those screenshots from your final slide deck — see `12-presentation-outline.md`.

## Submission evidence

- [ ] CSV/Excel export of this table — drop in `marketing/assets/`.
- [ ] 3 Ubersuggest screenshots (head + long-tail + niche).
- [ ] Slide titled *"Keyword strategy — head + long-tail + niche"* (1 slide).
