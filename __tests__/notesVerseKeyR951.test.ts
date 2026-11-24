/**
 * R9-51 — two notes for one verse.
 *
 * The note id was `note_${Date.now()}_${random}` and the sync keyed on it:
 * two devices that wrote a note for the same verse made two docs the engine
 * never saw as a conflict, the reader showed the lowest `rowid` (each device
 * its own note, forever) and the Notes tab listed both. The fix
 * (`detail/S171-tanda-v5.md` §3, written in `detail/S174-*.md`): the id IS the
 * verse (`vnote:<book>:<chapter>:<verse>`), and a one-time fold turns the old
 * rows into one row per verse, without losing a word, pushed as one batch.
 *
 * Everything here runs on REAL SQLite (`node:sqlite`, in memory) under the
 * real `BibleDatabase` and its real schema (`createSchema`), with the real
 * notes adapter; only the sync engine's queue is watched (`queueWrites`).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {DatabaseSync} from 'node:sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockQueueWrites = jest.fn();
jest.mock('../src/lib/sync/instance', () => ({
  getSyncEngine: () => ({queueWrites: mockQueueWrites}),
  setSyncEngine: jest.fn(),
}));

jest.mock('@lib/database', () => {
  const actual = jest.requireActual('../src/lib/database');
  const instance = new actual.BibleDatabase();
  return {...actual, __esModule: true, default: instance, bibleDB: instance};
});

import bibleDB, {BibleDatabase} from '@lib/database';
import {
  migrateNotesToVerseKeys,
  notesSyncAdapter,
  NOTES_VERSE_KEY_FLAG,
  __resetNotesFoldedForTests,
} from '../src/lib/sync/adapters/notes';
import {mergeNoteTexts} from '../src/lib/notes/verseNoteKey';

/** expo-sqlite's async surface over a synchronous node:sqlite database. */
class NodeSqlite {
  readonly raw = new DatabaseSync(':memory:');
  /** A test can make one statement fail: (sql) => true throws. */
  failWhen: ((sql: string) => boolean) | null = null;

  private check(sql: string) {
    if (this.failWhen?.(sql)) throw new Error('database or disk is full');
  }
  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    this.check(sql);
    return this.raw.prepare(sql).all(...(params as never[])) as T[];
  }
  async getFirstAsync<T>(sql: string, params: unknown[] = []) {
    this.check(sql);
    return (this.raw.prepare(sql).get(...(params as never[])) ?? null) as T;
  }
  async runAsync(sql: string, params: unknown[] = []) {
    this.check(sql);
    const r = this.raw.prepare(sql).run(...(params as never[]));
    return {
      changes: Number(r.changes),
      lastInsertRowId: Number(r.lastInsertRowid),
    };
  }
  async execAsync(sql: string) {
    this.check(sql);
    this.raw.exec(sql);
  }
  async withTransactionAsync(fn: () => Promise<void>) {
    this.raw.exec('BEGIN');
    try {
      await fn();
      this.raw.exec('COMMIT');
    } catch (e) {
      this.raw.exec('ROLLBACK');
      throw e;
    }
  }
}

async function freshDevice(db: BibleDatabase): Promise<NodeSqlite> {
  const sqlite = new NodeSqlite();
  (db as unknown as {db: NodeSqlite}).db = sqlite;
  await (db as unknown as {createSchema(): Promise<void>}).createSchema();
  (db as unknown as {initialized: boolean}).initialized = true;
  return sqlite;
}

// Real data: John 3:16, RVR1960 and KJV, and two notes a user wrote for it.
const RVR = {
  book: 'Juan',
  chapter: 3,
  verse: 16,
  text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
};
const KJV = {
  book: 'John',
  chapter: 3,
  verse: 16,
  text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
};
const NOTA_TELEFONO = 'El amor de Dios no espera a que yo lo merezca.';
const NOTA_TABLETA = 'Leído en el grupo del martes: «todo aquel» me incluye.';

