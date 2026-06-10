/**
 * karaoke — pure word-boundary → highlighted-word resolution (Sprint 75).
 * Locks the tokenizer's char offsets and the forgiving boundary snapping.
 */

import {
  tokenizeForKaraoke,
  activeTokenIndex,
} from '../src/features/audio/lib/karaoke';

describe('tokenizeForKaraoke', () => {
  it('splits words preserving original char offsets', () => {
    const text = 'Alabad a Jehová';
    expect(tokenizeForKaraoke(text)).toEqual([
      {text: 'Alabad', start: 0, end: 6},
      {text: 'a', start: 7, end: 8},
      {text: 'Jehová', start: 9, end: 15},
    ]);
  });

  it('keeps punctuation attached to its word', () => {
    const tokens = tokenizeForKaraoke('bueno; porque para siempre,');
    expect(tokens[0]).toEqual({text: 'bueno;', start: 0, end: 6});
    expect(tokens[3].text).toBe('siempre,');
  });

  it('handles repeated whitespace and an empty string', () => {
    expect(tokenizeForKaraoke('uno  dos')).toEqual([
      {text: 'uno', start: 0, end: 3},
      {text: 'dos', start: 5, end: 8},
    ]);
    expect(tokenizeForKaraoke('')).toEqual([]);
    expect(tokenizeForKaraoke('   ')).toEqual([]);
  });
});

describe('activeTokenIndex', () => {
  const tokens = tokenizeForKaraoke('Alabad a Jehová, naciones todas');

  it('resolves an index inside a word to that word', () => {
    expect(activeTokenIndex(tokens, 0)).toBe(0);
    expect(activeTokenIndex(tokens, 9)).toBe(2); // first char of "Jehová,"
    expect(activeTokenIndex(tokens, 12)).toBe(2); // middle of "Jehová,"
  });

  it('snaps an inter-word whitespace index forward to the next word', () => {
    // Index 6 is the space after "Alabad" → the engine is about to say "a".
    expect(activeTokenIndex(tokens, 6)).toBe(1);
  });

  it('clamps a past-the-end index to the last word', () => {
    expect(activeTokenIndex(tokens, 999)).toBe(tokens.length - 1);
  });

  it('returns -1 for no tokens or a negative/invalid index', () => {
    expect(activeTokenIndex([], 3)).toBe(-1);
    expect(activeTokenIndex(tokens, -1)).toBe(-1);
    expect(activeTokenIndex(tokens, Number.NaN)).toBe(-1);
  });
});
