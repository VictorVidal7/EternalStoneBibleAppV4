/**
 * 🧵 REFERENCE CHAIN — pure trail logic for guided cross-reference threads
 * (Sprint 86).
 *
 * A "thread" is a verse→verse journey the reader builds by following one of a
 * verse's cross-references, then one of THAT verse's, and so on. This module
 * owns only the trail bookkeeping — push the next step, retrace to an earlier
 * one, step back — kept pure (no SQLite, no cross-reference catalog, no React)
 * so it unit-tests deterministically; the screen pairs it with the existing
 * `getCrossReferences` graph + `bibleDB` for the verse text.
 *
 * The trail is ordered seed → … → current (`trail[0]` is where the thread
 * began, the last element is where the reader is now). Advancing is cycle-safe:
 * revisiting a verse already in the trail truncates back to it rather than
 * growing the trail forever, so the breadcrumb stays an honest path.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** One verse on the thread. `book` is the canonical (English) book key. */
export interface ChainStep {
  book: string;
  chapter: number;
  verse: number;
}

/** Stable key for a step — also the cross-reference graph's key shape. */
export function chainStepKey(step: ChainStep): string {
  return `${step.book}/${step.chapter}/${step.verse}`;
}

/** Whether two steps point at the same verse. */
export function stepsEqual(a: ChainStep, b: ChainStep): boolean {
  return chainStepKey(a) === chainStepKey(b);
}

/** The verse the reader is currently on (the trail head = last element). */
export function currentStep(trail: readonly ChainStep[]): ChainStep | null {
  return trail.length > 0 ? trail[trail.length - 1] : null;
}

/** How many verses deep the thread is (1 = just the seed). */
export function chainDepth(trail: readonly ChainStep[]): number {
  return trail.length;
}

/** Whether `step` already appears anywhere in the trail. */
export function isInChain(
  trail: readonly ChainStep[],
  step: ChainStep,
): boolean {
  const key = chainStepKey(step);
  return trail.some(s => chainStepKey(s) === key);
}

/**
 * Advance the thread to `next`, returning a NEW trail:
 *  - if `next` is already the current verse → unchanged (no self-loop);
 *  - if `next` is earlier in the trail → truncate back to it (retrace, no dup);
 *  - otherwise → append it.
 */
export function advanceChain(
  trail: readonly ChainStep[],
  next: ChainStep,
): ChainStep[] {
  if (trail.length === 0) return [next];
  const key = chainStepKey(next);
  const existingIndex = trail.findIndex(s => chainStepKey(s) === key);
  if (existingIndex >= 0) {
    // Already on the path — retrace to it (drop everything after).
    return trail.slice(0, existingIndex + 1);
  }
  return [...trail, next];
}

/** Step back one verse. Never empties below the seed (length stays ≥ 1). */
export function retreatChain(trail: readonly ChainStep[]): ChainStep[] {
  if (trail.length <= 1) return [...trail];
  return trail.slice(0, trail.length - 1);
}

/** Jump to the step at `index` (truncating everything after it). */
export function truncateChainTo(
  trail: readonly ChainStep[],
  index: number,
): ChainStep[] {
  if (index < 0) return [];
  if (index >= trail.length) return [...trail];
  return trail.slice(0, index + 1);
}
