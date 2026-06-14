/**
 * 💛 feelings — the emotional check-in taxonomy ("¿Cómo te sientes hoy?", Sprint 79).
 *
 * Where [[themes]] organizes Scripture by SUBJECT ("Peace", "Faith"…), this maps
 * a reader's PRESENT STATE OF HEART ("anxious", "grateful", "lonely"…) to a
 * handful of curated passages plus a short breath-prayer — the way a pastor
 * answers "how are you feeling?" with the Word, not a topic index. Each feeling
 * also points at its closest [[themes]] entry so the check-in becomes a doorway
 * into the deeper topical study ("Explora el tema: Paz →").
 *
 * PURE (no React/RN, no DB): refs use the SAME canonical
 * "EnglishBook/Chapter/Verse" key form as [[themes]] / [[studyConnections]] /
 * `CROSS_REFERENCES`, so a language switch never breaks the lookup, and the
 * accompanying test validates every ref against the canonical book table AND
 * every `relatedThemeId` against the real taxonomy — a typo fails CI rather
 * than shipping a dead row. Names/descriptions/prayers live in i18n keyed by
 * the feeling `id`. 100% JS, zero new native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {ThemeRefKey} from './themes';

export interface Feeling {
  /** Stable key — the route param `[feeling]` AND the i18n key `t.feelings.list[id]`. */
  id: string;
  /** Ionicons glyph name for the feeling's chip/header icon. */
  icon: string;
  /** Accent colour (hex) used for the chip/header. */
  accent: string;
  /** Curated passages for this feeling, as canonical refs (no ranges). */
  verseRefs: ThemeRefKey[];
  /** The closest topical [[themes]] entry — the "go deeper" doorway. */
  relatedThemeId: string;
}

/**
 * The curated check-in taxonomy. Order matters: it is the display order of the
 * Home chip row, so the heavier states a reader most often needs met come
 * first and the brighter ones close the row.
 */
export const FEELINGS: readonly Feeling[] = [
  {
    id: 'anxious',
    icon: 'pulse',
    accent: '#0EA5E9',
    relatedThemeId: 'peace',
    verseRefs: [
      'Philippians/4/6',
      '1 Peter/5/7',
      'Matthew/6/34',
      'John/14/27',
      'Psalms/55/22',
      'Psalms/94/19',
    ],
  },
  {
    id: 'overwhelmed',
    icon: 'water',
    accent: '#6366F1',
    relatedThemeId: 'strength',
    verseRefs: [
      'Psalms/61/2',
      'Psalms/46/1',
      'Psalms/46/10',
      'Philippians/4/13',
      'Psalms/121/1',
    ],
  },
  {
    id: 'sad',
    icon: 'rainy',
    accent: '#64748B',
    relatedThemeId: 'comfort',
    verseRefs: [
      'Psalms/34/18',
      'Matthew/5/4',
      'Psalms/147/3',
      'Revelation/21/4',
      '2 Corinthians/1/3',
      'John/16/22',
    ],
  },
  {
    id: 'tired',
    icon: 'bed',
    accent: '#8B5CF6',
    relatedThemeId: 'strength',
    verseRefs: [
      'Matthew/11/28',
      'Isaiah/40/31',
      'Psalms/23/2',
      '2 Corinthians/12/9',
      'Galatians/6/9',
      'Exodus/33/14',
    ],
  },
  {
    id: 'afraid',
    icon: 'shield-half',
    accent: '#F59E0B',
    relatedThemeId: 'courage',
    verseRefs: [
      'Joshua/1/9',
      'Psalms/56/3',
      'Isaiah/41/10',
      '2 Timothy/1/7',
      'Psalms/27/1',
      'Deuteronomy/31/6',
    ],
  },
  {
    id: 'lonely',
    icon: 'person',
    accent: '#14B8A6',
    relatedThemeId: 'comfort',
    verseRefs: [
      'Psalms/23/4',
      'Matthew/28/20',
      'Deuteronomy/31/8',
      'Psalms/68/6',
      'Isaiah/43/2',
      'Hebrews/13/5',
    ],
  },
  {
    id: 'guilty',
    icon: 'refresh',
    accent: '#10B981',
    relatedThemeId: 'forgiveness',
    verseRefs: [
      '1 John/1/9',
      'Psalms/103/12',
      'Romans/8/1',
      'Isaiah/1/18',
      'Micah/7/19',
      'Psalms/51/10',
    ],
  },
  {
    id: 'angry',
    icon: 'flame',
    accent: '#EF4444',
    relatedThemeId: 'forgiveness',
    verseRefs: [
      'Ephesians/4/26',
      'James/1/19',
      'Proverbs/15/1',
      'Psalms/37/8',
      'Proverbs/16/32',
      'Colossians/3/13',
    ],
  },
  {
    id: 'confused',
    icon: 'help-buoy',
    accent: '#0D9488',
    relatedThemeId: 'guidance',
    verseRefs: [
      'Proverbs/3/5',
      'James/1/5',
      'Psalms/32/8',
      'Isaiah/55/8',
      'Psalms/119/105',
      'Proverbs/16/9',
    ],
  },
  {
    id: 'hopeful',
    icon: 'sunny',
    accent: '#F97316',
    relatedThemeId: 'hope',
    verseRefs: [
      'Jeremiah/29/11',
      'Romans/15/13',
      'Lamentations/3/22',
      'Psalms/42/11',
      'Romans/8/28',
    ],
  },
  {
    id: 'grateful',
    icon: 'gift',
    accent: '#EC4899',
    relatedThemeId: 'joy',
    verseRefs: [
      '1 Thessalonians/5/18',
      'Psalms/107/1',
      'Psalms/100/4',
      'Colossians/3/17',
      'James/1/17',
      'Psalms/136/1',
    ],
  },
  {
    id: 'joyful',
    icon: 'musical-notes',
    accent: '#EAB308',
    relatedThemeId: 'joy',
    verseRefs: [
      'Psalms/118/24',
      'Philippians/4/4',
      'Psalms/16/11',
      'Nehemiah/8/10',
      'John/15/11',
      'Psalms/126/3',
    ],
  },
];

/**
 * The "brighter" feelings that close the check-in row (see the FEELINGS order
 * note: the heavier states come first, the brighter ones close it). Used to
 * read an emotional TREND's direction (Sprint 83) — a rise in these, or an
 * easing of the heavier ones, reads as the spirit lifting. Kept EXPLICIT so a
 * future reordering of the taxonomy can't silently flip a derived valence.
 */
export const BRIGHT_FEELING_IDS: ReadonlySet<string> = new Set([
  'hopeful',
  'grateful',
  'joyful',
]);

/** Whether a feeling is one of the brighter states (see BRIGHT_FEELING_IDS). */
export function isBrightFeeling(id: string): boolean {
  return BRIGHT_FEELING_IDS.has(id);
}

/** Look up one feeling by id; null for unknown/empty ids. */
export function getFeeling(id: string | null | undefined): Feeling | null {
  if (!id) return null;
  return FEELINGS.find(f => f.id === id) ?? null;
}

/** The full check-in taxonomy, in display order. */
export function getAllFeelings(): readonly Feeling[] {
  return FEELINGS;
}
