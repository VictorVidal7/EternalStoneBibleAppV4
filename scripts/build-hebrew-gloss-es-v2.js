#!/usr/bin/env node
/**
 * Combines the two 60th-session A4 research agents' output into the final
 * `hebrew_gloss_es` positional-overlay extension:
 *   - DOCS/drafts/a4-override-positions.json (mechanical (book,chapter,verse,
 *     position) keys for every non-dominant-sense TAHOT occurrence of the 27
 *     Tier-A1 lemmas, 616 rows, no Spanish content)
 *   - The hand-transcribed ES-gloss lookup below, extracted from
 *     DOCS/drafts/a4-positional-overlay-glosses.md (78 senses, 71 shipped —
 *     7 excluded per that file's own "uncertain/no citation" flags)
 *
 * Run: node scripts/build-hebrew-gloss-es-v2.js [--check]
 * --check: report only, don't write assets/hebrew-gloss-es-v1.json.
 */
const fs = require('fs');
const path = require('path');

const POSITIONS_PATH = path.join(
  __dirname,
  '..',
  'DOCS/drafts/a4-override-positions.json',
);
const ASSET_PATH = path.join(__dirname, '..', 'assets/hebrew-gloss-es-v1.json');

// dStrong -> Spanish gloss, transcribed from
// DOCS/drafts/a4-positional-overlay-glosses.md. 78 senses total; the 7 in
// EXCLUDED_D_STRONGS are intentionally omitted (uncertain root-tagging, no
// citation, or zero OT occurrences per that file's own flags).
const ES_GLOSS = {
  H5608A: 'recontar',
  H5608B: 'secretario',
  H2691A: 'atrio',
  H2691B: 'aldea',
  H3384B: 'enseñar',
  H3384A: 'disparar',
  H5971A: 'pueblo',
  H5971K: 'soldados',
  H5971B: 'pariente',
  H5971L: 'criaturas',
  H6862C: 'adversario',
  H6862B: 'tribulación',
  H6862A: 'estrecho',
  H6862D: 'aprieto',
  H7227A: 'abundante',
  H7227B: 'capitán',
  H4853A: 'carga',
  H4853B: 'profecía',
  H2790B: 'callar',
  H2790A: 'arar',
  H6887D: 'hostigar',
  H6887C: 'angustiar',
  H6887E: 'rivalizar',
  H352A: 'carnero',
  H352B: 'poste',
  H352C: 'líder',
  H352D: 'terebinto',
  H3651C: 'así',
  H3651A: 'correcto',
  H2502A: 'rescatar',
  H2502B: 'armar',
  H5869A: 'ojo',
  H5869H: 'mirada',
  H5869I: 'aspecto',
  H5869M: 'fuente',
  H5869K: 'mal de ojo',
  H2470H: 'enfermar',
  H2470B: 'suplicar',
  H2470I: 'entristecerse',
  H2470A: 'debilitarse',
  H2717B: 'arrasar',
  H2717A: 'secar',
  H3885A: 'pernoctar',
  H3885B: 'murmurar',
  H6030B: 'responder',
  H6030C: 'cantar',
  H7114B: 'segar',
  H7114A: 'congoja',
  H6643A: 'esplendor',
  H6643B: 'gacela',
  H2563A: 'barro',
  H2563C: 'homer (medida)',
  H2563B: 'montón',
  H8577A: 'chacal',
  H8577N: 'dragón',
  H8577M: 'serpiente',
  H2254A: 'empeñar',
  H2254B: 'arruinar',
  H2254C: 'estar de parto',
  H3867B: 'pedir prestado',
  H3867A: 'unir',
  H5035B: 'salterio',
  H5035A: 'odre',
  H1481A: 'peregrinar',
  H1481C: 'temer',
  H1984B: 'alabar',
  H1984H: 'jactarse',
  H1984C: 'enloquecer',
  H1984A: 'brillar',
  H6743B: 'prosperar',
  H6743A: 'arremeter',
};

