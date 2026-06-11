/**
 * Sprint 78 — weekComparison: "this week vs last week" pure deltas.
 *
 * Locks the two-window composition over buildWeeklyRecap (previous window =
 * same recap anchored 7 LOCAL days back), the per-metric delta/trend, the
 * honest empty-week flags, and the listening-row gate.
 */

import {
  compareWeeks,
  previousWeekAnchor,
} from '../src/features/reading-insights/weekComparison';
import {RECAP_WINDOW_DAYS} from '../src/features/reading-insights/weeklyRecap';
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
  now: NOW,
};

describe('previousWeekAnchor', () => {
  it('lands exactly RECAP_WINDOW_DAYS local days earlier', () => {
    const anchor = previousWeekAnchor(NOW);
    expect(listeningDateKey(anchor)).toBe(key(RECAP_WINDOW_DAYS));
  });
});

describe('compareWeeks', () => {
  it('flags a fully empty fortnight so the UI can hide the card', () => {
    const cmp = compareWeeks(emptyInput);
    expect(cmp.hasAnyActivity).toBe(false);
    expect(cmp.currentHasActivity).toBe(false);
    expect(cmp.previousHasActivity).toBe(false);
    expect(cmp.hasListening).toBe(false);
    expect(cmp.versesRead).toEqual({
      current: 0,
      previous: 0,
      delta: 0,
      trend: 'same',
    });
  });

  it('splits entries into the right window and derives the trends', () => {
    const cmp = compareWeeks({
      ...emptyInput,
      readingLog: [
        {date: key(0), versesRead: 30, timeSpent: 300}, // current week
        {date: key(2), versesRead: 28, timeSpent: 200}, // current week
        {date: key(8), versesRead: 12, timeSpent: 700}, // previous week
        {date: key(13), versesRead: 3, timeSpent: 100}, // previous week edge
        {date: key(14), versesRead: 99, timeSpent: 999}, // outside both
      ],
    });
    expect(cmp.versesRead).toEqual({
      current: 58,
      previous: 15,
      delta: 43,
      trend: 'up',
    });
    expect(cmp.readingSeconds).toEqual({
      current: 500,
      previous: 800,
      delta: -300,
      trend: 'down',
    });
    expect(cmp.daysActive).toEqual({
      current: 2,
      previous: 2,
      delta: 0,
      trend: 'same',
    });
    expect(cmp.hasAnyActivity).toBe(true);
    expect(cmp.previousHasActivity).toBe(true);
    expect(cmp.hasListening).toBe(false);
  });

  it('keeps the comparison honest when last week was empty', () => {
    const cmp = compareWeeks({
      ...emptyInput,
      readingLog: [{date: key(1), versesRead: 10, timeSpent: 60}],
    });
    expect(cmp.hasAnyActivity).toBe(true);
    expect(cmp.previousHasActivity).toBe(false);
    expect(cmp.versesRead.trend).toBe('up');
  });

  it('gates the listening row on either week having audio', () => {
    const cmp = compareWeeks({
      ...emptyInput,
      listening: {
        days: {
          [key(9)]: {ms: 240_000, verses: 12}, // previous week only
        },
      },
    });
    expect(cmp.hasListening).toBe(true);
    expect(cmp.listeningMs).toEqual({
      current: 0,
      previous: 240_000,
      delta: -240_000,
      trend: 'down',
    });
    expect(cmp.versesHeard.previous).toBe(12);
  });
});
