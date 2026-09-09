#!/usr/bin/env python3
"""Generate the deterministic Vehicle Vitals media-library gap assets."""

from __future__ import annotations

import csv
import html
import math
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


REPO = Path(__file__).resolve().parents[2]
LIB = REPO / "media-library"
FONT = LIB / "shared-brand/fonts/Montserrat-Regular.ttf"
BOLD_FONT = LIB / "shared-brand/fonts/Montserrat-ExtraBold.ttf"
LOGO = LIB / "shared-brand/masters/complex-mark-transparent-4096.png"
YOUTUBE = LIB / "youtube/banner/candidate-2560x1440-safe-area-unverified.png"
CREAM = "#fffaf3"
CYAN = "#06b6d4"
TEAL = "#14b8a6"
SLATE = "#020617"


def font(size: int, heavy: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(BOLD_FONT if heavy else FONT), size=size)


def save_png(image: Image.Image, relative: str) -> Path:
    path = LIB / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(path, "PNG", optimize=True)
    return path


def cover_crop(image: Image.Image, size: tuple[int, int], center_y: float = 0.5) -> Image.Image:
    width, height = size
    scale = max(width / image.width, height / image.height)
    resized = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - width) // 2
    top = round((resized.height - height) * center_y)
    return resized.crop((left, top, left + width, top + height))


def darken(image: Image.Image, factor: float = 0.72) -> Image.Image:
    return ImageEnhance.Brightness(image.convert("RGB")).enhance(factor)


def mark(max_size: tuple[int, int]) -> Image.Image:
    source = Image.open(LOGO).convert("RGBA")
    bbox = source.getbbox()
    source = source.crop(bbox) if bbox else source
    source.thumbnail(max_size, Image.Resampling.LANCZOS)
    return source


def wordmark(draw: ImageDraw.ImageDraw, xy: tuple[int, int], size: int, tracking: int = 2) -> tuple[int, int]:
    x, y = xy
    face = font(size, heavy=True)
    for text, color in (("VEHICLE-", CREAM), ("VITALS", TEAL)):
        for char in text:
            draw.text((x, y), char, font=face, fill=color)
            x += round(draw.textlength(char, font=face)) + tracking
    return x, y + size


