/**
 * 🔗 build-cross-references.js — build the bundled cross-reference dataset.
 *
 * RUMBO #3 / CROSS-REFERENCE COVERAGE (user decision, 2026-06-21): the app's
 * mature study stack (CrossReferencesSheet, Study mode's two-way web,
 * reference-chain threads) only lit up on the ~207 hand-curated verses in
 * `src/constants/cross-references.ts`. This script builds a faithful, broad
 * cross-reference dataset that lights the whole stack up on ANY verse, kept as
 * a bundled SQLite asset the app imports once on first run (ATTACH + INSERT,
 * same proven path as the translation packs) — the curated set stays the
 * PRIORITY layer at runtime; this is the breadth underneath it.
 *
 * SOURCE: openbible.info "Cross References" (CC-BY) — the canonical
 * machine-readable, community-VOTED cross-reference corpus (derived from the
 * public-domain Treasury of Scripture Knowledge + community curation). The
 * votes are the fidelity lever: we keep only positively-agreed refs and cap
 * each source verse to its TOP-N by votes, so a verse surfaces the connections
 * the community most agrees on, not the long noisy tail.
 *   https://www.openbible.info/labs/cross-references/  (CC-BY 4.0)
 *
 * FIDELITY GUARANTEES:
 *   - OSIS book codes map to the canonical 1..66 Protestant book_id; the build
 *     ABORTS if any code is unknown (no silent drops of whole books).
 *   - Every from/to reference is DB-VERIFIED against the bundled bible-seed.db:
 *     a ref whose verse does not exist in our text (versification gaps, e.g.
 *     3 John 1:15, Psalm titles) is dropped — NO dead links ever ship.
 *   - Self-references and duplicate (from→to) pairs are dropped.
 *   - DETERMINISTIC: rows are written in a fixed sort order, so a re-run over
 *     the same input is byte-identical.
 *
 * OUTPUT: assets/cross-references.db — a single table
 *   cross_references(from_book, from_chapter, from_verse,
 *                    to_book, to_chapter, to_verse, to_verse_end, votes)
 * NO indexes (the app creates the runtime index on its own table after import),
 * NO id column (ATTACH + INSERT … SELECT maps straight in).
 *
 * Requires Node ≥ 22 (node:sqlite). Usage:
 *   node --experimental-sqlite scripts/build-cross-references.js [inputTxt]
 * If [inputTxt] is omitted the script downloads the dataset zip from openbible.
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
const SEED = path.join(ROOT, 'assets', 'bible-seed.db');
const OUT = path.join(ROOT, 'assets', 'cross-references.db');
const SOURCE_URL = 'https://a.openbible.info/data/cross-references.zip';

// Fidelity knobs — keep only refs the community positively agrees on, and cap
// each source verse to its strongest links (median refs/verse in the corpus
// is ~10, so top-10 keeps a verse's full agreed set without the long tail).
const MIN_VOTES = 2;
const TOP_N = 10;

/** OSIS book code → canonical 1..66 book_id (Protestant canon, the seed order). */
const OSIS_TO_ID = {
  Gen: 1,
  Exod: 2,
  Lev: 3,
  Num: 4,
  Deut: 5,
  Josh: 6,
  Judg: 7,
  Ruth: 8,
  '1Sam': 9,
  '2Sam': 10,
  '1Kgs': 11,
  '2Kgs': 12,
  '1Chr': 13,
  '2Chr': 14,
  Ezra: 15,
  Neh: 16,
  Esth: 17,
  Job: 18,
  Ps: 19,
  Prov: 20,
  Eccl: 21,
  Song: 22,
  Isa: 23,
  Jer: 24,
  Lam: 25,
  Ezek: 26,
  Dan: 27,
  Hos: 28,
  Joel: 29,
  Amos: 30,
  Obad: 31,
  Jonah: 32,
  Mic: 33,
  Nah: 34,
  Hab: 35,
  Zeph: 36,
  Hag: 37,
  Zech: 38,
  Mal: 39,
  Matt: 40,
  Mark: 41,
  Luke: 42,
  John: 43,
  Acts: 44,
  Rom: 45,
  '1Cor': 46,
  '2Cor': 47,
  Gal: 48,
  Eph: 49,
  Phil: 50,
  Col: 51,
  '1Thess': 52,
  '2Thess': 53,
  '1Tim': 54,
  '2Tim': 55,
  Titus: 56,
  Phlm: 57,
  Heb: 58,
  Jas: 59,
  '1Pet': 60,
  '2Pet': 61,
  '1John': 62,
  '2John': 63,
  '3John': 64,
  Jude: 65,
  Rev: 66,
};

