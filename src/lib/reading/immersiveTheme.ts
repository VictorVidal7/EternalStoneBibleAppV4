/**
 * 🌌 immersiveTheme — High-Contrast palette for the Immersive Reader.
 *
 * The immersive reading surface (S7) renders on its own bespoke "celestial"
 * palette (animated gradient + floating stars), independent of the normal
 * reader's themes. When the user picks the WCAG-AAA **High Contrast** reading
 * theme (S60), that celestial chrome — light text over a soft slate gradient
 * with decorative stars — is exactly what a low-vision reader was trying to
 * escape. This module exposes the immersive surface's High-Contrast colors,
 * sourced from the SAME shared `readerThemes['high-contrast']` palette so the
 * immersive view matches the normal reader's AAA contract (pure white on pure
 * black, amber accent) instead of drifting.
 *
 * PURE (no React/RN). Only the High-Contrast set lives here; every other
 * immersive theme keeps its existing celestial logic in the component.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {READER_THEMES, type ReaderThemeColors} from '@/styles/readerThemes';

export interface ImmersiveHighContrastColors {
  /** Full-bleed background (pure black). */
  background: string;
  /** Verse body text (pure white, 21:1). */
  text: string;
  /** Verse reference + secondary chrome (~18:1). */
  reference: string;
  /** Idle progress / seek caption (~12:1, still AAA for normal text). */
  caption: string;
  /** Accent: progress fill, seek thumb, active caption (amber, ~14.8:1). */
  accent: string;
}

/**
 * The immersive reader's High-Contrast colors, derived from the shared
 * `readerThemes['high-contrast']` palette so there is a single source of truth.
 */
export function immersiveHighContrastColors(): ImmersiveHighContrastColors {
  // 'high-contrast' is a statically-defined, non-null palette entry.
  const hc = READER_THEMES['high-contrast'] as ReaderThemeColors;
  return {
    background: hc.background,
    text: hc.text,
    reference: hc.textSecondary,
    caption: hc.textTertiary,
    accent: hc.primary,
  };
}
