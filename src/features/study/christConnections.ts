/**
 * ✝️ christConnections — "Cristo en este pasaje" insight catalog (Sprint 97).
 *
 * The whole of Scripture testifies of the Lord Jesus: "comenzando desde Moisés,
 * y siguiendo por todos los profetas, les declaraba en todas las Escrituras lo
 * que de él decían" (Lucas 24:27; cf. 24:44, Juan 5:39). This catalog adds a
 * brief, faithful note to key passages showing how each one points to, reveals
 * or is fulfilled in Christ — so the reader grows "en la gracia y el
 * conocimiento de nuestro Señor y Salvador Jesucristo" (2 Pedro 3:18).
 *
 * PURE (no React/RN, no DB): each entry carries a stable `id` (also the i18n
 * key under `t.christConnections.notes[id]`), a canonical
 * "EnglishBook/Chapter/Verse" `ref` for the focus verse, and an OPTIONAL
 * `fulfillment` ref (a New-Testament passage that names the connection) which
 * the screen renders as a localized "→ Book C:V" pointer. The note prose lives
 * in i18n (es/en parity enforced by i18nParity.test), so a language switch never
 * breaks it and the data file stays a clean index.
 *
 * Both `ref` and `fulfillment` are validated against the canonical book table
 * (nameEn) + chapter range by the accompanying test, so a typo fails CI rather
 * than shipping a dead row — the same guard themes.ts / studyConnections use.
 * Notes are kept deliberately conservative: only broadly-held prophetic,
 * typological or plainly christological readings, never speculation.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookById, getBookByName} from '@/constants/bible';

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type ChristRefKey = string;

export interface ChristConnection {
  /** Stable slug — also the i18n key `t.christConnections.notes[id]`. */
  id: string;
  /** Canonical "EnglishBook/Chapter/Verse" reference of the focus verse. */
  ref: ChristRefKey;
  /** Optional NT passage that names the connection, shown as "→ Book C:V". */
  fulfillment?: ChristRefKey;
}

/**
 * The curated catalog. Refs use canonical English book names so the lookup is
 * language-independent (the reader's verse arrives as a numeric book id, which
 * we resolve to its English name before looking up here).
 */
