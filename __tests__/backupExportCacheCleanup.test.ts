/**
 * R9-32 — each export used to leave a full copy of the user's data in the
 * cache directory, forever. Measured in the emulator (S183): two exports
 * whose share sheet was dismissed left two files in `cache/`. The previous
 * ones now go before the new one is written; the new one stays (the
 * receiving app may still be reading it when `shareAsync` resolves).
 *
 * The REAL `exportBackup` and `buildBackup`; only the native file system
 * (an in-memory directory) and the share sheet are stubbed.
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

const mockCache = new Map<string, string>();
jest.mock('expo-file-system', () => {
  class File {
    name: string;
    constructor(_dir: unknown, name: string) {
      this.name = name;
    }
    get exists() {
      return mockCache.has(this.name);
    }
    get uri() {
      return `file:///cache/${this.name}`;
    }
    create() {
      mockCache.set(this.name, '');
    }
    write(text: string) {
      mockCache.set(this.name, text);
    }
    delete() {
      mockCache.delete(this.name);
    }
  }
  return {
    File,
    Paths: {
      cache: {
        list: () => [...mockCache.keys()].map(n => new File(null, n)),
      },
    },
  };
});

const mockCanShare = jest.fn();
const mockShare = jest.fn();
jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => mockCanShare(),
  shareAsync: (...a: unknown[]) => mockShare(...a),
}));

import {exportBackup} from '../src/services/BackupService';

beforeEach(() => {
  mockCache.clear();
  mockCanShare.mockResolvedValue(true);
  mockShare.mockResolvedValue(undefined);
});

it('a second export leaves one backup file in the cache, the new one', async () => {
  // Two old copies from earlier exports (the S183 emulator state), and a
  // file of someone else's that must stay.
  mockCache.set('eternalstone-backup-2026-11-25T23-10-37-282Z.json', '{}');
  mockCache.set('eternalstone-backup-2026-11-25T23-10-44-735Z.json', '{}');
  mockCache.set('otra-cosa.json', 'x');

  const {uri} = await exportBackup();

  const backups = [...mockCache.keys()].filter(n =>
    n.startsWith('eternalstone-backup-'),
  );
  expect(backups).toHaveLength(1);
  expect(uri).toBe(`file:///cache/${backups[0]}`);
  expect(mockCache.get(backups[0])).toContain('"formatVersion"');
  expect(mockCache.has('otra-cosa.json')).toBe(true);
  expect(mockShare).toHaveBeenCalledWith(uri, expect.anything());
});

it('a device that cannot share is left with no file at all', async () => {
  mockCanShare.mockResolvedValue(false);
  await expect(exportBackup()).rejects.toThrow('Sharing is not available');
  expect(mockCache.size).toBe(0);
});
