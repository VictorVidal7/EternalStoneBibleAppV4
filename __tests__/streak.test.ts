import {computeStreaks} from '../src/lib/achievements/streak';

describe('computeStreaks', () => {
  it('returns 0/0 for an empty log', () => {
    expect(computeStreaks([], '2026-06-02')).toEqual({
      currentStreak: 0,
      longestStreak: 0,
    });
  });

  it('counts a single day read today', () => {
    expect(computeStreaks(['2026-06-02'], '2026-06-02')).toEqual({
      currentStreak: 1,
      longestStreak: 1,
    });
  });

  it('counts a consecutive run ending today', () => {
    const dates = ['2026-05-31', '2026-06-01', '2026-06-02'];
    expect(computeStreaks(dates, '2026-06-02')).toEqual({
      currentStreak: 3,
      longestStreak: 3,
    });
  });

  it('keeps the streak alive when today has no entry yet but yesterday does', () => {
    const dates = ['2026-05-31', '2026-06-01'];
    // "today" is 2026-06-02; the user has not read yet today.
    expect(computeStreaks(dates, '2026-06-02')).toEqual({
      currentStreak: 2,
      longestStreak: 2,
    });
  });

  it('resets the current streak to 0 once the most recent day is older than yesterday', () => {
    const dates = ['2026-05-28', '2026-05-29', '2026-05-30'];
    // Most recent active day (May 30) is older than yesterday (Jun 1).
    expect(computeStreaks(dates, '2026-06-02')).toEqual({
      currentStreak: 0,
      longestStreak: 3,
    });
  });

  it('reports longest > current when an old run beats the recent one', () => {
    const dates = [
      '2026-04-01',
      '2026-04-02',
      '2026-04-03',
      '2026-04-04', // longest run = 4
      '2026-06-01',
      '2026-06-02', // current run = 2
    ];
    expect(computeStreaks(dates, '2026-06-02')).toEqual({
      currentStreak: 2,
      longestStreak: 4,
    });
  });

  it('tolerates duplicates and unordered input', () => {
    const dates = [
      '2026-06-02',
      '2026-05-31',
      '2026-06-01',
      '2026-06-02', // duplicate
      '2026-05-31', // duplicate
    ];
    expect(computeStreaks(dates, '2026-06-02')).toEqual({
      currentStreak: 3,
      longestStreak: 3,
    });
  });

  it('ignores malformed date rows without throwing', () => {
    const dates = [
      '2026-06-01',
      'not-a-date',
      '',
      '2026-13-40', // out-of-range, rejected
      '2026-06-02',
    ] as string[];
    expect(computeStreaks(dates, '2026-06-02')).toEqual({
      currentStreak: 2,
      longestStreak: 2,
    });
  });

  it('reproduces the Sprint 58 device scenario (4 active days, gaps) without pinning at 0', () => {
    // The real bug: current_streak/longest_streak were stuck at 0 even though
    // the user read on 4 days. The log-derived computation recovers a real
    // streak instead.
    const dates = ['2026-05-28', '2026-05-30', '2026-05-31', '2026-06-02'];
    expect(computeStreaks(dates, '2026-06-02')).toEqual({
      currentStreak: 1, // only today is consecutive (Jun 1 was missed)
      longestStreak: 2, // May 30 + May 31
    });
  });

  it('spans month boundaries correctly', () => {
    const dates = ['2026-04-30', '2026-05-01', '2026-05-02'];
    expect(computeStreaks(dates, '2026-05-02')).toEqual({
      currentStreak: 3,
      longestStreak: 3,
    });
  });
});
