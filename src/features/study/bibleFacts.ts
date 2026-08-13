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

/**
 * The kinds of "did you know" facts this catalog curates. `commentary` is a
 * BORRADOR addition (see the block below) — a scholarly/historical paraphrase
 * with an explicit source citation, distinct from the other five categories
 * in that it always carries a `source`.
 */
export type FactCategory =
  'geography' | 'numbers' | 'language' | 'history' | 'crossref' | 'commentary';

export const FACT_CATEGORY_ORDER: readonly FactCategory[] = [
  'geography',
  'numbers',
  'language',
  'history',
  'crossref',
  'commentary',
];

export interface BibleFact {
  /** Stable slug — also the i18n key `t.bibleFacts.items[id]`. */
  id: string;
  category: FactCategory;
  /** The verse this fact is anchored to (canonical "EnglishBook/Chapter/Verse"). */
  ref: FactRefKey;
  /**
   * Optional source/attribution citation (e.g. "Matthew Henry, Comentario
   * Bíblico..."). Treated as METADATA, same convention as `ref` — a
   * bibliographic pointer, not localized prose, so it is NOT duplicated in
   * i18n. Populated for `commentary`-category entries.
   */
  source?: string;
  /**
   * BORRADOR flag — true while pending Victor's per-entry doctrinal/editorial
   * sign-off (see the `commentary` block below). Absent/false = already
   * reviewed and shipped.
   */
  draft?: boolean;
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

  // ── Comentario (BORRADOR — pendiente de revisión doctrinal, no publicado) ──
  // These 5 entries are placeholder seed data added to prove the feature
  // shell end-to-end. NOT reviewed/approved by Victor yet — see this
  // module's file comment + the branch's commit message before shipping.
  {
    id: 'gods-costly-gift',
    category: 'commentary',
    ref: 'John/3/16',
    source:
      'Paráfrasis basada en Matthew Henry, Comentario Bíblico de Matthew Henry, sección sobre Juan 3 (CCEL).',
    draft: true,
  },
  {
    id: 'emmanuel-name',
    category: 'commentary',
    ref: 'Matthew/1/23',
    source:
      'Dato lingüístico de referencia estándar, verificable en cualquier diccionario bíblico hebreo.',
    draft: true,
  },
  {
    id: 'father-who-ran',
    category: 'commentary',
    ref: 'Luke/15/20',
    source:
      'Kenneth E. Bailey, El hijo pródigo: Lucas 15 a través de la mirada de campesinos de Oriente Medio (Editorial Vida, 2009).',
    draft: true,
  },
  {
    id: 'my-shepherd',
    category: 'commentary',
    ref: 'Psalms/23/1',
    source:
      'Charles H. Spurgeon, El tesoro de David, Vol. I, comentario sobre el Salmo 23 (CCEL).',
    draft: true,
  },
  {
    id: 'a-denarius-a-days-wage',
    category: 'commentary',
    ref: 'Matthew/20/2',
    source:
      'Dato histórico de referencia estándar sobre la economía romana del siglo I.',
    draft: true,
  },
] as const;

/** Accent hue per category (aligned with the app's palette families). */
export const FACT_CATEGORY_ACCENT: Record<FactCategory, string> = {
  geography: '#10b981', // earth / green
  numbers: '#f59e0b', // amber
  language: '#8b5cf6', // violet
  history: '#0ea5e9', // sky
  crossref: '#6366f1', // indigo
  commentary: '#d946ef', // fuchsia — distinct from the other 5, flags "attributed/BORRADOR"
};

/** Ionicons glyph per category, for badges and headers. */
export const FACT_CATEGORY_ICON: Record<FactCategory, string> = {
  geography: 'earth',
  numbers: 'calculator',
  language: 'language',
  history: 'hourglass',
  crossref: 'link',
  commentary: 'chatbox-ellipses',
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
 * Facts eligible for "Dato del día" rotation — excludes BORRADOR/unreviewed
 * entries (`draft: true`) so the Home tile subtitle and the hero card NEVER
 * surface unapproved content, even though drafts still appear (clearly
 * marked) in the browsable index. Pure.
 */
export function getRotatableFacts(): readonly BibleFact[] {
  return BIBLE_FACTS.filter(f => !f.draft);
}

/**
 * "Dato del día" — a deterministic index into {@link BIBLE_FACTS} by the day
 * of the year, so everyone sees the same fact on a given day and the catalog
 * rotates through the year (the same idea as the daily verse / daily
 * prophecy). Only rotates over {@link getRotatableFacts} (non-draft facts),
 * then maps back to the GLOBAL index in `BIBLE_FACTS`. Pure; always a valid
 * index in `[0, BIBLE_FACTS.length)` pointing at a non-draft fact.
 */
export function getDailyFactIndex(date: Date = new Date()): number {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / 86_400_000,
  );
  const rotatable = getRotatableFacts();
  const n = rotatable.length;
  const localIndex = (((dayOfYear - 1) % n) + n) % n;
  return BIBLE_FACTS.indexOf(rotatable[localIndex]);
}

/** The fact of the day (see {@link getDailyFactIndex}). Pure. Never a draft. */
export function getDailyFact(date: Date = new Date()): BibleFact {
  return BIBLE_FACTS[getDailyFactIndex(date)];
}
