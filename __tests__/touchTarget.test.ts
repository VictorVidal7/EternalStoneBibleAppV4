import {
  MIN_TOUCH_TARGET,
  hitSlopToMinTarget,
  meetsMinTarget,
} from '../src/lib/a11y/touchTarget';

describe('touchTarget — minimum hit-target geometry', () => {
  it('uses the 48dp WCAG/Material minimum', () => {
    expect(MIN_TOUCH_TARGET).toBe(48);
  });

  describe('hitSlopToMinTarget', () => {
    it('pads a 24dp icon symmetrically up to 48dp', () => {
      // deficit 24 → 12 each side → 24 + 12*2 = 48
      expect(hitSlopToMinTarget(24)).toEqual({
        top: 12,
        bottom: 12,
        left: 12,
        right: 12,
      });
    });

    it('pads a 36dp control up to 48dp', () => {
      expect(hitSlopToMinTarget(36)).toEqual({
        top: 6,
        bottom: 6,
        left: 6,
        right: 6,
      });
    });

    it('returns zero slop when already at/above the minimum', () => {
      expect(hitSlopToMinTarget(48)).toEqual({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });
      expect(hitSlopToMinTarget(64)).toEqual({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      });
    });

    it('rounds an odd deficit up so the full target is reached', () => {
      // deficit 25 → ceil(12.5)=13 each side → never under the minimum
      const slop = hitSlopToMinTarget(23);
      expect(slop.top).toBe(13);
      expect(23 + slop.left + slop.right).toBeGreaterThanOrEqual(
        MIN_TOUCH_TARGET,
      );
    });

    it('honors a custom minimum', () => {
      expect(hitSlopToMinTarget(20, 44)).toEqual({
        top: 12,
        bottom: 12,
        left: 12,
        right: 12,
      });
    });
  });

  describe('meetsMinTarget', () => {
    it('is true only when both dimensions reach the minimum', () => {
      expect(meetsMinTarget(48, 48)).toBe(true);
      expect(meetsMinTarget(50, 48)).toBe(true);
      expect(meetsMinTarget(48, 40)).toBe(false);
      expect(meetsMinTarget(40, 48)).toBe(false);
    });
  });
});
