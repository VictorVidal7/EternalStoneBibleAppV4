/**
 * miniPlayerGestures — pure policy for the collapsed-bar horizontal swipe
 * (Sprint 75). Locks the distance/velocity decision table and the rubber-band
 * displacement curve.
 */

import {
  resolveHorizontalSwipe,
  swipeDisplacement,
  SWIPE_DISTANCE_THRESHOLD,
  SWIPE_VELOCITY_THRESHOLD,
} from '../src/features/audio/lib/miniPlayerGestures';

describe('resolveHorizontalSwipe', () => {
  it('maps a long left drag to next and a long right drag to previous', () => {
    expect(resolveHorizontalSwipe({translationX: -80, velocityX: 0})).toBe(
      'next',
    );
    expect(resolveHorizontalSwipe({translationX: 80, velocityX: 0})).toBe(
      'previous',
    );
  });

  it('fires exactly at the distance threshold', () => {
    expect(
      resolveHorizontalSwipe({
        translationX: -SWIPE_DISTANCE_THRESHOLD,
        velocityX: 0,
      }),
    ).toBe('next');
    expect(
      resolveHorizontalSwipe({
        translationX: -(SWIPE_DISTANCE_THRESHOLD - 1),
        velocityX: 0,
      }),
    ).toBeNull();
  });

  it('a fast flick counts even when shorter than the distance threshold', () => {
    expect(
      resolveHorizontalSwipe({
        translationX: -30,
        velocityX: -SWIPE_VELOCITY_THRESHOLD,
      }),
    ).toBe('next');
    expect(
      resolveHorizontalSwipe({
        translationX: 30,
        velocityX: SWIPE_VELOCITY_THRESHOLD,
      }),
    ).toBe('previous');
  });

  it('a flick AGAINST the travel direction cancels instead of firing', () => {
    // Dragged right a bit, then flicked back hard to the left: do nothing.
    expect(
      resolveHorizontalSwipe({translationX: 30, velocityX: -2000}),
    ).toBeNull();
  });

  it('a short slow wiggle resolves to null', () => {
    expect(resolveHorizontalSwipe({translationX: -10, velocityX: -50})).toBe(
      null,
    );
    expect(resolveHorizontalSwipe({translationX: 0, velocityX: 0})).toBeNull();
  });
});

describe('swipeDisplacement', () => {
  it('damps the travel to a third', () => {
    expect(swipeDisplacement(30)).toBe(10);
    expect(swipeDisplacement(-30)).toBe(-10);
  });

  it('clamps at the maximum displacement in both directions', () => {
    expect(swipeDisplacement(500)).toBe(40);
    expect(swipeDisplacement(-500)).toBe(-40);
    expect(swipeDisplacement(500, 24)).toBe(24);
  });
});
