
// global (set once) variables
const Q = {}  // metadata & text

const myfetch = (path) => fetch(path)
  .then((res) => res.ok ? res.arrayBuffer() : Promise.reject())
  // if couldn't retrieve a local file for whatever reason, try my online website
  .catch((err) => path.startsWith('../')
    // if the file is on the website but not in the repo
    ? fetch(path.replace(/^\.\./, 'https://www.noureddin.dev'))
        .then((res) => res.ok ? res.arrayBuffer() : Promise.reject())
    : !path.starts('http')
    // if the file is in the repo
    ? fetch('https://www.noureddin.dev/irsaa/'+path)
        .then((res) => res.ok ? res.arrayBuffer() : Promise.reject())
    // otherwise, fail
    : Promise.reject(err)
  )

const unzstd = (path, callback) => myfetch(path)
  .then((buf) => callback( (new TextDecoder).decode( fzstd.decompress(new Uint8Array(buf)) ) ))

const realwait = (sec) => new Promise((resolve, reject) => setTimeout(() => resolve(), sec*1000))

const meta_loaded = unzstd('mymeta.json.zst?h=<<hash>>', (json) => { Object.assign(Q, JSON.parse(json)) })
// for details, see mkmeta.sh (which includes _data.json without the comments, and a few data from quran-pages).

const data_loaded = Promise.all([
  // realwait(1),  // for debugging
  meta_loaded,
  unzstd('imla.zst?h=<<hash>>',  (txt)  => { Q.imla = txt.split('\n').slice(0,-1) }),
  unzstd('../quran-pages/2/data/words.json.zst?h=<<hash>>',    (json) => { Q.words    = JSON.parse(json) }),
  unzstd('../quran-pages/2/data/lineends.json.zst?h=<<hash>>', (json) => { Q.lineends = JSON.parse(json) }),
  unzstd('../quran-pages/2/data/suarayat.json.zst?h=<<hash>>', (json) => { Q.suarayat = JSON.parse(json) }),
  unzstd('../quran-pages/2/data/ayat.json.zst?h=<<hash>>',     (json) => { Q.ayat     = JSON.parse(json) }),
  unzstd('../quran-pages/2/data/pauses.json.zst?h=<<hash>>',   (json) => { Q.pauses   = JSON.parse(json) }),
])

// data_loaded.then(() => { console.log(Q) })

// collapsibles loading data on demand:

const ondemand = (el_details, text_file, onsuccess, onerror) => {
  const p = el_details.querySelector('p')
  el_details.addEventListener('toggle', () => {
    myfetch(text_file)
      .then((buf) => onsuccess(p, (new TextDecoder).decode(new Uint8Array(buf)) ))
      .catch(() => onerror(p))
  }, { once: true, passive: true })
}

// changelog -- only loaded if asked for.

ondemand(Qid('v'), 'changelog?h=<<hash_changelog>>', (p, text) => {
  p.outerHTML =
    text.split('\n').map(ln =>
      ln.startsWith('- ') ? '<li>' + ln.slice(2).replace(/&/g, '&amp;').replace(/<( )/g, '&lt; ')
      : ln.length === 0 ? '</ul>'
        : '<h2>' + ln.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</h2><ul>').join('\n') + '</ul>'
}, (p) => { p.innerHTML = 'تعذّر تحميل سجل التغييرات.' })

// Qid('v').open = true

// qaris select -- only loaded if asked for.

ondemand(Qid('q'), '../recite/res/qaris', (p, text) => {
  const lines = text.split('\n')
  const L = (lines.length-1) / 2
  //
  const qaris = make_element('select', {
    id: 'qaris',
    onchange: () => { audio.setqari(qaris.value) },
  }, [
    make_option("", 'بغير تلاوة صوتية'),
    ...Array(L).keys().map(i =>
      make_option(lines[2*i], lines[2*i+1])),
  ])
  //
  p.after(qaris)
  p.remove()
  //
  const qq = wantqari != null ? wantqari : load_char('q', "")
  // url params takes precedence (even if it's invalid!),
  // then localStorage (previous choice by the user),
  // then it defaults to No Audio Recitation.
  if (qq.includes('/')) { qaris.append(make_option(qq, 'تلاوة من رابط مخصص')) }
  qaris.value = qq
  if (qaris.value === "" && qq !== "") {
    qaris.value = ""
    console.warn("Invalid qari: "+qq)
  }
  qaris.onchange()
}, (p) => {
  p.innerHTML = 'تعذّر تحميل أسماء التلاوات الصوتية.'
  if (load_char('q', "")) {
    p.after(make_element('button', {
      innerHTML: 'إلغاء التلاوة الصوتية',
      style: { width: 'initial', margin: '1em' },
      onclick: (ev) => { audio.setqari(); ev.target.remove() },
    }))
  }
})

// uthmani loading (get_uthmani_aaya) for search

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
