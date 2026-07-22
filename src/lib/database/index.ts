/* eslint-disable no-console -- DB layer dev-mode init/progress logging.
   Will migrate to logger.* in Sprint 41 alongside Crashlytics wiring. */
import * as SQLite from 'expo-sqlite';
import {Platform} from 'react-native';
import {Asset} from 'expo-asset';
import {Directory, File, Paths} from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleVerse, Note, ReadingProgress} from '../../types/bible';
import {BIBLE_VERSIONS, canonicalBookName} from '../../constants/bible';
import {
  normalizePackPath,
  packLoadedKey,
  PACK_IMPORT_SQL,
  PACK_SCHEMA,
} from './pack-import';

/** An outgoing cross-reference row (the verse a focus verse points TO). */
export interface CrossRefOut {
  to_book: number;
  to_chapter: number;
  to_verse: number;
  /** End verse of a same-chapter target range (e.g. "1:1-5"), else null. */
  to_verse_end: number | null;
  votes: number;
}

/** An incoming cross-reference row (a verse that points AT the focus verse). */
export interface CrossRefIn {
  from_book: number;
  from_chapter: number;
  from_verse: number;
  votes: number;
}

/** One original-language word of a verse (Hebrew/Greek), with its Strong's. */
export interface OriginalWord {
  position: number;
  lang: string;
  word: string;
  translit: string | null;
  gloss_en: string | null;
  gloss_es: string | null;
  strongs: string | null;
  grammar: string | null;
}

/** A Strong's lexicon entry (definition for a Strong's number). */
export interface StrongsEntry {
  strongs: string;
  lang: string;
  lemma: string | null;
  translit: string | null;
  definition: string | null;
  /** Faithful Spanish translation of the definition, when available (else null). */
  definition_es: string | null;
  kjv_def: string | null;
}

/** One occurrence of a Strong's number (for the concordance). */
export interface StrongsOccurrence {
  book_id: number;
  chapter: number;
  verse: number;
  word: string;
}

/** Per-book occurrence count of a Strong's number (the distribution chart). */
export interface StrongsBookCount {
  book_id: number;
  count: number;
}

/**
 * A Bible-dictionary entry (Tanda 5). `gloss_es` is free, complete in
 * itself; `article_es` is the premium full translated article (null for a
 * future `multi-view` treatment, where the content instead lives in a
 * separate `dictionary_multiview_sections` table — not part of this batch).
 */
export interface DictionaryEntry {
  slug: string;
  headword_es: string;
  gloss_es: string;
  article_es: string | null;
  source_tier: string;
  treatment: string;
  updated_at: string | null;
}

/** Schema name the downloaded originals pack is attached under at import. */
const ORIGINALS_SCHEMA = 'orig';

/** Schema name the bundled cross-reference asset is attached under at import. */
const XREF_SCHEMA = 'xref';

/** Schema name the bundled Strong's-definitions overlay is attached under. */
const SDEFS_SCHEMA = 'sdefs';

/**
 * Version of the bundled Strong's-definitions overlay (fixed English + Spanish).
 * Bump this when shipping a new translation batch so the app re-imports the
 * grown asset on the next launch.
 */
const SDEFS_VERSION = 17;

/**
 * Version of the bundled v1-factual dictionary entries (Tanda 5, see
 * seedDictionaryV1IfNeeded). Bump this when shipping a new translation batch
 * so the app re-imports the grown JSON asset on the next launch — same idea
 * as SDEFS_VERSION, but for a dataset small enough (10 rows) to embed
 * directly as JSON instead of a downloadable/attached SQLite overlay.
 */
const DICT_V1_VERSION = 1;

/**
 * `updated_at` stamped on every row seeded by seedDictionaryV1IfNeeded: the
 * date this v1-factual batch was translated (per the source files' own
 * "Fecha:" notes), not the device's local seed time — the content itself
 * didn't change since then, only where it's stored.
 */
const DICT_V1_UPDATED_AT = '2026-07-18';

/**
 * Version of the bundled v2-doctrinal dictionary entries batch 1 (Tanda 5,
 * see seedDictionaryV2IfNeeded). Bump when shipping a grown v2 batch (e.g.
 * once Kingdom of God/Predestination/Holy Spirit/Salvation are resolved) so
 * the app re-imports the grown JSON asset on the next launch.
 */
const DICT_V2_VERSION = 1;

/** `updated_at` stamped on every row seeded by seedDictionaryV2IfNeeded. */
const DICT_V2_UPDATED_AT = '2026-07-21';

