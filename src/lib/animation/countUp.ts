/**
 * 🔢 countUp — pure math for the animated number count-up (Sprint 65).
 *
 * The "Mi lectura" dashboard feels more alive when its hero numbers tick up
 * from zero on mount instead of snapping in. The animation itself is an RN
 * `Animated.timing` 0→1 progress; these pure helpers map that progress to the
 * displayed integer with an ease-out curve (fast then settling) so the count
 * decelerates into its final value.
 *
 * Kept React-free + deterministic so the easing is unit-testable; the component
 * ([[CountUpText]]) only wires the Animated driver and is fully reduce-motion
 * aware (when motion is reduced the final value renders immediately, no count).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Clamp a number into the inclusive [0, 1] range (NaN → 0). */
export function clamp01(t: number): number {
  if (!Number.isFinite(t)) return 0;
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return t;
}

/**
 * Ease-out cubic: 0→0, 1→1, decelerating. Standard "settle into place" curve.
 */
export function easeOutCubic(t: number): number {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

/**
 * The integer to display at a given linear progress (0→1) when counting up to
 * `target`, eased. Always lands EXACTLY on `target` at progress ≥ 1 and on 0 at
 * progress ≤ 0, so the animation can never overshoot or leave a stale value.
 */
export function countUpValue(target: number, progress: number): number {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const p = clamp01(progress);
  if (p >= 1) return safeTarget;
  if (p <= 0) return 0;
  return Math.round(safeTarget * easeOutCubic(p));
}
