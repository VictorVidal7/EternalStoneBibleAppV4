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

interface MockCollRef {
  doc: jest.Mock<MockDocRef, [string]>;
  onSnapshot: jest.Mock;
  __path: string;
}

const mockCollections = new Map<string, MockCollRef>();
const mockDocSets: Array<{path: string; id: string; data: unknown}> = [];

function mockMakeCollection(path: string): MockCollRef {
  const existing = mockCollections.get(path);
  if (existing) return existing;
  const docs = new Map<string, MockDocRef>();
  let snapshotCb: ((s: unknown) => void) | null = null;
  const coll: MockCollRef = {
    __path: path,
    doc: jest.fn((id: string) => {
      const cached = docs.get(id);
      if (cached) return cached;
      const ref: MockDocRef = {
        set: jest.fn(async (data: unknown) => {
          mockDocSets.push({path, id, data});
        }),
        get: jest.fn(async () => ({exists: false, id, data: () => undefined})),
        delete: jest.fn(async () => undefined),
      };
      docs.set(id, ref);
      return ref;
    }),
    onSnapshot: jest.fn((cb: (s: unknown) => void) => {
      snapshotCb = cb;
      return () => {
        snapshotCb = null;
      };
    }),
  };
  // expose a way for the test to fire snapshots
  (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire = (
    changes: unknown[],
  ) => {
    if (snapshotCb) {
      snapshotCb({
        docChanges: () => changes,
        size: changes.length,
      });
    }
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
import {SyncEngine} from '../src/lib/sync/SyncEngine';
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
    // Flag persisted so a second start skips the bulk push.
    const flag = await AsyncStorage.getItem('@sync_first_push_done:uid-bulk');
    expect(flag).toBe('1');
  });

  it('skips bulk push when the per-uid flag is already set', async () => {
    await AsyncStorage.setItem('@sync_first_push_done:uid-bulk2', '1');
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter();
    localStore.set('a', {value: 'a', updatedAt: 1});
    engine.register(adapter);
    await engine.start('uid-bulk2');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(0);
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
  it('persists the done-flag without queueing local rows', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter();
    localStore.set('only-local', {value: 'x', updatedAt: 1});
    engine.register(adapter);
    engine.queueSkipNextBulkPush();
    await engine.start('uid-skip');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets.filter(d => d.id === 'only-local')).toHaveLength(0);
    const flag = await AsyncStorage.getItem('@sync_first_push_done:uid-skip');
    expect(flag).toBe('1');
  });
});
