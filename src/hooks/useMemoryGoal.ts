/**
 * 🎯 useMemoryGoal — the memorization habit-loop state (Sprint 47).
 *
 * Loads the review-event log (the synced 6th dataset) + the device-local
 * daily goal + the celebrated-milestone set, and derives:
 *   - `history`  — heatmap / retention / streaks (pure `computeReviewHistory`),
 *   - `goal`     — today's progress toward the daily review goal,
 *   - `milestone`— the next uncelebrated milestone to celebrate, if any.
 *
 * Reloads on screen focus (via `useFocusEffect`) so returning from a practice
 * session immediately reflects the new reviews — the streak ticks up, the goal
 * fills in, and a freshly-earned milestone surfaces.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useMemo, useState} from 'react';
import {useFocusEffect} from 'expo-router';
import {
  computeReviewHistoryWithFloor,
  type ReviewHistory,
} from '@lib/memory/history';
import {getAllReviewEvents} from '@lib/memory/reviewEventStore';
import {getMemoryStatsFloor} from '@lib/memory/memoryStatsSync';
import type {ReviewEvent} from '@lib/memory/reviewEvents';
import type {MemoryCard} from '@lib/memory/srs';
import type {MemoryStatsSummary} from '@lib/memory/memoryStats';
import {
  clampGoal,
  computeGoalProgress,
  DEFAULT_DAILY_GOAL,
  milestoneKeysToMark,
  pendingMilestone,
  type GoalProgress,
  type MemoryMilestone,
} from '@lib/memory/goals';
import {
  addCelebratedMilestones,
  getCelebratedMilestones,
  getDailyGoal,
  setDailyGoal as persistDailyGoal,
} from '@lib/memory/goalStore';

export interface MemoryGoalState {
  /** True once the first load has completed. */
  loaded: boolean;
  /** The raw review-event log — lets callers derive their own extra views
   *  (e.g. T8.1's per-book breakdown / trend / full-history heatmap)
   *  without this hook needing to know about every possible slice. */
  events: ReviewEvent[];
  /** Heatmap / retention / streaks / leeches over the review log. */
  history: ReviewHistory;
  /** Today's progress toward the daily review goal. */
  goal: GoalProgress;
  /** The next milestone to celebrate (in-app), or null. */
  milestone: MemoryMilestone | null;
  /** Persist a new daily goal and re-derive progress. */
  setGoal: (goal: number) => Promise<void>;
  /** Mark the current milestone celebrated so it never re-fires. */
  dismissMilestone: () => void;
}

/**
 * @param cards optional deck snapshot — lets `findLeeches` keep surfacing a
 *   struggling verse from `lapseCount`/`reviewCount` on a freshly-restored
 *   device (the deck fully cross-device syncs; the review log doesn't).
 */
export function useMemoryGoal(cards?: MemoryCard[]): MemoryGoalState {
  const [events, setEvents] = useState<ReviewEvent[]>([]);
  const [floor, setFloor] = useState<MemoryStatsSummary | null>(null);
  const [goalValue, setGoalValue] = useState<number>(DEFAULT_DAILY_GOAL);
  const [celebrated, setCelebrated] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Re-captured on every (re)load so "today" stays current across days.
  const [now, setNow] = useState<Date>(() => new Date());

  // Reload everything whenever the screen regains focus — returning from a
  // practice session should immediately reflect the new reviews.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const [ev, fl, g, c] = await Promise.all([
          getAllReviewEvents(),
          // Local-first quota feature — the restore floor keeps streak /
          // heatmap / retention alive on a fresh device until real local
          // reviews accumulate. Null on a device that owns the full history.
          getMemoryStatsFloor(),
          getDailyGoal(),
          getCelebratedMilestones(),
        ]);
        if (!active) return;
        setEvents(ev);
        setFloor(fl);
        setGoalValue(g);
        setCelebrated(c);
        setNow(new Date());
        setLoaded(true);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const history = useMemo(
    () => computeReviewHistoryWithFloor(events, now, floor, cards),
    [events, now, floor, cards],
  );
  const goal = useMemo(
    () => computeGoalProgress(history.summary, goalValue),
    [history.summary, goalValue],
  );
  const milestone = useMemo(
    () => pendingMilestone(history.summary, goal, now, celebrated),
    [history.summary, goal, now, celebrated],
  );

  const setGoal = useCallback(async (next: number) => {
    const clamped = clampGoal(next);
    setGoalValue(clamped);
    await persistDailyGoal(clamped);
  }, []);

  const dismissMilestone = useCallback(() => {
    if (!milestone) return;
    const keys = milestoneKeysToMark(milestone, history.summary);
    setCelebrated(prev => Array.from(new Set([...prev, ...keys])));
    void addCelebratedMilestones(keys);
  }, [milestone, history.summary]);

  return {loaded, events, history, goal, milestone, setGoal, dismissMilestone};
}
