/**
 * 🌱 rebuild-seed.js — rebuild the embedded seed DB + the KJV download pack.
 *
 * BUNDLE RESTRUCTURE (user decision, 2026-06-21): the embedded base becomes
 * RVR1960 (es) + WEB (en); KJV (en) + BSB (en) become downloadable packs. This
 * script is the deterministic source of truth for that restructure.
 *
 * Outputs:
 *   - assets/bible-seed.db        ← verses(RVR1960 + WEB) + verses_fts (FTS5
 *                                    external-content) + the 3 verses_ai/ad/au
 *                                    triggers, EXACTLY the schema the app's
 *                                    initialize() expects (src/lib/database/index.ts).
 *   - <packsDir>/kjv.sqlite(.gz)  ← single verses(book_id,book_name,chapter,
 *                                    verse,text) table, NO version col, NO FTS
 *                                    (the device's trigger indexes on import).
 *
 * Sources (all in-repo / local, no network → deterministic):
 *   - RVR1960: src/lib/database/bible-data-rvr1960.ts  (JSON-parseable array)
 *   - WEB:     src/lib/database/bible-data-web.ts      (JSON-parseable array)
 *   - KJV:     the OLD assets/bible-seed.db (read before overwrite); on a re-run
 *              after overwrite, falls back to the existing <packsDir>/kjv.sqlite.
 *
 * Requires Node ≥ 22 (node:sqlite has FTS5). Usage:
 *   node --experimental-sqlite scripts/rebuild-seed.js [packsDir]
 *   (default packsDir: %USERPROFILE%/Desktop/translation-packs)
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const {DatabaseSync} = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const SEED = path.join(ROOT, 'assets', 'bible-seed.db');
const PACKS_DIR =
  process.argv[2] || path.join(os.homedir(), 'Desktop', 'translation-packs');
const VERSIONS_JSON = path.join(ROOT, 'web', 'packs', 'versions.json');

// Exact schema the app expects — mirror of src/lib/database/index.ts.
const SCHEMA = [
  `CREATE TABLE verses (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     book_id INTEGER NOT NULL,
     book_name TEXT NOT NULL,
     chapter INTEGER NOT NULL,
     verse INTEGER NOT NULL,
     text TEXT NOT NULL,
     version TEXT NOT NULL DEFAULT 'RVR1960',
     UNIQUE(book_id, chapter, verse, version)
   )`,
  `CREATE VIRTUAL TABLE verses_fts USING fts5(
     book_name, chapter, verse, text,
     content='verses', content_rowid='id'
   )`,
  `CREATE TRIGGER verses_ai AFTER INSERT ON verses BEGIN
     INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
     VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
   END`,
  `CREATE TRIGGER verses_ad AFTER DELETE ON verses BEGIN
     INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
     VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
   END`,
  `CREATE TRIGGER verses_au AFTER UPDATE ON verses BEGIN
     INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
     VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
     INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
     VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
   END`,
  `CREATE INDEX idx_verses_book_chapter ON verses(book_id, chapter)`,
  `CREATE INDEX idx_verses_version ON verses(version)`,
];

/** Parse a `export const X_DATA = [ ... ]` JSON array out of a .ts data file. */
function parseTsArray(file) {
  const c = fs.readFileSync(file, 'utf8');
  return JSON.parse(c.slice(c.indexOf('['), c.lastIndexOf(']') + 1));
}

