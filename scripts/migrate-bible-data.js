const fs = require('fs');
const path = require('path');

// Mapping of file names to proper book names
const bookMapping = {
  genesis: 'Génesis',
  exodo: 'Éxodo',
  levitico: 'Levítico',
  numeros: 'Números',
  deuteronomio: 'Deuteronomio',
  josue: 'Josué',
  jueces: 'Jueces',
  rut: 'Rut',
  '1-samuel': '1 Samuel',
  '2-samuel': '2 Samuel',
  '1-reyes': '1 Reyes',
  '2-reyes': '2 Reyes',
  '1-cronicas': '1 Crónicas',
  '2-cronicas': '2 Crónicas',
  esdras: 'Esdras',
  nehemias: 'Nehemías',
  ester: 'Ester',
  job: 'Job',
  salmos: 'Salmos',
  proverbios: 'Proverbios',
  eclesiastes: 'Eclesiastés',
  cantares: 'Cantares',
  isaias: 'Isaías',
  jeremias: 'Jeremías',
  lamentaciones: 'Lamentaciones',
  ezequiel: 'Ezequiel',
  daniel: 'Daniel',
  oseas: 'Oseas',
  joel: 'Joel',
  amos: 'Amós',
  abdias: 'Abdías',
  jonas: 'Jonás',
  miqueas: 'Miqueas',
  nahum: 'Nahúm',
  habacuc: 'Habacuc',
  sofonias: 'Sofonías',
  hageo: 'Hageo',
  zacarias: 'Zacarías',
  malaquias: 'Malaquías',
  mateo: 'Mateo',
  marcos: 'Marcos',
  lucas: 'Lucas',
  juan: 'Juan',
  hechos: 'Hechos',
  romanos: 'Romanos',
  '1-corintios': '1 Corintios',
  '2-corintios': '2 Corintios',
  galatas: 'Gálatas',
  efesios: 'Efesios',
  filipenses: 'Filipenses',
  colosenses: 'Colosenses',
  '1-tesalonicenses': '1 Tesalonicenses',
  '2-tesalonicenses': '2 Tesalonicenses',
  '1-timoteo': '1 Timoteo',
  '2-timoteo': '2 Timoteo',
  tito: 'Tito',
  filemon: 'Filemón',
  hebreos: 'Hebreos',
  santiago: 'Santiago',
  '1-pedro': '1 Pedro',
  '2-pedro': '2 Pedro',
  '1-juan': '1 Juan',
  '2-juan': '2 Juan',
  '3-juan': '3 Juan',
  judas: 'Judas',
  apocalipsis: 'Apocalipsis',
};

// Book IDs in canonical order
const bookIds = {
  Génesis: 1,
  Éxodo: 2,
  Levítico: 3,
  Números: 4,
  Deuteronomio: 5,
  Josué: 6,
  Jueces: 7,
  Rut: 8,
  '1 Samuel': 9,
  '2 Samuel': 10,
  '1 Reyes': 11,
  '2 Reyes': 12,
  '1 Crónicas': 13,
  '2 Crónicas': 14,
  Esdras: 15,
  Nehemías: 16,
  Ester: 17,
  Job: 18,
  Salmos: 19,
  Proverbios: 20,
  Eclesiastés: 21,
  Cantares: 22,
  Isaías: 23,
  Jeremías: 24,
  Lamentaciones: 25,
  Ezequiel: 26,
  Daniel: 27,
  Oseas: 28,
  Joel: 29,
  Amós: 30,
  Abdías: 31,
  Jonás: 32,
  Miqueas: 33,
  Nahúm: 34,
  Habacuc: 35,
  Sofonías: 36,
  Hageo: 37,
  Zacarías: 38,
  Malaquías: 39,
  Mateo: 40,
  Marcos: 41,
  Lucas: 42,
  Juan: 43,
  Hechos: 44,
  Romanos: 45,
  '1 Corintios': 46,
  '2 Corintios': 47,
  Gálatas: 48,
  Efesios: 49,
  Filipenses: 50,
  Colosenses: 51,
  '1 Tesalonicenses': 52,
  '2 Tesalonicenses': 53,
  '1 Timoteo': 54,
  '2 Timoteo': 55,
  Tito: 56,
  Filemón: 57,
  Hebreos: 58,
  Santiago: 59,
  '1 Pedro': 60,
  '2 Pedro': 61,
  '1 Juan': 62,
  '2 Juan': 63,
  '3 Juan': 64,
  Judas: 65,
  Apocalipsis: 66,
};

function migrateBibleData(sourceDir, outputFile) {
  const allVerses = [];
  let totalVerses = 0;

  console.log('🔄 Starting Bible data migration...\n');

  // Read all JSON files from the bible_books directory
  const files = fs.readdirSync(sourceDir);

  files.forEach(file => {
    if (!file.endsWith('.json')) return;

    const fileName = file.replace('.json', '');
    const bookName = bookMapping[fileName];

    if (!bookName) {
      console.warn(`⚠️  Unknown book: ${fileName}`);
      return;
    }

    const bookId = bookIds[bookName];
    const filePath = path.join(sourceDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let bookVerses = 0;

    // Process each chapter
    Object.keys(data).forEach(chapterNum => {
      const verses = data[chapterNum];

      verses.forEach(verse => {
        allVerses.push({
          book_id: bookId,
          book_name: bookName,
          chapter: parseInt(chapterNum),
          verse: verse.number,
          text: verse.text,
          version: 'RVR1960',
        });
        bookVerses++;
        totalVerses++;
      });
    });

    console.log(`✅ ${bookName.padEnd(20)} - ${bookVerses} verses`);
  });

  // Write to TypeScript file
  const tsContent = `// Auto-generated Bible data for RVR1960
// Generated on: ${new Date().toISOString()}
// Total verses: ${totalVerses}

export const RVR1960_DATA = ${JSON.stringify(allVerses, null, 2)};
`;

  fs.writeFileSync(outputFile, tsContent);

  console.log(`\n✨ Migration complete!`);
  console.log(`📊 Total verses: ${totalVerses}`);
  console.log(`📁 Output: ${outputFile}`);
  console.log(
    `💾 File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`,
  );
}

// Run migration
const sourceDir = path.join(__dirname, '../src/data/bible_books');
const outputFile = path.join(
  __dirname,
  '../src/lib/database/bible-data-rvr1960.ts',
);

if (!fs.existsSync(sourceDir)) {
  console.error('❌ Source directory not found:', sourceDir);
  console.log('Please ensure the old project is in the correct location.');
  process.exit(1);
}

migrateBibleData(sourceDir, outputFile);
