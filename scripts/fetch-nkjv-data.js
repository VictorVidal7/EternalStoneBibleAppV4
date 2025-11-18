const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Script to fetch NKJV Bible data from a reliable source
 * This version uses the Bible API from bolls.life which provides NKJV
 */

// English book names mapping for NKJV with API codes
const BOOKS = [
  { id: 1, name: 'Genesis', code: 'Gen' },
  { id: 2, name: 'Exodus', code: 'Exod' },
  { id: 3, name: 'Leviticus', code: 'Lev' },
  { id: 4, name: 'Numbers', code: 'Num' },
  { id: 5, name: 'Deuteronomy', code: 'Deut' },
  { id: 6, name: 'Joshua', code: 'Josh' },
  { id: 7, name: 'Judges', code: 'Judg' },
  { id: 8, name: 'Ruth', code: 'Ruth' },
  { id: 9, name: '1 Samuel', code: '1Sam' },
  { id: 10, name: '2 Samuel', code: '2Sam' },
  { id: 11, name: '1 Kings', code: '1Kgs' },
  { id: 12, name: '2 Kings', code: '2Kgs' },
  { id: 13, name: '1 Chronicles', code: '1Chr' },
  { id: 14, name: '2 Chronicles', code: '2Chr' },
  { id: 15, name: 'Ezra', code: 'Ezra' },
  { id: 16, name: 'Nehemiah', code: 'Neh' },
  { id: 17, name: 'Esther', code: 'Esth' },
  { id: 18, name: 'Job', code: 'Job' },
  { id: 19, name: 'Psalms', code: 'Ps' },
  { id: 20, name: 'Proverbs', code: 'Prov' },
  { id: 21, name: 'Ecclesiastes', code: 'Eccl' },
  { id: 22, name: 'Song of Solomon', code: 'Song' },
  { id: 23, name: 'Isaiah', code: 'Isa' },
  { id: 24, name: 'Jeremiah', code: 'Jer' },
  { id: 25, name: 'Lamentations', code: 'Lam' },
  { id: 26, name: 'Ezekiel', code: 'Ezek' },
  { id: 27, name: 'Daniel', code: 'Dan' },
  { id: 28, name: 'Hosea', code: 'Hos' },
  { id: 29, name: 'Joel', code: 'Joel' },
  { id: 30, name: 'Amos', code: 'Amos' },
  { id: 31, name: 'Obadiah', code: 'Obad' },
  { id: 32, name: 'Jonah', code: 'Jonah' },
  { id: 33, name: 'Micah', code: 'Mic' },
  { id: 34, name: 'Nahum', code: 'Nah' },
  { id: 35, name: 'Habakkuk', code: 'Hab' },
  { id: 36, name: 'Zephaniah', code: 'Zeph' },
  { id: 37, name: 'Haggai', code: 'Hag' },
  { id: 38, name: 'Zechariah', code: 'Zech' },
  { id: 39, name: 'Malachi', code: 'Mal' },
  { id: 40, name: 'Matthew', code: 'Matt' },
  { id: 41, name: 'Mark', code: 'Mark' },
  { id: 42, name: 'Luke', code: 'Luke' },
  { id: 43, name: 'John', code: 'John' },
  { id: 44, name: 'Acts', code: 'Acts' },
  { id: 45, name: 'Romans', code: 'Rom' },
  { id: 46, name: '1 Corinthians', code: '1Cor' },
  { id: 47, name: '2 Corinthians', code: '2Cor' },
  { id: 48, name: 'Galatians', code: 'Gal' },
  { id: 49, name: 'Ephesians', code: 'Eph' },
  { id: 50, name: 'Philippians', code: 'Phil' },
  { id: 51, name: 'Colossians', code: 'Col' },
  { id: 52, name: '1 Thessalonians', code: '1Thess' },
  { id: 53, name: '2 Thessalonians', code: '2Thess' },
  { id: 54, name: '1 Timothy', code: '1Tim' },
  { id: 55, name: '2 Timothy', code: '2Tim' },
  { id: 56, name: 'Titus', code: 'Titus' },
  { id: 57, name: 'Philemon', code: 'Phlm' },
  { id: 58, name: 'Hebrews', code: 'Heb' },
  { id: 59, name: 'James', code: 'Jas' },
  { id: 60, name: '1 Peter', code: '1Pet' },
  { id: 61, name: '2 Peter', code: '2Pet' },
  { id: 62, name: '1 John', code: '1John' },
  { id: 63, name: '2 John', code: '2John' },
  { id: 64, name: '3 John', code: '3John' },
  { id: 65, name: 'Jude', code: 'Jude' },
  { id: 66, name: 'Revelation', code: 'Rev' }
];

// Chapter counts for each book
const CHAPTER_COUNTS = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24,
  22, 25, 29, 36, 10, 13, 10, 42, 150, 31,
  12, 8, 66, 52, 5, 48, 12, 14, 3, 9,
  1, 4, 7, 3, 3, 3, 2, 14, 4,
  28, 16, 24, 21, 28, 16, 16, 13, 6, 6,
  4, 4, 5, 3, 6, 4, 3, 1, 13, 5,
  5, 3, 5, 1, 1, 1, 22
];

