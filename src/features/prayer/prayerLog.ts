/**
 * 🙏 PRAYER LOG — pure model for the daily prayer habit (Sprint 93).
 *
 * Every time the reader completes a guided ACTS prayer ("Adoración →
 * Confesión → Gratitud → Súplica"), the day is stamped here. From that
 * per-day record we derive a gentle streak — the constancy of coming to God in
 * prayer — exactly mirroring the [[devotionLog]] and feelings log.
 *
 * The streak math is NOT re-implemented: it REUSES {@link computeStreaks} (the
 * canonical reading-streak engine), so "current/longest" mean the same thing
 * here as everywhere else (a run ending today, or yesterday while today is
 * still open). Day keys are the SAME local-calendar `YYYY-MM-DD` the devotion
 * and feelings logs use, so the habits line up by construction.
 *
 * NOT synced — a private record of time in prayer, like the devotion log.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {computeStreaks} from '@lib/achievements/streak';
import {feelingsDateKey} from '@/features/study/feelingsLog';

export interface PrayerLog {
  /** Local-day key (`YYYY-MM-DD`) → prayers completed that day (≥ 1). */
  days: Record<string, number>;
}

/** A bit over a year of history — enough for an honest longest-streak. */
export const PRAYER_RETENTION_DAYS = 400;

/** Local-day key for a timestamp — shared with the devotion/feelings logs. */
export function prayerDateKey(now: number): string {
  return feelingsDateKey(now);
}

export function emptyPrayerLog(): PrayerLog {
  return {days: {}};
}

/** Defensively parse a raw storage blob (malformed anything → empty log). */
export function parsePrayerLog(raw: string | null): PrayerLog {
  if (!raw) return emptyPrayerLog();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return emptyPrayerLog();
    }
    const days = (parsed as {days?: unknown}).days;
    if (typeof days !== 'object' || days === null) return emptyPrayerLog();
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
    return emptyPrayerLog();
  }
}

export function serializePrayerLog(log: PrayerLog): string {
  return JSON.stringify(log);
}

/**
 * Stamp today's prayer (increments the day's count) and prune anything that
 * fell out of the retention window relative to `now`. Pure — returns a new log.
 * Recording twice in a day is harmless: the streak counts DISTINCT days.
 */
export function recordPrayer(log: PrayerLog, now: number): PrayerLog {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - (PRAYER_RETENTION_DAYS - 1));
  const cutoffKey = prayerDateKey(cutoff.getTime());
  const days: Record<string, number> = {};
  for (const [key, value] of Object.entries(log.days)) {
    if (key >= cutoffKey) days[key] = value;
  }
  const todayKey = prayerDateKey(now);
  days[todayKey] = (days[todayKey] ?? 0) + 1;
  return {days};
}

/** The constancy of the prayer life — current/longest streak + lifetime. */
export interface PrayerStreakSummary {
  /** Consecutive days ending today (or yesterday while today is still open). */
  current: number;
  /** Longest run of consecutive days within the retained window. */
  longest: number;
  /** Distinct days a prayer was completed (within retention). */
  totalDays: number;
  /** Whether today already carries a completed prayer. */
  todayDone: boolean;
}

/**
 * Derive the prayer streak from the log. Composes {@link computeStreaks} (same
 * semantics as the reading/devotion streak) over the log's day keys. Pure.
 */
export function prayerStreak(log: PrayerLog, now: number): PrayerStreakSummary {
  const todayKey = prayerDateKey(now);
  const keys = Object.keys(log.days);
  const {currentStreak, longestStreak} = computeStreaks(keys, todayKey);
  return {
    current: currentStreak,
    longest: longestStreak,
    totalDays: keys.length,
    todayDone: (log.days[todayKey] ?? 0) > 0,
  };
}
