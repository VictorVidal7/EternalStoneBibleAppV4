/**
 * 🔎 noteFilter — PURE search + sort for the Notes tab (Sprint 72).
 *
 * The Notes tab was a bare list. This adds the two derivations it needs —
 * a diacritic-insensitive search and a sort order — kept pure (no React /
 * storage) so they are unit-tested in isolation and the screen can derive the
 * displayed list via `useMemo` with no extra state to drift, mirroring
 * [[testamentFilter]] / [[bookFilter]].
 *
 * Search reuses the length-preserving fold from [[highlightMatches]] so typing
 * "oracion" finds "oración" exactly as the verse search does. Sort is by recency
 * (default), oldest-first, or canonical book order — the metadata-dependent bits
 * (timestamp parsing, book rank) stay in caller-supplied accessors so this
 * module needs neither Date nor the book table.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {foldDiacritics} from '@/lib/search/highlightMatches';

export type NoteSortOrder = 'recent' | 'oldest' | 'book';

/**
 * Whether `haystack` contains EVERY whitespace-separated word of `query`
 * (substring, diacritic-insensitive). An empty/whitespace query matches
 * everything so the caller can always render the full list.
 */
export function matchesNoteQuery(haystack: string, query: string): boolean {
  const words = foldDiacritics(query)
    .split(/\s+/)
    .filter(w => w.length > 0);
  if (words.length === 0) return true;
  const folded = foldDiacritics(haystack);
  return words.every(w => folded.includes(w));
}

/**
 * Filter `notes` to those whose composed haystack matches `query`. `haystackOf`
 * builds the searchable text for a note (typically reference + verse text + note
 * body) — a callback so this stays pure and the caller controls localization
 * (the reference is shown in the UI language, not the stored book name).
 */
export function searchNotes<T>(
  notes: readonly T[],
  query: string,
  haystackOf: (note: T) => string,
): T[] {
  if (query.trim().length === 0) return [...notes];
  return notes.filter(note => matchesNoteQuery(haystackOf(note), query));
}

interface SortableNote {
  chapter: number;
  verse: number;
}

/**
 * Sort notes by the chosen order, returning a NEW array (never mutates input).
 * `updatedAtOf` returns a comparable timestamp (ms); `bookRankOf` the canonical
 * book position (e.g. its 1-based id). Both are callbacks so the module needs
 * neither Date parsing nor the book metadata table.
 *  - `recent` → most recently updated first
 *  - `oldest` → least recently updated first
 *  - `book`   → canonical book order, then chapter, then verse
 */
export function sortNotes<T extends SortableNote>(
  notes: readonly T[],
  order: NoteSortOrder,
  updatedAtOf: (note: T) => number,
  bookRankOf: (note: T) => number,
): T[] {
  const sorted = [...notes];
  sorted.sort((a, b) => {
    if (order === 'book') {
      return (
        bookRankOf(a) - bookRankOf(b) ||
        a.chapter - b.chapter ||
        a.verse - b.verse
      );
    }
    const diff = updatedAtOf(a) - updatedAtOf(b);
    return order === 'oldest' ? diff : -diff;
  });
  return sorted;
}
