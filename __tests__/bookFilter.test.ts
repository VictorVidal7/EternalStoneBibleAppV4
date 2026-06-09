import {booksInResults, applyBookFilter} from '../src/lib/search/bookFilter';

type Row = {book: string; bookNumber: number};

const rows: Row[] = [
  {book: 'John', bookNumber: 43},
  {book: 'Genesis', bookNumber: 1},
  {book: 'John', bookNumber: 43},
  {book: 'Psalms', bookNumber: 19},
  {book: 'John', bookNumber: 43},
];

describe('booksInResults', () => {
  it('lists distinct books in canonical order with counts', () => {
    expect(booksInResults(rows)).toEqual([
      {book: 'Genesis', bookNumber: 1, count: 1},
      {book: 'Psalms', bookNumber: 19, count: 1},
      {book: 'John', bookNumber: 43, count: 3},
    ]);
  });

  it('returns an empty list for no results', () => {
    expect(booksInResults([])).toEqual([]);
  });
});

describe('applyBookFilter', () => {
  it('returns all results (a copy) when no book is selected', () => {
    const out = applyBookFilter(rows, null);
    expect(out).toHaveLength(rows.length);
    expect(out).not.toBe(rows);
  });

  it('keeps only the verses in the chosen book', () => {
    const out = applyBookFilter(rows, 'John');
    expect(out).toHaveLength(3);
    expect(out.every(r => r.book === 'John')).toBe(true);
  });

  it('yields nothing for a book not in the results', () => {
    expect(applyBookFilter(rows, 'Romans')).toEqual([]);
  });
});
