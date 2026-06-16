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
  select_fit(__screen_fitscreen, true)  // __screen_fitscreen is trilogical (null (=auto), true, false)
  if (screen_double === true) { return }  // can be undefined
  screen_double = true
  body.classList.add('d')
  // off2canvas.width =
  canvas.width = screen_width = W*2
  redraw_screen()
}

const __screen_to_single = () => {
  select_fit(__screen_fitscreen, false)  // __screen_fitscreen is trilogical (null (=auto), true, false)
  if (screen_double === false) { return }  // can be undefined
  screen_double = false
  body.classList.remove('d')
  // off2canvas.width =
  canvas.width = screen_width = W
  redraw_screen()
}

const toggle_dark = () => { body.classList.toggle('k', (screen_dark = !screen_dark)); redraw_screen() }

// darkmode images are still experimental and not online yet

const trilogical_from_value = (v) => v === "" ? null : v === 'y'

const set_dark = (d) => { screen_dark = d !== true /* default to lightmode */; toggle_dark() }
const page_offset_in_canvas = (p) => screen_double && p % 2 ? W : 0
const right_in_double = (p) => screen_double && p % 2
const left_in_double = (p) => screen_double && p % 2 == 0
const resize_canvas = () => {
  const s_w = window.innerWidth >= sW
  const s_h = window.innerHeight >= sH
  const fit = __screen_fitscreen
  const dbl = __screen_force_double
  // choose doublepage in three cases:
  // - double is forced (chosen by the user)
  // - double is auto, and there is enough screen width and one of the following:
  //   - fit or scroll is forced (if fit, space would be wasted if a single page is viewed; if scroll, a single page would probably be too big)
  //   - auto fit/scroll, and there is enough screen height
  dbl || dbl == null && s_w && (fit != null || fit == null && s_h)
    ? __screen_to_double() : __screen_to_single()
}
const update_fontsize = () => {
  screen_fontsize = parseFloat(getComputedStyle(canvas).height)/32
}

const screen_init = () => {
  double_select.oninput    = () => { __screen_force_double = trilogical_from_value(double_select.value);    onresize() }
  fitscreen_select.oninput = () => { __screen_fitscreen    = trilogical_from_value(fitscreen_select.value); onresize() }
  // if the page is reloaded; as these two aren't remembered across sessions
  __screen_force_double = trilogical_from_value(double_select.value)
  __screen_fitscreen    = trilogical_from_value(fitscreen_select.value)
  // initialize the screen dimensions
  resize_canvas()
}

////////////////////////////////////////////////////////////////////////////////
// DOM constant (never-changing) initializations (event handlers etc) {{{1

document.querySelector('.search').onclick = () => show_popup('c')

;(() => {  // audio options
  const qq = (el, want, store, defaultvalue) => {
    const v = want != null ? want : load_char(store, defaultvalue)
    // note: all qari url params take precedence over the stored previous preference,
    //   even if the value given in the url param is invalid. (see load.js for 'qari=')
    el.value = v
    if (el.value !== v) { el.value = defaultvalue }
  }
  qq(qp, wantqp, 'qp', "")
  qq(qs, wantqs, 'qs', 'a')  // people will miss it when they choose a reciter
  qp.onchange = () => {
    player.classList.toggle('t', qp.value === 't')
  }
  qp.onchange()
  // no qs.onchange event because its value is checked every times it's needed
})()

for (let el of document.querySelectorAll('input[type="range"]')) {
  el.after(make_element('button', { innerHTML: 'استرجاع' }))
}

// stats
if (!nostats) {
  window.goatcounter = { allow_frame: true }
  // privacy-friendly statistics, no tracking of personal data, no need for GDPR consent; see goatcounter.com
  body.append(make_element('script', {
    dataset: { goatcounter: 'https://irsaa.goatcounter.com/count' },
    async: true, src: '/count.min.js',
  }))
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
  for (let el of document.querySelectorAll('#u > .scr')) {
    let ticking = false
    el.addEventListener('scroll', (ev) => {
      if (!ticking) { // throttle the event
        setTimeout(() => {
          update_scrollshadows()  // the actual handler
          ticking = false
        }, 20)
        ticking = true
      }
    }, { passive: true })
  }
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
