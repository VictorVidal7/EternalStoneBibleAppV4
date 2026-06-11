/**
 * 📊 weekComparison — PURE model for "this week vs last week" (Sprint 78).
 *
 * [[weeklyRecap]]'s buildWeeklyRecap is parameterized by `now`, so the
 * PREVIOUS 7-day window is the same composition anchored 7 local days back —
 * nothing new is logged or stored. This module derives honest per-metric
 * deltas (verses read, reading time, listening time/verses, active days)
 * with an explicit trend, and flags empty weeks so the UI can stay truthful
 * instead of celebrating a division by zero.
 *
 * The anchor shifts via setDate (local calendar days, the [[dailyVerseHistory]]
 * lesson) — a flat 7×24h subtraction would land on the wrong local day across
 * a DST boundary.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {ListeningStats} from '@/features/audio';
import {
  buildWeeklyRecap,
  RECAP_WINDOW_DAYS,
  type WeeklyRecap,
} from './weeklyRecap';
import type {ReadingLogEntry} from './readingInsights';

export type WeekTrend = 'up' | 'down' | 'same';

export interface WeekMetricDelta {
  current: number;
  previous: number;
  /** current − previous. */
  delta: number;
  trend: WeekTrend;
}

export interface WeekComparison {
  /** False when BOTH weeks are empty — the UI hides the card entirely. */
  hasAnyActivity: boolean;
  currentHasActivity: boolean;
  previousHasActivity: boolean;
  /** Whether either week heard anything — gates the listening row. */
  hasListening: boolean;
  versesRead: WeekMetricDelta;
  readingSeconds: WeekMetricDelta;
  listeningMs: WeekMetricDelta;
  versesHeard: WeekMetricDelta;
  daysActive: WeekMetricDelta;
}

export interface WeekComparisonInput {
  readingLog: ReadingLogEntry[];
  listening: ListeningStats;
  now: number;
}

/** `now` anchored RECAP_WINDOW_DAYS local calendar days earlier. */
export function previousWeekAnchor(now: number): number {
  const d = new Date(now);
  d.setDate(d.getDate() - RECAP_WINDOW_DAYS);
  return d.getTime();
}

function metric(current: number, previous: number): WeekMetricDelta {
  const delta = current - previous;
  return {
    current,
    previous,
    delta,
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same',
  };
}

/** Compose both windows and derive the deltas. */
export function compareWeeks(input: WeekComparisonInput): WeekComparison {
  // Streaks aren't compared — feed the recap zeros so the shape typechecks.
  const base = {
    readingLog: input.readingLog,
    listening: input.listening,
    readingStreak: 0,
    listeningStreak: 0,
  };
  const current: WeeklyRecap = buildWeeklyRecap({...base, now: input.now});
  const previous: WeeklyRecap = buildWeeklyRecap({
    ...base,
    now: previousWeekAnchor(input.now),
  });

  return {
    hasAnyActivity: current.hasActivity || previous.hasActivity,
    currentHasActivity: current.hasActivity,
    previousHasActivity: previous.hasActivity,
    hasListening:
      current.listeningMs > 0 ||
      previous.listeningMs > 0 ||
      current.versesHeard > 0 ||
      previous.versesHeard > 0,
    versesRead: metric(current.versesRead, previous.versesRead),
    readingSeconds: metric(current.readingSeconds, previous.readingSeconds),
    listeningMs: metric(current.listeningMs, previous.listeningMs),
    versesHeard: metric(current.versesHeard, previous.versesHeard),
    daysActive: metric(current.daysActive, previous.daysActive),
  };
}
