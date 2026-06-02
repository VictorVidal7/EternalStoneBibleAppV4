import {contrastRatio, meetsAA, meetsAAA} from '../src/lib/a11y/contrast';
import {
  READER_THEMES,
  READER_THEME_ORDER,
  isReaderTheme,
  resolveReaderTheme,
} from '../src/styles/readerThemes';

describe('readerThemes — high-contrast palette WCAG compliance', () => {
  const hc = READER_THEMES['high-contrast'];

  it('exists, is registered in the order and recognized by the guard', () => {
    expect(hc).toBeTruthy();
    expect(READER_THEME_ORDER).toContain('high-contrast');
    expect(isReaderTheme('high-contrast')).toBe(true);
  });

  it('clears WCAG AAA (7:1) for primary text on the canvas background', () => {
    const ratio = contrastRatio(hc!.text, hc!.background);
    expect(ratio).toBeGreaterThanOrEqual(7);
    expect(meetsAAA(ratio)).toBe(true);
    // pure white on pure black is the 21:1 maximum
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('clears AAA for secondary & tertiary text on the background', () => {
    expect(meetsAAA(contrastRatio(hc!.textSecondary, hc!.background))).toBe(
      true,
    );
    expect(meetsAAA(contrastRatio(hc!.textTertiary, hc!.background))).toBe(
      true,
    );
  });

  it('keeps primary text legible on the chrome surface too (AAA)', () => {
    expect(meetsAAA(contrastRatio(hc!.text, hc!.surface))).toBe(true);
  });

  it('uses an accent that clears AAA on the background', () => {
    // The amber accent (verse numbers / links / active tint).
    const ratio = contrastRatio(hc!.primary, hc!.background);
    expect(meetsAA(ratio)).toBe(true);
    expect(meetsAAA(ratio)).toBe(true);
  });

  it('keeps onHighlight legible over the bright accent swatch (AAA)', () => {
    // A user highlight swatch is drawn in `primary`; the text over it is
    // `onHighlight` — black on amber must stay readable.
    expect(meetsAAA(contrastRatio(hc!.onHighlight, hc!.primary))).toBe(true);
  });

  it('resolves through resolveReaderTheme without dropping any key', () => {
    const resolved = resolveReaderTheme({} as object, 'high-contrast');
    expect(resolved.background).toBe('#000000');
    expect(resolved.text).toBe('#FFFFFF');
    expect(resolved.audioHighlight).toBe('#FFD60A');
    expect(resolved.onHighlight).toBe('#000000');
  });
});
