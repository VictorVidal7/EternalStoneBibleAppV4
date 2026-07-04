/**
 * Quota hardening — SyncEngine.cleanupOldReviewEvents end-to-end pipeline.
 *
 * SyncEngine.test.ts exercises the cursor mechanics against a GENERIC
 * fake adapter (collection 'test'). This file instead wires up the REAL
 * reviewEventsSyncAdapter (with reviewEventStore/SQLite mocked) so the
 * single most important guarantee in this tanda can be verified
 * end-to-end, not just by code inspection: the cleanup sweep deletes
 * stale docs from Firestore and NEVER, under any circumstance, touches
 * local SQLite (addReviewEvent/removeReviewEvent are never called as a
 * side effect of the cleanup itself).
 *
 * Firestore + NetInfo are mocked the same way as SyncEngine.test.ts
 * (jest.mock factories can't share closures across files, so the mock is
 * duplicated here, trimmed to only what this file needs: collection/
 * where/orderBy/limit/get/doc/delete/onSnapshot).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface MockDocRef {
  set: jest.Mock;
  get: jest.Mock;
  delete: jest.Mock;
}

interface MockWhereClause {
  field: string;
  op: string;
  value: unknown;
}

interface MockCollRef {
  doc: jest.Mock<MockDocRef, [string]>;
  where: jest.Mock<MockCollRef, [string, string, unknown]>;
  orderBy: jest.Mock<MockCollRef, [string, string?]>;
  limit: jest.Mock<MockCollRef, [number]>;
  onSnapshot: jest.Mock;
  get: jest.Mock;
}

const mockCollections = new Map<string, MockCollRef>();
const mockDocDeletes: Array<{path: string; id: string}> = [];
const mockCollDocs = new Map<string, Array<{id: string; data: unknown}>>();

function matchesWhereClauses(
  data: Record<string, unknown> | undefined,
  clauses: MockWhereClause[],
): boolean {
  if (clauses.length === 0) return true;
  if (!data) return false;
  for (const c of clauses) {
    const actual = data[c.field];
    if (typeof actual !== 'number' || typeof c.value !== 'number') {
      return false;
    }
    switch (c.op) {
      case '<':
        if (!(actual < c.value)) return false;
        break;
      case '<=':
        if (!(actual <= c.value)) return false;
        break;
      case '>=':
        if (!(actual >= c.value)) return false;
        break;
      case '>':
        if (!(actual > c.value)) return false;
        break;
      default:
        return false;
    }
  }
  return true;
}

function mockMakeCollection(path: string): MockCollRef {
  const existing = mockCollections.get(path);
  if (existing) return existing;
  let whereClauses: MockWhereClause[] = [];
  const coll: MockCollRef = {
    doc: jest.fn((id: string) => {
      const ref: MockDocRef = {
        set: jest.fn(async () => undefined),
        get: jest.fn(async () => ({exists: false, id, data: () => undefined})),
        delete: jest.fn(async () => {
          mockDocDeletes.push({path, id});
        }),
      };
      return ref;
    }),
    where: jest.fn((field: string, op: string, value: unknown) => {
      whereClauses = [{field, op, value}];
      return coll;
    }),
    orderBy: jest.fn((_field: string, _direction?: string) => coll),
    limit: jest.fn((_n: number) => coll),
    onSnapshot: jest.fn((_cb: (s: unknown) => void) => () => undefined),
    get: jest.fn(async () => {
      const entries = mockCollDocs.get(path) ?? [];
      const filtered = entries.filter(e =>
        matchesWhereClauses(e.data as Record<string, unknown>, whereClauses),
      );
      return {
        docs: filtered.map(e => ({exists: true, id: e.id, data: () => e.data})),
        docChanges: () => [],
        size: filtered.length,
      };
    }),
  };
  mockCollections.set(path, coll);
  return coll;
}

const mockFirestoreFn: jest.Mock & {
  FieldValue?: {serverTimestamp: () => string};
} = jest.fn(() => ({
  collection: jest.fn((path: string) => mockMakeCollection(path)),
}));
mockFirestoreFn.FieldValue = {serverTimestamp: () => 'SERVER_TS'};

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: mockFirestoreFn,
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: () => () => undefined,
    fetch: jest.fn(() =>
      Promise.resolve({isConnected: true, isInternetReachable: true}),
    ),
  },
}));

const mockAddReviewEvent = jest.fn().mockResolvedValue(undefined);
const mockGetAllReviewEvents = jest.fn().mockResolvedValue([]);
const mockGetReviewEventById = jest.fn().mockResolvedValue(null);
const mockRemoveReviewEvent = jest.fn().mockResolvedValue(undefined);

jest.mock('../src/lib/memory/reviewEventStore', () => ({
  __esModule: true,
  addReviewEvent: (...args: unknown[]) => mockAddReviewEvent(...args),
  getAllReviewEvents: (...args: unknown[]) => mockGetAllReviewEvents(...args),
  getReviewEventById: (...args: unknown[]) => mockGetReviewEventById(...args),
  removeReviewEvent: (...args: unknown[]) => mockRemoveReviewEvent(...args),
}));

// Imports AFTER jest.mock so the lazy require captures the mock module.
import {
  SyncEngine,
  REVIEW_EVENTS_CLEANUP_BATCH_SIZE,
} from '../src/lib/sync/SyncEngine';
import {__resetFirestoreCacheForTests} from '../src/lib/sync/firestore';
import {__resetNetInfoCacheForTests} from '../src/lib/sync/netinfo';
import {reviewEventsSyncAdapter} from '../src/lib/sync/adapters/reviewEvents';
import {REVIEW_EVENT_SYNC_WINDOW_MS} from '../src/lib/memory/reviewEvents';

const DAY_MS = 24 * 60 * 60 * 1000;
const flush = () => new Promise(r => setImmediate(r));

beforeEach(async () => {
  await AsyncStorage.clear();
  mockCollections.clear();
  mockDocDeletes.length = 0;
  mockCollDocs.clear();
  mockAddReviewEvent.mockClear();
  mockGetAllReviewEvents.mockReset().mockResolvedValue([]);
  mockGetReviewEventById.mockReset().mockResolvedValue(null);
  mockRemoveReviewEvent.mockClear();
  __resetFirestoreCacheForTests();
  __resetNetInfoCacheForTests();
  mockFirestoreFn.mockClear();
});

describe('SyncEngine.cleanupOldReviewEvents — end-to-end pipeline', () => {
  it('deletes only reviewEvents docs strictly older than the 12-month window, from Firestore only', async () => {
    const uid = 'uid-cleanup';
    const now = Date.now();
    const path = `users/${uid}/reviewEvents`;

    mockCollDocs.set(path, [
      {
        id: 'ancient',
        data: {updatedAt: now - REVIEW_EVENT_SYNC_WINDOW_MS - 10 * DAY_MS},
      },
      {id: 'recent', data: {updatedAt: now - 10 * DAY_MS}},
      // Comfortably inside the window (not exactly at the millisecond
      // boundary — the engine computes its OWN `Date.now()` a few ms
      // after this test does, so a doc placed at the EXACT boundary
      // would flakily land on either side depending on that drift; the
      // exact boundary itself is already covered precisely, with an
      // injected fixed clock, by the pure-predicate tests in
      // reviewEvents.test.ts). One minute of slack is far more than
      // enough to absorb any realistic test-to-engine timing drift.
      {
        id: 'just-inside',
        data: {updatedAt: now - REVIEW_EVENT_SYNC_WINDOW_MS + 60_000},
      },
      // Missing/ambiguous date — must never be a delete candidate.
      {id: 'no-date', data: {value: 'mystery'}},
    ]);

    const engine = new SyncEngine();
    engine.register(reviewEventsSyncAdapter);
    await engine.start(uid);
    await flush();

    const deletedIds = mockDocDeletes
      .filter(d => d.path === path)
      .map(d => d.id);
    expect(deletedIds).toEqual(['ancient']);
  });

  it('NEVER calls addReviewEvent/removeReviewEvent as a side effect of cleanup — local SQLite is untouched', async () => {
    const uid = 'uid-cleanup2';
    const now = Date.now();
    const path = `users/${uid}/reviewEvents`;

    mockCollDocs.set(path, [
      {
        id: 'ancient-1',
        data: {updatedAt: now - REVIEW_EVENT_SYNC_WINDOW_MS - 5 * DAY_MS},
      },
      {
        id: 'ancient-2',
        data: {updatedAt: now - REVIEW_EVENT_SYNC_WINDOW_MS - 100 * DAY_MS},
      },
    ]);
    mockGetAllReviewEvents.mockResolvedValue([]); // nothing to bulk-push

    const engine = new SyncEngine();
    engine.register(reviewEventsSyncAdapter);
    await engine.start(uid);
    await flush();

    // Two docs really were deleted from Firestore…
    const deletedIds = mockDocDeletes
      .filter(d => d.path === path)
      .map(d => d.id);
    expect(deletedIds.sort()).toEqual(['ancient-1', 'ancient-2']);
    // …but the local SQLite-backed store was never touched by the sweep.
    expect(mockRemoveReviewEvent).not.toHaveBeenCalled();
    expect(mockAddReviewEvent).not.toHaveBeenCalled();
  });

  it('caps one cleanup pass at REVIEW_EVENTS_CLEANUP_BATCH_SIZE (bounded per start())', async () => {
    const uid = 'uid-cleanup-batch';
    const engine = new SyncEngine();
    engine.register(reviewEventsSyncAdapter);
    await engine.start(uid);
    await flush();

    const coll = mockCollections.get(`users/${uid}/reviewEvents`)!;
    expect(coll.orderBy).toHaveBeenCalledWith('updatedAt', 'asc');
    expect(coll.limit).toHaveBeenCalledWith(REVIEW_EVENTS_CLEANUP_BATCH_SIZE);
  });

  it('does not delete anything when every reviewEvents doc is within the window', async () => {
    const uid = 'uid-cleanup-clean';
    const now = Date.now();
    const path = `users/${uid}/reviewEvents`;
    mockCollDocs.set(path, [
      {id: 'a', data: {updatedAt: now}},
      {id: 'b', data: {updatedAt: now - 30 * DAY_MS}},
    ]);

    const engine = new SyncEngine();
    engine.register(reviewEventsSyncAdapter);
    await engine.start(uid);
    await flush();

    expect(mockDocDeletes.filter(d => d.path === path)).toHaveLength(0);
  });
});
