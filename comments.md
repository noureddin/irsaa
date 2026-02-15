
insert == true → insert mode (possibly while showing help)
insert == false → normal mode (possibly while showing help)
Note: insert can be true while txt is hidden; that's at the end of a page before flipping.

Irsaa is modal (like vi/Vim): it has two primary modes (and an auxiliary one or two)
  and the user switches between them:
1. The Normal Mode (وضع الإظهار):
   - Equivalent to the no-typing Uthmani mode in Recite.
   - Space and Backspace show and hide words and move between pages when necessary.
2. The Insert Mode (وضع الكتابة):
   - Equivalent to the typing Imlaai mode in Recite.
3. The Help pseudo-Mode (وضع الحوار):
   - Shows a dialog over the screen with help and options and go-to commands.
4. The Loading pseudo-pseudo-Mode (وضع التحميل):
   - Most input is disabled; current page says "يحمّل".
Switching between modes:
In the Normal Mode: Enter enters the Insert Mode, and Esc shows Help.
In the Insert Mode: Esc goes to the Normal Mode, and F1 shows Help.
In the Help   Mode: Esc goes to the previous mode.


NOTE:
- Everywhere in this codebase, p is the 1-based number of the page.
  The ONLY except is when accessing arrays, because they are 0-based.
  The arrays indexed by page numbers are: page_offset, Q.words, Q.lineends, Q.ayat.
- Everywhere in this codebase, w is the number of words currently shown
  on the page; ie, it's the 0-based index of the next word (ie, the word
  that is being typed by the user right now).
  A full page is when w === Q.words[p-1].length.

