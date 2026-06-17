// methods that rely on metadata (the Q variable; thus should be called in data_loaded.then())
////////////////////////////////////////////////////////////////////////////////
// txt {{{1

const update_input = (p, w, insert, double, keep=false) => {
  if (!insert || w === Q.words[p-1].length) { txt.hidden = true; return }
  //
  const waqfs = Q.pauses[p-1].filter(e => e >= w)  // before or at a waqf sign or a gap
  const lastword_line = Q.lineends[p-1].filter(e => e >= w)[0]
  const lastword_ayah =  Q.ayat[p-1].filter(e => e >= w)[0]  // subtract one to not include the ayahnum in the field
  const lastword = Math.min(lastword_line, lastword_ayah, waqfs.length ? waqfs[0] : Infinity)
  //
  const thisline = Q.lineends[p-1].indexOf(lastword_line) - 1
  const firstword_line = thisline >= 0 ? Q.lineends[p-1][thisline]+1: 0
  //
  const left  = (double && p % 2 == 1 ?   W : 0) + Q.words[p-1][lastword][0]
  const right = (double && p % 2 == 0 ? 2*W : W) - Q.words[p-1][w][0] - Q.words[p-1][w][2]
  const www = Q.words[p-1].slice(firstword_line, lastword_line+1)
  const D = double ? 2*W : W
  // const left = offset + www[ www.length-1 ][0]
  // const width = www[0][0] + www[0][2] - left + offset
  // const top = www[ www.length-1 ][1]
  // const height = www[ www.length-1 ][3]
  // const width = D - left - right
  // rect(left, top, width, height)
  const _top    = average(...www.map(w => w[1]))
  const _bottom = average(...www.map(w => H - w[1] - w[3]))
  const hpad = (H - _top - _bottom) / 7
  const top = _top - hpad
  const bottom = _bottom - hpad
  // rect(...fixdim(p, Q.words[p-1][firstword_line]))
  txt.style.top = top * 100/H + '%'
  txt.style.bottom = bottom * 100/H + '%'
  //
  txt.style.right = right * 100/D + '%'
  txt.style.left = left * 100/D + '%'
  //
  txt.resize()
  if (!keep) { txt.value = "" }
  try { txt.oninput() } catch (e) {}  // update background
  // ^ silently fails when called in to_insert() in data_loaded.then(), causing everything thing after it (here and in data_loaded.then()) to not execute.
  txt.hidden = false  // see the first line of this function
  if (!txt.disabled) {  // disabled when showing help
    focus_input()
  }
}

