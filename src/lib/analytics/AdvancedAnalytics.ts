/**
 * Sistema de Analíticas Avanzadas
 * Proporciona insights detallados sobre los hábitos de lectura del usuario
 */

import { BibleDatabase } from '../database';

export interface ReadingInsight {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  versesRead: number;
  timeSpent: number;
  chaptersCompleted: number;
  booksRead: string[];
}

export interface FavoriteBook {
  bookName: string;
  versesRead: number;
  timeSpent: number;
  lastRead: string;
}

export interface ReadingHeatmap {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // Nivel de intensidad
}

export interface ReadingPeakTime {
  hour: number; // 0-23
  count: number;
  percentage: number;
}

export interface TestamentProgress {
  testament: 'old' | 'new';
  totalBooks: number;
  booksCompleted: number;
  totalChapters: number;
  chaptersRead: number;
  totalVerses: number;
  versesRead: number;
  percentage: number;
}

export class AdvancedAnalytics {
  private db: BibleDatabase;

  constructor(database: BibleDatabase) {
    this.db = database;
  }

  /**
   * Inicializa las tablas de analíticas
   */
  async initialize(): Promise<void> {
    // Ejecutar cada sentencia SQL por separado
    const db = await this.db.getDatabase();

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS reading_sessions (
        id TEXT PRIMARY KEY,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        verses_read INTEGER DEFAULT 0,
        book_name TEXT,
        chapter INTEGER,
        created_at INTEGER NOT NULL
      )
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS verse_read_log (
        id TEXT PRIMARY KEY,
        verse_id TEXT NOT NULL,
        book_name TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        read_at INTEGER NOT NULL,
        session_id TEXT,
        FOREIGN KEY (session_id) REFERENCES reading_sessions(id)
      )
    `);

    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_verse_read_log_date ON verse_read_log(read_at)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_verse_read_log_book ON verse_read_log(book_name)');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_sessions_date ON reading_sessions(start_time)');
  }

  /**
   * Inicia una sesión de lectura
   */
  async startSession(bookName: string, chapter: number): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    const sql = `
      INSERT INTO reading_sessions (id, start_time, book_name, chapter, created_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [sessionId, now, bookName, chapter, now]);
    return sessionId;
  }

  /**
   * Finaliza una sesión de lectura
   */
  async endSession(sessionId: string): Promise<void> {
    const now = Date.now();

    // Obtener datos de la sesión
    const sql = `
      SELECT start_time, verses_read FROM reading_sessions WHERE id = ?
    `;
    const result = await this.db.executeSql(sql, [sessionId]);
    const session = result.rows._array[0];

    if (!session) return;

    const duration = Math.floor((now - session.start_time) / 1000 / 60); // minutos

    await this.db.executeSql(
      `UPDATE reading_sessions
       SET end_time = ?, duration = ?
       WHERE id = ?`,
      [now, duration, sessionId]
    );
  }

