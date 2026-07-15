/**
 * Regression test for a false-positive achievement unlock via sync.
 *
 * Achievements are 100% local — there is no Firestore sync adapter for
 * achievements/user_stats (see `src/lib/sync/registerOfflineAdapters.ts`,
 * which only registers notes/highlights/reviewEvents). But highlight
 * CONTENT does sync: a reinstall or a fresh sync pulldown can pull down an
 * old highlight via `applyRemoteUpsert` (`src/lib/sync/adapters/highlights.ts`
 * → `HighlightService.addHighlight()` directly), which silently pushes the
 * live `COUNT(*) FROM highlights` to >= 1 without ever calling
 * `checkAchievements()`.
 *
 * Before the fix, `first_highlight` then sat "secretly already earned" but
 * still `is_unlocked = 0` in the DB until the NEXT unrelated tracked action
 * (a verse read, a search, a note) ran the generic `checkAchievements()`
 * loop and "discovered" it — popping the celebratory unlock modal for a
 * highlight the user never created in that session. This is what Victor
 * reported: the "¡Logro Desbloqueado! Primera Marca" popup despite not
 * having created a highlight in that session.
 *
 * The fix (`AchievementService.initialize()`) runs the same silent backfill
 * `backfillBookCompletion()` already does for books — a discarded
 * `checkAchievements()` call at startup — so anything already satisfied at
 * launch (like a highlight that arrived via sync before this device's own
 * `AchievementService` ever initialized) is marked unlocked quietly, and
 * only a genuine NEW crossing after that baseline ever notifies.
 */
import {AchievementService} from '../src/lib/achievements/AchievementService';
import {ACHIEVEMENT_DEFINITIONS} from '../src/lib/achievements/definitions';
import type {BibleDatabase} from '../src/lib/database';

interface SqlResult {
  rows: {_array: Record<string, unknown>[]; length: number};
}

/**
 * Minimal in-memory stand-in for the SQLite-backed BibleDatabase, extended
 * (beyond `chapterCompletionDedup.test.ts`'s FakeDb) to also implement
 * `getDatabase()` — `initialize()` and `countRowsSafely()` go through the
 * raw expo-sqlite handle (`execAsync`/`runAsync`/`getFirstAsync`), not the
 * `executeSql` wrapper.
 *
 * `highlightsCount` stands in for the real `highlights` table row count:
 * tests set it directly to simulate a row already present (via sync, or via
 * the normal add-highlight path) BEFORE any AchievementService call reads it.
 */
class FakeDb {
  highlightsCount = 0;
  notesCount = 0;
  favoritesCount = 0;
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

  /** Raw expo-sqlite handle used by `initialize()` and `countRowsSafely()`. */
  async getDatabase() {
    return {
      execAsync: async (_sql: string) => undefined,
      runAsync: async (_sql: string, _params?: unknown[]) => undefined,
      getFirstAsync: async <T>(sql: string): Promise<T | null> => {
        const s = sql.trim();
        if (s.includes('FROM highlights')) {
          return {n: this.highlightsCount} as unknown as T;
        }
        if (s.includes('FROM notes')) {
          return {n: this.notesCount} as unknown as T;
        }
        if (s.includes('FROM favorites')) {
          return {n: this.favoritesCount} as unknown as T;
        }
        return {n: 0} as unknown as T;
      },
    };
  }

  async executeSql(sql: string, params: unknown[] = []): Promise<SqlResult> {
    const s = sql.trim();

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
    if (s.includes('total_searches = total_searches + 1')) {
      this.stats.total_searches = Number(this.stats.total_searches) + 1;
      return this.result([]);
    }
    if (s.includes('total_highlights = total_highlights + 1')) {
      this.stats.total_highlights = Number(this.stats.total_highlights) + 1;
      return this.result([]);
    }
    // reading_streak_log lookups (recomputeReadingStreak) — no log rows.
    if (s.startsWith('SELECT date FROM reading_streak_log')) {
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

describe('AchievementService — startup backfill prevents false-positive sync unlocks', () => {
  it(
    'a highlight already present at startup (simulating a synced-in row) is ' +
      'unlocked SILENTLY during initialize(), and does NOT show up as ' +
      'newly-unlocked from the next unrelated tracked action (the bug: ' +
      "Victor's false-positive popup)",
    async () => {
      const {service, db} = makeService();

      // Simulate a highlight pulled down by sync BEFORE this device's
      // AchievementService ever initializes — bypasses trackHighlight()
      // entirely, exactly like `applyRemoteUpsert` calling
      // `HighlightService.addHighlight()` directly.
      db.highlightsCount = 1;

      await service.initialize();

      // The user-visible symptom first (Victor's actual bug report): the
      // next unrelated tracked action (search, in this case — nothing to do
      // with highlights) must NOT report first_highlight as newly unlocked.
      // It was already unlocked at init, so `unlockAchievement` returns
      // false for it and it's excluded from the notify list — no popup.
      const newlyUnlocked = await service.trackSearch();

      expect(newlyUnlocked.map(a => a.id)).not.toContain('first_highlight');

      // And the underlying DB state confirms WHY: the backfill unlocked it
      // already, silently, during initialize() — not the trackSearch() call.
      expect(db.achievements.get('first_highlight')?.is_unlocked).toBe(1);
    },
  );

  it('a highlight added AFTER init, via the normal path, still correctly notifies', async () => {
    const {service, db} = makeService();

    // No highlights yet at startup — first_highlight stays locked.
    await service.initialize();
    expect(db.achievements.get('first_highlight')?.is_unlocked).toBe(0);

    // Normal path: the highlight row is added (live count goes to 1), then
    // the UI calls trackHighlight() to run the check.
    db.highlightsCount = 1;
    const newlyUnlocked = await service.trackHighlight();

    expect(newlyUnlocked.map(a => a.id)).toContain('first_highlight');
    expect(db.achievements.get('first_highlight')?.is_unlocked).toBe(1);
  });
});
