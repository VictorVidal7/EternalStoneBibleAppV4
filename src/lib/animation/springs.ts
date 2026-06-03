/**
 * 🎚️ springs — one shared "press" feel for the whole app (Sprint 66).
 *
 * Tappable cards across the app each rolled their own press-scale spring
 * (0.95 here, 0.98 there, friction 3 vs default, and most NOT reduce-motion
 * aware). This centralizes the numbers so every surface depresses with the same
 * snappy, low-overshoot motion — adopted via [[usePressScale]] / PressableScale.
 *
 * Pure: just constants + the tiny target-scale decision, so the policy is
 * unit-testable with no React / Animated.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Scale a card settles to while pressed (1 = no shrink). */
export const PRESS_SCALE = 0.96;

/**
 * Shared `Animated.spring` config for the press in/out transition. Snappy with
 * minimal wobble (high friction) so a button doesn't jiggle. `useNativeDriver`
 * is left to the call site (it's true everywhere we use it).
 */
export const PRESS_SPRING = {
  tension: 300,
  friction: 18,
} as const;

/**
 * The scale a pressable should animate toward:
 *  - `1` when not pressed, or when the user prefers reduced motion (no shrink),
 *  - `scaleTo` (default {@link PRESS_SCALE}) while pressed.
 */
export function pressTargetScale(
  pressed: boolean,
  reduced: boolean,
  scaleTo: number = PRESS_SCALE,
): number {
  if (reduced) return 1;
  return pressed ? scaleTo : 1;
}
