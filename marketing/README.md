# VidIQ — Digital Marketing Project Deliverables

This folder contains every written deliverable required by the **Digital Marketing
Project** brief, mapped to the four pillars of the rubric.

| # | Deliverable | Pillar | File |
|---|---|---|---|
| 01 | Brand Guide & Visual Identity | 1 — Branding | [`01-brand-guide.md`](./01-brand-guide.md) |
| 02 | 30-Second Video Ad — Script + Storyboard | 1 — Branding | [`02-video-ad-script.md`](./02-video-ad-script.md) |
| 03 | 14-Day Social Content Calendar (FB + IG) | 2 — Social | [`03-content-calendar.md`](./03-content-calendar.md) |
| 04 | Meta Ads Campaign Plan | 2 — Social | [`04-meta-ads-plan.md`](./04-meta-ads-plan.md) |
| 05 | Social Templates — Welcome, Auto-replies, Captions | 2 — Social | [`05-social-templates.md`](./05-social-templates.md) |
| 06 | Keyword Research (10+ keywords, KD, volume) | 4 — SEO/SEM | [`06-keyword-research.md`](./06-keyword-research.md) |
| 07 | On-Page SEO Report — VidIQ Website Audit | 4 — SEO/SEM | [`07-onpage-seo-report.md`](./07-onpage-seo-report.md) |
| 08 | Google Ads Campaign Plan | 4 — SEO/SEM | [`08-google-ads-plan.md`](./08-google-ads-plan.md) |
| 09 | Total Digital-Marketing Budget | 5 — Budget | [`09-budget.md`](./09-budget.md) |
| 10 | Competitive Analysis (NoteGPT, Eightify) | 5 — Competitive | [`10-competitive-analysis.md`](./10-competitive-analysis.md) |
| 11 | KPI Tracker — Self-Assessment | 5 — KPI | [`11-kpi-tracker.md`](./11-kpi-tracker.md) |
| 12 | Final Presentation Outline | Q&A defence | [`12-presentation-outline.md`](./12-presentation-outline.md) |
| 13 | What You Must Still Do Yourself | All | [`13-self-do-checklist.md`](./13-self-do-checklist.md) |
| 14 | Deployment Guide — Vercel + Render | Pillar 3 | [`14-vercel-deployment.md`](./14-vercel-deployment.md) |

> **Pillar 3 — Product (Website/App)** is the VidIQ web app itself, in `frontend/`
> and `backend/`. Branding from Pillar 1 has already been applied: logo, colour
> palette (violet/fuchsia), typography (Plus Jakarta Sans / Inter / JetBrains
> Mono), favicon, OpenGraph image, sitemap, robots, JSON-LD structured data,
> per-page meta titles and descriptions.
>
> **Showcase mode.** This project is presented and demoed — not commercially
> launched. We deploy the web app to Vercel + Render (both free), build all
> Meta + Google Ads campaigns in *draft / paused* state and screenshot the
> Setup pages, and run the full social calendar through Meta Business Suite
> Planner without paying for boosted reach. Everything maps to the marking
> rubric without spending a rupee on ads or a credit card on tools. See
> [`14-vercel-deployment.md`](./14-vercel-deployment.md) and
> [`13-self-do-checklist.md`](./13-self-do-checklist.md).

## How to use this folder

1. **Read the docs in order.** Each one is presentation-ready prose — paste
   directly into your slide deck or deliverables PDF.
2. **Open `13-self-do-checklist.md` first.** It lists every item that requires
   *you* (not the AI) to do something — recording the video ad, screenshotting
   live ad campaigns, posting to real social accounts, etc.
3. **Use `12-presentation-outline.md` to build your final slide deck** — it
   maps every slide to a marking rubric line item.

## Single-source-of-truth rules

- **Brand colours** live in `frontend/src/app/globals.css` (HSL custom
  properties). Don't redefine them anywhere else.
- **Brand voice & visuals** are codified in `01-brand-guide.md`. Ad copy in
  `04-meta-ads-plan.md` and `08-google-ads-plan.md` follow that voice.
- **Keyword strategy** in `06-keyword-research.md` powers both the on-page SEO
  in `07-onpage-seo-report.md` and the paid search ads in `08-google-ads-plan.md`
  — they cite each other by row number.
