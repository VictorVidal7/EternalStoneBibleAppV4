import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleBooks from '../data/bibleBooks.json';

// Pre-carga todos los libros de la Biblia
const bibleData = {
  "Antiguo Testamento": {
    "genesis": require('../data/bible_books/genesis.json'),
    "exodo": require('../data/bible_books/exodo.json'),
    "levitico": require('../data/bible_books/levitico.json'),
    "numeros": require('../data/bible_books/numeros.json'),
    "deuteronomio": require('../data/bible_books/deuteronomio.json'),
    "josue": require('../data/bible_books/josue.json'),
    "jueces": require('../data/bible_books/jueces.json'),
    "rut": require('../data/bible_books/rut.json'),
    "1samuel": require('../data/bible_books/1-samuel.json'),
    "2samuel": require('../data/bible_books/2-samuel.json'),
    "1reyes": require('../data/bible_books/1-reyes.json'),
    "2reyes": require('../data/bible_books/2-reyes.json'),
    "1cronicas": require('../data/bible_books/1-cronicas.json'),
    "2cronicas": require('../data/bible_books/2-cronicas.json'),
    "esdras": require('../data/bible_books/esdras.json'),
    "nehemias": require('../data/bible_books/nehemias.json'),
    "ester": require('../data/bible_books/ester.json'),
    "job": require('../data/bible_books/job.json'),
    "salmos": require('../data/bible_books/salmos.json'),
    "proverbios": require('../data/bible_books/proverbios.json'),
    "eclesiastes": require('../data/bible_books/eclesiastes.json'),
    "cantares": require('../data/bible_books/cantares.json'),
    "isaias": require('../data/bible_books/isaias.json'),
    "jeremias": require('../data/bible_books/jeremias.json'),
    "lamentaciones": require('../data/bible_books/lamentaciones.json'),
    "ezequiel": require('../data/bible_books/ezequiel.json'),
    "daniel": require('../data/bible_books/daniel.json'),
    "oseas": require('../data/bible_books/oseas.json'),
    "joel": require('../data/bible_books/joel.json'),
    "amos": require('../data/bible_books/amos.json'),
    "abdias": require('../data/bible_books/abdias.json'),
    "jonas": require('../data/bible_books/jonas.json'),
    "miqueas": require('../data/bible_books/miqueas.json'),
    "nahum": require('../data/bible_books/nahum.json'),
    "habacuc": require('../data/bible_books/habacuc.json'),
    "sofonias": require('../data/bible_books/sofonias.json'),
    "hageo": require('../data/bible_books/hageo.json'),
    "zacarias": require('../data/bible_books/zacarias.json'),
    "malaquias": require('../data/bible_books/malaquias.json')
  },
  "Nuevo Testamento": {
    "mateo": require('../data/bible_books/mateo.json'),
    "marcos": require('../data/bible_books/marcos.json'),
    "lucas": require('../data/bible_books/lucas.json'),
    "juan": require('../data/bible_books/juan.json'),
    "hechos": require('../data/bible_books/hechos.json'),
    "romanos": require('../data/bible_books/romanos.json'),
    "1corintios": require('../data/bible_books/1-corintios.json'),
    "2corintios": require('../data/bible_books/2-corintios.json'),
    "galatas": require('../data/bible_books/galatas.json'),
    "efesios": require('../data/bible_books/efesios.json'),
    "filipenses": require('../data/bible_books/filipenses.json'),
    "colosenses": require('../data/bible_books/colosenses.json'),
    "1tesalonicenses": require('../data/bible_books/1-tesalonicenses.json'),
    "2tesalonicenses": require('../data/bible_books/2-tesalonicenses.json'),
    "1timoteo": require('../data/bible_books/1-timoteo.json'),
    "2timoteo": require('../data/bible_books/2-timoteo.json'),
    "tito": require('../data/bible_books/tito.json'),
    "filemon": require('../data/bible_books/filemon.json'),
    "hebreos": require('../data/bible_books/hebreos.json'),
    "santiago": require('../data/bible_books/santiago.json'),
    "1pedro": require('../data/bible_books/1-pedro.json'),
    "2pedro": require('../data/bible_books/2-pedro.json'),
    "1juan": require('../data/bible_books/1-juan.json'),
    "2juan": require('../data/bible_books/2-juan.json'),
    "3juan": require('../data/bible_books/3-juan.json'),
    "judas": require('../data/bible_books/judas.json'),
    "apocalipsis": require('../data/bible_books/apocalipsis.json')
  }
};

const getBookData = (bookName) => {
  const lowercaseBookName = bookName.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  for (const testament in bibleData) {
    if (bibleData[testament][lowercaseBookName]) {
      return bibleData[testament][lowercaseBookName];
    }
  }
  throw new Error(`Book not found: ${bookName}`);
};

export const resetDatabase = async () => {
  try {
    await AsyncStorage.clear();
    console.log('Database reset complete');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

export const initializeBibleData = async () => {
  console.log('Bible data initialized');
};

export const getVerse = (book, chapter, verse) => {
  const bookData = getBookData(book);
  return bookData[chapter][verse];
};

export const getChapter = (book, chapter) => {
  const bookData = getBookData(book);
  return bookData[chapter];
};

export const getAllBooks = () => {
  // Quitar la extensión .json de los nombres de archivos
  const removeExtension = (filename) => filename.replace('.json', '');
  return [
    ...bibleBooks["Antiguo Testamento"].map(removeExtension),
    ...bibleBooks["Nuevo Testamento"].map(removeExtension)
  ];
};

export const searchBible = (query, searchType = 'all') => {
  const results = [];
  const booksToSearch = searchType === 'ot' ? bibleBooks["Antiguo Testamento"].map(b => b.replace('.json', '')) :
                        searchType === 'nt' ? bibleBooks["Nuevo Testamento"].map(b => b.replace('.json', '')) :
                        getAllBooks();

  for (const book of booksToSearch) {
    try {
      const bookData = getBookData(book);
      // bookData es un objeto donde cada key es un número de capítulo
      // y cada value es un array de objetos {number, text}
      for (const [chapterNum, versesArray] of Object.entries(bookData)) {
        if (Array.isArray(versesArray)) {
          for (const verse of versesArray) {
            if (verse.text && verse.text.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                book,
                chapter: parseInt(chapterNum),
                verse: verse.number,
                text: verse.text
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error searching in book ${book}:`, error);
    }
  }
  return results;
};

export const getBookChapters = (book) => {
  const bookData = getBookData(book);
  return Object.keys(bookData).length;
};

export const getRandomVerse = () => {
  const allBooks = getAllBooks();
  const randomBook = allBooks[Math.floor(Math.random() * allBooks.length)];
  const bookData = getBookData(randomBook);
  const chapters = Object.keys(bookData);
  const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
  const versesArray = bookData[randomChapter]; // Es un array de {number, text}
  const randomVerseObj = versesArray[Math.floor(Math.random() * versesArray.length)];

  return {
    book: randomBook,
    chapter: parseInt(randomChapter),
    number: randomVerseObj.number,
    text: randomVerseObj.text
  };
};

export const closeBibleDatabase = async () => {
  console.log('Bible database closed');
};

export const preloadFrequentlyAccessedData = async () => {
  console.log('Frequently accessed data preloaded');
};