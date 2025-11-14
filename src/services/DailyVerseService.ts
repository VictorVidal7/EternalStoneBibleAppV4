/**
 * Daily Verse Service
 *
 * Service para gestionar el versículo diario de la Biblia.
 * Proporciona funcionalidad para obtener, generar y almacenar versículos diarios.
 *
 * Features:
 * - Obtiene un versículo diario cacheado por fecha
 * - Genera automáticamente versículos aleatorios cuando es necesario
 * - Almacena en AsyncStorage con fecha de validación
 * - Usa logger profesional para debugging y error handling
 * - TypeScript con tipos completos
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleVerse} from '../types/bible';
import {logger} from '../lib/utils/logger';
import {bibleDB} from '../lib/database';

/**
 * Interfaz para el almacenamiento del versículo diario
 */
interface StoredDailyVerse {
  date: string;
  verse: DailyVerse;
}

/**
 * Interfaz para el versículo diario
 * Extiende BibleVerse con campos adicionales útiles
 */
interface DailyVerse extends BibleVerse {
  reference: string; // Formato: "Juan 3:16"
  retrievedAt: string; // Timestamp ISO cuando se obtuvo
}

/**
 * Clase para gestionar el versículo diario
 */
class DailyVerseService {
  private static readonly STORAGE_KEY = 'dailyVerse';
  private static readonly VERSION = 'RVR1960';

  /**
   * Obtiene el versículo diario
   *
   * Primero intenta obtener un versículo cacheado para hoy.
   * Si no existe o la fecha es diferente, genera uno nuevo y lo almacena.
   *
   * @returns Promesa con el DailyVerse
   */
  async getDailyVerse(): Promise<DailyVerse> {
    const startTime = Date.now();

    try {
      const today = this.getTodayDateString();

      logger.debug('Fetching daily verse', {
        action: 'getDailyVerse',
        component: 'DailyVerseService',
        date: today,
      });

      // Intentar obtener versículo cacheado
      const storedData = await this.getStoredVerse();

      if (storedData && storedData.date === today) {
        logger.info('Using cached daily verse', {
          action: 'getDailyVerse',
          component: 'DailyVerseService',
          book: storedData.verse.book,
          chapter: storedData.verse.chapter,
          verse: storedData.verse.verse,
        });

        return storedData.verse;
      }

      // Generar nuevo versículo diario
      logger.info('Generating new daily verse', {
        action: 'getDailyVerse',
        component: 'DailyVerseService',
      });

      const newVerse = await this.generateDailyVerse();
      await this.storeDailyVerse(today, newVerse);

      const duration = Date.now() - startTime;
      logger.performance('getDailyVerse', duration, {
        action: 'getDailyVerse',
        component: 'DailyVerseService',
      });

      return newVerse;
    } catch (error) {
      logger.error('Error al obtener el versículo diario', error as Error, {
        action: 'getDailyVerse',
        component: 'DailyVerseService',
      });

      // Fallback: Retornar un versículo por defecto si todo falla
      return this.getDefaultVerse();
    }
  }

  /**
   * Genera un versículo diario aleatorio
   *
   * @returns Promesa con un DailyVerse aleatorio
   */
  private async generateDailyVerse(): Promise<DailyVerse> {
    try {
      // Usar la database para obtener un versículo aleatorio
      const randomVerse = await bibleDB.getRandomVerse(
        DailyVerseService.VERSION,
      );

      if (!randomVerse) {
        logger.warn('No random verse found in database', {
          action: 'generateDailyVerse',
          component: 'DailyVerseService',
          version: DailyVerseService.VERSION,
        });

        return this.getDefaultVerse();
      }

      const dailyVerse = this.formatDailyVerse(randomVerse);

      logger.debug('Generated daily verse', {
        action: 'generateDailyVerse',
        component: 'DailyVerseService',
        book: dailyVerse.book,
        chapter: dailyVerse.chapter,
        verse: dailyVerse.verse,
      });

      return dailyVerse;
    } catch (error) {
      logger.error('Error generating daily verse', error as Error, {
        action: 'generateDailyVerse',
        component: 'DailyVerseService',
      });

      return this.getDefaultVerse();
    }
  }

