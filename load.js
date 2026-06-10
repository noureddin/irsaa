
// global (set once) variables
const Q = {}  // metadata & text

const unzstd = (path, callback) => {  // zstd-compressed files
  return fetch(path)
    .then((res) => res.ok ? res.arrayBuffer() : null)
    .then((buf) => {
      callback( (new TextDecoder).decode( fzstd.decompress(new Uint8Array(buf)) ) )
    })
}

const realwait = (sec) => new Promise((resolve, reject) => setTimeout(() => resolve(), sec*1000))

const meta_loaded = unzstd('mymeta.json.zst?h=<<hash>>', (json) => { Object.assign(Q, JSON.parse(json)) })
// for details, see mkmeta.sh (which includes _data.json without the comments, and a few data from quran-pages).

const load_json_data = (path, callback) => {
  return unzstd(QuranPagesRootRel + path, (json) => callback(JSON.parse(json))).catch(
   () => unzstd(QuranPagesRootAbs + path, (json) => callback(JSON.parse(json))) )
}

const data_loaded = Promise.all([
  // realwait(1),  // for debugging
  meta_loaded,
  unzstd('imla.zst?h=<<hash>>',  (txt)  => { Q.imla = txt.split('\n').slice(0,-1) }),
  load_json_data('data/words.json.zst?h=<<hash>>',    (obj) => { Q.words    = obj }),
  load_json_data('data/lineends.json.zst?h=<<hash>>', (obj) => { Q.lineends = obj }),
  load_json_data('data/suarayat.json.zst?h=<<hash>>', (obj) => { Q.suarayat = obj }),
  load_json_data('data/ayat.json.zst?h=<<hash>>',     (obj) => { Q.ayat     = obj }),
  load_json_data('data/pauses.json.zst?h=<<hash>>',   (obj) => { Q.pauses   = obj }),
])

// data_loaded.then(() => { console.log(Q) })

// collapsibles loading data on demand:

const ondemand = (el_details, text_file, onsuccess, onerror) => {
  const p = el_details.querySelector('p')
  el_details.addEventListener('toggle', () => {
    fetch(text_file)
      .then((res) => res.ok ? res.arrayBuffer() : Promise.reject())
      .catch((err) => text_file.startsWith('../')
        ? fetch(text_file.replace(/^\.\./, 'https://www.noureddin.dev'))
            .then((res) => res.ok ? res.arrayBuffer() : Promise.reject())
        : Promise.reject(err)
        // if the file is on the website but not in the repo,
        // try again with the absolute path of the website, otherwise fail
      )
      .then((buf) => onsuccess(p, (new TextDecoder).decode(new Uint8Array(buf)) ))
      .catch(() => onerror(p))
  }, { once: true, passive: true })
}

// changelog -- only loaded if asked for.

ondemand(Qid('v'), 'changelog?h=<<hash_changelog>>', (p, text) => {
  p.outerHTML =
    text.split('\n').map(ln =>
      ln.startsWith('- ') ? '<li>' + ln.slice(2).replace(/&/g, '&amp;').replace(/</g, '&lt;')
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
