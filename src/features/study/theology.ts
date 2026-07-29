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
] as const;

/** Total entries in the catalog. */
export const THEOLOGY_COUNT = THEOLOGY_ENTRIES.length;

/** Look up a catalog entry by its stable id. Pure. */
export function getTheologyEntryById(id: string): TheologyEntry | null {
  return THEOLOGY_ENTRIES.find(e => e.id === id) ?? null;
}
