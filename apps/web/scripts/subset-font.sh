#!/bin/sh
# Regenerates src/assets/fonts/assistant-hebrew-latin.woff2 from the
# Assistant variable font in fonts/ (legacy's file, kept outside src so it
# never ships): Latin (with Latin-1 and common punctuation, ₪, €)
# and Hebrew (with marks and presentation forms), every weight, woff2.
# The font has no Cyrillic; Russian falls back to the system font.
#
# Needs fonttools with brotli:  pip install fonttools brotli
set -eu
cd "$(dirname "$0")/.."
pyftsubset fonts/Assistant-VariableFont_wght.ttf \
    --unicodes="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+0300-0308,U+0590-05FF,U+200E-200F,U+2010-2030,U+2039-203A,U+20AA,U+20AC,U+2122,U+2212,U+25CC,U+FB1D-FB4F" \
    --layout-features='*' \
    --flavor=woff2 \
    --output-file=src/assets/fonts/assistant-hebrew-latin.woff2
