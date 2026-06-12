/**
 * 🏁 planCompletion — PURE completion stamp for reading plans (Sprint 81).
 *
 * `@reading_plan_progress` recorded `startedAt` but never WHEN a plan was
 * finished, so the timeline had to omit plan completions honestly. From this
 * sprint on, the moment `completedDays` covers the whole plan the entry gains
 * a `completedAt` ISO stamp.
 *
 * CONSERVE-ONCE-EARNED: the first completion is a historical milestone (same
 * semantics as streak records). Un-toggling a day later does NOT clear the
 * stamp, and re-completing does NOT move it. Plans finished before this
 * sprint carry no stamp and stay honestly omitted from the timeline.
 *
 * Pure and storage-free (mirrors [[planPace]]) so the transition logic is
 * unit-testable in isolation.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface CompletablePlanProgress {
  completedDays: number[];
  startedAt: string;
  /** ISO stamp of the FIRST time the plan reached full completion. */
  completedAt?: string;
}

/**
 * Returns the entry with `completedAt` stamped when it just reached full
 * completion, the SAME entry otherwise. Distinct-day count (defensive against
 * duplicates) must reach `planDuration`; a non-positive duration never
 * stamps (malformed plan). An existing stamp always wins.
 */
export function withCompletionStamp<T extends CompletablePlanProgress>(
  entry: T,
  planDuration: number,
  nowIso: string,
): T {
  if (entry.completedAt) return entry;
  if (!Number.isFinite(planDuration) || planDuration <= 0) return entry;
  const distinct = new Set(entry.completedDays).size;
  if (distinct < planDuration) return entry;
  return {...entry, completedAt: nowIso};
}
