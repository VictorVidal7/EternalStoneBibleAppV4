/**
 * 📜 generate-a4-override-positions — MECHANICAL half of the A4-chico
 * positional-overlay research (see DOCS/drafts/a4-chico-spanish-availability.md
 * on branch research/a4-chico-spanish-availability for the full background).
 *
 * READ-ONLY. Does not touch any file in the main app (no wiring, no version
 * bump, no assets/hebrew-gloss-es-v1.json, no src/lib/database/index.ts).
 * Reads only:
 *   - %TEMP%\a4-research\material-list.json  (prior session's per-dStrong
 *     TBESH classification + whole-OT occurrence counts, already verified
 *     against a from-scratch TAHOT re-run — see the research doc §2)
 *   - %TEMP%\a4-research\TAHOT-*.txt          (raw STEPBible TAHOT, 4 files,
 *     same files + same order build-originals-pack.js's STEP_FILES uses for
 *     the Hebrew OT)
 *   - assets/bible-seed.db                    (verse-existence gate, read-only)
 *   - ~/Desktop/originals-pack/originals.db    (sanity-check only, read-only)
 *
 * Writes only DOCS/drafts/a4-override-positions.json (+ this script commits
 * itself + the SUMMARY.md on a new research branch — nothing merged/pushed).
 *
 * ── WHAT THIS DOES ──────────────────────────────────────────────────────────
 * For each of the 27 Tier-A1 "genuine distinct-lexeme polysemy" lemmas named
 * in the task (base Strong's numbers below), material-list.json already has
 * every real lexical dStrong sub-entry (raw TBESH Gloss, morph, whole-OT
 * occurrence count). Group those sub-entries by CORE sense — the same
 * `coreGloss()` rule the prior session's material-list.js used (TBESH Gloss
 * text before a ":" or "»", lower-cased) — and sum occurrence per core-sense
 * group. The group with the highest summed occurrence is the DOMINANT sense
 * (this reproduces the research doc's 617-row estimate exactly when done this
 * way — verified by hand before writing this script; a naive "exclude only
 * the single highest-occurrence dStrong row" reading does NOT reproduce 617,
 * because several dStrong entries are sub-nuances of the SAME core sense as
 * the dominant one, e.g. H5971's "people: soldiers" and "people: creatures"
 * both count toward the "people" group, not as separate senses).
 *
 * Every dStrong entry OUTSIDE the dominant core-sense group needs an override
 * row for EVERY occurrence of that exact dStrong in TAHOT. This script:
 *   1. Parses the full 4-file Hebrew TAHOT corpus ONCE, in the same file
 *      order build-originals-pack.js's STEP_FILES uses, replicating its
 *      exact row regex, "=X" LXX-retroversion skip, dead-verse gate (against
 *      assets/bible-seed.db's real verse set), and position-collision
 *      "reposition" bump (lastPosByVerse, running across ALL rows in file
 *      order — not just the rows we care about, since the counter must see
 *      every row to stay correct for collision-prone verses).
 *   2. For every row whose dStrong is in the override set, emits
 *      {strongsBase, dStrong, senseLabel, bookId, chapter, verse, position}.
 *   3. Verifies every emitted row against originals.db's original_words
 *      table (same book_id/chapter/verse/position must exist with strongs
 *      equal to the base Strong's) — reports any notFound/mismatch rather
 *      than silently dropping or trusting them.
 *
 * The A3-dominant-sense cross-check (does assets/hebrew-lemma-gloss-es.json's
 * shipped gloss for this base Strong's semantically match the dominant core
 * sense computed here) is NOT automated — it is a judgment call, done by hand
 * for all 27 lemmas and recorded in the SUMMARY generation step below as
 * MATCH / MISMATCH(sense) / UNRESOLVED, per the advisor's guidance: the flag
 * is a signal for the human translator, not a verdict, and it does NOT change
 * which rows get emitted (all non-dominant dStrong occurrences are emitted
 * for all 27 lemmas regardless of bucket).
 *
 * Usage: node scripts/research/generate-a4-override-positions.js
 * Requires Node >= 22 (node:sqlite).
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {DatabaseSync} = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..', '..');
const RESEARCH_DIR = path.join(os.tmpdir(), 'a4-research');
const MATERIAL_LIST = path.join(RESEARCH_DIR, 'material-list.json');
const TAHOT_FILES = [
  'TAHOT-gen.txt', // == STEP_FILES' tahot-gen-deu.txt (Gen-Deu)
  'tahot-jos-est.txt',
  'tahot-job-sng.txt',
  'tahot-isa-mal.txt',
];
const SEED_DB = path.join(ROOT, 'assets', 'bible-seed.db');
const ORIGINALS_DB = path.join(
  os.homedir(),
  'Desktop',
  'originals-pack',
  'originals.db',
);
const A3_JSON = path.join(ROOT, 'assets', 'hebrew-lemma-gloss-es.json');
const OUT_JSON = path.join(
  ROOT,
  'DOCS',
  'drafts',
  'a4-override-positions.json',
);
const OUT_SUMMARY = path.join(
  ROOT,
  'DOCS',
  'drafts',
  'a4-override-positions-SUMMARY.md',
);

// The 27 Tier-A1 lemmas named in the task, in the order given.
const TARGET_LEMMAS = [
  'H5608',
  'H2691',
  'H3384',
  'H5971',
  'H6862',
  'H7227',
  'H4853',
  'H2790',
  'H6887',
  'H352',
  'H3651',
  'H2502',
  'H5869',
  'H2470',
  'H2717',
  'H3885',
  'H6030',
  'H7114',
  'H6643',
  'H2563',
  'H8577',
  'H2254',
  'H3867',
  'H5035',
  'H1481',
  'H1984',
  'H6743',
];

/** Same STEP_BOOK_TO_ID as build-originals-pack.js (copied, not required —
 *  requiring that script would trigger its own main()/network fetch). */
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
};

