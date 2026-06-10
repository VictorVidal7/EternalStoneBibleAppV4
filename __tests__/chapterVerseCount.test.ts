/**
 * Sprint 76 — per-chapter verse COUNT APIs on BibleDatabase.
 *
 * Exercises the REAL methods against a minimal in-memory fake of the
 * expo-sqlite handle (mirrors the FakeDb idiom in syncBookCompletion.test.ts):
 * the fake holds verse rows and interprets exactly the two COUNT queries the
 * new methods issue, so the SQL parameter packing and result mapping are what
 * is under test.
 */
import {BibleDatabase, chapterCountKey} from '../src/lib/database';

interface VerseRow {
  book_id: number;
  chapter: number;
  version: string;
}

class FakeSqliteHandle {
  rows: VerseRow[] = [];
  firstCalls = 0;
  allCalls = 0;

  seedChapter(
    bookId: number,
    chapter: number,
    version: string,
    verses: number,
  ): void {
    for (let v = 1; v <= verses; v++) {
      this.rows.push({book_id: bookId, chapter, version});
    }
  }

  // Version matches case-insensitively, like the LOWER(version) = LOWER(?)
  // the real queries use (the table stores 'RVR1960', ids travel 'rvr1960').
  private countOf(bookId: number, chapter: number, version: string): number {
    return this.rows.filter(
      r =>
        r.book_id === bookId &&
        r.chapter === chapter &&
        r.version.toLowerCase() === version.toLowerCase(),
    ).length;
  }

  // SELECT COUNT(*) ... WHERE book_id = ? AND chapter = ? AND version = ?
  async getFirstAsync<T>(_sql: string, params: unknown[]): Promise<T | null> {
    this.firstCalls++;
    const [bookId, chapter, version] = params as [number, number, string];
    return {count: this.countOf(bookId, chapter, version)} as T;
  }

  // SELECT book_id, chapter, COUNT(*) ... WHERE version = ? AND ((pairs)…)
  // GROUP BY book_id, chapter — empty groups produce no row, like SQL.
  async getAllAsync<T>(_sql: string, params: unknown[]): Promise<T[]> {
    this.allCalls++;
    const [version, ...pairs] = params as [string, ...number[]];
    const out: Array<{book_id: number; chapter: number; count: number}> = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const count = this.countOf(pairs[i], pairs[i + 1], version);
      if (count > 0) {
        out.push({book_id: pairs[i], chapter: pairs[i + 1], count});
      }
    }
    return out as T[];
  }
}

function makeDb(): {db: BibleDatabase; handle: FakeSqliteHandle} {
  const handle = new FakeSqliteHandle();
  const db = new BibleDatabase();
  (db as unknown as {db: FakeSqliteHandle}).db = handle;
  return {db, handle};
}

describe('chapterCountKey', () => {
  it('keys by bookId:chapter', () => {
    expect(chapterCountKey(19, 119)).toBe('19:119');
  });
});

describe('getChapterVerseCount', () => {
  it('returns the real verse count of the chapter', async () => {
    const {db, handle} = makeDb();
    handle.seedChapter(19, 119, 'rvr1960', 176);
    handle.seedChapter(19, 117, 'rvr1960', 2);

    await expect(db.getChapterVerseCount(19, 119, 'rvr1960')).resolves.toBe(
      176,
    );
    await expect(db.getChapterVerseCount(19, 117, 'rvr1960')).resolves.toBe(2);
  });

  it('returns 0 for a chapter or version missing from the table', async () => {
    const {db, handle} = makeDb();
    handle.seedChapter(19, 119, 'rvr1960', 176);

    await expect(db.getChapterVerseCount(19, 120, 'rvr1960')).resolves.toBe(0);
    await expect(db.getChapterVerseCount(19, 119, 'kjv')).resolves.toBe(0);
  });

  it('matches the stored version case-insensitively', async () => {
    // The table stores 'RVR1960' (uppercase); version IDs travel 'rvr1960'.
    const {db, handle} = makeDb();
    handle.seedChapter(19, 119, 'RVR1960', 176);

    await expect(db.getChapterVerseCount(19, 119, 'rvr1960')).resolves.toBe(
      176,
    );
  });
});

describe('getChapterVerseCounts (batch)', () => {
  it('counts every requested chapter in ONE query, keyed by chapterCountKey', async () => {
    const {db, handle} = makeDb();
    handle.seedChapter(19, 119, 'kjv', 176);
    handle.seedChapter(19, 120, 'kjv', 7);
    handle.seedChapter(20, 1, 'kjv', 33);

    const counts = await db.getChapterVerseCounts(
      [
        {bookId: 19, chapter: 119},
        {bookId: 19, chapter: 120},
        {bookId: 20, chapter: 1},
      ],
      'kjv',
    );

    expect(handle.allCalls).toBe(1);
    expect(counts.get(chapterCountKey(19, 119))).toBe(176);
    expect(counts.get(chapterCountKey(19, 120))).toBe(7);
    expect(counts.get(chapterCountKey(20, 1))).toBe(33);
  });

  it('omits chapters absent from the verses table', async () => {
    const {db, handle} = makeDb();
    handle.seedChapter(19, 119, 'kjv', 176);

    const counts = await db.getChapterVerseCounts(
      [
        {bookId: 19, chapter: 119},
        {bookId: 66, chapter: 23}, // beyond the canon — no rows
      ],
      'kjv',
    );

    expect(counts.size).toBe(1);
    expect(counts.has(chapterCountKey(66, 23))).toBe(false);
  });

  it('respects the version filter', async () => {
    const {db, handle} = makeDb();
    handle.seedChapter(43, 3, 'kjv', 36);
    handle.seedChapter(43, 3, 'rvr1960', 36);
    handle.seedChapter(43, 4, 'kjv', 54);

    const counts = await db.getChapterVerseCounts(
      [
        {bookId: 43, chapter: 3},
        {bookId: 43, chapter: 4},
      ],
      'rvr1960',
    );

    expect(counts.get(chapterCountKey(43, 3))).toBe(36);
    expect(counts.has(chapterCountKey(43, 4))).toBe(false);
  });

  it('resolves to an empty map without touching the DB on an empty batch', async () => {
    // No fake handle injected: the early return must win before getDb()
    // would throw "Database not initialized".
    const db = new BibleDatabase();
    await expect(db.getChapterVerseCounts([], 'kjv')).resolves.toEqual(
      new Map(),
    );
  });
});
