#!/bin/bash

# clone this: https://github.com/noureddin/quran-pages/
PAGES_DATA=../quran-pages/2/data

out="$1"
if [ -z "$1" ]; then
  >&2 echo You must provide a file name to output to
  exit 3
fi

files=(
  changelog
  imla.zst
  mymeta.json.zst
  $PAGES_DATA/{words,lineends,suarayat,ayat,pauses}.json.zst
)

needed() {
  [ -f "$out" ] || return 0
  for f in "${files[@]}"; do
    [ "$out" -nt "$f" ] || return 0
  done
  return 1  # up-to-date
}

needed || exit 0

{ # printf '{\n'
  for f in "${files[@]}"; do
    b="${f##*/}"; b="${b%%.*}"
    # printf '  "%s": "%s",\n' "$b" $(
    printf 'hash_%s=%s\n' "$b" $(
      md5sum "$f" | sed 's/\(.....\).*/\1/'
      # ^ keep only the first 5 nibbles
    )
  done
  # printf '}\n'
} > "$out"

