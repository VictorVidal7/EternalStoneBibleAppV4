import {applyTestamentFilter} from '../src/lib/search/testamentFilter';
import type {BibleVerse} from '../src/types/bible';

function verse(book: string, chapter = 1, n = 1): BibleVerse {
  return {
    id: `${book}-${chapter}-${n}`,
    book,
    bookNumber: 0,
    chapter,
    verse: n,
    text: 'sample',
    version: 'RVR1960',
  };
}

describe('applyTestamentFilter', () => {
  const mixed = [
    verse('Génesis'),
    verse('Salmos'),
    verse('Mateo'),
    verse('Apocalipsis'),
    verse('Genesis'), // English variant
    verse('Psalms'),
    verse('Matthew'),
    verse('Revelation'),
  ];

  it("'all' returns every input row", () => {
    expect(applyTestamentFilter(mixed, 'all')).toHaveLength(mixed.length);
  });

  it("'old' includes OT books in both Spanish and English forms", () => {
    const oldBooks = applyTestamentFilter(mixed, 'old').map(v => v.book);
    expect(oldBooks).toEqual(
      expect.arrayContaining(['Génesis', 'Salmos', 'Genesis', 'Psalms']),
    );
    expect(oldBooks).not.toEqual(
      expect.arrayContaining(['Mateo', 'Apocalipsis']),
    );
  });

  it("'new' includes NT books in both languages and excludes OT books", () => {
    const newBooks = applyTestamentFilter(mixed, 'new').map(v => v.book);
    expect(newBooks).toEqual(
      expect.arrayContaining(['Mateo', 'Apocalipsis', 'Matthew', 'Revelation']),
    );
    expect(newBooks).not.toEqual(expect.arrayContaining(['Génesis', 'Psalms']));
  });

  it('OT + NT counts add up to "all" when every book is known', () => {
    const total = applyTestamentFilter(mixed, 'all').length;
    const ot = applyTestamentFilter(mixed, 'old').length;
    const nt = applyTestamentFilter(mixed, 'new').length;
    expect(ot + nt).toBe(total);
  });

  it('unknown books fall into NT so they stay searchable', () => {
    const unknown = [verse('Definitely Not A Book')];
    expect(applyTestamentFilter(unknown, 'old')).toHaveLength(0);
    expect(applyTestamentFilter(unknown, 'new')).toHaveLength(1);
  });

  it('handles a numeric-prefixed book ("1 Samuel" is OT)', () => {
    const input = [verse('1 Samuel'), verse('1 John')];
    expect(applyTestamentFilter(input, 'old').map(v => v.book)).toEqual([
      '1 Samuel',
    ]);
    expect(applyTestamentFilter(input, 'new').map(v => v.book)).toEqual([
      '1 John',
    ]);
  });

  it('preserves the input order', () => {
    const ordered = [verse('Génesis', 1, 1), verse('Salmos', 23, 1)];
    const result = applyTestamentFilter(ordered, 'old');
    expect(result.map(v => v.book)).toEqual(['Génesis', 'Salmos']);
  });

  it('does not mutate the input array', () => {
    const before = [...mixed];
    applyTestamentFilter(mixed, 'old');
    expect(mixed).toEqual(before);
  });
});