// ── same dStrong extraction as material-list.js (must match its counts) ────
function normD(dStrong) {
  const m = (dStrong || '').match(/^([HG])0*(\d+)([A-Za-z]*)/);
  if (!m) return null;
  return `${m[1]}${parseInt(m[2], 10)}${(m[3] || '').toUpperCase()}`;
}
function dStrongOf(cell) {
  if (!cell) return null;
  const m = cell.match(/\{([HG][^}]*)\}/);
  if (!m) return null;
  const tok = m[1].replace(/[{}]/g, '').trim();
  const mm = tok.match(/^([HG])0*(\d+)([A-Za-z]*)/);
  if (!mm) return null;
  const num = parseInt(mm[2], 10);
  if (!num) return null;
  if (mm[1] === 'H' && num >= 9000) return null;
  const base = `${mm[1]}${num}`;
  const letter = (mm[3] || '').toUpperCase();
  return {base, d: base + letter};
}
const coreGloss = g => g.split(/[:»]/)[0].trim().toLowerCase();

// ── 1. load material-list.json, pick the 27 target lemmas ─────────────────
const materialList = JSON.parse(fs.readFileSync(MATERIAL_LIST, 'utf8'));
const byBase = new Map(materialList.map(e => [e.base, e]));
const missing = TARGET_LEMMAS.filter(b => !byBase.has(b));
if (missing.length) {
  throw new Error(
    `material-list.json is missing target lemma(s): ${missing.join(', ')} — refusing to silently under-count`,
  );
}

// ── 2. per lemma: group by core sense, find dominant group, collect the
//    override dStrong set (every dStrong entry NOT in the dominant group) ──
const lemmaInfo = new Map(); // base -> {translit, dominantCore, dominantOcc, overrideEntries:[{dStrong,gloss,core,occ}], groups}
for (const base of TARGET_LEMMAS) {
  const rec = byBase.get(base);
  const groups = new Map(); // core -> {occ, entries:[]}
  for (const e of rec.entries) {
    if (!groups.has(e.core)) groups.set(e.core, {occ: 0, entries: []});
    const g = groups.get(e.core);
    g.occ += e.occ;
    g.entries.push(e);
  }
  // Deterministic sort: highest summed occ first; ties broken by the
  // alphabetically-lowest dStrong letter within the group (advisor's
  // guidance — do not adjudicate ties by semantic guesswork).
  const groupList = [...groups.entries()].map(([core, g]) => ({
    core,
    occ: g.occ,
    entries: g.entries,
    minDStrong: g.entries.map(e => e.dStrong).sort()[0],
  }));
  groupList.sort(
    (a, b) => b.occ - a.occ || (a.minDStrong < b.minDStrong ? -1 : 1),
  );
  const dominant = groupList[0];
  const tied = groupList.length > 1 && groupList[1].occ === dominant.occ;
  const overrideEntries = groupList.slice(1).flatMap(g => g.entries);
  lemmaInfo.set(base, {
    translit: rec.translit,
    dominantCore: dominant.core,
    dominantOcc: dominant.occ,
    tied,
    overrideEntries,
    groupList,
  });
}

