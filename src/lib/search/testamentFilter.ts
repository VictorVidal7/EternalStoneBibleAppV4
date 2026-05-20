/**
 * Testament filter for search results.
 *
 * The stored book name on each verse reflects the Bible-version language
 * (Spanish for RVR1960, English for KJV). The old implementation lived
 * inside the search screen and used a hardcoded Spanish name allowlist
 * — that silently dropped most OT books whenever the active version was
 * KJV (Sprint 15 fix). Going through `getBookByName` makes the split
 * language-agnostic, and pulling it out of the screen makes it testable.
 */
import type {BibleVerse} from '../../types/bible';
import {getBookByName} from '../../constants/bible';

export type TestamentFilter = 'all' | 'old' | 'new';

export function applyTestamentFilter<T extends Pick<BibleVerse, 'book'>>(
  verses: readonly T[],
  filter: TestamentFilter,
): T[] {
  if (filter === 'all') return [...verses];

  const wantOld = filter === 'old';
  return verses.filter(v => {
    const info = getBookByName(v.book);
    // Unknown books fall into NT by default so they stay searchable
    // rather than vanishing silently when the testament filter is on.
    const isOld = info?.testament === 'old';
    return wantOld ? isOld : !isOld;
  });
}
