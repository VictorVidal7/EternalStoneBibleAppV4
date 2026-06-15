/**
 * 🕯️ DEVOTION LOG — pure model for the daily "Momento con Dios" habit
 * (Sprint 84).
 *
 * Every time the reader completes the four-movement lectio ("Momento con
 * Dios") — whether they arrived via the guided devotion or opened it directly
 * — the day is stamped here. From that per-day record we derive a streak (the
 * constancy of the walk), exactly mirroring the feelings log: a tiny device-
 * local store + a React-/storage-free model the screens compose.
 *
 * The streak math is NOT re-implemented: it REUSES {@link computeStreaks} (the
 * canonical reading-streak engine), so "current/longest" mean the same thing
 * here as everywhere else in the app (a run ending today, or yesterday while
 * today is still open). Day keys are the SAME local-calendar `YYYY-MM-DD` the
 * feelings log uses, so the two habits line up by construction.
 *
 * NOT synced — a private record of time spent with God, like the feelings log.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {computeStreaks} from '@lib/achievements/streak';
import {feelingsDateKey} from './feelingsLog';

export interface DevotionLog {
  /** Local-day key (`YYYY-MM-DD`) → devotions completed that day (≥ 1). */
  days: Record<string, number>;
}

/**
 * A bit over a year of history — enough for an honest longest-streak and a
 * "this year" tally, still tiny on disk. (A run longer than this would be
 * truncated, which is a problem no real reader will ever have.)
 */
export const DEVOTION_RETENTION_DAYS = 400;

/** Local-day key for a timestamp — shared with the feelings log. */
export function devotionDateKey(now: number): string {
  return feelingsDateKey(now);
}

export function emptyDevotionLog(): DevotionLog {
  return {days: {}};
}

/** Defensively parse a raw storage blob (malformed anything → empty log). */
export function parseDevotionLog(raw: string | null): DevotionLog {
  if (!raw) return emptyDevotionLog();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return emptyDevotionLog();
    }
    const days = (parsed as {days?: unknown}).days;
    if (typeof days !== 'object' || days === null) return emptyDevotionLog();
    const clean: Record<string, number> = {};
    for (const [key, value] of Object.entries(days)) {
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(key) &&
        typeof value === 'number' &&
        Number.isFinite(value) &&
        value > 0
      ) {
        clean[key] = Math.floor(value);
      }
    }
    return {days: clean};
  } catch {
    return emptyDevotionLog();
  }
}

export function serializeDevotionLog(log: DevotionLog): string {
  return JSON.stringify(log);
}

/**
 * Stamp today's devotion (increments the day's count) and prune anything that
 * fell out of the retention window relative to `now`. Pure — returns a new log.
 * Recording twice in a day is harmless: the streak counts DISTINCT days.
 */
export function recordDevotion(log: DevotionLog, now: number): DevotionLog {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (DEVOTION_RETENTION_DAYS - 1));
  const cutoffKey = devotionDateKey(cutoff.getTime());
  const days: Record<string, number> = {};
  for (const [key, value] of Object.entries(log.days)) {
    if (key >= cutoffKey) days[key] = value;
  }
  const todayKey = devotionDateKey(now);
  days[todayKey] = (days[todayKey] ?? 0) + 1;
  return {days};
}

/** The constancy of the walk — current/longest streak + lifetime-in-window. */
export interface DevotionStreakSummary {
  /** Consecutive days ending today (or yesterday while today is still open). */
  current: number;
  /** Longest run of consecutive days within the retained window. */
  longest: number;
  /** Distinct days a devotion was completed (within retention). */
  totalDays: number;
  /** Whether today already carries a completed devotion. */
  todayDone: boolean;
}

/**
 * Derive the devotion streak from the log. Composes {@link computeStreaks}
 * (same semantics as the reading streak) over the log's day keys; `totalDays`
 * and `todayDone` are read straight off the record. Pure.
 */
export function devotionStreak(
  log: DevotionLog,
  now: number,
): DevotionStreakSummary {
  const todayKey = devotionDateKey(now);
  const keys = Object.keys(log.days);
  const {currentStreak, longestStreak} = computeStreaks(keys, todayKey);
  return {
    current: currentStreak,
    longest: longestStreak,
    totalDays: keys.length,
    todayDone: (log.days[todayKey] ?? 0) > 0,
  };
}
