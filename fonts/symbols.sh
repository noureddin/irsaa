#!/bin/bash

if [ "$(basename "$(pwd)")" != fonts ]; then
  >&2 printf 'Error: You are not in the fonts/ directory.\n'
  exit 2
fi

############################################################

if [ "$1" = '-B' ] ||  [ "$1" = '-f' ]; then  # force rebuild (doesn't redownload the fonts if they exist)
  rm -f NotoS*-.ttf NotoS*-.woff NotoS*-.woff2
fi

############################################################

__sub() {
  local name="$1"; shift
  local weight="$1"; shift
  local text="$*"; text="${text// /}"
  [ -e "$name-$weight".ttf ] ||
    wget https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/$name/hinted/ttf/$name-$weight.ttf || exit 3
  [ -e "$name-.ttf" ] ||
    pyftsubset "$name-$weight.ttf" --output-file="$name-.ttf" --layout-features=* --text="$text" || exit 4
}

__sub NotoSansSymbols  Bold     ← ↑ → ↓
__sub NotoSansSymbols2 Regular  ⏭  ⏮  🗘  ✍  ⮌

############################################################

[ -e NotoSymbols-.ttf ] ||
  pyftmerge NotoSansSymbols{,2}-.ttf --output-file=NotoSymbols-.ttf || exit 5

[ -e NotoSymbols-.woff ] ||
  pyftsubset "NotoSymbols-.ttf" --output-file="NotoSymbols-.woff"  --layout-features=* --flavor=woff  --unicodes=* --with-zopfli || exit 6

[ -e NotoSymbols-.woff2 ] ||
  pyftsubset "NotoSymbols-.ttf" --output-file="NotoSymbols-.woff2" --layout-features=* --flavor=woff2 --unicodes=* || exit 7
