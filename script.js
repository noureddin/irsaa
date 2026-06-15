// globals {{{1

// maybe-will-be configurables

const PAUSE_HOLD = 7  // how many skips at pause-points if held the move key (0-10)

const make_sensitivity = (max, init, id) => {
  const el_range = Qid('s-'+id)
  const el_reset = Qid('ss'+id).querySelector('button')
  const self = { value:0, real_value:0 }
  //
  // logarithmic, written as 1<<n instead of 2**n; as n is positive integer, there is not difference.
  const real_set = (v) => {
    self.value = v
    self.real_value = 1 << (max - v)
    el_reset.disabled = (v == init)
  }
  //
  self.set = (v) => { el_range.value = v; if (v != self.value) { real_set(v) } }
  // note: I don't check here if v is integer or is in bounds
  el_reset.onclick = self.reset = () => self.set(init)
  self.reset()
  //
  el_range.max = max
  el_range.oninput = () => { real_set(el_range.value) }
  //
  return self
}

const wheel = make_sensitivity(9, 5, 'w')
// how many milliseconds to wait between successive wheel events
// up to ~500 logarithmically; thus 2 to 2**9 by whole numbers in the power (defaults to 2**5)

const swipe = make_sensitivity(8, 2, 's')
// how many pixels swiped to trigger moving by word
// up to ~250 logarithmically; thus 2 to 2**8 by whole numbers in the power (defaults to 2**4)

// methods based on screen {{{1

const draw_emptypage = (fn) => {
  const con = ctx
  const page = fn(screen_dark)
  con.drawImage(page, 0, 0, W, H)
  if (screen_double) {
    con.drawImage(page, W, 0, W, H)
    vline(con, W, 0, H, TxtFg[+screen_dark], 1)
  }
  if (!noredraw_screen) { redraw_screen = () => draw_emptypage(fn) }
}

const preload4 = (a,b,c,d) =>
  () => Pages.get(screen_dark, fixpage(a),
  () => Pages.get(screen_dark, fixpage(b),
  () => Pages.get(screen_dark, fixpage(c),
  () => Pages.get(screen_dark, fixpage(d) ))))

// inits based on screen {{{1

txt.resize = () => {
  let s = screen_fontsize
  txt.style.fontSize = s + 'px'
  while (txt.scrollWidth > 1+txt.clientWidth) {  // this +1 is needed for Blink
    txt.style.fontSize = (s /= 1.05) + 'px'
    if (s < 16) { break }
  }
}

onresize = () => {
  // a delay is needed sometimes to get the right dimensions
  requestAnimationFrame(() => {
    // a second delay is apparently needed for this
    if (helping) { requestAnimationFrame(update_scrollshadows) }
    //
    update_rem()
    resize_canvas()
    help_onresize()
    resize_screen()
    update_fontsize()
    txt.resize()
    osk_onresize()
  })
}

// ui-related functions {{{1

// mode switching: normal, insert, help, loading

const focus_word = () => { txt.hidden ? normal_scroll(p,w) : focus_input() }

const to_normal = () => {
  insert = false
  txt.hidden = true
  kk_ed.style.display = 'block'
  kk_mv.style.display = 'none'
  normal_scroll(p,w)
}

const to_insert = () => {
  insert = true
  txt.hidden = false
  kk_ed.style.display = 'none'
  kk_mv.style.display = 'block'
  update_input(p, w, insert, screen_double)
}

const show_help = () => {
  helping = true
  sync_selectors(p, w)
  body.classList.add('h')
  update_scrollshadows()
  txt.disabled = true
  kk.style.visibility = 'hidden'
  document.querySelector('select').focus()
  if (player.paused) { audio.hide() }
}

const hide_help = (focus=true) => {
  helping = false
  body.classList.remove('h')
  if (!loading) {
    kk.style.visibility = 'visible'
    txt.disabled = false
    if (focus) { focus_word() }
  }
  if (audio.can()) { audio.show() }
  if (audiopending) { audiopending = false; play_or_preload_this() }
}

