/**
 * 📚 bookReadingLog — REAL per-book reading aggregates (PURE, no React/RN).
 *
 * Until Sprint 65 the "most-read book" surfaced in Mi lectura / Tu camino was a
 * PROXY: it ranked books by how many chapters had *any* scroll progress
 * (ReadingProgress), not by how much was actually read. The reader's hot path
 * (`trackVersesRead`) already knew the current book + verse count + dwell time
 * but never persisted the book, so the real signal was thrown away.
 *
 * This module is the pure half of the fix: it turns the rows of the additive
 * forward-only `book_reading_log` SQLite table (book → verses + seconds + last
 * read) into a clean, ranked model. The ranking is by VERSES read (consistent
 * with the lifetime `total_verses_read` counter), tie-broken by time spent, then
 * recency, then name — deterministic so the screens render the same order every
 * time. Everything is injected; no SQLite / AsyncStorage / React / clock here.
 *
 * Mirrors the shape of [[bookCompletion]] / [[readingInsights]] — all device
 * local, never touches Firestore, defensive against degenerate rows.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** One row of the per-book reading log (`book_reading_log`, camelCased). */
export interface BookReadingEntry {
  /** Canonical (English) book key — as stored in the table. */
  book: string;
  /** Total verses credited while reading this book (accumulates per 5s dwell). */
  versesRead: number;
  /** Accumulated reading time for this book, in SECONDS. */
  timeSpent: number;
  /** Millis since epoch of the most recent credited read (0 if unknown). */
  lastReadAt: number;
}

/** Coerce anything to a finite, non-negative integer (defensive). */
function nonNeg(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.floor(v);
}

/**
 * Normalize raw table rows into clean entries. Drops rows with no book name,
 * coerces the numeric columns, and folds duplicate book keys (shouldn't happen
 * with a PRIMARY KEY, but the model never trusts its input).
 */
export function normalizeBookReadingLog(
  rows:
    | ReadonlyArray<{
        book?: unknown;
        versesRead?: unknown;
        timeSpent?: unknown;
        lastReadAt?: unknown;
      }>
    | null
    | undefined,
): BookReadingEntry[] {
  const byBook = new Map<string, BookReadingEntry>();
  for (const row of rows ?? []) {
    const book = typeof row?.book === 'string' ? row.book.trim() : '';
    if (!book) continue;
    const versesRead = nonNeg(row?.versesRead);
    const timeSpent = nonNeg(row?.timeSpent);
    const lastReadAt = nonNeg(row?.lastReadAt);
    const prev = byBook.get(book);
    if (prev) {
      prev.versesRead += versesRead;
      prev.timeSpent += timeSpent;
      prev.lastReadAt = Math.max(prev.lastReadAt, lastReadAt);
    } else {
      byBook.set(book, {book, versesRead, timeSpent, lastReadAt});
    }
  }
  return [...byBook.values()];
}

/**
 * Rank entries by verses read (desc), tie-broken by time spent, then most
 * recent read, then book name (asc, stable). Returns a NEW sorted array and
 * never mutates the input. Entries with zero verses sink to the bottom.
 */
export function rankBookReading(
  entries: ReadonlyArray<BookReadingEntry>,
): BookReadingEntry[] {
  return [...(entries ?? [])].sort((a, b) => {
    if (b.versesRead !== a.versesRead) return b.versesRead - a.versesRead;
    if (b.timeSpent !== a.timeSpent) return b.timeSpent - a.timeSpent;
    if (b.lastReadAt !== a.lastReadAt) return b.lastReadAt - a.lastReadAt;
    return a.book.localeCompare(b.book);
  });
}

/**
 * The single most-read book by verses, or null when there is no real reading
 * data yet (empty log, or every entry has zero verses). Lets callers fall back
 * to the chapters-touched proxy for users who haven't read with this build.
 */
export function topBookReading(
  entries: ReadonlyArray<BookReadingEntry>,
): BookReadingEntry | null {
  const ranked = rankBookReading(entries);
  const top = ranked[0];
  if (!top || top.versesRead <= 0) return null;
  return top;
}
