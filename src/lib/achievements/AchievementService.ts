/**
 * Achievement Management Service
 * Handles tracking, unlocking and notification of achievements
 */

import { BibleDatabase } from '../database';
import { Achievement, UserStats, ReadingStreak, AchievementCategory } from './types';
import { ACHIEVEMENT_DEFINITIONS } from './definitions';
import { calculateLevel } from './types';

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

    await db.runAsync(
      'INSERT OR IGNORE INTO user_stats (id, updated_at) VALUES (?, ?)',
      [1, Date.now()]
    );

    await this.initializeAchievements();
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
    if (this.stats) return this.stats;

    const sql = 'SELECT * FROM user_stats WHERE id = 1';
    const result = await this.db.executeSql(sql);
    const row = result.rows._array[0];

    const achievementsUnlocked = await this.getUnlockedAchievementsCount();
    const levelInfo = calculateLevel(row.total_points);
    const nextLevelPoints = levelInfo.maxPoints === Infinity ? 0 : levelInfo.maxPoints - row.total_points;

    this.stats = {
      totalVersesRead: row.total_verses_read,
      totalChaptersRead: row.total_chapters_read,
      totalBooksCompleted: row.total_books_completed,
      totalReadingTime: row.total_reading_time,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      lastReadDate: row.last_read_date || '',
      totalHighlights: row.total_highlights,
      totalNotes: row.total_notes,
      totalBookmarks: row.total_bookmarks,
      totalSearches: row.total_searches,
      totalShares: row.total_shares,
      level: row.level,
      totalPoints: row.total_points,
      pointsToNextLevel: nextLevelPoints,
      achievementsUnlocked,
      totalAchievements: ACHIEVEMENT_DEFINITIONS.length,
    };

    return this.stats;
  }

  /**
   * Tracks verses read
   */
  async trackVersesRead(count: number, timeSpent: number = 0): Promise<Achievement[]> {
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
      [count, timeSpent, today, now]
    );

    // Update streak
    await this.updateReadingStreak(today);

    // Register in streak log
    await this.db.executeSql(
      `INSERT INTO reading_streak_log (date, verses_read, time_spent)
       VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         verses_read = verses_read + excluded.verses_read,
         time_spent = time_spent + excluded.time_spent`,
      [today, count, timeSpent]
    );

    // Check unlocked achievements
    return await this.checkAchievements();
  }

  /**
   * Tracks completed chapter
   */
  async trackChapterCompleted(): Promise<Achievement[]> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_chapters_read = total_chapters_read + 1, updated_at = ? WHERE id = 1',
      [Date.now()]
    );
    return await this.checkAchievements();
  }

  /**
   * Tracks completed book
   */
  async trackBookCompleted(bookId: string): Promise<Achievement[]> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_books_completed = total_books_completed + 1, updated_at = ? WHERE id = 1',
      [Date.now()]
    );

    // Check special book achievements
    const achievements = await this.checkAchievements();

    // Check special achievements for specific book
    if (bookId === 'Psalms') {
      await this.unlockAchievement('psalms_complete');
    } else if (bookId === 'Proverbs') {
      await this.unlockAchievement('proverbs_complete');
    }

    return achievements;
  }

  /**
   * Updates reading streak
   */
  private async updateReadingStreak(today: string): Promise<void> {
    const stats = await this.getUserStats();
    const lastRead = stats.lastReadDate;

    if (!lastRead) {
      // First reading
      await this.db.executeSql(
        'UPDATE user_stats SET current_streak = 1, longest_streak = 1 WHERE id = 1'
      );
      return;
    }

    const lastDate = new Date(lastRead);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Already read today
      return;
    } else if (diffDays === 1) {
      // Consecutive day
      const newStreak = stats.currentStreak + 1;
      const newLongest = Math.max(newStreak, stats.longestStreak);
      await this.db.executeSql(
        'UPDATE user_stats SET current_streak = ?, longest_streak = ? WHERE id = 1',
        [newStreak, newLongest]
      );
    } else {
      // Streak broken
      await this.db.executeSql(
        'UPDATE user_stats SET current_streak = 1 WHERE id = 1'
      );
    }
  }

  /**
   * Tracks other actions
   */
  async trackHighlight(): Promise<void> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_highlights = total_highlights + 1, updated_at = ? WHERE id = 1',
      [Date.now()]
    );
    await this.checkAchievements();
  }

  async trackNote(): Promise<void> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_notes = total_notes + 1, updated_at = ? WHERE id = 1',
      [Date.now()]
    );
    await this.checkAchievements();
  }

  async trackBookmark(): Promise<void> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_bookmarks = total_bookmarks + 1, updated_at = ? WHERE id = 1',
      [Date.now()]
    );
  }

  async trackSearch(): Promise<void> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_searches = total_searches + 1, updated_at = ? WHERE id = 1',
      [Date.now()]
    );
    await this.checkAchievements();
  }

  async trackShare(): Promise<void> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_shares = total_shares + 1, updated_at = ? WHERE id = 1',
      [Date.now()]
    );
  }

  /**
   * Checks and unlocks achievements based on current statistics
   */
  private async checkAchievements(): Promise<Achievement[]> {
    const stats = await this.getUserStats();
    const newlyUnlocked: Achievement[] = [];

    for (const def of ACHIEVEMENT_DEFINITIONS) {
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
          [progress, def.id]
        );
      }
    }

    return newlyUnlocked;
  }

  /**
   * Gets current progress for an achievement
   */
  private getProgressForAchievement(achievementId: string, stats: UserStats): number {
    const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
    if (!def) return 0;

    switch (def.category) {
      case AchievementCategory.READING:
        return stats.totalVersesRead;
      case AchievementCategory.STREAK:
        return Math.max(stats.currentStreak, stats.longestStreak);
      case AchievementCategory.CHAPTERS:
        return stats.totalChaptersRead;
      case AchievementCategory.BOOKS:
        return stats.totalBooksCompleted;
      case AchievementCategory.HIGHLIGHTS:
        return stats.totalHighlights;
      case AchievementCategory.NOTES:
        return stats.totalNotes;
      case AchievementCategory.SEARCH:
        return stats.totalSearches;
      case AchievementCategory.TIME:
        return stats.totalReadingTime;
      default:
        return 0;
    }
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
      [now, def.requirement, achievementId]
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
      [newPoints, newLevel.level, Date.now()]
    );

    this.stats = null; // Invalidate cache
  }

  /**
   * Gets all achievements with their current status
   */
  async getAllAchievements(): Promise<Achievement[]> {
    const sql = 'SELECT * FROM user_achievements';
    const result = await this.db.executeSql(sql);
    const rows = result.rows._array;

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
    const sql = 'SELECT COUNT(*) as count FROM user_achievements WHERE is_unlocked = 1';
    const result = await this.db.executeSql(sql);
    return result.rows._array[0].count;
  }

  /**
   * Gets reading streak
   */
  async getReadingStreak(): Promise<ReadingStreak> {
    const stats = await this.getUserStats();
    const sql = 'SELECT date FROM reading_streak_log ORDER BY date DESC LIMIT 30';
    const result = await this.db.executeSql(sql);
    const dates = result.rows._array.map(row => row.date);

    return {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      lastReadDate: stats.lastReadDate,
      streakDates: dates,
    };
  }
}
