/**
 * 📱 WIDGET TASK HANDLER
 *
 * Maneja la lógica de actualización de widgets para iOS y Android
 * Proporciona datos optimizados para renderizado en home screen
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as SQLite from 'expo-sqlite';
import bibleDB from '../lib/database';
import {getDailyVerseRef} from '../constants/daily-verses';
import {calculateLevel} from '../lib/achievements/types';

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
  /**
   * Mission reward. Currently only XP is wired up — the coins economy was
   * scaffolding that never shipped, so the widget no longer fabricates a
   * coin payout. Kept the field optional so reintroducing it is a one-line
   * change once a real coins system exists.
   */
  reward: {
    xp: number;
    coins?: number;
  };
  /** ISO of next local midnight — the mission resets at the day boundary. */
  expiresAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

class WidgetTaskHandler {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    if (!this.db) {
      // Usar la misma instancia de base de datos que el resto de la app
      await bibleDB.initialize();
      this.db = await bibleDB.getDatabase();
    }
  }

  /**
   * Obtiene el verso del día para el widget
   */
  async getVerseOfTheDay(): Promise<VerseWidgetData> {
    try {
      await this.initialize();

      // Use the same curated, calendar-deterministic verse the Home screen
      // shows (getDailyVerseRef) so the widget and the app never disagree on
      // "today's verse" — the old pseudo-random offset picked a different one.
      const ref = getDailyVerseRef();
      const verse = await bibleDB.getVerse(
        ref.book,
        ref.chapter,
        ref.verse,
        'RVR1960',
      );

      const result = verse
        ? {
            book_name: verse.book,
            chapter: verse.chapter,
            verse: verse.verse,
            text: verse.text,
          }
        : null;

      if (!result) {
        // Fallback a Juan 3:16
        const fallback = await this.db!.getFirstAsync<{
          book_name: string;
          chapter: number;
          verse: number;
          text: string;
        }>(
          `
        SELECT book_name, chapter, verse, text
        FROM verses
        WHERE book_name = 'Juan' AND chapter = 3 AND verse = 16 AND version = 'RVR1960'
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
        reference: `${result.book_name} ${result.chapter}:${result.verse}`,
        book: result.book_name,
        chapter: result.chapter,
        verseNumber: result.verse,
        translation: 'RVR1960',
        theme: 'light',
      };
    } catch (error) {
      console.error('Error loading verse widget:', error);
      // Return fallback data
      return {
        verse:
          'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito...',
        reference: 'Juan 3:16',
        book: 'Juan',
        chapter: 3,
        verseNumber: 16,
        translation: 'RVR1960',
        theme: 'light',
      };
    }
  }

  /**
   * Obtiene datos de progreso del usuario para el widget
   */
  async getProgressData(_userId: string): Promise<ProgressWidgetData> {
    try {
      await this.initialize();

      // Real progress from the same tables the achievement system writes:
      // lifetime stats live in user_stats, and today's verse count in the
      // accumulating reading_streak_log row keyed by date.
      const dailyGoal = 10;
      const statsRow = await this.db!.getFirstAsync<{
        current_streak: number;
        longest_streak: number;
        level: number;
        total_points: number;
      }>(
        `SELECT current_streak, longest_streak, level, total_points
         FROM user_stats WHERE id = 1`,
      );

      const today = new Date().toISOString().split('T')[0];
      const todayRow = await this.db!.getFirstAsync<{verses_read: number}>(
        `SELECT verses_read FROM reading_streak_log WHERE date = ?`,
        [today],
      );

      const currentStreak = statsRow?.current_streak ?? 0;
      const longestStreak = statsRow?.longest_streak ?? 0;
      const totalPoints = statsRow?.total_points ?? 0;
      const versesReadToday = todayRow?.verses_read ?? 0;

      // Derive level + XP-within-level from the real points-based curve.
      const levelInfo = calculateLevel(totalPoints);
      const xp = totalPoints - levelInfo.minPoints;
      const nextLevelXp =
        levelInfo.maxPoints === Infinity
          ? Math.max(xp, 1)
          : levelInfo.maxPoints - levelInfo.minPoints;

      return {
        currentStreak,
        longestStreak,
        versesReadToday,
        dailyGoal,
        level: levelInfo.level,
        xp,
        nextLevelXp,
        completionPercentage: Math.min(
          100,
          Math.round((versesReadToday / dailyGoal) * 100),
        ),
      };
    } catch (error) {
      console.error('Error loading progress widget:', error);
      // Return fallback demo data
      return {
        currentStreak: 3,
        longestStreak: 10,
        versesReadToday: 7,
        dailyGoal: 10,
        level: 5,
        xp: 150,
        nextLevelXp: 250,
        completionPercentage: 70,
      };
    }
  }

  /**
   * Obtiene la misión activa más relevante para mostrar en el widget
   */
  async getActiveMission(_userId: string): Promise<MissionWidgetData | null> {
    try {
      await this.initialize();

      // Import translation utilities
      const {getDailyMissionTranslation} = await import(
        '../i18n/languageUtils'
      );
      const missionTranslation =
        await getDailyMissionTranslation('lector_diario');

      // The daily mission ("read 10 verses today") tracks the same real
      // count the progress widget shows, so the two never disagree.
      const target = 10;
      const today = new Date().toISOString().split('T')[0];
      const todayRow = await this.db!.getFirstAsync<{verses_read: number}>(
        `SELECT verses_read FROM reading_streak_log WHERE date = ?`,
        [today],
      );
      const progress = Math.min(target, todayRow?.verses_read ?? 0);

      // Daily mission rolls over at local midnight — using "now + 24h" made
      // the timer drift each day (e.g. at 11pm it said "expires in 23h 59m",
      // and after midnight it briefly went negative until the widget reloaded).
      const expiresAt = new Date();
      expiresAt.setHours(24, 0, 0, 0);

      return {
        title: missionTranslation?.title || 'Lee 10 versículos hoy',
        description:
          missionTranslation?.description ||
          'Completa tu meta diaria de lectura',
        progress,
        target,
        reward: {
          xp: 50,
        },
        expiresAt: expiresAt.toISOString(),
        difficulty: 'easy',
      };
    } catch (error) {
      console.error('Error loading mission widget:', error);
      // Fallback uses the same midnight cutoff so the timer never goes
      // negative even when the DB read failed.
      const expiresAt = new Date();
      expiresAt.setHours(24, 0, 0, 0);

      return {
        title: 'Lee 10 versículos hoy',
        description: 'Completa tu meta diaria de lectura',
        progress: 0,
        target: 10,
        reward: {
          xp: 50,
        },
        expiresAt: expiresAt.toISOString(),
        difficulty: 'easy',
      };
    }
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
