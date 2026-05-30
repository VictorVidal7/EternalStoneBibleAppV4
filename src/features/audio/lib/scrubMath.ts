/**
 * Verse-scrubber math (Sprint 50 — premium verse scrub).
 *
 * Pure, React-/gesture-free helpers that map between a drag position on the
 * scrubber track and a DISCRETE verse index. The TTS player has no real
 * per-verse duration (expo-speech exposes no continuous time position), so the
 * scrubber snaps to a verse index rather than a timestamp — see the S50
 * architecture notes. Kept pure (mirror of insights.ts / conflictAnalytics.ts)
 * so the mapping is unit-testable without rendering anything.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

/**
 * Clamp a verse index into the valid range `[0, total - 1]`.
 * Returns 0 for an empty list so callers never index past the end.
 */
export function clampIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (!Number.isFinite(index) || index < 0) return 0;
  if (index > total - 1) return total - 1;
  return Math.round(index);
}

/**
 * Map an x position (px, relative to the track's left edge) on a track of
 * `width` px to the nearest verse index in `[0, total - 1]`.
 *
 * The thumb travels the FULL width: x=0 → first verse, x=width → last verse,
 * with the remaining verses evenly spaced between. A 1-verse (or empty)
 * chapter, or an unmeasured track (`width <= 0`), always maps to index 0.
 */
export function positionToIndex(
  x: number,
  width: number,
  total: number,
): number {
  if (total <= 1 || width <= 0 || !Number.isFinite(x)) return 0;
  const fraction = x / width;
  const raw = Math.round(fraction * (total - 1));
  return clampIndex(raw, total);
}

/**
 * The track fraction `[0, 1]` at which a given verse index's thumb sits.
 * Inverse of {@link positionToIndex}: index 0 → 0, index `total - 1` → 1,
 * evenly spaced. A 1-verse (or empty) chapter pins the thumb at the start.
 */
export function indexToFraction(index: number, total: number): number {
  if (total <= 1) return 0;
  return clampIndex(index, total) / (total - 1);
}
