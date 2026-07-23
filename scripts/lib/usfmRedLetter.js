/**
 * \wj ("words of Jesus" / red-letter) span extractor for eBible.org's USFM
 * Bible distributions.
 *
 * STATUS (see the red-letter-web spike report): this parser is verified
 * against eBible.org's own WEB-family USFM text and correctly reproduces
 * their own \wj markup as character-offset spans over a fully-stripped
 * plain-text rendering of each verse. It is intentionally SOURCE-AGNOSTIC —
 * it does not know or care what Bible text this app currently bundles.
 *
 * IMPORTANT — what this module does NOT do: it does not anchor/align its
 * output onto THIS APP'S bundled WEB verse text (src/lib/database/bible-data-web.ts).
 * That text was fetched from getbible.net (see scripts/fetch-web-data.js) and
 * was independently confirmed, verse-by-verse, to be a DIFFERENT revision of
 * the WEB translation than any current eBible.org WEB edition (eng-web
 * "Classic", engwebu "Updated", engwmb "World Messianic Bible", engwebp) —
 * only ~35% of all 31,095 verses are byte-identical, and even a lenient
 * substring-anchor check (does each \wj-quoted span appear verbatim inside
 * the app's own wording of that verse?) only succeeds for ~66% of the ~2,059
 * verses eBible marks as words of Jesus. Applying this parser's offsets
 * directly to the app's own verse text would silently misalign roughly a
 * third of all red-letter spans — unacceptable for the words of Christ.
 * Until that source mismatch is resolved (see the report for the options),
 * this module's output should only be used against eBible's OWN text, or as
 * an input to a (not-yet-built, carefully human-reviewed) alignment step.
 *
 * Algorithm, in short, for one verse's raw USFM (still containing \wj, \w,
 * \+w, \f, \x markers):
 *   1. Strip footnotes (\f + ... \f*) and cross-references (\x + ... \x*)
 *      wholesale — they never belong in reading text, regardless of \wj
 *      state, and eBible sometimes splits a single continuous quotation
 *      around one (e.g. John 3:16 splits "only born" from "Son" around its
 *      \f explaining "μονογενη").
 *   2. Scan left to right, tracking whether we're inside \wj ... \wj*,
 *      unwrapping \w WORD|strong="..."\w* / \+w WORD|strong="..."\+w* word
 *      tokens to their plain WORD text, and stripping any other USFM
 *      command tag (paragraph/poetry markers etc.) with no text of its own.
 *   3. Collapse whitespace runs to a single space. A collapsed space is
 *      still considered "words of Jesus" ONLY if the nearest real character
 *      before AND after it both were — this is what correctly re-joins a
 *      quote eBible split around a footnote (case 1) while NOT bridging two
 *      genuinely separate quotes that have real narration text between them
 *      (e.g. "...” Then he said, “...").
 *   4. Emit the final plain text plus the maximal runs of "words of Jesus"
 *      characters as {start, end} (end-exclusive) spans into that text.
 */

/** Footnote/cross-reference blocks never belong in reading text. */
function stripFootnotesAndXrefs(s) {
  return s
    .replace(/\\f \+[\s\S]*?\\f\*/g, '')
    .replace(/\\x \+[\s\S]*?\\x\*/g, '');
}

// \w WORD|strong="..."\w*  or  \+w WORD|strong="..."\+w* — group 1 is the
// optional "+" prefix (backreferenced so an open \+w only matches its own
// \+w* close, never a bare \w*), group 2 is the word's plain text.
const WORD_RE = /\\(\+?)w\s+([\s\S]*?)\|[^\\]*\\\1w\*/g;

/**
 * Extract the "words of Jesus" spans from one verse's raw USFM text (the
 * `\v N ` prefix already removed).
 *
 * @param {string} rawVerse
 * @returns {{plainText: string, spans: Array<{start: number, end: number}>}}
 */
