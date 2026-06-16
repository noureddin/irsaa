
// largely copied from my other project Recite (CC0 terms, too):
// https://github.com/noureddin/recite/blob/gh-pages/search.js

// query filtering (arabic_fold) {{{1
// make final-word alef after waw optional
// fold final-word heh <=> teh <=> teh marbuta
// fold alef => alef maqsura, alef hamza, alef hamza below, alef madd
// fold alef maqsura => alef, yeh, yeh hamza, alef hamza, alef hamza below
// fold yeh => alef maqsura, yeh hamza, alef hamza, alef hamza below
// fold waw => waw hamza
// fold any hamza letter => any other hamza letter, the plain letter of the original:
//    alef for أ إ آ
//    yeh and alef maqsura for ئ
//    waw for ؤ
const hmz = 'آأإئؤء]'  // = "any hamza letter" + char-class closing
const arabic_fold = (txt) => {  // takes string, return a regex
  return txt
    .replace(/وا?(?= |$)/g, 'U')
    .replace(/[هتة](?= |$)/g, 'T')
    .replace(/ا/g, 'A')
    .replace(/ى/g, 'Y')
    .replace(/ي/g, 'I')
    .replace(/و/g, 'W')
    .replace(/[آأإ]/g, 'a')
    .replace(/ئ/g, 'i')
    .replace(/ؤ/g, 'w')
    .replace(/ء/g, 'x')
    //
    .replace(/U/g, 'وا?')
    .replace(/T/g, '[هتة]')
    .replace(/A/g, '[اىأإآ]')
    .replace(/Y/g, '[ايىئأإ]')
    .replace(/I/g, '[يىئ]')
    .replace(/W/g, '[وؤ]')
    .replace(/a/g, '[ا'+hmz)
    .replace(/i/g, '[يى'+hmz)
    .replace(/w/g, '[و'+hmz)
    .replace(/x/g, '['+hmz)
}

// uthmani loading (get_uthmani_aaya) {{{1
const get_uthmani_aaya = (() => {
  const promises = []
  const splits = [0, 493, 954, 1473, 2140, 2932, 3788, 4735, 6236]
  return (a) => {
    const i = bisect(splits, a) || 1
    if (!promises[i]) {
      promises[i] = unzstd('u/'+i+'.zst', (txt) => { Q['u'+i] = txt.split('\n').slice(0,-1) })
    }
    return promises[i].then(() => Promise.resolve(Q['u'+i][a - splits[i-1]]))
  }
})()

// constants {{{1

const spinner = make_element('center', { id: 'spin', innerHTML: 'يبحث&hellip;' })

const search_done = make_element('center', { innerHTML: 'ما من نتائج أخرى.' })

const sx_init_msg = '<center>أدخل جزءًا من&nbsp;آية للبحث&nbsp;عنها</center>'

const el_sxq = Qid('sxq')
const el_sxr =  Qid('sxr')
const el_sura_sx = Qid('sura_sx')

// initialization {{{1

el_sxq.value = ""
el_sxr.innerHTML = sx_init_msg

popup_focus_element['c'] = el_sxq

meta_loaded.then(() => {
  el_sura_sx.append(make_option("", 'كل السور'),
    ...Array(114).keys().map(i =>
      make_option(i, Q.sura_name[i])))
})

