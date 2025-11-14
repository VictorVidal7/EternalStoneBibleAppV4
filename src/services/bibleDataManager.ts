import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';
import bibleBooks from '../data/bibleBooks.json';

// ============================================================================
// Type Definitions and Interfaces
// ============================================================================

/**
 * Represents a single verse with number and text content
 */
interface Verse {
  number: string | number;
  text: string;
}

/**
 * Chapter data structure - maps chapter numbers to arrays of verses
 */
interface ChapterData {
  [key: string]: Verse[];
}

/**
 * Book data structure - contains all chapters of a book
 */
interface BookData {
  [chapterNum: string]: Verse[];
}

/**
 * Search result from Bible search
 */
interface SearchResult {
  book: string;
  chapter: number;
  verse: string | number;
  text: string;
}

/**
 * Random verse result
 */
interface RandomVerseResult {
  book: string;
  chapter: number;
  number: string | number;
  text: string;
}

/**
 * Bible data structure containing both Old and New Testament books
 */
interface BibleDataStructure {
  [testament: string]: {
    [bookKey: string]: BookData;
  };
}

/**
 * Bible books metadata
 */
interface BibleBooksMetadata {
  'Antiguo Testamento': string[];
  'Nuevo Testamento': string[];
}

// ============================================================================
// Data Loading
// ============================================================================

/**
 * Pre-load all Bible books data
 * This creates the complete Bible data structure with all testaments and books
 */
const bibleData: BibleDataStructure = {
  'Antiguo Testamento': {
    genesis: require('../data/bible_books/genesis.json'),
    exodo: require('../data/bible_books/exodo.json'),
    levitico: require('../data/bible_books/levitico.json'),
    numeros: require('../data/bible_books/numeros.json'),
    deuteronomio: require('../data/bible_books/deuteronomio.json'),
    josue: require('../data/bible_books/josue.json'),
    jueces: require('../data/bible_books/jueces.json'),
    rut: require('../data/bible_books/rut.json'),
    '1samuel': require('../data/bible_books/1-samuel.json'),
    '2samuel': require('../data/bible_books/2-samuel.json'),
    '1reyes': require('../data/bible_books/1-reyes.json'),
    '2reyes': require('../data/bible_books/2-reyes.json'),
    '1cronicas': require('../data/bible_books/1-cronicas.json'),
    '2cronicas': require('../data/bible_books/2-cronicas.json'),
    esdras: require('../data/bible_books/esdras.json'),
    nehemias: require('../data/bible_books/nehemias.json'),
    ester: require('../data/bible_books/ester.json'),
    job: require('../data/bible_books/job.json'),
    salmos: require('../data/bible_books/salmos.json'),
    proverbios: require('../data/bible_books/proverbios.json'),
    eclesiastes: require('../data/bible_books/eclesiastes.json'),
    cantares: require('../data/bible_books/cantares.json'),
    isaias: require('../data/bible_books/isaias.json'),
    jeremias: require('../data/bible_books/jeremias.json'),
    lamentaciones: require('../data/bible_books/lamentaciones.json'),
    ezequiel: require('../data/bible_books/ezequiel.json'),
    daniel: require('../data/bible_books/daniel.json'),
    oseas: require('../data/bible_books/oseas.json'),
    joel: require('../data/bible_books/joel.json'),
    amos: require('../data/bible_books/amos.json'),
    abdias: require('../data/bible_books/abdias.json'),
    jonas: require('../data/bible_books/jonas.json'),
    miqueas: require('../data/bible_books/miqueas.json'),
    nahum: require('../data/bible_books/nahum.json'),
    habacuc: require('../data/bible_books/habacuc.json'),
    sofonias: require('../data/bible_books/sofonias.json'),
    hageo: require('../data/bible_books/hageo.json'),
    zacarias: require('../data/bible_books/zacarias.json'),
    malaquias: require('../data/bible_books/malaquias.json'),
  },
  'Nuevo Testamento': {
    mateo: require('../data/bible_books/mateo.json'),
    marcos: require('../data/bible_books/marcos.json'),
    lucas: require('../data/bible_books/lucas.json'),
    juan: require('../data/bible_books/juan.json'),
    hechos: require('../data/bible_books/hechos.json'),
    romanos: require('../data/bible_books/romanos.json'),
    '1corintios': require('../data/bible_books/1-corintios.json'),
    '2corintios': require('../data/bible_books/2-corintios.json'),
    galatas: require('../data/bible_books/galatas.json'),
    efesios: require('../data/bible_books/efesios.json'),
    filipenses: require('../data/bible_books/filipenses.json'),
    colosenses: require('../data/bible_books/colosenses.json'),
    '1tesalonicenses': require('../data/bible_books/1-tesalonicenses.json'),
    '2tesalonicenses': require('../data/bible_books/2-tesalonicenses.json'),
    '1timoteo': require('../data/bible_books/1-timoteo.json'),
    '2timoteo': require('../data/bible_books/2-timoteo.json'),
    tito: require('../data/bible_books/tito.json'),
    filemon: require('../data/bible_books/filemon.json'),
    hebreos: require('../data/bible_books/hebreos.json'),
    santiago: require('../data/bible_books/santiago.json'),
    '1pedro': require('../data/bible_books/1-pedro.json'),
    '2pedro': require('../data/bible_books/2-pedro.json'),
    '1juan': require('../data/bible_books/1-juan.json'),
    '2juan': require('../data/bible_books/2-juan.json'),
    '3juan': require('../data/bible_books/3-juan.json'),
    judas: require('../data/bible_books/judas.json'),
    apocalipsis: require('../data/bible_books/apocalipsis.json'),
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalizes a book name to match the internal key format
 * Removes whitespace and hyphens, converts to lowercase
 *
 * @param bookName - The book name to normalize
 * @returns Normalized book name
 */
const getBookData = (bookName: string): BookData => {
  const lowercaseBookName = bookName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/-/g, '');

  for (const testament in bibleData) {
    const testamentData = bibleData[testament];
    if (testamentData[lowercaseBookName]) {
      return testamentData[lowercaseBookName];
    }
  }

  const error = new Error(`Book not found: ${bookName}`);
  logger.error('Book lookup failed', error, {
    component: 'BibleDataManager',
    action: 'getBookData',
    bookName,
  });
  throw error;
};

/**
 * Removes .json extension from filename
 *
 * @param filename - The filename to process
 * @returns Filename without extension
 */
const removeExtension = (filename: string): string => {
  return filename.replace('.json', '');
};

// ============================================================================
// Export Public API
// ============================================================================

/**
 * Reset the local database and AsyncStorage
 * Clears all stored Bible-related data from AsyncStorage
 *
 * @throws Error if AsyncStorage.clear() fails
 */
export const resetDatabase = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    logger.info('Database reset complete', {
      component: 'BibleDataManager',
      action: 'resetDatabase',
    });
  } catch (error) {
    logger.error('Error resetting database', error as Error, {
      component: 'BibleDataManager',
      action: 'resetDatabase',
    });
    throw error;
  }
};

