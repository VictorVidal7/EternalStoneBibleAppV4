/**
 * Sprint 79 — planPace: the pure "where am I in this plan?" model behind
 * Reading Plans 2.0. Pins local-day arithmetic, the next-day pointer, the
 * grace-toned pace policy and the day-readings range formatter.
 */
import {
  localDaysBetween,
  nextPlanDay,
  planPace,
  planCatchUp,
  formatDayReadings,
} from '../src/lib/reading/planPace';

describe('localDaysBetween', () => {
  it('counts local calendar days, not 24h blocks', () => {
    // 23:30 → 00:30 next day is one LOCAL day even though only 1h passed.
    expect(
      localDaysBetween(
        new Date(2026, 5, 10, 23, 30),
        new Date(2026, 5, 11, 0, 30),
      ),
    ).toBe(1);
  });

  it('is 0 within the same local day and negative backwards', () => {
    expect(
      localDaysBetween(new Date(2026, 5, 10, 0, 1), new Date(2026, 5, 10, 23)),
    ).toBe(0);
    expect(localDaysBetween(new Date(2026, 5, 11), new Date(2026, 5, 10))).toBe(
      -1,
    );
  });

  it('crosses month boundaries', () => {
    expect(localDaysBetween(new Date(2026, 4, 31), new Date(2026, 5, 2))).toBe(
      2,
    );
  });
});

describe('nextPlanDay', () => {
  it('returns the first uncompleted day, skipping holes', () => {
    expect(nextPlanDay([], 30)).toBe(1);
    expect(nextPlanDay([1, 2, 4], 30)).toBe(3);
  });

  it('returns null when every day is done', () => {
    expect(nextPlanDay([1, 2, 3], 3)).toBeNull();
  });
});

describe('planPace', () => {
  const now = new Date(2026, 5, 11, 12); // 2026-06-11 local noon
  const startedDaysAgo = (n: number) =>
    new Date(2026, 5, 11 - n, 9).toISOString();

  it('reports notStarted when there is no startedAt', () => {
    const pace = planPace({
      startedAt: null,
      completedDays: [],
      duration: 30,
      now,
    });
    expect(pace.status).toBe('notStarted');
    expect(pace.nextDay).toBe(1);
    expect(pace.scheduledDay).toBeNull();
  });

  it("is on track with today's reading pending or freshly done", () => {
    // Started 2 local days ago → scheduled day 3.
    const pending = planPace({
      startedAt: startedDaysAgo(2),
      completedDays: [1, 2],
      duration: 30,
      now,
    });
    expect(pending.status).toBe('onTrack');
    expect(pending.scheduledDay).toBe(3);
    expect(pending.nextDay).toBe(3);

    const done = planPace({
      startedAt: startedDaysAgo(2),
      completedDays: [1, 2, 3],
      duration: 30,
      now,
    });
    expect(done.status).toBe('onTrack');
    expect(done.daysAhead).toBe(0);
  });

  it('counts full days of cushion as ahead', () => {
    const pace = planPace({
      startedAt: startedDaysAgo(1),
      completedDays: [1, 2, 3, 4],
      duration: 30,
      now,
    });
    expect(pace.status).toBe('ahead');
    expect(pace.daysAhead).toBe(2); // scheduled day 2, 4 done
  });

  it('counts catch-up days as behind, with grace', () => {
    const pace = planPace({
      startedAt: startedDaysAgo(5),
      completedDays: [1, 2],
      duration: 30,
      now,
    });
    expect(pace.status).toBe('behind');
    expect(pace.scheduledDay).toBe(6);
    expect(pace.daysBehind).toBe(3);
    expect(pace.nextDay).toBe(3);
  });

  it('clamps the scheduled day to the plan duration', () => {
    const pace = planPace({
      startedAt: startedDaysAgo(90),
      completedDays: [1],
      duration: 30,
      now,
    });
    expect(pace.scheduledDay).toBe(30);
    expect(pace.daysBehind).toBe(28);
  });

  it('reports complete with 100% regardless of the calendar', () => {
    const pace = planPace({
      startedAt: startedDaysAgo(90),
      completedDays: Array.from({length: 30}, (_, i) => i + 1),
      duration: 30,
      now,
    });
    expect(pace.status).toBe('complete');
    expect(pace.percent).toBe(100);
    expect(pace.nextDay).toBeNull();
  });

  it('ignores out-of-range or duplicate completed days', () => {
    const pace = planPace({
      startedAt: startedDaysAgo(0),
      completedDays: [0, 1, 1, 99],
      duration: 30,
      now,
    });
    expect(pace.completedCount).toBe(1);
  });
});

