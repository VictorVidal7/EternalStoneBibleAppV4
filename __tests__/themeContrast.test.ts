import {contrastRatio, meetsAA, meetsAAA} from '../src/lib/a11y/contrast';
import {lightColors, darkColors} from '../src/hooks/useTheme';

/**
 * WCAG AA regression lock for the app's core text/background pairs. These all
 * pass today (computed once, asserted here); the test exists so a future token
 * tweak can't silently drop a primary surface below AA.
 *
 * `surface`/`card` are translucent in the light theme, so we measure against
 * the SOLID effective backgrounds (`background`, `surfaceVariant`).
 */
describe('themeContrast — core app theme meets WCAG', () => {
  const themes = [
    {name: 'light', c: lightColors},
    {name: 'dark', c: darkColors},
  ];

  describe.each(themes)('$name theme', ({c}) => {
    it('primary text clears AAA on the background', () => {
      expect(meetsAAA(contrastRatio(c.text, c.background))).toBe(true);
    });

    it('primary text clears AAA on the solid surface variant', () => {
      expect(meetsAAA(contrastRatio(c.text, c.surfaceVariant))).toBe(true);
    });

    it('secondary text clears AAA on the background', () => {
      expect(meetsAAA(contrastRatio(c.textSecondary, c.background))).toBe(true);
    });

    it('tertiary text clears AA (normal) on both solid backgrounds', () => {
      expect(meetsAA(contrastRatio(c.textTertiary, c.background))).toBe(true);
      expect(meetsAA(contrastRatio(c.textTertiary, c.surfaceVariant))).toBe(
        true,
      );
    });

    it('the primary accent clears AA for large/bold UI on the background', () => {
      // primary is used for links / active tints / large numbers (large-text bar)
      expect(meetsAA(contrastRatio(c.primary, c.background), true)).toBe(true);
    });

    it('error and success colors clear AA (large) on the background', () => {
      expect(meetsAA(contrastRatio(c.error, c.background), true)).toBe(true);
      expect(meetsAA(contrastRatio(c.success, c.background), true)).toBe(true);
    });
  });
});
