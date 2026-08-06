/**
 * constellationZoom — pure clamping policy for the constellation star map's
 * pinch-zoom/pan transform (zoom bounds, pan bounds, and "has the view
 * strayed from default" detection used to show the reset-view button).
 */

import {
  clampConstellationScale,
  clampConstellationTranslate,
  maxConstellationTranslate,
  isConstellationTransformed,
  CONSTELLATION_MIN_SCALE,
  CONSTELLATION_MAX_SCALE,
} from '../src/features/study/constellationZoom';

describe('clampConstellationScale', () => {
  it('passes values already inside [1, 3] through unchanged', () => {
    expect(clampConstellationScale(1)).toBe(1);
    expect(clampConstellationScale(2)).toBe(2);
    expect(clampConstellationScale(3)).toBe(3);
    expect(clampConstellationScale(1.75)).toBe(1.75);
  });

  it('clamps below the minimum up to 1x', () => {
    expect(clampConstellationScale(0.4)).toBe(CONSTELLATION_MIN_SCALE);
    expect(clampConstellationScale(0)).toBe(CONSTELLATION_MIN_SCALE);
    expect(clampConstellationScale(-2)).toBe(CONSTELLATION_MIN_SCALE);
  });

  it('clamps above the maximum down to 3x', () => {
    expect(clampConstellationScale(3.01)).toBe(CONSTELLATION_MAX_SCALE);
    expect(clampConstellationScale(50)).toBe(CONSTELLATION_MAX_SCALE);
  });

  it('falls back to the minimum for non-finite input', () => {
    expect(clampConstellationScale(NaN)).toBe(CONSTELLATION_MIN_SCALE);
    expect(clampConstellationScale(Infinity)).toBe(CONSTELLATION_MIN_SCALE);
    expect(clampConstellationScale(-Infinity)).toBe(CONSTELLATION_MIN_SCALE);
  });
});

describe('maxConstellationTranslate', () => {
  it('is zero at (or below) the default 1x scale — nothing to pan yet', () => {
    expect(maxConstellationTranslate(1, 320)).toBe(0);
    expect(maxConstellationTranslate(0.5, 320)).toBe(0);
  });

  it('grows with how far past 1x the canvas is scaled', () => {
    // At 2x a 320px canvas renders at 640px, overflowing its 320px box by
    // 160px per side.
    expect(maxConstellationTranslate(2, 320)).toBeCloseTo(160);
    // At 3x (the max) it renders at 960px, overflowing by 320px per side.
    expect(maxConstellationTranslate(3, 320)).toBeCloseTo(320);
  });

  it('scales linearly with canvas size for a fixed scale', () => {
    expect(maxConstellationTranslate(2, 400)).toBeCloseTo(200);
    expect(maxConstellationTranslate(2, 200)).toBeCloseTo(100);
  });

  it('is defensive against bad input', () => {
    expect(maxConstellationTranslate(NaN, 320)).toBe(0);
    expect(maxConstellationTranslate(2, NaN)).toBe(0);
    expect(maxConstellationTranslate(2, 0)).toBe(0);
    expect(maxConstellationTranslate(2, -100)).toBe(0);
  });
});

describe('clampConstellationTranslate', () => {
  it('clamps everything to 0 at the default 1x scale', () => {
    expect(clampConstellationTranslate(150, 1, 320)).toBe(0);
    expect(clampConstellationTranslate(-150, 1, 320)).toBe(0);
    expect(clampConstellationTranslate(0, 1, 320)).toBe(0);
  });

  it('lets a value inside the bound through unchanged once zoomed in', () => {
    // Bound at 2x/320px is 160px either way.
    expect(clampConstellationTranslate(80, 2, 320)).toBe(80);
    expect(clampConstellationTranslate(-80, 2, 320)).toBe(-80);
  });

  it('clamps a value past the bound in either direction', () => {
    expect(clampConstellationTranslate(500, 2, 320)).toBeCloseTo(160);
    expect(clampConstellationTranslate(-500, 2, 320)).toBeCloseTo(-160);
  });

  it('falls back to 0 for non-finite input', () => {
    expect(clampConstellationTranslate(NaN, 2, 320)).toBe(0);
  });
});

describe('isConstellationTransformed', () => {
  it('is false exactly at the default resting transform', () => {
    expect(isConstellationTransformed(1, 0, 0)).toBe(false);
  });

  it('absorbs tiny floating-point noise around the default', () => {
    expect(isConstellationTransformed(1.001, 0.001, -0.002)).toBe(false);
  });

  it('is true once scale has meaningfully moved from 1x', () => {
    expect(isConstellationTransformed(1.5, 0, 0)).toBe(true);
  });

  it('is true once either pan axis has meaningfully moved', () => {
    expect(isConstellationTransformed(1, 5, 0)).toBe(true);
    expect(isConstellationTransformed(1, 0, -5)).toBe(true);
  });
});
