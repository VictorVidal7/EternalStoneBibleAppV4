/**
 * 🔗 crossRefSources — pure glue between the bundled cross-reference web (the
 * SQLite `cross_references` table, RUMBO #3) and the canonical
 * "EnglishBook/Chapter/Verse" key form the study stack speaks.
 *
 * DB rows are keyed by numeric book_id; the curated set + [[studyConnections]]
 * + `CROSS_REFERENCES` key by English book NAME. These helpers translate rows
 * into that key form and merge two ref lists with a clear priority order, so
 * the curated, hand-picked parallels always lead and the broad web fills in
 * underneath — deduped, focus-verse dropped. Kept PURE (no DB, no React) so the
 * async facade ([[crossReferences]]) stays a thin fetch-and-delegate layer and
 * the merge logic is unit-tested deterministically.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {getBookById} from '@/constants/bible';
import type {CrossRefOut, CrossRefIn} from '@lib/database';
import type {RefKey} from './studyConnections';

/** Canonical key for an OUTGOING row's target verse, or null if book unknown. */
export function outRowToKey(row: CrossRefOut): RefKey | null {
  const book = getBookById(row.to_book);
  if (!book) return null;
  return `${book.nameEn}/${row.to_chapter}/${row.to_verse}`;
}

/** Canonical key for an INCOMING row's source verse, or null if book unknown. */
export function inRowToKey(row: CrossRefIn): RefKey | null {
  const book = getBookById(row.from_book);
  if (!book) return null;
  return `${book.nameEn}/${row.from_chapter}/${row.from_verse}`;
}

/** Map outgoing rows → canonical keys (dropping any with an unknown book). */
export function outRowsToKeys(rows: readonly CrossRefOut[]): RefKey[] {
  const out: RefKey[] = [];
  for (const row of rows ?? []) {
    const key = outRowToKey(row);
    if (key) out.push(key);
  }
  return out;
}

/** Map incoming rows → canonical keys (dropping any with an unknown book). */
export function inRowsToKeys(rows: readonly CrossRefIn[]): RefKey[] {
  const out: RefKey[] = [];
  for (const row of rows ?? []) {
    const key = inRowToKey(row);
    if (key) out.push(key);
  }
  return out;
}

/**
 * Merge two ref-key lists: `primary` (the curated, higher-trust layer) leads,
 * then `secondary` (the broad web) fills in. Dedupes (first occurrence wins, so
 * a key curated AND in the web keeps the curated position), drops a key equal
 * to `focus`, and skips non-strings. Order within each layer is preserved.
 */
export function mergeRefKeys(
  primary: readonly string[],
  secondary: readonly string[],
  focus?: RefKey | null,
): RefKey[] {
  const seen = new Set<string>();
  const out: RefKey[] = [];
  for (const key of [...(primary ?? []), ...(secondary ?? [])]) {
    if (typeof key !== 'string' || key === focus || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}
