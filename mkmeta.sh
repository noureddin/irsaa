#!/bin/bash

# based on make.sh in the directory 2/data from
# https://github.com/noureddin/quran-pages/
PAGES_DATA=../quran-pages/2/data

if ! zstd --version &>/dev/null; then
  >&2 echo please install zstd
  exit 1
fi

out="$1"

mymeta="margins marginwords headers basmalaat morepauses"

needed() {
  [ -f "$out" ] || return 0
  [ "$out" -nt "_data.json" ] || return 0
  for base in $mymeta; do
    [ "$out" -nt "$PAGES_DATA/$base.json" ] || return 0
  done
  return 1  # up-to-date
}

needed || exit 0

{ printf '{'
  perl -CDAS -Mutf8 -pe 's|//.*||; s|[ \n]+||g' _data.json | sed '$s/,$//'
  for base in $mymeta; do
    file="$PAGES_DATA/$base.json"
    printf ', "%s":\n%s\n' "$base" "$(cat "$file")"
  done
  printf '}'
} | tr -d $' \n' | zstd -19 > mymeta.json.zst

