/**
 * 🔗 crossReferences — the async facade that unites the curated cross-reference
 * set with the broad bundled web (RUMBO #3).
 *
 * The curated `CROSS_REFERENCES` (~207 hand-picked verses) and the
 * [[studyConnections]] reverse index are SYNC + PURE. This thin async layer
 * fetches the broad web from SQLite (the `cross_references` table, populated
 * from the bundled asset on first run) and merges it UNDER the curated layer
 * via the pure [[crossRefSources]] helpers — so every verse now surfaces
 * connections, while the hand-picked parallels keep their priority and order.
 *
 * Defensive: if the DB read fails or the web isn't present, callers fall back
 * to exactly the curated behaviour (never throws, never empty where curated
 * had data).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {getCrossReferences} from '@/constants/cross-references';
import {
  getStudyConnections,
  canonicalRefKey,
  type StudyConnections,
  type RefKey,
} from './studyConnections';
import {mergeRefKeys, outRowsToKeys, inRowsToKeys} from './crossRefSources';

/**
 * All cross-references for a verse as canonical keys: the curated parallels
 * first, then the broad web's top-voted links, deduped and focus-dropped.
 */
export async function getMergedCrossReferences(
  book: string,
  chapter: number,
  verse: number,
): Promise<RefKey[]> {
  const curated = getCrossReferences(book, chapter, verse);
  const focus = canonicalRefKey(book, chapter, verse);
  const resolved = getBookByName(book);
  if (!resolved) return mergeRefKeys(curated, [], focus);
  try {
    const rows = await bibleDB.getCrossReferencesFromDb(
      resolved.id,
      chapter,
      verse,
    );
    return mergeRefKeys(curated, outRowsToKeys(rows), focus);
  } catch {
    return mergeRefKeys(curated, [], focus);
  }
}

/**
 * The two-way connection web for Study mode, broadened: outgoing = curated
 * parallels + the web's top links; incoming = curated "referenced by" + the
 * web's incoming links (queried via the to-columns), minus anything already
 * shown as outgoing so a mutual link appears once.
 */
export async function getMergedStudyConnections(
  book: string,
  chapter: number,
  verse: number,
): Promise<StudyConnections> {
  const curated = getStudyConnections(book, chapter, verse);
  const resolved = getBookByName(book);
  if (!resolved) return curated;

  let outRows: Awaited<ReturnType<typeof bibleDB.getCrossReferencesFromDb>> =
    [];
  let inRows: Awaited<ReturnType<typeof bibleDB.getReferencedByFromDb>> = [];
  try {
    [outRows, inRows] = await Promise.all([
      bibleDB.getCrossReferencesFromDb(resolved.id, chapter, verse),
      bibleDB.getReferencedByFromDb(resolved.id, chapter, verse),
    ]);
  } catch {
    return curated;
  }

  const references = mergeRefKeys(
    curated.references,
    outRowsToKeys(outRows),
    curated.focus,
  );
  const referenceSet = new Set<RefKey>(references);
  const referencedBy = mergeRefKeys(
    curated.referencedBy,
    inRowsToKeys(inRows),
    curated.focus,
  ).filter(key => !referenceSet.has(key));

  const union = new Set<RefKey>([...references, ...referencedBy]);
  return {
    focus: curated.focus,
    references,
    referencedBy,
    totalConnections: union.size,
  };
}
