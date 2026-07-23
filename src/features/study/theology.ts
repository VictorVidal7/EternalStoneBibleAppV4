/**
 * ✝️ theology — the "Teología" catalog (BORRADOR — infrastructure phase).
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
 * ⚠️ BORRADOR — pendiente de revisión doctrinal. Every entry below is a
 * placeholder drafted to prove the feature shell end-to-end. NOT reviewed or
 * approved by Victor yet — do not treat as ship-ready content. See
 * `__tests__/theology.test.ts` and the branch's own commit message.
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
  /**
   * BORRADOR flag — true while pending Victor's per-entry doctrinal sign-off.
   * Every entry in this placeholder seed is `true`; flip to false (or drop
   * the field) only once he has reviewed that specific entry's exact text.
   */
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
    draft: true,
  },
  {
    id: 'grace-salvation',
    refs: ['Ephesians/2/8'],
    icon: 'gift-outline',
    accent: '#10B981',
    draft: true,
  },
  {
    id: 'resurrection',
    refs: ['1 Corinthians/15/3', 'John/20/28'],
    icon: 'sunny-outline',
    accent: '#F59E0B',
    draft: true,
  },
] as const;

/** Total entries in the catalog. */
export const THEOLOGY_COUNT = THEOLOGY_ENTRIES.length;

/** Look up a catalog entry by its stable id. Pure. */
export function getTheologyEntryById(id: string): TheologyEntry | null {
  return THEOLOGY_ENTRIES.find(e => e.id === id) ?? null;
}
