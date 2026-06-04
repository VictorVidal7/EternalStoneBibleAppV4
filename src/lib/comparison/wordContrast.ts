/**
 * 🔤 wordContrast — PURE word-level translation contrast (Sprint 68).
 *
 * `analyzeComparison` already computes the words SHARED by every compared
 * version (`commonWords`) and the rest (`uniqueWords`), but the comparison
 * screen only rendered a numeric summary. This turns that analysis into an
 * inline visualization: each version's verse is split into render-ready tokens
 * with the DIVERGENT words (the ones not shared by all versions) flagged, so
 * the screen can restyle just those words and show, at a glance, exactly where
 * the translations differ — most useful for same-language pairs (KJV ↔ WEB).
 *
 * Kept pure (no React / SQLite) so the tokenizer + the membership math are
 * unit-tested in isolation, mirroring `imageTemplates.ts` / `collectionCard.ts`.
 * `normalizeWord` is the SINGLE source of truth shared with
 * `VersionComparison.analyzeComparison`, so a token's `commonWords` lookup
 * always lines up with how that set was built.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A render-ready span of a verse: a word (with its punctuation) or whitespace. */
export interface ContrastToken {
  /** The original substring, drawn verbatim. */
  text: string;
  /** False for a run of whitespace. */
  isWord: boolean;
  /** True when this word is NOT shared by every compared version. */
  divergent: boolean;
}

/**
 * Lower-case a word and strip the punctuation the comparison ignores. Shared
 * with `analyzeComparison` so the same token normalizes the same way on both
 * sides of the membership test (the repeated `"` in the original class is a
 * no-op — a character class de-duplicates — so this is behavior-identical).
 */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[.,;:!?¿¡()"]/g, '');
}

/**
 * Split a verse into tokens, flagging each word not present in `commonWords`
 * (the set of words shared by EVERY compared version). Whitespace runs are
 * preserved as their own non-divergent tokens so the caller re-renders the
 * verse verbatim, restyling only the divergent words.
 */
export function markDivergentWords(
  text: string,
  commonWords: Set<string>,
): ContrastToken[] {
  if (!text) return [];
  return text
    .split(/(\s+)/)
    .filter(part => part.length > 0)
    .map(part => {
      if (/^\s+$/.test(part)) {
        return {text: part, isWord: false, divergent: false};
      }
      const norm = normalizeWord(part);
      // A punctuation-only token (norm === '') is never "divergent".
      const divergent = norm.length > 0 && !commonWords.has(norm);
      return {text: part, isWord: true, divergent};
    });
}

/**
 * The set of words SHARED by every compared version's verse text — the
 * intersection of each version's normalized word set. This is the exact policy
 * `analyzeComparison` uses to build `ComparisonAnalysis.commonWords` (base ∩
 * every other version), extracted here so the SAME set can be computed
 * standalone per verse in multi-verse mode (where no full `analysis` exists)
 * and fed to `markDivergentWords`. Sharing this with `analyzeComparison` keeps
 * the single-verse and multi-verse highlights byte-identical.
 *
 * Empty input → empty set; a single version → all of its words (every word is
 * trivially "shared"), matching `analyzeComparison`'s base-only seed.
 */
export function commonWordsForVersions(texts: string[]): Set<string> {
  if (texts.length === 0) return new Set();
  const common = new Set(texts[0].split(/\s+/).map(normalizeWord));
  for (let i = 1; i < texts.length; i++) {
    const words = new Set(texts[i].split(/\s+/).map(normalizeWord));
    for (const word of common) {
      if (!words.has(word)) common.delete(word);
    }
  }
  return common;
}

/**
 * Whether every compared version shares one language — the case where a
 * word-level contrast is meaningful. Cross-language pairs (e.g. KJV vs RVR1960)
 * make virtually every word "divergent", so callers use this to default the
 * contrast off and hint the user. Empty/single inputs are treated as "not a
 * contrast" (false / true respectively).
 */
export function sameLanguage(languages: string[]): boolean {
  if (languages.length === 0) return false;
  return languages.every(l => l === languages[0]);
}

/** How many word tokens diverge — a quick count for a caller hint/badge. */
export function divergentWordCount(tokens: ContrastToken[]): number {
  return tokens.reduce((n, t) => (t.isWord && t.divergent ? n + 1 : n), 0);
}
