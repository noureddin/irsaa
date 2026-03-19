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
const num_opts = (len) => Array(len).fill(null).map((_,a) => `<option value="${a+1}">${a+1}</option>`).join('')

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

// const url_params = (location.search + location.hash).split(/[?&#]/)
const nostats = location.search.split(/[?&]/).includes('nostats')

// const get_param = (key, def) => {
//   // const rx = new RegExp('^\\Q' + key + '\\E(?:$|=)')  // doesn't work?
//   const rx = new RegExp('^' + key.replace(/[.\[\](){}^+*?-]/g, '\\$&') + '(?:$|=)')
//   const m = url_params.filter(p => p.match(rx))
//   if (m.length == 0) { return def }
//   return m[m.length-1].replace(/.*?=/, "")  // that means: /?x returns 'x'; /?x=1 returns '1'; /?x= return ""
// }

const hash_get_pw = () => {
  const [p,w] = location.hash.slice(1).split('/')
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

////////////////////////////////////////////////////////////////////////////////
// DOM constants {{{1

// essential elements
const txt = Qid('t')
const container = Qid('n')
const help = Qid('h')

// shorthands (enable more minification (tested))
const body = document.body

// selectors
const sura_select = Qid('s')
const aaya_select = Qid('a')
const page_select = Qid('p')
const line_select = Qid('l')
const double_select = Qid('d')
const fitscreen_select = Qid('f')
const sens_wheel = Qid('s-w')
const sens_swipe = Qid('s-s')
const upper_scrollshadow = Qid('hs')
const lower_scrollshadow = Qid('ls')
const helpscroll = document.querySelector('#h>.scr')
const pagescroll = document.querySelector('body>.scr')
const [sura_aaya_go, page_line_go] = document.querySelectorAll('button.go')

// others
const wide_screen = matchMedia('(width>=1150px) and (height>=800px)')

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

  const get = (dark, k, msg) => {
    // assert(dark != null, 'emptypage called with undefined')
    k = (dark ? 'd' : 'l') + k
    if (cache[k]) { return cache[k] }
    const bg = MarginColor[+dark]
    const fg = TxtFg[+dark]
    cache[k] = make_emptypage(bg, fg, msg)
    return cache[k]
  }

  return {
    pageloading: (dark) => get(dark, 'pl', 'يحمّل الصفحة…'),
    dataloading: (dark) => get(dark, 'dl', 'يحمّل البيانات…'),
    pagefailed:  (dark) => get(dark, 'pf', 'تعذّر تحميل الصفحة'),
    datafailed:  (dark) => get(dark, 'df', 'تعذّر تحميل البيانات'),
  }

})()

////////////////////////////////////////////////////////////////////////////////
// local storage methods {{{1

const load_num  = (k,d) => k in localStorage ?  +localStorage.getItem(k) : d
const load_flag = (k,d) => k in localStorage ? !!localStorage.getItem(k) : d
const store_num  = (k,v) => localStorage.setItem(k, v)
const store_flag = (k,v) => localStorage.setItem(k, v ? 'Y' : "")

////////////////////////////////////////////////////////////////////////////////
// keyboard mappings {{{1

const mappings = {  // without "invalid" characters
  ibm: {
    Backquote: ['ذ'],
    KeyQ: ['ض'],
    KeyW: ['ص'],
    KeyE: ['ث'],
    KeyR: ['ق'],
    KeyT: ['ف', 'لإ'],
    KeyY: ['غ', 'إ'],
    KeyU: ['ع'],
    KeyI: ['ه'],
    KeyO: ['خ'],
    KeyP: ['ح'],
    BracketLeft: ['ج'],
    BracketRight: ['د'],
    KeyA: ['ش'],
    KeyS: ['س'],
    KeyD: ['ي'],
    KeyF: ['ب'],
    KeyG: ['ل', 'لأ'],
    KeyH: ['ا', 'أ'],
    KeyJ: ['ت'],
    KeyK: ['ن'],
    KeyL: ['م'],
    Semicolon: ['ك'],
    Quote: ['ط'],
    KeyZ: ['ئ'],
    KeyX: ['ء'],
    KeyC: ['ؤ'],
    KeyV: ['ر'],
    KeyB: ['لا', 'لآ'],
    KeyN: ['ى', 'آ'],
    KeyM: ['ة'],
    Comma: ['و'],
    Period: ['ز'],
    Slash: ['ظ'],
  },
}

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
    = mappings['ibm'][ev.code]
    ? mappings['ibm'][ev.code][+ev.shiftKey]
    : null
  if (kk && kk.match(/^[ \nء-غف-ي]$|^ل[اأإآ]$/)) { return kk }
}

