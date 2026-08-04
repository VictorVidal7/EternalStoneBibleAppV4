import {
  dedupeAndPrepend,
  findSuperseded,
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

  it('collapses different translations of the same verse into one entry', () => {
    // (book strings reflect the stored DB book name, which differs per
    // version — Genesis vs Génesis. dedupeAndPrepend compares on the
    // canonical book identity — see canonicalBookName — so bookmarking the
    // same verse while reading two different-language versions produces
    // one entry, not two. Sprint 58 bug class, same fix as favorites /
    // highlights / notes / audio bookmarks.)
    const en = bm({id: 'en', book: 'Genesis', chapter: 1, verse: 1});
    const es = bm({id: 'es', book: 'Génesis', chapter: 1, verse: 1});
    const next = dedupeAndPrepend([en], es);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe('es');
  });
});

describe('findSuperseded', () => {
  // These mirror the dedupeAndPrepend cases above — the whole point of
  // findSuperseded is that it identifies exactly the entries
  // dedupeAndPrepend is about to drop, so a caller (BookmarksContext)
  // can queueDelete their old Firestore docs.
  it('returns empty when the candidate does not collide with anything', () => {
    const a = bm({id: 'a', book: 'John', chapter: 3, verse: 16});
    const b = bm({id: 'b', book: 'Romans', chapter: 8, verse: 28});
    expect(findSuperseded([a], b)).toEqual([]);
  });

  it('finds the exact-verse entry a re-bookmark would replace', () => {
    const original = bm({id: 'old', book: 'John', chapter: 3, verse: 16});
    const updated = bm({id: 'new', book: 'John', chapter: 3, verse: 16});
    const superseded = findSuperseded([original], updated);
    expect(superseded).toHaveLength(1);
    expect(superseded[0].id).toBe('old');
  });

  it('does not flag a different verse in the same chapter', () => {
    const a = bm({id: 'a', book: 'John', chapter: 3, verse: 16});
    const b = bm({id: 'b', book: 'John', chapter: 3, verse: 17});
    expect(findSuperseded([a], b)).toEqual([]);
  });

  it('finds the entry across version-language book names (the canonicalization gap)', () => {
    // Same scenario dedupeAndPrepend's cross-translation test covers: the
    // OLD entry was bookmarked reading the English version ('Genesis'),
    // the candidate comes from re-bookmarking the same verse while
    // reading the Spanish version ('Génesis'). This is precisely the case
    // that leaves a stale Firestore doc behind if the caller does not
    // queueDelete the id this function returns.
    const en = bm({id: 'en', book: 'Genesis', chapter: 1, verse: 1});
    const es = bm({id: 'es', book: 'Génesis', chapter: 1, verse: 1});
    const superseded = findSuperseded([en], es);
    expect(superseded).toHaveLength(1);
    expect(superseded[0].id).toBe('en');
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

  it('finds a match across version languages via the canonical book name', () => {
    // list holds the English-canonical 'John'; querying with the Spanish
    // reading-version name 'Juan' must still report a hit.
    expect(isBookmarkedAt(list, 'Juan', 3, 16)).toBe(true);
    expect(isBookmarkedAt(list, 'Génesis', 1, 1)).toBe(true);
  });
});
