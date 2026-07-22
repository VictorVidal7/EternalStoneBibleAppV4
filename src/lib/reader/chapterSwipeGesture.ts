/**
 * 📖 chapterSwipeGesture — PURE policy for the reader's opt-in horizontal
 * "swipe to change chapter" gesture.
 *
 * Mirrors [[miniPlayerGestures]] (the audio mini player's verse-swipe, Sprint
 * 75): the gesture wiring (a `Gesture.Pan` in the reader screen) owns nothing
 * but calling into these two pure functions — the distance/velocity decision
 * table for whether a finished drag counts as a deliberate swipe, and how
 * much of the screen width the gesture is even allowed to claim. Kept free of
 * RNGH/React so both are unit-tested without a gesture harness.
 *
 * The edge exclusion exists for one reason: Android's system back-gesture
 * claims the outer ~24-32dp of the screen before touches even reach the app.
 * A chapter-swipe gesture that also claimed that strip would fight the OS
 * gesture on every device with gesture navigation enabled. Rather than try to
 * negotiate with the OS gesture, this policy simply never claims the edge —
 * `chapterSwipeEdgeInset` returns how many dp to carve OFF each side of the
 * Pan handler's recognition area (wired in as a NEGATIVE `hitSlop` on the
 * reader screen's gesture), so only the middle ~85-90% of the screen can ever
 * activate a chapter change.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** What a finished horizontal drag over the reader should do. */
export type ChapterSwipeAction = 'next' | 'previous' | null;

/**
 * Minimum finger travel (dp) for a deliberate swipe. Mirrors the audio mini
 * player's collapsed-bar swipe (Sprint 75) — the same distance held up fine
 * there, and a chapter change is no more disruptive to reverse (a swipe back
 * undoes it) than a verse skip.
 */
export const CHAPTER_SWIPE_DISTANCE_THRESHOLD = 48;

/** A fast flick counts even when shorter than the distance threshold (dp/s). */
export const CHAPTER_SWIPE_VELOCITY_THRESHOLD = 600;

/**
 * Resolve a finished horizontal drag into a chapter action. Swiping LEFT
 * (negative translation) advances to the NEXT chapter and swiping RIGHT
 * returns to the PREVIOUS one — content slides out the way the finger pushes
 * it, the same convention as the Anterior/Siguiente header buttons and the
 * mini player's verse swipe. A drag that is neither long nor fast enough
 * resolves to `null` (do nothing). Velocity must AGREE in sign with the
 * travel so a drag-then-flick-back cancels instead of firing.
 */
export function resolveChapterSwipe(params: {
  translationX: number;
  velocityX: number;
}): ChapterSwipeAction {
  'worklet';
  const {translationX, velocityX} = params;

  const farEnough = Math.abs(translationX) >= CHAPTER_SWIPE_DISTANCE_THRESHOLD;
  const fastEnough =
    Math.abs(velocityX) >= CHAPTER_SWIPE_VELOCITY_THRESHOLD &&
    Math.sign(velocityX) === Math.sign(translationX);

  if (!farEnough && !fastEnough) return null;

  return translationX < 0 ? 'next' : 'previous';
}

/**
 * Fraction of the screen width excluded from EACH side. Android's system
 * back-gesture edge zone is documented at ~24-32dp; 7% of a typical
 * ~360-430dp phone width lands just past that without a device-specific
 * lookup, leaving the gesture the middle ~86% of the screen.
 */
export const CHAPTER_SWIPE_EDGE_FRACTION = 0.07;

/**
 * Never claim less than this many dp per side, even on a narrow screen —
 * comfortably past the widest documented Android back-gesture zone. This is
 * the floor that actually enforces the "don't claim the edge" rule; the
 * fraction above just scales it up on wider screens.
 */
export const CHAPTER_SWIPE_EDGE_MIN_INSET = 32;

/**
 * How many dp of the reader's Pan-gesture recognition area to carve off EACH
 * side so the outer edges stay free for the OS back-gesture — "don't claim
 * the edge" rather than trying to out-negotiate it. Wired in as a NEGATIVE
 * `hitSlop` on the gesture (shrinks its hit-testing area inward); the
 * ScrollView underneath is untouched, so the edge strip still scrolls/back-
 * gestures normally, it just never starts a chapter change.
 */
export function chapterSwipeEdgeInset(screenWidthDp: number): number {
  if (!Number.isFinite(screenWidthDp) || screenWidthDp <= 0) {
    return CHAPTER_SWIPE_EDGE_MIN_INSET;
  }
  return Math.max(
    CHAPTER_SWIPE_EDGE_MIN_INSET,
    screenWidthDp * CHAPTER_SWIPE_EDGE_FRACTION,
  );
}
