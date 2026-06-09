/**
 * 🔍 highlightMatches — PURE search-term highlighter for result snippets.
 *
 * Sprint 70. Lifted out of the search screen's inline `getHighlightedText`
 * (untested, screen-local) into a pure, unit-tested module — mirroring
 * [[testamentFilter]] which made the same move. It also UPGRADES the matcher to
 * be DIACRITIC-INSENSITIVE: searching "oracion" now highlights "oración",
 * "Espiritu" highlights "Espíritu", etc. — matching how the FTS search itself
 * folds accents — while the returned segments slice the ORIGINAL text so the
 * displayed words keep their accents.
 *
 * The matching runs over a length-PRESERVING fold (each UTF-16 unit folds to
 * exactly one unit: lower-cased + stripped of its combining diacritic), so the
 * match indices stay valid against the original `text` for slicing.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** One run of result text, flagged whether it matched the query. */
export interface HighlightSegment {
  text: string;
  highlight: boolean;
}

/** Fold a single UTF-16 unit: lower-case + drop its combining diacritic. */
function foldChar(ch: string): string {
  const base = ch.toLowerCase().normalize('NFD')[0];
  return base ?? ch.toLowerCase();
}

/** Length-preserving fold (1 unit → 1 unit) so indices map back to `text`. */
function fold(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) out += foldChar(s[i]);
  return out;
}

/**
 * Split `text` into highlighted / plain segments for every whitespace-separated
 * word of `query` (substring, diacritic-insensitive). Overlapping matches are
 * merged. Returns a single non-highlighted segment when the query is empty or
 * nothing matches, so the caller can always render the full text.
 */
export function highlightMatches(
  text: string,
  query: string,
): HighlightSegment[] {
  const words = fold(query)
    .split(/\s+/)
    .filter(w => w.length > 0);
  if (words.length === 0) return [{text, highlight: false}];

  const folded = fold(text);
  const matches: {start: number; end: number}[] = [];
  for (const word of words) {
    let index = 0;
    while ((index = folded.indexOf(word, index)) !== -1) {
      matches.push({start: index, end: index + word.length});
      index += word.length;
    }
  }
  if (matches.length === 0) return [{text, highlight: false}];

  // Merge overlapping / adjacent matches so a word found by two query terms is
  // not split into back-to-back highlighted spans.
  matches.sort((a, b) => a.start - b.start);
  const merged: {start: number; end: number}[] = [];
  for (const m of matches) {
    const last = merged[merged.length - 1];
    if (last && m.start <= last.end) {
      last.end = Math.max(last.end, m.end);
    } else {
      merged.push({...m});
    }
  }

  const parts: HighlightSegment[] = [];
  let lastIndex = 0;
  for (const m of merged) {
    if (m.start > lastIndex) {
      parts.push({text: text.slice(lastIndex, m.start), highlight: false});
    }
    parts.push({text: text.slice(m.start, m.end), highlight: true});
    lastIndex = m.end;
  }
  if (lastIndex < text.length) {
    parts.push({text: text.slice(lastIndex), highlight: false});
  }
  return parts;
}
