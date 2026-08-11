/**
 * Bug 3 — `buildBackup`'s `degradedSections` signal.
 *
 * `safeQuery`/`readJSON`/`readRaw` fall back to an empty/default value for
 * ANY section whose underlying read throws, so a single failing source
 * never aborts the whole export — but that used to mean a transient
 * SQLite/AsyncStorage error could silently produce a backup file that
 * LOOKS complete while actually missing real data. This suite pins down
 * that `degradedSections` only fires for an ACTUAL read failure — never
 * for a section that's just legitimately empty (the trap: `readJSON`/
 * `readRaw` return `null` for BOTH cases, so a naive implementation would
 * flag every fresh-install export as "degraded").
 *
 * Only `buildBackup` is exercised here, not `exportBackup` — the extra
 * file-write/share wrapper around it depends on `expo-file-system`/
 * `expo-sharing` native modules that aren't meaningfully mockable in this
 * unit-test environment, and it does nothing but forward `degradedSections`
 * unchanged (see `BackupService.ts`), so there's no additional logic there
 * worth a native-module mocking effort.
 *
 * Same mock-factory pattern as `backupServiceImport.test.ts`: each factory
 * is self-contained and stashes its instance as `__mockInstance`, read back
 * AFTER the imports below run to sidestep jest/babel's mock-hoisting order.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getFavorites: jest.fn().mockResolvedValue([]),
    getNotes: jest.fn().mockResolvedValue([]),
    executeSql: jest.fn().mockResolvedValue({rows: {_array: [], length: 0}}),
    getReadingProgress: jest.fn().mockResolvedValue(null),
  };
  return {
    __esModule: true,
    default: instance,
    bibleDB: instance,
    BibleDatabase: jest.fn(),
    __mockInstance: instance,
  };
});

jest.mock('../src/lib/achievements/AchievementService', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getRawUserStats: jest.fn().mockResolvedValue({
      totalVersesRead: 0,
      totalChaptersRead: 0,
      totalBooksCompleted: 0,
      totalReadingTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastReadDate: null,
      totalHighlights: 0,
      totalNotes: 0,
      totalBookmarks: 0,
      totalSearches: 0,
      totalShares: 0,
      level: 1,
      totalPoints: 0,
    }),
    getAllAchievements: jest.fn().mockResolvedValue([]),
    getReadingLog: jest.fn().mockResolvedValue([]),
    getCompletedBooks: jest.fn().mockResolvedValue([]),
    getBookReadingLog: jest.fn().mockResolvedValue([]),
    getChaptersReadLog: jest.fn().mockResolvedValue([]),
  };
  return {
    AchievementService: jest.fn().mockImplementation(() => instance),
    __mockInstance: instance,
  };
});

jest.mock('../src/lib/memory/reviewEventStore', () => ({
  getAllReviewEvents: jest.fn().mockResolvedValue([]),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DatabaseModule from '../src/lib/database';
import {buildBackup} from '../src/services/BackupService';

interface MockDbInstance {
  initialize: jest.Mock;
  getFavorites: jest.Mock;
  getNotes: jest.Mock;
  executeSql: jest.Mock;
  getReadingProgress: jest.Mock;
}

const mockDb = (DatabaseModule as unknown as {__mockInstance: MockDbInstance})
  .__mockInstance;

beforeEach(async () => {
  mockDb.getFavorites.mockClear().mockResolvedValue([]);
  mockDb.getNotes.mockClear().mockResolvedValue([]);
  mockDb.executeSql
    .mockClear()
    .mockResolvedValue({rows: {_array: [], length: 0}});
  mockDb.getReadingProgress.mockClear().mockResolvedValue(null);
  await AsyncStorage.clear();
  jest.restoreAllMocks();
});

describe('buildBackup — degradedSections only fires on an actual read failure', () => {
  it('is empty for a healthy, fresh-install-like state (every source legitimately empty)', async () => {
    const {payload, degradedSections} = await buildBackup();

    // The trap this fix specifically avoids: `readJSON`/`readRaw` return
    // `null` for both "the key was never set" and "the read threw" — a
    // fresh user must never be told their export "degraded".
    expect(degradedSections).toEqual([]);
    expect(payload.bible.favorites).toEqual([]);
    expect(payload.memory.memoryDeck).toBeNull();
  });

  it('flags a section whose SQLite read actually throws, and still falls back cleanly', async () => {
    mockDb.getFavorites.mockRejectedValueOnce(new Error('mock: SQLite busy'));

    const {payload, degradedSections} = await buildBackup();

    expect(degradedSections).toContain('favorites');
    // The export must still produce a usable (if incomplete) file rather
    // than throwing outright.
    expect(payload.bible.favorites).toEqual([]);
  });

  it('flags a section whose AsyncStorage read actually throws, not sections that are merely null', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockImplementation(async key => {
      if (key === '@bible_search_history') {
        throw new Error('mock: AsyncStorage read failed');
      }
      return null;
    });

    const {payload, degradedSections} = await buildBackup();

    expect(degradedSections).toContain('searchHistory');
    expect(payload.user.searchHistory).toEqual([]);
    // Every OTHER AsyncStorage-backed key legitimately returned null in
    // this test (never threw) — none of them should be flagged.
    expect(degradedSections).not.toContain('readerPreferencesFull');
    expect(degradedSections).not.toContain('memoryDeck');
    expect(degradedSections).not.toContain('prepNotes');
  });

  it('de-duplicates a section backed by more than one failing AsyncStorage key (appTheme)', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockImplementation(async key => {
      if (key === '@app_theme_mode' || key === '@app_color_theme') {
        throw new Error('mock: AsyncStorage read failed');
      }
      return null;
    });

    const {degradedSections} = await buildBackup();

    const appThemeOccurrences = degradedSections.filter(s => s === 'appTheme');
    expect(appThemeOccurrences).toHaveLength(1);
  });
});
