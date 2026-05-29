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
import {computeReviewHistory, type ReviewHistory} from '@lib/memory/history';
import {getAllReviewEvents} from '@lib/memory/reviewEventStore';
import type {ReviewEvent} from '@lib/memory/reviewEvents';
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

export function useMemoryGoal(): MemoryGoalState {
  const [events, setEvents] = useState<ReviewEvent[]>([]);
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
        const [ev, g, c] = await Promise.all([
          getAllReviewEvents(),
          getDailyGoal(),
          getCelebratedMilestones(),
        ]);
        if (!active) return;
        setEvents(ev);
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
    () => computeReviewHistory(events, now),
    [events, now],
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

  return {loaded, history, goal, milestone, setGoal, dismissMilestone};
}
