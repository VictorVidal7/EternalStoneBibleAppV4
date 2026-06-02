import {immersiveHighContrastColors} from '../src/lib/reading/immersiveTheme';
import {READER_THEMES} from '../src/styles/readerThemes';
import {contrastRatio} from '../src/lib/a11y/contrast';

describe('immersiveTheme — High-Contrast immersive palette', () => {
  const hc = READER_THEMES['high-contrast']!;
  const ic = immersiveHighContrastColors();

  it('sources every color from the shared high-contrast reader palette', () => {
    expect(ic.background).toBe(hc.background);
    expect(ic.text).toBe(hc.text);
    expect(ic.reference).toBe(hc.textSecondary);
    expect(ic.caption).toBe(hc.textTertiary);
    expect(ic.accent).toBe(hc.primary);
  });

  it('is pure white on pure black with an amber accent', () => {
    expect(ic.background).toBe('#000000');
    expect(ic.text).toBe('#FFFFFF');
    expect(ic.accent).toBe('#FFD60A');
  });

  it('clears WCAG AAA (>=7:1) for body text and reference on the background', () => {
    expect(contrastRatio(ic.text, ic.background)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(ic.reference, ic.background)).toBeGreaterThanOrEqual(
      7,
    );
    expect(contrastRatio(ic.caption, ic.background)).toBeGreaterThanOrEqual(7);
  });

  it('keeps the amber accent legible (AA large, >=3:1) on the background', () => {
    expect(contrastRatio(ic.accent, ic.background)).toBeGreaterThanOrEqual(3);
  });
});
