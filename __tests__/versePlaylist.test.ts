/**
 * Sprint 79 — versePlaylist: the pure model behind "listen to your favorites /
 * a collection". Pins canonical ordering, cross-language dedupe, the honest
 * dropping of unresolvable/empty entries, and the queue-sheet up-next walker.
 */
import {
  buildVersePlaylist,
  playlistUpNext,
} from '../src/features/audio/lib/versePlaylist';
import type {AudioVerse} from '../src/features/audio/types/audio';

const v = (book: string, chapter: number, verse: number, text = 'palabra') => ({
  book,
  chapter,
  verse,
  text,
});

describe('buildVersePlaylist', () => {
  it('orders a mixed bag canonically (book id, chapter, verse)', () => {
    const playlist = buildVersePlaylist([
      v('Juan', 3, 16),
      v('Génesis', 1, 1),
      v('Salmos', 23, 1),
      v('Salmos', 23, 4),
      v('Salmos', 5, 8),
    ]);
    expect(playlist.map(p => `${p.book} ${p.chapter}:${p.verse}`)).toEqual([
      'Génesis 1:1',
      'Salmos 5:8',
      'Salmos 23:1',
      'Salmos 23:4',
      'Juan 3:16',
    ]);
  });

  it('dedupes the same verse across languages (canonical book id)', () => {
    const playlist = buildVersePlaylist([
      v('Psalms', 23, 1, 'The Lord is my shepherd'),
      v('Salmos', 23, 1, 'Jehová es mi pastor'),
    ]);
    expect(playlist).toHaveLength(1);
    // First occurrence wins (its text is what the engine will voice).
    expect(playlist[0].text).toBe('The Lord is my shepherd');
  });

  it('drops unknown books, empty texts and malformed references', () => {
    const playlist = buildVersePlaylist([
      v('Libro Inexistente', 1, 1),
      v('Juan', 3, 16, '   '),
      v('Juan', 0, 16),
      v('Juan', 3, -2),
      v('Juan', 3, 17),
    ]);
    expect(playlist).toHaveLength(1);
    expect(playlist[0].verse).toBe(17);
  });

  it('returns an empty playlist for empty input', () => {
    expect(buildVersePlaylist([])).toEqual([]);
  });
});

describe('playlistUpNext', () => {
  const verses: AudioVerse[] = [
    v('Génesis', 1, 1),
    v('Salmos', 23, 1),
    v('Salmos', 23, 4),
    v('Juan', 3, 16),
  ];

  it('returns the next entries after the current one, with engine indices', () => {
    const next = playlistUpNext(verses, 1, 5);
    expect(next.map(e => e.index)).toEqual([2, 3]);
    expect(next[0].verse.verse).toBe(4);
  });

  it('honours the limit', () => {
    expect(playlistUpNext(verses, 0, 2).map(e => e.index)).toEqual([1, 2]);
  });

  it('is empty at the end of the list and for a non-positive limit', () => {
    expect(playlistUpNext(verses, 3, 5)).toEqual([]);
    expect(playlistUpNext(verses, 1, 0)).toEqual([]);
  });

  it('peeks from the start for a negative current index', () => {
    expect(playlistUpNext(verses, -1, 2).map(e => e.index)).toEqual([0, 1]);
  });
});
