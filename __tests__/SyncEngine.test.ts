/**
 * Sprint 42 — SyncEngine unit tests.
 *
 * Covers the contract the rest of the app depends on:
 *  - queueWrite/queueDelete are no-ops before start(uid)
 *  - start(uid) pushes the pending queue to Firestore
 *  - initial bulk push runs once per uid (persisted flag short-circuits)
 *  - LWW: older remote ignored, newer remote applied
 *  - tombstone (deleted: true) triggers applyRemoteDelete
 *  - subscribe fires for state changes; stop() unsubscribes
 *  - offline → queue accumulates; back online → flush triggers
 *
 * The native firestore + netinfo modules are mocked so the test runs
 * pure-in-memory. jest.mock factories cannot reference closure vars
 * without the `mock` prefix (babel-plugin-jest-hoist lesson from S41),
 * so every shared object below is named accordingly.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ---- shared mock state (must be `mock` prefixed for jest hoist) ----

interface MockDocRef {
  set: jest.Mock;
  get: jest.Mock;
  delete: jest.Mock;
}

/** A recorded `.where(field, op, value)` call, used both to assert what
 *  query SyncEngine built AND (via `matchesWhereClauses` below) to filter
 *  what a simulated snapshot/get() actually returns — so cursor tests can
 *  seed a realistic dataset and confirm the "query" really excludes what
 *  it should, the same way a real Firestore inequality filter would. */
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
  __path: string;
  /** Quota hardening — the where-clause(s) the MOST RECENT `.where()` call
   *  built. Real Firestore's `.collection(path).where(...)` always starts a
   *  fresh, independent query; SyncEngine also only ever calls `.where()`
   *  ONCE per attach/cleanup call (never chains multiple `.where()`s onto
   *  the same query), so "replace on every call" is the correct stand-in —
   *  a re-attach after stop()/start() naturally gets its own fresh clause
   *  instead of ANDing with whatever an earlier test/attach built. */
  __whereClauses: MockWhereClause[];
}

const mockCollections = new Map<string, MockCollRef>();
const mockDocSets: Array<{path: string; id: string; data: unknown}> = [];
const mockDocDeletes: Array<{path: string; id: string}> = [];
/** Sprint 49 — docs returned by a collection-level `.get()` (one-shot read),
 *  keyed by collection path. Set per-test for fetchResolvedConflicts.
 *  Quota hardening reuses it for the reviewEvents cleanup sweep's `.get()`. */
const mockCollDocs = new Map<string, Array<{id: string; data: unknown}>>();

/** Evaluate a doc's data against every recorded where-clause. Ambiguous
 *  cases (missing data, non-numeric field/target) never match — mirrors
 *  real Firestore, where an inequality filter simply excludes docs that
 *  don't have the field at all, and keeps our test filtering "fail closed"
 *  rather than accidentally leaking an unfiltered result through. */
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
      case '>=':
        if (!(actual >= c.value)) return false;
        break;
      case '>':
        if (!(actual > c.value)) return false;
        break;
      case '<=':
        if (!(actual <= c.value)) return false;
        break;
      case '<':
        if (!(actual < c.value)) return false;
        break;
      case '==':
        if (!(actual === c.value)) return false;
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
  const docs = new Map<string, MockDocRef>();
  let snapshotCb: ((s: unknown) => void) | null = null;
  let whereClauses: MockWhereClause[] = [];
  const coll: MockCollRef = {
    __path: path,
    __whereClauses: whereClauses,
    doc: jest.fn((id: string) => {
      const cached = docs.get(id);
      if (cached) return cached;
      const ref: MockDocRef = {
        set: jest.fn(async (data: unknown) => {
          mockDocSets.push({path, id, data});
        }),
        get: jest.fn(async () => ({exists: false, id, data: () => undefined})),
        delete: jest.fn(async () => {
          mockDocDeletes.push({path, id});
        }),
      };
      docs.set(id, ref);
      return ref;
    }),
    // Real Firestore's `.where()/.orderBy()/.limit()` return a NEW,
    // independent Query rather than mutating the collection ref in place.
    // SyncEngine never chains more than one `.where()` per query, so
    // REPLACING (not accumulating) on every call is the correct stand-in
    // — see the __whereClauses doc comment above.
    where: jest.fn((field: string, op: string, value: unknown) => {
      whereClauses = [{field, op, value}];
      coll.__whereClauses = whereClauses;
      return coll;
    }),
    orderBy: jest.fn((_field: string, _direction?: string) => coll),
    limit: jest.fn((_n: number) => coll),
    onSnapshot: jest.fn((cb: (s: unknown) => void) => {
      snapshotCb = cb;
      return () => {
        snapshotCb = null;
      };
    }),
    get: jest.fn(async () => {
      const entries = mockCollDocs.get(path) ?? [];
      const filtered = entries.filter(e =>
        matchesWhereClauses(e.data as Record<string, unknown>, whereClauses),
      );
      return {
        docs: filtered.map(e => ({
          exists: true,
          id: e.id,
          data: () => e.data,
        })),
        docChanges: () => [],
        size: filtered.length,
      };
    }),
  };
  // expose a way for the test to fire snapshots. Filters through whatever
  // `.where()` clauses SyncEngine most recently attached with, so a test
  // can assert "a doc older than the cursor floor is never delivered" —
  // exactly like a real Firestore listener wouldn't deliver it either.
  (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire = (
    changes: unknown[],
  ) => {
    if (!snapshotCb) return;
    const filtered = changes.filter(change => {
      const c = change as {doc?: {data?: () => unknown}};
      const data = c.doc?.data?.() as Record<string, unknown> | undefined;
      return matchesWhereClauses(data, whereClauses);
    });
    snapshotCb({
      docChanges: () => filtered,
      size: filtered.length,
    });
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

jest.mock('../src/lib/sync/firestore', () => ({
  __esModule: true,
  getFirestore: () => mockFirestoreFn,
  serverTimestamp: () => mockFirestoreFn.FieldValue!.serverTimestamp(),
  __resetFirestoreCacheForTests: () => {},
}));

const mockNetListeners: Array<(s: unknown) => void> = [];
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: (cb: (s: unknown) => void) => {
      mockNetListeners.push(cb);
      return () => {
        const i = mockNetListeners.indexOf(cb);
        if (i >= 0) mockNetListeners.splice(i, 1);
      };
    },
    fetch: jest.fn(() =>
      Promise.resolve({isConnected: true, isInternetReachable: true}),
    ),
  },
}));

