/**
 * AchievementService.restoreBackup — the same "validate before destructive
 * delete" data-loss defect that was fixed one layer up in BackupService.ts
 * (see backupServiceImport.test.ts's "Bug 2" suite) existed again here: the
 * 4 log-shaped sections (streakLog/completedBooks/bookReadingLog/
 * chaptersReadLog) each unconditionally ran DELETE-then-insert. If the
 * caller's per-row coercion had already reduced a REAL (non-empty) backup
 * section down to zero survivors, this method still wiped the local table
 * clean before "inserting" nothing — silently destroying real existing
 * data while the outer BackupService.importBackup call still reported the
 * overall restore as successful.
 *
 * `restoreBackup` only ever receives the already-coerced arrays, so on its
 * own it cannot distinguish "the backup legitimately has zero entries for
 * this section" from "the backup had entries and every one of them was
 * garbage" — both collapse to an empty array by the time they get here.
 * The fix threads that distinction through as `data.allFailed`, computed by
 * the caller (BackupService.importBackup) using the same
 * `allRowsFailedValidation` helper the outer sections already use.
 *
 * These tests exercise `restoreBackup` directly against a minimal in-memory
 * fake of `executeSql` (no real SQLite/react-native) and lock in the fix:
 *   - a section flagged `allFailed` must skip its destructive DELETE
 *     entirely, leaving whatever local data existed untouched;
 *   - a section that's genuinely empty (flag absent/false) must still
 *     DELETE-then-insert-nothing as before (REPLACE-with-empty semantics
 *     must not regress).
 */
import {
  AchievementService,
  type AchievementBackupData,
} from '../src/lib/achievements/AchievementService';
import type {BibleDatabase} from '../src/lib/database';

interface FakeSqlCall {
  sql: string;
  params: unknown[];
}

function makeFakeDb(): {
  db: Pick<BibleDatabase, 'executeSql'>;
  calls: FakeSqlCall[];
} {
  const calls: FakeSqlCall[] = [];
  const executeSql = jest.fn(async (sql: string, params: unknown[] = []) => {
    calls.push({sql, params});
    return {rows: {_array: [], length: 0}};
  });
  return {
    db: {executeSql} as unknown as Pick<BibleDatabase, 'executeSql'>,
    calls,
  };
}

function sqlCallsStartingWith(
  calls: FakeSqlCall[],
  prefix: string,
): FakeSqlCall[] {
  return calls.filter(c => c.sql.trim().startsWith(prefix));
}

/** A minimal, fully-empty `AchievementBackupData`. Tests override only what they need. */
function baseData(
  overrides: Partial<AchievementBackupData> = {},
): AchievementBackupData {
  return {
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
    ...overrides,
  };
}

describe('AchievementService.restoreBackup — corrupted-backup data-loss guard', () => {
  describe('streakLog (reading_streak_log)', () => {
    it('does NOT wipe reading_streak_log when allFailed.streakLog is set (every row failed validation upstream)', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(
        baseData({
          streakLog: [], // coerced-to-empty upstream because every row failed
          allFailed: {streakLog: true},
        }),
      );

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM reading_streak_log'),
      ).toHaveLength(0);
      expect(
        sqlCallsStartingWith(calls, 'INSERT INTO reading_streak_log'),
      ).toHaveLength(0);
    });

    it('still clears reading_streak_log via a genuinely empty array (REPLACE semantics preserved)', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(baseData({streakLog: []}));

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM reading_streak_log'),
      ).toHaveLength(1);
    });

    it('deletes then inserts survivors normally when streakLog has real entries', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(
        baseData({
          streakLog: [{date: '2026-08-01', versesRead: 10, timeSpent: 60}],
        }),
      );

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM reading_streak_log'),
      ).toHaveLength(1);
      const inserts = sqlCallsStartingWith(
        calls,
        'INSERT INTO reading_streak_log',
      );
      expect(inserts).toHaveLength(1);
      expect(inserts[0].params).toEqual(['2026-08-01', 10, 60]);
    });
  });

  describe('completedBooks (completed_books)', () => {
    it('does NOT wipe completed_books when allFailed.completedBooks is set', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(
        baseData({
          completedBooks: [],
          allFailed: {completedBooks: true},
        }),
      );

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM completed_books'),
      ).toHaveLength(0);
    });

    it('still clears completed_books via a genuinely empty array', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(baseData({completedBooks: []}));

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM completed_books'),
      ).toHaveLength(1);
    });
  });

  describe('bookReadingLog (book_reading_log)', () => {
    it('does NOT wipe book_reading_log when allFailed.bookReadingLog is set', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(
        baseData({
          bookReadingLog: [],
          allFailed: {bookReadingLog: true},
        }),
      );

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM book_reading_log'),
      ).toHaveLength(0);
    });

    it('still clears book_reading_log via a genuinely empty array', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(baseData({bookReadingLog: []}));

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM book_reading_log'),
      ).toHaveLength(1);
    });
  });

  describe('chaptersReadLog (chapters_read_log)', () => {
    it('does NOT wipe chapters_read_log when allFailed.chaptersReadLog is set', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(
        baseData({
          chaptersReadLog: [],
          allFailed: {chaptersReadLog: true},
        }),
      );

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM chapters_read_log'),
      ).toHaveLength(0);
    });

    it('still clears chapters_read_log via a genuinely empty array', async () => {
      const {db, calls} = makeFakeDb();
      const service = new AchievementService(db as BibleDatabase);

      await service.restoreBackup(baseData({chaptersReadLog: []}));

      expect(
        sqlCallsStartingWith(calls, 'DELETE FROM chapters_read_log'),
      ).toHaveLength(1);
    });
  });

  it('always updates user_stats and known-id achievements regardless of allFailed flags', async () => {
    const {db, calls} = makeFakeDb();
    const service = new AchievementService(db as BibleDatabase);

    await service.restoreBackup(
      baseData({
        stats: {
          totalVersesRead: 500,
          totalChaptersRead: 20,
          totalBooksCompleted: 2,
          totalReadingTime: 300,
          currentStreak: 5,
          longestStreak: 10,
          lastReadDate: '2026-08-04',
          totalHighlights: 1,
          totalNotes: 1,
          totalBookmarks: 1,
          totalSearches: 1,
          totalShares: 1,
          level: 3,
          totalPoints: 900,
        },
        allFailed: {
          streakLog: true,
          completedBooks: true,
          bookReadingLog: true,
          chaptersReadLog: true,
        },
      }),
    );

    const statUpdates = sqlCallsStartingWith(calls, 'UPDATE user_stats');
    expect(statUpdates).toHaveLength(1);
    expect(statUpdates[0].params).toContain(500);
    expect(statUpdates[0].params).toContain(900);
  });
});
