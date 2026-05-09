# 16 — Execution Playbook (Pillars 2 & 4)

> Single working document for clicking through everything. Pull rubric
> evidence as you go — every Phase tells you exactly which screenshot to
> grab and which slide it lands on.
>
> **Time estimate:** ~10 hours total, do over 2 days.

---

## Phase 1 — Create the Facebook Page (15 min)

Open <https://www.facebook.com/pages/create>. Sign in with the Facebook
account that should own this page (use a personal account — Facebook
requires it).

### Page basics

| Field | Value |
|---|---|
| **Page name** | `VidIQ` *(if taken try: `VidIQ.app`, `VidIQ AI`, `VidIQ — Video Intelligence`)* |
| **Category** *(Facebook auto-suggests as you type)* | Pick **`Software`** as primary, then add **`Internet company`** + **`Productivity tool`** as additional categories *(you can have up to 3)* |
| **Description** *(255 char cap — fits 252)* | `Multimodal AI that turns any YouTube video or live stream into a transcript, time-stamped summary, keyframes, and a chat that cites the exact moment of every claim. Free, no card, no install. Just paste a URL → get the answer.` |

Click **Create Page**. You're in the page dashboard.

### Profile picture (square, used as avatar everywhere)

- Click the camera icon over the round avatar slot.
- Upload `frontend/public/vidiq_logo_black_bg.svg` (or `.png` if FB rejects SVG).
- Position so the asterisk is centered. Save.

### Cover photo (1640 × 856 px on desktop, crops on mobile)

Generate with Adobe Firefly using this prompt — see Phase 4 for the full Firefly briefing.

**Prompt for cover:**
> *"Wide cinematic banner, 1640x856. Dark midnight background (#0a0612) with violet (#a855f7) and fuchsia (#ec4899) aurora glow. A soft 3D glass card centered showing a YouTube-like video thumbnail morphing into clean typography lines (representing transcript). Subtle white grid pattern overlaid at low opacity. Tagline 'Watch less. Learn more.' set in a humanist sans-serif (like Plus Jakarta Sans) bottom-center, white, 60pt. Wordmark 'VidIQ' top-left, gradient violet to fuchsia. Flat illustrative style, no photorealism, no people. Negative: cluttered, generic stock photos, vector clip art."*

### About section (settings → Page info → Edit)

| Field | Value |
|---|---|
| **Username** | `vidiq.app` *(this becomes facebook.com/vidiq.app)* |
| **Website** | `https://vidiq-two.vercel.app` |
| **Email** | `support@vidiq.app` *(or your real address)* |
| **Phone** | leave blank for showcase |
| **Location** | leave blank — purely digital |
| **Hours** | Tick **"Always open"** |
| **Bio (101 char)** | `Multimodal AI for video. Paste a YouTube link → get a transcript, summary & grounded chat. Free.` |

Save. Now click **Switch Now** to the Page profile.

### Sub-tasks before screenshotting

1. Add a **Call-to-action button** under the cover: choose **"Try Now"** → URL `https://vidiq-two.vercel.app/analyze`.
2. Pin a welcome post (any of the D1 captions from Phase 5 below) to the top of the timeline.

### Screenshot for the deck (slide 7 evidence)

- Take a clean desktop screenshot of the page **after profile + cover + CTA + pinned post are all set**.
- Save to `marketing/assets/screenshots/fb-page.png`.

---

## Phase 2 — Create Instagram Business + link to Page (10 min)

1. On a phone, open **Instagram** → **Settings → Account → Switch to Professional Account → Business**.
2. Profile name: `VidIQ` · username: `vidiq.app` (or whichever variant is free).
3. Connect to your **Facebook Page** when prompted (this enables Business Suite cross-posting).
4. Set the **Bio**:
   ```
   Multimodal AI for video.
   Paste a YouTube link → get a transcript, summary, grounded chat.
   ↓ Try free
   ```
   Plus the link: `vidiq-two.vercel.app`
5. Profile picture: same square logo.
6. Category: **Software / Tech & Internet**.

### Screenshot for the deck

- Save `marketing/assets/screenshots/ig-profile.png` (mobile screenshot, 9:16).

---

## Phase 3 — Welcome message + auto-replies (KPI #9 — 30 min)

Open **Meta Business Suite** → <https://business.facebook.com> → select your VidIQ page → **Inbox → Automated responses**.

