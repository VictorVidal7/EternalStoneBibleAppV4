/**
 * 🗓️ kidsPlan — the "Plan de 10 días" pacing model for Biblia para niños
 * (Item 4, Tanda 2).
 *
 * NOT new content: this reuses 100% of Tanda 1's ten stories, one per plan
 * day, in their existing canonical order ([[KIDS_STORY_ORDER]]). A "day" is
 * simply that day's story; a day counts as done once its story's quiz has
 * been completed (`storiesCompleted`, already tracked by [[kidsProgress]] —
 * no separate completedDays array to keep in sync).
 *
 * The pace calculation itself is reused as-is from the adult reading-plan
 * model ([[planPace]]) — it is fully generic over `duration` and
 * `completedDays`, with no chapter-specific coupling, so duplicating it here
 * would just be drift risk for no benefit.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {planPace} from '@/lib/reading/planPace';
import type {PlanPace} from '@/lib/reading/planPace';
import {KIDS_STORY_ORDER, type KidsStoryId} from './kidsStories';

export const KIDS_PLAN_DURATION = KIDS_STORY_ORDER.length;

/** The story assigned to a given plan day (1-based), or null if out of range. */
export function kidsPlanDayStory(day: number): KidsStoryId | null {
  return KIDS_STORY_ORDER[day - 1] ?? null;
}

/** The 1-based plan day a story occupies. */
export function kidsStoryPlanDay(storyId: KidsStoryId): number {
  return KIDS_STORY_ORDER.indexOf(storyId) + 1;
}

/** Completed story ids → their plan day numbers, in ascending order. */
export function kidsCompletedPlanDays(
  storiesCompleted: readonly string[],
): number[] {
  const done = new Set(storiesCompleted);
  const days: number[] = [];
  KIDS_STORY_ORDER.forEach((id, i) => {
    if (done.has(id)) days.push(i + 1);
  });
  return days;
}

/** Where the reader stands in the 10-day plan — see [[planPace]] for the policy. */
export function kidsPlanPace(
  planStartedAt: string | null,
  storiesCompleted: readonly string[],
  now: Date,
): PlanPace {
  return planPace({
    startedAt: planStartedAt,
    completedDays: kidsCompletedPlanDays(storiesCompleted),
    duration: KIDS_PLAN_DURATION,
    now,
  });
}
