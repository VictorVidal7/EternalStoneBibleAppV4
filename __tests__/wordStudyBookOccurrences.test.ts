/**
 * Bug fix (see strongsOccurrencesByBookDb.test.ts for the full root-cause
 * writeup) — this file covers the two facade layers above the new DB method:
 *
 *  - `originals.getStrongsOccurrencesByBook`: the defensive async wrapper
 *    (never throws; empty array when the Strong's key is invalid or the DB
 *    call fails), mirroring the existing `getStrongsConcordance` pattern.
 *  - `wordStudy.getWordStudyBookOccurrences`: the thin, purely-additive
 *    pass-through the word-study screen calls when a distribution bar is
 *    tapped, INSTEAD of narrowing `WordStudy.occurrences` client-side.
 *
 * Both are exercised together against one mocked `@lib/database` default
 * export, since `getWordStudyBookOccurrences` calls the REAL
 * `originals.getStrongsOccurrencesByBook` underneath it — this also proves
 * the "purely additive" claim: nothing about `getWordStudy`'s own shape is
 * touched by this chain.
 */

const mockGetStrongsOccurrencesByBook = jest.fn();

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getStrongsOccurrencesByBook: (...args: unknown[]) =>
      mockGetStrongsOccurrencesByBook(...args),
  },
}));

import {getStrongsOccurrencesByBook} from '../src/features/study/originals';
import {getWordStudyBookOccurrences} from '../src/features/study/wordStudy';

describe('originals.getStrongsOccurrencesByBook', () => {
  beforeEach(() => {
    mockGetStrongsOccurrencesByBook.mockReset();
  });

  it('delegates to bibleDB with the trimmed Strongs key, book id and (optional) limit', async () => {
    mockGetStrongsOccurrencesByBook.mockResolvedValue([
      {book_id: 44, chapter: 2, verse: 36, word: 'κύριον'},
    ]);

    const occs = await getStrongsOccurrencesByBook('G2962', 44);

    expect(mockGetStrongsOccurrencesByBook).toHaveBeenCalledWith(
      'G2962',
      44,
      undefined,
    );
    expect(occs).toEqual([
      {book_id: 44, chapter: 2, verse: 36, word: 'κύριον'},
    ]);
  });

  it('forwards an explicit limit override', async () => {
    mockGetStrongsOccurrencesByBook.mockResolvedValue([]);
    await getStrongsOccurrencesByBook('G2962', 44, 50);
    expect(mockGetStrongsOccurrencesByBook).toHaveBeenCalledWith(
      'G2962',
      44,
      50,
    );
  });

  it('returns [] without touching the DB for a non-lexicon key (defensive, mirrors getStrongsConcordance)', async () => {
    const occs = await getStrongsOccurrencesByBook('not-a-strongs-number', 44);
    expect(occs).toEqual([]);
    expect(mockGetStrongsOccurrencesByBook).not.toHaveBeenCalled();
  });

  it('returns [] instead of throwing when the DB call fails (pack not installed)', async () => {
    mockGetStrongsOccurrencesByBook.mockRejectedValue(
      new Error('no such table: original_words'),
    );
    const occs = await getStrongsOccurrencesByBook('G2962', 44);
    expect(occs).toEqual([]);
  });
});

describe('wordStudy.getWordStudyBookOccurrences', () => {
  beforeEach(() => {
    mockGetStrongsOccurrencesByBook.mockReset();
  });

  it('is a purely-additive pass-through to the scoped originals facade', async () => {
    mockGetStrongsOccurrencesByBook.mockResolvedValue([
      {book_id: 44, chapter: 1, verse: 24, word: 'κύριε'},
    ]);

    const occs = await getWordStudyBookOccurrences('G2962', 44);

    expect(mockGetStrongsOccurrencesByBook).toHaveBeenCalledWith(
      'G2962',
      44,
      undefined,
    );
    expect(occs).toEqual([{book_id: 44, chapter: 1, verse: 24, word: 'κύριε'}]);
  });

  it('degrades to [] (never throws) when the underlying facade fails', async () => {
    mockGetStrongsOccurrencesByBook.mockRejectedValue(new Error('boom'));
    await expect(getWordStudyBookOccurrences('G2962', 44)).resolves.toEqual([]);
  });
});
