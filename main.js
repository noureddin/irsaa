
insert = wantnormal != null ? !wantnormal : load_flag('i', !mobile)
// url params takes precedence,
// then localStorage (previous choice by the user),
// then it defaults to Normal for mobiles and Insert for others.

wheel.set(load_num('_w', wheel.value))
swipe.set(load_num('_s', swipe.value))
load_folds()
set_dark(wantdark == null ? load_flag('d') : wantdark)

// audio qari is loaded in load.js
// audio prefs are loaded in init.js
// osk prefs are loaded in osk.js

if (!Qid('qaris')) {
  audio.setqari(load_char('q'))
}

screen_init()

// maybe load&store other options

document.onvisibilitychange = () => {
  store_num('p', p)
  store_num('w', w)
  store_flag('i', insert)
  store_flag('d', screen_dark)
  sync_selectors(p, w)
  store_num('s', sura_select.value)
  store_num('a', aaya_select.value)
  store_num('l', line_select.value)
  store_if_notdefault('q', audio.getqari(), "")
  store_if_notdefault('qp', qp.value, "")
  store_if_notdefault('qs', qs.value, "")
  store_num('_w', wheel.value)
  store_num('_s', swipe.value)
  store_folds()
  store_osk_prefs()
}

// addEventListener('keydown', async (ev) => {
//   if (ev.ctrlKey && ev.key === 'F12') {
//     const url = location.toString()
//     // navigator.clipboard.writeText(url)  // unreliable; https://stackoverflow.com/q/69438702
//     //   .then(() => alert('نُسخ رابط الصفحة حتى الكلمة الحالية'))
//     //   .catch(() => alert('هذا رابط الصفحة حتى الكلمة الحالية:\n\n'+url))
//     alert('هذا رابط الصفحة حتى الكلمة الحالية:\n\n'+url)
//   }
// })

// show loading-data screen
draw_emptypage(emptypage.dataloading)

////////////////////////////////////////////////////////////////////////////////

data_loaded.then(() => {

  body.addEventListener('mouseup', (ev) => {
    if (!loading && !helping) { focus_word() }
  })

  onresize()
  Movado.init()
  onhashchange = () => {
    const [pp, ww] = hash_get_pw() || [p, w]
    p = pp
    w = ww
    Movado.init()  // goes to p&w
  }

  txt.oninput = txt_oninput
  txt.onkeydown = txt_onkeydown
  onkeydown = window_onkeydown
  onkeyup = window_onkeyup
  insert ? to_insert() : to_normal()
  init_osk()  // set up onscreen keys

  canvas.ondblclick = () => {
    if (!helping && !loading) {
      insert ? to_normal() : to_insert()
    }
  }

  // enable mouse wheel to move by words
  try {
    // adapted from the (passive) scroll event throttle; but this is ACTIVE (calls ev.preventDefault())
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
    let ticking = 0  // using 0 & 1 here instead of false & true actually reduces the compressed script size
    canvas.onwheel = (ev) => {
      if (!insert && !loading && !helping) {  // ignore non-normal mode
        ev.preventDefault()
      }
      else { return }
      // ^ user can't scroll with the wheel, but forward() & backward() scroll to the current word
      if (!ticking) { // throttle the event
        setTimeout(() => {
          // the actual handler
          if (!insert && !loading && !helping) {  // ignore non-normal mode
            const bypixels = ev.deltaMode === 0
            if      (bypixels ? ev.deltaY >=  5 : ev.deltaY > 0) { Movado.forward() }
            else if (bypixels ? ev.deltaY <= -5 : ev.deltaY < 0) { Movado.backward() }
          }
          // end of the actual handler
          ticking = 0
        }, wheel.real_value)
        ticking = 1
      }
    }
  } catch (e) {}  // ignore if a browser doesn't support wheel events

  // enable swiping to move by words
  try {
    let x
    ontouchstart = (ev) => {
      if (insert || loading || helping || ev.touches.length > 1) { x = null; y = null; return }  // ignore non-normal mode & zooming gestures
      const t = ev.changedTouches[0]
      x = t.pageX
      Movado.keyup()
    }
    ontouchmove = (ev) => {
      if (insert || loading || helping || ev.touches.length > 1) { x = null; y = null; return } // ignore non-normal mode & zooming gestures
      const t = ev.changedTouches[0]
      let dx = x - t.pageX  // right is negative! because this is Arabic
      // ignore tiny swipes (a kind of throttling); otherwise it'd move too fast
      if (Math.abs(dx) < swipe.real_value) { return }
      // console.log(Math.abs(dy), swipe.real_value)
      // Note: no Movado.keyup() here; ie, this movement is slowed down at breaks
      if      (dx > 0) { Movado.forward() }
      else if (dx < 0) { Movado.backward() }
      x = t.pageX
    }
    ontouchcancel = ontouchend = Movado.keyup
  } catch (e) {
    // ignore if a browser doesn't support touch events
    // also remove the swipe option, not to confuse users
    Qid('sss').style.display = 'none'  // the swipe sensitivity pref row
    // Todo: should "mouse wheel" pref also be hidden on touch-only devices? can?
    // Todo: should, on touchscreen devices, be an option to always hide the mouse pointer?
  }

})
.catch(() => {  // if failed to load the json data
  onresize()
  draw_emptypage(emptypage.datafailed)
})
