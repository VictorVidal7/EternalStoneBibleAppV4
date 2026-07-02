/**
 * 🧸 kidsQuiz — pure round-preparation for the per-story kids quiz.
 *
 * Each [[KidsStory]] carries exactly 3 multiple-choice questions with 3
 * authored options (i18n `t.kids.stories[id].quiz[qId].options`) and a
 * `correctIndex` into that authored order. The screen must not always show
 * the correct answer in the same position, so `prepareKidsQuiz` produces a
 * shuffled DISPLAY order per question — reusing the same Fisher-Yates
 * `shuffle` the prophetic quiz already uses, not a re-implementation.
 *
 * PURE (no React/RN, no DB, no AsyncStorage) so it's trivially testable.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {shuffle} from '@/features/study/propheticQuiz';
import type {KidsStory} from './kidsStories';

export interface PreparedKidsQuestion {
  /** Same id as the source [[KidsQuizQuestionSpec]] — also the i18n key. */
  id: string;
  /** A permutation of [0,1,2]: `order[i]` is the authored option index shown at display position `i`. */
  order: readonly number[];
  /** The display position (index into `order`) holding the correct answer. */
  correctPosition: number;
}

/**
 * Builds a shuffled round for a story's 3-question quiz. `rng` is injectable
 * (defaults to Math.random) so tests can assert a deterministic sequence.
 */
export function prepareKidsQuiz(
  story: KidsStory,
  rng: () => number = Math.random,
): PreparedKidsQuestion[] {
  return story.quiz.map(q => {
    const order = shuffle([0, 1, 2], rng);
    return {id: q.id, order, correctPosition: order.indexOf(q.correctIndex)};
  });
}
