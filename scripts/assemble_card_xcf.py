from __future__ import annotations

import os
from pathlib import Path

from gi.repository import Gegl, Gimp, Gio


ROOT = Path(os.environ.get("TESSERA_ROOT", Path.cwd())).resolve()
LAYERS = ROOT / "tmp/card-design/layers"
OUT_XCF = ROOT / "assets/cards/xcf/ember-page-card.xcf"
OUT_PREVIEW = ROOT / "assets/cards/export/ember-page-card-preview.png"
W, H = 768, 1075
NAME_TEXT_BOX = (82, 896, 686, 956)


LAYER_FILES = [
    ("00 Shadow", "00_shadow.png"),
    ("01 Dark Stone Base", "01_dark_stone_base.png"),
    ("02 Card Art", "02_card_art.png"),
    ("03 Art Glaze + Window Lines", "03_art_glaze_and_window_lines.png"),
    ("04 Bottom Nameplate", "04_nameplate.png"),
    ("05 Outer Border - Weathered Bronze", "05_outer_border_weathered_bronze.png"),
    ("06 Corner Ornaments + Top Sigil", "06_corner_ornaments_and_sigil.png"),
    ("07 Optional Future Value Slots", "07_optional_value_slots.png"),
]


def make_file(path: Path):
    return Gio.File.new_for_path(str(path))


def add_png_layer(image: Gimp.Image, name: str, filename: str, position: int) -> None:
    layer = Gimp.file_load_layer(
        Gimp.RunMode.NONINTERACTIVE,
        image,
        make_file(LAYERS / filename),
    )
    layer.set_name(name)
    if name.startswith("07 "):
        layer.set_visible(False)
    image.insert_layer(layer, None, position)


def add_text_layer(
    image: Gimp.Image,
    name: str,
    value: str,
    color: str,
    x: int,
    y: int,
    width: int,
    height: int,
) -> None:
    font = Gimp.context_get_font()
    text = Gimp.TextLayer.new(
        image,
        value,
        font,
        44,
        Gimp.Unit.pixel(),
    )
    image.insert_layer(text, None, 0)
    text.set_name(name)
    text.set_color(Gegl.Color.new(color))
    text.set_justification(Gimp.TextJustification.CENTER)
    text.resize(width, height)
    text.set_offsets(x, y)


def add_name_text(image: Gimp.Image) -> None:
    x0, y0, x1, y1 = NAME_TEXT_BOX
    add_text_layer(
        image,
        "08 Card Name Text Shadow",
        "EMBER PAGE",
        "rgba(0, 0, 0, 0.72)",
        x0 + 2,
        y0 + 3,
        x1 - x0,
        y1 - y0,
    )
    add_text_layer(
        image,
        "09 Editable Card Name Text",
        "EMBER PAGE",
        "#f4efe4",
        x0,
        y0,
        x1 - x0,
        y1 - y0,
    )


def main() -> None:
    OUT_XCF.parent.mkdir(parents=True, exist_ok=True)
    OUT_PREVIEW.parent.mkdir(parents=True, exist_ok=True)

    image = Gimp.Image.new(W, H, Gimp.ImageBaseType.RGB)

    # GIMP inserts position 0 at the top, so add bottom-to-top in source order.
    for name, filename in LAYER_FILES:
        add_png_layer(image, name, filename, 0)

    add_name_text(image)

    Gimp.file_save(Gimp.RunMode.NONINTERACTIVE, image, make_file(OUT_XCF), None)

    merged = image.duplicate()
    merged.merge_visible_layers(Gimp.MergeType.CLIP_TO_IMAGE)
    Gimp.file_save(Gimp.RunMode.NONINTERACTIVE, merged, make_file(OUT_PREVIEW), None)

    print(f"saved {OUT_XCF}")
    print(f"saved {OUT_PREVIEW}")


main()
