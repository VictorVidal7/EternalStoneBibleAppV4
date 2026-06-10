/**
 * 📖 chapterProgress — pure summary of a book's per-chapter reading progress
 * (Sprint 73).
 *
 * The chapter-selection grid already paints a per-chapter completed/in-progress
 * badge from `getChapterProgress`. This rolls those same per-chapter values up
 * into a book-level summary so the screen can show "12 / 150 · 8%" and offer a
 * one-tap "Continue" into the first not-yet-finished chapter — elevating data
 * the app already tracks, no new storage.
 *
 * React-/RN-/DB-free (the per-chapter lookup is injected) so it unit-tests in
 * isolation, mirroring [[passageReference]] / [[chapterNavigation]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface ChapterProgressSummary {
  /** Total chapters in the book. */
  total: number;
  /** Chapters fully read (progress ≥ 100). */
  completed: number;
  /** Chapters touched but not finished (0 < progress < 100). */
  inProgress: number;
  /** Chapters with ANY progress (completed + inProgress). */
  read: number;
  /** Completed share of the book, rounded to a whole percent. */
  percentComplete: number;
  /**
   * The first chapter not yet fully read — the natural "continue" target. `null`
   * only when every chapter is complete (nothing left to continue to). A fresh
   * book returns 1.
   */
  nextUnreadChapter: number | null;
}

/**
 * Summarize a book's reading progress from its per-chapter percentages.
 *
 * @param totalChapters how many chapters the book has (≥ 0).
 * @param getProgress   maps a 1-based chapter number to its 0–100 progress.
 */
export function summarizeChapterProgress(
  totalChapters: number,
  getProgress: (chapter: number) => number,
): ChapterProgressSummary {
  let completed = 0;
  let inProgress = 0;
  let nextUnreadChapter: number | null = null;

  for (let chapter = 1; chapter <= totalChapters; chapter++) {
    const progress = getProgress(chapter);
    if (progress >= 100) {
      completed++;
    } else {
      if (progress > 0) inProgress++;
      if (nextUnreadChapter === null) nextUnreadChapter = chapter;
    }
  }

  const read = completed + inProgress;
  const percentComplete =
    totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;

  return {
    total: totalChapters,
    completed,
    inProgress,
    read,
    percentComplete,
    nextUnreadChapter,
  };
}

/**
 * Scroll offset that brings a target chapter's grid row into view (Sprint 74).
 *
 * The chapter grid lays cards out in fixed-size rows of `perRow`; opening a
 * big book (Salmos, 150 chapters) lands at the top even when the "Continue"
 * target sits 20 rows down. This returns the content offset for the target's
 * row minus `contextRows` rows of context above it, floored at 0 — so early
 * chapters (already visible) scroll nowhere and the result is always a valid
 * offset.
 *
 * @param chapter     1-based target chapter (e.g. `nextUnreadChapter`).
 * @param perRow      cards per grid row (> 0).
 * @param rowHeight   rendered row height in dp (> 0).
 * @param contextRows rows of context to keep above the target (default 1).
 */
export function gridScrollOffsetForChapter(
  chapter: number,
  perRow: number,
  rowHeight: number,
  contextRows: number = 1,
): number {
  if (chapter <= 0 || perRow <= 0 || rowHeight <= 0) return 0;
  const row = Math.floor((chapter - 1) / perRow);
  return Math.max(0, (row - contextRows) * rowHeight);
}