  /**
   * Registra un versículo leído
   */
  async logVerseRead(
    bookName: string,
    chapter: number,
    verse: number,
    sessionId?: string
  ): Promise<void> {
    const id = `verse_log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const verseId = `${bookName}:${chapter}:${verse}`;
    const now = Date.now();

    const sql = `
      INSERT INTO verse_read_log (id, verse_id, book_name, chapter, verse, read_at, session_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.executeSql(sql, [
      id,
      verseId,
      bookName,
      chapter,
      verse,
      now,
      sessionId || null,
    ]);

    // Actualizar contador de sesión si existe
    if (sessionId) {
      await this.db.executeSql(
        'UPDATE reading_sessions SET verses_read = verses_read + 1 WHERE id = ?',
        [sessionId]
      );
    }
  }

  /**
   * Obtiene el heatmap de lectura para los últimos N días
   */
  async getReadingHeatmap(days: number = 365): Promise<ReadingHeatmap[]> {
    const startDate = Date.now() - days * 24 * 60 * 60 * 1000;

    const sql = `
      SELECT
        date(read_at / 1000, 'unixepoch') as date,
        COUNT(*) as count
      FROM verse_read_log
      WHERE read_at >= ?
      GROUP BY date
      ORDER BY date ASC
    `;

    const result = await this.db.executeSql(sql, [startDate]);
    const data = result.rows._array;

    // Calcular niveles de intensidad
    const maxCount = Math.max(...data.map((d) => d.count));

    return data.map((row) => {
      const percentage = row.count / maxCount;
      let level: 0 | 1 | 2 | 3 | 4;

      if (percentage === 0) level = 0;
      else if (percentage < 0.25) level = 1;
      else if (percentage < 0.5) level = 2;
      else if (percentage < 0.75) level = 3;
      else level = 4;

      return {
        date: row.date,
        count: row.count,
        level,
      };
    });
  }

  /**
   * Obtiene los horarios pico de lectura
   */
  async getReadingPeakTimes(): Promise<ReadingPeakTime[]> {
    const sql = `
      SELECT
        CAST(strftime('%H', read_at / 1000, 'unixepoch', 'localtime') AS INTEGER) as hour,
        COUNT(*) as count
      FROM verse_read_log
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const result = await this.db.executeSql(sql);
    const data = result.rows._array;

    const total = data.reduce((sum, row) => sum + row.count, 0);

    return data.map((row) => ({
      hour: row.hour,
      count: row.count,
      percentage: (row.count / total) * 100,
    }));
  }

  /**
   * Obtiene los libros favoritos del usuario
   */
  async getFavoriteBooks(limit: number = 10): Promise<FavoriteBook[]> {
    const sql = `
      SELECT
        book_name,
        COUNT(*) as verses_read,
        MAX(read_at) as last_read
      FROM verse_read_log
      GROUP BY book_name
      ORDER BY verses_read DESC
      LIMIT ?
    `;

    const result = await this.db.executeSql(sql, [limit]);

    return result.rows._array.map((row) => ({
      bookName: row.book_name,
      versesRead: row.verses_read,
      timeSpent: 0, // Calcular desde sesiones si está disponible
      lastRead: new Date(row.last_read).toISOString(),
    }));
  }

  /**
   * Obtiene insights de lectura para un período
   */
  async getReadingInsights(
    type: 'daily' | 'weekly' | 'monthly',
    limit: number = 30
  ): Promise<ReadingInsight[]> {
    let dateFormat: string;
    let groupBy: string;

    switch (type) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        groupBy = 'date';
        break;
      case 'weekly':
        dateFormat = '%Y-W%W';
        groupBy = 'week';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        groupBy = 'month';
        break;
    }

    const sql = `
      SELECT
        strftime('${dateFormat}', read_at / 1000, 'unixepoch') as period,
        COUNT(*) as verses_read,
        COUNT(DISTINCT book_name) as books_count,
        GROUP_CONCAT(DISTINCT book_name) as books
      FROM verse_read_log
      GROUP BY period
      ORDER BY period DESC
      LIMIT ?
    `;

    const result = await this.db.executeSql(sql, [limit]);

    return result.rows._array.map((row) => ({
      type,
      date: row.period,
      versesRead: row.verses_read,
      timeSpent: 0, // Calcular desde sesiones
      chaptersCompleted: 0, // Calcular
      booksRead: row.books ? row.books.split(',') : [],
    }));
  }

  /**
   * Obtiene progreso por testamento
   */
  async getTestamentProgress(): Promise<TestamentProgress[]> {
    // Libros del Antiguo Testamento (1-39)
    const oldTestamentBooks = [
      'Génesis',
      'Éxodo',
      'Levítico',
      'Números',
      'Deuteronomio',
      'Josué',
      'Jueces',
      'Rut',
      '1 Samuel',
      '2 Samuel',
      '1 Reyes',
      '2 Reyes',
      '1 Crónicas',
      '2 Crónicas',
      'Esdras',
      'Nehemías',
      'Ester',
      'Job',
      'Salmos',
      'Proverbios',
      'Eclesiastés',
      'Cantares',
      'Isaías',
      'Jeremías',
      'Lamentaciones',
      'Ezequiel',
      'Daniel',
      'Oseas',
      'Joel',
      'Amós',
      'Abdías',
      'Jonás',
      'Miqueas',
      'Nahum',
      'Habacuc',
      'Sofonías',
      'Hageo',
      'Zacarías',
      'Malaquías',
    ];

    // Nuevo Testamento (40-66)
    const newTestamentBooks = [
      'Mateo',
      'Marcos',
      'Lucas',
      'Juan',
      'Hechos',
      'Romanos',
      '1 Corintios',
      '2 Corintios',
      'Gálatas',
      'Efesios',
      'Filipenses',
      'Colosenses',
      '1 Tesalonicenses',
      '2 Tesalonicenses',
      '1 Timoteo',
      '2 Timoteo',
      'Tito',
      'Filemón',
      'Hebreos',
      'Santiago',
      '1 Pedro',
      '2 Pedro',
      '1 Juan',
      '2 Juan',
      '3 Juan',
      'Judas',
      'Apocalipsis',
    ];

    const results: TestamentProgress[] = [];

    for (const [testament, books] of [
      ['old', oldTestamentBooks],
      ['new', newTestamentBooks],
    ] as const) {
      const placeholders = books.map(() => '?').join(',');

      const sql = `
        SELECT
          COUNT(DISTINCT book_name) as books_read,
          COUNT(DISTINCT book_name || '-' || chapter) as chapters_read,
          COUNT(*) as verses_read
        FROM verse_read_log
        WHERE book_name IN (${placeholders})
      `;

      const result = await this.db.executeSql(sql, books);
      const data = result.rows._array[0];

      results.push({
        testament,
        totalBooks: books.length,
        booksCompleted: data.books_read || 0,
        totalChapters: testament === 'old' ? 929 : 260, // Aproximado
        chaptersRead: data.chapters_read || 0,
        totalVerses: testament === 'old' ? 23145 : 7957,
        versesRead: data.verses_read || 0,
        percentage:
          ((data.verses_read || 0) / (testament === 'old' ? 23145 : 7957)) * 100,
      });
    }

    return results;
  }

  /**
   * Obtiene tiempo promedio de lectura por sesión
   */
  async getAverageReadingTime(): Promise<{
    avgDuration: number;
    avgVersesPerSession: number;
    totalSessions: number;
  }> {
    const sql = `
      SELECT
        AVG(duration) as avg_duration,
        AVG(verses_read) as avg_verses,
        COUNT(*) as total_sessions
      FROM reading_sessions
      WHERE duration IS NOT NULL
    `;

    const result = await this.db.executeSql(sql);
    const data = result.rows._array[0];

    return {
      avgDuration: Math.round(data.avg_duration || 0),
      avgVersesPerSession: Math.round(data.avg_verses || 0),
      totalSessions: data.total_sessions || 0,
    };
  }

  /**
   * Exporta todas las analíticas
   */
  async exportAnalytics(): Promise<string> {
    const [heatmap, peakTimes, favorites, insights, testament, avgTime] =
      await Promise.all([
        this.getReadingHeatmap(365),
        this.getReadingPeakTimes(),
        this.getFavoriteBooks(20),
        this.getReadingInsights('monthly', 12),
        this.getTestamentProgress(),
        this.getAverageReadingTime(),
      ]);

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        heatmap,
        peakTimes,
        favoriteBooks: favorites,
        monthlyInsights: insights,
        testamentProgress: testament,
        averageReadingTime: avgTime,
      },
      null,
      2
    );
  }
}
