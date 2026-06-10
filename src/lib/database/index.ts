/* eslint-disable no-console -- DB layer dev-mode init/progress logging.
   Will migrate to logger.* in Sprint 41 alongside Crashlytics wiring. */
import * as SQLite from 'expo-sqlite';
import {Asset} from 'expo-asset';
import {Directory, File, Paths} from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleVerse, Note, ReadingProgress} from '../../types/bible';
import {canonicalBookName} from '../../constants/bible';

/**
 * Copy the bundled pre-seeded bible.db into expo-sqlite's storage
 * directory if it isn't already there. Returns true when a copy
 * actually happened so the caller can log it. Failures degrade
 * silently — the legacy JS bulk-loader (`initializeBibleData`) will
 * still run if the seed didn't make it in.
 *
 * The seed contains both versions' verses + the FTS5 index so the
 * first launch finishes in well under a second instead of ~100s.
 */
async function seedFromBundleIfMissing(): Promise<boolean> {
  try {
    const sqliteDir = new Directory(Paths.document, 'SQLite');
    const targetFile = new File(sqliteDir, 'bible.db');
    if (targetFile.exists) return false;

    const asset = Asset.fromModule(require('../../../assets/bible-seed.db'));
    await asset.downloadAsync();
    const sourceUri = asset.localUri ?? asset.uri;
    if (!sourceUri) return false;

    if (!sqliteDir.exists) sqliteDir.create({intermediates: true});
    const sourceFile = new File(sourceUri);
    sourceFile.copy(targetFile);
    // The JS bulk loader keys "this version is loaded" off AsyncStorage;
    // mark both as loaded so it short-circuits instead of redundantly
    // re-iterating 62k rows just to hit the UNIQUE constraint.
    await Promise.all([
      AsyncStorage.setItem('@bible_data_loaded_rvr1960', 'true'),
      AsyncStorage.setItem('@bible_data_loaded_kjv', 'true'),
    ]);
    return true;
  } catch (error) {
    console.warn(
      '⚠️ Pre-seed DB copy failed, falling back to JS loader',
      error,
    );
    return false;
  }
}

class BibleDatabase {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  // One-time flag for the Sprint 58 canonical book-key normalization.
  private static readonly CANONICAL_BOOK_MIGRATION_KEY =
    '@migration_canonical_book_keys_v1';

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
      const seeded = await seedFromBundleIfMissing();
      if (seeded) {
        console.log(
          '🌱 Pre-seeded bible.db copied from bundle — skipping JS verse loader',
        );
      }
      this.db = await SQLite.openDatabaseAsync('bible.db');

      // Ejecutar cada sentencia SQL por separado para evitar NullPointerException
      console.log('🔧 Creating database tables...');

      // Tabla verses
      await this.db.runAsync(`
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
      await this.db.runAsync(`
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
      await this.db.runAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON verses BEGIN
          INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
          VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
        END
      `);

      await this.db.runAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_ad AFTER DELETE ON verses BEGIN
          INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
          VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
        END
      `);

      await this.db.runAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_au AFTER UPDATE ON verses BEGIN
          INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
          VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
          INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
          VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
        END
      `);

      // Tabla notes
      await this.db.runAsync(`
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
      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS reading_progress (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          book_name TEXT NOT NULL,
          chapter INTEGER NOT NULL,
          verse INTEGER NOT NULL,
          timestamp TEXT NOT NULL
        )
      `);

      // Tabla favorites
      await this.db.runAsync(`
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

      // Tabla review_events — append-only SRS review log (Sprint 45).
      // Immutable history powering the insights heatmap + retention curve.
      await this.db.runAsync(`
        CREATE TABLE IF NOT EXISTS review_events (
          id TEXT PRIMARY KEY,
          verse_key TEXT NOT NULL,
          book_name TEXT NOT NULL,
          grade TEXT NOT NULL,
          box_before INTEGER NOT NULL,
          box_after INTEGER NOT NULL,
          interval_days INTEGER,
          reviewed_at INTEGER NOT NULL
        )
      `);

      await this.migrateBookmarksToFavorites();

