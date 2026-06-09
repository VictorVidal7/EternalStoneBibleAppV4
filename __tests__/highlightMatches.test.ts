import {highlightMatches} from '../src/lib/search/highlightMatches';

const joined = (text: string, query: string) =>
  highlightMatches(text, query)
    .map(s => s.text)
    .join('');

const highlighted = (text: string, query: string) =>
  highlightMatches(text, query)
    .filter(s => s.highlight)
    .map(s => s.text);

describe('highlightMatches', () => {
  it('returns the whole text unhighlighted for an empty query', () => {
    const segs = highlightMatches('For God so loved', '   ');
    expect(segs).toEqual([{text: 'For God so loved', highlight: false}]);
  });

  it('highlights a matched word and leaves the rest plain', () => {
    const segs = highlightMatches('For God so loved the world', 'God');
    expect(segs).toEqual([
      {text: 'For ', highlight: false},
      {text: 'God', highlight: true},
      {text: ' so loved the world', highlight: false},
    ]);
  });

  it('always reconstructs the original text verbatim (accents preserved)', () => {
    expect(joined('Porque de tal manera amó Dios', 'amo')).toBe(
      'Porque de tal manera amó Dios',
    );
  });

  it('is diacritic-insensitive but keeps the accents in the slice', () => {
    // query without accent highlights the accented occurrence...
    expect(highlighted('el Espíritu Santo', 'espiritu')).toEqual(['Espíritu']);
    // ...and the displayed text retains its accent.
    expect(joined('el Espíritu Santo', 'espiritu')).toBe('el Espíritu Santo');
  });

  it('highlights every query word and merges overlaps', () => {
    expect(highlighted('faith hope and love', 'faith love')).toEqual([
      'faith',
      'love',
    ]);
  });

  it('matches case-insensitively', () => {
    expect(highlighted('LOVE conquers all', 'love')).toEqual(['LOVE']);
  });

  it('returns the whole text plain when nothing matches', () => {
    expect(highlightMatches('grace and truth', 'xyz')).toEqual([
      {text: 'grace and truth', highlight: false},
    ]);
  });
});
