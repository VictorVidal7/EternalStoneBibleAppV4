/**
 * R9-30 — the user's own writing travels: the feelings log, the devotion log,
 * "Mi testimonio" and the shared devotionals ride in `payload.local` and the
 * import writes them back byte for byte.
 *
 * Lo REAL: buildBackup, importBackup and the four stores that write the
 * values, over the AsyncStorage mock. Lo sustituido: SQLite (empty) and the
 * achievement service (empty), as in backupKeyCoverage.
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
import {
  getFeelingsLog,
  recordTodayFeeling,
} from '../src/features/study/feelingsLogStore';
import {
  getDevotionLog,
  recordTodayDevotion,
} from '../src/features/study/devotionLogStore';
import {
  createFaithTestimonySession,
  getAllFaithTestimonies,
  saveFaithTestimonySession,
} from '../src/features/study/faithTestimonyStore';
import {
  DEVOTIONAL_SAVED_KEY,
  addSavedDevotional,
  makeCalBundle,
  parseSavedDevotionals,
  serializeSavedDevotionals,
} from '../src/lib/together';

const KEYS = [
  '@feelings_log',
  '@devotion_log',
  '@faith_testimony',
  DEVOTIONAL_SAVED_KEY,
];

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

const TESTIMONY =
  '¡Él me cambió!\nAntes vivía «sin rumbo», "perdido"; hoy: paz 🙏 — ñ, ü.';

async function writeAll(): Promise<Record<string, string>> {
  const day = new Date(2026, 10, 17, 12).getTime();
  await recordTodayFeeling('peace', day - 86400000);
  await recordTodayFeeling('joy', day);
  await recordTodayDevotion(day);
  await recordTodayDevotion(day);
  const session = await createFaithTestimonySession('Mi historia de fe');
  await saveFaithTestimonySession(session!.id, {before: TESTIMONY});
  const bundle = makeCalBundle('2026-12-01', 'Adviento «en casa» ✨', [
    {bookId: 19, chapter: 23, verse: 1, note: 'Nada me faltará — ñ'},
  ])!;
  await AsyncStorage.setItem(
    DEVOTIONAL_SAVED_KEY,
    serializeSavedDevotionals(addSavedDevotional([], bundle)),
  );
  const raw = Object.fromEntries(await AsyncStorage.multiGet(KEYS));
  for (const key of KEYS) expect(typeof raw[key]).toBe('string');
  return raw as Record<string, string>;
}

it('R9-30 — the four keys ride in `local` and come back byte for byte', async () => {
  const raw = await writeAll();
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  for (const key of KEYS) expect(file.local[key]).toBe(raw[key]);

  await AsyncStorage.clear();
  const result = await importBackup(file);

  expect(Object.fromEntries(await AsyncStorage.multiGet(KEYS))).toEqual(raw);
  expect(result.failedSections).toEqual([]);
  // And the stores read them as the user left them.
  expect((await getFeelingsLog()).days).toEqual({
    '2026-11-16': 'peace',
    '2026-11-17': 'joy',
  });
  expect((await getDevotionLog()).days).toEqual({'2026-11-17': 2});
  expect(
    Object.values(await getAllFaithTestimonies()).map(s => s.before),
  ).toEqual([TESTIMONY]);
  expect(
    parseSavedDevotionals(await AsyncStorage.getItem(DEVOTIONAL_SAVED_KEY)).map(
      e => e.bundle.ti,
    ),
  ).toEqual(['Adviento «en casa» ✨']);
});

it('R9-30 — a restore replaces what this device had under those keys', async () => {
  const raw = await writeAll();
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  await AsyncStorage.clear();
  await recordTodayFeeling('fear', new Date(2026, 10, 18, 12).getTime());
  await createFaithTestimonySession('Otra en este aparato');

  await importBackup(file);

  expect(await AsyncStorage.getItem('@feelings_log')).toBe(
    raw['@feelings_log'],
  );
  expect(await AsyncStorage.getItem('@faith_testimony')).toBe(
    raw['@faith_testimony'],
  );
});
