/**
 * Tanda 5 — Bible-dictionary v1-factual data layer (schema + seed + accessor
 * only; no UI wiring yet, see project_essb-premium-audit-pastors-teachers).
 *
 * Exercises the REAL `seedDictionaryV1IfNeeded` / `getDictionaryEntry`
 * against the REAL bundled `assets/dictionary-v1-es.json` (produced by
 * `scripts/build-dictionary-v1-es.js` from the 10 approved
 * `v1-translation-*.md` source files) through a fake in-memory SQLite
 * handle — same "fake handle, real business logic" idiom already
 * established in strongsOccurrencesByBookDb.test.ts / databaseMigrations.test.ts.
 * Deliberately does NOT re-implement a fixture copy of the 10 entries: the
 * whole point is to catch a real ingestion bug (a truncated article, a
 * dropped entry, a bad slug) rather than just confirming the plumbing works
 * against hand-written test data.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {BibleDatabase, DictionaryEntry} from '../index';

type BundledEntry = {
  slug: string;
  headwordEs: string;
  glossEs: string;
  articleEs: string;
  sourceTier: string;
  treatment: string;
};
const BUNDLED: BundledEntry[] = require('../../../../assets/dictionary-v1-es.json');

interface DictRow {
  slug: string;
  headword_es: string;
  gloss_es: string;
  article_es: string;
  source_tier: string;
  treatment: string;
  updated_at: string | null;
}

/** In-memory stand-in for the SQLite handle, faithful enough to exercise
 *  the real `seedDictionaryV1IfNeeded` (DELETE + per-row INSERT inside a
 *  transaction) and `getDictionaryEntry` (SELECT by slug) control flow. */
class FakeDictHandle {
  rows: DictRow[] = [];

  async runAsync(
    sql: string,
    params: unknown[] = [],
  ): Promise<{changes: number; lastInsertRowId: number}> {
    const s = sql.trim();
    if (/^DELETE FROM dictionary_entries/i.test(s)) {
      this.rows = [];
      return {changes: 0, lastInsertRowId: 0};
    }
    if (/^INSERT INTO dictionary_entries/i.test(s)) {
      const [
        slug,
        headword_es,
        gloss_es,
        article_es,
        source_tier,
        treatment,
        updated_at,
      ] = params as [
        string,
        string,
        string,
        string,
        string,
        string,
        string | null,
      ];
      this.rows.push({
        slug,
        headword_es,
        gloss_es,
        article_es,
        source_tier,
        treatment,
        updated_at,
      });
      return {changes: 1, lastInsertRowId: 0};
    }
    throw new Error(
      `FakeDictHandle.runAsync: unhandled statement: ${s.slice(0, 80)}`,
    );
  }

  async getFirstAsync<T>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | null> {
    const s = sql.trim();
    if (/FROM dictionary_entries\s+WHERE slug = \?/i.test(s)) {
      const [slug] = params as [string];
      const row = this.rows.find(r => r.slug === slug);
      return (row ?? null) as T | null;
    }
    throw new Error(
      `FakeDictHandle.getFirstAsync: unhandled query: ${s.slice(0, 80)}`,
    );
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }
}

/** A BibleDatabase whose private `db` field is the fake above. `initialized`
 *  is forced `true` so `getDictionaryEntry`'s own `await this.initialize()`
 *  short-circuits instead of trying to open a real native SQLite connection
 *  under Jest (same injection idiom as strongsOccurrencesByBookDb.test.ts).
 *  `seedDictionaryV1IfNeeded` itself only calls `this.getDb()` directly (it
 *  runs as part of `_performInitialization`, before `initialized` flips), so
 *  it doesn't need that flag to be exercised directly. */
function makeDb(): {db: BibleDatabase; fake: FakeDictHandle} {
  const fake = new FakeDictHandle();
  const db = new BibleDatabase();
  (db as unknown as {db: FakeDictHandle; initialized: boolean}).db = fake;
  (db as unknown as {initialized: boolean}).initialized = true;
  return {db, fake};
}

function privateApi(db: BibleDatabase) {
  return db as unknown as {
    seedDictionaryV1IfNeeded(): Promise<void>;
  };
}

describe('dictionary-v1-es.json (bundled asset)', () => {
  it('has exactly the 10 approved v1-factual entries, each with all fields populated', () => {
    expect(BUNDLED).toHaveLength(10);
    expect(BUNDLED.map(e => e.slug).sort()).toEqual([
      'aaron',
      'belen',
      'galilea',
      'jerico',
      'jornada-sabado',
      'josue',
      'nazaret',
      'sanedrin',
      'sinagoga',
      'tiro',
    ]);
    for (const e of BUNDLED) {
      expect(e.headwordEs.length).toBeGreaterThan(0);
      expect(e.glossEs.length).toBeGreaterThan(0);
      expect(e.articleEs.length).toBeGreaterThan(0);
      expect(e.sourceTier).toBe('v1-factual');
      expect(e.treatment).toBe('as-is');
    }
  });

  it('normalizes the pilot filename (poc-nazaret) to slug "nazaret", not "poc-nazaret"', () => {
    expect(BUNDLED.some(e => e.slug === 'nazaret')).toBe(true);
    expect(BUNDLED.some(e => e.slug === 'poc-nazaret')).toBe(false);
  });
});