const get_correct_text = (p) => {
  let correct = Q.imla.slice(Q.page_offset[p-1], Q.page_offset[p])
    .join(" \n ").split(" ")
    .map(e => e.replace(/\xa0/g, " ").replace(/#/, 'بسم الله الرحمن الرحيم'))
  correct.push('\n')  // end of last aya
  return correct
}

////////////////////////////////////////////////////////////////////////////////
// DOM utils {{{1

const normal_scroll = (p, w) => {  // normal-mode scroll-into-view
  if (!Q.words || !Q.lineends) { return }
  const ln = w < Q.words[p-1].length
    ? Q.lineends[p-1].findIndex((end) => end >= w)
    : Q.lineends[p-1].length - 1
  const st = ln && Q.lineends[p-1][ln-1]
  const en = Q.lineends[p-1][ln]
  const ww = Q.words[p-1].slice(st && (st+1), en+1)
  const top = Math.min(...ww.map(dim => dim[1]))
  const bot = Math.max(...ww.map(dim => dim[1] + dim[3]))
  const full = pagescroll.scrollHeight
  scroll_into_view(top * full / H, bot * full / H)
}

////////////////////////////////////////////////////////////////////////////////
// ayat utils {{{1
// p+w / pag+eline / sura+aaya / aaya_offset conversions
// see the "selectors" section in script.js

// naming convention:
// - p = page (1-based)
// - w = word in page (0-based)
// - l = line in page (1-based)
// - s = sura number (1-based)
// - a = aaya number in sura (1-based)
// - y = aaya offset in the entire Quran (always 0-based (0 ≤ y < 6236) except when calling sura_of/page_of it's 1-based (0 < y ≤ 6236))
// only w is always 0-based, and y usually is.

const sura_of = (a) => bisect(Q.sura_offset, a, 114)    // takes 1-based aaya ∈ [1-6236], returns its 1-based sura number
const page_of = (a) => bisect(Q.page_offset, a, 604)+1  // takes 1-based aaya ∈ [1-6236], returns its 1-based page number

// all Q.* here are in mymeta, except Q.ayat; thus this (and audio) must be called after data_loaded
const page_word_to_sura_aaya = (p, w) => {
  if (p === 187 && w <= 1) { return [9,1] }  // At-Tawba - the only sura not starting with a basmala
  if (Q.basmalaat[p-1].includes(w) || Q.headers[p-1].includes(w)) { return [1,1] }  // the basmala, for audio
  const y = Q.page_offset[p-1] + bisect(Q.ayat[p-1], w)
  const s = sura_of(y+1)  // 1-based sura
  const a = y - Q.sura_offset[s-1] + 1
  return [s, a]
}

const sura_aaya_from_aaya_offset = (y) => {
  const s = sura_of(y+1)  // 1-based sura
  const a = y - Q.sura_offset[s-1]
  return [s, a]
}

// word utils {{{1

const is_void_word = (p, w) =>
  Q.ayat[p-1].includes(w)
  || Q.headers[p-1].includes(w)

const is_end_word = (p, w) =>
  Q.ayat[p-1].includes(w)
  || Q.pauses[p-1].includes(w)
  || Q.morepauses[p-1].includes(w)
  || Q.basmalaat[p-1].includes(w)  // stop before AND after a basmala
  || Q.basmalaat[p-1].includes(w+1)

const isnt_phrase_end = (p,w) => !is_end_word(p,w-1)

// PRECONDITION: is_void_word(p,0) can be true, but then is_void_word(p,1) can NEVER be true.
//   That means basmlaat are not void words; ie, they are manually typed/shown by the user.
//   But note: is_void_word(p,1) can be true if is_void_word(p,0) is false.
//   All that's in theory; in practice, is_void_word(p,1) is always false.
const is_page_almost_empty = (p, w) => w === 0 || w === 1 && Q.headers[p-1][0] === 0

// data_loaded.then(() => console.log( range(604).filter(_p => Q.headers[_p][0] === 0) ))
const pages_never_empty = [ 0, 1, 49, 127, 150, 176, 186, 248, 261, 281, 304, 321, 410, 427, 476, 482, 495, 510, 517, 541, 552, 559, 561, 571, 573, 581, 585, 589, 592, 596, 597, 600, 601, 602, 603 ]
// ^ pages that start with a void word (a sura header), thus are never empty,
//   unless on the left side of an incomplete page.

// drawing-related functions

const margin_of =
  (p) => p < 3 ? Q.margins[p]
       : p % 2 ? Q.margins.odd
               : Q.margins.even

////////////////////////////////////////////////////////////////////////////////
// offcanvas: hide_words, show_words, draw_page {{{1

// hide all the words in the page down to and including w and any preceding connected words (eg, ayah num or sura name)
// draws on offcanvas, unless it returns Q.words[p-1].length
const hide_words = (p, w, page, words_color, margin_color, skippable) => {
  const bgn = is_void_word(p, 0) ? 1 : 0  // see the PRECONDITION for is_page_almost_empty()
  if (w === bgn) {  // if is_page_almost_empty
    // console.warn('hide_words called with an almost empty page', p)
    return w
  }
  offctx.clearRect(0, 0, W, H)
  //
  if (w === Q.words[p-1].length) {
    // hide the main margin, but show the marginword if exists in this page
    offctx.fillStyle = margin_color
    offctx.fillRect(...margin_of(p))
    if (p in Q.marginwords) {
      let dim = Q.marginwords[p].outer  // includes the border
      offctx.drawImage(page, ...dim, ...dim)
    }
  }
  w -= 1
  offctx.fillStyle = words_color
  do {
    offctx.fillRect(...Q.words[p-1][w])
    if (p in Q.marginwords && w === Q.marginwords[p].index) {
      offctx.fillStyle = margin_color
      offctx.fillRect(...margin_of(p))
      offctx.fillRect(...Q.marginwords[p].inner)
      offctx.fillStyle = words_color
    }
  } while (skippable(p, w--) && w >= bgn)  // if the word we've just shown should be skipped and we haven't reached the page beginning yet, continue backward
  return w+1  // w is shown; thus return w+1
}

// shows all the words in the page up to and including w and any following connected words (eg, ayah num or sura name)
// draws on offcanvas, unless it returns Q.words[p-1].length
const show_words = (p, w, page, words_color, margin_color, skippable) => {
  const L = Q.words[p-1].length
  if ( w == null || w >= L  // already at the end
    // or only one actual word is remaining (the rest are void)
    || w >= L-3 && L-w - range(L-w).filter((i) => is_void_word(p, i+w)).length <= 1
    // or only one phrase-stop is remaining in movement by phrase
    || skippable !== is_void_word && range(L-w).findIndex((i) => !skippable(p, 1+i+w)) + w - L >= -2
    // note: when a page has a void word at L-2, it's an aaya num and L-1 is a void word too (a sura name).
  ) {
    return L
  }
  offctx.clearRect(0, 0, W, H)
  //
  do {
    let dim = Q.words[p-1][w]
    offctx.drawImage(page, ...dim, ...dim)
    if (p in Q.marginwords && w === Q.marginwords[p].index) {
      dim = Q.marginwords[p].outer  // includes the border
      offctx.drawImage(page, ...dim, ...dim)
    }
  } while (skippable(p, ++w))  // if the word we will show should be skipped, continue forward
  // a skippable word is a non-end-word in movement by phrase, or a void-word in movement by words.
  // the last word in a page is always a void word (and is an end-word or preceded by one),
  // and we never go there here, because we handled that case above.
  return w
}

// draws on offcanvas, unless it returns Q.words[p-1].length
const draw_page = (p, w, page, words_color, margin_color) => {
  if (w == null) { return Q.words[p-1].length }
  else if (w === -1) { w = 0 }  // -1 means a really empty page; 0 for "almost empty" (if starts with a sura name, it shows it).
  else if (w < Q.words[p-1].length) {
    while (is_void_word(p, w)) { ++w }
    if (w === Q.words[p-1].length) { return Q.words[p-1].length }
  }
  //
  // draw on an offscreen canvas, to avoid flash of full page before making it empty
  offctx.drawImage(page, 0, 0, W, H)
  offctx.fillStyle = words_color  // hide words
  for (let j = w; j < Q.words[p-1].length; ++j) { offctx.fillRect(...Q.words[p-1][j]) }
  // hide margins
  offctx.fillStyle = margin_color
  offctx.fillRect(...margin_of(p))
  if (p in Q.marginwords) {
    // needs to be repainted after the actual margin. it's hidden (erased) with the margin color
    if (w <= Q.marginwords[p].index) {
      offctx.fillRect(...Q.marginwords[p].inner)
    }
    else {
      const dim = Q.marginwords[p].outer  // includes the border
      offctx.drawImage(page, ...dim, ...dim)
    }
  }
  // for (let i = 0; i < Q.lineends[p-1].length; ++i) { rect(offctx, ...Q.words[p-1][Q.lineends[p-1][i]]) }
  return w
}

////////////////////////////////////////////////////////////////////////////////
// onscreen canvas: update_page & update_one_page {{{1

const update_page = (() => {

  let wanted = new Set()  // if the pages are (still) wanted
  // (if the user didn't ask for a different page during the fetching of the current page)

  const update_one_page = async (Dark, con, p, w, preload_nearby_pages) => {
    const offset = page_offset_in_canvas(p)
    let page = Pages.has(Dark, p)
    if (page == null) {
      const loadingpage = emptypage.pageloading(Dark)
      con.drawImage(loadingpage, offset, 0, W, H)
      page = await Pages.fetch(Dark, p)
    }
    // if the current page is no longer needed, don't even preload nearby pages;
    // as we've already gone to a (possibly) far away page.
    if (!wanted.has(p)) { return }  // returns undefined to be handled in the caller of update_page (ie, in update_page_to)
    preload_nearby_pages()
    //
    if (page === "") {  // couldn't load the page
      con.drawImage(emptypage.pagefailed(Dark), offset, 0, W, H)
      return Q.words[p-1].length
    }
    w = draw_page(p, w, page, WordsColor[+Dark], MarginColor[+Dark])  // draws on offcanvas, unless it returns Q.words[p-1].length
    con.drawImage(w === Q.words[p-1].length ? page : offcanvas, offset, 0, W, H)
    return w
  }

  return async (Dark, p, w, can) => {
    p = fixpage(p)
    const con = can ? can.getContext('2d') : ctx
    //
    if (right_in_double(p) && w === Q.words[p-1].length) { p += 1; w = 0 }
    // it's illegal to have the right page "full" in double;
    // this can happen when being in single and switching to double.
    //
    p = fixpage(p)
    disable_input()
    wanted.clear()
    wanted.add(p)
    //
    if (!screen_double) {
      body.classList.toggle('r', p % 2)
      w = await update_one_page(Dark, con, p, w, preload4(p+1, p-1, p+2, p+3))
    }
    else if (p % 2) {
      wanted.add(p+1)
      // the other page's w = -1 because it's the next page, thus "really empty" (0 would make it "almost empty")
      ;[w] = await Promise.all([
        update_one_page(Dark, con, p,    w, preload4(p+1, p-1, p+2, p+3)),
        update_one_page(Dark, con, p+1, -1, preload4(p-2, p+4, p+5, p+6)),
      ])
    }
    else {
      wanted.add(p-1)
      // other page's w = null because it's the prev page, thus full
      ;[w] = await Promise.all([
        update_one_page(Dark, con, p,   w,    preload4(p-1, p-2, p+1, p+2)),
        update_one_page(Dark, con, p-1, null, preload4(p+3, p+4, p+5, p+6)),
      ])
    }
    //
    enable_input()
    return [p, w]
  }
})()

// keyboard mappings related methods {{{1

const insert_in_field = (el, ch) => {
  if (!ch) { return }
  // https://stackoverflow.com/a/11077016 and comments, with modifications
  const st = el.selectionStart
  const en = el.selectionEnd
  //
  const before = el.value.substring(0, st)
  const after  = el.value.substring(en, el.value.length)
  //
  el.value = before + ch + after
  // restore cursor position
  el.selectionStart = el.selectionEnd = st + ch.length
}

const intended_key = (ev) => {
  if (ev.key.match(/^[ \nء-غف-ي]$/)) { return ev.key }
  // if not emulating (the only choice for now), but entered a non-Arabic letter → auto-emulate the mainstream kb
  const kk
    = Q['ibm'][ev.code]
    ? Q['ibm'][ev.code][+ev.shiftKey]
    : null
  if (kk && kk.match(/^[ \nء-غف-ي]$|^ل[اأإآ]$/)) { return kk }
}

// vim: set foldmethod=marker foldmarker={{{,}}} :
