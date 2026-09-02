/* eslint-disable no-console -- DB layer dev-mode init/progress logging.
   Will migrate to logger.* in Sprint 41 alongside Crashlytics wiring. */
import * as SQLite from 'expo-sqlite';
import {Platform} from 'react-native';
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
import {
  resolveBibleSeedDbAsset,
  resolveCrossReferencesDbAsset,
  resolveStrongsDefsDbAsset,
} from './nativeSeedAssets';
import {sanitizeFtsQuery} from '../search/sanitizeFtsQuery';

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
 * itself; `article_es` is the premium full translated article — `null` for
 * a `multi-view` treatment (batch 3: Bautismo, Milenio), where the premium
 * content instead lives in `dictionary_multiview_sections` (see
 * `DictionaryMultiviewSection` below), keyed by `slug`.
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

/**
 * One labeled section of a `treatment === 'multi-view'` dictionary entry
 * (e.g. one signed doctrinal tradition's take on Bautismo, or one
 * eschatological posture on Milenio). Rendered in `position` order; all
 * sections sit behind the same premium gate as `article_es` would for a
 * single-article entry.
 */
export interface DictionaryMultiviewSection {
  slug: string;
  position: number;
  label_es: string;
  body_es: string;
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
const DICT_V1_VERSION = 2;

/**
 * `updated_at` stamped on every row seeded by seedDictionaryV1IfNeeded: the
 * date this v1-factual batch was translated (per the source files' own
 * "Fecha:" notes), not the device's local seed time — the content itself
 * didn't change since then, only where it's stored.
 */
const DICT_V1_UPDATED_AT = '2026-07-18';

/**
 * Version of the bundled v2-doctrinal dictionary entries (Tanda 5, see
 * seedDictionaryV2IfNeeded). Bump whenever the JSON asset's entry set grows
 * or changes so the app re-imports it on the next launch. v1 = batch 1
 * (Expiación, Sábado, Creación, Tabernáculo); v2 = batch 2, same day (+
 * Reino de Dios, Predestinación, Espíritu Santo, Salvación); v3 = batch 3
 * (Bautismo, Milenio — `treatment: 'multi-view'`, `article_es: null`,
 * content in `dictionary_multiview_sections`); v4 = batch 4 (Comunión —
 * also `treatment: 'multi-view'`, entirely freshly-authored, not
 * ISBE-derived; 6 sections: Conmemorativa, Reformada, Luterana, Católica
 * romana, Ortodoxa, Diferencias de práctica); v5 = corrected 2 undisclosed
 * chapter-digit typos in Bible citations (Expiación's "Nm 36:33"->"Nm
 * 35:33", Tabernáculo's "Éx 26:40"->"Éx 25:40"), no new entries; v6 =
 * corrected the disclosed "Gá 6:19"->"Gá 5:19" digit errata in Espíritu
 * Santo's article (Victor approved promoting it from Pattern B to the
 * dominant Pattern A house style), no new entries; v7 = corrected
 * Expiación's "Lv 5:26"->"Lv 5:2" (the 1915 ISBE original used half-verse
 * notation "Lev 5 2b", misread/transcribed as digit "6"), no new entries;
 * v8 = batch 5 (Elección — Calvinism/Arminianism, also `treatment:
 * 'multi-view'`, entirely freshly-authored, not ISBE-derived; 4 sections:
 * El debate, Arminiana y wesleyana, Reformada (calvinista), Lo que
 * confiesan juntas); v9 = batch 6 (Seguridad de la salvación — eternal
 * security/perseverance of the saints, also `treatment: 'multi-view'`,
 * entirely freshly-authored, not ISBE-derived; 4 sections: El debate,
 * Arminiana y wesleyana, Reformada (calvinista), Lo que confiesan juntas).
 */
const DICT_V2_VERSION = 9;

/**
 * Version of the bundled WEB reading-version text (see seedWebTextIfNeeded).
 * v1 = the original getbible.net-sourced text (Sprint 66). v2 = re-ingested
 * from eBible.org's own engwebp USFM distribution — a DIFFERENT WEB revision
 * (v1 turned out not to match any current eBible.org edition, discovered
 * while building words-of-Christ red-letter highlighting, which needs its
 * \wj spans and the verse text to come from the same source). Bump this
 * whenever bible-data-web.ts is regenerated so already-installed devices —
 * which only ever seed WEB text ONCE, on first launch — re-import the new
 * text instead of silently keeping the old wording forever.
 */
const WEB_TEXT_VERSION = 2;

/**
 * Storage key for {@link WEB_TEXT_VERSION}. A plain module-level constant
 * (not a `BibleDatabase` static like its siblings) because it's also read by
 * `seedFromBundleIfMissing`, a standalone function outside the class.
 */
const WEB_TEXT_LOADED_KEY = '@web_text_version';

/** `updated_at` stamped on every row seeded by seedDictionaryV2IfNeeded. */
const DICT_V2_UPDATED_AT = '2026-07-21';

/**
 * Version of the bundled Hebrew Spanish-gloss overlay (Tanda 10, Fase 1 —
 * see seedHebrewGlossEsIfNeeded). TAHOT (the Hebrew source original_words is
 * built from) carries no Spanish gloss column at all, unlike TAGNT (Greek) —
 * `scripts/build-originals-pack.js` writes NULL for every Hebrew row's
 * gloss_es today (`w.glossEs || null`), though an already-deployed pack
 * built before that normalization existed may carry '' instead — either
 * way there's no real Spanish value to read. This small hand-curated,
 * PER-OCCURRENCE overlay (book_id, chapter, verse, position) supplies the
 * faithful Spanish gloss
 * for specific reviewed Hebrew word occurrences only — never app-wide by
 * Strong's number, which would silently apply one gloss to every occurrence
 * of that word regardless of context. Bump this whenever the bundled JSON
 * asset's row set grows or a gloss is corrected, same idea as DICT_V1_VERSION.
 * v1 = Fase 1 scaffolding (Psa 136:1, Psa 3:2, Deu 27:15, Psa 23:1), every
 * row shipped EMPTY pending review. v2 = Claude's first-pass Spanish
 * translation of each row's already-verified `gloss_en`, added directly at
 * Victor's request — still worth his own skim before this is treated as
 * final, same spirit as the commentary entries' explicit "Victor reviewed
 * and approved" mark, but no longer a placeholder. `seedHebrewGlossEsIfNeeded`
 * still skips any row whose gloss is empty/whitespace, so a future row added
 * without translation stays honestly excluded rather than seeding a blank.
 * v3 = A4-chico positional-overlay batch (60th session): 573 new rows for
 * the non-dominant TBESH senses of 27 genuinely-polysemous Hebrew lemmas
 * (e.g. H4853 massa "burden"/"oracle", H2691 chatser "court"/"village"),
 * built by `scripts/build-hebrew-gloss-es-v2.js` from two independently
 * verified sources: mechanical (book,chapter,verse,position) keys generated
 * from raw TAHOT, and hand-cited Spanish translations cross-checked against
 * `bible-seed.db`. FREE tier (Victor's explicit call — this overlay already
 * fed the free per-verse word list with no premium gate, and disambiguation
 * is a quality fix, not new premium content). Known limitation: because
 * overrides only ever target the NON-dominant sense, lemmas where A3's own
 * base-lemma default already picked the wrong (non-dominant) sense are only
 * partially improved by this batch -- the majority-occurrence experience for
 * those lemmas still needs a separate fix to `hebrew-lemma-gloss-es.json`
 * itself (tracked, not done here).
 */
const HEBREW_GLOSS_ES_VERSION = 3;

/**
 * Version of the bundled Hebrew PER-LEMMA Spanish-gloss overlay (A3 —
 * `feature/hebrew-lemma-gloss-es`). A companion to
 * {@link HEBREW_GLOSS_ES_VERSION}: where `hebrew_gloss_es` carries a
 * hand-curated gloss for 37 SPECIFIC word occurrences, this table
 * (`hebrew_lemma_gloss_es`) carries a first-pass Spanish gloss keyed by
 * base Strong's number for ALL ~8,503 Hebrew lemmas the OT actually uses,
 * so the inline word list stops rendering English `gloss_en` for the ~99%
 * of Hebrew words that had no per-occurrence curation. Sourced from the
 * bundled `assets/hebrew-lemma-gloss-es.json` (flat `{ "H7225": "principio",
 * … }`, produced by `scripts/build-hebrew-lemma-gloss-es.js` from STEPBible
 * TBESH's `Gloss` column + the vetted `scripts/strongs-defs-es.json`).
 * Ranks BELOW both the pack's own gloss_es (Greek) and the per-occurrence
 * `hebrew_gloss_es` overlay in getOriginalWords' COALESCE — it is only the
 * fallback default. Bump whenever the bundled JSON changes.
 *
 * v2 = review pass over the 185 flagged items in
 * `DOCS/drafts/hebrew-lemma-gloss-es-REVIEW.md`, approved by Victor (7
 * glosses proposed and verified against `bible-seed.db`/
 * `strongs-defs-es.json`: H1148, H1486, H1692, H2313, H2803, H5315, H7703).
 * v3 = base-gloss corrections (60th session, approved by Victor): 6 lemmas
 * where the shipped default reflected a non-dominant TBESH sense instead of
 * the numerically-dominant one, found while building the A4-chico
 * positional-overlay batch (which can only correct minority-sense
 * occurrences, never the dominant-sense default itself — see
 * HEBREW_GLOSS_ES_VERSION v3's own note). H2563 chomer "burbujeo" was the
 * worst case, matching none of its 3 attested senses at all. H6862, H2790,
 * H5035, H6743, H8577 corrected the same way, each verified against real
 * TAHOT occurrence counts.
 */
const HEBREW_LEMMA_GLOSS_ES_VERSION = 3;

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

