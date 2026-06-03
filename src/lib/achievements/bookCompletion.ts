/**
 * 📚 bookCompletion — PURE detection of which Bible books the user has finished.
 *
 * Sprint 64. The whole book-completion achievement chain was dead: BOOKS-category
 * milestones (`first_book` … `books_66`) read `user_stats.total_books_completed`,
 * and the per-book SPECIAL badges (`psalms_complete` / `proverbs_complete` /
 * `gospels_complete`) keyed off `AchievementService.trackBookCompleted` — but
 * that method was NEVER called anywhere, so the counter stayed at 0 forever and
 * every one of those achievements was unreachable (Sprint 63 documented this as
 * blocked on "book-completion DETECTION").
 *
 * This module IS that detection. It needs no new tracking and no DB migration:
 * the per-book/chapter reading footprint already lives in the ReadingProgress
 * map (`{ [canonicalEnglishBook]: { [chapter]: percent } }`, AsyncStorage), and
 * the chapter COUNT of every book is in the static book table. A book is
 * "complete" once every one of its chapters has been read past a threshold.
 *
 * Pure + injectable (the chapter count is passed in via `getChapters`) so it is
 * unit-testable with no SQLite / React. The AchievementService backfills from
 * this on launch and the reader re-checks the current book as its progress
 * advances; both funnel into `syncBookCompletion`, which is idempotent.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/**
 * Minimum per-chapter scroll percentage (0–100) that counts a chapter as read.
 * The reader persists a high-watermark scroll percent per chapter; a chapter
 * that fits one screen auto-reports 100, a longer one needs scrolling near the
 * end. 90 means "you reached essentially the bottom" without demanding a pixel-
 * perfect 100 that a trailing margin can keep just out of reach.
 */
export const CHAPTER_COMPLETE_THRESHOLD = 90;

/** The four Gospels, by canonical English name — `gospels_complete` needs all. */
export const GOSPELS = ['Matthew', 'Mark', 'Luke', 'John'] as const;

/** Total number of books in the Protestant canon (BOOKS milestones cap here). */
export const TOTAL_BIBLE_BOOKS = 66;

/** A book's chapter → percent map (a single entry of the ReadingProgress map). */
export type ChapterProgress = Record<string | number, number>;

/** The whole ReadingProgress map: canonical English book → chapter → percent. */
export type BookProgressMap = Record<string, ChapterProgress>;

/** Looks up how many chapters a book has; returns undefined for unknown names. */
export type GetChapters = (book: string) => number | undefined;

/**
 * True when EVERY chapter `1..totalChapters` of a book has been read to at least
 * `threshold` percent. Defensive: a book with no/zero/NaN chapter count is never
 * complete (we can't know what "all chapters" means), and a missing or non-finite
 * per-chapter percent counts as not-yet-read.
 */
export function isBookComplete(
  chapters: ChapterProgress | null | undefined,
  totalChapters: number | null | undefined,
  threshold: number = CHAPTER_COMPLETE_THRESHOLD,
): boolean {
  if (
    typeof totalChapters !== 'number' ||
    !Number.isFinite(totalChapters) ||
    totalChapters <= 0
  ) {
    return false;
  }
  if (!chapters || typeof chapters !== 'object') return false;

  for (let chapter = 1; chapter <= totalChapters; chapter++) {
    const pct = chapters[chapter] ?? chapters[String(chapter)];
    if (typeof pct !== 'number' || !Number.isFinite(pct) || pct < threshold) {
      return false;
    }
  }
  return true;
}

/**
 * The canonical English names of every book the user has read to completion.
 *
 * Iterates the ReadingProgress map (whose keys are already canonical English,
 * via `canonicalizeProgressMap`), resolves each book's chapter count through the
 * injected `getChapters`, and keeps the ones that pass `isBookComplete`. Books
 * whose name doesn't resolve to a known chapter count are skipped (defensive).
 * Never throws on a malformed map.
 */
export function detectCompletedBooks(
  progress: BookProgressMap | null | undefined,
  getChapters: GetChapters,
  threshold: number = CHAPTER_COMPLETE_THRESHOLD,
): string[] {
  if (!progress || typeof progress !== 'object') return [];

  const completed: string[] = [];
  for (const [book, chapters] of Object.entries(progress)) {
    const total = getChapters(book);
    if (isBookComplete(chapters, total, threshold)) {
      completed.push(book);
    }
  }
  return completed;
}

/**
 * True when all four Gospels are present in the given set of completed books
 * (canonical English names). Drives the `gospels_complete` SPECIAL badge, which
 * the generic achievement loop can never reach. Accepts any iterable so a Set or
 * an array both work.
 */
export function gospelsComplete(completed: Iterable<string>): boolean {
  const set = completed instanceof Set ? completed : new Set(completed);
  return GOSPELS.every(gospel => set.has(gospel));
}
