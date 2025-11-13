/**
 * Servicio de Gestión de Logros
 * Maneja el seguimiento, desbloqueo y notificación de logros
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
   * Inicializa las tablas de logros
   */
  async initialize(): Promise<void> {
    // Ejecutar cada sentencia SQL por separado para evitar problemas con execAsync
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
   * Inicializa todos los logros definidos
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
   * Obtiene las estadísticas del usuario
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
   * Registra lectura de versículos
   */
  async trackVersesRead(count: number, timeSpent: number = 0): Promise<Achievement[]> {
    this.stats = null; // Invalidar caché
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();

    // Actualizar estadísticas
    await this.db.executeSql(
      `UPDATE user_stats SET
        total_verses_read = total_verses_read + ?,
        total_reading_time = total_reading_time + ?,
        last_read_date = ?,
        updated_at = ?
       WHERE id = 1`,
      [count, timeSpent, today, now]
    );

    // Actualizar racha
    await this.updateReadingStreak(today);

    // Registrar en log de racha
    await this.db.executeSql(
      `INSERT INTO reading_streak_log (date, verses_read, time_spent)
       VALUES (?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET
         verses_read = verses_read + excluded.verses_read,
         time_spent = time_spent + excluded.time_spent`,
      [today, count, timeSpent]
    );

    // Verificar logros desbloqueados
    return await this.checkAchievements();
  }

  /**
   * Registra capítulo completado
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
   * Registra libro completado
   */
  async trackBookCompleted(bookId: string): Promise<Achievement[]> {
    this.stats = null;
    await this.db.executeSql(
      'UPDATE user_stats SET total_books_completed = total_books_completed + 1, updated_at = ? WHERE id = 1',
      [Date.now()]
    );

    // Verificar logros especiales de libros
    const achievements = await this.checkAchievements();

    // Verificar logros especiales por libro específico
    if (bookId === 'Salmos') {
      await this.unlockAchievement('psalms_complete');
    } else if (bookId === 'Proverbios') {
      await this.unlockAchievement('proverbs_complete');
    }

    return achievements;
  }

  /**
   * Actualiza la racha de lectura
   */
  private async updateReadingStreak(today: string): Promise<void> {
    const stats = await this.getUserStats();
    const lastRead = stats.lastReadDate;

    if (!lastRead) {
      // Primera lectura
      await this.db.executeSql(
        'UPDATE user_stats SET current_streak = 1, longest_streak = 1 WHERE id = 1'
      );
      return;
    }

    const lastDate = new Date(lastRead);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Ya leyó hoy
      return;
    } else if (diffDays === 1) {
      // Día consecutivo
      const newStreak = stats.currentStreak + 1;
      const newLongest = Math.max(newStreak, stats.longestStreak);
      await this.db.executeSql(
        'UPDATE user_stats SET current_streak = ?, longest_streak = ? WHERE id = 1',
        [newStreak, newLongest]
      );
    } else {
      // Racha rota
      await this.db.executeSql(
        'UPDATE user_stats SET current_streak = 1 WHERE id = 1'
      );
    }
  }

  /**
   * Registra otras acciones
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
   * Verifica y desbloquea logros basados en estadísticas actuales
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
        // Actualizar progreso
        await this.db.executeSql(
          'UPDATE user_achievements SET current_progress = ? WHERE id = ?',
          [progress, def.id]
        );
      }
    }

    return newlyUnlocked;
  }

  /**
   * Obtiene el progreso actual para un logro
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
   * Desbloquea un logro específico
   */
  private async unlockAchievement(achievementId: string): Promise<boolean> {
    const sql = 'SELECT is_unlocked FROM user_achievements WHERE id = ?';
    const result = await this.db.executeSql(sql, [achievementId]);

    if (result.rows._array[0]?.is_unlocked) {
      return false; // Ya desbloqueado
    }

    const def = ACHIEVEMENT_DEFINITIONS.find(a => a.id === achievementId);
    if (!def) return false;

    const now = Date.now();
    await this.db.executeSql(
      'UPDATE user_achievements SET is_unlocked = 1, unlocked_at = ?, current_progress = ? WHERE id = ?',
      [now, def.requirement, achievementId]
    );

    // Otorgar puntos
    await this.addPoints(def.points);

    return true;
  }

  /**
   * Añade puntos y actualiza nivel
   */
  private async addPoints(points: number): Promise<void> {
    const stats = await this.getUserStats();
    const newPoints = stats.totalPoints + points;
    const newLevel = calculateLevel(newPoints);

    await this.db.executeSql(
      'UPDATE user_stats SET total_points = ?, level = ?, updated_at = ? WHERE id = 1',
      [newPoints, newLevel.level, Date.now()]
    );

    this.stats = null; // Invalidar caché
  }

  /**
   * Obtiene todos los logros con su estado actual
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
   * Obtiene solo los logros desbloqueados
   */
  async getUnlockedAchievements(): Promise<Achievement[]> {
    const all = await this.getAllAchievements();
    return all.filter(a => a.isUnlocked);
  }

  /**
   * Obtiene el conteo de logros desbloqueados
   */
  async getUnlockedAchievementsCount(): Promise<number> {
    const sql = 'SELECT COUNT(*) as count FROM user_achievements WHERE is_unlocked = 1';
    const result = await this.db.executeSql(sql);
    return result.rows._array[0].count;
  }

  /**
   * Obtiene la racha de lectura
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
