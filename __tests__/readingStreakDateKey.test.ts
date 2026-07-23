/**
 * Batch6 reader-feedback item 14 ("anillo morado" disappearing) — the
 * reading streak used to key `reading_streak_log` by the UTC calendar day
 * (`new Date().toISOString().split('T')[0]`) while every other daily habit
 * (devotion, mood/feelings) already keyed by the LOCAL day. For a
 * negative-UTC-offset user, those two bases disagree for several hours every
 * evening — a chapter read then could file under a UTC "tomorrow" the other
 * three habits don't recognize as today yet, making an intact streak's ring
 * render as untouched.
 *
 * The fix unifies all four onto one shared `localDayKey` (`src/lib/utils/
 * dateKey.ts`, the same function `feelingsDateKey` now delegates to). These
 * tests assert the INVARIANT the fix guarantees — reading's day-key equals
 * the other habits' day-key for the same instant — rather than an absolute
 * date string, so they hold regardless of the machine's own timezone.
 */
import {AchievementService} from '../src/lib/achievements/AchievementService';
import {ACHIEVEMENT_DEFINITIONS} from '../src/lib/achievements/definitions';
import {localDayKey} from '../src/lib/utils/dateKey';
import {feelingsDateKey} from '../src/features/study/feelingsLog';
import type {BibleDatabase} from '../src/lib/database';

interface SqlResult {
  rows: {_array: Record<string, unknown>[]; length: number};
}

/** Minimal in-memory stand-in covering the SQL trackVersesRead touches. */
class FakeDb {
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

    if (s.startsWith('INSERT INTO reading_streak_log')) {
      this.streakDates.add(params[0] as string);
      return this.result([]);
    }
    if (s.startsWith('SELECT date FROM reading_streak_log')) {
      return this.result([...this.streakDates].map(date => ({date})));
    }
    if (s.startsWith('UPDATE user_stats SET current_streak')) {
      const [current, longest] = params as [number, number];
      this.stats.current_streak = current;
      this.stats.longest_streak = longest;
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
    return this.result([]);
  }
}

function makeService(): {service: AchievementService; db: FakeDb} {
  const db = new FakeDb();
  const service = new AchievementService(db as unknown as BibleDatabase);
  return {service, db};
}

describe('localDayKey — the shared daily-habit day-key', () => {
  it('is the exact function feelingsDateKey delegates to', () => {
    // Referential equality, not just equal output — a future edit that
    // reintroduces a second, independently-computed day formula anywhere
    // would break this immediately.
    expect(feelingsDateKey).toBe(localDayKey);
  });

  it('formats a local calendar day as zero-padded YYYY-MM-DD', () => {
    // Local Date components in, local Date components out — deterministic in
    // any timezone the test runner happens to use.
    expect(localDayKey(new Date(2026, 0, 5, 23, 0).getTime())).toBe(
      '2026-01-05',
    );
    expect(localDayKey(new Date(2026, 11, 31, 0, 30).getTime())).toBe(
      '2026-12-31',
    );
  });
});

describe('AchievementService.trackVersesRead — reading_streak_log day-key', () => {
  it('keys the streak log by the SAME local day as the other habits', async () => {
    const {service, db} = makeService();
    await service.trackVersesRead(5, 30, 'Genesis');

    const now = Date.now();
    expect(db.streakDates.has(localDayKey(now))).toBe(true);
    expect(db.streakDates.has(feelingsDateKey(now))).toBe(true);
    // Exactly one row — proves it's the SAME key, not two different ones
    // that happen to both be present.
    expect(db.streakDates.size).toBe(1);
  });

  it('recomputes an intact current streak from local-day-keyed log entries', async () => {
    const {service, db} = makeService();
    const today = localDayKey(Date.now());
    const oneDayMs = 86_400_000;
    const yesterday = localDayKey(Date.now() - oneDayMs);
    const twoDaysAgo = localDayKey(Date.now() - 2 * oneDayMs);

    // Seed 2 prior local-keyed reading days directly (as if written by
    // earlier trackVersesRead calls), then read today for real.
    db.streakDates.add(twoDaysAgo);
    db.streakDates.add(yesterday);
    await service.trackVersesRead(5, 30);

    expect(db.streakDates.has(today)).toBe(true);
    expect(db.stats.current_streak).toBe(3);
  });
});
