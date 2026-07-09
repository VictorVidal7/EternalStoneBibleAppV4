/**
 * Sprint 45 — reviewEvents SyncAdapter (Ola F.2, the 6th synced dataset).
 * Local-first quota tanda — this adapter no longer moves any data through
 * Firestore; it is kept registered only so `getLocal`/`getMaterialFields`
 * stay well-typed call targets and so a stray `queueWrite('reviewEvents', …)`
 * (e.g. BackupService's manual restore) doesn't throw for lack of an
 * adapter. Both directions are now a deliberate no-op:
 *
 *  - `pullAllLocal` returns `[]` — the initial bulk push never uploads a
 *    device's local review log to Firestore anymore.
 *  - `applyRemoteUpsert` is a no-op — a live listener (or the initial
 *    snapshot on a freshly-attached device) never writes an incoming
 *    remote event into local SQLite anymore.
 *
 * Why: cross-device continuity for streaks/heatmap/retention/leeches is
 * now handled by the `memoryStats/summary` aggregate doc + the one-time
 * local restore floor (`@lib/memory/memoryStatsSync`), not by replicating
 * the full per-event log. Severing this adapter's Firestore traffic (not
 * just the per-review write, which was removed at the call site in
 * `MemoryDeckContext`) closes a real race: `SyncEngine.start()` resolves
 * once listeners are ATTACHED, not once their first snapshot has been
 * DELIVERED, so `seedMemoryStatsFloorIfFresh` (called right after `start()`
 * resolves) could otherwise run concurrently with this adapter's own first
 * snapshot delivering real events into local SQLite on a "fresh" device —
 * double-counting those events into `retentionByIntervalWithFloor`'s sum
 * merge. With both directions neutered, the floor is the ONLY source of
 * restored history on a new device, so there is nothing left to race.
 *
 * Legacy Firestore `reviewEvents` docs (written before this change, or by
 * `BackupService`'s manual restore, which still queues writes for its own
 * reasons) are simply orphaned — nothing reads them anymore. They keep
 * aging out via the existing 12-month `SyncEngine.cleanupOldReviewEvents`
 * sweep; no proactive migration needed at current data volumes.
 *
 * `applyRemoteDelete` stays a no-op for the same original reason: local
 * SQLite history is permanent regardless of what the (now-orphaned) cloud
 * copy keeps.
 */

import {getReviewEventById} from '@lib/memory/reviewEventStore';
import {logger} from '@lib/utils/logger';
import {
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

  async applyRemoteUpsert(id) {
    // Deliberate no-op — see file header. The memoryStats floor is the
    // sole restore path now; never let a remote event re-enter local
    // SQLite (that's what created the double-count race with the floor).
    logger.info(
      'reviewEvents adapter: ignoring remote upsert (local-only; see memoryStatsSync for restore)',
      {component: 'sync/reviewEvents', id},
    );
  },

  async applyRemoteDelete(id) {
    // Deliberate no-op — see the file header comment. Local SQLite is
    // the permanent record; only the (now-orphaned) cloud copy is ever pruned.
    logger.info(
      'reviewEvents adapter: ignoring remote delete (local history is never pruned by sync)',
      {component: 'sync/reviewEvents', id},
    );
  },

  async pullAllLocal() {
    // Deliberate no-op — see file header. Never upload the local review
    // log to Firestore; the memoryStats aggregate is the only thing this
    // collection contributes to the cloud now (written directly by
    // memoryStatsSync, outside this adapter).
    return [];
  },

  // Immutable append-only events never conflict — opt out, pure LWW.
  getMaterialFields() {
    return [] as const;
  },
};
