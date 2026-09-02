/**
 * T7.2 — direct tests for BibleDatabase's data migrations/normalizations,
 * previously the largest untested surface in the codebase (~1600 lines with
 * zero direct tests; ~11 other suites only exercise it indirectly as a
 * dependency of something else). Covers:
 *
 *  - `migrateCanonicalBookKeys` — the Sprint 58 one-shot migration that
 *    normalizes favorites/notes/highlights book identity to the canonical
 *    English name, gated by the `@migration_canonical_book_keys_v1` flag.
 *  - `migrateBookmarksToFavorites` — the legacy `bookmarks` → `favorites`
 *    migration that runs on every init (naturally idempotent: it drops the
 *    `bookmarks` table once migrated, so a second run finds nothing to do).
 *  - `createSchema` — the idempotent `CREATE TABLE/INDEX/TRIGGER IF NOT
 *    EXISTS` + `INSERT OR IGNORE` bootstrap, extracted from
 *    `_performInitialization` (see src/lib/database/index.ts) specifically
 *    so it is unit-testable without the native-open/asset-loading machinery
 *    around it.
 *
 * A REAL SQLite engine was evaluated for this (Node's built-in
 * `node:sqlite`), but this repo's CI (.github/workflows/ci.yml) pins
 * `node-version: 20`, and `node:sqlite` requires Node >= 22.5 — it would
 * have passed locally while breaking CI. Adding a new npm dependency
 * (sql.js / better-sqlite3) was also ruled out: it would touch
 * package.json/package-lock.json, which is exactly the kind of shared-file
 * change likely to collide with the other agents working in parallel
 * worktrees on this repo right now.
 *
 * Instead, `FakeBibleDb` below is an in-memory stand-in — the same idiom
 * already established in this suite (FakeDb in syncBookCompletion.test.ts,
 * FakeSqliteHandle in chapterVerseCount.test.ts) — but built to be a
 * genuine regression net rather than a rubber stamp:
 *   - DDL idempotency is enforced generically: ANY "CREATE ..." statement
 *     replayed without literally containing "IF NOT EXISTS" throws, exactly
 *     mirroring real SQLite. If a future edit drops that clause from any of
 *     createSchema's 9 tables / 3 triggers / 12 indexes, the "run it twice"
 *     tests below fail.
 *   - The UNIQUE(verse_id) collision on highlights is simulated for real
 *     (a colliding UPDATE throws), so the source's catch → DELETE fallback
 *     path is genuinely exercised, not assumed.
 *   - Row mutations (UPDATE/DELETE/INSERT) operate on real in-memory arrays
 *     keyed off the exact bound parameters the source passes, so a wrong
 *     column or parameter order would fail these tests.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleDatabase} from '../src/lib/database';

interface FavoriteRow {
  id: string;
  verse_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text?: string;
  category?: string;
  rating?: number;
  tags?: string;
  note?: string | null;
  created_at?: number;
  updated_at?: number;
}
interface NoteRow {
  id: string;
  book_name: string;
}
interface HighlightRow {
  id: string;
  book_id: string;
  chapter: number;
  verse: number;
  verse_id: string;
  color?: string;
}
interface BookmarkRow {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  created_at: string;
}

/**
 * In-memory stand-in for the SQLite-backed connection, faithful enough to
 * exercise the REAL control flow of createSchema / migrateCanonicalBookKeys
 * / migrateBookmarksToFavorites (see file header for what it does and does
 * not verify).
 */
class FakeBibleDb {
  /** `null` means "table does not exist yet" (mirrors a real missing table). */
  favorites: FavoriteRow[] | null = [];
  notes: NoteRow[] | null = [];
  highlights: HighlightRow[] | null = null;
  bookmarks: BookmarkRow[] | null = null;
  readingProgress: {
    id: number;
    book_name: string;
    chapter: number;
    verse: number;
  } | null = null;

  /** Every distinct CREATE statement seen (for the IF-NOT-EXISTS idempotency check). */
  private seenCreateStatements = new Set<string>();
  /** Table/virtual-table names created via CREATE (IF NOT EXISTS) TABLE. */
  createdTableNames = new Set<string>();

