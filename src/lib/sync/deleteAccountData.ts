/**
 * Account deletion — full erasure of a user's Firestore data.
 *
 * Queries and deletes every doc across all known `users/{uid}/{collection}`
 * subcollections. Verified against the live Firestore rules (a permissive
 * `match /users/{uid}/{collection=**}` wildcard granting the owner
 * read/write, i.e. delete, on every subcollection including `conflicts`),
 * so this can run entirely client-side — no Cloud Function needed.
 *
 * Must run with the SyncEngine stopped (see AuthContext.deleteAccount) so
 * no live onSnapshot listener echoes these deletes back into local SQLite
 * mid-flight — local device data is intentionally left untouched by this
 * flow, same as sign-out.
 *
 * All-or-nothing gate: throws if any collection fails, so the caller never
 * proceeds to delete the Firebase Auth account on top of an incomplete
 * cloud wipe. Safe to retry — deleting is idempotent per doc.
 */

import {getFirestore} from './firestore';
import {logger} from '@lib/utils/logger';

const USER_DATA_COLLECTIONS = [
  'favorites',
  'notes',
  'highlights',
  // The "Marcadores"/Bookmarks feature was removed (retiredBookmarksMigration.ts
  // migrates any existing bookmark into a Favorito and best-effort deletes the
  // migrated doc from this collection) — normally empty by the time a user
  // reaches account deletion. Kept here as a deliberate defense-in-depth
  // safety net (an account deleted before that migration ever ran, or one of
  // its best-effort remote deletes having failed) so account deletion never
  // leaves a stray doc behind. The generic query-then-delete loop below costs
  // almost nothing against an empty/near-empty collection.
  'bookmarks',
  'memoryCards',
  // Legacy per-review docs from before the local-first change still need
  // wiping (the 12-month cleanup would otherwise leave up to a year of them).
  'reviewEvents',
  // The single `summary` aggregate doc — the generic query-then-delete loop
  // handles a one-doc collection unchanged (its id is just `summary`).
  'memoryStats',
  'conflicts',
] as const;

export async function deleteAllCloudData(uid: string): Promise<void> {
  const fn = getFirestore();
  if (!fn) return;

  const failedCollections: string[] = [];

  for (const collection of USER_DATA_COLLECTIONS) {
    const path = `users/${uid}/${collection}`;
    try {
      const snapshot = await fn().collection(path).get();
      const results = await Promise.allSettled(
        snapshot.docs.map(doc => fn().collection(path).doc(doc.id).delete()),
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        failedCollections.push(collection);
        logger.error(
          'deleteAllCloudData: some docs failed to delete',
          new Error(`${failed}/${snapshot.docs.length} deletes failed`),
          {component: 'sync/deleteAccountData', collection},
        );
      }
    } catch (err) {
      failedCollections.push(collection);
      logger.error(
        'deleteAllCloudData: collection query/delete failed',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'sync/deleteAccountData', collection},
      );
    }
  }

  if (failedCollections.length > 0) {
    throw new Error(
      `Account data deletion incomplete for: ${failedCollections.join(', ')}`,
    );
  }
}

export {USER_DATA_COLLECTIONS};
