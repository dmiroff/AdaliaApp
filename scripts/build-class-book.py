#!/usr/bin/env python3
"""Build the public class book and optionally export the full T1 and T2 WebP cards.

Use --t3-cards to substitute the approved NN-Class-name.png artwork exports.
Install Pillow and ReportLab and have the DejaVu fonts available. WebP card
export also uses pdftoppm.
"""

import argparse
import json
import subprocess
from collections import defaultdict
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from xml.sax.saxutils import escape

from PIL import Image, ImageOps
from reportlab import rl_config
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[1]
BOOK = ROOT / "public/help-books/adalia-class-book.pdf"
COVER_ART = ROOT / "src/assets/Images/background-mobile.webp"
PORTRAITS = ROOT / "public/help-images/classes"
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
WIDTH, HEIGHT = A5
MARGIN = 31
CARD_WIDTH = WIDTH - 2 * MARGIN
CARD_PADDING = 21
PORTRAIT_HEIGHT = CARD_WIDTH * 300 / 640
INK = HexColor("#30241d")
MUTED = HexColor("#71583d")
GOLD = HexColor("#ad865b")
PAPER = HexColor("#faf3e3")
CREAM = HexColor("#fff1d6")
CARD_INK = HexColor("#eeeae0")
CARD_GOLD = HexColor("#c1ac79")
CARD_BACKGROUND = HexColor("#18191a")
TRANSITIONS = {1: "Классы Т1", 2: "Т1 → Т2", 3: "Т2 → Т3"}


def load_cards(tier):
    path = ROOT / f"src/data/t{tier}ClassGuide.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if tier == 1 else data["classes"]


def load_t3_art(directory, cards):
    # Restrict the inputs to the public roster. Full mirror exports also contain
    # cards for undisclosed classes.
    known_names = {card["name"] for card in cards}
    if directory is None:
        directory = PORTRAITS / "t3-cards"
        art = {name: directory / f"{name}.webp" for name in known_names}
        for path in art.values():
            if not path.is_file():
                raise FileNotFoundError(path)
        return art
    art = {}
    for path in sorted(directory.glob("*.png")):
        name = path.stem.partition("-")[2].replace("-", " ")
        if name not in known_names or name in art:
            raise ValueError(f"Unexpected T3 card export: {path.name}")
        art[name] = path
    if missing := known_names - art.keys():
        raise ValueError(f"Missing T3 card exports: {', '.join(sorted(missing))}")
    return art


def fonts():
    for name, file in (
        ("BookSerif", "DejaVuSerif.ttf"),
        ("BookSans", "DejaVuSans.ttf"),
        ("BookSansBold", "DejaVuSans-Bold.ttf"),
    ):
        pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / file)))
    pdfmetrics.registerFontFamily("BookSans", normal="BookSans", bold="BookSansBold")
    return {
        "name": ParagraphStyle("name", fontName="BookSerif", fontSize=26, leading=33, textColor=CARD_INK),
        "tier": ParagraphStyle("tier", fontName="BookSans", fontSize=8.2, leading=12, textColor=CARD_GOLD),
        "heading": ParagraphStyle("heading", fontName="BookSerif", fontSize=10, leading=14, textColor=CARD_GOLD),
        "body": ParagraphStyle("body", fontName="BookSans", fontSize=9.6, leading=13.4, textColor=CARD_INK),
    }


def plain(text):
    return escape(text.translate(str.maketrans({"–": "-", "—": "-", "‑": "-"})))