/** Parse one OSIS ref "Gen.1.1" → {book,chapter,verse} or null. */
function parseOsis(ref) {
  const parts = ref.split('.');
  if (parts.length !== 3) return null;
  const book = OSIS_TO_ID[parts[0]];
  if (book === undefined) {
    throw new Error(`Unknown OSIS book code: "${parts[0]}" in "${ref}"`);
  }
  const chapter = Number(parts[1]);
  const verse = Number(parts[2]);
  if (!Number.isInteger(chapter) || !Number.isInteger(verse)) return null;
  return {book, chapter, verse};
}

/** Resolve the input TSV: a passed path, the openbible cache, or a download. */
function resolveInput() {
  const arg = process.argv[2];
  if (arg) {
    if (!fs.existsSync(arg)) throw new Error(`input not found: ${arg}`);
    return fs.readFileSync(arg, 'utf8');
  }
  console.log(`⬇️  downloading ${SOURCE_URL}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'xref-'));
  const zipPath = path.join(tmp, 'cross-references.zip');
  execFileSync('curl', ['-sL', '-o', zipPath, '--max-time', '120', SOURCE_URL]);
  // Inflate the single .txt entry from the zip (store/deflate) without a dep.
  const buf = fs.readFileSync(zipPath);
  return inflateFirstZipEntry(buf);
}

/** Minimal single-entry ZIP reader (local file header → inflateRaw/stored). */
function inflateFirstZipEntry(buf) {
  if (buf.readUInt32LE(0) !== 0x04034b50) {
    throw new Error('not a zip (bad local file header signature)');
  }
  const method = buf.readUInt16LE(8);
  const compSize = buf.readUInt32LE(18);
  const nameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const dataStart = 30 + nameLen + extraLen;
  const comp = buf.subarray(dataStart, dataStart + compSize);
  if (method === 0) return comp.toString('utf8');
  if (method === 8) return zlib.inflateRawSync(comp).toString('utf8');
  throw new Error(`unsupported zip compression method ${method}`);
}

function sha256(file) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(file))
    .digest('hex');
}

function main() {
  // 1) Load the verse-existence set from the bundled seed (DB-verify source).
  const seed = new DatabaseSync(SEED);
  const verseSet = new Set();
  for (const row of seed
    .prepare('SELECT DISTINCT book_id, chapter, verse FROM verses')
    .all()) {
    verseSet.add(`${row.book_id}.${row.chapter}.${row.verse}`);
  }
  seed.close();
  console.log(`📖 seed verse-existence set: ${verseSet.size} verses`);
  const exists = r => verseSet.has(`${r.book}.${r.chapter}.${r.verse}`);

  // 2) Parse + verify every row.
  const text = resolveInput();
  const lines = text.split(/\r?\n/);
  const stats = {
    total: 0,
    badParse: 0,
    deadFrom: 0,
    deadTo: 0,
    self: 0,
    lowVotes: 0,
  };
  // bySource: "from" key → array of {to, votes} candidates (verified).
  const bySource = new Map();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.startsWith('#')) continue;
    const [fromRaw, toRaw, votesRaw] = line.split('\t');
    if (!fromRaw || !toRaw) continue;
    stats.total++;
    const votes = parseInt(votesRaw, 10) || 0;
    if (votes < MIN_VOTES) {
      stats.lowVotes++;
      continue;
    }
    const from = parseOsis(fromRaw);
    // The "to" may be a range "Gen.1.1-Gen.1.5"; anchor on the start verse.
    const toParts = toRaw.split('-');
    const to = parseOsis(toParts[0]);
    if (!from || !to) {
      stats.badParse++;
      continue;
    }
    if (!exists(from)) {
      stats.deadFrom++;
      continue;
    }
    if (!exists(to)) {
      stats.deadTo++;
      continue;
    }
    if (
      from.book === to.book &&
      from.chapter === to.chapter &&
      from.verse === to.verse
    ) {
      stats.self++;
      continue;
    }
    // Same-book/chapter range end (for "1:1-5" display); else null.
    let toVerseEnd = null;
    if (toParts.length === 2) {
      const end = parseOsis(toParts[1]);
      if (
        end &&
        end.book === to.book &&
        end.chapter === to.chapter &&
        end.verse > to.verse
      ) {
        toVerseEnd = end.verse;
      }
    }
    const key = `${from.book}.${from.chapter}.${from.verse}`;
    if (!bySource.has(key)) bySource.set(key, {from, cands: []});
    bySource.get(key).cands.push({to, toVerseEnd, votes});
  }

  // 3) Per source: dedupe (from→to start), sort by votes desc, cap TOP_N.
  const rows = [];
  for (const {from, cands} of bySource.values()) {
    const seen = new Set();
    const deduped = [];
    // Highest-voted instance of a duplicate target wins.
    cands.sort((a, b) => b.votes - a.votes);
    for (const c of cands) {
      const tk = `${c.to.book}.${c.to.chapter}.${c.to.verse}`;
      if (seen.has(tk)) continue;
      seen.add(tk);
      deduped.push(c);
    }
    for (const c of deduped.slice(0, TOP_N)) {
      rows.push({
        fb: from.book,
        fc: from.chapter,
        fv: from.verse,
        tb: c.to.book,
        tc: c.to.chapter,
        tv: c.to.verse,
        te: c.toVerseEnd,
        votes: c.votes,
      });
    }
  }

  // Deterministic write order.
  rows.sort(
    (a, b) =>
      a.fb - b.fb ||
      a.fc - b.fc ||
      a.fv - b.fv ||
      b.votes - a.votes ||
      a.tb - b.tb ||
      a.tc - b.tc ||
      a.tv - b.tv,
  );

  // 4) Write the bundled asset DB.
  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
  const out = new DatabaseSync(OUT);
  out.exec('PRAGMA journal_mode=DELETE; PRAGMA page_size=4096;');
  out.exec(`CREATE TABLE cross_references (
    from_book INTEGER NOT NULL,
    from_chapter INTEGER NOT NULL,
    from_verse INTEGER NOT NULL,
    to_book INTEGER NOT NULL,
    to_chapter INTEGER NOT NULL,
    to_verse INTEGER NOT NULL,
    to_verse_end INTEGER,
    votes INTEGER NOT NULL
  )`);
  const ins = out.prepare(
    `INSERT INTO cross_references
       (from_book, from_chapter, from_verse, to_book, to_chapter, to_verse, to_verse_end, votes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  out.exec('BEGIN');
  for (const r of rows) {
    ins.run(r.fb, r.fc, r.fv, r.tb, r.tc, r.tv, r.te, r.votes);
  }
  out.exec('COMMIT');
  out.exec('VACUUM');
  const distinctSources = bySource.size;
  out.close();

  const bytes = fs.statSync(OUT).size;
  console.log('— dropped —', JSON.stringify(stats));
  console.log(
    `✅ wrote ${rows.length} cross-references over ${distinctSources} source verses`,
  );
  console.log(
    `   ${OUT}  ${bytes} B (${(bytes / 1048576).toFixed(2)} MB)  sha256=${sha256(OUT)}`,
  );
  console.log(`   knobs: MIN_VOTES=${MIN_VOTES} TOP_N=${TOP_N}`);
}

main();
