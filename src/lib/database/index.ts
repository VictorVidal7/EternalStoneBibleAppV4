import * as SQLite from 'expo-sqlite';
import {BibleVerse, Bookmark, Note, ReadingProgress} from '../../types/bible';
import {CREATE_TABLES, INITIAL_READING_PROGRESS} from './schema';

class BibleDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    // Si ya está inicializado, retornar inmediatamente
    if (this.initialized) {
      console.log('⚡ Database already initialized, skipping');
      return;
    }

    // Si hay una inicialización en progreso, esperar a que termine
    if (this.initializationPromise) {
      console.log('⏳ Waiting for ongoing initialization...');
      return this.initializationPromise;
    }

    // Crear la promesa de inicialización
    this.initializationPromise = this._performInitialization();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async _performInitialization(): Promise<void> {
    if (this.initialized) return;

    try {
      this.db = await SQLite.openDatabaseAsync('bible.db');

      // Ejecutar cada sentencia SQL por separado para evitar NullPointerException
      console.log('🔧 Creating database tables...');

      // Tabla verses
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS verses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          book_name TEXT NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          text TEXT NOT NULL,
          version TEXT NOT NULL DEFAULT 'RVR1960',
          UNIQUE(book_id, chapter, verse, version)
        )
      `);

      // FTS5 table
      await this.db.execAsync(`
        CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
          book_name,
          chapter,
          verse,
          text,
          content='verses',
          content_rowid='id'
        )
      `);

      // Triggers
      await this.db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON verses BEGIN
          INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
          VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
        END
      `);

      await this.db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_ad AFTER DELETE ON verses BEGIN
          INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
          VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
        END
      `);

      await this.db.execAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_au AFTER UPDATE ON verses BEGIN
          INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
          VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
          INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
          VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
        END
      `);

      // Tabla bookmarks
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS bookmarks (
          id TEXT PRIMARY KEY,
          book_name TEXT NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          text TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `);

      // Tabla notes
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          book_name TEXT NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          verse_text TEXT NOT NULL,
          note TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Tabla reading_progress
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS reading_progress (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          book_name TEXT NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          timestamp TEXT NOT NULL
        )
      `);

      // Tabla favorites
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS favorites (
          id TEXT PRIMARY KEY,
          verse_id TEXT NOT NULL,
          book_name TEXT NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          text TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'other',
          rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
          tags TEXT,
          note TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);

      // Índices
      await this.db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book_id, chapter)',
      );
      await this.db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_verses_version ON verses(version)',
      );
      await this.db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_bookmarks_reference ON bookmarks(book_name, chapter, verse)',
      );
      await this.db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_notes_reference ON notes(book_name, chapter, verse)',
      );
      await this.db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_favorites_reference ON favorites(book_name, chapter, verse)',
      );
      await this.db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_favorites_category ON favorites(category)',
      );
      await this.db.execAsync(
        'CREATE INDEX IF NOT EXISTS idx_favorites_rating ON favorites(rating)',
      );

      // Initial reading progress
      await this.db.runAsync(
        `INSERT OR REPLACE INTO reading_progress (id, book_name, chapter, verse, timestamp)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [1, 'Juan', 3, 16],
      );

      this.initialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
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
        console.warn(
          `executeSql: Parameter at index ${index} is ${param}, replacing with null`,
        );
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
            },
          };
        } else {
          const rows = await db.getAllAsync(sql);
          return {
            rows: {
              _array: rows,
              length: rows.length,
            },
          };
        }
      } catch (error) {
        console.error(
          '❌ Error executing SELECT query:',
          {sql: sql.substring(0, 100), params: sanitizedParams},
          error,
        );
        throw error;
      }
    } else {
      // Para INSERT, UPDATE, DELETE, CREATE, etc.
      try {
        if (
          sql.includes('CREATE') ||
          sql.includes('DROP') ||
          sql.includes('ALTER')
        ) {
          // Para DDL, usar execAsync
          await db.execAsync(sql);
          return {changes: 0, lastInsertRowId: 0};
        } else if (sanitizedParams && sanitizedParams.length > 0) {
          // Para DML con parámetros, usar runAsync
          const result = await db.runAsync(sql, sanitizedParams);
          return result;
        } else {
          // Para DML sin parámetros
          await db.execAsync(sql);
          return {changes: 0, lastInsertRowId: 0};
        }
      } catch (error) {
        console.error(
          '❌ Error executing DML query:',
          {sql: sql.substring(0, 100), params: sanitizedParams},
          error,
        );
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
          [
            bookId,
            bookName,
            verse.chapter,
            verse.verse,
            verse.text,
            verse.version,
          ],
        );
      }
    });
  }

  async getChapter(
    bookId: number,
    chapter: number,
    version: string = 'RVR1960',
  ): Promise<BibleVerse[]> {
    const db = this.getDb();

    // Validar parámetros
    if (!bookId || bookId < 1 || bookId > 66) {
      console.error('getChapter: bookId is invalid:', bookId);
      throw new Error('Book ID must be between 1 and 66');
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
      console.log(
        `🔍 Querying DB: bookId=${bookId}, chapter=${chapter}, version="${version}"`,
      );

      const result = await db.getAllAsync<BibleVerse>(
        `SELECT id, book_id as bookNumber, book_name as book, chapter, verse, text, version
         FROM verses
         WHERE book_id = ? AND chapter = ? AND version = ?
         ORDER BY verse ASC`,
        [bookId, chapter, version],
      );

      console.log(`📊 Query result: ${result.length} verses found`);

      if (result.length === 0) {
        // Intentar buscar libros similares para debugging
        const allBooks = await db.getAllAsync<{
          book_id: number;
          book_name: string;
        }>(
          'SELECT DISTINCT book_id, book_name FROM verses WHERE version = ? LIMIT 10',
          [version],
        );
        console.warn(
          `⚠️ No verses found for bookId=${bookId}. Sample books in DB for ${version}:`,
          allBooks,
        );
      }

      return result;
    } catch (error) {
      console.error(
        `❌ Error loading chapter bookId=${bookId} chapter=${chapter} (${version}):`,
        error,
      );
      throw error;
    }
  }

  async getVerse(
    bookId: number,
    chapter: number,
    verse: number,
    version: string = 'RVR1960',
  ): Promise<BibleVerse | null> {
    const db = this.getDb();

    const result = await db.getFirstAsync<BibleVerse>(
      `SELECT id, book_id as bookNumber, book_name as book, chapter, verse, text, version
       FROM verses
       WHERE book_id = ? AND chapter = ? AND verse = ? AND version = ?`,
      [bookId, chapter, verse, version],
    );

    return result || null;
  }

  async getRandomVerse(
    version: string = 'RVR1960',
  ): Promise<BibleVerse | null> {
    const db = this.getDb();

    const result = await db.getFirstAsync<BibleVerse>(
      `SELECT id, book_id as bookNumber, book_name as book, chapter, verse, text, version
       FROM verses
       WHERE version = ?
       ORDER BY RANDOM()
       LIMIT 1`,
      [version],
    );

    return result || null;
  }

  // ========== SEARCH OPERATIONS ==========

  async searchVerses(
    query: string,
    version: string = 'RVR1960',
    limit: number = 100,
  ): Promise<BibleVerse[]> {
    const db = this.getDb();

    // Use FTS5 for fast full-text search
    const result = await db.getAllAsync<BibleVerse>(
      `SELECT v.id, v.book_id as bookNumber, v.book_name as book, v.chapter, v.verse, v.text, v.version
       FROM verses v
       INNER JOIN verses_fts fts ON v.id = fts.rowid
       WHERE fts.text MATCH ? AND v.version = ?
       ORDER BY rank
       LIMIT ?`,
      [query, version, limit],
    );

    return result;
  }

  async searchByBook(
    bookId: number,
    query: string,
    version: string = 'RVR1960',
  ): Promise<BibleVerse[]> {
    const db = this.getDb();

    const result = await db.getAllAsync<BibleVerse>(
      `SELECT v.id, v.book_id as bookNumber, v.book_name as book, v.chapter, v.verse, v.text, v.version
       FROM verses v
       INNER JOIN verses_fts fts ON v.id = fts.rowid
       WHERE fts.text MATCH ? AND v.book_id = ? AND v.version = ?
       ORDER BY v.chapter, v.verse`,
      [query, bookId, version],
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
      [
        id,
        bookmark.book,
        bookmark.chapter,
        bookmark.verse,
        bookmark.text,
        bookmark.createdAt,
      ],
    );

    return id;
  }

  async removeBookmark(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', [id]);
  }

  async getBookmarks(): Promise<Bookmark[]> {
    console.log('📑 [DB] getBookmarks() called');
    const db = this.getDb();
    console.log('📑 [DB] Got database instance');

    try {
      const sql = `SELECT id, book_name as book, chapter, verse, text, created_at as createdAt
       FROM bookmarks
       ORDER BY created_at DESC`;

      console.log('📑 [DB] Executing query:', sql.substring(0, 80));

      const result = await db.getAllAsync<Bookmark>(sql);

      console.log(`📑 [DB] Query successful, got ${result.length} bookmarks`);
      return result;
    } catch (error) {
      console.error('❌ [DB] Error in getBookmarks():', error);
      // Intentar verificar si la tabla existe
      try {
        const tables = await db.getAllAsync<{name: string}>(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'",
        );
        console.log(
          '📊 [DB] Bookmarks table exists:',
          tables.length > 0,
          tables,
        );
      } catch (e) {
        console.error('❌ [DB] Could not check if bookmarks table exists:', e);
      }
      throw error;
    }
  }

  async isBookmarked(
    bookName: string,
    chapter: number,
    verse: number,
  ): Promise<boolean> {
    const db = this.getDb();

    const result = await db.getFirstAsync<{count: number}>(
      `SELECT COUNT(*) as count FROM bookmarks
       WHERE book_name = ? AND chapter = ? AND verse = ?`,
      [bookName, chapter, verse],
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
      [
        id,
        note.book,
        note.chapter,
        note.verse,
        note.text,
        note.note,
        note.createdAt,
        note.updatedAt,
      ],
    );

    return id;
  }

  async updateNote(id: string, noteText: string): Promise<void> {
    const db = this.getDb();
    const now = new Date().toISOString();

    await db.runAsync(
      'UPDATE notes SET note = ?, updated_at = ? WHERE id = ?',
      [noteText, now, id],
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
       ORDER BY updated_at DESC`,
    );

    return result;
  }

  async getNoteForVerse(
    bookName: string,
    chapter: number,
    verse: number,
  ): Promise<Note | null> {
    const db = this.getDb();

    const result = await db.getFirstAsync<Note>(
      `SELECT id, book_name as book, chapter, verse, verse_text as text, note,
              created_at as createdAt, updated_at as updatedAt
       FROM notes
       WHERE book_name = ? AND chapter = ? AND verse = ?`,
      [bookName, chapter, verse],
    );

    return result || null;
  }

  // ========== FAVORITE OPERATIONS ==========

  async addFavorite(
    favorite: import('../context/FavoritesContext').Favorite,
  ): Promise<void> {
    const db = this.getDb();

    await db.runAsync(
      `INSERT INTO favorites (id, verse_id, book_name, chapter, verse, text, category, rating, tags, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        favorite.id,
        favorite.verseId,
        favorite.book,
        favorite.chapter,
        favorite.verse,
        favorite.text,
        favorite.category,
        favorite.rating,
        JSON.stringify(favorite.tags),
        favorite.note || null,
        favorite.createdAt,
        favorite.updatedAt,
      ],
    );
  }

  async removeFavorite(id: string): Promise<void> {
    const db = this.getDb();
    await db.runAsync('DELETE FROM favorites WHERE id = ?', [id]);
  }

  async updateFavorite(id: string, updates: Partial<any>): Promise<void> {
    const db = this.getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.category !== undefined) {
      fields.push('category = ?');
      values.push(updates.category);
    }
    if (updates.rating !== undefined) {
      fields.push('rating = ?');
      values.push(updates.rating);
    }
    if (updates.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(updates.tags));
    }
    if (updates.note !== undefined) {
      fields.push('note = ?');
      values.push(updates.note);
    }
    if (updates.updatedAt !== undefined) {
      fields.push('updated_at = ?');
      values.push(updates.updatedAt);
    }

    if (fields.length > 0) {
      values.push(id);
      const sql = `UPDATE favorites SET ${fields.join(', ')} WHERE id = ?`;
      await db.runAsync(sql, values);
    }
  }

  async getFavorites(): Promise<
    import('../context/FavoritesContext').Favorite[]
  > {
    const db = this.getDb();

    const result = await db.getAllAsync<any>(
      `SELECT id, verse_id as verseId, book_name as book, chapter, verse, text,
              category, rating, tags, note, created_at as createdAt, updated_at as updatedAt
       FROM favorites
       ORDER BY created_at DESC`,
    );

    return result.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : [],
    }));
  }

  async isFavorite(
    book: string,
    chapter: number,
    verse: number,
  ): Promise<boolean> {
    const db = this.getDb();

    const result = await db.getFirstAsync<{count: number}>(
      `SELECT COUNT(*) as count FROM favorites
       WHERE book_name = ? AND chapter = ? AND verse = ?`,
      [book, chapter, verse],
    );

    return (result?.count ?? 0) > 0;
  }

  // ========== READING PROGRESS ==========

  async updateReadingProgress(
    bookName: string,
    chapter: number,
    verse: number,
  ): Promise<void> {
    const db = this.getDb();
    const timestamp = new Date().toISOString();

    await db.runAsync(
      `UPDATE reading_progress
       SET book_name = ?, chapter = ?, verse = ?, timestamp = ?
       WHERE id = 1`,
      [bookName, chapter, verse, timestamp],
    );
  }

  async getReadingProgress(): Promise<ReadingProgress | null> {
    const db = this.getDb();

    const result = await db.getFirstAsync<ReadingProgress>(
      `SELECT book_name as book, chapter, verse, timestamp
       FROM reading_progress
       WHERE id = 1`,
    );

    return result || null;
  }

  // ========== UTILITY OPERATIONS ==========

  async getDatabaseStats(): Promise<{totalVerses: number; versions: string[]}> {
    const db = this.getDb();

    const countResult = await db.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM verses',
    );

    const versionsResult = await db.getAllAsync<{version: string}>(
      'SELECT DISTINCT version FROM verses',
    );

    return {
      totalVerses: countResult?.count ?? 0,
      versions: versionsResult.map(v => v.version),
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

export {BibleDatabase};
export const bibleDB = new BibleDatabase();
export default bibleDB;
