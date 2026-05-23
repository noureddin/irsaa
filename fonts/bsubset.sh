#!/bin/bash

if [ "$(basename "$(pwd)")" != fonts ]; then
  >&2 printf 'Error: You are not in the fonts/ directory.\n'
  exit 2
fi

input="NotoKufiArabic-Bold.ttf"
if ! [ -e "$input" ]; then
  wget https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoKufiArabic/hinted/ttf/NotoKufiArabic-Bold.ttf
fi

# output="${input%.*}-subset"
output='Noto Kufi-'
text="إرساء مصحف تفاعلي لاختبار الحفظ"

pyftsubset "$input" --output-file="$output".woff2 --layout-features=* --flavor=woff2 --text="$text"
pyftsubset "$input" --output-file="$output".woff  --layout-features=* --flavor=woff  --text="$text" --with-zopfli
