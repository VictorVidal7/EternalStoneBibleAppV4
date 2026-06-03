/**
 * Sprint 65 — REAL per-book reading metrics.
 *
 * Two layers:
 *   1. the PURE model (normalize / rank / top) — deterministic, no DB;
 *   2. an integration test that the reader hot path (trackVersesRead) actually
 *      persists the per-book aggregate and getBookReadingLog reads it back,
 *      against a minimal in-memory fake of the DB layer (mirrors the FakeDb in
 *      syncBookCompletion.test.ts).
 */
import {
  normalizeBookReadingLog,
  rankBookReading,
  topBookReading,
  type BookReadingEntry,
} from '../src/lib/reading/bookReadingLog';
import {AchievementService} from '../src/lib/achievements/AchievementService';
import {ACHIEVEMENT_DEFINITIONS} from '../src/lib/achievements/definitions';
import type {BibleDatabase} from '../src/lib/database';

// ---------------------------------------------------------------------------
// 1. Pure model
// ---------------------------------------------------------------------------
describe('bookReadingLog pure model', () => {
  const make = (
    book: string,
    versesRead: number,
    timeSpent: number,
    lastReadAt = 0,
  ): BookReadingEntry => ({book, versesRead, timeSpent, lastReadAt});

  describe('normalizeBookReadingLog', () => {
    it('coerces, drops empty book names, and folds duplicates', () => {
      const out = normalizeBookReadingLog([
        {book: 'John', versesRead: 20, timeSpent: 60, lastReadAt: 100},
        {book: '  ', versesRead: 5, timeSpent: 5, lastReadAt: 5},
        {book: 'John', versesRead: 10, timeSpent: 30, lastReadAt: 200},
        {book: 'Mark', versesRead: -3, timeSpent: NaN, lastReadAt: 'x'},
      ]);
      const john = out.find(e => e.book === 'John')!;
      expect(john.versesRead).toBe(30);
      expect(john.timeSpent).toBe(90);
      expect(john.lastReadAt).toBe(200);
      const mark = out.find(e => e.book === 'Mark')!;
      expect(mark).toEqual({
        book: 'Mark',
        versesRead: 0,
        timeSpent: 0,
        lastReadAt: 0,
      });
      expect(out.find(e => e.book === '')).toBeUndefined();
    });

    it('tolerates null / undefined input', () => {
      expect(normalizeBookReadingLog(null)).toEqual([]);
      expect(normalizeBookReadingLog(undefined)).toEqual([]);
    });
  });

  describe('rankBookReading', () => {
    it('ranks by verses, then time, then recency, then name', () => {
      const ranked = rankBookReading([
        make('Mark', 50, 100, 10),
        make('John', 50, 200, 10), // same verses as Mark but more time → first
        make('Luke', 90, 10, 10), // most verses → wins outright
        make('Acts', 50, 200, 99), // ties John on verses+time, newer → before John
      ]);
      expect(ranked.map(e => e.book)).toEqual(['Luke', 'Acts', 'John', 'Mark']);
    });

    it('does not mutate the input', () => {
      const input = [make('John', 1, 1), make('Mark', 2, 2)];
      const copy = [...input];
      rankBookReading(input);
      expect(input).toEqual(copy);
    });
  });

  describe('topBookReading', () => {
    it('returns the most-read book by verses', () => {
      expect(
        topBookReading([make('John', 20, 60), make('Genesis', 80, 30)])?.book,
      ).toBe('Genesis');
    });

    it('returns null when there is no real data (empty / all-zero)', () => {
      expect(topBookReading([])).toBeNull();
      expect(topBookReading([make('John', 0, 120)])).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Integration: trackVersesRead persists the per-book aggregate
// ---------------------------------------------------------------------------
interface SqlResult {
  rows: {_array: Record<string, unknown>[]; length: number};
}

/** Minimal in-memory stand-in covering the SQL trackVersesRead touches. */
class FakeDb {
  bookLog = new Map<
    string,
    {verses_read: number; time_spent: number; last_read_at: number}
  >();
  streakDates = new Set<string>();
  stats: Record<string, number | string | null> = {
    id: 1,
    total_verses_read: 0,
    total_chapters_read: 0,
    total_books_completed: 0,
    total_reading_time: 0,
    current_streak: 0,
    longest_streak: 0,
    last_read_date: null,
    total_highlights: 0,
    total_notes: 0,
    total_bookmarks: 0,
    total_searches: 0,
    total_shares: 0,
    level: 1,
    total_points: 0,
    updated_at: 0,
  };
  achievements = new Map<
    string,
    {is_unlocked: number; current_progress: number}
  >();

  constructor() {
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      this.achievements.set(def.id, {is_unlocked: 0, current_progress: 0});
    }
  }

  private result(_array: Record<string, unknown>[]): SqlResult {
    return {rows: {_array, length: _array.length}};
  }

  async executeSql(sql: string, params: unknown[] = []): Promise<SqlResult> {
    const s = sql.trim();

    if (s.startsWith('INSERT INTO book_reading_log')) {
      const [name, verses, time, last] = params as [
        string,
        number,
        number,
        number,
      ];
      const prev = this.bookLog.get(name);
      if (prev) {
        prev.verses_read += verses;
        prev.time_spent += time;
        prev.last_read_at = last;
      } else {
        this.bookLog.set(name, {
          verses_read: verses,
          time_spent: time,
          last_read_at: last,
        });
      }
      return this.result([]);
    }
    if (
      s.startsWith('SELECT book_name, verses_read, time_spent, last_read_at')
    ) {
      return this.result(
        [...this.bookLog.entries()].map(([book_name, v]) => ({
          book_name,
          ...v,
        })),
      );
    }
    if (s.startsWith('INSERT INTO reading_streak_log')) {
      this.streakDates.add(params[0] as string);
      return this.result([]);
    }
    if (s.startsWith('SELECT date FROM reading_streak_log')) {
      return this.result([...this.streakDates].map(date => ({date})));
    }
    if (s.startsWith('SELECT COUNT(*) AS n FROM')) {
      return this.result([{n: 0}]);
    }
    if (s.includes('COUNT(*) as count FROM user_achievements')) {
      const count = [...this.achievements.values()].filter(
        a => a.is_unlocked === 1,
      ).length;
      return this.result([{count}]);
    }
    if (s.startsWith('SELECT * FROM user_stats WHERE id = 1')) {
      return this.result([{...this.stats}]);
    }
    if (
      s.startsWith('SELECT is_unlocked FROM user_achievements WHERE id = ?')
    ) {
      const id = params[0] as string;
      return this.result([
        {is_unlocked: this.achievements.get(id)?.is_unlocked ?? 0},
      ]);
    }
    if (s.startsWith('UPDATE user_achievements SET is_unlocked = 1')) {
      const [, requirement, id] = params as [number, number, string];
      this.achievements.set(id, {
        is_unlocked: 1,
        current_progress: requirement,
      });
      return this.result([]);
    }
    return this.result([]);
  }
}

function makeService(): {service: AchievementService; db: FakeDb} {
  const db = new FakeDb();
  const service = new AchievementService(db as unknown as BibleDatabase);
  return {service, db};
}

describe('AchievementService per-book reading log', () => {
  it('persists a per-book aggregate when a book is passed', async () => {
    const {service, db} = makeService();
    await service.trackVersesRead(20, 60, 'John');

    expect(db.bookLog.get('John')).toMatchObject({
      verses_read: 20,
      time_spent: 60,
    });
  });

  it('accumulates across reads and canonicalizes the Spanish name', async () => {
    const {service, db} = makeService();
    await service.trackVersesRead(20, 60, 'John');
    await service.trackVersesRead(10, 30, 'Juan'); // RVR1960 Spanish → John

    expect(db.bookLog.size).toBe(1);
    expect(db.bookLog.get('John')).toMatchObject({
      verses_read: 30,
      time_spent: 90,
    });
  });

  it('does NOT write a per-book row when no book is passed (legacy path)', async () => {
    const {service, db} = makeService();
    await service.trackVersesRead(15, 45);

    expect(db.bookLog.size).toBe(0);
  });

  it('getBookReadingLog reads the persisted aggregates back', async () => {
    const {service} = makeService();
    await service.trackVersesRead(20, 60, 'John');
    await service.trackVersesRead(80, 30, 'Genesis');

    const log = await service.getBookReadingLog();
    expect(topBookReading(log)?.book).toBe('Genesis');
    const john = log.find(e => e.book === 'John')!;
    expect(john).toMatchObject({versesRead: 20, timeSpent: 60});
  });
});