describe('formatDayReadings', () => {
  const label = (book: string) => (book === 'Mateo' ? 'Matthew' : book);

  it('collapses consecutive same-book chapters into a range', () => {
    expect(
      formatDayReadings(
        [
          {book: 'Mateo', chapter: 9},
          {book: 'Mateo', chapter: 10},
          {book: 'Mateo', chapter: 11},
        ],
        b => b,
      ),
    ).toBe('Mateo 9–11');
  });

  it('separates distinct runs with a middle dot', () => {
    expect(
      formatDayReadings(
        [
          {book: 'Mateo', chapter: 28},
          {book: 'Marcos', chapter: 1},
          {book: 'Marcos', chapter: 2},
        ],
        b => b,
      ),
    ).toBe('Mateo 28 · Marcos 1–2');
  });

  it('does not bridge a chapter gap inside the same book', () => {
    expect(
      formatDayReadings(
        [
          {book: 'Salmos', chapter: 1},
          {book: 'Salmos', chapter: 3},
        ],
        b => b,
      ),
    ).toBe('Salmos 1 · Salmos 3');
  });

  it('localizes through the provided bookLabel', () => {
    expect(formatDayReadings([{book: 'Mateo', chapter: 1}], label)).toBe(
      'Matthew 1',
    );
  });

  it('is empty for no readings', () => {
    expect(formatDayReadings([], b => b)).toBe('');
  });
});

describe('planCatchUp (Sprint 84)', () => {
  const now = new Date(2026, 5, 11, 12); // 2026-06-11 local noon
  const startedDaysAgo = (n: number) =>
    new Date(2026, 5, 11 - n, 9).toISOString();

  it('lists the uncompleted days through today when behind', () => {
    // Started 5 days ago → scheduled day 6; only day 1 done → behind.
    const pace = planPace({
      startedAt: startedDaysAgo(5),
      completedDays: [1],
      duration: 30,
      now,
    });
    expect(pace.status).toBe('behind');
    const catchUp = planCatchUp(pace, 30, [1], now);
    expect(catchUp.catchUpDays).toEqual([2, 3, 4, 5, 6]);
    expect(catchUp.remainingDays).toBe(29);
  });

  it('projects the finish reading one plan-day per calendar day from today', () => {
    const pace = planPace({
      startedAt: startedDaysAgo(5),
      completedDays: [1],
      duration: 30,
      now,
    });
    // 29 left → today (day 1) … +28 days = 2026-07-09 (local midnight).
    const catchUp = planCatchUp(pace, 30, [1], now);
    expect(catchUp.projectedFinish).toEqual(new Date(2026, 6, 9));
  });

  it('offers no catch-up days when on track or ahead', () => {
    const onTrack = planPace({
      startedAt: startedDaysAgo(2),
      completedDays: [1, 2, 3],
      duration: 30,
      now,
    });
    const catchUp = planCatchUp(onTrack, 30, [1, 2, 3], now);
    expect(catchUp.catchUpDays).toEqual([]);
    expect(catchUp.remainingDays).toBe(27);
  });

  it('has a null projection and no catch-up once complete', () => {
    const all = Array.from({length: 30}, (_, i) => i + 1);
    const done = planPace({
      startedAt: startedDaysAgo(40),
      completedDays: all,
      duration: 30,
      now,
    });
    const catchUp = planCatchUp(done, 30, all, now);
    expect(catchUp.catchUpDays).toEqual([]);
    expect(catchUp.remainingDays).toBe(0);
    expect(catchUp.projectedFinish).toBeNull();
  });
});
