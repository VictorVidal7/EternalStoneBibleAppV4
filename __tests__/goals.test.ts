/**
 * Sprint 47 — memory goals / streaks / milestones (pure module).
 */

import {
  clampGoal,
  computeGoalProgress,
  DEFAULT_DAILY_GOAL,
  localDayStamp,
  MAX_DAILY_GOAL,
  MIN_DAILY_GOAL,
  milestoneKeysToMark,
  nextStreakTarget,
  pendingMilestone,
  reachedStreakMilestones,
} from '../src/lib/memory/goals';
import type {HistorySummary} from '../src/lib/memory/history';

/** A HistorySummary with sane zeros, overridable per test. */
function mkSummary(over: Partial<HistorySummary> = {}): HistorySummary {
  return {
    totalReviews: 0,
    reviewsToday: 0,
    reviewsLast7: 0,
    reviewsLast30: 0,
    activeDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    overallRetention: null,
    reviewsWithInterval: 0,
    ...over,
  };
}

describe('clampGoal', () => {
  it('defaults on non-finite input', () => {
    expect(clampGoal(NaN)).toBe(DEFAULT_DAILY_GOAL);
    expect(clampGoal(Infinity)).toBe(DEFAULT_DAILY_GOAL);
  });
  it('rounds and clamps into [MIN, MAX]', () => {
    expect(clampGoal(0)).toBe(MIN_DAILY_GOAL);
    expect(clampGoal(-5)).toBe(MIN_DAILY_GOAL);
    expect(clampGoal(1000)).toBe(MAX_DAILY_GOAL);
    expect(clampGoal(10.4)).toBe(10);
    expect(clampGoal(10.6)).toBe(11);
  });
});

describe('computeGoalProgress', () => {
  it('reports under-goal progress', () => {
    const p = computeGoalProgress(mkSummary({reviewsToday: 4}), 10);
    expect(p).toEqual({
      goal: 10,
      todayCount: 4,
      remaining: 6,
      met: false,
      fraction: 0.4,
    });
  });
  it('caps fraction and remaining once the goal is met or exceeded', () => {
    const p = computeGoalProgress(mkSummary({reviewsToday: 15}), 10);
    expect(p.met).toBe(true);
    expect(p.remaining).toBe(0);
    expect(p.fraction).toBe(1);
  });
  it('clamps the incoming goal', () => {
    const p = computeGoalProgress(mkSummary({reviewsToday: 2}), 1000);
    expect(p.goal).toBe(MAX_DAILY_GOAL);
  });
});

describe('localDayStamp', () => {
  it('formats a zero-padded local YYYY-MM-DD', () => {
    // Use local-time fields so the assertion is TZ-agnostic.
    const d = new Date(2026, 4, 9, 23, 59); // 2026-05-09 local
    expect(localDayStamp(d)).toBe('2026-05-09');
  });
});

describe('reachedStreakMilestones / nextStreakTarget', () => {
  it('lists every threshold the streak has reached', () => {
    expect(reachedStreakMilestones(0)).toEqual([]);
    expect(reachedStreakMilestones(7)).toEqual([3, 7]);
    expect(reachedStreakMilestones(45)).toEqual([3, 7, 14, 30]);
  });
  it('points at the next unreached threshold, null past the top', () => {
    expect(nextStreakTarget(0)).toBe(3);
    expect(nextStreakTarget(7)).toBe(14);
    expect(nextStreakTarget(1000)).toBeNull();
  });
});

describe('pendingMilestone', () => {
  const now = new Date(2026, 4, 9, 10, 0); // 2026-05-09 local
  const goalMet = computeGoalProgress(mkSummary({reviewsToday: 12}), 10);
  const goalUnmet = computeGoalProgress(mkSummary({reviewsToday: 2}), 10);

  it('returns null when nothing is achieved', () => {
    expect(
      pendingMilestone(mkSummary({currentStreak: 1}), goalUnmet, now, []),
    ).toBeNull();
  });

  it('returns the highest uncelebrated streak threshold', () => {
    const m = pendingMilestone(
      mkSummary({currentStreak: 8}),
      goalUnmet,
      now,
      [],
    );
    expect(m).toEqual({type: 'streak', value: 7, key: 'streak:7'});
  });

  it('falls through to the daily-goal milestone once streaks are celebrated', () => {
    const m = pendingMilestone(mkSummary({currentStreak: 8}), goalMet, now, [
      'streak:3',
      'streak:7',
    ]);
    expect(m).toEqual({type: 'goal', value: 10, key: 'goal:2026-05-09'});
  });

  it('streak outranks the goal when both are pending', () => {
    const m = pendingMilestone(mkSummary({currentStreak: 3}), goalMet, now, []);
    expect(m?.type).toBe('streak');
  });

  it('returns null when everything is already celebrated', () => {
    const m = pendingMilestone(mkSummary({currentStreak: 3}), goalMet, now, [
      'streak:3',
      'goal:2026-05-09',
    ]);
    expect(m).toBeNull();
  });
});

describe('milestoneKeysToMark', () => {
  it('marks every lower reached threshold for a streak milestone', () => {
    const summary = mkSummary({currentStreak: 8});
    expect(
      milestoneKeysToMark({type: 'streak', value: 7, key: 'streak:7'}, summary),
    ).toEqual(['streak:3', 'streak:7']);
  });
  it('marks just its own key for a goal milestone', () => {
    expect(
      milestoneKeysToMark(
        {type: 'goal', value: 10, key: 'goal:2026-05-09'},
        mkSummary(),
      ),
    ).toEqual(['goal:2026-05-09']);
  });
});