    const sourceUri = await resolveBibleSeedDbAsset();
    if (!sourceUri) return false;

    if (!sqliteDir.exists) sqliteDir.create({intermediates: true});
    const sourceFile = new File(sourceUri);
    await sourceFile.copy(targetFile);
    // The JS bulk loader keys "this version is loaded" off AsyncStorage; mark
    // the two BUNDLED versions (RVR1960 + WEB) as loaded so it short-circuits
    // instead of redundantly re-iterating 62k rows just to hit the UNIQUE
    // constraint. KJV/BSB are downloadable packs — their flags get set by
    // importVersionPack, not here. Also stamp the WEB text version so a fresh
    // install — which just got the CURRENT text via this fast asset copy —
    // doesn't immediately redo the work via the separate versioned re-seed
    // below (that path exists for devices that seeded BEFORE this version).
    await Promise.all([
      AsyncStorage.setItem('@bible_data_loaded_rvr1960', 'true'),
      AsyncStorage.setItem('@bible_data_loaded_web', 'true'),
      AsyncStorage.setItem(WEB_TEXT_LOADED_KEY, String(WEB_TEXT_VERSION)),
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
  // Imported VERSION of the bundled Hebrew Spanish-gloss overlay (Tanda 10).
  private static readonly HEBREW_GLOSS_ES_LOADED_KEY =
    '@hebrew_gloss_es_loaded_version';
  // Imported VERSION of the bundled Hebrew per-lemma Spanish-gloss overlay (A3).
  private static readonly HEBREW_LEMMA_GLOSS_ES_LOADED_KEY =
    '@hebrew_lemma_gloss_es_loaded_version';

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
      await this.configureRecursiveTriggers();

      await this.createSchema();

      // Populate the cross-reference web from the bundled asset on first run
      // (fresh installs AND existing ones — the seed copy never carried it).
      // Graceful: a failure just leaves the curated layer doing the work.
      await this.seedCrossReferencesIfMissing();
      await this.seedStrongsDefsIfNeeded();
      await this.seedHebrewGlossEsIfNeeded();
      await this.seedHebrewLemmaGlossEsIfNeeded();
      await this.seedDictionaryV1IfNeeded();
      await this.seedDictionaryV2IfNeeded();
      await this.seedWebTextIfNeeded();

      this.initialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }

  /**
   * SQLite defaults `recursive_triggers` to OFF, which per SQLite's own docs
   * ("When the REPLACE conflict resolution strategy deletes rows in order to
   * satisfy a constraint, delete triggers fire if and only if recursive
   * triggers are enabled" — sqlite.org/lang_conflict.html) means the
   * `verses_ad` AFTER DELETE trigger (see {@link createSchema}) would NOT
   * fire for the implicit delete inside `INSERT OR REPLACE INTO verses`
   * (used by {@link insertVerses} to re-seed, e.g. `seedWebTextIfNeeded`'s
   * WEB_TEXT_VERSION bumps).
   *
   * Confirmed by direct repro against a faithful schema copy (real SQLite,
   * not this app's code): with this pragma left OFF, replacing an existing
   * verse row leaves its old `verses_fts` index entries orphaned — the
   * replaced row gets a NEW autoincrement id (REPLACE deletes-then-inserts;
   * `verses.id` is `INTEGER PRIMARY KEY AUTOINCREMENT` and the insert doesn't
   * specify `id`), so the OLD id's postings are never cleaned up. The shadow
   * FTS index then grows unboundedly across re-seeds, and any FTS5 query
   * that doesn't defensively re-join back to `verses` (e.g. snippet()/
   * highlight(), or a bare `SELECT ... FROM verses_fts`) can raise a hard
   * `fts5: missing row N from content table 'main'.'verses'` error — the
   * app's own `searchVerses`/`searchByBook` happen to always INNER JOIN back
   * to `verses`, which silently filters orphaned rowids out of results
   * instead of crashing, but the index bloat and any future non-joined FTS5
   * query remain real risks.
   *
   * Turning this on makes `verses_ad` fire normally on REPLACE, keeping
   * `verses_fts` exactly in sync — safe globally: `verses_ai/ad/au` are the
   * ONLY triggers this app defines, and none of them write back to `verses`
   * itself, so there is no risk of unwanted trigger recursion elsewhere.
   * Extracted to its own method (called from `_performInitialization` right
   * after opening the connection) so it's unit-testable in isolation — see
   * `__tests__/versesFtsRecursiveTriggers.test.ts`.
   */
  private async configureRecursiveTriggers(): Promise<void> {
    await this.getDb().execAsync('PRAGMA recursive_triggers = ON;');
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

    // Bundled Hebrew Spanish-gloss overlay (Tanda 10, Fase 1). TAHOT (the
    // Hebrew source) carries no Spanish gloss at all, unlike TAGNT (Greek);
    // this small hand-curated, PER-OCCURRENCE table (keyed by the exact word
    // occurrence, not by Strong's number) supplies the faithful Spanish
    // gloss for specific reviewed rows only. Populated from the bundled
    // `hebrew-gloss-es-v1.json` asset (see seedHebrewGlossEsIfNeeded);
    // overlays original_words.gloss_es at read time in getOriginalWords,
    // same LEFT JOIN + COALESCE shape as strongs_defs overlays strongs_lexicon.
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS hebrew_gloss_es (
        book_id INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        position INTEGER NOT NULL,
        gloss_es TEXT NOT NULL,
        PRIMARY KEY (book_id, chapter, verse, position)
      )
    `);

    // Bundled Hebrew PER-LEMMA Spanish-gloss overlay (A3). Unlike
    // hebrew_gloss_es above (37 hand-curated per-occurrence rows), this is a
    // first-pass Spanish gloss keyed by base Strong's number for EVERY Hebrew
    // lemma the OT uses (~8,503), so the inline word list stops showing English
    // gloss_en for un-curated Hebrew words. Populated from the bundled
    // `hebrew-lemma-gloss-es.json` asset (see seedHebrewLemmaGlossEsIfNeeded);
    // overlays original_words.gloss_es at read time in getOriginalWords as the
    // LOWEST-priority COALESCE tier (below the pack's gloss_es and the
    // per-occurrence hebrew_gloss_es overlay).
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS hebrew_lemma_gloss_es (
        strongs TEXT PRIMARY KEY,
        gloss_es TEXT NOT NULL
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

    // Labeled multi-view sections for `dictionary_entries` rows whose
    // `treatment` is `'multi-view'` (Tanda 5, batch 3: Bautismo, Milenio).
    // `article_es` is NULL for those rows; the premium content lives here
    // instead, one row per signed tradition/posture, in `position` order.
    // Populated by seedDictionaryV2IfNeeded (sole writer — see its own
    // comment for why an unconditional DELETE there is safe).
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS dictionary_multiview_sections (
        slug TEXT,
        position INTEGER,
        label_es TEXT,
        body_es TEXT,
        PRIMARY KEY (slug, position)
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
      const sourceUri = await resolveCrossReferencesDbAsset();
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

      const sourceUri = await resolveStrongsDefsDbAsset();
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
   * Load the bundled Hebrew Spanish-gloss overlay (Tanda 10, Fase 1) into
   * `hebrew_gloss_es`. Versioned like seedStrongsDefsIfNeeded (re-imports
   * whenever HEBREW_GLOSS_ES_VERSION is bumped), sourced from a small JSON
   * array required directly — same "small-JSON seed" shape as
   * seedDictionaryV1IfNeeded, not the heavier ATTACH-DATABASE overlay
   * machinery strongs_defs/original_words use, because this dataset is a
   * few dozen hand-curated rows, not a downloadable pack.
   *
   * Rows whose `glossEs` is still empty/whitespace are SKIPPED, not inserted
   * as blanks — protects any future un-translated row added to the JSON
   * from seeding a blank, even though v2's 37 rows are all filled in.
   * Graceful: a failure just leaves getOriginalWords falling back to the
   * pack's own gloss_es (which, for Hebrew rows, means no Spanish gloss
   * shows — the pre-existing state).
   */
  private async seedHebrewGlossEsIfNeeded(): Promise<void> {
    const db = this.getDb();
    try {
      const loaded = await AsyncStorage.getItem(
        BibleDatabase.HEBREW_GLOSS_ES_LOADED_KEY,
      );
      if (loaded === String(HEBREW_GLOSS_ES_VERSION)) return;

      type SeedEntry = {
        bookId: number;
        chapter: number;
        verse: number;
        position: number;
        glossEs: string;
      };
      // Bundled JSON asset (Fase 1: ~37 rows across 4 verses) — see
      // scripts/build-originals-pack.js's TAHOT row-parsing regex, reused by
      // the one-off extraction that produced this review-sheet data.
      const entries: SeedEntry[] = require('../../../assets/hebrew-gloss-es-v1.json');

      let inserted = 0;
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM hebrew_gloss_es');
        for (const e of entries) {
          const gloss = (e.glossEs ?? '').trim();
          if (!gloss) continue; // pending Victor's review — skip, don't seed a blank
          await db.runAsync(
            `INSERT INTO hebrew_gloss_es
               (book_id, chapter, verse, position, gloss_es)
             VALUES (?, ?, ?, ?, ?)`,
            [e.bookId, e.chapter, e.verse, e.position, gloss],
          );
          inserted++;
        }
      });

      await AsyncStorage.setItem(
        BibleDatabase.HEBREW_GLOSS_ES_LOADED_KEY,
        String(HEBREW_GLOSS_ES_VERSION),
      );
      console.log(`📜 Hebrew Spanish-gloss overlay imported (${inserted})`);
    } catch (error) {
      console.warn('⚠️ Hebrew Spanish-gloss overlay seed failed', error);
    }
  }

  /**
   * Load the bundled Hebrew PER-LEMMA Spanish-gloss overlay (A3) into
   * `hebrew_lemma_gloss_es`. Same shape as {@link seedHebrewGlossEsIfNeeded}
   * (versioned via AsyncStorage, DELETE-then-INSERT in one transaction,
   * empty/whitespace rows skipped, failures degrade silently) — the only
   * differences are the source (a flat `{ strongs: gloss }` object, not an
   * array of per-occurrence rows) and the target table (keyed by Strong's).
   *
   * This supplies the LOWEST-priority Spanish gloss tier: getOriginalWords'
   * COALESCE prefers the pack's own gloss_es (Greek) and then the
   * per-occurrence `hebrew_gloss_es` overlay before falling back to this
   * per-lemma default, so a curated occurrence gloss always outranks it.
   *
   * ~8,500 rows is ~10× seedHebrewGlossEsIfNeeded, so the INSERTs go in
   * multi-row `VALUES` batches (not one bridge round-trip per row) to keep
   * this off the first-launch critical path — same skip-empty and
   * graceful-failure semantics, just fewer `runAsync` calls.
   */
  private async seedHebrewLemmaGlossEsIfNeeded(): Promise<void> {
    const db = this.getDb();
    try {
      const loaded = await AsyncStorage.getItem(
        BibleDatabase.HEBREW_LEMMA_GLOSS_ES_LOADED_KEY,
      );
      if (loaded === String(HEBREW_LEMMA_GLOSS_ES_VERSION)) return;

      // Bundled JSON asset: flat { "H7225": "principio", … }, all ~8,503 used
      // OT Hebrew lemmas — produced by scripts/build-hebrew-lemma-gloss-es.js
      // from STEPBible TBESH's `Gloss` column + scripts/strongs-defs-es.json.
      const entries: Record<
        string,
        string
      > = require('../../../assets/hebrew-lemma-gloss-es.json');

      const pairs: [string, string][] = [];
      for (const [strongs, rawGloss] of Object.entries(entries)) {
        const gloss = (rawGloss ?? '').trim();
        if (!strongs || !gloss) continue; // never seed a blank
        pairs.push([strongs, gloss]);
      }

      const BATCH = 400; // 800 bound params/statement — well under SQLite's limit
      let inserted = 0;
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM hebrew_lemma_gloss_es');
        for (let i = 0; i < pairs.length; i += BATCH) {
          const chunk = pairs.slice(i, i + BATCH);
          const placeholders = chunk.map(() => '(?, ?)').join(', ');
          await db.runAsync(
            `INSERT OR REPLACE INTO hebrew_lemma_gloss_es (strongs, gloss_es)
             VALUES ${placeholders}`,
            chunk.flat(),
          );
          inserted += chunk.length;
        }
      });

      await AsyncStorage.setItem(
        BibleDatabase.HEBREW_LEMMA_GLOSS_ES_LOADED_KEY,
        String(HEBREW_LEMMA_GLOSS_ES_VERSION),
      );
      console.log(
        `📜 Hebrew per-lemma Spanish-gloss overlay imported (${inserted})`,
      );
    } catch (error) {
      console.warn(
        '⚠️ Hebrew per-lemma Spanish-gloss overlay seed failed',
        error,
      );
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
   *
   * Batch 3 (Bautismo, Milenio) added `treatment: 'multi-view'` rows: their
   * `articleEs` is `null` and their premium content instead ships as a
   * `sections` array, inserted into `dictionary_multiview_sections`. Batches
   * 4 (Comunión) and 5 (Elección) each added another multi-view entry the
   * same way — freshly-authored, not ISBE-derived, same shape. That table
   * has no `source_tier` column
   * (only v2-doctrinal entries use multi-view today) so its DELETE below is
   * unconditional — safe only because this function is that table's sole
   * writer; if a future tier ever writes multi-view rows too, scope this the
   * same way the `dictionary_entries` DELETE already is.
   */
  private async seedDictionaryV2IfNeeded(): Promise<void> {
    const db = this.getDb();
    try {
      const loaded = await AsyncStorage.getItem(
        BibleDatabase.DICT_V2_LOADED_KEY,
      );
      if (loaded === String(DICT_V2_VERSION)) return;

      type SeedSection = {position: number; labelEs: string; bodyEs: string};
      type SeedEntry = {
        slug: string;
        headwordEs: string;
        glossEs: string;
        articleEs: string | null;
        sourceTier: string;
        treatment: string;
        sections?: SeedSection[];
      };
      // Bundled JSON asset — see scripts/build-dictionary-v2-es.js.
      const entries: SeedEntry[] = require('../../../assets/dictionary-v2-es.json');

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          "DELETE FROM dictionary_entries WHERE source_tier = 'v2-doctrinal'",
        );
        await db.runAsync('DELETE FROM dictionary_multiview_sections');
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
          for (const s of e.sections ?? []) {
            await db.runAsync(
              `INSERT INTO dictionary_multiview_sections
                 (slug, position, label_es, body_es)
               VALUES (?, ?, ?, ?)`,
              [e.slug, s.position, s.labelEs, s.bodyEs],
            );
          }
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
   * Re-seed the WEB reading version's text when `bible-data-web.ts` has been
   * regenerated (WEB_TEXT_VERSION bumped) since this device last loaded it.
   * WEB otherwise only ever loads ONCE (see BUNDLE_DATA_STRATEGY.md) — a
   * fresh install gets the current text via the fast `bible-seed.db` asset
   * copy (which stamps this same version key, see seedFromBundleIfMissing),
   * but a device that already seeded under an OLDER version would keep that
   * stale text forever without this explicit check. `insertVerses` already
   * does `INSERT OR REPLACE` keyed on `(book_id, chapter, verse, version)`,
   * so simply re-running it overwrites every existing WEB row with the fresh
   * text — no separate DELETE needed, and the FTS index self-updates via the
   * verses_ai/au/ad triggers (this relies on `recursive_triggers` being ON —
   * see {@link configureRecursiveTriggers} for why it's required for
   * `verses_ad` to fire on REPLACE's implicit delete; without it this
   * re-seed path orphans the old rows' `verses_fts` entries instead of
   * cleaning them up).
   *
   * NATIVE ONLY. Bug found post-hoc: `seedFromBundleIfMissing()` always
   * throws on web (no expo-file-system there) and its catch just logs +
   * returns false, so `WEB_TEXT_LOADED_KEY` was never getting stamped on
   * web — meaning every fresh browser fell through to the `import
   * ('./bible-data-web')` below, pulling the whole ~6 MB in-repo WEB_DATA
   * array into the web JS bundle AND executing a redundant full re-seed
   * before data-loader.web.ts's importWebPack() (the actual web data owner,
   * a small SQLite pack fetch) even got a chance to run — directly
   * contradicting the "web starts empty, fetches small packs" design (T19
   * §3.1a / data-loader.web.ts's header doc). The `Platform.OS !== 'web'`
   * guard below is written around the dynamic import itself (not an
   * early-return before it) so Metro's web build can prove it statically
   * unreachable and drop the bible-data-web.ts chunk from the bundle graph
   * entirely, rather than just leaving it unfetched in dist/.
   */
  private async seedWebTextIfNeeded(): Promise<void> {
    if (Platform.OS !== 'web') {
      try {
        const loaded = await AsyncStorage.getItem(WEB_TEXT_LOADED_KEY);
        if (loaded === String(WEB_TEXT_VERSION)) return;

        const {WEB_DATA} = await import('./bible-data-web');
        // Same dual book_id/book_name shape insertVerses already accepts from
        // the JS bulk loader (data-loader.ts) — its declared Omit<BibleVerse,
        // 'id'>[] param predates that shape and doesn't structurally cover it.
        // Timed (see insertVerses' batched-INSERT doc) so a future device
        // test can confirm the fix against the historical ~100s row-by-row
        // baseline (commit 32fceb4) without needing a profiler attached.
        const startedAt = Date.now();
        await this.insertVerses(
          WEB_DATA as unknown as Omit<BibleVerse, 'id'>[],
        );
        const elapsedMs = Date.now() - startedAt;

        await AsyncStorage.setItem(
          WEB_TEXT_LOADED_KEY,
          String(WEB_TEXT_VERSION),
        );
        console.log(
          `📖 WEB reading-version text re-seeded from bundle (${WEB_DATA.length} verses) in ${elapsedMs}ms`,
        );
      } catch (error) {
        console.warn('⚠️ WEB text re-seed failed', error);
      }
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
      // The pack's own gloss_es carries no real value for any Hebrew row
      // (TAHOT has no Spanish gloss column at all) — NULL today per
      // build-originals-pack.js (`w.glossEs || null`), possibly '' in a
      // pack built before that normalization existed. A plain
      // COALESCE(ow.gloss_es, hg.gloss_es) is still wrong to rely on: the
      // moment it's '' rather than NULL it never falls through to the
      // overlay, since '' is NOT NULL. Treat whitespace-only as absent
      // explicitly (NULLIF(TRIM(...), '')) so the hand-curated
      // hebrew_gloss_es overlay actually gets a chance to fill in the
      // specific reviewed occurrences (Tanda 10, Fase 1) regardless of
      // which shape the pack happens to carry.
      //
      // Three COALESCE tiers, highest priority first:
      //   1. ow.gloss_es       — the pack's own gloss. Real only for Greek
      //                          (TAGNT); Hebrew rows are always NULL/''.
      //   2. hg.gloss_es       — hebrew_gloss_es, 37 hand-curated PER-OCCURRENCE
      //                          Hebrew glosses (keyed book/chapter/verse/pos).
      //   3. hl.gloss_es       — hebrew_lemma_gloss_es, the A3 first-pass
      //                          PER-LEMMA default (keyed Strong's, Hebrew only).
      // So Greek keeps its own gloss, a curated occurrence still outranks the
      // lemma default (e.g. Sal 136:1 pos 7 stays "misericordia suya", not
      // H2617's lemma gloss), and every other Hebrew word gets the A3 default
      // instead of falling back to English gloss_en in the UI.
      `SELECT ow.position AS position, ow.lang AS lang, ow.word AS word,
              ow.translit AS translit, ow.gloss_en AS gloss_en,
              COALESCE(NULLIF(TRIM(ow.gloss_es), ''), hg.gloss_es, hl.gloss_es) AS gloss_es,
              ow.strongs AS strongs, ow.grammar AS grammar
       FROM original_words ow
       LEFT JOIN hebrew_gloss_es hg
         ON hg.book_id = ow.book_id AND hg.chapter = ow.chapter
        AND hg.verse = ow.verse AND hg.position = ow.position
       LEFT JOIN hebrew_lemma_gloss_es hl
         ON hl.strongs = ow.strongs AND ow.lang = 'H'
       WHERE ow.book_id = ? AND ow.chapter = ? AND ow.verse = ?
       ORDER BY ow.position`,
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

  /**
   * The labeled premium sections of a `treatment === 'multi-view'`
   * dictionary entry, in display order. Empty array for any other entry
   * (nothing was ever inserted for its slug) — callers branch on
   * `entry.treatment`, not on this array's length, but an empty result is
   * still a safe no-op rather than an error.
   */
  async getDictionaryMultiviewSections(
    slug: string,
  ): Promise<DictionaryMultiviewSection[]> {
    await this.initialize();
    return this.getDb().getAllAsync<DictionaryMultiviewSection>(
      `SELECT slug, position, label_es, body_es
       FROM dictionary_multiview_sections
       WHERE slug = ?
       ORDER BY position`,
      [slug.trim()],
    );
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

  /**
   * Rows per multi-row `INSERT OR REPLACE ... VALUES (...), (...), ...`
   * statement in {@link insertVerses}. 6 bound params/row × 166 = 996,
   * safely under SQLite's legacy `SQLITE_MAX_VARIABLE_NUMBER` default of 999
   * (older builds; modern SQLite defaults to 32766) — kept conservative
   * because we can't probe the actual compiled-in limit of either the
   * native expo-sqlite build or the WASM build `data-loader.web.ts` drives
   * through this same method, and a hard failure here would be a boot-time
   * crash, not a slow boot.
   */
  private static readonly VERSE_INSERT_BATCH_SIZE = 166;

  /**
   * Bulk-insert verses in multi-row `VALUES` statements instead of one
   * `runAsync` per row. Historically this looped a single-row INSERT per
   * verse inside one transaction — correct, but 31k+ individual native-
   * bridge round trips (one per verse) measured ~100s on a real device for
   * a similarly-sized bundled version (see commit 32fceb4, "Sprint 20 —
   * JSON backup export + pre-seeded SQLite"). Batching rows into a single
   * statement per {@link VERSE_INSERT_BATCH_SIZE} verses cuts the round
   * trips by ~2 orders of magnitude while keeping the exact same end state
   * (`INSERT OR REPLACE` still fires the verses_ai/ad/au FTS triggers once
   * per affected row, same as before — SQLite fires row triggers per row
   * regardless of how many rows one statement writes; `verses_ad` firing for
   * the implicit delete inside a REPLACE additionally requires
   * `recursive_triggers` to be ON — see {@link configureRecursiveTriggers}).
   */
  async insertVerses(verses: Omit<BibleVerse, 'id'>[]): Promise<void> {
    const db = this.getDb();
    if (verses.length === 0) return;

    const BATCH_SIZE = BibleDatabase.VERSE_INSERT_BATCH_SIZE;

    await db.withTransactionAsync(async () => {
      for (let i = 0; i < verses.length; i += BATCH_SIZE) {
        const batch = verses.slice(i, i + BATCH_SIZE);
        const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const params: (string | number)[] = [];
        for (const verse of batch) {
          // Los datos del archivo usan book_id y book_name, pero nuestra interfaz usa bookNumber y book
          // Soportamos ambos formatos para flexibilidad
          const bookId = (verse as any).book_id || verse.bookNumber;
          const bookName = (verse as any).book_name || verse.book;

          params.push(
            bookId,
            bookName,
            verse.chapter,
            verse.verse,
            verse.text,
            verse.version,
          );
        }

        await db.runAsync(
          `INSERT OR REPLACE INTO verses (book_id, book_name, chapter, verse, text, version)
           VALUES ${placeholders}`,
          params,
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
    //
    // The raw query is never bound directly: FTS5's MATCH argument is its
    // own tiny query language (AND/OR/NOT, "phrase", prefix*, (), col:), so
    // ordinary vocabulary with FTS5-special characters — hyphenated words
    // like "self-control" or "co-heirs" above all — throws a SQL syntax
    // error instead of matching. sanitizeFtsQuery neutralizes that while
    // still matching the literal words typed and preserving the handful of
    // FTS5 syntax forms this screen intentionally supports (prefix*, OR,
    // "phrase quoting"). See its doc comment for the full rationale.
    const result = await db.getAllAsync<BibleVerse>(
      `SELECT v.id, v.book_id as bookNumber, v.book_name as book, v.chapter, v.verse, v.text, v.version
       FROM verses v
       INNER JOIN verses_fts fts ON v.id = fts.rowid
       WHERE fts.text MATCH ? AND v.version = ?
       ORDER BY rank
       LIMIT ? OFFSET ?`,
      [sanitizeFtsQuery(query), version, limit, offset],
    );

    return result;
  }

  async searchByBook(
    bookId: number,
    query: string,
    version: string = 'RVR1960',
  ): Promise<BibleVerse[]> {
    const db = this.getDb();

    // See searchVerses' comment: the query must never reach FTS5 MATCH
    // un-sanitized.
    const result = await db.getAllAsync<BibleVerse>(
      `SELECT v.id, v.book_id as bookNumber, v.book_name as book, v.chapter, v.verse, v.text, v.version
       FROM verses v
       INNER JOIN verses_fts fts ON v.id = fts.rowid
       WHERE fts.text MATCH ? AND v.book_id = ? AND v.version = ?
       ORDER BY v.chapter, v.verse`,
      [sanitizeFtsQuery(query), bookId, version],
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
