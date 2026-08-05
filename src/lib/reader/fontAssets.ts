/**
 * 🔤 fontAssets — the bundled reader fonts + their runtime loader (Sprint 82).
 *
 * Kept SEPARATE from the pure [[typefaces]] catalog on purpose: this module
 * `require`s `.ttf` files. jest-expo's `assetFileTransformer` handles `.ttf`
 * like any other asset extension, so this module IS unit-testable (see
 * `__tests__/fontAssets.test.ts`) — only the actual native/web asset content
 * is opaque, not the loader logic.
 *
 * The keys here are the family names the rest of the app sets as `fontFamily`
 * (see `READER_TYPEFACES` in [[typefaces]]). expo-font is already autolinked
 * (Ionicons depends on it), so loading these at runtime needs no native
 * rebuild — and the same family name resolves on both iOS and Android.
 *
 * We load Regular + Bold per face: the verse number and the picker sample are
 * bold runs, and RN won't fake-bold a static asset family.
 *
 * BUNDLE SIZE (Sprint 83): we `require` each `.ttf` by its DIRECT path instead
 * of `import {Inter_400Regular} from '@expo-google-fonts/inter'`. The package
 * index re-exports ALL ~18 weights, so importing from it dragged every unused
 * weight into the APK (~50 stray `.ttf`). The per-weight path ships only the
 * eight regular/bold files actually registered here — Metro resolves `.ttf`
 * through its asset plugin, so each `require` is just the one font module.
 *
 * WEB STARTUP COST (perf fix, Sprint 84): expo-font's WEB loader does more
 * than declare a lazy CSS `@font-face` — for every family passed to
 * `Font.loadAsync`, it also renders a hidden probe glyph and polls it (a
 * `FontFaceObserver`-style forced load) specifically to make the browser
 * fetch the file RIGHT NOW instead of waiting for real text to need it. That
 * means calling `loadReaderFonts()` (all 18 files, ~3.58MB) on web forces the
 * whole catalog to download unconditionally on every page load, whether or
 * not the visible reader even applies a `fontFamily` today. Native does not
 * have this problem — its loader is a real async font registration with no
 * forced-fetch side effect — so `loadReaderFonts()` stays the all-18 native
 * loader (see `app/_layout.tsx`, which fires it in a background
 * non-blocking `Promise.all`). WEB instead calls [[loadFontFamily]] for only
 * the user's currently-active family (see `app/_layout.web.tsx`), and the
 * remaining families stay untouched — never fetched — until something (a
 * future font-picker UI) explicitly calls `loadFontFamily` for them.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as Font from 'expo-font';
import {READER_TYPEFACES, ReaderFontFamily} from './typefaces';

/**
 * The `Font.loadAsync` map: family name → bundled `.ttf` module. Every name
 * here matches a `family`/`familyBold` in `READER_TYPEFACES`.
 */
export const READER_FONT_ASSETS = {
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
  Lora_400Regular: require('@expo-google-fonts/lora/400Regular/Lora_400Regular.ttf'),
  Lora_700Bold: require('@expo-google-fonts/lora/700Bold/Lora_700Bold.ttf'),
  AtkinsonHyperlegible_400Regular: require('@expo-google-fonts/atkinson-hyperlegible/400Regular/AtkinsonHyperlegible_400Regular.ttf'),
  AtkinsonHyperlegible_700Bold: require('@expo-google-fonts/atkinson-hyperlegible/700Bold/AtkinsonHyperlegible_700Bold.ttf'),
  EBGaramond_400Regular: require('@expo-google-fonts/eb-garamond/400Regular/EBGaramond_400Regular.ttf'),
  EBGaramond_700Bold: require('@expo-google-fonts/eb-garamond/700Bold/EBGaramond_700Bold.ttf'),
  ArchivoNarrow_400Regular: require('@expo-google-fonts/archivo-narrow/400Regular/ArchivoNarrow_400Regular.ttf'),
  ArchivoNarrow_700Bold: require('@expo-google-fonts/archivo-narrow/700Bold/ArchivoNarrow_700Bold.ttf'),
  JetBrainsMono_400Regular: require('@expo-google-fonts/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf'),
  JetBrainsMono_700Bold: require('@expo-google-fonts/jetbrains-mono/700Bold/JetBrainsMono_700Bold.ttf'),
  // T6.2 — offering-unlocked exclusive faces.
  RobotoSlab_400Regular: require('@expo-google-fonts/roboto-slab/400Regular/RobotoSlab_400Regular.ttf'),
  RobotoSlab_700Bold: require('@expo-google-fonts/roboto-slab/700Bold/RobotoSlab_700Bold.ttf'),
  Spectral_400Regular: require('@expo-google-fonts/spectral/400Regular/Spectral_400Regular.ttf'),
  Spectral_700Bold: require('@expo-google-fonts/spectral/700Bold/Spectral_700Bold.ttf'),
  Nunito_400Regular: require('@expo-google-fonts/nunito/400Regular/Nunito_400Regular.ttf'),
  Nunito_700Bold: require('@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf'),
} as const;

/**
 * Register ALL 18 bundled reader fonts. Best-effort and idempotent
 * (expo-font no-ops a face that is already loaded). NATIVE-ONLY in practice:
 * `app/_layout.tsx` fires this unawaited inside a background `Promise.all`,
 * never blocking first paint there, and native's loader has no forced-fetch
 * side effect so loading all 18 up front is cheap. Do NOT call this from web
 * startup — see the module doc comment and [[loadFontFamily]].
 */
export async function loadReaderFonts(): Promise<void> {
  await Font.loadAsync(READER_FONT_ASSETS);
}

/**
 * Register a single typeface family's two weights (Regular + Bold) — e.g.
 * `loadFontFamily('serif')` loads only `Lora_400Regular` + `Lora_700Bold`,
 * never the other 16 files. Best-effort and idempotent, same contract as
 * `loadReaderFonts`.
 *
 * This is what WEB startup calls for just the user's currently-active
 * family (see `app/_layout.web.tsx`), and what a future font-picker UI can
 * call on demand the moment the user switches to a different family —
 * lazy-loading it then, rather than never being able to load it at all. An
 * unrecognized `familyId` (e.g. a corrupted persisted preference that slipped
 * past `isReaderFontFamily`) falls back to `sans`, mirroring
 * `resolveTypeface`'s own fallback.
 */
export async function loadFontFamily(
  familyId: ReaderFontFamily,
): Promise<void> {
  const spec = READER_TYPEFACES[familyId] ?? READER_TYPEFACES.sans;
  const regularKey = spec.family as keyof typeof READER_FONT_ASSETS;
  const boldKey = spec.familyBold as keyof typeof READER_FONT_ASSETS;
  await Font.loadAsync({
    [spec.family]: READER_FONT_ASSETS[regularKey],
    [spec.familyBold]: READER_FONT_ASSETS[boldKey],
  });
}