;(() => {

  const updatefields = async (i, su, ay) => {
    sura_select.value = su  // 0-based
    aaya_select.value = ay  // 1-based
    // copied from sura_aaya_go.onclick()
    hide_popup(false)  // don't focus input, because it'll be changed
    await data_loaded
    let [p, w] = Q.suarayat[su][ay-1]
    if (w === Q.words[p-1].length) { p += 1; w = 0 }
    Movado.go_to(p,w)
  }

  // find() is called only when these conditions are met:
  // 1. plain imlaai text is loaded
  // 2. the search query has at least one non-space letter
  // 3. the search text field has not changed for some time (one second)
  //
  // find() is called by find_wrapper() (handling condition 1),
  // which is called by el_sxq.oninput (which handles conditions 2 and 3).
  //
  // when the sura selector changes, find_wrapper() is called immediately,
  // if the second condition is met.

  let waiting = false  // if the spinner is shown; see wait()
  const find = () => {
    waiting = false
    const ss = el_sura_sx.value  // "" (all) or a 0-based sura
    const st = ss === "" ? 0    : Q.sura_offset[ss]
    const en = ss === "" ? 6236 : st + Q.sura_length[ss]
    const q = arabic_fold(el_sxq.value)
    const r = Q.imla
      .map((a, i) => st <= i && i < en && a.match(q) ? i : -1)
      .filter(i => i !== -1)
    if (r.length > 50) {
      el_sxr.innerHTML = '<center>يطابق بحثك '+r.length+' من&nbsp;الآيات، وهو أكثر من&nbsp;٥٠؛ حاول التحديد أكثر</center>'
    }
    else if (r.length === 0) {
      el_sxr.innerHTML = '<center>تعذر إيجاد العبارة التي أدخلتها</center>'
    }
    else {
      el_sxr.innerHTML = `<center>يوجد ${r.length} من&nbsp;الآيات</center>` 
      const aa = range(r.length).map(a => make_element('div', { className: 'ac' }))
      aa.forEach((a,j) => {
        const i = r[j]  // 0-based
        const su = sura_of(i+1) - 1           // now this is 0-based
        const ay = i - Q.sura_offset[su] + 1  // now this is 1-based ^_^'
        const name = Q.sura_name[su]
        a.onclick = () => updatefields(i, su, ay)
        a.append(
          make_element('span', { className: 's_a', innerHTML: `سورة ${name} آية&nbsp;${ay}:` }),
          make_element('span', { className: 'aya', innerHTML: '<span>يحمّل&hellip;</span>' }),
        )
      })
      el_sxr.append(...aa, spinner)
      //
      const all = []
      for (let i = 0; i < r.length; ++i) {
        all.push(get_uthmani_aaya(r[i]).then((utxt) => {
          aa[i].querySelector('.aya').innerText = utxt
        }))
      }
      // remove the spinner when all aayaat are rendered, and indicate the end of results
      Promise.all(all).then(() => { el_sxr.removeChild(spinner); el_sxr.append(search_done) } )
    }
  }

  let int

  function init () {
    clearTimeout(int); int = null
    waiting = false
    el_sxr.innerHTML = sx_init_msg
  }

  function wait () {
    clearTimeout(int); int = null
    if (!waiting) { el_sxr.insertBefore(spinner, el_sxr.firstChild) }
    waiting = true
    int = setTimeout(find_wrapper, 1000)
  }

  const find_wrapper = () => Q.imla ? find() : wait()

  const filter_query = (val) => val
    .replace(/\s+/g, ' ')             // collapse spaces
    .replace(/\u06A9/g, 'ك')          // keheh to arabic kaf
    .replace(/\u06CC/g, 'ي')          // farsi yeh to arabic yeh
    .replace(/[\u06BE\u06C1]/g, 'ه')  // heh doachashamee or heh goal to arabic heh
    .replace(/[^ء-غف-ي ]/g, "")       // remove all non-imlaai letters or spaces

  let old = ""
  el_sxq.oninput = (ev) => {
    const pos = el_sxq.selectionStart
    const len = el_sxq.value.length
    const entered = el_sxq.value[pos-1]
    const next = el_sxq.value[pos]
    el_sxq.value = filter_query(el_sxq.value)
    el_sxq.selectionStart = el_sxq.selectionEnd = pos - (len - el_sxq.value.length)  // fix cursor position after filtering
      + (entered === ' ' && next === ' ' ? 1 : 0)
      // if the user pressing space, which is rejected b/c of a following space, then advance one step
    const val = el_sxq.value === ' ' ? "" : el_sxq.value
    // ^ consider a space-only query to be equivalent to an empty query, without changing the input field,
    // to allow the user to start the query with a space,
    // b/c a space is considered a word delimiter, even at the beginning and end of an aaya.
    if (old === val) { old = val; return } else { old = val }
    if (val === "") { init(); return }
    // if neither:
    wait()
  }

  el_sxq.onkeydown = (ev) => {
    if (!ev.altKey && !ev.ctrlKey && ev.key.length === 1) {
      ev.preventDefault()
      const k = intended_key(ev)  // handles emulation and filtering
      if (k != null) {
        insert_in_field(el_sxq, k)
        el_sxq.oninput()
      }
    }
  }

  el_sura_sx.oninput = () => {
    const q = filter_query(el_sxq.value)
    if (q !== "" && q !== ' ') {  // has a valid query
      clearTimeout(int); int = null
      find_wrapper()
    }
  }

})()

// set vim: foldmethod=marker foldmarker={{{,}}} :