### 3a. Greeting message (Messenger + IG DM)

Copy verbatim from `05-social-templates.md` §1:

```
👋 Hi, {{first_name}} — welcome to VidIQ.

We turn any YouTube video or live stream into a transcript, timestamped summary, and a chat you can ground every answer in.

Reply with the link of any video and we'll show you. Or try it now → vidiq-two.vercel.app/analyze

(A real human picks up here Mon–Fri, 10 AM – 6 PM PKT.)
```

→ **Screenshot the configured Greeting** as `marketing/assets/screenshots/auto-greeting.png`.

### 3b. Away message

```
Thanks, {{first_name}} 🌙 — we're away right now and reply within 24 hours.

Don't wait for us — paste any video URL into vidiq-two.vercel.app/analyze and you'll have a full analysis in under a minute. (Free. No card.)
```

→ Screenshot as `auto-away.png`.

### 3c. FAQ shortcuts (set up at least 3 — use 7 from `05-social-templates.md` §3)

For each, click **Create your own FAQ**:

| Trigger phrases | Auto-reply |
|---|---|
| `price, pricing, cost, free` | `VidIQ runs on free-tier APIs (Google Gemini + Groq) — your first analyses cost you nothing. We'll announce paid plans before any pricing change.` |
| `how does it work, how it works` | `Three steps: 1️⃣ paste a YouTube URL · 2️⃣ we transcribe + analyse keyframes + summarise · 3️⃣ you read, chat, and click any timestamp to seek. Demo: vidiq-two.vercel.app` |
| `live, stream` | `Yes — vidiq-two.vercel.app/live runs rolling summaries on YouTube Live, webinars and lectures.` |
| `safe, data, privacy` | `Your video URLs and analyses are stored in your account only. We don't redistribute or train models on your content.` |
| `contact, support, human` | `Hi 👋 we're handing this off to a human — please give us a moment, or email support@vidiq.app.` |

→ Screenshot the FAQ list as `auto-faq.png`.

### 3d. Saved replies (5 templates from `05-social-templates.md` §4)

In **Inbox → Saved replies** create one entry for each:

- **Compliment:** `Appreciate that 🙏 — try it on the longest video on your watch-later: vidiq-two.vercel.app/analyze`
- **How (curious):** `Short answer: speech-to-text + vision-LLM + map-reduce summarise. Long answer: we wrote it up — DM "how" and we'll send the deep-dive.`
- **Sceptical:** `Fair! Drop us a video URL and we'll send back the analysis — judge for yourself.`
- **Tag-a-friend:** `😄 hope they don't have a 4-hour podcast queued. They can paste it here → vidiq-two.vercel.app/analyze`
- **Feature request:** `Logging this — what's the dream? Live transcript export, speaker diarisation, something else?`

→ Screenshot as `saved-replies.png`. **All 4 screenshots together = KPI #9 evidence**, slide 9.

---

## Phase 4 — Adobe Firefly image prompts (1 hour)

Adobe Firefly free tier: <https://firefly.adobe.com>. Sign in with an Adobe ID.
Use **Generate Image → Custom** → set Aspect ratio + Style for each.

### Brand visual rules (paste into every prompt as a suffix)

```
Style: clean modern flat illustration, dark midnight background #0a0612, violet accent #a855f7, fuchsia accent #ec4899, cyan highlight #06b6d4, glass-morphism cards, subtle aurora glow, plus-jakarta-sans typography, never photorealistic, never stock-photo people, no clutter.
```

### 8 image briefs you'll need (5 posts + 3 ads)

Use as the *core prompt*, then append the brand-rules suffix.

