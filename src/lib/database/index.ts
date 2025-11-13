import * as SQLite from 'expo-sqlite';
import { BibleVerse, Bookmark, Note, ReadingProgress } from '../../types/bible';
import { CREATE_TABLES, INITIAL_READING_PROGRESS } from './schema';

class BibleDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('bible.db');
      await this.db.execAsync(CREATE_TABLES);
      await this.db.execAsync(INITIAL_READING_PROGRESS);
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private getDb(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Método público para acceder a la base de datos
  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    return this.getDb();
  }

  // Método helper para ejecutar SQL (usado por servicios externos)
  async executeSql(sql: string, params?: any[]): Promise<any> {
    const db = this.getDb();

    // Validar SQL no vacío
    if (!sql || sql.trim() === '') {
      console.error('executeSql: SQL query is empty');
      throw new Error('SQL query cannot be empty');
    }

    // Filtrar parámetros null/undefined y reemplazar con valores válidos
    const sanitizedParams = params?.map((param, index) => {
      if (param === null || param === undefined) {
        console.warn(`executeSql: Parameter at index ${index} is ${param}, replacing with null`);
        return null;
      }
      return param;
    });

    // Detectar si es una query SELECT
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      // Para SELECT, usar prepared statement
      try {
        if (sanitizedParams && sanitizedParams.length > 0) {
          const statement = await db.prepareAsync(sql);
          const result = await statement.executeAsync(sanitizedParams);
          const rows = await result.getAllAsync();
          await statement.finalizeAsync();

          return {
            rows: {
              _array: rows,
              length: rows.length,
            }
          };
        } else {
          const rows = await db.getAllAsync(sql);
          return {
            rows: {
              _array: rows,
              length: rows.length,
            }
          };
        }
      } catch (error) {
        console.error('❌ Error executing SELECT query:', { sql: sql.substring(0, 100), params: sanitizedParams }, error);
        throw error;
      }
    } else {
      // Para INSERT, UPDATE, DELETE, CREATE, etc.
      try {
        if (sql.includes('CREATE') || sql.includes('DROP') || sql.includes('ALTER')) {
          // Para DDL, usar execAsync
          await db.execAsync(sql);
          return { changes: 0, lastInsertRowId: 0 };
        } else if (sanitizedParams && sanitizedParams.length > 0) {
          // Para DML con parámetros, usar runAsync
          const result = await db.runAsync(sql, sanitizedParams);
          return result;
        } else {
          // Para DML sin parámetros
          await db.execAsync(sql);
          return { changes: 0, lastInsertRowId: 0 };
        }
      } catch (error) {
        console.error('❌ Error executing DML query:', { sql: sql.substring(0, 100), params: sanitizedParams }, error);
        throw error;
      }
    }
  }

  // ========== VERSE OPERATIONS ==========

  async insertVerses(verses: Omit<BibleVerse, 'id'>[]): Promise<void> {
    const db = this.getDb();

    await db.withTransactionAsync(async () => {
      for (const verse of verses) {
        // Los datos del archivo usan book_id y book_name, pero nuestra interfaz usa bookNumber y book
        // Soportamos ambos formatos para flexibilidad
        const bookId = (verse as any).book_id || verse.bookNumber;
        const bookName = (verse as any).book_name || verse.book;

        await db.runAsync(
          `INSERT OR REPLACE INTO verses (book_id, book_name, chapter, verse, text, version)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [bookId, bookName, verse.chapter, verse.verse, verse.text, verse.version]
        );
      }
    });
  }

  async getChapter(bookName: string, chapter: number, version: string = 'RVR1960'): Promise<BibleVerse[]> {
    const db = this.getDb();

    // Validar parámetros
    if (!bookName || bookName.trim() === '') {
      console.error('getChapter: bookName is invalid:', bookName);
      throw new Error('Book name is required');
    }

    if (!chapter || chapter < 1) {
      console.error('getChapter: chapter is invalid:', chapter);
      throw new Error('Chapter must be a positive number');
    }

    if (!version || version.trim() === '') {
      console.error('getChapter: version is invalid:', version);
      version = 'RVR1960'; // fallback
    }

    try {
      const result = await db.getAllAsync<BibleVerse>(
        `SELECT id, book_id as bookNumber, book_name as book, chapter, verse, text, version
         FROM verses
         WHERE book_name = ? AND chapter = ? AND version = ?
         ORDER BY verse ASC`,
        [bookName, chapter, version]
      );

      return result;
    } catch (error) {
      console.error(`❌ Error loading chapter ${bookName} ${chapter} (${version}):`, error);
      throw error;
    }
  }

  async getVerse(bookName: string, chapter: number, verse: number, version: string = 'RVR1960'): Promise<BibleVerse | null> {
    const db = this.getDb();

    const result = await db.getFirstAsync<BibleVerse>(
      `SELECT id, book_id as bookNumber, book_name as book, chapter, verse, text, version
       FROM verses
       WHERE book_name = ? AND chapter = ? AND verse = ? AND version = ?`,
      [bookName, chapter, verse, version]
    );

    return result || null;
  }

  async getRandomVerse(version: string = 'RVR1960'): Promise<BibleVerse | null> {
    const db = this.getDb();

    const result = await db.getFirstAsync<BibleVerse>(
      `SELECT id, book_id as bookNumber, book_name as book, chapter, verse, text, version
       FROM verses
       WHERE version = ?
       ORDER BY RANDOM()
       LIMIT 1`,
      [version]
    );

    return result || null;
  }

  // ========== SEARCH OPERATIONS ==========

  async searchVerses(query: string, version: string = 'RVR1960', limit: number = 100): Promise<BibleVerse[]> {
    const db = this.getDb();

    // Use FTS5 for fast full-text search
    const result = await db.getAllAsync<BibleVerse>(
      `SELECT v.id, v.book_id as bookNumber, v.book_name as book, v.chapter, v.verse, v.text, v.version
       FROM verses v
       INNER JOIN verses_fts fts ON v.id = fts.rowid
       WHERE fts.text MATCH ? AND v.version = ?
       ORDER BY rank
       LIMIT ?`,
      [query, version, limit]
    );

    return result;
  }

  async searchByBook(bookName: string, query: string, version: string = 'RVR1960'): Promise<BibleVerse[]> {
    const db = this.getDb();

    const result = await db.getAllAsync<BibleVerse>(
      `SELECT v.id, v.book_id as bookNumber, v.book_name as book, v.chapter, v.verse, v.text, v.version
       FROM verses v
       INNER JOIN verses_fts fts ON v.id = fts.rowid
       WHERE fts.text MATCH ? AND v.book_name = ? AND v.version = ?
       ORDER BY v.chapter, v.verse`,
      [query, bookName, version]
    );

    return result;
  }

  // ========== BOOKMARK OPERATIONS ==========

  async addBookmark(bookmark: Omit<Bookmark, 'id'>): Promise<string> {
    const db = this.getDb();
    const id = `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.runAsync(
      `INSERT INTO bookmarks (id, book_name, chapter, verse, text, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, bookmark.book, bookmark.chapter, bookmark.verse, bookmark.text, bookmark.createdAt]
    );

    return id;
  }

  async removeBookmark(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
  }

  async getBookmarks(): Promise<Bookmark[]> {
    const db = this.getDb();

    try {
      const result = await db.getAllAsync<Bookmark>(
        `SELECT id, book_name as book, chapter, verse, text, created_at as createdAt
         FROM bookmarks
         ORDER BY created_at DESC`
      );

      return result;
    } catch (error) {
      console.error('❌ Error loading bookmarks:', error);
      throw error;
    }
  }

  async isBookmarked(bookName: string, chapter: number, verse: number): Promise<boolean> {
    const db = this.getDb();

    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM bookmarks
       WHERE book_name = ? AND chapter = ? AND verse = ?`,
      [bookName, chapter, verse]
    );

    return (result?.count ?? 0) > 0;
  }

  // ========== NOTE OPERATIONS ==========

  async addNote(note: Omit<Note, 'id'>): Promise<string> {
    const db = this.getDb();
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.runAsync(
      `INSERT INTO notes (id, book_name, chapter, verse, verse_text, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, note.book, note.chapter, note.verse, note.text, note.note, note.createdAt, note.updatedAt]
    );

    return id;
  }

  async updateNote(id: string, noteText: string): Promise<void> {
    const db = this.getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      'UPDATE notes SET note = ?, updated_at = ? WHERE id = ?',
      [noteText, now, id]
    );
  }

  async removeNote(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
  }

  async getNotes(): Promise<Note[]> {
    const db = this.getDb();

    const result = await db.getAllAsync<Note>(
      `SELECT id, book_name as book, chapter, verse, verse_text as text, note,
              created_at as createdAt, updated_at as updatedAt
       FROM notes
       ORDER BY updated_at DESC`
    );

    return result;
  }

  async getNoteForVerse(bookName: string, chapter: number, verse: number): Promise<Note | null> {
    const db = this.getDb();

    const result = await db.getFirstAsync<Note>(
      `SELECT id, book_name as book, chapter, verse, verse_text as text, note,
              created_at as createdAt, updated_at as updatedAt
       FROM notes
       WHERE book_name = ? AND chapter = ? AND verse = ?`,
      [bookName, chapter, verse]
    );

    return result || null;
  }

  // ========== READING PROGRESS ==========

  async updateReadingProgress(bookName: string, chapter: number, verse: number): Promise<void> {
    const db = this.getDb();
    const timestamp = new Date().toISOString();

    await db.runAsync(
      `UPDATE reading_progress
       SET book_name = ?, chapter = ?, verse = ?, timestamp = ?
       WHERE id = 1`,
      [bookName, chapter, verse, timestamp]
    );
  }

  async getReadingProgress(): Promise<ReadingProgress | null> {
    const db = this.getDb();

    const result = await db.getFirstAsync<ReadingProgress>(
      `SELECT book_name as book, chapter, verse, timestamp
       FROM reading_progress
       WHERE id = 1`
    );

    return result || null;
  }

  // ========== UTILITY OPERATIONS ==========

  async getDatabaseStats(): Promise<{ totalVerses: number; versions: string[] }> {
    const db = this.getDb();

    const countResult = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM verses'
    );

    const versionsResult = await db.getAllAsync<{ version: string }>(
      'SELECT DISTINCT version FROM verses'
    );

    return {
      totalVerses: countResult?.count ?? 0,
      versions: versionsResult.map((v) => v.version),
    };
  }

  async clearAllData(): Promise<void> {
    const db = this.getDb();

    await db.withTransactionAsync(async () => {
      await db.execAsync('DELETE FROM verses');
      await db.execAsync('DELETE FROM bookmarks');
      await db.execAsync('DELETE FROM notes');
    });
  }
}

export { BibleDatabase };
export const bibleDB = new BibleDatabase();
export default bibleDB;
