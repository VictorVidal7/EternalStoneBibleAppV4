/**
 * ⏲️ sleepTimer — PURE wall-clock reconciliation for the timed sleep timer.
 *
 * The timed ("stop in N minutes") sleep timer is driven by a JS `setTimeout` +
 * a per-minute `setInterval`. Both are THROTTLED or fully SUSPENDED while the
 * app is backgrounded (screen off / home button) — so on return the countdown
 * has drifted and the stop may fire late. Rather than trust the JS clock, the
 * engine stores the wall-clock `endTime` and reconciles against it whenever the
 * app comes back to the foreground.
 *
 * This isolates that arithmetic so it is unit-tested without React/AppState: the
 * provider just feeds it `endTime` + `Date.now()` and acts on the result (fire +
 * cancel when expired, otherwise re-arm the timers and resync the displayed
 * minutes).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface SleepReconcileResult {
  /** True when `endTime` has already passed — the timer should fire now. */
  expired: boolean;
  /** Milliseconds left until `endTime` (0 when expired). */
  remainingMs: number;
  /** Whole minutes left, rounded UP (so "0:30 left" still shows "1 min"). */
  remainingMinutes: number;
}

/**
 * Reconcile a timed sleep timer against the wall clock. `endTime`/`now` are epoch
 * milliseconds. Expired exactly at (or past) `endTime`. When still running,
 * `remainingMinutes` is the ceiling of the remaining time so the UI never shows
 * "0 min" while audio is still playing.
 */
export function reconcileSleepTimer(
  endTime: number,
  now: number,
): SleepReconcileResult {
  const remainingMs = endTime - now;
  if (remainingMs <= 0) {
    return {expired: true, remainingMs: 0, remainingMinutes: 0};
  }
  return {
    expired: false,
    remainingMs,
    remainingMinutes: Math.ceil(remainingMs / 60000),
  };
}