| ID | Asset | Aspect | Core prompt |
|---|---|---|---|
| `IMG-1` | D2 Carousel slide 1 — "AI doesn't watch — it does this" | 1:1 | A stylised diagram: a video filmstrip (left) flowing into three layered icons — a soundwave, an eye, and a brain — flowing right into clean typography text lines. Soft glow underneath each step. |
| `IMG-2` | D3 Single image — "Cramming for exams" | 4:5 | A laptop screen mid-air with a 90-minute lecture timeline visible, one section glowing violet. Above the laptop, a clean callout card showing 6 bullet points labelled "Chapter 1, Chapter 2…". Subtle floating clock with hands spinning. |
| `IMG-3` | D5 Meme — "Me: I'll watch it later. Video, 2 hours later: still unwatched." | 1:1 | Stylised illustration of a paused YouTube-like player with a thick layer of dust and a cobweb on it. Violet/fuchsia glow underneath. Text overlay split top/bottom. |
| `IMG-4` | D7 Carousel — "5 video genres VidIQ is best at" | 1:1 | Five glass cards in a row, each with a tiny icon (graduation cap, microphone, candlestick chart, stethoscope, gavel). Each card glows in a different brand accent. |
| `IMG-5` | D11 Quote card | 4:5 | A quote-mark in violet, large, with text "I cut my lecture-review time from 2 hours to 8 minutes." in white. Attribution "— Beta tester, MS-CS" small below. Clean centered layout. |
| `IMG-6` | Meta Ad C4 — Before/After 90-min lecture | 1:1 | Split screen: left side a long scrubbed video timeline labelled "BEFORE — 90:00", right side a tidy chapter list labelled "AFTER — 6 chapters · 47s read". Connecting arrow violet→fuchsia gradient. |
| `IMG-7` | Meta Ad C5 — "Cramming season? Read your lecture in 47 seconds." | 4:5 | A textbook open with light leaking out of it, transforming into clean digital text bullets floating above. A small countdown timer in the corner reading "00:47". |
| `IMG-8` | FB Page cover (Phase 1) | 1640×856 (custom) | Already specified in Phase 1 cover-photo section. |

> **Save outputs** to `marketing/assets/firefly/` named `IMG-1.png` … `IMG-8.png`.

---

## Phase 5 — Schedule the 28 posts in Business Suite Planner (1 hour)

Open **Business Suite → Planner → + Create Post**. For each row below, paste
the **caption + hashtag stack** into both FB and IG. Attach the linked image
asset. **Set publish date 1 year in the future** so nothing actually publishes
during the showcase. Toggle "Post to Facebook + Instagram" both ON.

Hashtag stacks (use one per post — all from `05-social-templates.md` §5):

- **Stack A — Students:** `#StudyHack #StudyTok #StudentTips #ExamSeason #LectureNotes #AIForStudents #NoteTaking #VidIQ #AIVideoIntelligence`
- **Stack B — Creators:** `#ContentCreator #ContentResearch #CreatorEconomy #YouTubeTips #VideoMarketing #AItools #VidIQ #AIVideoIntelligence`
- **Stack C — Knowledge workers:** `#Productivity #ProductivityTools #AItools #FutureOfWork #DeepWork #KnowledgeWork #VidIQ #AIVideoIntelligence`

### The 28 posts (14 days × 2 channels — same post cross-posted)

| # | Day | Format | Caption (paste verbatim) | Hashtag stack | Asset |
|---|---|---|---|---|---|


| 14 | D14 Sun | Single image + Story poll | `Trading streams. Crypto streams. Earnings calls. Same engine.\n\nWhat should we cover next? Vote in Story.` | C | Brand graphic + poll sticker |

For days **15–28** (the IG copies of D1–D14): **same captions**, **same images**, just toggle "Post to Instagram" when scheduling. Business Suite will treat the 28 posts as a queued list — that's exactly what KPI #5 + #6 evidence requires.

### Screenshot for KPI #5 evidence

- Once all 28 are scheduled, switch the Planner to **Calendar view** showing the full 14-day grid with thumbnails.
- Save as `marketing/assets/screenshots/planner-calendar.png` → slide 7.

---

## Phase 6 — Build Meta Ads campaign to Review (3 hours)

Open <https://business.facebook.com/adsmanager>. **Create → Campaign**.

> ⚠ **Stop at the Review screen for every ad set. Do NOT click *Publish*.**
> Meta will only ask for a payment method on Publish — Review is free to reach.

### 6.1 Campaign-level settings

| Field | Value |
|---|---|
| **Campaign name** | `VidIQ — Launch Q1` |
| **Buying type** | **Auction** |
| **Objective** | **Traffic** *(switch to Conversions in Wk 2)* |
| **Special Ad Categories** | None |
| **Campaign Budget Optimisation (CBO)** | **ON** |
| **Daily budget** | **$20.00** |
| **Bid strategy** | **Highest volume** *(default)* |
| **Schedule** | Start D1 of your launch · End +14 days |

