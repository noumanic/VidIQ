# 13 — What You Must Still Do Yourself (Showcase Mode)

> Honest list of every item that needs *human* action — restructured for
> **showcase mode**: deploy + demo + draft campaigns + slide deck. No live ad
> spend, no payment methods, no Pixel install, no real DAU.
>
> Tick `[x]` as you finish.

## ⭐ Top priority — without these, no showcase

| # | Task | Doc reference | Effort |
|---|---|---|---|
| ⭐1 | **Deploy frontend to Vercel + backend to Render** | `14-vercel-deployment.md` (full step-by-step) | 45 min |
| ⭐2 | **Shoot + edit the 30-second video ad** | `02-video-ad-script.md` §7 | 6–8 h |
| ⭐3 | **Build the slide deck** | `12-presentation-outline.md` | 8 h |
| ⭐4 | **Draft the Meta + Google Ads campaigns and screenshot Review pages** | `04-meta-ads-plan.md`, `08-google-ads-plan.md` | 4 h |
| ⭐5 | **Create the FB Page + IG + schedule 28 posts** | `03-content-calendar.md`, `05-social-templates.md` | 5 h |

## A. Branding & creative production *(Pillar 1)*

| # | Task | Why this is human-only | Effort |
|---|---|---|---|
| A1 | **Decide on the brand-collision** with vidiq.com (YouTube SEO tool). Options: keep the name and add `.app` suffix everywhere, or rebrand entirely. Document the decision in slide 5. | Strategic | 1 h |
| A2 | **Export the logo as an SVG** (the repo only has PNGs) — open the original Figma/Illustrator source file | Source files not in repo | 30 min |
| A3 | **Shoot the 30-second ad** per `02-video-ad-script.md` §7 — phone close-up, screen-cap of dashboard, face shot of laptop close | Filming, real footage | 4–6 h |
| A4 | **Edit the ad** in CapCut / Premiere / DaVinci — output 30 s + 15 s + 6 s + 10 s cutdowns | Human editing taste | 6–8 h |
| A5 | **Pick a music track** — YouTube Audio Library has many free, royalty-free options that work fine for a class project | Account, no $ needed | 30 min |
| A6 | **Record the voice-over** (38 words) — record in-team on a phone with a quiet room | Real human voice | 30 min |
| A7 | **Take 6 brand-consistency screenshots** for slide 5 of the deck — favicon, top-nav, hero, OG card preview, mobile view, ad end-card | Visual evidence | 1 h |

## B. Social media accounts and draft campaigns *(Pillar 2)*

