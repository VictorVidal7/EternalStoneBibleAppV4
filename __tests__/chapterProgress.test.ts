/**
 * Sprint 73 — pure book-level chapter-progress summary for the chapter picker.
 * Sprint 74 — gridScrollOffsetForChapter (auto-scroll to the Continue target).
 */

import {
  summarizeChapterProgress,
  gridScrollOffsetForChapter,
} from '../src/lib/reading/chapterProgress';

describe('summarizeChapterProgress', () => {
  it('counts completed / in-progress / read and the completion percent', () => {
    // 4 chapters: 1 done, 2 half, 3 done, 4 untouched.
    const progress: Record<number, number> = {1: 100, 2: 50, 3: 100, 4: 0};
    const s = summarizeChapterProgress(4, ch => progress[ch] ?? 0);
    expect(s.total).toBe(4);
    expect(s.completed).toBe(2);
    expect(s.inProgress).toBe(1);
    expect(s.read).toBe(3);
    expect(s.percentComplete).toBe(50); // 2/4
    expect(s.nextUnreadChapter).toBe(2); // first chapter < 100
  });

  it('returns chapter 1 as next-unread for a fresh (all-zero) book', () => {
    const s = summarizeChapterProgress(10, () => 0);
    expect(s.completed).toBe(0);
    expect(s.read).toBe(0);
    expect(s.percentComplete).toBe(0);
    expect(s.nextUnreadChapter).toBe(1);
  });

  it('returns null next-unread when every chapter is complete', () => {
    const s = summarizeChapterProgress(3, () => 100);
    expect(s.completed).toBe(3);
    expect(s.percentComplete).toBe(100);
    expect(s.nextUnreadChapter).toBeNull();
  });

  it('skips completed chapters to find the first incomplete one', () => {
    const progress: Record<number, number> = {1: 100, 2: 100, 3: 40, 4: 100};
    const s = summarizeChapterProgress(4, ch => progress[ch] ?? 0);
    expect(s.nextUnreadChapter).toBe(3);
    expect(s.inProgress).toBe(1);
  });

  it('handles a zero-chapter book without dividing by zero', () => {
    const s = summarizeChapterProgress(0, () => 0);
    expect(s.total).toBe(0);
    expect(s.percentComplete).toBe(0);
    expect(s.nextUnreadChapter).toBeNull();
  });
});

describe('gridScrollOffsetForChapter', () => {
  // The live grid: 5 cards per row.
  it('scrolls to the target row minus one row of context', () => {
    // Chapter 23 → row 4 (0-based); minus 1 context row → 3 rows down.
    expect(gridScrollOffsetForChapter(23, 5, 80)).toBe(240);
  });

  it('keeps early chapters at the top (no scroll)', () => {
    // Rows 0 and 1 resolve to offset 0 — already visible.
    expect(gridScrollOffsetForChapter(1, 5, 80)).toBe(0);
    expect(gridScrollOffsetForChapter(5, 5, 80)).toBe(0);
    expect(gridScrollOffsetForChapter(10, 5, 80)).toBe(0);
    // First chapter of row 2 is the first that scrolls.
    expect(gridScrollOffsetForChapter(11, 5, 80)).toBe(80);
  });

  it('honors a custom context-row count', () => {
    expect(gridScrollOffsetForChapter(23, 5, 80, 0)).toBe(320);
    expect(gridScrollOffsetForChapter(23, 5, 80, 2)).toBe(160);
  });

  it('is 0 for invalid geometry or chapter', () => {
    expect(gridScrollOffsetForChapter(0, 5, 80)).toBe(0);
    expect(gridScrollOffsetForChapter(-3, 5, 80)).toBe(0);
    expect(gridScrollOffsetForChapter(10, 0, 80)).toBe(0);
    expect(gridScrollOffsetForChapter(10, 5, 0)).toBe(0);
  });
});