Click **Next**.
  
### 6.2 Ad Set 1 — Students 🎓

| Field | Value |
|---|---|
| **Ad set name** | `Students — South Asia 18-26` |
| **Conversion location** | Website |
| **Pixel** | `VidIQ Pixel` *(if not created, click Create — name: VidIQ_Pixel — skip install for showcase)* |
| **Performance goal** | **Maximise number of landing-page views** |
| **Budget split** | leave default ($5/day inferred from CBO) |
| **Schedule** | Inherit from campaign |
| **Locations** | Pakistan, India, Bangladesh, Sri Lanka, Egypt, Nigeria, Philippines |
| **Age range** | 18 – 26 |
| **Gender** | All |
| **Languages** | English (UK), English (US) |
| **Detailed targeting → Interests** | Khan Academy · Coursera · edX · MIT OpenCourseWare · Notion · Quizlet · Anki · Obsidian (notes app) |
| **Detailed targeting → Behaviours** | Engaged shoppers |
| **Detailed targeting → Demographics** | Education status: In college / In university |
| **Detailed targeting expansion** | OFF |
| **Placements** | **Manual placements** → tick: Facebook Reels, Facebook Feed, Instagram Reels, Instagram Feed *(everything else OFF)* |
| **Optimisation event** | Landing page views |

### 6.3 Ad Set 1 — Ad creative

Click **+ Create ad** under this ad set.

| Field | Value |
|---|---|
| **Ad name** | `Students — Reel C1 30s` |
| **Identity** | Facebook Page = VidIQ · Instagram = vidiq.app |
| **Format** | Single video |
| **Media** | Upload `02-video-ad-script.md` master cut (30s vertical, 1080×1920) |
| **Primary text** | `Pasted a 2-hour lecture into VidIQ this morning. Was reading the timestamped chapters in 47 seconds. Try it free →` |
| **Headline** | `Read your lecture in 47 seconds` |
| **Description** | `Multimodal AI · grounded citations · free tier` |
| **Website URL** | `https://vidiq-two.vercel.app/analyze?utm_source=meta&utm_medium=cpc&utm_campaign=students_lp` |
| **CTA button** | **Learn more** |
| **Languages** | English |

Add **two more ads** under the same ad set (Advantage+ rotation):
- **Ad 2:** `Students — Static C5` — image IMG-7 + headline `Cramming season?`
- **Ad 3:** `Students — Carousel C4` — 4-card carousel (IMG-6 + 3 derived) + same primary text

### 6.4 Ad Set 2 — Creators 🎥

Same process. Differences only:

| Field | Value |
|---|---|
| **Ad set name** | `Creators — Global EN 22-40` |
| **Locations** | US, UK, Canada, Australia, UAE, Pakistan, India |
| **Age** | 22 – 40 |
| **Interests** | YouTube creator economy · Descript · Riverside.fm · OBS Studio · Final Cut Pro · DaVinci Resolve · Premiere Pro · MrBeast · Ali Abdaal |
| **Behaviours** | Small business owners |
| **Placements** | Instagram Reels (primary), Instagram Feed, Facebook Reels |
| **Primary text** | `Researching your next video? Drop the source URL — VidIQ pulls a transcript, keyframes, and a chat that cites the exact moment of every claim. Free.` |
| **Headline** | `Research videos in 1/10th the time` |
| **CTA** | Sign up |

Same 3-ad rotation: Reel C1, Reel C2 (15s), Square C3 (6s bumper).

### 6.5 Ad Set 3 — Knowledge Workers 💼

| Field | Value |
|---|---|
| **Ad set name** | `Knowledge — Global Senior 25-45` |
| **Locations** | US, UK, Canada, Germany, Singapore, UAE, Pakistan |
| **Age** | 25 – 45 |
| **Job titles** *(under Detailed Targeting → Demographics → Work)* | Product Manager · Researcher · Analyst · Consultant · Software Engineer · Data Scientist |
| **Interests** | Notion · Linear · Slack · Loom · Otter.ai · Read.ai · MIT Technology Review |
| **Placements** | Facebook Feed · Instagram Feed · Facebook Right Column · Messenger Inbox |
| **Primary text** | `2-hour webinar on Friday. You have 5 minutes. VidIQ summarises any video, with timestamp citations behind every claim.` |
| **Headline** | `Webinars in 5 minutes` |
| **CTA** | Get offer |

