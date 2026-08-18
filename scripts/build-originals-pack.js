/**
 * 📜 build-originals-pack.js — build the bundled original-languages study pack.
 *
 * ORIGINAL LANGUAGES (user decision, 2026-06-21; flagship #1 of the feature
 * backlog): tap a verse → a panel of the ORIGINAL Hebrew/Greek words, each with
 * its Strong's number, transliteration, gloss, and (next batch) every other
 * place it appears. Faithful, offline, public-domain/CC-BY data — the app's DNA.
 *
 * SOURCES (all CC-BY / public domain):
 *   - Hebrew OT + Greek NT word data: STEPBible "Translators Amalgamated"
 *     TAHOT (Hebrew) + TAGNT (Greek), by Tyndale House Cambridge, CC BY 4.0.
 *     https://github.com/STEPBible/STEPBible-Data  — per word: original text,
 *     transliteration, dStrongs, gloss (Greek rows also carry a Spanish gloss).
 *   - Strong's lexicon (definitions): openscriptures/strongs (public domain),
 *     greek + hebrew dictionaries — per Strong's: lemma, translit, definition.
 *
 * FIDELITY GUARANTEES:
 *   - STEPBible book codes map to canonical 1..66 book_id; the build ABORTS on
 *     any unknown code (no silent loss of a book).
 *   - Every word's (book_id, chapter, verse) is DB-VERIFIED against the bundled
 *     bible-seed.db; words for a verse not in our text are dropped + reported.
 *   - Strong's tokens are normalised to the lexicon's key form (G0976→G976,
 *     H7225G→H7225); a word whose primary Strong's isn't a real lexicon entry
 *     still ships its text/translit/gloss (prefixes/particles), strongs=null.
 *   - DETERMINISTIC: rows written in (book_id, chapter, verse, position) order.
 *
 * OUTPUT: assets/originals.db (or a passed path) — tables
 *   original_words(book_id, chapter, verse, position, lang, word, translit,
 *                  gloss_en, gloss_es, strongs, grammar)
 *   strongs_lexicon(strongs, lang, lemma, translit, definition, kjv_def)
 *
 * Requires Node ≥ 22 (node:sqlite). Usage:
 *   node --experimental-sqlite scripts/build-originals-pack.js [outPath]
 * Sources are downloaded into a cache dir (skipped if already present).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');
const {DatabaseSync} = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const SEED = path.join(ROOT, 'assets', 'bible-seed.db');
// ~30 MB → a DOWNLOADABLE pack (NOT bundled in the APK / NOT committed). Staged
// on the Desktop like the translation packs, ready to deploy to Pages.
const OUT =
  process.argv[2] ||
  path.join(os.homedir(), 'Desktop', 'originals-pack', 'originals.db');
const CACHE = path.join(os.tmpdir(), 'originals-src');

const RAW = 'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master';
const DIR = 'Translators Amalgamated OT+NT';
const STEP_FILES = [
  {
    f: 'tahot-gen-deu.txt',
    lang: 'H',
    url: `${RAW}/${DIR}/TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`,
  },
  {
    f: 'tahot-jos-est.txt',
    lang: 'H',
    url: `${RAW}/${DIR}/TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`,
  },
  {
    f: 'tahot-job-sng.txt',
    lang: 'H',
    url: `${RAW}/${DIR}/TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`,
  },
  {
    f: 'tahot-isa-mal.txt',
    lang: 'H',
    url: `${RAW}/${DIR}/TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt`,
  },
  {
    f: 'tagnt-mat-jhn.txt',
    lang: 'G',
    url: `${RAW}/${DIR}/TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt`,
  },
  {
    f: 'tagnt-act-rev.txt',
    lang: 'G',
    url: `${RAW}/${DIR}/TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt`,
  },
];
const DICTS = [
  {
    f: 'strongs-greek.js',
    lang: 'G',
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js',
  },
  {
    f: 'strongs-hebrew.js',
    lang: 'H',
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js',
  },
];

/** STEPBible 3-letter book code → canonical 1..66 book_id. */
const STEP_BOOK_TO_ID = {
  Gen: 1,
  Exo: 2,
  Lev: 3,
  Num: 4,
  Deu: 5,
  Jos: 6,
  Jdg: 7,
  Rut: 8,
  '1Sa': 9,
  '2Sa': 10,
  '1Ki': 11,
  '2Ki': 12,
  '1Ch': 13,
  '2Ch': 14,
  Ezr: 15,
  Neh: 16,
  Est: 17,
  Job: 18,
  Psa: 19,
  Pro: 20,
  Ecc: 21,
  Sng: 22,
  Isa: 23,
  Jer: 24,
  Lam: 25,
  Ezk: 26,
  Dan: 27,
  Hos: 28,
  Jol: 29,
  Amo: 30,
  Oba: 31,
  Jon: 32,
  Mic: 33,
  Nam: 34,
  Hab: 35,
  Zep: 36,
  Hag: 37,
  Zec: 38,
  Mal: 39,
  Mat: 40,
  Mrk: 41,
  Luk: 42,
  Jhn: 43,
  Act: 44,
  Rom: 45,
  '1Co': 46,
  '2Co': 47,
  Gal: 48,
  Eph: 49,
  Php: 50,
  Col: 51,
  '1Th': 52,
  '2Th': 53,
  '1Ti': 54,
  '2Ti': 55,
  Tit: 56,
  Phm: 57,
  Heb: 58,
  Jas: 59,
  '1Pe': 60,
  '2Pe': 61,
  '1Jn': 62,
  '2Jn': 63,
  '3Jn': 64,
  Jud: 65,
  Rev: 66,
};

