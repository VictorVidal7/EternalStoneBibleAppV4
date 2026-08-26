import {
  bookChartLabel,
  buildBookBars,
  distinctBookCount,
  testamentTotals,
  type StrongsBookCount,
} from '../src/features/study/wordStudy';

describe('wordStudy — pure helpers', () => {
  describe('bookChartLabel', () => {
    it('returns the Spanish abbreviation for es', () => {
      expect(bookChartLabel(1, 'es')).toBe('Gn');
      expect(bookChartLabel(43, 'es')).toBe('Jn');
      expect(bookChartLabel(45, 'es')).toBe('Ro');
    });
    it('returns the English abbreviation for en', () => {
      expect(bookChartLabel(1, 'en')).toBe('Gen');
      expect(bookChartLabel(43, 'en')).toBe('Joh');
      expect(bookChartLabel(45, 'en')).toBe('Rom');
    });
    it('falls back to #id for an unknown book', () => {
      expect(bookChartLabel(999, 'en')).toBe('#999');
    });
  });

  describe('buildBookBars', () => {
    const dist: StrongsBookCount[] = [
      {book_id: 1, count: 3}, // Genesis
      {book_id: 40, count: 10}, // Matthew
      {book_id: 43, count: 25}, // John
      {book_id: 45, count: 7}, // Romans
    ];

    it('orders bars tallest first, labelled by abbreviation', () => {
      const bars = buildBookBars(dist, 'en');
      expect(bars.map(b => b.label)).toEqual(['Joh', 'Mat', 'Rom', 'Gen']);
      expect(bars.map(b => b.value)).toEqual([25, 10, 7, 3]);
    });

    it('caps to `max` books (the rest is left off, total lives in header)', () => {
      const bars = buildBookBars(dist, 'en', 2);
      expect(bars).toHaveLength(2);
      expect(bars.map(b => b.label)).toEqual(['Joh', 'Mat']);
    });

    it('breaks count ties canonically (lower book_id first)', () => {
      const tied: StrongsBookCount[] = [
        {book_id: 45, count: 5},
        {book_id: 40, count: 5},
        {book_id: 1, count: 5},
      ];
      expect(buildBookBars(tied, 'es').map(b => b.label)).toEqual([
        'Gn',
        'Mt',
        'Ro',
      ]);
    });

    it('handles an empty distribution', () => {
      expect(buildBookBars([], 'en')).toEqual([]);
    });

    it('tags each bar with its book_id (Ficha #14 — tap-to-filter)', () => {
      const bars = buildBookBars(dist, 'en');
      expect(bars.map(b => b.book_id)).toEqual([43, 40, 45, 1]);
    });

    it('tags each bar with its testament (T: word-study-testament-split)', () => {
      const bars = buildBookBars(dist, 'en');
      // Order is tallest-first: John(new), Matthew(new), Romans(new), Genesis(old).
      expect(bars.map(b => b.testament)).toEqual(['new', 'new', 'new', 'old']);
    });

    it('defaults an unrecognized book_id to old testament', () => {
      const bars = buildBookBars([{book_id: 999, count: 1}], 'en');
      expect(bars[0].testament).toBe('old');
    });
  });

  describe('distinctBookCount', () => {
    it('counts the distribution rows (one per book)', () => {
      expect(
        distinctBookCount([
          {book_id: 1, count: 3},
          {book_id: 43, count: 25},
        ]),
      ).toBe(2);
      expect(distinctBookCount([])).toBe(0);
    });
  });

  describe('testamentTotals', () => {
    it('sums occurrences per testament across the FULL distribution', () => {
      const dist: StrongsBookCount[] = [
        {book_id: 1, count: 3}, // Genesis — old
        {book_id: 40, count: 10}, // Matthew — new
        {book_id: 43, count: 25}, // John — new
        {book_id: 45, count: 7}, // Romans — new
      ];
      expect(testamentTotals(dist)).toEqual({old: 3, new: 42});
    });

    it('is honest beyond the top-8 chart cap — sums the FULL distribution, not buildBookBars output', () => {
      // 9 Old Testament books, each with 1 occurrence: buildBookBars(…, 8)
      // would only chart 8 of them, but the totals must still count all 9.
      const dist: StrongsBookCount[] = Array.from({length: 9}, (_, i) => ({
        book_id: i + 1, // book ids 1-9 are all Old Testament (Génesis…Rut area)
        count: 1,
      }));
      expect(testamentTotals(dist)).toEqual({old: 9, new: 0});
    });

    it('reads as fully one-testament for a word confined to one side of the canon (not a bug)', () => {
      expect(testamentTotals([{book_id: 23, count: 248}])).toEqual({
        old: 248,
        new: 0,
      });
    });

    it('returns zeroes for an empty distribution', () => {
      expect(testamentTotals([])).toEqual({old: 0, new: 0});
    });
  });
});
