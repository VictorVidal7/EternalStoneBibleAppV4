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
 * Also emits web-red-letter.json — the WEB-only "Words of Christ" (\wj) span
 * data from bible-data-web-redletter.ts, flattened to plain JSON and
 * verified span-by-span against the just-built web.sqlite text before being
 * written out.
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

/**
 * Parse a `export const X = [ ... ]` array literal out of a .ts data file.
 * Locates the array's opening `[` starting from the `export const X ... =`
 * declaration (not a naive first-`[`-in-file scan), so brackets appearing
 * earlier in header comments or in a `: Type[]` annotation don't confuse it.
 *
 * Most data files here are strict JSON (quoted keys, no trailing commas),
 * so that's tried first. Some (e.g. bible-data-web-redletter.ts) are plain
 * JS object-literal syntax instead (unquoted keys, trailing commas) — if
 * strict JSON.parse fails, fall back to normalizing just those two things
 * before parsing again.
 */
function parseTsArray(file) {
  const c = fs.readFileSync(file, 'utf8');
  const decl = c.match(/export const \w+[^=]*=/);
  const searchFrom = decl ? decl.index + decl[0].length : 0;
  const start = c.indexOf('[', searchFrom);
  const raw = c.slice(start, c.lastIndexOf(']') + 1);
  try {
    return JSON.parse(raw);
  } catch {
    const normalized = raw
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3')
      .replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(normalized);
  }
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

/**
 * Verify every red-letter span against the ACTUAL text stored in the
 * just-built web.sqlite (not the source .ts file) — a hard failure here
 * means a span would render as garbled/wrong-highlighted text for real
 * users, so this throws rather than warns.
 */
function verifyRedLetterAlignment(entries, dbFile) {
  const db = new DatabaseSync(dbFile, {readOnly: true});
  const stmt = db.prepare(
    'SELECT text FROM verses WHERE book_id=? AND chapter=? AND verse=?',
  );
  const failures = [];
  let spanCount = 0;
  for (const e of entries) {
    const row = stmt.get(e.book_id, e.chapter, e.verse);
    if (!row) {
      failures.push(`${e.book_id}/${e.chapter}:${e.verse} — verse not found`);
      continue;
    }
    for (const [s, en] of e.spans) {
      spanCount++;
      if (en > row.text.length) {
        failures.push(
          `${e.book_id}/${e.chapter}:${e.verse} — span [${s},${en}) exceeds ` +
            `text length ${row.text.length}`,
        );
        continue;
      }
      const slice = row.text.slice(s, en);
      if (slice.trim().length === 0) {
        failures.push(
          `${e.book_id}/${e.chapter}:${e.verse} — span [${s},${en}) is blank`,
        );
      }
    }
  }
  if (failures.length > 0) {
    db.close();
    throw new Error(
      'Red-letter alignment verification FAILED ' +
        `(${failures.length} of ${spanCount} spans across ${entries.length} entries):\n` +
        failures.slice(0, 10).join('\n'),
    );
  }
  console.log(
    `  red-letter alignment: ${entries.length} entries, ${spanCount} spans, ` +
      `ALL slices non-blank and in-range against ${path.basename(dbFile)}`,
  );
  const jw = entries.find(
    e => e.book_id === 43 && e.chapter === 3 && e.verse === 16,
  );
  if (jw) {
    const row = stmt.get(jw.book_id, jw.chapter, jw.verse);
    for (const [s, en] of jw.spans) {
      console.log(
        `    John 3:16 red-letter span [${s},${en}) =`,
        JSON.stringify(row.text.slice(s, en)),
      );
    }
  }
  db.close();
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

  console.log('Building web-red-letter.json from bible-data-web-redletter.ts…');
  const redLetterFile = path.join(
    ROOT,
    'src/lib/database/bible-data-web-redletter.ts',
  );
  const redLetterEntries = parseTsArray(redLetterFile);
  const webDbFile = path.join(OUT, 'web.sqlite');
  verifyRedLetterAlignment(redLetterEntries, webDbFile);
  const redLetterJsonFile = path.join(OUT, 'web-red-letter.json');
  fs.writeFileSync(redLetterJsonFile, JSON.stringify(redLetterEntries));
  const redLetterBuf = fs.readFileSync(redLetterJsonFile);
  const redLetterSha = crypto
    .createHash('sha256')
    .update(redLetterBuf)
    .digest('hex');
  const redLetterSpanCount = redLetterEntries.reduce(
    (sum, e) => sum + e.spans.length,
    0,
  );
  console.log(
    `  red-letter: ${redLetterEntries.length} entries, ${redLetterSpanCount} ` +
      `spans -> ${redLetterBuf.length} bytes, sha256 ${redLetterSha.slice(0, 16)}…`,
  );

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
        redLetter: {
          file: 'web-red-letter.json',
          bytes: redLetterBuf.length,
          sha256: redLetterSha,
          entries: redLetterEntries.length,
          spans: redLetterSpanCount,
        },
      },
      null,
      2,
    ) + '\n',
  );

  console.log('\nDone.');
  for (const s of specs)
    console.log(`  ${path.join(OUT, s.id.toLowerCase() + '.sqlite')}`);
  console.log(`  ${redLetterJsonFile}`);
  console.log(`  ${WEB_PACKS_JSON} written`);
  console.log(
    '  Upload the *.sqlite AND web-red-letter.json to the Pages repo under ' +
      '/packs/ (Victor — no gh CLI access from this session).',
  );
}

main();
