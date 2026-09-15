/**
 * R9-49 + R9-27 — a degraded export must not be able to erase real data.
 *
 * The chain this suite pins down, end to end:
 *
 *   1. (R9-49) The four ledgers holding the ENTIRE reading history —
 *      `getReadingLog`, `getCompletedBooks`, `getBookReadingLog`,
 *      `getChaptersReadLog` — swallow their own SQLite exception and return
 *      `[]`. `safeQuery` can only mark a section degraded from its own
 *      `catch`, so the `degradedSections` flag was PHYSICALLY UNREACHABLE for
 *      exactly those four. `{strict: true}` is how the export opts out.
 *
 *   2. (R9-27) `degradedSections` was returned as a SIBLING of the payload
 *      and never written into the file, so it died in an export toast. The
 *      file itself stayed indistinguishable from a complete one.
 *
 *   3. Months later `importBackup` saw `streakLog: []`, could not tell a
 *      failed read from a user who has never read a verse, and resolved that
 *      ambiguity by running `DELETE FROM reading_streak_log` with zero rows
 *      to re-insert — then reported "importada correctamente". The reading
 *      history, the streak and the ledgers have NO cloud copy: that delete is
 *      the end of them.
 *
 *   4. And `recomputeReadingStreak()` runs on every `initialize()`, writing
 *      `longest_streak` straight from the (now empty) log — so even a record
 *      that survived in `user_stats` was zeroed on the next launch.
 *
 * Mock-factory pattern copied from `backupServiceImport.test.ts`: each
 * factory is self-contained and stashes its instance as `__mockInstance`,
 * read back after the imports to sidestep jest/babel's hoisting order.
 */
