
mini_js= deno run --quiet --allow-read --allow-env=UGLIFY_BUG_REPORT     npm:uglify-js
mini_css=deno run --quiet --allow-read --allow-env=HTTP_PROXY,http_proxy npm:clean-css-cli

reserved_props=$(shell if ! [ -e .reserved-props ] || [ globalsfree.js -nt .reserved-props ]; then \
		< globalsfree.js sed -n '/mappings =/,/}$$/!d; /:/!d; s/^ *//; s/:.*/,/; p' \
			| sort -u | sed '$$s/,/,goatcounter,allow_frame/' | tr -d $$'\n' > .reserved-props; \
	fi; \
	cat .reserved-props \
)

hash_imla=$(shell     perl -ne     '/"imla": "([^"]+)"/ && print $$1 #=~ s/.{2}$$//r' .hashes.json)
hash_mymeta=$(shell   perl -ne   '/"mymeta": "([^"]+)"/ && print $$1 #=~ s/.{2}$$//r' .hashes.json)
hash_words=$(shell    perl -ne    '/"words": "([^"]+)"/ && print $$1 #=~ s/.{2}$$//r' .hashes.json)
hash_lineends=$(shell perl -ne '/"lineends": "([^"]+)"/ && print $$1 #=~ s/.{2}$$//r' .hashes.json)
hash_suarayat=$(shell perl -ne '/"suarayat": "([^"]+)"/ && print $$1 #=~ s/.{2}$$//r' .hashes.json)
hash_ayat=$(shell     perl -ne     '/"ayat": "([^"]+)"/ && print $$1 #=~ s/.{2}$$//r' .hashes.json)
hash_pauses=$(shell   perl -ne   '/"pauses": "([^"]+)"/ && print $$1 #=~ s/.{2}$$//r' .hashes.json)

# JAVASCRIPT MINIFICATION

js_opts=--compress passes=10,toplevel --mangle toplevel --mangle-props reserved=[fzstd,$(reserved_props)]
# js_opts=--compress

js_process=perl -pe ' \
	          s/(?<=imla\.zst\?h=)<<hash>>/$(hash_imla)/g; \
	  s/(?<=mymeta\.json\.zst\?h=)<<hash>>/$(hash_mymeta)/g; \
	   s/(?<=words\.json\.zst\?h=)<<hash>>/$(hash_words)/g; \
	s/(?<=lineends\.json\.zst\?h=)<<hash>>/$(hash_lineends)/g; \
	s/(?<=suarayat\.json\.zst\?h=)<<hash>>/$(hash_suarayat)/g; \
	    s/(?<=ayat\.json\.zst\?h=)<<hash>>/$(hash_ayat)/g; \
	  s/(?<=pauses\.json\.zst\?h=)<<hash>>/$(hash_pauses)/g; \
	'
J=$(mini_js) $(js_opts) | $(js_process)

JEND=perl -pe 's/\A/"use strict";/; s/;?\s*\Z//'
FZSTD=perl -pe 's/_e\.ZstdError.*?throw n;return n\}/var f=function(r){throw r}/; s/\Z/;/' fzstd-0.1.1.js
# remove detailed error messages with stack traces (our data is known);
# and append a semicolon to concatenate more JS after it.

# # debug: no JS minification of any kind
# J=$(js_process)
# FZSTD=sh -c 'cat fzstd-0.1.1.js; printf ";\n"'
# JEND=sed 1i'"use strict";'


# CSS MINIFICATION

C=$(mini_css) -O2
# altho -O2 decreses the byte count of the uncompressed integrated (index.html) file,
# it sometimes increases the gzipped size slightly. -- always test it!

# # debug: no CSS minification
# C=cat

# HTML BASIC MINIFICATION, AND PROCESSING (embedding js & css; all are ~14k gzipped)
H=perl -CSAD -Mutf8 -pE ' \
	s/^ +//g; \
	s/<!--.*?-->//g; \
	s/^\n//; \
	s/\n//g; \
	s/\s*│\s*/ │ /g; "-- the footer"; \
	s/="([^"\x27\x60=<> ]+)"(?=[ >])/=$$1/g; \
	s/=""//g; \
	s/&nbsp;/\N{NBSP}/g; \
	s/&thinsp;/\N{THIN SPACE}/g; \
	s/&mdash;/\N{EM DASH}/g; \
	s/<<hash:mymeta>>/$(hash_mymeta)/g; \
	s/<<(script|style)>>/"<$$1>".`cat ".minified.$$1"`."<\/$$1>"/ge; \
	'

# RULES

# _: irsaa.tar.bz2 index.html

index.html: _index.html .minified.script .minified.style mymeta.json.zst
	@printf 'Preparing %s... ' 'index.html'
	@$H "$<" > "$@"
	@# printf '%d %s... ' "$$(cat index.html | gzip - | wc --bytes)" "$(js_opts)" >&2
	@echo done

.minified.style: style.css
	@printf 'Preparing %s... ' 'the style'
	@$C "$<" > "$@"
	@echo done

.minified.script: globalsfree.js init.js load.js aftermeta.js script.js main.js
	@printf 'Preparing %s... ' 'the script'
	@{ $(FZSTD); cat $^; } | $J | $(JEND) > "$@"
	@echo done

.PHONY: clean mymeta.json.zst

# it does all the monitoring it needs itself -- that's why it's considered .PHONY (ie, always made when asked for)
mymeta.json.zst: _data.json
	bash mkmeta.sh

.hashes.json: mkhash.sh
	bash mkhash.sh > $@

clean:
	rm -f index.html .minified.style .minified.script
