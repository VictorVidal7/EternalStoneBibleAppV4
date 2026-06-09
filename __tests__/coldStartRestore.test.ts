/**
 * Sprint 53 — cold-start player restore resolver.
 *
 * Pure, dependency-injected: every external (premium flag, saved position,
 * book-id lookup, chapter loading) is passed in, so the eligibility logic is
 * unit-tested without React/AsyncStorage/SQLite. Mirror of scrubMath /
 * playbackPosition / immersiveAudio test discipline.
 */

import {resolveColdStartRestore} from '../src/features/audio/lib/coldStartRestore';
import {
  PlaybackPosition,
  RESUME_MAX_AGE_MS,
} from '../src/features/audio/lib/playbackPosition';
import type {VerseLike} from '../src/features/audio/lib/immersiveAudio';

const NOW = 1_700_000_000_000;

const savedPosition: PlaybackPosition = {
  book: 'Génesis', // RVR1960 stores Spanish names — matched by id, not string.
  chapter: 1,
  verseIndex: 15, // resume at the 16th verse
  verse: 16,
  totalVerses: 31,
  updatedAt: NOW - 60_000, // a minute ago → fresh
};

/** Build a contiguous chapter of `n` BibleVerse-like rows. */
function makeChapter(n: number, book = 'Génesis', chapter = 1): VerseLike[] {
  return Array.from({length: n}, (_, i) => ({
    book,
    chapter,
    verse: i + 1,
    text: `verse ${i + 1}`,
  }));
}

interface Overrides {
  isPremium?: boolean;
  now?: number;
  position?: PlaybackPosition | null;
  bookId?: number | null;
  chapter?: VerseLike[];
  getChapter?: (
    bookId: number,
    chapter: number,
  ) => Promise<readonly VerseLike[]>;
}

function deps(over: Overrides = {}) {
  const {
    isPremium = true,
    now = NOW,
    position = savedPosition,
    bookId = 1,
    chapter = makeChapter(31),
    getChapter = async () => chapter,
  } = over;
  return {
    isPremium,
    now,
    getLastPosition: async () => position,
    resolveBookId: (_book: string) => bookId,
    getChapter,
  };
}

describe('resolveColdStartRestore', () => {
  it('restores the saved chapter at the saved index for a premium user', async () => {
    const target = await resolveColdStartRestore(deps());
    expect(target).not.toBeNull();
    expect(target?.index).toBe(15);
    expect(target?.verses).toHaveLength(31);
    // Mapped to AudioVerse shape (text coerced to string).
    expect(target?.verses[15]).toEqual({
      book: 'Génesis',
      chapter: 1,
      verse: 16,
      text: 'verse 16',
    });
  });

  it('returns null for a free (non-premium) user', async () => {
    expect(await resolveColdStartRestore(deps({isPremium: false}))).toBeNull();
  });

  it('returns null when there is no saved position', async () => {
    expect(await resolveColdStartRestore(deps({position: null}))).toBeNull();
  });

  it('returns null for a stale position (older than the resume window)', async () => {
    const stale = {...savedPosition, updatedAt: NOW - RESUME_MAX_AGE_MS - 1};
    expect(await resolveColdStartRestore(deps({position: stale}))).toBeNull();
  });

  it('returns null when the saved index is the first verse (nothing to resume)', async () => {
    const atStart = {...savedPosition, verseIndex: 0, verse: 1};
    expect(await resolveColdStartRestore(deps({position: atStart}))).toBeNull();
  });

  it('returns null when the saved book is unknown', async () => {
    expect(await resolveColdStartRestore(deps({bookId: null}))).toBeNull();
  });

  it('returns null when the chapter loads empty (e.g. missing in the current version)', async () => {
    expect(await resolveColdStartRestore(deps({chapter: []}))).toBeNull();
  });

  it('returns null when chapter loading throws', async () => {
    const target = await resolveColdStartRestore(
      deps({
        getChapter: async () => {
          throw new Error('db down');
        },
      }),
    );
    expect(target).toBeNull();
  });

  it('re-clamps the index to a shorter chapter in the current version', async () => {
    // Saved at index 15, but the current version's Genesis 1 has only 10 verses.
    const target = await resolveColdStartRestore(
      deps({chapter: makeChapter(10)}),
    );
    expect(target?.verses).toHaveLength(10);
    expect(target?.index).toBe(9); // clamped to last verse
  });

  // ── Continuity with S72 continuous playback (S73 regression lock) ──
  // The position-save effect is chapter-agnostic: when continuous playback
  // auto-advances (S72), the LAST saved position is simply the chapter it rolled
  // INTO. So a cold-start restore (S53) resumes the auto-advanced chapter with no
  // special handling — these lock that integration so neither side can regress.
  it('restores the chapter continuous playback auto-advanced INTO (same book)', async () => {
    // Was listening to Salmos 117, continuous rolled into 118; killed at 118:6.
    const advanced: PlaybackPosition = {
      book: 'Salmos',
      chapter: 118,
      verseIndex: 5,
      verse: 6,
      totalVerses: 29,
      updatedAt: NOW - 30_000,
    };
    const target = await resolveColdStartRestore(
      deps({
        position: advanced,
        bookId: 19,
        getChapter: async (_id, ch) => makeChapter(29, 'Salmos', ch),
      }),
    );
    expect(target?.index).toBe(5);
    expect(target?.verses[5]).toEqual({
      book: 'Salmos',
      chapter: 118,
      verse: 6,
      text: 'verse 6',
    });
  });

  it('restores across a book boundary continuous playback crossed (Génesis 50 → Éxodo 1)', async () => {
    const advanced: PlaybackPosition = {
      book: 'Éxodo',
      chapter: 1,
      verseIndex: 3,
      verse: 4,
      totalVerses: 22,
      updatedAt: NOW - 30_000,
    };
    const target = await resolveColdStartRestore(
      deps({
        position: advanced,
        bookId: 2,
        getChapter: async (_id, ch) => makeChapter(22, 'Éxodo', ch),
      }),
    );
    expect(target?.index).toBe(3);
    expect(target?.verses[0].book).toBe('Éxodo');
  });
});
