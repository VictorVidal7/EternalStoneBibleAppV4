import {
  buildCollections,
  collectionNames,
  addToCollection,
  removeFromCollection,
  isInCollection,
  normalizeCollectionName,
  favoriteVerseId,
  type CollectionFavoriteLike,
} from '../src/features/collections/collections';

const FAVS: CollectionFavoriteLike[] = [
  {
    book: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved...',
    tags: ['Promises', 'Love'],
    updatedAt: 300,
  },
  {
    book: 'Psalms',
    chapter: 23,
    verse: 1,
    text: 'The Lord is my shepherd...',
    tags: ['Comfort'],
    updatedAt: 200,
  },
  {
    book: 'Romans',
    chapter: 8,
    verse: 28,
    text: 'All things work together...',
    tags: ['promises'], // same collection as 'Promises', different case
    updatedAt: 400,
  },
  {
    book: 'Genesis',
    chapter: 1,
    verse: 1,
    text: 'In the beginning...',
    tags: [], // no collection
    updatedAt: 500,
  },
];

describe('buildCollections', () => {
  it('groups favorites by tag, case-insensitively', () => {
    const cols = buildCollections(FAVS);
    const promises = cols.find(c => c.name.toLowerCase() === 'promises');
    expect(promises?.count).toBe(2); // John 3:16 + Romans 8:28
    expect(promises?.verses.map(v => v.book)).toEqual(['Romans', 'John']); // newest-first
  });

  it('uses the FIRST-seen casing as the display name', () => {
    const cols = buildCollections(FAVS);
    // 'Promises' (updatedAt 300) is seen before 'promises' (400)? No — order
    // of favorites: John(Promises) comes before Romans(promises), so display
    // name is 'Promises'.
    expect(cols.find(c => c.count === 2)?.name).toBe('Promises');
  });

  it('orders collections newest-first by their most recent verse', () => {
    const cols = buildCollections(FAVS);
    // Promises has Romans@400 → updatedAt 400; Comfort@200; Love@300.
    expect(cols.map(c => c.name)).toEqual(['Promises', 'Love', 'Comfort']);
  });

  it('excludes favorites with no tags and ignores blank tags', () => {
    const cols = buildCollections([
      {book: 'A', chapter: 1, verse: 1, text: 'x', tags: ['  ', '']},
      {book: 'B', chapter: 1, verse: 1, text: 'y'},
    ]);
    expect(cols).toEqual([]);
  });
});

describe('collectionNames', () => {
  it('returns distinct names sorted alphabetically', () => {
    expect(collectionNames(FAVS)).toEqual(['Comfort', 'Love', 'Promises']);
  });
});

describe('addToCollection / removeFromCollection / isInCollection', () => {
  it('adds a new tag, returning a new array', () => {
    const tags = ['Love'];
    const next = addToCollection(tags, 'Hope');
    expect(next).toEqual(['Love', 'Hope']);
    expect(tags).toEqual(['Love']); // unmutated
  });

  it('is a no-op for a blank or duplicate (case-insensitive) name', () => {
    expect(addToCollection(['Love'], '  ')).toEqual(['Love']);
    expect(addToCollection(['Love'], 'love')).toEqual(['Love']);
  });

  it('handles a null/undefined tag list', () => {
    expect(addToCollection(null, 'Hope')).toEqual(['Hope']);
    expect(addToCollection(undefined, 'Hope')).toEqual(['Hope']);
  });

  it('removes case-insensitively', () => {
    expect(removeFromCollection(['Love', 'Hope'], 'love')).toEqual(['Hope']);
    expect(removeFromCollection(['Love'], 'Missing')).toEqual(['Love']);
  });

  it('reports membership case-insensitively', () => {
    expect(isInCollection(['Promises'], 'promises')).toBe(true);
    expect(isInCollection(['Promises'], 'Comfort')).toBe(false);
    expect(isInCollection(null, 'x')).toBe(false);
  });
});

describe('normalizeCollectionName', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeCollectionName('  My   List ')).toBe('My List');
    expect(normalizeCollectionName('   ')).toBe('');
  });
});

describe('favoriteVerseId (reader add-to-collection flow, Sprint 68)', () => {
  it('matches the FavoritesContext verseId format', () => {
    // FavoritesContext keys favorites as `${canonicalBook}_${chapter}_${verse}`;
    // the reader must compose the same string to resolve/create the favorite.
    expect(favoriteVerseId('John', 3, 16)).toBe('John_3_16');
    expect(favoriteVerseId('Genesis', 1, 1)).toBe('Genesis_1_1');
  });

  it('resolves a favorite by verseId and adds a tag to a fresh favorite', () => {
    // Simulate adding the first selected verse to a collection from the reader:
    // a just-favorited (untagged) verse is found by its verseId, then tagged.
    const store = [
      {
        id: 'fav_1',
        verseId: favoriteVerseId('John', 3, 16),
        tags: [] as string[],
      },
    ];
    const target = favoriteVerseId('John', 3, 16);
    const fav = store.find(f => f.verseId === target);
    expect(fav).toBeDefined();

    const nextTags = addToCollection(fav!.tags, 'Promises');
    expect(nextTags).toEqual(['Promises']);
    expect(isInCollection(nextTags, 'promises')).toBe(true);
  });
});
