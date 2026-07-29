/**
 * REAL-SQL coverage for `insertVerses`'s batched `INSERT OR REPLACE` path
 * (src/lib/database/index.ts) — the gap flagged after the Sprint batching
 * rewrite (166-row multi-row `VALUES` statements instead of one `runAsync`
 * per verse; see `VERSE_INSERT_BATCH_SIZE`'s doc comment there). The only
 * other test touching `insertVerses` (dataLoaderWebVersionGate.test.ts)
 * mocks the whole `../src/lib/database` module — it exercises the
 * version-gate call-site logic, never the SQL itself. This file is the
 * missing half: it runs the exact SQL `insertVerses` builds against a REAL
 * SQLite engine, not a hand-rolled fake.
 *
 * Engine choice — why sql.js, why the asm.js build specifically, and what it
 * can't cover:
 *  - `node:sqlite` was considered and rejected for the same reason
 *    databaseMigrations.test.ts rejected it: this repo's CI
 *    (.github/workflows/ci.yml) pins Node 20, and `node:sqlite` requires
 *    Node >= 22.5 — it would pass on a newer local Node and fail in CI.
 *  - `sql.js` (pure JS, MIT, zero native compilation) has no such
 *    constraint: it runs identically on any Node version, so it's added
 *    here as a `devDependency` (one line in package.json/package-lock.json
 *    — sql.js itself has zero dependencies of its own).
 *  - Its default build (`dist/sql-wasm.js`) is genuine WebAssembly, but that
 *    build reliably fails under *this* Jest setup: `sqlite3_open` throws an
 *    empty-message Error every time `new SQL.Database()` runs in a Jest
 *    test file (confirmed via a throwaway smoke test), because
 *    `react-native/jest/setup.js` defines `global.window = global` for
 *    RN-compatibility reasons — which flips the emscripten glue code's
 *    `ENVIRONMENT_IS_WEB` browser-environment detection on even though this
 *    is Node, and its WASM instantiation path breaks under that false
 *    positive combined with Jest's sandboxed realm. sql.js also ships
 *    `dist/sql-asm.js` — the exact same SQLite amalgamation compiled to
 *    asm.js (plain JavaScript, no WebAssembly instantiation at all), which
 *    sidesteps that failure entirely and was confirmed working with the
 *    same smoke test. Using it here.
 *  - Both builds have no `fts5` module compiled in — the SAME limitation
 *    this codebase already documents for the OTHER pure-JS/WASM SQLite
 *    engine it ships (expo-sqlite's web build, see the comment directly
 *    above `createSchema`'s `Platform.OS !== 'web'` check, ~line 341 of
 *    index.ts: "the web expo-sqlite WASM build has no fts5 module"). So
 *    these tests build the schema via the REAL `createSchema()` with
 *    `Platform.OS` set to `'web'`, taking its real, already-shipped
 *    FTS5-skipping branch — which is not a compromise invented for this
 *    test file: it's the exact branch `data-loader.web.ts` drives
 *    `insertVerses` through when seeding the WEB translation on the actual
 *    web build, i.e. precisely the "WEB-version verse seeding" scenario the
 *    batching rewrite targeted. The one thing this suite genuinely does NOT
 *    cover is the `verses_ai`/`ad`/`au` FTS trigger firing — there is no
 *    portable, CI-safe (no native compile, Node-20-compatible) engine
 *    available in this repo to exercise that with. Everything else —
 *    exact batch-boundary math, partial final batches, `INSERT OR REPLACE`
 *    dedup, and whole-call transactional atomicity — runs for real.
 */
import {Platform} from 'react-native';
import initSqlJs, {SqlJsDatabase, SqlJsStaticApi} from 'sql.js/dist/sql-asm.js';
import {BibleDatabase} from '../src/lib/database';
import {BibleVerse} from '../src/types/bible';

// createSchema() only skips creating `verses_fts` + its triggers when
// Platform.OS === 'web' (see file-header comment for why that's the branch
// these tests deliberately take). Read at call time inside createSchema, so
// it's safe to flip once here, before any test runs.
(Platform as {OS: string}).OS = 'web';

/**
 * A thin, faithful wrapper around a REAL sql.js database, implementing just
 * the subset of expo-sqlite's `SQLiteDatabase` surface `BibleDatabase`'s
 * private methods call through `this.getDb()`. Unlike `FakeBibleDb` in
 * databaseMigrations.test.ts (a deliberate string-matching stand-in — see
 * that file's own doc comment on why a real engine wasn't used there), every
 * statement passed through here is actually parsed and executed by SQLite:
 * a wrong placeholder/param count, a dropped row, or a violated constraint
 * produces a genuine SQLite error or a genuine wrong row count — nothing is
 * pattern-matched or assumed.
 */
class RealSqlJsAdapter {
  /**
   * Every `INSERT OR REPLACE INTO verses` statement `insertVerses` issued,
   * in call order, with the bound-param count for each — what the
   * batch-boundary assertions below read.
   */
  readonly insertVersesCalls: {sql: string; paramCount: number}[] = [];

