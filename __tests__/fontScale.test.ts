import {
  DEFAULT_MAX_FONT_SCALE,
  FONT_SCALE_CAP,
  FontScaleRole,
  maxFontScaleFor,
  scaledFontSize,
} from '../src/lib/a11y/fontScale';

describe('fontScale — Dynamic-Type caps', () => {
  describe('maxFontScaleFor', () => {
    it('returns the moderate default for the default role', () => {
      expect(maxFontScaleFor('default')).toBe(1.6);
      expect(maxFontScaleFor()).toBe(1.6);
      expect(DEFAULT_MAX_FONT_SCALE).toBe(1.6);
    });

    it('returns a tighter cap for display chrome than for default', () => {
      expect(maxFontScaleFor('display')).toBe(1.3);
      expect(maxFontScaleFor('display')!).toBeLessThan(
        maxFontScaleFor('default')!,
      );
    });

    it('returns the tightest cap for compact chrome', () => {
      expect(maxFontScaleFor('compact')).toBe(1.2);
      expect(maxFontScaleFor('compact')!).toBeLessThan(
        maxFontScaleFor('display')!,
      );
    });

    it('returns undefined (no cap) for reading body text', () => {
      expect(maxFontScaleFor('body')).toBeUndefined();
    });

    it('falls back to the default for an unknown role', () => {
      // Defensive: a persisted/foreign role string should not crash.
      expect(maxFontScaleFor('nope' as FontScaleRole)).toBe(
        DEFAULT_MAX_FONT_SCALE,
      );
    });
  });

  describe('scaledFontSize', () => {
    it('passes the OS scale straight through at scale 1', () => {
      expect(scaledFontSize(16, 1, 'default')).toBe(16);
    });

    it('clamps an above-cap OS scale to the role cap', () => {
      // 16px @ 2.0 OS scale, capped at display 1.3 → 20.8
      expect(scaledFontSize(16, 2, 'display')).toBe(20.8);
      // compact cap 1.2 → 19.2
      expect(scaledFontSize(16, 2, 'compact')).toBe(19.2);
      // default cap 1.6 → 25.6
      expect(scaledFontSize(16, 2, 'default')).toBe(25.6);
    });

    it('honors an OS scale below the cap as-is', () => {
      // 1.15 < 1.6 cap → applied verbatim
      expect(scaledFontSize(20, 1.15, 'default')).toBe(23);
    });

    it('honors a sub-1 OS scale (small-font users) without forcing it up', () => {
      expect(scaledFontSize(20, 0.85, 'default')).toBe(17);
      expect(scaledFontSize(20, 0.85, 'compact')).toBe(17);
    });

    it('applies no ceiling for the body role (reading scales freely)', () => {
      expect(scaledFontSize(16, 3, 'body')).toBe(48);
    });

    it('defends against a non-finite / non-positive OS scale by treating it as 1', () => {
      expect(scaledFontSize(16, NaN, 'default')).toBe(16);
      expect(scaledFontSize(16, 0, 'default')).toBe(16);
      expect(scaledFontSize(16, -2, 'default')).toBe(16);
    });
  });

  describe('FONT_SCALE_CAP policy', () => {
    it('orders caps body(none) > default > display > compact', () => {
      expect(FONT_SCALE_CAP.body).toBeUndefined();
      expect(FONT_SCALE_CAP.default).toBeGreaterThan(FONT_SCALE_CAP.display);
      expect(FONT_SCALE_CAP.display).toBeGreaterThan(FONT_SCALE_CAP.compact);
      // every numeric cap stays in the moderate 1.0–1.8 band the user approved
      expect(FONT_SCALE_CAP.default).toBeLessThanOrEqual(1.8);
      expect(FONT_SCALE_CAP.compact).toBeGreaterThanOrEqual(1.0);
    });
  });
});
