/**
 * ♿ touchTarget — minimum hit-target sizing (WCAG 2.5.5 / platform HIGs).
 *
 * WCAG 2.1 AAA (2.5.5 Target Size) and both platform guidelines converge on a
 * ~44–48dp minimum touch target. Small icon buttons (≈24–36dp) are common in
 * the app's chrome; rather than resize the icon, we expand the *touchable* area
 * with a symmetric `hitSlop` so the visual stays the same but the tap target
 * reaches the minimum.
 *
 * Pure (React-/RN-free) so the geometry is unit-testable and shared by every
 * call-site that needs a consistent hit-target.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** The minimum comfortable touch target in dp (Android Material / WCAG 2.5.5). */
export const MIN_TOUCH_TARGET = 48;

export interface HitSlop {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Symmetric `hitSlop` that grows a `size`×`size` control up to `min` dp.
 *
 * Returns zero slop when the control is already at/above the minimum (never
 * negative). For a non-square control pass the smaller dimension.
 *
 * @param renderedSize the control's rendered side length in dp
 * @param min          target minimum (defaults to MIN_TOUCH_TARGET)
 */
export function hitSlopToMinTarget(
  renderedSize: number,
  min: number = MIN_TOUCH_TARGET,
): HitSlop {
  const deficit = Math.max(0, min - renderedSize);
  const pad = Math.ceil(deficit / 2);
  return {top: pad, bottom: pad, left: pad, right: pad};
}

/** Whether a control of the given dimensions already meets the minimum. */
export function meetsMinTarget(
  width: number,
  height: number,
  min: number = MIN_TOUCH_TARGET,
): boolean {
  return width >= min && height >= min;
}
