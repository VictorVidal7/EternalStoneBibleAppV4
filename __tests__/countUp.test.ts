/**
 * Sprint 65 — count-up easing math (the pure half of the CountUpText delight).
 */
import {
  clamp01,
  easeOutCubic,
  countUpValue,
} from '../src/lib/animation/countUp';

describe('clamp01', () => {
  it('clamps into [0,1] and maps NaN/Infinity to 0', () => {
    expect(clamp01(-0.5)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(NaN)).toBe(0);
    expect(clamp01(Infinity)).toBe(0); // non-finite guard fires first
  });
});

describe('easeOutCubic', () => {
  it('pins the endpoints and decelerates (eased > linear in the middle)', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 5); // 1-(0.5)^3
    // Ease-OUT means the curve sits ABOVE the line y=x for 0<t<1.
    expect(easeOutCubic(0.25)).toBeGreaterThan(0.25);
  });

  it('is monotonically non-decreasing across the range', () => {
    let prev = -1;
    for (let i = 0; i <= 20; i++) {
      const v = easeOutCubic(i / 20);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe('countUpValue', () => {
  it('lands exactly on 0 at the start and the target at the end', () => {
    expect(countUpValue(1422, 0)).toBe(0);
    expect(countUpValue(1422, 1)).toBe(1422);
    // Past-the-end / before-the-start progress never overshoots.
    expect(countUpValue(1422, 1.5)).toBe(1422);
    expect(countUpValue(1422, -0.2)).toBe(0);
  });

  it('returns a rounded, in-range integer mid-animation', () => {
    const mid = countUpValue(100, 0.5);
    expect(Number.isInteger(mid)).toBe(true);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);
    expect(mid).toBe(88); // round(100 * 0.875)
  });

  it('defends against a non-finite target', () => {
    expect(countUpValue(NaN, 0.5)).toBe(0);
    expect(countUpValue(Infinity, 1)).toBe(0);
  });
});
