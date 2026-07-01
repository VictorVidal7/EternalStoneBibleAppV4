/**
 * ✝️ propheticQuiz — pure round-selection logic for the "emparejar
 * profecía↔cumplimiento" matching game (Hilo profético robustness round 3).
 *
 * A round samples a handful of entries from MESSIANIC_PROPHECIES; the screen
 * renders one card per side — the prophecy's theme label + OT reference on
 * the left, its NT fulfillment reference on the right — and the player taps
 * to pair them up. No new theological content: reuses the existing catalog
 * and the i18n label/note already vetted for the guided walk and the
 * "El hilo profético" reading plan.
 *
 * PURE (no React/RN, no DB, no AsyncStorage) so it's trivially testable.
 */

import {
  MESSIANIC_PROPHECIES,
  type MessianicProphecy,
} from './messianicProphecies';

/** How many pairs make up one round. */
export const QUIZ_ROUND_SIZE = 6;

/** Fisher-Yates shuffle. Accepts a `rng` (defaults to Math.random) so tests
 *  can inject a deterministic sequence. Never mutates the input. */
export function shuffle<T>(
  items: readonly T[],
  rng: () => number = Math.random,
): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks `size` distinct prophecies for a round, preferring ones not in
 * `exclude` (so consecutive rounds in a session vary instead of repeating).
 * Falls back to the full catalog once fewer than `size` entries remain
 * unseen, so a round is always fully sized. Pure; `rng` is injectable.
 */
export function pickQuizRound(
  size: number = QUIZ_ROUND_SIZE,
  exclude: ReadonlySet<string> = new Set(),
  rng: () => number = Math.random,
): MessianicProphecy[] {
  const n = Math.min(size, MESSIANIC_PROPHECIES.length);
  const fresh = MESSIANIC_PROPHECIES.filter(p => !exclude.has(p.id));
  const pool = fresh.length >= n ? fresh : MESSIANIC_PROPHECIES;
  return shuffle(pool, rng).slice(0, n);
}
