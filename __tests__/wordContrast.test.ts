import {
  normalizeWord,
  markDivergentWords,
  sameLanguage,
  divergentWordCount,
} from '../src/lib/comparison/wordContrast';

describe('normalizeWord', () => {
  it('lowercases and strips the comparison punctuation', () => {
    expect(normalizeWord('World,')).toBe('world');
    expect(normalizeWord('"Love!"')).toBe('love');
    expect(normalizeWord('¿Quién?')).toBe('quién');
    expect(normalizeWord('(God)')).toBe('god');
  });

  it('reduces a punctuation-only token to an empty string', () => {
    expect(normalizeWord('...')).toBe('');
    expect(normalizeWord('!?')).toBe('');
  });
});

describe('markDivergentWords', () => {
  const common = new Set(['for', 'god', 'so', 'the', 'world']);

  it('flags only the words missing from the shared set', () => {
    const tokens = markDivergentWords('For God so loved the world', common);
    const words = tokens.filter(t => t.isWord);
    expect(words.map(w => w.text)).toEqual([
      'For',
      'God',
      'so',
      'loved',
      'the',
      'world',
    ]);
    // "loved" is the only word not in `common`.
    expect(words.filter(w => w.divergent).map(w => w.text)).toEqual(['loved']);
  });

  it('preserves whitespace verbatim as non-divergent tokens', () => {
    const tokens = markDivergentWords('God  so', common);
    expect(tokens.map(t => t.text)).toEqual(['God', '  ', 'so']);
    expect(tokens[1]).toEqual({text: '  ', isWord: false, divergent: false});
  });

  it('matches words ignoring case + punctuation (like the analysis)', () => {
    const tokens = markDivergentWords('WORLD, the.', common);
    // both normalize into the shared set → not divergent
    expect(tokens.filter(t => t.isWord).every(w => !w.divergent)).toBe(true);
  });

  it('never flags a token that normalizes to empty (stripped punctuation)', () => {
    const tokens = markDivergentWords('God ... world', common);
    const dots = tokens.find(t => t.text === '...');
    expect(dots?.isWord).toBe(true);
    expect(dots?.divergent).toBe(false);
  });

  it('returns [] for empty text', () => {
    expect(markDivergentWords('', common)).toEqual([]);
  });
});

describe('sameLanguage', () => {
  it('is true when every version shares a language (KJV/WEB)', () => {
    expect(sameLanguage(['en', 'en'])).toBe(true);
    expect(sameLanguage(['en'])).toBe(true);
  });

  it('is false across languages (KJV/RVR1960) or with no versions', () => {
    expect(sameLanguage(['en', 'es'])).toBe(false);
    expect(sameLanguage([])).toBe(false);
  });
});

describe('divergentWordCount', () => {
  it('counts only divergent word tokens', () => {
    const common = new Set(['the', 'world']);
    const tokens = markDivergentWords('the whole world now', common);
    expect(divergentWordCount(tokens)).toBe(2); // "whole" + "now"
  });
});