/** Read KJV verses (English book_name) from the old seed or an existing pack. */
function loadKjvRows() {
  if (fs.existsSync(SEED)) {
    const old = new DatabaseSync(SEED, {readOnly: true});
    try {
      const rows = old
        .prepare(
          `SELECT book_id, book_name, chapter, verse, text FROM verses
           WHERE version='KJV' ORDER BY book_id, chapter, verse`,
        )
        .all();
      if (rows.length > 0) return rows;
    } finally {
      old.close();
    }
  }
  const existing = path.join(PACKS_DIR, 'kjv.sqlite');
  if (fs.existsSync(existing)) {
    const db = new DatabaseSync(existing, {readOnly: true});
    try {
      return db
        .prepare(
          `SELECT book_id, book_name, chapter, verse, text FROM verses
           ORDER BY book_id, chapter, verse`,
        )
        .all();
    } finally {
      db.close();
    }
  }
  throw new Error('No KJV source: old seed lacks KJV and no kjv.sqlite found');
}

function sortRows(rows) {
  return rows
    .map(r => ({
      book_id: r.book_id,
      book_name: r.book_name,
      chapter: r.chapter,
      verse: r.verse,
      text: r.text,
    }))
    .sort(
      (a, b) =>
        a.book_id - b.book_id ||
        a.chapter - b.chapter ||
        a.verse - b.verse,
    );
}

