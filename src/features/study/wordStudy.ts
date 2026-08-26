/**
 * 📖 wordStudy — visual concordance / word-study facade + pure helpers.
 *
 * WORD STUDY (flagship #2): layered on the original-languages pack and its
 * Strong's index, this turns "where else does this word appear?" into a study —
 * the total count, the distribution across books (a bar chart), the first and
 * last appearance, and the full occurrence list. The chart-shaping and labels
 * stay PURE (no DB / no React) so they unit-test deterministically; the async
 * facade just composes the existing concordance with the new per-book/extent
 * queries.
 *
 * Like the rest of the originals stack, every call is defensive — when the pack
 * isn't installed the data resolves to empty, never throws.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import bibleDB, {
  type StrongsBookCount,
  type StrongsEntry,
  type StrongsOccurrence,
} from '@lib/database';
import {getBookById} from '@/constants/bible';
import type {BarDatum} from '@components/charts/MiniBarChart';
import {
  getStrongsDetail,
  getStrongsConcordance,
  getStrongsOccurrencesByBook,
  hasLexicon,
} from './originals';
import type {Lang} from './originals';

export type {StrongsBookCount};

/** Short book label (abbreviation) for the distribution chart. */
export function bookChartLabel(bookId: number, language: Lang): string {
  const book = getBookById(bookId);
  if (!book) return `#${bookId}`;
  return language === 'en' ? book.abbrEn : book.abbr;
}

/**
 * Old/new testament for a book id — defaults to `'old'` for an unrecognized
 * id, matching `bookChartLabel`'s defensive `#id` fallback above. Real
 * distribution rows always carry a valid canonical book_id (1-66), so this
 * only matters for malformed/test data.
 */
function bookTestament(bookId: number): 'old' | 'new' {
  return getBookById(bookId)?.testament ?? 'old';
}

/** A distribution bar tagged with the book it represents (Ficha #14 — tap to filter). */
export interface BookBarDatum extends BarDatum {
  book_id: number;
  /** Old/new testament (T: word-study-testament-split) — a pure client-side
   * derivation from `book_id`; this helper never assigns a color, the screen
   * maps it to a theme token. */
  testament: 'old' | 'new';
}

/**
 * The bars for the distribution chart: the books where a Strong's number occurs
 * MOST, capped to `max` and labelled by book abbreviation, tallest first (ties
 * broken canonically so the order is deterministic). The grand total lives in
 * the header, so the rest beyond `max` is simply not charted — folding it into a
 * lump would dwarf the real top books. Pure.
 */
export function buildBookBars(
  distribution: readonly StrongsBookCount[],
  language: Lang,
  max = 8,
): BookBarDatum[] {
  return [...distribution]
    .sort((a, b) => b.count - a.count || a.book_id - b.book_id)
    .slice(0, max)
    .map(d => ({
      label: bookChartLabel(d.book_id, language),
      value: d.count,
      book_id: d.book_id,
      testament: bookTestament(d.book_id),
    }));
}

/** How many distinct books a Strong's number occurs in (its "breadth"). */
export function distinctBookCount(
  distribution: readonly StrongsBookCount[],
): number {
  return distribution.length;
}

/** Old/new testament occurrence totals (T: word-study-testament-split). */
export interface TestamentTotals {
  old: number;
  new: number;
}

/**
 * Old/new testament totals summed across the FULL distribution — not just
 * the top-`max` bars `buildBookBars` charts — so the summary line stays
 * honest even when most of a word's occurrences fall outside the charted
 * top books. A Strong's number frequently reads as fully one-testament
 * (e.g. a Hebrew word: `{old: 248, new: 0}`) — that's a correct result, not
 * a bug. Pure.
 */
export function testamentTotals(
  distribution: readonly StrongsBookCount[],
): TestamentTotals {
  const totals: TestamentTotals = {old: 0, new: 0};
  for (const d of distribution) {
    totals[bookTestament(d.book_id)] += d.count;
  }
  return totals;
}

/** Everything the word-study screen needs for one Strong's number. */
export interface WordStudy {
  lexicon: StrongsEntry | null;
  count: number;
  occurrences: StrongsOccurrence[];
  distribution: StrongsBookCount[];
  first: StrongsOccurrence | null;
  last: StrongsOccurrence | null;
}

const EMPTY_STUDY: WordStudy = {
  lexicon: null,
  count: 0,
  occurrences: [],
  distribution: [],
  first: null,
  last: null,
};

/**
 * The full word study for a Strong's number: lexicon entry + total count +
 * per-book distribution + first/last appearance + bounded occurrence list.
 * Resolves to an empty study (never throws) when the pack isn't installed or the
 * number isn't a valid lexicon key.
 */
export async function getWordStudy(
  strongs: string,
  occurrenceLimit = 200,
): Promise<WordStudy> {
  if (!hasLexicon(strongs)) return EMPTY_STUDY;
  try {
    const [lexicon, concordance, distribution, extent] = await Promise.all([
      getStrongsDetail(strongs),
      getStrongsConcordance(strongs, occurrenceLimit),
      bibleDB.getStrongsBookDistribution(strongs).catch(() => []),
      bibleDB
        .getStrongsExtent(strongs)
        .catch(() => ({first: null, last: null})),
    ]);
    return {
      lexicon,
      count: concordance.count,
      occurrences: concordance.occurrences,
      distribution,
      first: extent.first,
      last: extent.last,
    };
  } catch {
    return EMPTY_STUDY;
  }
}

/**
 * One book's occurrences of a Strong's number, fetched fresh and scoped to
 * that book (Ficha #14 — tapping a distribution bar). This is what the
 * word-study screen calls when a bar filter is applied, INSTEAD of narrowing
 * `WordStudy.occurrences` client-side — that array is globally capped in
 * canonical book order (see {@link getWordStudy}'s `occurrenceLimit`), so a
 * later-canon book can be entirely absent from it even when it truly has
 * occurrences. Purely additive: `getWordStudy`'s own shape/behavior is
 * unchanged. Empty on failure/not-installed, never throws.
 */
export function getWordStudyBookOccurrences(
  strongs: string,
  bookId: number,
): Promise<StrongsOccurrence[]> {
  return getStrongsOccurrencesByBook(strongs, bookId);
}

/**
 * The cache key for one occurrence's resolved verse snippet
 * (T: word-study-snippets) — stable across re-renders since it's derived
 * only from the occurrence's own reference fields, never the row's index in
 * whatever (possibly-truncated) list it came from.
 */
export function occurrenceSnippetKey(
  occ: Pick<StrongsOccurrence, 'book_id' | 'chapter' | 'verse'>,
): string {
  return `${occ.book_id}-${occ.chapter}-${occ.verse}`;
}

/**
 * The rendered translation text for one occurrence — the snippet shown under
 * its ref/word row (T: word-study-snippets). Calls `bibleDB.getVerse`
 * directly with the occurrence's own `book_id` (unlike `originals.ts`'s
 * `getVerseText`, which round-trips through a book NAME because that's what
 * its callers have on hand; occurrences already carry the id). Occurrence
 * lists run 200-500 rows, so the screen calls this for a bounded window only,
 * never the full list eagerly. Null when the verse/version isn't available;
 * never throws.
 */
export async function getOccurrenceSnippet(
  occ: Pick<StrongsOccurrence, 'book_id' | 'chapter' | 'verse'>,
  version: string,
): Promise<string | null> {
  try {
    const row = await bibleDB.getVerse(
      occ.book_id,
      occ.chapter,
      occ.verse,
      version,
    );
    return row?.text ?? null;
  } catch {
    return null;
  }
}