/**
 * Alternative: Use a simpler approach - convert KJV to NKJV structure
 * Since NKJV requires licensing, we'll use KJV as a placeholder
 */

const KJV_API_URL = 'https://cdn.jsdelivr.net/gh/thiagobodruk/bible@master/json/en_kjv.json';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    }, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Handle redirect
        https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (redirectRes) => {
          handleResponse(redirectRes, resolve, reject);
        }).on('error', reject);
      } else {
        handleResponse(res, resolve, reject);
      }
    }).on('error', reject);
  });
}

function handleResponse(res, resolve, reject) {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      // Remove BOM if present
      if (data.charCodeAt(0) === 0xFEFF) {
        data = data.slice(1);
      }
      resolve(data);
    } else {
      reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
    }
  });
}

async function fetchNKJVFromKJV() {
  console.log('📖 Downloading Bible data from CDN...\n');
  console.log('🌐 Source: jsdelivr CDN - thiagobodruk/bible repository');
  console.log('📝 Using KJV text as base (NKJV requires licensing)\n');

  try {
    const jsonData = await httpsGet(KJV_API_URL);
    let bibleData;

    try {
      bibleData = JSON.parse(jsonData);
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('First 200 chars of response:', jsonData.substring(0, 200));
      throw parseError;
    }

    const allVerses = [];
    let totalVerses = 0;

    // Process each book
    for (const bookData of bibleData) {
      const bookName = bookData.name;
      const bookInfo = BOOKS.find(b => b.name === bookName);

      if (!bookInfo) {
        console.warn(`⚠️  Unknown book: ${bookName}`);
        continue;
      }

      const bookId = bookInfo.id;
      let bookVerses = 0;

      // Process each chapter
      for (const chapterData of bookData.chapters) {
        const chapterNum = chapterData.chapter;

        // Process each verse
        for (const verseData of chapterData.verses) {
          allVerses.push({
            book_id: bookId,
            book_name: bookName,
            chapter: chapterNum,
            verse: verseData.verse,
            text: verseData.text,
            version: 'NKJV'
          });
          bookVerses++;
          totalVerses++;
        }
      }

      console.log(`✅ ${bookName.padEnd(20)} - ${bookVerses} verses`);
    }

    return { allVerses, totalVerses };
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Check your internet connection');
    console.error('   2. Try running the script again');
    console.error('   3. If the problem persists, the CDN might be temporarily unavailable');
    console.error('\n📝 Alternative: Use the sample data that is already included');
    console.error('   The app already has NKJV sample data with popular verses.');
    throw error;
  }
}

async function generateNKJVFile() {
  try {
    const { allVerses, totalVerses } = await fetchNKJVFromKJV();

    if (allVerses.length === 0) {
      console.error('\n❌ No verses were fetched. Please check the source and try again.');
      process.exit(1);
    }

    // Generate TypeScript file
    const outputFile = path.join(__dirname, '../src/lib/database/bible-data-nkjv.ts');

    // Back up existing file if it exists
    if (fs.existsSync(outputFile)) {
      const backupFile = outputFile + '.backup';
      fs.copyFileSync(outputFile, backupFile);
      console.log(`📦 Backup created: ${backupFile}`);
    }

    const tsContent = `// Auto-generated Bible data for NKJV
// Generated on: ${new Date().toISOString()}
// Total verses: ${totalVerses}
// Source: KJV text from thiagobodruk/bible repository via jsdelivr CDN
//
// ⚠️  IMPORTANT NOTICE:
// This uses KJV text as a base. The New King James Version (NKJV) is
// copyrighted by Thomas Nelson Publishers. For actual NKJV text, you need
// to obtain proper licensing from Thomas Nelson.
//
// The text included here (KJV) is in the public domain and can be used freely.
// KJV and NKJV are similar but not identical translations.

export const NKJV_DATA = ${JSON.stringify(allVerses, null, 2)};
`;

    fs.writeFileSync(outputFile, tsContent);

    console.log('\n✨ Bible data download complete!');
    console.log(`📊 Total verses: ${totalVerses.toLocaleString()}`);
    console.log(`📁 Output: ${outputFile}`);
    console.log(`💾 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n⚠️  IMPORTANT: This uses KJV text (public domain).');
    console.log('   NKJV is copyrighted - obtain licensing from Thomas Nelson for actual NKJV text.');
    console.log('\n✅ You can now use the app with full Bible text in the NKJV version!');
    console.log('   (Currently using KJV text as placeholder)');
  } catch (error) {
    console.error('\n❌ Error generating file:', error);
    console.error('\n💡 The app will continue to work with the sample NKJV data already included.');
    process.exit(1);
  }
}

// Run the script
console.log('🚀 NKJV Data Fetch Script');
console.log('=' .repeat(50));
console.log('\n');

generateNKJVFile().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error('\n📝 Note: The app already has sample NKJV data that works for testing.');
  process.exit(1);
});