      // Índices
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book_id, chapter)',
      );
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_verses_version ON verses(version)',
      );
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_notes_reference ON notes(book_name, chapter, verse)',
      );
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_favorites_reference ON favorites(book_name, chapter, verse)',
      );
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_favorites_category ON favorites(category)',
      );
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_favorites_rating ON favorites(rating)',
      );
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_review_events_reviewed_at ON review_events(reviewed_at)',
      );
      await this.db.runAsync(
        'CREATE INDEX IF NOT EXISTS idx_review_events_verse_key ON review_events(verse_key)',
      );

      // Seed the reading_progress row only if it does not exist yet.
      // INSERT OR IGNORE (not OR REPLACE) so a returning user's real
      // last-read position survives every app launch.
      await this.db.runAsync(
        `INSERT OR IGNORE INTO reading_progress (id, book_name, chapter, verse, timestamp)
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

  private async migrateBookmarksToFavorites(): Promise<void> {
    const db = this.getDb();
    const table = await db.getFirstAsync<{name: string}>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'",
    );

    if (!table) {
      return;
    }

    const bookmarks = await db.getAllAsync<{
      book_name: string;
      chapter: number;
      verse: number;
      text: string;
      created_at: string;
    }>(
      `SELECT book_name, chapter, verse, text, created_at
       FROM bookmarks`,
    );

    if (bookmarks.length === 0) {
      await db.runAsync('DROP TABLE IF EXISTS bookmarks');
      return;
    }

    const existingFavorites = await db.getAllAsync<{verseId: string}>(
      'SELECT verse_id as verseId FROM favorites',
    );
    const existingVerseIds = new Set(
      existingFavorites.map(item => item.verseId),
    );

    await db.withTransactionAsync(async () => {
      for (const bookmark of bookmarks) {
        const verseId = `${bookmark.book_name}_${bookmark.chapter}_${bookmark.verse}`;
        if (existingVerseIds.has(verseId)) {
          continue;
        }

        const numericCreatedAt = Number(bookmark.created_at);
        const parsedDate = Date.parse(bookmark.created_at);
        const createdAt = Number.isFinite(numericCreatedAt)
          ? numericCreatedAt
          : Number.isFinite(parsedDate)
            ? parsedDate
            : Date.now();

        const favoriteId = `fav_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 9)}`;

        await db.runAsync(
          `INSERT INTO favorites (
            id,
            verse_id,
            book_name,
            chapter,
            verse,
            text,
            category,
            rating,
            tags,
            note,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            favoriteId,
            verseId,
            bookmark.book_name,
            bookmark.chapter,
            bookmark.verse,
            bookmark.text,
            'other',
            5,
            JSON.stringify([]),
            null,
            createdAt,
            createdAt,
          ],
        );

        existingVerseIds.add(verseId);
      }
    });

    await db.runAsync('DROP TABLE IF EXISTS bookmarks');
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
          await db.runAsync(sql);
          return {changes: 0, lastInsertRowId: 0};
        } else if (sanitizedParams && sanitizedParams.length > 0) {
          // Para DML con parámetros, usar runAsync
          const result = await db.runAsync(sql, sanitizedParams);
          return result;
        } else {
          // Para DML sin parámetros
          await db.runAsync(sql);
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

  /**
   * Verse count of a single chapter — COUNT only, no verse payloads, so
   * surfaces that just need sizes (the comparison verse picker, the
   * listening queue) don't pull a whole chapter to measure it.
   */
  async getChapterVerseCount(
    bookId: number,
    chapter: number,
    version: string,
  ): Promise<number> {
    const db = this.getDb();

    // LOWER(version) — the verses table stores 'RVR1960' while version IDs
    // travel lowercase ('rvr1960'); mirrors compareVerse's tolerance.
    const result = await db.getFirstAsync<{count: number}>(
      `SELECT COUNT(*) as count FROM verses
       WHERE book_id = ? AND chapter = ? AND LOWER(version) = LOWER(?)`,
      [bookId, chapter, version],
    );

    return result?.count ?? 0;
  }

  /**
   * Batch verse counts for several chapters in ONE grouped query — the
   * listening-queue sheet sizes its upcoming rows at once. Keyed by
   * {@link chapterCountKey}; chapters absent from `verses` have no entry.
   */
  async getChapterVerseCounts(
    locations: Array<{bookId: number; chapter: number}>,
    version: string,
  ): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (locations.length === 0) return counts;

    const db = this.getDb();
    const pairClause = locations
      .map(() => '(book_id = ? AND chapter = ?)')
      .join(' OR ');
    const params: (number | string)[] = [version];
    for (const loc of locations) params.push(loc.bookId, loc.chapter);

    const rows = await db.getAllAsync<{
      book_id: number;
      chapter: number;
      count: number;
    }>(
      `SELECT book_id, chapter, COUNT(*) as count FROM verses
       WHERE LOWER(version) = LOWER(?) AND (${pairClause})
       GROUP BY book_id, chapter`,
      params,
    );

    for (const row of rows) {
      counts.set(chapterCountKey(row.book_id, row.chapter), row.count);
    }
    return counts;
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
    offset: number = 0,
  ): Promise<BibleVerse[]> {
    const db = this.getDb();

    // Use FTS5 for fast full-text search. OFFSET supports the
    // "Load more" pagination on the search screen — when a query
    // returns LIMIT rows, the next page is fetched with offset=LIMIT.
    const result = await db.getAllAsync<BibleVerse>(
      `SELECT v.id, v.book_id as bookNumber, v.book_name as book, v.chapter, v.verse, v.text, v.version
       FROM verses v
       INNER JOIN verses_fts fts ON v.id = fts.rowid
       WHERE fts.text MATCH ? AND v.version = ?
       ORDER BY rank
       LIMIT ? OFFSET ?`,
      [query, version, limit, offset],
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

  // ========== NOTE OPERATIONS ==========

  async addNote(note: Omit<Note, 'id'>): Promise<string> {
    const db = this.getDb();
    const id = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.runAsync(
      `INSERT INTO notes (id, book_name, chapter, verse, verse_text, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        // Canonical book identity so a note is found regardless of the
        // version/nav language the verse arrived with (Sprint 58).
        canonicalBookName(note.book),
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

  async getNotesCount(): Promise<number> {
    const db = this.getDb();
    const result = await db.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM notes',
    );

    return result?.count ?? 0;
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
      [canonicalBookName(bookName), chapter, verse],
    );

    return result || null;
  }

  /**
   * One-shot migration (Sprint 58): normalize the book identity stored for
   * favorites / highlights / notes to the canonical English name, so a verse
   * keyed under "Génesis" (RVR1960) and one keyed under "Genesis" (KJV) become
   * the same key. Rebuilds each row's `verse_id` from its own
   * book/chapter/verse columns (no string parsing). Idempotent and guarded by
   * a one-time flag; non-fatal on error because read paths already
   * canonicalize on the fly. Must run AFTER the highlights table exists
   * (see ServicesContext).
   */
  async migrateCanonicalBookKeys(): Promise<void> {
    try {
      const done = await AsyncStorage.getItem(
        BibleDatabase.CANONICAL_BOOK_MIGRATION_KEY,
      );
      if (done === '1') return;
      const db = this.getDb();

      // favorites: book_name + verse_id ("book_chapter_verse")
      const favs = await db.getAllAsync<{
        id: string;
        book_name: string;
        chapter: number;
        verse: number;
      }>('SELECT id, book_name, chapter, verse FROM favorites');
      for (const f of favs) {
        const canonical = canonicalBookName(f.book_name);
        if (canonical !== f.book_name) {
          await db.runAsync(
            'UPDATE favorites SET book_name = ?, verse_id = ? WHERE id = ?',
            [canonical, `${canonical}_${f.chapter}_${f.verse}`, f.id],
          );
        }
      }

      // notes: book_name
      const notes = await db.getAllAsync<{id: string; book_name: string}>(
        'SELECT id, book_name FROM notes',
      );
      for (const n of notes) {
        const canonical = canonicalBookName(n.book_name);
        if (canonical !== n.book_name) {
          await db.runAsync('UPDATE notes SET book_name = ? WHERE id = ?', [
            canonical,
            n.id,
          ]);
        }
      }

      // highlights: book_id + verse_id ("book:chapter:verse"). verse_id is
      // UNIQUE, so a collision (same verse highlighted under two language
      // names) drops the redundant non-canonical row in favour of the
      // canonical one.
      try {
        const highlights = await db.getAllAsync<{
          id: string;
          book_id: string;
          chapter: number;
          verse: number;
        }>('SELECT id, book_id, chapter, verse FROM highlights');
        for (const h of highlights) {
          const canonical = canonicalBookName(h.book_id);
          if (canonical === h.book_id) continue;
          const newVerseId = `${canonical}:${h.chapter}:${h.verse}`;
          try {
            await db.runAsync(
              'UPDATE highlights SET book_id = ?, verse_id = ? WHERE id = ?',
              [canonical, newVerseId, h.id],
            );
          } catch {
            // UNIQUE(verse_id) collision: a canonical row already exists.
            await db.runAsync('DELETE FROM highlights WHERE id = ?', [h.id]);
          }
        }
      } catch {
        // highlights table not present yet — nothing to migrate.
      }

      await AsyncStorage.setItem(
        BibleDatabase.CANONICAL_BOOK_MIGRATION_KEY,
        '1',
      );
    } catch {
      // Non-fatal: read paths canonicalize on the fly, so correctness holds
      // even if this normalization could not complete.
    }
  }

  // ========== FAVORITE OPERATIONS ==========

  async addFavorite(
    favorite: import('../../context/FavoritesContext').Favorite,
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
    import('../../context/FavoritesContext').Favorite[]
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

  async getFavoritesCount(): Promise<number> {
    const db = this.getDb();
    const result = await db.getFirstAsync<{count: number}>(
      'SELECT COUNT(*) as count FROM favorites',
    );

    return result?.count ?? 0;
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
      await db.runAsync('DELETE FROM verses');
      await db.runAsync('DELETE FROM favorites');
      await db.runAsync('DELETE FROM notes');
    });
  }
}

/** Map key for {@link BibleDatabase.getChapterVerseCounts} results. */
export function chapterCountKey(bookId: number, chapter: number): string {
  return `${bookId}:${chapter}`;
}

export {BibleDatabase};
export const bibleDB = new BibleDatabase();
export default bibleDB;