const EXCLUDED_D_STRONGS = [
  'H6887A', // to confine — 0 OT occurrences, no citation possible
  'H6887B', // to constrain — citation real but word-fit to "estrechar" weak
  'H3651B', // as — root-tagging uncertain
  'H2717C', // to slay — may tag the related noun "sword" instead
  'H6030A', // to dwell — no citation found, refused to invent one
  'H1481B', // to quarrel — root uncertain
  'H1984I', // rave madly — root uncertain, borders H1984C
];

function main() {
  const checkOnly = process.argv.includes('--check');

  const positions = JSON.parse(fs.readFileSync(POSITIONS_PATH, 'utf8'));
  const existing = JSON.parse(fs.readFileSync(ASSET_PATH, 'utf8'));

  const existingKeys = new Set(
    existing.map(r => `${r.bookId}:${r.chapter}:${r.verse}:${r.position}`),
  );

  // Agent 2's position generator grouped TBESH sub-entries by CORE sense
  // (splitting on ':'/'»' before comparing occurrence counts), so it only
  // emits override rows for a core sense that is NOT the dominant one --
  // sub-senses that share a dominant core label (e.g. "be weak: ill"/
  // "be weak: grieved"/"be weak: weak" all folding into "be weak") get ZERO
  // rows even though Agent 1 (translation) gave each dStrong its own gloss.
  // That's a real granularity mismatch between the two agents, not a bug in
  // either -- ES_GLOSS below has entries for dStrongs that never surface in
  // `positions` at all. Ship the intersection; report the gap.
  const dStrongsWithPositions = new Set(positions.map(r => r.dStrong));
  const glossedButNoPositions = Object.keys(ES_GLOSS).filter(
    d => !dStrongsWithPositions.has(d),
  );

  const included = positions.filter(
    r => !EXCLUDED_D_STRONGS.includes(r.dStrong) && ES_GLOSS[r.dStrong],
  );
  const excludedCount = positions.length - included.length;

  const newRows = [];
  const collisions = [];
  for (const r of included) {
    const key = `${r.bookId}:${r.chapter}:${r.verse}:${r.position}`;
    if (existingKeys.has(key)) {
      collisions.push({...r, key});
      continue;
    }
    newRows.push({
      bookId: r.bookId,
      chapter: r.chapter,
      verse: r.verse,
      position: r.position,
      glossEs: ES_GLOSS[r.dStrong],
    });
  }

  const dStrongsUsed = new Set(included.map(r => r.dStrong));

  console.log(`Position rows (total):              ${positions.length}`);
  console.log(`Excluded (uncertain/no-cite/no-gloss): ${excludedCount}`);
  console.log(`Included, distinct dStrongs shipped: ${dStrongsUsed.size}`);
  console.log(
    `ES_GLOSS entries defined:           ${Object.keys(ES_GLOSS).length}`,
  );
  console.log(
    `Glossed but no position rows (core-sense-grouping gap): ${glossedButNoPositions.length}` +
      (glossedButNoPositions.length
        ? ' -> ' + glossedButNoPositions.join(', ')
        : ''),
  );
  console.log(`Existing overlay rows:              ${existing.length}`);
  console.log(`New rows to add:                    ${newRows.length}`);
  console.log(
    `Collisions with existing:           ${collisions.length}${collisions.length ? ' -> ' + JSON.stringify(collisions.slice(0, 5)) : ''}`,
  );
  console.log(
    `Final overlay row count:            ${existing.length + newRows.length}`,
  );

  if (collisions.length > 0) {
    throw new Error(
      `${collisions.length} new row(s) collide with an existing (bookId,chapter,verse,position) key -- resolve before writing.`,
    );
  }

  const combined = [...existing, ...newRows].sort((a, b) => {
    if (a.bookId !== b.bookId) return a.bookId - b.bookId;
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    if (a.verse !== b.verse) return a.verse - b.verse;
    return a.position - b.position;
  });

  if (checkOnly) {
    console.log(
      '\n--check: not writing. Re-run without --check to write assets/hebrew-gloss-es-v1.json.',
    );
    return;
  }

  fs.writeFileSync(ASSET_PATH, JSON.stringify(combined, null, 2) + '\n');
  console.log(`\nWrote ${combined.length} rows to ${ASSET_PATH}`);
}

main();
