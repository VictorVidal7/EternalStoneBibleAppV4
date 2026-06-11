/**
 * ♥ playingFavorite — PURE lookup of the favorite matching a playing verse
 * (Sprint 77).
 *
 * The expanded player's quick-favorite needs the EXISTING favorite row to
 * toggle off. Favorites may be keyed under either language's book name
 * ("Salmos" pre-S58, canonical "Psalms" after), and the audio engine carries
 * the version-language name — so the match goes through canonicalBookName on
 * BOTH sides, exactly like FavoritesContext.isFavorite. Kept pure + generic
 * so it is unit-testable without React.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {canonicalBookName} from '../../../constants/bible';

export interface FavoriteLike {
  book: string;
  chapter: number;
  verse: number;
}

export interface VerseLocation {
  book: string;
  chapter: number;
  verse: number;
}

/**
 * The first favorite for `verse`, matched on canonical book + chapter +
 * verse, or undefined when the verse isn't saved.
 */
export function matchingFavorite<T extends FavoriteLike>(
  favorites: T[],
  verse: VerseLocation,
): T | undefined {
  const canonical = canonicalBookName(verse.book);
  return favorites.find(
    f =>
      canonicalBookName(f.book) === canonical &&
      f.chapter === verse.chapter &&
      f.verse === verse.verse,
  );
}
