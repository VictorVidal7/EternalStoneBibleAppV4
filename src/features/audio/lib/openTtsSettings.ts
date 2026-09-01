/**
 * Deep-link into Android's system Text-to-speech settings screen (57th/58th
 * session — the es-ES voice fallback).
 *
 * The narration's "-dle" archaic-imperative class ("alabadle" …) is only
 * pronounced correctly by a genuine Castilian voice, and there is no text fix
 * (56th session). On a phone with Latin-America Spanish voice data only,
 * `pickDefaultSpanishVoiceId` returns undefined and the user needs to add the
 * "Español (España)" voice from the OS TTS settings — this opens that screen
 * for them.
 *
 * Android only: iOS has no equivalent public settings deep-link and its
 * Spanish voices don't have the same defect. The action string
 * `com.android.settings.TTS_SETTINGS` was verified on-device (emulator-5554,
 * Android 16 — it resolves to `Settings$TextToSpeechSettingsActivity`); the
 * documented constant `android.settings.TTS_SETTINGS` does NOT resolve there.
 * `Linking.sendIntent` rejects when no activity handles the action, so we fall
 * back to the top-level Settings screen, then swallow.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import {Linking, Platform} from 'react-native';
import {logger} from '@lib/utils/logger';

/** Verified on-device; NOT the (non-resolving) documented `android.settings.*`. */
const TTS_SETTINGS_ACTION = 'com.android.settings.TTS_SETTINGS';
const SETTINGS_FALLBACK_ACTION = 'android.settings.SETTINGS';

/**
 * Open the device's Text-to-speech settings. No-op off Android. Best-effort:
 * every failure path is logged at warn and swallowed — a settings deep-link
 * that doesn't open is a papercut, never a crash.
 */
export async function openTtsSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Linking.sendIntent(TTS_SETTINGS_ACTION);
  } catch {
    try {
      await Linking.sendIntent(SETTINGS_FALLBACK_ACTION);
    } catch (err) {
      logger.warn('Error opening TTS settings', {error: String(err)});
    }
  }
}
