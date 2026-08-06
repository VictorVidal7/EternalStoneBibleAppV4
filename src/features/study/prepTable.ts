/**
 * 📋 prepTable — "Mesa de preparación" — the PURE assembly behind the teaching
 * and sermon preparation table (Sprint 103).
 *
 * The dream the user asked for is "a local mini study-helper that gives a lot of
 * help, with great care and full fidelity to evangelical Christian theology" —
 * WITHOUT any AI/backend (the app stays 100% offline). This module is exactly
 * that: a DETERMINISTIC assembler. Give it a passage (a book + chapter + a verse
 * range) and it gathers everything the app already curates and vets for that
 * passage —
 *
 *   - the curated CROSS-REFERENCES of every verse in the range (parallels to
 *     compare, "examinad … cada día … si estas cosas eran así", Hechos 17:11);
 *   - the "Cristo en este pasaje" CHRIST CONNECTIONS that fall in the range
 *     (the whole of Scripture testifies of Him, Lucas 24:27; Juan 5:39);
 *   - the topical THEMES the passage speaks to (the S63 taxonomy);
 *   - whether a "Sobre este libro" INTRO exists for context.
 *
 * — and lays out the stable, widely-held evangelical study/preaching SCAFFOLD
 * the preparer fills in their own prayerful words: Context → Observation →
 * Interpretation → the single Big Idea of the passage (Haddon Robinson) →
 * Connection to Christ → Application → questions for the group. The app NEVER
 * writes the sermon or puts words in anyone's mouth (cf. Jeremías 23:30-32); it
 * only assembles the helps and holds the frame, so the work stays the preparer's
 * own study before the Lord (2 Timoteo 2:15).
 *
 * PURE (no React / RN, no SQLite, no Date.now): the screen resolves the gathered
 * keys into verse text, holds the preparer's editable prose, and exports — but
 * every decision here is a unit-testable function over the curated data, exactly
 * like [[studyConnections]] / [[lectio]] / [[dailyLight]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookByName, getBookById} from '@/constants/bible';
import {getCrossReferences} from '@/constants/cross-references';
import {BOOK_INTROS} from '@/constants/book-intros';
import {CHRIST_CONNECTIONS, type ChristConnection} from './christConnections';
import {BIBLE_THEMES, parseThemeRef} from './themes';

/** A canonical "EnglishBook/Chapter/Verse" reference key. */
export type PrepRefKey = string;

/**
 * The ordered homiletic outline the preparer works through. Each id is also the
 * i18n key under `t.prepTable.sections[id]` (label + guiding prompt). The order
 * is the classic inductive movement — what it SAYS, what it MEANT/MEANS, its one
 * dominant thought, how it reveals Christ, how it changes us, and questions to
 * teach it — kept Christ-centred so application never floats free of the gospel.
 *
 * This is the **'expository'** template's outline (see `PREP_TEMPLATES` below)
 * and the DEFAULT for every passage — unchanged since Sprint 103. A saved
 * `PrepNotes` entry with no `template` field (every entry written before
 * templates existed) is treated as `'expository'` and renders/exports/times
 * EXACTLY this list, in this order — that backward-compatibility guarantee is
 * why this constant's value must never change.
 */
export const PREP_SECTIONS = [
  'context',
  'observation',
  'interpretation',
  'bigIdea',
  'christ',
  'application',
  'questions',
] as const;

/**
 * Section ids introduced by the non-'expository' templates (see
 * `PREP_TEMPLATES` below) — each still just an i18n key under
 * `t.prepTable.sections[id]`, same shape as the original 7:
 *
 *  - `versePoints` ('textual'): the classic verse-by-verse sermon derives its
 *    points directly from the text's own clauses IN ORDER, observing and
 *    interpreting each together rather than in two separate global passes —
 *    a genuinely different single step, not a relabeling of
 *    observation+interpretation.
 *  - `topicDevelopment` ('topical'): a topic-driven message doesn't walk ONE
 *    passage's flow — it builds its case across passages, so the "what does
 *    this development look like, in what order" question replaces
 *    observation/interpretation.
 *  - `tension` / `resolution` ('narrative'): a story's conflict and its turn —
 *    concepts none of the original 7 name.
 *
 * Listed here together with `PREP_SECTIONS` in `ALL_PREP_SECTION_IDS` below.
 */
