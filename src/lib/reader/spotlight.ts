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
