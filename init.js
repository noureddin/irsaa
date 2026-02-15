let redraw_screen = () => {}
let noredraw_screen

// Screen {{{1

const Screen = (() => {

  let Width   // screen canvas' width; changes between W (single page) and W*2 (double page)
  let Double  // if currently showing two pages side by side
  let Dark = false    // darkmode -- currently disabled
  let realheight = H

  // the following two are trilogical: null (auto), true, and false
  let force_double = null
  let fitscreen = null

  //

  const to_double = () => {
    fitscreen === false  // fitscreen is trilogical (null (=auto), true, false)
      ? resize_scroll_y(2*W)
      : resize_fit_screen(2*W)  // if auto fit (in double, it's force-fit)
    if (Double === true) { return }  // Double can be undefined
    Double = true
    body.classList.add('d')
    // off2canvas.width =
    canvas.width = Width = W*2
    redraw_screen()
  }

  const to_single = () => {
    fitscreen === true  // fitscreen is trilogical (null (=auto), true, false)
      ? resize_fit_screen(W)
      : resize_scroll_y(W)  // if auto fit (in single, it's scroll-y)
    if (Double === false) { return }  // Double can be undefined
    Double = false
    body.classList.remove('d')
    // off2canvas.width =
    canvas.width = Width = W
    redraw_screen()
  }

  // const toggle_dark = () => {
  //   body.classList.toggle('k', (Dark = !Dark))
  //   redraw_screen()
  // }
  const toggle_dark = () => { }

  const trilogical_from_string = (v) => v === '' ? null : v === 'y'

  // const set_dark = (d) => { Dark = d !== true /* default to lightmode */; toggle_dark() }
  const set_dark = (d) => {}
  const page_offset_in_canvas = (p) => Double && p % 2 ? W : 0
  const right_in_double = (p) => Double && p % 2
  const left_in_double = (p) => Double && p % 2 == 0
  const resize_canvas = (q) => { force_double == null && q.matches || force_double ? to_double() : to_single() }
  const update_fontsize = () => { realheight = parseFloat(getComputedStyle(canvas).height) }

  return (
    Object.defineProperty(
    Object.defineProperty(
    Object.defineProperty(
    Object.defineProperty(
    {
      init: () => {
        double_select.oninput    = () => { force_double = trilogical_from_string(double_select.value);    update_screen_size() }
        fitscreen_select.oninput = () => { fitscreen    = trilogical_from_string(fitscreen_select.value); update_screen_size() }
        // if the page is reloaded; as these two aren't remembered across sessions
        force_double = trilogical_from_string(double_select.value)
        fitscreen    = trilogical_from_string(fitscreen_select.value)
        // initialize the screen dimensions
        resize_canvas(wide_screen)  // half of update_screen_size()
      },
      set_dark,
      toggle_dark,
      page_offset_in_canvas,
      right_in_double,
      left_in_double,
      resize_canvas,
      update_fontsize,
    }
    , 'fontsize', { get: () => realheight/32 })
    , 'double', { get: () => Double })
    , 'width', { get: () => Width })
    , 'dark', { get: () => Dark })
  )
})()

////////////////////////////////////////////////////////////////////////////////
// DOM constant (never-changing) initializations (event handlers etc) {{{1

// stats
if (!nostats) {
  window.goatcounter = { path: location.href, allow_frame: true }
  // privacy-friendly statistics, no tracking of personal data, no need for GDPR consent; see goatcounter.com
  const el = document.createElement('script')
  el.dataset.goatcounter = 'https://irsaa.goatcounter.com/count'
  el.async = true
  el.src = '//gc.zgo.at/count.js'
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
