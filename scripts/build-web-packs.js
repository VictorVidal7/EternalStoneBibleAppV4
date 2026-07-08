/**
 * 📦 build-web-packs.js — build the two web-only bootstrap packs (T21).
 *
 * The web reader ships with NO embedded seed (unlike native, which bundles
 * RVR1960 + WEB in assets/bible-seed.db) — it boots empty and downloads one
 * of these packs on first run (src/lib/database/data-loader.web.ts). Both
 * packs are emitted directly from the SAME in-repo source files that build
 * the native bundled seed (bible-data-rvr1960.ts / bible-data-web.ts,
 * consumed by rebuild-seed.js) — NOT re-fetched from a network source — so
 * the web text is byte-identical to what native users already read.
 *
 * Each pack is the SAME shape every other downloadable pack uses: a single
 * `verses(book_id, book_name, chapter, verse, text)` table — NO version
 * column (added at import time by data-loader.web.ts), NO FTS (the web
 * build has no fts5 module at all — T20 finding).
 *
 * Deliberately NOT added to web/packs/versions.json — that catalog is also
 * read by the NATIVE app's "download extra versions" screen
 * (ManageVersionsSection.tsx), which renders every entry with no filtering
 * against already-bundled versions. Listing RVR1960/WEB there would offer
 * native users a "download" of a version they already have. The web
 * bootstrap instead reads a small, separate manifest generated alongside
 * these packs (see WEB_PACKS_JSON below).
 *
 * Requires Node ≥ 22 (node:sqlite). Usage:
 *   node --experimental-sqlite scripts/build-web-packs.js [outDir]
 *   (default outDir: %USERPROFILE%/Desktop/web-packs)
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const {DatabaseSync} = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(os.homedir(), 'Desktop', 'web-packs');
const WEB_PACKS_JSON = path.join(ROOT, 'web', 'packs', 'web-bootstrap.json');

/** Parse a `export const X_DATA = [ ... ]` JSON array out of a .ts data file. */
function parseTsArray(file) {
  const c = fs.readFileSync(file, 'utf8');
  return JSON.parse(c.slice(c.indexOf('['), c.lastIndexOf(']') + 1));
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
  for (const r of rows) {
    ins.run(r.book_id, r.book_name, r.chapter, r.verse, r.text);
  }
  db.exec('COMMIT');
  db.exec('VACUUM');
  db.close();
}

function verifyPack(dbFile, expectCount) {
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
    n === expectCount &&
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

  const specs = [
    {
      id: 'RVR1960',
      file: path.join(ROOT, 'src/lib/database/bible-data-rvr1960.ts'),
      arrayName: 'RVR1960_DATA',
    },
    {
      id: 'WEB',
      file: path.join(ROOT, 'src/lib/database/bible-data-web.ts'),
      arrayName: 'WEB_DATA',
    },
  ];

  const manifest = [];
  for (const s of specs) {
    console.log(`Building ${s.id} from ${path.basename(s.file)}…`);
    const rawRows = parseTsArray(s.file);
    // Source rows use book_id/book_name (already the pack shape) plus a
    // `version` field we drop (the pack has no version column).
    const rows = rawRows.map(r => ({
      book_id: r.book_id,
      book_name: r.book_name,
      chapter: r.chapter,
      verse: r.verse,
      text: r.text,
    }));
    const dbFile = path.join(OUT, s.id.toLowerCase() + '.sqlite');
    buildPack(rows, dbFile);
    verifyPack(dbFile, rows.length);
    const buf = fs.readFileSync(dbFile);
    const sha = crypto.createHash('sha256').update(buf).digest('hex');
    console.log(
      `  ${s.id}: ${rows.length} verses -> ${buf.length} bytes, sha256 ${sha.slice(0, 16)}…`,
    );
    manifest.push({
      id: s.id,
      file: s.id.toLowerCase() + '.sqlite',
      bytes: buf.length,
      sha256: sha,
      verseCount: rows.length,
    });
  }

  fs.writeFileSync(
    WEB_PACKS_JSON,
    JSON.stringify(
      {
        schema: 1,
        generated: new Date().toISOString().slice(0, 10),
        note:
          'Web-only bootstrap packs (RVR1960 + WEB), byte-identical to the ' +
          'native bundled seed. NOT part of web/packs/versions.json ' +
          '(that catalog is also read by the native download-versions ' +
          'screen, which does not filter bundled versions).',
        packs: manifest,
      },
      null,
      2,
    ) + '\n',
  );

  console.log('\nDone.');
  for (const s of specs)
    console.log(`  ${path.join(OUT, s.id.toLowerCase() + '.sqlite')}`);
  console.log(`  ${WEB_PACKS_JSON} written`);
  console.log(
    '  Upload the *.sqlite to the Pages repo under /packs/ (Victor — no gh CLI access from this session).',
  );
}

main();