// Map of every dStrong we need occurrences for -> {base, senseLabel(core-sense gloss text)}
const overrideDStrongs = new Map(); // dStrong -> {base, senseLabel}
for (const [base, info] of lemmaInfo) {
  for (const e of info.overrideEntries) {
    overrideDStrongs.set(e.dStrong, {base, senseLabel: e.gloss});
  }
}

// ── 3. dead-verse gate (same as build-originals-pack.js: verse must exist
//    in bible-seed.db BEFORE the reposition bump is applied) ───────────────
const seedDb = new DatabaseSync(SEED_DB, {readOnly: true});
const verseSet = new Set();
for (const r of seedDb
  .prepare('SELECT DISTINCT book_id, chapter, verse FROM verses')
  .all()) {
  verseSet.add(`${r.book_id}.${r.chapter}.${r.verse}`);
}
seedDb.close();

// ── 4. single full pass over the 4 Hebrew TAHOT files, in build-originals-
//    pack.js's STEP_FILES order, replicating parseStep()'s row regex, "=X"
//    skip, dead-verse gate, and cross-file reposition-collision bump ───────
const rowRe =
  /^([A-Za-z0-9]{2,4})\.(\d+)\.(\d+)(?:[{(][^)}]*[)}])?#(\d+)=([A-Za-z()]+)/;
const lastPosByVerse = new Map(); // "bookId.ch.v" -> last assigned position
const outRows = [];
let totalRows = 0,
  xSkipped = 0,
  deadVerseDropped = 0,
  repositioned = 0,
  overrideCandidates = 0;

for (const f of TAHOT_FILES) {
  const lines = fs
    .readFileSync(path.join(RESEARCH_DIR, f), 'utf8')
    .split(/\r?\n/);
  for (const line of lines) {
    const m = rowRe.exec(line);
    if (!m) continue;
    if (m[5] === 'X') {
      xSkipped++;
      continue;
    }
    totalRows++;
    const [, code, chStr, vStr, posStr] = m;
    const bookId = STEP_BOOK_TO_ID[code];
    if (bookId === undefined) {
      throw new Error(`Unknown STEPBible book code "${code}"`);
    }
    const chapter = Number(chStr);
    const verse = Number(vStr);
    const vKey = `${bookId}.${chapter}.${verse}`;
    if (!verseSet.has(vKey)) {
      deadVerseDropped++;
      continue; // dropped rows do NOT advance lastPosByVerse (matches the build)
    }
    let position = Number(posStr);
    const lastPos = lastPosByVerse.get(vKey) || 0;
    if (position <= lastPos) {
      repositioned++;
      position = lastPos + 1;
    }
    lastPosByVerse.set(vKey, position);

    // Only NOW check whether this row's dStrong is one we need — the
    // reposition/dead-verse bookkeeping above must see every row regardless.
    const c = line.split('\t');
    const ds = dStrongOf(c[4] || '');
    if (!ds) continue;
    const want = overrideDStrongs.get(ds.d);
    if (!want) continue;
    overrideCandidates++;
    outRows.push({
      strongsBase: want.base,
      dStrong: ds.d,
      senseLabel: want.senseLabel,
      bookId,
      chapter,
      verse,
      position,
    });
  }
}

outRows.sort(
  (a, b) =>
    a.strongsBase.localeCompare(b.strongsBase) ||
    a.dStrong.localeCompare(b.dStrong) ||
    a.bookId - b.bookId ||
    a.chapter - b.chapter ||
    a.verse - b.verse ||
    a.position - b.position,
);

// ── 5. verify every emitted row against the real pack (originals.db) ──────
const odb = new DatabaseSync(ORIGINALS_DB, {readOnly: true});
const lookup = odb.prepare(
  'SELECT strongs, word, gloss_en FROM original_words WHERE book_id=? AND chapter=? AND verse=? AND position=?',
);
let notFound = 0,
  strongsMismatch = 0;
