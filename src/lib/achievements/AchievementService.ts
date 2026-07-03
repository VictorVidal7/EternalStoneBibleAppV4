/**
 * Achievement Management Service
 * Handles tracking, unlocking and notification of achievements
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleDatabase} from '../database';
import {Achievement, UserStats, ReadingStreak} from './types';
import {AchievementCategory} from './types';
import {ACHIEVEMENT_DEFINITIONS} from './definitions';
import {calculateLevel} from './types';
import {computeStreaks} from './streak';
import {getCategoryProgress} from './progress';
import {specialAchievementsForHour} from './specialAchievements';
import {detectCompletedBooks, gospelsComplete} from './bookCompletion';
import {canonicalizeProgressMap} from '../progress/progressKeys';
import {canonicalBookName, getBookByName} from '../../constants/bible';
import {
  normalizeBookReadingLog,
  type BookReadingEntry,
} from '../reading/bookReadingLog';

export class AchievementService {
  private db: BibleDatabase;
  private stats: UserStats | null = null;

  constructor(database: BibleDatabase) {
    this.db = database;
  }

  /**
   * Initializes achievement tables
   */
  async initialize(): Promise<void> {
    // Execute each SQL statement separately to avoid problems with execAsync
    const db = await this.db.getDatabase();

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id TEXT PRIMARY KEY,
        is_unlocked INTEGER DEFAULT 0,
        current_progress INTEGER DEFAULT 0,
        unlocked_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_verses_read INTEGER DEFAULT 0,
        total_chapters_read INTEGER DEFAULT 0,
        total_books_completed INTEGER DEFAULT 0,
        total_reading_time INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_read_date TEXT,
        total_highlights INTEGER DEFAULT 0,
        total_notes INTEGER DEFAULT 0,
        total_bookmarks INTEGER DEFAULT 0,
        total_searches INTEGER DEFAULT 0,
        total_shares INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        total_points INTEGER DEFAULT 0,
        updated_at INTEGER NOT NULL
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reading_streak_log (
        date TEXT PRIMARY KEY,
        verses_read INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0
      )
    `);

    // Forward-only ledger of which books the user has read to completion, keyed
    // by canonical English name. Authoritative source for `total_books_completed`
    // so the count can never double-count or drift; additive (CREATE IF NOT
    // EXISTS), so no migration of existing installs. Sprint 64.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS completed_books (
        book_name TEXT PRIMARY KEY,
        completed_at INTEGER NOT NULL
      )
    `);

    // Forward-only REAL per-book reading aggregates, keyed by canonical English
    // name. Fed from the reader hot path (trackVersesRead) so "most-read book"
    // can rank by actual verses + time instead of the chapters-touched proxy.
    // Additive (CREATE IF NOT EXISTS), so no migration of existing installs and
    // no rebuild. Sprint 65.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS book_reading_log (
        book_name TEXT PRIMARY KEY,
        verses_read INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        last_read_at INTEGER NOT NULL DEFAULT 0
      )
    `);

    // Forward-only ledger of distinct (book, chapter) pairs ever read to
    // completion (the reader's 5s dwell timer). Authoritative source for
    // `total_chapters_read` so re-opening an already-read chapter can never
    // inflate the CHAPTERS achievement category — same fix shape as
    // `completed_books`/`total_books_completed`. Additive, no migration.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS chapters_read_log (
        book_name TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        first_read_at INTEGER NOT NULL,
        PRIMARY KEY (book_name, chapter)
      )
    `);

    await db.runAsync(
      'INSERT OR IGNORE INTO user_stats (id, updated_at) VALUES (?, ?)',
      [1, Date.now()],
    );

    await this.initializeAchievements();

    // Self-heal the reading streak from the per-day log on every launch. This
    // recovers users whose streak was pinned at 0 by the old incremental
    // updater (Sprint 58 bug) and resets `current_streak` to 0 when a day was
    // missed between sessions, without needing a new read to trigger it.
    await this.recomputeReadingStreak();

    // Backfill book completion from the existing reading footprint so users who
    // had already finished books before this feature shipped get credited (and
    // the BOOKS achievement chain unlocks) on first launch. Silent: the unlock
    // list is intentionally discarded here — there is no UI listening at init,
    // and the achievements are marked unlocked in the DB regardless.
    await this.backfillBookCompletion();
  }

  /**
   * One-time-per-launch reconciliation of the completed-books ledger with the
   * ReadingProgress map (AsyncStorage, the same `{book:{chapter:pct}}` the
   * reader writes). Idempotent and best-effort — a failure here never blocks
   * startup, and the reader's live detection still credits books as they are
   * read. Sprint 64.
   */
  private async backfillBookCompletion(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem('readingProgress');
      if (!raw) return;
      const map = canonicalizeProgressMap(JSON.parse(raw));
      const completed = detectCompletedBooks(
        map,
        name => getBookByName(name)?.chapters,
      );
      if (completed.length > 0) {
        await this.syncBookCompletion(completed);
      }
    } catch {
      // Non-fatal: backfill is a convenience, not a correctness requirement.
    }
  }

  /**
   * Initializes all defined achievements
   */
  private async initializeAchievements(): Promise<void> {
    const now = Date.now();
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      const sql = `
        INSERT OR IGNORE INTO user_achievements (id, created_at)
        VALUES (?, ?)
      `;
      await this.db.executeSql(sql, [achievement.id, now]);
    }
  }

  /**
   * Gets user statistics
   */
  async getUserStats(): Promise<UserStats> {
    // Always compute the user-visible list counts fresh so the stats
    // screen doesn't drift from the actual data the user sees. The
    // `trackHighlight/trackNote/trackFavorite` writers in this service
    // were never wired into the "add" actions, so the user_stats
    // columns stay permanently at 0 across an install — counting the
    // tables directly fixes the desync without touching every call site.
    const [highlightsCount, notesCount, favoritesCount] = await Promise.all([
      this.countRowsSafely('highlights'),
      this.countRowsSafely('notes'),
      this.countRowsSafely('favorites'),
    ]);

    if (this.stats) {
      return {
        ...this.stats,
        totalHighlights: highlightsCount,
        totalNotes: notesCount,
        totalFavorites: favoritesCount,
      };
    }

    const sql = 'SELECT * FROM user_stats WHERE id = 1';
    const result = await this.db.executeSql(sql);
    const row = result.rows._array[0];

    const achievementsUnlocked = await this.getUnlockedAchievementsCount();
    const levelInfo = calculateLevel(row.total_points);
    const nextLevelPoints =
      levelInfo.maxPoints === Infinity
        ? 0
        : levelInfo.maxPoints - row.total_points;

    this.stats = {
      totalVersesRead: row.total_verses_read,
      totalChaptersRead: row.total_chapters_read,
      totalBooksCompleted: row.total_books_completed,
      totalReadingTime: row.total_reading_time,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastReadDate: row.last_read_date || '',
      totalHighlights: highlightsCount,
      totalNotes: notesCount,
      totalFavorites: favoritesCount,
      totalBookmarks: row.total_bookmarks,
      totalSearches: row.total_searches,
      totalShares: row.total_shares,
      level: row.level,
      totalPoints: row.total_points,
      pointsToNextLevel: nextLevelPoints,
      achievementsUnlocked,
      totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
    };

    return this.stats!;
  }

  /**
   * Count rows on a known-name table; returns 0 if the table does not
   * exist yet (e.g. first launch before HighlightService has run its
   * own CREATE TABLE).
   *
   * Goes straight to the raw expo-sqlite handle via getFirstAsync rather
   * than the executeSql wrapper: when the table is missing, expo throws a
   * confusing native error and the wrapper console.error's it (surfacing a
   * red LogBox "Open debugger" pill for an EXPECTED, already-handled miss).
   * The local try/catch keeps the same safe "return 0" contract silently.
   */
  private async countRowsSafely(table: string): Promise<number> {
    try {
      const db = await this.db.getDatabase();
      const row = await db.getFirstAsync<{n: number}>(
        `SELECT COUNT(*) AS n FROM ${table}`,
      );
      return row?.n ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Tracks verses read.
   *
   * `bookNameEn` (optional) is the book the verses belong to; when present the
   * read is also accumulated in the per-book `book_reading_log` so "most-read
   * book" can rank by REAL verses + time. Omitting it keeps the prior behavior
   * byte-identical (the lifetime counters + streak are unchanged). Sprint 65.
   */
  async trackVersesRead(
    count: number,
    timeSpent: number = 0,
    bookNameEn?: string,
  ): Promise<Achievement[]> {
    this.stats = null; // Invalidate cache
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    // Update statistics
    await this.db.executeSql(
      `UPDATE user_stats SET
        total_verses_read = total_verses_read + ?,
        total_reading_time = total_reading_time + ?,
        last_read_date = ?,
        updated_at = ?
       WHERE id = 1`,
      [count, timeSpent, today, now],
    );

    // Accumulate the REAL per-book aggregate (canonical English key). Upsert so
    // re-reading the same book keeps adding up; same dwell-credit semantics as
    // the lifetime counter above. Best-effort — a failure here must not block
    // the streak/achievement path below.
    const canonicalBook = bookNameEn ? canonicalBookName(bookNameEn) : '';
    if (canonicalBook) {
      try {
        await this.db.executeSql(
          `INSERT INTO book_reading_log (book_name, verses_read, time_spent, last_read_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(book_name) DO UPDATE SET
             verses_read = verses_read + excluded.verses_read,
             time_spent = time_spent + excluded.time_spent,
             last_read_at = excluded.last_read_at`,
          [canonicalBook, count, timeSpent, now],
        );
      } catch {
        // Non-fatal: the per-book log is an enrichment, not a correctness req.
      }
    }

    // Register in streak log BEFORE recomputing the streak — the streak is
    // derived from this log, not from an incremental counter (the old counter
    // ran before `last_read_date` was read and so never advanced).
    await this.db.executeSql(
      `INSERT INTO reading_streak_log (date, verses_read, time_spent)
       VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         verses_read = verses_read + excluded.verses_read,
         time_spent = time_spent + excluded.time_spent`,
      [today, count, timeSpent],
    );

    // Recompute current/longest streak from the log now that today is in it.
    await this.recomputeReadingStreak(today);

    // Unlock the time-of-day SPECIAL badges (early_bird / night_owl). These have
    // no backing stat counter so the generic checkAchievements loop can never
    // unlock them (getCategoryProgress(SPECIAL) === 0); they are event-driven by
    // the hour of THIS reading. Idempotent: unlocking an unlocked badge no-ops.
    for (const id of specialAchievementsForHour(new Date().getHours())) {
      await this.unlockAchievement(id);
    }

    // Check unlocked achievements
    return await this.checkAchievements();
  }

  /**
   * Tracks a completed chapter. Deduplicated by (book, chapter) via
   * `chapters_read_log` — re-reading the same chapter again is a no-op for
   * `total_chapters_read` (previously this incremented unconditionally on
   * every 5s dwell, so revisiting one chapter 5 times inflated the CHAPTERS
   * achievement category by 5).
   */
  async trackChapterCompleted(
    bookName: string,
    chapter: number,
  ): Promise<Achievement[]> {
    const canonical = canonicalBookName(bookName) ?? bookName;
    const now = Date.now();
    await this.db.executeSql(
      'INSERT OR IGNORE INTO chapters_read_log (book_name, chapter, first_read_at) VALUES (?, ?, ?)',
      [canonical, chapter, now],
    );
    this.stats = null;
    // Authoritative count from the ledger — can't drift or double-count,
    // same pattern as `total_books_completed`.
    await this.db.executeSql(
      'UPDATE user_stats SET total_chapters_read = (SELECT COUNT(*) FROM chapters_read_log), updated_at = ? WHERE id = 1',
      [now],
    );
    return await this.checkAchievements();
  }

  /**
   * Credit every book the user has read to completion and unlock the
   * book-completion chain. Replaces the old `trackBookCompleted` (which simply
   * incremented a counter and was DEAD — never called anywhere — so the BOOKS
   * category + psalms/proverbs/gospels_complete were all unreachable, Sprint 63).
   *
   * `completedBookNames` is the FULL set of currently-complete books (canonical
   * English names, from the pure `detectCompletedBooks`). This is idempotent and
   * authoritative:
   *   1. persist each not-yet-credited book in `completed_books`,
   *   2. set `total_books_completed` to the row COUNT (never double-counts/drifts),
   *   3. unlock the per-book SPECIAL badges Psalms / Proverbs / the 4 Gospels
   *      (the generic loop skips SPECIAL — it has no backing stat),
   *   4. run the generic loop so the BOOKS milestones (first_book … books_66) fire.
   *
   * Returns the achievements newly unlocked by THIS call so a live caller can
   * show the unlock modal; the init backfill discards the result. Sprint 64.
   */
  async syncBookCompletion(
    completedBookNames: string[],
  ): Promise<Achievement[]> {
    if (!Array.isArray(completedBookNames) || completedBookNames.length === 0) {
      return [];
    }
    this.stats = null;

    // Canonicalize + de-dupe (callers pass English names already; defensive).
    const wanted = Array.from(
      new Set(
        completedBookNames
          .map(name => canonicalBookName(name))
          .filter((name): name is string => !!name),
      ),
    );

    // Which books are already credited?
    const existing = await this.db.executeSql(
      'SELECT book_name FROM completed_books',
    );
    const credited = new Set<string>(
      existing.rows._array.map((row: {book_name: string}) => row.book_name),
    );

    const now = Date.now();
    const newlyCredited: string[] = [];
    for (const name of wanted) {
      if (credited.has(name)) continue;
      await this.db.executeSql(
        'INSERT OR IGNORE INTO completed_books (book_name, completed_at) VALUES (?, ?)',
        [name, now],
      );
      credited.add(name);
      newlyCredited.push(name);
    }

    if (newlyCredited.length === 0) {
      // Nothing new — keep the count consistent (cheap) and return early so we
      // don't re-run the achievement loop on every reader progress tick.
      return [];
    }

    // Authoritative count from the ledger — can't drift or double-count.
    await this.db.executeSql(
      'UPDATE user_stats SET total_books_completed = (SELECT COUNT(*) FROM completed_books), updated_at = ? WHERE id = 1',
      [now],
    );
    this.stats = null;

    const newlyUnlocked: Achievement[] = [];
    const pushUnlocked = (id: string): void => {
      const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === id);
      if (def) {
        newlyUnlocked.push({
          ...def,
          currentProgress: def.requirement,
          isUnlocked: true,
          unlockedAt: now,
        });
      }
    };

    // Per-book SPECIAL badges (skipped by the generic loop, no backing stat).
    const specialForBook: Record<string, string> = {
      Psalms: 'psalms_complete',
      Proverbs: 'proverbs_complete',
    };
    for (const name of newlyCredited) {
      const id = specialForBook[name];
      if (id && (await this.unlockAchievement(id))) {
        pushUnlocked(id);
      }
    }

    // Gospels: needs ALL four — derive from the full credited set.
    if (
      gospelsComplete(credited) &&
      (await this.unlockAchievement('gospels_complete'))
    ) {
      pushUnlocked('gospels_complete');
    }

    // BOOKS milestones now that total_books_completed reflects reality.
    const fromLoop = await this.checkAchievements();

    return [...newlyUnlocked, ...fromLoop];
  }

  /**
   * Recompute `current_streak` / `longest_streak` from `reading_streak_log`,
   * the authoritative per-day record of which calendar days the user read,
   * and persist them. Replaces the old incremental updater that was a no-op
   * because it read `last_read_date` only after it had been set to today
   * (Sprint 58 bug), leaving both columns at 0 forever.
   *
   * @param today Optional `YYYY-MM-DD` anchor for the "current" streak;
   *              defaults to the current UTC day (same basis as the log keys).
   */
  private async recomputeReadingStreak(today?: string): Promise<void> {
    const anchor = today ?? new Date().toISOString().split('T')[0];
    let dates: string[] = [];
    try {
      const result = await this.db.executeSql(
        'SELECT date FROM reading_streak_log',
      );
      dates = result.rows._array.map((row: {date: string}) => row.date);
    } catch {
      // Log table not ready yet (fresh install) — nothing to compute.
      return;
    }

    const {currentStreak, longestStreak} = computeStreaks(dates, anchor);
    await this.db.executeSql(
      'UPDATE user_stats SET current_streak = ?, longest_streak = ? WHERE id = 1',
      [currentStreak, longestStreak],
    );
    // Invalidate the cache so the next read reflects the new streak.
    this.stats = null;
  }

  /**
   * Tracks other actions. Each returns the achievements newly unlocked by its
   * own check run (Sprint 81) so call sites can pipe them into the global
   * `notifyAchievements` modal — before, the first note/highlight unlocked
   * either silently or only on the NEXT reading event, because nothing called
   * these and `checkAchievements` only ran from the reader hot path. The
   * highlight/note counts themselves come from live table counts in
   * `getUserStats` (their column bumps are cosmetic, double-counting is
   * impossible); `total_searches` has no backing table, so its column IS the
   * counter — which is why never calling trackSearch left first_search and
   * searches_50 permanently unreachable.
   */
  async trackHighlight(): Promise<Achievement[]> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_highlights = total_highlights + 1, updated_at = ? WHERE id = 1',
      [Date.now()],
    );
    return await this.checkAchievements();
  }

  async trackNote(): Promise<Achievement[]> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_notes = total_notes + 1, updated_at = ? WHERE id = 1',
      [Date.now()],
    );
    return await this.checkAchievements();
  }

  /**
   * Unlock the "walked the whole prophetic thread" badge (a one-off SPECIAL with
   * no stat counter, so it is unlocked explicitly when the reader has explored
   * every prophecy). Idempotent — returns [] if already unlocked.
   */
  async trackPropheticThreadComplete(): Promise<Achievement[]> {
    const unlocked = await this.unlockAchievement('prophetic_thread');
    if (!unlocked) return [];
    const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'prophetic_thread');
    if (!def) return [];
    return [
      {
        ...def,
        currentProgress: def.requirement,
        isUnlocked: true,
        unlockedAt: Date.now(),
      },
    ];
  }

  /**
   * Unlock the "explored every Bible route stop" badge (mirrors
   * trackPropheticThreadComplete — a one-off SPECIAL with no stat counter).
   * Idempotent — returns [] if already unlocked.
   */
  async trackJourneyRoutesComplete(): Promise<Achievement[]> {
    const unlocked = await this.unlockAchievement('bible_routes');
    if (!unlocked) return [];
    const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'bible_routes');
    if (!def) return [];
    return [
      {
        ...def,
        currentProgress: def.requirement,
        isUnlocked: true,
        unlockedAt: Date.now(),
      },
    ];
  }

  /**
   * Unlock the "completed a kids story" badge (mirrors
   * trackJourneyRoutesComplete — a one-off SPECIAL with no stat counter,
   * unlocked explicitly by the screen once progress says so). Idempotent —
   * returns [] if already unlocked.
   */
  async trackKidsFirstStoryComplete(): Promise<Achievement[]> {
    const unlocked = await this.unlockAchievement('kids_first_story');
    if (!unlocked) return [];
    const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'kids_first_story');
    if (!def) return [];
    return [
      {
        ...def,
        currentProgress: def.requirement,
        isUnlocked: true,
        unlockedAt: Date.now(),
      },
    ];
  }

  /**
   * Unlock the "completed every kids story" badge. Idempotent — returns []
   * if already unlocked.
   */
  async trackKidsAllStoriesComplete(): Promise<Achievement[]> {
    const unlocked = await this.unlockAchievement('kids_stories_complete');
    if (!unlocked) return [];
    const def = ACHIEVEMENT_DEFINITIONS.find(
      a => a.id === 'kids_stories_complete',
    );
    if (!def) return [];
    return [
      {
        ...def,
        currentProgress: def.requirement,
        isUnlocked: true,
        unlockedAt: Date.now(),
      },
    ];
  }

  async trackBookmark(): Promise<void> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_bookmarks = total_bookmarks + 1, updated_at = ? WHERE id = 1',
      [Date.now()],
    );
  }

  async trackSearch(): Promise<Achievement[]> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_searches = total_searches + 1, updated_at = ? WHERE id = 1',
      [Date.now()],
    );
    return await this.checkAchievements();
  }

  async trackShare(): Promise<void> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_shares = total_shares + 1, updated_at = ? WHERE id = 1',
      [Date.now()],
    );
  }

  /**
   * Checks and unlocks achievements based on current statistics
   */
  private async checkAchievements(): Promise<Achievement[]> {
    const stats = await this.getUserStats();
    const newlyUnlocked: Achievement[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      // SPECIAL/SHARING have no backing stat — getCategoryProgress maps them to
      // 0, so this generic loop can neither unlock them (0 < requirement) NOR
      // hold their progress. Skip them entirely; they are driven by dedicated
      // event hooks (e.g. specialAchievementsForHour, trackBookCompleted) and
      // skipping prevents this loop from clobbering a hook-set progress back to 0.
      if (
        def.category === AchievementCategory.SPECIAL ||
        def.category === AchievementCategory.SHARING
      ) {
        continue;
      }

      const progress = this.getProgressForAchievement(def.id, stats);

      if (progress >= def.requirement) {
        const wasUnlocked = await this.unlockAchievement(def.id);
        if (wasUnlocked) {
          newlyUnlocked.push({
            ...def,
            currentProgress: progress,
            isUnlocked: true,
            unlockedAt: Date.now(),
          });
        }
      } else {
        // Update progress
        await this.db.executeSql(
          'UPDATE user_achievements SET current_progress = ? WHERE id = ?',
          [progress, def.id],
        );
      }
    }

    return newlyUnlocked;
  }

  /**
   * Gets current progress for an achievement
   */
  private getProgressForAchievement(
    achievementId: string,
    stats: UserStats,
  ): number {
    const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
    if (!def) return 0;
    return getCategoryProgress(def.category, stats);
  }

  /**
   * Unlocks a specific achievement
   */
  private async unlockAchievement(achievementId: string): Promise<boolean> {
    const sql = 'SELECT is_unlocked FROM user_achievements WHERE id = ?';
    const result = await this.db.executeSql(sql, [achievementId]);

    if (result.rows._array[0]?.is_unlocked) {
      return false; // Already unlocked
    }

    const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
    if (!def) return false;

    const now = Date.now();
    await this.db.executeSql(
      'UPDATE user_achievements SET is_unlocked = 1, unlocked_at = ?, current_progress = ? WHERE id = ?',
      [now, def.requirement, achievementId],
    );

    // Award points
    await this.addPoints(def.points);

    return true;
  }

  /**
   * Adds points and updates level
   */
  private async addPoints(points: number): Promise<void> {
    const stats = await this.getUserStats();
    const newPoints = stats.totalPoints + points;
    const newLevel = calculateLevel(newPoints);

    await this.db.executeSql(
      'UPDATE user_stats SET total_points = ?, level = ?, updated_at = ? WHERE id = 1',
      [newPoints, newLevel.level, Date.now()],
    );

    this.stats = null; // Invalidate cache
  }

  /**
   * Gets all achievements with their current status
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const sql = 'SELECT * FROM user_achievements';
    const result = await this.db.executeSql(sql);
    const rows = result.rows._array as Array<{
      id: string;
      current_progress?: number;
      is_unlocked?: number;
      unlocked_at?: number;
    }>;

    return ACHIEVEMENT_DEFINITIONS.map(def => {
      const row = rows.find(r => r.id === def.id);
      return {
        ...def,
        currentProgress: row?.current_progress || 0,
        isUnlocked: Boolean(row?.is_unlocked),
        unlockedAt: row?.unlocked_at,
      };
    });
  }

  /**
   * Gets only unlocked achievements
   */
  async getUnlockedAchievements(): Promise<Achievement[]> {
    const all = await this.getAllAchievements();
    return all.filter(a => a.isUnlocked);
  }

  /**
   * Gets the count of unlocked achievements
   */
  async getUnlockedAchievementsCount(): Promise<number> {
    const sql =
      'SELECT COUNT(*) as count FROM user_achievements WHERE is_unlocked = 1';
    const result = await this.db.executeSql(sql);
    return result.rows._array[0].count;
  }

  /**
   * Gets reading streak
   */
  async getReadingStreak(): Promise<ReadingStreak> {
    const stats = await this.getUserStats();
    const sql =
      'SELECT date FROM reading_streak_log ORDER BY date DESC LIMIT 30';
    const result = await this.db.executeSql(sql);
    const dates = result.rows._array.map((row: {date: string}) => row.date);

    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastReadDate: stats.lastReadDate,
      streakDates: dates,
    };
  }

  /**
   * Full per-day reading log, oldest first. `getReadingStreak` caps at the
   * most recent 30 days for the streak widget; the "Tu camino" journey recap
   * (Sprint 57) needs the entire lifetime series to derive active days and
   * the busiest day, so this read is uncapped. Read-only; never throws (a
   * missing table on a fresh install yields an empty log).
   */
  async getReadingLog(): Promise<
    {date: string; versesRead: number; timeSpent: number}[]
  > {
    try {
      const result = await this.db.executeSql(
        'SELECT date, verses_read, time_spent FROM reading_streak_log ORDER BY date ASC',
      );
      return result.rows._array.map(
        (row: {date: string; verses_read?: number; time_spent?: number}) => ({
          date: row.date,
          versesRead: row.verses_read ?? 0,
          timeSpent: row.time_spent ?? 0,
        }),
      );
    } catch {
      return [];
    }
  }

  /**
   * Reads the completed books WITH their completion stamps (`completed_books`
   * has carried `completed_at` since its creation — the timeline, Sprint 80,
   * is the first reader). Read-only; never throws (a fresh install yields an
   * empty list).
   */
  async getCompletedBooks(): Promise<
    {bookName: string; completedAt: number}[]
  > {
    try {
      const result = await this.db.executeSql(
        'SELECT book_name, completed_at FROM completed_books ORDER BY completed_at ASC',
      );
      return result.rows._array.map(
        (row: {book_name: string; completed_at?: number}) => ({
          bookName: row.book_name,
          completedAt: row.completed_at ?? 0,
        }),
      );
    } catch {
      return [];
    }
  }

  /**
   * Reads the REAL per-book reading aggregates (`book_reading_log`), one row per
   * book the user has read with verses + accumulated seconds + last-read time.
   * Powers the "most-read book" surfaces (Mi lectura / Tu camino) via the pure
   * [[rankBookReading]] / [[topBookReading]]. Read-only; never throws (a missing
   * table on an install that predates Sprint 65 yields an empty log until the
   * next read creates it). Sprint 65.
   */
  async getBookReadingLog(): Promise<BookReadingEntry[]> {
    try {
      const result = await this.db.executeSql(
        'SELECT book_name, verses_read, time_spent, last_read_at FROM book_reading_log',
      );
      return normalizeBookReadingLog(
        result.rows._array.map(
          (row: {
            book_name?: string;
            verses_read?: number;
            time_spent?: number;
            last_read_at?: number;
          }) => ({
            book: row.book_name,
            versesRead: row.verses_read ?? 0,
            timeSpent: row.time_spent ?? 0,
            lastReadAt: row.last_read_at ?? 0,
          }),
        ),
      );
    } catch {
      return [];
    }
  }
}
