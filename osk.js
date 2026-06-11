// global state

let kkfullpage = false
let kkopaquetap = true
let kkfixedbottom = false
let __osk_auto_lay = null

// show & hide {{{1

let osk_int

const show_osk = () => {
  if (osk_int != null) {
    clearTimeout(osk_int)
    kk.style.opacity = ""
  }
  kk.classList.add('H')
  osk_int = setTimeout(hide_osk, 2500)
}

const hide_osk = () => {
  if (osk_int != null) {
    clearTimeout(osk_int)
    kk.style.opacity = ""
    osk_int = null
  }
  kk.classList.remove('H')
}

const hide_osk_fast = () => {
  if (osk_int != null) { clearTimeout(osk_int) }
  // 0.1 opacity from :not(.H) but the 0.2s transition from .H
  kk.style.opacity = '0.1'
  osk_int = setTimeout(() => {
    osk_int = null
    kk.style.opacity = ""
    kk.classList.remove('H')
  }, 200)
}

// body.addEventListener('click', (ev) => {
//   if (!kkopaquetap) { return }
//   if (ev.target === canvas || ev.target === pagescroll) {
//     if (screen_double) {
//       const x = Math.abs(0.5 - ev.layerX / body.clientWidth)
//       const y = Math.abs(0.5 - ev.layerY / body.clientHeight)
//       if (x < 0.125 || y > 0.3) { hide_osk_fast() } else { show_osk() }
//     }
//     else {
//       if ((ev.layerY / body.clientHeight) < 0.45) { hide_osk_fast() } else { show_osk() }
//     }
//   }
// })

body.addEventListener('keydown', hide_osk_fast)

// osk show (opacity=0.5) & hide (opacity=0.1) behavior:
// - shows fast (0.2s) when hovered.
// - hides slowly (1.5s) when the mouse goes away.
// - shows fast when the page is clicked in the lower half (lower 55%),
//     then hides slowly after a delay (2.5s).
// - hides fast when the page is clicked in the upper half (upper 45%).
// - hides fast when a key is pressed.

// layouts {{{1

const kklayclasses = 'GLS'.split("")
const kkposclasses = 'TMB'.split("")

// console.assert(kklayclasses.reduce((acc, elem) => acc && (kkposclasses.indexOf(elem) === -1), true),
//   'overlapping osk class between lay & pos')

const move_osk_btn = (key, x, y) => {  // {{{
  if (key === kk_ed) { move_osk_btn(kk_mv, x, y) }
  const [ rect, text, text2 ] = key.children
  if (x != null) {
    rect.setAttribute('x', x)
    text.setAttribute('x', x+4)
    if (text2)
    text2.setAttribute('x', x+4)
  }
  if (y != null) {
    rect.setAttribute('y', y)
    if (text2 == null) {
      text.setAttribute('y', y+4.5)
    }
    else if (text2.textContent === 'F8') {
      text.setAttribute('y', y+3.6)
      text2.setAttribute('y', y+7.3)
    }
    else {
      text.setAttribute('y', y+3.5)
      text2.setAttribute('y', text2.textContent === 'Enter' ? y+7 : y+6.5)
    }
  }
}  // }}}


const osk_laptop = (from_auto) => {  // a column like many laptops' home/pageup/pagedn/end keys
  if (!from_auto) { __osk_auto_lay = null }
  //
  kk.classList.remove(...kklayclasses)
  kk.classList.add('L')
  rkk.setAttribute('viewBox', '0 0 10 40')
  lkk.setAttribute('viewBox', '0 0 10 40')
  //
  move_osk_btn(kk_up, 1,  1)
  move_osk_btn(kk_rt, 1, 11)
  move_osk_btn(kk_lf, 1, 21)
  move_osk_btn(kk_dn, 1, 31)
  //
  move_osk_btn(kk_pv, 1,  1)
  move_osk_btn(kk_rs, 1, 11)
  move_osk_btn(kk_ed, 1, 21)
  move_osk_btn(kk_nx, 1, 31)
}

const osk_manette = (from_auto) => {
  if (!from_auto) { __osk_auto_lay = null }
  //
  kk.classList.remove(...kklayclasses)
  kk.classList.add('G')
  rkk.setAttribute('viewBox', '0 0 30 30')
  lkk.setAttribute('viewBox', '0 0 30 30')
  //
  move_osk_btn(kk_up, 11,  1)
  move_osk_btn(kk_lf,  1, 11)
  move_osk_btn(kk_rt, 21, 11)
  move_osk_btn(kk_dn, 11, 21)
  //
  move_osk_btn(kk_pv, 21, 11)
  move_osk_btn(kk_nx,  1, 11)
  move_osk_btn(kk_rs, 11,  1)
  move_osk_btn(kk_ed, 11, 21)
}