  async runAsync(
    sql: string,
    params: unknown[] = [],
  ): Promise<{changes: number; lastInsertRowId: number}> {
    const s = sql.trim();

    // ── DDL (createSchema): CREATE TABLE / VIRTUAL TABLE / INDEX / TRIGGER ──
    if (/^CREATE\s+(TABLE|VIRTUAL TABLE|INDEX|TRIGGER)\b/i.test(s)) {
      const hasIfNotExists = /IF NOT EXISTS/i.test(s);
      if (!hasIfNotExists && this.seenCreateStatements.has(s)) {
        throw new Error(
          `SQLITE_ERROR: object already exists (statement lacks IF NOT EXISTS): ${s.slice(0, 60)}...`,
        );
      }
      this.seenCreateStatements.add(s);
      const tableMatch = s.match(
        /^CREATE\s+(?:TABLE|VIRTUAL TABLE)\s+IF NOT EXISTS\s+(\w+)/i,
      );
      if (tableMatch) this.createdTableNames.add(tableMatch[1]);
      return {changes: 0, lastInsertRowId: 0};
    }

    // ── createSchema's reading_progress seed ──
    if (/^INSERT OR IGNORE INTO reading_progress\b/i.test(s)) {
      if (!this.readingProgress) {
        const [id, book_name, chapter, verse] = params as [
          number,
          string,
          number,
          number,
        ];
        this.readingProgress = {id, book_name, chapter, verse};
      }
      return {changes: this.readingProgress ? 1 : 0, lastInsertRowId: 0};
    }

    // ── migrateCanonicalBookKeys ──
    if (
      /^UPDATE favorites SET book_name = \?, verse_id = \? WHERE id = \?/i.test(
        s,
      )
    ) {
      const [book_name, verse_id, id] = params as [string, string, string];
      const row = this.favorites?.find(f => f.id === id);
      if (row) {
        row.book_name = book_name;
        row.verse_id = verse_id;
      }
      return {changes: row ? 1 : 0, lastInsertRowId: 0};
    }
    if (/^UPDATE notes SET book_name = \? WHERE id = \?/i.test(s)) {
      const [book_name, id] = params as [string, string];
      const row = this.notes?.find(n => n.id === id);
      if (row) row.book_name = book_name;
      return {changes: row ? 1 : 0, lastInsertRowId: 0};
    }
    if (
      /^UPDATE highlights SET book_id = \?, verse_id = \? WHERE id = \?/i.test(
        s,
      )
    ) {
      const [book_id, verse_id, id] = params as [string, string, string];
      const collision = this.highlights?.find(
        h => h.verse_id === verse_id && h.id !== id,
      );
      if (collision) {
        throw new Error('UNIQUE constraint failed: highlights.verse_id');
      }
      const row = this.highlights?.find(h => h.id === id);
      if (row) {
        row.book_id = book_id;
        row.verse_id = verse_id;
      }
      return {changes: row ? 1 : 0, lastInsertRowId: 0};
    }
    if (/^DELETE FROM highlights WHERE id = \?/i.test(s)) {
      const [id] = params as [string];
      if (this.highlights)
        this.highlights = this.highlights.filter(h => h.id !== id);
      return {changes: 1, lastInsertRowId: 0};
    }

    // ── migrateBookmarksToFavorites ──
    if (/^DROP TABLE IF EXISTS bookmarks/i.test(s)) {
      this.bookmarks = null;
      return {changes: 0, lastInsertRowId: 0};
    }
    if (/^INSERT INTO favorites\b/i.test(s)) {
      const [
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
        updated_at,
      ] = params as [
        string,
        string,
        string,
        number,
        number,
        string,
        string,
        number,
        string,
        string | null,
        number,
        number,
      ];
      (this.favorites ??= []).push({
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
        updated_at,
      });
      return {changes: 1, lastInsertRowId: 0};
    }

    throw new Error(
      `FakeBibleDb.runAsync: unhandled statement: ${s.slice(0, 80)}`,
    );
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    const s = sql.trim();
    if (/sqlite_master.*name='bookmarks'/is.test(s)) {
      return (this.bookmarks !== null ? {name: 'bookmarks'} : null) as T | null;
    }
    throw new Error(
      `FakeBibleDb.getFirstAsync: unhandled query: ${s.slice(0, 80)}`,
    );
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    const s = sql.trim();
    if (
      /^SELECT book_name,\s*chapter,\s*verse,\s*text,\s*created_at\s+FROM\s+bookmarks/i.test(
        s,
      )
    ) {
      if (this.bookmarks === null) throw new Error('no such table: bookmarks');
      return this.bookmarks as unknown as T[];
    }
    if (/^SELECT verse_id as verseId FROM favorites/i.test(s)) {
      return (this.favorites ?? []).map(f => ({
        verseId: f.verse_id,
      })) as unknown as T[];
    }
    if (/^SELECT id, book_name, chapter, verse FROM favorites/i.test(s)) {
      if (this.favorites === null) throw new Error('no such table: favorites');
      return this.favorites.map(f => ({
        id: f.id,
        book_name: f.book_name,
        chapter: f.chapter,
        verse: f.verse,
      })) as unknown as T[];
    }
    if (/^SELECT id, book_name FROM notes/i.test(s)) {
      if (this.notes === null) throw new Error('no such table: notes');
      return this.notes.map(n => ({
        id: n.id,
        book_name: n.book_name,
      })) as unknown as T[];
    }
    if (/^SELECT id, book_id, chapter, verse FROM highlights/i.test(s)) {
      if (this.highlights === null)
        throw new Error('no such table: highlights');
      return this.highlights.map(h => ({
        id: h.id,
        book_id: h.book_id,
        chapter: h.chapter,
        verse: h.verse,
      })) as unknown as T[];
    }
    throw new Error(
      `FakeBibleDb.getAllAsync: unhandled query: ${s.slice(0, 80)}`,
    );
  }

