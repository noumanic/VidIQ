"""Generate the VidIQ presentation deck as a .pptx that imports cleanly into
Canva or opens in PowerPoint / Keynote.

Slide blueprint: 12-presentation-outline.md (15 slides + 1 backup).
Brand: dark midnight bg (#0a0612), violet→fuchsia→cyan accents.
Typography: Plus Jakarta Sans (display), Inter (body), JetBrains Mono (mono).

Re-run with:
    ./venv/Scripts/python.exe marketing/build_deck.py
Output:
    marketing/submissions/VidIQ_Final_Presentation.pptx
"""

from __future__ import annotations

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt


# ── Brand palette (matches frontend/src/app/globals.css) ───────────────────
BG_DEEP = RGBColor(0x0A, 0x06, 0x12)      # midnight
BG_CARD = RGBColor(0x16, 0x10, 0x21)      # raised card on bg
FG_HIGH = RGBColor(0xF5, 0xEF, 0xFF)      # primary text on dark
FG_MID = RGBColor(0xB8, 0xB0, 0xC8)       # muted text on dark
FG_LOW = RGBColor(0x6B, 0x60, 0x80)       # tertiary text
ACCENT_VIOLET = RGBColor(0xA8, 0x55, 0xF7)
ACCENT_FUCHSIA = RGBColor(0xEC, 0x48, 0x99)
ACCENT_CYAN = RGBColor(0x06, 0xB6, 0xD4)
ACCENT_EMERALD = RGBColor(0x10, 0xB9, 0x81)
ACCENT_AMBER = RGBColor(0xF5, 0x9E, 0x0B)

# 16:9 widescreen
SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

# Type stack — Canva will substitute if these aren't installed
DISPLAY = "Plus Jakarta Sans"
BODY = "Inter"
MONO = "JetBrains Mono"


# ── Helpers ────────────────────────────────────────────────────────────────


def add_blank_slide(prs: Presentation):
    blank = prs.slide_layouts[6]  # 6 is the blank layout in default theme
    slide = prs.slides.add_slide(blank)
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    bg.line.fill.background()
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_DEEP
    bg.shadow.inherit = False
    return slide


def add_text(slide, text, *, left, top, width, height,
             size=18, bold=False, font=BODY, color=FG_HIGH,
             align=PP_ALIGN.LEFT, line_spacing=1.2):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = 0
    tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = line_spacing
    run = p.add_run()
    run.text = text
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    return tf


def add_bullets(slide, bullets, *, left, top, width, height,
                size=16, font=BODY, color=FG_HIGH, accent=ACCENT_VIOLET):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = 0
    tf.margin_top = tf.margin_bottom = 0
    for i, b in enumerate(bullets):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.line_spacing = 1.4
        p.space_after = Pt(8)
        # Coloured square bullet
        sq = p.add_run()
        sq.text = "■  "
        sq.font.name = font
        sq.font.size = Pt(size)
        sq.font.color.rgb = accent
        run = p.add_run()
        run.text = b
        run.font.name = font
        run.font.size = Pt(size)
        run.font.color.rgb = color
    return tf


def add_accent_bar(slide, *, top, height=Inches(0.06), color=ACCENT_VIOLET, left=Inches(0.7), width=Inches(2.5)):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    bar.line.fill.background()
    bar.fill.solid()
    bar.fill.fore_color.rgb = color


def add_header(slide, eyebrow, title, *, accent=ACCENT_VIOLET):
    add_text(slide, eyebrow.upper(),
             left=Inches(0.7), top=Inches(0.6), width=Inches(8), height=Inches(0.3),
             size=10, bold=True, color=accent, font=BODY)
    add_text(slide, title,
             left=Inches(0.7), top=Inches(0.9), width=Inches(12), height=Inches(1.2),
             size=40, bold=True, font=DISPLAY, color=FG_HIGH, line_spacing=1.05)
    add_accent_bar(slide, top=Inches(2.05), color=accent)


def add_footer(slide, pillar):
    add_text(slide, "VidIQ",
             left=Inches(0.7), top=Inches(7.05), width=Inches(2), height=Inches(0.3),
             size=9, bold=True, font=DISPLAY, color=ACCENT_VIOLET)
    add_text(slide, pillar,
             left=Inches(2.5), top=Inches(7.05), width=Inches(10), height=Inches(0.3),
             size=9, font=BODY, color=FG_LOW)


def add_card(slide, *, left, top, width, height, fill=BG_CARD, accent=None):
    c = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    c.fill.solid()
    c.fill.fore_color.rgb = fill
    c.line.color.rgb = accent or RGBColor(0x2A, 0x22, 0x3A)
    c.line.width = Pt(0.75)
    c.adjustments[0] = 0.06
    return c


def add_chip(slide, text, *, left, top, width=Inches(1.5), height=Inches(0.32),
             accent=ACCENT_VIOLET, fill=None):
    c = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    c.fill.solid()
    c.fill.fore_color.rgb = fill or RGBColor(0x1F, 0x12, 0x3A)
    c.line.color.rgb = accent
    c.line.width = Pt(0.5)
    c.adjustments[0] = 0.5
    tf = c.text_frame
    tf.margin_left = Inches(0.1)
    tf.margin_right = Inches(0.1)
    tf.margin_top = Inches(0.04)
    tf.margin_bottom = Inches(0.04)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.name = BODY
    r.font.size = Pt(10)
    r.font.bold = True
    r.font.color.rgb = accent


def set_notes(slide, text):
    notes = slide.notes_slide.notes_text_frame
    notes.text = text


# ── Slide builders ─────────────────────────────────────────────────────────