def layout_lower_card(card, tier, t2_cards, styles):
    step = "ПЕРВАЯ" if tier == 1 else "ВТОРАЯ"
    parts = [
        (f"АДАЛИЯ / {step} СТУПЕНЬ", "tier", 3),
        (plain(card["name"]), "name", 12),
        (plain(card["summary"]), "body", 13),
        ("В БОЮ", "heading", 3),
        (plain(card["play"]), "body", 12),
    ]
    if tier == 1:
        branches = ", ".join(entry["name"] for entry in t2_cards if card["name"] in entry["parents"])
        parts.extend([
            ("ХАРАКТЕРИСТИКИ", "heading", 3),
            (f'<b>Базовое здоровье.</b> {card["health"]} (+{card["healthPerLevel"]} за уровень)', "body", 3),
            (f'<b>Базовые ячейки заклинаний.</b> {card["spellSlots"]}', "body", 12),
            ("ВЕТКИ Т2", "heading", 3),
            (plain(branches), "body", 0),
        ])
    else:
        parts.extend([
            ("ИСХОДНЫЙ КЛАСС Т1", "heading", 3),
            (plain(" / ".join(card["parents"])), "body", 0),
        ])
    blocks = []
    for text, style, gap in parts:
        paragraph = Paragraph(text, styles[style])
        _, height = paragraph.wrap(CARD_WIDTH - 2 * CARD_PADDING, HEIGHT)
        blocks.append((paragraph, height, gap, style))
    height = PORTRAIT_HEIGHT + CARD_PADDING + sum(height + gap for _, height, gap, _ in blocks)
    return height, blocks


def chapters(cards_by_tier):
    t1_by_t2 = {card["name"]: card["parents"][0] for card in cards_by_tier[2]}
    starters = cards_by_tier[1]
    yield 1, "Начальные классы", "tier1-starters", len(starters), 3, starters
    page_number = 3 + len(starters)
    for tier in (2, 3):
        families = defaultdict(list)
        for card in cards_by_tier[tier]:
            origin = card["parents"][0]
            family = origin if tier == 2 else t1_by_t2[origin]
            families[family].append(card)
        for index, starter in enumerate(starters):
            family = starter["name"]
            branch = families[family]
            if not branch:
                continue
            yield tier, family, f"tier{tier}-branch{index}", len(branch), page_number, branch
            page_number += len(branch)


def text(canvas, label, x, y, *, font="BookSans", size=10, color=INK):
    canvas.setFillColor(color)
    canvas.setFont(font, size)
    canvas.drawString(x, y, label)


def cover(canvas, counts):
    with Image.open(COVER_ART) as original:
        art = ImageOps.fit(original.convert("RGB"), (round(WIDTH * 2), round(HEIGHT * 2)), centering=(0.5, 0.45))
    picture = BytesIO()
    art.save(picture, "JPEG", quality=87, optimize=True)
    picture.seek(0)
    canvas.drawImage(ImageReader(picture), 0, 0, WIDTH, HEIGHT)
    canvas.setStrokeColor(GOLD)
    canvas.roundRect(15, 15, WIDTH - 30, HEIGHT - 30, 6, stroke=1, fill=0)
    canvas.saveState()
    canvas.setFillColor(HexColor("#211914"))
    canvas.setFillAlpha(0.94)
    canvas.roundRect(MARGIN - 5, HEIGHT - 267, CARD_WIDTH + 10, 217, 8, stroke=0, fill=1)
    canvas.restoreState()
    x = MARGIN + 14
    text(canvas, "АДАЛИЯ · ЗАПАДНЫЙ ФРОНТИР", x, HEIGHT - 79, font="BookSansBold", size=10, color=CREAM)
    text(canvas, "Книга классов", x, HEIGHT - 132, font="BookSerif", size=34, color=CREAM)
    text(canvas, "Т1 → Т2 → Т3", x, HEIGHT - 167, size=19, color=CREAM)
    text(canvas, f"{counts[1]} класса Т1 · {counts[2]} специализаций Т2 · {counts[3]} классов Т3",
         x, HEIGHT - 201, size=10.5, color=CREAM)
    text(canvas, "Открыть оглавление →", x, HEIGHT - 239, font="BookSansBold", size=11, color=CREAM)
    canvas.linkRect("", "contents", (x - 4, HEIGHT - 248, x + 184, HEIGHT - 223), relative=0, thickness=0)
    canvas.showPage()


def page_frame(canvas, page_number, *, contents_link=True):
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)
    text(canvas, "АДАЛИЯ · КНИГА КЛАССОВ", MARGIN, HEIGHT - 29, font="BookSansBold", size=8.5, color=MUTED)
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.55)
    canvas.line(MARGIN, HEIGHT - 39, WIDTH - MARGIN, HEIGHT - 39)
    canvas.line(MARGIN, 43, WIDTH - MARGIN, 43)
    if contents_link:
        text(canvas, "Оглавление", MARGIN, 25, size=8.5, color=MUTED)
        canvas.linkRect("", "contents", (MARGIN, 20, MARGIN + 75, 36), relative=0, thickness=0)
    canvas.setFillColor(MUTED)
    canvas.setFont("BookSans", 8.5)
    canvas.drawRightString(WIDTH - MARGIN, 25, str(page_number))


