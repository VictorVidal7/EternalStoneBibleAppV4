/**
 * Sprint 72 — pure next-chapter resolution for continuous audio playback.
 */

import {
  nextChapterLocation,
  shouldAdvanceChapter,
} from '../src/features/audio/lib/chapterNavigation';

describe('nextChapterLocation', () => {
  it('advances within a book', () => {
    // Génesis (id 1) has 50 chapters.
    expect(nextChapterLocation(1, 1)).toEqual({bookId: 1, chapter: 2});
    expect(nextChapterLocation(1, 49)).toEqual({bookId: 1, chapter: 50});
  });

  it('rolls over to the first chapter of the next book at a book boundary', () => {
    // Génesis 50 (last) → Éxodo (id 2) chapter 1.
    expect(nextChapterLocation(1, 50)).toEqual({bookId: 2, chapter: 1});
  });

  it('returns null at the very end of the canon (Apocalipsis 22)', () => {
    // Apocalipsis is id 66 with 22 chapters; there is no book 67.
    expect(nextChapterLocation(66, 22)).toBeNull();
  });

  it('returns null for an unknown book or a non-positive chapter', () => {
    expect(nextChapterLocation(999, 1)).toBeNull();
    expect(nextChapterLocation(1, 0)).toBeNull();
    expect(nextChapterLocation(1, -3)).toBeNull();
  });
});

describe('shouldAdvanceChapter', () => {
  it('advances when continuous is on and no end-of-chapter timer', () => {
    expect(shouldAdvanceChapter({autoAdvance: true, sleepMode: null})).toBe(
      true,
    );
    expect(shouldAdvanceChapter({autoAdvance: true, sleepMode: 'time'})).toBe(
      true,
    );
  });

  it('does not advance when continuous is off', () => {
    expect(shouldAdvanceChapter({autoAdvance: false, sleepMode: null})).toBe(
      false,
    );
  });

  it('does not advance when a sleep timer stops at the end of the chapter', () => {
    expect(
      shouldAdvanceChapter({autoAdvance: true, sleepMode: 'end-of-chapter'}),
    ).toBe(false);
  });
});
