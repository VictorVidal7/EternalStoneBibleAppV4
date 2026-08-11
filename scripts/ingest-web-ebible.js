const fs = require('fs');
const path = require('path');
const {extractBookRedLetter} = require('./lib/usfmRedLetter');

/**
 * Re-ingest the WEB reading version from eBible.org's own USFM distribution
 * (the `engwebp` edition — "Updated" wording/LORD-GOD divine-name convention,
 * Apocrypha omitted to match this app's 66-book canon), replacing the
 * getbible.net-sourced `bible-data-web.ts` (Sprint 66) that turned out to be
 * a DIFFERENT WEB revision than any current eBible.org edition — the source
 * mismatch documented in the red-letter-web spike that blocked words-of-Christ
 * highlighting (only ~65% of \wj spans anchored verbatim in the old text).
 *
 * Because this script parses ONE source for BOTH the verse text and the \wj
 * red-letter spans, anchoring is 100% by construction — there is no second
 * source to drift out of alignment with the first, unlike the old approach.
 *
 * Usage:
 *   node scripts/ingest-web-ebible.js <dir-of-usfm-files> [--write]
 *
 * Without --write: parses, validates versification against BIBLE_BOOKS,
 * diffs the verse-key set against the CURRENT bible-data-web.ts, and prints a
 * report. Nothing is written — inspect the report before trusting the data.
 *
 * With --write: additionally emits:
 *   - src/lib/database/bible-data-web.ts   (same row shape as before)
 *   - src/lib/database/bible-data-web-redletter.ts (new — see below)
 */

// {id, nameEn, chapters} — must match src/constants/bible.ts BIBLE_BOOKS.
// Kept as a hand-copied literal (same convention as the original
// fetch-web-data.js) rather than importing the .ts constants file from this
// plain CommonJS script.
const BOOKS = [
  {id: 1, nameEn: 'Genesis', chapters: 50, usfm: 'GEN'},
  {id: 2, nameEn: 'Exodus', chapters: 40, usfm: 'EXO'},
  {id: 3, nameEn: 'Leviticus', chapters: 27, usfm: 'LEV'},
  {id: 4, nameEn: 'Numbers', chapters: 36, usfm: 'NUM'},
  {id: 5, nameEn: 'Deuteronomy', chapters: 34, usfm: 'DEU'},
  {id: 6, nameEn: 'Joshua', chapters: 24, usfm: 'JOS'},
  {id: 7, nameEn: 'Judges', chapters: 21, usfm: 'JDG'},
  {id: 8, nameEn: 'Ruth', chapters: 4, usfm: 'RUT'},
  {id: 9, nameEn: '1 Samuel', chapters: 31, usfm: '1SA'},
  {id: 10, nameEn: '2 Samuel', chapters: 24, usfm: '2SA'},
  {id: 11, nameEn: '1 Kings', chapters: 22, usfm: '1KI'},
  {id: 12, nameEn: '2 Kings', chapters: 25, usfm: '2KI'},
  {id: 13, nameEn: '1 Chronicles', chapters: 29, usfm: '1CH'},
  {id: 14, nameEn: '2 Chronicles', chapters: 36, usfm: '2CH'},
  {id: 15, nameEn: 'Ezra', chapters: 10, usfm: 'EZR'},
  {id: 16, nameEn: 'Nehemiah', chapters: 13, usfm: 'NEH'},
  {id: 17, nameEn: 'Esther', chapters: 10, usfm: 'EST'},
  {id: 18, nameEn: 'Job', chapters: 42, usfm: 'JOB'},
  {id: 19, nameEn: 'Psalms', chapters: 150, usfm: 'PSA'},
  {id: 20, nameEn: 'Proverbs', chapters: 31, usfm: 'PRO'},
  {id: 21, nameEn: 'Ecclesiastes', chapters: 12, usfm: 'ECC'},
  {id: 22, nameEn: 'Song of Solomon', chapters: 8, usfm: 'SNG'},
  {id: 23, nameEn: 'Isaiah', chapters: 66, usfm: 'ISA'},
  {id: 24, nameEn: 'Jeremiah', chapters: 52, usfm: 'JER'},
  {id: 25, nameEn: 'Lamentations', chapters: 5, usfm: 'LAM'},
  {id: 26, nameEn: 'Ezekiel', chapters: 48, usfm: 'EZK'},
  {id: 27, nameEn: 'Daniel', chapters: 12, usfm: 'DAN'},
  {id: 28, nameEn: 'Hosea', chapters: 14, usfm: 'HOS'},
  {id: 29, nameEn: 'Joel', chapters: 3, usfm: 'JOL'},
  {id: 30, nameEn: 'Amos', chapters: 9, usfm: 'AMO'},
  {id: 31, nameEn: 'Obadiah', chapters: 1, usfm: 'OBA'},
  {id: 32, nameEn: 'Jonah', chapters: 4, usfm: 'JON'},
  {id: 33, nameEn: 'Micah', chapters: 7, usfm: 'MIC'},
  {id: 34, nameEn: 'Nahum', chapters: 3, usfm: 'NAM'},
  {id: 35, nameEn: 'Habakkuk', chapters: 3, usfm: 'HAB'},
  {id: 36, nameEn: 'Zephaniah', chapters: 3, usfm: 'ZEP'},
  {id: 37, nameEn: 'Haggai', chapters: 2, usfm: 'HAG'},
  {id: 38, nameEn: 'Zechariah', chapters: 14, usfm: 'ZEC'},
  {id: 39, nameEn: 'Malachi', chapters: 4, usfm: 'MAL'},
  {id: 40, nameEn: 'Matthew', chapters: 28, usfm: 'MAT'},
  {id: 41, nameEn: 'Mark', chapters: 16, usfm: 'MRK'},
  {id: 42, nameEn: 'Luke', chapters: 24, usfm: 'LUK'},
  {id: 43, nameEn: 'John', chapters: 21, usfm: 'JHN'},
  {id: 44, nameEn: 'Acts', chapters: 28, usfm: 'ACT'},
  {id: 45, nameEn: 'Romans', chapters: 16, usfm: 'ROM'},
  {id: 46, nameEn: '1 Corinthians', chapters: 16, usfm: '1CO'},
  {id: 47, nameEn: '2 Corinthians', chapters: 13, usfm: '2CO'},
  {id: 48, nameEn: 'Galatians', chapters: 6, usfm: 'GAL'},
  {id: 49, nameEn: 'Ephesians', chapters: 6, usfm: 'EPH'},
  {id: 50, nameEn: 'Philippians', chapters: 4, usfm: 'PHP'},
  {id: 51, nameEn: 'Colossians', chapters: 4, usfm: 'COL'},
  {id: 52, nameEn: '1 Thessalonians', chapters: 5, usfm: '1TH'},
  {id: 53, nameEn: '2 Thessalonians', chapters: 3, usfm: '2TH'},
  {id: 54, nameEn: '1 Timothy', chapters: 6, usfm: '1TI'},
  {id: 55, nameEn: '2 Timothy', chapters: 4, usfm: '2TI'},
  {id: 56, nameEn: 'Titus', chapters: 3, usfm: 'TIT'},
  {id: 57, nameEn: 'Philemon', chapters: 1, usfm: 'PHM'},
  {id: 58, nameEn: 'Hebrews', chapters: 13, usfm: 'HEB'},
  {id: 59, nameEn: 'James', chapters: 5, usfm: 'JAS'},
  {id: 60, nameEn: '1 Peter', chapters: 5, usfm: '1PE'},
  {id: 61, nameEn: '2 Peter', chapters: 3, usfm: '2PE'},
  {id: 62, nameEn: '1 John', chapters: 5, usfm: '1JN'},
  {id: 63, nameEn: '2 John', chapters: 1, usfm: '2JN'},
  {id: 64, nameEn: '3 John', chapters: 1, usfm: '3JN'},
  {id: 65, nameEn: 'Jude', chapters: 1, usfm: 'JUD'},
  {id: 66, nameEn: 'Revelation', chapters: 22, usfm: 'REV'},
];

