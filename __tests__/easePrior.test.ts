/**
 * Sprint 48 — calibrated ease prior tests.
 *
 * `computeEasePrior` maps the user's measured retention (from the synced
 * review log, surfaced on `HistorySummary`) onto the ease a brand-new card
 * should start at. Below a minimum sample it stays on plain Leitner; above
 * it, retention above/below the target nudges the prior up/down, clamped.
 */

import {
  computeEasePrior,
  EASE_PRIOR_SENSITIVITY,
  MIN_CALIBRATION_REVIEWS,
  TARGET_RETENTION,
} from '../src/lib/memory/easePrior';
import {DEFAULT_EASE, MIN_EASE, MAX_EASE} from '../src/lib/memory/srs';
import type {HistorySummary} from '../src/lib/memory/history';

/** A HistorySummary with sane zeros, overriding only what each test needs. */
function summary(over: Partial<HistorySummary> = {}): HistorySummary {
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

/** The raw (pre-clamp) prior the formula produces for a retention. */
function expectedEase(retention: number): number {
  return DEFAULT_EASE + EASE_PRIOR_SENSITIVITY * (retention - TARGET_RETENTION);
}

describe('computeEasePrior', () => {
  it('is uncalibrated (default ease) for an empty / no-retention summary', () => {
    const p = computeEasePrior(summary());
    expect(p.calibrated).toBe(false);
    expect(p.ease).toBe(DEFAULT_EASE);
    expect(p.sampleSize).toBe(0);
    expect(p.observedRetention).toBeNull();
  });

  it('stays uncalibrated below the sample threshold', () => {
    const p = computeEasePrior(
      summary({
        reviewsWithInterval: MIN_CALIBRATION_REVIEWS - 1,
        overallRetention: 0.95,
      }),
    );
    expect(p.calibrated).toBe(false);
    expect(p.ease).toBe(DEFAULT_EASE);
    // still reports the partial sample so the UI can show "X to go".
    expect(p.sampleSize).toBe(MIN_CALIBRATION_REVIEWS - 1);
    expect(p.observedRetention).toBeNull();
  });

  it('returns the neutral default when retention sits exactly at target', () => {
    const p = computeEasePrior(
      summary({
        reviewsWithInterval: MIN_CALIBRATION_REVIEWS,
        overallRetention: TARGET_RETENTION,
      }),
    );
    expect(p.calibrated).toBe(true);
    expect(p.ease).toBeCloseTo(DEFAULT_EASE, 5);
    expect(p.observedRetention).toBe(TARGET_RETENTION);
  });

  it('raises the prior above the default for high retention', () => {
    const observed = 0.95;
    const p = computeEasePrior(
      summary({reviewsWithInterval: 40, overallRetention: observed}),
    );
    expect(p.calibrated).toBe(true);
    expect(p.ease).toBeGreaterThan(DEFAULT_EASE);
    expect(p.ease).toBeCloseTo(expectedEase(observed), 5);
    expect(p.sampleSize).toBe(40);
    expect(p.observedRetention).toBe(observed);
  });

  it('lowers the prior below the default for low retention', () => {
    const observed = 0.65;
    const p = computeEasePrior(
      summary({reviewsWithInterval: 40, overallRetention: observed}),
    );
    expect(p.calibrated).toBe(true);
    expect(p.ease).toBeLessThan(DEFAULT_EASE);
    expect(p.ease).toBeCloseTo(expectedEase(observed), 5);
  });

  it('clamps a far-below-target prior up to MIN_EASE', () => {
    // retention 0 would drive the raw prior negative without the clamp.
    const p = computeEasePrior(
      summary({reviewsWithInterval: 50, overallRetention: 0}),
    );
    expect(p.calibrated).toBe(true);
    expect(p.ease).toBe(MIN_EASE);
  });

  it('keeps a perfect-retention prior inside the ease band', () => {
    const p = computeEasePrior(
      summary({reviewsWithInterval: 50, overallRetention: 1}),
    );
    expect(p.ease).toBeGreaterThanOrEqual(MIN_EASE);
    expect(p.ease).toBeLessThanOrEqual(MAX_EASE);
    expect(p.ease).toBeCloseTo(expectedEase(1), 5);
  });
});