def branded_background(size: tuple[int, int]) -> Image.Image:
    width, height = size
    image = Image.new("RGB", size, SLATE)
    px = image.load()
    for y in range(height):
        for x in range(width):
            glow = max(0.0, 1.0 - (((x - width * 0.55) / width) ** 2 + ((y - height * 0.45) / height) ** 2) * 5)
            px[x, y] = (2, 6 + round(10 * glow), 23 + round(24 * glow))
    draw = ImageDraw.Draw(image, "RGBA")
    step = max(48, width // 16)
    for offset in range(-height, width, step):
        draw.line((offset, 0, offset + height, height), fill=(6, 182, 212, 24), width=max(1, width // 900))
    return image


def generate_headers() -> None:
    source = Image.open(YOUTUBE).convert("RGB")
    save_png(darken(cover_crop(source, (1500, 500), 0.50), 0.84), "x/header/vehicle-vitals-header-1500x500.png")
    facebook = darken(cover_crop(source, (1640, 624), 0.50), 0.86)
    save_png(facebook, "facebook/cover/vehicle-vitals-cover-master-1640x624.png")
    save_png(facebook.resize((820, 312), Image.Resampling.LANCZOS), "facebook/cover/vehicle-vitals-cover-820x312.png")

    reddit = branded_background((1080, 128))
    logo = mark((96, 96))
    reddit.alpha_composite(logo, (188, (128 - logo.height) // 2)) if reddit.mode == "RGBA" else reddit.paste(logo, (188, (128 - logo.height) // 2), logo)
    draw = ImageDraw.Draw(reddit)
    wordmark(draw, (310, 35), 56, 1)
    save_png(reddit, "reddit/banner/vehicle-vitals-community-banner-1080x128.png")

    feature = branded_background((1024, 500))
    feature = feature.convert("RGBA")
    logo = mark((250, 250))
    feature.alpha_composite(logo, (72, 86))
    draw = ImageDraw.Draw(feature)
    wordmark(draw, (342, 138), 56, 1)
    draw.text((346, 218), "Maintenance records that move with you.", font=font(23), fill=CREAM)
    draw.rounded_rectangle((346, 278, 610, 334), radius=28, fill=TEAL)
    draw.text((378, 291), "TRACK. PLAN. DRIVE.", font=font(19, True), fill=SLATE)
    save_png(feature, "android-app/google-play/feature-graphic-1024x500.png")


def svg_template(width: int, height: int, title: str, subtitle: str, relative_logo: str) -> str:
    margin = round(width * 0.075)
    logo_size = round(min(width, height) * 0.13)
    title_size = round(min(width, height) * 0.074)
    subtitle_size = round(min(width, height) * 0.03)
    caption_y = round(height * 0.76)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#020617"/><stop offset="1" stop-color="#06304a"/></linearGradient>
    <style>@font-face {{ font-family: Montserrat; src: url('{relative_logo}../../../shared-brand/fonts/Montserrat-VariableFont_wght.ttf'); }} text {{ font-family: Montserrat, sans-serif; }}</style>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <path d="M0 {round(height*.62)} L{width} {round(height*.42)} L{width} {height} L0 {height}Z" fill="#06b6d4" opacity=".10"/>
  <image href="{relative_logo}../../../shared-brand/masters/complex-mark-transparent-4096.png" x="{margin}" y="{margin}" width="{logo_size}" height="{logo_size}" preserveAspectRatio="xMidYMid meet"/>
  <text x="{margin}" y="{round(height*.34)}" font-size="{title_size}" font-weight="800" fill="#fffaf3">{html.escape(title)}</text>
  <text x="{margin}" y="{round(height*.40)}" font-size="{subtitle_size}" font-weight="500" fill="#14b8a6">{html.escape(subtitle)}</text>
  <rect x="{margin}" y="{caption_y}" width="{width-2*margin}" height="{round(height*.15)}" rx="{round(height*.025)}" fill="#020617" stroke="#06b6d4" stroke-width="{max(2,width//500)}"/>
  <text x="{margin+round(width*.035)}" y="{caption_y+round(height*.065)}" font-size="{subtitle_size}" font-weight="700" fill="#fffaf3">CAPTION / KEY MESSAGE</text>
  <text x="{margin+round(width*.035)}" y="{caption_y+round(height*.108)}" font-size="{round(subtitle_size*.7)}" fill="#fffaf3" opacity=".72">Keep copy concise; replace this placeholder before publishing.</text>
  <text x="{margin}" y="{height-round(height*.035)}" font-size="{round(subtitle_size*.65)}" font-weight="700" fill="#14b8a6">VEHICLE-VITALS</text>
</svg>'''


def generate_social_templates() -> None:
    specs = [(1080, 1080, "square"), (1080, 1350, "portrait"), (1080, 1920, "story")]
    base = LIB / "shared-content/templates/social-posts"
    for width, height, name in specs:
        path = base / f"vehicle-vitals-{name}-{width}x{height}.svg"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(svg_template(width, height, "YOUR HEADLINE", "Supporting message", ""), encoding="utf-8")
        preview = branded_background((width, height))
        draw = ImageDraw.Draw(preview)
        margin = round(width * 0.075)
        logo = mark((round(min(width, height) * 0.13),) * 2)
        preview.paste(logo, (margin, margin), logo)
        draw.text((margin, round(height * 0.27)), "YOUR HEADLINE", font=font(round(min(width, height) * 0.074), True), fill=CREAM)
        draw.text((margin, round(height * 0.37)), "Supporting message", font=font(round(min(width, height) * 0.03)), fill=TEAL)
        caption_y = round(height * 0.76)
        draw.rounded_rectangle(
            (margin, caption_y, width - margin, caption_y + round(height * 0.15)),
            radius=round(height * 0.025), fill=SLATE, outline=CYAN, width=max(2, width // 500),
        )
        draw.text((margin + round(width * 0.035), caption_y + round(height * 0.035)), "CAPTION / KEY MESSAGE", font=font(round(min(width, height) * 0.03), True), fill=CREAM)
        draw.text((margin + round(width * 0.035), caption_y + round(height * 0.09)), "Replace this placeholder before publishing.", font=font(round(min(width, height) * 0.021)), fill=CREAM)
        preview.save(path.with_suffix(".png"), "PNG", optimize=True)

    carousel = branded_background((1080, 1350))
    draw = ImageDraw.Draw(carousel)
    logo = mark((180, 180))
    carousel.paste(logo, (80, 72), logo)
    draw.text((80, 405), "MAINTENANCE,", font=font(83, True), fill=CREAM)
    draw.text((80, 500), "MADE CLEAR.", font=font(83, True), fill=TEAL)
    draw.text((82, 640), "Carousel cover template", font=font(34), fill=CREAM)
    draw.text((82, 1160), "1 / 5", font=font(26, True), fill=CYAN)
    save_png(carousel, "shared-content/templates/carousel/carousel-cover-1080x1350.png")

    cta = branded_background((1080, 1350))
    draw = ImageDraw.Draw(cta)
    logo = mark((300, 300))
    cta.paste(logo, ((1080 - logo.width) // 2, 220), logo)
    draw.text((540, 640), "KEEP YOUR VEHICLE", font=font(55, True), fill=CREAM, anchor="mm")
    draw.text((540, 710), "RECORDS MOVING.", font=font(55, True), fill=TEAL, anchor="mm")
    draw.rounded_rectangle((250, 840, 830, 955), radius=58, fill=TEAL)
    draw.text((540, 897), "LEARN MORE", font=font(42, True), fill=SLATE, anchor="mm")
    draw.text((540, 1160), "vehicle-vitals.com", font=font(30, True), fill=CREAM, anchor="mm")
    save_png(cta, "shared-content/templates/carousel/cta-end-card-1080x1350.png")


def generate_video_overlay() -> None:
    overlay = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle((0, 0, 1080, 610), fill=(2, 6, 23, 242))
    draw.rectangle((0, 1310, 1080, 1920), fill=(2, 6, 23, 242))
    logo = mark((170, 170))
    overlay.alpha_composite(logo, (72, 88))
    draw.text((72, 338), "FEATURE PREVIEW", font=font(54, True), fill=CREAM)
    draw.text((72, 420), "Replace title and captions before publishing.", font=font(26), fill=TEAL)
    draw.rounded_rectangle((72, 1435, 1008, 1675), radius=30, fill=(2, 6, 23, 245), outline=CYAN, width=4)
    draw.text((112, 1505), "ON-SCREEN CAPTION ZONE", font=font(35, True), fill=CREAM)
    draw.text((112, 1570), "Keep essential text above platform controls.", font=font(25), fill=CREAM)
    draw.text((72, 1812), "VEHICLE-VITALS", font=font(28, True), fill=TEAL)
    path = LIB / "shared-content/templates/video/vertical-video-overlay-1080x1920.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    overlay.save(path, "PNG", optimize=True)


def make_vertical_clips() -> None:
    selections = [
        ("maintenance-planning-demo.mp4", "maintenance-planning", "Plan maintenance before it becomes urgent."),
        ("vin-lookup-demo.mp4", "vin-lookup", "Start with the right vehicle details."),
        ("ownership-history-demo.mp4", "ownership-history", "Keep ownership records in one place."),
        ("cross-platform-access-demo.mp4", "cross-platform-access", "Your vehicle history, wherever you need it."),
        ("help-center-overview.mp4", "help-center", "Find answers and keep moving."),
    ]
    source_dir = LIB / "website/runtime/videos/feature-demos"
    out_dir = LIB / "shared-content/video/vertical-feature-clips"
    out_dir.mkdir(parents=True, exist_ok=True)
    for filename, slug, caption in selections:
        output = out_dir / f"{slug}-1080x1920.mp4"
        overlay = Image.new("RGBA", (1080, 1920), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle((0, 0, 1080, 545), fill=(2, 6, 23, 235))
        overlay_draw.rectangle((0, 1375, 1080, 1920), fill=(2, 6, 23, 235))
        overlay_logo = mark((145, 145))
        overlay.alpha_composite(overlay_logo, (64, 65))
        overlay_draw.text((64, 286), "VEHICLE-VITALS", font=font(43, True), fill=TEAL)
        overlay_draw.rounded_rectangle((64, 1450, 1016, 1695), radius=30, fill=(2, 6, 23, 245), outline=CYAN, width=4)
        overlay_draw.multiline_text((104, 1505), caption, font=font(39, True), fill=CREAM, spacing=10)
        overlay_draw.text((64, 1810), "FEATURE PREVIEW", font=font(27, True), fill=TEAL)
        filtergraph = (
            "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:12,eq=brightness=-0.34[bg];"
            "[0:v]scale=1080:608:force_original_aspect_ratio=decrease[fg];"
            "[bg][fg]overlay=(W-w)/2:(H-h)/2[base];[base][1:v]overlay=0:0[v]"
        )
        with tempfile.TemporaryDirectory(prefix="vehicle-vitals-media-") as tmp:
            overlay_path = Path(tmp) / "overlay.png"
            overlay.save(overlay_path, "PNG")
            subprocess.run([
                "ffmpeg", "-y", "-loglevel", "error", "-i", str(source_dir / filename),
                "-loop", "1", "-i", str(overlay_path), "-filter_complex", filtergraph,
                "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-preset", "medium",
                "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac",
                "-shortest", "-movflags", "+faststart", str(output)
            ], check=True)
        duration = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(output)
        ], text=True).strip()
        end = max(1, math.ceil(float(duration)))
        (out_dir / f"{slug}.srt").write_text(
            f"1\n00:00:00,000 --> 00:00:{end:02d},000\n{caption}\n", encoding="utf-8"
        )


def make_brand_guide() -> None:
    output = REPO / "output/pdf/vehicle-vitals-brand-usage-guide.pdf"
    output.parent.mkdir(parents=True, exist_ok=True)
    pdfmetrics.registerFont(TTFont("Montserrat", str(FONT)))
    pdfmetrics.registerFont(TTFont("Montserrat-ExtraBold", str(BOLD_FONT)))
    page_w, page_h = landscape(letter)
    c = canvas.Canvas(str(output), pagesize=(page_w, page_h))
    c.setFillColor(SLATE)
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)
    with tempfile.TemporaryDirectory(prefix="vehicle-vitals-guide-") as tmp:
        guide_mark = Path(tmp) / "complex-mark.png"
        mark((900, 900)).save(guide_mark, "PNG")
        c.drawImage(str(guide_mark), 42, page_h - 150, 105, 105, preserveAspectRatio=True, mask="auto")
    c.setFont("Montserrat-ExtraBold", 28)
    c.setFillColor(CREAM)
    c.drawString(165, page_h - 83, "VEHICLE-")
    c.setFillColor(TEAL)
    c.drawString(315, page_h - 83, "VITALS")
    c.setFont("Montserrat", 10)
    c.setFillColor(CREAM)
    c.drawString(165, page_h - 106, "Brand usage quick guide  |  September 2026")

    def heading(x: float, y: float, text: str) -> None:
        c.setFont("Montserrat-ExtraBold", 12)
        c.setFillColor(CYAN)
        c.drawString(x, y, text.upper())

    def body(x: float, y: float, lines: list[str], leading: float = 14) -> None:
        c.setFont("Montserrat", 8.6)
        c.setFillColor(CREAM)
        for line in lines:
            c.drawString(x, y, line)
            y -= leading

    heading(42, 420, "Canonical identity")
    body(42, 397, [
        "Use the complex shield + speedometer + split V road + document-check badge.",
        "The simplified roof-chevron mark is retired as a primary identity.",
        "Use it only when a platform preview proves the complex detail is illegible.",
    ])
    heading(42, 330, "Clear space and minimum size")
    body(42, 307, [
        "Clear space: at least 1/4 of the mark width on all sides.",
        "Digital minimum: 48 px. Social/profile preferred: 180 px or larger.",
        "Below 48 px, use the approved fallback only after preview testing.",
    ])
    heading(42, 240, "Wordmark")
    body(42, 217, [
        "Montserrat ExtraBold, uppercase, wide tracking.",
        "VEHICLE- in Cream; VITALS in Teal. Keep the hyphen.",
        "Do not recreate with an unbundled or substitute font.",
    ])

    heading(410, 420, "Core palette")
    colors = [(SLATE, "SLATE GROUND", "#020617"), (CYAN, "CYAN", "#06B6D4"), (TEAL, "TEAL", "#14B8A6"), (CREAM, "CREAM", "#FFFAF3")]
    for index, (color, name, value) in enumerate(colors):
        x = 410 + (index % 2) * 170
        y = 375 - (index // 2) * 82
        c.setFillColor(color)
        c.roundRect(x, y, 44, 44, 7, fill=1, stroke=0)
        c.setFont("Montserrat-ExtraBold", 8.5)
        c.setFillColor(CREAM)
        c.drawString(x + 56, y + 27, name)
        c.drawString(x + 56, y + 12, value)

    heading(410, 235, "Do")
    body(410, 212, [
        "- Use the approved transparent master on high-contrast grounds.",
        "- Preserve proportions and original colors.",
        "- Inspect circular crops and small-size rendering before publishing.",
    ])
    heading(410, 145, "Do not")
    body(410, 122, [
        "- Stretch, rotate, outline, recolor, or add effects to the mark.",
        "- Use the washed-out alternate export.",
        "- Reintroduce the simplified mark as the primary identity.",
    ])
    c.setStrokeColor(CYAN)
    c.setLineWidth(1)
    c.line(42, 36, page_w - 42, 36)
    c.setFont("Montserrat", 7.5)
    c.setFillColor(CREAM)
    c.drawString(42, 20, "Source of truth: media-library/shared-brand/masters/complex-mark-transparent-4096.png")
    c.save()
    guide_dir = LIB / "shared-brand/guidelines"
    guide_dir.mkdir(parents=True, exist_ok=True)
    (guide_dir / output.name).write_bytes(output.read_bytes())


def write_copy_library() -> None:
    path = LIB / "shared-content/copy/alt-text-and-captions.csv"
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = [
        ("complex-mark", "Vehicle Vitals shield logo combining a speedometer, split V-shaped road, and document check badge.", "Vehicle records that move with you."),
        ("garage", "Vehicle Vitals garage screen showing saved vehicles and maintenance status summaries.", "All your vehicles. One clear garage."),
        ("vehicle-detail", "Vehicle detail screen with mileage, maintenance status, and record shortcuts.", "See the details that help you plan what comes next."),
        ("records", "Vehicle records screen organizing service and ownership documents.", "Keep important vehicle records together."),
        ("maintenance-plan", "Maintenance plan screen listing upcoming service items and recommended timing.", "Plan maintenance before it becomes urgent."),
        ("service-history", "Service history screen showing completed maintenance entries in chronological order.", "A service history you can actually use."),
        ("shops-services", "Shops and services screen for organizing vehicle service providers.", "Keep trusted service information close at hand."),
        ("play-feature-graphic", "Vehicle Vitals logo and garage screen on a dark blue background with the message Maintenance records that move with you.", "Track. Plan. Drive."),
    ]
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["asset_id", "alt_text", "caption"])
        writer.writerows(rows)


def main() -> None:
    for required in (FONT, BOLD_FONT, LOGO, YOUTUBE):
        if not required.is_file():
            raise SystemExit(f"Missing required source: {required}")
    generate_headers()
    generate_social_templates()
    generate_video_overlay()
    make_vertical_clips()
    make_brand_guide()
    write_copy_library()
    print("Generated media-library gap assets.")


if __name__ == "__main__":
    main()
