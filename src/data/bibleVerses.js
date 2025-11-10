export const bibleVerses = {
  'Génesis': {
    1: [
      { number: 1, text: "En el principio creó Dios los cielos y la tierra." },
      { number: 2, text: "Y la tierra estaba desordenada y vacía, y las tinieblas estaban sobre la faz del abismo, y el Espíritu de Dios se movía sobre la faz de las aguas." },
      // ... más versículos
    ],
    2: [
      { number: 1, text: "Fueron, pues, acabados los cielos y la tierra, y todo el ejército de ellos." },
      // ... más versículos
    ],
    // ... más capítulos
  },
  'Éxodo': {
    1: [
      { number: 1, text: "Estos son los nombres de los hijos de Israel que entraron en Egipto con Jacob; cada uno entró con su familia:" },
      // ... más versículos
    ],
    // ... más capítulos
  },
  // ... más libros del Antiguo Testamento
  'Mateo': {
    1: [
      { number: 1, text: "Libro de la genealogía de Jesucristo, hijo de David, hijo de Abraham." },
      // ... más versículos
    ],
    // ... más capítulos
  },
  // ... más libros del Nuevo Testamento
};

const oldTestamentBooks = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio',
  // ... añade aquí el resto de los libros del Antiguo Testamento
];

const newTestamentBooks = [
  'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos',
  // ... añade aquí el resto de los libros del Nuevo Testamento
];

export const searchBible = (query, searchType = 'all') => {
  const results = [];
  const lowercaseQuery = query.toLowerCase();

  Object.entries(bibleVerses).forEach(([book, chapters]) => {
    const isOT = oldTestamentBooks.includes(book);
    const isNT = newTestamentBooks.includes(book);

    if ((searchType === 'ot' && !isOT) || (searchType === 'nt' && !isNT)) {
      return;
    }

    Object.entries(chapters).forEach(([chapter, verses]) => {
      verses.forEach((verse) => {
        if (verse.text.toLowerCase().includes(lowercaseQuery)) {
          results.push({
            book,
            chapter: parseInt(chapter),
            verseNumber: verse.number,
            text: verse.text,
          });
        }
      });
    });
  });

  return results;
};

export const getVersesForChapter = (book, chapter) => {
  if (bibleVerses[book] && bibleVerses[book][chapter]) {
    return bibleVerses[book][chapter];
  }
  return [];
};

export const getRandomVerse = () => {
  const books = Object.keys(bibleVerses);
  const randomBook = books[Math.floor(Math.random() * books.length)];
  const chapters = Object.keys(bibleVerses[randomBook]);
  const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
  const verses = bibleVerses[randomBook][randomChapter];
  const randomVerse = verses[Math.floor(Math.random() * verses.length)];
  
  return {
    book: randomBook,
    chapter: parseInt(randomChapter),
    number: randomVerse.number,
    text: randomVerse.text
  };
};

export const bibleBooks = Object.keys(bibleVerses).reduce((acc, book) => {
  acc[book] = Object.keys(bibleVerses[book]).length;
  return acc;
}, {});