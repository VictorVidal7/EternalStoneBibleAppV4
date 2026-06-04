import {
  dayOfYear,
  dailyIndex,
  buildDailyLight,
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
