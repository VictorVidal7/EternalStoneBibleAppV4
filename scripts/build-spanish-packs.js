/**
 * 📦 build-spanish-packs.js — build the downloadable SPANISH translation packs.
 *
 * Adds two public-domain, COMPLETE Spanish versions to the pack catalog so the
 * Spanish reader gets faithful alternatives beyond the bundled RVR1960:
 *   - RV1909  (Reina Valera 1909)        — source: getbible.net v2 "valera"
 *   - SSE1569 (Sagradas Escrituras 1569) — source: getbible.net v2 "sse"
 *                                          (Casiodoro de Reina — Biblia del Oso)
 *
 * Each pack is the SAME shape the device importer expects: a single
 * `verses(book_id, book_name, chapter, verse, text)` table — NO `version`
 * column (added at import time), NO FTS (the app's FTS5 trigger auto-indexes on
 * INSERT). `book_name` is forced to the canonical SPANISH name keyed by book_id,
 * taken from the bundled RVR1960 data, so navigation/search/display line up
 * exactly with the bundled Spanish version.
 *
 * CLEANING (deterministic):
 *   - both: strip pilcrows (¶, paragraph markers), collapse whitespace, trim.
 *   - RV1909 only: normalize the chapter-opening DROP-CAPS. The 1909 typesetting
 *     renders the first word(s) of each chapter (and the Psalm 119 / acrostic
 *     section letters) in ALL-CAPS ("EN el principio", "JEHOVÁ es mi pastor",
 *     "DE SIETE años"). We sentence-case that leading run (cap first letter +
 *     first letter after . ! ?, lowercase the rest) and then RESTORE proper
 *     nouns (Moisés / David / Jesús …) that the source caps as the 2nd word of
 *     a "Y MOISÉS …" opening. SSE 1569 is already cased normally (only ¶ noise),
 *     so it is NOT drop-cap-normalized (its lone emphatic all-caps verse,
 *     Josué 22:22, is faithful to the 1569 source).
 *
 * Content is DB-verified by book_id: 66 books, John 3:16 (book_id 43) present,
 * verse count, no empty text, every book_id in 1..66.
 *
 * Requires Node ≥ 22 (node:sqlite). `curl` on PATH for the (one-time) download.
 * Usage:
 *   node --experimental-sqlite scripts/build-spanish-packs.js [outDir]
 *   (default outDir: %USERPROFILE%/Desktop/translation-packs)
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const {execFileSync} = require('child_process');
const {DatabaseSync} = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const OUT =
  process.argv[2] || path.join(os.homedir(), 'Desktop', 'translation-packs');
const VERSIONS_JSON = path.join(ROOT, 'web', 'packs', 'versions.json');

/** Canonical Spanish book names keyed by book_id, from the bundled RVR1960. */
function spanishNamesById() {
  const file = path.join(ROOT, 'src/lib/database/bible-data-rvr1960.ts');
  const c = fs.readFileSync(file, 'utf8');
  const arr = JSON.parse(c.slice(c.indexOf('['), c.lastIndexOf(']') + 1));
  const byId = {};
  for (const r of arr) if (!byId[r.book_id]) byId[r.book_id] = r.book_name;
  for (let i = 1; i <= 66; i++)
    if (!byId[i]) throw new Error('Missing Spanish name for book_id ' + i);
  return byId;
}

/** Strip pilcrows + collapse whitespace. */
const clean = t => String(t).replace(/¶/g, ' ').replace(/\s+/g, ' ').trim();

/** Proper nouns the 1909 drop-cap may render as a non-first word ("Y MOISÉS"). */
const PROPER = new Set([
  'moisés',
  'david',
  'jesús',
  'jehová',
  'dios',
  'señor',
  'cristo',
  'jesucristo',
  'israel',
  'sión',
  'sion',
  'faraón',
  'aarón',
  'josué',
  'samuel',
  'saúl',
  'salomón',
  'jacob',
  'abraham',
  'isaac',
  'judá',
]);

/**
 * Sentence-case the chapter-opening ALL-CAPS drop-cap run, then restore proper
 * nouns. Only touches text whose leading region (up to the first lowercase
 * letter) contains a run of ≥2 uppercase letters — i.e. a real drop-cap; normal
 * verses pass through unchanged.
 */
function fixDropCaps(t) {
  const idx = t.search(/[a-záéíóúñüïö]/);
  if (idx <= 0) return t;
  const prefix = t.slice(0, idx);
  const rest = t.slice(idx);
  if (!/[A-ZÁÉÍÓÚÑÜ]{2,}/.test(prefix)) return t;
  let out = '';
  let capNext = true;
  for (const ch of prefix) {
    if (/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]/.test(ch)) {
      out += capNext ? ch.toUpperCase() : ch.toLowerCase();
      capNext = false;
    } else {
      out += ch;
      if (/[.!?]/.test(ch)) capNext = true;
    }
  }
  out = out.replace(/[A-Za-zÁÉÍÓÚÑÜáéíóúñü]+/g, w => {
    const low = w.toLowerCase();
    return PROPER.has(low) ? low.charAt(0).toUpperCase() + low.slice(1) : w;
  });
  return out + rest;
}

function dl(url, file) {
  if (fs.existsSync(file) && fs.statSync(file).size > 0) {
    console.log('  using cached', path.basename(file));
    return;
  }
  console.log('  downloading', url);
  execFileSync('curl', ['-s', '-m', '180', '-L', '-o', file, url], {
    stdio: 'inherit',
  });
}

