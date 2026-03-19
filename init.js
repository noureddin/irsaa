let redraw_screen = () => {}
let noredraw_screen

// Screen {{{1

let screen_width   // screen canvas' width; changes between W (single page) and W*2 (double page)
let screen_double  // if currently showing two pages side by side
let screen_dark = false    // darkmode -- currently disabled
let screen_fontsize = H/32

// the following two are trilogical: null (auto), true, and false
let __screen_force_double = null
let __screen_fitscreen = null

//

const __screen_to_double = () => {
  __screen_fitscreen === false  // is trilogical (null (=auto), true, false)
    ? resize_scroll_y(2*W)
    : resize_fit_screen(2*W)  // if auto fit (in double, it's force-fit)
  if (screen_double === true) { return }  // can be undefined
  screen_double = true
  body.classList.add('d')
  // off2canvas.width =
  canvas.width = screen_width = W*2
  redraw_screen()
}

const __screen_to_single = () => {
  __screen_fitscreen === true  // is trilogical (null (=auto), true, false)
    ? resize_fit_screen(W)
    : resize_scroll_y(W)  // if auto fit (in single, it's scroll-y)
  if (screen_double === false) { return }  // can be undefined
  screen_double = false
  body.classList.remove('d')
  // off2canvas.width =
  canvas.width = screen_width = W
  redraw_screen()
}

// const toggle_dark = () => {
//   body.classList.toggle('k', (screen_dark = !screen_dark))
//   redraw_screen()
// }
const toggle_dark = () => { }

const trilogical_from_string = (v) => v === '' ? null : v === 'y'

// const set_dark = (d) => { screen_dark = d !== true /* default to lightmode */; toggle_dark() }
const set_dark = (d) => {}
const page_offset_in_canvas = (p) => screen_double && p % 2 ? W : 0
const right_in_double = (p) => screen_double && p % 2
const left_in_double = (p) => screen_double && p % 2 == 0
const resize_canvas = (q) => { __screen_force_double == null && q.matches || __screen_force_double ? __screen_to_double() : __screen_to_single() }
const update_fontsize = () => { screen_fontsize = parseFloat(getComputedStyle(canvas).height)/32 }

const screen_init = () => {
  double_select.oninput    = () => { __screen_force_double = trilogical_from_string(double_select.value);    update_screen_size() }
  fitscreen_select.oninput = () => { __screen_fitscreen    = trilogical_from_string(fitscreen_select.value); update_screen_size() }
  // if the page is reloaded; as these two aren't remembered across sessions
  __screen_force_double = trilogical_from_string(double_select.value)
  __screen_fitscreen    = trilogical_from_string(fitscreen_select.value)
  // initialize the screen dimensions
  resize_canvas(wide_screen)  // half of update_screen_size()
}

////////////////////////////////////////////////////////////////////////////////
// DOM constant (never-changing) initializations (event handlers etc) {{{1

// stats
if (!nostats) {
  window.goatcounter = { allow_frame: true }
  // privacy-friendly statistics, no tracking of personal data, no need for GDPR consent; see goatcounter.com
  const el = document.createElement('script')
  el.dataset.goatcounter = 'https://irsaa.goatcounter.com/count'
  el.async = true
  el.src = '/count.min.js'
  body.append(el)
}

// decode contact
;(() => {
  let xyz = Qid('xyz'); let mia_nomo = body.innerHTML.match(/\/\/github[.]com\/([^\/]+)\//)[1]
  const zyx = mia_nomo + String.fromCharCode(1<<6) + 'pro' + (''+(!![]))[+![]] + 'moc.liamno'.split('').reverse().join('')
  xyz.href = zyx.slice(16,20) + 'to' + String.fromCharCode('xyz'.charCodeAt(1<<1)^0O100) + zyx
})()

// scroll shadows in the help/options
;(() => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
  let ticking = false
  helpscroll.addEventListener('scroll', (ev) => {
    if (!ticking) { // throttle the event
      setTimeout(() => {
        update_scrollshadows()  // the actual handler
        ticking = false
      }, 20)
      ticking = true
    }
  }, { passive: true })
})()

// auto-hide cursor
;(() => {

  let kb_active

  const hide_cursor = () => {
    if (kb_active) { return }
    body.classList.add('nocursor')
    kb_active = true
  }

  const show_cursor = () => {
    if (kb_active) {
      body.classList.remove('nocursor')
      kb_active = false
    }
  }

  body.addEventListener('mousemove', (ev) => {
    show_cursor()
  })

  body.addEventListener('keyup', (ev) => {
    if (!ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      hide_cursor()
    }
  })

})()

document.querySelectorAll('#h details').forEach(el => { el.ontoggle = update_scrollshadows })

// vim: set foldmethod=marker foldmarker={{{,}}} :