/** Max incoming ("referenced by") rows surfaced for a verse, by votes. */
const XREF_INCOMING_LIMIT = 25;

/** Bulk import statement for the bundled cross-reference web (RUMBO #3). */
const XREF_IMPORT_SQL =
  `INSERT INTO cross_references ` +
  `(from_book, from_chapter, from_verse, to_book, to_chapter, to_verse, to_verse_end, votes) ` +
  `SELECT from_book, from_chapter, from_verse, to_book, to_chapter, to_verse, to_verse_end, votes ` +
  `FROM ${XREF_SCHEMA}.cross_references`;

/** Bulk import statement for the bundled Strong's-definitions overlay. */
const SDEFS_IMPORT_SQL =
  `INSERT INTO strongs_defs (strongs, definition_en, definition_es) ` +
  `SELECT strongs, definition_en, definition_es FROM ${SDEFS_SCHEMA}.strongs_defs`;

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
    // The JS bulk loader keys "this version is loaded" off AsyncStorage; mark
    // the two BUNDLED versions (RVR1960 + WEB) as loaded so it short-circuits
    // instead of redundantly re-iterating 62k rows just to hit the UNIQUE
    // constraint. KJV/BSB are downloadable packs — their flags get set by
    // importVersionPack, not here.
    await Promise.all([
      AsyncStorage.setItem('@bible_data_loaded_rvr1960', 'true'),
      AsyncStorage.setItem('@bible_data_loaded_web', 'true'),
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
  // One-time flag marking the bundled cross-reference web as imported (RUMBO #3).
  private static readonly CROSS_REFS_LOADED_KEY = '@cross_refs_loaded_v1';
  // Flag marking the downloaded original-languages pack as imported.
  private static readonly ORIGINALS_LOADED_KEY = '@originals_loaded_v1';
  // Imported VERSION of the bundled Strong's-definitions overlay (re-import on bump).
  private static readonly SDEFS_LOADED_KEY = '@strongs_defs_loaded_version';
  // Imported VERSION of the bundled v1-factual dictionary entries (Tanda 5).
  private static readonly DICT_V1_LOADED_KEY = '@dictionary_v1_loaded_version';
  // Imported VERSION of the bundled v2-doctrinal dictionary entries (Tanda 5).
  private static readonly DICT_V2_LOADED_KEY = '@dictionary_v2_loaded_version';

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

      await this.createSchema();

      // Populate the cross-reference web from the bundled asset on first run
      // (fresh installs AND existing ones — the seed copy never carried it).
      // Graceful: a failure just leaves the curated layer doing the work.
      await this.seedCrossReferencesIfMissing();
      await this.seedStrongsDefsIfNeeded();
      await this.seedDictionaryV1IfNeeded();
      await this.seedDictionaryV2IfNeeded();

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

  /**
   * Idempotent schema bootstrap: every table/trigger/index uses
   * `IF NOT EXISTS`, and the lone data-carrying seed (the `reading_progress`
   * singleton row) uses `INSERT OR IGNORE`, so running this again on a
   * database that already has it all (every subsequent app launch) is a
   * no-op that neither throws nor touches existing rows. Extracted from
   * `_performInitialization` so schema idempotency is unit-testable without
   * the asset-loading/native-open machinery around it (T7.2).
   */
  private async createSchema(): Promise<void> {
    const db = this.getDb();

    // Ejecutar cada sentencia SQL por separado para evitar NullPointerException
    console.log('🔧 Creating database tables...');

    // Tabla verses
    await db.runAsync(`
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

    // T20 web spike DIAGNOSTIC ONLY (not a real fix — see T20 report): the
    // web expo-sqlite WASM build has no fts5 module, and unconditionally
    // creating this virtual table + its triggers throws during schema
    // bootstrap, breaking ALL database access on web. Skip on web here just
    // to confirm that hypothesis; T21 owns the actual web data-layer design.
    if (Platform.OS !== 'web') {
      // FTS5 table
      await db.runAsync(`
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
      await db.runAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON verses BEGIN
          INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
          VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
        END
      `);

      await db.runAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_ad AFTER DELETE ON verses BEGIN
          INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
          VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
        END
      `);

      await db.runAsync(`
        CREATE TRIGGER IF NOT EXISTS verses_au AFTER UPDATE ON verses BEGIN
          INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
          VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
          INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
          VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
        END
      `);
    }

    // Tabla notes
    await db.runAsync(`
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
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        book_name TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    // Tabla favorites
    await db.runAsync(`
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
    await db.runAsync(`
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

    // Tabla cross_references — the broad, faithful cross-reference web
    // (RUMBO #3). Populated once from the bundled `cross-references.db` asset
    // (see seedCrossReferencesIfMissing); the curated set in
    // `src/constants/cross-references.ts` stays the runtime PRIORITY layer.
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS cross_references (
        from_book INTEGER NOT NULL,
        from_chapter INTEGER NOT NULL,
        from_verse INTEGER NOT NULL,
        to_book INTEGER NOT NULL,
        to_chapter INTEGER NOT NULL,
        to_verse INTEGER NOT NULL,
        to_verse_end INTEGER,
        votes INTEGER NOT NULL
      )
    `);

    // Tablas de idiomas originales — Hebrew/Greek words + Strong's lexicon
    // (ORIGINAL LANGUAGES). Empty until the user downloads the originals pack
    // (importOriginalsPack); the verse panel + lexicon read from here.
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS original_words (
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        position INTEGER NOT NULL,
        lang TEXT NOT NULL,
        word TEXT NOT NULL,
        translit TEXT,
        gloss_en TEXT,
        gloss_es TEXT,
        strongs TEXT,
        grammar TEXT
      )
    `);
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS strongs_lexicon (
        strongs TEXT PRIMARY KEY,
        lang TEXT NOT NULL,
        lemma TEXT,
        translit TEXT,
        definition TEXT,
        kjv_def TEXT
      )
    `);

    // Bundled Strong's-definitions overlay: the COMPLETE English definition
    // (fixes the openscriptures derivation/strongs_def split) + our faithful
    // Spanish translation. Populated from the bundled `strongs-defs.db` asset
    // (see seedStrongsDefsIfNeeded); overlays strongs_lexicon at read time.
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS strongs_defs (
        strongs TEXT PRIMARY KEY,
        definition_en TEXT,
        definition_es TEXT
      )
    `);

    // Bible-dictionary entries (Tanda 5). Populated from the bundled
    // `dictionary-v1-es.json` asset (see seedDictionaryV1IfNeeded) — free
    // gloss + premium article, same gating shape as strongs_defs/word-study.
    // Nothing reads from this table yet; where it surfaces in the app is
    // still an open product decision (see the Tanda 5 design doc).
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS dictionary_entries (
        slug TEXT PRIMARY KEY,
        headword_es TEXT,
        gloss_es TEXT,
        article_es TEXT,
        source_tier TEXT,
        treatment TEXT,
        updated_at TEXT
      )
    `);

    await this.migrateBookmarksToFavorites();

    // Índices
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book_id, chapter)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_verses_version ON verses(version)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_notes_reference ON notes(book_name, chapter, verse)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_favorites_reference ON favorites(book_name, chapter, verse)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_favorites_category ON favorites(category)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_favorites_rating ON favorites(rating)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_review_events_reviewed_at ON review_events(reviewed_at)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_review_events_verse_key ON review_events(verse_key)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_xref_from ON cross_references(from_book, from_chapter, from_verse)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_xref_to ON cross_references(to_book, to_chapter, to_verse)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_original_words_ref ON original_words(book_id, chapter, verse, position)',
    );
    await db.runAsync(
      'CREATE INDEX IF NOT EXISTS idx_original_words_strongs ON original_words(strongs)',
    );

    // Seed the reading_progress row only if it does not exist yet.
    // INSERT OR IGNORE (not OR REPLACE) so a returning user's real
    // last-read position survives every app launch.
    await db.runAsync(
      `INSERT OR IGNORE INTO reading_progress (id, book_name, chapter, verse, timestamp)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [1, 'Juan', 3, 16],
    );
  }

  /**
   * Import the bundled cross-reference web (RUMBO #3) once, the first time the
   * app runs against a DB that has not yet received it. Both fresh installs
   * (the seed copy never carried the table) and existing installs go through
   * here, gated by the `@cross_refs_loaded_v1` flag with a row-count fallback
   * so a lost flag never double-inserts. ATTACH the read-only asset, bulk
   * `INSERT … SELECT` (no FTS triggers on this table → fast), DETACH. Graceful:
   * a failure just leaves the curated layer doing the work, never crashes init.
   */
  private async seedCrossReferencesIfMissing(): Promise<void> {
    const db = this.getDb();
    try {
      if (
        (await AsyncStorage.getItem(BibleDatabase.CROSS_REFS_LOADED_KEY)) ===
        'true'
      ) {
        return;
      }
      const existing = await db.getFirstAsync<{n: number}>(
        'SELECT COUNT(*) AS n FROM cross_references',
      );
      if ((existing?.n ?? 0) > 0) {
        await AsyncStorage.setItem(BibleDatabase.CROSS_REFS_LOADED_KEY, 'true');
        return;
      }
      const asset = Asset.fromModule(
        require('../../../assets/cross-references.db'),
      );
      await asset.downloadAsync();
      const sourceUri = asset.localUri ?? asset.uri;
      if (!sourceUri) return;
      const attachPath = normalizePackPath(sourceUri);

      try {
        await db.execAsync(`DETACH DATABASE ${XREF_SCHEMA}`);
      } catch {
        // Not attached — nothing to detach.
      }
      await db.runAsync(`ATTACH DATABASE ? AS ${XREF_SCHEMA}`, [attachPath]);
      try {
        await db.withTransactionAsync(async () => {
          await db.runAsync(XREF_IMPORT_SQL);
        });
      } finally {
        await db.execAsync(`DETACH DATABASE ${XREF_SCHEMA}`);
      }
      await AsyncStorage.setItem(BibleDatabase.CROSS_REFS_LOADED_KEY, 'true');
      console.log('🔗 Cross-reference web imported from bundle');
    } catch (error) {
      console.warn(
        '⚠️ Cross-reference seed failed (curated layer still active)',
        error,
      );
    }
  }

  /**
   * Load the bundled Strong's-definitions overlay (complete English + faithful
   * Spanish) into `strongs_defs`. Versioned: re-imports whenever SDEFS_VERSION
   * is bumped (a new translation batch shipped). Graceful — a failure just
   * leaves the originals pack's own (English) definitions doing the work.
   */
  private async seedStrongsDefsIfNeeded(): Promise<void> {
    const db = this.getDb();
    try {
      const loaded = await AsyncStorage.getItem(BibleDatabase.SDEFS_LOADED_KEY);
      if (loaded === String(SDEFS_VERSION)) return;

      const asset = Asset.fromModule(
        require('../../../assets/strongs-defs.db'),
      );
      await asset.downloadAsync();
      const sourceUri = asset.localUri ?? asset.uri;
      if (!sourceUri) return;
      const attachPath = normalizePackPath(sourceUri);

      try {
        await db.execAsync(`DETACH DATABASE ${SDEFS_SCHEMA}`);
      } catch {
        // Not attached — nothing to detach.
      }
      await db.runAsync(`ATTACH DATABASE ? AS ${SDEFS_SCHEMA}`, [attachPath]);
      try {
        await db.withTransactionAsync(async () => {
          await db.runAsync('DELETE FROM strongs_defs');
          await db.runAsync(SDEFS_IMPORT_SQL);
        });
      } finally {
        await db.execAsync(`DETACH DATABASE ${SDEFS_SCHEMA}`);
      }
      await AsyncStorage.setItem(
        BibleDatabase.SDEFS_LOADED_KEY,
        String(SDEFS_VERSION),
      );
      console.log('📖 Strong’s definitions overlay imported from bundle');
    } catch (error) {
      console.warn('⚠️ Strong’s definitions seed failed', error);
    }
  }

  /**
   * Load the bundled v1-factual Bible-dictionary entries (Tanda 5) into
   * `dictionary_entries`. Versioned like seedStrongsDefsIfNeeded (re-imports
   * whenever DICT_V1_VERSION is bumped), but the source is a small JSON
   * array (10 rows) required directly — no Asset.fromModule/download/ATTACH
   * DATABASE, which would be unnecessary machinery for a dataset this size.
   * Graceful: a failure just leaves the table empty; nothing reads from it
   * yet (Tanda 5's UI placement is still an open product decision).
   */
  private async seedDictionaryV1IfNeeded(): Promise<void> {
    const db = this.getDb();
    try {
      const loaded = await AsyncStorage.getItem(
        BibleDatabase.DICT_V1_LOADED_KEY,
      );
      if (loaded === String(DICT_V1_VERSION)) return;

      type SeedEntry = {
        slug: string;
        headwordEs: string;
        glossEs: string;
        articleEs: string;
        sourceTier: string;
        treatment: string;
      };
      // Bundled JSON asset (10 rows) — see scripts/build-dictionary-v1-es.js.
      const entries: SeedEntry[] = require('../../../assets/dictionary-v1-es.json');

      await db.withTransactionAsync(async () => {
        // Scoped to this tier only — a v2 (or future tier) seed re-import
        // must never wipe rows it doesn't own, regardless of which order
        // the seed functions run in.
        await db.runAsync(
          "DELETE FROM dictionary_entries WHERE source_tier = 'v1-factual'",
        );
        for (const e of entries) {
          await db.runAsync(
            `INSERT INTO dictionary_entries
               (slug, headword_es, gloss_es, article_es, source_tier, treatment, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              e.slug,
              e.headwordEs,
              e.glossEs,
              e.articleEs,
              e.sourceTier,
              e.treatment,
              DICT_V1_UPDATED_AT,
            ],
          );
        }
      });

      await AsyncStorage.setItem(
        BibleDatabase.DICT_V1_LOADED_KEY,
        String(DICT_V1_VERSION),
      );
      console.log(
        `📚 Dictionary v1 entries imported from bundle (${entries.length})`,
      );
    } catch (error) {
      console.warn('⚠️ Dictionary v1 seed failed', error);
    }
  }

  /**
   * Load the bundled v2-doctrinal Bible-dictionary entries (Tanda 5) into
   * `dictionary_entries`. Same shape as seedDictionaryV1IfNeeded, versioned
   * and scoped independently so re-importing one tier never touches the
   * other's rows.
   */
  private async seedDictionaryV2IfNeeded(): Promise<void> {
    const db = this.getDb();
    try {
      const loaded = await AsyncStorage.getItem(
        BibleDatabase.DICT_V2_LOADED_KEY,
      );
      if (loaded === String(DICT_V2_VERSION)) return;

      type SeedEntry = {
        slug: string;
        headwordEs: string;
        glossEs: string;
        articleEs: string;
        sourceTier: string;
        treatment: string;
      };
      // Bundled JSON asset — see scripts/build-dictionary-v2-es.js.
      const entries: SeedEntry[] = require('../../../assets/dictionary-v2-es.json');

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "DELETE FROM dictionary_entries WHERE source_tier = 'v2-doctrinal'",
        );
        for (const e of entries) {
          await db.runAsync(
            `INSERT INTO dictionary_entries
               (slug, headword_es, gloss_es, article_es, source_tier, treatment, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              e.slug,
              e.headwordEs,
              e.glossEs,
              e.articleEs,
              e.sourceTier,
              e.treatment,
              DICT_V2_UPDATED_AT,
            ],
          );
        }
      });

      await AsyncStorage.setItem(
        BibleDatabase.DICT_V2_LOADED_KEY,
        String(DICT_V2_VERSION),
      );
      console.log(
        `📚 Dictionary v2 entries imported from bundle (${entries.length})`,
      );
    } catch (error) {
      console.warn('⚠️ Dictionary v2 seed failed', error);
    }
  }

  /**
   * Outgoing cross-references for a verse — the parallels it points TO, from
   * the broad bundled web (RUMBO #3), ranked by community votes. Empty when the
   * web is unavailable; the merge facade layers the curated set on top.
   */
  async getCrossReferencesFromDb(
    bookId: number,
    chapter: number,
    verse: number,
  ): Promise<CrossRefOut[]> {
    await this.initialize();
    return this.getDb().getAllAsync<CrossRefOut>(
      `SELECT to_book, to_chapter, to_verse, to_verse_end, votes
       FROM cross_references
       WHERE from_book = ? AND from_chapter = ? AND from_verse = ?
       ORDER BY votes DESC`,
      [bookId, chapter, verse],
    );
  }

  /**
   * Incoming cross-references for a verse — the verses that point AT it, by
   * querying the `to_*` columns (idx_xref_to). Powers Study mode's "referenced
   * by" side without inverting the whole map in memory.
   */
  async getReferencedByFromDb(
    bookId: number,
    chapter: number,
    verse: number,
  ): Promise<CrossRefIn[]> {
    await this.initialize();
    // A popular verse is the TARGET of many sources (incoming is uncapped in
    // the data, unlike outgoing's top-10), so bound to the strongest by votes.
    return this.getDb().getAllAsync<CrossRefIn>(
      `SELECT from_book, from_chapter, from_verse, votes
       FROM cross_references
       WHERE to_book = ? AND to_chapter = ? AND to_verse = ?
       ORDER BY votes DESC
       LIMIT ${XREF_INCOMING_LIMIT}`,
      [bookId, chapter, verse],
    );
  }

  // ── Original languages (Hebrew/Greek + Strong's) ──────────────────────

  /** Whether the downloaded original-languages pack has been imported. */
  async originalsInstalled(): Promise<boolean> {
    await this.initialize();
    if (
      (await AsyncStorage.getItem(BibleDatabase.ORIGINALS_LOADED_KEY)) ===
      'true'
    ) {
      return true;
    }
    // Flag-less fallback: trust a populated table (e.g. a reinstalled flag).
    const row = await this.getDb().getFirstAsync<{n: number}>(
      'SELECT EXISTS(SELECT 1 FROM original_words LIMIT 1) AS n',
    );
    return (row?.n ?? 0) === 1;
  }

  /**
   * Import a downloaded originals pack (ATTACH + INSERT into original_words +
   * strongs_lexicon, then DETACH). Idempotent: clears the tables first so a
   * re-import (e.g. a newer pack) is clean. Sets the @originals_loaded flag.
   * Returns the number of original words imported.
   */
  async importOriginalsPack(packUri: string): Promise<number> {
    await this.initialize();
    const db = this.getDb();
    const attachPath = normalizePackPath(packUri);

    try {
      await db.execAsync(`DETACH DATABASE ${ORIGINALS_SCHEMA}`);
    } catch {
      // Not attached — nothing to detach.
    }
    await db.runAsync(`ATTACH DATABASE ? AS ${ORIGINALS_SCHEMA}`, [attachPath]);
    let words = 0;
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM original_words');
        await db.runAsync('DELETE FROM strongs_lexicon');
        const result = await db.runAsync(
          `INSERT INTO original_words
             (book_id, chapter, verse, position, lang, word, translit, gloss_en, gloss_es, strongs, grammar)
           SELECT book_id, chapter, verse, position, lang, word, translit, gloss_en, gloss_es, strongs, grammar
           FROM ${ORIGINALS_SCHEMA}.original_words`,
        );
        words = result.changes;
        await db.runAsync(
          `INSERT OR IGNORE INTO strongs_lexicon
             (strongs, lang, lemma, translit, definition, kjv_def)
           SELECT strongs, lang, lemma, translit, definition, kjv_def
           FROM ${ORIGINALS_SCHEMA}.strongs_lexicon`,
        );
      });
    } finally {
      await db.execAsync(`DETACH DATABASE ${ORIGINALS_SCHEMA}`);
    }
    await AsyncStorage.setItem(BibleDatabase.ORIGINALS_LOADED_KEY, 'true');
    console.log(`📜 Imported ${words} original-language words`);
    return words;
  }

  /** The original-language words of a verse, in reading order. */
  async getOriginalWords(
    bookId: number,
    chapter: number,
    verse: number,
  ): Promise<OriginalWord[]> {
    await this.initialize();
    return this.getDb().getAllAsync<OriginalWord>(
      `SELECT position, lang, word, translit, gloss_en, gloss_es, strongs, grammar
       FROM original_words
       WHERE book_id = ? AND chapter = ? AND verse = ?
       ORDER BY position`,
      [bookId, chapter, verse],
    );
  }

  /** A Strong's lexicon entry, or null when not found / not installed. The
   *  bundled overlay (strongs_defs) supplies the COMPLETE English definition
   *  (fixing the pack's truncation) and the faithful Spanish translation. */
  async getStrongsEntry(strongs: string): Promise<StrongsEntry | null> {
    await this.initialize();
    const row = await this.getDb().getFirstAsync<StrongsEntry>(
      `SELECT l.strongs AS strongs, l.lang AS lang, l.lemma AS lemma,
              l.translit AS translit,
              COALESCE(d.definition_en, l.definition) AS definition,
              d.definition_es AS definition_es,
              l.kjv_def AS kjv_def
       FROM strongs_lexicon l
       LEFT JOIN strongs_defs d ON d.strongs = l.strongs
       WHERE l.strongs = ?`,
      [strongs.trim()],
    );
    return row ?? null;
  }

  /**
   * Occurrences of a Strong's number across the text (the concordance), in
   * canonical order, bounded by `limit`. Powers "every other place it appears".
   */
  async getStrongsOccurrences(
    strongs: string,
    limit = 200,
  ): Promise<StrongsOccurrence[]> {
    await this.initialize();
    return this.getDb().getAllAsync<StrongsOccurrence>(
      `SELECT book_id, chapter, verse, word
       FROM original_words
       WHERE strongs = ?
       ORDER BY book_id, chapter, verse, position
       LIMIT ?`,
      [strongs.trim(), limit],
    );
  }

  /**
   * Occurrences of a Strong's number within ONE book, in that book's reading
   * order (chapter/verse/position) — NOT narrowed from the global, canonically-
   * ordered `getStrongsOccurrences` list. That method's `LIMIT` applies before
   * any book filter exists, so a book that sorts late (e.g. Hechos, after
   * Mateo+Lucas already fill the cap for a common word) can be entirely
   * starved out of the capped array even though it truly has occurrences —
   * this method's `WHERE book_id = ?` scopes the cap to just that book, so it
   * can never be crowded out by earlier books. Powers the word-study
   * distribution bars' tap-to-filter (Ficha #14).
   *
   * `limit` deliberately mirrors this file's other concordance cap
   * (`getStrongsOccurrences`'s default 200) rather than trying to be "high
   * enough to never truncate" — a handful of extremely frequent function
   * words (e.g. the Greek article, ~2,000+ occurrences in a single long
   * book) CAN exceed it. That's an acceptable, DISCLOSED tradeoff rather than
   * a silent one: the word-study screen compares the fetched count against
   * the uncapped per-book total from `getStrongsBookDistribution` and shows
   * a "showing the first N" note when this cap is hit, exactly like the
   * existing unfiltered view already does — so raising this value further
   * would only trade a few honestly-disclosed rows for a much larger
   * (unvirtualized ScrollView) render on the rare word that hits it.
   */
  async getStrongsOccurrencesByBook(
    strongs: string,
    bookId: number,
    limit = 500,
  ): Promise<StrongsOccurrence[]> {
    await this.initialize();
    return this.getDb().getAllAsync<StrongsOccurrence>(
      `SELECT book_id, chapter, verse, word
       FROM original_words
       WHERE strongs = ? AND book_id = ?
       ORDER BY chapter, verse, position
       LIMIT ?`,
      [strongs.trim(), bookId, limit],
    );
  }

  /** Total occurrence count of a Strong's number (for the concordance header). */
  async getStrongsOccurrenceCount(strongs: string): Promise<number> {
    await this.initialize();
    const row = await this.getDb().getFirstAsync<{n: number}>(
      'SELECT COUNT(*) AS n FROM original_words WHERE strongs = ?',
      [strongs.trim()],
    );
    return row?.n ?? 0;
  }

  /**
   * Per-book occurrence counts of a Strong's number, in canonical book order.
   * Powers the word-study distribution-by-book chart.
   */
  async getStrongsBookDistribution(
    strongs: string,
  ): Promise<StrongsBookCount[]> {
    await this.initialize();
    return this.getDb().getAllAsync<StrongsBookCount>(
      `SELECT book_id, COUNT(*) AS count
       FROM original_words
       WHERE strongs = ?
       GROUP BY book_id
       ORDER BY book_id`,
      [strongs.trim()],
    );
  }

  /**
   * The first and last occurrence of a Strong's number in canonical order
   * (for the word-study "first/last appearance" rows). Null when not present.
   */
  async getStrongsExtent(strongs: string): Promise<{
    first: StrongsOccurrence | null;
    last: StrongsOccurrence | null;
  }> {
    await this.initialize();
    const key = strongs.trim();
    const [first, last] = await Promise.all([
      this.getDb().getFirstAsync<StrongsOccurrence>(
        `SELECT book_id, chapter, verse, word
         FROM original_words WHERE strongs = ?
         ORDER BY book_id, chapter, verse, position LIMIT 1`,
        [key],
      ),
      this.getDb().getFirstAsync<StrongsOccurrence>(
        `SELECT book_id, chapter, verse, word
         FROM original_words WHERE strongs = ?
         ORDER BY book_id DESC, chapter DESC, verse DESC, position DESC LIMIT 1`,
        [key],
      ),
    ]);
    return {first: first ?? null, last: last ?? null};
  }

  // ── Bible dictionary (Tanda 5) ─────────────────────────────────────────

  /**
   * A single Bible-dictionary entry by slug, or null when not found / the
   * bundled batch hasn't been seeded yet. Mirrors getStrongsEntry's shape.
   */
  async getDictionaryEntry(slug: string): Promise<DictionaryEntry | null> {
    await this.initialize();
    const row = await this.getDb().getFirstAsync<DictionaryEntry>(
      `SELECT slug, headword_es, gloss_es, article_es, source_tier, treatment, updated_at
       FROM dictionary_entries
       WHERE slug = ?`,
      [slug.trim()],
    );
    return row ?? null;
  }

  /**
   * All Bible-dictionary entries' browse-list fields (no `article_es` — the
   * list screen never renders the premium body, only the free gloss).
   */
  async getAllDictionaryEntries(): Promise<
    Pick<DictionaryEntry, 'slug' | 'headword_es' | 'gloss_es'>[]
  > {
    await this.initialize();
    return this.getDb().getAllAsync<
      Pick<DictionaryEntry, 'slug' | 'headword_es' | 'gloss_es'>
    >('SELECT slug, headword_es, gloss_es FROM dictionary_entries');
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
      // For SELECT, use expo-sqlite's ATOMIC getAllAsync for both the
      // param'd and bare cases. The previous manual
      // prepareAsync → executeAsync → getAllAsync → finalizeAsync dance is a
      // multi-step sequence that is NOT covered by expo-sqlite's
      // per-database serialization, so when two of them interleave (e.g.
      // the Promise.all reads on the achievements/Home load) the native
      // handle is corrupted mid-flight — surfacing the intermittent
      // "argument cannot be cast to NativeDatabase/NativeStatement
      // (received Integer)" errors (caught downstream, but noisy in the
      // LogBox). getAllAsync(sql, params) performs the whole
      // prepare/bind/read/finalize as one serialized operation.
      try {
        const rows =
          sanitizedParams && sanitizedParams.length > 0
            ? await db.getAllAsync(sql, sanitizedParams)
            : await db.getAllAsync(sql);
        return {
          rows: {
            _array: rows,
            length: rows.length,
          },
        };
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

  /**
   * Import a downloaded translation pack as a new Bible version (translation
   * packs, phase 3). The pack is a standalone SQLite file with a single
   * `verses(book_id, book_name, chapter, verse, text)` table (no `version`
   * column, no FTS).
   *
   * Additive + idempotent: ATTACH the pack, `INSERT OR IGNORE` its rows tagged
   * with `versionId` — the `verses_ai` trigger indexes each newly inserted row
   * into `verses_fts` on THIS device (so search works), and the
   * `UNIQUE(book_id, chapter, verse, version)` constraint makes a re-import a
   * no-op. Returns the number of verses actually inserted (0 on a re-import).
   *
   * ATTACH/DETACH run OUTSIDE the transaction (SQLite forbids ATTACH within
   * one); only the main DB is written, so the cross-database transaction is
   * atomic even with WAL on the main DB. On success the
   * `@bible_data_loaded_<id>` flag is set so a relaunch's JS bulk-loader
   * short-circuits. The CALLER refreshes the version registry afterwards
   * (`BibleVersionContext.refreshInstalledVersions`) so the picker offers the
   * new version.
   */
  async importVersionPack(packUri: string, versionId: string): Promise<number> {
    const id = versionId.trim();
    if (!id) {
      throw new Error('importVersionPack: versionId is required');
    }

    await this.initialize();
    const db = this.getDb();
    const path = normalizePackPath(packUri);

    // Defensively clear any stale attachment left by a prior failed import on
    // this long-lived connection (SQLite errors if `pack` is already in use).
    try {
      await db.execAsync(`DETACH DATABASE ${PACK_SCHEMA}`);
    } catch {
      // Not attached — nothing to detach.
    }

    await db.runAsync(`ATTACH DATABASE ? AS ${PACK_SCHEMA}`, [path]);
    let inserted = 0;
    try {
      await db.withTransactionAsync(async () => {
        const result = await db.runAsync(PACK_IMPORT_SQL, [id]);
        inserted = result.changes;
      });
    } finally {
      await db.execAsync(`DETACH DATABASE ${PACK_SCHEMA}`);
    }

    await AsyncStorage.setItem(packLoadedKey(id), 'true');
    console.log(`📦 Imported ${inserted} verses for version "${id}"`);
    return inserted;
  }

  /**
   * Remove a downloaded translation pack's verses (translation packs, phase 4).
   * `DELETE FROM verses WHERE version = ?` fires the `verses_ad` trigger so the
   * matching `verses_fts` rows are removed too, then clears the
   * `@bible_data_loaded_<id>` flag. Case-insensitive to match how versions are
   * compared elsewhere. Returns the number of verses removed. The CALLER
   * refreshes the version registry afterwards so the picker drops it.
   *
   * Guard: refuses to delete a BUNDLED version — those live in the seed and
   * can't be re-downloaded, so wiping them would strand the user.
   */
  async deleteVersion(versionId: string): Promise<number> {
    const id = versionId.trim();
    if (!id) {
      throw new Error('deleteVersion: versionId is required');
    }
    if (
      BIBLE_VERSIONS.some(
        v => v.bundled && v.id.toLowerCase() === id.toLowerCase(),
      )
    ) {
      throw new Error(
        `deleteVersion: "${id}" is bundled and cannot be removed`,
      );
    }

    await this.initialize();
    const db = this.getDb();
    let removed = 0;
    await db.withTransactionAsync(async () => {
      const result = await db.runAsync(
        'DELETE FROM verses WHERE version = ? COLLATE NOCASE',
        [id],
      );
      removed = result.changes;
    });

    await AsyncStorage.removeItem(packLoadedKey(id));
    console.log(`🗑️ Removed ${removed} verses for version "${id}"`);
    return removed;
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