function buildSeed(tmp, rvr, web) {
  fs.rmSync(tmp, {force: true});
  const db = new DatabaseSync(tmp);
  db.exec('PRAGMA journal_mode=OFF; PRAGMA synchronous=OFF;');
  for (const stmt of SCHEMA) db.exec(stmt);
  const ins = db.prepare(
    `INSERT INTO verses (book_id, book_name, chapter, verse, text, version)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  db.exec('BEGIN');
  for (const r of rvr)
    ins.run(r.book_id, r.book_name, r.chapter, r.verse, r.text, 'RVR1960');
  for (const r of web)
    ins.run(r.book_id, r.book_name, r.chapter, r.verse, r.text, 'WEB');
  db.exec('COMMIT');
  db.close();
}

function buildKjvPack(tmp, rows) {
  fs.rmSync(tmp, {force: true});
  const db = new DatabaseSync(tmp);
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
  for (const r of rows)
    ins.run(r.book_id, r.book_name, r.chapter, r.verse, r.text);
  db.exec('COMMIT');
  db.exec('VACUUM');
  db.close();
}

function verifySeed(file, expectRvr, expectWeb) {
  const db = new DatabaseSync(file, {readOnly: true});
  const v = Object.fromEntries(
    db
      .prepare('SELECT version, COUNT(*) c FROM verses GROUP BY version')
      .all()
      .map(r => [r.version, r.c]),
  );
  const books = db.prepare('SELECT COUNT(DISTINCT book_id) b FROM verses').get()
    .b;
  const fts = db.prepare('SELECT COUNT(*) c FROM verses_fts').get().c;
  const total = db.prepare('SELECT COUNT(*) c FROM verses').get().c;
  const jRvr = db
    .prepare(
      "SELECT text FROM verses WHERE book_id=43 AND chapter=3 AND verse=16 AND version='RVR1960'",
    )
    .get();
  const jWeb = db
    .prepare(
      "SELECT text FROM verses WHERE book_id=43 AND chapter=3 AND verse=16 AND version='WEB'",
    )
    .get();
  // FTS round-trip: a Spanish query hits RVR1960, an English query hits WEB.
  const ftsEs = db
    .prepare(
      "SELECT COUNT(*) c FROM verses_fts WHERE verses_fts MATCH 'amó'",
    )
    .get().c;
  const ftsEn = db
    .prepare(
      "SELECT COUNT(*) c FROM verses_fts WHERE verses_fts MATCH 'loved'",
    )
    .get().c;
  db.close();
  const ok =
    v.RVR1960 === expectRvr &&
    v.WEB === expectWeb &&
    books === 66 &&
    fts === total &&
    total === expectRvr + expectWeb &&
    !!jRvr &&
    !!jWeb &&
    jRvr.text !== jWeb.text &&
    ftsEs > 0 &&
    ftsEn > 0;
  console.log(
    `  seed: RVR1960=${v.RVR1960} WEB=${v.WEB} books=${books} fts=${fts}/${total} ` +
      `John3:16 differ=${jRvr && jWeb ? jRvr.text !== jWeb.text : 'MISSING'} ` +
      `fts(amó)=${ftsEs} fts(loved)=${ftsEn} => ${ok ? 'OK' : 'FAIL'}`,
  );
  if (!ok) throw new Error('Seed verification FAILED');
}

function verifyKjvPack(file, expect) {
  const db = new DatabaseSync(file, {readOnly: true});
  const n = db.prepare('SELECT COUNT(*) c FROM verses').get().c;
  const books = db.prepare('SELECT COUNT(DISTINCT book_id) b FROM verses').get()
    .b;
  const j = db
    .prepare('SELECT text FROM verses WHERE book_id=43 AND chapter=3 AND verse=16')
    .get();
  db.close();
  const ok = n === expect && books === 66 && !!j;
  console.log(
    `  kjv.sqlite: n=${n} books=${books} John3:16=${j ? 'present' : 'MISSING'} => ${ok ? 'OK' : 'FAIL'}`,
  );
  if (!ok) throw new Error('KJV pack verification FAILED');
}

function main() {
  console.log('Loading sources…');
  const rvr = sortRows(parseTsArray(path.join(ROOT, 'src/lib/database/bible-data-rvr1960.ts')));
  const web = sortRows(parseTsArray(path.join(ROOT, 'src/lib/database/bible-data-web.ts')));
  const kjv = sortRows(loadKjvRows());
  console.log(`  RVR1960=${rvr.length} WEB=${web.length} KJV=${kjv.length}`);

  // Build seed to a temp file, verify, then atomically replace the asset.
  const seedTmp = SEED + '.tmp';
  console.log('Building seed…');
  buildSeed(seedTmp, rvr, web);
  verifySeed(seedTmp, rvr.length, web.length);

  // Build KJV pack + gzip.
  fs.mkdirSync(PACKS_DIR, {recursive: true});
  const kjvFile = path.join(PACKS_DIR, 'kjv.sqlite');
  const kjvTmp = kjvFile + '.tmp';
  console.log('Building KJV pack…');
  buildKjvPack(kjvTmp, kjv);
  verifyKjvPack(kjvTmp, kjv.length);

  // Commit outputs (after both verified).
  fs.renameSync(seedTmp, SEED);
  fs.renameSync(kjvTmp, kjvFile);
  const kjvBuf = fs.readFileSync(kjvFile);
  fs.writeFileSync(kjvFile + '.gz', zlib.gzipSync(kjvBuf, {level: 9}));
  const sha = crypto.createHash('sha256').update(kjvBuf).digest('hex');

  // Update versions.json: add KJV, drop WEB (now bundled), keep BSB.
  const vj = JSON.parse(fs.readFileSync(VERSIONS_JSON, 'utf8'));
  const kept = vj.versions.filter(x => x.id !== 'WEB' && x.id !== 'KJV');
  const kjvEntry = {
    id: 'KJV',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'en',
    year: '1611',
    license: 'Public Domain',
    url: 'https://eternalstonebible.github.io/packs/kjv.sqlite',
    bytes: kjvBuf.length,
    sha256: sha,
    verseCount: kjv.length,
  };
  vj.generated = new Date().toISOString().slice(0, 10);
  vj.versions = [kjvEntry, ...kept];
  fs.writeFileSync(VERSIONS_JSON, JSON.stringify(vj, null, 2) + '\n');

  console.log('\nDone.');
  console.log(`  ${SEED} (${fs.statSync(SEED).size} bytes)`);
  console.log(`  ${kjvFile} (${kjvBuf.length} bytes, sha256 ${sha.slice(0, 16)}…)`);
  console.log(`  ${kjvFile}.gz (${fs.statSync(kjvFile + '.gz').size} bytes)`);
  console.log(`  ${VERSIONS_JSON} updated (KJV added, WEB removed)`);
}

main();
