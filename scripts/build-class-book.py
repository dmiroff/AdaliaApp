#!/usr/bin/env python3
"""Build the public class book with T2 handbook text and approved T3 card PNGs.

Pass --t3-cards a directory of the public card exports named NN-Class-name.png.
Install Pillow and ReportLab and have the DejaVu fonts available.
"""

import argparse
import json
from collections import defaultdict
from io import BytesIO
from pathlib import Path
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
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
WIDTH, HEIGHT = A5
MARGIN = 31
CARD_WIDTH = WIDTH - 2 * MARGIN
CARD_PADDING = 13
CARD_TOP = HEIGHT - 100
CARD_BOTTOM = 56
CARD_GAP = 10
INK = HexColor("#30241d")
MUTED = HexColor("#71583d")
GOLD = HexColor("#ad865b")
PAPER = HexColor("#faf3e3")
CARD = HexColor("#fffcf4")
CREAM = HexColor("#fff1d6")
TRANSITIONS = {2: "Т1 → Т2", 3: "Т2 → Т3"}


def load_cards(tier):
    path = ROOT / f"src/data/t{tier}ClassGuide.json"
    return json.loads(path.read_text(encoding="utf-8"))["classes"]


def load_t3_art(directory, cards):
    # Restrict the inputs to the public roster. Full mirror exports also contain
    # cards for undisclosed classes.
    known_names = {card["name"] for card in cards}
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
        "name": ParagraphStyle("name", fontName="BookSerif", fontSize=15, leading=19, textColor=INK),
        "parents": ParagraphStyle("parents", fontName="BookSans", fontSize=8.6, leading=11.5, textColor=MUTED),
        "body": ParagraphStyle("body", fontName="BookSans", fontSize=9.6, leading=13.4, textColor=INK),
    }


def plain(text):
    return escape(text.translate(str.maketrans({"–": "-", "—": "-", "‑": "-"})))


def layout_card(card, styles):
    parents = " / ".join(card["parents"])
    parts = (
        (plain(card["name"]), "name", 2),
        (f"Исходный класс Т1 · {plain(parents)}", "parents", 5),
        (plain(card["summary"]), "body", 4),
        ("<b>В бою.</b> " + plain(card["play"]), "body", 0),
    )
    blocks = []
    for text, style, gap in parts:
        paragraph = Paragraph(text, styles[style])
        _, height = paragraph.wrap(CARD_WIDTH - 2 * CARD_PADDING, HEIGHT)
        blocks.append((paragraph, height, gap))
    return blocks, 2 * CARD_PADDING + sum(height + gap for _, height, gap in blocks)


def paginate_t2(cards, styles):
    pages = []
    page = []
    top = CARD_TOP
    for card in cards:
        layout = layout_card(card, styles)
        height = layout[1]
        if height > CARD_TOP - CARD_BOTTOM:
            raise ValueError(f"Карточка не помещается на странице: {card['name']}")
        if top - height < CARD_BOTTOM:
            pages.append(page)
            page, top = [], CARD_TOP
        page.append(layout)
        top -= height + CARD_GAP
    if page:
        pages.append(page)
    return pages


def chapters(cards_by_tier, styles):
    t1_by_t2 = {card["name"]: card["parents"][0] for card in cards_by_tier[2]}
    t1_names = list(dict.fromkeys(t1_by_t2.values()))
    page_number = 3
    for tier, cards in cards_by_tier.items():
        families = defaultdict(list)
        for card in cards:
            origin = card["parents"][0]
            family = origin if tier == 2 else t1_by_t2[origin]
            families[family].append(card)
        for index, family in enumerate(t1_names):
            branch = families[family]
            if not branch:
                continue
            pages = paginate_t2(branch, styles) if tier == 2 else branch
            yield tier, family, f"tier{tier}-branch{index}", len(branch), page_number, pages
            page_number += len(pages)


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
    text(canvas, f"{counts[2]} специализаций Т2 · {counts[3]} классов Т3", x, HEIGHT - 201, size=11, color=CREAM)
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
            text(canvas, f"Карточек · {count}", MARGIN + 113, y, size=9, color=MUTED)
            canvas.setFillColor(MUTED)
            canvas.setFont("BookSans", 9)
            canvas.drawRightString(WIDTH - MARGIN - 7, y, str(number))
            canvas.setStrokeColor(GOLD)
            canvas.line(MARGIN, y - 7, WIDTH - MARGIN, y - 7)
            canvas.linkRect("", key, (MARGIN, y - 7, WIDTH - MARGIN, y + 15), relative=0, thickness=0)
            y -= 29
        y -= 12
    canvas.showPage()


def draw_t2_page(canvas, family, cards):
    text(canvas, f"{family} · {TRANSITIONS[2]}", MARGIN, HEIGHT - 77, font="BookSerif", size=22)
    top = CARD_TOP
    for blocks, height in cards:
        canvas.setFillColor(CARD)
        canvas.setStrokeColor(GOLD)
        canvas.roundRect(MARGIN, top - height, CARD_WIDTH, height, 6, stroke=1, fill=1)
        cursor = top - CARD_PADDING
        for paragraph, block_height, gap in blocks:
            paragraph.drawOn(canvas, MARGIN + CARD_PADDING, cursor - block_height)
            cursor -= block_height + gap
        top -= height + CARD_GAP


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


def draw_chapters(canvas, chapter_list, art):
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
            if tier == 2:
                draw_t2_page(canvas, family, page)
            else:
                name = page["name"]
                class_key = f"{key}-class{index}"
                canvas.bookmarkPage(class_key)
                canvas.addOutlineEntry(name, class_key, level=2)
                draw_t3_page(canvas, page, art[name])
            canvas.showPage()


def build(path, card_directory):
    cards_by_tier = {tier: load_cards(tier) for tier in TRANSITIONS}
    art = load_t3_art(card_directory, cards_by_tier[3])
    chapter_list = list(chapters(cards_by_tier, fonts()))
    path.parent.mkdir(parents=True, exist_ok=True)
    rl_config.useA85 = 0
    canvas = Canvas(str(path), pagesize=A5, pageCompression=1, invariant=1)
    canvas.setTitle("Книга классов Адалии")
    canvas.setAuthor("Адалия. Западный Фронтир")
    cover(canvas, {tier: len(cards) for tier, cards in cards_by_tier.items()})
    contents(canvas, chapter_list)
    draw_chapters(canvas, chapter_list, art)
    canvas.save()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--t3-cards", type=Path, required=True, help="Directory with approved public T3 card PNGs")
    parser.add_argument("--output", type=Path, default=BOOK)
    args = parser.parse_args()
    build(args.output, args.t3_cards)
