
const audio = (() => {
  const mainserver = 'https://www.everyayah.com/data/'
  const sa2url = (s,a) => baseurl +  // must check audio.can() first
      ( (""+s).padStart(3, '0')
      + (""+a).padStart(3, '0')
      ) + '.mp3'
  //
  let baseurl
  let time_id
  //
  return {
    show: () => {
      clearTimeout(time_id); time_id = null
      player.style.visibility = 'visible'
      player.style.opacity = 1
    },
    hide: () => {
      clearTimeout(time_id)
      player.style.opacity = 0
      time_id = setTimeout(() => {
        player.style.visibility = 'hidden'
        time_id = null
      }, 500)  // matching the 0.5s transition on opacity in the css
    },
    blink: () => {
      clearTimeout(time_id)
      player.style.transition = 'opacity 0.2s'
      player.style.opacity = 0
      time_id = setTimeout(() => {
        player.style.opacity = 1
        player.style.transition = ""
        time_id = null
      }, 300)
    },
    //
    can: () => baseurl != null,
    getqari: () =>
      !baseurl ? "" :
      !baseurl.startsWith(mainserver) ? baseurl
        : baseurl.slice(mainserver.length, baseurl.length-1),
    setqari: (q) => {
      if (!q) { baseurl = null }
      else if (!q.includes('/')) { baseurl = mainserver + q + '/' }
      else {
        baseurl = q.slice(q.length-1) !== '/' ? q + '/' : q
      }
      //
      const can = audio.can()
      can && !helping ? audio.show() : audio.hide()
      //
      if (player.src) {
        if (can) {
          const file = player.src.replace(/^.*\//, "")
          player.src = baseurl + file
        }
        else {
          player.pause()
          player.removeAttribute('src')
        }
      }
    },
    play: (p, w, nopreload, norestart, noplay) => {
      const [s, a] = page_word_to_sura_aaya(p, w)
      const url = sa2url(s, a)
      if (norestart && !player.paused && player.src === url) { return }
      player.src = url
      if (noplay) {
        console.log('load '+s+' '+a)
      }
      else {
        player.play().catch(() => {})
        console.log('play '+s+' '+a)
      }
      // preloading:
      // there is no "onload" event to only preload after the completion of downloading the current file
      player.oncanplaythrough = null
      preloader.oncanplaythrough = null
      if (nopreload) { return }
      if (qs.value) {
        player.oncanplaythrough = audio.fun_preload_next(p, w)
      }
    },
    preload: (p, w) => {
      const [s, a] = page_word_to_sura_aaya(p, w)
      preloader.src = sa2url(s, a)
      console.log('preload '+s+' '+a)
    },
    fun_preload_next: (p, w) => {
      const [s, a] = page_word_to_sura_aaya(p, w)
      if (a === Q.sura_length[s-1]) {  // the last aaya of a sura
        console.log('the last aaya of a sura: '+s+'/'+a+' ?='+Q.sura_length[s-1])
        if (s === 8) {
          console.log('preload 9 1')
          return () => { preloader.src = sa2url(9,1) }
        }
        else if (s === 114) {
          console.log('preload 1 1')
          return () => { preloader.src = sa2url(1,1) }
        }
        else {
          console.log('preload 1 1 then '+(s+1)+' '+1)
          return () => {
            preloader.src = sa2url(1,1)  // basmala
            preloader.oncanplaythrough = () => { preloader.src = sa2url(s+1,1) }
          }
        }
      }
      else {
        console.log('preload '+s+' '+(a+1))
        return () => { preloader.src = sa2url(s,a+1) }
      }
    },
    // preload: (p, w, prev) => {
    //   const [s, a] = page_word_to_sura_aaya(p, w)
    //   preloader.oncanplaythrough = null
    //   if (prev) {
    //     if (a === 1) {
    //       if (s === 1) {
    //         preloader.src = sa2url(114,6)
    //         console.log('preload 114 6')
    //       }
    //       else if (s === 9) {
    //         preloader.src = sa2url(8,75)
    //         console.log('preload 8 75')
    //       }
    //       else {
    //         player.oncanplaythrough = () => {
    //           preloader.src = sa2url(1,1)  // basmala
    //           preloader.oncanplaythrough = () => { preloader.src = sa2url(s-1, Q.sura_length[s-2]) }
    //           console.log('preload 1 1 then '+(s-1)+' '+Q.sura_length[s-2])
    //         }
    //       }
    //     }
    //     else {
    //       preloader.src = sa2url(s,a-1)
    //       console.log('preload '+s+' '+(a-1))
    //     }
    //   }
    //   else {
    //     preloader.src = sa2url(s, a)
    //     console.log('preload '+s+' '+a)
    //   }
    // },
    basmala: (p, w) => {
      audio.play(1, 1, 1)
      audio.preload(p, w+1)
    },
    //
    // hot keys:
    playpause: () => { if (audio.can()) { player.paused ? player.play() : player.pause() } },
    seekforward:  () => { if (audio.can() && player.src) { player.currentTime += 1 } },
    seekbackward: () => { if (audio.can() && player.src) { player.currentTime -= 1 } },
    // ^ seeking unconditionally like that is safe, because the time is clamped to [0,duration]
    // see steps 6 & 7 in https://html.spec.whatwg.org/multipage/media.html#dom-media-seek
  }
})()

const play_this = () => {
  if (audio.can()) {
    if (qs.value === 'a') {
      if (Q.basmalaat[p-1].includes(w-1)) {
        audio.basmala(p, w-1)
        return
      }
      else if (Q.ayat[p-1].includes(w-1)) {
        audio.play(p, w-1)
        return
      }
    }
    else if (qs.value === 'b') {
      if (w === Q.words[p-1].length) {  // needs to be checked before Q.ayat[] otherwise repeats the last aaya of a page
        const ww = Q.headers[p][0] === 0 ? 1 : 0
        if (Q.basmalaat[p][0] === ww) {
          audio.basmala(p+1, ww)
          return
        }
        else {
          audio.play(p+1, ww)
          return
        }
      }
      else if (Q.basmalaat[p-1].includes(w)) {
        audio.basmala(p, w)
        return
      }
      else if (Q.basmalaat[p-1].includes(w-1) || p === 187 && w === 1 || Q.ayat[p-1].includes(w-1)) {
        audio.play(p, w)
        return
      }
      else if (w === 0 || Q.headers[p-1][0] === 0 && w === 1) {
        // this will be repeated: once on the last aaya of a page, then on the start of the next page
        // I play it again only if it's not already playing
        audio.play(p, w, 0, 1)  // norestart
        return
      }
    }
    return 1  // to preload if moved by pages and didn't play anything
  }
}

const play_or_preload_this = () => {
  if (audio.can() && qs.value /* auto-reciting */ && play_this() /* didn't play anything */) {
    audio.play(p, w, 0, 0, 1)  // just load the current aaya into the player (then preload the next) but don't play it
  }
}