export const ALL_PREP_SECTION_IDS = [
  'context',
  'observation',
  'interpretation',
  'versePoints',
  'topicDevelopment',
  'tension',
  'resolution',
  'bigIdea',
  'christ',
  'application',
  'questions',
] as const;

export type PrepSection = (typeof ALL_PREP_SECTION_IDS)[number];

/**
 * The homiletic structure the preparer chooses for a passage (proposal #1 of
 * the sermon-prep-support research, 2026-07-15). `'expository'` is today's
 * only outline and stays the default; the other three are additive — same
 * `{id, label, prompt}` shape, just a different ordered subset of section ids.
 * These ids are PERSISTED on `PrepNotes.template` (see `prepNotes.ts`) — never
 * rename or remove one after ships without a storage migration.
 */
export const PREP_TEMPLATE_IDS = [
  'expository',
  'textual',
  'topical',
  'narrative',
] as const;

export type PrepTemplateId = (typeof PREP_TEMPLATE_IDS)[number];

/** A saved entry with no `template` field renders as this — see `PREP_SECTIONS`'s docstring. */
export const DEFAULT_PREP_TEMPLATE: PrepTemplateId = 'expository';

const TEXTUAL_SECTIONS = [
  'context',
  'versePoints',
  'bigIdea',
  'christ',
  'application',
  'questions',
] as const satisfies readonly PrepSection[];

const TOPICAL_SECTIONS = [
  'context',
  'topicDevelopment',
  'bigIdea',
  'christ',
  'application',
  'questions',
] as const satisfies readonly PrepSection[];

const NARRATIVE_SECTIONS = [
  'context',
  'observation',
  'tension',
  'resolution',
  'bigIdea',
  'christ',
  'application',
  'questions',
] as const satisfies readonly PrepSection[];

/** Every template's ordered section-id list, keyed by `PrepTemplateId`. */
export const PREP_TEMPLATES: Record<PrepTemplateId, readonly PrepSection[]> = {
  expository: PREP_SECTIONS,
  textual: TEXTUAL_SECTIONS,
  topical: TOPICAL_SECTIONS,
  narrative: NARRATIVE_SECTIONS,
};

/**
 * Resolve which ordered section-id list applies to a saved entry — the SINGLE
 * place every call site should ask "which sections for this template", instead
 * of importing `PREP_SECTIONS` directly. `null`/`undefined`/an unrecognized id
 * (defensive — a hand-edited or future-app-version store) all fall back to
 * `DEFAULT_PREP_TEMPLATE`, so a legacy entry with no `template` field renders
 * exactly as it always has.
 */
export function getPrepTemplateSections(
  templateId: PrepTemplateId | null | undefined,
): readonly PrepSection[] {
  return (
    PREP_TEMPLATES[templateId as PrepTemplateId] ??
    PREP_TEMPLATES[DEFAULT_PREP_TEMPLATE]
  );
}

/**
 * Which section id plays "interpretation"'s role in a given template — the
 * step where the curated cross-references + themes attach. The GATHERED helps
 * themselves never vary by template (the assembler is template-agnostic, see
 * `buildPrepTable` below); only which outline slot displays them does.
 */
export function interpretationSlotFor(
  templateId: PrepTemplateId | null | undefined,
): PrepSection {
  switch (templateId) {
    case 'textual':
      return 'versePoints';
    case 'topical':
      return 'topicDevelopment';
    case 'narrative':
      return 'resolution';
    case 'expository':
    default:
      return 'interpretation';
  }
}

/**
 * Every id that has ever played the interpretation-slot role above, across
 * every template — for a reader that must guess which template produced a
 * given note without being told (e.g. the read-only shared-study viewer,
 * which never receives the sender's template choice).
 */
