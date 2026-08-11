import {
  firstLetterPrompt,
  buildFillLayout,
  normalizeAnswer,
  isBlankCorrect,
  fillScore,
  checkTypedVerse,
} from '../src/lib/memory/recall';

describe('recall — active-recall transforms', () => {
  describe('firstLetterPrompt', () => {
    it('collapses every word to its first letter, keeping spacing', () => {
      expect(firstLetterPrompt('For God so loved')).toBe('F__ G__ s_ l____');
    });
    it('is unicode-aware (Spanish accents survive as the first letter)', () => {
      // "Él" keeps its accented first letter; punctuation is preserved.
      expect(firstLetterPrompt('Él amó.')).toBe('É_ a__.');
    });
  });

  describe('buildFillLayout', () => {
    it('blanks every other content word starting with the second', () => {
      const {tokens, blankCount} = buildFillLayout(
        'For God so loved the world',
      );
      expect(tokens.map(t => t.text)).toEqual([
        'For',
        'God',
        'so',
        'loved',
        'the',
        'world',
      ]);
      expect(tokens.map(t => t.isBlank)).toEqual([
        false,
        true,
        false,
        true,
        false,
        true,
      ]);
      expect(blankCount).toBe(3);
      // blankIndex is sequential among blanks only
      expect(tokens.filter(t => t.isBlank).map(t => t.blankIndex)).toEqual([
        0, 1, 2,
      ]);
      expect(
        tokens.filter(t => !t.isBlank).every(t => t.blankIndex === -1),
      ).toBe(true);
    });

    it('leaves a single-word verse with no blank (no anchor)', () => {
      const {tokens, blankCount} = buildFillLayout('Jesus');
      expect(blankCount).toBe(0);
      expect(tokens[0].isBlank).toBe(false);
    });

    it('collapses runs of whitespace', () => {
      const {tokens} = buildFillLayout('  a   b  ');
      expect(tokens.map(t => t.text)).toEqual(['a', 'b']);
    });
  });

  describe('normalizeAnswer', () => {
    it('folds case, accents and punctuation', () => {
      expect(normalizeAnswer('Señor,')).toBe('senor');
      expect(normalizeAnswer('  GOD!  ')).toBe('god');
      expect(normalizeAnswer('—')).toBe('');
    });
  });

  describe('isBlankCorrect', () => {
    it('matches across case/accents/punctuation', () => {
      expect(isBlankCorrect('senor', 'Señor,')).toBe(true);
      expect(isBlankCorrect('Amó', 'amo')).toBe(true);
    });
    it('rejects an empty or wrong answer', () => {
      expect(isBlankCorrect('', 'God')).toBe(false);
      expect(isBlankCorrect('world', 'God')).toBe(false);
    });
  });

  describe('fillScore', () => {
    it('counts the correct blanks', () => {
      expect(
        fillScore(['God', 'loved', 'planet'], ['God', 'loved', 'world']),
      ).toBe(2);
      expect(fillScore([], ['God'])).toBe(0);
      expect(fillScore(['god', 'LOVED'], ['God', 'loved'])).toBe(2);
    });
  });

  describe('checkTypedVerse — whole-verse "type" recall mode', () => {
    it('marks every word correct for an exact match', () => {
      const result = checkTypedVerse(
        'For God so loved the world',
        'For God so loved the world',
      );
      expect(result.wordResults).toEqual([true, true, true, true, true, true]);
      expect(result.correctCount).toBe(6);
      expect(result.totalCount).toBe(6);
    });

    it('matches case/accent/punctuation-insensitively, word by word', () => {
      const result = checkTypedVerse(
        'el senor es mi pastor',
        'Él Señor. es mi pastor,',
      );
      expect(result.wordResults).toEqual([true, true, true, true, true]);
      expect(result.correctCount).toBe(5);
    });

    it('flags a wrong word at its position without derailing the rest', () => {
      const result = checkTypedVerse(
        'For God so loved the planet',
        'For God so loved the world',
      );
      expect(result.wordResults).toEqual([true, true, true, true, true, false]);
      expect(result.correctCount).toBe(5);
      expect(result.totalCount).toBe(6);
    });

    it('counts a missing tail (typed answer shorter than the verse) as incorrect', () => {
      const result = checkTypedVerse(
        'For God so',
        'For God so loved the world',
      );
      expect(result.wordResults).toEqual([
        true,
        true,
        true,
        false,
        false,
        false,
      ]);
      expect(result.correctCount).toBe(3);
      expect(result.totalCount).toBe(6);
    });

    it('ignores extra typed words beyond the verse length', () => {
      const result = checkTypedVerse(
        'For God so loved the world and beyond',
        'For God so loved the world',
      );
      expect(result.totalCount).toBe(6);
      expect(result.correctCount).toBe(6);
      expect(result.wordResults).toHaveLength(6);
    });

    it('treats an empty typed answer as entirely incorrect, not a crash', () => {
      const result = checkTypedVerse('', 'Jesus wept');
      expect(result.wordResults).toEqual([false, false]);
      expect(result.correctCount).toBe(0);
      expect(result.totalCount).toBe(2);
    });

    it('collapses whitespace runs on both sides', () => {
      const result = checkTypedVerse('  a   b  ', 'a b');
      expect(result.wordResults).toEqual([true, true]);
    });
  });
});