  constructor(private readonly raw: SqlJsDatabase) {}

  async runAsync(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<{changes: number; lastInsertRowId: number}> {
    if (/^INSERT OR REPLACE INTO verses\b/i.test(sql.trim())) {
      this.insertVersesCalls.push({sql, paramCount: params.length});
    }
    const stmt = this.raw.prepare(sql);
    try {
      if (params.length > 0) stmt.bind(params);
      stmt.step();
    } finally {
      stmt.free();
    }
    return {changes: this.raw.getRowsModified(), lastInsertRowId: 0};
  }

  async getAllAsync<T>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T[]> {
    const stmt = this.raw.prepare(sql);
    const rows: T[] = [];
    try {
      if (params.length > 0) stmt.bind(params);
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as T);
      }
    } finally {
      stmt.free();
    }
    return rows;
  }

  async getFirstAsync<T>(
    sql: string,
    params: (string | number | null)[] = [],
  ): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, params);
    return rows[0] ?? null;
  }

  async execAsync(sql: string): Promise<void> {
    this.raw.run(sql);
  }

  /** Real BEGIN/COMMIT/ROLLBACK — mirrors expo-sqlite's own
   *  `withTransactionAsync` implementation exactly (build/SQLiteDatabase.js:
   *  `BEGIN` → task() → `COMMIT`, catch → `ROLLBACK` then rethrow), so a
   *  mid-loop failure genuinely undoes earlier batches, not just the one
   *  that failed. */
  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    this.raw.run('BEGIN');
    try {
      await fn();
      this.raw.run('COMMIT');
    } catch (error) {
      this.raw.run('ROLLBACK');
      throw error;
    }
  }
}

let SQL: SqlJsStaticApi;

beforeAll(async () => {
  SQL = await initSqlJs();
});

interface Harness {
  db: BibleDatabase;
  adapter: RealSqlJsAdapter;
  raw: SqlJsDatabase;
}

/** A BibleDatabase backed by a fresh, real, empty sql.js database with the
 *  actual schema built by the actual createSchema(). */
async function makeRealDb(): Promise<Harness> {
  const raw = new SQL.Database();
  const adapter = new RealSqlJsAdapter(raw);
  const db = new BibleDatabase();
  (db as unknown as {db: RealSqlJsAdapter}).db = adapter;
  await (db as unknown as {createSchema: () => Promise<void>}).createSchema();
  return {db, adapter, raw};
}

/** The real batch size the source uses — read off the class rather than
 *  hardcoded, so these tests stay correct if it's ever retuned. */
const BATCH_SIZE = (
  BibleDatabase as unknown as {VERSE_INSERT_BATCH_SIZE: number}
).VERSE_INSERT_BATCH_SIZE;

function makeVerses(
  count: number,
  opts: {version?: string; textPrefix?: string} = {},
): Omit<BibleVerse, 'id'>[] {
  const version = opts.version ?? 'WEB';
  const textPrefix = opts.textPrefix ?? 'text';
  const verses: Omit<BibleVerse, 'id'>[] = [];
  for (let i = 1; i <= count; i++) {
    verses.push({
      book: 'Genesis',
      bookNumber: 1,
      chapter: 1,
      verse: i,
      text: `${textPrefix}-${i}`,
      version,
    });
  }
  return verses;
}

function countVerses(raw: SqlJsDatabase, version = 'WEB'): number {
  const result = raw.exec(
    'SELECT COUNT(*) AS n FROM verses WHERE version = ?',
    [version],
  );
  return Number(result[0]?.values?.[0]?.[0] ?? 0);
}

function textOfVerse(
  raw: SqlJsDatabase,
  verse: number,
  version = 'WEB',
): string | null {
  const result = raw.exec(
    'SELECT text FROM verses WHERE verse = ? AND version = ?',
    [verse, version],
  );
  const value = result[0]?.values?.[0]?.[0];
  return value === undefined ? null : (value as string | null);
}

