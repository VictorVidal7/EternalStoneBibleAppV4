import { BibleBook, BibleVersion } from '../types/bible';

export const BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: 'RVR1960',
    name: 'Reina Valera 1960',
    abbreviation: 'RVR1960',
    language: 'es',
    year: '1960',
  },
  {
    id: 'NTV',
    name: 'Nueva Traducción Viviente',
    abbreviation: 'NTV',
    language: 'es',
    year: '2008',
  },
  {
    id: 'NLT',
    name: 'New Living Translation',
    abbreviation: 'NLT',
    language: 'en',
    year: '1996',
  },
];

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { id: 1, name: 'Génesis', testament: 'old', chapters: 50, abbr: 'Gn' },
  { id: 2, name: 'Éxodo', testament: 'old', chapters: 40, abbr: 'Ex' },
  { id: 3, name: 'Levítico', testament: 'old', chapters: 27, abbr: 'Lv' },
  { id: 4, name: 'Números', testament: 'old', chapters: 36, abbr: 'Nm' },
  { id: 5, name: 'Deuteronomio', testament: 'old', chapters: 34, abbr: 'Dt' },
  { id: 6, name: 'Josué', testament: 'old', chapters: 24, abbr: 'Jos' },
  { id: 7, name: 'Jueces', testament: 'old', chapters: 21, abbr: 'Jue' },
  { id: 8, name: 'Rut', testament: 'old', chapters: 4, abbr: 'Rt' },
  { id: 9, name: '1 Samuel', testament: 'old', chapters: 31, abbr: '1 S' },
  { id: 10, name: '2 Samuel', testament: 'old', chapters: 24, abbr: '2 S' },
  { id: 11, name: '1 Reyes', testament: 'old', chapters: 22, abbr: '1 R' },
  { id: 12, name: '2 Reyes', testament: 'old', chapters: 25, abbr: '2 R' },
  { id: 13, name: '1 Crónicas', testament: 'old', chapters: 29, abbr: '1 Cr' },
  { id: 14, name: '2 Crónicas', testament: 'old', chapters: 36, abbr: '2 Cr' },
  { id: 15, name: 'Esdras', testament: 'old', chapters: 10, abbr: 'Esd' },
  { id: 16, name: 'Nehemías', testament: 'old', chapters: 13, abbr: 'Neh' },
  { id: 17, name: 'Ester', testament: 'old', chapters: 10, abbr: 'Est' },
  { id: 18, name: 'Job', testament: 'old', chapters: 42, abbr: 'Job' },
  { id: 19, name: 'Salmos', testament: 'old', chapters: 150, abbr: 'Sal' },
  { id: 20, name: 'Proverbios', testament: 'old', chapters: 31, abbr: 'Pr' },
  { id: 21, name: 'Eclesiastés', testament: 'old', chapters: 12, abbr: 'Ec' },
  { id: 22, name: 'Cantares', testament: 'old', chapters: 8, abbr: 'Cnt' },
  { id: 23, name: 'Isaías', testament: 'old', chapters: 66, abbr: 'Is' },
  { id: 24, name: 'Jeremías', testament: 'old', chapters: 52, abbr: 'Jer' },
  { id: 25, name: 'Lamentaciones', testament: 'old', chapters: 5, abbr: 'Lm' },
  { id: 26, name: 'Ezequiel', testament: 'old', chapters: 48, abbr: 'Ez' },
  { id: 27, name: 'Daniel', testament: 'old', chapters: 12, abbr: 'Dn' },
  { id: 28, name: 'Oseas', testament: 'old', chapters: 14, abbr: 'Os' },
  { id: 29, name: 'Joel', testament: 'old', chapters: 3, abbr: 'Jl' },
  { id: 30, name: 'Amós', testament: 'old', chapters: 9, abbr: 'Am' },
  { id: 31, name: 'Abdías', testament: 'old', chapters: 1, abbr: 'Abd' },
  { id: 32, name: 'Jonás', testament: 'old', chapters: 4, abbr: 'Jon' },
  { id: 33, name: 'Miqueas', testament: 'old', chapters: 7, abbr: 'Miq' },
  { id: 34, name: 'Nahúm', testament: 'old', chapters: 3, abbr: 'Nah' },
  { id: 35, name: 'Habacuc', testament: 'old', chapters: 3, abbr: 'Hab' },
  { id: 36, name: 'Sofonías', testament: 'old', chapters: 3, abbr: 'Sof' },
  { id: 37, name: 'Hageo', testament: 'old', chapters: 2, abbr: 'Hag' },
  { id: 38, name: 'Zacarías', testament: 'old', chapters: 14, abbr: 'Zac' },
  { id: 39, name: 'Malaquías', testament: 'old', chapters: 4, abbr: 'Mal' },

  // New Testament
  { id: 40, name: 'Mateo', testament: 'new', chapters: 28, abbr: 'Mt' },
  { id: 41, name: 'Marcos', testament: 'new', chapters: 16, abbr: 'Mc' },
  { id: 42, name: 'Lucas', testament: 'new', chapters: 24, abbr: 'Lc' },
  { id: 43, name: 'Juan', testament: 'new', chapters: 21, abbr: 'Jn' },
  { id: 44, name: 'Hechos', testament: 'new', chapters: 28, abbr: 'Hch' },
  { id: 45, name: 'Romanos', testament: 'new', chapters: 16, abbr: 'Ro' },
  { id: 46, name: '1 Corintios', testament: 'new', chapters: 16, abbr: '1 Co' },
  { id: 47, name: '2 Corintios', testament: 'new', chapters: 13, abbr: '2 Co' },
  { id: 48, name: 'Gálatas', testament: 'new', chapters: 6, abbr: 'Gá' },
  { id: 49, name: 'Efesios', testament: 'new', chapters: 6, abbr: 'Ef' },
  { id: 50, name: 'Filipenses', testament: 'new', chapters: 4, abbr: 'Fil' },
  { id: 51, name: 'Colosenses', testament: 'new', chapters: 4, abbr: 'Col' },
  { id: 52, name: '1 Tesalonicenses', testament: 'new', chapters: 5, abbr: '1 Ts' },
  { id: 53, name: '2 Tesalonicenses', testament: 'new', chapters: 3, abbr: '2 Ts' },
  { id: 54, name: '1 Timoteo', testament: 'new', chapters: 6, abbr: '1 Ti' },
  { id: 55, name: '2 Timoteo', testament: 'new', chapters: 4, abbr: '2 Ti' },
  { id: 56, name: 'Tito', testament: 'new', chapters: 3, abbr: 'Tit' },
  { id: 57, name: 'Filemón', testament: 'new', chapters: 1, abbr: 'Flm' },
  { id: 58, name: 'Hebreos', testament: 'new', chapters: 13, abbr: 'Heb' },
  { id: 59, name: 'Santiago', testament: 'new', chapters: 5, abbr: 'Stg' },
  { id: 60, name: '1 Pedro', testament: 'new', chapters: 5, abbr: '1 P' },
  { id: 61, name: '2 Pedro', testament: 'new', chapters: 3, abbr: '2 P' },
  { id: 62, name: '1 Juan', testament: 'new', chapters: 5, abbr: '1 Jn' },
  { id: 63, name: '2 Juan', testament: 'new', chapters: 1, abbr: '2 Jn' },
  { id: 64, name: '3 Juan', testament: 'new', chapters: 1, abbr: '3 Jn' },
  { id: 65, name: 'Judas', testament: 'new', chapters: 1, abbr: 'Jud' },
  { id: 66, name: 'Apocalipsis', testament: 'new', chapters: 22, abbr: 'Ap' },
];

export const getBookByName = (name: string): BibleBook | undefined => {
  return BIBLE_BOOKS.find(
    (book) => book.name.toLowerCase() === name.toLowerCase()
  );
};

export const getBookById = (id: number): BibleBook | undefined => {
  return BIBLE_BOOKS.find((book) => book.id === id);
};
