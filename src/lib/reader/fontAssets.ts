/**
 * 🔤 fontAssets — the bundled reader fonts + their runtime loader (Sprint 82).
 *
 * Kept SEPARATE from the pure [[typefaces]] catalog on purpose: this module
 * `require`s `.ttf` files, so it must never be pulled into a unit test (jest
 * would have to mock every asset). Only the startup loader imports it.
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
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as Font from 'expo-font';

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
} as const;

/**
 * Register the reader fonts. Best-effort and idempotent (expo-font no-ops a
 * face that is already loaded). Awaited behind the startup loading screen so
 * the reader's first paint already has the chosen face; if it ever rejects,
 * the caller swallows it and the text renders in the system default until a
 * later load succeeds — never blank.
 */
export async function loadReaderFonts(): Promise<void> {
  await Font.loadAsync(READER_FONT_ASSETS);
}
