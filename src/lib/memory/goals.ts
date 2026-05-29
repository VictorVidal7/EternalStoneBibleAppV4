/**
 * 🎯 MEMORY GOALS & STREAKS — pure goal / milestone logic (Sprint 47)
 *
 * The capstone of the memorization "Ola F": F.1 surfaced the current deck
 * state, F.2 the review history, F.3 the adaptive scheduler. This module
 * turns that history into a daily habit loop — a daily review goal, a streak,
 * and the milestone moments worth celebrating.
 *
 * It deliberately sits ON TOP of `history.ts`: the streak math
 * (currentStreak / longestStreak / activeDays) already lives there and is
 * derived from the synced review-event log, so a streak is cross-device for
 * free with no new dataset. This module reads the `HistorySummary` those
 * functions produce and adds only goal semantics + milestone detection.
 *
 * Pure and React-free (no AsyncStorage, no clock of its own — the caller
 * passes `now`), exactly like `srs.ts` / `insights.ts` / `history.ts`, so it
 * unit-tests deterministically. Persistence (the chosen goal, the set of
 * already-celebrated milestones) lives in `goalStore.ts`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {HistorySummary} from './history';

/** Reviews-per-day target a brand-new user starts with. */
export const DEFAULT_DAILY_GOAL = 10;
/** Smallest / largest goal the UI lets the user pick. */
export const MIN_DAILY_GOAL = 1;
export const MAX_DAILY_GOAL = 100;

/** Streak lengths (days) worth a celebration, ascending. */
export const STREAK_MILESTONES: readonly number[] = [
  3, 7, 14, 30, 60, 100, 180, 365,
];

/** Progress toward today's review goal. */
export interface GoalProgress {
  /** The (clamped) target reviews for today. */
  goal: number;
  /** Reviews already done today. */
  todayCount: number;
  /** max(0, goal - todayCount). */
  remaining: number;
  /** todayCount >= goal. */
  met: boolean;
  /** todayCount / goal, clamped to [0, 1]. */
  fraction: number;
}

/** A moment worth celebrating in-app (never a push — see Sprint 47 design). */
export interface MemoryMilestone {
  type: 'streak' | 'goal';
  /** Streak length, or the goal count for a goal milestone. */
  value: number;
  /** Stable de-dupe key persisted once celebrated. */
  key: string;
}

/** Coerce any persisted/typed-in value into a valid goal. */
export function clampGoal(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_DAILY_GOAL;
  return Math.min(MAX_DAILY_GOAL, Math.max(MIN_DAILY_GOAL, Math.round(n)));
}

/** Today's progress toward the daily review goal. */
export function computeGoalProgress(
  summary: HistorySummary,
  goal: number,
): GoalProgress {
  const g = clampGoal(goal);
  const todayCount = Math.max(0, summary.reviewsToday);
  const remaining = Math.max(0, g - todayCount);
  const met = todayCount >= g;
  const fraction = g > 0 ? Math.min(1, todayCount / g) : 0;
  return {goal: g, todayCount, remaining, met, fraction};
}

/** Local-time YYYY-MM-DD — the per-day de-dupe key for goal celebrations. */
export function localDayStamp(now: Date): string {
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Streak milestones the current streak has already reached, ascending. */
export function reachedStreakMilestones(currentStreak: number): number[] {
  return STREAK_MILESTONES.filter(m => currentStreak >= m);
}

/** The next milestone the user is working toward, or null past the top. */
export function nextStreakTarget(currentStreak: number): number | null {
  return STREAK_MILESTONES.find(m => m > currentStreak) ?? null;
}

/**
 * The single most significant milestone the user has achieved but not yet
 * celebrated, or null. Streak milestones outrank the daily goal (a 30-day
 * streak is a bigger deal than meeting today's goal), and within streaks the
 * HIGHEST uncelebrated threshold wins so we never re-celebrate small ones.
 */
export function pendingMilestone(
  summary: HistorySummary,
  goal: GoalProgress,
  now: Date,
  celebratedKeys: readonly string[],
): MemoryMilestone | null {
  const seen = new Set(celebratedKeys);
  const reached = reachedStreakMilestones(summary.currentStreak);
  for (let i = reached.length - 1; i >= 0; i--) {
    const value = reached[i];
    const key = `streak:${value}`;
    if (!seen.has(key)) return {type: 'streak', value, key};
  }
  if (goal.met) {
    const key = `goal:${localDayStamp(now)}`;
    if (!seen.has(key)) return {type: 'goal', value: goal.goal, key};
  }
  return null;
}

/**
 * Keys to persist as "celebrated" once `milestone` is shown. For a streak
 * milestone we also mark every LOWER reached threshold (you don't celebrate
 * passing 3 days after you're already at 30) so they never resurface.
 */
export function milestoneKeysToMark(
  milestone: MemoryMilestone,
  summary: HistorySummary,
): string[] {
  if (milestone.type === 'streak') {
    return reachedStreakMilestones(summary.currentStreak)
      .filter(v => v <= milestone.value)
      .map(v => `streak:${v}`);
  }
  return [milestone.key];
}
