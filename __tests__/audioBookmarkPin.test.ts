/**
 * Sprint 78 — collapsed-bar long-press pin: the store round trip.
 *
 * The MiniAudioPlayer long-press composes the S77 pieces exactly like this:
 * read the stored pins, build a bookmark for the playing verse, add (dedupe
 * per verse) and persist. The pure model is pinned in audioBookmarks.test;
 * this locks the AsyncStorage round trip the handler relies on.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addAudioBookmark,
  createAudioBookmark,
} from '../src/features/audio/lib/audioBookmarks';
import {
  getAudioBookmarks,
  saveAudioBookmarks,
} from '../src/features/audio/lib/audioBookmarksStore';

const PLAYING = {book: 'Salmos', chapter: 118, verse: 2};

async function pinPlayingVerse(now: number): Promise<void> {
  const created = createAudioBookmark(PLAYING, now);
  expect(created).not.toBeNull();
  const stored = await getAudioBookmarks();
  await saveAudioBookmarks(addAudioBookmark(stored, created!));
}

describe('long-press pin round trip', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('pins the playing verse and persists it canonicalized', async () => {
    await pinPlayingVerse(1_000);
    const pins = await getAudioBookmarks();
    expect(pins).toHaveLength(1);
    // Canonical English book + numeric bookId survive the round trip.
    expect(pins[0].book).toBe('Psalms');
    expect(pins[0].bookId).toBe(19);
    expect(pins[0].chapter).toBe(118);
    expect(pins[0].verse).toBe(2);
  });

  it('re-pinning the same verse replaces instead of duplicating', async () => {
    await pinPlayingVerse(1_000);
    await pinPlayingVerse(2_000);
    const pins = await getAudioBookmarks();
    expect(pins).toHaveLength(1);
    expect(pins[0].createdAt).toBe(2_000);
  });

  it('keeps existing pins on other verses, newest first', async () => {
    const other = createAudioBookmark(
      {book: 'Juan', chapter: 3, verse: 16},
      500,
    )!;
    await saveAudioBookmarks(
      addAudioBookmark(await getAudioBookmarks(), other),
    );
    await pinPlayingVerse(1_000);
    const pins = await getAudioBookmarks();
    expect(pins.map(p => p.book)).toEqual(['Psalms', 'John']);
  });
});
