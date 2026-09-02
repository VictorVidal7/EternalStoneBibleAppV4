/**
 * 58th session — the one-shot gate for the "install a Spain voice" first-run
 * prompt ([[essb-58th-session-tts-fallback-and-backlog]]).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  wasSpainVoicePromptShown,
  markSpainVoicePromptShown,
} from '../src/features/audio/lib/spainVoicePromptStore';
import {AUDIO_STORAGE_KEYS} from '../src/features/audio/constants/audioConstants';

describe('spainVoicePromptStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('reports not-shown on a fresh install', async () => {
    await expect(wasSpainVoicePromptShown()).resolves.toBe(false);
  });

  it('persists the shown flag and reads it back', async () => {
    await markSpainVoicePromptShown();
    await expect(wasSpainVoicePromptShown()).resolves.toBe(true);
    await expect(
      AsyncStorage.getItem(AUDIO_STORAGE_KEYS.spainVoicePromptShown),
    ).resolves.toBe('true');
  });

  it('treats a storage read failure as "already shown" (never re-nag)', async () => {
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('sqlite is having a day'));
    await expect(wasSpainVoicePromptShown()).resolves.toBe(true);
  });

  it('swallows a storage write failure', async () => {
    jest
      .spyOn(AsyncStorage, 'setItem')
      .mockRejectedValueOnce(new Error('disk full'));
    await expect(markSpainVoicePromptShown()).resolves.toBeUndefined();
  });
});
