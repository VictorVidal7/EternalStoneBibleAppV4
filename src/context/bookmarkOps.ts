/**
 * Pure helpers for the bookmark list operations the BookmarksProvider
 * performs. Kept separate from the Provider so the rules (dedupe,
 * MRU order, rename semantics) have unit tests without needing to
 * mount the React tree or stub AsyncStorage.
 */

import {canonicalBookName} from '../constants/bible';
import type {Bookmark} from './BookmarksContext';

/**
 * The bookmark(s) in `existing` that `candidate` would replace — i.e. same
 * canonical verse (book/chapter/verse), a different id. The dedupe
 * invariant normally keeps at most one entry per verse, so this is usually
 * a single-element (or empty) array, but it returns an array defensively
 * in case local storage ever holds a stray duplicate.
 *
 * Callers use this to know which Firestore doc(s) must be explicitly
 * deleted when a bookmark is superseded: `dedupeAndPrepend` drops the old
 * entry locally and the new one gets a brand-new random id, so without an
 * explicit delete the old doc would keep living in Firestore forever (see
 * BookmarksContext.addBookmark).
 */
export function findSuperseded(
  existing: ReadonlyArray<Bookmark>,
  candidate: Bookmark,
): Bookmark[] {
  const candidateBook = canonicalBookName(candidate.book);
  return existing.filter(
    b =>
      canonicalBookName(b.book) === candidateBook &&
      b.chapter === candidate.chapter &&
      b.verse === candidate.verse,
  );
}

/**
 * Insert `candidate` at the head of `existing` and remove any prior
 * bookmark that points to the same exact verse. This is what keeps
 * re-bookmarking idempotent: the user gets one entry per (book,
 * chapter, verse) tuple with the most recent metadata.
 *
 * Compares on the canonical book identity (see canonicalBookName) so a
 * verse bookmarked while reading a Spanish version ("Juan") and later
 * while reading an English version ("John") collapse to the same entry,
 * same as favorites / highlights / notes / audio bookmarks (Sprint 58
 * bug class).
 *
 * Built on top of `findSuperseded` so the two can never disagree about
 * which entries get replaced.
 */
export function dedupeAndPrepend(
  existing: ReadonlyArray<Bookmark>,
  candidate: Bookmark,
): Bookmark[] {
  const supersededIds = new Set(
    findSuperseded(existing, candidate).map(b => b.id),
  );
  const filtered = existing.filter(b => !supersededIds.has(b.id));
  return [candidate, ...filtered];
}

export function removeById(
  list: ReadonlyArray<Bookmark>,
  id: string,
): Bookmark[] {
  return list.filter(b => b.id !== id);
}

export function renameById(
  list: ReadonlyArray<Bookmark>,
  id: string,
  label: string,
): Bookmark[] {
  return list.map(b => (b.id === id ? {...b, label} : b));
}

/**
 * Membership check for (book, chapter, verse). Canonicalizes both the
 * incoming `book` and each stored bookmark's `book` so the same verse is
 * recognized regardless of which version-language name it arrives with
 * (mirrors FavoritesContext.isFavorite).
 */
export function isBookmarkedAt(
  list: ReadonlyArray<Bookmark>,
  book: string,
  chapter: number,
  verse: number,
): boolean {
  const canonical = canonicalBookName(book);
  return list.some(
    b =>
      canonicalBookName(b.book) === canonical &&
      b.chapter === chapter &&
      b.verse === verse,
  );
}