export const CHRIST_CONNECTIONS: readonly ChristConnection[] = [
  // ── Old Testament: shadows that point forward to Christ ──
  {id: 'genesis-1-1', ref: 'Genesis/1/1', fulfillment: 'John/1/3'},
  {id: 'exodus-15-2', ref: 'Exodus/15/2', fulfillment: 'Matthew/1/21'},
  {id: 'numbers-6-24', ref: 'Numbers/6/24', fulfillment: 'John/1/16'},
  {id: 'psalms-23-1', ref: 'Psalms/23/1', fulfillment: 'John/10/11'},
  {id: 'psalms-34-18', ref: 'Psalms/34/18', fulfillment: 'Matthew/11/28'},
  {id: 'isaiah-9-6', ref: 'Isaiah/9/6', fulfillment: 'Luke/2/11'},
  {id: 'isaiah-12-2', ref: 'Isaiah/12/2', fulfillment: 'Matthew/1/21'},
  {id: 'isaiah-40-31', ref: 'Isaiah/40/31', fulfillment: 'Matthew/11/28'},
  {id: 'isaiah-53-5', ref: 'Isaiah/53/5', fulfillment: '1 Peter/2/24'},
  {id: 'lamentations-3-22', ref: 'Lamentations/3/22', fulfillment: 'John/1/17'},
  {
    id: 'lamentations-3-23',
    ref: 'Lamentations/3/23',
    fulfillment: 'Hebrews/13/8',
  },
  {id: 'micah-6-8', ref: 'Micah/6/8', fulfillment: 'Matthew/9/13'},

  // ── New Testament: passages that reveal who Christ is and what He did ──
  {id: 'matthew-11-28', ref: 'Matthew/11/28'},
  {id: 'matthew-28-6', ref: 'Matthew/28/6'},
  {id: 'matthew-28-19', ref: 'Matthew/28/19'},
  {id: 'luke-1-37', ref: 'Luke/1/37'},
  {id: 'luke-19-10', ref: 'Luke/19/10'},
  {id: 'john-1-1', ref: 'John/1/1'},
  {id: 'john-1-14', ref: 'John/1/14'},
  {id: 'john-3-16', ref: 'John/3/16'},
  {id: 'john-6-35', ref: 'John/6/35'},
  {id: 'john-8-12', ref: 'John/8/12'},
  {id: 'john-10-10', ref: 'John/10/10'},
  {id: 'john-10-11', ref: 'John/10/11'},
  {id: 'john-11-25', ref: 'John/11/25'},
  {id: 'john-14-1', ref: 'John/14/1'},
  {id: 'john-14-6', ref: 'John/14/6'},
  {id: 'john-15-5', ref: 'John/15/5'},
  {id: 'john-16-33', ref: 'John/16/33'},
  {id: 'acts-4-12', ref: 'Acts/4/12'},
  {id: 'acts-16-31', ref: 'Acts/16/31'},
  {id: 'romans-5-1', ref: 'Romans/5/1'},
  {id: 'romans-5-8', ref: 'Romans/5/8'},
  {id: 'romans-6-23', ref: 'Romans/6/23'},
  {id: 'romans-8-1', ref: 'Romans/8/1'},
  {id: 'romans-8-32', ref: 'Romans/8/32'},
  {id: 'romans-10-9', ref: 'Romans/10/9'},
  {id: '2corinthians-5-17', ref: '2 Corinthians/5/17'},
  {id: '2corinthians-5-21', ref: '2 Corinthians/5/21'},
  {id: 'galatians-2-20', ref: 'Galatians/2/20'},
  {id: 'galatians-6-14', ref: 'Galatians/6/14'},
  {id: 'ephesians-1-7', ref: 'Ephesians/1/7'},
  {id: 'ephesians-2-8', ref: 'Ephesians/2/8'},
  {id: 'philippians-2-9', ref: 'Philippians/2/9'},
  {id: 'philippians-4-19', ref: 'Philippians/4/19'},
  {id: 'colossians-1-16', ref: 'Colossians/1/16'},
  {id: '1timothy-1-15', ref: '1 Timothy/1/15'},
  {id: 'titus-2-11', ref: 'Titus/2/11'},
  {id: 'hebrews-7-25', ref: 'Hebrews/7/25'},
  {id: 'hebrews-12-2', ref: 'Hebrews/12/2'},
  {id: 'hebrews-13-8', ref: 'Hebrews/13/8'},
  {id: '1peter-1-3', ref: '1 Peter/1/3'},
  {id: '1peter-2-24', ref: '1 Peter/2/24'},
  {id: '2peter-3-9', ref: '2 Peter/3/9'},
  {id: '2peter-3-18', ref: '2 Peter/3/18'},
  {id: '1john-1-9', ref: '1 John/1/9'},
  {id: '1john-4-10', ref: '1 John/4/10'},
  {id: '1john-4-19', ref: '1 John/4/19'},
  {id: 'jude-1-24', ref: 'Jude/1/24'},
  {id: 'revelation-3-20', ref: 'Revelation/3/20'},
  {id: 'revelation-21-4', ref: 'Revelation/21/4'},
  {id: 'revelation-21-5', ref: 'Revelation/21/5'},
];

/** Parse a "Book/Chapter/Verse" key into its parts, or null if malformed. */
export function parseChristRef(key: ChristRefKey): {
  book: string;
  chapter: number;
  verse: number;
} | null {
  if (typeof key !== 'string') return null;
  const firstSlash = key.indexOf('/');
  const lastSlash = key.lastIndexOf('/');
  if (firstSlash < 0 || lastSlash === firstSlash) return null;
  const book = key.slice(0, firstSlash).trim();
  const chapter = Number(key.slice(firstSlash + 1, lastSlash));
  const verse = Number(key.slice(lastSlash + 1));
  if (!book || !Number.isInteger(chapter) || !Number.isInteger(verse)) {
    return null;
  }
  if (chapter < 1 || verse < 1) return null;
  return {book, chapter, verse};
}

// Lookup map built once, keyed by the canonical English ref.
const BY_REF: ReadonlyMap<ChristRefKey, ChristConnection> = new Map(
  CHRIST_CONNECTIONS.map(c => [c.ref, c]),
);

/**
 * The Christ-connection for a verse identified by its numeric book id (1-66) +
 * chapter + verse, or null if none is curated. The book id is resolved to its
 * canonical English name so the lookup matches the stored refs.
 */
export function getChristConnectionById(
  bookId: number,
  chapter: number,
  verse: number,
): ChristConnection | null {
  const book = getBookById(bookId);
  if (!book) return null;
  return BY_REF.get(`${book.nameEn}/${chapter}/${verse}`) ?? null;
}

/**
 * Format a canonical ref key into a display label in the given language,
 * e.g. "Génesis 3:15" (es) / "Genesis 3:15" (en). Falls back to the raw key.
 */
export function formatChristRefLabel(
  key: ChristRefKey,
  language: 'es' | 'en',
): string {
  const parsed = parseChristRef(key);
  if (!parsed) return key;
  const book = getBookByName(parsed.book);
  if (!book) return key;
  const name = language === 'es' ? book.name : book.nameEn;
  return `${name} ${parsed.chapter}:${parsed.verse}`;
}
