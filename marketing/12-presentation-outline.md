# 12 — Final Presentation Outline

> 25 marks total · 10 of those are *Presentation / Q&A* · this slide deck targets all 25.
>
> Format: **15 slides + 1 backup** · 12 – 15 minutes presented · 5 – 10 minutes Q&A.
> Submission format: PDF + PPTX (per brief — *"submitted in soft form"*).

## Slide-by-slide blueprint

| # | Slide title | Pillar | Key visual | Speaker notes (≤30 s) | Rubric line |
|---|---|---|---|---|---|
| 1 | **VidIQ — AI Video Intelligence** | Cover | LogoSplash on dark hero · *"Watch less. Learn more."* | Open with the *"You hit play on a 90-min video…"* hook from the ad. | — |
| 2 | **The job-to-be-done** | Problem | Stat: *"500 h of video uploaded to YouTube every minute"* + *"avg watch time per session: 17 min"* | Problem framing — long-form video is unread. | — |
| 3 | **The product** | Pillar 3 | Live screen-record of the dashboard (30 s loop) | Demo: paste a URL → summary tabs. | Pillar 3 |
| 4 | **Multimodal pipeline** | Pillar 3 | Architecture diagram (re-render `README.md` Mermaid) | Speech + vision + LLM = one pipeline. | Pillar 3 |
| 5 | **Brand identity** | Pillar 1 | 4-up: logo files + colour swatches + type sample + voice slider | Why violet (trust + creativity), why Plus Jakarta Sans (humanist geometric). | Pillar 1 |
| 6 | **The ad — 30-second teaser** | Pillar 1 | Embed video. Story-arc bar across the bottom. | Hook → product → proof → CTA. | Pillar 1 |
| 7 | **Social strategy & calendar** | Pillar 2 | Screenshot: Meta Business Suite Planner with all 14 posts scheduled | Cadence, content pillars, hashtag stacks. | Pillar 2 |
| 8 | **Meta Ads plan** | Pillar 2 | Funnel diagram of 4 ad sets + 6 creatives | Objective ladder, audiences, creative rotation. | Pillar 2 |
| 9 | **Always-on conversation** | Pillar 2 | Screenshot: welcome message + auto-reply | Drives KPI #9. | Pillar 2 |
| 10 | **Keyword strategy** | Pillar 4 | Heatmap of 18 KWs by KD × MSV (Excel chart) | Long-tail-first, vertical-niche bets. | Pillar 4 |
| 11 | **On-page SEO audit** | Pillar 4 | DevTools `<head>` screenshot + Lighthouse score panel | Meta · alt · headers · keywords. | Pillar 4 |
| 12 | **Google Ads plan** | Pillar 4 | Account-tree diagram (campaign → ad group → ad) | 3 campaigns, $15/day, conversion event chain. | Pillar 4 |
| 13 | **Where the dollars go** | Pillar 5 | Donut: $740 split into 6 categories (from `09-budget.md`) | Justify the 38 / 28 / 16 / 7 / 8 / 3 split. | Pillar 5 |
| 14 | **Competitive landscape** | Pillar 5 | 3-col table: VidIQ vs NoteGPT vs Eightify (followers, pricing, gaps) | Owned moats: live + multimodal + verticals. | Pillar 5 |
| 15 | **KPI scorecard 17/18 strong** | Pillar 5 | Coloured 6×3 grid from `11-kpi-tracker.md` | 4.83 / 5 self-assessment, with KPI #3 to close. | Pillar 5 |
| 16 (backup) | **Q&A backup: how citations work** | Defence | Animation: chat answer → highlighted transcript moment → seek arrow | Pulled out only if asked. | Q&A |

## Pacing target

```
0:00 – 0:30   Slide 1   Hook
0:30 – 2:00   Slides 2–4 The product (DEMO LIVE)
2:00 – 4:00   Slides 5–6 Branding + ad
4:00 – 6:30   Slides 7–9 Social + Meta Ads
6:30 – 9:00   Slides 10–12 SEO + Google Ads
9:00 – 11:00  Slides 13–14 Budget + Competition
11:00 – 12:00 Slide 15 KPI close
12:00+        Q&A
```

## Q&A defence prep

Likely instructor questions and pre-built answers:

| Q | A in one sentence |
|---|---|
| *"Why violet, not blue?"* | Blue is the SaaS default — violet retains blue's trust association while signalling creativity and AI; cf. Mehta-Zhu (2009). |
| *"Why both Meta Pixel and CAPI?"* | iOS 14 broke client-side pixel reliability; CAPI fires server-side from FastAPI on the same `started_analysis` event for resilience. |
| *"Why long-tail keywords first?"* | Domain authority of 1 — head terms are unrankable in 14 days. Long-tail (KD < 15) is achievable with a single optimised page each. |
| *"How do you compete with YouTube's own AI summary?"* | Three durable moats: live-stream support, multimodal grounding with citations, vertical-domain modes. YouTube's summary is generic and not yet citation-grounded. |
| *"What's the biggest risk?"* | Free-tier API tightening from Gemini or Groq. Provider abstraction (`backend/app/services/llm.py`) auto-fails over so a single revocation doesn't break us. |
| *"Plagiarism check?"* | Every section of every deliverable was authored by us with citations to public source links — see footers of `06-keyword-research.md` and `10-competitive-analysis.md`. |

## Slide design rules (so the deck looks branded)

- **Background:** brand dark `#0a0612` (or pure white if printing).
- **Headlines:** Plus Jakarta Sans 800, 64–80 pt.
- **Body:** Inter 500, 18–22 pt.
- **Code / numbers / timestamps:** JetBrains Mono.
- **Accent on key words:** the `text-gradient` violet→magenta gradient — *one* gradient word per slide max.
- **Logo:** lower-right corner of every interior slide, white-bg variant on dark backgrounds.
- **No more than 6 bullets per slide.**
- **Every slide footer:** *VidIQ · {Pillar # name} · {team-name}*.

## Submission checklist

- [ ] PPTX export using brand fonts embedded
- [ ] PDF export from same source
- [ ] All 15 slides + 1 backup present
- [ ] Pacing tested live, ≤ 12 minutes
- [ ] Each pillar has at least one slide
- [ ] KPI sheet (`11-kpi-tracker.md` + xlsx) printed and brought to defence
- [ ] Live demo URL working (verify the morning of)