def slide_1_cover(prs):
    s = add_blank_slide(prs)

    # Aurora-ish glow shape (one big rounded rect, soft tint via 70% transparency simulated with colour)
    glow = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(-2), Inches(-2), Inches(10), Inches(10))
    glow.fill.solid()
    glow.fill.fore_color.rgb = RGBColor(0x2A, 0x10, 0x4A)
    glow.line.fill.background()

    # Wordmark
    add_text(s, "VidIQ",
             left=Inches(0), top=Inches(2.4), width=SLIDE_W, height=Inches(1.6),
             size=110, bold=True, font=DISPLAY, color=FG_HIGH, align=PP_ALIGN.CENTER, line_spacing=1)
    # Accent bar
    bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                             Inches(5.92), Inches(4.0), Inches(1.5), Inches(0.08))
    bar.fill.solid()
    bar.fill.fore_color.rgb = ACCENT_FUCHSIA
    bar.line.fill.background()

    add_text(s, "AI Video Intelligence",
             left=Inches(0), top=Inches(4.15), width=SLIDE_W, height=Inches(0.5),
             size=22, bold=True, font=DISPLAY, color=ACCENT_VIOLET, align=PP_ALIGN.CENTER)

    add_text(s, "Watch less. Learn more.",
             left=Inches(0), top=Inches(4.85), width=SLIDE_W, height=Inches(0.5),
             size=18, font=BODY, color=FG_MID, align=PP_ALIGN.CENTER)

    add_text(s, "https://vidiq-two.vercel.app",
             left=Inches(0), top=Inches(6.2), width=SLIDE_W, height=Inches(0.4),
             size=12, font=MONO, color=ACCENT_CYAN, align=PP_ALIGN.CENTER)

    set_notes(s, "Open with the hook from the ad: 'You hit play on a 90-min video and walked away three minutes later.' "
                 "Quick pause, then click into the live demo. Time: 30 seconds.")
    return s


def slide_2_problem(prs):
    s = add_blank_slide(prs)
    add_header(s, "Problem", "Long-form video is the most-uploaded but least-read medium.", accent=ACCENT_FUCHSIA)
    add_footer(s, "Pillar 0 · Problem framing")

    bullets = [
        "500 hours of video uploaded to YouTube every minute (Statista, 2024).",
        "Average watch time per session: 17 minutes — a 90-minute lecture takes 5 sessions.",
        "65% of students rewatch lecture videos at 2× — search and citations are the bottleneck.",
        "Existing tools summarise text (NotebookLM) or audio (Otter); none combine speech + vision.",
    ]
    add_bullets(s, bullets,
                left=Inches(0.7), top=Inches(2.5), width=Inches(12), height=Inches(4),
                size=18, accent=ACCENT_FUCHSIA)

    set_notes(s, "Read all 4 stats out loud. Pause after the third — that's the strongest hook for the marker. "
                 "Time: 90 seconds.")


