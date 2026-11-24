/**
 * R9-129 + R9-131 — the guards that keep a failed read of the reading and
 * review history from being exported, restored or seeded as "this user has
 * none", measured with the REAL producers.
 *
 * R9-129 — `getAllReviewEvents` swallowed its error and returned `[]`. The
 * backup section was never marked degraded (`safeQuery` marks only from its
 * own `catch`), the import ran `DELETE FROM review_events` with nothing to
 * re-insert, the fresh-device seed took a device with history for a new one
 * (every review counted twice, for good), and the cloud aggregate write
 * replaced the summary with the floor alone. `{strict: true}` is the opt-in.
 *
 * R9-131 — the two halves that protect the reading history (`{strict: true}`
 * on the four ledger reads of the export, and `data.degraded` in
 * `AchievementService.restoreBackup`) had no test: the existing ones used a
 * service that always rejects and a `restoreBackup` that is a `jest.fn()`.
 * Here the service is the real `AchievementService` over a fake `executeSql`.
 *
 * Lo REAL: `reviewEventStore`, `BackupService`, `AchievementService`,
 * `memoryStatsSync`. Lo sustituido: SQLite (the binding), Firestore (the
 * summary doc) and AsyncStorage (the jest mock).
 */
const mockState = {
  reviewReadFails: false,
  ledgerReadsFail: false,
};

const LEDGER_SELECTS = [
  'FROM reading_streak_log',
  'FROM completed_books',
  'FROM book_reading_log',
  'FROM chapters_read_log',
];

