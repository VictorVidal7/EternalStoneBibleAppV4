/**
 * 🔡 typefaces — PURE reader typeface catalog (Sprint 71, rebuilt Sprint 82).
 *
 * Originally this mapped each reading face to an Android/iOS SYSTEM family name
 * ('serif', 'monospace', 'sans-serif-condensed'…). That works on AOSP/Pixel but
 * a real user reported — twice — that NOTHING changed on his device: many OEM
 * Android builds don't resolve those bare generic family names, so every face
 * silently fell back to the default sans ("solo toma 1 sola"). The fix is to
 * stop depending on the OS font table and BUNDLE real, OFL-licensed faces,
 * loaded at runtime through expo-font (already autolinked — Ionicons uses it),
 * so the typeface is guaranteed distinct on EVERY device with no native rebuild.
 *
 * This module stays PURE (no `.ttf` imports → unit-testable without asset
 * mocking). The actual font files + the `Font.loadAsync` map live in the sibling
 * [[fontAssets]] module, which is only pulled in by the startup loader. The
 * family-name strings here are exactly the keys that module registers, and they
 * are identical on iOS and Android once loaded — so there is no per-platform
 * branch anymore.
 *
 * `sans`/`serif`/`condensed`/`mono` keep their ids, so a preference persisted
 * before this sprint still resolves to a sensible face.
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
  /**
   * Regular-weight family name — the exact key registered by [[fontAssets]]'s
   * `Font.loadAsync` call, usable directly as an RN `Text` `fontFamily`.
   */
  family: string;
  /**
   * Bold-weight (700) family name. RN does NOT synthesize a faux-bold for a
   * statically-loaded asset family, so any bold run over reader text (the verse
   * number, the picker sample) must switch to this family explicitly rather
   * than relying on `fontWeight`.
   */
  familyBold: string;
}

/**
 * The curated catalog — four visibly distinct, freely-licensed reading faces:
 *   - sans      → Inter           (humanist, the new default body face)
 *   - serif     → Lora            (calm book serif, ideal for scripture)
 *   - condensed → Archivo Narrow  (genuinely narrow — fits more per line)
 *   - mono      → JetBrains Mono  (even-width, study/technical feel)
 */
export const READER_TYPEFACES: Record<ReaderFontFamily, TypefaceSpec> = {
  sans: {
    id: 'sans',
    labelKey: 'fontSans',
    sample: 'Aa',
    family: 'Inter_400Regular',
    familyBold: 'Inter_700Bold',
  },
  serif: {
    id: 'serif',
    labelKey: 'fontSerif',
    sample: 'Aa',
    family: 'Lora_400Regular',
    familyBold: 'Lora_700Bold',
  },
  condensed: {
    id: 'condensed',
    labelKey: 'fontCondensed',
    sample: 'Aa',
    family: 'ArchivoNarrow_400Regular',
    familyBold: 'ArchivoNarrow_700Bold',
  },
  mono: {
    id: 'mono',
    labelKey: 'fontMono',
    sample: 'Aa',
    family: 'JetBrainsMono_400Regular',
    familyBold: 'JetBrainsMono_700Bold',
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
 * Resolve a typeface id to the regular-weight `fontFamily` value to set on an
 * RN `Text`. Always a bundled family (no `undefined`): an unknown/corrupt id
 * falls back to the default sans face rather than the OS default. If the font
 * is not yet loaded, Android renders it in the system default until the load
 * completes — never blank — so awaiting the load before first paint avoids any
 * flash.
 */
export function resolveTypeface(family: ReaderFontFamily): string {
  return (READER_TYPEFACES[family] ?? READER_TYPEFACES.sans).family;
}

/** Resolve a typeface id to its bold-weight (700) `fontFamily`. */
export function resolveTypefaceBold(family: ReaderFontFamily): string {
  return (READER_TYPEFACES[family] ?? READER_TYPEFACES.sans).familyBold;
}
