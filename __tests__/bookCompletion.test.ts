import {
  isBookComplete,
  detectCompletedBooks,
  gospelsComplete,
  GOSPELS,
  TOTAL_BIBLE_BOOKS,
  CHAPTER_COMPLETE_THRESHOLD,
  type BookProgressMap,
} from '../src/lib/achievements/bookCompletion';
import {BIBLE_BOOKS, getBookByName} from '../src/constants/bible';

const chaptersOf = (book: string): number | undefined =>
  getBookByName(book)?.chapters;

/** Build a "fully read" chapter map for a book with `n` chapters. */
function fullBook(n: number, pct = 100): Record<string, number> {
  const out: Record<string, number> = {};
  for (let c = 1; c <= n; c++) out[String(c)] = pct;
  return out;
}

describe('isBookComplete', () => {
  it('is true when every chapter is at or above the threshold', () => {
    expect(isBookComplete(fullBook(3, 100), 3)).toBe(true);
    expect(isBookComplete(fullBook(3, CHAPTER_COMPLETE_THRESHOLD), 3)).toBe(
      true,
    );
  });

  it('is false when any chapter is below the threshold', () => {
    const map = fullBook(3, 100);
    map['2'] = CHAPTER_COMPLETE_THRESHOLD - 1;
    expect(isBookComplete(map, 3)).toBe(false);
  });

  it('is false when a chapter is missing entirely', () => {
    const map = fullBook(3);
    delete map['3'];
    expect(isBookComplete(map, 3)).toBe(false);
  });

  it('accepts numeric chapter keys as well as string keys', () => {
    expect(isBookComplete({1: 100, 2: 95, 3: 100}, 3)).toBe(true);
  });

  it('is false for a zero / missing / NaN chapter count', () => {
    expect(isBookComplete(fullBook(1), 0)).toBe(false);
    expect(isBookComplete(fullBook(1), undefined)).toBe(false);
    expect(isBookComplete(fullBook(1), Number.NaN)).toBe(false);
  });

  it('never throws on a malformed chapter map', () => {
    expect(isBookComplete(null, 3)).toBe(false);
    expect(isBookComplete(undefined, 3)).toBe(false);
    // a non-finite percent counts as not-read
    expect(isBookComplete({1: Number.POSITIVE_INFINITY}, 1)).toBe(false);
  });

  it('honours a custom threshold', () => {
    expect(isBookComplete({1: 80}, 1, 75)).toBe(true);
    expect(isBookComplete({1: 80}, 1, 90)).toBe(false);
  });

  it('treats a single-chapter book read to 100 as complete (live recipe: Jude)', () => {
    const jude = getBookByName('Jude');
    expect(jude?.chapters).toBe(1);
    expect(isBookComplete({1: 100}, jude?.chapters)).toBe(true);
  });
});

describe('detectCompletedBooks', () => {
  const map: BookProgressMap = {
    Jude: {1: 100}, // 1 chapter → complete
    Obadiah: {1: 95}, // 1 chapter → complete
    Genesis: fullBook(10, 100), // 50 chapters, only 10 read → incomplete
    John: fullBook(21, 100), // 21 chapters → complete
  };

  it('returns exactly the books that are fully read', () => {
    const completed = detectCompletedBooks(map, chaptersOf);
    expect(new Set(completed)).toEqual(new Set(['Jude', 'Obadiah', 'John']));
  });

  it('skips a book whose name does not resolve to a chapter count', () => {
    const completed = detectCompletedBooks({Nonexistent: {1: 100}}, chaptersOf);
    expect(completed).toEqual([]);
  });

  it('returns [] for an empty / null / malformed map and never throws', () => {
    expect(detectCompletedBooks({}, chaptersOf)).toEqual([]);
    expect(detectCompletedBooks(null, chaptersOf)).toEqual([]);
    expect(detectCompletedBooks(undefined, chaptersOf)).toEqual([]);
  });
});

describe('gospelsComplete', () => {
  it('is true only when all four Gospels are present', () => {
    expect(gospelsComplete(['Matthew', 'Mark', 'Luke', 'John'])).toBe(true);
    expect(gospelsComplete(new Set(GOSPELS))).toBe(true);
  });

  it('is false when any Gospel is missing', () => {
    expect(gospelsComplete(['Matthew', 'Mark', 'Luke'])).toBe(false);
    expect(gospelsComplete([])).toBe(false);
    expect(gospelsComplete(['Genesis', 'Psalms'])).toBe(false);
  });
});

describe('canonical sanity', () => {
  it('every Gospel name resolves to a real NT book in the table', () => {
    for (const gospel of GOSPELS) {
      const book = getBookByName(gospel);
      expect(book).toBeDefined();
      expect(book?.nameEn).toBe(gospel);
      expect(book?.testament).toBe('new');
    }
  });

  it('TOTAL_BIBLE_BOOKS matches the static book table', () => {
    expect(TOTAL_BIBLE_BOOKS).toBe(BIBLE_BOOKS.length);
  });
});
