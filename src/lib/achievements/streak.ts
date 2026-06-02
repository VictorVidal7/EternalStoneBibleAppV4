/**
 * Pure reading-streak math.
 *
 * The reading-streak counters in `user_stats` (`current_streak` /
 * `longest_streak`) were historically maintained by an incremental updater
 * that ran AFTER `last_read_date` had already been bumped to "today", so it
 * always saw `diffDays === 0` ("already read today") and never advanced —
 * leaving both columns pinned at 0 even for users with many active days
 * (Sprint 58 bug). The robust fix is to stop trusting the incremental
 * counter and instead recompute the streak from `reading_streak_log`, which
 * is the real per-day record of which calendar days the user read.
 *
 * This module is React/RN/DB-free and defensive so it can be unit-tested in
 * isolation (mirrors the purity of `journeyRecap.ts` / `insights.ts`).
 */

/**
 * Convert a `YYYY-MM-DD` string to a whole day-number (days since the Unix
 * epoch, in UTC). Returns null for anything that isn't a real calendar date,
 * so malformed log rows are simply ignored rather than corrupting the count.
 */
function toDayNumber(iso: string): number | null {
  if (typeof iso !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const ms = Date.UTC(year, month - 1, day);
  if (Number.isNaN(ms)) return null;
  // Reject out-of-range components (e.g. 2026-13-40 rolls over in Date.UTC).
  const dt = new Date(ms);
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(ms / 86_400_000);
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Compute the current and longest reading streak from the set of calendar
 * days on which the user read.
 *
 * @param dates    Day strings (`YYYY-MM-DD`); duplicates, ordering and
 *                 malformed entries are tolerated.
 * @param todayIso Today's day string (`YYYY-MM-DD`, same UTC basis the rest
 *                 of the service uses). Anchors the "current" streak.
 *
 * - `longestStreak`: the longest run of consecutive calendar days, ever.
 * - `currentStreak`: the run of consecutive days ending **today** — or
 *   **yesterday** if today has no entry yet (the streak is still alive until
 *   the day passes). 0 once the most recent active day is older than that.
 */
export function computeStreaks(
  dates: readonly string[],
  todayIso: string,
): StreakResult {
  const days = new Set<number>();
  if (Array.isArray(dates)) {
    for (const d of dates) {
      const n = toDayNumber(d);
      if (n !== null) days.add(n);
    }
  }

  if (days.size === 0) {
    return {currentStreak: 0, longestStreak: 0};
  }

  const sorted = [...days].sort((a, b) => a - b);

  // Longest run of consecutive days anywhere in the history.
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
    if (run > longestStreak) longestStreak = run;
  }

  // Current streak: walk back from today (or yesterday if today is empty).
  let currentStreak = 0;
  const today = toDayNumber(todayIso);
  if (today !== null) {
    let anchor: number | null = null;
    if (days.has(today)) anchor = today;
    else if (days.has(today - 1)) anchor = today - 1;

    if (anchor !== null) {
      let cursor = anchor;
      while (days.has(cursor)) {
        currentStreak += 1;
        cursor -= 1;
      }
    }
  } else {
    // Unparseable "today" — fall back to the run ending at the most recent
    // active day so the value is still meaningful rather than 0.
    currentStreak = run;
  }

  return {currentStreak, longestStreak};
}
