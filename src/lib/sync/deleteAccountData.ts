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
 *
 * R9-25 — in pages, never the whole collection at once: each read is
 * `limit(ACCOUNT_DELETION_BATCH_SIZE)`, that page is deleted, and the next
 * read starts over from what is left. At most one page of deletes is in
 * flight. The FIRST page with a failed delete stops the whole wipe: the
 * rest is not even read, so a run that cannot finish (the shared daily
 * quota spent, the network gone) does not keep spending reads and writes,
 * and a retry picks up what is left. Paging does not lower the cost of a
 * complete wipe — N docs are still N reads and N deletes, which no client
 * can avoid.
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

/**
 * R9-25 — one page of the wipe. The same size as the reviewEvents cleanup
 * (`REVIEW_EVENTS_CLEANUP_BATCH_SIZE`), its own constant because that one
 * caps a pass per engine start and this one only bounds what is in flight.
 */
const ACCOUNT_DELETION_BATCH_SIZE = 200;

/** Deletes every doc of one collection, page by page. Returns `false` on the
 *  first page with a failed delete, or when a doc already deleted comes back
 *  (a stale read would otherwise loop forever). Throws if a read throws. */
async function deleteCollectionInPages(
  fn: NonNullable<ReturnType<typeof getFirestore>>,
  path: string,
  collection: string,
): Promise<boolean> {
  const deleted = new Set<string>();
  for (;;) {
    const snapshot = await fn()
      .collection(path)
      .limit(ACCOUNT_DELETION_BATCH_SIZE)
      .get();
    const docs = snapshot.docs;
    if (docs.length === 0) return true;
    if (docs.some(doc => deleted.has(doc.id))) {
      logger.error(
        'deleteAllCloudData: a deleted doc came back',
        new Error(`${collection}: stale read after delete`),
        {component: 'sync/deleteAccountData', collection},
      );
      return false;
    }
    const results = await Promise.allSettled(
      docs.map(doc => fn().collection(path).doc(doc.id).delete()),
    );
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      logger.error(
        'deleteAllCloudData: some docs failed to delete',
        new Error(`${failed}/${docs.length} deletes failed`),
        {component: 'sync/deleteAccountData', collection},
      );
      return false;
    }
    for (const doc of docs) deleted.add(doc.id);
    // A short page was the last one: no read just to see it empty.
    if (docs.length < ACCOUNT_DELETION_BATCH_SIZE) return true;
  }
}

export async function deleteAllCloudData(uid: string): Promise<void> {
  const fn = getFirestore();
  if (!fn) return;

  for (const collection of USER_DATA_COLLECTIONS) {
    const path = `users/${uid}/${collection}`;
    let ok: boolean;
    try {
      ok = await deleteCollectionInPages(fn, path, collection);
    } catch (err) {
      logger.error(
        'deleteAllCloudData: collection query/delete failed',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'sync/deleteAccountData', collection},
      );
      ok = false;
    }
    if (!ok) {
      throw new Error(`Account data deletion incomplete for: ${collection}`);
    }
  }
}

export {USER_DATA_COLLECTIONS, ACCOUNT_DELETION_BATCH_SIZE};