// const osk_triangle = (from_auto) => {
//   if (!from_auto) { __osk_auto_lay = null }
//   //
//   kk.classList.remove(...kklayclasses)
//   kk.classList.add('P')
//   rkk.setAttribute('viewBox', '0 0 30 20')
//   lkk.setAttribute('viewBox', '0 0 30 20')
//   //
//   move_osk_btn(kk_up, 11,  1)
//   move_osk_btn(kk_lf,  1, 11)
//   move_osk_btn(kk_rt, 21, 11)
//   move_osk_btn(kk_dn, 11, 11)
//   //
//   move_osk_btn(kk_pv, 21, 11)
//   move_osk_btn(kk_nx,  1, 11)
//   move_osk_btn(kk_rs, 11,  1)
//   // todo kk_ed
// }

const osk_square = (from_auto) => {
  if (!from_auto) { __osk_auto_lay = null }
  //
  kk.classList.remove(...kklayclasses)
  kk.classList.add('S')
  rkk.setAttribute('viewBox', '0 0 20 20')
  lkk.setAttribute('viewBox', '0 0 20 20')
  //
  move_osk_btn(kk_up, 11,  1)
  move_osk_btn(kk_lf,  1, 11)
  move_osk_btn(kk_rt,  1,  1)
  move_osk_btn(kk_dn, 11, 11)
  //
  move_osk_btn(kk_pv, 11, 11)
  move_osk_btn(kk_nx,  1, 11)
  move_osk_btn(kk_rs,  1,  1)
  move_osk_btn(kk_ed, 11,  1)
}

const osk_autolay = () => {
  __osk_auto_lay = () => {
    if (kkfixedbottom) {
      const hs = pagescroll.clientHeight
      const hc = canvas.clientHeight
      const can_has_manette = pagescroll.clientWidth > 2*3*KK_U*KK_EM  // if there is enough width for the manette
      ;(hs - hc) / hc > 0.25 && can_has_manette ? osk_manette(1) : osk_square(1)
      // the manette requires ~380px in width on narrow screens, and I support screen widths down to about ~400px.
      // I don't check if there is enough width for the square because it needs ~220px.
    }
    else {
      //
      const ws = pagescroll.clientWidth
      const wc = canvas.clientWidth
      const widthratio = (ws - wc) / wc
      // console.log(ws, wc, Math.round((ws - wc)/wc*100)/100, " ", hs, hc, Math.round((hs - hc)/hc*100)/100)
      if (body.classList.contains('F')) {  /* fit_screen */
        screen_double
          ? widthratio > 0.25 ? osk_manette(1) : osk_laptop(1)
          : widthratio > 0.75 ? osk_manette(1) : osk_laptop(1)
      }
      else {  /* scroll_y (and free-moving (ie, on the sides) not stuck at the bottom) */
        osk_laptop(1)
      }
    }
  }
  __osk_auto_lay()
}

const osk_onresize = () => {
  update_kkfixedbottom()
  if (__osk_auto_lay) { __osk_auto_lay() }
}

const set_kk_pos = (i) => {
  kk.classList.remove(...kkposclasses)
  kk.classList.add(kkposclasses[i])
}

// preferences {{{1

const kkvis = Qid('k-v')
// const kkopc = Qid('k-o')
const kkful = Qid('k-f')
const kkrev = Qid('k-r')
const kklay = Qid('k-l')
const kkfix = Qid('k-x')
const kkpos = Qid('k-p')
const kkpos_reset = document.querySelector('#kkpos button')

// kkfix {{{2

const update_kkfixedbottom = () => {
  // if the osk is made stuck to the bottom (not free moving),
  // or it's auto but the page is scroll-y (not fit-screen),
  // or it's auto and the page is fit-screen but is shorter than the screen.
  kkfixedbottom =
    kkfix.value === 's' ||
    kkfix.value === "" && (!body.classList.contains('F') ||
      parseFloat(getComputedStyle(canvas).height) < 0.95*window.innerHeight)
  body.classList.toggle('V', !kkfixedbottom)
  // note: the constant `kkpos` refers to the input (range),
  // not the div#kkpos containing it. and we hide it when it's irrelevant.
  Qid('kkpos').style.display = kkfixedbottom ? 'none' : ""
}

