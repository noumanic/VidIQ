# 04 — Meta Ads Campaign Plan

> Pillar 2 · Social Media Strategy · 3 marks (audience + ad-structure accuracy)
> Platform: **Meta Ads Manager** (Facebook + Instagram inventory)
>
> ## Showcase mode
>
> For the class project we are **not running live spend**. We build every
> campaign, ad set and ad creative in Ads Manager *up to the publish step*,
> then **save as draft** and **screenshot the Review/Summary page**. The
> brief explicitly asks for *"Screenshots of the Review/summary Section of
> Meta and Google Ads Campaign"* (see `data/New Text Document.txt` line 3) —
> that is the deliverable, not paid reach.
>
> The plan below is the *real* plan we would run if we were going live. The
> numbers, audiences and creative briefs are presented as-is.

## 1. Campaign architecture (CBO — Campaign Budget Optimisation)

```
🎯 Campaign: "VidIQ — Launch Q1"
   Objective: Traffic ➜ Landing-page views ➜ then Conversions (sign-up event) once 50 events/wk

   ├── Ad Set 1 — Students (FB + IG, Reels + Feed)
   │     Daily $5 · Lookalike + Interest stack
   ├── Ad Set 2 — Content Creators
   │     Daily $5 · Interest + Behaviour stack
   ├── Ad Set 3 — Knowledge Workers / Researchers
   │     Daily $5 · Interest + Job-title stack
   └── Ad Set 4 — Retargeting (warm)
         Daily $5 · Engaged-90d + LP-viewers-30d
```

Total **daily budget: $20 · 14-day flight = $280** *(see `09-budget.md`)*.

## 2. Objective ladder

| Phase | Days | Objective | Why |
|---|---|---|---|
| **Learn** | D1–D7 | **Traffic → Landing Page Views** | Cheaper data while pixel learns. |
| **Optimise** | D8–D14 | **Conversions → "Started Analysis"** custom event | Once we have ≥50 weekly LP views, pivot to direct sign-up optimisation. |

**Bid strategy:** **Highest Volume** (default) for first 7 days. Switch to
**Cost Per Result Goal $1.50** in Week 2 once CPR baseline is established.

**Attribution window:** **7-day click, 1-day view** (Meta default since iOS 14).

## 3. Audiences

### Ad Set 1 — Students 🎓

| Lever | Setting |
|---|---|
| Locations | Pakistan, India, Bangladesh, Sri Lanka, Egypt, Nigeria, Philippines (English-speaking, high education-spend, Tier-2 CPM) |
| Age | 18 – 26 |
| Gender | All |
| Languages | English |
| Detailed targeting | Interests: *Khan Academy, Coursera, edX, MIT OpenCourseWare, Notion, Quizlet, Anki, Obsidian* · Behaviours: *Engaged shoppers* · Education: *Currently in college / university* |
| Lookalike | LAL 1 % off `Pixel: started_analysis` (once available) |
| Exclusions | Existing customers (custom audience: page admins, email list) |
| Placements | **IG Reels, IG Feed, FB Reels, FB Feed** — manual placement (no Audience Network) |
| Optimisation event | LP View → switch to *StartedAnalysis* in Wk 2 |

### Ad Set 2 — Content Creators 🎥

| Lever | Setting |
|---|---|
| Locations | US, UK, Canada, Australia, UAE, Pakistan, India |
| Age | 22 – 40 |
| Detailed targeting | Interests: *YouTube creator economy, Descript, Riverside.fm, OBS Studio, Final Cut, DaVinci Resolve, Premiere Pro, MrBeast, Ali Abdaal* · Behaviours: *Small business owners* |
| Placements | **IG Reels (primary), IG Feed, FB Reels** |

### Ad Set 3 — Knowledge Workers 💼

| Lever | Setting |
|---|---|
| Locations | US, UK, Canada, Germany, Singapore, UAE, Pakistan |
| Age | 25 – 45 |
| Job titles | *Product Manager, Researcher, Analyst, Consultant, Software Engineer, Data Scientist* |
| Interests | *Notion, Linear, Slack, Loom, Otter.ai, Read.ai, MIT Tech Review* |
| Placements | **FB Feed, IG Feed, FB Right Column, Messenger Inbox** |

### Ad Set 4 — Retargeting 🔁

| Lever | Setting |
|---|---|
| Custom Audience 1 | *Visited /analyze in last 30 days but did not start analysis* |
| Custom Audience 2 | *Engaged with our IG/FB page in last 90 days* |
| Custom Audience 3 | *Watched ≥75 % of any video ad in last 30 days* |
| Exclusions | Already converted (`StartedAnalysis` last 30d) |
| Frequency cap | 1 / day |
| Placements | All Meta surfaces |

## 4. Creative plan

