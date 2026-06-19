/**
 * 🎚️ prepRange — pure clamping for the "Mesa de preparación" verse-range picker
 * (Sprint 105).
 *
 * The prep screen lets a teacher widen the passage from a single verse to a
 * range (e.g. John 3:16 → 16-21) with steppers. This holds the invariant the
 * steppers must keep — 1 ≤ start ≤ end ≤ maxVerse — free of React so it is unit
 * -testable, like [[prepTable]] / [[prepNotes]]. `maxVerse` is the chapter's
 * verse count (from the DB); a non-positive/unknown max leaves the upper bound
 * open so the picker still works before the count has loaded.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface VerseRange {
  start: number;
  end: number;
}

/**
 * Clamp `start`/`end` into a valid range: integers, 1 ≤ start ≤ end ≤ maxVerse.
 * A start pushed past the end pulls the end up to meet it; an end pulled below
 * the start is raised back to the start. A maxVerse < 1 (unknown/not yet loaded)
 * leaves the upper bound open.
 */
export function clampRange(
  start: number,
  end: number,
  maxVerse: number,
): VerseRange {
  const max =
    Number.isFinite(maxVerse) && maxVerse >= 1
      ? Math.floor(maxVerse)
      : Number.MAX_SAFE_INTEGER;
  let s = Number.isFinite(start) ? Math.floor(start) : 1;
  let e = Number.isFinite(end) ? Math.floor(end) : s;
  s = Math.min(Math.max(1, s), max);
  e = Math.min(Math.max(s, e), max);
  return {start: s, end: e};
}

/** Move the range start by `delta`, keeping the range valid. */
export function adjustStart(
  range: VerseRange,
  delta: number,
  maxVerse: number,
): VerseRange {
  return clampRange(range.start + delta, range.end, maxVerse);
}

/** Move the range end by `delta`, keeping the range valid. */
export function adjustEnd(
  range: VerseRange,
  delta: number,
  maxVerse: number,
): VerseRange {
  return clampRange(range.start, range.end + delta, maxVerse);
}

/** Whether the start can step down (not already at verse 1). */
export function canDecreaseStart(range: VerseRange): boolean {
  return range.start > 1;
}

/** Whether the start can step up (stays ≤ end). */
export function canIncreaseStart(range: VerseRange): boolean {
  return range.start < range.end;
}

/** Whether the end can step down (stays ≥ start). */
export function canDecreaseEnd(range: VerseRange): boolean {
  return range.end > range.start;
}

/** Whether the end can step up (not already at the chapter's last verse). */
export function canIncreaseEnd(range: VerseRange, maxVerse: number): boolean {
  if (!Number.isFinite(maxVerse) || maxVerse < 1) return true;
  return range.end < Math.floor(maxVerse);
}
