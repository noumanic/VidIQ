# 08 — Google Ads Campaign Plan

> Pillar 4 · SEO/SEM · 3 marks · *Campaign type · Objective · Budget · Audience · Creative*
>
> Built off the keyword research in [`06-keyword-research.md`](./06-keyword-research.md). Every keyword cited by row number.
>
> ## Showcase mode
>
> Same approach as `04-meta-ads-plan.md`: every campaign, ad group and RSA is
> built in Google Ads Manager up to the *Review and publish* step, **saved
> as draft**, and the **Summary screen is screenshotted**. The brief asks
> for *"Screenshots of the Review/summary Section of Meta and Google Ads
> Campaign"* — that is the deliverable. We do not run live spend.

## 1. Account structure

```
🏢 Google Ads Account: vidiq.app
   ├── 📣 Campaign 1: VidIQ — Search — Brand Cluster (Sitelinks Hub)
   │     Type: Search · Objective: Website Traffic
   │     Budget: $5/day · Bid: Maximise Conversions (cap CPA $1.50)
   │     ├── Ad Group A: "AI video summariser" head
   │     ├── Ad Group B: "Chat with video / extract moments"
   │     ├── Ad Group C: "Live + webinar summary"
   │     └── Ad Group D: "Students — long-tail"
   │
   ├── 🎬 Campaign 2: VidIQ — YouTube — In-Stream
   │     Type: Video · Objective: Brand awareness & reach
   │     Budget: $4/day · Bid: Target CPM
   │
   └── 🌐 Campaign 3: VidIQ — Performance Max (after 50 conv/wk)
         Type: Performance Max · Objective: Conversions
         Budget: $6/day · Bid: Maximise Conversion Value
```

**Total daily: $15 · 14-day flight: $210** *(see `09-budget.md`)*.

## 2. Campaign 1 — Search

### 2.1 Settings

| Lever | Value | Why |
|---|---|---|
| Campaign type | **Search** | Lowest-funnel intent at the cheapest CPC for our keyword set. |
| Networks | Search only — **Search partners OFF, Display Network OFF** | Quality control — Display network skews low-intent for SaaS. |
| Locations | **Worldwide English** with bid-down adjustments: Tier-3 markets +0 %, US/UK/CA +20 % | Cheap impressions where audience exists, premium bid where conversion value is highest. |
| Languages | English | Product is English-first. |
| Audiences (observation) | *Custom Segment 1*: searched "summarize video" / "youtube summary" in last 30d. *In-market*: Education software · Productivity software. | Adds bid signal without restricting reach. |
| Bid strategy | **Maximise Conversions** with Target CPA $1.50 (after 30 conversions banked) | Auto-bidding works once Google has signal. |
| Conversion action | "StartedAnalysis" — primary; "PageView /analyze" — secondary | Same event used by Meta Pixel / CAPI. |
| Ad rotation | "Optimise" (default) | Lets Google rotate towards better-performing creatives. |
| Devices | All — bid +0 % desktop, +10 % mobile | Mobile is where students search. |
| Negative keywords | `vidiq.com` (exact) — vidiq.com is a YouTube SEO brand, do not poach the term · also: `youtube subscribers`, `youtube tags`, `tubebuddy`, `mr beast` | Prevents brand-confusion + irrelevant clicks. |

### 2.2 Ad groups, keywords, match types

#### Ad Group A — *AI video summariser (head)*

Keywords (from `06-keyword-research.md`):

| Match type | Keyword |
|---|---|
| Phrase | `"ai video summarizer"` *(KW 1)* |
| Phrase | `"youtube video summarizer"` *(KW 2)* |
| Exact | `[summarize youtube video]` *(KW 3)* |
| Phrase | `"best free ai tool to summarize video"` *(KW 8)* |
| Phrase | `"ai video to notes converter"` *(KW 18)* |
| Exact | `[summarize a 2 hour youtube video]` *(KW 6)* |

#### Ad Group B — *Chat / extract moments*

| Match | Keyword |
|---|---|
| Phrase | `"chat with youtube video ai"` *(KW 9)* |
| Phrase | `"extract key moments from video ai"` *(KW 10)* |
| Phrase | `"ai for video transcripts"` *(KW 4)* |

#### Ad Group C — *Live + webinar*

| Match | Keyword |
|---|---|
| Phrase | `"live stream ai summary"` *(KW 5)* |
| Phrase | `"webinar to text ai summary"` *(KW 13)* |
| Phrase | `"youtube live stream transcript real time"` *(KW 12)* |

#### Ad Group D — *Students*

| Match | Keyword |
|---|---|
| Phrase | `"study with youtube ai summary"` *(KW 14)* |
| Phrase | `"how to summarize a long youtube lecture for free"` *(KW 7)* |

### 2.3 Responsive Search Ads — copy

Each Ad Group uses **15 headlines + 4 descriptions** with `{KeyWord:VidIQ}` dynamic insertion.

#### RSA template — Ad Group A

**Final URL:** `https://vidiq.app/analyze?utm_source=google&utm_medium=cpc&utm_campaign=search_brand&utm_content={creative}&utm_term={keyword}`
**Display path:** `vidiq.app/analyze`

