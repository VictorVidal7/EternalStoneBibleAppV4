/**
 * 📜 dailyVerseHistory — PURE policy for browsing the daily verse's
 * PREVIOUS days (Sprint 78).
 *
 * The verse of the day is deterministic from the calendar date
 * ([[daily-verses]]' getDailyVerseRef), so any past day's verse can be
 * recomputed offline — no log, no storage. These helpers give the Home
 * card a bounded "time machine": a day offset clamped to a small window,
 * local-calendar date shifting (DST-safe via setDate, not ms math), and
 * the caption policy (today / yesterday / a formatted date).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** How many days BEFORE today the history can reach (today + 6 = a week). */
export const DAILY_HISTORY_MAX_BACK = 6;

/**
 * The local calendar day `daysBack` days before `now`. Uses setDate so a
 * DST boundary can't slide the result into the wrong day (ms arithmetic
 * across a 23h/25h day would).
 */
export function shiftDaysBack(now: Date, daysBack: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - daysBack);
  return d;
}

/** Clamp an arbitrary offset into the browsable [0, DAILY_HISTORY_MAX_BACK]. */
export function clampDayOffset(offset: number): number {
  if (!Number.isFinite(offset)) return 0;
  return Math.min(Math.max(Math.trunc(offset), 0), DAILY_HISTORY_MAX_BACK);
}

/** How the day caption should read for a given offset. */
export type DayCaptionKind = 'today' | 'yesterday' | 'date';

export function dayCaptionKind(offset: number): DayCaptionKind {
  if (offset <= 0) return 'today';
  if (offset === 1) return 'yesterday';
  return 'date';
}

/** Whether the back chevron is enabled at this offset (history has an end). */
export function canGoBack(offset: number): boolean {
  return offset < DAILY_HISTORY_MAX_BACK;
}

/** Whether the forward chevron / "today" reset apply (we're in the past). */
export function canGoForward(offset: number): boolean {
  return offset > 0;
}