/** getbible JSON -> sorted rows, with Spanish book_name + cleaned text. */
function rowsFromGetbible(file, names, normalize) {
  const o = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = [];
  for (const b of o.books) {
    const id = b.nr;
    if (!(id >= 1 && id <= 66)) throw new Error('bad book nr ' + id);
    for (const c of b.chapters)
      for (const v of c.verses) {
        let text = clean(v.text);
        if (normalize) text = fixDropCaps(text);
        if (text) rows.push([id, names[id], c.chapter, v.verse, text]);
      }
  }
  return rows.sort((a, b) => a[0] - b[0] || a[2] - b[2] || a[3] - b[3]);
}

function buildPack(rows, dbFile) {
  fs.rmSync(dbFile, {force: true});
  const db = new DatabaseSync(dbFile);
  db.exec('PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF;');
  db.exec(
    `CREATE TABLE verses (book_id INTEGER NOT NULL, book_name TEXT NOT NULL,
       chapter INTEGER NOT NULL, verse INTEGER NOT NULL, text TEXT NOT NULL)`,
  );
  const ins = db.prepare(
    `INSERT INTO verses (book_id, book_name, chapter, verse, text)
     VALUES (?, ?, ?, ?, ?)`,
  );
  db.exec('BEGIN');
  for (const r of rows) ins.run(r[0], r[1], r[2], r[3], r[4]);
  db.exec('COMMIT');
  db.exec('VACUUM');
  db.close();
}

function verifyPack(dbFile, expect) {
  const db = new DatabaseSync(dbFile, {readOnly: true});
  const n = db.prepare('SELECT COUNT(*) c FROM verses').get().c;
  const books = db
    .prepare('SELECT COUNT(DISTINCT book_id) b FROM verses')
    .get().b;
  const range = db
    .prepare('SELECT MIN(book_id) lo, MAX(book_id) hi FROM verses')
    .get();
  const empty = db
    .prepare("SELECT COUNT(*) c FROM verses WHERE TRIM(text)=''")
    .get().c;
  const j = db
    .prepare(
      'SELECT text FROM verses WHERE book_id=43 AND chapter=3 AND verse=16',
    )
    .get();
  db.close();
  const ok =
    n === expect &&
    books === 66 &&
    range.lo === 1 &&
    range.hi === 66 &&
    empty === 0 &&
    !!j &&
    j.text.length > 0;
  console.log(
    `  verify ${path.basename(dbFile)}: n=${n} books=${books} ` +
      `range=${range.lo}-${range.hi} empty=${empty} ` +
      `John3:16=${j ? 'present' : 'MISSING'} => ${ok ? 'OK' : 'FAIL'}`,
  );
  if (j) console.log('    John 3:16 =', JSON.stringify(j.text));
  if (!ok) throw new Error('Pack verification FAILED: ' + dbFile);
}

function main() {
  fs.mkdirSync(OUT, {recursive: true});
  const names = spanishNamesById();

  const specs = [
    {
      id: 'RV1909',
      name: 'Reina Valera 1909',
      abbreviation: 'RV1909',
      year: '1909',
      src: 'valera',
      url: 'https://api.getbible.net/v2/valera.json',
      normalize: true,
    },
    {
      id: 'SSE1569',
      name: 'Sagradas Escrituras 1569',
      abbreviation: 'SSE1569',
      year: '1569',
      src: 'sse',
      url: 'https://api.getbible.net/v2/sse.json',
      normalize: false,
    },
  ];

  console.log('Downloading sources…');
  for (const s of specs) dl(s.url, path.join(OUT, s.src + '.json'));

  const entries = [];
  for (const s of specs) {
    console.log(`Building ${s.id}…`);
    const rows = rowsFromGetbible(
      path.join(OUT, s.src + '.json'),
      names,
      s.normalize,
    );
    const dbFile = path.join(OUT, s.id.toLowerCase() + '.sqlite');
    buildPack(rows, dbFile);
    verifyPack(dbFile, rows.length);
    const buf = fs.readFileSync(dbFile);
    fs.writeFileSync(dbFile + '.gz', zlib.gzipSync(buf, {level: 9}));
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    console.log(
      `  ${s.id}: ${rows.length} verses -> ${buf.length} bytes, sha256 ${sha.slice(0, 16)}…`,
    );
    entries.push({
      id: s.id,
      name: s.name,
      abbreviation: s.abbreviation,
      language: 'es',
      year: s.year,
      license: 'Public Domain',
      url: `https://eternalstonebible.github.io/packs/${s.id.toLowerCase()}.sqlite`,
      bytes: buf.length,
      sha256: sha,
      verseCount: rows.length,
    });
  }

  // Update versions.json: keep existing entries, add/replace the two Spanish
  // packs (preserve KJV/BSB exactly so the already-deployed packs stay valid).
  const vj = JSON.parse(fs.readFileSync(VERSIONS_JSON, 'utf8'));
  const newIds = new Set(entries.map(e => e.id));
  const kept = vj.versions.filter(x => !newIds.has(x.id));
  vj.generated = new Date().toISOString().slice(0, 10);
  vj.versions = [...kept, ...entries];
  fs.writeFileSync(VERSIONS_JSON, JSON.stringify(vj, null, 2) + '\n');

  console.log('\nDone.');
  for (const s of specs)
    console.log(`  ${path.join(OUT, s.id.toLowerCase() + '.sqlite')}`);
  console.log(`  ${VERSIONS_JSON} updated (RV1909 + SSE1569 added)`);
  console.log('  Upload the *.sqlite (+.gz) to the Pages repo under /packs/.');
}

main();
