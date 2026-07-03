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

export type ReaderTheme =
  | 'system'
  | 'paper'
  | 'sepia'
  | 'night'
  | 'high-contrast'
  | 'musgo'
  | 'crepusculo'
  | 'niebla';

/** Stable display order for the theme picker. */
export const READER_THEME_ORDER: ReaderTheme[] = [
  'system',
  'paper',
  'sepia',
  'night',
  'high-contrast',
  // T6.3 — offering-unlocked exclusives, always last (see PREMIUM_READER_THEMES).
  'musgo',
  'crepusculo',
  'niebla',
];

/**
 * Reading-surface palettes gated behind a voluntary offering (T6 — Nuevos
 * extras premium). Musgo/Crepúsculo/Niebla (T6.3) are brand-new exclusive
 * additions with no history — gating them never took anything away.
 *
 * Sepia (T6.3b) is different: it's one of the 5 *original* free surfaces, so
 * moving it behind the gate risks breaking the "premium never removes
 * something a user already had" rule. The fix is grandfathering, not a plain
 * gate — any device whose persisted preferences already had `theme: 'sepia'`
 * before this gate shipped gets a permanent, device-local
 * `sepiaGrandfathered` flag (captured once, at hydration — see
 * [[ReaderPreferencesContext]]) that keeps Sepia unlocked for that device
 * forever, premium or not. New installs and devices that had a different
 * theme selected are correctly gated like any other exclusive.
 *
 * Never consult this array alone to decide whether a theme is usable —
 * always go through `isReaderThemeUnlocked`, which folds in the
 * grandfathering exception.
 */
export const PREMIUM_READER_THEMES: ReaderTheme[] = [
  'sepia',
  'musgo',
  'crepusculo',
  'niebla',
];

/**
 * Whether `theme` is currently usable — i.e. selecting it should apply it
 * directly rather than open the offering sheet.
 *
 * Mirrors the `isTemplateUnlocked`/`isTextureUnlocked` pattern in
 * `src/features/share/` (a free/non-gated value is always unlocked; a gated
 * value needs `isPremium`), plus the one grandfathering exception: Sepia
 * stays unlocked on a device that already had it selected before the gate
 * existed, tracked by the device-local `sepiaGrandfathered` flag.
 */
export function isReaderThemeUnlocked(
  theme: ReaderTheme,
  isPremium: boolean,
  sepiaGrandfathered: boolean,
): boolean {
  if (!PREMIUM_READER_THEMES.includes(theme)) return true;
  if (isPremium) return true;
  return theme === 'sepia' && sepiaGrandfathered;
}

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
  // T6.3b — offering-gated, but grandfathered for any device that already
  // had it selected (see `isReaderThemeUnlocked` above).
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

  // Maximum-legibility "high contrast" — pure white text on pure black with a
  // bright amber accent. Every solid text/background pair clears WCAG AAA (7:1)
  // for low-vision readers; the value is asserted in readerThemesContrast.test.
  // (A true-dark surface, so readerIsDark treats it like night.)
  'high-contrast': {
    background: '#000000',
    surface: '#0A0A0A',
    text: '#FFFFFF', // 21:1 on background
    textSecondary: '#EDEDED', // ~18:1
    textTertiary: '#C7C7C7', // ~12:1 (still AAA for normal text)
    border: 'rgba(255, 255, 255, 0.45)', // visible hairline on black
    primary: '#FFD60A', // amber accent, ~14.8:1 on black
    primaryDark: '#FFFFFF', // selected-verse text: white, max contrast
    primaryLight: 'rgba(255, 214, 10, 0.20)', // highlight tint over black
    audioHighlight: '#FFD60A', // actively-read verse: bright amber
    onHighlight: '#000000', // black over a user's bright highlight swatch
  },

  // ===== T6.3 — premium exclusives (offering-unlocked) =====

  // Soft sage-green "moss" paper — a cool, calming alternative to the warm
  // paper/sepia tones above.
  musgo: {
    background: '#F1F3EA',
    surface: '#E5E9D8',
    text: '#2A2E22',
    textSecondary: '#5C6350',
    textTertiary: '#6F7660',
    border: 'rgba(90, 110, 70, 0.20)',
    primary: '#4C6633',
    primaryDark: '#324420',
    primaryLight: 'rgba(76, 102, 51, 0.15)',
    audioHighlight: '#5C7A3A',
    onHighlight: '#2A2E22',
  },

  // Cool blue-toned dark "twilight" — an alternative to Night's warm
  // black+gold for readers who prefer a cooler evening surface.
  crepusculo: {
    background: '#0D1220',
    surface: '#161D30',
    text: '#DCE3F0',
    textSecondary: '#A8B4CC',
    textTertiary: '#8390AC',
    border: 'rgba(150, 165, 200, 0.16)',
    primary: '#7FA8D9',
    primaryDark: '#A8C4E8',
    primaryLight: 'rgba(127, 168, 217, 0.15)',
    audioHighlight: '#8FBBEE',
    onHighlight: '#0D1220',
  },

  // Soft cool gray-blue "mist" — a light surface distinct from the warm
  // cream tones of paper/sepia, gentle and modern.
  niebla: {
    background: '#F2F4F7',
    surface: '#E6EAF0',
    text: '#262B33',
    textSecondary: '#5B6472',
    textTertiary: '#5F6977',
    border: 'rgba(90, 105, 130, 0.18)',
    primary: '#3D5F8F',
    primaryDark: '#2A4265',
    primaryLight: 'rgba(61, 95, 143, 0.14)',
    audioHighlight: '#33507A',
    onHighlight: '#262B33',
  },
};

/** Type guard for a persisted/foreign `theme` value. */
export function isReaderTheme(value: unknown): value is ReaderTheme {
  return (
    value === 'system' ||
    value === 'paper' ||
    value === 'sepia' ||
    value === 'night' ||
    value === 'high-contrast' ||
    value === 'musgo' ||
    value === 'crepusculo' ||
    value === 'niebla'
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
