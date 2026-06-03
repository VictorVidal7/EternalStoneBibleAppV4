/**
 * ⭐ specialAchievements — PURE decision logic for time-of-day SPECIAL badges.
 *
 * Sprint 63 correctness fix. SPECIAL-category achievements have no backing stat
 * counter, so `getCategoryProgress` maps them to 0 (see [[progress]]) and the
 * generic `checkAchievements` loop can NEVER unlock them. Two of them are purely
 * EVENT-driven — they depend on WHEN the user reads, not on any accumulated
 * total:
 *   • `early_bird` — "Read before 6 AM"
 *   • `night_owl`  — "Read after 11 PM"
 * Before this fix neither had any trigger anywhere, so both were unreachable.
 *
 * This module isolates the (pure, hour → ids) decision so it is unit-testable in
 * isolation; `AchievementService.trackVersesRead` calls it with the local hour
 * of the reading event and unlocks whatever it returns (idempotent — unlocking
 * an already-unlocked badge is a no-op).
 *
 * NOTE: `gospels_complete` (the third never-unlocking SPECIAL) is NOT handled
 * here — it needs real book-completion DETECTION (the `trackBookCompleted` hook
 * is currently dead code, never called), which is the parked per-book work.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** `early_bird` unlocks when the reading hour is strictly before this (6 AM). */
export const EARLY_BIRD_BEFORE_HOUR = 6;

/** `night_owl` unlocks when the reading hour is at or after this (11 PM). */
export const NIGHT_OWL_FROM_HOUR = 23;

/** Achievement ids unlocked by reading early / late. */
export const EARLY_BIRD_ID = 'early_bird';
export const NIGHT_OWL_ID = 'night_owl';

/**
 * The SPECIAL achievement ids a reading event at `hour` (0–23, local time)
 * satisfies. Returns an empty array for any hour in the ordinary daytime band,
 * or for a non-finite hour (defensive — the caller passes `Date#getHours()`).
 */
export function specialAchievementsForHour(hour: number): string[] {
  if (!Number.isFinite(hour)) return [];
  const ids: string[] = [];
  if (hour < EARLY_BIRD_BEFORE_HOUR) ids.push(EARLY_BIRD_ID);
  if (hour >= NIGHT_OWL_FROM_HOUR) ids.push(NIGHT_OWL_ID);
  return ids;
}