| # | Task | Effort |
|---|---|---|
| B1 | **Create a Facebook Page** under VidIQ (or final brand from A1) | 15 min |
| B2 | **Create an Instagram Business** account, link to the FB Page | 15 min |
| B3 | **Set up Meta Business Suite** + verify the Page | 1 h |
| B4 | **Configure welcome / auto-reply** per `05-social-templates.md` §1–§3. Screenshot every config — KPI #9 evidence. | 1 h |
| B5 | **Schedule 28 posts** (14 days × 2 channels) in Business Suite Planner per `03-content-calendar.md`. *(They will sit in the queue but never publish if you set the schedule date for 1 year out — perfectly fine for showcase.)* | 4 h |
| B6 | **Screenshot the Planner calendar** with all 28 posts visible — KPI #5 evidence. | 5 min |
| B7 | **Open Meta Ads Manager** *(no payment method needed to reach the Review screen — Meta only asks for a card on the *Publish* click)* | 15 min |
| B8 | **Build all 4 ad sets** in Ads Manager per `04-meta-ads-plan.md` § 3 — interests, audiences, placements, creatives — **stop at the Review/Summary step. Do NOT click *Publish*.** | 3 h |
| B9 | **Screenshot the Review/Summary page of each ad set** *(this is the brief's exact deliverable — `data/New Text Document.txt` line 3)*. | 30 min |

## C. Product / website / app *(Pillar 3)*

| # | Task | Effort |
|---|---|---|
| C1 | **Get a free Gemini API key** — <https://aistudio.google.com/app/apikey> | 5 min |
| C2 | **Get a free Groq API key** (recommended) — <https://console.groq.com/keys> | 5 min |
| C3 | **Run the deployment** per `14-vercel-deployment.md` — push to GitHub, set up Render, set up Vercel, wire env vars | 45 min |
| C4 | **Smoke test:** open the Vercel URL, paste a 3-min YouTube video, watch the pipeline complete end-to-end | 15 min |
| C5 | **Click-through every page** in incognito; note any 404 or broken link. KPI #10 evidence. | 30 min |
| C6 | **Lighthouse / PageSpeed Insights** — run on the live `/`, screenshot scores. Target Performance ≥ 90, SEO = 100. | 30 min |
| C7 | **Mobile screenshot** at 390 px (iPhone 14). KPI #13 evidence. | 5 min |
| C8 | **Pre-load 2 demo videos** in `/library` (a 3-min lecture clip and a 6-min podcast highlight) so the dashboard isn't empty during the live demo | 15 min |

## D. SEO & Google Ads — drafts *(Pillar 4)*

| # | Task | Effort |
|---|---|---|
| D1 | **Re-run Ubersuggest** on every row in `06-keyword-research.md` — replace MSV / KD / CPC with today's numbers | 2 h |
| D2 | **Take 3 Ubersuggest screenshots** (1 head term + 1 long-tail + 1 niche) | 15 min |
| D3 | **Open Google Ads** account *(payment method optional — Google asks at the publish step, same as Meta)* | 15 min |
| D4 | **Build all 3 campaigns** per `08-google-ads-plan.md` — Search + YouTube + PMax — to the **Review** step. Save as draft. Do **not** click *Publish*. | 4 h |
| D5 | **Screenshot the Review/Summary page of each campaign** — brief deliverable line 3. | 30 min |
| D6 | **Submit `sitemap.xml`** to Google Search Console *(this is real and free; uses your live Vercel URL)* | 30 min |

## E. Competitive analysis & KPI sheet *(Pillar 5)*

| # | Task | Effort |
|---|---|---|
| E1 | **Refresh the data** in `10-competitive-analysis.md` — re-pull NoteGPT + Eightify followers, post-frequency, Similarweb traffic | 2 h |
| E2 | **Paste Sections A–D** into `data/DM_Competitive_KPI.xlsx` Sheet 1 | 30 min |
| E3 | **Paste self-assessment** from `11-kpi-tracker.md` into Sheet 2 (columns G + H only) | 15 min |
| E4 | **Visit the Meta Ad Library** (<https://adslibrary.meta.com>) and screenshot any active ad from NoteGPT — slide-14 evidence | 15 min |
| E5 | **Visit Similarweb / Moz Free** and screenshot the Domain Authority panel for both competitors | 15 min |

## F. Final presentation & submission

| # | Task | Effort |
|---|---|---|
| F1 | **Build the slide deck** per `12-presentation-outline.md` — 15 slides + 1 backup, brand fonts, brand colours | 8 h |
| F2 | **Embed the 30-second ad** on slide 6 | 10 min |
| F3 | **Live-demo dry-run** — VidIQ on the projector, paste a short YouTube video, watch it complete | 30 min |
| F4 | **Time the deck** — must hit 12–15 min. Cut the longest slide if you're over. | 1 h |
| F5 | **Export PPTX + PDF**, drop them in `marketing/submissions/` | 15 min |
| F6 | **Bring backup materials** — laptop with local stack already running (in case of WiFi failure), printed KPI sheet, the xlsx loaded | 30 min |
| F7 | **Rehearse Q&A** — defend each pillar in 1 sentence each, using `12-presentation-outline.md` Q&A defence prep | 1 h |

## What I (the AI) explicitly cannot do for you

These items require **real-world action** that no LLM can perform:

1. Filming, voice acting.
2. Creating real social-media accounts (you must own them).
3. Clicking through Ads Manager to reach the Review/Summary screen.
4. Capturing live data — Ubersuggest screenshots, Similarweb panels, Meta Ad Library.
5. Defending the project to your instructor in person.
6. Coordinating your group of 3–5 (Pillar coordination is a rubric line).

Everything else — strategy docs, copy, plans, audits, scripts, ad creative
briefs, KPI scoring, presentation outline, deployment guide — is in this
folder, ready to use.

## Suggested 7-day execution sprint *(showcase mode)*

```
Day 1   ⭐1 Deploy (C1-C4)            +  A1 brand-collision decision
Day 2   ⭐2 Shoot the 30-s ad (A3)
Day 3   ⭐2 Edit the ad (A4-A7)
Day 4   ⭐5 Social accounts + scheduled posts (B1-B6)
Day 5   ⭐4 Meta + Google draft campaigns (B7-B9, D3-D6)
Day 6   D1-D2, E1-E5, C5-C8           (audits + screenshots)
Day 7   ⭐3 Slide deck + dry-run (F1-F7)
```

Lock the timeline, divide the ⭐ items across the team's strongest members
(filming → most camera-comfortable, deck → most design-strong, deploy →
most code-comfortable), and you're ready.

## Showcase-mode quick reference card

| What the rubric asks for | What we deliver | Cost |
|---|---|---|
| Functional website | Live on Vercel + Render | $0 |
| 30-s video ad | Filmed + edited + uploaded to Reels | $0 (YT Audio Library music) |
| Social calendar | 28 posts queued in Business Suite Planner | $0 |
| Meta Ads plan | 4 ad sets built to Review, screenshotted | $0 |
| Google Ads plan | 3 campaigns built to Review, screenshotted | $0 |
| Welcome/auto-message | Configured + screenshotted | $0 |
| Keyword research | 18 KWs with Ubersuggest data + 3 screenshots | $0 (free tier) |
| On-page SEO report | Already built into the codebase + DevTools screenshots | $0 |
| Budget plan | Planned $740 budget — 6 categories — presented in slide | $0 |
| Competitive analysis | NoteGPT + Eightify, every column from the xlsx filled | $0 |
| KPI sheet | 17/18 KPIs Strong, xlsx Sheet 2 filled | $0 |
| Presentation | 15-slide deck + Q&A defence prep | $0 |
| **Total cash spend** | | **$0** |