const disable_input = () => {  // disable in-page input during page loading
  txt.disabled = true
  loading = true
  kk.style.visibility = 'hidden'
}

const enable_input = () => {
  // if, while showing help, the window is resized enough to switch between single/double,
  // it'll call redraw(), which calls update_page(), which calls this.
  if (!helping) {
    kk.style.visibility = 'visible'
    txt.disabled = false
    focus_word()
  }
  loading = false
}

////////////////////////////////////////////////////////////////////////////////
// some event bindings {{{1

Qid('sh').onclick = show_help
Qid('x').onclick = hide_help
Qid('b').onclick = hide_help

const canvas_mouse_to_x_y_p = (ev) => {
  const sty = getComputedStyle(canvas)
  const ch = parseFloat(sty.height)
  const cw = parseFloat(sty.width)
  const y = ev.offsetY * H/ch
  let x, pp
  if (screen_double && ev.offsetX > cw/2) {  // the right (odd) page
    x = (ev.offsetX - cw/2) * 2*W/cw
    pp = p - 1 + p%2  // round p to odd (4 → 3 and 3 → 3)
  }
  else if (screen_double) {  // the left (even) page
    x = ev.offsetX * 2*W/cw
    pp = p + p%2  // round p to even (3 → 4 and 4 → 4)
  }
  else {  // single page
    x = ev.offsetX * W/cw
    pp = p
  }
  return [x, y, pp]
}

// // show a "help" icon along with the cursor when
// // moving over ayat numbers, to indicate that
// // the user can click on it to show the tafsir
// // (the tafsir is not implemented in Irsaa yet)
// canvas.addEventListener('mousemove', (ev) => {
//   const [x, y, pp] = canvas_mouse_to_x_y_p(ev)
//   for (let i of Q.ayat[pp-1]) {
//     if (i > w+1) { break }
//     const [X,Y,W,H] = Q.words[pp-1][i]
//     if (X <= x && x <= X+W && Y <= y && y <= Y+H) {
//       canvas.style.cursor = 'help'
//       return
//     }
//   }
//   canvas.style.cursor = ""
// }, { passive: true })

canvas.addEventListener('click', (ev) => {
  if (insert || !audio.can()) { return }
  const [x, y, pp] = canvas_mouse_to_x_y_p(ev)
  // dbg_vline(x + (screen_double && pp % 2)*W)
  // dbg_hline(y)
  for (let i = 0; i <= w+1 && i < Q.words[pp-1].length; ++i) {
    const [X,Y,W,H] = Q.words[pp-1][i]
    if (X <= x && x <= X+W && Y <= y && y <= Y+H) {
      if (Q.ayat[pp-1].indexOf(i) !== -1) {
        // todo: show tafsir
      }
      else {
        audio.blink()
        audio.play(pp, i, 1)  // don't preload any other aaya
      }
      return
    }
  }
}, { passive: true })

////////////////////////////////////////////////////////////////////////////////
// selectors synchronization with the visible page {{{1

const update_aayat = () => { aaya_select.innerHTML = num_opts(Q.sura_length[sura_select.value]) }

const update_lines = () => {
  line_select.innerHTML
    = num_opts(page_select.value < 3 ? 8 : 15)  // === Q.lineends[p-1].length
    + '<option value="">كاملة</option>'
}

let true_sync_selectors

// const echo = (v, pre="") => {
//   if (pre !== "") { console.log(pre, v) } else { console.log(v) }
//   return v
// }

let sync_selectors = () => {  // overridden by the true one once all the json data is loaded
  page_select.value = p  // set in preinit
  sura_select.value = load_num('s', 0)
  update_aayat()
  update_lines()
  aaya_select.value = load_num('a', 1)
  line_select.value = load_num('l', 1)
}

