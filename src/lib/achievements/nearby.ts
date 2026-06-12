/**
 * 🎯 nearby — PURE "almost there" picker for the achievements screen (S81).
 *
 * From the full catalog, picks the locked achievements the user is CLOSEST to
 * unlocking, by progress ratio. Event-driven badges (SPECIAL: early bird,
 * Psalms…) always sit at progress 0 — they have no backing stat — so the
 * `> 0` gate naturally excludes them: this strip only ever promises things
 * the user is measurably walking toward.
 *
 * Kept pure (no React) mirroring `progress.ts` so the ranking is
 * unit-testable in isolation.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {Achievement} from './types';

/** How many "almost there" achievements the strip shows by default. */
export const NEARBY_DEFAULT_COUNT = 3;

/**
 * The locked achievements nearest to unlocking, best-first. Ties on ratio
 * break toward the SMALLER requirement (fewer absolute steps left feels
 * closer). Defensive: ignores malformed requirements (<= 0) and anything
 * already at/over its target (the unlock belongs to the check loop, not to
 * a teaser strip).
 */
export function nearestAchievements(
  all: ReadonlyArray<Achievement>,
  count: number = NEARBY_DEFAULT_COUNT,
): Achievement[] {
  return all
    .filter(
      a =>
        !a.isUnlocked &&
        a.requirement > 0 &&
        a.currentProgress > 0 &&
        a.currentProgress < a.requirement,
    )
    .sort(
      (a, b) =>
        b.currentProgress / b.requirement - a.currentProgress / a.requirement ||
        a.requirement - b.requirement,
    )
    .slice(0, Math.max(0, count));
}
