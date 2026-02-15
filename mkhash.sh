#!/bin/bash

# clone this: https://github.com/noureddin/quran-pages/
PAGES_DATA=../quran-pages/2/data

printf '{\n'
for f in imla.zst mymeta.json.zst $PAGES_DATA/{words,lineends,suarayat,ayat,pauses}.json.zst; do
  b="${f##*/}"; b="${b%%.*}"
  printf '  "%s": "%s"%s,\n' "$b" $(
    md5sum "$f" | sed 's/\(.....\).*/\1/'  # keep only the first 5 nibbles
  )
done
printf '}\n'

