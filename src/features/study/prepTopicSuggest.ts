/**
 * 💡 prepTopicSuggest — "I have a topic, not a passage yet" for "Mesa de
 * preparación".
 *
 * `buildPrepTable` ([[prepTable]]) needs a passage already picked; a
 * preacher often starts the other way round — a topic on the heart ("miedo",
 * "gracia", "perdón") with no reference chosen yet. This module bridges that
 * gap with plain, deterministic keyword matching against the EXISTING
 * "Explore by Theme" taxonomy ([[themes]], `BIBLE_THEMES`) — no AI, no
 * semantic/embedding model, no network call. See [[prepThemeKeywords]] for
 * the keyword index this matches against and exactly what is/isn't
 * hand-added on top of the shipped taxonomy.
 *
 * The ONLY thing this module can ever return is a `{ref, themeId}` pointer
 * into `BIBLE_THEMES.verseRefs` — a reference into data the app already
 * curates and shows elsewhere (the "Explore by Theme" screen, and the
 * "Temas del pasaje" help on this very screen). It never composes prose,
 * never drafts an outline, never invents a new verse association — see
 * prepTopicSuggest.test.ts's guardrail block, mirroring
 * faithTestimony.test.ts's "never generates or fills in content" precedent.
 *
 * PURE (no React/RN, no DB, no Date.now) — same discipline as [[prepTable]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {BIBLE_THEMES} from './themes';
import {
  getThemeKeywords,
  keywordTokenScore,
  tokenizeTopic,
} from './prepThemeKeywords';

/** One suggested passage for a typed topic — a pointer, never generated prose. */
export interface TopicPassageSuggestion {
  /** Canonical "Book/Chapter/Verse" ref, always a member of some `BIBLE_THEMES[].verseRefs`. */
  ref: string;
  /** Which curated theme this passage was surfaced from. */
  themeId: string;
}

/** Default cap on how many passages a single topic search returns. */
export const TOPIC_SUGGESTION_MAX = 5;

/** Sum, over every topic token, of that token's BEST keyword match for one theme. */
function scoreThemeForTopic(
  tokens: readonly string[],
  themeId: string,
): number {
  const keywords = getThemeKeywords(themeId);
  let score = 0;
  for (const token of tokens) {
    let best = 0;
    for (const keyword of keywords) {
      const s = keywordTokenScore(token, keyword);
      if (s > best) best = s;
    }
    score += best;
  }
  return score;
}

/**
 * Match a preacher-typed topic against the curated theme taxonomy and return
 * up to `max` candidate passages, drawn ONLY from `BIBLE_THEMES.verseRefs`
 * (never invented). Themes are ranked by total keyword score (ties broken by
 * catalog order, for determinism); within a theme, refs keep their curated
 * order. A ref shared by two matched themes is only returned once, under
 * whichever ranked-higher theme it was first reached from. Blank input or no
 * match at all returns an empty array — this never fabricates a result.
 */
export function suggestPassagesForTopic(
  topic: string,
  max: number = TOPIC_SUGGESTION_MAX,
): TopicPassageSuggestion[] {
  const tokens = tokenizeTopic(topic);
  if (tokens.length === 0) return [];

  const ranked = BIBLE_THEMES.map((theme, index) => ({
    theme,
    index,
    score: scoreThemeForTopic(tokens, theme.id),
  }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const seenRefs = new Set<string>();
  const results: TopicPassageSuggestion[] = [];
  for (const {theme} of ranked) {
    for (const ref of theme.verseRefs) {
      if (seenRefs.has(ref)) continue;
      seenRefs.add(ref);
      results.push({ref, themeId: theme.id});
      if (results.length >= max) return results;
    }
  }
  return results;
}
