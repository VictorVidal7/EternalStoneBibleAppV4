/**
 * Sprint 45 — reviewEvents SyncAdapter (Ola F.2, the 6th synced dataset).
 *
 * The append-only SRS review log lives in the `review_events` SQLite
 * table (via `reviewEventStore`). Like notes/highlights there is no React
 * context for it — the outbound write is queued by the review callsite
 * (`MemoryDeckContext.reviewCard`), and this adapter handles the inbound
 * side plus the initial bulk push (`pullAllLocal`).
 *
 * Events are **immutable and append-only**: each Firestore doc id
 * (`${verseKey}__${reviewedAt}`) is written exactly once, so two devices
 * can never produce divergent versions of the same event. The adapter
 * therefore opts out of conflict detection (`getMaterialFields` → []),
 * leaving pure — and trivial — last-write-wins.
 *
 * Quota hardening — this collection only syncs a rolling 12-month window
 * (see `isReviewEventWithinSyncWindow` / `isReviewEventEligibleForCloud-
 * Cleanup` in `@lib/memory/reviewEvents`; SyncEngine.cleanupOldReviewEvents
 * deletes anything older directly from Firestore). Two consequences here:
 *
 *  1. `applyRemoteUpsert` defensively skips writing an incoming remote
 *     event that is already outside the window — it would just be
 *     deleted by the next cleanup pass anyway, so there is no point
 *     re-adding it to local SQLite first (harmless either way, but this
 *     avoids the pointless round trip).
 *  2. `applyRemoteDelete` is a deliberate NO-OP. Nothing in this codebase
 *     ever calls `queueDelete('reviewEvents', …)` or writes a
 *     `deleted:true` tombstone for this collection (reviewEvents are
 *     append-only) — so historically this hook was unreachable. The
 *     cleanup sweep is the FIRST code path that ever hard-deletes a
 *     reviewEvents doc from Firestore, and per this project's rule that
 *     the cleanup must NEVER touch the local SQLite copy, this handler
 *     must not cascade a Firestore-side delete (cleanup OR any live
 *     listener that happens to observe one, e.g. a freshly-attached
 *     listener on a brand-new device racing the cleanup sweep) into a
 *     `removeReviewEvent` call. Local history is retained forever
 *     regardless of what the cloud copy keeps.
 */

import {
  addReviewEvent,
  getAllReviewEvents,
  getReviewEventById,
} from '@lib/memory/reviewEventStore';
import {logger} from '@lib/utils/logger';
import {
  isReviewEventWithinSyncWindow,
  remoteToReviewEvent,
  reviewEventToRemote,
  type RemoteReviewEvent,
} from '@lib/memory/reviewEvents';
import type {SyncAdapter} from '../types';

export const reviewEventsSyncAdapter: SyncAdapter<RemoteReviewEvent> = {
  collection: 'reviewEvents',

  async getLocal(id) {
    const event = await getReviewEventById(id);
    return event ? reviewEventToRemote(event) : null;
  },

  async applyRemoteUpsert(id, data) {
    // Defensive guard (see file header) — the primary enforcement is the
    // cloud-only cleanup sweep, not this check, so an ambiguous/missing
    // reviewedAt/updatedAt is treated as "within window" and applied.
    const reviewedAt =
      typeof data.reviewedAt === 'number' ? data.reviewedAt : data.updatedAt;
    if (!isReviewEventWithinSyncWindow(reviewedAt)) {
      logger.info(
        'reviewEvents adapter: skipping remote upsert older than the sync window',
        {component: 'sync/reviewEvents', id},
      );
      return;
    }
    await addReviewEvent(remoteToReviewEvent(id, data));
  },

  async applyRemoteDelete(id) {
    // Deliberate no-op — see the file header comment. Local SQLite is
    // the permanent record; only the cloud copy is ever pruned.
    logger.info(
      'reviewEvents adapter: ignoring remote delete (local history is never pruned by sync)',
      {component: 'sync/reviewEvents', id},
    );
  },

  async pullAllLocal() {
    const all = await getAllReviewEvents();
    // Quota hardening — bound the INITIAL BULK PUSH the same way as
    // ongoing sync. Without this, a user who accumulated years of
    // local-only history (e.g. an anonymous user linking a Google
    // account for the first time) would push their entire history to
    // Firestore in one shot, only to have most of it deleted by the very
    // next cleanup pass (SyncEngine.cleanupOldReviewEvents) — wasted
    // quota on both the write and the delete. Events outside the window
    // simply stay local-only, exactly like any other >12-month-old event.
    const withinWindow = all.filter(event =>
      isReviewEventWithinSyncWindow(event.reviewedAt),
    );
    return withinWindow.map(event => ({
      id: event.id,
      data: reviewEventToRemote(event),
    }));
  },

  // Immutable append-only events never conflict — opt out, pure LWW.
  getMaterialFields() {
    return [] as const;
  },
};
