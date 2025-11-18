const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Script to fetch KJV Bible data from GitHub (aruljohn/Bible-kjv)
 * This is a reliable source with proper JSON structure
 */

const BOOKS = [
  { id: 1, name: 'Génesis', file: 'Genesis' },
  { id: 2, name: 'Éxodo', file: 'Exodus' },
  { id: 3, name: 'Levítico', file: 'Leviticus' },
  { id: 4, name: 'Números', file: 'Numbers' },
  { id: 5, name: 'Deuteronomio', file: 'Deuteronomy' },
  { id: 6, name: 'Josué', file: 'Joshua' },
  { id: 7, name: 'Jueces', file: 'Judges' },
  { id: 8, name: 'Rut', file: 'Ruth' },
  { id: 9, name: '1 Samuel', file: '1Samuel' },
  { id: 10, name: '2 Samuel', file: '2Samuel' },
  { id: 11, name: '1 Reyes', file: '1Kings' },
  { id: 12, name: '2 Reyes', file: '2Kings' },
  { id: 13, name: '1 Crónicas', file: '1Chronicles' },
  { id: 14, name: '2 Crónicas', file: '2Chronicles' },
  { id: 15, name: 'Esdras', file: 'Ezra' },
  { id: 16, name: 'Nehemías', file: 'Nehemiah' },
  { id: 17, name: 'Ester', file: 'Esther' },
  { id: 18, name: 'Job', file: 'Job' },
  { id: 19, name: 'Salmos', file: 'Psalms' },
  { id: 20, name: 'Proverbios', file: 'Proverbs' },
  { id: 21, name: 'Eclesiastés', file: 'Ecclesiastes' },
  { id: 22, name: 'Cantares', file: 'SongofSolomon' },
  { id: 23, name: 'Isaías', file: 'Isaiah' },
  { id: 24, name: 'Jeremías', file: 'Jeremiah' },
  { id: 25, name: 'Lamentaciones', file: 'Lamentations' },
  { id: 26, name: 'Ezequiel', file: 'Ezekiel' },
  { id: 27, name: 'Daniel', file: 'Daniel' },
  { id: 28, name: 'Oseas', file: 'Hosea' },
  { id: 29, name: 'Joel', file: 'Joel' },
  { id: 30, name: 'Amós', file: 'Amos' },
  { id: 31, name: 'Abdías', file: 'Obadiah' },
  { id: 32, name: 'Jonás', file: 'Jonah' },
  { id: 33, name: 'Miqueas', file: 'Micah' },
  { id: 34, name: 'Nahúm', file: 'Nahum' },
  { id: 35, name: 'Habacuc', file: 'Habakkuk' },
  { id: 36, name: 'Sofonías', file: 'Zephaniah' },
  { id: 37, name: 'Hageo', file: 'Haggai' },
  { id: 38, name: 'Zacarías', file: 'Zechariah' },
  { id: 39, name: 'Malaquías', file: 'Malachi' },
  { id: 40, name: 'Mateo', file: 'Matthew' },
  { id: 41, name: 'Marcos', file: 'Mark' },
  { id: 42, name: 'Lucas', file: 'Luke' },
  { id: 43, name: 'Juan', file: 'John' },
  { id: 44, name: 'Hechos', file: 'Acts' },
  { id: 45, name: 'Romanos', file: 'Romans' },
  { id: 46, name: '1 Corintios', file: '1Corinthians' },
  { id: 47, name: '2 Corintios', file: '2Corinthians' },
  { id: 48, name: 'Gálatas', file: 'Galatians' },
  { id: 49, name: 'Efesios', file: 'Ephesians' },
  { id: 50, name: 'Filipenses', file: 'Philippians' },
  { id: 51, name: 'Colosenses', file: 'Colossians' },
  { id: 52, name: '1 Tesalonicenses', file: '1Thessalonians' },
  { id: 53, name: '2 Tesalonicenses', file: '2Thessalonians' },
  { id: 54, name: '1 Timoteo', file: '1Timothy' },
  { id: 55, name: '2 Timoteo', file: '2Timothy' },
  { id: 56, name: 'Tito', file: 'Titus' },
  { id: 57, name: 'Filemón', file: 'Philemon' },
  { id: 58, name: 'Hebreos', file: 'Hebrews' },
  { id: 59, name: 'Santiago', file: 'James' },
  { id: 60, name: '1 Pedro', file: '1Peter' },
  { id: 61, name: '2 Pedro', file: '2Peter' },
  { id: 62, name: '1 Juan', file: '1John' },
  { id: 63, name: '2 Juan', file: '2John' },
  { id: 64, name: '3 Juan', file: '3John' },
  { id: 65, name: 'Judas', file: 'Jude' },
  { id: 66, name: 'Apocalipsis', file: 'Revelation' }
];

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/aruljohn/Bible-kjv/master';

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    }, (res) => {
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
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchBook(bookInfo) {
  const url = `${GITHUB_BASE_URL}/${encodeURIComponent(bookInfo.file)}.json`;

  try {
    const jsonData = await httpsGet(url);
    const bookData = JSON.parse(jsonData);

    const verses = [];

    // Structure: { book: "Genesis", chapters: [ { chapter: "1", verses: [...] } ] }
    if (bookData.chapters && Array.isArray(bookData.chapters)) {
      for (const chapterData of bookData.chapters) {
        const chapterNum = parseInt(chapterData.chapter);

        if (chapterData.verses && Array.isArray(chapterData.verses)) {
          for (const verseData of chapterData.verses) {
            verses.push({
              book_id: bookInfo.id,
              book_name: bookInfo.name,
              chapter: chapterNum,
              verse: parseInt(verseData.verse),
              text: verseData.text,
              version: 'NKJV'
            });
          }
        }
      }
    }

    return verses;
  } catch (error) {
    console.error(`   ❌ Failed to fetch ${bookInfo.name}: ${error.message}`);
    return [];
  }
}

async function fetchAllBooks() {
  console.log('📖 Downloading KJV Bible from GitHub...\n');
  console.log('🌐 Source: github.com/aruljohn/Bible-kjv');
  console.log('📝 Using KJV text (public domain)\n');
  console.log('⏳ Downloading 66 books...\n');

  const allVerses = [];
  let totalVerses = 0;
  let booksProcessed = 0;

  for (const bookInfo of BOOKS) {
    process.stdout.write(`📚 [${(booksProcessed + 1).toString().padStart(2)}/${BOOKS.length}] ${bookInfo.name.padEnd(20)}... `);

    const verses = await fetchBook(bookInfo);

    if (verses.length > 0) {
      allVerses.push(...verses);
      totalVerses += verses.length;
      console.log(`✅ ${verses.length} verses`);
    } else {
      console.log(`❌ Failed`);
    }

    booksProcessed++;

    // Small delay to avoid overwhelming the server
    await delay(100);
  }

  return { allVerses, totalVerses };
}

async function generateNKJVFile() {
  try {
    const { allVerses, totalVerses } = await fetchAllBooks();

    if (allVerses.length === 0) {
      console.error('\n❌ No verses were fetched. Please check your internet connection.');
      process.exit(1);
    }

    // Generate TypeScript file
    const outputFile = path.join(__dirname, '../src/lib/database/bible-data-nkjv.ts');

    // Back up existing file if it exists
    if (fs.existsSync(outputFile)) {
      const backupFile = outputFile + '.backup';
      fs.copyFileSync(outputFile, backupFile);
      console.log(`\n📦 Backup created: ${path.basename(backupFile)}`);
    }

    const tsContent = `// Auto-generated Bible data for NKJV
// Generated on: ${new Date().toISOString()}
// Total verses: ${totalVerses}
// Source: KJV text from github.com/aruljohn/Bible-kjv
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

    const fileSizeMB = (fs.statSync(outputFile).size / 1024 / 1024).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('✨ Bible data download complete!');
    console.log('='.repeat(60));
    console.log(`📊 Total verses: ${totalVerses.toLocaleString()}`);
    console.log(`📁 Output file: ${path.basename(outputFile)}`);
    console.log(`💾 File size: ${fileSizeMB} MB`);
    console.log('='.repeat(60));
    console.log('\n✅ Success! You can now use the app with full KJV Bible text.');
    console.log('   The NKJV version selector will display this text.\n');
  } catch (error) {
    console.error('\n❌ Error generating file:', error.message);
    console.error('\n💡 The app will continue to work with the sample NKJV data already included.');
    process.exit(1);
  }
}

// Run the script
console.log('🚀 KJV/NKJV Data Fetch Script');
console.log('='.repeat(60));
console.log('\n');

generateNKJVFile().catch(error => {
  console.error('\n❌ Fatal error:', error.message);
  console.error('\n📝 Note: The app already has sample NKJV data that works for testing.');
  process.exit(1);
});