function findUsfmFile(dir, usfmCode) {
  const files = fs.readdirSync(dir);
  return files.find(f => f.includes(usfmCode) && f.endsWith('.usfm'));
}

function loadOldWebData() {
  const file = path.join(__dirname, '../src/lib/database/bible-data-web.ts');
  const content = fs.readFileSync(file, 'utf8');
  const jsonStart = content.indexOf('[');
  const jsonEnd = content.lastIndexOf(']');
  return JSON.parse(content.slice(jsonStart, jsonEnd + 1));
}

function main() {
  const dir = process.argv[2];
  const write = process.argv.includes('--write');
  if (!dir) {
    console.error(
      'Usage: node scripts/ingest-web-ebible.js <dir-of-usfm-files> [--write]',
    );
    process.exit(1);
  }

  const newVerses = []; // {book_id, book_name, chapter, verse, text, version}
  const redLetter = []; // {book_id, chapter, verse, spans: [[start,end], ...]}
  const chapterMismatches = [];
  let totalWjVerses = 0;
  let totalWjSpans = 0;

  for (const book of BOOKS) {
    const filename = findUsfmFile(dir, book.usfm);
    if (!filename) {
      console.error(`❌ Missing USFM file for ${book.nameEn} (${book.usfm})`);
      process.exit(1);
    }
    const content = fs.readFileSync(path.join(dir, filename), 'utf8');
    const verses = extractBookRedLetter(content);

    const maxChapter = Math.max(...verses.map(v => v.chapter));
    if (maxChapter !== book.chapters) {
      chapterMismatches.push(
        `${book.nameEn}: source has ${maxChapter} chapters, table expects ${book.chapters}`,
      );
    }

    for (const v of verses) {
      if (!v.plainText) continue; // skip empty/heading-only lines, if any
      newVerses.push({
        book_id: book.id,
        book_name: book.nameEn,
        chapter: v.chapter,
        verse: v.verse,
        text: v.plainText,
        version: 'WEB',
      });
      if (v.spans.length > 0) {
        totalWjVerses++;
        totalWjSpans += v.spans.length;
        redLetter.push({
          book_id: book.id,
          chapter: v.chapter,
          verse: v.verse,
          spans: v.spans.map(s => [s.start, s.end]),
        });
      }
    }
  }

  // --- Validation report -----------------------------------------------
  console.log('='.repeat(70));
  console.log(`Total verses parsed: ${newVerses.length.toLocaleString()}`);
  console.log(`Verses with >=1 \\wj (words of Jesus) span: ${totalWjVerses}`);
  console.log(`Total \\wj spans: ${totalWjSpans}`);
  console.log(
    `Chapter-count mismatches vs BIBLE_BOOKS: ${chapterMismatches.length}`,
  );
  for (const m of chapterMismatches) console.log('  ⚠️  ' + m);

  const oldData = loadOldWebData();
  const oldKeys = new Set(
    oldData.map(v => `${v.book_name}|${v.chapter}:${v.verse}`),
  );
  const newKeys = new Set(
    newVerses.map(v => `${v.book_name}|${v.chapter}:${v.verse}`),
  );
  const removed = [...oldKeys].filter(k => !newKeys.has(k));
  const added = [...newKeys].filter(k => !oldKeys.has(k));

  console.log('\n' + '-'.repeat(70));
  console.log(`Old dataset: ${oldData.length.toLocaleString()} verses`);
  console.log(`New dataset: ${newVerses.length.toLocaleString()} verses`);
  console.log(
    `Verse keys in OLD but NOT in NEW (would orphan any highlight/note/favorite anchored to them): ${removed.length}`,
  );
  for (const k of removed.slice(0, 50)) console.log('  - ' + k);
  if (removed.length > 50) console.log(`  ... and ${removed.length - 50} more`);
  console.log(
    `Verse keys in NEW but NOT in OLD (newly available): ${added.length}`,
  );
  for (const k of added.slice(0, 50)) console.log('  + ' + k);
  if (added.length > 50) console.log(`  ... and ${added.length - 50} more`);
  console.log('='.repeat(70));

  if (!write) {
    console.log(
      '\nDry run complete. Re-run with --write to emit the TS files.',
    );
    return;
  }

  const versesFile = path.join(
    __dirname,
    '../src/lib/database/bible-data-web.ts',
  );
  const versesContent = `// Auto-generated Bible data for WEB (World English Bible)
// Generated on: ${new Date().toISOString()}
// Total verses: ${newVerses.length}
// Source: World English Bible, Protestant/no-Apocrypha edition (engwebp) via
// eBible.org's own USFM distribution (https://eBible.org/Scriptures/engwebp_usfm.zip)
//
// ⚠️  IMPORTANT NOTICE:
// The World English Bible (WEB) is dedicated to the PUBLIC DOMAIN by its
// publisher (eBible.org / Michael Paul Johnson). It is a modern-English,
// readable update of the American Standard Version (1901) — free to copy,
// publish and reuse with no licensing required.
//
// Replaces an earlier getbible.net-sourced dataset that turned out to be a
// DIFFERENT WEB revision than any current eBible.org edition — this file's
// text and src/lib/database/bible-data-web-redletter.ts's \\wj spans come
// from ONE parse of this same source, so they are anchored by construction.

export const WEB_DATA = ${JSON.stringify(newVerses, null, 2)};
`;
  fs.writeFileSync(versesFile, versesContent);
  const versesSizeMB = (fs.statSync(versesFile).size / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Wrote ${path.basename(versesFile)} (${versesSizeMB} MB)`);

  const redLetterFile = path.join(
    __dirname,
    '../src/lib/database/bible-data-web-redletter.ts',
  );
  const redLetterContent = `// Auto-generated "words of Jesus" (\\wj) spans for the WEB reading version.
// Generated on: ${new Date().toISOString()}
// Verses with >=1 span: ${redLetter.length}
// Total spans: ${totalWjSpans}
//
// Each span is a [start, end) character offset (end-exclusive) into that
// verse's PLAIN text as stored in bible-data-web.ts — both files come from
// the SAME parse of the SAME eBible.org engwebp USFM source, so offsets are
// anchored by construction with no separate alignment step. WEB-only; every
// other reading version is unaffected and this array is simply not
// consulted for them.

export interface RedLetterVerse {
  book_id: number;
  chapter: number;
  verse: number;
  spans: [number, number][];
}

export const WEB_RED_LETTER: RedLetterVerse[] = ${JSON.stringify(redLetter, null, 2)};
`;
  fs.writeFileSync(redLetterFile, redLetterContent);
  const rlSizeMB = (fs.statSync(redLetterFile).size / 1024 / 1024).toFixed(2);
  console.log(`✅ Wrote ${path.basename(redLetterFile)} (${rlSizeMB} MB)`);
}

main();