////////////////////////////////////////////////////////////////////////////////
// main logic methods {{{1

const Movado = (() => {
  let held_keydown = 0

  const reformat_input = (keep) => update_input(p, w, insert, screen_double, keep)

  // all Movado methods call either update_page_to() or move() to change p&w

  const update_page_to = async (pp, ww) => {
    pp = fixpage(pp)
    if (ww != null) {
      while (ww < Q.words[pp-1].length && is_void_word(pp, +ww)) { ++ww }
    }
    ;[pp, ww] = await update_page(screen_dark, pp, ww)
     // if the page is not drawn because the user went to a different page:
    if (ww == null) { return false }
    // otherwise the page is drawn:
    p = pp
    w = ww
    hash_set_pw(p,w)
    // assert_pw()
    if (helping) { audiopending = true }
    else { play_or_preload_this() }
    return true
  }

  const full_page = async (pp) => {
    if (await update_page_to(pp)) {
      update_correct_text()
      txt.hidden = true
      normal_scroll(p, w)
    }
  }

  const new_page = async (pp) => {  // an "almost empty" page; ie, with first non-void words
    if (await update_page_to(pp, 0)) {
      update_correct_text()
      reformat_input()
      if (txt.hidden) { normal_scroll(p, w) }
    }
  }

  const redraw = async () => {
    if (await update_page_to(p, w)) {
      // p&w can change if the right page is full when switching from single to double
      update_correct_text()
      reformat_input(true)  // keep input
    }
  }

  const go_to = async (pp, ww) => {
    if (await update_page_to(pp, ww)) {
      update_correct_text()
      reformat_input()
    }
  }

  //

  const move = (fn, by_phrase) => {
    const page = Pages.has(screen_dark, p)
    // assert(page != null, `page ${p} not available, called in forward() or backward()`)
    const skip_predicate = by_phrase ? isnt_phrase_end : is_void_word
    w = fn(p, w, page, WordsColor[+screen_dark], MarginColor[+screen_dark], skip_predicate)  // draws on offcanvas, unless it returns Q.words[p-1].length
    ctx.drawImage(w === Q.words[p-1].length ? page : offcanvas, page_offset_in_canvas(p), 0, W, H)
    hash_set_pw(p,w)
    play_this()
  }

  const keyup = () => { held_keydown = 0 }

  let last_move  // to auto-keyup after 250ms of inactivity

  const should_skip = (by_phrase) => {
    const now = performance.now()
    if (last_move != null && last_move + 250 < now) {
      last_move = now
      held_keydown = PAUSE_HOLD
      return false  // don't skip
    }
    last_move = now
    //
    if (held_keydown) {
      --held_keydown
      // if holding down the move-by-word key,
      // and the current word is a phrase end, pause a bit.
      if (!by_phrase && (
            w === 0 || (w === 1 && (p === 1 || p === 187)) ||
            w === Q.words[p-1].length || !isnt_phrase_end(p, w)
            // the `w=1` part is for al-Fātiħa and at-Tawba; both start with their first ayah
            // without an additiona basmala (the basmala is the first ayah in al-Fātiħa).
      )) {
        return true  // skip
      }
      else {
        held_keydown = PAUSE_HOLD
        return false  // don't skip
      }
    }
    held_keydown = PAUSE_HOLD
    return false  // don't skip
  }

  const forward = async (by_phrase) => {
    // Show the next word or phrase.
    // If reached the end of page, draw the entire page (including margins),
    //   and wait for the user to ask for the next word to go to the next page.
    // UNLESS you're showing two facing pages at the time, and it's the first,
    //   then go to the next page immediately.
    //
    if (should_skip(by_phrase)) { return }
    //
    if (w === Q.words[p-1].length) {
      await new_page(p+1)
    }
    else {
      move(show_words, by_phrase)
      if (w === Q.words[p-1].length && right_in_double(p)) {
        // go on to the next page immediately; otherwise wait for the next forward() call.
        await new_page(p+1)
      }
      else {
        reformat_input()
        if (txt.hidden) { normal_scroll(p, w) }
      }
    }
  }

  const backward = async (by_phrase) => {
    // Hide the current word or phrase.
    // If reached the start of page, make it almost-empty,
    //   like you've just come to it from a prev page,
    //   and wait for the user to ask for the prev word to go to the prev page.
    // UNLESS you're showing two facing pages at the time, and it's the second,
    //   then go to the prev page immediately.
    //
    if (should_skip(by_phrase)) { return }
    //
    const empty = is_page_almost_empty(p, w)
    const noflip = left_in_double(p)
    //
    if (empty) {
      await full_page(p-1)
    }
    if (noflip || !empty) {
      move(hide_words, by_phrase)
      reformat_input()
      if (txt.hidden) { normal_scroll(p, w) }
    }
  }

  return {
    full_page, new_page,
    redraw, go_to, forward, backward,
    keyup,
    //
    preinit: () => {  // called after the small mymeta.json loads
      if (isNaN(p) || p < 1 || p > 604) { p = 1; w = 0 }
      else if (isNaN(w) || w < 0)       { w = 0 }
      p = Math.floor(p)
      w = Math.floor(w)
      nohelp || show_help()
      window.onkeydown = (ev) => { if (ev.key === '*') { ev.preventDefault(); toggle_dark() } }
    },
    init: () => {  // called after all the json data loads
      noredraw_screen = true  // don't change the global redraw_screen() again
      redraw_screen = Movado.redraw
      sync_selectors = true_sync_selectors
      if (w > Q.words[p-1].length) { w = Q.words[p-1].length }
      go_to(p, w)
    },
  }
})()

