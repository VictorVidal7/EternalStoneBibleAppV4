/**
 * 🎨 HIGHLIGHT GALLERY — pure search + group-by-color (Sprint 86).
 *
 * Turns the flat highlights list into a gallery: a diacritic-insensitive text
 * search (reusing the same fold the Notes tab + verse search use) and a
 * group-by-color view (ordered by a fixed rainbow), plus a small per-color
 * distribution used by the share image. Pure (no React/SQLite), like
 * [[noteFilter]], so it unit-tests in isolation and the screen derives the
 * displayed rows via `useMemo` with no extra state to drift.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {HighlightColor} from './index';
import {matchesNoteQuery} from '@/lib/notes/noteFilter';

/**
 * The fixed display order for color groups — a calm rainbow (warm → cool) with
 * gray last. Any color not present is simply skipped.
 */
export const HIGHLIGHT_COLOR_ORDER: readonly HighlightColor[] = [
  HighlightColor.YELLOW,
  HighlightColor.ORANGE,
  HighlightColor.RED,
  HighlightColor.PINK,
  HighlightColor.PURPLE,
  HighlightColor.BLUE,
  HighlightColor.GREEN,
  HighlightColor.GRAY,
];

/** A color and the highlights that carry it, in input order. */
export interface HighlightColorGroup<T> {
  color: HighlightColor;
  count: number;
  items: T[];
}

/** A color + how many highlights use it (for the share distribution strip). */
export interface ColorTally {
  color: HighlightColor;
  count: number;
}

/** Total + per-color counts, ordered by {@link HIGHLIGHT_COLOR_ORDER}. */
export interface HighlightGalleryStats {
  total: number;
  byColor: ColorTally[];
}

/**
 * Filter `items` to those whose composed haystack matches `query` (every word,
 * substring, diacritic-insensitive). An empty query returns a copy of the whole
 * list. `haystackOf` builds the searchable text (reference + verse + note) so
 * this stays pure and the caller controls localization.
 */
export function searchHighlights<T>(
  items: readonly T[],
  query: string,
  haystackOf: (item: T) => string,
): T[] {
  if (query.trim().length === 0) return [...items];
  return items.filter(item => matchesNoteQuery(haystackOf(item), query));
}

/**
 * Group highlights by color in the fixed rainbow order, dropping colors with no
 * highlights. Item order WITHIN a group preserves the input order (the caller
 * sorts first — typically newest-first). Never mutates the input.
 */
export function groupHighlightsByColor<T extends {color: HighlightColor}>(
  items: readonly T[],
): HighlightColorGroup<T>[] {
  const byColor = new Map<HighlightColor, T[]>();
  for (const item of items) {
    const bucket = byColor.get(item.color);
    if (bucket) bucket.push(item);
    else byColor.set(item.color, [item]);
  }
  const groups: HighlightColorGroup<T>[] = [];
  for (const color of HIGHLIGHT_COLOR_ORDER) {
    const bucket = byColor.get(color);
    if (bucket && bucket.length > 0) {
      groups.push({color, count: bucket.length, items: bucket});
    }
  }
  return groups;
}

/** Total highlights + per-color counts, ordered (only present colors). */
export function highlightGalleryStats<T extends {color: HighlightColor}>(
  items: readonly T[],
): HighlightGalleryStats {
  const groups = groupHighlightsByColor(items);
  return {
    total: items.length,
    byColor: groups.map(g => ({color: g.color, count: g.count})),
  };
}
