/**
 * Regression test for a latent `verses_fts` corruption bug found while
 * reviewing `insertVerses()`'s batched `INSERT OR REPLACE` (src/lib/database/
 * index.ts): SQLite defaults `PRAGMA recursive_triggers` to OFF, and per
 * SQLite's own docs (sqlite.org/lang_conflict.html — "When the REPLACE
 * conflict resolution strategy deletes rows in order to satisfy a
 * constraint, delete triggers fire if and only if recursive triggers are
 * enabled"), that means the `verses_ad` AFTER DELETE trigger would NOT fire
 * for the implicit delete inside `INSERT OR REPLACE INTO verses` — used by
 * `insertVerses` to re-seed an already-loaded Bible version (e.g.
 * `seedWebTextIfNeeded`'s WEB_TEXT_VERSION bumps).
 *
 * Confirmed for real (not just from the docs) with a direct repro against a
 * faithful copy of this exact schema run under real SQLite (Python's stdlib
 * `sqlite3`, same C library semantics as the native/WASM SQLite this app
 * embeds): re-seeding an existing verse left its OLD row's `verses_fts`
 * index entry orphaned (the replaced row gets a NEW autoincrement id — REPLACE
 * deletes-then-inserts, and `verses.id` is `INTEGER PRIMARY KEY AUTOINCREMENT`
 * with no explicit `id` in the insert — so the old id's postings are never
 * cleaned up), and any FTS5 query that doesn't defensively re-join back to
 * `verses` can raise `fts5: missing row N from content table 'main'.'verses'`.
 * The fix is `configureRecursiveTriggers()` (called from
 * `_performInitialization` right after opening the connection), which sets
 * `PRAGMA recursive_triggers = ON` so `verses_ad` fires normally.
 *
 * `FakeVersesDb` below models exactly this SQLite behavior (not the whole
 * schema — see `databaseMigrations.test.ts` for the general-purpose
 * `FakeBibleDb`): a `INSERT OR REPLACE` that conflicts on
 * `UNIQUE(book_id, chapter, verse, version)` deletes the old row and inserts
 * a new one under a fresh autoincrement id; the "AFTER DELETE" cleanup of the
 * `verses_fts` shadow index is applied if and only if the fake's
 * `recursiveTriggersOn` flag was set — exactly mirroring the documented
 * REPLACE + recursive_triggers interaction — while the "AFTER INSERT"
 * indexing always applies (SQLite doesn't gate INSERT triggers on this
 * pragma at all).
 */
import {BibleDatabase} from '../src/lib/database';
import type {BibleVerse} from '../src/types/bible';

// Only used by the last test, which drives the real `initialize()` to prove
// `_performInitialization` actually wires `configureRecursiveTriggers()` in
// (as opposed to the other tests, which call it directly and would stay
// green even if the real init path stopped calling it). Declared via a
// lazy closure per the pattern `dataLoaderWebVersionGate.test.ts` documents:
// `jest.mock` factories run at import-hoist time, before any local `const`
// is initialized.
const mockOpenDatabaseAsync = jest.fn();
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: (name: string) => mockOpenDatabaseAsync(name),
}));

interface VerseRow {
  id: number;
  book_id: number;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

/**
 * Faithful-enough in-memory stand-in for the `verses` + `verses_fts` pair,
 * modeling the real SQLite REPLACE/recursive_triggers/trigger-firing rules
 * described above rather than assuming them.
 */
class FakeVersesDb {
  recursiveTriggersOn = false;
  private nextId = 1;
  verses: VerseRow[] = [];
  /** The FTS5 shadow index: rowid -> indexed text. Orphaned entries (a
   *  rowid present here but absent from `verses`) are exactly the bug. */
  ftsIndex = new Map<number, string>();

  /** Rowids indexed in verses_fts that no longer exist in `verses` — the
   *  bug's signature. Must always be empty when the fix is in place. */
  orphanedFtsRowIds(): number[] {
    const liveIds = new Set(this.verses.map(v => v.id));
    return [...this.ftsIndex.keys()].filter(id => !liveIds.has(id));
  }

