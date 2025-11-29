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
import bibleDB from '../lib/database';

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
        book_name: string;
        chapter: number;
        verse: number;
        text: string;
      }>(
        `
      SELECT book_name, chapter, verse, text
      FROM verses
      WHERE version = 'RVR1960'
      LIMIT 1 OFFSET ?
    `,
        [verseIndex],
      );

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
  async getProgressData(userId: string): Promise<ProgressWidgetData> {
    try {
      await this.initialize();

      // Por ahora, retornar datos de demostración
      // En una versión futura, estas tablas serán creadas
      const dailyGoal = 10;
      const versesReadToday = 7; // Demo data
      const level = 5; // Demo data
      const currentStreak = 3; // Demo data
      const longestStreak = 10; // Demo data

      const nextLevelXp = this.calculateXpForLevel(level + 1);
      const currentLevelXp = this.calculateXpForLevel(level);
      const xpNeeded = nextLevelXp - currentLevelXp;
      const xpProgress = Math.floor(xpNeeded * 0.6); // 60% progress demo

      return {
        currentStreak,
        longestStreak,
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
  async getActiveMission(userId: string): Promise<MissionWidgetData | null> {
    try {
      await this.initialize();

      // Import translation utilities
      const {getDailyMissionTranslation} = await import(
        '../i18n/languageUtils'
      );
      const missionTranslation =
        await getDailyMissionTranslation('lector_diario');

      // Por ahora, retornar una misión de demostración
      // En una versión futura, estas tablas serán creadas
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        title: missionTranslation?.title || 'Lee 10 versículos hoy',
        description:
          missionTranslation?.description ||
          'Completa tu meta diaria de lectura',
        progress: 7,
        target: 10,
        reward: {
          xp: 50,
          coins: 25,
        },
        expiresAt: tomorrow.toISOString(),
        difficulty: 'easy',
      };
    } catch (error) {
      console.error('Error loading mission widget:', error);
      // Return demo mission as fallback
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        title: 'Lee 10 versículos hoy',
        description: 'Completa tu meta diaria de lectura',
        progress: 7,
        target: 10,
        reward: {
          xp: 50,
          coins: 25,
        },
        expiresAt: tomorrow.toISOString(),
        difficulty: 'easy',
      };
    }
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
