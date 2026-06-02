import {localizedVerseReference} from '../src/lib/reading/verseReference';

describe('localizedVerseReference', () => {
  it('localizes a Spanish-stored book name to English when language=en', () => {
    // RVR1960 rows store "Juan"; the immersive reader must show "John" to match
    // the normal reader header (the S59 Juan/John cosmetic fix).
    expect(
      localizedVerseReference({book: 'Juan', chapter: 3, verse: 16}, 'en'),
    ).toBe('John 3:16');
  });

  it('keeps the Spanish name when language=es', () => {
    expect(
      localizedVerseReference({book: 'Juan', chapter: 3, verse: 16}, 'es'),
    ).toBe('Juan 3:16');
  });

  it('localizes an English-stored book name to Spanish when language=es', () => {
    expect(
      localizedVerseReference({book: 'Genesis', chapter: 1, verse: 1}, 'es'),
    ).toBe('Génesis 1:1');
  });

  it('passes English-stored names through unchanged when language=en', () => {
    expect(
      localizedVerseReference({book: 'Genesis', chapter: 1, verse: 1}, 'en'),
    ).toBe('Genesis 1:1');
  });

  it('falls back to the raw stored name for an unknown book', () => {
    expect(
      localizedVerseReference({book: 'Nephi', chapter: 2, verse: 4}, 'en'),
    ).toBe('Nephi 2:4');
  });

  it('returns an empty string for a missing verse', () => {
    expect(localizedVerseReference(undefined, 'en')).toBe('');
    expect(localizedVerseReference(null, 'es')).toBe('');
  });
});
