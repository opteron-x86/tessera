from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets/cards/source/ember-page-art.png"
OUT = ROOT / "tmp/card-design/layers"
W, H = 768, 1075
ART_BOX = (64, 86, 704, 812)
NAME_BOX = (82, 842, 686, 985)


def rgba(color: str, alpha: int = 255) -> tuple[int, int, int, int]:
    color = color.lstrip("#")
    return (
        int(color[0:2], 16),
        int(color[2:4], 16),
        int(color[4:6], 16),
        alpha,
    )


def layer(name: str) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return image, ImageDraw.Draw(image)


def save(image: Image.Image, name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT / name)


def rounded(draw: ImageDraw.ImageDraw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def make_shadow() -> None:
    image, draw = layer("shadow")
    rounded(draw, (34, 34, W - 34, H - 26), 42, fill=(0, 0, 0, 190))
    image = image.filter(ImageFilter.GaussianBlur(24))
    save(image, "00_shadow.png")


def make_base() -> None:
    image = Image.new("RGBA", (W, H), rgba("090b0d"))
    draw = ImageDraw.Draw(image)
    for y in range(H):
        t = y / H
        r = int(12 + 18 * (1 - abs(t - 0.42)))
        g = int(13 + 10 * (1 - abs(t - 0.42)))
        b = int(15 + 6 * (1 - abs(t - 0.42)))
        draw.line((0, y, W, y), fill=(r, g, b, 255))

    rng = random.Random(7)
    for _ in range(3400):
        x = rng.randrange(W)
        y = rng.randrange(H)
        value = rng.randrange(12, 54)
        alpha = rng.randrange(8, 32)
        draw.point((x, y), fill=(value, value, value, alpha))

    for offset, alpha in [(0, 255), (9, 120), (18, 70)]:
        rounded(draw, (32 + offset, 32 + offset, W - 32 - offset, H - 32 - offset), 38, outline=rgba("2b2f33", alpha), width=2)

    save(image, "01_dark_stone_base.png")


def make_art() -> None:
    src = Image.open(SRC).convert("RGBA")
    target_w = ART_BOX[2] - ART_BOX[0]
    target_h = ART_BOX[3] - ART_BOX[1]
    scale = max(target_w / src.width, target_h / src.height)
    resized = src.resize((math.ceil(src.width * scale), math.ceil(src.height * scale)), Image.Resampling.LANCZOS)
    left = (resized.width - target_w) // 2
    top = 0
    cropped = resized.crop((left, top, left + target_w, top + target_h))

    mask = Image.new("L", (target_w, target_h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((0, 0, target_w, target_h), radius=24, fill=255)

    image = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    image.paste(cropped, ART_BOX[:2], mask)
    save(image, "02_card_art.png")


def make_art_glaze() -> None:
    image, draw = layer("glaze")
    x0, y0, x1, y1 = ART_BOX
    for i in range(80):
        alpha = int(90 * (i / 80))
        draw.rounded_rectangle((x0 + i, y0 + i, x1 - i, y1 - i), radius=max(0, 24 - i // 5), outline=(0, 0, 0, alpha), width=1)
    rounded(draw, ART_BOX, 24, outline=rgba("d68b48", 78), width=2)
    rounded(draw, (ART_BOX[0] + 8, ART_BOX[1] + 8, ART_BOX[2] - 8, ART_BOX[3] - 8), 18, outline=rgba("fff0c7", 35), width=1)
    save(image, "03_art_glaze_and_window_lines.png")


def make_nameplate() -> None:
    image, draw = layer("nameplate")
    rounded(draw, NAME_BOX, 22, fill=rgba("111316", 236), outline=rgba("d68b48", 150), width=2)
    rounded(draw, (NAME_BOX[0] + 10, NAME_BOX[1] + 10, NAME_BOX[2] - 10, NAME_BOX[3] - 10), 14, outline=rgba("fff0c7", 42), width=1)
    for y in range(NAME_BOX[1], NAME_BOX[3]):
        t = (y - NAME_BOX[1]) / (NAME_BOX[3] - NAME_BOX[1])
        color = (64, 30, 19, int(82 * (1 - t)))
        draw.line((NAME_BOX[0] + 4, y, NAME_BOX[2] - 4, y), fill=color)
    save(image, "04_nameplate.png")


def make_frame() -> None:
    image, draw = layer("frame")
    rounded(draw, (28, 28, W - 28, H - 28), 42, outline=rgba("0b0c0d", 255), width=16)
    rounded(draw, (40, 40, W - 40, H - 40), 34, outline=rgba("82603c", 255), width=8)
    rounded(draw, (49, 49, W - 49, H - 49), 28, outline=rgba("e4b56f", 160), width=2)
    rounded(draw, (58, 58, W - 58, H - 58), 23, outline=rgba("17191c", 255), width=8)

    for i in range(4):
        inset = 62 + i * 10
        alpha = 45 - i * 8
        rounded(draw, (inset, inset, W - inset, H - inset), max(0, 22 - i * 3), outline=rgba("f4c889", alpha), width=1)

    save(image, "05_outer_border_weathered_bronze.png")


def make_ornaments() -> None:
    image, draw = layer("ornaments")
    bronze = rgba("c58a4d", 210)
    dark = rgba("070809", 230)
    glow = rgba("f06b32", 150)
    corners = [
        (70, 70, 1, 1),
        (W - 70, 70, -1, 1),
        (70, H - 70, 1, -1),
        (W - 70, H - 70, -1, -1),
    ]
    for cx, cy, sx, sy in corners:
        pts = [
            (cx, cy - 24 * sy),
            (cx + 28 * sx, cy),
            (cx, cy + 24 * sy),
            (cx - 28 * sx, cy),
        ]
        draw.polygon(pts, fill=dark, outline=bronze)
        draw.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=glow, outline=bronze, width=2)
        draw.line((cx, cy, cx + 52 * sx, cy), fill=bronze, width=3)
        draw.line((cx, cy, cx, cy + 52 * sy), fill=bronze, width=3)

    top = [(W // 2, 47), (W // 2 + 28, 72), (W // 2, 97), (W // 2 - 28, 72)]
    draw.polygon(top, fill=rgba("111316", 235), outline=bronze)
    draw.ellipse((W // 2 - 9, 63, W // 2 + 9, 81), fill=glow, outline=bronze, width=2)
    save(image, "06_corner_ornaments_and_sigil.png")


def make_value_slots() -> None:
    image, draw = layer("future_value_slots")
    for cx, cy in [(W // 2, 92), (W - 86, H // 2), (W // 2, H - 92), (86, H // 2)]:
        draw.ellipse((cx - 25, cy - 25, cx + 25, cy + 25), fill=rgba("111316", 210), outline=rgba("d68b48", 160), width=2)
        draw.ellipse((cx - 14, cy - 14, cx + 14, cy + 14), outline=rgba("fff0c7", 45), width=1)
    save(image, "07_optional_value_slots.png")


def main() -> None:
    make_shadow()
    make_base()
    make_art()
    make_art_glaze()
    make_nameplate()
    make_frame()
    make_ornaments()
    make_value_slots()


if __name__ == "__main__":
    main()