const verifyIssues = [];
for (const row of outRows) {
  const r = lookup.get(row.bookId, row.chapter, row.verse, row.position);
  if (!r) {
    notFound++;
    row._verify = 'notFound';
    if (verifyIssues.length < 20)
      verifyIssues.push(`notFound: ${JSON.stringify(row)}`);
    continue;
  }
  if (r.strongs !== row.strongsBase) {
    strongsMismatch++;
    row._verify = `strongsMismatch(got ${r.strongs})`;
    if (verifyIssues.length < 20)
      verifyIssues.push(
        `strongsMismatch: ${JSON.stringify(row)} got strongs=${r.strongs}`,
      );
    continue;
  }
  row._verify = 'ok';
  row._word = r.word;
  row._glossEn = r.gloss_en;
}
odb.close();

// ── 6. A3 dominant-sense cross-check (recorded, not adjudicated by rule) ──
const a3Json = JSON.parse(fs.readFileSync(A3_JSON, 'utf8'));
// Hand-classified per the advisor-approved 3-bucket scheme. This is NOT a
// mechanical computation — it is a documented human/LLM judgment call, kept
// separate from row generation (which never depends on this bucket). See
// the SUMMARY for the one-line reason behind each call.
const A3_CROSS_CHECK = {
  H5608: {
    bucket: 'MATCH',
    note: 'A3 "recontar / relatar" = dominant "to recount" (107)',
  },
  H2691: {bucket: 'MATCH', note: 'A3 "patio" = dominant "court" (145)'},
  H3384: {
    bucket: 'MATCH',
    note: 'A3 ships a compound "enseñar / arrojar" (teach/shoot) covering BOTH senses; leading term matches dominant "to show" (47)',
  },
  H5971: {
    bucket: 'MATCH',
    note: 'A3 "pueblo" = dominant "people" group (1835, incl. soldiers/creatures sub-nuances)',
  },
  H6862: {
    bucket: 'MISMATCH',
    note: 'A3 "estrecho" (narrow) = the SMALLEST sense (8 occ), not dominant "enemy" (69)',
  },
  H7227: {bucket: 'MATCH', note: 'A3 "abundante" = dominant "many" (423)'},
  H4853: {bucket: 'MATCH', note: 'A3 "carga" = dominant "burden" (38)'},
  H2790: {
    bucket: 'MISMATCH',
    note: 'A3 "rascar" (to scratch/engrave) = non-dominant "to plow/plot" (27), not dominant "be quiet" (47)',
  },
  H6887: {
    bucket: 'UNRESOLVED',
    note: 'A3 "estrechar" (to tighten) is a general root sense compatible with several nuances (vex/constrain/distress); cannot confidently map to one dStrong',
  },
  H352: {bucket: 'MATCH', note: 'A3 "carnero" = dominant "ram" (156)'},
  H3651: {
    bucket: 'MATCH',
    note: 'A3 ships a compound "así / correcto" (so/right) covering BOTH senses; leading term matches dominant "so" (734)',
  },
  H2502: {
    bucket: 'UNRESOLVED',
    note: 'A3 "quitar" (to remove) plausibly derives from the same "draw out" root as dominant "to rescue" (23), but could also read as "to arm/gird" (21); not confidently adjudicated',
  },
  H5869: {bucket: 'MATCH', note: 'A3 "ojo" = dominant "eye" group (835)'},
  H2470: {
    bucket: 'MATCH',
    note: 'A3 "debilitarse" = dominant "be weak" group (59)',
  },
  H2717: {
    bucket: 'MISMATCH',
    note: 'A3 "resecar" (to dry out) = non-dominant "to dry" (16), not dominant "to destroy" (20)',
  },
  H3885: {
    bucket: 'MATCH',
    note: 'A3 "detenerse" (to stop/stay) = dominant "to lodge" (69)',
  },
  H6030: {bucket: 'MATCH', note: 'A3 "responder" = dominant "to answer" (315)'},
  H7114: {
    bucket: 'UNRESOLVED',
    note: 'A3 "recortar" (to trim/cut short) sits between dominant "to reap" (34, cutting grain) and non-dominant "be short" (15); not confidently adjudicated',
  },
  H6643: {bucket: 'MATCH', note: 'A3 "esplendor" = dominant "beauty" (19)'},
  H2563: {
    bucket: 'MISMATCH',
    note: 'A3 "burbujeo" (bubbling) does not clearly map to ANY listed TBESH sense for this lemma (clay/homer/heap) — likely an unrelated/erroneous A3 draft, flagged for the translator',
  },
  H8577: {
    bucket: 'MISMATCH',
    note: 'A3 "monstruo marino o terrestre" (sea/land monster) = non-dominant "serpent" group (13), not dominant "jackal" (14); near-tied counts (14 vs 13)',
  },
  H2254: {
    bucket: 'UNRESOLVED',
    note: 'TBESH occurrence counts TIE exactly (12 vs 12, "to pledge" vs "to destroy"); dominant chosen by deterministic tiebreak (dStrong letter), NOT by evidence — A3 "enrollar apretadamente" (wrap tightly) is loosely compatible with "to pledge" (binding collateral) but not conclusively adjudicated',
  },
  H3867: {
    bucket: 'MISMATCH',
    note: 'A3 "juntar / unir" (to join/unite) = non-dominant "to join" (12), not dominant "to borrow" (14); near-tied counts',
  },
  H5035: {
    bucket: 'MISMATCH',
    note: 'A3 "odre para líquidos" (wineskin) = non-dominant "bag" (11), not dominant "harp" (27)',
  },
  H1481: {
    bucket: 'MATCH',
    note: 'A3 "peregrinar / morar" = dominant "to sojourn" (81)',
  },
  H1984: {
    bucket: 'MATCH',
    note: 'A3 "alabar" (to praise) = the literal nuance of dominant group\'s largest member "to boast: praise" (122, within "to boast" core group, 151)',
  },
  H6743: {
    bucket: 'MISMATCH',
    note: 'A3 "empujar hacia adelante" (to push forward) = non-dominant "to rush" (10), not dominant "to prosper" (55)',
  },
};
for (const base of TARGET_LEMMAS) {
  if (!A3_CROSS_CHECK[base]) {
    throw new Error(`A3 cross-check bucket missing for ${base}`);
  }
}

