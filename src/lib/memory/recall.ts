/**
 * ✍️ recall — pure active-recall transforms for "Memorize & write the Word".
 *
 * The memory practice screen layers richer recall modes on the mature SRS
 * (Leitner box + ease). These helpers shape a verse for each mode and judge a
 * typed answer — all PURE (no React / no DB) so they unit-test deterministically.
 *
 * - First-letter mode reuses the SRS {@link applyMask} at full level (every word
 *   collapsed to its first letter), so there is no separate masker to drift.
 * - Fill-the-blank mode blanks every other content word and the user types the
 *   missing ones; {@link normalizeAnswer} folds case/accents/punctuation so
 *   "Senor" matches "Señor," and a verse memorised by meaning still passes.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {applyMask} from './srs';

/** The full first-letter prompt for a verse (every word → its first letter). */
export function firstLetterPrompt(text: string): string {
  return applyMask(text, 4);
}

/** One token of a fill-the-blank layout (a literal word or a blank to type). */
export interface FillToken {
  /** The original word token, punctuation included (the answer, when blank). */
  text: string;
  /** Whether the user must type this word. */
  isBlank: boolean;
  /** Position among the blanks (0-based), or -1 when not a blank. */
  blankIndex: number;
}

export interface FillLayout {
  tokens: FillToken[];
  /** How many blanks the user must fill. */
  blankCount: number;
}

/**
 * Build a fill-the-blank layout: every other content word becomes a blank
 * (starting with the second), so a verse always keeps anchors. A one-word verse
 * yields no blank (nothing to anchor against). Pure + deterministic.
 */
export function buildFillLayout(text: string): FillLayout {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  // With only one word there is no anchor, so leave it unblanked.
  const blankable = words.length > 1;
  let blankIndex = 0;
  const tokens: FillToken[] = words.map((word, i) => {
    const isBlank = blankable && i % 2 === 1;
    return {
      text: word,
      isBlank,
      blankIndex: isBlank ? blankIndex++ : -1,
    };
  });
  return {tokens, blankCount: blankIndex};
}

/**
 * Fold a word to its comparable core: lowercased, accent-stripped, and reduced
 * to letters/digits — so case, diacritics and punctuation never fail a recall
 * the user actually got right.
 */
export function normalizeAnswer(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/** Whether a typed answer matches the expected word (normalised, non-empty). */
export function isBlankCorrect(typed: string, expected: string): boolean {
  const t = normalizeAnswer(typed);
  return t.length > 0 && t === normalizeAnswer(expected);
}

/** How many of the fill answers are correct (for the "n/m correct" prompt). */
export function fillScore(
  answers: readonly string[],
  expected: readonly string[],
): number {
  return expected.reduce(
    (n, word, i) => (isBlankCorrect(answers[i] ?? '', word) ? n + 1 : n),
    0,
  );
}
