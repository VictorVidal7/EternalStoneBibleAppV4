/**
 * Sprint 77 — playingFavorite: pure favorite lookup for the expanded player's
 * ♥ quick-favorite. Locks the canonical cross-language book match.
 */

import {matchingFavorite} from '../src/features/audio/lib/playingFavorite';

const favorites = [
  {id: 'a', book: 'Psalms', chapter: 118, verse: 2},
  {id: 'b', book: 'Génesis', chapter: 1, verse: 1},
];

describe('matchingFavorite', () => {
  it('matches a favorite stored under the same name', () => {
    expect(
      matchingFavorite(favorites, {book: 'Psalms', chapter: 118, verse: 2})?.id,
    ).toBe('a');
  });

  it('matches across languages through the canonical book name', () => {
    // Audio carries the version-language name; the favorite may be canonical.
    expect(
      matchingFavorite(favorites, {book: 'Salmos', chapter: 118, verse: 2})?.id,
    ).toBe('a');
    expect(
      matchingFavorite(favorites, {book: 'Genesis', chapter: 1, verse: 1})?.id,
    ).toBe('b');
  });

  it('requires the exact chapter and verse', () => {
    expect(
      matchingFavorite(favorites, {book: 'Psalms', chapter: 118, verse: 3}),
    ).toBeUndefined();
    expect(
      matchingFavorite(favorites, {book: 'Psalms', chapter: 119, verse: 2}),
    ).toBeUndefined();
  });

  it('returns undefined on an empty list', () => {
    expect(
      matchingFavorite([], {book: 'Psalms', chapter: 118, verse: 2}),
    ).toBeUndefined();
  });
});
