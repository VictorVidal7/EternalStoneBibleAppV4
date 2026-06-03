/**
 * 🗂️ themes — the topical index for "Explore by Theme" (Sprint 63).
 *
 * A curated taxonomy that groups well-known passages by life topic ("Faith",
 * "Peace", "Forgiveness"…). Until now the only verse-to-verse structure the app
 * kept was the DIRECTIONAL cross-reference web ([[studyConnections]]); this adds
 * a SUBJECT axis on top of it — a reader who feels anxious can open "Peace" and
 * find the passages, rather than already knowing the reference.
 *
 * PURE (no React/RN, no DB): each theme carries a stable `id` (also the route
 * param + the i18n key for its localized name/description), an Ionicons glyph,
 * an accent colour, and a list of canonical "EnglishBook/Chapter/Verse" refs —
 * the SAME index form [[studyConnections]] and `CROSS_REFERENCES` use, so a
 * language switch never breaks the lookup. The screen resolves each ref's text
 * from SQLite at runtime; a missing verse renders a graceful placeholder.
 *
 * The reference strings are validated against the canonical book table by the
 * accompanying test (every ref must parse + fall within its book's range), so a
 * typo fails CI rather than shipping a dead row. 100% JS, zero new native,
 * zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type ThemeRefKey = string;

export interface BibleTheme {
  /** Stable key — the route param `[theme]` AND the i18n key `t.themes.list[id]`. */
  id: string;
  /** Ionicons glyph name for the theme's icon. */
  icon: string;
  /** Accent colour (hex) used for the theme's chip/header. */
  accent: string;
  /** Curated passages for this theme, as canonical refs (no ranges). */
  verseRefs: ThemeRefKey[];
}

/** A parsed theme reference: the canonical key split into its parts. */
export interface ParsedThemeRef {
  key: ThemeRefKey;
  /** English book name as stored in the key. */
  book: string;
  chapter: number;
  verse: number;
}

/**
 * The curated topical index. Refs use canonical English book names so the
 * lookup is language-independent. Verses are chosen for theological clarity and
 * familiarity over exhaustiveness — a handful per theme, the way a topical
 * Bible's "where to turn when…" page reads.
 */
