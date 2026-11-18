/**
 * R9-30, S165 — the audio player re-reads `@audio_preferences` on a restore.
 *
 * The key travels in `payload.local`. `AudioPlayerProvider` sits at the root
 * and hydrated it once, on mount: after a restore it kept the old speed,
 * audio language, continuous playback, reader follow and pinned voice in
 * memory until a restart.
 *
 * Lo REAL: AudioPlayerProvider, its savePreferences and the restore signal,
 * over the AsyncStorage mock. Lo sustituido: expo-speech (the voice list) and
 * expo-haptics.
 */
import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import {
  __resetBackupRestoredListenersForTests,
  emitBackupRestored,
} from '../src/lib/backup/restoreSignal';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {Light: 'light', Medium: 'medium', Heavy: 'heavy'},
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

const KEY = '@audio_preferences';

const HERE_VOICE = {
  identifier: 'es-es-x-here',
  name: 'Aqui',
  language: 'es-ES',
  quality: 'Enhanced',
};

const BEFORE = {
  playbackSpeed: 1,
  selectedVoiceId: HERE_VOICE.identifier,
  selectedLanguage: 'es',
  autoPlay: false,
  continueFromLastPosition: true,
  autoAdvanceChapter: true,
  readerFollowsAudio: true,
};

const wrapper = ({children}: {children: React.ReactNode}) => (
  <AudioPlayerProvider>{children}</AudioPlayerProvider>
);

async function mountHydrated() {
  const hook = renderHook(() => useAudioPlayer(), {wrapper});
  await waitFor(() =>
    expect(hook.result.current.state.selectedVoice?.identifier).toBe(
      HERE_VOICE.identifier,
    ),
  );
  return hook;
}

describe('R9-30 — AudioPlayerProvider re-reads its preferences on a restore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
    (Speech.getAvailableVoicesAsync as jest.Mock).mockImplementation(() =>
      Promise.resolve([HERE_VOICE]),
    );
    await AsyncStorage.setItem(KEY, JSON.stringify(BEFORE));
  });

  it('the restored speed, language and toggles reach the player; a foreign voice is not pinned', async () => {
    const {result} = await mountHydrated();
    expect(result.current.state.playbackSpeed).toBe(1);

    // What importBackup does: write payload.local, then announce it. The
    // file comes from another phone, whose voice this one does not have.
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({
        ...BEFORE,
        playbackSpeed: 1.5,
        selectedLanguage: 'en',
        selectedVoiceId: 'en-us-x-other-phone',
        autoAdvanceChapter: false,
        readerFollowsAudio: false,
      }),
    );
    await act(async () => {
      emitBackupRestored();
    });

    await waitFor(() => expect(result.current.state.playbackSpeed).toBe(1.5));
    expect(result.current.state.selectedLanguage).toBe('en');
    expect(result.current.autoAdvanceChapter).toBe(false);
    expect(result.current.readerFollowsAudio).toBe(false);
    await waitFor(() => expect(result.current.state.selectedVoice).toBeNull());
  });

  it('a restored file without the two toggles puts their ON default back', async () => {
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({
        ...BEFORE,
        autoAdvanceChapter: false,
        readerFollowsAudio: false,
      }),
    );
    const {result} = await mountHydrated();
    expect(result.current.autoAdvanceChapter).toBe(false);

    const older: Record<string, unknown> = {...BEFORE, selectedVoiceId: null};
    delete older.autoAdvanceChapter;
    delete older.readerFollowsAudio;
    await AsyncStorage.setItem(KEY, JSON.stringify(older));
    await act(async () => {
      emitBackupRestored();
    });

    await waitFor(() => expect(result.current.autoAdvanceChapter).toBe(true));
    expect(result.current.readerFollowsAudio).toBe(true);
    expect(result.current.state.selectedVoice).toBeNull();
  });

  it('CONTROL: an empty voice list (TTS engine still binding) keeps the saved voice pinned', async () => {
    const {result} = await mountHydrated();
    (Speech.getAvailableVoicesAsync as jest.Mock).mockImplementation(() =>
      Promise.resolve([]),
    );
    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({...BEFORE, playbackSpeed: 1.25}),
    );
    await act(async () => {
      emitBackupRestored();
    });

    await waitFor(() => expect(result.current.state.playbackSpeed).toBe(1.25));
    await act(async () => {});
    expect(result.current.state.selectedVoice?.identifier).toBe(
      HERE_VOICE.identifier,
    );
  });

  it('a voice un-pinned while the re-read looks up the voices stays un-pinned', async () => {
    const {result} = await mountHydrated();
    let release: (() => void) | undefined;
    const gate = new Promise<void>(r => (release = r));
    (Speech.getAvailableVoicesAsync as jest.Mock).mockImplementation(
      async () => {
        await gate;
        return [HERE_VOICE];
      },
    );
    await act(async () => {
      emitBackupRestored();
    });

    await act(async () => {
      result.current.clearVoice();
    });
    await act(async () => {
      release!();
    });

    expect(result.current.state.selectedVoice).toBeNull();
  });

  it('a speed picked while the re-read is in flight is not overwritten by it', async () => {
    const {result} = await mountHydrated();

    await AsyncStorage.setItem(
      KEY,
      JSON.stringify({...BEFORE, playbackSpeed: 1.5}),
    );
    // The mock's getItem is itself a jest.fn: keep its implementation.
    const getItemMock = AsyncStorage.getItem as jest.Mock;
    const realImpl = getItemMock.getMockImplementation()!;
    let release: (() => void) | undefined;
    const gate = new Promise<void>(r => (release = r));
    getItemMock.mockImplementation(async (key: string) => {
      const value = await (realImpl(key) as Promise<string | null>);
      if (key === KEY) await gate;
      return value;
    });
    await act(async () => {
      emitBackupRestored();
    });

    await act(async () => {
      result.current.setPlaybackSpeed(0.75);
    });
    getItemMock.mockImplementation(realImpl);
    await act(async () => {
      release!();
    });

    expect(result.current.state.playbackSpeed).toBe(0.75);
    await waitFor(async () =>
      expect(JSON.parse((await AsyncStorage.getItem(KEY))!).playbackSpeed).toBe(
        0.75,
      ),
    );
  });
});
