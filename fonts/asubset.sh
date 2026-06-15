#!/bin/bash

# install the needed tools:
# $ pip3 install fontTools zopfli

# you also need: wget and unzip

if [ "$(basename "$(pwd)")" != fonts ]; then
  >&2 printf 'Error: You are not in the fonts/ directory.\n'
  exit 2
fi

input="Amiri-Regular.ttf"
if ! [ -e "$input" ]; then
  tmp="$(mktemp -d)"
  cd "$tmp"
  wget https://github.com/aliftype/amiri/releases/download/1.002/Amiri-1.002.zip
  unzip Amiri-1.002.zip Amiri-1.002/Amiri-Regular.ttf
  mv Amiri-1.002/Amiri-Regular.ttf "$OLDPWD"
  cd -
  rm -rf "$tmp"
fi

# output="${input%.*}-subset"
output=Amiri-
range=20,621-63a,641-64a
# all imlaai arabic letters, ascii space, and nothing else

# # uncomment this to review the included character set
# grep ^range= "${BASH_SOURCE[0]}" | perl -mcharnames -ne '
#   s/range=//; s/\s+$//;          # remove prefix and suffix
#   s/[0-9a-fA-F]+/"0x$&"/gee;     # convert to decimal (easier processing)
#   s/(\d+)-(\d+)/join " ", $1..$2/ge;  # expand ranges
#   printf "U+%04X  %s\n", $_, charnames::viacode($_)
#     for split / *, *| +/;
# '

pyftsubset "$input" --output-file="$output".woff  --layout-features=* --flavor=woff  --unicodes=$range --with-zopfli
pyftsubset "$input" --output-file="$output".woff2 --layout-features=* --flavor=woff2 --unicodes=$range
