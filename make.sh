#!/bin/bash
set -eu

minify_js=true
minify_css=true
minify_html=true

# minify_js=false
# minify_css=false
# minify_html=false

disabledark=true
# remove the darkmode js & css, because it's still experimental and thus is disabled by default

# disabledark=false

_() { printf '%s\n' "$*"; "$@"; }

dist=false
if [ $# -gt 0 ]; then
  case "$1" in clean|-B|-f)
    _ rm -f index.html .minified.{script,style}
    _ rm -f .hashes_vars.sh mymeta.json.zst
    if [ -e irsaa.html ]; then
      _ rm -f irsaa.html .minified2.{script,style} LOAD.js changelog.html
    fi
    ;;
  esac
  if [ "$1" = clean ]; then exit; fi
  if [ "$1" = dist ]; then dist=true; fi
fi

JS_ENV=UGLIFY_BUG_REPORT
CSS_ENV=HTTP_PROXY,http_proxy

minjs()  { deno run --quiet --allow-read --allow-env=$JS_ENV  npm:uglify-js "$@"; }
mincss() { deno run --quiet --allow-read --allow-env=$CSS_ENV npm:clean-css-cli "$@"; }

reserved_props='fzstd,goatcounter,allow_frame'

# both do their monitoring themselves
bash mkmeta.sh mymeta.json.zst
bash mkhash.sh .hashes_vars.sh  # hashes (among others) the mymeta file made by mkhash.sh
source .hashes_vars.sh

# JAVASCRIPT MINIFICATION

js_opts=(--compress passes=10,toplevel --mangle toplevel --mangle-props "reserved=[$reserved_props]")
# js_opts=(--compress)

js_process() { perl -pe '
             s/(?<=changelog\?h=)<<hash>>/'$hash_changelog'/g;
             s/(?<=imla\.zst\?h=)<<hash>>/'$hash_imla'/g;
     s/(?<=mymeta\.json\.zst\?h=)<<hash>>/'$hash_mymeta'/g;
      s/(?<=words\.json\.zst\?h=)<<hash>>/'$hash_words'/g;
   s/(?<=lineends\.json\.zst\?h=)<<hash>>/'$hash_lineends'/g;
   s/(?<=suarayat\.json\.zst\?h=)<<hash>>/'$hash_suarayat'/g;
       s/(?<=ayat\.json\.zst\?h=)<<hash>>/'$hash_ayat'/g;
     s/(?<=pauses\.json\.zst\?h=)<<hash>>/'$hash_pauses'/g;
  if ("'$disabledark'" eq "true") {
    s/.*set_dark.*//;
    s/.*toggle_dark.*//;
    s/.*let screen_dark.*//;
    s/.*store_flag.*screen_dark.*//;
    s/\(screen_dark,/(/g;
    s/(?:, *)?screen_dark\)/)/g;
    s/[+]?screen_dark/0/g;
    s|.*// this line is removed if darkmode is disabled.*||g;
    s/if \(Dark\)/if (0)/g;
    s/(?:, *)?\bDark\)/)/g;
    s/\(Dark,/(/g;
    s/[+]?\bDark\b/0/g;
  }
'; }

# all three are used in the middle of a pipeline
J() { js_process | minjs "${js_opts[@]}"; }
JEND()  { perl -pe 's/\A/"use strict";/; s/;?\s*\Z//'; }
FZSTD() { perl -pe 's/_e\.ZstdError.*?throw n;return n\}/var f=function(r){throw r}/; s/\Z/;/' fzstd-0.1.1.js; }
# remove detailed error messages with stack traces (our data is known);
# and append a semicolon to concatenate more JS after it.

fzstdby='/* v0.1.1 of fzstd by 101arrowz, MIT License. https://github.com/101arrowz/fzstd */'

if ! $minify_js; then
  J() { js_process; }
  JEND() { sed 1i'"use strict";'; }
  FZSTD() { echo "$fzstdby"; sh -c 'cat fzstd-0.1.1.js; printf ";\n"'; }
fi

# CSS MINIFICATION

if $disabledark; then
  css_dark() { sed 's/}body\.k[^}]*//g'; }
else
  css_dark() { cat; }
fi

# this takes the input file as an argument, not from the stdin

C() { mincss -O2 "$1" | css_dark; }
# altho -O2 decreses the byte count of the uncompressed integrated (index.html) file,
# it sometimes increases the gzipped size slightly. -- always test it!

if ! $minify_css; then
  C() { css_dark < "$1"; }
fi

# HTML BASIC MINIFICATION, AND PROCESSING (embedding js & css)

ver=`head -n1 changelog`

H() { perl -CSAD -Mutf8 -pE '
  s/(<<version>><\/summary>)<p>.*?<\/p>/"$1\n".`cat "changelog.html"`/ge if "'${1:-}'" ne "";
  s/<!--.*?-->//g;
  s/^ *\n//g;
  if ("'$minify_html'" eq "true") {
    s/^ +//g;
    s/^\n//;
    s/\n//g;
    s/\s*│\s*/ │ /g;  # the footer
    s/="([^"\x27\x60=<> ]+)"(?=[ >])/=$1/g;
    s/=""//g;
    s/&nbsp;/\N{NBSP}/g;
    s/&thinsp;/\N{THIN SPACE}/g;
    s/&mdash;/\N{EM DASH}/g;
  }
  s/<<hash:mymeta>>/'$hash_mymeta'/g;
  s/<<hash:changelog>>/'$hash_changelog'/g;
  s/<<version>>/'"${ver//\//\\\/}"'/g;
  s/<<(script|style)>>/"<$1>".`cat ".minified'"${1:-}"'.$1"`."<\/$1>"/ge;
  s/<<svg>>/`cat _svg` =~ s|<!--.*?-->||gr =~ s|  +| |gr =~ s|\n||gr/ge;
