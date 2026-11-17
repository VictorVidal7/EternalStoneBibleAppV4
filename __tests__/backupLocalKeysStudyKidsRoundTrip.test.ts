/**
 * R9-30, tanda 1 — round trip of the four keys through the real
 * `buildBackup` and `importBackup`: the file carries each one in `local`, and
 * the import writes it on a fresh device.
 *
 * And the kids case the R9-30 entry left unmeasured: restoring over a device
 * with its own kids progress REPLACES it (like every other section), and the
 * "Primera historia" badge row comes from the same file, so progress and badge
 * stay together. `[storyId].tsx` unlocks the badge only at
 * `storiesCompleted.length === 1`.
 *
 * Lo REAL: BackupService, the kids store. Lo sustituido: SQLite (empty), the
 * AchievementService (records what `restoreBackup` receives).
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
import {markKidsStoryCompleted} from '../src/features/kids/kidsProgress';

const KIDS = '@kids_progress_v1';

const VALUES: Record<string, string> = {
  '@prophecy_favorites_v1': '["isaiah-53","micah-5-2"]',
  '@prophecy_progress_v1': '["genesis-3-15"]',
  '@quiz_stats_v1': JSON.stringify({version: 1, roundsPlayed: 4}),
  [KIDS]: JSON.stringify({
    default: {
      storiesCompleted: ['creation'],
      scenesSeen: {creation: 5},
      quizBest: {creation: 3},
      planStartedAt: '2026-01-01T00:00:00.000Z',
    },
  }),
};

let achievementRows: unknown[] = [];
const restoreBackup = jest.fn().mockResolvedValue(undefined);

beforeEach(async () => {
  await AsyncStorage.clear();
  achievementRows = [];
  restoreBackup.mockClear();
  setAchievementServiceInstance({
    initialize: jest.fn().mockResolvedValue(undefined),
    getRawUserStats: jest.fn().mockResolvedValue({}),
    getAllAchievements: jest.fn(async () => achievementRows),
    getReadingLog: jest.fn().mockResolvedValue([]),
    getCompletedBooks: jest.fn().mockResolvedValue([]),
    getBookReadingLog: jest.fn().mockResolvedValue([]),
    getChaptersReadLog: jest.fn().mockResolvedValue([]),
    restoreBackup,
  } as unknown as AchievementService);
});

afterAll(() => setAchievementServiceInstance(null));

describe('R9-30 — prophecy, quiz and kids keys travel', () => {
  it('a round trip carries the four keys to a fresh device', async () => {
    await AsyncStorage.multiSet(Object.entries(VALUES));
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    for (const [key, value] of Object.entries(VALUES)) {
      expect(file.local[key]).toBe(value);
    }
    await AsyncStorage.clear();
    const result = await importBackup(file);
    const restored = Object.fromEntries(
      await AsyncStorage.multiGet(Object.keys(VALUES)),
    );
    expect(restored).toEqual(VALUES);
    expect(result.failedSections).toEqual([]);
  });

  it('kids: the file replaces the device progress, and the badge row comes with it', async () => {
    await AsyncStorage.setItem(KIDS, VALUES[KIDS]);
    achievementRows = [
      {id: 'kids_first_story', isUnlocked: true, currentProgress: 1},
    ];
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));

    // The target device: three stories of its own, badge state its own.
    await AsyncStorage.clear();
    await markKidsStoryCompleted('noah');
    await markKidsStoryCompleted('jonah');
    await markKidsStoryCompleted('david');

    await importBackup(file);
    expect(await AsyncStorage.getItem(KIDS)).toBe(VALUES[KIDS]);
    const received = restoreBackup.mock.calls[0][0].achievements;
    expect(received).toContainEqual(
      expect.objectContaining({id: 'kids_first_story', isUnlocked: true}),
    );
    // The next story is the second: the screen does not re-track the badge,
    // and the file already brought it unlocked.
    const next = await markKidsStoryCompleted('noah');
    expect(next.storiesCompleted).toEqual(['creation', 'noah']);
  });

  it('CONTROL: a source that never played kids leaves the device progress alone', async () => {
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    expect(file.local).not.toHaveProperty(KIDS);
    await markKidsStoryCompleted('noah');
    const before = await AsyncStorage.getItem(KIDS);
    await importBackup(file);
    expect(await AsyncStorage.getItem(KIDS)).toBe(before);
  });
});