  async execAsync(): Promise<void> {
    // Not exercised by any method under test in this file.
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }
}

/** A BibleDatabase whose private `db` field is the fake above. */
function makeDb(): {db: BibleDatabase; fake: FakeBibleDb} {
  const fake = new FakeBibleDb();
  const db = new BibleDatabase();
  (db as unknown as {db: FakeBibleDb}).db = fake;
  return {db, fake};
}

/** Casts to reach the private methods under test — same idiom the codebase
 *  already uses to inject a fake `db` field (see chapterVerseCount.test.ts). */
function privateApi(db: BibleDatabase) {
  return db as unknown as {
    createSchema(): Promise<void>;
    migrateBookmarksToFavorites(): Promise<void>;
  };
}

describe('migrateCanonicalBookKeys', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('normalizes favorites.book_name and rebuilds verse_id to the canonical English name', async () => {
    const {db, fake} = makeDb();
    fake.favorites = [
      {
        id: 'fav1',
        verse_id: 'Génesis_1_1',
        book_name: 'Génesis',
        chapter: 1,
        verse: 1,
      },
    ];

    await db.migrateCanonicalBookKeys();

    expect(fake.favorites[0]).toMatchObject({
      book_name: 'Genesis',
      verse_id: 'Genesis_1_1',
    });
  });

  it('leaves an already-canonical favorite untouched', async () => {
    const {db, fake} = makeDb();
    fake.favorites = [
      {
        id: 'fav1',
        verse_id: 'John_3_16',
        book_name: 'John',
        chapter: 3,
        verse: 16,
      },
    ];

    await db.migrateCanonicalBookKeys();

    expect(fake.favorites[0]).toMatchObject({
      book_name: 'John',
      verse_id: 'John_3_16',
    });
  });

  it('normalizes notes.book_name to the canonical English name', async () => {
    const {db, fake} = makeDb();
    fake.notes = [{id: 'n1', book_name: 'Salmos'}];

    await db.migrateCanonicalBookKeys();

    expect(fake.notes[0].book_name).toBe('Psalms');
  });

  it('normalizes highlights.book_id and verse_id when the highlights table exists', async () => {
    const {db, fake} = makeDb();
    fake.highlights = [
      {id: 'h1', verse_id: 'Juan:3:16', book_id: 'Juan', chapter: 3, verse: 16},
    ];

    await db.migrateCanonicalBookKeys();

    expect(fake.highlights[0]).toMatchObject({
      book_id: 'John',
      verse_id: 'John:3:16',
    });
  });

  it('drops the non-canonical highlight on a UNIQUE(verse_id) collision, keeping the canonical row', async () => {
    // The same verse highlighted twice under two language names for its
    // book — the source code's UNIQUE(verse_id) violation path must delete
    // the redundant non-canonical row rather than throwing.
    const {db, fake} = makeDb();
    fake.highlights = [
      {
        id: 'canonical',
        verse_id: 'John:3:16',
        book_id: 'John',
        chapter: 3,
        verse: 16,
        color: 'yellow',
      },
      {
        id: 'duplicate',
        verse_id: 'Juan:3:16',
        book_id: 'Juan',
        chapter: 3,
        verse: 16,
        color: 'green',
      },
    ];

    await db.migrateCanonicalBookKeys();

    expect(fake.highlights).toEqual([
      {
        id: 'canonical',
        verse_id: 'John:3:16',
        book_id: 'John',
        chapter: 3,
        verse: 16,
        color: 'yellow',
      },
    ]);
  });

  it('is a no-op (does not throw) when the highlights table does not exist yet', async () => {
    const {db, fake} = makeDb();
    fake.favorites = [];
    fake.notes = [];
    // fake.highlights stays null — "table not present"

    await expect(db.migrateCanonicalBookKeys()).resolves.not.toThrow();
  });

  it('does not throw when favorites/notes tables are absent either (non-fatal by design)', async () => {
    const {db, fake} = makeDb();
    fake.favorites = null;
    fake.notes = null;

    await expect(db.migrateCanonicalBookKeys()).resolves.toBeUndefined();
  });

  it('aborts before setting the flag when a required table (favorites) is missing — a future run can retry', async () => {
    // favorites/notes/highlights run inside ONE try block; only the
    // highlights step has its own inner try/catch for "table missing". A
    // missing favorites table throws immediately, the whole function is
    // caught by the outer non-fatal try/catch, and — because the flag is
    // only set at the very end — the migration never marks itself "done".
    // That is a deliberate safety net: a genuinely failed migration retries
    // on the next app launch instead of silently giving up forever.
    const {db, fake} = makeDb();
    fake.favorites = null; // favorites query throws first

    await db.migrateCanonicalBookKeys();

    expect(
      await AsyncStorage.getItem('@migration_canonical_book_keys_v1'),
    ).toBeNull();
  });

  it('runs exactly once: a second call is a no-op because the one-shot flag is already set', async () => {
    const {db, fake} = makeDb();
    fake.favorites = [
      {
        id: 'fav1',
        verse_id: 'Génesis_1_1',
        book_name: 'Génesis',
        chapter: 1,
        verse: 1,
      },
    ];
    fake.notes = [];

    await db.migrateCanonicalBookKeys();
    expect(
      await AsyncStorage.getItem('@migration_canonical_book_keys_v1'),
    ).toBe('1');

    // Simulate a re-import of stale, non-canonical data arriving after the
    // migration already ran (e.g. a sync pulling an old record back down).
    // A real second run of the migration would normalize it; the flag must
    // prevent that from happening again.
    fake.favorites[0].book_name = 'Génesis';
    fake.favorites[0].verse_id = 'Génesis_1_1';

    await db.migrateCanonicalBookKeys();

    expect(fake.favorites[0].book_name).toBe('Génesis'); // untouched — the flag short-circuited
  });

  it('is safe to call against a DB that already has the flag set from a previous app run', async () => {
    await AsyncStorage.setItem('@migration_canonical_book_keys_v1', '1');
    const {db, fake} = makeDb();
    fake.favorites = [
      {
        id: 'fav1',
        verse_id: 'Salmos_23_1',
        book_name: 'Salmos',
        chapter: 23,
        verse: 1,
      },
    ];

    await db.migrateCanonicalBookKeys();

    expect(fake.favorites[0].book_name).toBe('Salmos'); // never touched — flag pre-set
  });
});