### 6.6 Ad Set 4 — Retargeting 🔁

| Field | Value |
|---|---|
| **Ad set name** | `Retarget — Warm 30/90` |
| **Custom Audience 1** | *Visited /analyze last 30 days, didn't start analysis* — needs Pixel installed (showcase: skip, leave the field set to "Will populate when Pixel fires") |
| **Custom Audience 2** | *Engaged Facebook page last 90 days* (this CAN be created without Pixel) |
| **Custom Audience 3** | *Watched ≥75% of any video ad last 30 days* |
| **Exclusions** | Already converted (StartedAnalysis 30d) |
| **Frequency cap** | 1 per day, 7 days |
| **Placements** | Advantage+ Placements (all) |
| **Primary text** | `Still thinking about it? Your first analysis is free. No credit card. No install. Just a URL.` |
| **CTA** | Sign up |

### 6.7 Stop at Review for each ad set

After filling each ad set's creative, click **Next → Review**. The Review/Summary page appears. **Take a screenshot** of each:

- `marketing/assets/screenshots/meta-ad-set-1-students.png`
- `marketing/assets/screenshots/meta-ad-set-2-creators.png`
- `marketing/assets/screenshots/meta-ad-set-3-knowledge.png`
- `marketing/assets/screenshots/meta-ad-set-4-retarget.png`

