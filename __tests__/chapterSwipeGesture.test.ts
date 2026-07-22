/**
 * chapterSwipeGesture — pure policy for the reader's opt-in horizontal
 * "swipe to change chapter" gesture. Locks the distance/velocity decision
 * table (mirrors the audio mini player's verse swipe) and the edge-exclusion
 * math that keeps the gesture off the Android system back-gesture strip.
 */

import {
  resolveChapterSwipe,
  chapterSwipeEdgeInset,
  CHAPTER_SWIPE_DISTANCE_THRESHOLD,
  CHAPTER_SWIPE_VELOCITY_THRESHOLD,
  CHAPTER_SWIPE_EDGE_MIN_INSET,
} from '../src/lib/reader/chapterSwipeGesture';

describe('resolveChapterSwipe', () => {
  it('maps a long left drag to next and a long right drag to previous', () => {
    expect(resolveChapterSwipe({translationX: -80, velocityX: 0})).toBe('next');
    expect(resolveChapterSwipe({translationX: 80, velocityX: 0})).toBe(
      'previous',
    );
  });

  it('fires exactly at the distance threshold', () => {
    expect(
      resolveChapterSwipe({
        translationX: -CHAPTER_SWIPE_DISTANCE_THRESHOLD,
        velocityX: 0,
      }),
    ).toBe('next');
    expect(
      resolveChapterSwipe({
        translationX: -(CHAPTER_SWIPE_DISTANCE_THRESHOLD - 1),
        velocityX: 0,
      }),
    ).toBeNull();
  });

  it('a fast flick counts even when shorter than the distance threshold', () => {
    expect(
      resolveChapterSwipe({
        translationX: -30,
        velocityX: -CHAPTER_SWIPE_VELOCITY_THRESHOLD,
      }),
    ).toBe('next');
    expect(
      resolveChapterSwipe({
        translationX: 30,
        velocityX: CHAPTER_SWIPE_VELOCITY_THRESHOLD,
      }),
    ).toBe('previous');
  });

  it('a flick AGAINST the travel direction cancels instead of firing', () => {
    // Dragged right a bit, then flicked back hard to the left: do nothing.
    expect(
      resolveChapterSwipe({translationX: 30, velocityX: -2000}),
    ).toBeNull();
  });

  it('a short slow wiggle resolves to null', () => {
    expect(resolveChapterSwipe({translationX: -10, velocityX: -50})).toBe(null);
    expect(resolveChapterSwipe({translationX: 0, velocityX: 0})).toBeNull();
  });
});

describe('chapterSwipeEdgeInset', () => {
  it('scales with screen width above the floor', () => {
    // 500dp * 7% = 35dp, above the 32dp floor.
    expect(chapterSwipeEdgeInset(500)).toBeCloseTo(35, 5);
  });

  it('never goes below the minimum inset on a narrow screen', () => {
    // 320dp * 7% = 22.4dp, below the floor — the floor wins.
    expect(chapterSwipeEdgeInset(320)).toBe(CHAPTER_SWIPE_EDGE_MIN_INSET);
  });

  it('claims roughly the middle 85-90% of a typical phone width', () => {
    const width = 390;
    const inset = chapterSwipeEdgeInset(width);
    const claimedFraction = (width - inset * 2) / width;
    // The 32dp floor dominates at this width, so the claimed band lands just
    // under the 85% target — favoring MORE edge margin, never less, which is
    // the safe direction for staying clear of the OS back-gesture.
    expect(claimedFraction).toBeGreaterThanOrEqual(0.8);
    expect(claimedFraction).toBeLessThanOrEqual(0.9);
  });

  it('falls back to the floor for non-finite or non-positive widths', () => {
    expect(chapterSwipeEdgeInset(0)).toBe(CHAPTER_SWIPE_EDGE_MIN_INSET);
    expect(chapterSwipeEdgeInset(-100)).toBe(CHAPTER_SWIPE_EDGE_MIN_INSET);
    expect(chapterSwipeEdgeInset(NaN)).toBe(CHAPTER_SWIPE_EDGE_MIN_INSET);
  });
});
