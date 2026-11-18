/**
 * R9-30 — the listening pins, the listening history and the two lists of
 * share-image styles ride in `payload.local`, and the import writes them back
 * byte for byte.
 *
 * Lo REAL: buildBackup, importBackup and the four stores that write the
 * values, over the AsyncStorage mock. Lo sustituido: SQLite (empty) and the
 * achievement service (empty), as in backupKeyCoverage.
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
import {
  getAudioBookmarks,
  saveAudioBookmarks,
} from '../src/features/audio/lib/audioBookmarksStore';
import {
  appendListening,
  getListeningStats,
} from '../src/features/audio/lib/listeningStatsStore';
import {createAudioBookmark} from '../src/features/audio/lib/audioBookmarks';
import {
  getStylePresets,
  saveStylePreset,
} from '../src/features/share/stylePresetsStore';
import {
  getCompactStylePresets,
  saveCompactStylePreset,
} from '../src/features/share/compactStylePresetsStore';

const KEYS = [
  '@audio_bookmarks',
  '@audio_listening_stats',
  '@share_style_presets',
  '@share_style_presets_compact',
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

async function writeAll(): Promise<Record<string, string>> {
  const day = new Date(2026, 10, 17, 12).getTime();
  const pin = createAudioBookmark(
    {book: 'Salmos', chapter: 23, verse: 1},
    day,
  )!;
  await saveAudioBookmarks([pin]);
  await appendListening({ms: 90000, verses: 12}, day);
  await saveStylePreset({
    templateId: 'aurora',
    texture: 'grain',
    fontSize: 28,
    textAlign: 'center',
    fontFamilyId: 'serif',
    aspect: 'story',
  } as Parameters<typeof saveStylePreset>[0]);
  await saveCompactStylePreset({
    templateId: 'aurora',
    texture: 'dots',
  } as Parameters<typeof saveCompactStylePreset>[0]);
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
  expect(
    (await getAudioBookmarks()).map(b => [b.bookId, b.chapter, b.verse]),
  ).toEqual([[19, 23, 1]]);
  expect((await getListeningStats()).days['2026-11-17']).toEqual({
    ms: 90000,
    verses: 12,
  });
  expect((await getStylePresets()).map(p => p.texture)).toEqual(['grain']);
  expect((await getCompactStylePresets()).map(p => p.texture)).toEqual([
    'dots',
  ]);
});

it('R9-30 — a store write after the import keeps what the file brought', async () => {
  const raw = await writeAll();
  const {payload} = await buildBackup();
  const file = JSON.parse(JSON.stringify(payload));
  await AsyncStorage.clear();
  await importBackup(file);
  expect(Object.fromEntries(await AsyncStorage.multiGet(KEYS))).toEqual(raw);

  // Each writer re-reads the disk: the restored rows survive the next write.
  await appendListening({ms: 1000}, new Date(2026, 10, 18, 12).getTime());
  await saveStylePreset({
    templateId: 'aurora',
    texture: 'lines',
    fontSize: 20,
    textAlign: 'left',
    fontFamilyId: 'serif',
    aspect: 'square',
  } as Parameters<typeof saveStylePreset>[0]);
  await saveCompactStylePreset({
    templateId: 'aurora',
    texture: 'none',
  } as Parameters<typeof saveCompactStylePreset>[0]);
  expect(Object.keys((await getListeningStats()).days).sort()).toEqual([
    '2026-11-17',
    '2026-11-18',
  ]);
  expect((await getStylePresets()).map(p => p.texture)).toEqual([
    'grain',
    'lines',
  ]);
  expect((await getCompactStylePresets()).map(p => p.texture)).toEqual([
    'dots',
    'none',
  ]);
});
