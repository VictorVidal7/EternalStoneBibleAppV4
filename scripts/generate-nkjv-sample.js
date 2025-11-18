const fs = require('fs');
const path = require('path');

/**
 * Generate a sample NKJV file with popular verses
 * This provides a working version until full NKJV text can be obtained
 */

// Sample NKJV verses - popular and well-known passages
const SAMPLE_NKJV_DATA = [
  // John 3:16 - Most famous verse
  {
    book_id: 43,
    book_name: "John",
    chapter: 3,
    verse: 16,
    text: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life.",
    version: "NKJV"
  },
  {
    book_id: 43,
    book_name: "John",
    chapter: 3,
    verse: 17,
    text: "For God did not send His Son into the world to condemn the world, but that the world through Him might be saved.",
    version: "NKJV"
  },
  // John 1 - Beginning of John
  {
    book_id: 43,
    book_name: "John",
    chapter: 1,
    verse: 1,
    text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
    version: "NKJV"
  },
  {
    book_id: 43,
    book_name: "John",
    chapter: 1,
    verse: 2,
    text: "He was in the beginning with God.",
    version: "NKJV"
  },
  {
    book_id: 43,
    book_name: "John",
    chapter: 1,
    verse: 3,
    text: "All things were made through Him, and without Him nothing was made that was made.",
    version: "NKJV"
  },
  {
    book_id: 43,
    book_name: "John",
    chapter: 1,
    verse: 4,
    text: "In Him was life, and the life was the light of men.",
    version: "NKJV"
  },
  {
    book_id: 43,
    book_name: "John",
    chapter: 1,
    verse: 5,
    text: "And the light shines in the darkness, and the darkness did not comprehend it.",
    version: "NKJV"
  },
  // Genesis 1 - Creation
  {
    book_id: 1,
    book_name: "Genesis",
    chapter: 1,
    verse: 1,
    text: "In the beginning God created the heavens and the earth.",
    version: "NKJV"
  },
  {
    book_id: 1,
    book_name: "Genesis",
    chapter: 1,
    verse: 2,
    text: "The earth was without form, and void; and darkness was on the face of the deep. And the Spirit of God was hovering over the face of the waters.",
    version: "NKJV"
  },
  {
    book_id: 1,
    book_name: "Genesis",
    chapter: 1,
    verse: 3,
    text: "Then God said, \"Let there be light\"; and there was light.",
    version: "NKJV"
  },
  // Psalm 23 - The Lord is my shepherd
  {
    book_id: 19,
    book_name: "Psalms",
    chapter: 23,
    verse: 1,
    text: "The LORD is my shepherd; I shall not want.",
    version: "NKJV"
  },
  {
    book_id: 19,
    book_name: "Psalms",
    chapter: 23,
    verse: 2,
    text: "He makes me to lie down in green pastures; He leads me beside the still waters.",
    version: "NKJV"
  },
  {
    book_id: 19,
    book_name: "Psalms",
    chapter: 23,
    verse: 3,
    text: "He restores my soul; He leads me in the paths of righteousness For His name's sake.",
    version: "NKJV"
  },
  {
    book_id: 19,
    book_name: "Psalms",
    chapter: 23,
    verse: 4,
    text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil; For You are with me; Your rod and Your staff, they comfort me.",
    version: "NKJV"
  },
  {
    book_id: 19,
    book_name: "Psalms",
    chapter: 23,
    verse: 5,
    text: "You prepare a table before me in the presence of my enemies; You anoint my head with oil; My cup runs over.",
    version: "NKJV"
  },
  {
    book_id: 19,
    book_name: "Psalms",
    chapter: 23,
    verse: 6,
    text: "Surely goodness and mercy shall follow me All the days of my life; And I will dwell in the house of the LORD Forever.",
    version: "NKJV"
  },
  // Matthew 6:9-13 - The Lord's Prayer
  {
    book_id: 40,
    book_name: "Matthew",
    chapter: 6,
    verse: 9,
    text: "In this manner, therefore, pray: Our Father in heaven, Hallowed be Your name.",
    version: "NKJV"
  },
  {
    book_id: 40,
    book_name: "Matthew",
    chapter: 6,
    verse: 10,
    text: "Your kingdom come. Your will be done On earth as it is in heaven.",
    version: "NKJV"
  },
  {
    book_id: 40,
    book_name: "Matthew",
    chapter: 6,
    verse: 11,
    text: "Give us this day our daily bread.",
    version: "NKJV"
  },
  {
    book_id: 40,
    book_name: "Matthew",
    chapter: 6,
    verse: 12,
    text: "And forgive us our debts, As we forgive our debtors.",
    version: "NKJV"
  },
  {
    book_id: 40,
    book_name: "Matthew",
    chapter: 6,
    verse: 13,
    text: "And do not lead us into temptation, But deliver us from the evil one. For Yours is the kingdom and the power and the glory forever. Amen.",
    version: "NKJV"
  },
  // Romans 8:28
  {
    book_id: 45,
    book_name: "Romans",
    chapter: 8,
    verse: 28,
    text: "And we know that all things work together for good to those who love God, to those who are the called according to His purpose.",
    version: "NKJV"
  },
  // Philippians 4:13
  {
    book_id: 50,
    book_name: "Philippians",
    chapter: 4,
    verse: 13,
    text: "I can do all things through Christ who strengthens me.",
    version: "NKJV"
  },
  // Proverbs 3:5-6
  {
    book_id: 20,
    book_name: "Proverbs",
    chapter: 3,
    verse: 5,
    text: "Trust in the LORD with all your heart, And lean not on your own understanding;",
    version: "NKJV"
  },
  {
    book_id: 20,
    book_name: "Proverbs",
    chapter: 3,
    verse: 6,
    text: "In all your ways acknowledge Him, And He shall direct your paths.",
    version: "NKJV"
  },
  // Jeremiah 29:11
  {
    book_id: 24,
    book_name: "Jeremiah",
    chapter: 29,
    verse: 11,
    text: "For I know the thoughts that I think toward you, says the LORD, thoughts of peace and not of evil, to give you a future and a hope.",
    version: "NKJV"
  },
  // Revelation 21:4
  {
    book_id: 66,
    book_name: "Revelation",
    chapter: 21,
    verse: 4,
    text: "And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying. There shall be no more pain, for the former things have passed away.",
    version: "NKJV"
  }
];

