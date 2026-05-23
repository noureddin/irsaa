#!/bin/bash

# creates a single JS file with all the data that load.js tries to load,
# for easier non-Web distribution.

PagesData='../quran-pages/2/data'

data='words lineends suarayat ayat pauses' # morepauses

out="$1"
if [ -f "$out" ]; then
  for f in mymeta.json.zst imla.zst $data --; do
    [ "$f" = -- ] && exit 0  # up to date; do nothing
    [ "$out" -ot "$f" ] && break  # at least one source is older than the output
  done
fi

{ echo 'var Q ='
  zstdcat mymeta.json.zst
  echo ""

  echo 'Q.imla = ['
  zstdcat imla.zst | sed 's/^/"/; s/$/",/'
  echo ']'
  echo ""

  for x in $data; do
    echo "Q.$x = "
    cat "$PagesData/$x.json"
    echo ""
  done

  echo "const meta_loaded = Promise.resolve()"
  echo "const data_loaded = Promise.resolve()"
} > "$out"