// Imports AFTER jest.mock so the lazy require captures the mock module.
import {
  SyncEngine,
  cursorStorageKey,
  CURSOR_SAFETY_MARGIN_MS,
} from '../src/lib/sync/SyncEngine';
import {__resetFirestoreCacheForTests} from '../src/lib/sync/firestore';
import {__resetNetInfoCacheForTests} from '../src/lib/sync/netinfo';
import type {SyncAdapter, SyncEntity} from '../src/lib/sync/types';

interface TestEntity {
  value: string;
}

function makeAdapter(overrides: Partial<SyncAdapter<TestEntity>> = {}): {
  adapter: SyncAdapter<TestEntity>;
  localStore: Map<string, SyncEntity<TestEntity>>;
  remoteUpsertCalls: Array<{id: string; data: SyncEntity<TestEntity>}>;
  remoteDeleteCalls: string[];
} {
  const localStore = new Map<string, SyncEntity<TestEntity>>();
  const remoteUpsertCalls: Array<{id: string; data: SyncEntity<TestEntity>}> =
    [];
  const remoteDeleteCalls: string[] = [];
  const adapter: SyncAdapter<TestEntity> = {
    collection: 'test',
    async getLocal(id) {
      return localStore.get(id) ?? null;
    },
    async applyRemoteUpsert(id, data) {
      remoteUpsertCalls.push({id, data});
      localStore.set(id, data);
    },
    async applyRemoteDelete(id) {
      remoteDeleteCalls.push(id);
      localStore.delete(id);
    },
    async pullAllLocal() {
      return Array.from(localStore.entries()).map(([id, data]) => ({
        id,
        data,
      }));
    },
    ...overrides,
  };
  return {adapter, localStore, remoteUpsertCalls, remoteDeleteCalls};
}

// flush pending microtasks/promises
const flush = () => new Promise(r => setImmediate(r));

beforeEach(async () => {
  await AsyncStorage.clear();
  mockCollections.clear();
  mockDocSets.length = 0;
  mockDocDeletes.length = 0;
  mockCollDocs.clear();
  mockNetListeners.length = 0;
  __resetFirestoreCacheForTests();
  __resetNetInfoCacheForTests();
  mockFirestoreFn.mockClear();
});

describe('queueWrite — inactive engine', () => {
  it('is a no-op when start() has not been called', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    engine.queueWrite('test', 'doc1', {value: 'x', updatedAt: 100});
    await flush();
    expect(engine.__getQueueForTests()).toHaveLength(0);
    expect(mockDocSets).toHaveLength(0);
  });
});

describe('start + queueWrite', () => {
  it('pushes a queued write to Firestore at the right path', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-123');
    engine.queueWrite('test', 'doc1', {value: 'hello', updatedAt: 100});
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toEqual([
      {
        path: 'users/uid-123/test',
        id: 'doc1',
        data: expect.objectContaining({value: 'hello', updatedAt: 100}),
      },
    ]);
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });
});

describe('queueDelete', () => {
  it('pushes a tombstone (deleted: true) to Firestore', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-x');
    engine.queueDelete('test', 'doc-deleted', {value: 'old', updatedAt: 50});
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(1);
    const wrote = mockDocSets[0];
    expect(wrote.path).toBe('users/uid-x/test');
    expect(wrote.id).toBe('doc-deleted');
    const data = wrote.data as {deleted?: boolean; deletedAt?: number};
    expect(data.deleted).toBe(true);
    expect(typeof data.deletedAt).toBe('number');
  });
});