export const INTERPRETATION_SLOT_IDS: readonly PrepSection[] = [
  'interpretation',
  'versePoints',
  'topicDevelopment',
  'resolution',
];

/**
 * Cap on gathered cross-references — enough parallels to study without burying
 * the preparer or bloating the export. Verses are walked in ascending order and
 * each verse keeps its curated order, so the cut is deterministic. This is the
 * FREE cap — unchanged by T8.4.2 so every existing free reader sees exactly
 * what they saw before.
 */
export const PREP_MAX_CROSS_REFS = 12;

/**
 * T8.4.2 — the offering-unlocked cross-reference cap. A generous ceiling
 * rather than a literal "no limit": a long passage (a whole Psalm, a whole
 * chapter) can have many dozens of curated parallels once every verse's own
 * list is unioned, and an unbounded export would bury the preparer and bloat
 * the "Copiar bosquejo" markdown instead of helping them. 40 comfortably
 * covers a full chapter of ordinary curation density while still being a
 * hard stop. `buildPrepTable` never decides which cap applies — the screen
 * picks this one for a premium reader, `PREP_MAX_CROSS_REFS` otherwise.
 */
export const PREP_MAX_CROSS_REFS_PREMIUM = 40;

/** A normalised, validated passage. */
export interface PrepPassage {
  /** Numeric book id (1-66). */
  bookId: number;
  /** Canonical English book name (how the curated maps key). */
  bookNameEn: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
}

/** Everything the assembler gathered for a passage, plus the outline frame. */
export interface PrepTable {
  /** Canonical passage key: "John/3/16" or a range "John/3/16-21". */
  passageKey: PrepRefKey;
  bookId: number;
  bookNameEn: string;
  chapter: number;
  startVerse: number;
  endVerse: number;
  /** Curated parallels across the range (deduped, self-passage dropped, capped). */
  crossRefs: PrepRefKey[];
  /** "Cristo en este pasaje" connections whose focus verse is in the range. */
  christConnections: ChristConnection[];
  /** Topical theme ids the passage speaks to (stable order = catalog order). */
  themeIds: string[];
  /** Whether a curated "Sobre este libro" intro exists for context. */
  hasBookIntro: boolean;
  /** Count of distinct gathered helps — drives a "N ayudas" badge. */
  helpCount: number;
  /**
   * The DEFAULT ('expository') outline — this assembler is template-agnostic
   * (the gathered helps never depend on which homiletic structure the
   * preparer picks), so it always reports `PREP_SECTIONS` here regardless of
   * a saved entry's own `PrepNotes.template`. A caller resolving which
   * outline actually applies to a specific saved entry must use
   * `getPrepTemplateSections(notes.template)` instead of this field.
   */
  sections: readonly PrepSection[];
}

/**
 * Resolve a raw passage request to a validated `PrepPassage`, or null when the
 * book is unknown, the chapter is out of the book's range, or the verses are
 * malformed. A reversed range (start > end) is swapped; a single verse is just
 * start === end. Verse upper bounds are not checked here (the per-chapter verse
 * count lives in the DB, not the static constants) — start/end ≥ 1 is enough.
 */
export function normalizePassage(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse?: number,
): PrepPassage | null {
  const info = getBookByName(book);
  if (!info) return null;
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > info.chapters) {
    return null;
  }
  const end = endVerse ?? startVerse;
  if (
    !Number.isInteger(startVerse) ||
    !Number.isInteger(end) ||
    startVerse < 1 ||
    end < 1
  ) {
    return null;
  }
  const lo = Math.min(startVerse, end);
  const hi = Math.max(startVerse, end);
  return {
    bookId: info.id,
    bookNameEn: info.nameEn,
    chapter,
    startVerse: lo,
    endVerse: hi,
  };
}

/** Format a canonical passage key: single verse, or "start-end" for a range. */
export function formatPassageKey(p: PrepPassage): PrepRefKey {
  const range =
    p.startVerse === p.endVerse
      ? `${p.startVerse}`
      : `${p.startVerse}-${p.endVerse}`;
  return `${p.bookNameEn}/${p.chapter}/${range}`;
}