describe('seedDictionaryV1IfNeeded', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('inserts all 10 bundled entries into dictionary_entries', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV1IfNeeded();

    expect(fake.rows).toHaveLength(10);
    expect(fake.rows.map(r => r.slug).sort()).toEqual(
      BUNDLED.map(e => e.slug).sort(),
    );
    for (const row of fake.rows) {
      expect(row.gloss_es.length).toBeGreaterThan(0);
      expect(row.article_es.length).toBeGreaterThan(0);
      expect(row.source_tier).toBe('v1-factual');
      expect(row.treatment).toBe('as-is');
    }
  });

  it('is versioned: a second call is a no-op once the version flag is set (does not duplicate or re-touch rows)', async () => {
    const {db, fake} = makeDb();
    await privateApi(db).seedDictionaryV1IfNeeded();
    expect(fake.rows).toHaveLength(10);

    // Simulate stale/edited data sitting in the table between app launches.
    fake.rows[0].gloss_es = 'stale-marker';

    await privateApi(db).seedDictionaryV1IfNeeded();

    expect(fake.rows).toHaveLength(10); // not doubled
    expect(fake.rows[0].gloss_es).toBe('stale-marker'); // untouched — flag short-circuited
  });

  it('re-seeds from scratch when the stored version differs (a future version bump)', async () => {
    await AsyncStorage.setItem('@dictionary_v1_loaded_version', '0');
    const {db, fake} = makeDb();

    await privateApi(db).seedDictionaryV1IfNeeded();

    expect(fake.rows).toHaveLength(10);
    expect(await AsyncStorage.getItem('@dictionary_v1_loaded_version')).toBe(
      '1',
    );
  });

  it('does not throw when the underlying db operation fails (graceful, matches seedStrongsDefsIfNeeded)', async () => {
    const {db, fake} = makeDb();
    fake.withTransactionAsync = async () => {
      throw new Error('simulated failure');
    };

    await expect(
      privateApi(db).seedDictionaryV1IfNeeded(),
    ).resolves.not.toThrow();
    expect(
      await AsyncStorage.getItem('@dictionary_v1_loaded_version'),
    ).toBeNull(); // never marked "done" — a future launch can retry
  });
});

describe('getDictionaryEntry', () => {
  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('returns null for an unknown slug', async () => {
    const {db} = makeDb();
    await privateApi(db).seedDictionaryV1IfNeeded();

    expect(await db.getDictionaryEntry('does-not-exist')).toBeNull();
  });

  it('returns non-empty gloss_es and article_es for real slugs (nazaret and josué, the longest entry — a truncation stress case)', async () => {
    const {db} = makeDb();
    await privateApi(db).seedDictionaryV1IfNeeded();

    const nazaret = (await db.getDictionaryEntry('nazaret')) as DictionaryEntry;
    expect(nazaret).not.toBeNull();
    expect(nazaret.headword_es).toBe('NAZARET');
    expect(nazaret.gloss_es.length).toBeGreaterThan(0);
    expect(nazaret.article_es).not.toBeNull();
    expect((nazaret.article_es as string).length).toBeGreaterThan(0);

    const josue = (await db.getDictionaryEntry('josue')) as DictionaryEntry;
    expect(josue).not.toBeNull();
    expect(josue.gloss_es.length).toBeGreaterThan(0);
    expect(josue.article_es).not.toBeNull();
    // Josué is still the longest v1 entry even excluding its addendum —
    // assert against its actual bundled length rather than a hardcoded
    // number, so this stays a real non-truncation check even if the source
    // translation is revised.
    const bundledJosue = BUNDLED.find(e => e.slug === 'josue')!;
    expect((josue.article_es as string).length).toBe(
      bundledJosue.articleEs.length,
    );
    expect((josue.article_es as string).length).toBeGreaterThan(30000);
    // The "Josué, hijo de Josadac" addendum is about a DIFFERENT biblical
    // person (a high priest under Zerubbabel, confirmed against the 1915
    // ISBE source as a separately-signed article, not a subsection of this
    // one) — excluded from the article, not silently merged in. See
    // scripts/build-dictionary-v1-es.js's addendum handling.
    expect(josue.article_es).not.toContain('ADDENDUM');
    expect(josue.article_es).not.toContain('David Francis Roberts');
    expect(josue.article_es).toContain('A. S. Geden');
  });

  it('trims whitespace from the slug, like the Strong’s accessor it mirrors', async () => {
    const {db} = makeDb();
    await privateApi(db).seedDictionaryV1IfNeeded();

    const entry = await db.getDictionaryEntry('  tiro  ');
    expect(entry).not.toBeNull();
    expect(entry!.slug).toBe('tiro');
  });
});