**Click Close (don't Publish).** Each ad set is now saved as draft. KPI evidence locked in. Slide 8.

---

## Phase 7 — Build Google Ads campaigns to Review (3 hours)

Open <https://ads.google.com>. Sign in. **+ New Campaign**.

> Same rule as Meta: stop at Review. Google asks for payment only on Publish.

### 7.1 Campaign 1 — Search (VidIQ — Brand Cluster)

**Campaign settings:**

| Field | Value |
|---|---|
| **Campaign type** | Search |
| **Objective** | Website traffic *(no conversion goal yet — switch to "Conversions" once Pixel fires)* |
| **Campaign name** | `VidIQ — Search — Brand Cluster` |
| **Networks** | Search **only** *(uncheck Search Partners + Display)* |
| **Locations** | All countries and territories *(then under Location options, add bid adjustments later)* |
| **Languages** | English |
| **Audience segments (observation)** | In-market: Education software · Productivity software |
| **Budget** | $5.00/day |
| **Bidding** | Maximise Conversions *(switch to Target CPA $1.50 once 30 conversions banked — note this in campaign settings as a memo)* |
| **Ad rotation** | Optimise *(default)* |
| **Devices** | All — desktop +0%, mobile +10%, tablet +0% |
| **Negative keyword list** | Create new list `VidIQ - Negatives` with: `vidiq.com` (exact), `youtube subscribers`, `youtube tags`, `tubebuddy`, `mr beast`, `mrbeast`, `gaming`, `entertainment` |

**Ad Group A — AI video summariser (head):**

| Match | Keyword |
|---|---|
| Phrase | `"ai video summarizer"` |
| Phrase | `"youtube video summarizer"` |
| Exact | `[summarize youtube video]` |
| Phrase | `"best free ai tool to summarize video"` |
| Phrase | `"ai video to notes converter"` |
| Exact | `[summarize a 2 hour youtube video]` |

Then click **Create RSA** (Responsive Search Ad):

- **Final URL:** `https://vidiq-two.vercel.app/analyze?utm_source=google&utm_medium=cpc&utm_campaign=search_brand`
- **Display path 1:** `analyze`  · **Display path 2:** `free`
- **Headlines (paste these 15, one per line — each ≤ 30 chars):**
  ```
  AI Video Summariser
  Summarise Any YouTube Video
  Read a 2-Hour Lecture in 1Min
  Free AI YouTube Summariser
  Timestamps + Chat with Video
  Drop a Link · Get Your Notes
  Multimodal AI · Free Tier
  Watch Less. Learn More.
  Powered by Gemini & Whisper
  Cite Every Claim · Time-Stamped
  Made for Students & Creators
  No Card · No Install
  Try VidIQ Free
  Summarise Any Video, Free
  AI Video Notes in Seconds
  ```
- **Descriptions (4 lines, ≤ 90 chars each):**
  ```
  Drop any YouTube URL — VidIQ delivers a transcript, summary, keyframes & chat. Free.
  Multimodal AI grounds every claim in the source. Time-stamped citations on every answer.
  Built on Gemini's free tier + local Whisper. No credit card. No install. Just paste.
  Trusted by students cramming lectures and creators researching their next video.
  ```

**Ad Group B — Chat / extract moments:**

Keywords:
| Match | Keyword |
|---|---|
| Phrase | `"chat with youtube video ai"` |
| Phrase | `"extract key moments from video ai"` |
| Phrase | `"ai for video transcripts"` |

RSA: same template as Ad Group A but swap headlines 5–8 for:
```
Chat With Any Video
Find the Exact Moment
AI That Cites Sources
Grounded Q&A on Any Video
```

**Ad Group C — Live + webinar:**

Keywords:
| Match | Keyword |
|---|---|
| Phrase | `"live stream ai summary"` |
| Phrase | `"webinar to text ai summary"` |
| Phrase | `"youtube live stream transcript real time"` |

RSA: change Final URL to `…/live?utm_…`. Swap headlines 5–8 for:
```
Live Stream Summaries
Real-Time Transcription
Rolling AI Summary
Webinars in Real Time
```

**Ad Group D — Students:**

Keywords:
| Match | Keyword |
|---|---|
| Phrase | `"study with youtube ai summary"` |
| Phrase | `"how to summarize a long youtube lecture for free"` |

RSA: swap headlines 5–8 for:
```
Lecture in 47 Seconds
Cram Smarter, Free
Made for Students
Read Lectures, Don't Watch
```

**Assets (campaign-level, apply to all 4 ad groups):**

- **Sitelinks (4):**
  - Analyse a video → `/analyze`
  - Live streams → `/live`
  - Library → `/library`
  - How it works → `/#features`
- **Callouts (6):** `No credit card · Multimodal AI · Time-stamped · Live + recorded · Built on Gemini · 100 % free tier`
- **Structured snippet (Header: Features):** `Transcripts, Summaries, Keyframes, Events, Chat with citations, Live streams`
- **Image asset:** Upload `vidiq_logo_white_bg.png` (square 1:1) + a 1200×628 PNG screenshot of the dashboard
- **Logo:** `vidiq_logo_black_bg.png` cropped 1:1

Click **Save and continue → Review**. Screenshot:
- `marketing/assets/screenshots/google-search-review.png`

### 7.2 Campaign 2 — YouTube In-Stream

**Campaign settings:**

| Field | Value |
|---|---|
| **Campaign type** | Video |
| **Goal** | Brand awareness and reach |
| **Sub-type** | Influence consideration *(skippable in-stream + Bumper)* |
| **Campaign name** | `VidIQ — YouTube — In-Stream` |
| **Budget** | $4.00/day |
| **Bidding** | Target CPM $4.00 |
| **Locations** | US, UK, Canada, Australia, Pakistan, India |
| **Languages** | English |
| **Inventory type** | Standard inventory |
| **Audience: Custom Intent** | Build from these search terms (one per line): `ai video summarizer`, `summarize youtube video`, `study with youtube ai summary`, `summarize a 2 hour youtube video`, `how to summarize a long youtube lecture for free` |
| **In-Market** | Education software · Online courses · Office productivity software |
| **Topics** | Education > Online Education · Education > Higher Education · Online Communities > YouTube |
| **Placements (whitelist)** | Khan Academy · MIT OpenCourseWare · Stanford · Y Combinator · Lex Fridman Podcast · MKBHD · Ali Abdaal |

**Ad creative:**

- **30-s skippable:** Upload master cut from `02-video-ad-script.md`
- **6-s bumper:** Upload C3 square cutdown
- **End screen:** Logo `vidiq_logo_black_bg.png` + URL `vidiq-two.vercel.app`
- **Companion banner (300×60):** Upload a banner with text "Try free →" (use Firefly to generate this if needed)
- **Final URL:** `https://vidiq-two.vercel.app?utm_source=google&utm_medium=video&utm_campaign=youtube_awareness`

Click **Save and continue → Review**. Screenshot:
- `marketing/assets/screenshots/google-youtube-review.png`

### 7.3 Campaign 3 — Performance Max (gated, but build to Review)

**Campaign settings:**

| Field | Value |
|---|---|
| **Campaign type** | Performance Max |
| **Conversion goal** | Sales / Leads (use Leads — placeholder, no actual conversions firing yet) |
| **Campaign name** | `VidIQ — PMax — Q1` |
| **Budget** | $6.00/day |
| **Bidding** | Maximise conversion value |
| **Locations** | US, UK, Canada, Pakistan |
| **Languages** | English |
| **Final URL expansion** | OFF *(locks LP to /analyze)* |

**Asset Group 1 — Students:**

- **Headlines (5):** `Read your lecture in 47 sec`, `Free AI YouTube Summariser`, `Made for Students`, `Cram Smarter, Free`, `Drop a Link · Get Notes`
- **Long headlines (5):** `Pasted a 2-hour lecture · was reading chapters in 47 seconds.`, `Multimodal AI · time-stamped citations on every answer.`, `Free Gemini-powered analysis · no card required.`, `Built for students cramming long-form video lectures.`, `Transcripts · summaries · keyframes · grounded chat.`
- **Descriptions (5, ≤ 90 chars):** Same 4 from Search RSA Ad Group A + a 5th: `Made for students. Free during launch. No credit card.`
- **Images (5):** IMG-2, IMG-5, IMG-6, IMG-7, dashboard screenshot
- **Logo (1):** `vidiq_logo_black_bg.png` 1:1
- **Video (1):** Master 30-s cut from Pillar 1

**Asset Group 2 — Creators** (same structure, swap copy/imagery toward the Creators audience).

**Asset Group 3 — Knowledge Workers** (same).

**Audience Signals (hint, not hard target):**
- *Custom Segment:* search terms KW 1, 2, 3, 6, 7, 14 from Ad Group A + URL signal `youtube.com/watch`

Click **Save and continue → Review**. Screenshot:
- `marketing/assets/screenshots/google-pmax-review.png`

---

## Phase 8 — Capture all screenshots + populate the deck (30 min)

Final folder structure your `marketing/assets/screenshots/` should contain:

```
fb-page.png                     ← Phase 1, slide 7
ig-profile.png                  ← Phase 2, slide 7
auto-greeting.png               ← Phase 3a, slide 9
auto-away.png                   ← Phase 3b, slide 9
auto-faq.png                    ← Phase 3c, slide 9
saved-replies.png               ← Phase 3d, slide 9
planner-calendar.png            ← Phase 5, slide 7
meta-ad-set-1-students.png      ← Phase 6, slide 8
meta-ad-set-2-creators.png      ← Phase 6, slide 8
meta-ad-set-3-knowledge.png     ← Phase 6, slide 8
meta-ad-set-4-retarget.png      ← Phase 6, slide 8
google-search-review.png        ← Phase 7.1, slide 12
google-youtube-review.png       ← Phase 7.2, slide 12
google-pmax-review.png          ← Phase 7.3, slide 12
```

Open `marketing/submissions/VidIQ_Final_Presentation.pptx` in PowerPoint or
Canva. Replace the `[ Screenshot of … ]` placeholder text on slides 7, 8, 9, 12
with each PNG. Save.

## Final rubric checklist

| KPI | Evidence | Status after this playbook |
|---|---|---|
| #5 — Content Calendar Coverage | `planner-calendar.png` | ✅ |
| #6 — Post Type Variety | 4 formats visible in Planner | ✅ |
| #7 — Meta Ads Strategy Completeness | 4 Review screenshots | ✅ |
| #8 — Target Audience Definition Quality | Each Meta ad set screenshot has location/age/interest/behaviour | ✅ |
| #9 — Automated Message / Welcome | 4 auto-reply screenshots | ✅ |
| #14, 15, 16 — Keyword + on-page + KW data | already locked in (Phase 4 of `13-self-do-checklist.md`) | ✅ |
| #17 — Google Ads Strategy Completeness | 3 Google review screenshots | ✅ |
| #18 — Ad Creative Brand Alignment | All ad creatives use Pillar 1 visuals | ✅ |

> **Time on the clock:** Phase 1 ~15 min · Phase 2 ~10 min · Phase 3 ~30 min · Phase 4 ~1 h · Phase 5 ~1 h · Phase 6 ~3 h · Phase 7 ~3 h · Phase 8 ~30 min.
> **Total:** ~9.5 hours over 2 days.
