/**
 * One-time gate for the "install a Spain voice" first-run prompt (58th session).
 *
 * On the first Spanish playback where no es-ES voice is available to pin (see
 * `shouldPromptForSpainVoice`), the mini player shows a single dismissible toast
 * offering to open the OS Text-to-speech settings. This flag makes it fire at
 * most once per install — device-local, never synced (a per-device UX nudge,
 * not user data), mirror of `playbackPositionStore.ts`.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {AUDIO_STORAGE_KEYS} from '../constants/audioConstants';

/** True once the prompt has been shown. Storage failure → treat as shown (a
 * flaky read must not let the prompt reappear on every playback). */
export async function wasSpainVoicePromptShown(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(
      AUDIO_STORAGE_KEYS.spainVoicePromptShown,
    );
    return raw === 'true';
  } catch (error) {
    logger.warn('Failed to read Spain-voice prompt flag', {
      error: String(error),
    });
    return true;
  }
}

/** Record that the prompt has been shown, so it never fires again. */
export async function markSpainVoicePromptShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(
      AUDIO_STORAGE_KEYS.spainVoicePromptShown,
      'true',
    );
  } catch (error) {
    logger.warn('Failed to persist Spain-voice prompt flag', {
      error: String(error),
    });
  }
}
