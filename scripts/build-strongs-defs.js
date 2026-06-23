/**
 * 📖 build-strongs-defs — bundled Strong's-definition overlay (EN fixed + ES).
 *
 * Produces `assets/strongs-defs.db` (a small SQLite asset BUNDLED in the APK,
 * imported on init like cross-references.db) with one row per Strong's number:
 *   strongs(PK), definition_en, definition_es
 *
 * Why an overlay (not a pack rebuild):
 *  - definition_en FIXES a fidelity bug in the originals pack: openscriptures
 *    splits some entries' meaning into the `derivation` field (e.g. θεός G2316),
 *    and the pack stored only `strongs_def` → the meaning was lost. Here the
 *    definition is the COMPLETE authentic Strong's text: `strongs_def` alone
 *    when it already carries the meaning, else `derivation` + `strongs_def`.
 *  - definition_es is OUR faithful Spanish translation of the public-domain
 *    English, grown batch by batch (frequency-first) in `strongs-defs-es.json`.
 *
 * Source EN: openscriptures/strongs (public domain). Re-run is deterministic.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const {DatabaseSync} = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const OUT = process.argv[2] || path.join(ROOT, 'assets', 'strongs-defs.db');
const ES_JSON = path.join(__dirname, 'strongs-defs-es.json');
const CACHE = path.join(os.tmpdir(), 'strongs-defs-src');

const DICTS = [
  {
    f: 'strongs-greek.js',
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/greek/strongs-greek-dictionary.js',
  },
  {
    f: 'strongs-hebrew.js',
    url: 'https://raw.githubusercontent.com/openscriptures/strongs/master/hebrew/strongs-hebrew-dictionary.js',
  },
];

// strongs_def that STARTS with one of these is a continuation — the meaning
// began in `derivation`, so we must prepend it (the ~5% θεός-style entries).
const CONTINUATION =
  /^(figuratively|literal|by |and |or |also |specially|especially|properly|i\.e\.|;)/i;

/** Normalise an openscriptures key to the pack's lexicon key form. */
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
  if (lang === 'H' && num >= 9000) return null;
  return `${lang}${num}`;
}

/** The complete, faithful English definition for one entry. */
function fullDefinition(entry) {
  const deriv = (entry.derivation || '').trim();
  const sdef = (entry.strongs_def || '').trim();
  let out;
  if (!sdef) out = deriv;
  else if (CONTINUATION.test(sdef)) out = `${deriv} ${sdef}`.trim();
  else out = sdef;
  return out.replace(/\s+/g, ' ').trim() || null;
}

async function download() {
  fs.mkdirSync(CACHE, {recursive: true});
  for (const {f, url} of DICTS) {
    const dest = path.join(CACHE, f);
    if (fs.existsSync(dest)) continue;
    process.stdout.write(`↓ ${f} … `);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
    fs.writeFileSync(dest, await res.text());
    console.log('ok');
  }
}

async function main() {
  await download();

  const es = JSON.parse(fs.readFileSync(ES_JSON, 'utf8'));
  delete es._comment;

  fs.mkdirSync(path.dirname(OUT), {recursive: true});
  if (fs.existsSync(OUT)) fs.rmSync(OUT);
  const db = new DatabaseSync(OUT);
  db.exec(
    `CREATE TABLE strongs_defs (
       strongs TEXT PRIMARY KEY,
       definition_en TEXT,
       definition_es TEXT
     )`,
  );
  const ins = db.prepare(
    'INSERT OR IGNORE INTO strongs_defs (strongs, definition_en, definition_es) VALUES (?, ?, ?)',
  );

  let total = 0;
  let withEs = 0;
  const seen = new Set();
  for (const {f} of DICTS) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dict = require(path.join(CACHE, f));
    for (const key of Object.keys(dict)) {
      const norm = normalizeStrongs(key);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      const en = fullDefinition(dict[key]);
      const esDef = es[norm] || null;
      ins.run(norm, en, esDef);
      total++;
      if (esDef) withEs++;
    }
  }

  // Verify the ES keys all matched a real Strong's (catch typos in the JSON).
  const esKeys = Object.keys(es);
  const missing = esKeys.filter(k => !seen.has(k));
  if (missing.length) {
    console.warn(`⚠️ ES keys with no lexicon entry: ${missing.join(', ')}`);
  }

  db.close();
  console.log(
    `✅ ${OUT}\n   ${total} entries, ${withEs} with Spanish (${esKeys.length} in JSON), ${
      fs.statSync(OUT).size
    } bytes`,
  );
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