kkfix.checked = load_boolean_default_false('kx')
kkfix.oninput = osk_onresize
kkfix.oninput()

// kkpos {{{2

kkpos.max = kkposclasses.length - 1
const kkpos_default = kkposclasses.indexOf('M')

kkpos_reset.onclick = () => {
  kkpos.value = kkpos_default
  set_kk_pos(kkpos_default)
  kkpos_reset.disabled = true
}

if ('kp' in localStorage) {
  const kp = localStorage.getItem('kp')
  const kpi = kkposclasses.indexOf(kp)
  if (kpi !== -1) {
    kk.classList.add(kp)
    kkpos.value = kpi
    kkpos_reset.disabled = (kpi == kkpos_default)
  }
  else { kkpos_reset.onclick() }
}
else { kkpos_reset.onclick() }

kkpos.oninput = () => {
  set_kk_pos(kkpos.value)
  kkpos_reset.disabled = (kkpos.value == kkpos_default)
}

// kklay {{{2

const set_kklay = (k) => {
  switch (k) {
    case 'G': osk_manette(); break;
    case 'L': osk_laptop(); break;
    // case 'P': osk_triangle(); break;
    case 'S': osk_square(); break;
    default:  osk_autolay()
  }
}

set_kklay(localStorage.getItem('kl'))

kklay.oninput = () => {
  set_kklay(kklay.value)
}

// kkrev {{{2

kkrev.checked = load_boolean_default_false('kr')
kkrev.oninput = () => { kk.classList.toggle('R', kkrev.checked) }
kkrev.oninput()

// kkful {{{2

kkful.checked = load_boolean_default_false('kf')
kkful.oninput = () => { kk.classList.toggle('F', (kkfullpage = kkful.checked)) }
kkful.oninput()

// kkopc {{{2

// kkopc.checked = !load_boolean_default_false('kO')
// kkopc.oninput = () => { kkopaquetap = kkopc.checked }
// kkopc.oninput()

// kkvis {{{2

kkvis.checked = !load_boolean_default_false('kV')
kkvis.oninput = () => { kk.style.display = kkvis.checked ? 'block' : 'none' }
kkvis.oninput()

// NOTE:
//   style.visibility changes when showing/hiding the help/options screen.
//   style.display reflects the kkvis preference, ie, whether to show the osk at all.

// store prefs {{{2

const store_osk_prefs = () => {
  store_if_notdefault('kp', kkposclasses[kkpos.value], kkposclasses[kkpos_default])
  store_if_notdefault('kl', kklay.value, "")
  store_if_notdefault('kx', kkfix.value, "")
  store_boolean_default_false('kr', kkrev.checked)
  store_boolean_default_false('kf', kkful.checked)
  store_boolean_default_false('kV', !kkvis.checked)
  // store_boolean_default_false('kO', !kkopc.checked)
}

// initialization {{{1

const init_osk = () => {
  // Note: clicks can lag ~100-150ms behind a synthetic tap event based on touchend on modern browsers on touch-enabled devices
  kk_up.onclick = () => { Movado.keyup(); Movado.backward(true) }
  kk_dn.onclick = () => { Movado.keyup(); Movado.forward(true) }
  kk_lf.onclick = () => { Movado.keyup(); Movado.forward() }
  kk_rt.onclick = () => { Movado.keyup(); Movado.backward() }
  kk_pv.onclick = () => { Movado.keyup(); kkfullpage ? prev_full() : prev_empty() }
  kk_nx.onclick = () => { Movado.keyup(); kkfullpage ? next_full() : next_empty() }
  kk_rs.onclick = () => { Movado.keyup(); cycle_full_page() }
  kk_ed.onclick = () => { Movado.keyup(); to_insert() }
  kk_mv.onclick = () => { Movado.keyup(); to_normal() }
  show_osk()
}

// let iii = kkpos.value
// canvas.addEventListener('contextmenu', (ev) => {
//   set_kk_pos(iii = (iii + 1) % kkposclasses.length)
//   ev.preventDefault()
// })

// let jjj = 0
// document.body.addEventListener('auxclick', () => {
//   set_kklay(kklayclasses[jjj = (jjj + 1) % kklayclasses.length])
// })

////////////////////////////////////////////////////////////////////////////////
// vim: set foldmethod=marker foldmarker={{{,}}} :
