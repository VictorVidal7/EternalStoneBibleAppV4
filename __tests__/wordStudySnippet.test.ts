/**
 * Tanda 7a — `wordStudy.getOccurrenceSnippet` + `occurrenceSnippetKey`, the
 * facade the word-study screen calls to resolve a bounded window of verse
 * snippets under each occurrence row. Mocks `@lib/database` directly
 * (mirroring `wordStudyBookOccurrences.test.ts`'s pattern) so the exact
 * `bibleDB.getVerse(book_id, chapter, verse, version)` call shape — the one
 * detail the screen-level tests can't see, since they mock
 * `getOccurrenceSnippet` itself away — is pinned here.
 */

const mockGetVerse = jest.fn();

jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    getVerse: (...args: unknown[]) => mockGetVerse(...args),
  },
}));

import {
  getOccurrenceSnippet,
  occurrenceSnippetKey,
} from '../src/features/study/wordStudy';

describe('wordStudy.getOccurrenceSnippet', () => {
  beforeEach(() => {
    mockGetVerse.mockReset();
  });

  it('calls bibleDB.getVerse with the occurrence book_id/chapter/verse and the given version', async () => {
    mockGetVerse.mockResolvedValue({text: 'En el principio...'});

    const text = await getOccurrenceSnippet(
      {book_id: 1, chapter: 1, verse: 1},
      'RVR1960',
    );

    expect(mockGetVerse).toHaveBeenCalledWith(1, 1, 1, 'RVR1960');
    expect(text).toBe('En el principio...');
  });

  it('resolves null when the verse/version row is missing', async () => {
    mockGetVerse.mockResolvedValue(null);
    const text = await getOccurrenceSnippet(
      {book_id: 66, chapter: 22, verse: 21},
      'WEB',
    );
    expect(text).toBeNull();
  });

  it('resolves null instead of throwing when the DB call fails', async () => {
    mockGetVerse.mockRejectedValue(new Error('database not initialized'));
    const text = await getOccurrenceSnippet(
      {book_id: 43, chapter: 3, verse: 16},
      'RVR1960',
    );
    expect(text).toBeNull();
  });
});

describe('wordStudy.occurrenceSnippetKey', () => {
  it('joins book_id/chapter/verse into a stable cache key', () => {
    expect(occurrenceSnippetKey({book_id: 43, chapter: 3, verse: 16})).toBe(
      '43-3-16',
    );
  });

  it('produces distinct keys for distinct verses', () => {
    const a = occurrenceSnippetKey({book_id: 43, chapter: 3, verse: 16});
    const b = occurrenceSnippetKey({book_id: 43, chapter: 3, verse: 17});
    expect(a).not.toBe(b);
  });
});