def contents(canvas, chapter_list):
    page_frame(canvas, 2, contents_link=False)
    canvas.bookmarkPage("contents")
    canvas.addOutlineEntry("Оглавление", "contents")
    text(canvas, "Оглавление", MARGIN, HEIGHT - 77, font="BookSerif", size=25)
    y = HEIGHT - 119
    for tier, note in (
        (1, "Доступны при создании персонажа."),
        (2, "Задания на специализацию доступны у тренера с 10-го уровня."),
        (3, "Классы Т3 проходят испытания на зеркале."),
    ):
        text(canvas, TRANSITIONS[tier], MARGIN, y, font="BookSerif", size=18)
        text(canvas, note, MARGIN, y - 19, size=9, color=MUTED)
        y -= 48
        for chapter_tier, family, key, count, number, _ in chapter_list:
            if tier != chapter_tier:
                continue
            text(canvas, family, MARGIN + 7, y, font="BookSansBold", size=11)
            text(canvas, f"Карточек · {count}", MARGIN + 155, y, size=9, color=MUTED)
            canvas.setFillColor(MUTED)
            canvas.setFont("BookSans", 9)
            canvas.drawRightString(WIDTH - MARGIN - 7, y, str(number))
            canvas.setStrokeColor(GOLD)
            canvas.line(MARGIN, y - 7, WIDTH - MARGIN, y - 7)
            canvas.linkRect("", key, (MARGIN, y - 7, WIDTH - MARGIN, y + 15), relative=0, thickness=0)
            y -= 29
        y -= 12
    canvas.showPage()


def draw_portrait(canvas, tier, name, x, top, width, height):
    picture = BytesIO()
    with Image.open(PORTRAITS / f"t{tier}" / f"{name}.webp") as original:
        portrait = original.convert("RGB")
    fade_height = round(portrait.height * 24 / height)
    fade = Image.linear_gradient("L").point([round(255 * (value / 255) ** 1.5) for value in range(256)])
    fade = fade.resize((portrait.width, fade_height), Image.Resampling.BILINEAR)
    faded_area = (0, portrait.height - fade_height, portrait.width, portrait.height)
    background = tuple(round(255 * value) for value in CARD_BACKGROUND.rgb())
    portrait.paste(background, faded_area, fade)
    portrait.save(picture, "JPEG", quality=88, optimize=True)
    picture.seek(0)
    canvas.drawImage(ImageReader(picture), x, top - height, width, height)


def draw_lower_card(canvas, tier, name, layout, x, top):
    height, blocks = layout
    canvas.setFillColor(CARD_BACKGROUND)
    canvas.rect(x, top - height, CARD_WIDTH, height, stroke=0, fill=1)
    draw_portrait(canvas, tier, name, x, top, CARD_WIDTH, PORTRAIT_HEIGHT)
    art_bottom = top - PORTRAIT_HEIGHT

    horizontal_margin = x + CARD_PADDING
    cursor = art_bottom
    for paragraph, block_height, gap, style in blocks:
        paragraph.drawOn(canvas, horizontal_margin, cursor - block_height)
        cursor -= block_height + gap
        if style == "name":
            canvas.setStrokeColor(CARD_GOLD)
            canvas.setLineWidth(0.55)
            canvas.line(horizontal_margin, cursor + 5, x + CARD_WIDTH - CARD_PADDING, cursor + 5)
    canvas.setLineWidth(0.55)
    canvas.setStrokeColor(CARD_GOLD)
    canvas.roundRect(x + 6, top - height + 6, CARD_WIDTH - 12, height - 12, 6, stroke=1, fill=0)


