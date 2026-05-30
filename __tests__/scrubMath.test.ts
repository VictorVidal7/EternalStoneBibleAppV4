/**
 * Sprint 50 — verse-scrubber math (pure module).
 */

import {
  clampIndex,
  indexToFraction,
  positionToIndex,
} from '../src/features/audio/lib/scrubMath';

describe('clampIndex', () => {
  it('returns 0 for an empty list regardless of index', () => {
    expect(clampIndex(5, 0)).toBe(0);
    expect(clampIndex(-3, 0)).toBe(0);
  });

  it('clamps below 0 to 0 and above total-1 to the last index', () => {
    expect(clampIndex(-2, 10)).toBe(0);
    expect(clampIndex(99, 10)).toBe(9);
  });

  it('rounds a fractional index and leaves in-range integers untouched', () => {
    expect(clampIndex(3, 10)).toBe(3);
    expect(clampIndex(3.4, 10)).toBe(3);
    expect(clampIndex(3.6, 10)).toBe(4);
  });

  it('treats NaN/Infinity defensively as 0', () => {
    expect(clampIndex(NaN, 10)).toBe(0);
    expect(clampIndex(-Infinity, 10)).toBe(0);
  });
});

describe('positionToIndex', () => {
  it('maps the track ends to the first and last verse', () => {
    expect(positionToIndex(0, 300, 31)).toBe(0);
    expect(positionToIndex(300, 300, 31)).toBe(30);
  });

  it('maps the midpoint to the middle verse (rounded)', () => {
    // 31 verses → indices 0..30; halfway = 15.
    expect(positionToIndex(150, 300, 31)).toBe(15);
  });

  it('snaps to the nearest verse for an in-between position', () => {
    // 5 verses → indices 0..4 at fractions 0, .25, .5, .75, 1.
    // x=210/300 = 0.7 → 0.7*4 = 2.8 → rounds to 3.
    expect(positionToIndex(210, 300, 5)).toBe(3);
  });

  it('clamps an out-of-bounds x into range', () => {
    expect(positionToIndex(-50, 300, 31)).toBe(0);
    expect(positionToIndex(400, 300, 31)).toBe(30);
  });

  it('returns 0 for a single-verse chapter or an unmeasured track', () => {
    expect(positionToIndex(150, 300, 1)).toBe(0);
    expect(positionToIndex(150, 0, 31)).toBe(0);
    expect(positionToIndex(NaN, 300, 31)).toBe(0);
  });
});

describe('indexToFraction', () => {
  it('maps the first and last verse to the track ends', () => {
    expect(indexToFraction(0, 31)).toBe(0);
    expect(indexToFraction(30, 31)).toBe(1);
  });

  it('spaces interior verses evenly', () => {
    expect(indexToFraction(2, 5)).toBeCloseTo(0.5, 5);
    expect(indexToFraction(1, 5)).toBeCloseTo(0.25, 5);
  });

  it('clamps an out-of-range index and pins a 1-verse chapter at the start', () => {
    expect(indexToFraction(99, 31)).toBe(1);
    expect(indexToFraction(-5, 31)).toBe(0);
    expect(indexToFraction(0, 1)).toBe(0);
  });

  it('round-trips with positionToIndex at the track ends and midpoint', () => {
    const width = 300;
    const total = 31;
    expect(
      positionToIndex(indexToFraction(0, total) * width, width, total),
    ).toBe(0);
    expect(
      positionToIndex(indexToFraction(30, total) * width, width, total),
    ).toBe(30);
    expect(
      positionToIndex(indexToFraction(15, total) * width, width, total),
    ).toBe(15);
  });
});
