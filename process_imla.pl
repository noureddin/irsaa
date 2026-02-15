#!/usr/bin/env perl
use v5.16; use warnings; use utf8;
use open qw[ :encoding(UTF-8) :std ];

use constant out_as_json => 0;

# Some application-specific pre-processing is needed.
# Some is done at runtime in JS, and some at build time here.

# Every NSBP here correspond to a normal space in user input, but don't break words.

# https://ar.wikisource.org/wiki/القرآن_الكريم_(بالرسم_الإملائي)/النص_المجرد
open my $imla, '<', 'imla-lines.txt' or die "Couldn't open 'imla-lines.txt' for reading\n";

open my $pipe, '|-', 'zstd -19 --force -o imla.zst' or exit 2;  # the system provides a good error messages
print { $pipe } '[' if out_as_json;

# Basmala of al-Fātiħa (the very first line in imla-lines.txt)
# is written as one big ligature in the Uthmani text, not as separate words
print { $pipe } <$imla> =~ s/ /\N{NBSP}/gr;

for (<$imla>) {
  # The vocative Yā always connects to the next word in the Uthmani text
  s/(?<=\bيا) /\N{NBSP}/g;
  s/(?<=\bويا) /\N{NBSP}/g;  # e.g., page 152 (sura 7 aaya 19)
  # Similar is the attention Hā (like ها أنتم)
  s/(?<=\bها) /\N{NBSP}/g;
  # El-Yāsīn (in 37:130) is a single word in Ħafs-an-Āṣem
  s/(?<= إل) (?=ياسين)/\N{NBSP}/g;
  # "mā le" is written separated from the next word in 4 places, but you can't pause and start with the next word
  s/(?<=مال) (?=ه)/\N{NBSP}/g;  # three places (4:78, 18:49, 25:7)
  s/(?<=فمال) (?=الذين)/\N{NBSP}/g;  # the last place (70:36)
  # https://alitkaan.com/المقطوع-والموصول/
  #
  print { $pipe } out_as_json ? "'$_'," : $_;
}

print { $pipe } ']' if out_as_json;
close $imla;
close $pipe;

