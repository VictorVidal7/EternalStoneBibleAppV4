/**
 * Sprint 77 — weeklyRecap: pure model for the shareable "My week in the Word"
 * card. Locks the 7-day window, the per-day flags, and the honest empty week.
 */

import {
  buildWeeklyRecap,
  RECAP_WINDOW_DAYS,
} from '../src/features/reading-insights/weeklyRecap';
import {
  listeningDateKey,
  EMPTY_LISTENING_STATS,
} from '../src/features/audio/lib/listeningStats';

const MS_PER_DAY = 86_400_000;
// Midday, so local-day keys are stable regardless of the runner's timezone.
const NOW = Date.UTC(2026, 5, 10, 12, 0, 0);
const key = (daysAgo: number) => listeningDateKey(NOW - daysAgo * MS_PER_DAY);

const emptyInput = {
  readingLog: [],
  listening: EMPTY_LISTENING_STATS,
  readingStreak: 0,
  listeningStreak: 0,
  now: NOW,
};

describe('buildWeeklyRecap', () => {
  it('reports an honest empty week', () => {
    const recap = buildWeeklyRecap(emptyInput);
    expect(recap.hasActivity).toBe(false);
    expect(recap.days).toHaveLength(RECAP_WINDOW_DAYS);
    expect(recap.days.every(d => !d.read && !d.listened)).toBe(true);
    expect(recap.versesRead).toBe(0);
    expect(recap.listeningMs).toBe(0);
    expect(recap.daysActive).toBe(0);
  });

  it('orders the day strip oldest → today', () => {
    const recap = buildWeeklyRecap(emptyInput);
    expect(recap.days[0].date).toBe(key(6));
    expect(recap.days[RECAP_WINDOW_DAYS - 1].date).toBe(key(0));
  });

  it('counts only reading inside the window and aggregates duplicate days', () => {
    const recap = buildWeeklyRecap({
      ...emptyInput,
      readingLog: [
        {date: key(0), versesRead: 10, timeSpent: 120},
        {date: key(0), versesRead: 5, timeSpent: 60}, // same-day rows merge
        {date: key(6), versesRead: 3, timeSpent: 30},
        {date: key(7), versesRead: 99, timeSpent: 999}, // outside the window
      ],
    });
    expect(recap.versesRead).toBe(18);
    expect(recap.readingSeconds).toBe(210);
    expect(recap.daysActive).toBe(2);
    expect(recap.days[RECAP_WINDOW_DAYS - 1]).toMatchObject({
      read: true,
      listened: false,
    });
    expect(recap.days[0]).toMatchObject({read: true, listened: false});
    expect(recap.hasActivity).toBe(true);
  });

  it('merges listening buckets and flags listened days separately', () => {
    const recap = buildWeeklyRecap({
      ...emptyInput,
      listening: {
        days: {
          [key(1)]: {ms: 180_000, verses: 43},
          [key(9)]: {ms: 999_000, verses: 99}, // outside the window
        },
      },
    });
    expect(recap.listeningMs).toBe(180_000);
    expect(recap.versesHeard).toBe(43);
    expect(recap.daysActive).toBe(1);
    const yesterday = recap.days[RECAP_WINDOW_DAYS - 2];
    expect(yesterday).toMatchObject({read: false, listened: true});
  });

  it('a day with both reading and listening counts once', () => {
    const recap = buildWeeklyRecap({
      ...emptyInput,
      readingLog: [{date: key(0), versesRead: 4, timeSpent: 40}],
      listening: {days: {[key(0)]: {ms: 60_000, verses: 12}}},
    });
    expect(recap.daysActive).toBe(1);
    expect(recap.days[RECAP_WINDOW_DAYS - 1]).toMatchObject({
      read: true,
      listened: true,
    });
  });

  it('passes streaks through, clamped at zero', () => {
    const recap = buildWeeklyRecap({
      ...emptyInput,
      readingStreak: 6,
      listeningStreak: -2,
    });
    expect(recap.readingStreak).toBe(6);
    expect(recap.listeningStreak).toBe(0);
  });
});
