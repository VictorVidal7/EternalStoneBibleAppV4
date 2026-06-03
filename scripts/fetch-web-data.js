const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Fetch the World English Bible (WEB) — a modern-English, PUBLIC-DOMAIN
 * translation — and emit it as `src/lib/database/bible-data-web.ts` in the exact
 * row shape the runtime SQLite loader (`bibleDB.insertVerses`) expects, so WEB
 * becomes a first-class reading version alongside RVR1960 + KJV (Sprint 66).
 *
 * Source: getbible.net v2 (`https://api.getbible.net/v2/web/<nr>.json`). The WEB
 * is dedicated to the public domain by its publisher (eBible.org / Michael
 * Paul Johnson) — free to copy and reuse, no licensing required.
 *
 * The 66 books are keyed by their canonical 1..66 number, which getbible serves
 * in the same Protestant order as our static book table — we re-key book_id /
 * book_name from OUR table (not getbible's strings) so the rows match KJV/RVR
 * byte-for-byte in identity. Run with `--write` to emit the file; without it the
 * script only fetches + validates versification against the book table and
 * prints a report (use this before trusting the data).
 *
 * Usage:  node scripts/fetch-web-data.js [--write]
 */

// {id, nameEn, chapters} — must match src/constants/bible.ts BIBLE_BOOKS.
const BOOKS = [
  {id: 1, nameEn: 'Genesis', chapters: 50},
  {id: 2, nameEn: 'Exodus', chapters: 40},
  {id: 3, nameEn: 'Leviticus', chapters: 27},
  {id: 4, nameEn: 'Numbers', chapters: 36},
  {id: 5, nameEn: 'Deuteronomy', chapters: 34},
  {id: 6, nameEn: 'Joshua', chapters: 24},
  {id: 7, nameEn: 'Judges', chapters: 21},
  {id: 8, nameEn: 'Ruth', chapters: 4},
  {id: 9, nameEn: '1 Samuel', chapters: 31},
  {id: 10, nameEn: '2 Samuel', chapters: 24},
  {id: 11, nameEn: '1 Kings', chapters: 22},
  {id: 12, nameEn: '2 Kings', chapters: 25},
  {id: 13, nameEn: '1 Chronicles', chapters: 29},
  {id: 14, nameEn: '2 Chronicles', chapters: 36},
  {id: 15, nameEn: 'Ezra', chapters: 10},
  {id: 16, nameEn: 'Nehemiah', chapters: 13},
  {id: 17, nameEn: 'Esther', chapters: 10},
  {id: 18, nameEn: 'Job', chapters: 42},
  {id: 19, nameEn: 'Psalms', chapters: 150},
  {id: 20, nameEn: 'Proverbs', chapters: 31},
  {id: 21, nameEn: 'Ecclesiastes', chapters: 12},
  {id: 22, nameEn: 'Song of Solomon', chapters: 8},
  {id: 23, nameEn: 'Isaiah', chapters: 66},
  {id: 24, nameEn: 'Jeremiah', chapters: 52},
  {id: 25, nameEn: 'Lamentations', chapters: 5},
  {id: 26, nameEn: 'Ezekiel', chapters: 48},
  {id: 27, nameEn: 'Daniel', chapters: 12},
  {id: 28, nameEn: 'Hosea', chapters: 14},
  {id: 29, nameEn: 'Joel', chapters: 3},
  {id: 30, nameEn: 'Amos', chapters: 9},
  {id: 31, nameEn: 'Obadiah', chapters: 1},
  {id: 32, nameEn: 'Jonah', chapters: 4},
  {id: 33, nameEn: 'Micah', chapters: 7},
  {id: 34, nameEn: 'Nahum', chapters: 3},
  {id: 35, nameEn: 'Habakkuk', chapters: 3},
  {id: 36, nameEn: 'Zephaniah', chapters: 3},
  {id: 37, nameEn: 'Haggai', chapters: 2},
  {id: 38, nameEn: 'Zechariah', chapters: 14},
  {id: 39, nameEn: 'Malachi', chapters: 4},
  {id: 40, nameEn: 'Matthew', chapters: 28},
  {id: 41, nameEn: 'Mark', chapters: 16},
  {id: 42, nameEn: 'Luke', chapters: 24},
  {id: 43, nameEn: 'John', chapters: 21},
  {id: 44, nameEn: 'Acts', chapters: 28},
  {id: 45, nameEn: 'Romans', chapters: 16},
  {id: 46, nameEn: '1 Corinthians', chapters: 16},
  {id: 47, nameEn: '2 Corinthians', chapters: 13},
  {id: 48, nameEn: 'Galatians', chapters: 6},
  {id: 49, nameEn: 'Ephesians', chapters: 6},
  {id: 50, nameEn: 'Philippians', chapters: 4},
  {id: 51, nameEn: 'Colossians', chapters: 4},
  {id: 52, nameEn: '1 Thessalonians', chapters: 5},
  {id: 53, nameEn: '2 Thessalonians', chapters: 3},
  {id: 54, nameEn: '1 Timothy', chapters: 6},
  {id: 55, nameEn: '2 Timothy', chapters: 4},
  {id: 56, nameEn: 'Titus', chapters: 3},
  {id: 57, nameEn: 'Philemon', chapters: 1},
  {id: 58, nameEn: 'Hebrews', chapters: 13},
  {id: 59, nameEn: 'James', chapters: 5},
  {id: 60, nameEn: '1 Peter', chapters: 5},
  {id: 61, nameEn: '2 Peter', chapters: 3},
  {id: 62, nameEn: '1 John', chapters: 5},
  {id: 63, nameEn: '2 John', chapters: 1},
  {id: 64, nameEn: '3 John', chapters: 1},
  {id: 65, nameEn: 'Jude', chapters: 1},
  {id: 66, nameEn: 'Revelation', chapters: 22},
];

const BASE_URL = 'https://api.getbible.net/v2/web';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, {headers: {'User-Agent': 'Mozilla/5.0'}}, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          if (res.statusCode === 200) {
            if (data.charCodeAt(0) === 0xfeff) data = data.slice(1);
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          }
        });
      })
      .on('error', reject);
  });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// Normalize the WEB text: collapse internal runs of whitespace, trim ends.