describe('slashed doc ids — Firestore path sanitization (Sprint 46)', () => {
  it('writes a slashed logical id to a slash-free Firestore doc id', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-s');
    // memoryCards key on the verseKey "Book/Chapter/Verse"; the slash would
    // otherwise make .doc() write to a NESTED document the collection
    // listener can't see.
    engine.queueWrite('test', 'Genesis/1/1', {value: 'card', updatedAt: 100});
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(1);
    expect(mockDocSets[0].id).toBe('Genesis~1~1');
    expect(mockDocSets[0].id).not.toContain('/');
  });

  it('decodes a sanitized inbound doc id back to the logical id', async () => {
    const engine = new SyncEngine();
    const {adapter, remoteUpsertCalls} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-s2');
    const coll = mockCollections.get('users/uid-s2/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire([
      {
        type: 'added',
        doc: {
          id: 'Genesis~1~1',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 2000}),
        },
      },
    ]);
    await flush();
    expect(remoteUpsertCalls).toHaveLength(1);
    // The adapter sees the real logical id, not the wire form.
    expect(remoteUpsertCalls[0].id).toBe('Genesis/1/1');
  });

  it('leaves clean ids untouched on the wire', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-s3');
    engine.queueWrite('test', 'fav_123_abc', {value: 'x', updatedAt: 100});
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets[0].id).toBe('fav_123_abc');
  });
});

describe('applyRemoteChange — LWW', () => {
  it('ignores a remote change older than local', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter();
    localStore.set('doc1', {value: 'local', updatedAt: 2000});
    engine.register(adapter);
    await engine.start('uid');
    const coll = mockCollections.get('users/uid/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire([
      {
        type: 'modified',
        doc: {
          id: 'doc1',
          exists: true,
          data: () => ({value: 'remote-old', updatedAt: 1000}),
        },
      },
    ]);
    await flush();
    expect(remoteUpsertCalls).toHaveLength(0);
    expect(localStore.get('doc1')?.value).toBe('local');
  });

  it('applies a remote change newer than local', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter();
    localStore.set('doc1', {value: 'local', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid');
    const coll = mockCollections.get('users/uid/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire([
      {
        type: 'modified',
        doc: {
          id: 'doc1',
          exists: true,
          data: () => ({value: 'remote-new', updatedAt: 2000}),
        },
      },
    ]);
    await flush();
    expect(remoteUpsertCalls).toHaveLength(1);
    expect(remoteUpsertCalls[0].data.value).toBe('remote-new');
    expect(localStore.get('doc1')?.value).toBe('remote-new');
  });
});

describe('tombstone propagation', () => {
  it('applies remote tombstone as applyRemoteDelete on local', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteDeleteCalls} = makeAdapter();
    localStore.set('doc-x', {value: 'live', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid');
    const coll = mockCollections.get('users/uid/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire([
      {
        type: 'modified',
        doc: {
          id: 'doc-x',
          exists: true,
          data: () => ({
            value: 'live',
            updatedAt: 2000,
            deleted: true,
            deletedAt: 2000,
          }),
        },
      },
    ]);
    await flush();
    expect(remoteDeleteCalls).toEqual(['doc-x']);
    expect(localStore.has('doc-x')).toBe(false);
  });
});

describe('initial bulk push', () => {
  it('queues every local row on first start for a uid', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter();
    localStore.set('a', {value: 'a', updatedAt: 1});
    localStore.set('b', {value: 'b', updatedAt: 2});
    engine.register(adapter);
    await engine.start('uid-bulk');
    await flush();
    await engine.__flushForTests();
    const paths = mockDocSets.map(d => `${d.id}`);
    expect(paths.sort()).toEqual(['a', 'b']);
    // Versioned done-marker persisted so a second start skips the push.
    const flag = await AsyncStorage.getItem('@sync_first_push_done:uid-bulk');
    expect(flag).toBe('2');
  });

  it('skips bulk push when the per-uid flag holds the current version', async () => {
    await AsyncStorage.setItem('@sync_first_push_done:uid-bulk2', '2');
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter();
    localStore.set('a', {value: 'a', updatedAt: 1});
    engine.register(adapter);
    await engine.start('uid-bulk2');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(0);
  });

  it('re-pushes ONCE when the flag holds the legacy value (S78 healing)', async () => {
    // Pre-fix devices hold '1'; their queue silently dropped any entity
    // whose payload carried an undefined field, so the bulk push re-runs
    // to heal them (idempotent: stable ids + merge:true).
    await AsyncStorage.setItem('@sync_first_push_done:uid-heal', '1');
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter();
    localStore.set('dropped', {value: 'finally-syncs', updatedAt: 1});
    engine.register(adapter);
    await engine.start('uid-heal');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets.map(d => d.id)).toEqual(['dropped']);
    const flag = await AsyncStorage.getItem('@sync_first_push_done:uid-heal');
    expect(flag).toBe('2');
  });

  it('honors a recorded opt-out permanently (skip marker)', async () => {
    await AsyncStorage.setItem('@sync_first_push_done:uid-optout', 'skip');
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter();
    localStore.set('private', {value: 'stays-local', updatedAt: 1});
    engine.register(adapter);
    await engine.start('uid-optout');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(0);
  });
});

