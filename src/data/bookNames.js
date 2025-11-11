/**
 * Mapeo de nombres de libros de la Biblia
 * Key: nombre interno del archivo (sin extensión, usado en bibleData)
 * Value: traducciones en diferentes idiomas
 */
export const bookNames = {
  // Antiguo Testamento
  "genesis": { es: "Génesis", en: "Genesis" },
  "exodo": { es: "Éxodo", en: "Exodus" },
  "levitico": { es: "Levítico", en: "Leviticus" },
  "numeros": { es: "Números", en: "Numbers" },
  "deuteronomio": { es: "Deuteronomio", en: "Deuteronomy" },
  "josue": { es: "Josué", en: "Joshua" },
  "jueces": { es: "Jueces", en: "Judges" },
  "rut": { es: "Rut", en: "Ruth" },
  "1samuel": { es: "1 Samuel", en: "1 Samuel" },
  "2samuel": { es: "2 Samuel", en: "2 Samuel" },
  "1reyes": { es: "1 Reyes", en: "1 Kings" },
  "2reyes": { es: "2 Reyes", en: "2 Kings" },
  "1cronicas": { es: "1 Crónicas", en: "1 Chronicles" },
  "2cronicas": { es: "2 Crónicas", en: "2 Chronicles" },
  "esdras": { es: "Esdras", en: "Ezra" },
  "nehemias": { es: "Nehemías", en: "Nehemiah" },
  "ester": { es: "Ester", en: "Esther" },
  "job": { es: "Job", en: "Job" },
  "salmos": { es: "Salmos", en: "Psalms" },
  "proverbios": { es: "Proverbios", en: "Proverbs" },
  "eclesiastes": { es: "Eclesiastés", en: "Ecclesiastes" },
  "cantares": { es: "Cantares", en: "Song of Solomon" },
  "isaias": { es: "Isaías", en: "Isaiah" },
  "jeremias": { es: "Jeremías", en: "Jeremiah" },
  "lamentaciones": { es: "Lamentaciones", en: "Lamentations" },
  "ezequiel": { es: "Ezequiel", en: "Ezekiel" },
  "daniel": { es: "Daniel", en: "Daniel" },
  "oseas": { es: "Oseas", en: "Hosea" },
  "joel": { es: "Joel", en: "Joel" },
  "amos": { es: "Amós", en: "Amos" },
  "abdias": { es: "Abdías", en: "Obadiah" },
  "jonas": { es: "Jonás", en: "Jonah" },
  "miqueas": { es: "Miqueas", en: "Micah" },
  "nahum": { es: "Nahum", en: "Nahum" },
  "habacuc": { es: "Habacuc", en: "Habakkuk" },
  "sofonias": { es: "Sofonías", en: "Zephaniah" },
  "hageo": { es: "Hageo", en: "Haggai" },
  "zacarias": { es: "Zacarías", en: "Zechariah" },
  "malaquias": { es: "Malaquías", en: "Malachi" },

  // Nuevo Testamento
  "mateo": { es: "Mateo", en: "Matthew" },
  "marcos": { es: "Marcos", en: "Mark" },
  "lucas": { es: "Lucas", en: "Luke" },
  "juan": { es: "Juan", en: "John" },
  "hechos": { es: "Hechos", en: "Acts" },
  "romanos": { es: "Romanos", en: "Romans" },
  "1corintios": { es: "1 Corintios", en: "1 Corinthians" },
  "2corintios": { es: "2 Corintios", en: "2 Corinthians" },
  "galatas": { es: "Gálatas", en: "Galatians" },
  "efesios": { es: "Efesios", en: "Ephesians" },
  "filipenses": { es: "Filipenses", en: "Philippians" },
  "colosenses": { es: "Colosenses", en: "Colossians" },
  "1tesalonicenses": { es: "1 Tesalonicenses", en: "1 Thessalonians" },
  "2tesalonicenses": { es: "2 Tesalonicenses", en: "2 Thessalonians" },
  "1timoteo": { es: "1 Timoteo", en: "1 Timothy" },
  "2timoteo": { es: "2 Timoteo", en: "2 Timothy" },
  "tito": { es: "Tito", en: "Titus" },
  "filemon": { es: "Filemón", en: "Philemon" },
  "hebreos": { es: "Hebreos", en: "Hebrews" },
  "santiago": { es: "Santiago", en: "James" },
  "1pedro": { es: "1 Pedro", en: "1 Peter" },
  "2pedro": { es: "2 Pedro", en: "2 Peter" },
  "1juan": { es: "1 Juan", en: "1 John" },
  "2juan": { es: "2 Juan", en: "2 John" },
  "3juan": { es: "3 Juan", en: "3 John" },
  "judas": { es: "Judas", en: "Jude" },
  "apocalipsis": { es: "Apocalipsis", en: "Revelation" }
};

/**
 * Obtiene el nombre traducido de un libro
 * @param {string} bookKey - Nombre interno del libro (ej: "genesis", "1samuel")
 * @param {string} language - Código de idioma ('es' o 'en')
 * @returns {string} - Nombre traducido del libro
 */
export const getBookName = (bookKey, language = 'es') => {
  const normalizedKey = bookKey.toLowerCase().replace(/\s+/g, '').replace(/-/g, '');
  return bookNames[normalizedKey]?.[language] || bookKey;
};

/**
 * Obtiene el key interno de un libro desde su nombre traducido
 * @param {string} translatedName - Nombre traducido del libro
 * @returns {string} - Key interno del libro
 */
export const getBookKey = (translatedName) => {
  const normalizedInput = translatedName.toLowerCase().trim();

  for (const [key, translations] of Object.entries(bookNames)) {
    if (translations.es.toLowerCase() === normalizedInput ||
        translations.en.toLowerCase() === normalizedInput ||
        key === normalizedInput) {
      return key;
    }
  }

  // Si no se encuentra, devolver el input normalizado
  return normalizedInput.replace(/\s+/g, '').replace(/-/g, '');
};
