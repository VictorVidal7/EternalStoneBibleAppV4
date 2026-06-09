import {
  booksInResults,
  applyBookFilter,
  shouldFetchFullBook,
  resolveDisplayedResults,
} from '../src/lib/search/bookFilter';

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

describe('shouldFetchFullBook', () => {
  it('fetches only when a book is selected AND more rows may exist', () => {
    expect(shouldFetchFullBook('John', true)).toBe(true);
  });

  it('does not fetch when no book is selected', () => {
    expect(shouldFetchFullBook(null, true)).toBe(false);
  });

  it('does not fetch when the result set is fully loaded', () => {
    // !hasMore ⇒ the loaded set is complete, so narrowing it is already global.
    expect(shouldFetchFullBook('John', false)).toBe(false);
  });
});

describe('resolveDisplayedResults', () => {
  const johnFull: Row[] = [
    {book: 'John', bookNumber: 43},
    {book: 'John', bookNumber: 43},
    {book: 'John', bookNumber: 43},
    {book: 'John', bookNumber: 43}, // more than the 3 loaded
  ];

  it('returns all loaded results when no book is selected', () => {
    expect(resolveDisplayedResults(rows, null, null)).toHaveLength(rows.length);
  });

  it('narrows the loaded set when no full set is fetched yet', () => {
    const out = resolveDisplayedResults(rows, 'John', null);
    expect(out).toHaveLength(3);
  });

  it('shows the FULL DB set when it matches the selected book', () => {
    const out = resolveDisplayedResults(rows, 'John', {
      book: 'John',
      verses: johnFull,
    });
    expect(out).toHaveLength(4); // reaches the match beyond the loaded pages
    expect(out).not.toBe(johnFull); // returns a copy
  });

  it('ignores a stale full set fetched for a different book', () => {
    // User switched from John → Psalms before the John fetch resolved.
    const out = resolveDisplayedResults(rows, 'Psalms', {
      book: 'John',
      verses: johnFull,
    });
    expect(out).toHaveLength(1); // falls back to narrowing the loaded set
    expect(out[0].book).toBe('Psalms');
  });
});
