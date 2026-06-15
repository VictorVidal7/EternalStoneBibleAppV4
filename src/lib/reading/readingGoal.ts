/**
 * 📖 READING GOAL — pure daily-verses goal logic (Sprint 85).
 *
 * The reading counterpart of the memorization daily goal ([[goals]]): a target
 * number of verses to read each day. It grades the "Leer" constancy ring —
 * instead of a binary "did you read today", the ring fills by
 * versesReadToday / goal and closes when the goal is met.
 *
 * Pure and React-free (no AsyncStorage, no clock — the caller passes the
 * already-counted verses), exactly like [[goals]].computeGoalProgress, so it
 * unit-tests deterministically. Persistence lives in [[readingGoalStore]]; the
 * goal is a DEVICE-LOCAL preference (the reading streak it complements is
 * already cross-device through the reading log).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Verses-per-day target a new reader starts with. */
export const DEFAULT_READING_GOAL = 10;
/** Smallest / largest goal the UI lets the reader pick. */
export const MIN_READING_GOAL = 1;
export const MAX_READING_GOAL = 100;

/** The chip options shown in the settings picker, ascending. */
export const READING_GOAL_OPTIONS: readonly number[] = [5, 10, 15, 20, 30, 50];

/** Progress toward today's reading goal — mirrors GoalProgress for memory. */
export interface ReadingGoalProgress {
  /** The (clamped) target verses for today. */
  goal: number;
  /** Verses already read today. */
  todayCount: number;
  /** max(0, goal - todayCount). */
  remaining: number;
  /** todayCount >= goal. */
  met: boolean;
  /** todayCount / goal, clamped to [0, 1]. */
  fraction: number;
}

/** Coerce any persisted/typed-in value into a valid goal. */
export function clampReadingGoal(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_READING_GOAL;
  return Math.min(MAX_READING_GOAL, Math.max(MIN_READING_GOAL, Math.round(n)));
}

/** Today's progress toward the daily reading goal. */
export function computeReadingGoalProgress(
  versesReadToday: number,
  goal: number,
): ReadingGoalProgress {
  const g = clampReadingGoal(goal);
  const todayCount =
    Number.isFinite(versesReadToday) && versesReadToday > 0
      ? Math.floor(versesReadToday)
      : 0;
  const remaining = Math.max(0, g - todayCount);
  const met = todayCount >= g;
  const fraction = g > 0 ? Math.min(1, todayCount / g) : 0;
  return {goal: g, todayCount, remaining, met, fraction};
}
