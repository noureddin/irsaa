// formats & urls {{{1
// they maintain its internal state, but doesn't rely on anything external.

const QuranPagesRootRel = '../quran-pages/2/'
const QuranPagesRootAbs = 'https://www.noureddin.dev/quran-pages/2/'

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
  const reset_format = (Dark) => {
    if (Dark)
      dark_fmt_idx = 0
    else
      light_fmt_idx = 0
  }

  const next_format = (Dark) => {
     if (Dark)
        if (dark_fmt_idx >= QuranPagesFormatsDark.length-1) { return false }
        else { ++dark_fmt_idx; return true }
     else
        if (light_fmt_idx >= QuranPagesFormatsLight.length-1) { return false }
        else { ++light_fmt_idx; return true }
  }

  const image_src = (Dark, p) => {
     // if (isNaN(p) || !Number.isInteger(p) || p < 1 || p > 606) {
     //   throw `Invalid page number: expected a number between 1 and 606 inclusive (605 & 606 for the empty pages); got '${p}'`
     // }
     const f = Dark ? QuranPagesFormatsDark[dark_fmt_idx] : QuranPagesFormatsLight[light_fmt_idx]
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
// cache {{{1
// this relies on a PageFormat object, connects to the network (to fetch
//   the pages' images), and maintains its internal state, but nothing else.

const PagesCache = (formats) => {

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
  const has = (Dark, p) => {
    const k = p + (Dark ? 'd' : "")
    if (imgloaded.has(k)) { touch_page(k); return imgs.get(k) }
    else { get(Dark, p); return null }
  }

  const get = (Dark, p, callback) => {
    const k = p + (Dark ? 'd' : "")
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
      if (formats.next(Dark)) { im.src = formats.url(Dark, p) }
      else {  // couldn't load at all
        for (let fn of img_onloads.get(k)) { fn("") }
        img_onloads.delete(k)
        imgs.delete(k)
        im.onload = null
        im.onerror = null
        im.removeAttribute('src')
        formats.reset(Dark)
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
    im.src = formats.url(Dark, p)
    return im
  }

  const fetch = (Dark, p) => {
    return new Promise((resolve, reject) => {
      get(Dark, p, (page) => resolve(page))
    })
  }

  return { fetch, get, has }
  // fetch(Dark, p): returns a promise
  // get(Dark, p, callback=null): uses an optional callback
  // has(Dark, p): returns the image if cached, otherwise returns null and requests it for a future get/fetch
}

////////////////////////////////////////////////////////////////////////////////
// initialization {{{1

const Pages = PagesCache(PageFormat)

////////////////////////////////////////////////////////////////////////////////
// vim: set foldmethod=marker foldmarker={{{,}}} :