jest.mock('../src/lib/database', () => {
  const db = {
    withTransactionAsync: async (fn: () => Promise<void>) => fn(),
    execAsync: jest.fn().mockResolvedValue(undefined),
    runAsync: jest.fn().mockResolvedValue(undefined),
    getAllAsync: jest.fn(async () => {
      if (mockState.reviewReadFails) throw new Error('mock: SQLite busy');
      return [
        {
          id: 'John/3/16__1',
          verse_key: 'John/3/16',
          book_name: 'John',
          grade: 'good',
          box_before: 1,
          box_after: 2,
          interval_days: 1,
          reviewed_at: Date.now() - 86400000,
        },
      ];
    }),
  };
  const instance = {
    initialize: jest.fn().mockResolvedValue(undefined),
    // R9-51 — the import folds the notes it wrote (none here).
    foldVerseNotesInTransaction: jest.fn(async () => ({
      written: [],
      removedIds: [],
    })),
    getDatabase: jest.fn().mockResolvedValue(db),
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

let mockSummaryDoc: Record<string, unknown> | null = null;
const mockDocSet = jest.fn(async (_value: unknown) => {});
const mockDoc = {
  set: mockDocSet,
  get: jest.fn(async () => ({
    exists: mockSummaryDoc !== null,
    id: 'summary',
    data: () => mockSummaryDoc ?? undefined,
  })),
  delete: jest.fn(),
};
jest.mock('../src/lib/sync/firestore', () => ({
  __esModule: true,
  getFirestore: () => () => ({collection: () => ({doc: () => mockDoc})}),
  serverTimestamp: () => Date.now(),
  __resetFirestoreCacheForTests: () => {},
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DatabaseModule from '../src/lib/database';
import {AchievementService} from '../src/lib/achievements/AchievementService';
import {setAchievementServiceInstance} from '../src/lib/achievements/instance';
import {buildBackup, importBackup} from '../src/services/BackupService';
import {
  maybeWriteMemoryStatsSummary,
  seedMemoryStatsFloorIfFresh,
  __resetMemoryStatsSessionForTests,
} from '../src/lib/memory/memoryStatsSync';
import {setSyncEngine} from '../src/lib/sync';
import {logger} from '../src/lib/utils/logger';

jest.spyOn(logger, 'warn').mockImplementation(() => {});

const mockDb = (
  DatabaseModule as unknown as {__mockInstance: {executeSql: jest.Mock}}
).__mockInstance;

const sqlRun = (): string[] =>
  mockDb.executeSql.mock.calls.map(([sql]: [string]) => String(sql).trim());

/** The `user_stats` singleton row (snake_case, as SQLite returns it). */
const STATS_ROW = {
  id: 1,
  total_verses_read: 10,
  total_chapters_read: 2,
  total_books_completed: 0,
  total_reading_time: 60,
  current_streak: 3,
  longest_streak: 40,
  last_read_date: '2026-01-01',
  total_highlights: 0,
  total_notes: 0,
  total_bookmarks: 0,
  total_searches: 0,
  total_shares: 0,
  level: 2,
  total_points: 100,
};

const SUMMARY = {
  updatedAt: 5,
  longestStreak: 7,
  earliestReviewMs: 1000,
  recentDays: {'86400000': 2},
  retentionBands: {d1: {total: 4, recalled: 3}},
};

beforeEach(async () => {
  await AsyncStorage.clear();
  mockState.reviewReadFails = false;
  mockState.ledgerReadsFail = false;
  mockSummaryDoc = null;
  mockDocSet.mockClear();
  __resetMemoryStatsSessionForTests();
  mockDb.executeSql.mockReset().mockImplementation(async (sql: string) => {
    if (
      mockState.ledgerReadsFail &&
      String(sql).trim().startsWith('SELECT') &&
      LEDGER_SELECTS.some(t => String(sql).includes(t))
    ) {
      throw new Error('mock: SQLite busy');
    }
    if (String(sql).includes('COUNT(*) as count')) {
      return {rows: {_array: [{count: 0}], length: 1}};
    }
    if (String(sql).includes('FROM user_stats')) {
      return {rows: {_array: [STATS_ROW], length: 1}};
    }
    return {rows: {_array: [], length: 0}};
  });
  // The REAL service, over the same fake `executeSql`.
  setAchievementServiceInstance(
    new AchievementService(
      mockDb as unknown as ConstructorParameters<typeof AchievementService>[0],
    ),
  );
});

afterEach(() => {
  setSyncEngine(null as never);
});

afterAll(() => {
  setAchievementServiceInstance(null);
});

describe('R9-129 — a failed read of the review log is not "no history"', () => {
  it('the export marks reviewEvents, and its import deletes nothing', async () => {
    mockState.reviewReadFails = true;
    const {payload, degradedSections} = await buildBackup();
    expect(degradedSections).toContain('reviewEvents');
    expect(payload.meta?.degradedSections).toContain('reviewEvents');

    mockState.reviewReadFails = false;
    mockDb.executeSql.mockClear();
    const result = await importBackup(JSON.parse(JSON.stringify(payload)));
    expect(
      sqlRun().filter(s => s.startsWith('DELETE FROM review_events')),
    ).toHaveLength(0);
    expect(result.failedSections).toContain('reviewEvents');
    expect(result.restoredSections).not.toContain('reviewEvents');
  });

  it('CONTROL: a healthy read exports the log and the import replaces it', async () => {
    const {payload, degradedSections} = await buildBackup();
    expect(degradedSections).not.toContain('reviewEvents');
    expect(payload.memory.reviewEvents).toHaveLength(1);

    mockDb.executeSql.mockClear();
    const result = await importBackup(JSON.parse(JSON.stringify(payload)));
    expect(
      sqlRun().filter(s => s.startsWith('DELETE FROM review_events')),
    ).toHaveLength(1);
    expect(result.restoredSections).toContain('reviewEvents');
  });

  it('the fresh-device seed does not take a failed read for a new device', async () => {
    mockSummaryDoc = SUMMARY;
    await AsyncStorage.setItem('@review_log_owner_uid', 'ana');
    mockState.reviewReadFails = true;
    await seedMemoryStatsFloorIfFresh('ana');
    expect(await AsyncStorage.getItem('@memory_stats_floor')).toBeNull();
    expect(
      await AsyncStorage.getItem('@memory_stats_floor_banner_pending'),
    ).toBeNull();

    // CONTROL: the same device with no history at all IS seeded.
    mockState.reviewReadFails = false;
    const db = await (
      DatabaseModule as unknown as {
        __mockInstance: {getDatabase: () => Promise<{getAllAsync: jest.Mock}>};
      }
    ).__mockInstance.getDatabase();
    db.getAllAsync.mockResolvedValueOnce([]);
    await seedMemoryStatsFloorIfFresh('ana');
    expect(await AsyncStorage.getItem('@memory_stats_floor')).not.toBeNull();
  });

  it('the cloud aggregate is not overwritten with the floor alone', async () => {
    await AsyncStorage.setItem('@review_log_owner_uid', 'ana');
    await AsyncStorage.setItem('@memory_stats_floor', JSON.stringify(SUMMARY));
    setSyncEngine({getActiveUid: () => 'ana'} as never);

    mockState.reviewReadFails = true;
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).not.toHaveBeenCalled();

    // CONTROL: a healthy read writes the summary.
    mockState.reviewReadFails = false;
    await maybeWriteMemoryStatsSummary();
    expect(mockDocSet).toHaveBeenCalledTimes(1);
  });
});

describe('R9-131 — the two halves that protect the reading history', () => {
  const LEDGERS = [
    'achievements.streakLog',
    'achievements.completedBooks',
    'achievements.bookReadingLog',
    'achievements.chaptersReadLog',
  ];

  it('the export of the real service marks the four ledgers when they fail', async () => {
    mockState.ledgerReadsFail = true;
    const {degradedSections} = await buildBackup();
    expect(degradedSections).toEqual(expect.arrayContaining(LEDGERS));
    expect(degradedSections).not.toContain('achievements.stats');
  });

  it('the real restoreBackup does not DELETE a ledger the file marks degraded', async () => {
    mockState.ledgerReadsFail = true;
    const {payload} = await buildBackup();

    mockState.ledgerReadsFail = false;
    mockDb.executeSql.mockClear();
    const result = await importBackup(JSON.parse(JSON.stringify(payload)));
    const deletes = sqlRun().filter(s => s.startsWith('DELETE FROM'));
    for (const table of [
      'reading_streak_log',
      'completed_books',
      'book_reading_log',
      'chapters_read_log',
    ]) {
      expect(deletes.filter(s => s.includes(table))).toHaveLength(0);
    }
    expect(result.failedSections).toEqual(expect.arrayContaining(LEDGERS));
  });

  it('CONTROL: a healthy export lets the import replace the four ledgers', async () => {
    const {payload, degradedSections} = await buildBackup();
    expect(degradedSections).toEqual([]);

    mockDb.executeSql.mockClear();
    await importBackup(JSON.parse(JSON.stringify(payload)));
    const deletes = sqlRun().filter(s => s.startsWith('DELETE FROM'));
    for (const table of [
      'reading_streak_log',
      'completed_books',
      'book_reading_log',
      'chapters_read_log',
    ]) {
      expect(deletes.filter(s => s.includes(table))).toHaveLength(1);
    }
  });
});
