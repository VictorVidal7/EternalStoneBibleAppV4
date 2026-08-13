/**
 * 🕊️ shareFaithMethods — "Comparte tu fe" → classic gospel-sharing outlines
 * (Part A of a follow-up to Part 1's [[shareFaithObjections]] free-tier
 * feature).
 *
 * SHAPE mirrors [[shareFaithObjections]] on purpose (same "id + icon + accent"
 * record, same canonical "EnglishBook/Chapter/Verse" ref key, same
 * `parse*Ref` helper) — this is also a topical index, resolved to verse text
 * from SQLite at runtime exactly like the objection detail screen does; a
 * missing verse renders a graceful placeholder.
 *
 * SCOPE NOTE — this module is deliberately DIFFERENT from
 * [[shareFaithObjections]] in one load-bearing way: unlike that file's
 * flat, order-insignificant `verseRefs`, this data IS ordered (`steps` is a
 * sequence, step 1 → step N) and each verse DOES carry a one-clause
 * `captionKey` naming what that verse contributes to the outline. That's
 * intentional here — each of the 4 methods below reproduces a well-known
 * VERSE SEQUENCE that churches and ministries across many traditions have
 * used for decades; presenting its steps in order is just faithfully
 * reproducing that sequence, not inventing a new sequenced argument. None
 * of the 4 is named/branded after any one org's specific tract — `id:
 * 'design-brokenness-restoration'` avoids "The 3 Circles" (NAMB/SBC's
 * trademarked evangelism tool) for the same reason `id: 'bridge-to-god'`
 * avoids The Navigators' "The Bridge to Life" and `id: 'four-steps'` avoids
 * Cru's "The Four Spiritual Laws" — a recognizable, single-org tract name
 * would misleadingly imply a denominational/organizational affiliation this
 * app doesn't have (2026-08 movement-neutrality audit; the latter two ids
 * were renamed in a follow-up pass after the audit's first pass missed
 * them). Captions stay to a single clause naming what the verse
 * contributes — never connecting "therefore" prose beyond that, and never
 * commentary that argues a case on the reader's behalf.
 *
 * The app never writes anyone's testimony or tells them what to say (see the
 * same guardrail on [[prepTable]] for preaching prep, and on the sibling
 * [[faithTestimony]] model for the user's own written testimony) — this
 * module only surfaces verses in the shape of well-known outlines; a
 * believer reads, reflects, and shares in their own words.
 *
 * FIDELITY: every reference below was looked up directly against the app's
 * bundled `assets/bible-seed.db` (both RVR1960 and WEB rows read in full,
 * not just existence-checked) during drafting, per this project's standing
 * "verify every verse reference against the real bundled DB before writing
 * devotional content" rule. The accompanying test only re-checks book/chapter
 * shape (same as [[shareFaithObjections]]'s test — Jest can't load the
 * native SQLite asset), so that manual DB read is the actual fidelity gate.
 *
 * Book-name convention: refs use canonical English book names (RVR1960 rows
 * in the DB use Spanish book names, WEB uses English — the app resolves
 * either at runtime via `getBookByName`, same as [[shareFaithObjections]]).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type MethodRefKey = string;

export interface ShareFaithMethodStep {
  /** Canonical "EnglishBook/Chapter/Verse" reference for this step. */
  ref: MethodRefKey;
  /** i18n key suffix for this step's one-clause caption, under `stepCaptions[methodId]`. */
  captionKey: string;
}

export interface ShareFaithMethod {
  /** Stable key — the route param `[id]` AND the i18n key `t.shareFaith.methods.list[id]`. */
  id: string;
  /** Ionicons glyph name for the method's icon. */
  icon: string;
  /** Accent colour (hex) used for the method's chip/header. */
  accent: string;
  /** Ordered steps walking through this outline — order is load-bearing. */
  steps: ShareFaithMethodStep[];
}

/** A parsed method-step reference: the canonical key split into its parts. */
export interface ParsedMethodRef {
  key: MethodRefKey;
  /** English book name as stored in the key. */
  book: string;
  chapter: number;
  verse: number;
}

/**
 * The curated gospel-sharing outlines. Each `steps` array is ORDERED — do
 * not reorder or alphabetize when editing. A deliberately small set of
 * well-known, cross-tradition outlines, not one denomination's formula (see
 * `shareFaith.methods.framingNote` in the translations for the user-facing
 * framing of that same point).
 */
export const SHARE_FAITH_METHODS: readonly ShareFaithMethod[] = [
  {
    id: 'romans-road',
    icon: 'footsteps',
    accent: '#DC2626',
    steps: [
      {ref: 'Romans/3/23', captionKey: 'romans-3-23'},
      {ref: 'Romans/6/23', captionKey: 'romans-6-23'},
      {ref: 'Romans/5/8', captionKey: 'romans-5-8'},
      {ref: 'Romans/10/9', captionKey: 'romans-10-9'},
      {ref: 'Romans/10/13', captionKey: 'romans-10-13'},
    ],
  },
  {
    id: 'bridge-to-god',
    icon: 'git-network-outline',
    accent: '#2563EB',
    steps: [
      {ref: 'Isaiah/59/2', captionKey: 'isaiah-59-2'},
      {ref: 'Romans/6/23', captionKey: 'romans-6-23'},
      {ref: 'Romans/5/8', captionKey: 'romans-5-8'},
      {ref: '1 Timothy/2/5', captionKey: '1-timothy-2-5'},
      {ref: 'Ephesians/2/8', captionKey: 'ephesians-2-8'},
      {ref: 'Ephesians/2/9', captionKey: 'ephesians-2-9'},
    ],
  },
  {
    id: 'four-steps',
    icon: 'list',
    accent: '#EA580C',
    steps: [
      {ref: 'John/3/16', captionKey: 'john-3-16'},
      {ref: 'Romans/3/23', captionKey: 'romans-3-23'},
      {ref: 'Romans/6/23', captionKey: 'romans-6-23'},
      {ref: 'John/14/6', captionKey: 'john-14-6'},
      {ref: 'John/1/12', captionKey: 'john-1-12'},
    ],
  },
  {
    id: 'design-brokenness-restoration',
    icon: 'sync',
    accent: '#059669',
    steps: [
      {ref: 'Genesis/1/27', captionKey: 'genesis-1-27'},
      {ref: 'Isaiah/53/6', captionKey: 'isaiah-53-6'},
      {ref: 'Romans/5/8', captionKey: 'romans-5-8'},
      {ref: 'Acts/3/19', captionKey: 'acts-3-19'},
      {ref: '2 Corinthians/5/17', captionKey: '2-corinthians-5-17'},
    ],
  },
];

/** All methods, in display order. */
export function getAllShareFaithMethods(): readonly ShareFaithMethod[] {
  return SHARE_FAITH_METHODS;
}

/** Look up a method by its `id`, or null when unknown (defensive on bad params). */
export function getShareFaithMethod(
  id: string | null | undefined,
): ShareFaithMethod | null {
  if (!id) return null;
  return SHARE_FAITH_METHODS.find(m => m.id === id) ?? null;
}

/**
 * Split a canonical "Book/Chapter/Verse" key into parts. Returns null for a
 * malformed key (missing slash, non-numeric chapter/verse) so callers can
 * skip a bad row rather than crash. Identical logic to
 * [[shareFaithObjections]]'s `parseObjectionRef` — kept as this module's own
 * copy so each curated content module stays independently maintainable,
 * same precedent as `themes.ts` / `shareFaithObjections.ts`.
 */
export function parseMethodRef(key: MethodRefKey): ParsedMethodRef | null {
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