////////////////////////////////////////////////////////////////////////////////
// selectors {{{1

let page_word_to_sura_aaya

meta_loaded.then(() => {

  draw_emptypage(emptypage.pageloading)

  const start_ = (s) => +Q.sura_length.slice(0, s).reduce((a, b) => a + b, 0)
  Q.sura_offset = range(115).map(start_)  // array mapping 0-based suar to how many ayat before it (eg 0 => 0, 1 => 7, 2 => 286+7)

  const sura_of = (a) => bisect(Q.sura_offset, a, 114)  // takes 1-based aaya ∈ [1-6236], returns its 1-based sura number
  const page_of = (a) => bisect(Q.page_offset, a, 604)  // takes 1-based aaya ∈ [1-6236], returns its 0-based page number

  const sync_page_line = () => {  // with sura-aaya
    if (Q.suarayat && Q.words) {  // if loaded
      let [p, w] = Q.suarayat[+sura_select.value][+aaya_select.value - 1]
      if (w === Q.words[p-1].length) { ++p; w = 0 }
      page_select.value = p
      update_lines()
      line_select.value = 1 + bisect(Q.lineends[p-1], w)
    }
    else {
      page_select.value = page_of( Q.sura_offset[+sura_select.value] + +aaya_select.value )
      update_lines()
      line_select.value = 1  // TODO
    }
  }

  page_word_to_sura_aaya = (p, w) => {
    if (p === 187 && w <= 1) { return [9,1] }  // At-Tawba - the only sura not starting with a basmala
    if (Q.basmalaat[p-1].includes(w) || Q.headers[p-1].includes(w)) { return [1,1] }  // the basmala, for audio
    const y = Q.page_offset[p-1] + bisect(Q.ayat[p-1], w)
    const s = sura_of(y + 1)  // 1-based sura
    const a = y - Q.sura_offset[s-1] + 1
    return [s, a]
  }

  const update_sura_aaya_from_aaya_offset = (y) => {
    const s = sura_of(y + 1)  // 1-based sura
    sura_select.value = s - 1
    update_aayat()
    const a = y - Q.sura_offset[s-1]
    aaya_select.value = a + 1
    // aaya_select.value = Math.min(Q.sura_length[s-1], a + 1)
  }

  const page_word_offset_to_sura_aaya = (p, w) => {
    const a = bisect(Q.ayat[p-1], w)
    update_sura_aaya_from_aaya_offset( Q.page_offset[p-1] + a )
  }

  const sync_sura_aaya = () => {  // with page-line
    const p = +page_select.value      // 1-based page
    const l = +line_select.value - 1  // 0-based line, and -1 means full page (b/c it's numerified from the empty string, before the subtracting one)
    if (l === 0 || !Q.lineends) {  // first line, or the metadata in json hasn't loaded yet
      update_sura_aaya_from_aaya_offset( Q.page_offset[p-1] )
    }
    else if (l === -1 /* full page */) {
      update_sura_aaya_from_aaya_offset( Q.page_offset[p] - 1 )
      // ^ start of the next page, minus one to get the last word in the previous page
    }
    else if (Q.ayat && Q.lineends) {  // if loaded
      // convert the (start of) line to the nearest (start of) aya at or before it.
      const w = Q.lineends[p-1][l-1]+1
      page_word_offset_to_sura_aaya(p, w)
    }
  }

  true_sync_selectors = (p, w) => {  // called when showing the help after all the json data is loaded
    page_word_offset_to_sura_aaya(p, w)
    //
    page_select.value = p
    update_lines()
    line_select.value = bisect(Q.lineends[p-1], w) + 1  // start of the nearest line at or before current word
  }

  //

  sura_select.innerHTML = Q.sura_name.map((t, i) => `<option value="${i}">${t}</option>`).join("")
  sura_select.oninput = () => { update_aayat(); sync_page_line() }
  aaya_select.oninput = () => { sync_page_line() }

  page_select.innerHTML = num_opts(604)
  page_select.oninput = () => { update_lines(); sync_sura_aaya() }
  line_select.oninput = () => { sync_sura_aaya() }

  sura_aaya_go.onclick = async () => {
    hide_help(false)  // don't focus input, because it'll be changed
    await data_loaded
    // const aya = Q.sura_offset[+sura_select.value] + +aaya_select.value
    // const p = page_of(aya)
    let [p, w] = Q.suarayat[+sura_select.value][+aaya_select.value - 1]
    if (w === Q.words[p-1].length) { p += 1; w = 0 }
    Movado.go_to(p,w)
  }

  page_line_go.onclick = async () => {
    hide_help(false)  // don't focus input, because it'll be changed
    await data_loaded
    const p = +page_select.value
    const a = Q.page_offset[p-1]
    const w
      = line_select.value === "" ? null  // full page
      : +line_select.value === 1 ? 0
        : Q.lineends[p-1][+line_select.value-2] + 1
    Movado.go_to(p,w)
  }

  Movado.preinit()
})

