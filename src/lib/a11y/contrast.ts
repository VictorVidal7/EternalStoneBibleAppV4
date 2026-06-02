/**
 * ♿ contrast — WCAG 2.1 relative-luminance & contrast-ratio math.
 *
 * Pure, dependency-free helpers used to (a) assert that the high-contrast
 * reading theme actually clears WCAG AAA in tests, and (b) audit chrome
 * foreground/background pairs during the accessibility pass.
 *
 * Reference: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *   • AA  normal text ≥ 4.5 : 1, large text ≥ 3 : 1
 *   • AAA normal text ≥ 7   : 1, large text ≥ 4.5 : 1
 *
 * Only solid `#RGB`/`#RRGGBB` colors are supported — translucent `rgba(...)`
 * tints must be composited over a known background before measuring, which is
 * out of scope for this helper (callers measure the solid pairs that matter).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface RGB {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
}

/**
 * Parse a `#RGB` or `#RRGGBB` hex string into 0–255 channels.
 * Throws on anything else so a typo in a palette can't silently pass a test.
 */
export function parseHexColor(hex: string): RGB {
  const cleaned = hex.trim().replace(/^#/, '');
  const expanded =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map(c => c + c)
          .join('')
      : cleaned;
  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    throw new Error(`parseHexColor: unsupported color "${hex}"`);
  }
  return {
    r: parseInt(expanded.slice(0, 2), 16),
    g: parseInt(expanded.slice(2, 4), 16),
    b: parseInt(expanded.slice(4, 6), 16),
  };
}

/** sRGB → linear, per the WCAG definition. */
function channelToLinear(value8bit: number): number {
  const c = value8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a color (0 = black, 1 = white). */
export function relativeLuminance(color: RGB | string): number {
  const {r, g, b} = typeof color === 'string' ? parseHexColor(color) : color;
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/**
 * Contrast ratio between two colors, in the range [1, 21].
 * Order-independent (lighter/darker is resolved internally).
 */
export function contrastRatio(a: RGB | string, b: RGB | string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA: ≥ 4.5 normal text, ≥ 3 large text (≥18pt or 14pt bold). */
export function meetsAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? 3 : 4.5);
}

/** WCAG AAA: ≥ 7 normal text, ≥ 4.5 large text. */
export function meetsAAA(ratio: number, largeText = false): boolean {
  return ratio >= (largeText ? 4.5 : 7);
}
