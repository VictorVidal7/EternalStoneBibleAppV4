/**
 * 📱 WIDGET TASK HANDLER
 *
 * Maneja la lógica de actualización de widgets para iOS y Android
 * Proporciona datos optimizados para renderizado en home screen
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as SQLite from 'expo-sqlite';
import {Platform} from 'react-native';

export interface WidgetData {
  type: 'verse' | 'progress' | 'mission';
  timestamp: number;
  data: any;
}

export interface VerseWidgetData {
  verse: string;
  reference: string;
  book: string;
  chapter: number;
  verseNumber: number;
  translation: string;
  theme: 'light' | 'dark';
}

export interface ProgressWidgetData {
  currentStreak: number;
  longestStreak: number;
  versesReadToday: number;
  dailyGoal: number;
  level: number;
  xp: number;
  nextLevelXp: number;
  completionPercentage: number;
}

export interface MissionWidgetData {
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: {
    xp: number;
    coins: number;
  };
  expiresAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

class WidgetTaskHandler {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('EternalStone.db');
    }
  }

  /**
   * Obtiene el verso del día para el widget
   */
  async getVerseOfTheDay(): Promise<VerseWidgetData> {
    await this.initialize();

    // Usar fecha actual como seed para selección aleatoria determinística
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000,
    );

    // Seleccionar verso basado en el día del año
    const totalVerses = 31102;
    const verseIndex = (dayOfYear * 137) % totalVerses; // Usar número primo para distribución

    const result = await this.db!.getFirstAsync<{
      book: string;
      chapter: number;
      verse: number;
      text: string;
    }>(
      `
      SELECT book, chapter, verse, text
      FROM verses
      LIMIT 1 OFFSET ?
    `,
      [verseIndex],
    );

    if (!result) {
      // Fallback a Juan 3:16
      const fallback = await this.db!.getFirstAsync<{
        book: string;
        chapter: number;
        verse: number;
        text: string;
      }>(
        `
        SELECT book, chapter, verse, text
        FROM verses
        WHERE book = 'Juan' AND chapter = 3 AND verse = 16
      `,
      );

      return {
        verse: fallback?.text || 'Porque de tal manera amó Dios al mundo...',
        reference: 'Juan 3:16',
        book: 'Juan',
        chapter: 3,
        verseNumber: 16,
        translation: 'RVR1960',
        theme: 'light',
      };
    }

    return {
      verse: result.text,
      reference: `${result.book} ${result.chapter}:${result.verse}`,
      book: result.book,
      chapter: result.chapter,
      verseNumber: result.verse,
      translation: 'RVR1960',
      theme: 'light',
    };
  }

  /**
   * Obtiene datos de progreso del usuario para el widget
   */
  async getProgressData(userId: string): Promise<ProgressWidgetData> {
    await this.initialize();

    // Obtener racha actual
    const streakResult = await this.db!.getFirstAsync<{
      current_streak: number;
      longest_streak: number;
    }>(
      `
      SELECT
        COALESCE(current_streak, 0) as current_streak,
        COALESCE(longest_streak, 0) as longest_streak
      FROM user_stats
      WHERE user_id = ?
    `,
      [userId],
    );

    // Obtener versos leídos hoy
    const today = new Date().toISOString().split('T')[0];
    const versesTodayResult = await this.db!.getFirstAsync<{count: number}>(
      `
      SELECT COUNT(DISTINCT verse_id) as count
      FROM reading_history
      WHERE user_id = ? AND date(read_at) = date(?)
    `,
      [userId, today],
    );

    // Obtener nivel y XP
    const xpResult = await this.db!.getFirstAsync<{
      level: number;
      xp: number;
    }>(
      `
      SELECT
        COALESCE(level, 1) as level,
        COALESCE(xp, 0) as xp
      FROM user_progress
      WHERE user_id = ?
    `,
      [userId],
    );

    const level = xpResult?.level || 1;
    const xp = xpResult?.xp || 0;
    const nextLevelXp = this.calculateXpForLevel(level + 1);
    const currentLevelXp = this.calculateXpForLevel(level);
    const xpProgress = xp - currentLevelXp;
    const xpNeeded = nextLevelXp - currentLevelXp;

    const dailyGoal = 10; // Meta diaria de versos
    const versesReadToday = versesTodayResult?.count || 0;

    return {
      currentStreak: streakResult?.current_streak || 0,
      longestStreak: streakResult?.longest_streak || 0,
      versesReadToday,
      dailyGoal,
      level,
      xp: xpProgress,
      nextLevelXp: xpNeeded,
      completionPercentage: Math.min(
        100,
        Math.round((versesReadToday / dailyGoal) * 100),
      ),
    };
  }

  /**
   * Obtiene la misión activa más relevante para mostrar en el widget
   */
  async getActiveMission(userId: string): Promise<MissionWidgetData | null> {
    await this.initialize();

    const mission = await this.db!.getFirstAsync<{
      id: string;
      title: string;
      description: string;
      type: string;
      difficulty: string;
      current_progress: number;
      target: number;
      xp_reward: number;
      coin_reward: number;
      expires_at: string;
    }>(
      `
      SELECT
        m.id,
        m.title,
        m.description,
        m.type,
        m.difficulty,
        COALESCE(mp.current_progress, 0) as current_progress,
        m.target,
        m.xp_reward,
        m.coin_reward,
        m.expires_at
      FROM missions m
      LEFT JOIN mission_progress mp ON m.id = mp.mission_id AND mp.user_id = ?
      WHERE m.type = 'daily'
        AND m.expires_at > datetime('now')
        AND mp.status != 'claimed'
      ORDER BY mp.current_progress DESC, m.xp_reward DESC
      LIMIT 1
    `,
      [userId],
    );

    if (!mission) {
      return null;
    }

    return {
      title: mission.title,
      description: mission.description,
      progress: mission.current_progress,
      target: mission.target,
      reward: {
        xp: mission.xp_reward,
        coins: mission.coin_reward,
      },
      expiresAt: mission.expires_at,
      difficulty: mission.difficulty as 'easy' | 'medium' | 'hard',
    };
  }

  /**
   * Calcula XP necesario para un nivel específico
   */
  private calculateXpForLevel(level: number): number {
    return Math.floor(100 * Math.pow(1.5, level - 1));
  }

  /**
   * Genera datos completos para todos los widgets
   */
  async getAllWidgetData(userId: string): Promise<{
    verse: VerseWidgetData;
    progress: ProgressWidgetData;
    mission: MissionWidgetData | null;
  }> {
    const [verse, progress, mission] = await Promise.all([
      this.getVerseOfTheDay(),
      this.getProgressData(userId),
      this.getActiveMission(userId),
    ]);

    return {verse, progress, mission};
  }

  /**
   * Guarda datos en caché para acceso rápido del widget
   */
  async cacheWidgetData(userId: string, data: WidgetData) {
    await this.initialize();

    await this.db!.runAsync(
      `
      INSERT OR REPLACE INTO widget_cache (user_id, type, data, timestamp)
      VALUES (?, ?, ?, ?)
    `,
      [userId, data.type, JSON.stringify(data.data), data.timestamp],
    );
  }

  /**
   * Recupera datos cacheados del widget
   */
  async getCachedWidgetData(
    userId: string,
    type: string,
  ): Promise<WidgetData | null> {
    await this.initialize();

    const result = await this.db!.getFirstAsync<{
      data: string;
      timestamp: number;
    }>(
      `
      SELECT data, timestamp
      FROM widget_cache
      WHERE user_id = ? AND type = ?
    `,
      [userId, type],
    );

    if (!result) {
      return null;
    }

    return {
      type: type as 'verse' | 'progress' | 'mission',
      timestamp: result.timestamp,
      data: JSON.parse(result.data),
    };
  }

  /**
   * Inicializa tabla de caché de widgets si no existe
   */
  async createWidgetCacheTable() {
    await this.initialize();

    await this.db!.execAsync(`
      CREATE TABLE IF NOT EXISTS widget_cache (
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        PRIMARY KEY (user_id, type)
      );

      CREATE INDEX IF NOT EXISTS idx_widget_cache_timestamp
      ON widget_cache(timestamp);
    `);
  }
}

// Singleton instance
export const widgetTaskHandler = new WidgetTaskHandler();