export const BIBLE_THEMES: readonly BibleTheme[] = [
  {
    id: 'faith',
    icon: 'flame',
    accent: '#6366F1',
    verseRefs: [
      'Hebrews/11/1',
      'Romans/10/17',
      '2 Corinthians/5/7',
      'Ephesians/2/8',
      'Matthew/17/20',
      'James/1/6',
      'Hebrews/11/6',
    ],
  },
  {
    id: 'love',
    icon: 'heart',
    accent: '#EC4899',
    verseRefs: [
      '1 Corinthians/13/4',
      'John/3/16',
      '1 John/4/19',
      'Romans/5/8',
      'John/13/34',
      '1 Peter/4/8',
    ],
  },
  {
    id: 'hope',
    icon: 'sunny',
    accent: '#F59E0B',
    verseRefs: [
      'Romans/15/13',
      'Jeremiah/29/11',
      'Isaiah/40/31',
      'Romans/5/5',
      'Lamentations/3/24',
      'Psalms/39/7',
    ],
  },
  {
    id: 'peace',
    icon: 'leaf',
    accent: '#10B981',
    verseRefs: [
      'Philippians/4/6',
      'Philippians/4/7',
      'John/14/27',
      'Isaiah/26/3',
      'Matthew/11/28',
      'Colossians/3/15',
    ],
  },
  {
    id: 'strength',
    icon: 'barbell',
    accent: '#EF4444',
    verseRefs: [
      'Philippians/4/13',
      'Isaiah/41/10',
      'Psalms/46/1',
      'Joshua/1/9',
      '2 Corinthians/12/9',
      'Ephesians/6/10',
    ],
  },
  {
    id: 'forgiveness',
    icon: 'refresh-circle',
    accent: '#8B5CF6',
    verseRefs: [
      '1 John/1/9',
      'Ephesians/4/32',
      'Colossians/3/13',
      'Matthew/6/14',
      'Psalms/103/12',
      'Luke/6/37',
    ],
  },
  {
    id: 'wisdom',
    icon: 'bulb',
    accent: '#0EA5E9',
    verseRefs: [
      'Proverbs/3/5',
      'Proverbs/3/6',
      'James/1/5',
      'Proverbs/9/10',
      'Ecclesiastes/3/1',
      'Colossians/2/3',
    ],
  },
  {
    id: 'prayer',
    icon: 'chatbubbles',
    accent: '#14B8A6',
    verseRefs: [
      'Philippians/4/6',
      '1 Thessalonians/5/17',
      'Matthew/7/7',
      'James/5/16',
      'Mark/11/24',
      '1 John/5/14',
    ],
  },
  {
    id: 'courage',
    icon: 'shield',
    accent: '#F97316',
    verseRefs: [
      'Joshua/1/9',
      '2 Timothy/1/7',
      'Psalms/27/1',
      'Deuteronomy/31/6',
      'Psalms/56/3',
      'Isaiah/43/1',
    ],
  },
  {
    id: 'comfort',
    icon: 'umbrella',
    accent: '#3B82F6',
    verseRefs: [
      'Matthew/5/4',
      'Psalms/34/18',
      '2 Corinthians/1/3',
      'Revelation/21/4',
      'Psalms/147/3',
      'John/14/1',
    ],
  },
  {
    id: 'joy',
    icon: 'happy',
    accent: '#FACC15',
    verseRefs: [
      'Philippians/4/4',
      '1 Thessalonians/5/16',
      'Psalms/118/24',
      'Nehemiah/8/10',
      'James/1/2',
      'Psalms/100/4',
    ],
  },
  {
    id: 'grace',
    icon: 'gift',
    accent: '#A855F7',
    verseRefs: [
      'Ephesians/2/8',
      '2 Corinthians/12/9',
      'Titus/2/11',
      'Hebrews/4/16',
      'John/1/16',
      'Romans/5/20',
    ],
  },
  {
    id: 'salvation',
    icon: 'key',
    accent: '#22C55E',
    verseRefs: [
      'John/3/16',
      'Romans/10/9',
      'Acts/4/12',
      'Romans/6/23',
      'John/14/6',
      'Titus/3/5',
    ],
  },
  {
    id: 'guidance',
    icon: 'compass',
    accent: '#06B6D4',
    verseRefs: [
      'Proverbs/3/6',
      'Jeremiah/29/11',
      'Psalms/119/105',
      'Romans/8/28',
      'Psalms/32/8',
      'Proverbs/16/9',
    ],
  },
];

/** All themes, in display order. */
export function getAllThemes(): readonly BibleTheme[] {
  return BIBLE_THEMES;
}

/** Look up a theme by its `id`, or null when unknown (defensive on bad params). */
export function getTheme(id: string | null | undefined): BibleTheme | null {
  if (!id) return null;
  return BIBLE_THEMES.find(theme => theme.id === id) ?? null;
}

/**
 * Split a canonical "Book/Chapter/Verse" key into parts. Returns null for a
 * malformed key (missing slash, non-numeric chapter/verse) so callers can skip
 * a bad row rather than crash.
 */
export function parseThemeRef(key: ThemeRefKey): ParsedThemeRef | null {
  if (typeof key !== 'string') return null;
  const lastSlash = key.lastIndexOf('/');
  const firstSlash = key.indexOf('/');
  if (firstSlash < 0 || lastSlash === firstSlash) return null;
  const book = key.slice(0, firstSlash).trim();
  const chapter = Number(key.slice(firstSlash + 1, lastSlash));
  const verse = Number(key.slice(lastSlash + 1));
  if (!book || !Number.isInteger(chapter) || !Number.isInteger(verse)) {
    return null;
  }
  if (chapter < 1 || verse < 1) return null;
  return {key, book, chapter, verse};
}
