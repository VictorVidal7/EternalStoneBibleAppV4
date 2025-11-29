/**
 * ⚡ PREDICTIVE CACHE SYSTEM
 *
 * Sistema de caché predictivo inteligente que anticipa las necesidades del usuario
 * Precarga contenido basado en patrones de lectura y comportamiento
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from '../database';

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  priority: number; // 1-10, higher = more important
  accessCount: number;
  lastAccessed: number;
}

export interface ReadingPattern {
  userId: string;
  commonBooks: string[];
  averageReadingTime: number; // in minutes
  preferredTimeOfDay: number; // hour 0-23
  averageVersesPerSession: number;
  lastBook: string;
  lastChapter: number;
  readingSequence: 'sequential' | 'random' | 'mixed';
}

export interface PredictionResult {
  nextChapter: {book: string; chapter: number};
  confidence: number; // 0-1
  relatedChapters: Array<{book: string; chapter: number}>;
}

class PredictiveCacheService {
  private db: SQLite.SQLiteDatabase | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private readonly MAX_MEMORY_CACHE_SIZE = 50; // Max items in memory
  private readonly DEFAULT_TTL = 1000 * 60 * 60; // 1 hour
  private readonly PREFETCH_THRESHOLD = 0.7; // Confidence threshold for prefetching

  async initialize() {
    if (!this.db) {
      // Usar la misma instancia de base de datos que el resto de la app
      await bibleDB.initialize();
      this.db = await bibleDB.getDatabase();
      await this.createCacheTables();
    }
  }

  /**
   * Crea tablas necesarias para el sistema de caché
   */
  private async createCacheTables() {
    await this.db!.execAsync(`
      -- Tabla de entradas de caché
      CREATE TABLE IF NOT EXISTS cache_entries (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        ttl INTEGER NOT NULL,
        priority INTEGER DEFAULT 5,
        access_count INTEGER DEFAULT 0,
        last_accessed INTEGER NOT NULL
      );

      -- Tabla de patrones de lectura
      CREATE TABLE IF NOT EXISTS reading_patterns (
        user_id TEXT NOT NULL,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        read_at INTEGER NOT NULL,
        reading_duration INTEGER,
        verses_read INTEGER,
        time_of_day INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_reading_patterns_user
      ON reading_patterns(user_id, read_at DESC);

      CREATE INDEX IF NOT EXISTS idx_cache_priority
      ON cache_entries(priority DESC, last_accessed DESC);

      -- Tabla de predicciones pre-calculadas
      CREATE TABLE IF NOT EXISTS cache_predictions (
        user_id TEXT NOT NULL,
        predicted_book TEXT NOT NULL,
        predicted_chapter INTEGER NOT NULL,
        confidence REAL NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (user_id, predicted_book, predicted_chapter)
      );

      CREATE INDEX IF NOT EXISTS idx_predictions_confidence
      ON cache_predictions(user_id, confidence DESC);
    `);
  }

  /**
   * Almacena un elemento en caché con prioridad y TTL
   */
  async set(
    key: string,
    data: any,
    options: {
      ttl?: number;
      priority?: number;
    } = {},
  ): Promise<void> {
    const timestamp = Date.now();
    const entry: CacheEntry = {
      key,
      data,
      timestamp,
      ttl: options.ttl || this.DEFAULT_TTL,
      priority: options.priority || 5,
      accessCount: 0,
      lastAccessed: timestamp,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);
    this.pruneMemoryCache();

    // Store in persistent cache
    await this.initialize();
    await this.db!.runAsync(
      `
      INSERT OR REPLACE INTO cache_entries
      (key, data, timestamp, ttl, priority, access_count, last_accessed)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        key,
        JSON.stringify(data),
        timestamp,
        entry.ttl,
        entry.priority,
        0,
        timestamp,
      ],
    );
  }

  /**
   * Recupera un elemento de caché
   */
  async get<T = any>(key: string): Promise<T | null> {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      if (this.isExpired(memEntry)) {
        this.memoryCache.delete(key);
      } else {
        memEntry.accessCount++;
        memEntry.lastAccessed = Date.now();
        return memEntry.data as T;
      }
    }

    // Check persistent cache
    await this.initialize();
    const result = await this.db!.getFirstAsync<{
      data: string;
      timestamp: number;
      ttl: number;
      access_count: number;
    }>(
      `SELECT data, timestamp, ttl, access_count FROM cache_entries WHERE key = ?`,
      [key],
    );

    if (!result) {
      return null;
    }

    const entry: CacheEntry = {
      key,
      data: JSON.parse(result.data),
      timestamp: result.timestamp,
      ttl: result.ttl,
      priority: 5,
      accessCount: result.access_count,
      lastAccessed: Date.now(),
    };

    if (this.isExpired(entry)) {
      await this.delete(key);
      return null;
    }

    // Update access stats
    await this.db!.runAsync(
      `UPDATE cache_entries SET access_count = access_count + 1, last_accessed = ? WHERE key = ?`,
      [Date.now(), key],
    );

    // Store in memory cache for faster future access
    this.memoryCache.set(key, entry);

    return entry.data as T;
  }

  /**
   * Verifica si una entrada de caché ha expirado
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Elimina una entrada de caché
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.initialize();
    await this.db!.runAsync(`DELETE FROM cache_entries WHERE key = ?`, [key]);
  }

  /**
   * Limpia entradas expiradas de caché
   */
  async cleanup(): Promise<number> {
    await this.initialize();
    const now = Date.now();

    const result = await this.db!.runAsync(
      `DELETE FROM cache_entries WHERE timestamp + ttl < ?`,
      [now],
    );

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    return result.changes || 0;
  }

  /**
   * Poda el caché en memoria para mantener el tamaño bajo
   */
  private pruneMemoryCache(): void {
    if (this.memoryCache.size <= this.MAX_MEMORY_CACHE_SIZE) {
      return;
    }

    // Remove least recently used items
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => {
        // Sort by priority first, then by last accessed
        if (a[1].priority !== b[1].priority) {
          return a[1].priority - b[1].priority;
        }
        return a[1].lastAccessed - b[1].lastAccessed;
      })
      .slice(0, Math.floor(this.MAX_MEMORY_CACHE_SIZE * 0.8)); // Keep 80%

    this.memoryCache.clear();
    entries.forEach(([key, entry]) => {
      this.memoryCache.set(key, entry);
    });
  }

  /**
   * Registra un patrón de lectura
   */
  async recordReadingPattern(
    userId: string,
    book: string,
    chapter: number,
    versesRead: number,
    durationMinutes: number,
  ): Promise<void> {
    await this.initialize();

    const now = Date.now();
    const timeOfDay = new Date().getHours();

    await this.db!.runAsync(
      `
      INSERT INTO reading_patterns
      (user_id, book, chapter, read_at, reading_duration, verses_read, time_of_day)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [userId, book, chapter, now, durationMinutes, versesRead, timeOfDay],
    );

    // Trigger prediction update
    await this.updatePredictions(userId);
  }

  /**
   * Analiza patrones de lectura del usuario
   */
  async analyzeReadingPatterns(userId: string): Promise<ReadingPattern> {
    await this.initialize();

    // Get recent reading history (last 30 days)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const patterns = await this.db!.getAllAsync<{
      book: string;
      chapter: number;
      reading_duration: number;
      verses_read: number;
      time_of_day: number;
      read_at: number;
    }>(
      `
      SELECT book, chapter, reading_duration, verses_read, time_of_day, read_at
      FROM reading_patterns
      WHERE user_id = ? AND read_at > ?
      ORDER BY read_at DESC
      LIMIT 100
    `,
      [userId, thirtyDaysAgo],
    );

    if (patterns.length === 0) {
      return {
        userId,
        commonBooks: [],
        averageReadingTime: 5,
        preferredTimeOfDay: 9,
        averageVersesPerSession: 10,
        lastBook: 'Génesis',
        lastChapter: 1,
        readingSequence: 'sequential',
      };
    }

    // Calculate statistics
    const bookCounts = new Map<string, number>();
    let totalDuration = 0;
    const hoursCount = new Array(24).fill(0);
    let totalVerses = 0;

    patterns.forEach(p => {
      bookCounts.set(p.book, (bookCounts.get(p.book) || 0) + 1);
      totalDuration += p.reading_duration || 5;
      hoursCount[p.time_of_day]++;
      totalVerses += p.verses_read || 10;
    });

    // Common books
    const commonBooks = Array.from(bookCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([book]) => book);

    // Preferred time of day
    const preferredTimeOfDay = hoursCount.indexOf(Math.max(...hoursCount));

    // Determine reading sequence
    let sequentialCount = 0;
    for (let i = 1; i < patterns.length; i++) {
      const current = patterns[i];
      const previous = patterns[i - 1];

      if (
        current.book === previous.book &&
        Math.abs(current.chapter - previous.chapter) === 1
      ) {
        sequentialCount++;
      }
    }

    const sequenceRatio = sequentialCount / (patterns.length - 1);
    const readingSequence =
      sequenceRatio > 0.7
        ? 'sequential'
        : sequenceRatio > 0.3
          ? 'mixed'
          : 'random';

    return {
      userId,
      commonBooks,
      averageReadingTime: Math.round(totalDuration / patterns.length),
      preferredTimeOfDay,
      averageVersesPerSession: Math.round(totalVerses / patterns.length),
      lastBook: patterns[0].book,
      lastChapter: patterns[0].chapter,
      readingSequence,
    };
  }

  /**
   * Predice el próximo capítulo que el usuario leerá
   */
  async predictNextChapter(userId: string): Promise<PredictionResult> {
    const patterns = await this.analyzeReadingPatterns(userId);

    let confidence = 0;
    let nextChapter = {
      book: patterns.lastBook,
      chapter: patterns.lastChapter + 1,
    };
    const relatedChapters: Array<{book: string; chapter: number}> = [];

    if (patterns.readingSequence === 'sequential') {
      // High confidence for next chapter
      confidence = 0.9;
      nextChapter = {
        book: patterns.lastBook,
        chapter: patterns.lastChapter + 1,
      };

      // Add 2 more sequential chapters
      relatedChapters.push(
        {book: patterns.lastBook, chapter: patterns.lastChapter + 2},
        {book: patterns.lastBook, chapter: patterns.lastChapter + 3},
      );
    } else if (patterns.readingSequence === 'mixed') {
      // Medium confidence
      confidence = 0.6;

      // Suggest both next chapter and common books
      nextChapter = {
        book: patterns.lastBook,
        chapter: patterns.lastChapter + 1,
      };

      patterns.commonBooks.slice(0, 2).forEach(book => {
        if (book !== patterns.lastBook) {
          relatedChapters.push({book, chapter: 1});
        }
      });
    } else {
      // Random reading pattern - suggest common books
      confidence = 0.4;

      if (patterns.commonBooks.length > 0) {
        nextChapter = {book: patterns.commonBooks[0], chapter: 1};
        patterns.commonBooks.slice(1, 3).forEach(book => {
          relatedChapters.push({book, chapter: 1});
        });
      }
    }

    return {
      nextChapter,
      confidence,
      relatedChapters,
    };
  }

  /**
   * Actualiza predicciones y precarga contenido
   */
  async updatePredictions(userId: string): Promise<void> {
    const prediction = await this.predictNextChapter(userId);

    // Store prediction
    await this.initialize();
    const now = Date.now();

    await this.db!.runAsync(
      `
      INSERT OR REPLACE INTO cache_predictions
      (user_id, predicted_book, predicted_chapter, confidence, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        userId,
        prediction.nextChapter.book,
        prediction.nextChapter.chapter,
        prediction.confidence,
        now,
      ],
    );

    // Prefetch if confidence is high enough
    if (prediction.confidence >= this.PREFETCH_THRESHOLD) {
      await this.prefetchChapter(
        prediction.nextChapter.book,
        prediction.nextChapter.chapter,
      );

      // Prefetch related chapters too
      for (const related of prediction.relatedChapters) {
        await this.prefetchChapter(related.book, related.chapter);
      }
    }
  }

  /**
   * Precarga un capítulo en caché
   */
  async prefetchChapter(book: string, chapter: number): Promise<void> {
    await this.initialize();

    const verses = await this.db!.getAllAsync<{
      verse: number;
      text: string;
    }>(
      `
      SELECT verse, text FROM verses
      WHERE book_name = ? AND chapter = ? AND version = 'RVR1960'
      ORDER BY verse
    `,
      [book, chapter],
    );

    if (verses.length > 0) {
      const cacheKey = `chapter_${book}_${chapter}`;
      await this.set(cacheKey, verses, {
        ttl: 1000 * 60 * 60 * 2, // 2 hours
        priority: 8, // High priority
      });
    }
  }

  /**
   * Obtiene estadísticas de caché
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    memoryEntries: number;
    hitRate: number;
    avgAccessCount: number;
  }> {
    await this.initialize();

    const result = await this.db!.getFirstAsync<{
      count: number;
      avg_access: number;
    }>(
      `SELECT COUNT(*) as count, AVG(access_count) as avg_access FROM cache_entries`,
    );

    const totalEntries = result?.count || 0;
    const avgAccessCount = result?.avg_access || 0;
    const memoryEntries = this.memoryCache.size;

    // Calculate hit rate (entries accessed more than once / total entries)
    const hitRateResult = await this.db!.getFirstAsync<{hit_count: number}>(
      `SELECT COUNT(*) as hit_count FROM cache_entries WHERE access_count > 0`,
    );

    const hitRate =
      totalEntries > 0
        ? ((hitRateResult?.hit_count || 0) / totalEntries) * 100
        : 0;

    return {
      totalEntries,
      memoryEntries,
      hitRate: Math.round(hitRate),
      avgAccessCount: Math.round(avgAccessCount * 10) / 10,
    };
  }

  /**
   * Limpia todo el caché
   */
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    await this.initialize();
    await this.db!.runAsync(`DELETE FROM cache_entries`);
  }

  /**
   * Pre-carga contenido popular
   */
  async warmupCache(): Promise<void> {
    // Pre-cargar capítulos más populares
    const popularChapters = [
      {book: 'Salmos', chapter: 23},
      {book: 'Juan', chapter: 3},
      {book: 'Génesis', chapter: 1},
      {book: 'Mateo', chapter: 5},
      {book: 'Romanos', chapter: 8},
      {book: 'Proverbios', chapter: 3},
      {book: '1 Corintios', chapter: 13},
      {book: 'Filipenses', chapter: 4},
    ];

    for (const {book, chapter} of popularChapters) {
      await this.prefetchChapter(book, chapter);
    }
  }
}

// Singleton instance
export const predictiveCacheService = new PredictiveCacheService();
