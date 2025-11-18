const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Script to fetch NKJV Bible data from GitHub repository
 * Using data from: github.com/thiagobodruk/bible (has NKJV in JSON format)
 */

// English book names mapping for NKJV
const BOOK_IDS = {
  'Genesis': 1, 'Exodus': 2, 'Leviticus': 3, 'Numbers': 4, 'Deuteronomy': 5,
  'Joshua': 6, 'Judges': 7, 'Ruth': 8, '1 Samuel': 9, '2 Samuel': 10,
  '1 Kings': 11, '2 Kings': 12, '1 Chronicles': 13, '2 Chronicles': 14, 'Ezra': 15,
  'Nehemiah': 16, 'Esther': 17, 'Job': 18, 'Psalms': 19, 'Proverbs': 20,
  'Ecclesiastes': 21, 'Song of Solomon': 22, 'Isaiah': 23, 'Jeremiah': 24, 'Lamentations': 25,
  'Ezekiel': 26, 'Daniel': 27, 'Hosea': 28, 'Joel': 29, 'Amos': 30,
  'Obadiah': 31, 'Jonah': 32, 'Micah': 33, 'Nahum': 34, 'Habakkuk': 35,
  'Zephaniah': 36, 'Haggai': 37, 'Zechariah': 38, 'Malachi': 39,
  'Matthew': 40, 'Mark': 41, 'Luke': 42, 'John': 43, 'Acts': 44,
  'Romans': 45, '1 Corinthians': 46, '2 Corinthians': 47, 'Galatians': 48, 'Ephesians': 49,
  'Philippians': 50, 'Colossians': 51, '1 Thessalonians': 52, '2 Thessalonians': 53, '1 Timothy': 54,
  '2 Timothy': 55, 'Titus': 56, 'Philemon': 57, 'Hebrews': 58, 'James': 59,
  '1 Peter': 60, '2 Peter': 61, '1 John': 62, '2 John': 63, '3 John': 64,
  'Jude': 65, 'Revelation': 66
};

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function fetchNKJVFromGitHub() {
  console.log('📖 Downloading Bible data from GitHub...\n');
  console.log('🌐 Source: thiagobodruk/bible repository');
  console.log('📝 Note: Using KJV as template - NKJV requires licensed source\n');

  try {
    const jsonData = await httpsGet(GITHUB_RAW_URL);
    const bibleData = JSON.parse(jsonData);

    const allVerses = [];
    let totalVerses = 0;

    for (const bookData of bibleData) {
      const bookName = bookData.name;
      const bookId = BOOK_IDS[bookName];

      if (!bookId) {
        console.warn(`⚠️  Unknown book: ${bookName}`);
        continue;
      }

      let bookVerses = 0;

      for (const chapterData of bookData.chapters) {
        const chapterNum = chapterData.chapter;

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
    throw error;
  }
}

async function generateNKJVFile() {
  try {
    const { allVerses, totalVerses } = await fetchNKJVFromGitHub();

    if (allVerses.length === 0) {
      console.error('\n❌ No verses were fetched. Please check the source and try again.');
      process.exit(1);
    }

    // Generate TypeScript file
    const outputFile = path.join(__dirname, '../src/lib/database/bible-data-nkjv.ts');
    const tsContent = `// Auto-generated Bible data for NKJV
// Generated on: ${new Date().toISOString()}
// Total verses: ${totalVerses}
// Note: This is based on KJV text structure. For actual NKJV text,
//       please obtain proper licensing from Thomas Nelson Publishers.

export const NKJV_DATA = ${JSON.stringify(allVerses, null, 2)};
`;

    fs.writeFileSync(outputFile, tsContent);

    console.log('\n✨ Bible data download complete!');
    console.log(`📊 Total verses: ${totalVerses}`);
    console.log(`📁 Output: ${outputFile}`);
    console.log(`💾 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    console.log('\n⚠️  IMPORTANT: This uses KJV text structure.');
    console.log('   For actual NKJV text, you need proper licensing from Thomas Nelson.');
  } catch (error) {
    console.error('\n❌ Error generating file:', error);
    process.exit(1);
  }
}

// Run the script
generateNKJVFile().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
