/**
 * 📎 prepRelevance — re-rank the preacher's OWN saved material by relevance
 * to a passage already selected in "Mesa de preparación".
 *
 * Two lists already exist, both 100% device-local and written by the
 * preacher themselves: the "Banco de ilustraciones" ([[prepIllustrations]])
 * and past preps ([[prepHistory]]'s `PrepHistoryEntry`, one per passage
 * they've prepped before). Both screens list them most-recently-updated
 * first, with no notion of "does this relate to the passage I'm working on
 * right now." This module answers exactly that, with plain deterministic
 * lookups over data the app already has — no AI, no network:
 *
 *   - illustrations have no passage/theme tag of their own, so relevance is
 *     scored by how many of the TARGET passage's theme keywords
 *     ([[prepThemeKeywords]]) appear in the illustration's own title/body;
 *   - past preps DO have a passage of their own (their `passageKey`), so
 *     relevance is scored PRIMARILY by how many curated theme ids that past
 *     passage shares with the target passage (both computed the same way,
 *     via `buildPrepTable`'s `themeIds`), with a keyword-hit count over the
 *     preacher's own written notes as a tiebreaker.
 *
 * Both functions ONLY reorder the array they're given — the returned
 * elements are the SAME objects (never cloned, never rewritten, no field
 * added or changed), so nothing here can ever synthesize new illustration
 * text or new note prose. See prepRelevance.test.ts's guardrail block for
 * the assertion that pins this (identity-preservation), mirroring
 * faithTestimony.test.ts's "never generates or fills in content" precedent.
 *
 * PURE (no React/RN, no AsyncStorage) — the screens still own reading the
 * illustration/notes stores and passing the loaded arrays in here.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {buildPrepTable} from './prepTable';
import type {PrepHistoryEntry} from './prepHistory';
import type {PrepIllustration} from './prepIllustrations';
import {
  countKeywordOccurrences,
  getKeywordsForThemes,
  normalizeThemeText,
} from './prepThemeKeywords';

/**
 * Re-rank the preacher's own saved illustrations by keyword relevance to a
 * passage's theme ids (most relevant first). Ties (including "no signal at
 * all", when `targetThemeIds` is empty or nothing matched) fall back to the
 * existing most-recently-updated-first convention, then original order —
 * so this is a no-op reorder, never a filter: every input item is present
 * in the output, unmutated.
 */
export function rankIllustrationsByRelevance(
  illustrations: readonly PrepIllustration[],
  targetThemeIds: readonly string[],
): PrepIllustration[] {
  const keywords = getKeywordsForThemes(targetThemeIds);
  const scored = illustrations.map((item, index) => ({
    item,
    index,
    score:
      keywords.length === 0
        ? 0
        : countKeywordOccurrences(
            normalizeThemeText(`${item.title} ${item.body}`),
            keywords,
          ),
  }));
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.item.updatedAt - a.item.updatedAt ||
      a.index - b.index,
  );
  return scored.map(entry => entry.item);
}

/** Weight given to each shared curated theme id — dwarfs the keyword tiebreak. */
const HISTORY_THEME_OVERLAP_WEIGHT = 1000;

/**
 * Re-rank past-prep history entries by relevance to a passage's theme ids:
 * primarily by how many curated themes the entry's OWN passage shares with
 * the target, with keyword hits in the preacher's own written notes
 * (`entry.searchableText`) as a tiebreaker. Same no-op-reorder guarantee as
 * [[rankIllustrationsByRelevance]] above.
 */
export function rankHistoryEntriesByRelevance(
  entries: readonly PrepHistoryEntry[],
  targetThemeIds: readonly string[],
): PrepHistoryEntry[] {
  const targetSet = new Set(targetThemeIds);
  const keywords = getKeywordsForThemes(targetThemeIds);

  const scored = entries.map((entry, index) => {
    let overlap = 0;
    if (targetSet.size > 0) {
      const table = buildPrepTable(
        entry.bookNameEn,
        entry.chapter,
        entry.startVerse,
        entry.endVerse,
      );
      overlap = table
        ? table.themeIds.filter(id => targetSet.has(id)).length
        : 0;
    }
    const keywordHits =
      keywords.length === 0
        ? 0
        : countKeywordOccurrences(
            normalizeThemeText(entry.searchableText),
            keywords,
          );
    return {
      entry,
      index,
      score: overlap * HISTORY_THEME_OVERLAP_WEIGHT + keywordHits,
    };
  });

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      b.entry.updatedAt - a.entry.updatedAt ||
      a.index - b.index,
  );
  return scored.map(entry => entry.entry);
}
