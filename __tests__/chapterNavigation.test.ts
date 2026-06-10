/**
 * Sprint 72 — pure next-chapter resolution for continuous audio playback.
 * Sprint 73 — chapterLocationFromVerse / shouldFollowAudioChapter (immersive
 * cross-chapter following).
 * Sprint 74 — sameChapterLocation / shouldReaderFollowAudio (the NORMAL reader
 * navigating along with continuous playback).
 */

import {
  nextChapterLocation,
  shouldAdvanceChapter,
  chapterLocationFromVerse,
  shouldFollowAudioChapter,
  nextChapterTitle,
  sameChapterLocation,
  shouldReaderFollowAudio,
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

describe('nextChapterTitle', () => {
  it('localizes the next chapter title (es/en)', () => {
    expect(nextChapterTitle({book: 'Salmos', chapter: 118}, 'es')).toBe(
      'Salmos 119',
    );
    expect(nextChapterTitle({book: 'Salmos', chapter: 118}, 'en')).toBe(
      'Psalms 119',
    );
  });

  it('rolls over a book boundary (Génesis 50 → Éxodo 1)', () => {
    expect(nextChapterTitle({book: 'Génesis', chapter: 50}, 'es')).toBe(
      'Éxodo 1',
    );
    expect(nextChapterTitle({book: 'Genesis', chapter: 50}, 'en')).toBe(
      'Exodus 1',
    );
  });

  it('returns null at the end of the canon and for unknown input', () => {
    // Apocalipsis 22 is the last chapter.
    expect(
      nextChapterTitle({book: 'Apocalipsis', chapter: 22}, 'es'),
    ).toBeNull();
    expect(nextChapterTitle({book: 'Nope', chapter: 1}, 'en')).toBeNull();
    expect(nextChapterTitle(undefined, 'es')).toBeNull();
  });
});

describe('sameChapterLocation', () => {
  it('matches only identical locations and never null', () => {
    expect(
      sameChapterLocation(
        {bookId: 19, chapter: 117},
        {bookId: 19, chapter: 117},
      ),
    ).toBe(true);
    expect(
      sameChapterLocation(
        {bookId: 19, chapter: 117},
        {bookId: 19, chapter: 118},
      ),
    ).toBe(false);
    expect(
      sameChapterLocation(
        {bookId: 19, chapter: 117},
        {bookId: 20, chapter: 117},
      ),
    ).toBe(false);
    expect(sameChapterLocation(null, {bookId: 19, chapter: 117})).toBe(false);
    expect(sameChapterLocation({bookId: 19, chapter: 117}, null)).toBe(false);
    expect(sameChapterLocation(null, null)).toBe(false);
  });
});

describe('shouldReaderFollowAudio', () => {
  const salmos117 = {bookId: 19, chapter: 117};
  const salmos118 = {bookId: 19, chapter: 118};
  // The happy path: reader synced on 117, engine auto-advanced to 118.
  const followBase = {
    enabled: true,
    focused: true,
    immersiveOpen: false,
    displayed: salmos117,
    engine: salmos118,
    syncedWith: salmos117,
  };

  it('follows a natural advance when enabled, focused, synced, no immersive', () => {
    expect(shouldReaderFollowAudio(followBase)).toBe(true);
  });

  it('follows across a book boundary (Génesis 50 → Éxodo 1)', () => {
    expect(
      shouldReaderFollowAudio({
        ...followBase,
        displayed: {bookId: 1, chapter: 50},
        engine: {bookId: 2, chapter: 1},
        syncedWith: {bookId: 1, chapter: 50},
      }),
    ).toBe(true);
  });

  it('never follows when the opt-in toggle is off', () => {
    expect(shouldReaderFollowAudio({...followBase, enabled: false})).toBe(
      false,
    );
  });

  it('never follows while the reader screen is not focused', () => {
    expect(shouldReaderFollowAudio({...followBase, focused: false})).toBe(
      false,
    );
  });

  it('never follows while the immersive overlay is open (it follows on its own)', () => {
    expect(shouldReaderFollowAudio({...followBase, immersiveOpen: true})).toBe(
      false,
    );
  });

  it('does NOT follow after a manual jump — the displayed chapter left the synced one', () => {
    // User navigated to Salmos 117 manually while the engine played elsewhere:
    // engine is exactly next of displayed, but the reader never synced on 117.
    expect(
      shouldReaderFollowAudio({
        ...followBase,
        syncedWith: {bookId: 19, chapter: 50},
      }),
    ).toBe(false);
    expect(shouldReaderFollowAudio({...followBase, syncedWith: null})).toBe(
      false,
    );
  });

  it('does NOT follow an unrelated engine chapter (floating-player hijack guard)', () => {
    expect(
      shouldReaderFollowAudio({
        ...followBase,
        engine: {bookId: 43, chapter: 3},
        syncedWith: salmos117,
      }),
    ).toBe(false);
  });

  it('is idle when already on the engine chapter (no feedback loop after a follow)', () => {
    expect(
      shouldReaderFollowAudio({
        ...followBase,
        displayed: salmos118,
        engine: salmos118,
        syncedWith: salmos118,
      }),
    ).toBe(false);
  });
});
