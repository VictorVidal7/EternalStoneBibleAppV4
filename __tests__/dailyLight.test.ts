import {
  dayOfYear,
  dailyIndex,
  buildDailyLight,
  rotateApplyQuestions,
} from '../src/features/daily-light/dailyLight';

describe('dayOfYear', () => {
  it('is 0 on Jan 1 and counts up', () => {
    expect(dayOfYear(new Date(2026, 0, 1))).toBe(0);
    expect(dayOfYear(new Date(2026, 0, 2))).toBe(1);
    expect(dayOfYear(new Date(2026, 1, 1))).toBe(31); // Feb 1
  });

  it('handles leap years', () => {
    expect(dayOfYear(new Date(2024, 11, 31))).toBe(365); // 2024 is a leap year
    expect(dayOfYear(new Date(2026, 11, 31))).toBe(364);
  });
});

describe('dailyIndex', () => {
  it('wraps modulo the list length', () => {
    // day 0 → 0, list of 3
    expect(dailyIndex(3, new Date(2026, 0, 1))).toBe(0);
    expect(dailyIndex(3, new Date(2026, 0, 4))).toBe(0); // day 3 % 3
    expect(dailyIndex(3, new Date(2026, 0, 3))).toBe(2); // day 2 % 3
  });

  it('applies the salt', () => {
    expect(dailyIndex(5, new Date(2026, 0, 1), 2)).toBe(2);
  });

  it('is defensive against a non-positive length', () => {
    expect(dailyIndex(0, new Date(2026, 0, 1))).toBe(0);
    expect(dailyIndex(-3, new Date(2026, 0, 1))).toBe(0);
  });
});

describe('buildDailyLight', () => {
  it('is deterministic for a given date', () => {
    const a = buildDailyLight(new Date(2026, 5, 3), 100, 14, 8);
    const b = buildDailyLight(new Date(2026, 5, 3), 100, 14, 8);
    expect(a).toEqual(b);
  });

  it('keeps every index within bounds', () => {
    for (let d = 0; d < 366; d++) {
      const date = new Date(2026, 0, 1 + d);
      const sel = buildDailyLight(date, 100, 14, 8);
      expect(sel.verseIndex).toBeGreaterThanOrEqual(0);
      expect(sel.verseIndex).toBeLessThan(100);
      expect(sel.themeIndex).toBeLessThan(14);
      expect(sel.promptIndex).toBeLessThan(8);
    }
  });

  it('does not rotate the three lists in lockstep', () => {
    // With distinct salts, two consecutive days should not advance all three
    // by the same delta from a shared base — spot-check that the theme/prompt
    // salts shift the starting index off the verse index.
    const sel = buildDailyLight(new Date(2026, 0, 1), 100, 14, 8);
    expect(sel.verseIndex).toBe(0);
    expect(sel.themeIndex).toBe(7); // salt 7
    expect(sel.promptIndex).toBe(13 % 8); // salt 13 → 5
  });
});

describe('rotateApplyQuestions', () => {
  const pool = ['a', 'b', 'c', 'd', 'e'];

  it('returns the whole list (in order) when the pool is at or below count', () => {
    expect(
      rotateApplyQuestions(['a', 'b', 'c'], new Date(2026, 5, 3), 3),
    ).toEqual(['a', 'b', 'c']);
    expect(rotateApplyQuestions(['a', 'b'], new Date(2026, 5, 3), 3)).toEqual([
      'a',
      'b',
    ]);
  });

  it('returns a rotating window of count, wrapping around', () => {
    // day 0 → dailyIndex(5, salt 5) = 5 % 5 = 0 → a,b,c
    expect(rotateApplyQuestions(pool, new Date(2026, 0, 1), 3)).toEqual([
      'a',
      'b',
      'c',
    ]);
    // day 1 → (1 + 5) % 5 = 1 → b,c,d
    expect(rotateApplyQuestions(pool, new Date(2026, 0, 2), 3)).toEqual([
      'b',
      'c',
      'd',
    ]);
    // day 4 → (4 + 5) % 5 = 4 → e,a,b (wraps)
    expect(rotateApplyQuestions(pool, new Date(2026, 0, 5), 3)).toEqual([
      'e',
      'a',
      'b',
    ]);
  });

  it('is deterministic for a given date and never exceeds count', () => {
    for (let d = 0; d < 366; d++) {
      const date = new Date(2026, 0, 1 + d);
      const out = rotateApplyQuestions(pool, date, 3);
      expect(out).toHaveLength(3);
      expect(new Set(out).size).toBe(3); // no repeats within a window
      expect(rotateApplyQuestions(pool, date, 3)).toEqual(out);
    }
  });

  it('is defensive against a non-positive count', () => {
    expect(rotateApplyQuestions(pool, new Date(2026, 0, 1), 0)).toEqual([]);
  });
});
