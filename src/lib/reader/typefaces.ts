/**
 * 🔡 typefaces — PURE reader typeface catalog (Sprint 71).
 *
 * The reader already let you pick a reading font, but only as a hard-coded
 * binary sans/serif toggle with the platform resolution inlined in
 * `ReaderPreferencesSheet`. This lifts that into a tested catalog (mirroring
 * `imageTemplates.ts` / `readerThemes.ts`) and curates a small set of reading
 * faces — every one a font family GUARANTEED to ship with iOS and Android, so
 * there is NO bundled font and NO native rebuild: an unknown family string just
 * falls back to the platform default, never crashes.
 *
 * `sans`/`serif` keep their original ids + resolution, so a persisted
 * preference from before this sprint still resolves identically.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** A reader typeface id. Persisted in `@reader_preferences.fontFamily`. */
export type ReaderFontFamily = 'sans' | 'serif' | 'condensed' | 'mono';

/** Order the typefaces appear in the picker. */
export const READER_FONT_FAMILY_ORDER: ReaderFontFamily[] = [
  'sans',
  'serif',
  'condensed',
  'mono',
];

interface TypefaceSpec {
  id: ReaderFontFamily;
  /** Key under `t.readerPrefs` for the human label. */
  labelKey: 'fontSans' | 'fontSerif' | 'fontCondensed' | 'fontMono';
  /** Glyph sample shown on the picker card. */
  sample: string;
  /** iOS system font name (PostScript/family), or undefined for the default. */
  ios?: string;
  /** Android system family name, or undefined for the default. */
  android?: string;
}

/**
 * The curated catalog. Each `ios`/`android` value is a family that the OS
 * provides out of the box:
 *   - sans      → platform default (undefined on both)
 *   - serif     → Georgia (iOS) / 'serif' = Noto Serif (Android)
 *   - condensed → Avenir Next Condensed (iOS) / 'sans-serif-condensed' (Android)
 *   - mono      → Courier New (iOS) / 'monospace' (Android)
 */
export const READER_TYPEFACES: Record<ReaderFontFamily, TypefaceSpec> = {
  sans: {id: 'sans', labelKey: 'fontSans', sample: 'Aa'},
  serif: {
    id: 'serif',
    labelKey: 'fontSerif',
    sample: 'Aa',
    ios: 'Georgia',
    android: 'serif',
  },
  condensed: {
    id: 'condensed',
    labelKey: 'fontCondensed',
    sample: 'Aa',
    ios: 'Avenir Next Condensed',
    android: 'sans-serif-condensed',
  },
  mono: {
    id: 'mono',
    labelKey: 'fontMono',
    sample: 'Aa',
    ios: 'Courier New',
    android: 'monospace',
  },
};

/** Whether a value is a known reader typeface id (for sanitizing persisted blobs). */
export function isReaderFontFamily(value: unknown): value is ReaderFontFamily {
  return (
    value === 'sans' ||
    value === 'serif' ||
    value === 'condensed' ||
    value === 'mono'
  );
}

/**
 * Line-height ratio for the immersive reader's verse text (Sprint 81). The
 * immersive Text shipped a FIXED lineHeight of 36 under a font size the user
 * scales 16–32: at 32 the ratio collapsed to ~1.1 (descenders touching the
 * next line), at 16 the lines floated apart. One ratio scaled with the chosen
 * size keeps the default look (22 → 35 ≈ the old 36) and stays airy at the
 * extremes.
 */
export const IMMERSIVE_LINE_HEIGHT_RATIO = 1.6;

/** The immersive verse lineHeight for a given fontSize (whole dp). */
export function immersiveLineHeight(fontSize: number): number {
  return Math.round(fontSize * IMMERSIVE_LINE_HEIGHT_RATIO);
}

/**
 * Resolve a typeface id to a `fontFamily` value safe to set on an RN `Text`,
 * for the given platform ('ios' | 'android'). `sans` (and any unknown id)
 * resolves to `undefined` → the platform's native default sans. Pure: the
 * platform is a parameter so the mapping is unit-testable on both targets.
 */
export function resolveTypeface(
  family: ReaderFontFamily,
  platform: 'ios' | 'android',
): string | undefined {
  const spec = READER_TYPEFACES[family];
  if (!spec) return undefined;
  return platform === 'ios' ? spec.ios : spec.android;
}