function ensureCached() {
  if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE, {recursive: true});
  for (const {f, url} of [...STEP_FILES, ...DICTS]) {
    const dest = path.join(CACHE, f);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) continue;
    console.log(`⬇️  ${f}`);
    // The STEPBible paths contain spaces — encode them for curl.
    execFileSync('curl', [
      '-sL',
      '--max-time',
      '300',
      '-o',
      dest,
      encodeURI(url),
    ]);
  }
}

/**
 * Normalise a STEPBible Strong's token to the openscriptures lexicon key:
 * strip braces/spaces, keep the leading H/G + digits, drop leading zeros and
 * any trailing disambiguation letter. "{H7225G}"→"H7225", "G0976"→"G976".
 * Returns null for prefix/grammar codes (H9xxx) or anything non-numeric.
 */
function normalizeStrongs(raw) {
  if (!raw) return null;
  const m = raw
    .replace(/[{}]/g, '')
    .trim()
    .match(/^([HG])0*(\d+)/);
  if (!m) return null;
  const lang = m[1];
  const num = parseInt(m[2], 10);
  if (!num) return null;
  // H9000+ are STEPBible prefix/particle markers, not real Strong's entries.
  if (lang === 'H' && num >= 9000) return null;
  return `${lang}${num}`;
}

/** Pick the PRIMARY Strong's from a dStrongs cell (the {braced} content word,
 *  or the part after « , else the first token). */
function primaryStrongs(cell) {
  if (!cell) return null;
  const braced = cell.match(/\{([HG][^}]*)\}/);
  if (braced) return normalizeStrongs(braced[1]);
  const after = cell.includes('«') ? cell.split('«').pop() : cell;
  const tok = after.split(/[=\s|/]/).find(t => /^[HG]\d/.test(t));
  return normalizeStrongs(tok);
}

/** Clean a Hebrew word: join morphemes (/), drop trailing punctuation (\…). */
function cleanHebrew(w) {
  return w.split('\\')[0].replace(/\//g, '').trim();
}

/** Parse a STEPBible file into word rows (verified later against the seed).
 *  A verse straddling a versification difference between editions (e.g. the
 *  Pericope Adulterae's Jhn.7.53, or Rom.16.25's doxology-placement variants)
 *  carries an inline `{altChapter.altVerse}` annotation right after OUR
 *  verse number, before the `#position` marker — e.g. "Jhn.7.53{8.1}#01".
 *  Without tolerating it here the row silently fails to match and the whole
 *  word is dropped, even though it belongs to a real, addressable verse.
 *  TAHOT also carries an `=X` flag (vs. the normal `=L`, Leningrad Codex) on
 *  ~130 rows: words that exist ONLY as a Hebrew retroversion of the LXX
 *  apparatus (per the file's own header note), never in the Masoretic running
 *  text every version here actually translates. They reuse the verse's own
 *  1-based position numbering, so importing them both fabricates text that
 *  isn't in the verse AND collides key-for-key with the real word at that
 *  position (e.g. Deu.30.16, Jdg.16.14, 2Sa.23.33, 2Ki.25.3). Skip them. */
function* parseStep(text, lang) {
  const lines = text.split(/\r?\n/);
  const rowRe =
    /^([A-Za-z0-9]{2,4})\.(\d+)\.(\d+)(?:\{[^}]*\})?#(\d+)=([A-Za-z()]+)/;
  for (const line of lines) {
    const m = rowRe.exec(line);
    if (!m) continue;
    if (lang === 'H' && m[5] === 'X') continue;
    const c = line.split('\t');
    const [, code, chStr, vStr, posStr] = m;
    const bookId = STEP_BOOK_TO_ID[code];
    if (bookId === undefined) {
      throw new Error(`Unknown STEPBible book code "${code}" in "${c[0]}"`);
    }
    let word, translit, glossEn, glossEs, strongsCell, grammarCell;
    if (lang === 'G') {
      // [1] "Βίβλος (Biblos)" [2] Eng translation [3] dStrongs=Grammar
      // [4] "lemma=gloss" [8] Spanish translation
      const greek = (c[1] || '').trim();
      const paren = greek.match(/\(([^)]+)\)\s*$/);
      word = greek.replace(/\s*\([^)]*\)\s*$/, '').trim();
      translit = paren ? paren[1].trim() : '';
      const dict = (c[4] || '').split('=');
      glossEn = (dict[1] || c[2] || '').trim();
      glossEs = (c[8] || '').trim();
      strongsCell = c[3] || '';
      grammarCell = (c[3] || '').split('=')[1] || '';
    } else {
      // [1] word [2] translit [3] glossEn [4] dStrongs [5] morph
      word = cleanHebrew(c[1] || '');
      translit = (c[2] || '').trim();
      glossEn = (c[3] || '').replace(/\//g, ' ').replace(/\s+/g, ' ').trim();
      glossEs = '';
      strongsCell = c[4] || '';
      grammarCell = (c[5] || '').trim();
    }
    if (!word) continue;
    yield {
      bookId,
      chapter: Number(chStr),
      verse: Number(vStr),
      position: Number(posStr),
      lang,
      word,
      translit,
      glossEn,
      glossEs,
      strongs: primaryStrongs(strongsCell),
      grammar: grammarCell || null,
    };
  }
}

