import {contrastRatio, meetsAA, meetsAAA} from '../src/lib/a11y/contrast';
import {HIGH_CONTRAST_COLORS} from '../src/hooks/useTheme';

describe('HIGH_CONTRAST_COLORS — app-wide alto contraste WCAG compliance', () => {
  const hc = HIGH_CONTRAST_COLORS;

  it('clears WCAG AAA (7:1) for primary text on the background', () => {
    const ratio = contrastRatio(hc.text, hc.background);
    expect(meetsAAA(ratio)).toBe(true);
    // pure white on pure black is the 21:1 maximum
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('clears AAA for secondary & tertiary text on the background', () => {
    expect(meetsAAA(contrastRatio(hc.textSecondary, hc.background))).toBe(true);
    expect(meetsAAA(contrastRatio(hc.textTertiary, hc.background))).toBe(true);
  });

  it('keeps primary text legible on the solid surface & surfaceVariant too (AAA)', () => {
    expect(meetsAAA(contrastRatio(hc.text, hc.surface))).toBe(true);
    expect(meetsAAA(contrastRatio(hc.text, hc.surfaceVariant))).toBe(true);
  });

  it('uses an accent (primary) that clears AAA on the background', () => {
    const ratio = contrastRatio(hc.primary, hc.background);
    expect(meetsAA(ratio)).toBe(true);
    expect(meetsAAA(ratio)).toBe(true);
  });

  it('keeps onPrimary ink legible over the primary fill (AAA)', () => {
    expect(meetsAAA(contrastRatio(hc.onPrimary, hc.primary))).toBe(true);
  });

  // Semantic accents can't be BOTH AAA-on-black and recognizably their own
  // hue (red/green/orange) — held to the same large/UI-text AA bar
  // `themeContrast.test` already applies to every other theme's error/success.
  it('error/success/warning clear AA (large/UI) on the background', () => {
    expect(meetsAA(contrastRatio(hc.error, hc.background), true)).toBe(true);
    expect(meetsAA(contrastRatio(hc.success, hc.background), true)).toBe(true);
    expect(meetsAA(contrastRatio(hc.warning, hc.background), true)).toBe(true);
  });
});
