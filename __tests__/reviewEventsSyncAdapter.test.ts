/**
 * Local-first quota tanda — reviewEvents SyncAdapter behavior tests.
 *
 * The adapter (src/lib/sync/adapters/reviewEvents.ts) no longer moves any
 * data through Firestore in either direction — cross-device continuity is
 * handled by the `memoryStats/summary` aggregate + local restore floor
 * instead (see memoryStatsSync.test.ts). This file now asserts the
 * opposite of what it used to: every hook is a deliberate no-op.
 *
 *  1. `applyRemoteDelete` is a deliberate NO-OP (unchanged from before —
 *     local SQLite history is permanent regardless of the cloud copy).
 *  2. `applyRemoteUpsert` NEVER calls `addReviewEvent` anymore, for any
 *     incoming remote event — this is what closes the race where a
 *     freshly-attached listener's first snapshot could double-count
 *     events already captured by the memoryStats floor.
 *  3. `pullAllLocal` always returns `[]` — the initial bulk push never
 *     uploads a device's local review log to Firestore anymore.
 *
 * The local store (`reviewEventStore`, SQLite-backed) is mocked so these
 * tests run pure-in-memory, same convention as MemoryDeckContext.test.tsx.
 */

const mockAddReviewEvent = jest.fn().mockResolvedValue(undefined);
const mockGetAllReviewEvents = jest.fn();
const mockGetReviewEventById = jest.fn();
const mockRemoveReviewEvent = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  addReviewEvent: (...args: unknown[]) => mockAddReviewEvent(...args),
  getAllReviewEvents: (...args: unknown[]) => mockGetAllReviewEvents(...args),
  getReviewEventById: (...args: unknown[]) => mockGetReviewEventById(...args),
  removeReviewEvent: (...args: unknown[]) => mockRemoveReviewEvent(...args),
}));

import {reviewEventsSyncAdapter} from '../src/lib/sync/adapters/reviewEvents';
import {
  REVIEW_EVENT_SYNC_WINDOW_MS,
  type RemoteReviewEvent,
} from '../src/lib/memory/reviewEvents';
import type {SyncEntity} from '../src/lib/sync/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.now();

function remoteEvent(
  overrides: Partial<SyncEntity<RemoteReviewEvent>> = {},
): SyncEntity<RemoteReviewEvent> {
  return {
    verseKey: 'John/3/16',
    bookName: 'John',
    grade: 'good',
    boxBefore: 1,
    boxAfter: 2,
    intervalDays: 3,
    reviewedAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

beforeEach(() => {
  mockAddReviewEvent.mockClear();
  mockGetAllReviewEvents.mockReset();
  mockGetReviewEventById.mockReset();
  mockRemoveReviewEvent.mockClear();
});

describe('reviewEventsSyncAdapter.applyRemoteDelete — deliberate no-op', () => {
  it('NEVER calls removeReviewEvent — local SQLite history is permanent, only the cloud copy is ever pruned', async () => {
    await reviewEventsSyncAdapter.applyRemoteDelete('John/3/16__12345');
    expect(mockRemoveReviewEvent).not.toHaveBeenCalled();
  });

  it('is a no-op even when called many times / with many ids', async () => {
    await reviewEventsSyncAdapter.applyRemoteDelete('a__1');
    await reviewEventsSyncAdapter.applyRemoteDelete('b__2');
    await reviewEventsSyncAdapter.applyRemoteDelete('c__3');
    expect(mockRemoveReviewEvent).not.toHaveBeenCalled();
  });
});

describe('reviewEventsSyncAdapter.applyRemoteUpsert — deliberate no-op (local-only)', () => {
  it('never calls addReviewEvent for a recent incoming event', async () => {
    const data = remoteEvent({
      reviewedAt: NOW - DAY_MS,
      updatedAt: NOW - DAY_MS,
    });
    await reviewEventsSyncAdapter.applyRemoteUpsert('id-recent', data);
    expect(mockAddReviewEvent).not.toHaveBeenCalled();
  });

  it('never calls addReviewEvent for an event older than the old 12-month window', async () => {
    const old = NOW - REVIEW_EVENT_SYNC_WINDOW_MS - DAY_MS;
    const data = remoteEvent({reviewedAt: old, updatedAt: old});
    await reviewEventsSyncAdapter.applyRemoteUpsert('id-old', data);
    expect(mockAddReviewEvent).not.toHaveBeenCalled();
  });

  it('never calls addReviewEvent even when reviewedAt/updatedAt are ambiguous or missing', async () => {
    const data = {
      verseKey: 'John/3/16',
      bookName: 'John',
      grade: 'good',
      boxBefore: 1,
      boxAfter: 2,
      intervalDays: null,
      // Both timestamps missing — regardless, this hook must never write.
    } as unknown as SyncEntity<RemoteReviewEvent>;
    await reviewEventsSyncAdapter.applyRemoteUpsert('id-ambiguous', data);
    expect(mockAddReviewEvent).not.toHaveBeenCalled();
  });

  it('is a no-op even when called many times / with many ids', async () => {
    await reviewEventsSyncAdapter.applyRemoteUpsert('a', remoteEvent());
    await reviewEventsSyncAdapter.applyRemoteUpsert('b', remoteEvent());
    await reviewEventsSyncAdapter.applyRemoteUpsert('c', remoteEvent());
    expect(mockAddReviewEvent).not.toHaveBeenCalled();
  });
});

describe('reviewEventsSyncAdapter.pullAllLocal — deliberate no-op (never bulk-push)', () => {
  it('returns [] without reading the local store at all', async () => {
    const rows = await reviewEventsSyncAdapter.pullAllLocal();
    expect(rows).toEqual([]);
    expect(mockGetAllReviewEvents).not.toHaveBeenCalled();
  });

  it('returns [] regardless of what the local store would otherwise contain', async () => {
    mockGetAllReviewEvents.mockResolvedValue([
      {
        id: 'a',
        verseKey: 'John/3/16',
        bookName: 'John',
        grade: 'good',
        boxBefore: 1,
        boxAfter: 2,
        intervalDays: 3,
        reviewedAt: NOW,
      },
    ]);
    const rows = await reviewEventsSyncAdapter.pullAllLocal();
    expect(rows).toEqual([]);
  });
});
