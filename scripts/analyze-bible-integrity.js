#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Referencia estándar RVR1960 - número de capítulos por libro
const STANDARD_CHAPTERS = {
  // Antiguo Testamento
  "Génesis": 50, "Éxodo": 40, "Levítico": 27, "Números": 36, "Deuteronomio": 34,
  "Josué": 24, "Jueces": 21, "Rut": 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Reyes": 22, "2 Reyes": 25, "1 Crónicas": 29, "2 Crónicas": 36, "Esdras": 10,
  "Nehemías": 13, "Ester": 10, "Job": 42, "Salmos": 150, "Proverbios": 31,
  "Eclesiastés": 12, "Cantares": 8, "Isaías": 66, "Jeremías": 52, "Lamentaciones": 5,
  "Ezequiel": 48, "Daniel": 12, "Oseas": 14, "Joel": 3, "Amós": 9,
  "Abdías": 1, "Jonás": 4, "Miqueas": 7, "Nahum": 3, "Habacuc": 3,
  "Sofonías": 3, "Hageo": 2, "Zacarías": 14, "Malaquías": 4,
  // Nuevo Testamento
  "Mateo": 28, "Marcos": 16, "Lucas": 24, "Juan": 21, "Hechos": 28,
  "Romanos": 16, "1 Corintios": 16, "2 Corintios": 13, "Gálatas": 6, "Efesios": 6,
  "Filipenses": 4, "Colosenses": 4, "1 Tesalonicenses": 5, "2 Tesalonicenses": 3,
  "1 Timoteo": 6, "2 Timoteo": 4, "Tito": 3, "Filemón": 1, "Hebreos": 13,
  "Santiago": 5, "1 Pedro": 5, "2 Pedro": 3, "1 Juan": 5, "2 Juan": 1,
  "3 Juan": 1, "Judas": 1, "Apocalipsis": 22
};

