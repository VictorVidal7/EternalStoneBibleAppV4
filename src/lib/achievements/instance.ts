/**
 * Module-level `AchievementService` singleton accessor — same pattern as
 * `src/lib/sync/instance.ts`'s `getSyncEngine`/`setSyncEngine`.
 *
 * The app-wide instance is created inside `ServicesContext` (so React
 * lifecycle owns its mount), but `BackupService`'s export/import flow lives
 * outside the React tree and previously constructed its OWN separate
 * `AchievementService(bibleDB)` instance. `AchievementService` caches
 * `getUserStats()` in a private, per-instance `this.stats` field that only
 * that instance's own mutator methods invalidate (including
 * `restoreBackup()`, which already nulls it out after a restore). With two
 * independent instances, restoring a backup invalidated the WRONG one —
 * the Achievements tab (via `useAchievements` → `useServices()`) kept
 * reading the shared instance's stale cache until an app restart threw it
 * away.
 *
 * `ServicesContext` mirrors its instance into this singleton via
 * `setAchievementServiceInstance()` once created; `BackupService` reaches it
 * via `getAchievementServiceInstance()` so `restoreBackup()`'s existing
 * cache invalidation lands on the SAME instance the Achievements tab reads.
 */
import type {AchievementService} from './AchievementService';

let instance: AchievementService | null = null;

export function setAchievementServiceInstance(
  service: AchievementService | null,
): void {
  instance = service;
}

export function getAchievementServiceInstance(): AchievementService | null {
  return instance;
}