////////////////////////////////////////////////////////////////////////////////
// txt-related methods {{{1
// they rely on the #txt element, but no other global.

const fade = (() => {
  let int
  const init = (dark) => dark ? [ 192, 0, -1, 20 ] : [ 128, 0xff, 1, 30 ]  // bgn, end, step, dur
  const stop = () => { clearInterval(int); int = null }
  const byte2grayhex = (i) => '#' + i.toString(16).padStart(2,'0').repeat(3)  // convert 0-255 to #00000-#ffffff
  //
  return {
    stop: () => { if (int) { stop() } },
    run: (txt, dark) => {
      const [bgn, end, step, dur] = init(dark)
      let i
      txt.style.setProperty('--h', byte2grayhex(i=bgn))
      const ifade = () => {
        txt.style.setProperty('--h', byte2grayhex(i+=step))
        if (i === end) {
          stop()
          txt.placeholder = ""
        }
      }
      int = setInterval(ifade, dur)
    },
  }
})()

const show_hint = (dark, hint) => {
  fade.stop()  // if running
  txt.placeholder = hint
  fade.run(txt, dark)
}

const hide_hint = () => {
  fade.stop()  // if running
  txt.placeholder = ""
}

const on_insert = (dark, correct_word, move_forward) => {
  const val = txt.value = txt.value
    .replace(/[^ء-غف-ي ]+/g, "")  // remove invalid chars (can happen with pasting)
    .replace(/^ +/, "")   // trim leading spaces
    .replace(/ +$/, " ")  // collapse trailing spaces
  //
  if (val.endsWith(" ") && correct_word === val.replace(/ $/, "")) {  // completed the correct word
    txt.style.background = TxtBgNormal[+dark]
    txt.value = ""
    move_forward()  // async (in bg)
  }
  else if (correct_word.slice(0, val.length) === val) {  // not wrong so far
    txt.style.background = TxtBgNormal[+dark]
  }
  else {
    txt.style.background = TxtBgWrong[+dark]
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
  const reset_format = (dark) => {
    if (dark)
      dark_fmt_idx = 0
    else
      light_fmt_idx = 0
  }

  const next_format = (dark) => {
     if (dark)
        if (dark_fmt_idx >= QuranPagesFormatsDark.length-1) { return false }
        else { ++dark_fmt_idx; return true }
     else
        if (light_fmt_idx >= QuranPagesFormatsLight.length-1) { return false }
        else { ++light_fmt_idx; return true }
  }

  const image_src = (dark, p) => {
     // if (isNaN(p) || !Number.isInteger(p) || p < 1 || p > 606) {
     //   throw `Invalid page number: expected a number between 1 and 606 inclusive (605 & 606 for the empty pages); got '${p}'`
     // }
     const f = dark ? QuranPagesFormatsDark[dark_fmt_idx] : QuranPagesFormatsLight[light_fmt_idx]
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
  const request_page = (dark, p) => {
    const k = p + (dark ? 'd' : "")
    if (imgloaded.has(k)) { touch_page(k); return imgs.get(k) }
    else { __get_page(dark, p); return null }
  }

  const __get_page = (dark, p, callback) => {
    const k = p + (dark ? 'd' : "")
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
      if (PageFormat.next(dark)) { im.src = PageFormat.url(dark, p) }
      else {  // couldn't load at all
        for (let fn of img_onloads.get(k)) { fn("") }
        img_onloads.delete(k)
        imgs.delete(k)
        im.onload = null
        im.onerror = null
        im.removeAttribute('src')
        PageFormat.reset(dark)
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
    im.src = PageFormat.url(dark, p)
    return im
  }

  const get_page = (dark, p) => {
    return new Promise((resolve, reject) => {
      __get_page(dark, p, (page) => resolve(page))
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

// the container (the muṣħaf pages)'s width <= the screen's width.
// the container's height can be < or == or > the screen's height.
// the help's width == the container's width.
// the help's height == the screen's height.

const resize_fit_screen = (w) => {
  help.style.setProperty('--w',
    container.style.width  = 'min(98vw,' + (w/H*98) + 'vh)')
  body.style.setProperty('--h',
    container.style.height = 'min(98vh,' + (H/w*98) + 'vw)')
}

const resize_scroll_y = (w) => {
  help.style.setProperty('--w',
    container.style.width = '98vw')
  body.style.setProperty('--h',
    container.style.height = (H/w*98)+'vw')
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
  await update_page(p, w, Screen.dark)
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
