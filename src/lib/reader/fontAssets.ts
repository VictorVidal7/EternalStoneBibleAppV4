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
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as Font from 'expo-font';
import {Inter_400Regular, Inter_700Bold} from '@expo-google-fonts/inter';
import {Lora_400Regular, Lora_700Bold} from '@expo-google-fonts/lora';
import {
  ArchivoNarrow_400Regular,
  ArchivoNarrow_700Bold,
} from '@expo-google-fonts/archivo-narrow';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

/**
 * The `Font.loadAsync` map: family name → bundled `.ttf` module. Every name
 * here matches a `family`/`familyBold` in `READER_TYPEFACES`.
 */
export const READER_FONT_ASSETS = {
  Inter_400Regular,
  Inter_700Bold,
  Lora_400Regular,
  Lora_700Bold,
  ArchivoNarrow_400Regular,
  ArchivoNarrow_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
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