/** A row as the app before the fix wrote it (old id). */
async function oldRow(
  sqlite: NodeSqlite,
  id: string,
  v: typeof RVR,
  note: string,
  createdAt: string,
  updatedAt: string,
) {
  await sqlite.runAsync(
    `INSERT INTO notes (id, book_name, chapter, verse, verse_text, note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, v.book, v.chapter, v.verse, v.text, note, createdAt, updatedAt],
  );
}

function rows(sqlite: NodeSqlite) {
  return sqlite.raw
    .prepare(
      'SELECT id, book_name, note, created_at, updated_at FROM notes ORDER BY id',
    )
    .all() as Array<{
    id: string;
    book_name: string;
    note: string;
    created_at: string;
    updated_at: string;
  }>;
}

let sqlite: NodeSqlite;

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetNotesFoldedForTests();
  mockQueueWrites.mockClear();
  sqlite = await freshDevice(bibleDB);
});

describe('R9-51 — the id is the verse', () => {
  it('vía 1: two devices that write a note for John 3:16 write the SAME doc', async () => {
    const otherDevice = new BibleDatabase();
    await freshDevice(otherDevice);
    const now = '2026-11-24T10:00:00.000Z';
    const idA = await bibleDB.addNote({
      ...RVR,
      note: NOTA_TELEFONO,
      createdAt: now,
      updatedAt: now,
    });
    const idB = await otherDevice.addNote({
      ...KJV,
      note: NOTA_TABLETA,
      createdAt: now,
      updatedAt: now,
    });
    expect(idA).toBe('vnote:John:3:16');
    expect(idB).toBe(idA);
  });

  it('the reader shows the NEWEST note while a verse still holds two rows', async () => {
    await oldRow(
      sqlite,
      'note_1',
      KJV,
      'la vieja',
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );
    await oldRow(
      sqlite,
      'note_2',
      KJV,
      'la nueva',
      '2026-02-01T00:00:00.000Z',
      '2026-03-01T00:00:00.000Z',
    );
    const shown = await bibleDB.getNoteForVerse('Juan', 3, 16);
    expect(shown?.note).toBe('la nueva');
  });
});

describe('R9-51 — the fold (migration), on real SQLite', () => {
  it('vía 2: a «Juan» and a «John» note from before Sprint 58 fold into one, no word lost, one batch', async () => {
    await oldRow(
      sqlite,
      'note_1700000000000_aaaaaaaaa',
      RVR,
      NOTA_TELEFONO,
      '2026-03-01T08:00:00.000Z',
      '2026-03-02T08:00:00.000Z',
    );
    await oldRow(
      sqlite,
      'note_1710000000000_bbbbbbbbb',
      KJV,
      NOTA_TABLETA,
      '2026-04-01T08:00:00.000Z',
      '2026-04-05T08:00:00.000Z',
    );
    await bibleDB.migrateCanonicalBookKeys();
    // Both rows are now «John 3:16»: two notes for one verse on ONE device.
    expect(rows(sqlite).map(r => r.book_name)).toEqual(['John', 'John']);

    await migrateNotesToVerseKeys();

    const after = rows(sqlite);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe('vnote:John:3:16');
    expect(after[0].note).toBe(`${NOTA_TELEFONO}\n\n${NOTA_TABLETA}`);
    expect(after[0].created_at).toBe('2026-03-01T08:00:00.000Z');
    // Bumped: the fold must win on the devices that still hold the old rows.
    expect(after[0].updated_at > '2026-04-05T08:00:00.000Z').toBe(true);
    expect(await AsyncStorage.getItem(NOTES_VERSE_KEY_FLAG)).toBe('1');

    expect(mockQueueWrites).toHaveBeenCalledTimes(1);
    const batch = mockQueueWrites.mock.calls[0][0];
    expect(
      batch.map((w: {id: string; deleted?: boolean}) => [w.id, !!w.deleted]),
    ).toEqual([
      ['vnote:John:3:16', false],
      ['note_1700000000000_aaaaaaaaa', true],
      ['note_1710000000000_bbbbbbbbb', true],
    ]);
    expect(batch[0].data.note).toBe(`${NOTA_TELEFONO}\n\n${NOTA_TABLETA}`);
  });

  it('a single old row is re-keyed with its own dates (nothing new to win with)', async () => {
    await oldRow(
      sqlite,
      'note_1',
      KJV,
      NOTA_TELEFONO,
      '2026-03-01T08:00:00.000Z',
      '2026-03-02T08:00:00.000Z',
    );
    await migrateNotesToVerseKeys();
    expect(rows(sqlite)).toEqual([
      {
        id: 'vnote:John:3:16',
        book_name: 'John',
        note: NOTA_TELEFONO,
        created_at: '2026-03-01T08:00:00.000Z',
        updated_at: '2026-03-02T08:00:00.000Z',
      },
    ]);
  });

  it('re-run: nothing to fold, nothing queued (idempotent), also without the flag', async () => {
    await oldRow(
      sqlite,
      'note_1',
      KJV,
      NOTA_TELEFONO,
      '2026-03-01T08:00:00.000Z',
      '2026-03-02T08:00:00.000Z',
    );
    await oldRow(
      sqlite,
      'note_2',
      KJV,
      NOTA_TABLETA,
      '2026-04-01T08:00:00.000Z',
      '2026-04-02T08:00:00.000Z',
    );
    await migrateNotesToVerseKeys();
    const once = rows(sqlite);
    mockQueueWrites.mockClear();
    await AsyncStorage.removeItem(NOTES_VERSE_KEY_FLAG);
    __resetNotesFoldedForTests();
    await migrateNotesToVerseKeys();
    expect(rows(sqlite)).toEqual(once);
    expect(mockQueueWrites).not.toHaveBeenCalled();
  });

  it('a fold that fails half-way: rolled back, no flag, nothing queued; the next start folds', async () => {
    await oldRow(
      sqlite,
      'note_1',
      KJV,
      NOTA_TELEFONO,
      '2026-03-01T08:00:00.000Z',
      '2026-03-02T08:00:00.000Z',
    );
    await oldRow(
      sqlite,
      'note_2',
      KJV,
      NOTA_TABLETA,
      '2026-04-01T08:00:00.000Z',
      '2026-04-02T08:00:00.000Z',
    );
    const before = rows(sqlite);
    // The verse row is written, then the first old row's DELETE fails.
    sqlite.failWhen = sql => sql.startsWith('DELETE FROM notes WHERE id');
    await expect(migrateNotesToVerseKeys()).rejects.toThrow(/disk is full/);
    expect(rows(sqlite)).toEqual(before);
    expect(await AsyncStorage.getItem(NOTES_VERSE_KEY_FLAG)).toBeNull();
    expect(mockQueueWrites).not.toHaveBeenCalled();

    sqlite.failWhen = null;
    await migrateNotesToVerseKeys();
    expect(rows(sqlite).map(r => r.id)).toEqual(['vnote:John:3:16']);
    expect(mockQueueWrites).toHaveBeenCalledTimes(1);
  });

  it('an edit that lands DURING the fold waits for it, and is refused instead of lost', async () => {
    await oldRow(
      sqlite,
      'note_1',
      KJV,
      NOTA_TELEFONO,
      '2026-03-01T08:00:00.000Z',
      '2026-03-02T08:00:00.000Z',
    );
    await oldRow(
      sqlite,
      'note_2',
      KJV,
      NOTA_TABLETA,
      '2026-04-01T08:00:00.000Z',
      '2026-04-02T08:00:00.000Z',
    );
    // The reader read `note_2` before the fold re-keyed it, and saves now.
    // (An edit that lands BEFORE the fold takes the lock is simply folded in.)
    const fold = bibleDB.foldVerseNotes('2026-11-24T10:00:00.000Z');
    const edit = bibleDB.updateNote('note_2', 'editada a mitad del plegado');
    await expect(edit).rejects.toThrow(/no note with id note_2/);
    await fold;
    expect(rows(sqlite).map(r => r.note)).toEqual([
      `${NOTA_TELEFONO}\n\n${NOTA_TABLETA}`,
    ]);
  });
});

describe('R9-51 — the adapter, inbound', () => {
  const remote = (note: string, createdAt: number, updatedAt: number) => ({
    book: 'John',
    chapter: 3,
    verse: 16,
    text: KJV.text,
    note,
    createdAt,
    updatedAt,
  });

  it('before this device folds, an old id is written as before (the fold takes it later)', async () => {
    await notesSyncAdapter.applyRemoteUpsert(
      'note_9',
      remote(NOTA_TABLETA, 1_700_000_000_000, 1_700_000_000_000),
    );
    expect(rows(sqlite).map(r => r.id)).toEqual(['note_9']);
  });

  it('after the fold, an old id folds into the verse row, twice is once, and nothing is pushed back', async () => {
    const now = '2026-11-24T10:00:00.000Z';
    await bibleDB.addNote({
      ...KJV,
      note: NOTA_TELEFONO,
      createdAt: now,
      updatedAt: now,
    });
    await migrateNotesToVerseKeys();
    mockQueueWrites.mockClear();

    const old = remote(
      NOTA_TABLETA,
      Date.parse('2026-04-01T00:00:00Z'),
      Date.parse('2026-04-02T00:00:00Z'),
    );
    await notesSyncAdapter.applyRemoteUpsert('note_9', old);
    const once = rows(sqlite);
    expect(once).toHaveLength(1);
    expect(once[0].id).toBe('vnote:John:3:16');
    // Oldest first: the tablet's note was written before this one.
    expect(once[0].note).toBe(`${NOTA_TABLETA}\n\n${NOTA_TELEFONO}`);

    await notesSyncAdapter.applyRemoteUpsert('note_9', old);
    expect(rows(sqlite)).toEqual(once);
    expect(mockQueueWrites).not.toHaveBeenCalled();
  });

  it("vía 1 after a sync: each device folds the other's note the same way, and both converge", async () => {
    // Before the fix both devices hold both old rows (synced both ways).
    const other = new BibleDatabase();
    const otherSqlite = await freshDevice(other);
    for (const s of [sqlite, otherSqlite]) {
      await oldRow(
        s,
        'note_A',
        RVR,
        NOTA_TELEFONO,
        '2026-03-01T08:00:00.000Z',
        '2026-03-01T08:00:00.000Z',
      );
      await oldRow(
        s,
        'note_B',
        KJV,
        NOTA_TABLETA,
        '2026-03-05T08:00:00.000Z',
        '2026-03-05T08:00:00.000Z',
      );
    }
    await bibleDB.migrateCanonicalBookKeys();
    const a = await bibleDB.foldVerseNotes('2026-11-24T10:00:00.000Z');
    await AsyncStorage.clear(); // the other device's own flag
    await other.migrateCanonicalBookKeys();
    const b = await other.foldVerseNotes('2026-11-24T11:00:00.000Z');
    expect(a.written.map(n => [n.id, n.note])).toEqual(
      b.written.map(n => [n.id, n.note]),
    );
    expect(rows(sqlite).map(r => r.note)).toEqual(
      rows(otherSqlite).map(r => r.note),
    );
  });
});

describe('R9-51 — mergeNoteTexts', () => {
  it('keeps every distinct text, oldest first, and drops one already contained', () => {
    expect(
      mergeNoteTexts([
        {note: 'b', createdAt: '2026-02'},
        {note: 'a', createdAt: '2026-01'},
        {note: 'a', createdAt: '2026-03'},
      ]),
    ).toBe('a\n\nb');
    // Folding a note into a fold that already holds it changes nothing.
    expect(
      mergeNoteTexts([
        {note: 'a', createdAt: '2026-01'},
        {note: 'a\n\nb', createdAt: '2026-05'},
      ]),
    ).toBe('a\n\nb');
  });
});
