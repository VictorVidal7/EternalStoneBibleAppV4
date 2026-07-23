/**
 * Local calendar-day key (`YYYY-MM-DD`) — the app's shared definition of
 * "what day is it" for every daily-habit tracker (reading streak, devotion,
 * mood/feelings, prayer log). Local, not UTC, so the day boundary lands where
 * the user's own clock says midnight, not Greenwich's — a negative-UTC-offset
 * user reading in the evening stays on "today" instead of silently rolling
 * into "tomorrow" hours before their own midnight.
 *
 * Extracted from feelingsLog's original `feelingsDateKey` (Sprint 80, the
 * first tracker to get this right) so every habit can share one definition
 * instead of each recomputing its own.
 */
export function localDayKey(now: number): string {
  const d = new Date(now);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}
