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
