/**
 * Sprint 85 — the pure daily reading-goal math (grades the Leer ring).
 */
import {
  DEFAULT_READING_GOAL,
  MAX_READING_GOAL,
  MIN_READING_GOAL,
  clampReadingGoal,
  computeReadingGoalProgress,
} from '../src/lib/reading/readingGoal';

describe('clampReadingGoal', () => {
  it('defaults a non-finite value and clamps/rounds the rest', () => {
    expect(clampReadingGoal(NaN)).toBe(DEFAULT_READING_GOAL);
    expect(clampReadingGoal(0)).toBe(MIN_READING_GOAL);
    expect(clampReadingGoal(-5)).toBe(MIN_READING_GOAL);
    expect(clampReadingGoal(9999)).toBe(MAX_READING_GOAL);
    expect(clampReadingGoal(12.6)).toBe(13);
  });
});

describe('computeReadingGoalProgress', () => {
  it('reports zero progress when nothing has been read', () => {
    const p = computeReadingGoalProgress(0, 10);
    expect(p).toEqual({
      goal: 10,
      todayCount: 0,
      remaining: 10,
      met: false,
      fraction: 0,
    });
  });

  it('fills proportionally below the goal', () => {
    const p = computeReadingGoalProgress(4, 10);
    expect(p.todayCount).toBe(4);
    expect(p.remaining).toBe(6);
    expect(p.met).toBe(false);
    expect(p.fraction).toBeCloseTo(0.4);
  });

  it('meets and caps the fraction at the goal', () => {
    const p = computeReadingGoalProgress(10, 10);
    expect(p.met).toBe(true);
    expect(p.remaining).toBe(0);
    expect(p.fraction).toBe(1);
  });

  it('never exceeds a full ring when read past the goal', () => {
    const p = computeReadingGoalProgress(25, 10);
    expect(p.met).toBe(true);
    expect(p.remaining).toBe(0);
    expect(p.fraction).toBe(1);
  });

  it('treats garbage verse counts as zero and clamps the goal', () => {
    expect(computeReadingGoalProgress(-3, 10).todayCount).toBe(0);
    expect(computeReadingGoalProgress(NaN, 10).fraction).toBe(0);
    // A bad goal is clamped before dividing.
    expect(computeReadingGoalProgress(5, 0).goal).toBe(MIN_READING_GOAL);
  });
});
