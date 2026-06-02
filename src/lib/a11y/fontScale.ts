/**
 * ♿ fontScale — Dynamic-Type caps (honor OS font-scale without blowing layouts)
 *
 * React Native's `allowFontScaling` defaults to `true`, so every `<Text>`
 * already grows with the OS font-size setting. The problem is that the growth
 * is UNCAPPED: at a 200% system font, numeric counters, badges, tab labels and
 * other fixed-height chrome overflow and clip. iOS/Android both expose a
 * per-Text `maxFontSizeMultiplier` to bound that growth — and before this
 * sprint the app set it ZERO times.
 *
 * The accessibility-correct policy is NOT "cap everything" (that fights the
 * user's stated preference) — it's:
 *   • reading / long-form body text scales FREELY (`body` → no cap), so a
 *     low-vision reader gets the large verses they asked for;
 *   • display & numeric chrome that lives in a fixed box gets a TIGHT cap so
 *     the layout survives;
 *   • everything else gets a sane moderate default.
 *
 * This module is PURE (React-/RN-free) so the caps and the scaling math are
 * unit-testable, and so the `<AppText>` wrapper and any explicit
 * `maxFontSizeMultiplier` call-site share one source of truth.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/**
 * Upper bound on the OS font-scale multiplier, per text ROLE.
 *
 * `undefined` means "no cap" — the text honors the OS scale with no ceiling
 * (used for reading content). Numeric values are the maximum multiplier RN
 * will apply, regardless of how large the user's system font is.
 */
export const FONT_SCALE_CAP = {
  /** Reading surface / long-form body — let it grow (verse reader owns its own size). */
  body: undefined,
  /** General UI text — a sane moderate default. */
  default: 1.6,
  /** Headlines / large display numbers inside fixed-height chrome. */
  display: 1.3,
  /** Compact counters, pills, badges, tab labels — tightest budget. */
  compact: 1.2,
} as const;

export type FontScaleRole = keyof typeof FONT_SCALE_CAP;

/** The moderate default cap `<AppText>` applies when no role is given. */
export const DEFAULT_MAX_FONT_SCALE = FONT_SCALE_CAP.default;

/**
 * The `maxFontSizeMultiplier` value for a role (or `undefined` for "no cap").
 * Unknown roles fall back to the moderate default.
 */
export function maxFontScaleFor(
  role: FontScaleRole = 'default',
): number | undefined {
  return role in FONT_SCALE_CAP ? FONT_SCALE_CAP[role] : DEFAULT_MAX_FONT_SCALE;
}

/**
 * Pure model of what RN does natively: take a base font size, apply the OS
 * font-scale, but never let the *effective* multiplier exceed the role's cap.
 *
 * Mirrors the platform contract so we can assert the cap logic in tests:
 *   • an OS scale below 1 (small-font users) is honored as-is (never forced up);
 *   • an OS scale above the cap is clamped to the cap;
 *   • `body` (no cap) passes the OS scale straight through.
 *
 * @param baseSize  the unscaled font size in px
 * @param osScale   the OS font-scale multiplier (e.g. 1.0, 1.5, 2.0)
 * @param role      which cap to apply
 * @returns the effective font size in px (rounded to 2 decimals)
 */
export function scaledFontSize(
  baseSize: number,
  osScale: number,
  role: FontScaleRole = 'default',
): number {
  const cap = FONT_SCALE_CAP[role];
  const safeScale = Number.isFinite(osScale) && osScale > 0 ? osScale : 1;
  const effective = cap == null ? safeScale : Math.min(safeScale, cap);
  return Math.round(baseSize * effective * 100) / 100;
}