'; }

# RULES

needed() {
  local out="$1"; shift
  # echo '>' "$out"
  [ "$1" = -- ] && shift
  [ -f "$out" ] || return 0
  for dep in "$@"; do
    # echo '-' "$dep"
    [ "$out" -nt "$dep" ] || return 0
  done
  # echo 'V' up to date
  return 1
}

if needed .minified.style -- style.css; then
  printf 'Preparing %s... ' 'the style'
  C style.css > .minified.style
  echo done
fi

jss='globalsfree.js init.js load.js aftermeta.js script.js osk.js main.js'

if needed .minified.script -- $jss .hashes_vars.sh; then
  printf 'Preparing %s... ' 'the script'
  { FZSTD; cat $jss; } | J | JEND > .minified.script
  echo done
fi

if needed index.html -- _index.html .minified.style .minified.script; then
  printf 'Preparing %s... ' 'index.html'
  H < _index.html > index.html
  # printf '%d %s... ' "$(cat index.html | gzip - | wc --bytes)" "$js_opts" >&2
  echo done
fi

if $dist; then
  bash LOAD.sh LOAD.js  # does it own checking
  JSS=${jss/load/LOAD}
  if needed .minified2.script -- $JSS; then
    { FZSTD; cat ${jss/load/LOAD}; } | J | JEND > .minified2.script
  fi
  #
  if ! [ -e changelog.html ] || [ changelog -nt changelog.html ]; then
    perl -CDAS -Mutf8 -lne '
      s/&/&amp;/g; s/</&lt;/g; chomp;
      print
        s/^- // ? " "x6 . "<li>$_</li>" :
        $_ eq "" ? " "x4 . "</ul>" :
          " "x4 . "<h2>$_</h2><ul>"
    ' changelog > changelog.html
    printf '%4s</ul>\n%2s' "" "" >> changelog.html
  fi
  #
  [ -e .minified2.style ] || ln .minified.style .minified2.style
  H 2 < _index.html | perl -CDAS -Mutf8 -0777 -pe '
  $b{icon}    //= `base64 -w0 < "icon/icon.svg"`;
  $b{favicon} //= `base64 -w0 < "icon/fav.svg"`;
  sub subfont {
    $b{$_[0]} //= `base64 -w0 < "fonts/$_[0].woff2"`;
    s|src:[^;}]*?url\(\x27fonts/$_[0].woff2\x27\)[^;}]*|src:url(data:font/woff2;charset=utf-8;base64,$b{$_[0]}) format(\x27woff2\x27)|
  }
  subfont "Amiri-";
  subfont "Noto Kufi-";
  subfont "KacstOne-";
  subfont "NotoSymbols-";
  s|<link[^<>]*icon[^<>]*png[^<>]*>||g;
  s|<link[^<>]*icon[^<>]*svg[^<>]*>|<link rel=icon type=image/svg+xml href="data:image/svg+xml;base64,$b{favicon}">|;
  s|url\(icon/icon.svg\)|url(data:image/svg+xml;base64,$b{icon})|;
  s|\n\n+|\n|g;
' > irsaa.html
fi