////////////////////////////////////////////////////////////////////////////////
// main events & logic {{{1

let since_last_bang = performance.now()

const txt_onkeydown = (ev) => {  // filter & emulation & hint & cheating
  if (ev.altKey || ev.ctrlKey) { return }
  else if (ev.key === '#') {
    ev.preventDefault()
    show_hint(screen_dark, correct_word())
  }
  else if (ev.key === 'Enter') {
    ev.preventDefault()
    hide_hint()  // if shown
    insert_in_field(txt, " ")
    txt.oninput()
  }
  else if (ev.key === '!') {  // cheat one character
    ev.preventDefault()
    const now = performance.now()
    if (now - since_last_bang < 250) { return }
    if (correct_word().slice(0, txt.value.length) === txt.value) {  // not wrong so far
      if (correct_word().length === txt.value.length) {
        txt.style.background = TxtBgDone[+screen_dark]
      }
      else {
        txt.value = correct_word().slice(0, txt.value.length+1)  // add one correct letter
        txt.oninput()
      }
    }
    since_last_bang = now
  }
  else if (ev.key.length === 1) {
    ev.preventDefault()
    hide_hint()  // if shown
    const k = intended_key(ev)
    if (k != null) {
      insert_in_field(txt, k)
      txt.oninput()
    }
  }
  // else console.log(ev)
}

