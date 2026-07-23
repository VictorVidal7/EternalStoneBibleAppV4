const fs = require('fs');
const path = require('path');
const {extractBookRedLetter} = require('./lib/usfmRedLetter');

/**
 * Red-letter (\wj) span extraction CLI — DIAGNOSTIC ONLY, does not write
 * anything into src/lib/database.
 *
 * Reads eBible.org's own USFM Bible files (fetch a WEB-family distribution's
 * *_usfm.zip from https://ebible.org/Scriptures/, e.g. eng-web_usfm.zip, and
 * unzip it) and reports, per book:
 *   - how many verses carry >=1 \wj ("words of Jesus") span
 *   - (with --anchor-check) what fraction of those spans can be found
 *     VERBATIM inside this app's own bundled WEB verse text
 *     (src/lib/database/bible-data-web.ts) — the diagnostic that surfaced
 *     the source-edition mismatch documented in the red-letter-web spike
 *     report. A low number here means the \wj offsets from THIS USFM source
 *     cannot be safely transplanted onto the app's own WEB text.
 *
 * This script deliberately stops short of writing a redLetterSpans dataset
 * into the app: doing so requires first resolving which text the spans will
 * be laid onto (see the report's 3 options). Re-run this after that decision
 * to confirm the coverage number is now ~100% before building the real
 * import.
 *
 * Usage:
 *   node scripts/extract-red-letter-web.js <dir-of-usfm-files> [--anchor-check]
 */

const USFM_TO_NAME = {
  MAT: 'Matthew',
  MRK: 'Mark',
  LUK: 'Luke',
  JHN: 'John',
  ACT: 'Acts',
  ROM: 'Romans',
  '1CO': '1 Corinthians',
  '2CO': '2 Corinthians',
  GAL: 'Galatians',
  EPH: 'Ephesians',
  PHP: 'Philippians',
  COL: 'Colossians',
  '1TH': '1 Thessalonians',
  '2TH': '2 Thessalonians',
  '1TI': '1 Timothy',
  '2TI': '2 Timothy',
  TIT: 'Titus',
  PHM: 'Philemon',
  HEB: 'Hebrews',
  JAS: 'James',
  '1PE': '1 Peter',
  '2PE': '2 Peter',
  '1JN': '1 John',
  '2JN': '2 John',
  '3JN': '3 John',
  JUD: 'Jude',
  REV: 'Revelation',
};

function loadAppWebData() {
  const appFile = path.join(__dirname, '../src/lib/database/bible-data-web.ts');
  const content = fs.readFileSync(appFile, 'utf8');
  const jsonStart = content.indexOf('[');
  const jsonEnd = content.lastIndexOf(']');
  const data = JSON.parse(content.slice(jsonStart, jsonEnd + 1));
  const map = {};
  for (const v of data) {
    map[`${v.book_name}|${v.chapter}:${v.verse}`] = v.text;
  }
  return map;
}

function main() {
  const dir = process.argv[2];
  const anchorCheck = process.argv.includes('--anchor-check');
  if (!dir) {
    console.error(
      'Usage: node scripts/extract-red-letter-web.js <dir-of-usfm-files> [--anchor-check]',
    );
    process.exit(1);
  }

  const appMap = anchorCheck ? loadAppWebData() : null;

  let totalVerses = 0;
  let wjVerses = 0;
  let totalSpans = 0;
  let anchoredSpans = 0;
  let fullyAnchoredVerses = 0;

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.usfm'));
  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const verses = extractBookRedLetter(content);
    const name = USFM_TO_NAME[verses[0]?.book];
    for (const v of verses) {
      totalVerses++;
      if (v.spans.length === 0) continue;
      wjVerses++;
      if (!anchorCheck || !name) continue;
      const appText = appMap[`${name}|${v.chapter}:${v.verse}`];
      let allOk = appText !== undefined;
      for (const span of v.spans) {
        totalSpans++;
        const segment = v.plainText.slice(span.start, span.end);
        if (appText && appText.includes(segment)) {
          anchoredSpans++;
        } else {
          allOk = false;
        }
      }
      if (allOk) fullyAnchoredVerses++;
    }
  }

  console.log(`Books processed: ${files.length}`);
  console.log(`Total verses: ${totalVerses}`);
  console.log(`Verses with >=1 \\wj span: ${wjVerses}`);
  if (anchorCheck) {
    console.log(
      `\nAnchor check vs this app's bundled WEB text (src/lib/database/bible-data-web.ts):`,
    );
    console.log(
      `  Spans found verbatim in app text: ${anchoredSpans}/${totalSpans} (${((anchoredSpans / totalSpans) * 100).toFixed(2)}%)`,
    );
    console.log(
      `  Verses fully anchored: ${fullyAnchoredVerses}/${wjVerses} (${((fullyAnchoredVerses / wjVerses) * 100).toFixed(2)}%)`,
    );
    console.log(
      `  A number well below 100% means this USFM source's \\wj offsets do NOT\n` +
        `  line up safely with the app's own WEB wording — do not import until\n` +
        `  this is resolved (see the red-letter-web spike report).`,
    );
  }
}

main();