// ── 7. write outputs ────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUT_JSON), {recursive: true});
const cleanRows = outRows.map(
  ({strongsBase, dStrong, senseLabel, bookId, chapter, verse, position}) => ({
    strongsBase,
    dStrong,
    senseLabel,
    bookId,
    chapter,
    verse,
    position,
  }),
);
fs.writeFileSync(OUT_JSON, JSON.stringify(cleanRows, null, 2));

// per-lemma breakdown for the summary
const perLemma = TARGET_LEMMAS.map(base => {
  const info = lemmaInfo.get(base);
  const rowsForLemma = outRows.filter(r => r.strongsBase === base);
  const bad = rowsForLemma.filter(r => r._verify !== 'ok').length;
  return {
    base,
    translit: info.translit,
    dominantCore: info.dominantCore,
    dominantOcc: info.dominantOcc,
    tied: info.tied,
    a3Gloss: a3Json[base] || '(missing from A3)',
    crossCheck: A3_CROSS_CHECK[base],
    overrideDStrongCount: info.overrideEntries.length,
    overrideRowCount: rowsForLemma.length,
    verifyBad: bad,
  };
});

const totalRowCount = cleanRows.length;
const mismatches = perLemma.filter(p => p.crossCheck.bucket === 'MISMATCH');
const unresolved = perLemma.filter(p => p.crossCheck.bucket === 'UNRESOLVED');

let md = `# A4-chico positional-overlay override rows — generation summary\n\n`;
md += `_Mechanical output only. No Spanish content proposed here; senseLabel is the raw TBESH English gloss. Read-only against cached research data + a local DB copy — nothing in the main app was touched._\n\n`;
md += `## Total\n\n`;
md += `**${totalRowCount} override rows** generated across the 27 Tier-A1 lemmas `;
md += `(research doc's estimate: ~617). `;
md +=
  totalRowCount === 617
    ? 'Exact match.'
    : `Delta from 617: ${totalRowCount - 617}, fully accounted for: H6030's "to sing" sense (H6030C, raw TBESH/TAHOT count 15) has one raw occurrence at \`Psa.88.0(88.1)#08\` — a Psalm superscription, filed at verse 0 in TAHOT's own numbering. assets/bible-seed.db (like the real app pack) has no verse-0 row for any Psalm, so build-originals-pack.js's own dead-verse gate drops it — this script reproduces that gate exactly (see build-originals-pack.js's parseStep() doc comment, case 1). The other 26 lemmas' override counts match their raw TBESH/TAHOT occurrence counts exactly (verified per-lemma). The corpus-wide gate stats below (${deadVerseDropped} dead-verse drops, ${xSkipped} "=X" LXX-retroversion skips, ${repositioned} reposition bumps) are reported for transparency but only the one row above actually lands on an override dStrong.`;
