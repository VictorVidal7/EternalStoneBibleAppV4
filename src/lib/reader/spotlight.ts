/**
 * 🔦 spotlight — PURE reading focus model (Sprint 69).
 *
 * When the reader has a verse selection, the surrounding verses dim so the
 * selection "pops" — a distraction-reduced reading focus, automatic with zero
 * new UI. This is a STATIC opacity (not an animated fade): a contrast change,
 * not motion, so it is reduce-motion-safe by construction and shows instantly.
 *
 * Kept pure (no React) so the focus math is unit-tested in isolation; the
 * reader just maps each verse number through `spotlightOpacity`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

/** Resting opacity for a verse that is NOT part of the active selection. */
export const SPOTLIGHT_DIM = 0.32;

/** Full opacity — selected verses, or when no spotlight is active. */
export const SPOTLIGHT_FULL = 1;

/**
 * The opacity a verse should render at. A verse is full-opacity when the
 * spotlight is disabled, when there is no selection at all, or when the verse
 * itself is selected; otherwise it dims to `SPOTLIGHT_DIM`.
 */
export function spotlightOpacity(
  verseNumber: number,
  selected: ReadonlySet<number>,
  enabled = true,
): number {
  if (!enabled || selected.size === 0 || selected.has(verseNumber)) {
    return SPOTLIGHT_FULL;
  }
  return SPOTLIGHT_DIM;
}

/**
 * Dedicated Focus mode (Sprint 70). Like the selection spotlight, but driven by
 * a SINGLE "focused" verse — the one centered in the viewport — rather than the
 * user's tap selection. Full opacity when focus is off, when there is no focused
 * verse, or for the focused verse itself; otherwise it dims to `SPOTLIGHT_DIM`.
 * Still a STATIC opacity → reduce-motion-safe, same as the selection spotlight.
 *
 * Compose the two with `Math.min` in the reader: each is a no-op (returns
 * `SPOTLIGHT_FULL`) when its own driver is inactive, so the dimmer of the two
 * wins when both are active.
 */
export function focusVerseOpacity(
  verseNumber: number,
  focusedVerse: number | null,
  enabled = true,
): number {
  if (!enabled || focusedVerse === null || verseNumber === focusedVerse) {
    return SPOTLIGHT_FULL;
  }
  return SPOTLIGHT_DIM;
}

/**
 * The verse to spotlight in Focus mode: the one whose row crosses the vertical
 * CENTER of the viewport. `offsets` are each verse's row-top Y within the scroll
 * content (the reader already records these for audio auto-scroll). Returns the
 * verse with the greatest top-Y at or above the center line — i.e. the verse the
 * center line currently sits inside — or the topmost verse before the first row
 * reaches center, or `null` when there are no offsets yet.
 */
export function focusedVerseFromOffsets(
  offsets: ReadonlyArray<{verse: number; y: number}>,
  scrollY: number,
  viewportHeight: number,
): number | null {
  if (offsets.length === 0) return null;
  const center = scrollY + viewportHeight / 2;
  let focused: number | null = null;
  let bestY = -Infinity;
  let topVerse = offsets[0];
  for (const o of offsets) {
    if (o.y < topVerse.y) topVerse = o;
    if (o.y <= center && o.y > bestY) {
      bestY = o.y;
      focused = o.verse;
    }
  }
  // Before the first row's top crosses center (the very top of the chapter),
  // focus the topmost verse.
  return focused ?? topVerse.verse;
}
