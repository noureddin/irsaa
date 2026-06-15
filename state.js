// global state

// current position and text

let [p, w] = hash_get_pw() || [ load_num('p', 1), load_num('w', 0) ]

// const assert_pw = () => {
//   assert(!isNaN(p) && p >= 1 && p <= 604, 'p is bad')
//   assert(!isNaN(w) && w >= 0 && w <= Q.words[p-1].length, 'w is bad')
// }

let __correct_text
const update_correct_text = () => { __correct_text = get_correct_text(p) }
const correct_word = () => __correct_text[w]


// screen & mode & colors
let insert
let helping = false
let loading = false  // is the current pages still loading, thus don't accept input?

// pending events (to delay certain actions so that a specific thing happens first)
let audiopending = false  // if the page the loaded and the audio is ready to play, wait for the help window to be closed