def draw_t3_page(canvas, card, source):
    top, bottom = HEIGHT - 47, 51
    if note := card.get("pathNote"):
        text(canvas, note, MARGIN, top - 9, size=8.5, color=MUTED)
        top -= 16

    with Image.open(source) as original:
        width, height = original.size
        illustration = original.convert("RGB")
        illustration.thumbnail((900, round(900 * height / width)), Image.Resampling.LANCZOS)
        picture = BytesIO()
        illustration.save(picture, "JPEG", quality=86, optimize=True)
    picture.seek(0)

    scale = min(CARD_WIDTH / width, (top - bottom) / height)
    image_width, image_height = width * scale, height * scale
    left = (WIDTH - image_width) / 2
    canvas.drawImage(ImageReader(picture), left, top - image_height, image_width, image_height)

    # The titles on the original card images are searchable in PDF viewers.
    label = canvas.beginText(left + 65 * scale, top - 554 * scale)
    label.setFont("BookSerif", 62 * scale)
    label.setTextRenderMode(3)
    label.textOut(card["name"])
    canvas.drawText(label)


def draw_chapters(canvas, chapter_list, t2_cards, art, styles):
    previous_tier = None
    for tier, family, key, _, start, pages in chapter_list:
        for index, page in enumerate(pages):
            page_frame(canvas, start + index)
            if index == 0:
                if previous_tier != tier:
                    tier_key = f"tier{tier}"
                    canvas.bookmarkPage(tier_key)
                    canvas.addOutlineEntry(TRANSITIONS[tier], tier_key)
                    previous_tier = tier
                canvas.bookmarkPage(key)
                canvas.addOutlineEntry(family, key, level=1)
            name = page["name"]
            class_key = f"{key}-class{index}"
            canvas.bookmarkPage(class_key)
            canvas.addOutlineEntry(name, class_key, level=2)
            if tier < 3:
                layout = layout_lower_card(page, tier, t2_cards, styles)
                top = HEIGHT - 47
                if top - layout[0] < 51:
                    raise ValueError(f"Карточка не помещается на странице: {name}")
                draw_lower_card(canvas, tier, name, layout, MARGIN, top)
            else:
                draw_t3_page(canvas, page, art[name])
            canvas.showPage()


def export_lower_cards(cards_by_tier, styles):
    with TemporaryDirectory(prefix="adalia-class-card-") as temporary:
        scratch = Path(temporary)
        pdf = scratch / "card.pdf"
        preview = scratch / "card"
        for tier in (1, 2):
            directory = PORTRAITS / f"t{tier}-cards"
            directory.mkdir(parents=True, exist_ok=True)
            for card in cards_by_tier[tier]:
                name = card["name"]
                layout = layout_lower_card(card, tier, cards_by_tier[2], styles)
                canvas = Canvas(str(pdf), pagesize=(CARD_WIDTH, layout[0]), pageCompression=1, invariant=1)
                draw_lower_card(canvas, tier, name, layout, 0, layout[0])
                canvas.save()
                subprocess.run(
                    ["pdftoppm", "-singlefile", "-png", "-scale-to-x", "900", "-scale-to-y", "-1",
                     str(pdf), str(preview)],
                    check=True,
                )
                with Image.open(preview.with_suffix(".png")) as rendered:
                    rendered.save(directory / f"{name}.webp", "WEBP", quality=90, method=6)


def build(path, card_directory, *, export_cards=False):
    cards_by_tier = {tier: load_cards(tier) for tier in TRANSITIONS}
    art = load_t3_art(card_directory, cards_by_tier[3])
    styles = fonts()
    chapter_list = list(chapters(cards_by_tier))
    path.parent.mkdir(parents=True, exist_ok=True)
    rl_config.useA85 = 0
    canvas = Canvas(str(path), pagesize=A5, pageCompression=1, invariant=1)
    canvas.setTitle("Книга классов Адалии")
    canvas.setAuthor("Адалия. Западный Фронтир")
    cover(canvas, {tier: len(cards) for tier, cards in cards_by_tier.items()})
    contents(canvas, chapter_list)
    draw_chapters(canvas, chapter_list, cards_by_tier[2], art, styles)
    canvas.save()
    if export_cards:
        export_lower_cards(cards_by_tier, styles)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--t3-cards", type=Path, help="Optional directory with approved public T3 card PNGs")
    parser.add_argument("--output", type=Path, default=BOOK)
    parser.add_argument("--export-lower-cards", action="store_true", help="Export the full public T1 and T2 WebP cards")
    args = parser.parse_args()
    build(args.output, args.t3_cards, export_cards=args.export_lower_cards)