jest.mock('../src/lib/database', () => {
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    getDatabase: jest.fn().mockResolvedValue({
      withTransactionAsync: async (fn: () => Promise<void>) => fn(),
      // The tests that don't register a shared instance fall through to
      // BackupService's own `new AchievementService(bibleDB)`, whose
      // `initialize()` bootstraps the schema through these two.
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue(undefined),
    }),
    executeSql: jest.fn(async () => ({rows: {_array: [], length: 0}})),
    getFavorites: jest.fn().mockResolvedValue([]),
    getNotes: jest.fn().mockResolvedValue([]),
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

jest.mock('../src/lib/memory/reviewEventStore', () => ({
  getAllReviewEvents: jest.fn().mockResolvedValue([]),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DatabaseModule from '../src/lib/database';
import {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {
  buildBackup,
  importBackup,
  BACKUP_FORMAT_VERSION,
  type BackupPayload,
} from '../src/services/BackupService';

interface MockDbInstance {
  initialize: jest.Mock;
  getDatabase: jest.Mock;
  executeSql: jest.Mock;
  getFavorites: jest.Mock;
  getNotes: jest.Mock;
  getReadingProgress: jest.Mock;
}

const mockDb = (DatabaseModule as unknown as {__mockInstance: MockDbInstance})
  .__mockInstance;

function sqlCallsStartingWith(prefix: string): unknown[][] {
  return mockDb.executeSql.mock.calls
    .filter(([sql]: [string]) => sql.trim().startsWith(prefix))
    .map(([, params]: [string, unknown[]]) => params ?? []);
}

/** A minimal, fully-populated v2 payload. Tests override only what they need. */
function basePayload(overrides: Partial<BackupPayload> = {}): BackupPayload {
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    generatedAt: '2026-01-01T00:00:00.000Z',
    app: {name: 'Eternal Stone Bible', package: 'com.eternalstonebible.app'},
    bible: {
      favorites: [],
      notes: [],
      highlights: [],
      lastReadPosition: null,
      chapterProgressMap: null,
    },
    user: {
      readingPlanProgress: undefined,
      readingPlanReadChapters: undefined,
      searchHistory: undefined,
      readerPreferences: {sideBySide: false},
      readerPreferencesFull: null,
      appTheme: {mode: null, colorTheme: null},
    },
    achievements: {
      stats: {
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
      },
      achievements: [],
      streakLog: [],
      completedBooks: [],
      bookReadingLog: [],
      chaptersReadLog: [],
    },
    memory: {memoryDeck: null, reviewEvents: []},
    prep: {notes: null, series: null},
    ...overrides,
  } as BackupPayload;
}

beforeEach(async () => {
  mockDb.executeSql.mockClear().mockImplementation(async () => ({
    rows: {_array: [], length: 0},
  }));
  mockDb.initialize.mockClear();
  mockDb.getFavorites.mockClear().mockResolvedValue([]);
  mockDb.getNotes.mockClear().mockResolvedValue([]);
  mockDb.getReadingProgress.mockClear().mockResolvedValue(null);
  await AsyncStorage.clear();
  setAchievementServiceInstance(null);
});

// ---------------------------------------------------------------------------
// 1. The four swallowing getters
// ---------------------------------------------------------------------------

describe('R9-49 — the reading-history ledgers can finally report a failure', () => {
  /** A db whose every read throws, i.e. a transient SQLite failure. */
  function brokenService(): AchievementService {
    const db = {
      executeSql: jest.fn(async () => {
        throw new Error('mock: SQLite busy');
      }),
      getDatabase: jest.fn(),
    };
    return new AchievementService(
      db as unknown as ConstructorParameters<typeof AchievementService>[0],
    );
  }

  it('still degrades to [] for the UI callers (a fresh install must not crash)', async () => {
    const service = brokenService();
    await expect(service.getReadingLog()).resolves.toEqual([]);
    await expect(service.getCompletedBooks()).resolves.toEqual([]);
    await expect(service.getBookReadingLog()).resolves.toEqual([]);
    await expect(service.getChaptersReadLog()).resolves.toEqual([]);
  });

  it('rethrows under {strict: true} so the backup can mark the section', async () => {
    const service = brokenService();
    await expect(service.getReadingLog({strict: true})).rejects.toThrow(
      /SQLite busy/,
    );
    await expect(service.getCompletedBooks({strict: true})).rejects.toThrow(
      /SQLite busy/,
    );
    await expect(service.getBookReadingLog({strict: true})).rejects.toThrow(
      /SQLite busy/,
    );
    await expect(service.getChaptersReadLog({strict: true})).rejects.toThrow(
      /SQLite busy/,
    );
  });
});

// ---------------------------------------------------------------------------
// 2. The marker reaches the FILE
// ---------------------------------------------------------------------------

describe('R9-27 — degradedSections travels inside the backup file', () => {
  /** A stand-in service whose four ledgers reject, as the real ones now do
   *  under `{strict: true}` when SQLite is unhappy. */
  function failingLedgerService(): AchievementService {
    const reject = jest.fn(async () => {
      throw new Error('mock: SQLite busy');
    });
    return {
      initialize: jest.fn().mockResolvedValue(undefined),
      getRawUserStats: jest.fn().mockResolvedValue({
        totalVersesRead: 10,
        totalChaptersRead: 2,
        totalBooksCompleted: 0,
        totalReadingTime: 60,
        currentStreak: 3,
        longestStreak: 40,
        lastReadDate: '2026-01-01',
        totalHighlights: 0,
        totalNotes: 0,
        totalBookmarks: 0,
        totalSearches: 0,
        totalShares: 0,
        level: 2,
        totalPoints: 100,
      }),
      getAllAchievements: jest.fn().mockResolvedValue([]),
      getReadingLog: reject,
      getCompletedBooks: reject,
      getBookReadingLog: reject,
      getChaptersReadLog: reject,
    } as unknown as AchievementService;
  }

  it('marks all four ledgers and writes them into payload.meta', async () => {
    setAchievementServiceInstance(failingLedgerService());

    const {payload, degradedSections} = await buildBackup();

    expect(degradedSections).toEqual(
      expect.arrayContaining([
        'achievements.streakLog',
        'achievements.completedBooks',
        'achievements.bookReadingLog',
        'achievements.chaptersReadLog',
      ]),
    );
    // The whole point: the flag is IN the file, not just in the return value
    // the export toast reads and throws away.
    expect(payload.meta?.degradedSections).toEqual(
      expect.arrayContaining(['achievements.streakLog']),
    );
    // A section that read cleanly is never flagged.
    expect(degradedSections).not.toContain('achievements.stats');
    // And the file is still written — a degraded export is incomplete, not
    // aborted.
    expect(payload.achievements.streakLog).toEqual([]);
  });

  it('writes an empty meta list for a healthy export', async () => {
    const {payload, degradedSections} = await buildBackup();
    expect(degradedSections).toEqual([]);
    expect(payload.meta?.degradedSections).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 3. The import refuses to delete what the file never captured
// ---------------------------------------------------------------------------

describe('R9-27/R9-49 — a degraded section never wipes local data on import', () => {
  let restoreBackup: jest.Mock;

  beforeEach(() => {
    // A stub shared instance, so these tests exercise BackupService's own
    // gating rather than the real service's schema bootstrap (that side is
    // covered by `achievementServiceRestoreBackup.test.ts`).
    restoreBackup = jest.fn().mockResolvedValue(undefined);
    setAchievementServiceInstance({
      initialize: jest.fn().mockResolvedValue(undefined),
      restoreBackup,
    } as unknown as AchievementService);
  });

  it('skips DELETE FROM reading_streak_log and reports the section as failed', async () => {
    const result = await importBackup(
      basePayload({
        meta: {degradedSections: ['achievements.streakLog']},
      }),
    );

    // The flag is handed down to the service, which owns the DELETE.
    expect(restoreBackup).toHaveBeenCalledTimes(1);
    expect(restoreBackup.mock.calls[0][0].degraded).toMatchObject({
      streakLog: true,
      completedBooks: false,
      stats: false,
    });
    expect(result.failedSections).toContain('achievements.streakLog');
    // The rest of the achievements section still restored.
    expect(result.restoredSections).toContain('achievements');
  });

  it('leaves a degraded SQLite section alone instead of DELETE-ing it', async () => {
    const result = await importBackup(
      basePayload({
        bible: {
          favorites: [],
          notes: [],
          highlights: [],
          lastReadPosition: null,
          chapterProgressMap: null,
        },
        meta: {degradedSections: ['favorites', 'highlights']},
      }),
    );

    expect(sqlCallsStartingWith('DELETE FROM favorites')).toHaveLength(0);
    expect(sqlCallsStartingWith('DELETE FROM highlights')).toHaveLength(0);
    // `notes` read cleanly on the source device and is legitimately empty —
    // that IS a normal replace-with-empty and must still go through.
    expect(sqlCallsStartingWith('DELETE FROM notes')).toHaveLength(1);
    expect(result.failedSections).toEqual(
      expect.arrayContaining(['favorites', 'highlights']),
    );
    expect(result.restoredSections).toContain('notes');
  });

  it('leaves a degraded AsyncStorage section alone instead of overwriting it', async () => {
    await AsyncStorage.setItem(
      '@prep_notes',
      '{"Juan/3/16":{"idea":"mi bosquejo"}}',
    );

    const result = await importBackup(
      basePayload({
        prep: {notes: {}, series: null},
        meta: {degradedSections: ['prepNotes']},
      }),
    );

    // The Mesa has no cloud copy at all — overwriting it with the file's
    // placeholder `{}` would be the end of that sermon.
    expect(await AsyncStorage.getItem('@prep_notes')).toBe(
      '{"Juan/3/16":{"idea":"mi bosquejo"}}',
    );
    expect(result.failedSections).toContain('prepNotes');
    expect(result.restoredSections).not.toContain('prepNotes');
  });

  it('behaves exactly as before for a file with no meta (pre-fix backups)', async () => {
    const result = await importBackup(basePayload());

    expect(sqlCallsStartingWith('DELETE FROM favorites')).toHaveLength(1);
    expect(result.failedSections).toEqual([]);
    expect(result.restoredSections).toContain('favorites');
  });
});