describe('engine boundary sanitization (Sprint 78)', () => {
  it('strips undefined fields before the Firestore set so the write lands', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-clean');
    // Simulates a payload that skipped its builder's withoutUndefined —
    // pre-fix this wedged the queue until the entry was DROPPED.
    engine.queueWrite('test', 'doc-u', {
      value: 'kept',
      note: undefined,
      meta: {label: undefined, ok: true},
      updatedAt: 100,
    } as unknown as object);
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(1);
    const data = mockDocSets[0].data as Record<string, unknown>;
    expect('note' in data).toBe(false);
    expect(data.meta).toEqual({ok: true});
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });
});

describe('subscribe + state', () => {
  it('notifies subscribers on isActive transition', async () => {
    const engine = new SyncEngine();
    const seenStates: boolean[] = [];
    engine.subscribe(s => seenStates.push(s.isActive));
    await engine.start('uid-state');
    expect(seenStates).toContain(true);
    engine.stop();
    expect(seenStates).toContain(false);
  });
});

describe('offline behavior', () => {
  it('does not push while offline and flushes when back online', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-net');
    await flush();
    engine.__setOnlineForTests(false);
    engine.queueWrite('test', 'doc-net', {value: 'queued', updatedAt: 500});
    await flush();
    await engine.__flushForTests();
    // Bulk push runs at start; that may have queued empty (no local rows).
    // The new offline write should still be queued, not pushed.
    const queue = engine.__getQueueForTests();
    expect(queue.some(q => q.id === 'doc-net')).toBe(true);
    const offlineSets = mockDocSets.filter(d => d.id === 'doc-net');
    expect(offlineSets).toHaveLength(0);
    // Back online: setOnline triggers flush internally.
    engine.__setOnlineForTests(true);
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets.some(d => d.id === 'doc-net')).toBe(true);
  });
});

describe('queue persistence', () => {
  it('hydrates a previously persisted queue on start', async () => {
    await AsyncStorage.setItem(
      '@sync_queue_v1',
      JSON.stringify([
        {
          collection: 'test',
          id: 'persisted',
          data: {value: 'from-disk', updatedAt: 1, deleted: false},
          queuedAt: 0,
          attempts: 0,
        },
      ]),
    );
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-persist');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets.some(d => d.id === 'persisted')).toBe(true);
  });
});

describe('flush reliability — same-tick double queueWrite (Sprint 47)', () => {
  it('drains a write queued while a flush is already in flight', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-reflush');
    await flush();

    // Mimic MemoryDeckContext.reviewCard: two queueWrites in the SAME tick.
    // The first triggers a flush() that snapshots [memoryCards]; the second
    // hits the flushInFlight guard and its own flush() returns early. Before
    // Sprint 47 the second write sat queued until an external trigger.
    engine.queueWrite('test', 'doc-a', {value: 'a', updatedAt: 1});
    engine.queueWrite('test', 'doc-b', {value: 'b', updatedAt: 2});

    // Let the in-flight flush + the residual re-flush drain — NO forced
    // __flushForTests, so this exercises the real internal re-trigger.
    for (let k = 0; k < 5; k++) await flush();

    expect(mockDocSets.map(d => d.id)).toEqual(
      expect.arrayContaining(['doc-a', 'doc-b']),
    );
    expect(engine.__getQueueForTests()).toHaveLength(0);
    engine.stop();
  });
});

// =============================================================
// Sprint 43 — conflict detection + resolution
// =============================================================

function fireRemote(uid: string, changes: unknown[]): void {
  const coll = mockCollections.get(`users/${uid}/test`);
  if (!coll) throw new Error(`mock collection not registered for ${uid}`);
  (coll as MockCollRef & {__fire: (c: unknown[]) => void}).__fire(changes);
}

