/**
 * 🕊️ shareFaithObjections — "Comparte tu fe" → common questions/objections,
 * each mapped to a handful of relevant verses (Part 1 of the "Comparte tu fe"
 * free-tier feature).
 *
 * SHAPE mirrors [[themes]] exactly on purpose (same "id + icon + accent +
 * verseRefs" record, same canonical "EnglishBook/Chapter/Verse" ref key, same
 * `parse*Ref` helper) — this is a topical index, just indexed by a common
 * objection a believer might hear ("¿Cómo sé que Dios existe?") instead of a
 * feeling/theme ("Fe"). The screen resolves each ref's text from SQLite at
 * runtime exactly like the theme detail screen does; a missing verse renders
 * a graceful placeholder.
 *
 * SCOPE GUARDRAIL — read before adding to this file: this module is
 * DELIBERATELY Part 1 only, NOT Part 2. Each objection's `verseRefs` are a
 * flat, ORDER-INSIGNIFICANT set of 2-4 passages someone could read/reflect
 * on/share — never a sequenced "step 1, step 2, step 3" argument, never
 * connecting prose that chains verses into a case, and never a walk-through
 * of how to present the gospel. A prior research pass proposed exactly that
 * (a sequenced gospel outline) as a separate, higher-risk "Part 2" — because
 * the SEQUENCE itself would encode one particular soteriological framework,
 * even though every individual verse is Scripture. That decision needs the
 * app owner's own single-framework-vs-multi-view call first (same kind of
 * decision already made for contested dictionary topics like Bautismo /
 * Milenio) and is OUT OF SCOPE here. If you're tempted to add ordering,
 * transitions, or "and therefore…" commentary between refs, stop — that's
 * Part 2, not this file.
 *
 * The app never writes anyone's testimony or tells them what to say (see the
 * same guardrail on [[prepTable]] for preaching prep, and on the sibling
 * [[faithTestimony]] model for the user's own written testimony) — this
 * module only surfaces verses; a believer reads, reflects, and shares in
 * their own words.
 *
 * FIDELITY: every reference below was looked up directly against the app's
 * bundled `assets/bible-seed.db` (both RVR1960 and WEB rows read in full,
 * not just existence-checked) before being written here — per this project's
 * standing "verify every verse reference against the real bundled DB before
 * writing devotional content" rule. The accompanying test only re-checks
 * book/chapter shape (same as [[themes]]'s test — Jest can't load the native
 * SQLite asset), so that manual DB read is the actual fidelity gate; flag any
 * new ref for a human read-through before merge, same as the rest of this
 * list.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type ObjectionRefKey = string;

export interface ShareFaithObjection {
  /** Stable key — the route param `[id]` AND the i18n key `t.shareFaith.objections.list[id]`. */
  id: string;
  /** Ionicons glyph name for the objection's icon. */
  icon: string;
  /** Accent colour (hex) used for the objection's chip/header. */
  accent: string;
  /** Curated, order-insignificant passages for this objection, as canonical refs (no ranges). */
  verseRefs: ObjectionRefKey[];
}

/** A parsed objection reference: the canonical key split into its parts. */
export interface ParsedObjectionRef {
  key: ObjectionRefKey;
  /** English book name as stored in the key. */
  book: string;
  chapter: number;
  verse: number;
}

/**
 * The curated objection → verses index. Refs use canonical English book
 * names so the lookup is language-independent, same convention as
 * [[themes]] / [[messianicProphecies]]. A deliberately small, respectful set
 * of genuinely common, non-inflammatory questions — not a debate "gotcha"
 * list.
 */
export const SHARE_FAITH_OBJECTIONS: readonly ShareFaithObjection[] = [
  {
    id: 'god-exists',
    icon: 'planet',
    accent: '#6366F1',
    verseRefs: ['Romans/1/20', 'Psalms/19/1', 'Genesis/1/1', 'Hebrews/11/6'],
  },
  {
    id: 'suffering',
    icon: 'rainy',
    accent: '#3B82F6',
    verseRefs: ['Romans/8/28', 'John/16/33', 'Revelation/21/4', 'Psalms/34/18'],
  },
  {
    id: 'many-religions',
    icon: 'git-compare',
    accent: '#8B5CF6',
    verseRefs: ['John/14/6', 'Acts/4/12', '1 Timothy/2/5'],
  },
  {
    id: 'bible-reliable',
    icon: 'library',
    accent: '#0EA5E9',
    verseRefs: [
      '2 Timothy/3/16',
      '2 Peter/1/21',
      'Psalms/119/105',
      'Isaiah/40/8',
    ],
  },
  {
    id: 'faith-and-science',
    icon: 'flask',
    accent: '#10B981',
    verseRefs: ['Colossians/1/17', 'Hebrews/11/3', 'Psalms/111/2'],
  },
  {
    id: 'real-change',
    icon: 'refresh-circle',
    accent: '#F59E0B',
    verseRefs: [
      '2 Corinthians/5/17',
      'Philippians/1/6',
      'Ezekiel/36/26',
      'Romans/12/2',
    ],
  },
  {
    id: 'after-death',
    icon: 'infinite',
    accent: '#6B7280',
    verseRefs: [
      'John/11/25',
      '1 Corinthians/15/57',
      'Hebrews/9/27',
      '2 Corinthians/5/1',
    ],
  },
  {
    id: 'god-cares',
    icon: 'heart',
    accent: '#EC4899',
    verseRefs: [
      '1 Peter/5/7',
      'Matthew/10/31',
      'Zephaniah/3/17',
      'Psalms/139/1',
    ],
  },
];

/** All objections, in display order. */
export function getAllShareFaithObjections(): readonly ShareFaithObjection[] {
  return SHARE_FAITH_OBJECTIONS;
}

/** Look up an objection by its `id`, or null when unknown (defensive on bad params). */
export function getShareFaithObjection(
  id: string | null | undefined,
): ShareFaithObjection | null {
  if (!id) return null;
  return SHARE_FAITH_OBJECTIONS.find(o => o.id === id) ?? null;
}

/**
 * Split a canonical "Book/Chapter/Verse" key into parts. Returns null for a
 * malformed key (missing slash, non-numeric chapter/verse) so callers can
 * skip a bad row rather than crash. Identical logic to [[themes]]'s
 * `parseThemeRef` — kept as this module's own copy so each curated content
 * module stays independently maintainable, same precedent as `themes.ts`.
 */
export function parseObjectionRef(
  key: ObjectionRefKey,
): ParsedObjectionRef | null {
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
