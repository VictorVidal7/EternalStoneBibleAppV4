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

export type PrepSection = (typeof PREP_SECTIONS)[number];

/**
 * Cap on gathered cross-references — enough parallels to study without burying
 * the preparer or bloating the export. Verses are walked in ascending order and
 * each verse keeps its curated order, so the cut is deterministic.
 */
export const PREP_MAX_CROSS_REFS = 12;

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
  /** The ordered outline sections (stable ids → i18n). */
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
 * rather than a crash. `getCrossRefs` is injectable for tests.
 */
export function buildPrepTable(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse?: number,
  deps?: {
    getCrossRefs?: (book: string, chapter: number, verse: number) => string[];
  },
): PrepTable | null {
  const passage = normalizePassage(book, chapter, startVerse, endVerse);
  if (!passage) return null;

  const getRefs = deps?.getCrossRefs ?? getCrossReferences;

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
      if (crossRefs.length >= PREP_MAX_CROSS_REFS) break;
    }
    if (crossRefs.length >= PREP_MAX_CROSS_REFS) break;
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