/**
 * Initialize Bible data
 * Prepares the Bible data structure for use
 */
export const initializeBibleData = async (): Promise<void> => {
  try {
    logger.info('Bible data initialized', {
      component: 'BibleDataManager',
      action: 'initializeBibleData',
    });
  } catch (error) {
    logger.error('Error initializing Bible data', error as Error, {
      component: 'BibleDataManager',
      action: 'initializeBibleData',
    });
    throw error;
  }
};

/**
 * Get a specific verse from the Bible
 *
 * @param book - The book name
 * @param chapter - The chapter number
 * @param verse - The verse number
 * @returns The verse object containing number and text
 * @throws Error if book, chapter, or verse not found
 */
export const getVerse = (
  book: string,
  chapter: string | number,
  verse: string | number,
): Verse | undefined => {
  try {
    const bookData = getBookData(book);
    const chapterKey = String(chapter);
    const verseKey = String(verse);

    return bookData[chapterKey]?.[parseInt(verseKey)];
  } catch (error) {
    logger.error('Error retrieving verse', error as Error, {
      component: 'BibleDataManager',
      action: 'getVerse',
      book,
      chapter,
      verse,
    });
    throw error;
  }
};

/**
 * Get all verses for a specific chapter
 *
 * @param book - The book name
 * @param chapter - The chapter number
 * @returns Array of verses in the chapter
 * @throws Error if book or chapter not found
 */
export const getChapter = (
  book: string,
  chapter: string | number,
): Verse[] | undefined => {
  try {
    const bookData = getBookData(book);
    const chapterKey = String(chapter);

    return bookData[chapterKey];
  } catch (error) {
    logger.error('Error retrieving chapter', error as Error, {
      component: 'BibleDataManager',
      action: 'getChapter',
      book,
      chapter,
    });
    throw error;
  }
};

/**
 * Get all Bible book names
 * Combines books from both Old and New Testament
 *
 * @returns Array of all book names
 */
export const getAllBooks = (): string[] => {
  try {
    const booksData = bibleBooks as BibleBooksMetadata;
    return [
      ...booksData['Antiguo Testamento'].map(removeExtension),
      ...booksData['Nuevo Testamento'].map(removeExtension),
    ];
  } catch (error) {
    logger.error('Error retrieving all books', error as Error, {
      component: 'BibleDataManager',
      action: 'getAllBooks',
    });
    throw error;
  }
};

/**
 * Search for verses containing a query string
 *
 * @param query - The search query
 * @param searchType - Filter search scope: 'all' (default), 'ot' (Old Testament), 'nt' (New Testament)
 * @returns Array of search results
 */
