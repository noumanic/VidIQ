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


# ── Asset paths ────────────────────────────────────────────────────────────

ASSETS = Path(__file__).resolve().parent / "assets"
SHOTS = ASSETS / "screenshots"
FIREFLY = ASSETS / "firefly"
VIDEO = ASSETS / "video-ad"


def asset(*names: str) -> Path | None:
    """Return the first path that exists for any of the given names."""
    for n in names:
        for root in (SHOTS, FIREFLY, VIDEO):
            p = root / n
            if p.exists():
                return p
    return None


# ── Helpers ────────────────────────────────────────────────────────────────


def add_image(slide, src: Path, *, left, top, width=None, height=None,
              border_color=None, border_pt=1.0):
    """Place an image on the slide. Adds a thin tinted frame so screenshots
    don't float in space against the dark background."""
    if not src or not src.exists():
        # Drop a placeholder card if asset missing
        ph = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top,
            width or Inches(2), height or Inches(2),
        )
        ph.fill.solid()
        ph.fill.fore_color.rgb = BG_CARD
        ph.line.color.rgb = ACCENT_FUCHSIA
        ph.line.width = Pt(0.75)
        ph.adjustments[0] = 0.05
        tf = ph.text_frame
        tf.margin_left = Inches(0.15)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        r = p.add_run()
        r.text = f"missing\n{src.name if src else '?'}"
        r.font.name = MONO
        r.font.size = Pt(9)
        r.font.color.rgb = ACCENT_FUCHSIA
        return ph

    pic = slide.shapes.add_picture(
        str(src), left, top,
        width=width, height=height,
    )
    if border_color is not None:
        pic.line.color.rgb = border_color
        pic.line.width = Pt(border_pt)
    return pic


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

    # ── Layered aurora glows (top-left + bottom-right) ────────────────
    glow_a = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(-3.5), Inches(-3.5),
                                Inches(8), Inches(8))
    glow_a.fill.solid()
    glow_a.fill.fore_color.rgb = RGBColor(0x33, 0x12, 0x55)
    glow_a.line.fill.background()

    glow_b = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(8.5), Inches(4),
                                Inches(7), Inches(7))
    glow_b.fill.solid()
    glow_b.fill.fore_color.rgb = RGBColor(0x44, 0x18, 0x55)
    glow_b.line.fill.background()

    # Subtle grid stripes (top-left to bottom-right diagonal feel)
    for i, y_off in enumerate([0.5, 1.6, 2.7, 5.5, 6.4, 7.0]):
        stripe = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                    Inches(0), Inches(y_off),
                                    SLIDE_W, Inches(0.005))
        stripe.fill.solid()
        stripe.fill.fore_color.rgb = RGBColor(0x44, 0x33, 0x55)
        stripe.line.fill.background()

    # ── Eyebrow tag, top of slide ─────────────────────────────────────
    eyebrow_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                      Inches(5.42), Inches(0.52),
                                      Inches(2.5), Inches(0.34))
    eyebrow_card.fill.solid()
    eyebrow_card.fill.fore_color.rgb = RGBColor(0x1F, 0x12, 0x3A)
    eyebrow_card.line.color.rgb = ACCENT_VIOLET
    eyebrow_card.line.width = Pt(0.5)
    eyebrow_card.adjustments[0] = 0.5
    add_text(s, "SEMESTER COURSE PROJECT",
             left=Inches(5.42), top=Inches(0.55), width=Inches(2.5), height=Inches(0.3),
             size=8, bold=True, font=BODY, color=ACCENT_VIOLET, align=PP_ALIGN.CENTER)

    # ── Wordmark ──────────────────────────────────────────────────────
    add_text(s, "VidIQ",
             left=Inches(0), top=Inches(1.05), width=SLIDE_W, height=Inches(1.6),
             size=128, bold=True, font=DISPLAY, color=FG_HIGH,
             align=PP_ALIGN.CENTER, line_spacing=1)

    # Triple-segment accent bar (violet · fuchsia · cyan) under wordmark
    seg_w = 0.8
    total_w = seg_w * 3 + 0.06 * 2
    start_x = (SLIDE_W.inches - total_w) / 2
    for i, c in enumerate([ACCENT_VIOLET, ACCENT_FUCHSIA, ACCENT_CYAN]):
        bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                 Inches(start_x + i * (seg_w + 0.06)), Inches(2.78),
                                 Inches(seg_w), Inches(0.08))
        bar.fill.solid()
        bar.fill.fore_color.rgb = c
        bar.line.fill.background()

    # Subtitle + tagline
    add_text(s, "AI Video Intelligence",
             left=Inches(0), top=Inches(2.95), width=SLIDE_W, height=Inches(0.5),
             size=22, bold=True, font=DISPLAY, color=ACCENT_VIOLET, align=PP_ALIGN.CENTER)
    add_text(s, "Watch less. Learn more.",
             left=Inches(0), top=Inches(3.45), width=SLIDE_W, height=Inches(0.5),
             size=16, font=BODY, color=FG_MID, align=PP_ALIGN.CENTER)

    # ── Team panel (left) + Course panel (right) ──────────────────────
    panel_y = Inches(4.25)
    panel_h = Inches(2.4)

    # Team — left card
    team_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                   Inches(1.0), panel_y,
                                   Inches(6.0), panel_h)
    team_card.fill.solid()
    team_card.fill.fore_color.rgb = BG_CARD
    team_card.line.color.rgb = ACCENT_VIOLET
    team_card.line.width = Pt(0.75)
    team_card.adjustments[0] = 0.05

    add_text(s, "GROUP MEMBERS",
             left=Inches(1.3), top=panel_y + Inches(0.18),
             width=Inches(5.4), height=Inches(0.28),
             size=10, bold=True, font=BODY, color=ACCENT_VIOLET)

    members = [
        ("22i-1653", "Insharah Aman"),
        ("21i-0416", "M. Nouman Hafeez"),
        ("21i-0484", "Shayan Khan"),
        ("21i-2507", "Muhammad Zain"),
        ("22i-1200", "Farhan Ahmed"),
    ]
    for i, (rno, name) in enumerate(members):
        y = panel_y + Inches(0.55 + i * 0.36)
        # roll number badge
        add_text(s, rno,
                 left=Inches(1.3), top=y, width=Inches(1.4), height=Inches(0.32),
                 size=11, bold=True, font=MONO, color=ACCENT_CYAN)
        # name
        add_text(s, name,
                 left=Inches(2.8), top=y, width=Inches(3.9), height=Inches(0.32),
                 size=14, font=BODY, color=FG_HIGH)

    # Course — right card
    course_card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                     Inches(7.3), panel_y,
                                     Inches(5.0), panel_h)
    course_card.fill.solid()
    course_card.fill.fore_color.rgb = BG_CARD
    course_card.line.color.rgb = ACCENT_FUCHSIA
    course_card.line.width = Pt(0.75)
    course_card.adjustments[0] = 0.05

    add_text(s, "COURSE",
             left=Inches(7.6), top=panel_y + Inches(0.18),
             width=Inches(4.5), height=Inches(0.28),
             size=10, bold=True, font=BODY, color=ACCENT_FUCHSIA)

    course_rows = [
        ("Course",     "Digital Marketing"),
        ("Section",    "CS-A"),
        ("Instructor", "Sir Maaz Zafar Cheema"),
        ("Project",    "Semester Course Project"),
    ]
    for i, (label, value) in enumerate(course_rows):
        y = panel_y + Inches(0.55 + i * 0.42)
        add_text(s, label.upper(),
                 left=Inches(7.6), top=y, width=Inches(1.3), height=Inches(0.3),
                 size=9, bold=True, font=BODY, color=FG_LOW)
        add_text(s, value,
                 left=Inches(8.95), top=y - Inches(0.02),
                 width=Inches(3.3), height=Inches(0.34),
                 size=14, bold=(label == "Project"), font=DISPLAY if label == "Project" else BODY,
                 color=FG_HIGH if label == "Project" else FG_HIGH)

    # ── Bottom URL pill (centered) ────────────────────────────────────
    url_pill = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                  Inches(4.42), Inches(7.0),
                                  Inches(4.5), Inches(0.4))
    url_pill.fill.solid()
    url_pill.fill.fore_color.rgb = RGBColor(0x1F, 0x12, 0x3A)
    url_pill.line.color.rgb = ACCENT_CYAN
    url_pill.line.width = Pt(0.6)
    url_pill.adjustments[0] = 0.5
    add_text(s, "🔗  vidiq-two.vercel.app",
             left=Inches(4.42), top=Inches(7.05), width=Inches(4.5), height=Inches(0.32),
             size=12, font=MONO, color=ACCENT_CYAN, align=PP_ALIGN.CENTER, bold=True)

    # ── Decorative floating orbs (small, on the diagonals) ────────────
    for cx, cy, dia, col in [
        (0.6, 0.6, 0.18, ACCENT_VIOLET),
        (12.6, 0.5, 0.12, ACCENT_FUCHSIA),
        (0.4, 6.95, 0.14, ACCENT_CYAN),
        (12.7, 7.05, 0.16, ACCENT_VIOLET),
    ]:
        orb = s.shapes.add_shape(MSO_SHAPE.OVAL,
                                 Inches(cx - dia / 2), Inches(cy - dia / 2),
                                 Inches(dia), Inches(dia))
        orb.fill.solid()
        orb.fill.fore_color.rgb = col
        orb.line.fill.background()

    # ── Apply a slide-level fade transition (XML insertion) ───────────
    try:
        from lxml import etree
        from pptx.oxml.ns import qn
        s_elem = s.element
        # PPTX transition XML
        trans_xml = (
            '<p:transition xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
            'spd="med">'
            '<p:fade/>'
            '</p:transition>'
        )
        trans = etree.fromstring(trans_xml)
        s_elem.append(trans)
    except Exception:
        pass

    set_notes(s,
        "Open with the hook from the ad: 'You hit play on a 90-min video and walked away three "
        "minutes later.' Pause. Introduce the team in one breath, then click straight to slide 2. "
        "Time: 30 seconds.")
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

    # Brand-applied-in-the-wild proof: FB cover sample
    cover = asset("IMG-8.png")
    if cover:
        add_image(s, cover,
                  left=Inches(7.5), top=Inches(5.95),
                  width=Inches(5.15), height=Inches(0.85),
                  border_color=ACCENT_VIOLET, border_pt=0.75)
        add_text(s, "FB cover · brand applied in the wild",
                 left=Inches(7.5), top=Inches(6.85), width=Inches(5.15), height=Inches(0.25),
                 size=9, font=MONO, color=FG_LOW, align=PP_ALIGN.CENTER)

    add_text(s, "Brand consistency: applied across 7 surfaces (favicon · top-nav · hero · OG card · JSON-LD · meta · cover).",
             left=Inches(0.7), top=Inches(6.55), width=Inches(6.5), height=Inches(0.5),
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

    # ── Embed the 30s video (auto-rendered as a movie shape) ─────────
    video_file = asset("video_ad.mp4")
    poster = asset("IMG-8.png")  # static frame shown before play
    video_left = Inches(4.65)
    video_top = Inches(5.1)
    video_w = Inches(4.0)
    video_h = Inches(2.25)  # 16:9 default poster

    if video_file:
        try:
            s.shapes.add_movie(
                str(video_file),
                video_left, video_top, video_w, video_h,
                poster_frame_image=str(poster) if poster else None,
                mime_type="video/mp4",
            )
        except Exception:
            # Fallback — link the video as a text reference if embedding fails
            add_text(s, "▶  video_ad.mp4 (in marketing/assets/video-ad/) — open from PowerPoint to play",
                     left=video_left, top=video_top, width=video_w, height=video_h,
                     size=12, font=MONO, color=ACCENT_VIOLET, align=PP_ALIGN.CENTER)
    else:
        add_text(s, "[ video missing — re-export and place in marketing/assets/video-ad/video_ad.mp4 ]",
                 left=video_left, top=video_top, width=video_w, height=video_h,
                 size=12, font=MONO, color=ACCENT_FUCHSIA, align=PP_ALIGN.CENTER)

    add_text(s, "Cutdowns:  30s master · 15s social · 6s bumper · 10s in-stream",
             left=Inches(0.7), top=Inches(6.95), width=Inches(12), height=Inches(0.4),
             size=11, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "Click the video to play it during presentation. The story-arc strip above stays "
                 "as a visual reference for the structure. Time: 35 seconds (the ad runs).")


def slide_7_social(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 2 · Social", "14-day calendar · FB Page · IG Business.", accent=ACCENT_CYAN)
    add_footer(s, "Pillar 2 · Social calendar")

    # Stat row at top — KPI #5 + #6 evidence numbers
    stats = [("28", "posts queued"), ("4", "formats"), ("7×", "weekly cadence"), ("2", "channels")]
    for i, (n, lbl) in enumerate(stats):
        x = Inches(0.7 + i * 1.65)
        add_card(s, left=x, top=Inches(2.4), width=Inches(1.5), height=Inches(1.05), accent=ACCENT_CYAN)
        add_text(s, n,
                 left=x, top=Inches(2.5), width=Inches(1.5), height=Inches(0.55),
                 size=28, bold=True, font=DISPLAY, color=ACCENT_CYAN, align=PP_ALIGN.CENTER)
        add_text(s, lbl.upper(),
                 left=x, top=Inches(3.05), width=Inches(1.5), height=Inches(0.3),
                 size=9, font=BODY, color=FG_MID, align=PP_ALIGN.CENTER)

    # Format chips on right of stat row
    add_text(s, "FORMATS",
             left=Inches(7.3), top=Inches(2.4), width=Inches(5), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=FG_LOW)
    formats = ["Reels", "Carousels", "Single image", "Stories"]
    for i, f in enumerate(formats):
        add_chip(s, f, left=Inches(7.3 + (i % 2) * 1.55), top=Inches(2.7 + (i // 2) * 0.4),
                 width=Inches(1.45), accent=ACCENT_CYAN)

    # Three real screenshots: Planner left (large), FB page top-right, IG welcome bottom-right
    planner = asset("planner-calendar.png")
    fb_page = asset("fb-page.png")
    fb_welcome = asset("fb-welcome-post.png")
    ig_welcome = asset("insta-welcome-post.jpeg", "insta-welcome-post.png")

    # Planner — large left panel
    add_text(s, "BUSINESS SUITE PLANNER · 28 POSTS QUEUED",
             left=Inches(0.7), top=Inches(3.65), width=Inches(6.5), height=Inches(0.25),
             size=9, bold=True, font=BODY, color=ACCENT_CYAN)
    add_image(s, planner,
              left=Inches(0.7), top=Inches(3.95), width=Inches(6.5), height=Inches(2.95),
              border_color=ACCENT_CYAN, border_pt=1)

    # FB page — top right
    add_text(s, "FB PAGE",
             left=Inches(7.3), top=Inches(3.65), width=Inches(2.6), height=Inches(0.25),
             size=9, bold=True, font=BODY, color=ACCENT_VIOLET)
    add_image(s, fb_page,
              left=Inches(7.3), top=Inches(3.95), width=Inches(2.6), height=Inches(1.4),
              border_color=ACCENT_VIOLET, border_pt=1)

    # FB welcome post + IG welcome post stacked
    add_text(s, "FB PINNED",
             left=Inches(7.3), top=Inches(5.45), width=Inches(2.6), height=Inches(0.25),
             size=9, bold=True, font=BODY, color=ACCENT_FUCHSIA)
    add_image(s, fb_welcome,
              left=Inches(7.3), top=Inches(5.7), width=Inches(2.6), height=Inches(1.2),
              border_color=ACCENT_FUCHSIA, border_pt=1)

    add_text(s, "IG PROFILE + WELCOME",
             left=Inches(10.1), top=Inches(3.65), width=Inches(2.55), height=Inches(0.25),
             size=9, bold=True, font=BODY, color=ACCENT_FUCHSIA)
    add_image(s, ig_welcome,
              left=Inches(10.1), top=Inches(3.95), width=Inches(2.55), height=Inches(2.95),
              border_color=ACCENT_FUCHSIA, border_pt=1)

    add_text(s, "Captions, hashtag stacks & Story rotation in 03-content-calendar.md & 05-social-templates.md",
             left=Inches(0.7), top=Inches(7.0), width=Inches(12), height=Inches(0.3),
             size=10, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "Land KPI #5 (14/14 days), KPI #6 (4 formats — exceeds 3+) and KPI #9 setup right here. "
                 "The Planner screenshot is the rubric evidence; FB+IG screenshots show the live identities. "
                 "Time: 45 seconds.")


def slide_8_meta_ads(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 2 · Meta Ads", "$280 / 14 days · 4 ad sets · 6 creatives · all built to Review.", accent=ACCENT_CYAN)
    add_footer(s, "Pillar 2 · Meta Ads")

    # 4 actual Ads Manager Review screenshots in 2x2 grid
    sets = [
        ("Ad Set 1 · Students", "meta-ad-set-1-students.png", ACCENT_VIOLET),
        ("Ad Set 2 · Creators", "meta-ad-set-2-creators.png", ACCENT_FUCHSIA),
        ("Ad Set 3 · Knowledge Workers", "meta-ad-set-3-knowledge.png", ACCENT_CYAN),
        ("Ad Set 4 · Retargeting", "meta-ad-set-4-retarget.png", ACCENT_EMERALD),
    ]

    cell_w = Inches(5.85)
    cell_h = Inches(2.15)
    label_h = Inches(0.3)

    for i, (label, fname, accent) in enumerate(sets):
        col = i % 2
        row = i // 2
        x = Inches(0.7 + col * 6.2)
        y = Inches(2.45 + row * (cell_h + label_h + Inches(0.15) / Inches(1)))
        # Compute y manually so it's consistent
        y = Inches(2.45 + row * 2.55)

        add_text(s, label,
                 left=x, top=y, width=cell_w, height=label_h,
                 size=11, bold=True, font=BODY, color=accent)
        add_image(s, asset(fname),
                  left=x, top=y + label_h,
                  width=cell_w, height=cell_h,
                  border_color=accent, border_pt=1)

    add_text(s, "Built in Ads Manager up to Review · saved as Draft · never published. $0 actual spend.",
             left=Inches(0.7), top=Inches(7.0), width=Inches(12), height=Inches(0.3),
             size=10, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "Showcase mode: 4 ad sets each with full Review-page screenshot. KPI #7 (Meta Ads "
                 "Strategy Completeness) and KPI #8 (Audience Definition Quality) — both Strong. Time: 55 seconds.")


def slide_9_conversation(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 2 · Always-on", "Welcome · away · FAQ · saved replies — KPI #9 evidence.", accent=ACCENT_CYAN)
    add_footer(s, "Pillar 2 · Templates")

    # 4 real screenshots from Business Suite Inbox / Automations
    items = [
        ("Greeting · DM welcome",       "auto-greeting.png",   ACCENT_VIOLET),
        ("Away message · outside hours", "auto-away.png",       ACCENT_FUCHSIA),
        ("FAQ shortcuts (5 set up)",    "auto-faq.png",        ACCENT_CYAN),
        ("Saved replies (5 templates)", "saved-replies.png",   ACCENT_EMERALD),
    ]

    cell_w = Inches(5.85)
    cell_h = Inches(2.15)

    for i, (label, fname, accent) in enumerate(items):
        col = i % 2
        row = i // 2
        x = Inches(0.7 + col * 6.2)
        y = Inches(2.45 + row * 2.55)

        add_text(s, label,
                 left=x, top=y, width=cell_w, height=Inches(0.3),
                 size=11, bold=True, font=BODY, color=accent)
        add_image(s, asset(fname),
                  left=x, top=y + Inches(0.3),
                  width=cell_w, height=cell_h,
                  border_color=accent, border_pt=1)

    add_text(s, "All four screenshots above = full evidence trail for KPI #9 (Automated Message / Welcome Note).",
             left=Inches(0.7), top=Inches(7.0), width=Inches(12), height=Inches(0.3),
             size=10, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "All four screens come from Business Suite → Inbox → Automated Responses + Saved Replies. "
                 "Show them quickly, emphasise the always-on conversational layer means leads never wait. Time: 30 seconds.")


def _kpi_color(score: int):
    if score >= 4:
        return ACCENT_EMERALD
    if score == 3:
        return ACCENT_AMBER
    return RGBColor(0xF4, 0x3F, 0x5E)


def slide_10_keywords(prs):
    s = add_blank_slide(prs)
    add_header(s, "Pillar 4 · SEO", "Full 18-keyword strategy · long-tail-first · per page mapping.", accent=ACCENT_AMBER)
    add_footer(s, "Pillar 4 · Keyword research")

    # ── Top-row stats (compact)
    stats = [
        ("18", "total KWs", ACCENT_AMBER),
        ("5", "short-tail",  ACCENT_FUCHSIA),
        ("13", "long-tail",   ACCENT_EMERALD),
        ("21.8", "avg KD",      ACCENT_CYAN),
    ]
    for i, (n, lbl, c) in enumerate(stats):
        x = Inches(0.5 + i * 1.55)
        add_card(s, left=x, top=Inches(2.32), width=Inches(1.4), height=Inches(0.85), accent=c)
        add_text(s, n, left=x, top=Inches(2.4), width=Inches(1.4), height=Inches(0.4),
                 size=22, bold=True, font=DISPLAY, color=c, align=PP_ALIGN.CENTER)
        add_text(s, lbl.upper(), left=x, top=Inches(2.85), width=Inches(1.4), height=Inches(0.3),
                 size=8, font=BODY, color=FG_MID, align=PP_ALIGN.CENTER)

    # ── Full keyword table (18 rows) ─────────────────────────────────
    kws = [
        # (#, keyword, type, MSV, KD, CPC, intent, page, in_ads)
        (1,  "ai video summarizer",                          "Short · Head", "27,100", 48, "1.85", "Commercial",        "/",        True),
        (2,  "youtube video summarizer",                     "Short · Head", "22,200", 42, "1.40", "Commercial",        "/",        True),
        (3,  "summarize youtube video",                      "Short",        "18,100", 39, "1.20", "Transactional",     "/analyze", True),
        (4,  "ai for video transcripts",                     "Short",         "4,400", 31, "0.90", "Informational",     "/analyze", True),
        (5,  "live stream ai summary",                       "Short · Niche", "1,600", 24, "1.10", "Commercial",        "/live",    True),
        (6,  "summarize a 2 hour youtube video",             "Long-tail",     "2,400", 19, "0.75", "Transactional",     "/analyze", True),
        (7,  "how to summarize a long youtube lecture free", "Long-tail",       "880", 12, "0.55", "Informational",     "/analyze", True),
        (8,  "best free ai tool to summarize video",         "Long-tail",     "1,900", 22, "1.05", "Commercial",        "/",        True),
        (9,  "chat with youtube video ai",                   "Long-tail",     "1,300", 18, "1.30", "Transactional",     "/analyze", True),
        (10, "extract key moments from video ai",            "Long-tail",       "720", 14, "0.85", "Commercial",        "/analyze", True),
        (11, "ai timestamp summary youtube",                 "Long-tail",       "590", 11, "0.65", "Informational",     "/analyze", False),
        (12, "youtube live stream transcript real time",     "Long-tail · Niche","480", 16, "0.95", "Commercial",        "/live",    True),
        (13, "webinar to text ai summary",                   "Long-tail · B2B","1,100", 25, "1.45", "Commercial",        "/live",    True),
        (14, "study with youtube ai summary",                "Long-tail",       "720", 13, "0.70", "Students",          "/",        True),
        (15, "summarize trading livestream ai",              "Long-tail · Niche","210",  8, "0.60", "Commercial",        "/live",    False),
        (16, "medical lecture video summarizer",             "Long-tail · Niche","320", 14, "1.20", "Commercial",        "/analyze", False),
        (17, "ai video keyframe extraction",                 "Long-tail · Tech","480", 17, "0.95", "Informational",     "/",        False),
        (18, "ai video to notes converter",                  "Long-tail",     "1,600", 20, "0.90", "Transactional",     "/analyze", True),
    ]

    table_y = Inches(3.3)
    cols_w = [Inches(0.4), Inches(3.5), Inches(1.6), Inches(0.95), Inches(0.75), Inches(0.7), Inches(1.45), Inches(1.2), Inches(0.45)]
    cols_x = [Inches(0.5)]
    for w in cols_w[:-1]:
        cols_x.append(cols_x[-1] + w)

    headers = ["#", "Keyword", "Type", "MSV", "KD", "CPC", "Intent", "Page", "Ads"]
    # header row
    for i, h in enumerate(headers):
        align = PP_ALIGN.LEFT if i in (1, 2, 6, 7) else PP_ALIGN.CENTER
        add_text(s, h.upper(), left=cols_x[i], top=table_y, width=cols_w[i], height=Inches(0.28),
                 size=8, bold=True, font=BODY, color=FG_LOW, align=align)
    # divider
    div = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                             Inches(0.5), table_y + Inches(0.32),
                             Inches(11.05), Inches(0.015))
    div.fill.solid(); div.fill.fore_color.rgb = ACCENT_AMBER; div.line.fill.background()

    # data rows
    row_h = Inches(0.21)
    for ri, (n, kw, typ, msv, kd, cpc, intent, page, in_ads) in enumerate(kws):
        y = table_y + Inches(0.42) + row_h * ri
        # alternating row tint
        if ri % 2 == 0:
            tint = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                      Inches(0.5), y - Inches(0.02),
                                      Inches(11.05), row_h)
            tint.fill.solid(); tint.fill.fore_color.rgb = RGBColor(0x14, 0x0E, 0x1E)
            tint.line.fill.background()

        kd_color = ACCENT_EMERALD if kd < 15 else (ACCENT_AMBER if kd < 30 else RGBColor(0xF4, 0x3F, 0x5E))

        add_text(s, str(n), left=cols_x[0], top=y, width=cols_w[0], height=row_h,
                 size=8, font=MONO, color=FG_LOW, align=PP_ALIGN.CENTER)
        add_text(s, kw, left=cols_x[1], top=y, width=cols_w[1], height=row_h,
                 size=9, font=BODY, color=FG_HIGH)
        add_text(s, typ, left=cols_x[2], top=y, width=cols_w[2], height=row_h,
                 size=8, font=BODY, color=FG_MID)
        add_text(s, msv, left=cols_x[3], top=y, width=cols_w[3], height=row_h,
                 size=9, font=MONO, color=ACCENT_CYAN, align=PP_ALIGN.RIGHT)
        add_text(s, str(kd), left=cols_x[4], top=y, width=cols_w[4], height=row_h,
                 size=9, bold=True, font=MONO, color=kd_color, align=PP_ALIGN.RIGHT)
        add_text(s, "$" + cpc, left=cols_x[5], top=y, width=cols_w[5], height=row_h,
                 size=9, font=MONO, color=FG_MID, align=PP_ALIGN.RIGHT)
        add_text(s, intent, left=cols_x[6], top=y, width=cols_w[6], height=row_h,
                 size=8, font=BODY, color=FG_MID)
        add_text(s, page, left=cols_x[7], top=y, width=cols_w[7], height=row_h,
                 size=8, font=MONO, color=ACCENT_VIOLET)
        add_text(s, "✓" if in_ads else "—", left=cols_x[8], top=y, width=cols_w[8], height=row_h,
                 size=10, bold=True, font=BODY,
                 color=ACCENT_EMERALD if in_ads else FG_LOW, align=PP_ALIGN.CENTER)

    add_text(s, "KD<15 (green) · KD 15-29 (amber) · KD 30+ (red)  ·  ✓ = also targeted in Google Ads (`08-google-ads-plan.md`)",
             left=Inches(0.5), top=Inches(7.1), width=Inches(12.5), height=Inches(0.25),
             size=8, font=BODY, color=FG_LOW, align=PP_ALIGN.CENTER)

    set_notes(s, "All 18 keywords with MSV, KD, CPC, intent, mapped page, and Google Ads inclusion. "
                 "Highlight: 5 short-tail head terms + 13 long-tail (meets KPI #15). "
                 "Long-tail-first because DA=1 makes head terms unrankable in 14 days. Time: 60 seconds.")


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
    add_header(s, "Pillar 4 · Google Ads", "$210 / 14 days · 3 campaigns · all built to Review.", accent=ACCENT_AMBER)
    add_footer(s, "Pillar 4 · Google Ads")

    campaigns = [
        ("Search · Brand Cluster",      "Maximise Conversions · 4 ad groups", "$70 / 14d",  "google-search-review.jpeg",  ACCENT_VIOLET),
        ("YouTube · In-Stream",         "Target CPM $4 · 30s skippable + 6s",  "$56 / 14d",  "google-youtube-review.jpeg", ACCENT_CYAN),
        ("Performance Max",              "Maximise Conversion Value · 3 asset groups", "$84 / 14d", "google-pmax-review.jpeg", ACCENT_FUCHSIA),
    ]

    cell_w = Inches(4.0)
    cell_h = Inches(2.6)

    for i, (name, sub, budget, fname, c) in enumerate(campaigns):
        x = Inches(0.5 + i * 4.2)

        # Title strip
        add_text(s, name,
                 left=x, top=Inches(2.4), width=cell_w, height=Inches(0.35),
                 size=14, bold=True, font=DISPLAY, color=c)
        add_text(s, sub,
                 left=x, top=Inches(2.75), width=cell_w, height=Inches(0.3),
                 size=10, font=BODY, color=FG_MID)
        add_text(s, budget,
                 left=x, top=Inches(3.05), width=cell_w, height=Inches(0.25),
                 size=9, font=MONO, color=c)

        # Real screenshot
        add_image(s, asset(fname, fname.replace(".jpeg", ".png")),
                  left=x, top=Inches(3.4),
                  width=cell_w, height=cell_h,
                  border_color=c, border_pt=1)

    # Bidding rules below
    add_text(s, "BIDDING + GUARDRAILS",
             left=Inches(0.5), top=Inches(6.2), width=Inches(5), height=Inches(0.25),
             size=9, bold=True, font=BODY, color=FG_LOW)
    rules = [
        "Start: Maximise Conversions  →  Switch to Target CPA $1.50 after 30 conv banked.",
        "Friday negative-keyword sweep: drop terms with > $5 spend, 0 conversions.",
        "PMax gated by conv volume; spare reallocates to Search if it doesn't unlock.",
    ]
    for i, r in enumerate(rules):
        add_text(s, f"·  {r}",
                 left=Inches(0.5), top=Inches(6.5 + i * 0.27), width=Inches(12.5), height=Inches(0.25),
                 size=9, font=BODY, color=FG_MID)

    set_notes(s, "All three screenshots are from the Review/Summary page in Google Ads (saved as Draft, "
                 "never published). Strategy from 08-google-ads-plan.md. KPI #17 (Google Ads Strategy "
                 "Completeness) and KPI #18 (Brand Alignment) — both Strong. Time: 50 seconds.")


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


def _3col_table(s, *, top, headers, rows, col_widths=None,
                left=Inches(0.5), accent_per_col=None,
                row_label_w=Inches(2.4), row_h=Inches(0.32),
                first_col_label=True):
    """Render a 3-column comparison table with optional first label column.

    `headers` = ['', 'VidIQ', 'NoteGPT', 'Eightify']  (first is label)
    `rows`    = list of [label, vidiq_val, notegpt_val, eightify_val]
    `accent_per_col` = [violet, cyan, amber] colours for each entity column header
    """
    if accent_per_col is None:
        accent_per_col = [ACCENT_VIOLET, ACCENT_CYAN, ACCENT_AMBER]

    if col_widths is None:
        # row label + 3 entity cols
        ent_w = Inches(3.18)
        col_widths = [row_label_w, ent_w, ent_w, ent_w]

    # column header strip
    x = left
    for ci, h in enumerate(headers):
        if ci == 0:
            add_text(s, h.upper() if h else "", left=x, top=top,
                     width=col_widths[0], height=Inches(0.32),
                     size=8, bold=True, font=BODY, color=FG_LOW)
        else:
            cap = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                     x + Inches(0.05), top,
                                     col_widths[ci] - Inches(0.1), Inches(0.32))
            cap.fill.solid()
            cap.fill.fore_color.rgb = accent_per_col[ci - 1]
            cap.line.fill.background()
            cap.adjustments[0] = 0.3
            tf = cap.text_frame
            tf.margin_top = Inches(0.04)
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.CENTER
            r = p.add_run()
            r.text = h
            r.font.name = DISPLAY
            r.font.size = Pt(11)
            r.font.bold = True
            r.font.color.rgb = BG_DEEP
        x += col_widths[ci]

    # data rows
    cur_y = top + Inches(0.42)
    for ri, row in enumerate(rows):
        # row tint (alternating)
        if ri % 2 == 0:
            tint = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                      left, cur_y - Inches(0.02),
                                      sum((w.inches for w in col_widths)) * 914400,
                                      row_h)
            tint.fill.solid(); tint.fill.fore_color.rgb = RGBColor(0x14, 0x0E, 0x1E)
            tint.line.fill.background()
        x = left
        for ci, val in enumerate(row):
            color = ACCENT_VIOLET if ci == 0 and first_col_label else FG_HIGH
            font = BODY
            size = 9
            if ci == 0:
                color = FG_LOW; font = BODY; size = 9
            add_text(s, str(val),
                     left=x + Inches(0.08), top=cur_y,
                     width=col_widths[ci] - Inches(0.16), height=row_h,
                     size=size, font=font, color=color)
            x += col_widths[ci]
        cur_y += row_h

    return cur_y


def slide_14_competitive(prs):
    """Section A — Company overview + Section C — Website/SEO."""
    s = add_blank_slide(prs)
    add_header(s, "Pillar 5 · Competitive", "Company overview · pricing · website & SEO.", accent=ACCENT_EMERALD)
    add_footer(s, "Pillar 5 · Competitive — Company & Web")

    # Section A — Company overview
    add_text(s, "SECTION A · COMPANY OVERVIEW",
             left=Inches(0.5), top=Inches(2.3), width=Inches(8), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=ACCENT_EMERALD)

    company_rows = [
        ("Brand name",       "VidIQ",                                              "NoteGPT",                       "Eightify"),
        ("Industry",         "AI · Video summarisation SaaS",                      "AI · Video summarisation",      "Chrome extension first"),
        ("Target audience",  "Students · educators · creators · domain pros",      "Students · knowledge workers",  "Power-YouTube viewers"),
        ("Value prop",       "Multimodal + grounded citations",                    "Free YT + PDF summariser",      "YouTube summary in 8 sec"),
        ("Pricing model",    "Free · paid tier roadmap",                           "Free 5/day → $4.99/mo",         "Free 4/day → $4.99/mo"),
        ("Website",          "vidiq-two.vercel.app",                               "notegpt.io",                    "eightify.app"),
    ]
    end_y = _3col_table(s, top=Inches(2.65),
                        headers=["ATTRIBUTE", "VidIQ", "NoteGPT", "Eightify"],
                        rows=company_rows,
                        accent_per_col=[ACCENT_VIOLET, ACCENT_CYAN, ACCENT_AMBER],
                        row_label_w=Inches(1.8))

    # Section C — Website & SEO
    add_text(s, "SECTION C · WEBSITE & SEO BASICS",
             left=Inches(0.5), top=end_y + Inches(0.15), width=Inches(8), height=Inches(0.3),
             size=10, bold=True, font=BODY, color=ACCENT_EMERALD)

    web_rows = [
        ("Domain Authority",   "1 (new)",                  "~28",                          "~31"),
        ("Monthly traffic",    "0 (new)",                  "~85,000",                      "~140,000"),
        ("Top KW #1",          "summarize 2-hr YT video",  "youtube summarizer",           "youtube summary chrome ext"),
        ("Top KW #2",          "live stream ai summary",   "summarize youtube video",      "eightify (brand)"),
        ("Top KW #3",          "chat with youtube ai",     "youtube to text",              "youtube ai summary"),
    ]
    _3col_table(s, top=end_y + Inches(0.5),
                headers=["ATTRIBUTE", "VidIQ", "NoteGPT", "Eightify"],
                rows=web_rows,
                accent_per_col=[ACCENT_VIOLET, ACCENT_CYAN, ACCENT_AMBER],
                row_label_w=Inches(1.8))

    set_notes(s, "Section A frames who's playing in this space. Section C exposes the authority gap "
                 "(DA 1 vs ~30) — that's why long-tail KW strategy in slide 10 is correct. "
                 "Time: 50 seconds.")


def slide_15_competitive_social(prs):
    """Section B — Social media presence (FB + IG)."""
    s = add_blank_slide(prs)
    add_header(s, "Pillar 5 · Competitive", "Social presence · Facebook & Instagram side-by-side.", accent=ACCENT_EMERALD)
    add_footer(s, "Pillar 5 · Competitive — Social")

    # Facebook block
    add_text(s, "📘  FACEBOOK",
             left=Inches(0.5), top=Inches(2.3), width=Inches(6), height=Inches(0.3),
             size=11, bold=True, font=DISPLAY, color=ACCENT_VIOLET)

    fb_rows = [
        ("Page handle",        "(to launch)",       "facebook.com/notegpt",  "facebook.com/eightifyapp"),
        ("Total followers",    "0",                 "~3,100",                "~620"),
        ("Avg likes/post",     "n/a",               "~12",                   "~4"),
        ("Posting freq",       "7/wk planned",      "~3/wk",                 "<1/wk"),
        ("Meta Ad activity",   "Setup phase",       "✓ Active (Q4 2025)",     "✗ Inactive"),
        ("Tone",               "Confident, calm",   "Functional, feature-led","Casual, meme-adjacent"),
    ]
    end_y = _3col_table(s, top=Inches(2.65),
                       headers=["ATTRIBUTE", "VidIQ", "NoteGPT", "Eightify"],
                       rows=fb_rows,
                       accent_per_col=[ACCENT_VIOLET, ACCENT_CYAN, ACCENT_AMBER],
                       row_label_w=Inches(1.8),
                       row_h=Inches(0.3))

    # Instagram block
    add_text(s, "📸  INSTAGRAM",
             left=Inches(0.5), top=end_y + Inches(0.15), width=Inches(6), height=Inches(0.3),
             size=11, bold=True, font=DISPLAY, color=ACCENT_FUCHSIA)

    ig_rows = [
        ("Handle",             "@vidiq.app (new)",  "@notegpt.official",      "@eightifyapp"),
        ("Total followers",    "0",                 "~5,800",                 "~1,900"),
        ("Avg likes/post",     "n/a",               "~80",                    "~25"),
        ("Posting freq",       "7/wk planned",      "~4/wk",                  "~1/wk"),
        ("Hashtags/post",      "8-12",              "~6",                     "~3"),
    ]
    _3col_table(s, top=end_y + Inches(0.5),
                headers=["ATTRIBUTE", "VidIQ", "NoteGPT", "Eightify"],
                rows=ig_rows,
                accent_per_col=[ACCENT_VIOLET, ACCENT_CYAN, ACCENT_AMBER],
                row_label_w=Inches(1.8),
                row_h=Inches(0.3))

    set_notes(s, "We're behind on raw follower numbers (zero — we just launched), but our planned cadence "
                 "(7/wk) is more aggressive than either competitor. NoteGPT actively spends on Meta ads — "
                 "we'll match that with our 4-ad-set plan in slide 8. Time: 50 seconds.")


def slide_16_swot(prs):
    """SWOT analysis — Strengths · Weaknesses · Opportunities · Threats."""
    s = add_blank_slide(prs)
    add_header(s, "Pillar 5 · SWOT", "Strengths · Weaknesses · Opportunities · Threats.", accent=ACCENT_EMERALD)
    add_footer(s, "Pillar 5 · SWOT analysis")

    # 2×2 SWOT grid
    quad_w = Inches(6.0)
    quad_h = Inches(2.5)

    quadrants = [
        # (icon, label, color, x, y, items)
        ("💪", "STRENGTHS", ACCENT_EMERALD, Inches(0.5), Inches(2.3), [
            "Multimodal AI: vision + audio + text fused (neither competitor)",
            "Live-stream pipeline — rare in this category",
            "Provider-agnostic backend with auto-failover (Gemini ↔ Groq ↔ OpenAI)",
            "Domain-aware modes (medical · legal · trading · education)",
            "Open-source-able product — potential dev-community pull",
        ]),
        ("⚠️", "WEAKNESSES", RGBColor(0xF4, 0x3F, 0x5E), Inches(6.85), Inches(2.3), [
            "Zero brand awareness · DA = 1",
            "Brand-name collision with vidiq.com (YouTube SEO tool)",
            "No mobile app yet (web-only)",
            "Small shipping team",
            "Demo blocked by YouTube's cloud-IP rate-limiting (HF Space)",
        ]),
        ("🎯", "OPPORTUNITIES", ACCENT_CYAN, Inches(0.5), Inches(5.0), [
            "Live-stream summarisation — neither competitor ships",
            "Vertical domains (medical / legal / trading) — first-mover",
            "Pakistani + South Asian education — low CPC, no localised competition",
            "Open-source release — fork the dev-tool audience",
            "Creator-first positioning — neither competitor markets to creators",
        ]),
        ("🚨", "THREATS", ACCENT_AMBER, Inches(6.85), Inches(5.0), [
            "YouTube native AI summaries (Google rolling out 2025)",
            "OpenAI / Anthropic native ChatGPT-with-video features",
            "Eightify's 280k Chrome extension users (switching cost)",
            "Free-tier API tightening (Gemini / Groq)",
            "Brand confusion with vidiq.com (YouTube SEO, ~10M visits/mo)",
        ]),
    ]

    for icon, label, color, x, y, items in quadrants:
        # quadrant card
        card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, quad_w, quad_h)
        card.fill.solid(); card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = color; card.line.width = Pt(0.75)
        card.adjustments[0] = 0.04

        # header strip
        add_text(s, f"{icon}  {label}",
                 left=x + Inches(0.2), top=y + Inches(0.15),
                 width=quad_w - Inches(0.4), height=Inches(0.35),
                 size=12, bold=True, font=DISPLAY, color=color)

        # divider
        sep = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                 x + Inches(0.2), y + Inches(0.55),
                                 quad_w - Inches(0.4), Inches(0.015))
        sep.fill.solid(); sep.fill.fore_color.rgb = color; sep.line.fill.background()

        # bullets
        for i, it in enumerate(items):
            add_text(s, f"·  {it}",
                     left=x + Inches(0.25), top=y + Inches(0.65 + i * 0.34),
                     width=quad_w - Inches(0.5), height=Inches(0.32),
                     size=10, font=BODY, color=FG_HIGH, line_spacing=1.2)

    set_notes(s, "Lead with strengths — live + multimodal + verticals are the durable moats. "
                 "Address the weakness (zero awareness) by tying it to the launch ad strategy. "
                 "Opportunities are where 'why now' lives. Threats are honest — YouTube's native summaries "
                 "are the biggest risk. Time: 60 seconds.")


