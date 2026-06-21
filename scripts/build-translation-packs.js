/**
 * 📦 build-translation-packs.js — build the downloadable translation packs
 * (Translation Packs feature, phase 1 — see DOCS/TRANSLATION_PACKS_DESIGN.md).
 *
 * Produces one tiny SQLite pack per public-domain version:
 *   - WEB (World English Bible)   — source: getbible.net v2 (clean, one file)
 *   - BSB (Berean Standard Bible) — source: bereanbible.com/bsb.txt (authoritative PD)
 *
 * Each pack holds a SINGLE `verses(book_id, book_name, chapter, verse, text)`
 * table — NO version column (added at import time), NO FTS (the app's FTS5
 * triggers auto-index on INSERT). `book_name` is forced to the canonical English
 * name keyed by `book_id` (identical to the bundled KJV), so navigation/search
 * resolve regardless of the source's spelling.
 *
 * Import on device is `ATTACH pack; INSERT INTO verses SELECT …, 'WEB';` — the
 * `UNIQUE(book_id,chapter,verse,version)` constraint makes re-import idempotent.
 *
 * Content is DB-verified by `book_id` against the bundled assets/bible-seed.db
 * KJV book/verse structure. The ~16 verses BSB omits (Matt 17:21, 18:11, 23:14;
 * Mark 7:16, 9:44, 9:46, 11:26, 15:28; Luke 17:36, 23:17; John 5:4; Acts 8:37,
 * 15:34, 24:7, 28:29; Romans 16:24) are the standard critical-text omissions —
 * absent on purpose; the reader degrades to "…" for them.
 *
 * Requires: `curl` + a `sqlite3` binary on PATH (or set SQLITE3=/path/to/sqlite3).
 * Usage:    node scripts/build-translation-packs.js [outDir]   (default ./packs-out)
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const OUT = path.resolve(process.argv[2] || 'packs-out');
const SQLITE3 = process.env.SQLITE3 || 'sqlite3';

const NAMES = [
  null,
  'Genesis',
  'Exodus',
  'Leviticus',
  'Numbers',
  'Deuteronomy',
  'Joshua',
  'Judges',
  'Ruth',
  '1 Samuel',
  '2 Samuel',
  '1 Kings',
  '2 Kings',
  '1 Chronicles',
  '2 Chronicles',
  'Ezra',
  'Nehemiah',
  'Esther',
  'Job',
  'Psalms',
  'Proverbs',
  'Ecclesiastes',
  'Song of Solomon',
  'Isaiah',
  'Jeremiah',
  'Lamentations',
  'Ezekiel',
  'Daniel',
  'Hosea',
  'Joel',
  'Amos',
  'Obadiah',
  'Jonah',
  'Micah',
  'Nahum',
  'Habakkuk',
  'Zephaniah',
  'Haggai',
  'Zechariah',
  'Malachi',
  'Matthew',
  'Mark',
  'Luke',
  'John',
  'Acts',
  'Romans',
  '1 Corinthians',
  '2 Corinthians',
  'Galatians',
  'Ephesians',
  'Philippians',
  'Colossians',
  '1 Thessalonians',
  '2 Thessalonians',
  '1 Timothy',
  '2 Timothy',
  'Titus',
  'Philemon',
  'Hebrews',
  'James',
  '1 Peter',
  '2 Peter',
  '1 John',
  '2 John',
  '3 John',
  'Jude',
  'Revelation',
];
const NAME_TO_ID = {};
for (let i = 1; i <= 66; i++) NAME_TO_ID[NAMES[i]] = i;
NAME_TO_ID['Psalm'] = 19; // BSB's only spelling difference.

const clean = t => String(t).replace(/\s+/g, ' ').trim();

function dl(url, file) {
  execFileSync('curl', ['-s', '-m', '120', '-L', '-o', file, url], {
    stdio: 'inherit',
  });
}

function rowsWeb(file) {
  const o = JSON.parse(fs.readFileSync(file, 'utf8'));
  const rows = [];
  for (const b of o.books) {
    if (!NAMES[b.nr]) throw new Error('WEB bad book nr ' + b.nr);
    for (const c of b.chapters)
      for (const v of c.verses) {
        const text = clean(v.text);
        if (text) rows.push([b.nr, NAMES[b.nr], c.chapter, v.verse, text]);
      }
  }
  return rows;
}

function rowsBsb(file) {
  const rows = [];
  for (const ln of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const tab = ln.indexOf('\t');
    if (tab < 0) continue;
    const m = ln
      .slice(0, tab)
      .trim()
      .match(/^(.+) (\d+):(\d+)$/);
    if (!m) continue;
    const id = NAME_TO_ID[m[1]];
    if (!id) throw new Error('BSB unmapped book "' + m[1] + '"');
    const text = clean(ln.slice(tab + 1));
    if (text) rows.push([id, NAMES[id], Number(m[2]), Number(m[3]), text]);
  }
  return rows;
}

function buildPack(rows, dbFile) {
  const esc = s => "'" + s.replace(/'/g, "''") + "'";
  const sql = [
    'PRAGMA journal_mode=OFF;',
    'PRAGMA synchronous=OFF;',
    'CREATE TABLE verses (book_id INTEGER NOT NULL, book_name TEXT NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, text TEXT NOT NULL);',
    'BEGIN;',
  ];
  for (let i = 0; i < rows.length; i += 1000)
    sql.push(
      'INSERT INTO verses (book_id,book_name,chapter,verse,text) VALUES ' +
        rows
          .slice(i, i + 1000)
          .map(r => `(${r[0]},${esc(r[1])},${r[2]},${r[3]},${esc(r[4])})`)
          .join(',') +
        ';',
    );
  sql.push('COMMIT;');
  const sqlFile = dbFile + '.sql';
  fs.writeFileSync(sqlFile, sql.join('\n'));
  fs.rmSync(dbFile, {force: true});
  execFileSync(SQLITE3, [dbFile], {input: fs.readFileSync(sqlFile)});
  fs.rmSync(sqlFile, {force: true});
}

function main() {
  fs.mkdirSync(OUT, {recursive: true});
  const webJson = path.join(OUT, 'web.json');
  const bsbTxt = path.join(OUT, 'bsb.txt');
  console.log('Downloading sources…');
  dl('https://api.getbible.net/v2/web.json', webJson);
  dl('https://bereanbible.com/bsb.txt', bsbTxt);

  const specs = [
    {
      id: 'WEB',
      name: 'World English Bible',
      year: '2000',
      rows: rowsWeb(webJson),
    },
    {
      id: 'BSB',
      name: 'Berean Standard Bible',
      year: '2022',
      rows: rowsBsb(bsbTxt),
    },
  ];

  const out = [];
  for (const s of specs) {
    const db = path.join(OUT, s.id.toLowerCase() + '.sqlite');
    buildPack(s.rows, db);
    const buf = fs.readFileSync(db);
    const sha = require('crypto')
      .createHash('sha256')
      .update(buf)
      .digest('hex');
    console.log(
      `${s.id}: ${s.rows.length} verses -> ${db} (${buf.length} bytes)`,
    );
    out.push({
      id: s.id,
      name: s.name,
      abbreviation: s.id,
      language: 'en',
      year: s.year,
      license: 'Public Domain',
      url: `https://eternalstonebible.github.io/packs/${s.id.toLowerCase()}.sqlite`,
      bytes: buf.length,
      sha256: sha,
      verseCount: s.rows.length,
    });
  }
  fs.writeFileSync(
    path.join(OUT, 'versions.json'),
    JSON.stringify({schema: 1, versions: out}, null, 2) + '\n',
  );
  fs.rmSync(webJson, {force: true});
  fs.rmSync(bsbTxt, {force: true});
  console.log('Wrote', path.join(OUT, 'versions.json'));
  console.log(
    'Upload the *.sqlite + versions.json to the Pages repo under /packs/.',
  );
}

main();