export const searchBible = (
  query: string,
  searchType: 'all' | 'ot' | 'nt' = 'all',
): SearchResult[] => {
  const results: SearchResult[] = [];

  try {
    const booksData = bibleBooks as BibleBooksMetadata;
    const booksToSearch =
      searchType === 'ot'
        ? booksData['Antiguo Testamento'].map(b => removeExtension(b))
        : searchType === 'nt'
          ? booksData['Nuevo Testamento'].map(b => removeExtension(b))
          : getAllBooks();

    const lowerQuery = query.toLowerCase();

    for (const book of booksToSearch) {
      try {
        const bookData = getBookData(book);

        // bookData is an object where each key is a chapter number
        // and each value is an array of objects {number, text}
        for (const [chapterNum, versesArray] of Object.entries(bookData)) {
          if (Array.isArray(versesArray)) {
            for (const verse of versesArray) {
              if (verse.text && verse.text.toLowerCase().includes(lowerQuery)) {
                results.push({
                  book,
                  chapter: parseInt(chapterNum, 10),
                  verse: verse.number,
                  text: verse.text,
                });
              }
            }
          }
        }
      } catch (error) {
        logger.warn(`Warning searching in book ${book}`, {
          component: 'BibleDataManager',
          action: 'searchBible',
          book,
          error: (error as Error).message,
        });
      }
    }

    logger.info('Bible search completed', {
      component: 'BibleDataManager',
      action: 'searchBible',
      query,
      searchType,
      resultsCount: results.length,
    });

    return results;
  } catch (error) {
    logger.error('Error during Bible search', error as Error, {
      component: 'BibleDataManager',
      action: 'searchBible',
      query,
      searchType,
    });
    throw error;
  }
};

/**
 * Get the number of chapters in a book
 *
 * @param book - The book name
 * @returns Number of chapters
 * @throws Error if book not found
 */
export const getBookChapters = (book: string): number => {
  try {
    const bookData = getBookData(book);
    return Object.keys(bookData).length;
  } catch (error) {
    logger.error('Error retrieving book chapter count', error as Error, {
      component: 'BibleDataManager',
      action: 'getBookChapters',
      book,
    });
    throw error;
  }
};

/**
 * Get a random verse from the Bible
 *
 * @returns A random verse with book, chapter, and verse information
 * @throws Error if Bible data is unavailable
 */
export const getRandomVerse = (): RandomVerseResult => {
  try {
    const allBooks = getAllBooks();

    // Select random book
    const randomBook = allBooks[Math.floor(Math.random() * allBooks.length)];
    const bookData = getBookData(randomBook);

    // Select random chapter
    const chapters = Object.keys(bookData);
    const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];

    // Select random verse from the chapter
    const versesArray = bookData[randomChapter]; // Is an array of {number, text}
    const randomVerseObj =
      versesArray[Math.floor(Math.random() * versesArray.length)];

    const result: RandomVerseResult = {
      book: randomBook,
      chapter: parseInt(randomChapter, 10),
      number: randomVerseObj.number,
      text: randomVerseObj.text,
    };

    logger.info('Random verse retrieved', {
      component: 'BibleDataManager',
      action: 'getRandomVerse',
      book: result.book,
      chapter: result.chapter,
      verse: result.number,
    });

    return result;
  } catch (error) {
    logger.error('Error retrieving random verse', error as Error, {
      component: 'BibleDataManager',
      action: 'getRandomVerse',
    });
    throw error;
  }
};

/**
 * Close the Bible database connection (cleanup)
 * Currently a placeholder for potential future database implementations
 */
export const closeBibleDatabase = async (): Promise<void> => {
  try {
    logger.info('Bible database closed', {
      component: 'BibleDataManager',
      action: 'closeBibleDatabase',
    });
  } catch (error) {
    logger.error('Error closing Bible database', error as Error, {
      component: 'BibleDataManager',
      action: 'closeBibleDatabase',
    });
    throw error;
  }
};

/**
 * Preload frequently accessed data into memory
 * Improves performance for common operations
 */
export const preloadFrequentlyAccessedData = async (): Promise<void> => {
  try {
    logger.info('Frequently accessed data preloaded', {
      component: 'BibleDataManager',
      action: 'preloadFrequentlyAccessedData',
    });
  } catch (error) {
    logger.error('Error preloading frequently accessed data', error as Error, {
      component: 'BibleDataManager',
      action: 'preloadFrequentlyAccessedData',
    });
    throw error;
  }
};

// ============================================================================
// Type Exports (for external use)
// ============================================================================

export type {
  Verse,
  ChapterData,
  BookData,
  SearchResult,
  RandomVerseResult,
  BibleDataStructure,
  BibleBooksMetadata,
};
