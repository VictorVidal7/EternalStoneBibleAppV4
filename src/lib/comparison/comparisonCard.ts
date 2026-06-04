/**
 * 🖼️ comparisonCard — PURE model for the shareable "version comparison" image.
 *
 * Sprint 69. The VersionComparison screen could analyze + inline-highlight the
 * words that differ across translations, but there was no way to SHARE that
 * insight. This builds the render-ready model for a single designer card — the
 * verse reference, the similarity score, and each version's verse pre-tokenized
 * with its DIVERGENT words flagged — captured by `CompareImageModal` with the
 * Sprint 56 view-shot pipeline (`captureRef` → `expo-sharing`) over an
 * `imageTemplates` gradient.
 *
 * Reuses the SAME `commonWordsForVersions` + `markDivergentWords` as the screen
 * (single source of truth, see [[wordContrast]]), so the bold words on the
 * shared image match exactly what the user saw inline. Kept pure (no React /
 * SQLite) so the tokenization is unit-tested in isolation, mirroring
 * `collectionCard.ts` / `imageTemplates.ts`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {
  type ContrastToken,
  markDivergentWords,
  commonWordsForVersions,
} from './wordContrast';

/** Caller input: one version's abbreviation + its verse text. */
export interface ComparisonCardVersionInput {
  abbr: string;
  text: string;
}

/** One version on the card, pre-tokenized for inline divergent highlighting. */
export interface ComparisonCardVersion {
  abbr: string;
  /** Full verse text (the modal clamps it with numberOfLines). */
  text: string;
  /** Render-ready tokens with the divergent words flagged (over the FULL text). */
  tokens: ContrastToken[];
}

/** The render-ready comparison card model. */
export interface ComparisonCardModel {
  /** e.g. "John 3:16" — composed + localized by the screen. */
  reference: string;
  /** Jaccard similarity 0–100, from the screen's analysis. */
  similarity: number;
  /**
   * Whether the divergent highlights should be DRAWN — true for same-language
   * comparisons (the only case where word contrast is meaningful). The tokens
   * always carry the truth; the modal only bolds them when this is true.
   */
  highlight: boolean;
  versions: ComparisonCardVersion[];
}

/**
 * Build the card model: tokenize each version's verse against the words shared
 * by EVERY version (so the flagged words are the symmetric divergent set — the
 * same as the inline screen highlight). `highlight` is passed in by the caller
 * (the screen's same-language decision) and carried through to the modal.
 */
export function buildComparisonCard(
  reference: string,
  similarity: number,
  highlight: boolean,
  versions: ComparisonCardVersionInput[],
): ComparisonCardModel {
  const common = commonWordsForVersions(versions.map(v => v.text));
  return {
    reference,
    similarity,
    highlight,
    versions: versions.map(v => ({
      abbr: v.abbr,
      text: v.text,
      tokens: markDivergentWords(v.text, common),
    })),
  };
}
