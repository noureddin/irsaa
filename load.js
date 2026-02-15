
// global (set once) variables
const Q = {}  // metadata & text

const unzstd = (path, callback) => {  // zstd-compressed files
  return fetch(path)
    .then((res) => res.ok ? res.arrayBuffer() : null)
    .then((buf) => {
      callback( (new TextDecoder).decode( fzstd.decompress(new Uint8Array(buf)) ) )
    })
}

const meta_loaded = unzstd('mymeta.json.zst?h=<<hash>>', (json) => { Object.assign(Q, JSON.parse(json)) })
// for details, see mkmeta.sh (which includes _data.json without the comments, and a few data from quran-pages).

const load_json_data = (path, callback) => {
  return unzstd(QuranPagesRootRel + path, (json) => callback(JSON.parse(json))).catch(
   () => unzstd(QuranPagesRootAbs + path, (json) => callback(JSON.parse(json))) )
}

const realwait = (sec) => new Promise((resolve, reject) => setTimeout(() => resolve(), sec*1000))

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

