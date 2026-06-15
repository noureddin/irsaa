// everything that doesn't rely on global variables
////////////////////////////////////////////////////////////////////////////////
// basic language utils {{{1

const say = (...a) => console.log(...a)

const assert = (cond, msg) => { if (!cond) { throw msg } } // console.assert() is console.error() not console.trace()

const average = (...arr) => {
   let sum = 0
   for (let i = 0; i < arr.length; ++i) { sum += arr[i] }
   return sum/arr.length
}

const bisect = (arr, val, len) => {
  // https://stackoverflow.com/a/73179119
  let L = 0; let H = len ? len : arr.length-1
  while (L < H) {
    const M = (L + H) >>> 1  // arithmetic mean and truncate the fraction
    if (arr[M] < val) { L = M + 1 } else { H = M }
  }
  return L
}

const range = (i) => [...Array(i).keys()]

////////////////////////////////////////////////////////////////////////////////
// other utils {{{1

// for drawing
const fixpage = (p) => (p - 1 + 604) % 604 + 1  // wrap around 604 in either direction, but keep it 1-based

// for selectors
const num_opts = (len) => Array(len).fill(null).map((_,a) => `<option value="${a+1}">${a+1}</option>`).join("")

////////////////////////////////////////////////////////////////////////////////
// constants {{{1

const [W, H] = [776, 1053]

const QuranPagesRootRel = '../quran-pages/2/'
const QuranPagesRootAbs = 'https://www.noureddin.dev/quran-pages/2/'

// color constants (light & dark)
const WordsColor  = ['#FFF',    '#000']
const MarginColor = ['#FFFDD8', '#272500']
const TxtBgNormal = ['none',    'none']
const TxtBgWrong  = ['#fbb8',   '#6008']
const TxtBgDone   = ['#3d38',   '#0807']  // needed only for bang-cheating
const TxtFg       = ['#111',    '#eee']

////////////////////////////////////////////////////////////////////////////////
// client & connection constants {{{1

// // for debugging
// const local_host = !location.protocol.match(/^https?:$/)  /* if file:// (or anything else for that matter) */
//   || location.hostname.match(/^0\.|^127\.|^192\.|^localhost$/i)

