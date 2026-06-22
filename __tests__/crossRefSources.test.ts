import {
  outRowToKey,
  inRowToKey,
  outRowsToKeys,
  inRowsToKeys,
  mergeRefKeys,
} from '../src/features/study/crossRefSources';
import type {CrossRefOut, CrossRefIn} from '../src/lib/database';

const out = (
  to_book: number,
  to_chapter: number,
  to_verse: number,
  votes = 1,
  to_verse_end: number | null = null,
): CrossRefOut => ({to_book, to_chapter, to_verse, to_verse_end, votes});

const inc = (
  from_book: number,
  from_chapter: number,
  from_verse: number,
  votes = 1,
): CrossRefIn => ({from_book, from_chapter, from_verse, votes});

describe('crossRefSources — DB rows ↔ canonical keys + merge', () => {
  describe('outRowToKey / inRowToKey', () => {
    it('maps a book_id to its canonical English key', () => {
      // 45 = Romans, 43 = John, 1 = Genesis.
      expect(outRowToKey(out(45, 5, 8))).toBe('Romans/5/8');
      expect(outRowToKey(out(43, 1, 1))).toBe('John/1/1');
      expect(inRowToKey(inc(1, 1, 1))).toBe('Genesis/1/1');
    });

    it('ignores the range end + votes for the key (start verse only)', () => {
      expect(outRowToKey(out(43, 10, 27, 270, 30))).toBe('John/10/27');
    });

    it('returns null for an unknown book_id', () => {
      expect(outRowToKey(out(999, 1, 1))).toBeNull();
      expect(inRowToKey(inc(0, 1, 1))).toBeNull();
    });
  });

  describe('outRowsToKeys / inRowsToKeys', () => {
    it('maps and drops rows whose book is unknown', () => {
      expect(
        outRowsToKeys([out(45, 5, 8), out(999, 1, 1), out(43, 1, 1)]),
      ).toEqual(['Romans/5/8', 'John/1/1']);
      expect(inRowsToKeys([inc(1, 1, 1), inc(999, 2, 2)])).toEqual([
        'Genesis/1/1',
      ]);
    });

    it('tolerates an empty / nullish list', () => {
      expect(outRowsToKeys([])).toEqual([]);
      // @ts-expect-error — defensive against a nullish argument at runtime.
      expect(inRowsToKeys(undefined)).toEqual([]);
    });
  });

  describe('mergeRefKeys', () => {
    it('keeps the curated layer first, then the web, deduped', () => {
      expect(
        mergeRefKeys(
          ['Romans/5/8', 'John/1/14'],
          ['John/11/25', 'Romans/8/32'],
        ),
      ).toEqual(['Romans/5/8', 'John/1/14', 'John/11/25', 'Romans/8/32']);
    });

    it('a key in BOTH layers keeps its curated (earlier) position', () => {
      expect(
        mergeRefKeys(['Romans/5/8', 'John/1/14'], ['John/1/14', 'John/11/25']),
      ).toEqual(['Romans/5/8', 'John/1/14', 'John/11/25']);
    });

    it('drops a key equal to focus and skips non-strings', () => {
      expect(
        mergeRefKeys(
          ['John/3/16', 'Romans/5/8'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ['John/3/16', null as any, 'John/3/15'],
          'John/3/16',
        ),
      ).toEqual(['Romans/5/8', 'John/3/15']);
    });

    it('tolerates nullish inputs', () => {
      // @ts-expect-error — defensive against nullish layers at runtime.
      expect(mergeRefKeys(undefined, undefined)).toEqual([]);
    });
  });
});
