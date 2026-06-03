/**
 * Integration test for AchievementService.syncBookCompletion — the Sprint 64
 * fix that wires the previously-DEAD book-completion chain. Before the fix,
 * `trackBookCompleted` was never called, so `total_books_completed` stayed 0
 * forever and `first_book` (and the whole BOOKS chain + psalms/proverbs/gospels)
 * could never unlock. These tests reproduce that gap and lock the new behavior
 * against a minimal in-memory fake of the DB layer.
 */
import {AchievementService} from '../src/lib/achievements/AchievementService';
import {ACHIEVEMENT_DEFINITIONS} from '../src/lib/achievements/definitions';
import type {BibleDatabase} from '../src/lib/database';

interface SqlResult {
  rows: {_array: Record<string, unknown>[]; length: number};
}

/** Minimal in-memory stand-in for the SQLite-backed BibleDatabase. */
class FakeDb {
  completedBooks = new Map<string, number>();
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

    if (s.startsWith('SELECT book_name FROM completed_books')) {
      return this.result(
        [...this.completedBooks.keys()].map(book_name => ({book_name})),
      );
    }
    if (s.startsWith('INSERT OR IGNORE INTO completed_books')) {
      const [name, ts] = params as [string, number];
      if (!this.completedBooks.has(name)) this.completedBooks.set(name, ts);
      return this.result([]);
    }
    if (
      s.includes(
        'total_books_completed = (SELECT COUNT(*) FROM completed_books)',
      )
    ) {
      this.stats.total_books_completed = this.completedBooks.size;
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
      // params: [now, requirement, id]
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

const idsOf = (a: {id: string}[]): string[] => a.map(x => x.id);

describe('AchievementService.syncBookCompletion', () => {
  it('credits a first completed book and unlocks first_book (the dead-chain repro)', async () => {
    const {service, db} = makeService();

    // Baseline reproduces the bug: nothing ever credited a book.
    expect(db.stats.total_books_completed).toBe(0);
    expect(db.achievements.get('first_book')?.is_unlocked).toBe(0);

    const unlocked = await service.syncBookCompletion(['Jude']);

    expect(db.completedBooks.has('Jude')).toBe(true);
    expect(db.stats.total_books_completed).toBe(1);
    expect(idsOf(unlocked)).toContain('first_book');
    expect(db.achievements.get('first_book')?.is_unlocked).toBe(1);
  });

  it('is idempotent — re-crediting the same book counts once and unlocks nothing new', async () => {
    const {service, db} = makeService();
    await service.syncBookCompletion(['Jude']);

    const again = await service.syncBookCompletion(['Jude']);

    expect(again).toEqual([]);
    expect(db.completedBooks.size).toBe(1);
    expect(db.stats.total_books_completed).toBe(1);
  });

  it('canonicalizes Spanish names and de-dupes within a call', async () => {
    const {service, db} = makeService();
    // "Salmos" is the Spanish name for Psalms; both should map to one entry.
    const unlocked = await service.syncBookCompletion(['Salmos', 'Psalms']);

    expect(db.completedBooks.has('Psalms')).toBe(true);
    expect(db.completedBooks.size).toBe(1);
    expect(idsOf(unlocked)).toContain('psalms_complete');
  });

  it('unlocks gospels_complete only once all four Gospels are credited', async () => {
    const {service, db} = makeService();

    let unlocked = await service.syncBookCompletion([
      'Matthew',
      'Mark',
      'Luke',
    ]);
    expect(idsOf(unlocked)).not.toContain('gospels_complete');
    expect(db.achievements.get('gospels_complete')?.is_unlocked).toBe(0);

    unlocked = await service.syncBookCompletion(['John']);
    expect(idsOf(unlocked)).toContain('gospels_complete');
    expect(db.achievements.get('gospels_complete')?.is_unlocked).toBe(1);
  });

  it('fires the BOOKS milestone (books_5) when five books are completed', async () => {
    const {service, db} = makeService();
    const unlocked = await service.syncBookCompletion([
      'Jude',
      'Obadiah',
      'Philemon',
      'Haggai',
      'Titus',
    ]);

    expect(db.stats.total_books_completed).toBe(5);
    expect(idsOf(unlocked)).toEqual(
      expect.arrayContaining(['first_book', 'books_5']),
    );
  });

  it('returns [] for an empty list without touching the ledger', async () => {
    const {service, db} = makeService();
    const unlocked = await service.syncBookCompletion([]);
    expect(unlocked).toEqual([]);
    expect(db.completedBooks.size).toBe(0);
    expect(db.stats.total_books_completed).toBe(0);
  });
});