function generateSampleNKJVFile() {
  const outputFile = path.join(__dirname, '../src/lib/database/bible-data-nkjv.ts');

  const tsContent = `// Auto-generated Bible data for NKJV (SAMPLE DATA)
// Generated on: ${new Date().toISOString()}
// Total verses: ${SAMPLE_NKJV_DATA.length}
//
// ⚠️  IMPORTANT NOTICE:
// This file contains only SAMPLE data with popular verses for testing.
// To get the complete NKJV Bible text:
//   1. Run: node scripts/fetch-nkjv-data.js (requires internet connection)
//   2. Or obtain proper licensing from Thomas Nelson Publishers
//
// The sample data includes:
// - John 1:1-5, 3:16-17
// - Genesis 1:1-3
// - Psalm 23 (complete)
// - Matthew 6:9-13 (The Lord's Prayer)
// - And other popular verses
//
// This is sufficient to test the multi-version functionality.

export const NKJV_DATA = ${JSON.stringify(SAMPLE_NKJV_DATA, null, 2)};
`;

  fs.writeFileSync(outputFile, tsContent);

  console.log('✨ Sample NKJV file generated!');
  console.log(`📊 Sample verses: ${SAMPLE_NKJV_DATA.length}`);
  console.log(`📁 Output: ${outputFile}`);
  console.log(`💾 File size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
  console.log('\n📝 Note: This is sample data for testing.');
  console.log('   Run fetch-nkjv-data.js with internet to get full Bible.');
}

generateSampleNKJVFile();
