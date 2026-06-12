import {contrastRatio, meetsAA, meetsAAA} from '../src/lib/a11y/contrast';
import {
  lightColors,
  darkColors,
  themePrimaryColors,
} from '../src/hooks/useTheme';

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

    it('onPrimary ink clears AA (large/UI) on the primary fill', () => {
      expect(meetsAA(contrastRatio(c.onPrimary, c.primary), true)).toBe(true);
    });
  });
});

/**
 * Sprint 80 — `onPrimary` is the ink for icons/labels drawn ON a
 * primary-filled control. Dark themes ship LIGHT primaries (midnight dark =
 * slate-300, café dark = yellow-400…), where a white glyph washes out; this
 * locks every theme × mode pair so a palette tweak can't silently reintroduce
 * white-on-light.
 */
describe('themeContrast — onPrimary ink across all color themes', () => {
  const pairs = Object.entries(themePrimaryColors).flatMap(([theme, modes]) => [
    {name: `${theme} light`, set: modes.light},
    {name: `${theme} dark`, set: modes.dark},
  ]);

  it.each(pairs)(
    '$name: onPrimary clears AA (large/UI) on primary',
    ({set}) => {
      expect(meetsAA(contrastRatio(set.onPrimary, set.primary), true)).toBe(
        true,
      );
    },
  );
});