**Headlines (30 chars each)**
1. {KeyWord:AI Video Summariser}
2. Summarise Any YouTube Video
3. Read a 2-Hour Lecture in 1 Min
4. Free AI YouTube Summariser
5. Timestamps + Chat with Video
6. Drop a Link · Get Your Notes
7. Multimodal AI · Free Tier
8. Watch Less. Learn More.
9. Powered by Gemini & Whisper
10. Cite Every Claim · Time-Stamped
11. Made for Students & Creators
12. No Card · No Install
13. Try VidIQ Free
14. Summarise Any Video, Free
15. AI Video Notes in Seconds

**Descriptions (90 chars each)**
1. Drop any YouTube URL — VidIQ delivers a transcript, summary, keyframes & chat. Free.
2. Multimodal AI grounds every claim in the source. Time-stamped citations on every answer.
3. Built on Gemini's free tier + local Whisper. No credit card. No install. Just paste.
4. Trusted by students cramming lectures and creators researching their next video.

#### Ad-group-specific overrides

- **Group B** swaps headlines 5, 6, 8 → *"Chat With Any Video"*, *"Find the Exact Moment"*, *"AI That Cites Sources"*.
- **Group C** swaps headlines → *"Live Stream Summaries"*, *"Real-Time Transcription"*, *"Rolling AI Summary"*. Final URL → `/live`.
- **Group D** swaps headlines → *"Lecture in 47 Seconds"*, *"Cram Smarter, Free"*, *"Made for Students"*.

### 2.4 Sitelink, callout, and structured assets

| Asset type | Examples |
|---|---|
| **Sitelinks (4)** | *Analyse a video →* (`/analyze`) · *Live streams →* (`/live`) · *Library →* (`/library`) · *How it works →* (`/#features`) |
| **Callouts (6)** | *No credit card · Multimodal AI · Time-stamped · Live + recorded · Built on Gemini · 100 % free tier* |
| **Structured snippet** (Header: *Features*) | Transcripts, Summaries, Keyframes, Events, Chat with citations, Live streams |
| **Image asset** | `vidiq_logo_white_bg.png` (square) + a screen-recording GIF turned into 1200×628 PNG |
| **Logo** | `vidiq_logo_black_bg.png` cropped to 1:1 |

## 3. Campaign 2 — YouTube In-Stream

### Settings

| Lever | Value |
|---|---|
| Campaign type | **Video → Awareness & reach** |
| Format | Skippable in-stream + Bumper (6 s) |
| Bid | **Target CPM $4** |
| Locations | US, UK, Canada, AU, PK, IN |
| Audience | Custom Intent (built from KWs 1, 2, 3, 6, 7, 14) + In-Market: *Education software, Online courses, Office productivity tools* |
| Topics | *Education > Online Education*, *Education > Higher Education*, *Online Communities > YouTube* |
| Placements | YouTube videos with these channels: *Khan Academy, MIT OpenCourseWare, Stanford, Y Combinator, Lex Fridman Podcast, MKBHD, Ali Abdaal* (whitelist for relevance + brand-safe) |

### Creative

- **30-s skippable** = master cut from `02-video-ad-script.md`
- **6-s bumper** = `C3` square cutdown
- **End screen** = logo + URL `vidiq.app`
- **Companion banner** = 300×60 with primary CTA *"Try free"*

## 4. Campaign 3 — Performance Max (gated)

> Only switch on **after** *StartedAnalysis* hits **30 conversions in 7
> rolling days**. Until then, PMax doesn't have signal and will burn budget.

| Lever | Value |
|---|---|
| Asset groups | *Students*, *Creators*, *Knowledge workers* — each with 5 headlines, 5 long headlines, 5 descriptions, 5 images, 1 logo, 1 video |
| Audience signals (hint, not hard target) | *Custom Segment*: search history of KW 1, 2, 3, 6, 7, 14 + URL signal: visited *youtube.com/watch* |
| Bid | **Maximise Conversion Value** with no tCPA cap (PMax handles it) |
| Final URL expansion | **OFF** — locks landing page to `/analyze` |

## 5. Tracking parameters (UTM)

Every Final URL appends:

```
?utm_source=google
&utm_medium=cpc
&utm_campaign={campaignname}        # search_brand | youtube_awareness | pmax_q1
&utm_content={adgroupname}_{creative}
&utm_term={keyword}                 # auto-replaced by Google
```

Conversions land in **GA4** via the `gtag('event', 'started_analysis')`
firing from `frontend/src/app/analyze/page.tsx` `onSuccess` (same hook as the
Meta CAPI event in `04-meta-ads-plan.md`).

## 6. KPI targets — first 14 days

| Metric | Target | Tier-2 SaaS benchmark |
|---|---|---|
| Search CTR | > 6 % | (industry: 3.4 %) |
| Search CPC | < $0.40 | (KW set median: $0.95) |
| Conversion rate | > 4 % | (3.7 % avg) |
| Search CPA | < $1.50 | (matches Meta) |
| YouTube view rate | > 25 % | (avg: 22 %) |
| YouTube CPV | < $0.020 | (avg: $0.026) |

## 7. Submission checklist (per the brief)

- [x] **Campaign type** ✅ — Search · Video · Performance Max
- [x] **Objective** ✅ — per-campaign (Traffic · Awareness · Conversions)
- [x] **Budget** ✅ — $15/day, $210 total — distributed in `09-budget.md`
- [x] **Target audience** ✅ — keyword themes + In-Market + Custom Segments + Topic + Placement whitelist
- [x] **Creative** ✅ — 4 RSAs · 30-s + 6-s YouTube · PMax asset groups, all referencing Pillar 1 visuals
