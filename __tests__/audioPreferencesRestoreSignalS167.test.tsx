/**
 * S167 — the audio player's `@audio_preferences`, restored from a file
 * (R9-604, R9-603, R9-606, R9-607; review of S165 in S166).
 *
 * Lo REAL: AudioPlayerProvider (its loadPreferences and savePreferences),
 * PremiumProvider (a free account: the secure-store mock is empty),
 * buildBackup and importBackup with the restore signal, over the
 * AsyncStorage mock. Lo sustituido: SQLite and achievements (the mocks of
 * `backupKeyCoverage.test.ts`), expo-speech (the voice list), expo-haptics.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
      getAllAsync: jest.fn().mockResolvedValue([]),
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
    getFavorites: jest.fn().mockResolvedValue([]),
    getNotes: jest.fn().mockResolvedValue([]),
    getReadingProgress: jest.fn().mockResolvedValue(null),
  };
  return {__esModule: true, default: instance, bibleDB: instance};
});

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

import React from 'react';
import {act, renderHook, waitFor} from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import {PremiumProvider} from '../src/context/PremiumContext';
import {__resetBackupRestoredListenersForTests} from '../src/lib/backup/restoreSignal';

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
  <PremiumProvider>
    <AudioPlayerProvider>{children}</AudioPlayerProvider>
  </PremiumProvider>
);

/** A real export of this device, with `@audio_preferences` set to `prefs`. */
async function fileWith(prefs: string) {
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  file.local = {...(file.local ?? {}), [KEY]: prefs};
  return file;
}

async function mountHydrated() {
  const hook = renderHook(() => useAudioPlayer(), {wrapper});
  await waitFor(() =>
    expect(hook.result.current.state.selectedVoice?.identifier).toBe(
      HERE_VOICE.identifier,
    ),
  );
  return hook;
}

async function settle() {
  for (let i = 0; i < 5; i++) await act(async () => {});
}

const disk = async () => JSON.parse((await AsyncStorage.getItem(KEY))!);

describe('S167 — AudioPlayerProvider and a restored @audio_preferences', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    __resetBackupRestoredListenersForTests();
    setAchievementServiceInstance({
      initialize: jest.fn().mockResolvedValue(undefined),
      getRawUserStats: jest.fn().mockResolvedValue({}),
      getAllAchievements: jest.fn().mockResolvedValue([]),
      getReadingLog: jest.fn().mockResolvedValue([]),
      getCompletedBooks: jest.fn().mockResolvedValue([]),
      getBookReadingLog: jest.fn().mockResolvedValue([]),
      getChaptersReadLog: jest.fn().mockResolvedValue([]),
      restoreBackup: jest.fn().mockResolvedValue(undefined),
    } as unknown as AchievementService);
    (Speech.getAvailableVoicesAsync as jest.Mock).mockImplementation(() =>
      Promise.resolve([HERE_VOICE]),
    );
    await AsyncStorage.setItem(KEY, JSON.stringify(BEFORE));
  });

  afterAll(() => setAchievementServiceInstance(null));

  describe('R9-604 — valid JSON that is not an object', () => {
    const NOT_OBJECTS = ['null', '5', '"abc"', '[1,2]', 'true'];

    it.each(NOT_OBJECTS)(
      'restored live, %s leaves the player as it was',
      async bad => {
        const file = await fileWith(bad);
        const {result} = await mountHydrated();

        await act(async () => {
          await importBackup(file);
        });
        await settle();

        expect(result.current.state.playbackSpeed).toBe(1);
        expect(result.current.state.selectedLanguage).toBe('es');
      },
    );

    it.each(NOT_OBJECTS)(
      'on a cold start, %s mounts with the defaults and the next save writes an object',
      async bad => {
        await AsyncStorage.setItem(KEY, bad);
        const {result} = renderHook(() => useAudioPlayer(), {wrapper});
        await settle();

        expect(result.current.state.playbackSpeed).toBe(1);
        expect(result.current.state.selectedLanguage).toBe('es');

        await act(async () => {
          result.current.setAutoAdvanceChapter(false);
        });
        await settle();
        expect(await disk()).toEqual({
          playbackSpeed: 1,
          selectedVoiceId: null,
          selectedLanguage: 'es',
          autoPlay: false,
          continueFromLastPosition: true,
          autoAdvanceChapter: false,
        });
      },
    );

    it('text that does not parse is replaced by the next save', async () => {
      await AsyncStorage.setItem(KEY, '{bad');
      const {result} = renderHook(() => useAudioPlayer(), {wrapper});
      await settle();
      expect(result.current.state.playbackSpeed).toBe(1);

      await act(async () => {
        result.current.setReaderFollowsAudio(false);
      });
      await settle();
      expect((await disk()).readerFollowsAudio).toBe(false);
    });

    it('a field of the wrong type reads as absent', async () => {
      await AsyncStorage.setItem(
        KEY,
        JSON.stringify({
          playbackSpeed: '2',
          selectedVoiceId: 7,
          selectedLanguage: 9,
          autoAdvanceChapter: 'no',
        }),
      );
      const {result} = renderHook(() => useAudioPlayer(), {wrapper});
      await settle();

      expect(result.current.state.playbackSpeed).toBe(1);
      expect(result.current.state.selectedLanguage).toBe('es');
      expect(result.current.state.selectedVoice).toBeNull();
      expect(result.current.autoAdvanceChapter).toBe(true);
    });

    it('CONTROL: a valid file still lands', async () => {
      const file = await fileWith(
        JSON.stringify({...BEFORE, playbackSpeed: 1.5, selectedLanguage: 'en'}),
      );
      const {result} = await mountHydrated();

      await act(async () => {
        await importBackup(file);
      });
      await settle();

      expect(result.current.state.playbackSpeed).toBe(1.5);
      expect(result.current.state.selectedLanguage).toBe('en');
    });
  });

  describe('R9-603 — a file without a voice', () => {
    it('in the same audio language keeps the voice pinned here, on screen and on disk', async () => {
      const file = await fileWith(
        JSON.stringify({...BEFORE, selectedVoiceId: null, playbackSpeed: 1.5}),
      );
      const {result} = await mountHydrated();

      await act(async () => {
        await importBackup(file);
      });
      await settle();

      expect(result.current.state.playbackSpeed).toBe(1.5);
      expect(result.current.state.selectedVoice?.identifier).toBe(
        HERE_VOICE.identifier,
      );
      expect(await disk()).toMatchObject({
        playbackSpeed: 1.5,
        selectedVoiceId: HERE_VOICE.identifier,
      });
    });

    it('CONTROL: in another audio language un-pins it, on screen and on disk', async () => {
      const file = await fileWith(
        JSON.stringify({
          ...BEFORE,
          selectedVoiceId: null,
          selectedLanguage: 'en',
        }),
      );
      const {result} = await mountHydrated();

      await act(async () => {
        await importBackup(file);
      });
      await settle();

      expect(result.current.state.selectedLanguage).toBe('en');
      expect(result.current.state.selectedVoice).toBeNull();
      expect((await disk()).selectedVoiceId).toBeNull();
    });

    it('CONTROL: a cold start with no voice on disk pins none', async () => {
      await AsyncStorage.setItem(
        KEY,
        JSON.stringify({...BEFORE, selectedVoiceId: null}),
      );
      const {result} = renderHook(() => useAudioPlayer(), {wrapper});
      await settle();

      expect(result.current.state.selectedVoice).toBeNull();
      expect((await disk()).selectedVoiceId).toBeNull();
    });
  });
});