  /**
   * Almacena el versículo diario en AsyncStorage
   *
   * @param date - Fecha en formato string (ej: "Thu Nov 14 2024")
   * @param verse - El DailyVerse a almacenar
   */
  private async storeDailyVerse(
    date: string,
    verse: DailyVerse,
  ): Promise<void> {
    try {
      const storedData: StoredDailyVerse = {
        date,
        verse,
      };

      await AsyncStorage.setItem(
        DailyVerseService.STORAGE_KEY,
        JSON.stringify(storedData),
      );

      logger.debug('Stored daily verse', {
        action: 'storeDailyVerse',
        component: 'DailyVerseService',
        date,
        book: verse.book,
      });
    } catch (error) {
      logger.error('Error al almacenar el versículo diario', error as Error, {
        action: 'storeDailyVerse',
        component: 'DailyVerseService',
        date,
      });
    }
  }

  /**
   * Obtiene el versículo almacenado de AsyncStorage
   *
   * @returns StoredDailyVerse o null si no existe
   */
  private async getStoredVerse(): Promise<StoredDailyVerse | null> {
    try {
      const storedData = await AsyncStorage.getItem(
        DailyVerseService.STORAGE_KEY,
      );

      if (!storedData) {
        return null;
      }

      const parsed = JSON.parse(storedData) as StoredDailyVerse;

      // Validar estructura básica
      if (!parsed.date || !parsed.verse) {
        logger.warn('Invalid stored verse structure', {
          action: 'getStoredVerse',
          component: 'DailyVerseService',
        });
        return null;
      }

      return parsed;
    } catch (error) {
      logger.warn('Error parsing stored verse from AsyncStorage', {
        action: 'getStoredVerse',
        component: 'DailyVerseService',
      });
      return null;
    }
  }

  /**
   * Formatea un BibleVerse como DailyVerse
   *
   * @param verse - BibleVerse de la database
   * @returns DailyVerse formateado
   */
  private formatDailyVerse(verse: BibleVerse): DailyVerse {
    return {
      ...verse,
      reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
      retrievedAt: new Date().toISOString(),
    };
  }

  /**
   * Obtiene un versículo por defecto para usar como fallback
   *
   * @returns DailyVerse por defecto (Juan 3:16)
   */
  private getDefaultVerse(): DailyVerse {
    return {
      id: 0,
      book: 'Juan',
      bookNumber: 43,
      chapter: 3,
      verse: 16,
      text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
      version: DailyVerseService.VERSION,
      reference: 'Juan 3:16',
      retrievedAt: new Date().toISOString(),
    };
  }

  /**
   * Obtiene la fecha de hoy en formato string
   *
   * @returns Fecha en formato string (ej: "Thu Nov 14 2024")
   */
  private getTodayDateString(): string {
    return new Date().toDateString();
  }

  /**
   * Limpia el versículo diario cacheado
   * Útil para forzar que se genere uno nuevo en la siguiente llamada
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(DailyVerseService.STORAGE_KEY);

      logger.debug('Cleared daily verse cache', {
        action: 'clearCache',
        component: 'DailyVerseService',
      });
    } catch (error) {
      logger.error('Error clearing daily verse cache', error as Error, {
        action: 'clearCache',
        component: 'DailyVerseService',
      });
    }
  }

  /**
   * Obtiene la información del versículo cacheado sin refresco
   *
   * @returns StoredDailyVerse o null si no hay cache
   */
  async getCachedVerse(): Promise<StoredDailyVerse | null> {
    return this.getStoredVerse();
  }
}

// Exportar instancia singleton
export const dailyVerseService = new DailyVerseService();

// Exportar clase y tipos para testing
export {DailyVerseService, DailyVerse, StoredDailyVerse};

// Default export para compatibilidad
export default dailyVerseService;
