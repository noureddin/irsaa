#!/bin/bash

# based on make.sh in the directory 2/data from
# https://github.com/noureddin/quran-pages/
PAGES_DATA=../quran-pages/2/data

if ! zstd --version &>/dev/null; then
  >&2 echo please install zstd
  exit 1
fi

force=false
if [ "$1" == "-f" ] || [ "$1" == "-B" ]; then
  force=true
fi

mymeta="margins marginwords headers basmalaat morepauses"
needed=$force
if ! $force; then
  if ! [ -e mymeta.json.zst ] || [ _data.json -nt mymeta.json.zst ]; then
    needed=true
  else
    for base in $mymeta; do
      file="$PAGES_DATA/$base.json"
      if [ "$file" -nt mymeta.json.zst ]; then needed=true; break; fi
    done
  fi
fi

if ! $needed; then exit; fi

{ printf '{'
  perl -CDAS -Mutf8 -pe 's|//.*||; s|[ \n]+||g' _data.json | sed '$s/,$//'
  for base in $mymeta; do
    file="$PAGES_DATA/$base.json"
    printf ', "%s":\n%s\n' "$base" "$(cat "$file")"
  done
  printf '}'
} | tr -d $' \n' | zstd -19 > mymeta.json.zst

