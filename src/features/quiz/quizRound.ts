/**
 * ✝️ quizRound — pure round-selection + option-shuffling for the "Quiz
 * bíblico" (T18). Mirrors two existing patterns rather than inventing a
 * third: [[propheticQuiz]]'s `pickQuizRound`/`shuffle` for round sampling
 * (reused directly, not reimplemented — same trick [[kidsQuiz]] already
 * uses), and [[kidsQuiz]]'s `prepareKidsQuiz` for per-question option
 * shuffling with correct-position tracking, generalized from a fixed 3
 * options to this bank's fixed 4.
 *
 * Pure module — no React/RN, so it's unit-tested in isolation.
 */

import {shuffle} from '../study/propheticQuiz';
import {QUIZ_BANK, type QuizCategory, type QuizQuestionSpec} from './quizBank';

/** How many questions make up one round. */
export const QUIZ_ROUND_SIZE = 8;

/** Every question in the bank has exactly this many options. */
export const QUIZ_OPTION_COUNT = 4;

/**
 * Picks `size` distinct questions for a round, preferring ones not in
 * `exclude` (so consecutive rounds in a session vary instead of repeating).
 * Falls back to the full bank once fewer than `size` entries remain unseen,
 * so a round is always fully sized. Pure; `rng` is injectable.
 *
 * When `category` is given (premium "mazos por libro", T18b), the bank is
 * filtered to that category FIRST — so exclude/shuffle/fallback and the
 * `Math.min(size, …)` sizing all operate within the deck (a deck smaller than
 * `size` yields a shorter round rather than borrowing from other categories).
 * Omitting `category` (or passing `undefined`) is byte-for-byte the original
 * behavior: the same QUIZ_BANK reference flows through the same steps.
 */
export function pickQuizRound(
  size: number = QUIZ_ROUND_SIZE,
  exclude: ReadonlySet<string> = new Set(),
  rng: () => number = Math.random,
  category?: QuizCategory,
): QuizQuestionSpec[] {
  const bank = category
    ? QUIZ_BANK.filter(q => q.category === category)
    : QUIZ_BANK;
  const n = Math.min(size, bank.length);
  const fresh = bank.filter(q => !exclude.has(q.id));
  const pool = fresh.length >= n ? fresh : bank;
  return shuffle(pool, rng).slice(0, n);
}

export interface PreparedQuizQuestion {
  id: string;
  spec: QuizQuestionSpec;
  /** A permutation of the authored option indices (0..QUIZ_OPTION_COUNT-1). */
  order: number[];
  /** Index WITHIN `order` that is the correct answer. */
  correctPosition: number;
}

/** Shuffles one question's 4 options, tracking where the correct one landed. */
export function prepareQuizQuestion(
  spec: QuizQuestionSpec,
  rng: () => number = Math.random,
): PreparedQuizQuestion {
  const order = shuffle(
    Array.from({length: QUIZ_OPTION_COUNT}, (_, i) => i),
    rng,
  );
  return {
    id: spec.id,
    spec,
    order,
    correctPosition: order.indexOf(spec.correctIndex),
  };
}

/** Prepares a full round (order preserved from `specs`, each shuffled independently). */
export function prepareQuizRound(
  specs: readonly QuizQuestionSpec[],
  rng: () => number = Math.random,
): PreparedQuizQuestion[] {
  return specs.map(spec => prepareQuizQuestion(spec, rng));
}
