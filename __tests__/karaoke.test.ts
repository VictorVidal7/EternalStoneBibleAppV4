/**
 * karaoke — pure word-boundary → highlighted-word resolution (Sprint 75).
 * Locks the tokenizer's char offsets and the forgiving boundary snapping.
 */

import {
  tokenizeForKaraoke,
  activeTokenIndex,
} from '../src/features/audio/lib/karaoke';
import {applySpanishPronunciationFixes} from '../src/lib/speech/narration';

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

/**
 * The karaoke highlight tokenizes the DISPLAYED verse text, but the engine's
 * boundary `charIndex` counts into the SPOKEN text — and the one deliberately
 * non-length-preserving pronunciation fix, "Jacob" → "Ja cob" (57th session,
 * narration.ts), makes those two diverge by +1 from that word onward AND emits
 * an extra boundary (the split adds a word). This locks in exactly how far the
 * drift propagates: the name itself is never mis-highlighted, every
 * multi-character word downstream still resolves correctly, and the only cost
 * is a 1-letter word ("y", "a", …) immediately after "Jacob" being skipped for
 * one beat before the highlight snaps back.
 */
describe('karaoke offset under the "Jacob" → "Ja cob" narration fix', () => {
  /** The charIndex the engine reports at the start of each spoken word. */
  const spokenWordStarts = (spoken: string): number[] => {
    const starts: number[] = [];
    const re = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(spoken)) !== null) starts.push(m.index);
    return starts;
  };

  /** Which DISPLAYED token each spoken-word boundary lights up, in order. */
  const highlightSequence = (displayed: string): number[] => {
    const spoken = applySpanishPronunciationFixes(displayed, 'es-ES');
    const displayedTokens = tokenizeForKaraoke(displayed);
    return spokenWordStarts(spoken).map(ci =>
      activeTokenIndex(displayedTokens, ci),
    );
  };

  it('never mis-highlights "Jacob" itself — both split boundaries land on it', () => {
    // "El nombre del Dios de Jacob te defienda." (Salmos 20:1 tail)
    const verse = 'El nombre del Dios de Jacob te defienda.';
    const tokens = tokenizeForKaraoke(verse);
    expect(tokens[5].text).toBe('Jacob'); // the token under test
    // "Ja" and "cob" are boundaries 5 and 6; both resolve to token 5.
    const seq = highlightSequence(verse);
    expect(seq[5]).toBe(5);
    expect(seq[6]).toBe(5);
  });

  it('absorbs the +1 drift when only multi-character words follow "Jacob"', () => {
    const verse = 'El nombre del Dios de Jacob te defienda.';
    // Every displayed token lit in order; "Jacob" (5) gets two beats.
    expect(highlightSequence(verse)).toEqual([0, 1, 2, 3, 4, 5, 5, 6, 7]);
  });

  it('skips a 1-letter word right after "Jacob" for one beat, then recovers', () => {
    // "Venid, oh casa de Jacob, y andemos a la luz de Jehová." (Isaías 2:5)
    // tokens:      0     1   2   3    4     5   6      7 8   9  10  11
    const verse = 'Venid, oh casa de Jacob, y andemos a la luz de Jehová.';
    const tokens = tokenizeForKaraoke(verse);
    expect(tokens[5].text).toBe('y');
    expect(tokens[7].text).toBe('a');

    const seq = highlightSequence(verse);
    // 13 boundaries: …, "Ja"(→4), "cob,"(→4), "y"(→6, skips token 5),
    // "andemos"(→6), "a"(→8, skips token 7), "la"(→8), then back in lockstep.
    expect(seq).toEqual([0, 1, 2, 3, 4, 4, 6, 6, 8, 8, 9, 10, 11]);
    // The 1-letter words 5 ("y") and 7 ("a") are the only tokens never lit.
    expect(seq).not.toContain(5);
    expect(seq).not.toContain(7);
    // Everything from "luz" onward is exact again.
    expect(seq.slice(-3)).toEqual([9, 10, 11]);
  });

  it('has zero drift for verses without "Jacob" (length-preserving fixes only)', () => {
    // JAH→Yah, estatutos→estatútos are both equal-length.
    const verse = 'JAH ha escogido a Jacobo; guardad sus estatutos siempre.';
    const seq = highlightSequence(verse);
    expect(seq).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
