/**
 * 📖 bookFilter — PURE per-book narrowing for search results (Sprint 70).
 *
 * The search screen already filters by Testament (OT/NT); this adds the missing
 * finer axis — narrow the loaded results to a SINGLE book. `booksInResults`
 * drives a contextual chip row (only the books actually present in the current
 * results, in canonical order, with match counts) so the filter never shows an
 * empty 66-book list. Pure + unit-tested, mirroring [[testamentFilter]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import type {BibleVerse} from '../../types/bible';

/** One book present in the results: its stored name, number and match count. */
export interface BookBucket {
  /** Stored book name (version-language), e.g. "Genesis" / "Génesis". */
  book: string;
  /** Canonical 1-based book number, for ordering. */
  bookNumber: number;
  /** How many loaded results fall in this book. */
  count: number;
}

/**
 * The distinct books present in `verses`, in canonical order (by `bookNumber`),
 * each with its match count. First appearance wins the displayed name so mixed
 * casings/spellings of the same book number still collapse to one bucket.
 */
export function booksInResults<
  T extends Pick<BibleVerse, 'book' | 'bookNumber'>,
>(verses: readonly T[]): BookBucket[] {
  const buckets = new Map<number, BookBucket>();
  for (const v of verses) {
    const existing = buckets.get(v.bookNumber);
    if (existing) {
      existing.count += 1;
    } else {
      buckets.set(v.bookNumber, {
        book: v.book,
        bookNumber: v.bookNumber,
        count: 1,
      });
    }
  }
  return [...buckets.values()].sort((a, b) => a.bookNumber - b.bookNumber);
}

/** Keep only the verses in `book` (matched by stored name); `null` ⇒ all. */
export function applyBookFilter<T extends Pick<BibleVerse, 'book'>>(
  verses: readonly T[],
  book: string | null,
): T[] {
  if (!book) return [...verses];
  return verses.filter(v => v.book === book);
}

/** A book's FULL match set fetched straight from the DB (Sprint 71). */
export interface FullBookResults<T> {
  /** The stored book name these results belong to. */
  book: string;
  /** Every match in that book for the query+version, ordered chapter:verse. */
  verses: T[];
}

/**
 * Whether to query the DB for a book's COMPLETE match set rather than narrowing
 * the loaded pages. Only worth it when a book is selected AND the loaded pages
 * might be incomplete — i.e. the paginated search hit its page cap (`hasMore`).
 * When everything for the query is already loaded, `applyBookFilter` over the
 * loaded set is itself global, so no extra fetch is needed. (Sprint 71)
 */
export function shouldFetchFullBook(
  book: string | null,
  hasMore: boolean,
): boolean {
  return book !== null && hasMore;
}

/**
 * Pick the results to display for the per-book filter. When a book is selected
 * and its FULL DB set has been fetched (beyond the loaded pages), show that;
 * otherwise narrow the loaded results to the book — which is also the instant
 * fallback while the full fetch is in flight, or the complete answer when the
 * search wasn't paginated. `null` book ⇒ all loaded results. (Sprint 71)
 */
export function resolveDisplayedResults<T extends Pick<BibleVerse, 'book'>>(
  loaded: readonly T[],
  book: string | null,
  fullBook: FullBookResults<T> | null,
): T[] {
  if (book && fullBook && fullBook.book === book) {
    return [...fullBook.verses];
  }
  return applyBookFilter(loaded, book);
}
