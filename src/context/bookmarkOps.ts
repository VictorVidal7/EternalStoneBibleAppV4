/**
 * Pure helpers for the bookmark list operations the BookmarksProvider
 * performs. Kept separate from the Provider so the rules (dedupe,
 * MRU order, rename semantics) have unit tests without needing to
 * mount the React tree or stub AsyncStorage.
 */

import type {Bookmark} from './BookmarksContext';

/**
 * Insert `candidate` at the head of `existing` and remove any prior
 * bookmark that points to the same exact verse. This is what keeps
 * re-bookmarking idempotent: the user gets one entry per (book,
 * chapter, verse) tuple with the most recent metadata.
 */
export function dedupeAndPrepend(
  existing: ReadonlyArray<Bookmark>,
  candidate: Bookmark,
): Bookmark[] {
  const filtered = existing.filter(
    b =>
      !(
        b.book === candidate.book &&
        b.chapter === candidate.chapter &&
        b.verse === candidate.verse
      ),
  );
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

export function isBookmarkedAt(
  list: ReadonlyArray<Bookmark>,
  book: string,
  chapter: number,
  verse: number,
): boolean {
  return list.some(
    b => b.book === book && b.chapter === chapter && b.verse === verse,
  );
}