describe('migrateBookmarksToFavorites', () => {
  it('does nothing when there is no bookmarks table', async () => {
    const {db, fake} = makeDb();
    fake.favorites = [];

    await expect(
      privateApi(db).migrateBookmarksToFavorites(),
    ).resolves.not.toThrow();

    expect(fake.favorites).toHaveLength(0);
  });

  it('drops an empty bookmarks table without inserting anything into favorites', async () => {
    const {db, fake} = makeDb();
    fake.bookmarks = [];
    fake.favorites = [];

    await privateApi(db).migrateBookmarksToFavorites();

    expect(fake.bookmarks).toBeNull();
    expect(fake.favorites).toHaveLength(0);
  });

  it('migrates bookmark rows into favorites and drops the bookmarks table', async () => {
    const {db, fake} = makeDb();
    fake.bookmarks = [
      {
        book_name: 'Juan',
        chapter: 3,
        verse: 16,
        text: 'Porque de tal manera amó Dios al mundo',
        created_at: '1700000000000',
      },
    ];
    fake.favorites = [];

    await privateApi(db).migrateBookmarksToFavorites();

    expect(fake.favorites).toHaveLength(1);
    expect(fake.favorites![0]).toMatchObject({
      verse_id: 'Juan_3_16',
      book_name: 'Juan',
      chapter: 3,
      verse: 16,
      text: 'Porque de tal manera amó Dios al mundo',
      created_at: 1700000000000,
    });
    expect(fake.bookmarks).toBeNull();
  });

  it('skips a bookmark whose verseId already exists as a favorite (dedup)', async () => {
    const {db, fake} = makeDb();
    fake.bookmarks = [
      {
        book_name: 'Juan',
        chapter: 3,
        verse: 16,
        text: 'texto viejo',
        created_at: '1700000000000',
      },
    ];
    fake.favorites = [
      {
        id: 'existing',
        verse_id: 'Juan_3_16',
        book_name: 'Juan',
        chapter: 3,
        verse: 16,
        text: 'texto ya favorito',
      },
    ];

    await privateApi(db).migrateBookmarksToFavorites();

    // Only the pre-existing favorite remains — the bookmark was skipped as
    // a duplicate, not inserted as a second row for the same verse.
    expect(fake.favorites).toHaveLength(1);
    expect(fake.favorites![0]).toMatchObject({
      id: 'existing',
      text: 'texto ya favorito',
    });
  });
});

