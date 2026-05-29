/**
 * 🎚️ EASE PRIOR — calibrated population ease for new cards (Sprint 48 / Ola F)
 *
 * Sprint 46 gave every card a per-card `ease` that adapts from its *own*
 * review #2 onward, but a brand-new card always starts at the neutral
 * `DEFAULT_EASE` (1.0 = plain Leitner) — it knows nothing about how this
 * particular user actually retains verses. This module closes that gap: once
 * there's enough review history, it derives a *population-level* starting ease
 * from the user's measured retention so a new verse begins life scheduled to
 * the pace that's been working (or not working) for them.
 *
 * The math is the classic spaced-repetition feedback loop (SM-2 / FSRS): we
 * schedule toward a TARGET_RETENTION. If the user retains *above* the target,
 * their intervals are shorter than they need to be → bump the prior up (space
 * new cards out sooner, less nagging). If they retain *below* it, intervals
 * are too long → pull the prior down (more early practice). Below a minimum
 * sample size the signal is too noisy to trust, so we fall back to plain
 * Leitner (ease 1.0) and say so.
 *
 * Like `goals.ts`, this sits ON TOP of `history.ts`: it reads the
 * `HistorySummary` (which already computes overall retention over the synced
 * review-event log) and maps it to an ease — so the prior is the same on
 * every device that has synced the same log, with no new dataset and no sync
 * changes. Pure and React-free (no I/O, no clock), so it unit-tests
 * deterministically, exactly like `srs.ts` / `history.ts` / `goals.ts`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {HistorySummary} from './history';
import {clampEase, DEFAULT_EASE} from './srs';

/**
 * Retention the scheduler aims for. High enough that a verse feels mastered,
 * low enough not to over-study — a card whose interval yields exactly this
 * recall rate gets the neutral prior (ease 1.0).
 */
export const TARGET_RETENTION = 0.85;

/**
 * Minimum interval-bearing reviews (a verse's first-ever review has no
 * interval and doesn't count) before the population prior is trusted. Below
 * this the rate estimate is too noisy, so we stay on plain Leitner.
 */
export const MIN_CALIBRATION_REVIEWS = 20;

/**
 * How strongly a deviation from TARGET_RETENTION moves the prior, in ease
 * units per unit of retention. Conservative on purpose — the prior is only a
 * *starting point*; each card's own ease takes over from review #2.
 */
export const EASE_PRIOR_SENSITIVITY = 1.5;

/** The calibrated starting ease for new cards, plus the evidence behind it. */
export interface EasePrior {
  /** Initial ease to seed a new card with. Always a valid, clamped ease. */
  ease: number;
  /** True when there was enough history to trust the calibration. */
  calibrated: boolean;
  /** Interval-bearing reviews the calibration was based on. */
  sampleSize: number;
  /** Observed population retention in [0, 1], or null when uncalibrated. */
  observedRetention: number | null;
}

/**
 * Derive the ease a new card should start at from the user's review history.
 * Uncalibrated (sample below the threshold, or no retention data) → the
 * neutral `DEFAULT_EASE`, exactly matching pre-Sprint-48 behavior.
 */
export function computeEasePrior(summary: HistorySummary): EasePrior {
  const sampleSize = summary.reviewsWithInterval;
  const observed = summary.overallRetention;
  if (sampleSize < MIN_CALIBRATION_REVIEWS || observed == null) {
    return {
      ease: DEFAULT_EASE,
      calibrated: false,
      sampleSize,
      observedRetention: null,
    };
  }
  const raw =
    DEFAULT_EASE + EASE_PRIOR_SENSITIVITY * (observed - TARGET_RETENTION);
  return {
    ease: clampEase(raw),
    calibrated: true,
    sampleSize,
    observedRetention: observed,
  };
}