def slide_3_product(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 3 · Product", "The dashboard you'll see in the live demo.", accent=ACCENT_VIOLET)
    add_footer(s, "Pillar 3 · Product")

    # 4 feature cards in 2x2 grid
    features = [
        ("Multimodal pipeline", "Speech (Whisper) + vision (Gemini) + LLM, fused into one analysis.", ACCENT_VIOLET),
        ("Time-stamped citations", "Every claim cites the exact transcript moment. Click to seek.", ACCENT_CYAN),
        ("Live + recorded", "YouTube videos AND live streams — no competitor ships both.", ACCENT_FUCHSIA),
        ("Domain-aware", "Medical / legal / trading / education modes adapt the prompt.", ACCENT_EMERALD),
    ]
    card_w = Inches(5.8)
    card_h = Inches(1.85)
    for i, (title, body, accent) in enumerate(features):
        col = i % 2
        row = i // 2
        x = Inches(0.7 + col * 6.2)
        y = Inches(2.4 + row * 2.1)
        add_card(s, left=x, top=y, width=card_w, height=card_h, accent=accent)
        add_text(s, title,
                 left=x + Inches(0.3), top=y + Inches(0.18), width=card_w - Inches(0.5), height=Inches(0.5),
                 size=18, bold=True, font=DISPLAY, color=FG_HIGH)
        add_text(s, body,
                 left=x + Inches(0.3), top=y + Inches(0.75), width=card_w - Inches(0.5), height=Inches(1),
                 size=12, font=BODY, color=FG_MID, line_spacing=1.3)

    add_text(s, "LIVE  →  vidiq-two.vercel.app",
             left=Inches(0.7), top=Inches(6.7), width=Inches(12), height=Inches(0.35),
             size=12, font=MONO, color=ACCENT_CYAN, bold=True)

    set_notes(s, "DEMO LIVE: switch to the browser, paste a 2-minute YouTube URL, watch the pipeline complete. "
                 "Have a backup video pre-loaded in /library in case the live one stalls. Time: 60 seconds.")


def slide_4_pipeline(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 3 · Architecture", "End-to-end multimodal pipeline.", accent=ACCENT_VIOLET)
    add_footer(s, "Pillar 3 · Architecture")

    # Pipeline boxes left-to-right
    steps = [
        ("URL input", "yt-dlp resolve", ACCENT_VIOLET),
        ("Audio", "ffmpeg → Whisper", ACCENT_CYAN),
        ("Frames", "OpenCV scene-cut", ACCENT_EMERALD),
        ("Vision", "Gemini caption", ACCENT_AMBER),
        ("Synthesise", "LLM JSON", ACCENT_FUCHSIA),
    ]
    box_w = Inches(2.2)
    box_h = Inches(1.3)
    gap = Inches(0.25)
    total_w = box_w * len(steps) + gap * (len(steps) - 1)
    start_x = (SLIDE_W - total_w) / 2
    y = Inches(3.2)

    for i, (title, sub, accent) in enumerate(steps):
        x = start_x + (box_w + gap) * i
        add_card(s, left=x, top=y, width=box_w, height=box_h, accent=accent)
        add_text(s, title,
                 left=x + Inches(0.15), top=y + Inches(0.18), width=box_w - Inches(0.3), height=Inches(0.4),
                 size=14, bold=True, font=DISPLAY, color=FG_HIGH, align=PP_ALIGN.CENTER)
        add_text(s, sub,
                 left=x + Inches(0.15), top=y + Inches(0.7), width=box_w - Inches(0.3), height=Inches(0.5),
                 size=10, font=MONO, color=accent, align=PP_ALIGN.CENTER)
        # Arrow
        if i < len(steps) - 1:
            arrow = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                       x + box_w + Inches(0.02), y + Inches(0.55),
                                       gap - Inches(0.04), Inches(0.2))
            arrow.fill.solid()
            arrow.fill.fore_color.rgb = ACCENT_VIOLET
            arrow.line.fill.background()

    add_text(s, "Stack:  FastAPI · Next.js 14 · Gemini · faster-whisper · OpenCV · SQLite · WebSocket",
             left=Inches(0.7), top=Inches(5.5), width=Inches(12), height=Inches(0.4),
             size=12, font=MONO, color=FG_MID, align=PP_ALIGN.CENTER)

    add_text(s, "Provider-agnostic: Gemini ↔ Groq ↔ OpenAI auto-failover.  Free-tier capped — $0 to operate.",
             left=Inches(0.7), top=Inches(6), width=Inches(12), height=Inches(0.4),
             size=11, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "Speak to the multimodal angle: 'transcript alone is text — frames + transcript is understanding.' "
                 "Mention the failover (real engineering moat). Time: 60 seconds.")


def slide_5_brand(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 1 · Branding", "Identity that signals AI without the cliché.", accent=ACCENT_FUCHSIA)
    add_footer(s, "Pillar 1 · Branding")

    # Two columns: left = palette swatches, right = type sample + voice
    # ── Palette
    add_text(s, "PALETTE",
             left=Inches(0.7), top=Inches(2.4), width=Inches(5), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=FG_LOW)
    swatches = [
        ("Violet 500", ACCENT_VIOLET, "Trust + creativity"),
        ("Fuchsia 500", ACCENT_FUCHSIA, "Energy + signal"),
        ("Cyan 500", ACCENT_CYAN, "Clarity + intelligence"),
        ("Midnight", BG_DEEP, "Stage / canvas"),
    ]
    for i, (name, col, why) in enumerate(swatches):
        y = Inches(2.85 + i * 0.85)
        sq = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                Inches(0.7), y, Inches(0.7), Inches(0.7))
        sq.fill.solid()
        sq.fill.fore_color.rgb = col
        sq.line.color.rgb = RGBColor(0x44, 0x33, 0x55)
        sq.line.width = Pt(0.5)
        add_text(s, name,
                 left=Inches(1.6), top=y + Inches(0.05), width=Inches(2.5), height=Inches(0.35),
                 size=14, bold=True, font=DISPLAY, color=FG_HIGH)
        add_text(s, why,
                 left=Inches(1.6), top=y + Inches(0.4), width=Inches(2.5), height=Inches(0.3),
                 size=10, font=BODY, color=FG_MID)

    # ── Typography
    add_text(s, "TYPOGRAPHY",
             left=Inches(7), top=Inches(2.4), width=Inches(5), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=FG_LOW)
    add_text(s, "Plus Jakarta Sans 800",
             left=Inches(7), top=Inches(2.8), width=Inches(6), height=Inches(0.7),
             size=32, bold=True, font=DISPLAY, color=FG_HIGH)
    add_text(s, "Display headings · humanist geometric",
             left=Inches(7), top=Inches(3.45), width=Inches(6), height=Inches(0.3),
             size=11, font=BODY, color=FG_LOW)
    add_text(s, "Inter 400 / 500 / 600",
             left=Inches(7), top=Inches(4), width=Inches(6), height=Inches(0.5),
             size=20, font=BODY, color=FG_HIGH)
    add_text(s, "Body copy · interface · long-form",
             left=Inches(7), top=Inches(4.5), width=Inches(6), height=Inches(0.3),
             size=11, font=BODY, color=FG_LOW)
    add_text(s, "JetBrains Mono",
             left=Inches(7), top=Inches(5.05), width=Inches(6), height=Inches(0.4),
             size=14, font=MONO, color=ACCENT_CYAN)
    add_text(s, "Code · timestamps · technical labels",
             left=Inches(7), top=Inches(5.5), width=Inches(6), height=Inches(0.3),
             size=11, font=BODY, color=FG_LOW)

    add_text(s, "Brand consistency audit: applied across 7 surfaces (favicon · top-nav · hero · OG card · JSON-LD · 4 page meta titles).  See 01-brand-guide.md §8.",
             left=Inches(0.7), top=Inches(6.55), width=Inches(12), height=Inches(0.5),
             size=10, font=BODY, color=FG_MID)

    set_notes(s, "Why violet, not blue (default SaaS): blue is the consultancy default — violet retains the trust association "
                 "while signalling creativity and AI. Cite Mehta-Zhu (2009) on red/blue cognition. Time: 50 seconds.")


def slide_6_ad(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 1 · Creative", "30-second teaser ad — story arc.", accent=ACCENT_FUCHSIA)
    add_footer(s, "Pillar 1 · Creative")

    # Story-arc strip
    arc = [
        ("0–3 s", "Hook", "Pause the lecture", ACCENT_VIOLET),
        ("3–10 s", "Problem", "90 min, 17 min watched", ACCENT_FUCHSIA),
        ("10–20 s", "Product", "Paste URL → grounded summary", ACCENT_CYAN),
        ("20–26 s", "Proof", "Click any claim → exact moment", ACCENT_EMERALD),
        ("26–30 s", "CTA", "Watch less. Learn more.", ACCENT_AMBER),
    ]
    box_w = Inches(2.4)
    box_h = Inches(2.2)
    gap = Inches(0.15)
    total_w = box_w * len(arc) + gap * (len(arc) - 1)
    start_x = (SLIDE_W - total_w) / 2
    y = Inches(2.7)
    for i, (ts, name, body, accent) in enumerate(arc):
        x = start_x + (box_w + gap) * i
        add_card(s, left=x, top=y, width=box_w, height=box_h, accent=accent)
        add_text(s, ts,
                 left=x + Inches(0.18), top=y + Inches(0.18), width=box_w - Inches(0.4), height=Inches(0.3),
                 size=10, font=MONO, color=accent, bold=True)
        add_text(s, name,
                 left=x + Inches(0.18), top=y + Inches(0.55), width=box_w - Inches(0.4), height=Inches(0.5),
                 size=18, bold=True, font=DISPLAY, color=FG_HIGH)
        add_text(s, body,
                 left=x + Inches(0.18), top=y + Inches(1.05), width=box_w - Inches(0.4), height=Inches(1),
                 size=12, font=BODY, color=FG_MID, line_spacing=1.3)

    add_text(s, "[ Embed video here · drop the 30-second master cut once filmed ]",
             left=Inches(0.7), top=Inches(5.4), width=Inches(12), height=Inches(0.5),
             size=14, font=MONO, color=ACCENT_VIOLET, align=PP_ALIGN.CENTER)
    add_text(s, "Cutdowns:  30s master · 15s social · 6s bumper · 10s in-stream",
             left=Inches(0.7), top=Inches(6.3), width=Inches(12), height=Inches(0.4),
             size=11, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "Embed the actual MP4 here once filmed. Auto-play on click. Pause on transition to slide 7. "
                 "Time: 35 seconds (the ad runs).")


def slide_7_social(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 2 · Social", "14-day calendar across Facebook + Instagram.", accent=ACCENT_CYAN)
    add_footer(s, "Pillar 2 · Social calendar")

    # Stat row
    stats = [
        ("28", "posts queued"),
        ("4", "content formats"),
        ("7×", "weekly cadence"),
        ("2", "channels"),
    ]
    for i, (n, lbl) in enumerate(stats):
        x = Inches(0.7 + i * 3.1)
        add_card(s, left=x, top=Inches(2.4), width=Inches(2.85), height=Inches(1.4), accent=ACCENT_CYAN)
        add_text(s, n,
                 left=x, top=Inches(2.55), width=Inches(2.85), height=Inches(0.7),
                 size=42, bold=True, font=DISPLAY, color=ACCENT_CYAN, align=PP_ALIGN.CENTER)
        add_text(s, lbl.upper(),
                 left=x, top=Inches(3.25), width=Inches(2.85), height=Inches(0.4),
                 size=11, font=BODY, color=FG_MID, align=PP_ALIGN.CENTER)

    # Format chips
    add_text(s, "FORMATS",
             left=Inches(0.7), top=Inches(4.2), width=Inches(5), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=FG_LOW)
    formats = ["Reels", "Carousels", "Single image", "Stories"]
    for i, f in enumerate(formats):
        add_chip(s, f, left=Inches(0.7 + i * 1.65), top=Inches(4.55), width=Inches(1.5),
                 accent=ACCENT_CYAN)

    add_text(s, "[ Screenshot of Meta Business Suite Planner with all 28 posts visible ]",
             left=Inches(0.7), top=Inches(5.4), width=Inches(12), height=Inches(0.5),
             size=14, font=MONO, color=ACCENT_VIOLET, align=PP_ALIGN.CENTER)
    add_text(s, "All copy in 03-content-calendar.md.  Captions tone-matched to brand voice.",
             left=Inches(0.7), top=Inches(6.4), width=Inches(12), height=Inches(0.4),
             size=11, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "Mention KPI #5 (14/14 days covered) and KPI #6 (4 formats — exceeds 3+ requirement). "
                 "Time: 45 seconds.")


def slide_8_meta_ads(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 2 · Meta Ads", "$280 / 14 days · 4 ad sets · 6 creatives.", accent=ACCENT_CYAN)
    add_footer(s, "Pillar 2 · Meta Ads")

    sets = [
        ("Ad Set 1", "Students", "South Asia · 18-26 · cramming, study, exam", ACCENT_VIOLET, "$70"),
        ("Ad Set 2", "Creators", "Global EN · 22-35 · YT, Substack, Notion", ACCENT_FUCHSIA, "$70"),
        ("Ad Set 3", "Knowledge workers", "US/EU · 28-50 · MBAs, consultants, PMs", ACCENT_CYAN, "$70"),
        ("Ad Set 4", "Retargeting", "Site visitors · 7-day · 4× ROAS expected", ACCENT_EMERALD, "$70"),
    ]
    for i, (lbl, name, body, accent, budget) in enumerate(sets):
        col = i % 2
        row = i // 2
        x = Inches(0.7 + col * 6.2)
        y = Inches(2.5 + row * 2)
        add_card(s, left=x, top=y, width=Inches(5.8), height=Inches(1.8), accent=accent)
        add_text(s, lbl,
                 left=x + Inches(0.3), top=y + Inches(0.18), width=Inches(2), height=Inches(0.3),
                 size=10, font=MONO, color=accent, bold=True)
        add_text(s, budget,
                 left=x + Inches(4.2), top=y + Inches(0.18), width=Inches(1.4), height=Inches(0.4),
                 size=18, bold=True, font=DISPLAY, color=accent, align=PP_ALIGN.RIGHT)
        add_text(s, name,
                 left=x + Inches(0.3), top=y + Inches(0.55), width=Inches(5.2), height=Inches(0.5),
                 size=18, bold=True, font=DISPLAY, color=FG_HIGH)
        add_text(s, body,
                 left=x + Inches(0.3), top=y + Inches(1.05), width=Inches(5.2), height=Inches(0.7),
                 size=12, font=BODY, color=FG_MID, line_spacing=1.3)

    add_text(s, "Strategy → 04-meta-ads-plan.md  ·  Each ad set screenshotted from Ads Manager 'Review' page.",
             left=Inches(0.7), top=Inches(6.65), width=Inches(12), height=Inches(0.4),
             size=11, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "Showcase mode: campaigns built to Review screen, screenshotted, never published — $0 spend. "
                 "Time: 55 seconds.")


def slide_9_conversation(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 2 · Always-on", "Welcome, auto-reply, comment management.", accent=ACCENT_CYAN)
    add_footer(s, "Pillar 2 · Templates")

    # Two cards side-by-side
    add_card(s, left=Inches(0.7), top=Inches(2.5), width=Inches(5.8), height=Inches(3.5), accent=ACCENT_CYAN)
    add_text(s, "WELCOME MESSAGE",
             left=Inches(1), top=Inches(2.7), width=Inches(5.2), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=ACCENT_CYAN)
    add_text(s,
             "Hey 👋 thanks for stopping by VidIQ.\n\n"
             "We turn any YouTube link into a transcript, time-stamped summary "
             "and grounded Q&A — in seconds.\n\n"
             "Try it free: vidiq-two.vercel.app",
             left=Inches(1), top=Inches(3.05), width=Inches(5.2), height=Inches(2.8),
             size=12, font=BODY, color=FG_HIGH, line_spacing=1.5)

    add_card(s, left=Inches(6.85), top=Inches(2.5), width=Inches(5.8), height=Inches(3.5), accent=ACCENT_FUCHSIA)
    add_text(s, "AUTO-REPLY (KEYWORD: PRICING)",
             left=Inches(7.15), top=Inches(2.7), width=Inches(5.2), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=ACCENT_FUCHSIA)
    add_text(s,
             "VidIQ is free during launch.\n\n"
             "Free tier: unlimited 10-min videos · grounded chat · live "
             "stream summaries.\n\n"
             "No card. No catch. Try it: vidiq-two.vercel.app",
             left=Inches(7.15), top=Inches(3.05), width=Inches(5.2), height=Inches(2.8),
             size=12, font=BODY, color=FG_HIGH, line_spacing=1.5)

    add_text(s, "[ Screenshot Business Suite welcome + auto-reply config — KPI #9 evidence ]",
             left=Inches(0.7), top=Inches(6.4), width=Inches(12), height=Inches(0.4),
             size=11, font=MONO, color=ACCENT_VIOLET, align=PP_ALIGN.CENTER)

    set_notes(s, "Templates from 05-social-templates.md. Configure in Business Suite, screenshot once configured. "
                 "Time: 30 seconds.")


def slide_10_keywords(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 4 · SEO", "18-keyword strategy · long-tail-first.", accent=ACCENT_AMBER)
    add_footer(s, "Pillar 4 · Keyword research")

    # Stats
    stats = [
        ("18", "total KWs", ACCENT_AMBER),
        ("5", "short-tail head", ACCENT_FUCHSIA),
        ("13", "long-tail", ACCENT_EMERALD),
        ("21.8", "avg KD (low)", ACCENT_CYAN),
    ]
    for i, (n, lbl, c) in enumerate(stats):
        x = Inches(0.7 + i * 3.1)
        add_card(s, left=x, top=Inches(2.4), width=Inches(2.85), height=Inches(1.3), accent=c)
        add_text(s, n,
                 left=x, top=Inches(2.5), width=Inches(2.85), height=Inches(0.65),
                 size=36, bold=True, font=DISPLAY, color=c, align=PP_ALIGN.CENTER)
        add_text(s, lbl.upper(),
                 left=x, top=Inches(3.15), width=Inches(2.85), height=Inches(0.3),
                 size=10, font=BODY, color=FG_MID, align=PP_ALIGN.CENTER)

    # Highlight 3 strategic KWs
    kws = [
        ("ai video summarizer", "27,100", "KD 48", "/ (home)"),
        ("summarize a 2 hour youtube video", "2,400", "KD 19", "/analyze"),
        ("live stream ai summary", "1,600", "KD 24", "/live"),
    ]
    add_text(s, "STRATEGIC ANCHORS",
             left=Inches(0.7), top=Inches(4.1), width=Inches(5), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=FG_LOW)
    for i, (kw, msv, kd, page) in enumerate(kws):
        y = Inches(4.45 + i * 0.7)
        add_card(s, left=Inches(0.7), top=y, width=Inches(11.95), height=Inches(0.6), accent=ACCENT_AMBER)
        add_text(s, kw,
                 left=Inches(0.95), top=y + Inches(0.13), width=Inches(5.5), height=Inches(0.4),
                 size=14, bold=True, font=BODY, color=FG_HIGH)
        add_text(s, f"MSV {msv}",
                 left=Inches(6.5), top=y + Inches(0.13), width=Inches(1.5), height=Inches(0.4),
                 size=12, font=MONO, color=ACCENT_CYAN)
        add_text(s, kd,
                 left=Inches(8.2), top=y + Inches(0.13), width=Inches(1.5), height=Inches(0.4),
                 size=12, font=MONO, color=ACCENT_EMERALD)
        add_text(s, page,
                 left=Inches(10.2), top=y + Inches(0.13), width=Inches(2.4), height=Inches(0.4),
                 size=12, font=MONO, color=FG_MID, align=PP_ALIGN.RIGHT)

    set_notes(s, "Why long-tail first: domain authority of 1 — head terms unrankable in 14 days. "
                 "Long-tail KD<15 is achievable per page. Cite 06-keyword-research.md. Time: 50 seconds.")


def slide_11_seo(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 4 · On-page", "Lighthouse, meta tags, structured data — all in.", accent=ACCENT_AMBER)
    add_footer(s, "Pillar 4 · On-page SEO")

    # 4 audit cards
    audits = [
        ("Meta tags", "Per-page title + description + canonical + OG + Twitter card", ACCENT_VIOLET),
        ("Alt text", "Every image has descriptive alt — generated from caption", ACCENT_CYAN),
        ("Header hierarchy", "Strict h1→h2→h3 — verified via Wave + axe DevTools", ACCENT_FUCHSIA),
        ("Structured data", "JSON-LD Organization + WebSite + SoftwareApplication", ACCENT_EMERALD),
    ]
    for i, (title, body, c) in enumerate(audits):
        col = i % 2
        row = i // 2
        x = Inches(0.7 + col * 6.2)
        y = Inches(2.4 + row * 1.6)
        add_card(s, left=x, top=y, width=Inches(5.8), height=Inches(1.4), accent=c)
        add_text(s, "✓",
                 left=x + Inches(0.25), top=y + Inches(0.4), width=Inches(0.6), height=Inches(0.6),
                 size=28, bold=True, font=DISPLAY, color=c)
        add_text(s, title,
                 left=x + Inches(0.95), top=y + Inches(0.2), width=Inches(4.5), height=Inches(0.4),
                 size=16, bold=True, font=DISPLAY, color=FG_HIGH)
        add_text(s, body,
                 left=x + Inches(0.95), top=y + Inches(0.65), width=Inches(4.5), height=Inches(0.7),
                 size=11, font=BODY, color=FG_MID, line_spacing=1.3)

    add_text(s, "[ Lighthouse score panel · Performance ___ · SEO 100 · Accessibility ___ ]",
             left=Inches(0.7), top=Inches(5.7), width=Inches(12), height=Inches(0.5),
             size=14, font=MONO, color=ACCENT_VIOLET, align=PP_ALIGN.CENTER)
    add_text(s, "Live:  https://vidiq-two.vercel.app/sitemap.xml  ·  Submitted to Google Search Console",
             left=Inches(0.7), top=Inches(6.4), width=Inches(12), height=Inches(0.4),
             size=11, font=MONO, color=ACCENT_CYAN, align=PP_ALIGN.CENTER)

    set_notes(s, "Run Lighthouse on the live URL the morning of, screenshot, paste the actual scores. "
                 "Mention 07-onpage-seo-report.md for the full audit. Time: 45 seconds.")


def slide_12_google_ads(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 4 · Google Ads", "$210 / 14 days · 3 campaigns · conversion-laddered.", accent=ACCENT_AMBER)
    add_footer(s, "Pillar 4 · Google Ads")

    campaigns = [
        ("Search", "Brand cluster", "$70 · 4 ad groups · exact + phrase", ACCENT_VIOLET),
        ("YouTube In-Stream", "Awareness layer", "$56 · skippable · 30s creative", ACCENT_CYAN),
        ("Performance Max", "Auto-allocated", "$84 (gated D8) · once 30 conv banked", ACCENT_FUCHSIA),
    ]
    for i, (name, sub, body, c) in enumerate(campaigns):
        x = Inches(0.7 + i * 4.15)
        add_card(s, left=x, top=Inches(2.5), width=Inches(3.85), height=Inches(2.5), accent=c)
        add_text(s, name,
                 left=x + Inches(0.25), top=Inches(2.7), width=Inches(3.5), height=Inches(0.5),
                 size=20, bold=True, font=DISPLAY, color=FG_HIGH)
        add_text(s, sub,
                 left=x + Inches(0.25), top=Inches(3.25), width=Inches(3.5), height=Inches(0.4),
                 size=12, font=BODY, color=c, bold=True)
        add_text(s, body,
                 left=x + Inches(0.25), top=Inches(3.7), width=Inches(3.5), height=Inches(1.2),
                 size=11, font=BODY, color=FG_MID, line_spacing=1.4)

    # Bidding rules
    add_text(s, "BIDDING + GUARDRAILS",
             left=Inches(0.7), top=Inches(5.3), width=Inches(5), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=FG_LOW)
    rules = [
        "Start: Maximise Conversions  →  Switch to Target CPA after 30 conv banked.",
        "Friday negative-keyword sweep: drop terms with > $5 spend, 0 conversions.",
        "PMax gated by conv volume; spare reallocates to Search if it doesn't unlock.",
    ]
    for i, r in enumerate(rules):
        add_text(s, f"·  {r}",
                 left=Inches(0.7), top=Inches(5.65 + i * 0.32), width=Inches(12), height=Inches(0.3),
                 size=11, font=BODY, color=FG_MID)

    set_notes(s, "Strategy from 08-google-ads-plan.md. Screenshot the Review screen of each campaign. Time: 50 seconds.")


def slide_13_budget(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 5 · Budget", "$740 planned · $0 actual (showcase).", accent=ACCENT_EMERALD)
    add_footer(s, "Pillar 5 · Budget")

    # Donut-like representation as 6 colored chips with %
    lines = [
        ("Meta Ads", "$280", "38%", ACCENT_VIOLET),
        ("Google Ads", "$210", "28%", ACCENT_FUCHSIA),
        ("Creative production", "$120", "16%", ACCENT_CYAN),
        ("Influencer seeding", "$60", "8%", ACCENT_EMERALD),
        ("Tools & SaaS", "$50", "7%", ACCENT_AMBER),
        ("Contingency", "$20", "3%", RGBColor(0xF4, 0x3F, 0x5E)),
    ]
    for i, (name, amt, pct, c) in enumerate(lines):
        y = Inches(2.45 + i * 0.6)
        # Bar
        bar_w_total = Inches(7)
        pct_val = float(pct.replace("%", "")) / 100
        bar_w = Inches(7 * pct_val)
        bg_bar = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                    Inches(3), y + Inches(0.1), bar_w_total, Inches(0.35))
        bg_bar.fill.solid()
        bg_bar.fill.fore_color.rgb = RGBColor(0x18, 0x10, 0x24)
        bg_bar.line.fill.background()
        bg_bar.adjustments[0] = 0.5
        fg_bar = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                    Inches(3), y + Inches(0.1), bar_w, Inches(0.35))
        fg_bar.fill.solid()
        fg_bar.fill.fore_color.rgb = c
        fg_bar.line.fill.background()
        fg_bar.adjustments[0] = 0.5
        add_text(s, name,
                 left=Inches(0.7), top=y + Inches(0.1), width=Inches(2.2), height=Inches(0.4),
                 size=13, bold=True, font=DISPLAY, color=FG_HIGH)
        add_text(s, amt,
                 left=Inches(10.15), top=y + Inches(0.1), width=Inches(1.5), height=Inches(0.4),
                 size=14, font=MONO, color=c, bold=True, align=PP_ALIGN.RIGHT)
        add_text(s, pct,
                 left=Inches(11.7), top=Inches(0).pt + y + Inches(0.1) if False else (y + Inches(0.1)),
                 width=Inches(1), height=Inches(0.4),
                 size=14, font=MONO, color=FG_MID, align=PP_ALIGN.RIGHT)

    # Showcase actual
    add_card(s, left=Inches(0.7), top=Inches(6.3), width=Inches(11.95), height=Inches(0.7), accent=ACCENT_EMERALD)
    add_text(s, "SHOWCASE ACTUAL",
             left=Inches(1), top=Inches(6.45), width=Inches(3), height=Inches(0.4),
             size=11, bold=True, font=BODY, color=ACCENT_EMERALD)
    add_text(s, "$0 spent — campaigns built to Review screen, screenshotted, never published.",
             left=Inches(4), top=Inches(6.45), width=Inches(8.5), height=Inches(0.4),
             size=12, font=BODY, color=FG_HIGH)

    set_notes(s, "Justify the 38/28 split: paid acquisition is dominant because organic SEO is months out for a "
                 "DA-1 domain. Creative + influencer is intentionally lean. 09-budget.md has full rationale. Time: 60 seconds.")


def slide_14_competitive(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 5 · Competitive", "VidIQ vs NoteGPT vs Eightify.", accent=ACCENT_EMERALD)
    add_footer(s, "Pillar 5 · Competitive")

    # 3-column comparison table
    cols = [
        ("VidIQ", ACCENT_VIOLET, ["0 (launch)", "0 (launch)", "Free + paid roadmap", "✓ Live + recorded", "✓ Multimodal grounding", "✓ Domain modes"]),
        ("NoteGPT", ACCENT_CYAN,  ["~3,100 FB", "~5,800 IG", "Free 5/d → $4.99/mo", "Recorded only", "Text only", "—"]),
        ("Eightify", ACCENT_AMBER,["~620 FB", "~1,900 IG", "Free 4/d → $4.99/mo", "Recorded only", "Text only", "—"]),
    ]
    headers = ["", "FACEBOOK", "INSTAGRAM", "PRICING", "FORMATS", "DIFFERENTIATION", "VERTICAL"]

    col_w = Inches(3.85)
    row_h = Inches(0.5)
    start_x = Inches(0.7)
    start_y = Inches(2.4)
    label_w = Inches(0)  # we'll use the column header row

    # Column headers
    for ci, (name, c, _) in enumerate(cols):
        x = start_x + col_w * ci + Inches(0.05)
        hdr = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, start_y, col_w - Inches(0.1), Inches(0.5))
        hdr.fill.solid()
        hdr.fill.fore_color.rgb = c
        hdr.line.fill.background()
        hdr.adjustments[0] = 0.3
        tf = hdr.text_frame
        tf.margin_top = Inches(0.05)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = name
        r.font.name = DISPLAY
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = BG_DEEP

    # Rows
    row_labels = ["FB followers", "IG followers", "Pricing", "Coverage", "Differentiation", "Vertical mode"]
    for ri, label in enumerate(row_labels):
        y = start_y + Inches(0.65) + Inches(0.65) * ri
        # row separator
        sep = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, start_x, y - Inches(0.05), col_w * 3, Inches(0.02))
        sep.fill.solid()
        sep.fill.fore_color.rgb = RGBColor(0x2A, 0x22, 0x3A)
        sep.line.fill.background()
        for ci, (_, c, vals) in enumerate(cols):
            x = start_x + col_w * ci + Inches(0.05)
            add_text(s, vals[ri],
                     left=x, top=y, width=col_w - Inches(0.1), height=Inches(0.5),
                     size=12, font=BODY, color=FG_HIGH, align=PP_ALIGN.CENTER)

    set_notes(s, "Lead with the moats: live + multimodal + verticals — neither competitor ships any of those. "
                 "Cite 10-competitive-analysis.md. Time: 60 seconds.")


def slide_15_kpi(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 5 · KPI scorecard", "17 / 18 strong  ·  4.83 / 5 average.", accent=ACCENT_EMERALD)
    add_footer(s, "Pillar 5 · KPI scorecard")

    # 6×3 grid (18 KPIs) with status tint
    KPIS = [
        # (number, score, status_color)
        (1, 5, ACCENT_EMERALD), (2, 5, ACCENT_EMERALD), (3, 3, ACCENT_AMBER),
        (4, 5, ACCENT_EMERALD), (5, 5, ACCENT_EMERALD), (6, 5, ACCENT_EMERALD),
        (7, 5, ACCENT_EMERALD), (8, 5, ACCENT_EMERALD), (9, 4, ACCENT_EMERALD),
        (10, 5, ACCENT_EMERALD), (11, 5, ACCENT_EMERALD), (12, 5, ACCENT_EMERALD),
        (13, 5, ACCENT_EMERALD), (14, 5, ACCENT_EMERALD), (15, 5, ACCENT_EMERALD),
        (16, 5, ACCENT_EMERALD), (17, 5, ACCENT_EMERALD), (18, 5, ACCENT_EMERALD),
    ]
    cell_w = Inches(2.0)
    cell_h = Inches(0.7)
    gap = Inches(0.1)
    cols = 6
    rows = 3
    total_w = cell_w * cols + gap * (cols - 1)
    start_x = (SLIDE_W - total_w) / 2
    start_y = Inches(2.6)
    for i, (n, score, c) in enumerate(KPIS):
        col = i % cols
        row = i // cols
        x = start_x + (cell_w + gap) * col
        y = start_y + (cell_h + gap) * row
        cell = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, cell_w, cell_h)
        cell.fill.solid()
        cell.fill.fore_color.rgb = BG_CARD
        cell.line.color.rgb = c
        cell.line.width = Pt(1.5)
        cell.adjustments[0] = 0.18
        add_text(s, f"KPI {n:02d}",
                 left=x, top=y + Inches(0.1), width=cell_w, height=Inches(0.25),
                 size=10, font=MONO, color=FG_LOW, align=PP_ALIGN.CENTER)
        add_text(s, f"{score} / 5",
                 left=x, top=y + Inches(0.32), width=cell_w, height=Inches(0.4),
                 size=18, bold=True, font=DISPLAY, color=c, align=PP_ALIGN.CENTER)

    # Footer note
    add_text(s, "1 KPI at 3 (KPI #3 — 30s video ad, awaiting filming).  Closes to 5 once shot.",
             left=Inches(0.7), top=Inches(6.5), width=Inches(12), height=Inches(0.4),
             size=11, font=BODY, color=FG_MID, align=PP_ALIGN.CENTER)

    set_notes(s, "Land the 17/18 number first, then explain the open one (video ad). "
                 "Cite the live KPI tracker in the app: vidiq-two.vercel.app/marketing. Time: 50 seconds.")


def slide_16_qa_backup(prs):
    s = add_blank_slide(prs)
    add_header(s, "Q&A · Backup", "How citations work — multimodal grounding.", accent=ACCENT_VIOLET)
    add_footer(s, "Backup · Q&A")

    add_text(s, "Q. \"How do you compete with YouTube's own AI summary?\"",
             left=Inches(0.7), top=Inches(2.5), width=Inches(12), height=Inches(0.5),
             size=18, bold=True, font=DISPLAY, color=FG_HIGH)
    add_text(s,
             "Three durable moats:",
             left=Inches(0.7), top=Inches(3.1), width=Inches(12), height=Inches(0.4),
             size=14, font=BODY, color=FG_MID)

    moats = [
        ("Live-stream support", "YouTube's auto-summary is post-hoc only. We process live streams in 30s windows."),
        ("Multimodal grounding", "Every claim cites the exact transcript moment + linked frame. YouTube's is generic."),
        ("Vertical-domain modes", "Medical / legal / trading prompts adapt the analysis to domain semantics."),
    ]
    for i, (title, body) in enumerate(moats):
        y = Inches(3.7 + i * 1.0)
        add_card(s, left=Inches(0.7), top=y, width=Inches(11.95), height=Inches(0.85), accent=ACCENT_VIOLET)
        add_text(s, f"{i+1}. {title}",
                 left=Inches(1), top=y + Inches(0.13), width=Inches(4), height=Inches(0.4),
                 size=14, bold=True, font=DISPLAY, color=ACCENT_VIOLET)
        add_text(s, body,
                 left=Inches(5.15), top=y + Inches(0.18), width=Inches(7.5), height=Inches(0.6),
                 size=12, font=BODY, color=FG_HIGH, line_spacing=1.3)

    set_notes(s, "Pull this slide out only if asked. Don't volunteer it. Time: 40 seconds if used.")


# ── Build ──────────────────────────────────────────────────────────────────


def main():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H

    slide_1_cover(prs)
    slide_2_problem(prs)
    slide_3_product(prs)
    slide_4_pipeline(prs)
    slide_5_brand(prs)
    slide_6_ad(prs)
    slide_7_social(prs)
    slide_8_meta_ads(prs)
    slide_9_conversation(prs)
    slide_10_keywords(prs)
    slide_11_seo(prs)
    slide_12_google_ads(prs)
    slide_13_budget(prs)
    slide_14_competitive(prs)
    slide_15_kpi(prs)
    slide_16_qa_backup(prs)

    out_dir = Path(__file__).resolve().parent / "submissions"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "VidIQ_Final_Presentation.pptx"
    prs.save(out_file)
    print(f"✅ wrote {out_file} ({len(prs.slides)} slides)")


if __name__ == "__main__":
    main()
