/**
 * Sprint 77 — audioBookmarks: pure model for saved listening positions.
 * Locks parsing defensiveness, canonical storage, dedupe + cap, and the
 * cross-language verse lookup.
 */

import {
  addAudioBookmark,
  bookmarkAtVerse,
  createAudioBookmark,
  MAX_AUDIO_BOOKMARKS,
  parseAudioBookmarks,
  removeAudioBookmark,
  serializeAudioBookmarks,
  type AudioBookmark,
} from '../src/features/audio/lib/audioBookmarks';

const NOW = 1_700_000_000_000;

describe('createAudioBookmark', () => {
  it('canonicalizes the book name and resolves the bookId', () => {
    const bm = createAudioBookmark(
      {book: 'Salmos', chapter: 118, verse: 2},
      NOW,
    );
    expect(bm).toMatchObject({
      book: 'Psalms',
      bookId: 19,
      chapter: 118,
      verse: 2,
      createdAt: NOW,
    });
  });

  it('returns null for an unknown book', () => {
    expect(
      createAudioBookmark({book: 'Atlantis', chapter: 1, verse: 1}, NOW),
    ).toBeNull();
  });
});

describe('parse/serialize round trip', () => {
  it('survives a round trip and rejects garbage', () => {
    const bm = createAudioBookmark(
      {book: 'Psalms', chapter: 118, verse: 2},
      NOW,
    ) as AudioBookmark;
    expect(parseAudioBookmarks(serializeAudioBookmarks([bm]))).toEqual([bm]);
    expect(parseAudioBookmarks(null)).toEqual([]);
    expect(parseAudioBookmarks('not json')).toEqual([]);
    expect(parseAudioBookmarks('{"days":{}}')).toEqual([]);
    expect(parseAudioBookmarks('[{"id":1}]')).toEqual([]);
  });
});

describe('addAudioBookmark', () => {
  const at = (verse: number, createdAt: number) =>
    createAudioBookmark(
      {book: 'Psalms', chapter: 118, verse},
      createdAt,
    ) as AudioBookmark;

  it('prepends newest first and replaces a pin on the same verse', () => {
    const list = addAudioBookmark([at(2, NOW)], at(3, NOW + 1));
    expect(list.map(b => b.verse)).toEqual([3, 2]);

    const replaced = addAudioBookmark(list, at(2, NOW + 2));
    expect(replaced.map(b => b.verse)).toEqual([2, 3]);
    expect(replaced[0].createdAt).toBe(NOW + 2);
  });

  it('caps the list at MAX_AUDIO_BOOKMARKS, dropping the oldest', () => {
    let list: AudioBookmark[] = [];
    for (let v = 1; v <= MAX_AUDIO_BOOKMARKS + 2; v++) {
      list = addAudioBookmark(list, at(v, NOW + v));
    }
    expect(list).toHaveLength(MAX_AUDIO_BOOKMARKS);
    expect(list[0].verse).toBe(MAX_AUDIO_BOOKMARKS + 2);
    expect(list.some(b => b.verse === 1)).toBe(false);
  });
});

describe('bookmarkAtVerse / removeAudioBookmark', () => {
  const pin = createAudioBookmark(
    {book: 'Psalms', chapter: 118, verse: 2},
    NOW,
  ) as AudioBookmark;

  it('finds the pin across languages via the canonical name', () => {
    expect(
      bookmarkAtVerse([pin], {book: 'Salmos', chapter: 118, verse: 2})?.id,
    ).toBe(pin.id);
    expect(
      bookmarkAtVerse([pin], {book: 'Psalms', chapter: 118, verse: 3}),
    ).toBeUndefined();
  });

  it('removes by id', () => {
    expect(removeAudioBookmark([pin], pin.id)).toEqual([]);
    expect(removeAudioBookmark([pin], 'other')).toEqual([pin]);
  });
});
