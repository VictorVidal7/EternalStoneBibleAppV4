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

/** A distribution bar tagged with the book it represents (Ficha #14 — tap to filter). */
export interface BookBarDatum extends BarDatum {
  book_id: number;
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
    }));
}

/** How many distinct books a Strong's number occurs in (its "breadth"). */
export function distinctBookCount(
  distribution: readonly StrongsBookCount[],
): number {
  return distribution.length;
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