const txt_oninput = () => on_insert(screen_dark, correct_word(), Movado.forward)

////////////////////////////////////////////////////////////////////////////////

const next_full  = () => Movado.full_page(screen_double ? p + 2 + p%2 : p+1)
const next_empty = () =>  Movado.new_page(screen_double ? p + 1 + p%2 : p+1)
const prev_full  = () => Movado.full_page(screen_double ? p - 2 + p%2 : p-1)
const prev_empty = () =>  Movado.new_page(screen_double ? p - 3 + p%2 : p-1)

// End key:   full right page →  full  left page
// Home key: empty  left page → empty right page
const page_end = () => {
  // right page can never be full if double
  if (w === Q.words[p-1].length) { return }
  right_in_double(p)
    ? Movado.new_page(p+1)
    : Movado.full_page(p)
}
const page_home = () => {
  !is_page_almost_empty(p,w)
    ? Movado.new_page(p)
    : left_in_double(p)
      && Movado.new_page(p-1)
}

const cycle_full_page = () => {
  if (screen_double) {
    // move to the next state of [emptyright, fullright-emptyleft, fullleft]
    if (p % 2) {  // in the right page (it's guaranteed that the right page is not full)
      Movado.new_page(p+1)
    }
    else if (w === Q.words[p-1].length) {  // we are at the end of left page, start again at the right one
      Movado.new_page(p-1)
    }
    else {  // we are somewhere in the left page but not at its end
      Movado.full_page(p)
    }
  }
  else {  // showing only a single page
    // if full, make it empty, otherwise make it full
    w === Q.words[p-1].length
      ? Movado.new_page(p)
      : Movado.full_page(p)
  }
}

let last_onescape_call = null
const on_escape = () => {
  const now = performance.now()
  const skip = last_onescape_call != null && now - last_onescape_call < 150
  last_onescape_call = now
  if (skip) { return }
  // throttling is needed, otherwise a single Escape can easily toggle the help twice
  helping ? hide_help() :
  insert ? to_normal() :
    show_help()
}

const toggle_help = () => helping ? hide_help() : show_help()

const window_onkeyup = Movado.keyup

