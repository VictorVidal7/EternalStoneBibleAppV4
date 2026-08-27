/**
 * ✝️ theology — the "Teología" catalog.
 *
 * Short, faithful doctrine essays scoped narrowly to "mere Christianity"
 * consensus (Trinity, salvation by grace, Christ's deity/resurrection) —
 * deliberately excluding any contested topic (eschatology systems, baptism
 * mode, church polity, election/free-will, gender roles in ministry). See
 * `essb-ideation-batch-20260715`'s "¿Sabías qué?/Teología" section, this
 * module's scope recommendation.
 *
 * PURE (no React/RN, no DB): each entry carries a stable `id` (also the i18n
 * key `t.theology.items[id]`) and one or more canonical
 * "EnglishBook/Chapter/Verse" anchor refs (the SAME form [[christConnections]]
 * / [[bibleFacts]] use) — the FIRST ref is the "open in reader" jump target,
 * any additional refs are extra cited passages shown only as plain text (no
 * live verse-text resolution for those, since several entries cite RANGES
 * like "1 Corinthians 15:3-8" that a single-verse resolver can't represent).
 * The title/body/passage-citation prose lives in i18n (`t.theology.items`),
 * es/en parity enforced by `i18nParity.test.ts` + this module's own test.
 *
 * Reviewed and approved by Victor 2026-07-29 — all 3 entries below cleared
 * for their doctrinal content. See `__tests__/theology.test.ts`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type TheologyRefKey = string;

export interface TheologyEntry {
  /** Stable slug — also the i18n key `t.theology.items[id]`. */
  id: string;
  /** Anchor verse(s), canonical refs. `refs[0]` is the "open in reader" target. */
  refs: readonly TheologyRefKey[];
  /** Ionicons glyph name for the entry's card/header. */
  icon: string;
  /** Accent colour (hex) for the entry's card/header. */
  accent: string;
  /** True while pending Victor's per-entry doctrinal sign-off. */
  draft: boolean;
}

/**
 * The curated catalog. Refs use canonical English book names so the lookup is
 * language-independent, the same convention [[christConnections]] /
 * [[bibleFacts]] use.
 */
export const THEOLOGY_ENTRIES: readonly TheologyEntry[] = [
  {
    id: 'trinity',
    refs: ['2 Corinthians/13/14'],
    icon: 'triangle-outline',
    accent: '#6366F1',
    draft: false,
  },
  {
    id: 'grace-salvation',
    refs: ['Ephesians/2/8'],
    icon: 'gift-outline',
    accent: '#10B981',
    draft: false,
  },
  {
    id: 'resurrection',
    refs: ['1 Corinthians/15/3', 'John/20/28'],
    icon: 'sunny-outline',
    accent: '#F59E0B',
    draft: false,
  },
  // ---- Growth pass 2026-08-27: Atributos de Dios (draft, pending Victor's
  // per-entry doctrinal sign-off — same pattern as the bibleFacts growth
  // pass). Every anchor ref's quoted text was verified word-for-word
  // against the app's own shipped RVR1960/WEB databases before drafting.
  // "Incomunicables" (belong to God alone) first, then "comunicables"
  // (reflected, in limited measure, in humanity made in His image) — the
  // classic Reformed/Protestant systematic-theology classification
  // (Berkhof/Hodge/Strong), not an ecumenically-neutral taxonomy.
  {
    id: 'self-existence',
    refs: ['Exodus/3/14'],
    icon: 'infinite-outline',
    accent: '#8B5CF6',
    draft: true,
  },
  {
    id: 'eternity',
    refs: ['Psalms/90/2'],
    icon: 'time-outline',
    accent: '#3B82F6',
    draft: true,
  },
  {
    id: 'immutability',
    refs: ['Malachi/3/6'],
    icon: 'shield-checkmark-outline',
    accent: '#0EA5E9',
    draft: true,
  },
  {
    id: 'omnipresence',
    refs: ['Psalms/139/7'],
    icon: 'globe-outline',
    accent: '#14B8A6',
    draft: true,
  },
  {
    id: 'omniscience',
    refs: ['Psalms/147/5'],
    icon: 'eye-outline',
    accent: '#06B6D4',
    draft: true,
  },
  {
    id: 'omnipotence',
    refs: ['Jeremiah/32/17'],
    icon: 'flash-outline',
    accent: '#EF4444',
    draft: true,
  },
  {
    id: 'unity',
    refs: ['Deuteronomy/6/4'],
    icon: 'ellipse-outline',
    accent: '#7C3AED',
    draft: true,
  },
  {
    id: 'love',
    refs: ['1 John/4/8'],
    icon: 'heart-outline',
    accent: '#EC4899',
    draft: true,
  },
  {
    id: 'holiness',
    refs: ['1 Peter/1/16'],
    icon: 'sparkles-outline',
    accent: '#FBBF24',
    draft: true,
  },
  {
    id: 'justice',
    refs: ['Deuteronomy/32/4'],
    icon: 'scale-outline',
    accent: '#64748B',
    draft: true,
  },
  {
    id: 'mercy-grace',
    refs: ['Exodus/34/6'],
    icon: 'hand-left-outline',
    accent: '#10B981',
    draft: true,
  },
  {
    id: 'faithfulness',
    refs: ['Lamentations/3/23'],
    icon: 'anchor-outline',
    accent: '#0D9488',
    draft: true,
  },
  {
    id: 'goodness',
    refs: ['Psalms/145/9'],
    icon: 'leaf-outline',
    accent: '#84CC16',
    draft: true,
  },
  {
    id: 'wisdom',
    refs: ['Romans/11/33'],
    icon: 'bulb-outline',
    accent: '#F97316',
    draft: true,
  },
  {
    id: 'patience',
    refs: ['2 Peter/3/9'],
    icon: 'hourglass-outline',
    accent: '#A855F7',
    draft: true,
  },
] as const;

/** Total entries in the catalog (draft + published). */
export const THEOLOGY_COUNT = THEOLOGY_ENTRIES.length;

/** Look up a catalog entry by its stable id. Pure. */
export function getTheologyEntryById(id: string): TheologyEntry | null {
  return THEOLOGY_ENTRIES.find(e => e.id === id) ?? null;
}

/**
 * Entries cleared for real users — excludes `draft: true` so the browsable
 * hub never surfaces unreviewed doctrinal content. Mirrors
 * `getFactsByCategory`'s exclusion in bibleFacts.ts. Pure.
 */
export function getPublishedTheologyEntries(): readonly TheologyEntry[] {
  return THEOLOGY_ENTRIES.filter(e => !e.draft);
}