describe('createSchema (idempotent bootstrap)', () => {
  it('creates every expected table on the first run', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).createSchema();

    expect(fake.createdTableNames).toEqual(
      new Set([
        'verses',
        'verses_fts',
        'notes',
        'reading_progress',
        'favorites',
        'review_events',
        'cross_references',
        'original_words',
        'strongs_lexicon',
        'hebrew_gloss_es',
        'hebrew_lemma_gloss_es',
        'strongs_defs',
        'dictionary_entries',
        'dictionary_multiview_sections',
      ]),
    );
  });

  it('running it twice in a row does not throw (every CREATE uses IF NOT EXISTS)', async () => {
    const {db} = makeDb();
    await privateApi(db).createSchema();
    await expect(privateApi(db).createSchema()).resolves.not.toThrow();
  });

  it('seeds the reading_progress singleton row exactly once — INSERT OR IGNORE does not overwrite real progress on relaunch', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).createSchema();
    expect(fake.readingProgress).toMatchObject({
      book_name: 'Juan',
      chapter: 3,
      verse: 16,
    });

    // The user actually reads something before the app "restarts".
    fake.readingProgress = {id: 1, book_name: 'Romanos', chapter: 8, verse: 28};

    await privateApi(db).createSchema(); // second "launch"

    expect(fake.readingProgress).toEqual({
      id: 1,
      book_name: 'Romanos',
      chapter: 8,
      verse: 28,
    });
  });

  it('preserves existing favorites data across a second run and does not duplicate it', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).createSchema();

    fake.favorites!.push({
      id: 'fav1',
      verse_id: 'Juan_3_16',
      book_name: 'Juan',
      chapter: 3,
      verse: 16,
      text: 'texto',
    });

    await expect(privateApi(db).createSchema()).resolves.not.toThrow();

    expect(fake.favorites).toHaveLength(1);
  });

  it('running the legacy-bookmarks migration inside createSchema stays idempotent across two runs', async () => {
    // migrateBookmarksToFavorites is called from inside createSchema; a
    // bookmarks table present on the very first launch must be migrated
    // once and not resurrected or reprocessed on the second.
    const {db, fake} = makeDb();
    fake.bookmarks = [
      {
        book_name: 'Marcos',
        chapter: 1,
        verse: 1,
        text: 'Principio del evangelio',
        created_at: '1700000000000',
      },
    ];

    await privateApi(db).createSchema();
    await expect(privateApi(db).createSchema()).resolves.not.toThrow();

    expect(fake.favorites).toHaveLength(1);
    expect(fake.favorites![0]).toMatchObject({
      book_name: 'Marcos',
      chapter: 1,
      verse: 1,
    });
    expect(fake.bookmarks).toBeNull();
  });
});