function buildLexicon(out) {
  const ins = out.prepare(
    `INSERT OR IGNORE INTO strongs_lexicon
       (strongs, lang, lemma, translit, definition, kjv_def)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  let n = 0;
  for (const {f, lang} of DICTS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dict = require(path.join(CACHE, f));
    for (const key of Object.keys(dict)) {
      const norm = normalizeStrongs(key);
      if (!norm) continue;
      const e = dict[key];
      ins.run(
        norm,
        lang,
        (e.lemma || '').trim() || null,
        (e.translit || '').trim() || null,
        (e.strongs_def || e.definition || '').trim() || null,
        (e.kjv_def || '').trim() || null,
      );
      n++;
    }
  }
  return n;
}

function main() {
  ensureCached();

  // Verse-existence set from the seed (DB-verify).
  const seed = new DatabaseSync(SEED);
  const verseSet = new Set();
  for (const r of seed
    .prepare('SELECT DISTINCT book_id, chapter, verse FROM verses')
    .all()) {
    verseSet.add(`${r.book_id}.${r.chapter}.${r.verse}`);
  }
  seed.close();

  const rows = [];
  const stats = {total: 0, deadVerse: 0, noStrongs: 0, books: new Set()};
  for (const {f, lang} of STEP_FILES) {
    const text = fs.readFileSync(path.join(CACHE, f), 'utf8');
    for (const w of parseStep(text, lang)) {
      stats.total++;
      if (!verseSet.has(`${w.bookId}.${w.chapter}.${w.verse}`)) {
        stats.deadVerse++;
        continue;
      }
      if (!w.strongs) stats.noStrongs++;
      stats.books.add(w.bookId);
      rows.push(w);
    }
  }
  rows.sort(
    (a, b) =>
      a.bookId - b.bookId ||
      a.chapter - b.chapter ||
      a.verse - b.verse ||
      a.position - b.position,
  );

  fs.mkdirSync(path.dirname(OUT), {recursive: true});
  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
  const out = new DatabaseSync(OUT);
  out.exec('PRAGMA journal_mode=DELETE; PRAGMA page_size=4096;');
  out.exec(`CREATE TABLE original_words (
    book_id INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL,
    position INTEGER NOT NULL, lang TEXT NOT NULL, word TEXT NOT NULL,
    translit TEXT, gloss_en TEXT, gloss_es TEXT, strongs TEXT, grammar TEXT
  )`);
  out.exec(`CREATE TABLE strongs_lexicon (
    strongs TEXT PRIMARY KEY, lang TEXT NOT NULL, lemma TEXT, translit TEXT,
    definition TEXT, kjv_def TEXT
  )`);

  const insW = out.prepare(
    `INSERT INTO original_words
       (book_id, chapter, verse, position, lang, word, translit, gloss_en, gloss_es, strongs, grammar)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  out.exec('BEGIN');
  for (const w of rows) {
    insW.run(
      w.bookId,
      w.chapter,
      w.verse,
      w.position,
      w.lang,
      w.word,
      w.translit || null,
      w.glossEn || null,
      w.glossEs || null,
      w.strongs,
      w.grammar,
    );
  }
  const lexCount = buildLexicon(out);
  out.exec('COMMIT');
  out.exec('VACUUM');
  out.close();

  const bytes = fs.statSync(OUT).size;
  console.log(
    '— dropped/notes —',
    JSON.stringify({
      total: stats.total,
      deadVerse: stats.deadVerse,
      noStrongs: stats.noStrongs,
    }),
  );
  console.log(
    `✅ ${rows.length} original words over ${stats.books.size} books + ${lexCount} lexicon entries`,
  );
  console.log(`   ${OUT}  ${bytes} B (${(bytes / 1048576).toFixed(2)} MB)`);
}

main();