def slide_17_kpi_tracker_full(prs):
    """Full 18-row KPI table grouped by pillar."""
    s = add_blank_slide(prs)
    add_header(s, "Pillar 5 · KPI Tracker", "Self-assessment across 18 KPIs · 5 pillars · 4.83 / 5 average.", accent=ACCENT_EMERALD)
    add_footer(s, "Pillar 5 · KPI tracker")

    # Summary stats top-right
    summary = [
        ("17", "STRONG", ACCENT_EMERALD),
        ("1", "ADEQUATE", ACCENT_AMBER),
        ("0", "NEEDS WORK", RGBColor(0xF4, 0x3F, 0x5E)),
        ("4.83", "AVG / 5", ACCENT_VIOLET),
    ]
    for i, (n, lbl, c) in enumerate(summary):
        x = Inches(0.5 + i * 1.55)
        card = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                  x, Inches(2.3), Inches(1.4), Inches(0.85))
        card.fill.solid(); card.fill.fore_color.rgb = BG_CARD
        card.line.color.rgb = c; card.line.width = Pt(0.75)
        card.adjustments[0] = 0.1
        add_text(s, n, left=x, top=Inches(2.38), width=Inches(1.4), height=Inches(0.45),
                 size=22, bold=True, font=DISPLAY, color=c, align=PP_ALIGN.CENTER)
        add_text(s, lbl, left=x, top=Inches(2.85), width=Inches(1.4), height=Inches(0.3),
                 size=8, font=BODY, color=FG_MID, align=PP_ALIGN.CENTER)

    # 18 KPI rows
    kpis = [
        # (#, pillar, name, score, evidence_short)
        (1,  "Brand", "Logo Design Completeness",          5, "Vector SVG + PNG · typography + colour rationale"),
        (2,  "Brand", "Colour Psychology Justification",   5, "01-brand-guide §4 — HSL/Hex + Mehta-Zhu citation"),
        (3,  "Brand", "30-Sec Video Ad Quality",           3, "Script + storyboard + master cut filmed (slide 6)"),
        (4,  "Brand", "Brand Consistency",                 5, "Audit across 7 surfaces — favicon · nav · hero · OG"),
        (5,  "Social","Content Calendar Coverage",         5, "28 posts (14 days × 2 channels) — Planner ss"),
        (6,  "Social","Post Type Variety",                 5, "4 formats — Reel · Carousel · Single · Story"),
        (7,  "Social","Meta Ads Strategy Completeness",    5, "Objective ✓ budget ✓ 4 ad sets ✓ 6 creatives ✓"),
        (8,  "Social","Target Audience Definition",        5, "Each ad set: age · location · interests · behaviour"),
        (9,  "Social","Welcome / Auto-Reply",              4, "Greeting · away · 5 FAQs · 5 saved replies"),
        (10, "Product","Functionality (0 broken links)",   5, "Live deploy · 9 routes 200 OK · vidiq-two.vercel.app"),
        (11, "Product","Brand Identity on Website",        5, "7 surfaces audited · same palette throughout"),
        (12, "Product","UI/UX Clarity",                    5, "Single CTA · TopNav · Aurora hero · TanStack Query"),
        (13, "Product","Mobile Responsiveness",            5, "Tailwind responsive · viewport · 390 px verified"),
        (14, "SEO",   "Keyword Research Depth",            5, "18 keywords with MSV + KD + CPC (slide 10)"),
        (15, "SEO",   "Long-tail vs Short-tail Balance",   5, "5 short-tail + 13 long-tail (≥5 each)"),
        (16, "SEO",   "On-Page SEO Coverage",              5, "Meta tags ✓ alt text ✓ headers ✓ KW usage ✓"),
        (17, "SEO",   "Google Ads Strategy Completeness",  5, "3 campaigns · 4 ad groups · RSAs · sitelinks (slide 12)"),
        (18, "SEO",   "Ad Creative Brand Alignment",       5, "All ad creative uses Pillar 1 visuals (slides 5-8)"),
    ]

    PILLAR_COLOR = {
        "Brand":   ACCENT_VIOLET,
        "Social":  ACCENT_CYAN,
        "Product": ACCENT_EMERALD,
        "SEO":     ACCENT_AMBER,
    }

    table_y = Inches(3.4)
    cols_w = [Inches(0.4), Inches(0.85), Inches(3.6), Inches(0.65), Inches(5.95)]
    cols_x = [Inches(0.5)]
    for w in cols_w[:-1]:
        cols_x.append(cols_x[-1] + w)

    # header
    headers = ["#", "PILLAR", "KPI METRIC", "SCORE", "EVIDENCE"]
    for i, h in enumerate(headers):
        add_text(s, h, left=cols_x[i], top=table_y, width=cols_w[i], height=Inches(0.26),
                 size=8, bold=True, font=BODY, color=FG_LOW)
    # divider
    div = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                             Inches(0.5), table_y + Inches(0.3),
                             Inches(11.45), Inches(0.015))
    div.fill.solid(); div.fill.fore_color.rgb = ACCENT_EMERALD
    div.line.fill.background()

    row_h = Inches(0.18)
    for ri, (n, pillar, name, score, evidence) in enumerate(kpis):
        y = table_y + Inches(0.4) + row_h * ri
        if ri % 2 == 0:
            tint = s.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                      Inches(0.5), y - Inches(0.02),
                                      Inches(11.45), row_h)
            tint.fill.solid(); tint.fill.fore_color.rgb = RGBColor(0x14, 0x0E, 0x1E)
            tint.line.fill.background()

        score_color = _kpi_color(score)
        pillar_color = PILLAR_COLOR.get(pillar, ACCENT_VIOLET)

        add_text(s, str(n), left=cols_x[0], top=y, width=cols_w[0], height=row_h,
                 size=8, font=MONO, color=FG_LOW, align=PP_ALIGN.CENTER)
        # pillar pill
        pill = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                  cols_x[1] + Inches(0.04), y + Inches(0.005),
                                  cols_w[1] - Inches(0.12), Inches(0.16))
        pill.fill.solid(); pill.fill.fore_color.rgb = pillar_color
        pill.line.fill.background()
        pill.adjustments[0] = 0.5
        tf = pill.text_frame
        tf.margin_left = Inches(0.04); tf.margin_top = Inches(0.0); tf.margin_bottom = Inches(0.0)
        p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
        r = p.add_run(); r.text = pillar.upper(); r.font.name = BODY; r.font.size = Pt(7); r.font.bold = True
        r.font.color.rgb = BG_DEEP

        add_text(s, name, left=cols_x[2], top=y, width=cols_w[2], height=row_h,
                 size=8, font=BODY, color=FG_HIGH)
        add_text(s, f"{score} / 5", left=cols_x[3], top=y, width=cols_w[3], height=row_h,
                 size=9, bold=True, font=DISPLAY, color=score_color, align=PP_ALIGN.CENTER)
        add_text(s, evidence, left=cols_x[4], top=y, width=cols_w[4], height=row_h,
                 size=7, font=BODY, color=FG_MID)

    add_text(s, "KPI #3 (video ad) at 3 — closes to 5 once edited cutdowns are exported.",
             left=Inches(0.5), top=Inches(7.05), width=Inches(12), height=Inches(0.25),
             size=9, font=BODY, color=FG_LOW)

    set_notes(s, "All 18 KPIs scored, evidence cited, average 4.83/5. The xlsx in data/DM_Competitive_KPI.xlsx "
                 "has the same scores. The single Adequate (KPI #3) closes to Strong once the video ad is "
                 "fully edited. Time: 60 seconds.")


def slide_18_kpi_scorecard(prs):
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


def slide_19_qa_backup(prs):
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
    slide_14_competitive(prs)              # Section A + Section C
    slide_15_competitive_social(prs)       # Section B (FB + IG)
    slide_16_swot(prs)                     # SWOT 2x2 grid
    slide_17_kpi_tracker_full(prs)         # All 18 KPIs in detail
    slide_18_kpi_scorecard(prs)            # 6x3 visual summary
    slide_19_qa_backup(prs)                # Q&A backup

    out_dir = Path(__file__).resolve().parent / "submissions"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "VidIQ_Final_Presentation.pptx"
    prs.save(out_file)
    print(f"✅ wrote {out_file} ({len(prs.slides)} slides)")


if __name__ == "__main__":
    main()
