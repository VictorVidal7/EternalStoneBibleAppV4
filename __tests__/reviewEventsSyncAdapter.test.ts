/**
 * Quota hardening — reviewEvents SyncAdapter behavior tests.
 *
 * The adapter (src/lib/sync/adapters/reviewEvents.ts) was changed in three
 * ways to bound reviewEvents to a rolling 12-month cloud sync window:
 *
 *  1. `applyRemoteDelete` is now a deliberate NO-OP. This is the most
 *     important test in this file: nothing may ever call
 *     `removeReviewEvent` as a result of a Firestore-side delete, because
 *     the ONLY thing that ever hard-deletes a reviewEvents doc from
 *     Firestore is SyncEngine.cleanupOldReviewEvents (a cloud-only sweep),
 *     and local SQLite history must survive regardless of what the cloud
 *     copy retains.
 *  2. `applyRemoteUpsert` skips (never calls `addReviewEvent`) for an
 *     incoming remote event whose date is already outside the window.
 *  3. `pullAllLocal` (the initial bulk push source) excludes local events
 *     outside the window, so a veteran anonymous user linking their
 *     account for the first time doesn't push years of history to
 *     Firestore only to have most of it immediately cleaned up again.
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
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';
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

function localEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    id: `John/3/16__${NOW}`,
    verseKey: 'John/3/16',
    bookName: 'John',
    grade: 'good',
    boxBefore: 1,
    boxAfter: 2,
    intervalDays: 3,
    reviewedAt: NOW,
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

describe('reviewEventsSyncAdapter.applyRemoteUpsert — 12-month sync window', () => {
  it('applies an incoming event within the window', async () => {
    const data = remoteEvent({
      reviewedAt: NOW - DAY_MS,
      updatedAt: NOW - DAY_MS,
    });
    await reviewEventsSyncAdapter.applyRemoteUpsert('id-recent', data);
    expect(mockAddReviewEvent).toHaveBeenCalledTimes(1);
  });

  it('skips (never calls addReviewEvent) for an event older than the window', async () => {
    const old = NOW - REVIEW_EVENT_SYNC_WINDOW_MS - DAY_MS;
    const data = remoteEvent({reviewedAt: old, updatedAt: old});
    await reviewEventsSyncAdapter.applyRemoteUpsert('id-old', data);
    expect(mockAddReviewEvent).not.toHaveBeenCalled();
  });

  it('applies an event comfortably inside the window boundary (not "older than")', async () => {
    // Not the EXACT millisecond boundary — the adapter calls Date.now()
    // fresh at call time, which is a few ms after this test's own `NOW`
    // was captured, so an exact-boundary value would flakily land on
    // either side depending on that drift. The exact boundary itself is
    // covered precisely (with an injected fixed clock) by the
    // isReviewEventWithinSyncWindow tests in reviewEvents.test.ts.
    const insideBoundary = NOW - REVIEW_EVENT_SYNC_WINDOW_MS + 60_000;
    const data = remoteEvent({
      reviewedAt: insideBoundary,
      updatedAt: insideBoundary,
    });
    await reviewEventsSyncAdapter.applyRemoteUpsert('id-boundary', data);
    expect(mockAddReviewEvent).toHaveBeenCalledTimes(1);
  });

  it('defensively applies (never skips) when reviewedAt/updatedAt are ambiguous', async () => {
    const data = {
      verseKey: 'John/3/16',
      bookName: 'John',
      grade: 'good',
      boxBefore: 1,
      boxAfter: 2,
      intervalDays: null,
      // Both timestamps missing — an adapter bug or malformed doc should
      // never silently drop a review from local history.
    } as unknown as SyncEntity<RemoteReviewEvent>;
    await reviewEventsSyncAdapter.applyRemoteUpsert('id-ambiguous', data);
    expect(mockAddReviewEvent).toHaveBeenCalledTimes(1);
  });

  it('falls back to updatedAt when reviewedAt is missing but updatedAt is old', async () => {
    const old = NOW - REVIEW_EVENT_SYNC_WINDOW_MS - DAY_MS;
    const data = remoteEvent({updatedAt: old});
    delete (data as Partial<RemoteReviewEvent>).reviewedAt;
    await reviewEventsSyncAdapter.applyRemoteUpsert('id-fallback', data);
    expect(mockAddReviewEvent).not.toHaveBeenCalled();
  });
});

describe('reviewEventsSyncAdapter.pullAllLocal — initial bulk push filter', () => {
  it('excludes local events older than 12 months from the bulk push', async () => {
    const recent = localEvent({
      id: 'recent__1',
      verseKey: 'recent',
      reviewedAt: NOW - DAY_MS,
    });
    const old = localEvent({
      id: 'old__1',
      verseKey: 'old',
      reviewedAt: NOW - REVIEW_EVENT_SYNC_WINDOW_MS - DAY_MS,
    });
    mockGetAllReviewEvents.mockResolvedValue([recent, old]);

    const rows = await reviewEventsSyncAdapter.pullAllLocal();

    expect(rows.map(r => r.id)).toEqual(['recent__1']);
  });

  it('returns everything when the whole local log is within the window', async () => {
    const events = [
      localEvent({id: 'a', reviewedAt: NOW}),
      localEvent({id: 'b', reviewedAt: NOW - DAY_MS}),
      localEvent({id: 'c', reviewedAt: NOW - 30 * DAY_MS}),
    ];
    mockGetAllReviewEvents.mockResolvedValue(events);

    const rows = await reviewEventsSyncAdapter.pullAllLocal();

    expect(rows.map(r => r.id).sort()).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty bulk push when the entire local log is outside the window', async () => {
    const events = [
      localEvent({
        id: 'ancient',
        reviewedAt: NOW - 2 * REVIEW_EVENT_SYNC_WINDOW_MS,
      }),
    ];
    mockGetAllReviewEvents.mockResolvedValue(events);

    const rows = await reviewEventsSyncAdapter.pullAllLocal();

    expect(rows).toHaveLength(0);
  });
});