/** True when the canonical ref key sits inside the passage's verse range. */
function refInPassage(key: PrepRefKey, p: PrepPassage): boolean {
  const parsed = parseThemeRef(key);
  if (!parsed) return false;
  const refBook = getBookByName(parsed.book);
  return (
    refBook?.id === p.bookId &&
    parsed.chapter === p.chapter &&
    parsed.verse >= p.startVerse &&
    parsed.verse <= p.endVerse
  );
}

/**
 * Assemble the full preparation table for a passage. Never throws: an unknown
 * book / out-of-range chapter yields null so the screen can show an empty state
 * rather than a crash. `getCrossRefs` is injectable for tests; `maxCrossRefs`
 * lets the CALLER decide how many cross-references to gather (default
 * `PREP_MAX_CROSS_REFS`, the free cap) — this module never asks whether the
 * user is premium, it only takes the number it's handed (the screen passes
 * `PREP_MAX_CROSS_REFS_PREMIUM` for an unlocked reader).
 */
export function buildPrepTable(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse?: number,
  deps?: {
    getCrossRefs?: (book: string, chapter: number, verse: number) => string[];
    maxCrossRefs?: number;
  },
): PrepTable | null {
  const passage = normalizePassage(book, chapter, startVerse, endVerse);
  if (!passage) return null;

  const getRefs = deps?.getCrossRefs ?? getCrossReferences;
  const maxCrossRefs = deps?.maxCrossRefs ?? PREP_MAX_CROSS_REFS;

  // ── Cross-references: walk the range ascending, keep each verse's curated
  // order, dedupe across verses, and drop any parallel that lands back inside
  // the passage itself (you are already studying those). Then cap.
  const seen = new Set<PrepRefKey>();
  const crossRefs: PrepRefKey[] = [];
  for (let v = passage.startVerse; v <= passage.endVerse; v++) {
    for (const ref of getRefs(passage.bookNameEn, passage.chapter, v) ?? []) {
      if (typeof ref !== 'string') continue;
      if (seen.has(ref) || refInPassage(ref, passage)) continue;
      seen.add(ref);
      crossRefs.push(ref);
      if (crossRefs.length >= maxCrossRefs) break;
    }
    if (crossRefs.length >= maxCrossRefs) break;
  }

  // ── Christ connections whose focus verse is in the range (catalog order).
  const christConnections = CHRIST_CONNECTIONS.filter(c =>
    refInPassage(c.ref, passage),
  );

  // ── Themes that include any verse in the range (catalog order).
  const themeIds = BIBLE_THEMES.filter(theme =>
    theme.verseRefs.some(ref => refInPassage(ref, passage)),
  ).map(theme => theme.id);

  const hasBookIntro = Boolean(BOOK_INTROS[passage.bookId]);

  const helpCount =
    crossRefs.length +
    christConnections.length +
    themeIds.length +
    (hasBookIntro ? 1 : 0);

  return {
    passageKey: formatPassageKey(passage),
    bookId: passage.bookId,
    bookNameEn: passage.bookNameEn,
    chapter: passage.chapter,
    startVerse: passage.startVerse,
    endVerse: passage.endVerse,
    crossRefs,
    christConnections,
    themeIds,
    hasBookIntro,
    helpCount,
    sections: PREP_SECTIONS,
  };
}

/**
 * Format a passage key into a display label in the given language, e.g.
 * "Juan 3:16-21" (es) / "John 3:16-21" (en). Falls back to the book id lookup.
 */
export function formatPassageLabel(
  table: Pick<PrepTable, 'bookId' | 'chapter' | 'startVerse' | 'endVerse'>,
  language: 'es' | 'en',
): string {
  const book = getBookById(table.bookId);
  const name = book ? (language === 'es' ? book.name : book.nameEn) : '';
  const range =
    table.startVerse === table.endVerse
      ? `${table.startVerse}`
      : `${table.startVerse}-${table.endVerse}`;
  return `${name} ${table.chapter}:${range}`.trim();
}
