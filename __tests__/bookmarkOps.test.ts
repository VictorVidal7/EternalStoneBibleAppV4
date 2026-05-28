import {
  dedupeAndPrepend,
  isBookmarkedAt,
  removeById,
  renameById,
} from '../src/context/bookmarkOps';
import type {Bookmark} from '../src/context/BookmarksContext';

function bm(over: Partial<Bookmark> & {id: string}): Bookmark {
  return {
    book: 'Genesis',
    chapter: 1,
    verse: 1,
    text: 'In the beginning…',
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

describe('dedupeAndPrepend', () => {
  it('prepends a new bookmark on top of the list', () => {
    const a = bm({id: 'a', book: 'John', chapter: 3, verse: 16});
    const b = bm({id: 'b', book: 'Romans', chapter: 8, verse: 28});
    const next = dedupeAndPrepend([a], b);
    expect(next.map(x => x.id)).toEqual(['b', 'a']);
  });

  it('replaces an existing entry on the same exact verse', () => {
    const original = bm({
      id: 'old',
      book: 'John',
      chapter: 3,
      verse: 16,
      label: 'first try',
      createdAt: 1,
    });
    const updated = bm({
      id: 'new',
      book: 'John',
      chapter: 3,
      verse: 16,
      label: 'renamed',
      createdAt: 2,
    });
    const next = dedupeAndPrepend([original], updated);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('new');
    expect(next[0].label).toBe('renamed');
  });

  it('treats different verses on the same chapter as distinct', () => {
    const a = bm({id: 'a', book: 'John', chapter: 3, verse: 16});
    const b = bm({id: 'b', book: 'John', chapter: 3, verse: 17});
    const next = dedupeAndPrepend([a], b);
    expect(next).toHaveLength(2);
  });

  it('treats different translations of the same verse as distinct', () => {
    // (book strings reflect the stored DB book name, which differs per
    // version — Genesis vs Génesis. dedupe is a string equality check.)
    const en = bm({id: 'en', book: 'Genesis', chapter: 1, verse: 1});
    const es = bm({id: 'es', book: 'Génesis', chapter: 1, verse: 1});
    const next = dedupeAndPrepend([en], es);
    expect(next).toHaveLength(2);
  });
});

describe('removeById', () => {
  it('drops a single entry by id', () => {
    const list = [bm({id: 'a'}), bm({id: 'b'}), bm({id: 'c'})];
    expect(removeById(list, 'b').map(x => x.id)).toEqual(['a', 'c']);
  });

  it('returns the list unchanged when id is missing', () => {
    const list = [bm({id: 'a'})];
    const next = removeById(list, 'missing');
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('a');
  });
});

describe('renameById', () => {
  it('updates only the matching entry', () => {
    const list = [bm({id: 'a', label: 'old'}), bm({id: 'b', label: 'keep'})];
    const next = renameById(list, 'a', 'new label');
    expect(next.find(x => x.id === 'a')?.label).toBe('new label');
    expect(next.find(x => x.id === 'b')?.label).toBe('keep');
  });

  it('returns the list unchanged when id is missing', () => {
    const list = [bm({id: 'a', label: 'untouched'})];
    const next = renameById(list, 'missing', 'whatever');
    expect(next[0].label).toBe('untouched');
  });
});

describe('isBookmarkedAt', () => {
  const list = [
    bm({id: 'a', book: 'John', chapter: 3, verse: 16}),
    bm({id: 'b', book: 'Genesis', chapter: 1, verse: 1}),
  ];

  it('reports membership for the exact reference', () => {
    expect(isBookmarkedAt(list, 'John', 3, 16)).toBe(true);
    expect(isBookmarkedAt(list, 'Genesis', 1, 1)).toBe(true);
  });

  it('rejects near misses', () => {
    expect(isBookmarkedAt(list, 'John', 3, 17)).toBe(false);
    expect(isBookmarkedAt(list, 'John', 4, 16)).toBe(false);
    expect(isBookmarkedAt(list, 'Romans', 3, 16)).toBe(false);
  });
});