// getbible occasionally leaves a trailing double-space on a verse.
function cleanText(t) {
  return String(t).replace(/\s+/g, ' ').trim();
}

async function fetchBook(book) {
  const json = await httpsGet(`${BASE_URL}/${book.id}.json`);
  const parsed = JSON.parse(json);
  const verses = [];
  const chaptersSeen = new Set();
  for (const ch of parsed.chapters || []) {
    const chapterNum = parseInt(ch.chapter, 10);
    chaptersSeen.add(chapterNum);
    for (const v of ch.verses || []) {
      verses.push({
        book_id: book.id,
        book_name: book.nameEn,
        chapter: chapterNum,
        verse: parseInt(v.verse, 10),
        text: cleanText(v.text),
        version: 'WEB',
      });
    }
  }
  return {verses, maxChapter: Math.max(...chaptersSeen), chaptersSeen};
}

async function main() {
  const write = process.argv.includes('--write');
  console.log(`📖 Fetching World English Bible (WEB) from getbible.net`);
  console.log(
    `   mode: ${write ? 'WRITE the TS file' : 'VALIDATE only (dry run)'}\n`,
  );

  const allVerses = [];
  const mismatches = [];
  let total = 0;

  for (const book of BOOKS) {
    process.stdout.write(
      `[${String(book.id).padStart(2)}/66] ${book.nameEn.padEnd(18)} `,
    );
    const {verses, maxChapter} = await fetchBook(book);
    allVerses.push(...verses);
    total += verses.length;
    const ok = maxChapter === book.chapters;
    if (!ok) {
      mismatches.push(
        `${book.nameEn}: WEB has ${maxChapter} chapters, table expects ${book.chapters}`,
      );
    }
    console.log(
      `${verses.length} verses, ${maxChapter} ch ${ok ? '✓' : '⚠️ MISMATCH'}`,
    );
    await delay(60);
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Total WEB verses: ${total.toLocaleString()}`);
  console.log(`Chapter-count mismatches vs book table: ${mismatches.length}`);
  for (const m of mismatches) console.log('  ⚠️  ' + m);
  console.log('='.repeat(60) + '\n');

  if (!write) {
    console.log('Dry run complete. Re-run with --write to emit the TS file.');
    return;
  }

  const outputFile = path.join(
    __dirname,
    '../src/lib/database/bible-data-web.ts',
  );
  const tsContent = `// Auto-generated Bible data for WEB (World English Bible)
// Generated on: ${new Date().toISOString()}
// Total verses: ${total}
// Source: World English Bible via getbible.net v2 (api.getbible.net/v2/web)
//
// ⚠️  IMPORTANT NOTICE:
// The World English Bible (WEB) is dedicated to the PUBLIC DOMAIN by its
// publisher (eBible.org / Michael Paul Johnson). It is a modern-English,
// readable update of the American Standard Version (1901) — free to copy,
// publish and reuse with no licensing required.

export const WEB_DATA = ${JSON.stringify(allVerses, null, 2)};
`;
  fs.writeFileSync(outputFile, tsContent);
  const sizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);
  console.log(
    `✅ Wrote ${path.basename(outputFile)} (${sizeMB} MB, ${total} verses)`,
  );
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
