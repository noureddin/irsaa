#!/bin/bash
set -eu

minify_js=true
minify_css=true
minify_html=true
disabledark=true
# remove the darkmode js & css, because it's still experimental and thus is disabled by default

# use `make toggle`
if [ -e .nominify ]; then
  minify_js=false
  minify_css=false
  minify_html=false
fi
if [ -e .keepdark ]; then
  disabledark=false
fi

_() { printf '%s\n' "$*"; "$@"; }

dist=false
if [ $# -gt 0 ]; then
  case "$1" in clean|-B|-f)
    _ rm -f index.html .minified.{script,style}
    if [ "$1" != -f ]; then
      _ rm -f .hashes_vars.sh mymeta.json.zst
    fi
    if [ -e irsaa.html ]; then
      _ rm -f irsaa.html .minified2.{script,style} LOAD.js changelog.html qaris.html
    fi
    ;;
  esac
  if [ "$1" = clean ]; then exit; fi
  if [ "$1" = dist ]; then dist=true; fi
fi

JS_ENV=UGLIFY_BUG_REPORT
CSS_ENV=HTTP_PROXY,http_proxy,__DIRECT__

minjs()  { deno run --quiet --allow-read --allow-env=$JS_ENV  npm:uglify-js "$@"; }
mincss() { deno run --quiet --allow-read --allow-env=$CSS_ENV npm:clean-css-cli "$@"; }

reserved_props='fzstd,goatcounter,allow_frame,h,c'

# both do their monitoring themselves
bash mkmeta.sh mymeta.json.zst
bash mkhash.sh .hashes_vars.sh  # hashes (among others) the mymeta file made by mkhash.sh
source .hashes_vars.sh

# JAVASCRIPT MINIFICATION

js_opts=(--compress passes=10,toplevel,drop_console --mangle toplevel --mangle-props "reserved=[$reserved_props]")
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

# this takes the input file as an argument or from the stdin; I use it from the stdin for symmetry

C() { mincss -O2 | css_dark; }
# altho -O2 decreses the byte count of the uncompressed integrated (index.html) file,
# it sometimes increases the gzipped size slightly. -- always test it!

if ! $minify_css; then
  C() { css_dark; }
fi

# HTML BASIC MINIFICATION, AND PROCESSING (embedding js & css)

verday=
case $(date -d"$(sed '
  s/.*(//; s/م)//; s| .*/||;
  y/٠١٢٣٤٥٦٧٨٩/0123456789/;
  s/يناير/Jan/;  s/فبراير/Feb/; s/مارس/Mar/;   s/إبريل/Apr/;
  s/مايو/May/;   s/يونيو/Jun/;  s/يوليو/Jul/;  s/أغسطس/Aug/;
  s/سبتمبر/Sep/; s/أكتوبر/Oct/; s/نوفمبر/Nov/; s/ديسمبر/Dec/;
q' changelog)" +%w) in
  0) verday=الأحد ;;
  1) verday=الاثنين ;;
  2) verday=الثلاثاء ;;
  3) verday=الأربعاء ;;
  4) verday=الخميس ;;
  5) verday=الجمعة ;;
  6) verday=السبت ;;
  *) printf 'Error in date\n' >&2;;
esac
ver="$verday $(head -n1 changelog)"

H() { perl -CSAD -Mutf8 -pE '
  s/<p>يجري تحميل أسماء التلاوات الصوتية…<\/p>/`cat "qaris.html"`/ge if "'${1:-}'" ne "";  # for dist
  s/(<<version>><\/summary>)<p>.*?<\/p>/"$1\n".`cat "changelog.html"`/ge if "'${1:-}'" ne "";  # for dist
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

jss='globalsfree.js init.js load.js pages.js aftermeta.js search.js osk.js state.js audio.js script.js main.js'

if needed .minified.script -- $jss .hashes_vars.sh; then
  printf 'Preparing %s... ' 'the script'
  { FZSTD; cat $jss; } | J | JEND > .minified.script
  echo done
fi

if needed .minified.style -- style.css; then
  printf 'Preparing %s... ' 'the style'
  C < style.css > .minified.style
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
      s/&/&amp;/g; s/<(?= )/&lt;/g; chomp;
      print
        s/^- // ? " "x6 . "<li>$_</li>" :
        $_ eq "" ? " "x4 . "</ul>" :
          " "x4 . "<h2>$_</h2><ul>"
    ' changelog > changelog.html
    printf '%4s</ul>\n%2s' "" "" >> changelog.html
  fi
  #
  if ! [ -e qaris.html ] || [ qaris.html -ot ../recite/res/qaris ]; then
    { printf '    <select id="qaris" onchange="data_loaded.then(() => audio.setqari(this.value))">\n'
      printf '      <option value="">بغير تلاوة صوتية</option>\n'
      cat ../recite/res/qaris | while read id; do read name
        printf '      <option value="%s">%s</option>\n' "$id" "$name"
      done
      printf '    </select>\n'
    } > qaris.html
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
  subfont "AmiriQuran";
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

if [ $# -gt 0 ] && [ "$1" = uthm ]; then
  mkdir -p u
  last=1; i=1
  for this in 493 954 1473 2140 2932 3788 4735 6236 ; do
    sed -n "$last,$ p; $this q" ../recite/res/u | tr -d 'A-Z<>#' | zstd -19 > u/$i.zst
    last=$((this+1))
    i=$((i+1))
  done
fi
