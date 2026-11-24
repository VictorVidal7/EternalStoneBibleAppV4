/**
 * R9-30, S165 — the player's preferences ride in `payload.local` and the
 * import writes them back byte for byte; the reminders stay on the device.
 *
 * Lo REAL: buildBackup and importBackup over the AsyncStorage mock. Lo
 * sustituido: SQLite (empty) and the achievement service (empty), as in
 * backupKeyCoverage.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    // R9-51 — the import folds the notes it wrote (none here).
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';

const PREFS = JSON.stringify({
  playbackSpeed: 1.5,
  selectedVoiceId: 'es-es-x-eea-local',
  selectedLanguage: 'en',
  autoPlay: false,
  continueFromLastPosition: true,
  autoAdvanceChapter: false,
  readerFollowsAudio: false,
});

beforeEach(async () => {
  await AsyncStorage.clear();
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
});

afterAll(() => setAchievementServiceInstance(null));

describe('R9-30, S165 — audio preferences travel, reminders do not', () => {
  it('a round trip carries `@audio_preferences` to a fresh device', async () => {
    await AsyncStorage.setItem('@audio_preferences', PREFS);
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    expect(file.local['@audio_preferences']).toBe(PREFS);

    await AsyncStorage.clear();
    const result = await importBackup(file);
    expect(await AsyncStorage.getItem('@audio_preferences')).toBe(PREFS);
    expect(result.failedSections).toEqual([]);
  });

  it('CONTROL: a reminder switched on here is neither exported nor overwritten', async () => {
    await AsyncStorage.multiSet([
      ['@prayer_reminder_enabled', 'true'],
      ['@prayer_reminder_hour', '21'],
    ]);
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    expect(JSON.stringify(file)).not.toContain('@prayer_reminder');

    await AsyncStorage.multiSet([
      ['@prayer_reminder_enabled', 'false'],
      ['@prayer_reminder_hour', '7'],
    ]);
    await importBackup(file);
    expect(await AsyncStorage.getItem('@prayer_reminder_enabled')).toBe(
      'false',
    );
    expect(await AsyncStorage.getItem('@prayer_reminder_hour')).toBe('7');
  });
});
