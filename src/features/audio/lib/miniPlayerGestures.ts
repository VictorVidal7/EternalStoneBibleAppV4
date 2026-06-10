/**
 * 🎧 miniPlayerGestures — PURE policy for the collapsed-bar horizontal swipe
 * (Sprint 75).
 *
 * The collapsed mini player gains a Spotify-style horizontal swipe: left jumps
 * to the NEXT verse, right returns to the PREVIOUS one. The gesture itself
 * lives in MiniAudioPlayer (RNGH pan, horizontal activation so taps and the
 * expanded panel's swipe-down stay untouched); THIS module owns the decision
 * table — how far/fast a drag must be to count, and which direction it maps
 * to — so the thresholds are unit-tested without a gesture harness.
 *
 * Mirrors [[chapterNavigation]] / [[playbackPosition]] / [[resumeCard]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** What a finished horizontal drag on the collapsed bar should do. */
export type SwipeAction = 'next' | 'previous' | null;

/**
 * Minimum finger travel (dp) for a deliberate swipe. Slightly above RNGH's
 * 20dp activation offset so a barely-activated wiggle never skips a verse.
 */
export const SWIPE_DISTANCE_THRESHOLD = 48;

/** A fast flick counts even when shorter than the distance threshold (dp/s). */
export const SWIPE_VELOCITY_THRESHOLD = 600;

/**
 * Resolve a finished horizontal drag into a player action. Swiping LEFT
 * (negative translation) advances to the next verse and swiping RIGHT returns
 * to the previous one — the music-app mini-player convention (content slides
 * out the way the finger pushes it). A drag that is neither long nor fast
 * enough resolves to `null` (snap back, do nothing).
 * Velocity must AGREE in sign with the travel so a drag-then-flick-back
 * cancels instead of firing.
 */
export function resolveHorizontalSwipe(params: {
  translationX: number;
  velocityX: number;
}): SwipeAction {
  const {translationX, velocityX} = params;

  const farEnough = Math.abs(translationX) >= SWIPE_DISTANCE_THRESHOLD;
  const fastEnough =
    Math.abs(velocityX) >= SWIPE_VELOCITY_THRESHOLD &&
    Math.sign(velocityX) === Math.sign(translationX);

  if (!farEnough && !fastEnough) return null;

  return translationX < 0 ? 'next' : 'previous';
}

/**
 * Rubber-band displacement for the bar while the finger drags: a third of the
 * travel, clamped, so the bar hints at the action without leaving its slot.
 * The caller zeroes it under reduce-motion.
 */
export function swipeDisplacement(translationX: number, max = 40): number {
  'worklet';
  const damped = translationX / 3;
  return Math.min(Math.max(damped, -max), max);
}
