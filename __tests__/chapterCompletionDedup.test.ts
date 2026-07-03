/**
 * Regression test for AchievementService.trackChapterCompleted — before this
 * fix, `total_chapters_read` was incremented unconditionally on every 5s
 * reader dwell, so re-opening the SAME chapter repeatedly inflated the
 * CHAPTERS achievement category. The fix routes the counter through a
 * forward-only `chapters_read_log` ledger keyed by (book, chapter), the same
 * "can't double-count or drift" shape already used for `total_books_completed`
 * / `completed_books` (see `syncBookCompletion.test.ts`).
 */
import {AchievementService} from '../src/lib/achievements/AchievementService';
import {ACHIEVEMENT_DEFINITIONS} from '../src/lib/achievements/definitions';
import type {BibleDatabase} from '../src/lib/database';

interface SqlResult {
  rows: {_array: Record<string, unknown>[]; length: number};
}

/** Minimal in-memory stand-in for the SQLite-backed BibleDatabase. */
class FakeDb {
  chaptersRead = new Set<string>();
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

    if (s.startsWith('INSERT OR IGNORE INTO chapters_read_log')) {
      const [book, chapter] = params as [string, number];
      this.chaptersRead.add(`${book}/${chapter}`);
      return this.result([]);
    }
    if (
      s.includes(
        'total_chapters_read = (SELECT COUNT(*) FROM chapters_read_log)',
      )
    ) {
      this.stats.total_chapters_read = this.chaptersRead.size;
      return this.result([]);
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
    if (s.startsWith('UPDATE user_achievements SET current_progress = ?')) {
      const [progress, id] = params as [number, string];
      const cur = this.achievements.get(id);
      if (cur) cur.current_progress = progress;
      return this.result([]);
    }
    if (s.includes('total_points = ?')) {
      const [points, level] = params as [number, number, number];
      this.stats.total_points = points;
      this.stats.level = level;
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

describe('AchievementService.trackChapterCompleted — dedup by (book, chapter)', () => {
  it('counts a chapter once on its first read', async () => {
    const {service, db} = makeService();

    await service.trackChapterCompleted('John', 3);

    expect(db.stats.total_chapters_read).toBe(1);
  });

  it('does NOT inflate the count when the same chapter is re-read (the repro)', async () => {
    const {service, db} = makeService();

    await service.trackChapterCompleted('John', 3);
    await service.trackChapterCompleted('John', 3);
    await service.trackChapterCompleted('John', 3);
    await service.trackChapterCompleted('John', 3);
    await service.trackChapterCompleted('John', 3);

    expect(db.stats.total_chapters_read).toBe(1);
  });

  it('counts distinct chapters of the same book separately', async () => {
    const {service, db} = makeService();

    await service.trackChapterCompleted('John', 3);
    await service.trackChapterCompleted('John', 4);
    await service.trackChapterCompleted('John', 3);

    expect(db.stats.total_chapters_read).toBe(2);
  });

  it('counts the same chapter number across different books separately', async () => {
    const {service, db} = makeService();

    await service.trackChapterCompleted('John', 3);
    await service.trackChapterCompleted('Genesis', 3);

    expect(db.stats.total_chapters_read).toBe(2);
  });

  it('canonicalizes Spanish book names so they dedupe against the English form', async () => {
    const {service, db} = makeService();

    await service.trackChapterCompleted('Juan', 3);
    await service.trackChapterCompleted('John', 3);

    expect(db.stats.total_chapters_read).toBe(1);
  });
});