const url_params = (location.search + location.hash.replace(/%23/g,'#')).split(/[?&#]/)

// trilogical: true = wanted, false = unwanted (the opposite is wanted), null/undef = no pref
// gets the last one of the all given keys, and returns true if it's in the first group, false if it's in the second, undef otherwise
const get_url_pref = (qw_yes, qw_no) => {
  const s = new Set([...qw_yes.split(' '), ...qw_no.split(' ')])
  const pp = url_params.filter(e => s.has(e))
  if (pp.length === 0) { return }  // no pref
  return qw_yes.includes(pp[pp.length-1])  // true if the last element is in qw_yes, false otherwise
}

const nostats = get_url_pref('nostats', 'stats')
const nohelp = get_url_pref('nohelp', 'help')
const wantdark = get_url_pref('d dark', 'l light')  // this line is removed if darkmode is disabled -- don't change this comment
const wantnormal = get_url_pref('n normal', 'i insert')
// todo: a pref to not show help

// const nostats = location.search.split(/[?&]/).includes('nostats')

const mobile = navigator.userAgent.includes('Mobile')

const get_param = (key) => {  // key must end with an equal sign
  const u = url_params.filter(e => e.startsWith(key))
  return u.length ? u[u.length-1].slice(key.length) : null
}

const wantqari = get_param('qari=')
const wantqs = get_param('qs=')
const wantqp = get_param('qp=')

// const get_param = (key, def) => {
//   // const rx = new RegExp('^\\Q' + key + '\\E(?:$|=)')  // doesn't work?
//   const rx = new RegExp('^' + key.replace(/[.\[\](){}^+*?-]/g, '\\$&') + '(?:$|=)')
//   const m = url_params.filter(p => p.match(rx))
//   if (m.length == 0) { return def }
//   return m[m.length-1].replace(/.*?=/, "")  // that means: /?x returns 'x'; /?x=1 returns '1'; /?x= return ""
// }

const hash_get_pw = () => {
  const [p,w] = url_params.reverse().reduce((acc, elem, idx) => acc ? acc : elem.match(/^[0-9]+(?:\/[0-9]+)?$/) ? elem.split('/') : null, null) || []
  if ( !isNaN(p) && p >= 1 && p <= 604
    && (w == null || !isNaN(w) && w >= 0)
  ) {
    return [+p, w == null ? 0 : +w]
    // w == null to allow #1 (meaning #1/0); as #1/ is treated as #1/0
  }
}

const hash_set_pw = (p,w) => { history.replaceState(null, null, '#'+p+'/'+w) }

////////////////////////////////////////////////////////////////////////////////
// DOM methods {{{1

const Qid = (id) => document.getElementById(id)

const width_of = (sel) => parseFloat(getComputedStyle(document.querySelector(sel)).width)

const make_element = (tag, opts, children) => {
  const el = document.createElement(tag)
  for (let k in opts) {
    if (k === 'innerHTML')
      el.innerHTML = opts[k]
    else if (typeof opts[k] == 'object')
      for (let kk in opts[k])
        el[k][kk] = opts[k][kk]
    else el[k] = opts[k]
  }
  if (children) { el.append(...children) }
  return el
}

const make_option = (val, txt) => {
  const el = document.createElement('option')
  el.value = val
  el.innerText = txt
  return el
}

////////////////////////////////////////////////////////////////////////////////
// DOM constants {{{1

// essential elements
const txt = Qid('t')
const container = Qid('n')
const help = Qid('h')

// audio-related
const player = Qid('player')
const preloader = Qid('preloader')
const qp = Qid('qp')  // position option
const qs = Qid('qs') // playing style

// osk
const kk = Qid('kk')
const [ kk_up, kk_dn, kk_lf, kk_rt, kk_rs, kk_ed, kk_mv, kk_pv, kk_nx ] = document.querySelectorAll('#kk g')
const [ rkk, lkk ] = document.querySelectorAll('#kk svg')

// shorthands (enable more minification (tested))
const body = document.body

// selectors
const sura_select = Qid('s')
const aaya_select = Qid('a')
const page_select = Qid('p')
const line_select = Qid('l')
const double_select = Qid('d')
const fitscreen_select = Qid('f')
const upper_scrollshadow = Qid('hs')
const lower_scrollshadow = Qid('ls')
const helpscroll = document.querySelector('#h>.scr')
const pagescroll = document.querySelector('body>.scr')
const [sura_aaya_go, page_line_go] = document.querySelectorAll('button.go')

// others
// the min width & height at which we choose double-page & fit-screen if no pref
const sW = 1150
const sH = 800
// const wide_screen = matchMedia('(width>=1150px) and (height>=800px)')

// font-sizes involve 1vmin, thus require updating on resize
let REM, HELPMIN, KK_EM, KK_U
const update_rem = () => {
  KK_U = 4  // the #kk --U variable in ems; because it will be user-configurable
  KK_EM = parseFloat(getComputedStyle(kk).fontSize)
  REM = parseFloat(getComputedStyle(document.documentElement).fontSize)
  HELPMIN = 46*REM
}
update_rem()

////////////////////////////////////////////////////////////////////////////////
// canvases and their consant (never-changing) initializations {{{1

// main canvas
const canvas = Qid('canvas')
const ctx = canvas.getContext('2d', { alpha: false })
canvas.height = H

// offscreen canvas 1:
// always a single page, for drawing pages
const offcanvas = document.createElement('canvas')
const offctx = offcanvas.getContext('2d')
offcanvas.width  = W
offcanvas.height = H

// // offscreen canvas 2:
// // follows screen canvas dimensions, for animatating flipping pages
// const off2canvas = document.createElement('canvas')
// const off2ctx = offcanvas.getContext('2d')
// off2canvas.height = H

////////////////////////////////////////////////////////////////////////////////
// canvas globals-free methods {{{1

const rect = (con, x, y, width, height, clr='hotpink', th=2) => {  // mostly just for debugging
  con.lineWidth = th
  con.strokeStyle = clr
  con.strokeRect(x, y, width, height)
}

const hline = (con, x0, xf, y, clr, th) => {
  if (th) { con.lineWidth = th }
  if (clr) { con.strokeStyle = clr }
  con.beginPath()
  con.moveTo(x0, y)
  con.lineTo(xf, y)
  con.stroke()
}

const vline = (con, x, y0, yf, clr, th) => {
  if (th) { con.lineWidth = th }
  if (clr) { con.strokeStyle = clr }
  con.beginPath()
  con.moveTo(x, y0)
  con.lineTo(x, yf)
  con.stroke()
}

const dbg_hline = (y) => hline(ctx, 0, screen_double ? 2*W : W, y, 'hotpink', 2)
const dbg_vline = (x) => vline(ctx, x, 0, H, 'hotpink', 2)

////////////////////////////////////////////////////////////////////////////////
// emptypage singleton {{{1
// maintains its internal cache, but doesn't rely on or modify anything global.

const emptypage = (() => {

  const make_emptypage = (bg, fg, msg) => {
    const can = document.createElement('canvas')
    const con = can.getContext('2d')
    can.width  = W
    can.height = H
    con.fillStyle = bg
    con.fillRect(0, 0, W, H)
    con.textAlign = 'center'
    con.direction = 'rtl'
    con.font = '48px Noto Sans Arabic,sans-serif'
    con.fillStyle = fg
    con.fillText(msg, Math.round(W/2), Math.round(H*0.4))
    // ^ slightly above the midpoint, to accomodate scrolling view
    return can
  }

  const cache = {}

  const get = (Dark, k, msg) => {
    // assert(Dark != null, 'emptypage called with undefined')
    k = (Dark ? 'd' : "") + k  // this line is removed if darkmode is disabled -- don't change this comment
    if (cache[k]) { return cache[k] }
    const bg = MarginColor[+Dark]
    const fg = TxtFg[+Dark]
    cache[k] = make_emptypage(bg, fg, msg)
    return cache[k]
  }

  return {
    pageloading: (Dark) => get(Dark, 'pl', 'يحمّل الصفحة…'),
    dataloading: (Dark) => get(Dark, 'dl', 'يحمّل البيانات…'),
    pagefailed:  (Dark) => get(Dark, 'pf', 'تعذّر تحميل الصفحة'),
    datafailed:  (Dark) => get(Dark, 'df', 'تعذّر تحميل البيانات'),
  }

})()

////////////////////////////////////////////////////////////////////////////////
// local storage methods {{{1

const load_char = (k,d) => k in localStorage ?   localStorage.getItem(k) : d
const load_num  = (k,d) => k in localStorage ?  +localStorage.getItem(k) : d
const load_flag = (k,d) => k in localStorage ? !!localStorage.getItem(k) : d
const load_boolean_default_false = (k) => !!localStorage.getItem(k)
const store_char = (k,d) => localStorage.setItem(k, v)
const store_num  = (k,v) => localStorage.setItem(k, v)
const store_flag = (k,v) => localStorage.setItem(k, v ? 'Y' : "")
const store_if_notdefault = (k,v,d) => v === d ? localStorage.removeItem(k) : localStorage.setItem(k,v)
const store_boolean_default_false = (k,v) => v ? localStorage.setItem(k,'Y') : localStorage.removeItem(k)

// folds and their local storage methods {{{1

const foldelements = document.querySelectorAll('details')
const foldnames = '_qa _eg _ep _ov _om _ok'.split(' ')
// - qa = qaris: audio recitations
// - eg = explanation, general
// - ep = explanation, pages
// - ov = options, view
// - om = options, mouse & touch
// - ok = options, on-screen keyboard
// they are named not numbered to maintain their state when they are re-ordered or new ones are added.
// the last one (the changelog) is not remembered as it's always closed by default.

// console.assert(foldelements.length-1 === foldnames.length, 'bad folds', foldelements, foldnames)

const load_folds = () => {
  for (let i = 0; i < foldnames.length; ++i) {
    foldelements[i].open = load_boolean_default_false(foldnames[i])
  }
}

const store_folds = () => {
  for (let i = 0; i < foldnames.length; ++i) {
    store_boolean_default_false(foldnames[i], foldelements[i].open)
  }
}

////////////////////////////////////////////////////////////////////////////////
// txt-related methods {{{1
// they rely on the #txt element, but no other global.

const fade = (() => {
  let int
  const init = (Dark) => Dark ? [ 192, 0, -1, 20 ] : [ 128, 0xff, 1, 30 ]  // bgn, end, step, dur
  const stop = () => { clearInterval(int); int = null }
  const byte2grayhex = (i) => '#' + i.toString(16).padStart(2,'0').repeat(3)  // convert 0-255 to #00000-#ffffff
  //
  return {
    stop: () => { if (int) { stop() } },
    run: (txt, Dark) => {
      const [bgn, end, step, dur] = init(Dark)
      let i
      txt.style.setProperty('--i', byte2grayhex(i=bgn))
      const ifade = () => {
        txt.style.setProperty('--i', byte2grayhex(i+=step))
        if (i === end) {
          stop()
          txt.placeholder = ""
        }
      }
      int = setInterval(ifade, dur)
    },
  }
})()

const show_hint = (Dark, hint) => {
  fade.stop()  // if running
  txt.placeholder = hint
  fade.run(txt, Dark)
}

const hide_hint = () => {
  fade.stop()  // if running
  txt.placeholder = ""
}

const on_insert = (Dark, correct_word, move_forward) => {
  const val = txt.value = txt.value
    .replace(/[^ء-غف-ي ]+/g, "")  // remove invalid chars (can happen with pasting)
    .replace(/^ +/, "")   // trim leading spaces
    .replace(/ +$/, " ")  // collapse trailing spaces
  //
  if (val.endsWith(" ") && correct_word === val.replace(/ $/, "")) {  // completed the correct word
    txt.style.background = TxtBgNormal[+Dark]
    txt.value = ""
    move_forward()  // async (in bg)
  }
  else if (correct_word.slice(0, val.length) === val) {  // not wrong so far
    txt.style.background = TxtBgNormal[+Dark]
  }
  else {
    txt.style.background = TxtBgWrong[+Dark]
  }
  txt.resize()
}

////////////////////////////////////////////////////////////////////////////////
// page formats {{{1
// maintains its internal state, but doesn't rely on anything external.

const PageFormat = (() => {

  const QuranPagesFormatsLight = [
     {ext:'.avif', dir:QuranPagesRootRel+'pages/776x1053-avif/'},
     {ext:'.avif', dir:QuranPagesRootAbs+'pages/776x1053-avif/'},
     {ext:'.webp', dir:QuranPagesRootRel+'pages/776x1053-webp/'},
     {ext:'.webp', dir:QuranPagesRootAbs+'pages/776x1053-webp/'},
     {ext:'.jpg', dir:'https://www.islamicbook.ws/2/', first:QuranPagesRootRel+'pages/776x1053-jpg/'},
     {ext:'.jpg', dir:'https://www.islamicbook.ws/2/', first:QuranPagesRootAbs+'pages/776x1053-jpg/'},
  ]
  let light_fmt_idx = 0
  // Note: urls end in slash, and the extension starts with a dot.
  //   "first" is for the first two pages only

  const QuranPagesFormatsDark = [
     {ext:'.jpg', dir:'dark/'},
  ]
  let dark_fmt_idx = 0

  // if all formats fail, we restart because maybe there is a connection issue
  //   that may be solved later without reloading the page.
  const reset_format = (Dark) => {
    if (Dark)
      dark_fmt_idx = 0
    else
      light_fmt_idx = 0
  }

  const next_format = (Dark) => {
     if (Dark)
        if (dark_fmt_idx >= QuranPagesFormatsDark.length-1) { return false }
        else { ++dark_fmt_idx; return true }
     else
        if (light_fmt_idx >= QuranPagesFormatsLight.length-1) { return false }
        else { ++light_fmt_idx; return true }
  }

  const image_src = (Dark, p) => {
     // if (isNaN(p) || !Number.isInteger(p) || p < 1 || p > 606) {
     //   throw `Invalid page number: expected a number between 1 and 606 inclusive (605 & 606 for the empty pages); got '${p}'`
     // }
     const f = Dark ? QuranPagesFormatsDark[dark_fmt_idx] : QuranPagesFormatsLight[light_fmt_idx]
     const dir = p < 3 && f.first ? f.first : f.dir
     return dir + p + f.ext
  }

  return {
    next: next_format,
    reset: reset_format,
    url: image_src,
  }
})()

////////////////////////////////////////////////////////////////////////////////
// getting pages {{{1
// relies on PageFormat, connects to the network (to fetch the pages' images),
//   and maintains its internal state, but nothing else.

const Pages = (() => {

  // caching all the page (1 through 604)
  // const imgs = Array(604).fill(null).map(_ => new Image())
  const imgs = new Map()
  const imgloaded = new Set()  // because we can't query the state of native JS promises
  const img_onloads = new Map()  // arrays of callbacks to call when loaded

  const img_cache = new Set()  // LRU cache of the last 80 images. -- see touch_page() for details.

  const touch_page = (k) => {
    // console.log('touching', k)
    // console.assert(imgs.has(k), `touching a non-existent page ${k}`)
    img_cache.delete(k)  // doesn't fail if not in the set
    img_cache.add(k)
    // Iterating over Set() and Map() uses the insertion order.
    // We "touch" the image by re-inserting it.
    // It must be deleted first, because otherwise it would keep its orginal order.
    while (img_cache.size > 80) {
      // Remove images older than the 80 most recently requested (~25MB at worse (JPEG)).
      // touch_page() is called from our only two entry points to get a page:
      //   request_page() and __get_page() (and therefore its promisification get_page()).
      const kk = img_cache.values().next().value
      // console.log('uncaching page', kk)
      // console.assert(imgs.has(kk), `uncaching a non-existent page ${kk}`)
      // console.assert(imgloaded.has(kk), `uncaching a non-loaded page ${kk}`)
      // console.assert(!img_onloads.has(kk), `uncaching a still-loading page ${kk}`)
      // // ^ This can legitimately occur when flipping pages too fast.
      img_cache.delete(kk)
      imgloaded.delete(kk)
      imgs.delete(kk)
    }
    // console.log('cache size', img_cache.size, imgloaded.size, imgs.size, img_onloads.size)
  }

  // Return the image if cached, otherwise return null and request it for a future get_page().
  const request_page = (Dark, p) => {
    const k = p + (Dark ? 'd' : "")
    if (imgloaded.has(k)) { touch_page(k); return imgs.get(k) }
    else { __get_page(Dark, p); return null }
  }

  const __get_page = (Dark, p, callback) => {
    const k = p + (Dark ? 'd' : "")
    if (imgs.has(k) && imgs.get(k).src) {
      if (callback) {
        imgloaded.has(k) ? callback(imgs.get(k)) : img_onloads.get(k).push(callback)
      }
      return imgs.get(k)
    }
    //
    const im = new Image()
    img_onloads.set(k, callback ? [callback] : [])
    imgs.set(k, im)
    touch_page(k)
    //
    im.onerror = () => {
      if (PageFormat.next(Dark)) { im.src = PageFormat.url(Dark, p) }
      else {  // couldn't load at all
        for (let fn of img_onloads.get(k)) { fn("") }
        img_onloads.delete(k)
        imgs.delete(k)
        im.onload = null
        im.onerror = null
        im.removeAttribute('src')
        PageFormat.reset(Dark)
        // reset format & didn't set imgloaded because it might load later
      }
    }
    im.onload = () => {
      imgloaded.add(k)
      for (let fn of img_onloads.get(k)) { fn(im) }
      img_onloads.delete(k)
      im.onload = null
      im.onerror = null
    }
    im.src = PageFormat.url(Dark, p)
    return im
  }

  const get_page = (Dark, p) => {
    return new Promise((resolve, reject) => {
      __get_page(Dark, p, (page) => resolve(page))
    })
  }

  return {
    fetch: get_page,  // returns a promise
    get: __get_page,  // uses an optional callback
    has: request_page,  // returns it if cached, otherwise returns null and requests it for a future get/fetch
  }
})()

////////////////////////////////////////////////////////////////////////////////
// DOM-manipulation {{{1
// methods that manipulate certain document elements

const help_onresize = () => {
  const viewportWidth = window.innerWidth
  const helpwidth = Math.min(HELPMIN, 0.95*viewportWidth)
  help.style.width = helpwidth+'px'
  help.style.right = (viewportWidth - helpwidth) / 2 + 'px'
  // that can be done in CSS only, but min() is still relatively new (Baseline Jul 2020).
}
help_onresize()

// the container (the muṣħaf pages)'s width <= the screen's width.
// the container's height can be < or == or > the screen's height.

let resize_screen = () => {}

const resize_fit_screen = (w) => {
  body.classList.add('F')
  const r = w/H
  resize_screen = () => {
    const WW = window.innerWidth
    const HH = window.innerHeight
    let ww,hh
    if (WW < r*HH) {
      ww = 0.98*WW
      hh = ww/r
    }
    else {
      hh = 0.98*HH
      ww = r*hh
    }
    container.style.width = ww+'px'
    container.style.height = hh+'px'
    body.style.setProperty('--b', (HH-hh)+'px')
  }
  resize_screen()
}

const resize_scroll_y = (w) => {
  body.classList.remove('F')
  resize_screen = () => {
    const WW = window.innerWidth
    const HH = window.innerHeight
    const ww = 0.98*WW
    const hh = H/w * ww
    container.style.width = ww+'px'
    container.style.height = hh+'px'
    body.style.setProperty('--b', (HH-hh)+'px')
  }
  resize_screen()
}

const canvas_wh = () => {
  const sty = getComputedStyle(canvas)
  return [ parseFloat(sty.width), parseFloat(sty.height) ]
}

const select_fit = (fit, double) => {
  // fit: null (auto), true (force fit_screen), false (force scroll_y)
  const w = double ? 2*W : W
  // choose fit_screen in three cases:
  // - fit === true (ie, the user asked for fit_screen)
  // - auto fit/scroll, and doublepage
  // - auto fit/scroll, and singlepage, and window height >= sH (see its comment)
  fit || fit == null && (double || window.innerHeight >= sH)
    ? resize_fit_screen(w) : resize_scroll_y(w)
}

const update_scrollshadows = () => {
  upper_scrollshadow.style.opacity =
    helpscroll.scrollTop === 0
      ? '0' : '1'
  lower_scrollshadow.style.opacity =
    Math.round(helpscroll.scrollTop + helpscroll.clientHeight + 1) >= Math.round(helpscroll.scrollHeight)
      ? '0' : '1'  // ^ this +1 is needed for Blink ¯\_(ツ)_/¯
}

////////////////////////////////////////////////////////////////////////////////

const scroll_debuglines = async (top, bottom) => {
  // debuglines
  helping = true  // to not call scroll_into_view again (inifite recursion)
  await update_page(screen_dark, p, w)
  helping = false
  hline(ctx, 0, W, top/pagescroll.scrollHeight*H, 'hotpink')
  hline(ctx, 0, W, bottom/pagescroll.scrollHeight*H, 'limegreen')
}

const scroll_into_view = (top, bottom) => {  // if needed
  if (pagescroll.scrollHeight <= pagescroll.clientHeight) { return }
  // Note: only checks top & height; we don't make horizontal scrolling possible
  const Top = pagescroll.scrollTop
  const Bottom = pagescroll.scrollTop + pagescroll.clientHeight
  const margin = bottom - top  // have a scroll margin of a complete line
  // scroll_debuglines(top, bottom)
  if (!( bottom <= Bottom - margin && top >= Top + margin )) {
    // console.log(Bottom, Math.round(bottom), " ", Top, Math.round(top))
    pagescroll.scrollTo({ top: top + (bottom-top)/2 - pagescroll.clientHeight/2, behavior: 'smooth' })
  }
  // otherwise it's fully inside, thus no scrolling is needed
}

const focus_input = () => {
  let { top, height } = getComputedStyle(txt)
  top = parseFloat(top)
  scroll_into_view(top, top + parseFloat(height))
  txt.focus({ preventScroll: true })
}

////////////////////////////////////////////////////////////////////////////////
// vim: set foldmethod=marker foldmarker={{{,}}} :