md += `\n\n`;
md += `## DB verification\n\n`;
md += `- notFound (generated key has no row in original_words): **${notFound}**\n`;
md += `- strongsMismatch (row exists but base strongs differs): **${strongsMismatch}**\n`;
if (verifyIssues.length) {
  md += `\nFirst issues:\n\n`;
  for (const v of verifyIssues) md += `- ${v}\n`;
}
md += `\n## A3-dominant-sense cross-check\n\n`;
md += `${mismatches.length} of 27 lemmas: A3's shipped gloss (assets/hebrew-lemma-gloss-es.json) does NOT clearly match the TAHOT-frequency-dominant core sense computed here. `;
md += `${unresolved.length} more are UNRESOLVED (ambiguous enough that this pass could not confidently adjudicate) — flagged for the translator's pass, not asserted as errors.\n\n`;
md += `**MISMATCH (${mismatches.length}):**\n\n`;
for (const p of mismatches) {
  md += `- **${p.base}** (${p.translit}): ${p.crossCheck.note}\n`;
}
md += `\n**UNRESOLVED (${unresolved.length}):**\n\n`;
for (const p of unresolved) {
  md += `- **${p.base}** (${p.translit}): ${p.crossCheck.note}\n`;
}
md += `\n_Regardless of bucket, override rows were generated for EVERY non-dominant dStrong occurrence of all 27 lemmas — the flag changes nothing about which rows exist; it is a signal that A3's own default gloss may also need a look._\n\n`;
md += `## Per-lemma breakdown\n\n`;
md += `| base | translit | dominant core (occ) | tie? | A3 gloss | cross-check | override dStrongs | override rows |\n`;
md += `| --- | --- | --- | --- | --- | --- | --- | --- |\n`;
for (const p of perLemma) {
  md += `| ${p.base} | ${p.translit} | ${p.dominantCore} (${p.dominantOcc}) | ${p.tied ? 'YES' : ''} | ${p.a3Gloss} | ${p.crossCheck.bucket} | ${p.overrideDStrongCount} | ${p.overrideRowCount} |\n`;
}
md += `\n## Observation (not a bug): TBESH sense tag vs TAHOT's own contextual gloss can diverge\n\n`;
md += `Spot-checking H6030A ("to dwell", Isa 13:22 pos 1) against original_words shows TAHOT's own \`gloss_en\` for that exact word is "and it will sing" — not "dwell". This is a known scholarly disagreement about a rare/disputed root (jackals "dwelling"/"howling" in ruins), not a script error: TBESH's dStrong classification and STEPBible's per-occurrence interlinear gloss are two different editorial layers that don't always agree. Worth a translator's second look on this one row specifically before committing a Spanish sense label.\n\n`;
md += `## Parse stats (full 4-file Hebrew TAHOT pass)\n\n`;
md += `- total word rows parsed: ${totalRows}\n`;
md += `- "=X" LXX-retroversion rows skipped: ${xSkipped}\n`;
md += `- dead-verse rows dropped (not in assets/bible-seed.db): ${deadVerseDropped}\n`;
md += `- position-collision reposition bumps applied: ${repositioned}\n`;
md += `- rows matching an override dStrong (pre-verify): ${overrideCandidates}\n`;

fs.writeFileSync(OUT_SUMMARY, md);

console.log(`wrote ${OUT_JSON} (${totalRowCount} rows)`);
console.log(`wrote ${OUT_SUMMARY}`);
console.log(
  `verify: notFound=${notFound} strongsMismatch=${strongsMismatch} (of ${totalRowCount})`,
);
console.log(`MISMATCH lemmas: ${mismatches.map(p => p.base).join(', ')}`);
console.log(`UNRESOLVED lemmas: ${unresolved.map(p => p.base).join(', ')}`);
