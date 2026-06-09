/**
 * Sprint 72 — pure next-chapter resolution for continuous audio playback.
 * Sprint 73 — chapterLocationFromVerse / shouldFollowAudioChapter (immersive
 * cross-chapter following).
 */

import {
  nextChapterLocation,
  shouldAdvanceChapter,
  chapterLocationFromVerse,
  shouldFollowAudioChapter,
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

describe('chapterLocationFromVerse', () => {
  it('resolves a localized book name to its canonical id + chapter', () => {
    // Salmos is book id 19.
    expect(chapterLocationFromVerse({book: 'Salmos', chapter: 117})).toEqual({
      bookId: 19,
      chapter: 117,
    });
  });

  it('is language-agnostic (matches the English name too)', () => {
    expect(chapterLocationFromVerse({book: 'Psalms', chapter: 118})).toEqual({
      bookId: 19,
      chapter: 118,
    });
  });

  it('returns null for an unknown book or missing/zero fields', () => {
    expect(chapterLocationFromVerse({book: 'Nope', chapter: 1})).toBeNull();
    expect(
      chapterLocationFromVerse({book: 'Salmos', chapter: null}),
    ).toBeNull();
    expect(chapterLocationFromVerse({book: null, chapter: 3})).toBeNull();
    expect(chapterLocationFromVerse(undefined)).toBeNull();
    expect(chapterLocationFromVerse(null)).toBeNull();
  });
});

describe('shouldFollowAudioChapter', () => {
  const loc = (bookId: number, chapter: number) => ({bookId, chapter});

  it('follows when the engine holds exactly the NEXT chapter (continuous advance)', () => {
    // Salmos 117 → 118.
    expect(shouldFollowAudioChapter(loc(19, 117), loc(19, 118))).toBe(true);
  });

  it('follows across a book boundary (Génesis 50 → Éxodo 1)', () => {
    expect(shouldFollowAudioChapter(loc(1, 50), loc(2, 1))).toBe(true);
  });

  it('does NOT follow when both are on the same chapter', () => {
    expect(shouldFollowAudioChapter(loc(19, 117), loc(19, 117))).toBe(false);
  });

  it('does NOT follow an unrelated chapter (guards against floating-player hijack)', () => {
    // Engine holds John 3 while the immersive shows Salmos 117 — not the next.
    expect(shouldFollowAudioChapter(loc(19, 117), loc(43, 3))).toBe(false);
    // Engine is two chapters ahead — also not a single natural advance.
    expect(shouldFollowAudioChapter(loc(19, 117), loc(19, 119))).toBe(false);
    // Engine went backwards.
    expect(shouldFollowAudioChapter(loc(19, 118), loc(19, 117))).toBe(false);
  });

  it('does NOT follow when either location is null', () => {
    expect(shouldFollowAudioChapter(null, loc(19, 118))).toBe(false);
    expect(shouldFollowAudioChapter(loc(19, 117), null)).toBe(false);
    expect(shouldFollowAudioChapter(null, null)).toBe(false);
  });
});
