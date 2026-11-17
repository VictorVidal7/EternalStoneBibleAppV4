/**
 * R9-30 — the study marks travel: `buildBackup` carries them in
 * `payload.local`, and `importBackup` writes them on a fresh device. Why they
 * can travel verbatim (no mounted writer rewrites them from memory) is
 * pinned in `studyMarksRestoreSafety.test.ts`.
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';
import {getFavoriteFacts} from '../src/features/study/factFavorites';
import {getFavoriteJourneyStops} from '../src/features/study/journeyFavorites';
import {getVisitedJourneyStops} from '../src/features/study/journeyProgress';

const VALUES: Record<string, string> = {
  '@fact_favorites_v1': '["fact-1","fact-7"]',
  '@journey_favorites_v1': '["abraham-ur"]',
  '@journey_progress_v1': '["abraham-ur","abraham-haran"]',
};

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

describe('R9-30 — the study marks travel', () => {
  it('the file carries them in `local`, and the import writes them', async () => {
    await AsyncStorage.multiSet(Object.entries(VALUES));
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    for (const [key, value] of Object.entries(VALUES)) {
      expect(file.local[key]).toBe(value);
    }

    await AsyncStorage.clear();
    const result = await importBackup(file);

    expect(
      Object.fromEntries(await AsyncStorage.multiGet(Object.keys(VALUES))),
    ).toEqual(VALUES);
    expect(result.failedSections).toEqual([]);
    // And the stores read them back.
    expect([...(await getFavoriteFacts())]).toEqual(['fact-1', 'fact-7']);
    expect([...(await getFavoriteJourneyStops())]).toEqual(['abraham-ur']);
    expect([...(await getVisitedJourneyStops())]).toEqual([
      'abraham-ur',
      'abraham-haran',
    ]);
  });
});
