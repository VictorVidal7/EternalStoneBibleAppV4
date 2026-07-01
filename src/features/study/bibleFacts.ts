/**
 * 💡 bibleFacts — the "¿Sabías qué?" catalog.
 *
 * A curated set of interesting, biblically-grounded facts: geography, numbers
 * and measurements, original-language nuances, historical/cultural context,
 * and cross-references between passages. Inclusion is deliberately
 * CONSERVATIVE — the SAME bar as [[messianicProphecies]]: every entry is
 * anchored to a specific verse (canonical "EnglishBook/Chapter/Verse", the
 * same form [[christConnections]] / [[studyConnections]] use), no
 * speculation, nothing that isn't either directly stated in the text or a
 * well-attested point (etymology, measurement, custom) tied to that verse.
 * The label + a short, faithful note live in i18n
 * (`t.bibleFacts.items[id]`), es/en parity enforced.
 *
 * PURE (no React/RN, no DB): the screen resolves the verse's text from
 * SQLite and renders the i18n prose.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type FactRefKey = string;

/** The five kinds of "did you know" facts this catalog curates. */
export type FactCategory =
  | 'geography'
  | 'numbers'
  | 'language'
  | 'history'
  | 'crossref';

export const FACT_CATEGORY_ORDER: readonly FactCategory[] = [
  'geography',
  'numbers',
  'language',
  'history',
  'crossref',
];

export interface BibleFact {
  /** Stable slug — also the i18n key `t.bibleFacts.items[id]`. */
  id: string;
  category: FactCategory;
  /** The verse this fact is anchored to (canonical "EnglishBook/Chapter/Verse"). */
  ref: FactRefKey;
}

/**
 * The curated catalog. Every `ref` was verified to resolve to a real verse in
 * the bundled text (`assets/bible-seed.db`).
 */
export const BIBLE_FACTS: readonly BibleFact[] = [
  // ── Geografía ──
  {id: 'dead-sea', category: 'geography', ref: 'Genesis/14/3'},
  {id: 'mount-hermon', category: 'geography', ref: 'Deuteronomy/3/9'},
  {id: 'dan-to-beersheba', category: 'geography', ref: 'Judges/20/1'},
  {id: 'eleven-days', category: 'geography', ref: 'Deuteronomy/1/2'},

  // ── Números ──
  {id: 'sanctuary-shekel', category: 'numbers', ref: 'Exodus/30/13'},
  {id: 'the-cubit', category: 'numbers', ref: 'Genesis/6/15'},
  {id: 'forty-days', category: 'numbers', ref: 'Matthew/4/2'},
  {id: 'thirty-pieces', category: 'numbers', ref: 'Matthew/26/15'},

  // ── Idioma original ──
  {id: 'hesed', category: 'language', ref: 'Psalms/136/1'},
  {id: 'selah', category: 'language', ref: 'Psalms/3/2'},
  {id: 'logos', category: 'language', ref: 'John/1/1'},
  {id: 'amen', category: 'language', ref: 'Deuteronomy/27/15'},

  // ── Historia y cultura ──
  {id: 'tearing-garments', category: 'history', ref: 'Matthew/26/65'},
  {id: 'washing-feet', category: 'history', ref: 'John/13/5'},
  {id: 'unleavened-bread', category: 'history', ref: 'Exodus/12/39'},
  {id: 'seven-day-wedding', category: 'history', ref: 'Judges/14/12'},

  // ── Referencias cruzadas ──
  {id: 'tree-of-life', category: 'crossref', ref: 'Revelation/22/2'},
  {id: 'joshua-jesus-name', category: 'crossref', ref: 'Matthew/1/21'},
  {id: 'ruth-genealogy', category: 'crossref', ref: 'Matthew/1/5'},
  {id: 'jacob-israel', category: 'crossref', ref: 'Genesis/32/28'},
] as const;

/** Accent hue per category (aligned with the app's palette families). */
export const FACT_CATEGORY_ACCENT: Record<FactCategory, string> = {
  geography: '#10b981', // earth / green
  numbers: '#f59e0b', // amber
  language: '#8b5cf6', // violet
  history: '#0ea5e9', // sky
  crossref: '#6366f1', // indigo
};

/** Ionicons glyph per category, for badges and headers. */
export const FACT_CATEGORY_ICON: Record<FactCategory, string> = {
  geography: 'earth',
  numbers: 'calculator',
  language: 'language',
  history: 'hourglass',
  crossref: 'link',
};

/** Total facts in the catalog. */
export const FACT_COUNT = BIBLE_FACTS.length;

/** A category with its facts and their global index (for a browsable index). */
export interface FactCategorySection {
  category: FactCategory;
  entries: {fact: BibleFact; index: number}[];
}

/**
 * The catalog grouped by category, in {@link FACT_CATEGORY_ORDER}, each entry
 * carrying its GLOBAL index in {@link BIBLE_FACTS}. Pure.
 */
export function getFactsByCategory(): FactCategorySection[] {
  return FACT_CATEGORY_ORDER.map(category => ({
    category,
    entries: BIBLE_FACTS.map((fact, index) => ({fact, index})).filter(
      e => e.fact.category === category,
    ),
  })).filter(section => section.entries.length > 0);
}

/**
 * "Dato del día" — a deterministic index into the catalog by the day of the
 * year, so everyone sees the same fact on a given day and the catalog rotates
 * through the year (the same idea as the daily verse / daily prophecy). Pure;
 * always a valid index in `[0, length)`.
 */
export function getDailyFactIndex(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86_400_000,
  );
  const n = BIBLE_FACTS.length;
  return (((dayOfYear - 1) % n) + n) % n;
}

/** The fact of the day (see {@link getDailyFactIndex}). Pure. */
export function getDailyFact(date: Date = new Date()): BibleFact {
  return BIBLE_FACTS[getDailyFactIndex(date)];
}
