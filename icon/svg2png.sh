#!/bin/bash

input="$1"
if ! [ -e "$input" ]; then
  >&2 echo must provide an input
  >&2 echo 'optionally followed by side length (128, 32, etc)'
  exit 2
fi

basename="${input%.svg}"

dim="$2"
opt=""
if [ -n "$dim" ]; then
  opt="-vf scale=${dim}x$dim"
  basename="$basename-$dim"
fi

ffmpeg -y -loglevel quiet -i "$input" $opt "$basename.png" &&
pngnq "$basename.png" &&
mv -f "$basename-nq8.png" "$basename.png" &&
printf 'wrote "%s"\n' "$basename.png"

