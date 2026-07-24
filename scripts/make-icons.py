#!/usr/bin/env python3
"""Regenerate the extension icons from the master logo.

The Chrome Web Store guidelines want the 128px icon to be a 96x96 mark
centred in a 128x128 canvas with 16px of transparent padding per side,
on a transparent background. This script produces all three manifest
sizes from a single transparent source.

Usage (Pillow required):
    python3 -m venv .venv && .venv/bin/pip install Pillow
    .venv/bin/python scripts/make-icons.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "logo-source.png")

# (size, fraction of the frame the artwork occupies)
# 128 follows the store guideline (96/128 = 0.75); the small toolbar
# sizes are a touch fuller so the mark stays legible.
SIZES = [(128, 0.75), (48, 0.92), (16, 1.00)]


def main():
    src = Image.open(SRC).convert("RGBA")
    art = src.crop(src.getbbox())  # trim any transparent border
    for size, frac in SIZES:
        content = round(size * frac)
        a = art.copy()
        a.thumbnail((content, content), Image.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.paste(a, ((size - a.width) // 2, (size - a.height) // 2), a)
        out = os.path.join(ROOT, "icons", f"icon-{size}.png")
        canvas.save(out)
        print(f"wrote {out} ({size}x{size}, content {a.size})")


if __name__ == "__main__":
    main()
