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
import {meditationPromptIndex} from './lectio';

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
      'Philippians/4/7',
      'Isaiah/26/3',
      'Matthew/6/25',
      'Matthew/6/27',
      'Proverbs/12/25',
      'Psalms/4/8',
      'Nahum/1/7',
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
      'Matthew/11/28',
      '2 Corinthians/4/8',
      'Psalms/142/3',
      'Deuteronomy/33/27',
      '2 Corinthians/1/8',
      'Psalms/69/1',
      'Psalms/18/16',
      'Isaiah/43/2',
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
      'Psalms/30/5',
      'Isaiah/61/3',
      'Lamentations/3/32',
      'Psalms/56/8',
      'Psalms/126/5',
      'Psalms/30/11',
      'Psalms/34/17',
    ],
  },
  {
    id: 'grief',
    icon: 'flower',
    accent: '#2563EB',
    relatedThemeId: 'comfort',
    verseRefs: [
      'Psalms/34/18',
      'Matthew/5/4',
      'Ecclesiastes/3/4',
      'John/11/35',
      'Isaiah/53/3',
      'Psalms/23/4',
      'Lamentations/3/22',
      '2 Corinthians/1/3',
      'Job/1/21',
      '1 Thessalonians/4/14',
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
      'Isaiah/40/29',
      'Matthew/11/29',
      'Psalms/116/7',
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
      'Psalms/34/4',
      'Isaiah/43/1',
      '1 John/4/18',
      'Psalms/91/4',
      'Isaiah/41/13',
      'Psalms/118/6',
      'Proverbs/29/25',
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
      'John/14/18',
      'Psalms/27/10',
      'Psalms/139/7',
      'Psalms/139/10',
      'Genesis/28/15',
      'Psalms/25/16',
      'John/16/32',
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
      'Romans/5/8',
      'Psalms/32/1',
      'Hebrews/8/12',
    ],
  },
  {
    id: 'shame',
    icon: 'eye-off',
    accent: '#E11D48',
    relatedThemeId: 'grace',
    verseRefs: [
      'Romans/10/11',
      'Psalms/34/5',
      'Isaiah/54/4',
      'Genesis/3/10',
      'Zephaniah/3/17',
      '1 Peter/2/6',
      '2 Corinthians/5/17',
      'Hebrews/12/2',
      'Isaiah/61/7',
      'Ephesians/1/6',
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
      'Ephesians/4/31',
      'Proverbs/19/11',
      'Romans/12/19',
    ],
  },
  {
    id: 'temptation',
    icon: 'trail-sign',
    accent: '#C026D3',
    relatedThemeId: 'strength',
    verseRefs: [
      '1 Corinthians/10/13',
      'James/1/12',
      'James/4/7',
      'Matthew/26/41',
      'Hebrews/4/15',
      'Hebrews/2/18',
      'Psalms/119/11',
      'Galatians/5/16',
      '1 Peter/5/8',
      'Matthew/4/10',
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
      'Proverbs/3/6',
      'Isaiah/30/21',
      'Psalms/25/4',
    ],
  },
  {
    id: 'doubt',
    icon: 'help-circle',
    accent: '#78716C',
    relatedThemeId: 'faith',
    verseRefs: [
      'Mark/9/24',
      'James/1/6',
      'Matthew/14/31',
      'John/20/27',
      'John/20/29',
      'Hebrews/11/1',
      'Psalms/13/1',
      '2 Timothy/2/13',
      'Psalms/42/5',
      'Luke/17/5',
    ],
  },
  {
    id: 'waiting',
    icon: 'hourglass',
    accent: '#65A30D',
    relatedThemeId: 'hope',
    verseRefs: [
      'Psalms/27/14',
      'Isaiah/40/31',
      'Psalms/37/7',
      'Lamentations/3/25',
      'Micah/7/7',
      'Psalms/130/5',
      'Psalms/130/6',
      'Habakkuk/2/3',
      'Romans/8/25',
      'Psalms/40/1',
    ],
  },
  {
    id: 'seeking',
    icon: 'search',
    accent: '#9333EA',
    relatedThemeId: 'salvation',
    verseRefs: [
      'Jeremiah/29/13',
      'Matthew/7/7',
      'Matthew/6/33',
      'Deuteronomy/4/29',
      'Hebrews/11/6',
      'Acts/17/27',
      'Psalms/105/4',
      'John/4/23',
      'Luke/19/10',
      'Isaiah/55/6',
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
      'Lamentations/3/23',
      'Hebrews/6/19',
      'Psalms/31/24',
      'Romans/5/5',
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
      'Psalms/103/2',
      'Ephesians/5/20',
      'Psalms/9/1',
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
      '1 Peter/1/8',
      'Psalms/28/7',
      'Habakkuk/3/18',
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

/**
 * The curated verse ref to surface for a feeling on a given LOCAL day —
 * deterministic per (feeling, day) via the shared lectio rolling hash, so it is
 * stable within a day yet rotates across days. Null if the feeling has no refs.
 * Shared by the Home mood verse card (Sprint 81) and the guided devotion
 * (Sprint 83), so both surface the SAME verse for the same feeling+day.
 */
export function feelingVerseRefForDay(
  feeling: Feeling,
  dateKey: string,
): ThemeRefKey | null {
  if (feeling.verseRefs.length === 0) return null;
  return feeling.verseRefs[
    meditationPromptIndex(feeling.id, dateKey, feeling.verseRefs.length)
  ];
}