describe('insertVerses — real batched-SQL path (sql.js, not mocked)', () => {
  it('sanity: createSchema built a real verses table with the UNIQUE constraint (schema drift guard)', async () => {
    const {raw} = await makeRealDb();
    // A duplicate key must be rejected by the schema itself — if this ever
    // stops throwing, the UNIQUE(book_id, chapter, verse, version)
    // constraint drifted out of createSchema and every test below would be
    // silently testing something weaker than production.
    raw.run(
      "INSERT INTO verses (book_id, book_name, chapter, verse, text, version) VALUES (1, 'Genesis', 1, 1, 'a', 'WEB')",
    );
    expect(() =>
      raw.run(
        "INSERT INTO verses (book_id, book_name, chapter, verse, text, version) VALUES (1, 'Genesis', 1, 1, 'b', 'WEB')",
      ),
    ).toThrow(/UNIQUE constraint failed/);
  });

  it('exact multiple of the batch size: N full batches, none short', async () => {
    const total = BATCH_SIZE * 3;
    const {db, adapter, raw} = await makeRealDb();

    await db.insertVerses(makeVerses(total));

    expect(adapter.insertVersesCalls).toHaveLength(3);
    for (const call of adapter.insertVersesCalls) {
      expect(call.paramCount).toBe(BATCH_SIZE * 6);
    }
    expect(countVerses(raw)).toBe(total);
    expect(textOfVerse(raw, 1)).toBe('text-1');
    expect(textOfVerse(raw, total)).toBe(`text-${total}`);
  });

  it('partial final batch: a count not evenly divisible by BATCH_SIZE builds a correctly-sized short last statement, dropping nothing', async () => {
    const total = BATCH_SIZE * 3 + 2; // e.g. 500 verses when BATCH_SIZE is 166
    const {db, adapter, raw} = await makeRealDb();

    await db.insertVerses(makeVerses(total));

    expect(adapter.insertVersesCalls).toHaveLength(4);
    expect(
      adapter.insertVersesCalls.slice(0, 3).map(c => c.paramCount),
    ).toEqual([BATCH_SIZE * 6, BATCH_SIZE * 6, BATCH_SIZE * 6]);
    // The short last batch has exactly 2 rows' worth of params, not 166's.
    expect(adapter.insertVersesCalls[3].paramCount).toBe(2 * 6);
    expect(countVerses(raw)).toBe(total);
    // The very last verse (the one most likely to be dropped by an
    // off-by-one in the batch loop) actually made it in.
    expect(textOfVerse(raw, total)).toBe(`text-${total}`);
    expect(textOfVerse(raw, total - 1)).toBe(`text-${total - 1}`);
  });

  it('a small batch (well under BATCH_SIZE) works without needing a full batch', async () => {
    const {db, adapter, raw} = await makeRealDb();

    await db.insertVerses(makeVerses(3));

    expect(adapter.insertVersesCalls).toHaveLength(1);
    expect(adapter.insertVersesCalls[0].paramCount).toBe(3 * 6);
    expect(countVerses(raw)).toBe(3);
    expect(textOfVerse(raw, 1)).toBe('text-1');
    expect(textOfVerse(raw, 3)).toBe('text-3');
  });

  it('an empty array is a real no-op: no statement is ever issued', async () => {
    const {db, adapter, raw} = await makeRealDb();

    await db.insertVerses([]);

    expect(adapter.insertVersesCalls).toHaveLength(0);
    expect(countVerses(raw)).toBe(0);
  });

  it('re-inserting the same verses REPLACEs them: row count does not double and the new text wins', async () => {
    const count = 200; // spans multiple batches (BATCH_SIZE=166), not just one
    const {db, raw} = await makeRealDb();

    await db.insertVerses(makeVerses(count, {textPrefix: 'original'}));
    expect(countVerses(raw)).toBe(count);

    await db.insertVerses(makeVerses(count, {textPrefix: 'updated'}));

    expect(countVerses(raw)).toBe(count); // not 400 — same keys, replaced in place
    expect(textOfVerse(raw, 1)).toBe('updated-1');
    expect(textOfVerse(raw, 50)).toBe('updated-50');
    expect(textOfVerse(raw, count)).toBe(`updated-${count}`);
  });

  it('accepts the snake_case book_id/book_name shape data-loader.ts passes, in addition to bookNumber/book', async () => {
    const {db, raw} = await makeRealDb();
    const rawShapeVerse = {
      book_id: 2,
      book_name: 'Exodus',
      chapter: 1,
      verse: 1,
      text: 'snake-case text',
      version: 'WEB',
    } as unknown as Omit<BibleVerse, 'id'>;

    await db.insertVerses([rawShapeVerse]);

    const rows = raw.exec(
      'SELECT book_id, book_name, text FROM verses WHERE version = ?',
      ['WEB'],
    );
    expect(rows[0].values[0]).toEqual([2, 'Exodus', 'snake-case text']);
  });

  it('a constraint violation partway through rolls back the WHOLE call, not just the failing batch — one transaction wraps every batch', async () => {
    const total = BATCH_SIZE + 5; // batch 1 full, batch 2 short (5 rows)
    const verses = makeVerses(total);
    // Corrupt one row inside the SECOND batch: text is NOT NULL.
    (verses[BATCH_SIZE + 2] as unknown as {text: string | null}).text = null;
    const {db, raw} = await makeRealDb();

    await expect(db.insertVerses(verses)).rejects.toThrow(
      /NOT NULL constraint failed/,
    );

    // Batch 1's rows must be gone too: insertVerses wraps every batch in a
    // single withTransactionAsync, so a failure anywhere rolls back
    // everything already written by this call, not just the bad statement.
    expect(countVerses(raw)).toBe(0);
  });
});
