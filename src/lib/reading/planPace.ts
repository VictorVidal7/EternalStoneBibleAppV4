/**
 * planPace (Sprint 79 — Reading Plans 2.0).
 *
 * The pure "where am I in this plan?" model. Reading plans have tracked
 * per-day completion since their start (plus the S-era auto-complete from real
 * chapter reads), but the screens never answered the questions a reader
 * actually asks: WHICH day is today's, am I ahead or behind, and what exactly
 * is left. This module answers them from data the progress context already
 * keeps: `startedAt` + `completedDays` + the plan duration.
 *
 *   - `localDaysBetween` — calendar days between two moments in LOCAL time
 *     (midnight-normalized; the rounding absorbs DST's 23h/25h days — the
 *     S77/S78 lesson that raw ms arithmetic slips a local day).
 *   - `nextPlanDay` — the first uncompleted day: the honest "continue here".
 *   - `planPace` — scheduled day vs completed count → ahead / on-track /
 *     behind / complete, with GRACE: "behind" counts days to catch up, it
 *     never shames; "on track" covers both "today's reading pending" and
 *     "today's reading done".
 *   - `formatDayReadings` — "Mateo 9–10" / "Mateo 28 · Marcos 1": consecutive
 *     same-book chapters collapse into ranges so a day reads like a reference,
 *     not a list.
 *
 * Kept free of React / storage / the DB, mirroring [[weekComparison]] /
 * [[dailyVerseHistory]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export type PlanPaceStatus =
  | 'notStarted'
  | 'ahead'
  | 'onTrack'
  | 'behind'
  | 'complete';

export interface PlanPaceInput {
  /** ISO timestamp of the plan's first interaction; null = never started. */
  startedAt: string | null;
  completedDays: readonly number[];
  /** Total days in the plan. */
  duration: number;
  now: Date;
}

export interface PlanPace {
  status: PlanPaceStatus;
  /**
   * The day the calendar expects you to be reading today (1..duration, day 1
   * = the day the plan started). Null when the plan hasn't started or is done.
   */
  scheduledDay: number | null;
  /** First uncompleted day — the honest "continue here". Null when complete. */
  nextDay: number | null;
  completedCount: number;
  /** 0..100, rounded. */
  percent: number;
  /** Full days of cushion beyond today's reading (only when status=ahead). */
  daysAhead: number;
  /** Days needed to catch up to the calendar (only when status=behind). */
  daysBehind: number;
}

/**
 * Calendar days between `a` and `b` in LOCAL time. Both are normalized to
 * their local midnight first; the division+round absorbs the 23h/25h days a
 * DST transition produces.
 */
export function localDaysBetween(a: Date, b: Date): number {
  const am = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bm = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bm - am) / 86_400_000);
}

/** The first uncompleted day of the plan, or null when every day is done. */
export function nextPlanDay(
  completedDays: readonly number[],
  duration: number,
): number | null {
  const done = new Set(completedDays);
  for (let day = 1; day <= duration; day++) {
    if (!done.has(day)) return day;
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Where the reader stands in a plan — see the module doc for the policy. */
export function planPace(input: PlanPaceInput): PlanPace {
  const {startedAt, completedDays, duration, now} = input;
  const valid = new Set(
    completedDays.filter(d => Number.isInteger(d) && d >= 1 && d <= duration),
  );
  const completedCount = valid.size;
  const percent =
    duration > 0 ? Math.round((completedCount / duration) * 100) : 0;
  const nextDay = nextPlanDay([...valid], duration);

  if (duration > 0 && completedCount >= duration) {
    return {
      status: 'complete',
      scheduledDay: null,
      nextDay: null,
      completedCount,
      percent: 100,
      daysAhead: 0,
      daysBehind: 0,
    };
  }

  const started = startedAt ? new Date(startedAt) : null;
  if (!started || Number.isNaN(started.getTime())) {
    return {
      status: 'notStarted',
      scheduledDay: null,
      nextDay,
      completedCount,
      percent,
      daysAhead: 0,
      daysBehind: 0,
    };
  }

  const scheduledDay = clamp(localDaysBetween(started, now) + 1, 1, duration);
  // On schedule = today's reading pending or already done. Ahead/behind count
  // whole days beyond that window.
  const daysAhead = Math.max(0, completedCount - scheduledDay);
  const daysBehind = Math.max(0, scheduledDay - 1 - completedCount);
  const status: PlanPaceStatus =
    daysAhead > 0 ? 'ahead' : daysBehind > 0 ? 'behind' : 'onTrack';

  return {
    status,
    scheduledDay,
    nextDay,
    completedCount,
    percent,
    daysAhead,
    daysBehind,
  };
}

/**
 * A "get back on track" plan (Sprint 84) — only meaningful while behind.
 * Composes the {@link planPace} result with the completed-day set: which days
 * you'd read to be fully current TODAY, how much of the plan is left, and when
 * you'd finish reading one plan-day per calendar day from today. Never shames —
 * the catch-up days are simply the honest answer to "what's left to today".
 */
export interface PlanCatchUp {
  /**
   * Uncompleted plan days from day 1 through today's scheduled day, in order —
   * the readings to do to be fully caught up (today included). Empty unless the
   * pace status is `behind`.
   */
  catchUpDays: number[];
  /** Plan days still uncompleted in total (duration − completed). */
  remainingDays: number;
  /**
   * Local-midnight date the reader finishes reading ONE plan-day per calendar
   * day STARTING TODAY (today is day 1 of the run), or null when nothing
   * remains. This is the honest re-projection if they keep the plan's cadence
   * from here without trying to make up the lost days.
   */
  projectedFinish: Date | null;
}

/** Build the catch-up view from a pace result + the completed-day set. Pure. */
export function planCatchUp(
  pace: PlanPace,
  duration: number,
  completedDays: readonly number[],
  now: Date,
): PlanCatchUp {
  const done = new Set(
    completedDays.filter(d => Number.isInteger(d) && d >= 1 && d <= duration),
  );
  const remainingDays = Math.max(0, duration - done.size);

  const catchUpDays: number[] = [];
  if (pace.status === 'behind' && pace.scheduledDay !== null) {
    for (let day = 1; day <= pace.scheduledDay; day++) {
      if (!done.has(day)) catchUpDays.push(day);
    }
  }

  const projectedFinish =
    remainingDays > 0
      ? new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + (remainingDays - 1),
        )
      : null;

  return {catchUpDays, remainingDays, projectedFinish};
}

/** One reading of a plan day (a whole chapter). */
export interface PlanReadingRef {
  book: string;
  chapter: number;
}

/**
 * "Mateo 9–10" / "Mateo 28 · Marcos 1": collapse consecutive same-book
 * chapters into ranges, join distinct runs with a middle dot. `bookLabel`
 * localizes the stored book name.
 */
export function formatDayReadings(
  readings: readonly PlanReadingRef[],
  bookLabel: (book: string) => string,
): string {
  if (readings.length === 0) return '';
  interface Run {
    book: string;
    start: number;
    end: number;
  }
  const runs: Run[] = [];
  for (const reading of readings) {
    const last = runs[runs.length - 1];
    if (
      last &&
      last.book === reading.book &&
      reading.chapter === last.end + 1
    ) {
      last.end = reading.chapter;
    } else {
      runs.push({
        book: reading.book,
        start: reading.chapter,
        end: reading.chapter,
      });
    }
  }
  return runs
    .map(run =>
      run.start === run.end
        ? `${bookLabel(run.book)} ${run.start}`
        : `${bookLabel(run.book)} ${run.start}–${run.end}`,
    )
    .join(' · ');
}
