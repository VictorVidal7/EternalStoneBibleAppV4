import {
  buildCollectionCard,
  truncateVerse,
  type CollectionCardVerse,
} from '../src/features/collections/collectionCard';

const VERSES: CollectionCardVerse[] = [
  {reference: 'John 3:16', text: 'For God so loved the world'},
  {reference: 'Psalm 23:1', text: 'The Lord is my shepherd'},
  {reference: 'Romans 8:28', text: 'All things work together for good'},
  {reference: 'Philippians 4:13', text: 'I can do all things through Christ'},
];

describe('truncateVerse', () => {
  it('leaves short text untouched (only collapsing whitespace)', () => {
    expect(truncateVerse('  Hello   world ', 90)).toBe('Hello world');
  });

  it('truncates long text on a word boundary with an ellipsis', () => {
    const out = truncateVerse('one two three four five six seven', 12);
    expect(out.endsWith('…')).toBe(true);
    expect(out.length).toBeLessThanOrEqual(13); // 12 + the ellipsis
    expect(out).not.toContain('  ');
  });

  it('falls back to a hard cut when there is no early word boundary', () => {
    const out = truncateVerse('Supercalifragilisticexpialidocious', 10);
    expect(out).toBe('Supercalif…');
  });
});

describe('buildCollectionCard', () => {
  it('keeps the FULL count but previews only the first maxVerses', () => {
    const card = buildCollectionCard('Promises', VERSES);
    expect(card.name).toBe('Promises');
    expect(card.count).toBe(4); // full count
    expect(card.verses).toHaveLength(3); // default preview cap
    expect(card.verses.map(v => v.reference)).toEqual([
      'John 3:16',
      'Psalm 23:1',
      'Romans 8:28',
    ]);
  });

  it('truncates each preview verse to maxChars', () => {
    const card = buildCollectionCard('X', VERSES, {maxVerses: 1, maxChars: 10});
    expect(card.verses[0].text.endsWith('…')).toBe(true);
    expect(card.verses[0].text.length).toBeLessThanOrEqual(11);
  });

  it('is defensive: a non-positive maxVerses keeps the count but previews none', () => {
    const card = buildCollectionCard('Empty', VERSES, {maxVerses: 0});
    expect(card.count).toBe(4);
    expect(card.verses).toEqual([]);
  });

  it('handles an empty collection', () => {
    const card = buildCollectionCard('None', []);
    expect(card).toEqual({name: 'None', count: 0, verses: []});
  });
});