| # | Concept | Format | Size | Source |
|---|---|---|---|---|
| C1 | *"You hit play on a 90-min video…"* | 30 s vertical Reel | 1080×1920 | `02-video-ad-script.md` master cut |
| C2 | 15 s cutdown — opens on dashboard | 15 s vertical Reel | 1080×1920 | Same shoot, F3-onward |
| C3 | Square 6 s bumper — feed scroll | 6 s 1:1 | 1080×1080 | F3 → F6 |
| C4 | Carousel: *"Before / After 90-min lecture"* | 4-card carousel | 1080×1080 | New static |
| C5 | Static: *"Cramming season? Read your lecture in 47 seconds."* | 1080×1350 | New static | Targets Ad Set 1 only |
| C6 | UGC-style: a student talking to camera | 20 s vertical | 1080×1920 | *To shoot — see self-do checklist* |

**Creative rotation:** Each ad set runs **3 creatives** in Advantage+ Creative
auto-optimisation. Refresh creative every **7 days** to fight ad fatigue
(monitor Frequency > 2.5 → swap).

## 5. Copy bank — feed primary text

> Use exactly one **"problem → product → CTA"** structure. Caps at 125 chars
> visible above the *See more* fold; full copy ≤500 chars.

**Copy A — Students**
> *Pasted a 2-hour lecture into VidIQ this morning. Was reading the timestamped
> chapters in 47 seconds. Try it free →*
> CTA button: **Learn more**

**Copy B — Creators**
> *Researching your next video? Drop the source URL — VidIQ pulls a
> transcript, keyframes, and a chat that cites the exact moment of every
> claim. Free.*
> CTA button: **Sign up**

**Copy C — Knowledge workers**
> *2-hour webinar on Friday. You have 5 minutes. VidIQ summarises any video,
> with timestamp citations behind every claim.*
> CTA button: **Get offer** *(no actual offer — used as soft CTA)*

**Copy D — Retargeting**
> *Still thinking about it? Your first analysis is free. No credit card. No
> install. Just a URL.*
> CTA button: **Sign up**

## 6. Tracking & events (planned — showcase only)

> **Showcase mode:** we present the Pixel + CAPI plan in slides as the
> measurement layer that *would* run if we went live. We do **not** install
> the Pixel in the deployed site for the demo (no real ads = no events to
> capture). This section becomes a *"how we'd measure success"* slide in the
> deck, not a live integration.

Pixel + CAPI architecture (per the lecture *"Leads Centre, Meta Pixels and
CAPI"* in `data/Course_Content`):

| Event | When fired (frontend) | Pixel call |
|---|---|---|
| `PageView` | All pages | `fbq('track', 'PageView')` |
| `ViewContent` | `/analyze` page mounts | `fbq('track', 'ViewContent', { content_name: 'analyze_form' })` |
| `Lead` | "Start analysis" button click — *before* the API mutation | `fbq('track', 'Lead')` |
| **`StartedAnalysis` (custom)** | Mutation success (200) — also sent via **CAPI** server-side from FastAPI for iOS 14+ resilience | `fbq('trackCustom', 'StartedAnalysis', { video_url, domain })` |
| `CompleteRegistration` | Future: when auth ships | — |

> *If the team chooses to install Pixel later:* add a `<Script id="fb-pixel">`
> block to `frontend/src/app/layout.tsx`, gated on `NEXT_PUBLIC_META_PIXEL_ID`.
> Fire the custom `StartedAnalysis` event from the `onSuccess` of the
> `useMutation` in `frontend/src/app/analyze/page.tsx`.

## 7. KPI targets — first 14 days

| Metric | Target | Why |
|---|---|---|
| CPM | < $4.00 | Tier-2 markets benchmark |
| CTR (link) | > 1.5 % | Strong creative threshold |
| CPC | < $0.30 | Below typical SaaS ($0.43 in Pakistan) |
| LP View rate | > 70 % | Site is Next.js — should be fast |
| `StartedAnalysis` CPA | < $1.50 | Soft conversion, free product |
| Frequency | < 2.5 | Above this → swap creative |

## 8. Welcome / auto-reply (ties into `05-social-templates.md`)

In **Meta Business Suite → Inbox → Automated responses**, enable the
*Instant reply* and *Away message* drafted in
[`05-social-templates.md`](./05-social-templates.md) — this is required
evidence for **KPI #9** (*Automated message / Welcome note*).

## 9. Submission checklist (for the rubric)

- [x] **Objective** ✅ — defined per phase (LP-views → Conversions)
- [x] **Budget** ✅ — $280 across 14 days, $20/day across 4 ad sets
- [x] **Bid strategy** ✅ — Highest Volume → Cost-per-result $1.50 in Wk 2
- [x] **Target audience** ✅ — 4 ad sets, each with location/age/interest/behaviour
- [x] **Creative** ✅ — 6 creatives, formats and sources mapped to Pillar 1 video
- [x] **Welcome/auto-message** ✅ — see `05-social-templates.md`
- [ ] **Review/Summary screenshots** — open Ads Manager, build all 4 ad sets to the *Review* step, screenshot each (see `13-self-do-checklist.md` B8–B9)
