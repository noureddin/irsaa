# Irsaa (إرساء): Solidify Your Quran Memorization by Writing a Muṣħaf

Irsaa is an interactive muṣħaf for solidifying your Quran memorization, or even for just reading, with or without typing.

Use it at [noureddin.dev/irsaa](https://www.noureddin.dev/irsaa/).

## Development

Clone the repository, then run a local server inside the clone's directory (anything would do, e.g., `python3 -m http.server`).

You can modify `_index.html` (not `index.html`), and `style.css`, and any `*.js` file. Then run `make` to rebuild the Web application.

(If you don't have [deno](https://deno.com/), run `make nomini` to disable minification, or just `touch .nominify`.)

## Data

The Imlaai text (the text you type into the application) is from
[WikiSource](https://ar.wikisource.org/wiki/القرآن_الكريم_(بالرسم_الإملائي)).
It's very accurate, even compared to some official sources(!).

The audio recitation are from [EveryAyah Quran MP3 Project](https://www.versebyversequran.com/).

The pages' images are from the tajweed-colored [Dar-ul-Ma‘refa Muṣħaf](https://www.easyquran.com/).
This muṣħaf follows basically the same line- and page-divisions of
[al-Madīna Muṣħaf](https://qurancomplex.gov.sa/quran-hafs/).

All other data (the placement of the words on the pages, etc) are my own work. I made these data and some pages' images available for any project needing them at:
<https://github.com/noureddin/quran-pages/>.

## License

See the previous section for details about the different data used and their licenses.

The file `fzstd-0.1.1.js` is v0.1.1 of [fzstd by 101arrowz](https://github.com/101arrowz/fzstd),
distributed under the terms of the MIT License.

Everything else is my own work and is provided under the terms of Creative Commons Zero (equivalent to Public Domain).

Copyright (c) 2026 Noureddin.
