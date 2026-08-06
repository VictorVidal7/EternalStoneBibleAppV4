/**
 * ✦ constellationZoom — pure pinch/pan transform math for the constellation
 * star map (see [[constellation.ts]] for the pure layout geometry this
 * transform sits on top of).
 *
 * The star map screen wraps BOTH the `<Svg>` canvas AND its sibling RN
 * `<Pressable>` hit-targets (per the Android SVG-onPress-inside-a-ScrollView
 * landmine documented in constellation.tsx) in a SINGLE Animated.View so a
 * pinch/pan gesture moves them together — the hit targets stay aligned with
 * their stars at every zoom/pan state instead of freezing in their original
 * screen position. This module holds the CLAMPING policy for that shared
 * transform (zoom bounds, pan bounds, "has the user actually moved away from
 * the default view" detection) as pure `'worklet'` functions, mirroring
 * [[chapterSwipeGesture]]: free of React/RN/Reanimated types so they run
 * directly on the UI thread inside a react-native-gesture-handler callback
 * AND unit-test deterministically without a gesture harness.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Never zoom below the default 1x — there is nothing to reveal below "actual size". */
export const CONSTELLATION_MIN_SCALE = 1;

/**
 * Cap zoom at 3x. Past this the individual stars are already large enough to
 * tap comfortably (their hit-target radius grows with the same transform —
 * see constellation.tsx) and more headroom just makes it easy to pan the
 * focus star fully off-screen with nothing recognisable left on canvas.
 */
export const CONSTELLATION_MAX_SCALE = 3;

/** Clamp a pinch scale into the allowed [MIN, MAX] zoom range. */
export function clampConstellationScale(scale: number): number {
  'worklet';
  if (!Number.isFinite(scale)) return CONSTELLATION_MIN_SCALE;
  if (scale < CONSTELLATION_MIN_SCALE) return CONSTELLATION_MIN_SCALE;
  if (scale > CONSTELLATION_MAX_SCALE) return CONSTELLATION_MAX_SCALE;
  return scale;
}

/**
 * How far (px, one axis) the scaled canvas may be panned before its edge
 * would pull inside the viewport and reveal empty space. React Native scales
 * a view around its own centre, so at `scale` the content overflows the
 * original `canvasSize` box by `canvasSize * (scale - 1) / 2` on EACH side —
 * that overflow is exactly how far it can be dragged the other way before the
 * (still `canvasSize`-wide) viewport would show a gap past its edge. At the
 * default 1x scale there is no overflow, so panning is not allowed (0) — the
 * pan gesture should have nothing to do until the user has zoomed in.
 */
export function maxConstellationTranslate(
  scale: number,
  canvasSize: number,
): number {
  'worklet';
  if (
    !Number.isFinite(scale) ||
    !Number.isFinite(canvasSize) ||
    canvasSize <= 0 ||
    scale <= CONSTELLATION_MIN_SCALE
  ) {
    return 0;
  }
  return (canvasSize * (scale - CONSTELLATION_MIN_SCALE)) / 2;
}

/**
 * Clamp a single-axis pan offset so the scaled canvas always fully covers the
 * `canvasSize` viewport (never reveals empty space past its edge). Used for
 * BOTH axes, independently — the canvas is square so the bound is symmetric.
 */
export function clampConstellationTranslate(
  value: number,
  scale: number,
  canvasSize: number,
): number {
  'worklet';
  if (!Number.isFinite(value)) return 0;
  const bound = maxConstellationTranslate(scale, canvasSize);
  // Bail out before computing `-bound` when the bound is 0 (i.e. not zoomed
  // in) — otherwise a negative `value` clamps to the IEEE-754 negative zero
  // (-0) instead of a plain 0, which is harmless for rendering but is a
  // needless footgun for anything comparing the result with strict equality.
  if (bound === 0) return 0;
  if (value > bound) return bound;
  if (value < -bound) return -bound;
  return value;
}

/** The screen's resting (never pinched/panned) transform — also the reset target. */
export const CONSTELLATION_DEFAULT_TRANSFORM = {
  scale: CONSTELLATION_MIN_SCALE,
  translateX: 0,
  translateY: 0,
} as const;

/**
 * Whether the current transform has strayed from the default 1x/no-pan view
 * enough to be worth showing a "reset view" affordance for. A small epsilon
 * absorbs floating-point/gesture noise so a finger that barely twitched
 * doesn't pop the button in and out.
 */
export function isConstellationTransformed(
  scale: number,
  translateX: number,
  translateY: number,
): boolean {
  'worklet';
  const EPSILON = 0.01;
  return (
    Math.abs(scale - CONSTELLATION_MIN_SCALE) > EPSILON ||
    Math.abs(translateX) > EPSILON ||
    Math.abs(translateY) > EPSILON
  );
}