describe('conflict detection — within window + differing material fields', () => {
  it('records a conflict instead of applying LWW', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-c', {value: 'local-text', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-cf');
    fireRemote('uid-cf', [
      {
        type: 'modified',
        doc: {
          id: 'doc-c',
          exists: true,
          data: () => ({value: 'remote-text', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    expect(remoteUpsertCalls).toHaveLength(0);
    expect(localStore.get('doc-c')?.value).toBe('local-text');
    const conflicts = engine.__getConflictsForTests();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].collection).toBe('test');
    expect(conflicts[0].docId).toBe('doc-c');
    expect(conflicts[0].differingFields).toEqual(['value']);
  });
});

describe('conflict detection — null/undefined treated as equal', () => {
  // Real-world case observed in live verification: SQLite NULL surfaces
  // as `null` from the adapter while an absent Firestore field surfaces
  // as `undefined`. Both mean "no value"; the engine must not flag this
  // as a material difference.
  it('treats local null and remote undefined as the same value', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-nu', {
      value: null as unknown as string,
      updatedAt: 1000,
    });
    engine.register(adapter);
    await engine.start('uid-nu');
    fireRemote('uid-nu', [
      {
        type: 'modified',
        doc: {
          id: 'doc-nu',
          exists: true,
          // value field absent in remote → `undefined` after destructure
          data: () => ({updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    expect(engine.__getConflictsForTests()).toHaveLength(0);
  });
});

describe('conflict detection — within window but matching material fields', () => {
  it('does not record a conflict (no material diff)', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-m', {value: 'same', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-match');
    fireRemote('uid-match', [
      {
        type: 'modified',
        doc: {
          id: 'doc-m',
          exists: true,
          data: () => ({value: 'same', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    expect(engine.__getConflictsForTests()).toHaveLength(0);
    // Remote is newer → LWW applies it.
    expect(remoteUpsertCalls).toHaveLength(1);
  });
});

describe('conflict detection — outside window', () => {
  it('falls through to plain LWW even if material fields differ', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-o', {value: 'local', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-out');
    fireRemote('uid-out', [
      {
        type: 'modified',
        doc: {
          id: 'doc-o',
          exists: true,
          // 60s later — well outside the 30s window
          data: () => ({value: 'remote', updatedAt: 61000}),
        },
      },
    ]);
    await flush();
    expect(engine.__getConflictsForTests()).toHaveLength(0);
    expect(remoteUpsertCalls).toHaveLength(1);
    expect(remoteUpsertCalls[0].data.value).toBe('remote');
  });
});

describe('conflict detection — adapter opts out via empty material fields', () => {
  it('is treated as plain LWW when getMaterialFields returns []', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter({
      getMaterialFields: () => [],
    });
    localStore.set('doc-no', {value: 'local', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-opt');
    fireRemote('uid-opt', [
      {
        type: 'modified',
        doc: {
          id: 'doc-no',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    expect(engine.__getConflictsForTests()).toHaveLength(0);
    expect(remoteUpsertCalls).toHaveLength(1);
  });
});

describe('conflict detection — second remote write replaces the existing conflict', () => {
  it('keeps a single conflict with the latest remoteVersion', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-r', {value: 'local', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-rep');
    fireRemote('uid-rep', [
      {
        type: 'modified',
        doc: {
          id: 'doc-r',
          exists: true,
          data: () => ({value: 'remote-v1', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    fireRemote('uid-rep', [
      {
        type: 'modified',
        doc: {
          id: 'doc-r',
          exists: true,
          data: () => ({value: 'remote-v2', updatedAt: 1010}),
        },
      },
    ]);
    await flush();
    const conflicts = engine.__getConflictsForTests();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].remoteVersion.value).toBe('remote-v2');
  });
});

describe('resolveConflict — keepMine', () => {
  it('queues a write with local value stamped to now', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-km', {value: 'local', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-km');
    fireRemote('uid-km', [
      {
        type: 'modified',
        doc: {
          id: 'doc-km',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    const [conflict] = engine.__getConflictsForTests();
    expect(conflict).toBeDefined();
    await engine.resolveConflict(conflict.id, 'keepMine');
    await flush();
    await engine.__flushForTests();
    expect(engine.__getConflictsForTests()).toHaveLength(0);
    const pushed = mockDocSets.find(d => d.id === 'doc-km');
    expect(pushed).toBeDefined();
    expect((pushed!.data as {value: string}).value).toBe('local');
  });
});

describe('resolveConflict — keepTheirs', () => {
  it('applies remote locally without queueing a push', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-kt', {value: 'local', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-kt');
    // Drain the initial-bulk-push side effects so the assertion below is clean.
    await flush();
    await engine.__flushForTests();
    const setsBefore = mockDocSets.length;
    fireRemote('uid-kt', [
      {
        type: 'modified',
        doc: {
          id: 'doc-kt',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    const [conflict] = engine.__getConflictsForTests();
    await engine.resolveConflict(conflict.id, 'keepTheirs');
    await flush();
    expect(localStore.get('doc-kt')?.value).toBe('remote');
    expect(remoteUpsertCalls.some(c => c.data.value === 'remote')).toBe(true);
    // No new doc set for doc-kt (the value was already on Firestore).
    const newSets = mockDocSets
      .slice(setsBefore)
      .filter(d => d.id === 'doc-kt');
    expect(newSets).toHaveLength(0);
  });
});

describe('resolveConflict — merge', () => {
  it('applies merged value locally + queues a push', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-mg', {value: 'local', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-mg');
    fireRemote('uid-mg', [
      {
        type: 'modified',
        doc: {
          id: 'doc-mg',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    const [conflict] = engine.__getConflictsForTests();
    await engine.resolveConflict(conflict.id, 'merge', {
      value: 'merged',
      updatedAt: 9999, // overridden by resolveConflict to Date.now()
    });
    await flush();
    await engine.__flushForTests();
    expect(localStore.get('doc-mg')?.value).toBe('merged');
    expect(remoteUpsertCalls.some(c => c.data.value === 'merged')).toBe(true);
    const pushed = mockDocSets.find(
      d => d.id === 'doc-mg' && (d.data as {value: string}).value === 'merged',
    );
    expect(pushed).toBeDefined();
  });
});

describe('stop() clears conflicts', () => {
  it('drops the in-memory conflicts list when the engine stops', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-st', {value: 'local', updatedAt: 1000});
    engine.register(adapter);
    await engine.start('uid-st');
    fireRemote('uid-st', [
      {
        type: 'modified',
        doc: {
          id: 'doc-st',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    expect(engine.__getConflictsForTests()).toHaveLength(1);
    engine.stop();
    expect(engine.__getConflictsForTests()).toHaveLength(0);
  });
});

describe('exportLocalData', () => {
  it('returns per-adapter row counts (only non-empty)', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter();
    localStore.set('a', {value: 'a', updatedAt: 1});
    localStore.set('b', {value: 'b', updatedAt: 2});
    engine.register(adapter);
    const data = await engine.exportLocalData();
    expect(data).toEqual([{collection: 'test', count: 2}]);
  });
});

describe('queueSkipNextBulkPush', () => {
  it('persists the skip marker without queueing local rows', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter();
    localStore.set('only-local', {value: 'x', updatedAt: 1});
    engine.register(adapter);
    engine.queueSkipNextBulkPush();
    await engine.start('uid-skip');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets.filter(d => d.id === 'only-local')).toHaveLength(0);
    // Sprint 78 — opt-outs record a distinct marker so the versioned
    // healing re-push can never override the user's choice.
    const flag = await AsyncStorage.getItem('@sync_first_push_done:uid-skip');
    expect(flag).toBe('skip');
  });
});

describe('fetchResolvedConflicts (Sprint 49)', () => {
  it('returns [] when the engine is inactive (no uid)', async () => {
    const engine = new SyncEngine();
    expect(await engine.fetchResolvedConflicts()).toEqual([]);
  });

  it('reads + maps the audit log from users/{uid}/conflicts', async () => {
    const engine = new SyncEngine();
    await engine.start('uid-conf');
    mockCollDocs.set('users/uid-conf/conflicts', [
      {
        id: 'favorites__fav_1',
        data: {
          id: 'favorites__fav_1',
          collection: 'favorites',
          docId: 'fav_1',
          choice: 'keepTheirs',
          differingFields: ['note'],
          resolvedAt: 1700,
          detectedAt: 1690,
        },
      },
      {
        id: 'notes__n1',
        data: {
          id: 'notes__n1',
          collection: 'notes',
          docId: 'n1',
          choice: 'merge',
          differingFields: ['text'],
          resolvedAt: 1800,
          detectedAt: 1790,
        },
      },
    ]);
    const recs = await engine.fetchResolvedConflicts();
    expect(recs).toHaveLength(2);
    expect(recs.map(r => r.choice).sort()).toEqual(['keepTheirs', 'merge']);
  });

  it('skips docs missing a resolution (no resolvedAt / choice)', async () => {
    const engine = new SyncEngine();
    await engine.start('uid-conf2');
    mockCollDocs.set('users/uid-conf2/conflicts', [
      {id: 'good', data: {choice: 'keepMine', resolvedAt: 10}},
      {id: 'half', data: {choice: 'keepMine'}}, // no resolvedAt
      {id: 'foreign', data: {somethingElse: true}}, // not an audit doc
    ]);
    const recs = await engine.fetchResolvedConflicts();
    expect(recs).toHaveLength(1);
    expect(recs[0].choice).toBe('keepMine');
  });

  it('bounds the read with orderBy(resolvedAt desc) + a generous limit', async () => {
    const engine = new SyncEngine();
    await engine.start('uid-conf3');
    mockCollDocs.set('users/uid-conf3/conflicts', [
      {id: 'a', data: {choice: 'keepMine', resolvedAt: 10}},
    ]);
    await engine.fetchResolvedConflicts();
    const coll = mockCollections.get('users/uid-conf3/conflicts');
    expect(coll?.orderBy).toHaveBeenCalledWith('resolvedAt', 'desc');
    expect(coll?.limit).toHaveBeenCalledWith(500);
  });
});

// =============================================================
// Quota hardening — incremental sync cursor
// =============================================================
//
// Before this change, attachListener opened an UNFILTERED onSnapshot on
// the whole collection: every reattach re-delivered (and re-billed) every
// existing doc. Now each collection persists a cursor (highest `updatedAt`
// observed) and attaches with `where('updatedAt', '>=', cursor - margin)`.

describe('quota hardening — cursor: brand-new user/device (empty cursor)', () => {
  it('queries with floor 0 (no filter effect) and receives every existing doc', async () => {
    const engine = new SyncEngine();
    const {adapter, remoteUpsertCalls} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-newuser');

    const coll = mockCollections.get('users/uid-newuser/test')!;
    expect(coll.where).toHaveBeenCalledWith('updatedAt', '>=', 0);

    // A brand-new user's FULL real history arrives in one batch — some of
    // it genuinely old (this is the "your account already has a year of
    // data" case, not just "you have zero data").
    fireRemote('uid-newuser', [
      {
        type: 'added',
        doc: {
          id: 'old-1',
          exists: true,
          data: () => ({value: 'a', updatedAt: 1000}),
        },
      },
      {
        type: 'added',
        doc: {
          id: 'old-2',
          exists: true,
          data: () => ({value: 'b', updatedAt: 5000}),
        },
      },
      {
        type: 'added',
        doc: {
          id: 'new-1',
          exists: true,
          data: () => ({value: 'c', updatedAt: 999999}),
        },
      },
    ]);
    await flush();

    expect(remoteUpsertCalls.map(c => c.id).sort()).toEqual([
      'new-1',
      'old-1',
      'old-2',
    ]);
  });
});

describe('quota hardening — cursor: reconnection with an already-advanced cursor', () => {
  it('attaches with floor = cursor - safety margin, not 0', async () => {
    const uid = 'uid-reconnect';
    const priorCursor = 10_000_000;
    await AsyncStorage.setItem(
      cursorStorageKey('test', uid),
      String(priorCursor),
    );

    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start(uid);

    const coll = mockCollections.get(`users/${uid}/test`)!;
    expect(coll.where).toHaveBeenCalledWith(
      'updatedAt',
      '>=',
      priorCursor - CURSOR_SAFETY_MARGIN_MS,
    );
  });

  it('only delivers docs at/after the floor — older docs are never even seen', async () => {
    const uid = 'uid-reconnect2';
    const priorCursor = 10_000_000;
    const floor = priorCursor - CURSOR_SAFETY_MARGIN_MS;
    await AsyncStorage.setItem(
      cursorStorageKey('test', uid),
      String(priorCursor),
    );

    const engine = new SyncEngine();
    const {adapter, remoteUpsertCalls} = makeAdapter();
    engine.register(adapter);
    await engine.start(uid);

    fireRemote(uid, [
      // Well below the floor — a doc from long before this reattach.
      {
        type: 'added',
        doc: {
          id: 'ancient',
          exists: true,
          data: () => ({value: 'x', updatedAt: 1}),
        },
      },
      // Inside the safety margin (below the cursor, at/above the floor) —
      // deliberately re-delivered rather than risking a lost write.
      {
        type: 'added',
        doc: {
          id: 'within-margin',
          exists: true,
          data: () => ({value: 'y', updatedAt: floor + 1}),
        },
      },
      // Genuinely new since the cursor was set.
      {
        type: 'added',
        doc: {
          id: 'genuinely-new',
          exists: true,
          data: () => ({value: 'z', updatedAt: priorCursor + 5000}),
        },
      },
    ]);
    await flush();

    const ids = remoteUpsertCalls.map(c => c.id);
    expect(ids).not.toContain('ancient');
    expect(ids).toContain('within-margin');
    expect(ids).toContain('genuinely-new');
  });
});

describe('quota hardening — cursor: reinstall / new device', () => {
  it('a device with no persisted cursor still recovers the FULL real history for an account that another device already synced', async () => {
    const uid = 'uid-shared-account';

    // Device 1 has been syncing for a while — its cursor is far advanced.
    await AsyncStorage.setItem(
      cursorStorageKey('test', uid),
      String(50_000_000),
    );

    // Device 2 (reinstall / new phone) never wrote that key — its
    // AsyncStorage is genuinely empty for this collection. Model that by
    // removing just the cursor key, exactly what a fresh install looks
    // like: the account (uid) has history, but THIS device doesn't have
    // a cursor for it yet.
    await AsyncStorage.removeItem(cursorStorageKey('test', uid));

    const engine = new SyncEngine();
    const {adapter, remoteUpsertCalls} = makeAdapter();
    engine.register(adapter);
    await engine.start(uid);

    const coll = mockCollections.get(`users/${uid}/test`)!;
    expect(coll.where).toHaveBeenCalledWith('updatedAt', '>=', 0);

    // The account's full year-old history arrives — none of it should be
    // excluded just because SOME other device's cursor is far ahead.
    fireRemote(uid, [
      {
        type: 'added',
        doc: {
          id: 'year-old-note',
          exists: true,
          data: () => ({value: 'old note', updatedAt: 100}),
        },
      },
      {
        type: 'added',
        doc: {
          id: 'six-months-old',
          exists: true,
          data: () => ({value: 'older note', updatedAt: 20_000_000}),
        },
      },
    ]);
    await flush();

    expect(remoteUpsertCalls.map(c => c.id).sort()).toEqual([
      'six-months-old',
      'year-old-note',
    ]);
  });
});

describe('quota hardening — cursor advancement', () => {
  it('advances to the highest updatedAt applied from a remote change, and persists it', async () => {
    const uid = 'uid-advance';
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start(uid);

    fireRemote(uid, [
      {
        type: 'added',
        doc: {
          id: 'doc-a',
          exists: true,
          data: () => ({value: 'a', updatedAt: 3000}),
        },
      },
      {
        type: 'added',
        doc: {
          id: 'doc-b',
          exists: true,
          data: () => ({value: 'b', updatedAt: 7000}),
        },
      },
    ]);
    await flush();

    expect(engine.__getCursorForTests('test')).toBe(7000);
    const persisted = await AsyncStorage.getItem(cursorStorageKey('test', uid));
    expect(persisted).toBe('7000');
  });

  it('advances even when the remote change is an LWW-ignored echo of this device’s own write', async () => {
    const uid = 'uid-echo';
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter();
    // Local already holds this value (as if this device just wrote it and
    // is now seeing its own write reflected back through the listener).
    localStore.set('doc-echo', {value: 'mine', updatedAt: 8000});
    engine.register(adapter);
    await engine.start(uid);

    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'doc-echo',
          exists: true,
          data: () => ({value: 'mine', updatedAt: 8000}),
        },
      },
    ]);
    await flush();

    // LWW correctly treats this as a no-op (remote is not newer)…
    expect(remoteUpsertCalls).toHaveLength(0);
    // …but the cursor must still advance, or every future reattach would
    // keep re-reading this doc forever.
    expect(engine.__getCursorForTests('test')).toBe(8000);
  });

  it('never moves the cursor backward when an older doc is re-delivered after a newer one', async () => {
    const uid = 'uid-noregress';
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start(uid);

    fireRemote(uid, [
      {
        type: 'added',
        doc: {
          id: 'newer',
          exists: true,
          data: () => ({value: 'n', updatedAt: 9000}),
        },
      },
    ]);
    await flush();
    expect(engine.__getCursorForTests('test')).toBe(9000);

    fireRemote(uid, [
      {
        type: 'added',
        doc: {
          id: 'older',
          exists: true,
          data: () => ({value: 'o', updatedAt: 500}),
        },
      },
    ]);
    await flush();
    expect(engine.__getCursorForTests('test')).toBe(9000);
  });
});

describe('quota hardening — cursor withholds pending conflicts, resolveConflict settles them', () => {
  it('does not advance the cursor for a doc that is still an unresolved conflict', async () => {
    const uid = 'uid-cursor-conflict';
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-c', {value: 'local-text', updatedAt: 1000});
    engine.register(adapter);
    await engine.start(uid);
    // loadCursor already ran during attach (defaults to 0).
    expect(engine.__getCursorForTests('test')).toBe(0);

    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'doc-c',
          exists: true,
          data: () => ({value: 'remote-text', updatedAt: 1005}),
        },
      },
    ]);
    await flush();

    expect(engine.__getConflictsForTests()).toHaveLength(1);
    // The conflicting doc's own timestamp must NOT have advanced the
    // cursor — otherwise a future reattach's query floor could exclude
    // this still-unresolved doc before the user ever sees it again.
    expect(engine.__getCursorForTests('test')).toBe(0);
  });

  it('advances the cursor once the conflict is resolved (keepTheirs)', async () => {
    const uid = 'uid-cursor-conflict2';
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-c2', {value: 'local-text', updatedAt: 1000});
    engine.register(adapter);
    await engine.start(uid);

    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'doc-c2',
          exists: true,
          data: () => ({value: 'remote-text', updatedAt: 1005}),
        },
      },
    ]);
    await flush();
    const [conflict] = engine.__getConflictsForTests();
    expect(conflict).toBeDefined();

    await engine.resolveConflict(conflict.id, 'keepTheirs');
    await flush();

    expect(engine.__getCursorForTests('test')).toBe(1005);
  });
});

describe('quota hardening — cursor change does not break 30s conflict detection', () => {
  it('still detects a within-window material-field conflict after a reattach with an advanced cursor', async () => {
    const uid = 'uid-cursor-and-conflict';
    // Simulate a reconnect with an already-advanced cursor, far below the
    // incoming change's timestamp (so the mock query lets it through).
    await AsyncStorage.setItem(cursorStorageKey('test', uid), String(100));

    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-live', {value: 'local', updatedAt: 500_000});
    engine.register(adapter);
    await engine.start(uid);

    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'doc-live',
          // 5s later — well within the 30s conflict window.
          data: () => ({value: 'remote', updatedAt: 505_000}),
          exists: true,
        },
      },
    ]);
    await flush();

    expect(remoteUpsertCalls).toHaveLength(0);
    const conflicts = engine.__getConflictsForTests();
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].docId).toBe('doc-live');
  });
});