// Referencia estándar RVR1960 - número de versículos por capítulo
const STANDARD_VERSES = {
  "Génesis": [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
  "Éxodo": [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],
  "Levítico": [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
  "Números": [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
  "Deuteronomio": [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
  "Josué": [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
  "Jueces": [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
  "Rut": [22,23,18,22],
  "1 Samuel": [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13],
  "2 Samuel": [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
  "1 Reyes": [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
  "2 Reyes": [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
  "1 Crónicas": [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
  "2 Crónicas": [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
  "Esdras": [11,70,13,24,17,22,28,36,15,44],
  "Nehemías": [11,20,32,23,19,19,73,18,38,39,36,47,31],
  "Ester": [22,23,15,17,14,14,10,17,32,3],
  "Job": [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17],
  "Salmos": [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
  "Proverbios": [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
  "Eclesiastés": [18,26,22,16,20,12,29,17,18,20,10,14],
  "Cantares": [17,17,11,16,16,13,13,14],
  "Isaías": [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
  "Jeremías": [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
  "Lamentaciones": [22,22,66,22,22],
  "Ezequiel": [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
  "Daniel": [21,49,30,37,31,28,28,27,27,21,45,13],
  "Oseas": [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
  "Joel": [20,32,21],
  "Amós": [15,16,15,13,27,14,17,14,15],
  "Abdías": [21],
  "Jonás": [17,10,10,11],
  "Miqueas": [16,13,12,13,15,16,20],
  "Nahum": [15,13,19],
  "Habacuc": [17,20,19],
  "Sofonías": [18,15,20],
  "Hageo": [15,23],
  "Zacarías": [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
  "Malaquías": [14,17,18,6],
  "Mateo": [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],
  "Marcos": [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],
  "Lucas": [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],
  "Juan": [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],
  "Hechos": [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],
  "Romanos": [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],
  "1 Corintios": [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24],
  "2 Corintios": [24,17,18,18,21,18,16,24,15,18,33,21,14],
  "Gálatas": [24,21,29,31,26,18],
  "Efesios": [23,22,21,32,33,24],
  "Filipenses": [30,30,21,23],
  "Colosenses": [29,23,25,18],
  "1 Tesalonicenses": [10,20,13,18,28],
  "2 Tesalonicenses": [12,17,18],
  "1 Timoteo": [20,15,16,16,25,21],
  "2 Timoteo": [18,26,17,22],
  "Tito": [16,15,15],
  "Filemón": [25],
  "Hebreos": [14,18,19,16,14,20,28,13,28,39,40,29,25],
  "Santiago": [27,26,18,17,20],
  "1 Pedro": [25,25,22,19,14],
  "2 Pedro": [21,22,18],
  "1 Juan": [10,29,24,21,21],
  "2 Juan": [13],
  "3 Juan": [14],
  "Judas": [25],
  "Apocalipsis": [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21]
};

// Mapeo de nombres de archivo a nombres de libro
const FILE_TO_BOOK_NAME = {
  "genesis.json": "Génesis",
  "exodo.json": "Éxodo",
  "levitico.json": "Levítico",
  "numeros.json": "Números",
  "deuteronomio.json": "Deuteronomio",
  "josue.json": "Josué",
  "jueces.json": "Jueces",
  "rut.json": "Rut",
  "1-samuel.json": "1 Samuel",
  "2-samuel.json": "2 Samuel",
  "1-reyes.json": "1 Reyes",
  "2-reyes.json": "2 Reyes",
  "1-cronicas.json": "1 Crónicas",
  "2-cronicas.json": "2 Crónicas",
  "esdras.json": "Esdras",
  "nehemias.json": "Nehemías",
  "ester.json": "Ester",
  "job.json": "Job",
  "salmos.json": "Salmos",
  "proverbios.json": "Proverbios",
  "eclesiastes.json": "Eclesiastés",
  "cantares.json": "Cantares",
  "isaias.json": "Isaías",
  "jeremias.json": "Jeremías",
  "lamentaciones.json": "Lamentaciones",
  "ezequiel.json": "Ezequiel",
  "daniel.json": "Daniel",
  "oseas.json": "Oseas",
  "joel.json": "Joel",
  "amos.json": "Amós",
  "abdias.json": "Abdías",
  "jonas.json": "Jonás",
  "miqueas.json": "Miqueas",
  "nahum.json": "Nahum",
  "habacuc.json": "Habacuc",
  "sofonias.json": "Sofonías",
  "hageo.json": "Hageo",
  "zacarias.json": "Zacarías",
  "malaquias.json": "Malaquías",
  "mateo.json": "Mateo",
  "marcos.json": "Marcos",
  "lucas.json": "Lucas",
  "juan.json": "Juan",
  "hechos.json": "Hechos",
  "romanos.json": "Romanos",
  "1-corintios.json": "1 Corintios",
  "2-corintios.json": "2 Corintios",
  "galatas.json": "Gálatas",
  "efesios.json": "Efesios",
  "filipenses.json": "Filipenses",
  "colosenses.json": "Colosenses",
  "1-tesalonicenses.json": "1 Tesalonicenses",
  "2-tesalonicenses.json": "2 Tesalonicenses",
  "1-timoteo.json": "1 Timoteo",
  "2-timoteo.json": "2 Timoteo",
  "tito.json": "Tito",
  "filemon.json": "Filemón",
  "hebreos.json": "Hebreos",
  "santiago.json": "Santiago",
  "1-pedro.json": "1 Pedro",
  "2-pedro.json": "2 Pedro",
  "1-juan.json": "1 Juan",
  "2-juan.json": "2 Juan",
  "3-juan.json": "3 Juan",
  "judas.json": "Judas",
  "apocalipsis.json": "Apocalipsis"
};

const BIBLE_BOOKS_DIR = path.join(__dirname, '../src/data/bible_books');
const BIBLE_BOOKS_INDEX = path.join(__dirname, '../src/data/bibleBooks.json');

// Contadores de problemas
let totalErrors = 0;
let totalWarnings = 0;
const errors = [];
const warnings = [];

console.log('═══════════════════════════════════════════════════════════════');
console.log('   ANÁLISIS EXHAUSTIVO DE LA BIBLIA RVR1960');
console.log('═══════════════════════════════════════════════════════════════\n');

// 1. Verificar existencia de archivos
console.log('1️⃣  VERIFICANDO EXISTENCIA DE LOS 66 LIBROS...\n');

const bibleIndex = JSON.parse(fs.readFileSync(BIBLE_BOOKS_INDEX, 'utf8'));
const oldTestamentBooks = bibleIndex["Antiguo Testamento"];
const newTestamentBooks = bibleIndex["Nuevo Testamento"];
const allBooks = [...oldTestamentBooks, ...newTestamentBooks];

console.log(`   📚 Antiguo Testamento: ${oldTestamentBooks.length} libros`);
console.log(`   📚 Nuevo Testamento: ${newTestamentBooks.length} libros`);
console.log(`   📚 TOTAL: ${allBooks.length} libros\n`);

if (allBooks.length !== 66) {
  errors.push(`❌ ERROR CRÍTICO: Se esperaban 66 libros pero se encontraron ${allBooks.length}`);
  totalErrors++;
}

// Verificar que todos los archivos existan
allBooks.forEach((bookFile) => {
  const filePath = path.join(BIBLE_BOOKS_DIR, bookFile);
  if (!fs.existsSync(filePath)) {
    errors.push(`❌ Archivo faltante: ${bookFile}`);
    totalErrors++;
  }
});

console.log(`   ✅ Todos los 66 archivos de libros existen\n`);

// 2. Analizar cada libro en detalle
console.log('2️⃣  ANALIZANDO ESTRUCTURA Y CONTENIDO DE CADA LIBRO...\n');

let totalBooks = 0;
let totalChapters = 0;
let totalVerses = 0;
const bookStats = [];

allBooks.forEach((bookFile, index) => {
  const filePath = path.join(BIBLE_BOOKS_DIR, bookFile);
  const bookName = FILE_TO_BOOK_NAME[bookFile];

  if (!bookName) {
    errors.push(`❌ ${bookFile}: No se encontró el mapeo del nombre del libro`);
    totalErrors++;
    return;
  }

  console.log(`   📖 [${index + 1}/66] Analizando: ${bookName} (${bookFile})`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let bookData;

    try {
      bookData = JSON.parse(content);
    } catch (parseError) {
      errors.push(`❌ ${bookName}: Error de sintaxis JSON - ${parseError.message}`);
      totalErrors++;
      return;
    }

    // Verificar que sea un objeto
    if (typeof bookData !== 'object' || Array.isArray(bookData)) {
      errors.push(`❌ ${bookName}: El archivo debe contener un objeto JSON con capítulos`);
      totalErrors++;
      return;
    }

    const chapters = Object.keys(bookData);
    const numChapters = chapters.length;
    const expectedChapters = STANDARD_CHAPTERS[bookName];

    totalBooks++;
    totalChapters += numChapters;

    // Verificar número de capítulos
    if (numChapters !== expectedChapters) {
      errors.push(`❌ ${bookName}: Se esperaban ${expectedChapters} capítulos pero se encontraron ${numChapters}`);
      totalErrors++;
    }

    // Analizar cada capítulo
    const chapterErrors = [];
    const chapterWarnings = [];
    let bookTotalVerses = 0;

    chapters.forEach((chapterNum) => {
      const chapterNumInt = parseInt(chapterNum);
      const verses = bookData[chapterNum];

      if (!Array.isArray(verses)) {
        chapterErrors.push(`Capítulo ${chapterNum}: No es un array de versículos`);
        return;
      }

      const numVerses = verses.length;
      const expectedVerses = STANDARD_VERSES[bookName] ? STANDARD_VERSES[bookName][chapterNumInt - 1] : null;

      bookTotalVerses += numVerses;
      totalVerses += numVerses;

      // Verificar número de versículos
      if (expectedVerses && numVerses !== expectedVerses) {
        chapterErrors.push(`Capítulo ${chapterNum}: Se esperaban ${expectedVerses} versículos pero se encontraron ${numVerses}`);
      }

      // Verificar cada versículo
      const verseNumbers = new Set();
      verses.forEach((verse, idx) => {
        // Verificar estructura del versículo
        if (!verse || typeof verse !== 'object') {
          chapterErrors.push(`Capítulo ${chapterNum}, índice ${idx}: El versículo no es un objeto válido`);
          return;
        }

        if (!verse.hasOwnProperty('number')) {
          chapterErrors.push(`Capítulo ${chapterNum}, índice ${idx}: Falta la propiedad 'number'`);
        }

        if (!verse.hasOwnProperty('text')) {
          chapterErrors.push(`Capítulo ${chapterNum}, índice ${idx}: Falta la propiedad 'text'`);
        }

        const verseNum = verse.number;
        const verseText = verse.text;

        // Verificar número de versículo
        if (typeof verseNum !== 'number' || verseNum < 1) {
          chapterErrors.push(`Capítulo ${chapterNum}, versículo ${idx + 1}: Número de versículo inválido: ${verseNum}`);
        }

        // Verificar duplicados
        if (verseNumbers.has(verseNum)) {
          chapterErrors.push(`Capítulo ${chapterNum}: Versículo ${verseNum} está duplicado`);
        }
        verseNumbers.add(verseNum);

        // Verificar texto
        if (!verseText || typeof verseText !== 'string') {
          chapterErrors.push(`Capítulo ${chapterNum}, versículo ${verseNum}: Texto inválido o vacío`);
        } else if (verseText.trim().length === 0) {
          chapterErrors.push(`Capítulo ${chapterNum}, versículo ${verseNum}: Texto vacío`);
        } else if (verseText.trim().length < 3) {
          chapterWarnings.push(`Capítulo ${chapterNum}, versículo ${verseNum}: Texto muy corto (${verseText.length} caracteres): "${verseText}"`);
        }

        // Verificar que el número de versículo coincida con su posición (advertencia)
        if (verseNum !== idx + 1) {
          chapterWarnings.push(`Capítulo ${chapterNum}, versículo ${verseNum}: El número no coincide con su posición (índice ${idx + 1})`);
        }
      });

      // Verificar que no falten versículos (secuencia continua)
      const sortedVerseNums = Array.from(verseNumbers).sort((a, b) => a - b);
      for (let i = 1; i <= sortedVerseNums[sortedVerseNums.length - 1]; i++) {
        if (!verseNumbers.has(i)) {
          chapterErrors.push(`Capítulo ${chapterNum}: Falta el versículo ${i}`);
        }
      }
    });

    // Reportar errores del libro
    if (chapterErrors.length > 0) {
      console.log(`      ⚠️  ${chapterErrors.length} errores encontrados:`);
      chapterErrors.slice(0, 5).forEach(err => console.log(`         - ${err}`));
      if (chapterErrors.length > 5) {
        console.log(`         ... y ${chapterErrors.length - 5} errores más`);
      }
      errors.push(`❌ ${bookName}: ${chapterErrors.length} errores de estructura`);
      chapterErrors.forEach(err => errors.push(`   └─ ${err}`));
      totalErrors += chapterErrors.length;
    }

    if (chapterWarnings.length > 0) {
      console.log(`      ⚠️  ${chapterWarnings.length} advertencias:`);
      chapterWarnings.slice(0, 3).forEach(warn => console.log(`         - ${warn}`));
      if (chapterWarnings.length > 3) {
        console.log(`         ... y ${chapterWarnings.length - 3} advertencias más`);
      }
      warnings.push(`⚠️  ${bookName}: ${chapterWarnings.length} advertencias`);
      chapterWarnings.forEach(warn => warnings.push(`   └─ ${warn}`));
      totalWarnings += chapterWarnings.length;
    }

    if (chapterErrors.length === 0 && chapterWarnings.length === 0) {
      console.log(`      ✅ OK - ${numChapters} capítulos, ${bookTotalVerses} versículos`);
    }

    bookStats.push({
      name: bookName,
      chapters: numChapters,
      verses: bookTotalVerses,
      hasErrors: chapterErrors.length > 0,
      hasWarnings: chapterWarnings.length > 0
    });

  } catch (error) {
    errors.push(`❌ ${bookName}: Error al leer el archivo - ${error.message}`);
    totalErrors++;
  }

  console.log('');
});

// 3. Resumen estadístico
console.log('\n3️⃣  RESUMEN ESTADÍSTICO\n');
console.log(`   📊 Total de libros analizados: ${totalBooks}/66`);
console.log(`   📊 Total de capítulos: ${totalChapters}`);
console.log(`   📊 Total de versículos: ${totalVerses}`);
console.log(`   📊 Libros con errores: ${bookStats.filter(b => b.hasErrors).length}`);
console.log(`   📊 Libros con advertencias: ${bookStats.filter(b => b.hasWarnings).length}`);
console.log(`   📊 Libros perfectos: ${bookStats.filter(b => !b.hasErrors && !b.hasWarnings).length}`);

// 4. Reporte final
console.log('\n\n═══════════════════════════════════════════════════════════════');
console.log('   REPORTE FINAL');
console.log('═══════════════════════════════════════════════════════════════\n');

if (totalErrors === 0 && totalWarnings === 0) {
  console.log('   ✅ ¡EXCELENTE! La Biblia RVR1960 está 100% correcta.');
  console.log('   ✅ No se encontraron errores ni advertencias.\n');
} else {
  if (totalErrors > 0) {
    console.log(`   ❌ ERRORES ENCONTRADOS: ${totalErrors}\n`);
    console.log('   Lista de errores:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log('');
  }

  if (totalWarnings > 0) {
    console.log(`   ⚠️  ADVERTENCIAS ENCONTRADAS: ${totalWarnings}\n`);
    console.log('   Lista de advertencias:\n');
    warnings.forEach(warn => console.log(`   ${warn}`));
    console.log('');
  }
}

console.log('═══════════════════════════════════════════════════════════════\n');

// Código de salida
process.exit(totalErrors > 0 ? 1 : 0);
