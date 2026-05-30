/**
 * 📖 READER THEMES — paper / sepia / night reading palettes
 *
 * A reading-surface palette that overrides the app's global light/dark
 * theme *for the verse reader only* (header + toolbar + verse canvas),
 * leaving the tab bar and every other screen on the app theme — exactly
 * how a premium Bible reader keeps its reading theme independent of the
 * app chrome.
 *
 * The default theme is `system` (null palette → the reader falls through
 * to the app's `useTheme()` colors), so an existing user who never opens
 * the new control sees ZERO visual change. Mirrors the "defaults match
 * legacy" philosophy of [[ReaderPreferencesContext]].
 *
 * This module is PURE (React-/RN-free) so it can be unit-tested and reused
 * by both the reader screen and the live preview in the preferences sheet.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export type ReaderTheme = 'system' | 'paper' | 'sepia' | 'night';

/** Stable display order for the theme picker. */
export const READER_THEME_ORDER: ReaderTheme[] = [
  'system',
  'paper',
  'sepia',
  'night',
];

/**
 * The reading-surface colors a palette overrides. These map onto the exact
 * keys the reader consumes from `effectiveColors` inside `styles.container`
 * plus two reader-specific extras (`audioHighlight`, `onHighlight`) that
 * used to be hard-coded hexes in the reader.
 */
export interface ReaderThemeColors {
  /** Verse canvas background. */
  background: string;
  /** Header / toolbar / nav-bar surface. */
  surface: string;
  /** Primary verse text. */
  text: string;
  /** Secondary labels (toolbar captions, side-by-side companion). */
  textSecondary: string;
  /** Disabled / tertiary (e.g. a disabled chapter arrow). */
  textTertiary: string;
  /** Hairline dividers and borders. */
  border: string;
  /** Accent: verse numbers, inline reference links, active toolbar tint. */
  primary: string;
  /** Selected-verse text color. */
  primaryDark: string;
  /** Verse-highlight background tint. */
  primaryLight: string;
  /** Text + number color of the verse currently being read aloud (TTS). */
  audioHighlight: string;
  /** Text drawn over a user's highlight swatch (kept legible on any swatch). */
  onHighlight: string;
}

/**
 * Extras the reader needs regardless of theme. For `system` these are the
 * historical hard-coded reader hexes so the surface stays byte-identical to
 * pre-Sprint-54 behaviour.
 */
export const LEGACY_AUDIO_HIGHLIGHT = '#D4AF37'; // soft gold (legacy)
export const LEGACY_ON_HIGHLIGHT = '#1A1D2E'; // app navy (legacy)

/**
 * Concrete palettes. `system` is intentionally `null` — the resolver maps it
 * to the live app theme. Each non-system palette is fully self-contained so
 * the reading surface is internally consistent on its own background.
 */
export const READER_THEMES: Record<ReaderTheme, ReaderThemeColors | null> = {
  system: null,

  // Warm off-white "paper" — gentle on a bright room, classic book feel.
  paper: {
    background: '#FBF7EF',
    surface: '#F3ECDE',
    text: '#2B2A26',
    textSecondary: '#6B6457',
    textTertiary: '#A79E8C',
    border: 'rgba(120, 110, 90, 0.20)',
    primary: '#B5793F',
    primaryDark: '#7A4E27',
    primaryLight: 'rgba(181, 121, 63, 0.15)',
    audioHighlight: '#9A6A1F',
    onHighlight: '#2B2A26',
  },

  // Classic cream/brown "sepia" — the lowest-glare daytime reading surface.
  sepia: {
    background: '#F1E4CC',
    surface: '#E7D6B8',
    text: '#4A3B28',
    textSecondary: '#6E5A3E',
    textTertiary: '#998761',
    border: 'rgba(120, 95, 60, 0.25)',
    primary: '#8A5A2B',
    primaryDark: '#6B4420',
    primaryLight: 'rgba(138, 90, 43, 0.16)',
    audioHighlight: '#8A5A1A',
    onHighlight: '#4A3B28',
  },

  // True-dark, low-blue "night" — warm off-white text on near-black, gold accent.
  night: {
    background: '#0E0E10',
    surface: '#17171A',
    text: '#D8D2C4',
    textSecondary: '#A39E92',
    textTertiary: '#6E6A60',
    border: 'rgba(180, 170, 150, 0.16)',
    primary: '#C9A86A',
    primaryDark: '#E0C892',
    primaryLight: 'rgba(201, 168, 106, 0.15)',
    audioHighlight: '#E6C77A',
    onHighlight: '#1A1A1A',
  },
};

/** Type guard for a persisted/foreign `theme` value. */
export function isReaderTheme(value: unknown): value is ReaderTheme {
  return (
    value === 'system' ||
    value === 'paper' ||
    value === 'sepia' ||
    value === 'night'
  );
}

/** The reading-surface extras every resolved theme exposes. */
export interface ReaderThemeExtras {
  audioHighlight: string;
  onHighlight: string;
}

/**
 * Merge a reader palette onto the live app colors. Generic in the app-color
 * shape so every non-reading key (warning, error, …) is preserved untouched.
 *
 * - `system` (or any unknown value) → the app colors verbatim + the legacy
 *   gold/navy extras (byte-identical to the pre-Sprint-54 reader).
 * - any concrete palette → the app colors with the reading-surface keys
 *   overridden + the palette's own audio/on-highlight extras.
 */
export function resolveReaderTheme<T extends object>(
  appColors: T,
  theme: ReaderTheme,
): T & ReaderThemeColors & ReaderThemeExtras {
  const palette = isReaderTheme(theme) ? READER_THEMES[theme] : null;
  if (!palette) {
    return {
      ...appColors,
      audioHighlight: LEGACY_AUDIO_HIGHLIGHT,
      onHighlight: LEGACY_ON_HIGHLIGHT,
    } as T & ReaderThemeColors & ReaderThemeExtras;
  }
  return {...appColors, ...palette} as T &
    ReaderThemeColors &
    ReaderThemeExtras;
}