function extractRedLetterSpans(rawVerse) {
  const s = stripFootnotesAndXrefs(rawVerse);
  const chars = []; // {ch, wj}
  let wjActive = false;
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('\\wj*', i)) {
      wjActive = false;
      i += 4;
      continue;
    }
    if (s.startsWith('\\wj', i)) {
      wjActive = true;
      i += 3;
      continue;
    }
    WORD_RE.lastIndex = i;
    const m = WORD_RE.exec(s);
    if (m && m.index === i) {
      for (const ch of m[2]) chars.push({ch, wj: wjActive});
      i += m[0].length;
      continue;
    }
    const otherTag = /^\\[a-zA-Z0-9]+\*?/.exec(s.slice(i));
    if (otherTag) {
      i += otherTag[0].length;
      continue;
    }
    chars.push({ch: s[i], wj: wjActive});
    i += 1;
  }

  // Collapse whitespace runs to a single space (see algorithm doc above for
  // why the collapsed space's flag looks at its real neighbors, not the
  // (removed) content of the run itself).
  const out = [];
  let k = 0;
  while (k < chars.length) {
    if (/\s/.test(chars[k].ch)) {
      let j = k;
      while (j < chars.length && /\s/.test(chars[j].ch)) j++;
      const before = out.length > 0 ? out[out.length - 1].wj : false;
      const after = j < chars.length ? chars[j].wj : false;
      if (out.length > 0 && j < chars.length) {
        out.push({ch: ' ', wj: before && after});
      }
      k = j;
      continue;
    }
    out.push(chars[k]);
    k++;
  }
  while (out.length && out[0].ch === ' ') out.shift();
  while (out.length && out[out.length - 1].ch === ' ') out.pop();

  const plainText = out.map(o => o.ch).join('');
  const spans = [];
  let spanStart = null;
  for (let idx = 0; idx < out.length; idx++) {
    if (out[idx].wj && spanStart === null) spanStart = idx;
    if (!out[idx].wj && spanStart !== null) {
      spans.push({start: spanStart, end: idx});
      spanStart = null;
    }
  }
  if (spanStart !== null) spans.push({start: spanStart, end: out.length});

  return {plainText, spans};
}

// A verse continues onto a following physical line when that line opens
// with one of these paragraph/poetry markers (common in eBible's USFM for
// poetry — Psalms-style \q1/\q2 — and plain paragraph breaks \p/\m/\nb).
// Section headings (\s1), parallel-reference notes (\r) and front matter
// are deliberately NOT in this list — they never carry verse text.
const CONTINUATION_RE = /^\\(p|q1|q2|q3|q|m|nb|b|li1|li2|pi1|pi2)\b\s?/;

/**
 * Parse one USFM book file's text into a flat list of verse records,
 * stitching each verse's continuation lines (poetry/paragraph breaks with
 * no new \v) back together with a single joining space. `raw` still
 * contains USFM markup (including any \wj) — pass it to
 * `extractRedLetterSpans` next.
 *
 * @param {string} usfmText
 * @returns {Array<{book: string, chapter: number, verse: number, raw: string}>}
 */
function parseUsfmBook(usfmText) {
  const lines = usfmText.split('\n');
  let curBook = null;
  let curChapter = 0;
  let curVerse = null;
  let buf = [];
  const verses = [];
  const flush = () => {
    if (curBook && curVerse != null) {
      verses.push({
        book: curBook,
        chapter: curChapter,
        verse: curVerse,
        raw: buf.join(' '),
      });
    }
    buf = [];
  };
  for (const line of lines) {
    const idm = line.match(/^\\id (\S+)/);
    if (idm) {
      curBook = idm[1];
      continue;
    }
    const cm = line.match(/^\\c (\d+)/);
    if (cm) {
      flush();
      curChapter = parseInt(cm[1], 10);
      curVerse = null;
      continue;
    }
    const vm = line.match(/^\\v (\d+)\s?(.*)$/);
    if (vm) {
      flush();
      curVerse = parseInt(vm[1], 10);
      buf = [vm[2]];
      continue;
    }
    if (curVerse != null && CONTINUATION_RE.test(line)) {
      buf.push(line.replace(CONTINUATION_RE, ''));
    }
  }
  flush();
  return verses;
}

/**
 * Parse + extract in one call: every verse in a USFM book file, with its
 * fully-stripped plain text and \wj spans within that text.
 *
 * @param {string} usfmText
 * @returns {Array<{book: string, chapter: number, verse: number, plainText: string, spans: Array<{start: number, end: number}>}>}
 */
function extractBookRedLetter(usfmText) {
  return parseUsfmBook(usfmText).map(v => {
    const {plainText, spans} = extractRedLetterSpans(v.raw);
    return {...v, plainText, spans};
  });
}

module.exports = {
  stripFootnotesAndXrefs,
  extractRedLetterSpans,
  parseUsfmBook,
  extractBookRedLetter,
};
