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
 * Where a resolved swipe should land, bounded to the loaded chapter: `null`
 * when there is nothing to do (no action, or already at the first/last verse).
 * Owning the bounds here keeps the gesture handler and the paused-swipe
 * feedback (Sprint 77) agreeing on whether a move actually happened.
 */
export function swipeTargetIndex(params: {
  action: SwipeAction;
  currentIndex: number;
  totalVerses: number;
}): number | null {
  const {action, currentIndex, totalVerses} = params;
  if (action === 'next') {
    return currentIndex < totalVerses - 1 ? currentIndex + 1 : null;
  }
  if (action === 'previous') {
    return currentIndex > 0 ? currentIndex - 1 : null;
  }
  return null;
}

/**
 * How long the collapsed bar keeps the post-swipe confirmation tint while
 * PAUSED (Sprint 77). While playing the moved verse is immediately audible;
 * paused, this transient highlight is the only unmissable cue that the
 * resume point changed.
 */
export const PAUSED_SWIPE_FLASH_MS = 1600;

/**
 * How long the collapsed bar tints after a LONG-PRESS pins the playing verse
 * as an audio bookmark (Sprint 78). Same static-color-swap idiom as the
 * paused-swipe flash — reduce-motion-safe by construction.
 */
export const BOOKMARK_PIN_FLASH_MS = 1600;

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
