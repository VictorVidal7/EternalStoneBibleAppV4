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
 * scholarly/historical paraphrase with an explicit source citation, distinct
 * from the other five categories in that it always carries a `source`.
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
   * True while an entry is pending Victor's per-entry doctrinal/editorial
   * sign-off — hidden from every real-user-facing surface until then (see
   * `getFactsByCategory()`/`getRotatableFacts()`). Absent/false = already
   * reviewed and shipped.
   */
  draft?: boolean;
  /**
   * Optional Strong's number ("H2617", "G3056") this fact's original-language
   * point is anchored to — lets the fact card tap through to the visual
   * concordance (`/features/word-study?strongs=...`). Only ever set on
   * `language`/`commentary` entries, and only after independently confirming
   * (via the app's own installed originals pack — `getStrongsOccurrences`
   * equivalent) that the number actually occurs in the fact's own `ref`.
   * Left unset rather than guessed — e.g. `selah` has NO `strongs` here
   * because the live originals pack has zero `original_words` rows for
   * Psalms 3:2: TAHOT numbers Psalm 3 by Hebrew (Masoretic) versification
   * with the English-equivalent verse in a trailing `(3.2)`-style
   * parenthetical, which `scripts/build-originals-pack.js`'s row parser
   * doesn't currently recognize, so that verse's words never made it into
   * the pack. That's a pack-build gap, not something to paper over here.
   */
  strongs?: string;
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
  // -- DRAFT, pending Victor's sign-off (added by the content-growth pass) --
  {
    id: 'jericho-city-of-palms',
    category: 'geography',
    ref: 'Deuteronomy/34/3',
    draft: true,
  },
  {
    id: 'ararat-mountains',
    category: 'geography',
    ref: 'Genesis/8/4',
    draft: true,
  },
  {
    id: 'armageddon-megiddo',
    category: 'geography',
    ref: 'Revelation/16/16',
    draft: true,
  },

  // ── Números ──
  {id: 'sanctuary-shekel', category: 'numbers', ref: 'Exodus/30/13'},
  {id: 'the-cubit', category: 'numbers', ref: 'Genesis/6/15'},
  {id: 'forty-days', category: 'numbers', ref: 'Matthew/4/2'},
  {id: 'thirty-pieces', category: 'numbers', ref: 'Matthew/26/15'},
  // -- DRAFT, pending Victor's sign-off (added by the content-growth pass) --
  {id: 'the-omer', category: 'numbers', ref: 'Exodus/16/36', draft: true},
  {
    id: 'israel-census-wilderness',
    category: 'numbers',
    ref: 'Numbers/1/46',
    draft: true,
  },
  {
    id: 'seventh-day-blessed',
    category: 'numbers',
    ref: 'Genesis/2/3',
    draft: true,
  },

  // ── Idioma original ──
  // Strong's numbers below were verified against the LIVE installed originals
  // pack (`https://eternalstonebible.github.io/packs/originals.db`), not
  // guessed: each one was confirmed to actually occur at the fact's own
  // `ref` (the same check `getStrongsOccurrences()` powers). `selah`
  // deliberately carries none — see the `strongs` field doc on `BibleFact`.
  {id: 'hesed', category: 'language', ref: 'Psalms/136/1', strongs: 'H2617'},
  {id: 'selah', category: 'language', ref: 'Psalms/3/2'},
  {id: 'logos', category: 'language', ref: 'John/1/1', strongs: 'G3056'},
  {
    id: 'amen',
    category: 'language',
    ref: 'Deuteronomy/27/15',
    strongs: 'H543',
  },
  // -- DRAFT, pending Victor's sign-off (added by the content-growth pass).
  // These strongs values were verified against a LOCAL rebuild of the
  // originals pack (`C:\Users\victo\Desktop\originals-pack\originals.db`,
  // 2026-08-26 — the fix for the Psalms 3:2 / `selah` versification gap
  // noted above), not the live published pack and not guessed: each one was
  // confirmed present (`original_words`, matching book_id/chapter/verse) at
  // the fact's own `ref`, then cross-checked against its own
  // `strongs_lexicon` row. --
  {
    id: 'ruach',
    category: 'language',
    ref: 'Genesis/1/2',
    strongs: 'H7307',
    draft: true,
  },
  {
    id: 'shalom',
    category: 'language',
    ref: 'Numbers/6/26',
    strongs: 'H7965',
    draft: true,
  },
  {
    id: 'agape',
    category: 'language',
    ref: '1 Corinthians/13/4',
    strongs: 'G26',
    draft: true,
  },
  {
    id: 'parakletos',
    category: 'language',
    ref: 'John/14/26',
    strongs: 'G3875',
    draft: true,
  },

  // ── Historia y cultura ──
  {id: 'tearing-garments', category: 'history', ref: 'Matthew/26/65'},
  {id: 'washing-feet', category: 'history', ref: 'John/13/5'},
  {id: 'unleavened-bread', category: 'history', ref: 'Exodus/12/39'},
  {id: 'seven-day-wedding', category: 'history', ref: 'Judges/14/12'},
  // -- DRAFT, pending Victor's sign-off (added by the content-growth pass) --
  {id: 'casting-lots', category: 'history', ref: 'Acts/1/26', draft: true},
  {id: 'city-gate-court', category: 'history', ref: 'Ruth/4/1', draft: true},
  {
    id: 'bind-as-sign',
    category: 'history',
    ref: 'Deuteronomy/6/8',
    draft: true,
  },

  // ── Referencias cruzadas ──
  {id: 'tree-of-life', category: 'crossref', ref: 'Revelation/22/2'},
  {id: 'joshua-jesus-name', category: 'crossref', ref: 'Matthew/1/21'},
  {id: 'ruth-genealogy', category: 'crossref', ref: 'Matthew/1/5'},
  {id: 'jacob-israel', category: 'crossref', ref: 'Genesis/32/28'},
  // -- DRAFT, pending Victor's sign-off (added by the content-growth pass) --
  {
    id: 'first-last-adam',
    category: 'crossref',
    ref: '1 Corinthians/15/45',
    draft: true,
  },
  {
    id: 'passover-lamb-unbroken',
    category: 'crossref',
    ref: 'John/19/36',
    draft: true,
  },
  {id: 'bronze-serpent', category: 'crossref', ref: 'John/3/14', draft: true},

  // ── Comentario ── Victor reviewed and approved this content 2026-08-25.
  {
    id: 'gods-costly-gift',
    category: 'commentary',
    ref: 'John/3/16',
    source:
      'Paráfrasis basada en Matthew Henry, Comentario Bíblico de Matthew Henry, sección sobre Juan 3 (CCEL).',
  },
  {
    id: 'emmanuel-name',
    category: 'commentary',
    ref: 'Matthew/1/23',
    // G1694 (Ἐμμανουήλ) — the GREEK Strong's entry, not a Hebrew one: this
    // verse quotes the Hebrew name, but Matthew 1:23 itself is Greek text,
    // and G1694 is confirmed both (a) tagged on the word at this exact verse
    // in the live originals pack, and (b) its own lexicon entry independently
    // reads lemma "Ἐμμανουήλ", kjv_def "Emmanuel".
    strongs: 'G1694',
    source:
      'Dato lingüístico de referencia estándar, verificable en cualquier diccionario bíblico hebreo.',
  },
  {
    id: 'father-who-ran',
    category: 'commentary',
    ref: 'Luke/15/20',
    source:
      'Kenneth E. Bailey, El hijo pródigo: Lucas 15 a través de la mirada de campesinos de Oriente Medio (Editorial Vida, 2009).',
  },
  {
    id: 'my-shepherd',
    category: 'commentary',
    ref: 'Psalms/23/1',
    source:
      'Charles H. Spurgeon, El tesoro de David, Vol. I, comentario sobre el Salmo 23 (CCEL).',
  },
  {
    id: 'a-denarius-a-days-wage',
    category: 'commentary',
    ref: 'Matthew/20/2',
    source:
      'Dato histórico de referencia estándar sobre la economía romana del siglo I.',
  },
  // -- DRAFT, pending Victor's sign-off (added by the content-growth pass) --
  {
    id: 'contentment-secret',
    category: 'commentary',
    ref: 'Philippians/4/13',
    source:
      'Paráfrasis basada en Matthew Henry, Comentario Bíblico de Matthew Henry, sección sobre Filipenses 4 (CCEL).',
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
  commentary: '#d946ef', // fuchsia — distinct from the other 5 (attributed/sourced)
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
 * carrying its GLOBAL index in {@link BIBLE_FACTS}. Excludes unreviewed
 * entries (`draft: true`) — same rule as {@link getRotatableFacts} — so the
 * browsable "¿Sabías qué?" index never surfaces content still pending
 * Victor's per-entry doctrinal/editorial sign-off to real users. A category
 * whose only entries are currently draft simply doesn't appear. Pure.
 */
export function getFactsByCategory(): FactCategorySection[] {
  return FACT_CATEGORY_ORDER.map(category => ({
    category,
    entries: BIBLE_FACTS.map((fact, index) => ({fact, index})).filter(
      e => e.fact.category === category && !e.fact.draft,
    ),
  })).filter(section => section.entries.length > 0);
}

/**
 * Facts eligible for "Dato del día" rotation — excludes unreviewed entries
 * (`draft: true`) so the Home tile subtitle and the hero card NEVER surface
 * unapproved content. {@link getFactsByCategory} applies the same exclusion,
 * so drafts are fully hidden from real users end-to-end. Pure.
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
