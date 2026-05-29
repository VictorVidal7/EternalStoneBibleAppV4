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
 */

import {
  addReviewEvent,
  getAllReviewEvents,
  getReviewEventById,
  removeReviewEvent,
} from '@lib/memory/reviewEventStore';
import {
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
    await addReviewEvent(remoteToReviewEvent(id, data));
  },

  async applyRemoteDelete(id) {
    await removeReviewEvent(id);
  },

  async pullAllLocal() {
    const all = await getAllReviewEvents();
    return all.map(event => ({id: event.id, data: reviewEventToRemote(event)}));
  },

  // Immutable append-only events never conflict — opt out, pure LWW.
  getMaterialFields() {
    return [] as const;
  },
};
