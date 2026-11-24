/**
 * R9-30 — the prayer journal (`@prayer_requests_v1`) and the prayer log
 * (`@prayer_log`) travel in `payload.local`, byte for byte: the real
 * `buildBackup` puts them in the file and the real `importBackup` writes them
 * on a fresh device. They are the user's own prayers; nothing may be dropped,
 * trimmed or re-serialized on the way.
 *
 * Lo REAL: BackupService and AsyncStorage (the jest mock). Lo sustituido:
 * SQLite (empty tables) and the achievement service.
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

const VALUES: Record<string, string> = {
  '@prayer_requests_v1': JSON.stringify([
    {
      id: 'prayer_1',
      title: 'Por la salud de mamá',
      detail: 'Que el Señor le dé fuerzas — «esperanza»',
      category: 'intercession',
      createdAt: 1_760_000_000_000,
      answered: false,
    },
    {
      id: 'prayer_2',
      title: 'Trabajo nuevo',
      category: 'supplication',
      createdAt: 1_750_000_000_000,
      answered: true,
      answeredAt: 1_765_000_000_000,
      answeredNote: 'Respondida: gracias, Dios',
    },
  ]),
  '@prayer_log': JSON.stringify({
    days: {'2026-11-14': 1, '2026-11-15': 2, '2026-11-16': 1},
  }),
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

describe('R9-30 — the prayer journal and log travel', () => {
  it('the file carries both keys verbatim, and a fresh device gets them back', async () => {
    await AsyncStorage.multiSet(Object.entries(VALUES));
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    expect(file.local['@prayer_requests_v1']).toBe(
      VALUES['@prayer_requests_v1'],
    );
    expect(file.local['@prayer_log']).toBe(VALUES['@prayer_log']);

    await AsyncStorage.clear();
    const result = await importBackup(file);
    const restored = Object.fromEntries(
      await AsyncStorage.multiGet(Object.keys(VALUES)),
    );
    expect(restored).toEqual(VALUES);
    expect(result.failedSections).toEqual([]);
  });

  it('the restored journal replaces the one on the device', async () => {
    await AsyncStorage.multiSet(Object.entries(VALUES));
    const {payload} = await buildBackup();
    const file = JSON.parse(JSON.stringify(payload));
    await AsyncStorage.setItem('@prayer_requests_v1', '[]');
    await AsyncStorage.setItem('@prayer_log', '{"days":{}}');
    await importBackup(file);
    expect(await AsyncStorage.getItem('@prayer_requests_v1')).toBe(
      VALUES['@prayer_requests_v1'],
    );
    expect(await AsyncStorage.getItem('@prayer_log')).toBe(
      VALUES['@prayer_log'],
    );
  });
});
