# 01 — Brand Guide & Visual Identity

> Pillar 1 · Branding & Visual Identity · 3 marks

## 1. Brand essence

| | |
|---|---|
| **Brand name** | VidIQ |
| **Tagline** | *AI Video Intelligence* |
| **One-line promise** | Understand any video — recorded or live — in seconds. |
| **Category** | AI productivity tool · Video summarisation SaaS |
| **Audience** | Students, educators, researchers, knowledge workers, content creators, financial-market viewers, medical/legal professionals who consume long-form video. |

## 2. Brand values & personality

| Value | Translation in product | Translation in voice |
|---|---|---|
| **Clarity** | Time-stamped citations behind every claim. | Crisp, declarative, jargon-free. |
| **Speed** | Sub-minute analysis on free-tier APIs. | Direct verbs, short sentences. |
| **Trust** | Every chat answer cites a transcript moment. | Cites sources, never overclaims. |
| **Curiosity** | Multimodal — fuses speech + vision + LLM. | Uses words like *unlock, surface, ground.* |
| **Open** | Provider-agnostic, free-tier first. | Inclusive, never gate-keepy. |

**Personality on a slider:**
- Formal ◯─◯─●─◯─◯ Casual *(approachable but credible)*
- Serious ◯─●─◯─◯─◯ Playful *(restrained, not zany)*
- Corporate ◯─◯─◯─●─◯ Indie *(modern startup feel)*

## 3. Logo system

### 3.1 Files (already in `frontend/public/`)

| File | Use |
|---|---|
| `vidiq_logo_black_bg.png` | Primary mark on dark UI, favicon, app icons. |
| `vidiq_logo_white_bg.png` | Light backgrounds, OG/Twitter card, print, slides. |
| `vidiq_logo_text.png` | Horizontal lockup with wordmark — ideal for ad creatives, video end-cards, footer of long documents. |

### 3.2 Construction & rationale

- The mark is a **stylised "play head"** mid-glyph — communicating *video* without
  resorting to a literal play triangle.
- The wordmark splits **"Vid"** (sans, foreground) from **"IQ"** (gradient,
  emphasis) — putting the *intelligence* claim front-and-centre.
- The mark is square-balanced for use as an avatar on **Facebook, Instagram, X,
  LinkedIn, YouTube** (all of which crop to circle or square).

### 3.3 Clear-space and minimum sizes

- Maintain clear-space equal to **1× mark height** on all four sides.
- Minimum sizes: **24 px** digital favicon · **40 px** UI nav · **96 px** print.
- Never re-colour the mark; only ever use the supplied PNGs.

## 4. Colour palette & psychology

| Token | HSL | Hex | Role | Why this colour |
|---|---|---|---|---|
| `--background` (dark) | `265 35% 5%` | `#0a0612` | App canvas | A near-black with a violet undertone — feels like a cinema, not a spreadsheet. Reduces eye strain on long video sessions. |
| `--primary` | `270 91% 65%` | `#a855f7` | Brand violet | Violet sits at the intersection of **trust** (blue) and **creativity** (red). It's the colour of *insight* — fitting for an "intelligence" product. Used by Stripe, Twitch, Discord — proven SaaS familiarity without copying any of them. |
| Accent magenta | `310 80% 60%` | `#ec4899` | Gradient pair | Adds **energy and modernity**. The violet → magenta gradient signals *generative AI* (mirrors the visual language of GPT-4, Midjourney, Linear) without aping their exact hues. |
| Accent cyan | `195 90% 55%` | `#06b6d4` | Tertiary | Used sparingly for *live* signals and stat highlights. Its complement to violet creates depth without noise. |
| Success | `142 71% 45%` | `#22c55e` | "Ready" badges | Standard green, calibrated to feel less neon than Tailwind's default. |
| Warning | `25 95% 53%` | `#f97316` | Cool-off / quota | Orange = energy + caution — used when an API provider is rate-limited. |
| Live red | `0 84% 60%` | `#ef4444` | Live broadcast badge | Universally understood as *recording / on-air*. |

**Why violet, not blue?** Every SaaS uses blue. Violet retains blue's *trust*
association while signalling **creativity, premium, and AI** — the three
attributes our category demands. (Cf. colour-association studies: Mehta & Zhu,
2009; Labrecque & Milne, 2012.)

## 5. Typography

| Family | Weight | Use | Source |
|---|---|---|---|
| **Plus Jakarta Sans** | 700 (Bold), 800 (ExtraBold) | Headlines, display, hero | Google Fonts (open source) |
| **Inter** | 400, 500, 600 | Body copy, UI labels | Google Fonts |
| **JetBrains Mono** | 500 | Timestamps, code, pseudocode blocks | Google Fonts |

**Why this combination?**

- **Plus Jakarta Sans** is geometric, slightly humanist — readable at display
  sizes and feels modern without being austere (vs. Inter, which can read as
  utilitarian at large sizes).
- **Inter** is the most-tested SaaS body face on the web — it stays crisp at
  14 px and below, where the dashboard density lives.
- **JetBrains Mono** carries a developer-tool credibility signal — important
  for the *strategy → pseudocode* feature.

## 6. Imagery & motion

- **Aurora gradients** (see `frontend/src/components/fx/aurora-bg.tsx`) are
  reserved for hero sections only — never decorative on dashboards.
- **Glass-morphism cards** (`.glass`, `.glass-strong` in `globals.css`) are the
  signature surface treatment.
- Motion uses **Framer Motion** with a `[0.16, 1, 0.3, 1]` easing curve — fast,
  confident, never bouncy.
- Maximum 1 animated element per viewport at any time. **Calm > flashy.**

## 7. Voice & tone — copy rules

✅ **Do**
- Lead with the verb: *"Understand any video, in seconds."*
- Cite specifics: *"Sub-minute analysis on Gemini's free tier."*
- Use second person: *"Drop a YouTube link…"*

❌ **Don't**
- Don't say *"revolutionary"*, *"game-changing"*, *"AI-powered"* unprompted.
- Don't promise outcomes the model can't ground (no *"100 % accurate"*).
- Don't anthropomorphise (*"VidIQ understands…"* — say *"VidIQ extracts…"*).

## 8. Brand consistency audit (already applied to product)

| Surface | Logo | Palette | Type | Status |
|---|---|---|---|---|
| Site favicon (`frontend/src/app/layout.tsx`) | ✅ | ✅ | — | Done |
| Top navigation (`top-nav.tsx`) | ✅ | ✅ | ✅ | Done |
| Dashboard hero (`page.tsx`) | ✅ | ✅ | ✅ | Done |
| Analyse / Live / Library pages | — | ✅ | ✅ | Done |
| OpenGraph card (`layout.tsx` metadata) | ✅ | ✅ | — | Done — uses `vidiq_logo_white_bg.png` |
| JSON-LD structured data (`seo-jsonld.tsx`) | ✅ | — | — | Done |
| Sitemap & robots (`sitemap.ts`, `robots.ts`) | — | — | — | Done |

> Take screenshots of each surface for the final slide deck — see
> `12-presentation-outline.md`.
