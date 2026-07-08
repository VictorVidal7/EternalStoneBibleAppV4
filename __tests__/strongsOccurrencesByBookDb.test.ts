/**
 * Bug fix — "Estudio de palabra" (word study) distribution-bar tap-to-filter
 * showed an empty list for books that sort late in the canon (e.g. Hechos),
 * even though the bar itself displayed a nonzero count. Root cause:
 * `getStrongsOccurrences` (the concordance's occurrence list) is capped
 * GLOBALLY in canonical `book_id` order — for a common word, earlier books
 * (Mateo, Marcos, Lucas...) can fill the whole cap before the query ever
 * reaches a later book's rows, so that book is entirely absent from the
 * capped array. The old UI then filtered that already-capped, already-
 * truncated array client-side, which can never recover the missing rows.
 *
 * `getStrongsOccurrencesByBook` (src/lib/database/index.ts) is the fix at the
 * data layer: it scopes the WHERE clause to ONE book before the LIMIT
 * applies, so a book's own rows can never be crowded out by canonically
 * earlier books. This file exercises that method directly against a fake
 * SQLite handle, mirroring the FakeSqliteHandle idiom already established in
 * chapterVerseCount.test.ts / databaseMigrations.test.ts.
 */
import {BibleDatabase} from '../src/lib/database';

interface WordRow {
  strongs: string;
  book_id: number;
  chapter: number;
  verse: number;
  position: number;
  word: string;
}

class FakeOriginalWordsHandle {
  rows: WordRow[] = [];
  lastParams: unknown[] = [];

  async getAllAsync<T>(_sql: string, params: unknown[]): Promise<T[]> {
    this.lastParams = params;
    const [strongs, bookId, limit] = params as [string, number, number];
    return this.rows
      .filter(r => r.strongs === strongs && r.book_id === bookId)
      .sort(
        (a, b) =>
          a.chapter - b.chapter || a.verse - b.verse || a.position - b.position,
      )
      .slice(0, limit)
      .map(r => ({
        book_id: r.book_id,
        chapter: r.chapter,
        verse: r.verse,
        word: r.word,
      })) as unknown as T[];
  }
}

/**
 * A BibleDatabase whose private `db` field is the fake above, with
 * `initialized` forced `true` so the method's own `await this.initialize()`
 * (mirroring its siblings `getStrongsOccurrences`/`getOriginalWords`) short-
 * circuits instead of trying to open a real native SQLite connection under
 * Jest — same injection idiom as chapterVerseCount.test.ts/
 * databaseMigrations.test.ts, extended to cover an initialize()-calling
 * method (those existing fixtures only cover methods that call `getDb()`
 * directly).
 */
function makeDb(): {db: BibleDatabase; fake: FakeOriginalWordsHandle} {
  const fake = new FakeOriginalWordsHandle();
  const db = new BibleDatabase();
  (db as unknown as {db: FakeOriginalWordsHandle; initialized: boolean}).db =
    fake;
  (db as unknown as {initialized: boolean}).initialized = true;
  return {db, fake};
}

describe('BibleDatabase.getStrongsOccurrencesByBook', () => {
  it('scopes to WHERE strongs = ? AND book_id = ?, ordered by chapter/verse/position', async () => {
    const {db, fake} = makeDb();
    fake.rows = [
      {
        strongs: 'G2962',
        book_id: 44,
        chapter: 2,
        verse: 36,
        position: 3,
        word: 'κύριον',
      },
      {
        strongs: 'G2962',
        book_id: 44,
        chapter: 1,
        verse: 24,
        position: 1,
        word: 'κύριε',
      },
      {
        // Different book — must not leak into the Hechos(44) result.
        strongs: 'G2962',
        book_id: 40,
        chapter: 1,
        verse: 20,
        position: 1,
        word: 'κυρίου',
      },
      {
        // Different Strong's number — must not leak either.
        strongs: 'G25',
        book_id: 44,
        chapter: 1,
        verse: 1,
        position: 1,
        word: 'ἀγαπητέ',
      },
    ];

    const occs = await db.getStrongsOccurrencesByBook('G2962', 44);

    expect(occs).toEqual([
      {book_id: 44, chapter: 1, verse: 24, word: 'κύριε'},
      {book_id: 44, chapter: 2, verse: 36, word: 'κύριον'},
    ]);
  });

  it("does not starve a later-canon book's occurrences the way the global canonical-order cap can (the root cause this method fixes)", async () => {
    const {db, fake} = makeDb();
    // Simulate κύριος: an earlier book (Mateo, book 40) alone fills a
    // 200-row-style global cap before the query would ever reach Hechos —
    // the OLD client-side filter of that capped array would show nothing
    // for Hechos even though it has a real occurrence. Scoping the WHERE
    // clause to book_id up front means this fixture's single Hechos row is
    // never at risk of being crowded out by the 190 Mateo rows above it.
    fake.rows = [
      ...Array.from({length: 190}, (_, i) => ({
        strongs: 'G2962',
        book_id: 40,
        chapter: 1,
        verse: i + 1,
        position: 1,
        word: 'κύριε',
      })),
      {
        strongs: 'G2962',
        book_id: 44,
        chapter: 2,
        verse: 36,
        position: 1,
        word: 'κύριον',
      },
    ];

    const occs = await db.getStrongsOccurrencesByBook('G2962', 44);

    expect(occs).toHaveLength(1);
    expect(occs[0]).toMatchObject({book_id: 44, chapter: 2, verse: 36});
  });

  it("trims whitespace from the Strong's number, like its sibling queries", async () => {
    const {db, fake} = makeDb();
    fake.rows = [
      {
        strongs: 'G2962',
        book_id: 44,
        chapter: 2,
        verse: 36,
        position: 1,
        word: 'κύριον',
      },
    ];

    const occs = await db.getStrongsOccurrencesByBook('  G2962  ', 44);
    expect(occs).toHaveLength(1);
  });

  it('defaults the defensive cap to 500 (mirrors getStrongsOccurrences) when not overridden', async () => {
    const {db, fake} = makeDb();
    await db.getStrongsOccurrencesByBook('G2962', 44);
    expect(fake.lastParams[2]).toBe(500);
  });

  it('respects an explicit limit override', async () => {
    const {db, fake} = makeDb();
    fake.rows = Array.from({length: 5}, (_, i) => ({
      strongs: 'G2532',
      book_id: 42,
      chapter: 1,
      verse: i + 1,
      position: 1,
      word: 'καί',
    }));

    const occs = await db.getStrongsOccurrencesByBook('G2532', 42, 3);
    expect(occs).toHaveLength(3);
  });

  it('returns an empty array for a book with no occurrences of the given Strongs number', async () => {
    const {db, fake} = makeDb();
    fake.rows = [
      {
        strongs: 'G2962',
        book_id: 40,
        chapter: 1,
        verse: 1,
        position: 1,
        word: 'κύριος',
      },
    ];

    const occs = await db.getStrongsOccurrencesByBook('G2962', 44);
    expect(occs).toEqual([]);
  });
});
