import {
  normalizeWord,
  markDivergentWords,
  sameLanguage,
  divergentWordCount,
  commonWordsForVersions,
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

describe('commonWordsForVersions', () => {
  it('returns the words shared by every version (KJV ∩ WEB), normalized', () => {
    const common = commonWordsForVersions([
      'For God so loved the world, that he gave his only begotten Son',
      'For God so loved the world, that he gave his one and only Son',
    ]);
    // shared words survive (lower-cased, punctuation stripped)
    expect(common.has('god')).toBe(true);
    expect(common.has('world')).toBe(true);
    expect(common.has('only')).toBe(true);
    // each version's divergent words are excluded
    expect(common.has('begotten')).toBe(false); // KJV only
    expect(common.has('one')).toBe(false); // WEB only
    expect(common.has('and')).toBe(false); // WEB only
  });

  it('intersects across three versions', () => {
    const common = commonWordsForVersions([
      'the quick fox',
      'the slow fox',
      'the red fox',
    ]);
    expect([...common].sort()).toEqual(['fox', 'the']);
  });

  it('returns an empty set for no versions', () => {
    expect(commonWordsForVersions([]).size).toBe(0);
  });

  it('treats a single version as all-shared (its own words)', () => {
    const common = commonWordsForVersions(['Love, joy; PEACE!']);
    expect([...common].sort()).toEqual(['joy', 'love', 'peace']);
  });

  it('feeds markDivergentWords so each verse highlights its non-shared words (multi-verse)', () => {
    // The exact pipeline the multi-verse mode uses per comparison row.
    const kjv = 'whosoever believeth in him';
    const web = 'whoever believes in him';
    const common = commonWordsForVersions([kjv, web]);

    const divergentOf = (text: string) =>
      markDivergentWords(text, common)
        .filter(tok => tok.divergent)
        .map(tok => tok.text);

    // SYMMETRIC: both versions highlight only their own divergent words;
    // "in him" is shared so it stays plain.
    expect(divergentOf(kjv)).toEqual(['whosoever', 'believeth']);
    expect(divergentOf(web)).toEqual(['whoever', 'believes']);
  });
});
