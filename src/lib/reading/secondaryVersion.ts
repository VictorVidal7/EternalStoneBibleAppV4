/**
 * 📖 secondaryVersion — PURE selection of the reader's dual-view companion.
 *
 * Sprint 66. The reader's side-by-side ("Dual") mode pairs each verse with its
 * counterpart from a SECOND translation. Until now the companion was hardcoded
 * as `versions.find(v => v.id !== primary)` — fine with exactly two versions,
 * but the moment a third shipped (WEB) that silently picked whichever happened
 * to come first, with no way for the reader to choose. These helpers make the
 * companion a real, user-chosen + persisted decision while staying defensive:
 * an unknown/stale preference, or a preference that equals the primary, falls
 * back to the first available companion, and a single-version install yields
 * none.
 *
 * Kept pure + generic (over anything with an `id`) so it is unit-testable with
 * no React / SQLite and reusable by any surface that needs "the other version".
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export interface VersionLike {
  id: string;
}

/**
 * How the dual ("side-by-side") reader lays the two translations out:
 *  - `stacked` — the companion sits UNDER each verse, smaller + dimmer, as
 *    supporting context (the original Sprint 66 behavior, still the default).
 *  - `columns` — the two translations sit in equal-weight columns, same font
 *    size, so neither reads as secondary (Sprint 67).
 */
export type DualLayout = 'stacked' | 'columns';

export const DEFAULT_DUAL_LAYOUT: DualLayout = 'stacked';

/** Normalize a persisted/unknown value to a valid {@link DualLayout}. */
export function normalizeDualLayout(
  value: string | null | undefined,
): DualLayout {
  return value === 'columns' ? 'columns' : 'stacked';
}

/** The other layout — for a single toggle control. */
export function toggleDualLayout(layout: DualLayout): DualLayout {
  return layout === 'columns' ? 'stacked' : 'columns';
}

/**
 * Swap which translation is primary (read full-size / app-wide) and which is
 * the companion. Returns the new {primaryId, secondaryId} pair, or the input
 * unchanged when there is no companion to swap with (defensive: a
 * single-version install has nothing to swap).
 */
export function swapVersions(
  primaryId: string,
  secondaryId: string | null | undefined,
): {primaryId: string; secondaryId: string} {
  if (!secondaryId || secondaryId === primaryId) {
    return {primaryId, secondaryId: secondaryId ?? primaryId};
  }
  return {primaryId: secondaryId, secondaryId: primaryId};
}

/**
 * The translations eligible to sit alongside `primaryId` (everything except the
 * one currently being read), preserving the input order.
 */
export function secondaryVersionChoices<T extends VersionLike>(
  primaryId: string,
  versions: T[],
): T[] {
  return versions.filter(v => v.id !== primaryId);
}

/**
 * The companion version to render in dual mode:
 *  - the user's `preferredId` when it is a real, still-available, non-primary
 *    version,
 *  - otherwise the first available companion,
 *  - or `undefined` when no other version exists (single-version install).
 */
export function resolveSecondaryVersion<T extends VersionLike>(
  primaryId: string,
  preferredId: string | null | undefined,
  versions: T[],
): T | undefined {
  const choices = secondaryVersionChoices(primaryId, versions);
  if (choices.length === 0) return undefined;
  if (preferredId) {
    const match = choices.find(v => v.id === preferredId);
    if (match) return match;
  }
  return choices[0];
}