const window_onkeydown = (ev) => {
  // Note: ev.code is for the physical key, thus ev.code === 'Minus' and ev.code === 'Equal'
  //   are for the two keys immediately to the left of Backspace; ie, Dvorak '[' and ']'.
  //
  if (ev.altKey || ev.ctrlKey && ev.key !== 'Home' && ev.key !== 'End' && ev.key !== ' ') { return }
  // ^ don't handle if alt or ctrl is pressed, unless it's ctrl with Home or End or Space
  else if (ev.key === 'Escape') { ev.preventDefault(); on_escape() }
  else if (ev.key === 'F1')     { ev.preventDefault(); toggle_help() }
  else if (ev.key === 'F8')     { ev.preventDefault(); cycle_full_page() }
  else if (ev.key === '*')      { ev.preventDefault(); toggle_dark() }
  else if (ev.ctrlKey && ev.key === ' ') { ev.preventDefault(); if (audio.can()) { player.play() } }
  else if (ev.target.id === 'txt' || !txt.hidden && !txt.disabled) {
    if (loading || helping) { return }
    else if (ev.code === 'Equal') { ev.preventDefault(); Movado.backward(ev.shiftKey) }
    else if (ev.code === 'Minus') { ev.preventDefault(); Movado.forward(ev.shiftKey) }
    else if (ev.ctrlKey && ev.key === 'Home') { ev.preventDefault(); page_home() }
    else if (ev.ctrlKey && ev.key === 'End')  { ev.preventDefault(); page_end()  }
    else if (ev.key === 'Tab') { ev.preventDefault(); show_help() }
    else if (ev.key === 'PageDown')  { ev.preventDefault(); ev.shiftKey ? next_full() : next_empty() }
    else if (ev.key === 'PageUp')    { ev.preventDefault(); ev.shiftKey ? prev_full() : prev_empty() }
    return  // don't handle anything else if in insert mode
  }
  //
  else if (!helping && ev.key === 'Tab') { ev.preventDefault(); show_help() }
  else if (helping && ev.key === 'Enter') {  // next element in the go-to selectors (not the options)
    if      (ev.target === sura_select) { ev.preventDefault();  aaya_select.focus() }
    else if (ev.target === aaya_select) { ev.preventDefault(); sura_aaya_go.focus() }
    else if (ev.target === page_select) { ev.preventDefault();  line_select.focus() }
    else if (ev.target === line_select) { ev.preventDefault(); page_line_go.focus() }
  }
  else if (helping && ev.key === 'Backspace') {  // previous element in the go-to selectors (not the options)
    if      (ev.target === page_line_go) { ev.preventDefault(); line_select.focus() }
    else if (ev.target ===  line_select) { ev.preventDefault(); page_select.focus() }
    else if (ev.target === sura_aaya_go) { ev.preventDefault(); aaya_select.focus() }
    else if (ev.target ===  aaya_select) { ev.preventDefault(); sura_select.focus() }
    // Backspacing across rows (ie, from page_select to sura_aaya_go) is intentionally not allowed,
    // because it lacks the Enter counterpart ('Enter' on sura_aaya_go going to the next row, ie, to page_select).
  }
  else if (helping && ev.target.tagName === 'SELECT') {
    if (ev.key === 'ArrowLeft') {  // select next
      ev.preventDefault()
      if (ev.target.selectedIndex < ev.target.options.length-1) {
        ++ev.target.selectedIndex
        ev.target.oninput()
      }
    }
    else if (ev.key === 'ArrowRight') {  // select previous
      ev.preventDefault()
      if (ev.target.selectedIndex > 0) {
        --ev.target.selectedIndex
        ev.target.oninput()
      }
    }
  }
  else if (helping) { return }  // don't handle anything else if showing help
  //
  else if (ev.key === 'PageDown')  { ev.preventDefault(); ev.shiftKey ? next_full() : next_empty() }
  else if (ev.key === 'PageUp')    { ev.preventDefault(); ev.shiftKey ? prev_full() : prev_empty() }
  else if (loading) { return }  // don't handle anything else if still loading the current page
  //
  else if (ev.key === 'Enter') { ev.preventDefault(); w === Q.words[p-1].length && next_empty(); to_insert() }
  // next_word: space or enter at full-page in Insert Mode, and either one or arrowleft or dvorak '[' at any word in Normal Mode
  // prev_word: backspace at full-page in Insert Mode, and it or arrowright or dvorak ']' at any word in Normal Mode
  else if (ev.key === " "         || ev.key === 'ArrowLeft'  || ev.code === 'Minus') {
    ev.preventDefault(); Movado.forward(ev.shiftKey)
  }
  else if (ev.key === 'Backspace' || ev.key === 'ArrowRight' || ev.code === 'Equal') {
    ev.preventDefault(); Movado.backward(ev.shiftKey)
  }
  //
  else if (ev.key === 'ArrowDown') { ev.preventDefault(); Movado.forward(true)  }  // by phrase
  else if (ev.key === 'ArrowUp')   { ev.preventDefault(); Movado.backward(true) }  // by phrase
  else if (ev.key === 'Home')      { ev.preventDefault(); page_home() }
  else if (ev.key === 'End')       { ev.preventDefault(); page_end()  }
}

// vim: set foldmethod=marker foldmarker={{{,}}} :