  async execAsync(sql: string): Promise<void> {
    if (/^PRAGMA\s+recursive_triggers\s*=\s*ON;?$/i.test(sql.trim())) {
      this.recursiveTriggersOn = true;
      return;
    }
    throw new Error(`FakeVersesDb.execAsync: unhandled statement: ${sql}`);
  }

  async runAsync(
    sql: string,
    params: unknown[] = [],
  ): Promise<{changes: number; lastInsertRowId: number}> {
    const s = sql.trim();

    // createSchema()'s DDL — idempotent no-ops, we don't need to inspect the
    // trigger bodies since the SQLite documented behavior they rely on is
    // what this fake simulates directly.
    if (/^CREATE\s+(TABLE|VIRTUAL TABLE|INDEX|TRIGGER)\b/i.test(s)) {
      return {changes: 0, lastInsertRowId: 0};
    }
    if (/^INSERT OR IGNORE INTO reading_progress\b/i.test(s)) {
      return {changes: 0, lastInsertRowId: 0};
    }

    // insertVerses()'s batched multi-row INSERT OR REPLACE.
    if (/^INSERT OR REPLACE INTO verses\b/i.test(s)) {
      const ROW_WIDTH = 6; // book_id, book_name, chapter, verse, text, version
      if (params.length % ROW_WIDTH !== 0) {
        throw new Error(
          `FakeVersesDb.runAsync: params length ${params.length} not a multiple of ${ROW_WIDTH}`,
        );
      }
      let changes = 0;
      for (let i = 0; i < params.length; i += ROW_WIDTH) {
        const [book_id, book_name, chapter, verse, text, version] =
          params.slice(i, i + ROW_WIDTH) as [
            number,
            string,
            number,
            number,
            string,
            string,
          ];

        const conflictIdx = this.verses.findIndex(
          v =>
            v.book_id === book_id &&
            v.chapter === chapter &&
            v.verse === verse &&
            v.version === version,
        );

        if (conflictIdx !== -1) {
          // REPLACE conflict resolution: delete the old row, then insert a
          // new one. The AFTER DELETE trigger (verses_ad) fires ONLY if
          // recursive_triggers is ON — this is the crux of the bug/fix.
          const oldRow = this.verses[conflictIdx];
          this.verses.splice(conflictIdx, 1);
          if (this.recursiveTriggersOn) {
            this.ftsIndex.delete(oldRow.id);
          }
        }

        // A brand-new autoincrement id is always assigned — REPLACE never
        // reuses the deleted row's rowid when `id` isn't specified in the
        // INSERT column list (true of AUTOINCREMENT tables in real SQLite).
        const newId = this.nextId++;
        this.verses.push({
          id: newId,
          book_id,
          book_name,
          chapter,
          verse,
          text,
          version,
        });
        // AFTER INSERT trigger (verses_ai) always fires — SQLite does not
        // gate INSERT triggers on recursive_triggers at all.
        this.ftsIndex.set(newId, text);
        changes++;
      }
      return {changes, lastInsertRowId: this.nextId - 1};
    }

    throw new Error(
      `FakeVersesDb.runAsync: unhandled statement: ${s.slice(0, 80)}`,
    );
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }

  /** createSchema() calls migrateBookmarksToFavorites(), which checks for a
   *  legacy `bookmarks` table via sqlite_master — always absent here. */
  async getFirstAsync<T>(sql: string): Promise<T | null> {
    if (/sqlite_master.*name=['"]bookmarks['"]/is.test(sql.trim())) {
      return null;
    }
    throw new Error(`FakeVersesDb.getFirstAsync: unhandled query: ${sql}`);
  }
}

function makeDb(): {db: BibleDatabase; fake: FakeVersesDb} {
  const fake = new FakeVersesDb();
  const db = new BibleDatabase();
  (db as unknown as {db: FakeVersesDb}).db = fake;
  return {db, fake};
}

function privateApi(db: BibleDatabase) {
  return db as unknown as {
    configureRecursiveTriggers(): Promise<void>;
    createSchema(): Promise<void>;
  };
}

function verse(text: string): Omit<BibleVerse, 'id'> {
  return {
    bookNumber: 43,
    book: 'John',
    chapter: 3,
    verse: 16,
    text,
    version: 'RVR1960',
  } as Omit<BibleVerse, 'id'>;
}

describe('verses_fts stays in sync with verses across INSERT OR REPLACE re-seeds', () => {
  it('(the fix) configureRecursiveTriggers + repeated re-seeds of the same verse leave zero orphaned FTS entries', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).configureRecursiveTriggers(); // exactly what _performInitialization does
    await privateApi(db).createSchema();

    expect(fake.recursiveTriggersOn).toBe(true);

    // Re-seed the SAME logical verse 5 times, as a real device would across
    // several WEB_TEXT_VERSION bumps.
    for (let i = 0; i < 5; i++) {
      await db.insertVerses([verse(`re-seed pass ${i}`)]);
    }

    expect(fake.verses).toHaveLength(1); // still just one logical verse
    expect(fake.orphanedFtsRowIds()).toEqual([]); // no garbage left behind
    expect(fake.ftsIndex.size).toBe(1); // index does not grow with re-seed churn
    // The index reflects the CURRENT text, not a stale one.
    const [[liveId, liveText]] = [...fake.ftsIndex.entries()];
    expect(liveId).toBe(fake.verses[0].id);
    expect(liveText).toBe('re-seed pass 4');
  });

  it('(the bug, if the fix regresses) skipping configureRecursiveTriggers lets every re-seed orphan one more verses_fts row', async () => {
    const {db, fake} = makeDb();
    // Deliberately NOT calling configureRecursiveTriggers() here — this is
    // the pre-fix behavior (recursive_triggers left at SQLite's OFF default).
    await privateApi(db).createSchema();

    expect(fake.recursiveTriggersOn).toBe(false);

    for (let i = 0; i < 5; i++) {
      await db.insertVerses([verse(`re-seed pass ${i}`)]);
    }

    expect(fake.verses).toHaveLength(1); // `verses` itself still looks fine...
    // ...but verses_fts silently accumulated one orphaned entry per re-seed
    // that replaced an existing row (4 replaces after the first plain insert).
    expect(fake.orphanedFtsRowIds()).toHaveLength(4);
    expect(fake.ftsIndex.size).toBe(5); // unbounded growth across re-seeds
  });

  it('a brand-new verse (no prior row) is indexed normally regardless of recursive_triggers', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).createSchema(); // recursive_triggers left OFF

    await db.insertVerses([verse('first time seeing this verse')]);

    expect(fake.verses).toHaveLength(1);
    expect(fake.orphanedFtsRowIds()).toEqual([]);
    expect(fake.ftsIndex.get(fake.verses[0].id)).toBe(
      'first time seeing this verse',
    );
  });

  it('_performInitialization actually calls configureRecursiveTriggers right after opening the connection, before createSchema', async () => {
    // The tests above call configureRecursiveTriggers() directly, so they'd
    // stay green even if the real init path stopped calling it. This test
    // drives the REAL `initialize()` to prove the wiring itself, without
    // needing to fake out every downstream seed step (some of which pull in
    // the real ~31k-row WEB_DATA re-seed) — createSchema is stubbed to reject
    // immediately after configureRecursiveTriggers runs, which is enough to
    // observe call order.
    const fake = new FakeVersesDb();
    mockOpenDatabaseAsync.mockResolvedValue(fake);
    const db = new BibleDatabase();
    const configureSpy = jest.spyOn(
      db as unknown as {configureRecursiveTriggers(): Promise<void>},
      'configureRecursiveTriggers',
    );
    jest
      .spyOn(db as unknown as {createSchema(): Promise<void>}, 'createSchema')
      .mockRejectedValue(new Error('stop-here-test-boundary'));

    await expect(db.initialize()).rejects.toThrow('stop-here-test-boundary');

    expect(configureSpy).toHaveBeenCalledTimes(1);
    expect(fake.recursiveTriggersOn).toBe(true);
  });
});
