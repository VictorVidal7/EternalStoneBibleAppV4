import {
  bookChartLabel,
  buildBookBars,
  distinctBookCount,
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
});
