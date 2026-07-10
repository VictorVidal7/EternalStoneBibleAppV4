/**
 * Modo púlpito — pure timing helpers: word count of the preparer's own prose
 * and a words ÷ wpm duration estimate. Deterministic, no NLP, no I/O.
 */
import {
  DEFAULT_WORDS_PER_MINUTE,
  WPM_MAX,
  WPM_MIN,
  clampWpm,
  countPrepNotesWords,
  countWords,
  estimateMinutes,
  formatEstimatedDuration,
} from '../src/features/study/prepTiming';
import {emptyPrepNotes} from '../src/features/study/prepNotes';

describe('countWords', () => {
  it('counts whitespace-separated tokens', () => {
    expect(countWords('Jesús está aquí')).toBe(3);
  });

  it('returns 0 for empty or whitespace-only input', () => {
    expect(countWords('')).toBe(0);
    expect(countWords('   \n\t  ')).toBe(0);
  });

  it('treats irregular gaps and leading/trailing space as single separators', () => {
    expect(countWords('  Juan  3:16   dice  ')).toBe(3);
  });

  it('counts a punctuation-only token as one word (not linguistic)', () => {
    expect(countWords('¡¡¡???')).toBe(1);
  });

  it('counts a hyphenated phrase without spaces as one token', () => {
    expect(countWords('fe-esperanza')).toBe(1);
  });

  it('returns 0 for nullish input', () => {
    expect(countWords(null)).toBe(0);
    expect(countWords(undefined)).toBe(0);
  });
});

describe('countPrepNotesWords', () => {
  it('is 0 for empty notes', () => {
    expect(countPrepNotesWords(emptyPrepNotes())).toBe(0);
  });

  it('sums only the filled sections', () => {
    const notes = {
      sections: {
        context: 'dos palabras',
        application: 'tres palabras más aquí',
      },
      updatedAt: 1,
    };
    // 2 + 4 = 6
    expect(countPrepNotesWords(notes)).toBe(6);
  });

  it('ignores a whitespace-only section', () => {
    const notes = {
      sections: {context: 'una palabra', bigIdea: '   \n  '},
      updatedAt: 1,
    };
    expect(countPrepNotesWords(notes)).toBe(2);
  });
});

describe('clampWpm', () => {
  it('clamps below the minimum and above the maximum', () => {
    expect(clampWpm(50)).toBe(WPM_MIN);
    expect(clampWpm(500)).toBe(WPM_MAX);
  });

  it('rounds a non-integer inside the range', () => {
    expect(clampWpm(134.6)).toBe(135);
  });

  it('falls back to the default for a non-finite value', () => {
    expect(clampWpm(NaN)).toBe(DEFAULT_WORDS_PER_MINUTE);
    expect(clampWpm(Infinity)).toBe(DEFAULT_WORDS_PER_MINUTE);
  });
});

describe('estimateMinutes', () => {
  it('is 0 for no words', () => {
    expect(estimateMinutes(0)).toBe(0);
    expect(estimateMinutes(-5)).toBe(0);
  });

  it('floors at 1 for any nonzero word count under one wpm unit', () => {
    expect(estimateMinutes(10)).toBe(1);
  });

  it('rounds words ÷ wpm at the default rate', () => {
    // 1350 / 135 = 10
    expect(estimateMinutes(1350)).toBe(10);
    // 4050 / 135 = 30
    expect(estimateMinutes(4050)).toBe(30);
  });

  it('honors a custom words-per-minute', () => {
    expect(estimateMinutes(1200, 120)).toBe(10);
  });

  it('falls back to the default for a non-positive / non-finite wpm', () => {
    expect(estimateMinutes(1350, 0)).toBe(10);
    expect(estimateMinutes(1350, NaN)).toBe(10);
  });
});

describe('formatEstimatedDuration', () => {
  const strings = {
    lessThanOneMinute: 'Menos de 1 min',
    aboutMinutes: '≈ {{n}} min',
  };

  it('shows the less-than-a-minute label for 0 minutes', () => {
    expect(formatEstimatedDuration(0, strings)).toBe('Menos de 1 min');
  });

  it('interpolates the minute count', () => {
    expect(formatEstimatedDuration(25, strings)).toBe('≈ 25 min');
  });
});
