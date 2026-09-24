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
/** R9-33 — when true, every `doc.set()` rejects. Reset in beforeEach. */
let mockSetShouldFail = false;
/** R9-104 — when it returns a promise for a (path, id), that `doc.set()`
 *  waits on it before landing (or rejects with it). It is the only way to hold
 *  ONE push in flight across a `stop()` + `start()`. Reset in beforeEach. */
let mockSetGate:
  ((path: string, id: string) => Promise<void> | undefined) | null = null;
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
  let errorCb: ((err: Error) => void) | null = null;
  let whereClauses: MockWhereClause[] = [];
  const coll: MockCollRef = {
    __path: path,
    __whereClauses: whereClauses,
    doc: jest.fn((id: string) => {
      const cached = docs.get(id);
      if (cached) return cached;
      const ref: MockDocRef = {
        set: jest.fn(async (data: unknown) => {
          const gate = mockSetGate?.(path, id);
          if (gate) await gate;
          // R9-33 — lets a test make every push fail, which is the only way
          // to exercise the retry/backoff/give-up path at all.
          if (mockSetShouldFail) throw new Error('permission-denied');
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
    onSnapshot: jest.fn(
      (cb: (s: unknown) => void, onError?: (err: Error) => void) => {
        snapshotCb = cb;
        errorCb = onError ?? null;
        return () => {
          snapshotCb = null;
          // Deliberately NOT clearing errorCb here — real native teardown
          // is async, so the JS error closure SyncEngine registered can
          // still be invoked a beat after this unsub runs. __fireError
          // below uses that to simulate exactly this race.
        };
      },
    ),
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
  (coll as MockCollRef & {__fireError: (err: Error) => void}).__fireError = (
    err: Error,
  ) => {
    errorCb?.(err);
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
  droppedStorageKey,
  unsettledStorageKey,
  CURSOR_SAFETY_MARGIN_MS,
} from '../src/lib/sync/SyncEngine';
import {__resetFirestoreCacheForTests} from '../src/lib/sync/firestore';
import {__resetNetInfoCacheForTests} from '../src/lib/sync/netinfo';
import {logger} from '../src/lib/utils/logger';
import type {
  ConflictChoice,
  SyncAdapter,
  SyncEntity,
} from '../src/lib/sync/types';

const loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});
const loggerWarnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});

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
  mockSetShouldFail = false;
  mockSetGate = null;
  mockDocDeletes.length = 0;
  mockCollDocs.clear();
  mockNetListeners.length = 0;
  __resetFirestoreCacheForTests();
  __resetNetInfoCacheForTests();
  mockFirestoreFn.mockClear();
  loggerErrorSpy.mockClear();
  loggerWarnSpy.mockClear();
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

  it('R9-46 — a THROWING getLocal must not let an older remote overwrite local', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteUpsertCalls} = makeAdapter({
      // The exact shape of the bug: the notes adapter skipped
      // `bibleDB.initialize()`, so on a cold start `getNotes()` threw
      // "Database not initialized" and the adapter's catch turned that into
      // `null` — indistinguishable from "this note does not exist here".
      async getLocal() {
        throw new Error('Database not initialized. Call initialize() first.');
      },
    });
    // Local holds the NEWER note. It must survive.
    localStore.set('doc1', {value: 'local-new', updatedAt: 2000});
    engine.register(adapter);
    await engine.start('uid');
    const coll = mockCollections.get('users/uid/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire([
      {
        type: 'modified',
        doc: {
          id: 'doc1',
          exists: true,
          data: () => ({value: 'remote-STALE', updatedAt: 1000}),
        },
      },
    ]);
    await flush();
    // Pre-fix: `local` was null, so BOTH the LWW guard and the conflict
    // check (which live inside `if (local && data)`) were skipped and the
    // stale remote copy was upserted straight over the newer local note.
    expect(remoteUpsertCalls).toHaveLength(0);
    expect(localStore.get('doc1')?.value).toBe('local-new');
  });

  it('R9-46 — a doc skipped that way does not advance the sync cursor', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter({
      async getLocal() {
        throw new Error('Database not initialized. Call initialize() first.');
      },
    });
    engine.register(adapter);
    await engine.start('uid');
    const coll = mockCollections.get('users/uid/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire([
      {
        type: 'modified',
        doc: {
          id: 'doc1',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 5000}),
        },
      },
    ]);
    await flush();
    // The change was never applied, so the query floor must NOT move past
    // it — otherwise a future reattach filters it out and the change is
    // lost for good. It has to come back on the next reattach.
    const cursor = await AsyncStorage.getItem('@sync_cursor_test:uid');
    expect(cursor).toBeNull();
  });

  it('R9-46 — a skipped doc is not lost when a LATER doc in the same batch is newer', async () => {
    // The withholding above only omits the skipped doc's own timestamp from
    // the batch max. A transient per-doc SQLite failure (the R9-49 class:
    // "database is locked" on one call, fine on the next) skips one doc
    // while a newer sibling in the SAME batch still advances the cursor
    // past it — and the next reattach's query floor filters it out for good.
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      async getLocal(id) {
        if (id === 'doc-old') throw new Error('database is locked');
        return localStore.get(id) ?? null;
      },
    });
    engine.register(adapter);
    await engine.start('uid');
    const coll = mockCollections.get('users/uid/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire([
      {
        type: 'modified',
        doc: {
          id: 'doc-old',
          exists: true,
          data: () => ({value: 'never-applied', updatedAt: 1_000_000}),
        },
      },
      {
        type: 'modified',
        doc: {
          id: 'doc-new',
          exists: true,
          data: () => ({value: 'applied', updatedAt: 9_000_000}),
        },
      },
    ]);
    await flush();
    // The next reattach queries updatedAt >= floor. If that floor is past
    // doc-old, the change this device never took is gone forever.
    // (R9-106: measured on a real reattach, not derived from the cursor. The
    // cursor itself now follows doc-new; what holds the floor is the
    // persisted set of unsettled docs, which the cursor alone could only do
    // inside this one batch.)
    engine.stop();
    await engine.start('uid');
    const floor = mockCollections
      .get('users/uid/test')!
      .__whereClauses.find(c => c.field === 'updatedAt')?.value;
    expect(floor).toBeLessThanOrEqual(1_000_000);
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

describe('engine boundary sanitization (Sprint 78 + R9-50)', () => {
  it('nullifies undefined fields before the Firestore set so the write lands', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-clean');
    // Simulates a payload that skipped its builder's nullifyUndefined —
    // pre-S78 this wedged the queue until the entry was DROPPED.
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
    // R9-50 — the KEY has to survive as an explicit null: `pushOne` writes
    // with `{merge: true}`, under which an omitted key means "keep whatever
    // the server has", making an optional field impossible to unset.
    expect('note' in data).toBe(true);
    expect(data.note).toBeNull();
    expect(data.meta).toEqual({label: null, ok: true});
    expect(Object.values(data).includes(undefined)).toBe(false);
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });

  it('R9-45 — a live write clears a previous tombstone (deleted: false)', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-tombstone');

    // Delete, let it actually reach Firestore, then re-create the SAME id —
    // highlights key on the verseId, a reusable natural key, so this is the
    // ordinary "unhighlight, then highlight the verse again later" flow.
    engine.queueDelete('test', 'doc-reused', {value: 'v1', updatedAt: 100});
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(1);
    expect(mockDocSets[0].data).toMatchObject({deleted: true});

    engine.queueWrite('test', 'doc-reused', {value: 'v2', updatedAt: 200});
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(2);
    const resurrected = mockDocSets[1].data as Record<string, unknown>;
    // Pre-fix the second write omitted `deleted`, and `{merge: true}` left
    // the doc carrying the new value AND the old tombstone — every other
    // device read it as deleted, permanently.
    expect(resurrected.value).toBe('v2');
    expect(resurrected.deleted).toBe(false);
    expect(resurrected.deletedAt).toBeNull();
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
  const persistedEntry = (uid: string, id: string) => ({
    uid,
    collection: 'test',
    id,
    data: {value: 'from-disk', updatedAt: 1, deleted: false},
    queuedAt: 0,
    attempts: 0,
  });

  it('hydrates a previously persisted queue on start', async () => {
    await AsyncStorage.setItem(
      '@sync_queue_v1',
      JSON.stringify([persistedEntry('uid-persist', 'persisted')]),
    );
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-persist');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets.some(d => d.id === 'persisted')).toBe(true);
  });

  it('R9-22 — never drains a PREVIOUS user’s queue into the account signed in now', async () => {
    // Ana queued offline, then signed out; Beto signs into the same phone.
    await AsyncStorage.setItem(
      '@sync_queue_v1',
      JSON.stringify([persistedEntry('uid-ana', 'juan-3-16')]),
    );
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-beto');
    await flush();
    await engine.__flushForTests();
    // Pre-fix `pushOne` wrote it against whatever uid was active NOW, so
    // Ana's write landed under users/uid-beto — and for the natural-key
    // adapters a parked tombstone deleted Beto's row on all his devices.
    expect(mockDocSets).toHaveLength(0);
    // …and Beto isn't told he has work pending that he can't resolve.
    expect(engine.getState().pendingWrites).toBe(0);
  });

  it('R9-22 — Ana’s parked write survives and flushes when Ana returns', async () => {
    await AsyncStorage.setItem(
      '@sync_queue_v1',
      JSON.stringify([persistedEntry('uid-ana', 'juan-3-16')]),
    );
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-beto');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(0);

    // Beto signs out, Ana signs back in on the same phone.
    engine.stop();
    await engine.start('uid-ana');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(1);
    expect(mockDocSets[0].path).toContain('uid-ana');
    expect(mockDocSets[0].id).toBe('juan-3-16');
  });

  it('R9-22 — two accounts can hold a pending write for the SAME natural-key id', async () => {
    // memoryCards key on the verseKey and highlights on the verseId, both
    // stable across users — so the dedupe key has to include the uid or one
    // account's write silently replaces the other's in the queue.
    await AsyncStorage.setItem(
      '@sync_queue_v1',
      JSON.stringify([
        persistedEntry('uid-ana', 'Juan/3/16'),
        persistedEntry('uid-beto', 'Juan/3/16'),
      ]),
    );
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-beto');
    await flush();
    await engine.__flushForTests();
    expect(mockDocSets).toHaveLength(1);
    expect(mockDocSets[0].path).toContain('uid-beto');
    // Ana's entry is untouched, still parked for her.
    const raw = await AsyncStorage.getItem('@sync_queue_v1');
    expect(JSON.parse(raw!)).toEqual([
      expect.objectContaining({uid: 'uid-ana', id: 'Juan/3/16'}),
    ]);
  });

  it('R9-22 — drops a pre-fix entry that carries no owner uid', async () => {
    await AsyncStorage.setItem(
      '@sync_queue_v1',
      JSON.stringify([
        {
          collection: 'test',
          id: 'legacy',
          data: {value: 'from-disk', updatedAt: 1},
          queuedAt: 0,
          attempts: 0,
        },
      ]),
    );
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-whoever');
    await flush();
    await engine.__flushForTests();
    // There is no way to tell whose it was; the local change it represents
    // is already applied locally and is not lost by dropping it.
    expect(mockDocSets).toHaveLength(0);
    // It must actually be GONE, not merely un-pushed: the flush-time owner
    // filter would keep an un-droppable entry parked in the queue forever,
    // which is what this assertion distinguishes.
    expect(engine.__getQueueForTests()).toHaveLength(0);
    const raw = await AsyncStorage.getItem('@sync_queue_v1');
    expect(JSON.parse(raw!)).toEqual([]);
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

function fireRemoteError(uid: string, err: Error): void {
  const coll = mockCollections.get(`users/${uid}/test`);
  if (!coll) throw new Error(`mock collection not registered for ${uid}`);
  (coll as MockCollRef & {__fireError: (e: Error) => void}).__fireError(err);
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

describe('onSnapshot error handling — sign-out race (permission-denied downgrade)', () => {
  // AuthContext.signOut() now calls engine.stop() before invalidating the
  // Firebase Auth token, but the native listener teardown is still async
  // under the hood — a permission-denied error can arrive here a beat
  // after stop() already removed the collection from `unsubs`. That must
  // be logged quietly (warn), not as a real error, so sign-out doesn't
  // flash a red LogBox toast for an expected, harmless race.
  it('downgrades a snapshot error to a warning when the listener was already torn down', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-race');
    await flush();

    engine.stop();
    fireRemoteError(
      'uid-race',
      Object.assign(new Error('denied'), {
        code: 'firestore/permission-denied',
      }),
    );

    expect(loggerErrorSpy).not.toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('after teardown'),
      expect.objectContaining({collection: 'test'}),
    );
  });

  it('still logs as a real error when the listener is genuinely still active', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-real-error');
    await flush();

    // No stop() here — the engine still considers this listener live, so
    // a permission-denied is a genuine problem, not a sign-out artifact.
    fireRemoteError(
      'uid-real-error',
      Object.assign(new Error('denied'), {
        code: 'firestore/permission-denied',
      }),
    );

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'SyncEngine: snapshot error',
      expect.any(Error),
      expect.objectContaining({collection: 'test'}),
    );
    expect(loggerWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('after teardown'),
      expect.anything(),
    );
  });
});

describe('attachListener — stop() racing an in-flight cursor load', () => {
  // register()'s fire-and-forget attachListener() awaits an AsyncStorage
  // read (loadCursor) before it ever calls onSnapshot(). If stop() lands
  // during that await, attachListener must not resurrect a live listener
  // for an engine that's now stopped — that would defeat AuthContext.
  // signOut's ordering fix via a different path (see SyncEngine.ts
  // attachListener's `uidAtAttach` check).
  it('does not attach a listener if stop() runs while loadCursor is pending', async () => {
    const engine = new SyncEngine();
    await engine.start('uid-race-attach'); // no adapters registered yet

    const {adapter, remoteUpsertCalls} = makeAdapter();

    // AsyncStorage.getItem is ALREADY a jest.fn() (the official
    // async-storage jest mock) — wrapping it in jest.spyOn()/mockRestore()
    // does not cleanly restore its default implementation in this setup.
    // mockImplementationOnce needs no restore: it self-expires after
    // exactly one call and the mock's real default implementation (set at
    // module load) takes back over automatically.
    let resolveGetItem!: (v: string | null) => void;
    const pending = new Promise<string | null>(res => {
      resolveGetItem = res;
    });
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(() => pending);

    engine.register(adapter); // synchronously reaches the pending getItem
    await flush();

    engine.stop(); // races the in-flight attach
    resolveGetItem(null);
    await flush();
    await flush();

    // Without the uidAtAttach guard, onSnapshot would have registered a
    // live callback here and this fire would reach the adapter.
    fireRemote('uid-race-attach', [
      {
        type: 'added',
        doc: {
          id: 'doc-after-race',
          exists: true,
          data: () => ({value: 'x', updatedAt: 1}),
        },
      },
    ]);
    await flush();

    expect(remoteUpsertCalls).toHaveLength(0);
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

describe('R9-33 — retry backoff y la senal de descarte', () => {
  it('no quema los 8 intentos en una rafaga de flushes', async () => {
    // Pre-fix `queuedAt` se escribia en 3 sitios y no se leia en ninguno, asi
    // que los 8 intentos se gastaban tan rapido como algo llamara a flush():
    // la sonda del ledger los agoto en 1 ms. Un corte de red de unos minutos,
    // con el flush periodico solo, bastaba para perder la escritura.
    mockSetShouldFail = true;
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');
    engine.queueWrite('test', 'doc1', {value: 'no se pierde', updatedAt: 100});
    await flush();
    for (let i = 0; i < 12; i++) {
      await engine.__flushForTests();
      await flush();
    }
    // Sigue en la cola: la espera la protegio de su propio reintento.
    expect(engine.__getQueueForTests()).toHaveLength(1);
    expect(engine.getState().droppedWrites).toBe(0);
    // Y un solo intento real, no doce.
    expect(engine.__getQueueForTests()[0].attempts).toBe(1);
  });

  it('se rinde solo cuando las esperas pasan de verdad, y LO DICE', async () => {
    mockSetShouldFail = true;
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');
    engine.queueWrite('test', 'doc1', {value: 'se pierde', updatedAt: 100});
    await flush();

    // Cada intento con una hora de por medio: supera cualquier ventana.
    const realNow = Date.now();
    const nowSpy = jest.spyOn(Date, 'now');
    for (let i = 0; i < 10; i++) {
      nowSpy.mockReturnValue(realNow + i * 60 * 60 * 1000);
      await engine.__flushForTests();
      await flush();
    }
    nowSpy.mockRestore();

    expect(engine.__getQueueForTests()).toHaveLength(0);
    // Lo que faltaba: pendingWrites cae a 0 igual, asi que el indicador de
    // Ajustes pasaba a «Sincronizado hace un momento» en el mismo instante en
    // que el motor tiraba la escritura. Por eso hace falta un contador aparte.
    expect(engine.getState().pendingWrites).toBe(0);
    expect(engine.getState().droppedWrites).toBe(1);
    // Y sobrevive a un reinicio: un aviso que el usuario no llego a ver no es
    // un aviso.
    expect(await AsyncStorage.getItem('@sync_dropped_uid')).toBe('1');
  });

  it('el aviso de una cuenta no sobrevive a su cierre de sesion', async () => {
    await AsyncStorage.setItem('@sync_dropped_uid-ana', '2');
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-ana');
    await flush();
    expect(engine.getState().droppedWrites).toBe(2);

    // `stop()` ya limpia los cursores y los conflictos por esto mismo: son
    // estado por-uid y no pueden quedar vivos para la cuenta siguiente. El
    // contador de descartes nacio despues y se quedo fuera de esa lista.
    // Ajustes lo pinta en cuanto `user` pasa a ser Beto, y `start('uid-beto')`
    // es asincrona (dos lecturas de AsyncStorage), asi que hay un render con
    // la sesion de Beto y el aviso de Ana.
    engine.stop();
    expect(engine.getState().droppedWrites).toBe(0);

    // Y sigue siendo de Ana: al volver ella, el aviso vuelve con ella.
    await engine.start('uid-ana');
    await flush();
    expect(engine.getState().droppedWrites).toBe(2);
  });

  it('el aviso se limpia solo cuando el usuario lo reconoce', async () => {
    await AsyncStorage.setItem('@sync_dropped_uid', '3');
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');
    await flush();
    expect(engine.getState().droppedWrites).toBe(3);
    await engine.acknowledgeDroppedWrites();
    expect(engine.getState().droppedWrites).toBe(0);
    expect(await AsyncStorage.getItem('@sync_dropped_uid')).toBeNull();
  });
});

describe('R9-34 — la rama de error no puede hacer retroceder la cola', () => {
  it('una reedicion durante el push en vuelo sobrevive al fallo', async () => {
    mockSetShouldFail = true;
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');

    // La carrera EXACTA: `queueWrite` llama a `void this.flush()` de forma
    // sincrona, y `flush()` corre hasta su primer `await` —el de `pushOne`—
    // antes de devolver. Asi que al volver de esta linea el push YA esta en
    // vuelo y `items` ya quedo capturado con v1.
    //
    // Ojo: no metas un `await flush()` aqui. El primer intento fallaria, y el
    // backoff que R9-33 acaba de introducir dejaria la entrada NO vencida, asi
    // que el `flush()` siguiente saldria por `flushableCount() === 0` sin
    // empujar nada — no habria push en vuelo y la prueba pasaria con el bug
    // puesto. Es lo que le pasaba a la primera version de esta prueba.
    engine.queueWrite('test', 'doc1', {value: 'v1', updatedAt: 1000});
    // Reedicion mientras ese pushOne sigue en vuelo.
    engine.queueWrite('test', 'doc1', {value: 'v2-REEDITADO', updatedAt: 2000});
    await flush();

    // Control de que la carrera ocurrio de verdad: si `flush()` hubiera salido
    // temprano no habria intento ninguno, y entonces este `toBe(1)` —no la
    // asercion de abajo— seria lo que falla.
    expect(engine.__getQueueForTests()[0].attempts).toBe(1);

    // Pre-fix la rama de error escribia `{...item}` —el snapshot tomado al
    // empezar el flush— encima de la entrada nueva, asi que ni un reintento
    // con exito podia subir ya la edicion nueva: retrocedia la cola misma.
    const queued = engine.__getQueueForTests();
    expect(queued).toHaveLength(1);
    expect((queued[0].data as unknown as {value: string}).value).toBe(
      'v2-REEDITADO',
    );
  });
});

describe('R9-11 — la rama de EXITO tampoco puede tragarse una reedicion', () => {
  // Gemelo de R9-34, pero en la rama comun: los push normalmente FUNCIONAN, asi
  // que esta es la que se dispara de verdad. La rama de exito borraba de la cola
  // por `uid+collection+id` sin mirar version, de modo que la entrada NUEVA se
  // eliminaba como si se hubiera subido ella.
  //
  // La carrera se monta igual que la de R9-34 reescrita: `queueWrite` llama a
  // `void this.flush()` de forma SINCRONA y `flush()` corre hasta su primer
  // `await` —el de `pushOne`— antes de devolver el control, asi que al volver de
  // la primera linea el push ya esta en vuelo e `items` ya quedo capturado. NO
  // metas un `await` entre las dos llamadas o no hay carrera ninguna.
  async function settle(): Promise<void> {
    // El re-flush de la cola del final de `flush()` es fire-and-forget, asi que
    // hace falta mas de un turno para que la segunda subida aterrice.
    for (let i = 0; i < 5; i++) await flush();
  }

  it('una reedicion durante un push EXITOSO acaba llegando a Firestore', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');

    engine.queueWrite('test', 'doc1', {value: 'amarillo', updatedAt: 1000});
    // El usuario recolorea mientras se sube.
    engine.queueWrite('test', 'doc1', {value: 'verde', updatedAt: 2000});
    await settle();

    // Pre-fix solo subia 'amarillo': local quedaba verde y Firestore amarillo
    // PARA SIEMPRE, porque la cola ya no tenia nada que reintentar y el
    // telefono que lo origino nunca vuelve a mandar ese cambio.
    const pushed = mockDocSets
      .filter(d => d.id === 'doc1')
      .map(d => (d.data as {value: string}).value);
    expect(pushed).toEqual(['amarillo', 'verde']);
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });

  it('un borrado encolado durante un push EXITOSO no pierde la lapida', async () => {
    // El vecino, y es peor que el de arriba: aqui lo que se traga la rama de
    // exito es un TOMBSTONE. Sin el, el borrado no viaja nunca, y la fila
    // resucita en todos los demas dispositivos de la cuenta en su siguiente
    // bajada — el usuario borra algo y le vuelve solo.
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');

    engine.queueWrite('test', 'doc1', {value: 'texto', updatedAt: 1000});
    engine.queueDelete('test', 'doc1', {value: 'texto'});
    await settle();

    const tombstones = mockDocSets.filter(
      d => d.id === 'doc1' && (d.data as {deleted?: boolean}).deleted === true,
    );
    expect(tombstones).toHaveLength(1);
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });

  it('sin reedicion, una subida con exito SI vacia la cola', async () => {
    // Control: el arreglo no puede dejar entradas colgadas en el caso normal,
    // que es la inmensa mayoria de los push.
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');

    engine.queueWrite('test', 'doc1', {value: 'una sola vez', updatedAt: 1000});
    await settle();

    expect(engine.__getQueueForTests()).toHaveLength(0);
    expect(mockDocSets.filter(d => d.id === 'doc1')).toHaveLength(1);
    expect(engine.getState().pendingWrites).toBe(0);
  });
});

describe('R9-65 — un doc en conflicto tambien tiene que frenar el cursor', () => {
  it('un hermano mas nuevo del mismo lote no arrastra el suelo por delante del conflicto', async () => {
    const uid = 'uid-conflicto-cursor';
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    // Copia local que va a chocar con la remota dentro de la ventana de 30 s.
    localStore.set('doc-conflicto', {value: 'lo mio', updatedAt: 500_000});
    engine.register(adapter);
    await engine.start(uid);

    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'doc-conflicto',
          exists: true,
          data: () => ({value: 'lo suyo', updatedAt: 505_000}),
        },
      },
      {
        // MISMO lote, mucho mas nuevo, y este si se aplica.
        type: 'modified',
        doc: {
          id: 'doc-nuevo',
          exists: true,
          data: () => ({value: 'sin conflicto', updatedAt: 9_000_000}),
        },
      },
    ]);
    await flush();

    // Control: si no hubo conflicto, esta prueba no esta probando lo que cree.
    expect(engine.__getConflictsForTests()).toHaveLength(1);

    // El cursor es UNO para el lote entero. Retener el conflicto de
    // `maxSeenUpdatedAt` no basta: el hermano nuevo lo empujaba igual a
    // 9_000_000, y el suelo de la proxima consulta (`cursor - 5 min` =
    // 8_700_000) deja al doc en conflicto por debajo para siempre. Y como
    // `stop()` limpia `this.conflicts` por transitorios, un reinicio antes de
    // resolverlo pierde el conflicto Y el cursor ya paso de largo: el cambio
    // remoto se cae en silencio.
    //
    // R9-106: medido en el enganche de verdad tras el reinicio, no en el
    // cursor. El cursor ahora SI sigue al hermano; lo que sostiene el suelo es
    // el conjunto persistido de docs sin asentar.
    engine.stop();
    await engine.start(uid);
    const floor = mockCollections
      .get(`users/${uid}/test`)!
      .__whereClauses.find(c => c.field === 'updatedAt')?.value;
    expect(floor).toBeLessThan(505_000);
  });
});

describe('R9-35 — el cursor no puede quedar por delante del reloj', () => {
  it('un updatedAt en el futuro no empuja el cursor al futuro', async () => {
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');
    const future = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 dias
    const coll = mockCollections.get('users/uid/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire([
      {
        type: 'modified',
        doc: {
          id: 'doc1',
          exists: true,
          data: () => ({value: 'reloj adelantado', updatedAt: future}),
        },
      },
    ]);
    await flush();
    const raw = await AsyncStorage.getItem('@sync_cursor_test:uid');
    // Corregido el reloj, un cursor 30 dias por delante deja TODA escritura
    // posterior por debajo del suelo `cursor - 5 min` y la bajada se para para
    // siempre; el cursor nunca retrocede y nada lo resetea.
    expect(Number(raw)).toBeLessThanOrEqual(Date.now());
  });

  it('un cursor ya envenenado se descarta al cargarlo y la bajada vuelve', async () => {
    const future = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem('@sync_cursor_test:uid', String(future));
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');
    await flush();
    // El suelo de la consulta vuelve a 0: se re-lee la coleccion una vez, que
    // es lo unico que recupera lo que el cursor envenenado escondio. Antes de
    // esto el unico remedio era reinstalar la app.
    const coll = mockCollections.get('users/uid/test')!;
    const floor = coll.__whereClauses.find(c => c.field === 'updatedAt');
    expect(floor === undefined || Number(floor.value) === 0).toBe(true);
    expect(await AsyncStorage.getItem('@sync_cursor_test:uid')).toBeNull();
  });
});

describe('R9-22 — el conteo de pendientes al cambiar de cuenta', () => {
  it('no le muestra a la cuenta nueva los pendientes de la anterior', async () => {
    await AsyncStorage.setItem(
      '@sync_queue_v1',
      JSON.stringify([
        {
          uid: 'uid-ana',
          collection: 'test',
          id: 'juan-3-16',
          data: {value: 'de ana', updatedAt: 1},
          queuedAt: 0,
          attempts: 0,
        },
      ]),
    );
    // La escritura de Ana tiene que seguir PENDIENTE al salir ella: si se
    // sube bien, la cola se vacia sola y la prueba no discrimina nada.
    mockSetShouldFail = true;
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-ana');
    await flush();
    expect(engine.getState().pendingWrites).toBe(1);
    engine.stop();
    mockSetShouldFail = false;

    // Beto entra en la MISMA sesion de la app: hydrateQueue sale temprano por
    // queueHydrated y stop() conserva el conteo a proposito, asi que nadie lo
    // recalculaba. Ajustes le decia «Sincronizando 1 cambio…» para siempre,
    // por algo que no es suyo y que no puede resolver.
    await engine.start('uid-beto');
    await flush();
    expect(engine.getState().pendingWrites).toBe(0);
  });
});

describe('R9-103 — la supresion de ecos es por DOC, no global', () => {
  // `suppressLocalWriteCount` era un contador GLOBAL: mientras CUALQUIER apply
  // remoto esperaba a SQLite, `queueWrite` y `queueDelete` salian sin hacer
  // nada para CUALQUIER doc. Ningun adaptador encola dentro de un apply, asi
  // que lo unico que se tragaba de verdad eran las ediciones del USUARIO que
  // coincidian con una bajada: cola vacia, nada subido, `pendingWrites 0` y
  // `droppedWrites 0`. Y la ventana es ancha justo cuando mas se baja
  // (dispositivo nuevo, reinstalacion, la re-descarga de R9-35).
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  function fireRemote(
    changes: Array<{id: string; data: Record<string, unknown>}>,
  ): void {
    const coll = mockCollections.get('users/uid/test')!;
    (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire(
      changes.map(c => ({
        type: 'added',
        doc: {id: c.id, exists: true, data: () => c.data},
      })),
    );
  }

  it('una edicion y un borrado de OTRO doc durante una bajada en vuelo SI suben', async () => {
    let releaseApply!: () => void;
    const applyGate = new Promise<void>(resolve => {
      releaseApply = resolve;
    });
    let applyInFlight = false;
    const engine = new SyncEngine();
    const {adapter} = makeAdapter({
      async applyRemoteUpsert() {
        // SQLite lento: el apply se queda esperando con la supresion puesta.
        applyInFlight = true;
        await applyGate;
        applyInFlight = false;
      },
    });
    engine.register(adapter);
    await engine.start('uid');
    await settle();

    fireRemote([{id: 'de-la-nube', data: {value: 'remoto', updatedAt: 2000}}]);
    await flush();
    // Control del mecanismo: si la bajada NO estuviera en vuelo al editar, no
    // habria nada que suprimir y la prueba pasaria con el bug puesto.
    expect(applyInFlight).toBe(true);

    engine.queueWrite('test', 'mio', {
      value: 'editado a mano',
      updatedAt: 3000,
    });
    engine.queueDelete('test', 'borrado', {value: 'adios'});

    releaseApply();
    await settle();

    expect(applyInFlight).toBe(false);
    const pushed = mockDocSets.filter(d => d.path === 'users/uid/test');
    expect(pushed.find(d => d.id === 'mio')?.data).toMatchObject({
      value: 'editado a mano',
      deleted: false,
    });
    expect(pushed.find(d => d.id === 'borrado')?.data).toMatchObject({
      deleted: true,
    });
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });

  it('el ECO del mismo doc se sigue suprimiendo, tambien el de un borrado', async () => {
    // No discrimina contra R9-103, y es a proposito: su trabajo es impedir que
    // el arreglo se pase de largo y quite la supresion entera. Un adaptador que
    // al escribir en local dispara su propio queueWrite/queueDelete tiene que
    // seguir sin rebotar a la nube lo que acaba de bajar.
    const engine = new SyncEngine();
    const applied: string[] = [];
    const {adapter} = makeAdapter({
      async applyRemoteUpsert(id, data) {
        await Promise.resolve();
        applied.push(id);
        engine.queueWrite('test', id, data);
      },
      async applyRemoteDelete(id) {
        await Promise.resolve();
        applied.push(id);
        engine.queueDelete('test', id, {value: 'eco'});
      },
    });
    engine.register(adapter);
    await engine.start('uid');
    await settle();

    fireRemote([
      {id: 'eco-upsert', data: {value: 'remoto', updatedAt: 2000}},
      {
        id: 'eco-borrado',
        data: {value: 'x', updatedAt: 2000, deleted: true},
      },
    ]);
    await settle();

    // Control: los dos applies tienen que haber corrido de verdad. Si la bajada
    // no llegara (un filtro del cursor, un lote vacio), no habria eco ninguno
    // y la asercion de abajo pasaria sin haber mirado nada.
    expect(applied.sort()).toEqual(['eco-borrado', 'eco-upsert']);
    expect(mockDocSets.filter(d => d.id.startsWith('eco-'))).toHaveLength(0);
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });
});

describe('R9-104 — un push en vuelo no puede cruzar a la cuenta que entra', () => {
  // `flush()` toma una foto del uid para FILTRAR la cola (el arreglo de R9-22),
  // pero despues hace `await pushOne(...)` item por item y nunca volvia a mirar
  // la cuenta. Si Ana cierra sesion con un push en vuelo y entra Beto, lo que
  // pase al volver ese `await` pasa ya en la sesion de Beto.
  //
  // Hay DOS ramas, segun lo que haga el SDK con un `set()` en vuelo cuando
  // cambia el usuario, y cada una tiene su prueba:
  //  - lo resuelve despues del cambio → el resto del lote de Ana se escribia
  //    bajo `users/<beto>` (mezcla entre cuentas, la clase de R9-22);
  //  - no lo resuelve nunca → `flushInFlight` quedaba en `true` y Beto no subia
  //    nada hasta reiniciar la app. El SDK de JS 4.17 hace ESTO: guarda el
  //    callback bajo el usuario que escribio y, al cambiar de usuario, ni lo
  //    resuelve ni lo rechaza. Volver a mirar la cuenta DESPUES del `await` no
  //    sirve aqui, porque ese `await` no vuelve.
  //
  // Las dos necesitan un `set()` retenido que siga en vuelo al hacer
  // `stop()` + `start()`; sin eso no hay carrera y pasan por la razon trivial.
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  const anaEntry = (id: string, value: string, attempts = 0) => ({
    uid: 'uid-ana',
    collection: 'test',
    id,
    data: {value, updatedAt: 1000, deleted: false},
    queuedAt: 0,
    attempts,
    lastAttemptAt: 0,
  });

  /** Ana entra con `entries` ya en cola, y el push de `heldId` se queda en
   *  vuelo hasta que la prueba decida. */
  async function anaWithHeldPush(
    entries: ReturnType<typeof anaEntry>[],
    heldId: string,
    gate: Promise<void>,
  ): Promise<{engine: SyncEngine; heldSets: string[]}> {
    await AsyncStorage.setItem('@sync_queue_v1', JSON.stringify(entries));
    const heldSets: string[] = [];
    mockSetGate = (_path, id) => {
      if (id !== heldId) return undefined;
      heldSets.push(id);
      return gate;
    };
    const engine = new SyncEngine();
    const {adapter} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid-ana');
    await settle();
    return {engine, heldSets};
  }

  it('si el set de Ana resuelve DESPUES del cambio, el resto de su lote no cae en la nube de Beto', async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const {engine, heldSets} = await anaWithHeldPush(
      [anaEntry('doc1', 'uno-de-ana'), anaEntry('doc2', 'dos-de-ana')],
      'doc1',
      gate,
    );
    // Control del mecanismo: doc1 tiene que estar EN VUELO, y nada subido aun.
    expect(heldSets).toEqual(['doc1']);
    expect(mockDocSets).toHaveLength(0);

    engine.stop();
    await engine.start('uid-beto');
    release();
    await settle();

    // Pre-fix: `sets: [{path: 'users/uid-beto/test', id: 'doc2', value:
    // 'dos-de-ana'}]`, y la cola de Ana vacia COMO SI se hubiera subido.
    expect(
      mockDocSets.filter(d => d.path.startsWith('users/uid-beto/')),
    ).toEqual([]);
    // doc1 aterrizo donde se emitio, en la nube de Ana: ese si salio de la cola.
    expect(mockDocSets.map(d => [d.path, d.id])).toEqual([
      ['users/uid-ana/test', 'doc1'],
    ]);
    // Y doc2 sigue aparcado para cuando vuelva Ana.
    expect(
      engine.__getQueueForTests().map(q => [q.uid, q.id, q.attempts]),
    ).toEqual([['uid-ana', 'doc2', 0]]);
  });

  it('si el set de Ana no resuelve NUNCA, Beto igual sube lo suyo', async () => {
    const {engine, heldSets} = await anaWithHeldPush(
      [anaEntry('doc-ana', 'de-ana')],
      'doc-ana',
      new Promise<void>(() => {}),
    );
    expect(heldSets).toEqual(['doc-ana']);

    engine.stop();
    await engine.start('uid-beto');
    await settle();
    engine.queueWrite('test', 'doc-beto', {value: 'de-beto', updatedAt: 2000});
    await settle();

    // Pre-fix `flushInFlight` seguia en `true` por el push de Ana, que no iba
    // a volver jamas: cada flush de Beto salia en la primera linea. Sus
    // escrituras quedaban en cola y en disco, sin subir, hasta reiniciar.
    expect(mockDocSets.map(d => [d.path, d.id])).toEqual([
      ['users/uid-beto/test', 'doc-beto'],
    ]);
    expect(engine.getState().pendingWrites).toBe(0);
    expect(engine.getState().isSyncing).toBe(false);
    expect(engine.__getQueueForTests().map(q => [q.uid, q.id])).toEqual([
      ['uid-ana', 'doc-ana'],
    ]);
  });

  it('el flush viejo de Ana, al volver, no le suelta el candado al flush de Beto', async () => {
    let releaseAna!: () => void;
    const gateAna = new Promise<void>(resolve => {
      releaseAna = resolve;
    });
    const {engine, heldSets} = await anaWithHeldPush(
      [anaEntry('doc-ana', 'de-ana')],
      'doc-ana',
      gateAna,
    );
    expect(heldSets).toEqual(['doc-ana']);

    engine.stop();
    await engine.start('uid-beto');
    await settle();

    // Beto tambien tiene un push en vuelo cuando vuelve el de Ana.
    let releaseBeto!: () => void;
    const gateBeto = new Promise<void>(resolve => {
      releaseBeto = resolve;
    });
    const betoSets: string[] = [];
    mockSetGate = (_path, id) => {
      if (id === 'doc-ana') return gateAna;
      if (!id.startsWith('doc-beto')) return undefined;
      betoSets.push(id);
      return id === 'doc-beto-1' ? gateBeto : undefined;
    };
    engine.queueWrite('test', 'doc-beto-1', {value: 'uno', updatedAt: 2000});
    await settle();
    expect(betoSets).toEqual(['doc-beto-1']);

    releaseAna();
    await settle();

    // Si el `finally` del flush de Ana soltara el candado, su re-flush final
    // (o cualquier escritura de Beto) arrancaria un SEGUNDO flush en paralelo
    // al de Beto, que volveria a subir doc-beto-1 porque sigue en la cola.
    expect(betoSets).toEqual(['doc-beto-1']);

    engine.queueWrite('test', 'doc-beto-2', {value: 'dos', updatedAt: 2001});
    await settle();
    releaseBeto();
    await settle();

    expect(betoSets).toEqual(['doc-beto-1', 'doc-beto-2']);
    expect(engine.getState().isSyncing).toBe(false);
    expect(engine.getState().pendingWrites).toBe(0);
  });

  it('si el set de Ana FALLA despues del cambio, no se gasta su intento ni se le cuenta a Beto', async () => {
    let fail!: (err: Error) => void;
    const gate = new Promise<void>((_resolve, reject) => {
      fail = reject;
    });
    // A un intento de rendirse: si este fallo contara, el motor la tiraria.
    const {engine, heldSets} = await anaWithHeldPush(
      [anaEntry('doc-ana', 'de-ana', 7)],
      'doc-ana',
      gate,
    );
    expect(heldSets).toEqual(['doc-ana']);

    engine.stop();
    await engine.start('uid-beto');
    fail(new Error('permission-denied'));
    await settle();

    // Pre-fix la rama de error contaba el intento, llegaba a 8, tiraba la
    // escritura de Ana y apuntaba el descarte con `this.uid`, o sea a BETO: su
    // insignia de Ajustes decia que el habia perdido un cambio, persistido
    // bajo su clave, y Ana no se enteraba nunca.
    expect(engine.getState().droppedWrites).toBe(0);
    expect(await AsyncStorage.getItem('@sync_dropped_uid-beto')).toBeNull();
    expect(await AsyncStorage.getItem('@sync_dropped_uid-ana')).toBeNull();
    // Un fallo que causo el propio cambio de cuenta no dice nada de la
    // escritura: sigue intacta para cuando vuelva Ana.
    expect(
      engine.__getQueueForTests().map(q => [q.uid, q.id, q.attempts]),
    ).toEqual([['uid-ana', 'doc-ana', 7]]);
  });
});

describe('R9-153 / R9-122.4 — un lote de Ana en vuelo tras el stop() no pasa a la sesion de Beto', () => {
  // El vecino de R9-104: la 20 le puso sesion al flush y no a `handleSnapshot`.
  // Ese bucle hace un `await` por doc (la lectura local y el apply) y, al final,
  // `await advanceCursor(...)`, y nunca volvia a mirar si hubo un `stop()`. Lo
  // que corria al volver de esos `await` corria ya en la sesion siguiente, con
  // dos efectos (sonda de la S23, reproducida aqui caso por caso):
  //  - el conflicto de Ana entraba en `this.conflicts`, que `stop()` ya habia
  //    vaciado y `start()` no vacia: lo heredaba Beto, y resolverlo escribia la
  //    copia de la NUBE de Ana en `users/<beto>/conflicts` (y con keepMine o
  //    merge, tambien en `users/<beto>/test`);
  //  - `advanceCursor` escribia el maximo del lote de Ana bajo la clave y el
  //    cache en memoria de Beto, asi que su PRIMER enganche salia con piso
  //    `cursorDeAna - 5 min` y un doc suyo de hace 1 hora no bajaba nunca.
  //
  // Todas necesitan el lote EN VUELO al hacer `stop()`: un paso del adaptador
  // queda retenido hasta que la prueba lo suelte. Sin eso no hay carrera y
  // pasarian por la razon trivial.
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  const T0 = 1_000_000;

  const restoreStorage: Array<() => void> = [];
  afterEach(() => {
    while (restoreStorage.length > 0) restoreStorage.pop()!();
  });

  /** Retiene UNA clave de AsyncStorage hasta que la prueba la suelte. El resto
   *  de claves pasa por la implementacion del mock de siempre. */
  function holdStorage(
    method: 'getItem' | 'setItem',
    key: string,
  ): {release: () => void; hits: string[]} {
    const mock = AsyncStorage[method] as unknown as jest.Mock;
    const real = mock.getMockImplementation()!;
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const hits: string[] = [];
    mock.mockImplementation(async (k: string, ...rest: unknown[]) => {
      if (k === key) {
        hits.push(k);
        await gate;
      }
      return real(k, ...rest);
    });
    restoreStorage.push(() => mock.mockImplementation(real));
    return {release, hits};
  }

  type Hold = {op: 'read' | 'apply' | 'delete'; id: string};
  type Change = {type: string; id: string; data: Record<string, unknown>};

  /** a1 entra sin mas; a2 choca con la copia local de Ana a 5 s y con otro
   *  valor: un conflicto de verdad. */
  const conflictBatch = (base: number): Change[] => [
    {
      type: 'added',
      id: 'a1',
      data: {value: 'uno-de-ana', updatedAt: base - 10_000},
    },
    {
      type: 'modified',
      id: 'a2',
      data: {value: 'remoto-de-ana', updatedAt: base + 5_000},
    },
  ];

  /** Ana entra (con a2 en local) y su nube le manda `changes`. El paso `hold`
   *  del adaptador se queda esperando: el lote esta EN VUELO hasta `release()`
   *  o `fail()`. */
  async function anaWithBatchInFlight(
    base: number,
    hold: Hold = {op: 'read', id: 'a2'},
    changes: Change[] = conflictBatch(base),
  ) {
    // Las dos cuentas ya hicieron su subida inicial en este telefono: asi lo
    // unico que puede llegar a la nube de Beto es lo que cruce desde el lote.
    await AsyncStorage.setItem('@sync_first_push_done:uid-ana', '2');
    await AsyncStorage.setItem('@sync_first_push_done:uid-beto', '2');
    let release!: () => void;
    let fail!: (err: Error) => void;
    const gate = new Promise<void>((resolve, reject) => {
      release = resolve;
      fail = reject;
    });
    const held: string[] = [];
    const wait = async (op: Hold['op'], id: string) => {
      if (op !== hold.op || id !== hold.id) return;
      held.push(`${op}:${id}`);
      await gate;
    };
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    const {adapter, localStore} = fixture;
    const realUpsert = adapter.applyRemoteUpsert;
    const realDelete = adapter.applyRemoteDelete;
    adapter.getLocal = async id => {
      await wait('read', id);
      return localStore.get(id) ?? null;
    };
    adapter.applyRemoteUpsert = async (id, data) => {
      await wait('apply', id);
      return realUpsert(id, data);
    };
    adapter.applyRemoteDelete = async id => {
      await wait('delete', id);
      return realDelete(id);
    };
    localStore.set('a2', {value: 'local-de-ana', updatedAt: base});

    const engine = new SyncEngine();
    engine.register(adapter);
    await engine.start('uid-ana');
    await settle();
    fireRemote(
      'uid-ana',
      changes.map(c => ({
        type: c.type,
        doc: {id: c.id, exists: true, data: () => c.data},
      })),
    );
    await settle();
    // Control del mecanismo: el lote tiene que estar EN VUELO, parado justo en
    // el paso retenido.
    expect(held).toEqual([`${hold.op}:${hold.id}`]);
    return {engine, release, fail, ...fixture};
  }

  /** `stop()` y Beto entra, pero su `start()` se queda parado en su primera
   *  lectura propia (el aviso de descartes): `this.uid` ya es Beto y su
   *  listener todavia no engancho, asi que su cursor aun no se cargo. */
  async function betoStartsAndPauses(engine: SyncEngine) {
    const betoRead = holdStorage('getItem', droppedStorageKey('uid-beto'));
    engine.stop();
    const started = engine.start('uid-beto');
    await settle();
    // Control: Beto esta a mitad de su `start()`, no antes ni despues.
    expect(betoRead.hits).toEqual([droppedStorageKey('uid-beto')]);
    expect(engine.getActiveUid()).toBe('uid-beto');
    expect(mockCollections.has('users/uid-beto/test')).toBe(false);
    return async () => {
      betoRead.release();
      await started;
      await settle();
    };
  }

  /** Lo que acabo en la nube de Beto, legible en la salida de un fallo. */
  function writtenInBeto(): string[] {
    return mockDocSets
      .filter(d => d.path.startsWith('users/uid-beto/'))
      .map(d => {
        const data = d.data as {
          value?: string;
          remoteVersion?: {value?: string};
        };
        const what = data.remoteVersion
          ? `remoteVersion ${data.remoteVersion.value}`
          : data.value;
        return `${d.path.slice('users/uid-beto/'.length)}/${d.id} = ${what}`;
      });
  }

  async function betoResolves(
    engine: SyncEngine,
    choice: ConflictChoice,
  ): Promise<void> {
    await engine.resolveConflict(
      'test__a2',
      choice,
      choice === 'merge' ? {value: 'combinado', updatedAt: 0} : undefined,
    );
    await settle();
    await engine.__flushForTests();
    await settle();
  }

  it('control (C0): sin cambio de cuenta el conflicto se registra y el cursor avanza como hoy, y al salir Ana se va con ella', async () => {
    // No discrimina contra R9-153, y es a proposito: es la fila de control de
    // la sonda. Su trabajo es impedir que el arreglo corte tambien el lote de
    // la sesion ACTUAL.
    const base = Date.now() - 60_000;
    const {engine, release} = await anaWithBatchInFlight(base);
    release();
    await settle();

    expect(engine.getState().conflicts.map(c => c.id)).toEqual(['test__a2']);
    // R9-65: el conflicto frena el cursor por debajo de a2, y a1 lo sube.
    expect(engine.__getCursorForTests('test')).toBe(base - 10_000);
    expect(
      await AsyncStorage.getItem(cursorStorageKey('test', 'uid-ana')),
    ).toBe(String(base - 10_000));
    expect(engine.getState().lastSyncedAt).not.toBeNull();
    expect(engine.getState().isSyncing).toBe(false);

    engine.stop();
    await engine.start('uid-beto');
    await settle();
    const conflictsOfBeto = engine.getState().conflicts.map(c => c.id);
    await betoResolves(engine, 'keepTheirs');
    expect({conflictsOfBeto, writtenInBeto: writtenInBeto()}).toEqual({
      conflictsOfBeto: [],
      writtenInBeto: [],
    });
  });

  it.each<[string, 'cerrada' | 'durante', ConflictChoice]>([
    [
      'V1: el lote termina con la sesion CERRADA y Beto entra despues (keepTheirs)',
      'cerrada',
      'keepTheirs',
    ],
    [
      'V2: el lote termina DURANTE start(beto) (keepMine)',
      'durante',
      'keepMine',
    ],
    ['V3: el lote termina con la sesion CERRADA (merge)', 'cerrada', 'merge'],
  ])(
    '%s: el conflicto de Ana no llega a Beto y resolver no escribe nada en users/uid-beto/',
    async (_name, moment, choice) => {
      const {engine, release} = await anaWithBatchInFlight(T0);
      if (moment === 'cerrada') {
        engine.stop();
        release();
        await settle();
        await engine.start('uid-beto');
        await settle();
      } else {
        const betoContinues = await betoStartsAndPauses(engine);
        release();
        await settle();
        await betoContinues();
      }
      expect(engine.getActiveUid()).toBe('uid-beto');

      // Pre-fix (sonda de la S23): Beto heredaba `test__a2`, y resolverlo
      // escribia en su nube `conflicts/test__a2` con la version remota de Ana
      // y, con keepMine o merge, tambien `test/a2`.
      const conflictsOfBeto = engine.getState().conflicts.map(c => c.id);
      const conflictsInEngine = engine.__getConflictsForTests().map(c => c.id);
      await betoResolves(engine, choice);
      expect({
        conflictsOfBeto,
        conflictsInEngine,
        writtenInBeto: writtenInBeto(),
      }).toEqual({
        conflictsOfBeto: [],
        conflictsInEngine: [],
        writtenInBeto: [],
      });
    },
  );

  /** El primer enganche de Beto, y un doc suyo de hace 1 hora que le manda su
   *  nube despues. */
  async function betoFirstAttach(remoteUpsertCalls: Array<{id: string}>) {
    const betoColl = mockCollections.get('users/uid-beto/test')!;
    const betoFloor = betoColl.__whereClauses.find(
      c => c.field === 'updatedAt',
    )?.value;
    const betoCursorOnEntry = await AsyncStorage.getItem(
      cursorStorageKey('test', 'uid-beto'),
    );
    const hourAgo = Date.now() - 60 * 60 * 1000;
    fireRemote('uid-beto', [
      {
        type: 'added',
        doc: {
          id: 'b-viejo',
          exists: true,
          data: () => ({value: 'de-beto', updatedAt: hourAgo}),
        },
      },
    ]);
    await settle();
    return {
      betoFloor,
      betoCursorOnEntry,
      anaCursor: await AsyncStorage.getItem(
        cursorStorageKey('test', 'uid-ana'),
      ),
      betoOldDocApplied: remoteUpsertCalls.some(c => c.id === 'b-viejo'),
    };
  }

  it('R9-122.4: el primer enganche de Beto no hereda el piso del lote de Ana, y un doc suyo de hace 1 hora baja', async () => {
    const base = Date.now() - 60_000;
    const {engine, release, remoteUpsertCalls} =
      await anaWithBatchInFlight(base);
    const betoContinues = await betoStartsAndPauses(engine);
    release();
    await settle();
    await betoContinues();

    // Pre-fix: el cursor de Ana (a1, `base - 10 s`) quedaba en el cache y bajo
    // la clave de Beto, su piso salia en `base - 10 s - 5 min` y b-viejo no
    // bajaba (`betoViejoAplicado:false` en la sonda de la S23). Y el de Ana no
    // se mueve: el lote cortado se le vuelve a entregar cuando regrese.
    expect(await betoFirstAttach(remoteUpsertCalls)).toEqual({
      betoFloor: 0,
      betoCursorOnEntry: null,
      anaCursor: null,
      betoOldDocApplied: true,
    });
  });

  it('R9-122.4: tampoco lo mueve un borrado que estaba en vuelo al final del lote', async () => {
    // El `removed` tiene su propio `await` y su propio `continue`. Si es el
    // ultimo doc del lote, nada mas lo corta antes de `advanceCursor`.
    // (R9-124 va a cambiar lo que hace esta rama; el corte tiene que seguir.)
    const base = Date.now() - 60_000;
    const {engine, release, remoteUpsertCalls} = await anaWithBatchInFlight(
      base,
      {op: 'delete', id: 'x'},
      [
        {
          type: 'added',
          id: 'a1',
          data: {value: 'uno-de-ana', updatedAt: base - 10_000},
        },
        {
          type: 'removed',
          id: 'x',
          data: {value: 'x-de-ana', updatedAt: base - 5_000},
        },
      ],
    );
    const betoContinues = await betoStartsAndPauses(engine);
    release();
    await settle();
    await betoContinues();

    expect(await betoFirstAttach(remoteUpsertCalls)).toEqual({
      betoFloor: 0,
      betoCursorOnEntry: null,
      anaCursor: null,
      betoOldDocApplied: true,
    });
  });

  // R9-162 — en las pruebas de arriba el stop() cae durante un getLocal: el
  // lote corta en la guarda de applyRemoteChange, o retiene el doc y corta
  // tras guardar el conjunto. Durante el APPLY de un doc, lo unico que corta
  // es la guarda que sigue a applyRemoteChange en handleSnapshot, y tras la
  // 24 ninguna prueba la vigilaba: el lote seguia en la sesion de Beto.
  it('R9-162: el stop() cae durante el APPLY del unico doc del lote: su updatedAt no cae en el cursor de Beto', async () => {
    const base = Date.now() - 60_000;
    const {engine, release, remoteUpsertCalls} = await anaWithBatchInFlight(
      base,
      {op: 'apply', id: 'a1'},
      [conflictBatch(base)[0]],
    );
    const betoContinues = await betoStartsAndPauses(engine);
    release();
    await settle();
    await betoContinues();

    // Sin la guarda: el cursor de Beto salia en el de a1 (`base - 10 s`), en
    // memoria y en disco, y b-viejo no bajaba (R9-122.4).
    expect(await betoFirstAttach(remoteUpsertCalls)).toEqual({
      betoFloor: 0,
      betoCursorOnEntry: null,
      anaCursor: null,
      betoOldDocApplied: true,
    });
  });

  it('R9-162: el stop() cae durante el APPLY de a1 y a2 viene detras: a2 no entra en el conjunto de Beto', async () => {
    const base = Date.now() - 60_000;
    const {engine, release, localStore} = await anaWithBatchInFlight(base, {
      op: 'apply',
      id: 'a1',
    });
    const betoContinues = await betoStartsAndPauses(engine);
    release();
    await settle();
    await betoContinues();

    // Beto recibe un conflicto suyo, y eso guarda SU conjunto.
    localStore.set('b1', {value: 'de-beto', updatedAt: base});
    fireRemote('uid-beto', [
      {
        type: 'modified',
        doc: {
          id: 'b1',
          exists: true,
          data: () => ({value: 'otro', updatedAt: base + 5_000}),
        },
      },
    ]);
    await settle();

    // Sin la guarda: la lectura de a2 cortaba (sesion vieja), el lote lo
    // retenia en el conjunto en memoria, que ya era el de Beto, y Beto lo
    // guardaba bajo su clave.
    expect(
      JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', 'uid-beto')))!,
      ),
    ).toEqual({b1: base + 5_000});
  });

  it('el lote viejo no le borra a Beto su error ni le marca un sincronizado que no hizo', async () => {
    // La carrera aqui es otra: el `stop()` cae mientras `advanceCursor` espera
    // a AsyncStorage, con el bucle ya terminado.
    const base = Date.now() - 60_000;
    const {engine, release} = await anaWithBatchInFlight(base);
    const cursorWrite = holdStorage(
      'setItem',
      cursorStorageKey('test', 'uid-ana'),
    );
    release();
    await settle();
    expect(cursorWrite.hits).toHaveLength(1);

    engine.stop();
    const lastSyncedAtOnStop = engine.getState().lastSyncedAt;
    await engine.start('uid-beto');
    await settle();
    fireRemoteError('uid-beto', new Error('permission-denied'));
    expect(engine.getState().lastError).toBe('permission-denied');

    cursorWrite.release();
    await settle();

    // Pre-fix `updateState({lastSyncedAt: Date.now(), lastError: null})`
    // corria en la sesion de Beto: le borraba un error real y Ajustes decia
    // «Sincronizado hace un momento» por un lote que no era suyo.
    expect({
      lastError: engine.getState().lastError,
      lastSyncedAt: engine.getState().lastSyncedAt,
    }).toEqual({
      lastError: 'permission-denied',
      lastSyncedAt: lastSyncedAtOnStop,
    });
  });

  it('un fallo del lote viejo no aparece como error en la sesion de Beto', async () => {
    const base = Date.now() - 60_000;
    const {engine, fail} = await anaWithBatchInFlight(base, {
      op: 'apply',
      id: 'a1',
    });
    engine.stop();
    await engine.start('uid-beto');
    await settle();
    expect(engine.getState().lastError).toBeNull();

    fail(new Error('disk I/O error'));
    await settle();

    expect(engine.getState().lastError).toBeNull();
  });

  it('el lote viejo, al terminar, no le apaga el isSyncing a un push de Beto en vuelo', async () => {
    const base = Date.now() - 60_000;
    const {engine, release} = await anaWithBatchInFlight(base);
    engine.stop();
    await engine.start('uid-beto');
    await settle();

    let releaseBeto!: () => void;
    const gateBeto = new Promise<void>(resolve => {
      releaseBeto = resolve;
    });
    const betoSets: string[] = [];
    mockSetGate = (_path, id) => {
      if (id !== 'doc-beto') return undefined;
      betoSets.push(id);
      return gateBeto;
    };
    engine.queueWrite('test', 'doc-beto', {value: 'de-beto', updatedAt: 2000});
    await settle();
    // Control: el push de Beto esta en vuelo y su sesion lo dice.
    expect(betoSets).toEqual(['doc-beto']);
    expect(engine.getState().isSyncing).toBe(true);

    release();
    await settle();
    // Pre-fix el `finally` del lote de Ana ponia `isSyncing: false` con el
    // push de Beto todavia en el aire.
    expect(engine.getState().isSyncing).toBe(true);

    releaseBeto();
    await settle();
    expect(engine.getState().isSyncing).toBe(false);
    expect(mockDocSets.map(d => [d.path, d.id])).toEqual([
      ['users/uid-beto/test', 'doc-beto'],
    ]);
  });

  it('R9-106: el conjunto de no asentados del lote de Ana va bajo la clave de Ana, y su cursor no cae en Beto', async () => {
    // El `stop()` cae mientras se GUARDA el conjunto (el await nuevo de
    // R9-106), con el bucle ya terminado: a2 quedo retenido y a1 aplicado.
    const base = Date.now() - 60_000;
    const {engine, release, remoteUpsertCalls} =
      await anaWithBatchInFlight(base);
    const saving = holdStorage(
      'setItem',
      unsettledStorageKey('test', 'uid-ana'),
    );
    release();
    await settle();
    // Control: el lote esta parado justo en esa escritura.
    expect(saving.hits).toHaveLength(1);

    const betoContinues = await betoStartsAndPauses(engine);
    saving.release();
    await settle();
    await betoContinues();

    // Pre-fix de la guarda: `advanceCursor` corria ya en la sesion de Beto y
    // dejaba el maximo de Ana (a1) en su cache y bajo su clave: su piso salia
    // en `base - 10 s - 5 min` y b-viejo no bajaba (R9-122.4 otra vez).
    expect({
      ...(await betoFirstAttach(remoteUpsertCalls)),
      conjuntoAna: JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', 'uid-ana')))!,
      ),
      conjuntoBeto: await AsyncStorage.getItem(
        unsettledStorageKey('test', 'uid-beto'),
      ),
    }).toEqual({
      betoFloor: 0,
      betoCursorOnEntry: null,
      anaCursor: null,
      betoOldDocApplied: true,
      conjuntoAna: {a2: base + 5_000},
      conjuntoBeto: null,
    });
  });

  it('R9-106: el guardado tardio del conjunto de Ana no le borra a Beto la marca de «no guardado»', async () => {
    // Beto tiene un conflicto cuyo conjunto NO llega a disco (disco lleno),
    // asi que su cursor persistido no puede pasarlo. El guardado de Ana, que
    // seguia en vuelo desde antes del stop(), vuelve bien en ese momento.
    const base = Date.now() - 60_000;
    const {engine, release, localStore} = await anaWithBatchInFlight(base);
    const anaSave = holdStorage(
      'setItem',
      unsettledStorageKey('test', 'uid-ana'),
    );
    release();
    await settle();
    // Control: el guardado de Ana esta en vuelo.
    expect(anaSave.hits).toHaveLength(1);
    engine.stop();

    const setItem = AsyncStorage.setItem as unknown as jest.Mock;
    const beforeFull = setItem.getMockImplementation()!;
    setItem.mockImplementation(async (k: string, ...rest: unknown[]) => {
      if (k === unsettledStorageKey('test', 'uid-beto')) {
        throw new Error('database or disk is full');
      }
      return beforeFull(k, ...rest);
    });
    restoreStorage.push(() => setItem.mockImplementation(beforeFull));

    await engine.start('uid-beto');
    await settle();
    const betoT = Date.now() - 120_000;
    localStore.set('b1', {value: 'de-beto', updatedAt: betoT});
    fireRemote('uid-beto', [
      {
        type: 'modified',
        doc: {
          id: 'b1',
          exists: true,
          data: () => ({value: 'otro', updatedAt: betoT + 5_000}),
        },
      },
    ]);
    await settle();
    // Control: Beto tiene su conflicto y su conjunto no esta en disco.
    expect(engine.getState().conflicts.map(c => c.id)).toEqual(['test__b1']);
    expect(
      await AsyncStorage.getItem(unsettledStorageKey('test', 'uid-beto')),
    ).toBeNull();

    anaSave.release();
    await settle();
    fireRemote('uid-beto', [
      {
        type: 'modified',
        doc: {
          id: 'b2',
          exists: true,
          data: () => ({value: 'otro', updatedAt: betoT + 600_000}),
        },
      },
    ]);
    await settle();

    // Sin la guarda, el exito de Ana borraba la marca de Beto: su cursor
    // pasaba b1, que no estaba en disco, y tras un reinicio se enterraba.
    expect(
      Number(await AsyncStorage.getItem(cursorStorageKey('test', 'uid-beto'))),
    ).toBeLessThan(betoT + 5_000);
  });

  it('R9-106: el conjunto de Ana que se estaba LEYENDO al salir no se queda en la sesion de Beto', async () => {
    // Ana tiene un doc retenido de hace 2 horas. Su enganche esta leyendo el
    // conjunto cuando sale, y la lectura vuelve con Beto a mitad de start().
    await AsyncStorage.setItem('@sync_first_push_done:uid-ana', '2');
    await AsyncStorage.setItem('@sync_first_push_done:uid-beto', '2');
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    await AsyncStorage.setItem(
      unsettledStorageKey('test', 'uid-ana'),
      JSON.stringify({'a-retenido': twoHoursAgo}),
    );
    const betoCursor = Date.now() - 60_000;
    await AsyncStorage.setItem(
      cursorStorageKey('test', 'uid-beto'),
      String(betoCursor),
    );
    const anaRead = holdStorage(
      'getItem',
      unsettledStorageKey('test', 'uid-ana'),
    );
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    const engine = new SyncEngine();
    engine.register(adapter);
    const anaStarted = engine.start('uid-ana');
    await settle();
    // Control: el enganche de Ana esta parado en esa lectura.
    expect(anaRead.hits).toHaveLength(1);

    const betoContinues = await betoStartsAndPauses(engine);
    anaRead.release();
    await settle();
    await anaStarted;
    await betoContinues();

    // Beto recibe un conflicto suyo, y eso guarda SU conjunto.
    localStore.set('b1', {value: 'de-beto', updatedAt: betoCursor + 10_000});
    fireRemote('uid-beto', [
      {
        type: 'modified',
        doc: {
          id: 'b1',
          exists: true,
          data: () => ({value: 'otro', updatedAt: betoCursor + 15_000}),
        },
      },
    ]);
    await settle();

    // Pre-fix de la guarda: el conjunto de Ana quedaba en la cache de la
    // sesion de Beto, le bajaba el piso 2 horas y se guardaba bajo SU clave.
    expect({
      betoFloor: mockCollections
        .get('users/uid-beto/test')!
        .__whereClauses.find(c => c.field === 'updatedAt')?.value,
      conjuntoBeto: JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', 'uid-beto')))!,
      ),
    }).toEqual({
      betoFloor: betoCursor - CURSOR_SAFETY_MARGIN_MS,
      conjuntoBeto: {b1: betoCursor + 15_000},
    });
  });
});

describe('R9-154 — la supresion de ecos en keepTheirs, en merge y su profundidad', () => {
  // `withLocalWriteSuppressed` envuelve cinco sitios, y revertidos uno por uno
  // la suite seguia en verde en tres (keepTheirs, merge y el `removed`), igual
  // que sin el conteo de profundidad: nada los vigilaba. Ningun adaptador de
  // hoy encola dentro de un apply, asi que estas pruebas son defensivas, como
  // la del ECO de R9-103: un adaptador que al escribir en local disparara su
  // propio queueWrite no puede rebotar a la nube lo que el motor aplica.
  // El sitio del `removed` queda fuera a proposito: lo va a cambiar R9-124.
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  /** Un adaptador cuyo apply ENCOLA lo que escribe (el eco), con un conflicto
   *  de verdad ya registrado para `doc-e`. */
  async function engineWithEchoingConflict(uid: string) {
    // Sin subida inicial: lo unico que puede subir `doc-e` es un eco o la
    // resolucion.
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    const engine = new SyncEngine();
    const echoes: string[] = [];
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    const realUpsert = fixture.adapter.applyRemoteUpsert;
    fixture.adapter.applyRemoteUpsert = async (id, data) => {
      await Promise.resolve();
      await realUpsert(id, data);
      echoes.push(id);
      engine.queueWrite('test', id, data);
    };
    fixture.localStore.set('doc-e', {value: 'local', updatedAt: 1000});
    engine.register(fixture.adapter);
    await engine.start(uid);
    await settle();
    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'doc-e',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 1005}),
        },
      },
    ]);
    await settle();
    expect(engine.__getConflictsForTests().map(c => c.id)).toEqual([
      'test__doc-e',
    ]);
    return {engine, echoes, ...fixture};
  }

  function pushedTo(uid: string): Array<[string, string]> {
    return mockDocSets
      .filter(d => d.path === `users/${uid}/test`)
      .map(d => [d.id, (d.data as {value: string}).value]);
  }

  it('keepTheirs aplica la copia remota en local sin rebotarla a la nube', async () => {
    const {engine, echoes, localStore} =
      await engineWithEchoingConflict('uid-kt');
    await engine.resolveConflict('test__doc-e', 'keepTheirs');
    await settle();
    await engine.__flushForTests();
    await settle();

    // Control: el eco corrio de verdad. Sin el, no habria nada que suprimir y
    // la asercion de abajo pasaria sin haber mirado nada.
    expect(echoes).toEqual(['doc-e']);
    expect(localStore.get('doc-e')?.value).toBe('remote');
    // Sin la supresion, el eco subia a la nube la copia que ya estaba en ella.
    expect(pushedTo('uid-kt')).toEqual([]);
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });

  it('merge sube el valor combinado UNA vez: el eco de su apply no sale por su cuenta', async () => {
    const {engine, echoes, localStore} =
      await engineWithEchoingConflict('uid-mg');
    await engine.resolveConflict('test__doc-e', 'merge', {
      value: 'combinado',
      updatedAt: 0,
    });
    await settle();
    await engine.__flushForTests();
    await settle();

    expect(echoes).toEqual(['doc-e']);
    expect(localStore.get('doc-e')?.value).toBe('combinado');
    // Sin la supresion, el eco encolaba y arrancaba un flush antes que el
    // queueWrite del propio merge: dos subidas del mismo doc.
    expect(pushedTo('uid-mg')).toEqual([['doc-e', 'combinado']]);
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });

  it('dos applies solapados del MISMO doc: al terminar el primero, el eco del segundo sigue suprimido', async () => {
    await AsyncStorage.setItem('@sync_first_push_done:uid-prof', '2');
    const engine = new SyncEngine();
    const gates: Array<() => void> = [];
    const echoes: string[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const {adapter} = makeAdapter({
      async applyRemoteUpsert(id, data) {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise<void>(resolve => gates.push(resolve));
        echoes.push(`${id}@${data.updatedAt}`);
        engine.queueWrite('test', id, data);
        inFlight -= 1;
      },
    });
    engine.register(adapter);
    await engine.start('uid-prof');
    await settle();

    // Dos lotes del mismo doc. Este apply no escribe en local, asi que los dos
    // pasan la comparacion LWW y los dos llegan a aplicar.
    fireRemote('uid-prof', [
      {
        type: 'added',
        doc: {
          id: 'doc-p',
          exists: true,
          data: () => ({value: 'v1', updatedAt: 2000}),
        },
      },
    ]);
    fireRemote('uid-prof', [
      {
        type: 'modified',
        doc: {
          id: 'doc-p',
          exists: true,
          data: () => ({value: 'v2', updatedAt: 3000}),
        },
      },
    ]);
    await settle();
    // Control: los dos applies estan EN VUELO a la vez; si no se solaparan, la
    // profundidad no tendria nada que contar.
    expect(maxInFlight).toBe(2);

    gates[0]();
    await settle();
    gates[1]();
    await settle();

    // Sin el conteo, el primer apply que termina quita la supresion del doc y
    // el eco del segundo sale a la nube.
    expect(echoes).toEqual(['doc-p@2000', 'doc-p@3000']);
    expect(pushedTo('uid-prof')).toEqual([]);
    expect(engine.__getQueueForTests()).toHaveLength(0);
  });
});

describe('R9-36 — conservar lo mio sube lo local de AHORA, no la foto de la deteccion', () => {
  // `conflict.localVersion` es una foto tomada al detectar el conflicto, y los
  // conflictos esperan a que el usuario entre a la pantalla. keepMine la subia
  // re-sellada con `now` confiando en «local store already has this value».
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  const ORIGINAL = 'parrafo original';
  const EDITADO = 'parrafo original + PARRAFO NUEVO QUE ACABO DE ESCRIBIR';

  /** Un conflicto de verdad sobre `doc-36`: la copia local es ORIGINAL y la
   *  remota llega 5 s despues con otro valor. Todo ocurrio hace 2 minutos. */
  async function conflictFromTwoMinutesAgo(uid: string) {
    // Sin subida inicial: lo unico que sube `doc-36` es lo que la prueba hace.
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    const detectedAt = Date.now() - 120_000;
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    fixture.localStore.set('doc-36', {value: ORIGINAL, updatedAt: detectedAt});
    const engine = new SyncEngine();
    engine.register(fixture.adapter);
    await engine.start(uid);
    await settle();
    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'doc-36',
          exists: true,
          data: () => ({
            value: 'parrafo remoto',
            updatedAt: detectedAt + 5_000,
          }),
        },
      },
    ]);
    await settle();
    // Control: sin conflicto no hay foto, y la prueba no miraria nada.
    const [conflict] = engine.__getConflictsForTests();
    expect(conflict?.localVersion.value).toBe(ORIGINAL);
    return {engine, conflict, detectedAt, ...fixture};
  }

  function pushesOf(uid: string, id: string): Array<Record<string, unknown>> {
    return mockDocSets
      .filter(d => d.path === `users/${uid}/test` && d.id === id)
      .map(d => d.data as Record<string, unknown>);
  }

  it('el usuario sigue escribiendo despues de la deteccion: se sube lo de AHORA y el eco no lo revierte', async () => {
    const uid = 'uid-36';
    const {engine, conflict, detectedAt, localStore} =
      await conflictFromTwoMinutesAgo(uid);

    // Hace 1 minuto (fuera de la ventana de 30 s) el usuario siguio escribiendo
    // en la misma nota. El contexto guarda en local y encola, como siempre.
    const edit = {value: EDITADO, updatedAt: detectedAt + 60_000};
    localStore.set('doc-36', edit);
    engine.queueWrite('test', 'doc-36', edit);
    await settle();

    await engine.resolveConflict(conflict.id, 'keepMine');
    await settle();
    await engine.__flushForTests();
    await settle();

    const pushed = pushesOf(uid, 'doc-36');
    const keepMinePush = pushed[pushed.length - 1];
    // Pre-fix (sonda de la S4): se subia `{"value":"parrafo original", ...}`.
    expect(keepMinePush?.value).toBe(EDITADO);

    // Y lo que pasa despues: el eco del push vuelve por onSnapshot. Esta mas de
    // 30 s por delante de la edicion, asi que no hay conflicto nuevo: LWW lo
    // aplica en local. Con la foto, «conservar lo mio» borraba justo lo mio.
    fireRemote(uid, [
      {
        type: 'modified',
        doc: {id: 'doc-36', exists: true, data: () => keepMinePush},
      },
    ]);
    await settle();
    expect(localStore.get('doc-36')?.value).toBe(EDITADO);
    expect(engine.__getConflictsForTests()).toEqual([]);
  });

  it('si el doc ya no existe en local, no sube nada y el conflicto sigue pendiente', async () => {
    const uid = 'uid-36-borrado';
    const {engine, conflict, localStore} = await conflictFromTwoMinutesAgo(uid);
    localStore.delete('doc-36');

    await expect(
      engine.resolveConflict(conflict.id, 'keepMine'),
    ).rejects.toThrow('keepMine found no local copy');
    await settle();
    await engine.__flushForTests();
    await settle();

    // Sin la guarda, `{...null, updatedAt}` subia un doc sin campos que, con
    // merge:true, le ponia fecha nueva a la copia remota y cerraba el conflicto.
    expect(pushesOf(uid, 'doc-36')).toEqual([]);
    expect(engine.__getConflictsForTests().map(c => c.id)).toEqual([
      conflict.id,
    ]);
  });

  it('si la lectura local falla, no sube la foto: rechaza y el conflicto sigue pendiente', async () => {
    const uid = 'uid-36-falla';
    const {engine, conflict, adapter} = await conflictFromTwoMinutesAgo(uid);
    adapter.getLocal = async () => {
      throw new Error('database is locked');
    };

    await expect(
      engine.resolveConflict(conflict.id, 'keepMine'),
    ).rejects.toThrow('database is locked');
    await settle();
    await engine.__flushForTests();
    await settle();

    expect(pushesOf(uid, 'doc-36')).toEqual([]);
    expect(engine.__getConflictsForTests().map(c => c.id)).toEqual([
      conflict.id,
    ]);
  });

  it('R9-153: si la sesion cambia durante la relectura, nada cae en la nube de Beto', async () => {
    const {engine, conflict, adapter, localStore} =
      await conflictFromTwoMinutesAgo('uid-ana');
    await AsyncStorage.setItem('@sync_first_push_done:uid-beto', '2');
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const reads: string[] = [];
    adapter.getLocal = async id => {
      reads.push(id);
      await gate;
      return localStore.get(id) ?? null;
    };

    const resolving = engine.resolveConflict(conflict.id, 'keepMine');
    resolving.catch(() => undefined);
    await settle();
    // Control: la relectura esta EN VUELO cuando cambia la cuenta.
    expect(reads).toEqual(['doc-36']);
    engine.stop();
    await engine.start('uid-beto');
    await settle();
    release();

    await expect(resolving).rejects.toThrow('the session ended');
    await settle();
    await engine.__flushForTests();
    await settle();
    expect(
      mockDocSets
        .filter(d => d.path.startsWith('users/uid-beto/'))
        .map(d => `${d.path}/${d.id}`),
    ).toEqual([]);
    expect(engine.__getQueueForTests()).toEqual([]);
  });
});

describe('R9-39 / R9-106 — un doc sin asentar no lo entierra el cursor de OTRO doc', () => {
  // R9-65 y R9-46 frenaban el cursor por debajo del doc en conflicto o no
  // aplicado, pero solo dentro de SU lote: el cursor es uno por coleccion y
  // solo avanza, asi que cualquier lote posterior (el eco de una edicion
  // propia, por ejemplo) o un keepMine de otro conflicto lo pasaban por
  // encima. Despues, `stop()` vaciaba los conflictos confiando en que el
  // siguiente enganche los volveria a detectar, y el piso ya no llegaba.
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  type Doc = {id: string; data: Record<string, unknown>};

  function fire(uid: string, docs: Doc[]): void {
    fireRemote(
      uid,
      docs.map(d => ({
        type: 'modified',
        doc: {id: d.id, exists: true, data: () => d.data},
      })),
    );
  }

  function floorOf(uid: string): unknown {
    return mockCollections
      .get(`users/${uid}/test`)!
      .__whereClauses.find(c => c.field === 'updatedAt')?.value;
  }

  /** Cierra la app y la vuelve a abrir con la misma cuenta. */
  async function restart(engine: SyncEngine, uid: string): Promise<void> {
    engine.stop();
    await engine.start(uid);
    await settle();
  }

  async function engineFor(uid: string, material = true) {
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    const fixture = makeAdapter(
      material ? {getMaterialFields: () => ['value']} : {},
    );
    const engine = new SyncEngine();
    engine.register(fixture.adapter);
    await engine.start(uid);
    await settle();
    return {engine, ...fixture};
  }

  const HOUR = 60 * 60 * 1000;

  it('R9-106: un conflicto, un lote posterior con otro doc 10 min mas nuevo, y un reinicio: el conflicto vuelve', async () => {
    const uid = 'uid-106';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid);
    localStore.set('doc-c', {value: 'lo mio', updatedAt: T});
    const suyo = {id: 'doc-c', data: {value: 'lo suyo', updatedAt: T + 5_000}};

    fire(uid, [suyo]);
    await settle();
    const conflictosAntes = engine.__getConflictsForTests().length;
    // Otro lote, otro doc: el eco de una edicion propia 10 min despues.
    const eco = {id: 'doc-eco', data: {value: 'mio', updatedAt: T + 595_000}};
    localStore.set('doc-eco', eco.data as SyncEntity<TestEntity>);
    fire(uid, [eco]);
    await settle();
    const cursorTrasEco = engine.__getCursorForTests('test');

    await restart(engine, uid);
    // Lo que Firestore le entrega al enganche nuevo: solo lo que pasa el piso.
    fire(uid, [suyo, eco]);
    await settle();

    // Pre-fix (cifras de la entrada R9-106): cursor T+595000, piso tras
    // reiniciar T+295000, y el conflicto no volvia (conflictosTrasReinicio 0):
    // lo local se quedaba con «lo mio» y el cambio remoto se perdia.
    expect({
      conflictosAntes,
      cursorTrasEco: cursorTrasEco! - T,
      pisoTrasReinicio: (floorOf(uid) as number) - T,
      conflictosTrasReinicio: engine.__getConflictsForTests().map(c => c.docId),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      conflictosAntes: 1,
      cursorTrasEco: 595_000,
      // El conflicto (T+5000) queda por encima del piso: 1 ms por debajo de
      // el, menos el margen de 5 min, igual que el cursor.
      pisoTrasReinicio: 5_000 - 1 - CURSOR_SAFETY_MARGIN_MS,
      conflictosTrasReinicio: ['doc-c'],
      local: 'lo mio',
    });
  });

  it('R9-106: resolver un conflicto con keepMine no entierra otro pendiente de la misma coleccion', async () => {
    const uid = 'uid-106-dos';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid);
    localStore.set('doc-a', {value: 'mio a', updatedAt: T});
    localStore.set('doc-b', {value: 'mio b', updatedAt: T + 60_000});
    const suyoA = {id: 'doc-a', data: {value: 'suyo a', updatedAt: T + 5_000}};
    const suyoB = {
      id: 'doc-b',
      data: {value: 'suyo b', updatedAt: T + 65_000},
    };
    fire(uid, [suyoA]);
    await settle();
    fire(uid, [suyoB]);
    await settle();
    // Control: dos conflictos pendientes.
    expect(engine.__getConflictsForTests().map(c => c.docId)).toEqual([
      'doc-a',
      'doc-b',
    ]);

    await engine.resolveConflict('test__doc-a', 'keepMine');
    await settle();
    await engine.__flushForTests();
    await settle();
    // keepMine avanza el cursor a «ahora» (su updatedAt re-sellado).
    const cursorTrasResolver = engine.__getCursorForTests('test')!;
    expect(cursorTrasResolver).toBeGreaterThan(T + HOUR - 60_000);

    await restart(engine, uid);
    const pushedA = mockDocSets.filter(d => d.id === 'doc-a').at(-1)!;
    fire(uid, [
      {id: 'doc-a', data: pushedA.data as Record<string, unknown>},
      suyoB,
    ]);
    await settle();

    // Pre-fix: piso = ahora - 5 min, doc-b (de hace 1 hora) no volvia.
    expect(engine.__getConflictsForTests().map(c => c.docId)).toEqual([
      'doc-b',
    ]);
    expect(localStore.get('doc-b')?.value).toBe('mio b');
  });

  it('R9-46 + R9-106: un doc saltado (la lectura local fallo) tampoco lo entierra un lote posterior', async () => {
    const uid = 'uid-106-saltado';
    const T = Date.now() - HOUR;
    let dbReady = false;
    const {engine, adapter, localStore} = await engineFor(uid, false);
    // La BD aun no esta lista: la lectura de doc-viejo falla. (Se cambia el
    // metodo del adaptador YA enganchado: un segundo `register()` no cambia
    // el adaptador que usa el listener.)
    adapter.getLocal = async id => {
      if (id === 'doc-viejo' && !dbReady) throw new Error('database is locked');
      return localStore.get(id) ?? null;
    };
    const viejo = {id: 'doc-viejo', data: {value: 'remoto', updatedAt: T}};
    fire(uid, [viejo]);
    await settle();
    // Control: el doc se salto de verdad.
    expect(localStore.has('doc-viejo')).toBe(false);
    fire(uid, [
      {id: 'doc-nuevo', data: {value: 'otro', updatedAt: T + 600_000}},
    ]);
    await settle();

    dbReady = true;
    await restart(engine, uid);
    fire(uid, [viejo]);
    await settle();

    // Pre-fix: el lote de doc-nuevo llevaba el cursor a T+600000, el piso a
    // T+300000, y doc-viejo no volvia a llegar nunca.
    expect(localStore.get('doc-viejo')?.value).toBe('remoto');
  });

  it('control: sin nada sin asentar, el cursor avanza igual que hoy y no se guarda ningun conjunto', async () => {
    // No discrimina contra R9-39, a proposito: impide que el arreglo retenga
    // el piso sin motivo, que es pura cuota.
    const uid = 'uid-106-control';
    const T = Date.now() - HOUR;
    const {engine} = await engineFor(uid);
    fire(uid, [
      {id: 'd1', data: {value: 'a', updatedAt: T + 1_000}},
      {id: 'd2', data: {value: 'b', updatedAt: T + 2_000}},
    ]);
    await settle();
    fire(uid, [{id: 'd3', data: {value: 'c', updatedAt: T + 9_000}}]);
    await settle();

    await restart(engine, uid);
    expect({
      cursor: await AsyncStorage.getItem(cursorStorageKey('test', uid)),
      conjunto: await AsyncStorage.getItem(unsettledStorageKey('test', uid)),
      piso: floorOf(uid),
    }).toEqual({
      cursor: String(T + 9_000),
      conjunto: null,
      piso: T + 9_000 - CURSOR_SAFETY_MARGIN_MS,
    });
  });

  it('el piso se libera al resolver: tras el reinicio vuelve a cursor - 5 min', async () => {
    const uid = 'uid-106-libera';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid);
    localStore.set('doc-c', {value: 'lo mio', updatedAt: T});
    fire(uid, [{id: 'doc-c', data: {value: 'lo suyo', updatedAt: T + 5_000}}]);
    await settle();
    fire(uid, [{id: 'doc-eco', data: {value: 'x', updatedAt: T + 600_000}}]);
    await settle();
    // Control: mientras esta pendiente, el conjunto guardado lo retiene.
    expect(
      JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', uid)))!,
      ),
    ).toEqual({'doc-c': T + 5_000});

    await engine.resolveConflict('test__doc-c', 'keepTheirs');
    await settle();
    await restart(engine, uid);

    // Sin liberarlo, el piso se quedaba en el conflicto ya resuelto para
    // siempre: cada arranque releia la coleccion desde ahi.
    expect({
      conjunto: await AsyncStorage.getItem(unsettledStorageKey('test', uid)),
      piso: floorOf(uid),
    }).toEqual({
      conjunto: null,
      piso: T + 600_000 - CURSOR_SAFETY_MARGIN_MS,
    });
  });

  it('el piso se libera cuando un doc saltado por fin se aplica', async () => {
    const uid = 'uid-106-libera-saltado';
    const T = Date.now() - HOUR;
    let dbReady = false;
    const {engine, adapter, localStore} = await engineFor(uid, false);
    adapter.getLocal = async id => {
      if (!dbReady) throw new Error('database is locked');
      return localStore.get(id) ?? null;
    };
    const viejo = {id: 'doc-viejo', data: {value: 'remoto', updatedAt: T}};
    fire(uid, [viejo]);
    await settle();
    // Control: el doc se salto y quedo retenido.
    expect(localStore.has('doc-viejo')).toBe(false);
    expect(
      JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', uid)))!,
      ),
    ).toEqual({'doc-viejo': T});
    dbReady = true;
    fire(uid, [
      {id: 'doc-nuevo', data: {value: 'otro', updatedAt: T + 600_000}},
    ]);
    await settle();

    await restart(engine, uid);
    fire(uid, [viejo]);
    await settle();
    // Control: esta vez si se aplico.
    expect(localStore.get('doc-viejo')?.value).toBe('remoto');

    await restart(engine, uid);
    expect({
      conjunto: await AsyncStorage.getItem(unsettledStorageKey('test', uid)),
      piso: floorOf(uid),
    }).toEqual({
      conjunto: null,
      piso: T + 600_000 - CURSOR_SAFETY_MARGIN_MS,
    });
  });

  it('el piso se libera si un doc retenido desaparece de la nube (removed)', async () => {
    const uid = 'uid-106-removed';
    const T = Date.now() - HOUR;
    const {engine, adapter} = await engineFor(uid, false);
    adapter.getLocal = async id => {
      if (id === 'doc-viejo') throw new Error('database is locked');
      return null;
    };
    fire(uid, [{id: 'doc-viejo', data: {value: 'remoto', updatedAt: T}}]);
    await settle();
    fire(uid, [
      {id: 'doc-nuevo', data: {value: 'otro', updatedAt: T + 600_000}},
    ]);
    await settle();
    // Control: retenido.
    expect(
      JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', uid)))!,
      ),
    ).toEqual({'doc-viejo': T});

    fireRemote(uid, [
      {
        type: 'removed',
        // Como en Firestore, el `removed` trae la ultima version del doc.
        doc: {
          id: 'doc-viejo',
          exists: false,
          data: () => ({value: 'remoto', updatedAt: T}),
        },
      },
    ]);
    await settle();
    // Un doc que ya no existe nunca se va a volver a entregar para asentarse:
    // retenerlo dejaba el piso abajo para siempre.
    await restart(engine, uid);
    expect(floorOf(uid)).toBe(T + 600_000 - CURSOR_SAFETY_MARGIN_MS);
  });

  it('si el conjunto no llega a disco, el cursor mismo no pasa el doc retenido; y en cuanto llega, avanza', async () => {
    const uid = 'uid-106-disco';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid);
    localStore.set('doc-c', {value: 'lo mio', updatedAt: T});
    const setItem = AsyncStorage.setItem as unknown as jest.Mock;
    const realSetItem = setItem.getMockImplementation()!;
    let diskFull = true;
    setItem.mockImplementation(async (k: string, v: string) => {
      if (diskFull && k === unsettledStorageKey('test', uid)) {
        throw new Error('database or disk is full');
      }
      return realSetItem(k, v);
    });
    try {
      fire(uid, [
        {id: 'doc-c', data: {value: 'lo suyo', updatedAt: T + 5_000}},
        {id: 'doc-eco', data: {value: 'x', updatedAt: T + 600_000}},
      ]);
      await settle();
      // Control: el conflicto existe, y lo que se retiene es el.
      expect(engine.__getConflictsForTests().map(c => c.docId)).toEqual([
        'doc-c',
      ]);
      // El conjunto no se guardo: el cursor persistido es lo unico que habra
      // tras un reinicio, y no puede pasar el conflicto.
      const cursorSinConjunto = Number(
        await AsyncStorage.getItem(cursorStorageKey('test', uid)),
      );
      expect(cursorSinConjunto).toBeLessThan(T + 5_000);

      diskFull = false;
      fire(uid, [{id: 'doc-otro', data: {value: 'y', updatedAt: T + 700_000}}]);
      await settle();
      expect({
        conjunto: JSON.parse(
          (await AsyncStorage.getItem(unsettledStorageKey('test', uid)))!,
        ),
        cursor: await AsyncStorage.getItem(cursorStorageKey('test', uid)),
      }).toEqual({
        conjunto: {'doc-c': T + 5_000},
        cursor: String(T + 700_000),
      });
    } finally {
      setItem.mockImplementation(realSetItem);
    }
  });

  it('un conjunto ilegible en disco: el enganche relee la coleccion desde 0, como un cursor ilegible', async () => {
    const uid = 'uid-106-ilegible';
    const T = Date.now() - HOUR;
    await AsyncStorage.setItem(cursorStorageKey('test', uid), String(T));
    await AsyncStorage.setItem(unsettledStorageKey('test', uid), '{no es json');
    await engineFor(uid);
    // No se sabe que docs retenia: menos que todo podria dejar uno enterrado.
    expect(floorOf(uid)).toBe(0);
  });

  it('al salir Ana, su conjunto en memoria se va con ella: no le baja el piso a Beto', async () => {
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor('uid-ana');
    await AsyncStorage.setItem('@sync_first_push_done:uid-beto', '2');
    const betoCursor = Date.now() - 60_000;
    await AsyncStorage.setItem(
      cursorStorageKey('test', 'uid-beto'),
      String(betoCursor),
    );
    localStore.set('doc-c', {value: 'lo mio', updatedAt: T});
    fire('uid-ana', [
      {id: 'doc-c', data: {value: 'lo suyo', updatedAt: T + 5_000}},
    ]);
    await settle();
    // Control: Ana lo retiene.
    expect(
      JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', 'uid-ana')))!,
      ),
    ).toEqual({'doc-c': T + 5_000});

    engine.stop();
    await engine.start('uid-beto');
    await settle();
    // Beto recibe un conflicto suyo, y eso guarda SU conjunto.
    localStore.set('b1', {value: 'de-beto', updatedAt: betoCursor + 10_000});
    fire('uid-beto', [
      {id: 'b1', data: {value: 'otro', updatedAt: betoCursor + 15_000}},
    ]);
    await settle();

    // Sin limpiarlo en stop(), el enganche de Beto encontraba el de Ana en la
    // cache: su piso bajaba a la hora del conflicto de Ana y doc-c se
    // guardaba bajo la clave de Beto.
    expect({
      betoFloor: floorOf('uid-beto'),
      conjuntoBeto: JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', 'uid-beto')))!,
      ),
    }).toEqual({
      betoFloor: betoCursor - CURSOR_SAFETY_MARGIN_MS,
      conjuntoBeto: {b1: betoCursor + 15_000},
    });
  });

  it.each<['keepTheirs' | 'merge']>([['keepTheirs'], ['merge']])(
    'R9-153: %s con el apply local en vuelo al cambiar de cuenta no escribe nada en la sesion de Beto',
    async choice => {
      const T = Date.now() - HOUR;
      const {engine, localStore, adapter} = await engineFor('uid-ana');
      await AsyncStorage.setItem('@sync_first_push_done:uid-beto', '2');
      localStore.set('doc-c', {value: 'lo mio', updatedAt: T});
      fire('uid-ana', [
        {id: 'doc-c', data: {value: 'lo suyo', updatedAt: T + 5_000}},
      ]);
      await settle();
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      const applies: string[] = [];
      adapter.applyRemoteUpsert = async (id, data) => {
        applies.push(id);
        await gate;
        localStore.set(id, data);
      };

      const resolving = engine.resolveConflict(
        'test__doc-c',
        choice,
        choice === 'merge' ? {value: 'combinado', updatedAt: 0} : undefined,
      );
      resolving.catch(() => undefined);
      await settle();
      // Control: el apply esta EN VUELO cuando cambia la cuenta.
      expect(applies).toEqual(['doc-c']);
      engine.stop();
      await engine.start('uid-beto');
      await settle();
      release();
      await expect(resolving).rejects.toThrow('the session ended');
      await settle();
      await engine.__flushForTests();
      await settle();

      // Pre-fix: la auditoria de Ana caia en users/uid-beto/conflicts, su
      // updatedAt en el cursor de Beto y, con merge, el valor combinado en
      // users/uid-beto/test.
      expect({
        enBeto: mockDocSets
          .filter(d => d.path.startsWith('users/uid-beto/'))
          .map(d => `${d.path}/${d.id}`),
        cursorBeto: await AsyncStorage.getItem(
          cursorStorageKey('test', 'uid-beto'),
        ),
        // Y a Ana se le sigue reteniendo: el conflicto le vuelve al regresar.
        conjuntoAna: JSON.parse(
          (await AsyncStorage.getItem(unsettledStorageKey('test', 'uid-ana')))!,
        ),
      }).toEqual({
        enBeto: [],
        cursorBeto: null,
        conjuntoAna: {'doc-c': T + 5_000},
      });
    },
  );
});

describe('R9-160 — con un conflicto pendiente, lo que escribe despues el otro telefono refresca «su version» y no pisa «lo mio»', () => {
  // `applyRemoteChange` no miraba si el doc tenia un conflicto pendiente. Un
  // cambio posterior del otro telefono (R2, fuera de la ventana de 30 s y mas
  // nuevo que lo local) entraba por LWW: L desaparecia de SQLite, y desde
  // 6440ca0 (R9-36) la pantalla mostraba R2 como «Tu version» y keepMine subia
  // R2. L solo quedaba en la auditoria, que no se ve.
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  const HOUR = 60 * 60 * 1000;
  const L = 'L: mi parrafo';
  const R = 'R: su parrafo';
  const R2 = 'R2: su parrafo, dos minutos despues';

  type Doc = {id: string; data: Record<string, unknown>};

  function fire(uid: string, docs: Doc[]): void {
    fireRemote(
      uid,
      docs.map(d => ({
        type: 'modified',
        doc: {id: d.id, exists: true, data: () => d.data},
      })),
    );
  }

  /** Cierra la app y la vuelve a abrir con la misma cuenta. */
  async function restart(engine: SyncEngine, uid: string): Promise<void> {
    engine.stop();
    await engine.start(uid);
    await settle();
  }

  function pushesOf(uid: string, id: string): Array<Record<string, unknown>> {
    return mockDocSets
      .filter(d => d.path === `users/${uid}/test` && d.id === id)
      .map(d => d.data as Record<string, unknown>);
  }

  /** Un conflicto de verdad de hace una hora: L local en T, y R, del otro
   *  telefono, 10 s despues y con otro valor. */
  async function pendingConflict(uid: string) {
    // Sin subida inicial: lo unico que sube `doc-c` es lo que la prueba hace.
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    const T = Date.now() - HOUR;
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    fixture.localStore.set('doc-c', {value: L, updatedAt: T});
    const engine = new SyncEngine();
    engine.register(fixture.adapter);
    await engine.start(uid);
    await settle();
    fire(uid, [{id: 'doc-c', data: {value: R, updatedAt: T + 10_000}}]);
    await settle();
    // Control: el conflicto L/R existe, y nada se aplico en local.
    expect(
      engine.__getConflictsForTests().map(c => c.remoteVersion.value),
    ).toEqual([R]);
    expect(fixture.localStore.get('doc-c')?.value).toBe(L);
    return {engine, T, ...fixture};
  }

  function theirs(engine: SyncEngine) {
    return engine.__getConflictsForTests().map(c => ({
      value: c.remoteVersion.value,
      deleted: c.remoteVersion.deleted === true,
    }));
  }

  it('C: R2 llega dos minutos despues: lo local sigue en L, el conflicto trae R2, y keepMine sube L', async () => {
    const uid = 'uid-160-c';
    const {engine, T, localStore} = await pendingConflict(uid);

    fire(uid, [{id: 'doc-c', data: {value: R2, updatedAt: T + 120_000}}]);
    await settle();
    const [conflict] = engine.__getConflictsForTests();
    const afterR2 = {
      local: localStore.get('doc-c')?.value,
      theirs: conflict?.remoteVersion.value,
      differing: conflict?.differingFields,
      readCurrentLocal: (await engine.readCurrentLocal('test__doc-c'))?.value,
    };

    await engine.resolveConflict('test__doc-c', 'keepMine');
    await settle();
    await engine.__flushForTests();
    await settle();

    // Pre-fix (sonda de la S25): local R2, «Tu version» R2, keepMine subia R2.
    expect({
      ...afterR2,
      pushed: pushesOf(uid, 'doc-c').map(p => p.value),
    }).toEqual({
      local: L,
      theirs: R2,
      differing: ['value'],
      readCurrentLocal: L,
      pushed: [L],
    });
  });

  it('C: keepTheirs aplica R2, la version del otro de AHORA, no la foto R', async () => {
    const uid = 'uid-160-c-suyo';
    const {engine, T, localStore} = await pendingConflict(uid);
    fire(uid, [{id: 'doc-c', data: {value: R2, updatedAt: T + 120_000}}]);
    await settle();

    await engine.resolveConflict('test__doc-c', 'keepTheirs');
    await settle();
    await engine.__flushForTests();
    await settle();

    expect({
      local: localStore.get('doc-c')?.value,
      // La nube ya tiene R2: no hay nada que subir.
      pushed: pushesOf(uid, 'doc-c'),
      conflicts: engine.__getConflictsForTests(),
    }).toEqual({local: R2, pushed: [], conflicts: []});
  });

  it('el eco de una edicion propia durante el conflicto no pasa a ser «su version»', async () => {
    const uid = 'uid-160-eco';
    const {engine, T, localStore} = await pendingConflict(uid);

    // El usuario sigue escribiendo en ESTE telefono (el caso de R9-36).
    const edit1 = {value: 'L1: sigo escribiendo', updatedAt: T + 12_000};
    localStore.set('doc-c', edit1);
    engine.queueWrite('test', 'doc-c', edit1);
    await settle();
    // El eco exacto de esa edicion: mismo updatedAt que lo local.
    fire(uid, [{id: 'doc-c', data: edit1}]);
    await settle();
    const trasEcoExacto = theirs(engine);

    // Otra edicion 3 s despues, y el eco de la ANTERIOR llega tarde: es mas
    // viejo que lo local, esta dentro de la ventana y tiene otro valor.
    const edit2 = {value: 'L2: y un poco mas', updatedAt: T + 15_000};
    localStore.set('doc-c', edit2);
    engine.queueWrite('test', 'doc-c', edit2);
    await settle();
    fire(uid, [{id: 'doc-c', data: edit1}]);
    await settle();

    // Pre-fix: el eco tardio se registraba como conflicto nuevo y L1 (lo mio)
    // pasaba a ser «su version».
    expect({
      trasEcoExacto,
      trasEcoTardio: theirs(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      trasEcoExacto: [{value: R, deleted: false}],
      trasEcoTardio: [{value: R, deleted: false}],
      local: 'L2: y un poco mas',
    });
  });

  it.each<['keepMine' | 'keepTheirs']>([['keepMine'], ['keepTheirs']])(
    'el otro telefono lo borra: L no se borra, «su version» pasa a ser la lapida, y %s hace lo que dice',
    async choice => {
      const uid = `uid-160-lapida-${choice}`;
      const {engine, T, localStore, remoteDeleteCalls} =
        await pendingConflict(uid);
      const lapida = {
        value: R,
        updatedAt: T + 120_000,
        deleted: true,
        deletedAt: T + 120_000,
      };
      fire(uid, [{id: 'doc-c', data: lapida}]);
      await settle();
      const trasLapida = {
        local: localStore.get('doc-c')?.value,
        theirs: theirs(engine),
        deletes: [...remoteDeleteCalls],
      };

      await engine.resolveConflict('test__doc-c', choice);
      await settle();
      await engine.__flushForTests();
      await settle();

      // Pre-fix: la lapida entraba por LWW y L desaparecia antes de que el
      // usuario pudiera elegir.
      expect({
        trasLapida,
        local: localStore.get('doc-c')?.value ?? null,
        pushed: pushesOf(uid, 'doc-c').map(p => ({
          value: p.value,
          deleted: p.deleted,
        })),
      }).toEqual({
        trasLapida: {
          local: L,
          theirs: [{value: R, deleted: true}],
          deletes: [],
        },
        ...(choice === 'keepMine'
          ? // «Conservar lo mio» revive la nota en la nube.
            {local: L, pushed: [{value: L, deleted: false}]}
          : // «Lo suyo» es el borrado: la nube ya lo tiene.
            {local: null, pushed: []}),
      });
    },
  );

  it('si el otro vuelve a escribir lo mismo que L, el conflicto se disuelve y el doc se libera', async () => {
    const uid = 'uid-160-disuelto';
    const {engine, T, localStore} = await pendingConflict(uid);

    fire(uid, [{id: 'doc-c', data: {value: L, updatedAt: T + 120_000}}]);
    await settle();

    // Pre-fix: R2 (= L) entraba por LWW y el conflicto L/R seguia abierto, con
    // «su version» en R, que ya no esta en ninguna parte.
    expect({
      conflicts: engine.__getConflictsForTests(),
      local: localStore.get('doc-c'),
      conjunto: await AsyncStorage.getItem(unsettledStorageKey('test', uid)),
    }).toEqual({
      conflicts: [],
      local: {value: L, updatedAt: T + 120_000},
      conjunto: null,
    });
  });

  it('borre la nota aqui y despues el otro escribe R2: lo mio sigue borrado y «su version» pasa a R2', async () => {
    const uid = 'uid-160-borrado-aqui';
    const {engine, localStore, remoteUpsertCalls} = await pendingConflict(uid);

    // El usuario borra la nota en ESTE telefono, y su lapida sube.
    localStore.delete('doc-c');
    engine.queueDelete('test', 'doc-c', {value: L});
    await settle();
    await engine.__flushForTests();
    await settle();
    const miLapida = pushesOf(uid, 'doc-c').at(-1)!;
    // Control: la lapida subio de verdad.
    expect(miLapida.deleted).toBe(true);
    // Su eco vuelve: es mio, no «su version».
    fire(uid, [{id: 'doc-c', data: miLapida}]);
    await settle();
    const trasMiEco = theirs(engine);

    // El otro telefono escribe despues.
    fire(uid, [
      {
        id: 'doc-c',
        data: {value: R2, updatedAt: (miLapida.updatedAt as number) + 1_000},
      },
    ]);
    await settle();

    // Pre-fix: sin copia local, R2 entraba sin mas, y la pantalla la mostraba
    // como «Tu version» con «su version» en R.
    expect({
      trasMiEco,
      trasR2: theirs(engine),
      local: localStore.has('doc-c'),
      aplicados: remoteUpsertCalls.map(c => c.data.value),
    }).toEqual({
      trasMiEco: [{value: R, deleted: false}],
      trasR2: [{value: R2, deleted: false}],
      local: false,
      aplicados: [],
    });
  });

  it.each<
    [string, Record<string, unknown>, 'antes' | 'cerrada', {value: string}]
  >([
    ['R2 llega antes del reinicio', {value: R2}, 'antes', {value: R2}],
    ['R2 se escribe con la app cerrada', {value: R2}, 'cerrada', {value: R2}],
    [
      'la lapida del otro llega antes del reinicio',
      {value: R, deleted: true, deletedAt: 1},
      'antes',
      {value: R},
    ],
    [
      'la lapida del otro se escribe con la app cerrada',
      {value: R, deleted: true, deletedAt: 1},
      'cerrada',
      {value: R},
    ],
  ])(
    'reiniciar antes de resolver no le abre la puerta al LWW: %s, y el conflicto vuelve con eso y L en local',
    async (_name, cambio, cuando, valor) => {
      const uid = `uid-160-reinicio-${cambio.deleted ? 'lapida' : 'r2'}-${cuando}`;
      const {engine, T, localStore} = await pendingConflict(uid);
      const suyo = {id: 'doc-c', data: {...cambio, updatedAt: T + 120_000}};
      const suVersion = {...valor, deleted: cambio.deleted === true};
      if (cuando === 'antes') {
        fire(uid, [suyo]);
        await settle();
        // Control: sin reiniciar, ya lo refresca el conflicto en memoria.
        expect(theirs(engine)).toEqual([suVersion]);
      }

      await restart(engine, uid);
      // Lo que la nube le entrega al enganche nuevo: su version de ahora.
      fire(uid, [suyo]);
      await settle();

      // Tras el reinicio solo quedaba la ventana de 30 s, y el cambio del otro
      // (a 2 min de L) ya no se detectaba: entraba por LWW y L se perdia igual.
      expect({
        suVersion: theirs(engine),
        local: localStore.get('doc-c')?.value,
      }).toEqual({suVersion: [suVersion], local: L});
    },
  );

  it('una lapida del otro que trae los mismos campos que L no disuelve el conflicto', async () => {
    // El otro telefono pudo haber tomado L antes de borrar: su lapida lleva
    // la ultima copia que tenia (queueDelete), igual a lo mio. Sigue siendo un
    // borrado contra una nota viva.
    const uid = 'uid-160-lapida-igual';
    const {engine, T, localStore, remoteDeleteCalls} =
      await pendingConflict(uid);
    fire(uid, [
      {
        id: 'doc-c',
        data: {value: L, updatedAt: T + 120_000, deleted: true, deletedAt: 1},
      },
    ]);
    await settle();

    expect({
      theirs: theirs(engine),
      differing: engine.__getConflictsForTests().map(c => c.differingFields),
      local: localStore.get('doc-c')?.value,
      deletes: remoteDeleteCalls,
    }).toEqual({
      theirs: [{value: L, deleted: true}],
      differing: [['value']],
      local: L,
      deletes: [],
    });
  });

  it('un arranque con la base sin abrir (R9-46) no le borra la marca a un conflicto retenido', async () => {
    const uid = 'uid-160-saltado-despues';
    const {engine, T, adapter, localStore} = await pendingConflict(uid);
    const suyo = {id: 'doc-c', data: {value: R2, updatedAt: T + 120_000}};
    fire(uid, [suyo]);
    await settle();

    // Arranque en frio con la base todavia sin abrir: la redelivery se salta.
    let dbReady = false;
    adapter.getLocal = async id => {
      if (!dbReady) throw new Error('Database not initialized');
      return localStore.get(id) ?? null;
    };
    await restart(engine, uid);
    fire(uid, [suyo]);
    await settle();
    // Control: se salto de verdad.
    expect(engine.__getConflictsForTests()).toEqual([]);

    dbReady = true;
    await restart(engine, uid);
    fire(uid, [suyo]);
    await settle();

    expect({
      theirs: theirs(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({theirs: [{value: R2, deleted: false}], local: L});
  });

  it('un doc saltado (R9-46) que despues resulta ser un conflicto queda marcado como conflicto', async () => {
    const uid = 'uid-160-saltado-antes';
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    const T = Date.now() - HOUR;
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    localStore.set('doc-c', {value: L, updatedAt: T});
    let dbReady = false;
    adapter.getLocal = async id => {
      if (!dbReady) throw new Error('Database not initialized');
      return localStore.get(id) ?? null;
    };
    const engine = new SyncEngine();
    engine.register(adapter);
    await engine.start(uid);
    await settle();
    const suyo = {id: 'doc-c', data: {value: R, updatedAt: T + 10_000}};
    fire(uid, [suyo]);
    await settle();

    // El mismo R, ya con la base abierta: ahora si es un conflicto.
    dbReady = true;
    await restart(engine, uid);
    fire(uid, [suyo]);
    await settle();
    // Control: el conflicto se detecto (por la ventana).
    expect(theirs(engine)).toEqual([{value: R, deleted: false}]);

    // El otro escribe R2 con la app cerrada.
    await restart(engine, uid);
    fire(uid, [{id: 'doc-c', data: {value: R2, updatedAt: T + 120_000}}]);
    await settle();

    expect({
      theirs: theirs(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({theirs: [{value: R2, deleted: false}], local: L});
  });

  it('tras reiniciar, una copia propia mas vieja que lo local no pasa a ser «su version», aunque este fuera de la ventana', async () => {
    const uid = 'uid-160-eco-reinicio';
    const {engine, T, localStore} = await pendingConflict(uid);
    // El usuario sigue escribiendo: L1 sube y su eco vuelve...
    const L1 = {value: 'L1: sigo escribiendo', updatedAt: T + 60_000};
    localStore.set('doc-c', L1);
    engine.queueWrite('test', 'doc-c', L1);
    await settle();
    fire(uid, [{id: 'doc-c', data: L1}]);
    await settle();
    // ...y L2, un minuto despues, todavia no subio cuando se cierra la app.
    localStore.set('doc-c', {value: 'L2: sin subir', updatedAt: T + 120_000});

    await restart(engine, uid);
    // La nube tiene L1: mas vieja que lo local, a 60 s, y con otro valor.
    fire(uid, [{id: 'doc-c', data: L1}]);
    await settle();

    expect({
      theirs: theirs(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({theirs: [], local: 'L2: sin subir'});
  });

  it('control: tras resolver, lo retenido se va con el conflicto: despues de reiniciar, un cambio posterior del otro entra por LWW', async () => {
    // No discrimina contra R9-160, a proposito: impide que la marca que
    // sobrevive al reinicio convierta en conflicto lo que ya no lo es.
    const uid = 'uid-160-control';
    const {engine, T, localStore} = await pendingConflict(uid);
    fire(uid, [{id: 'doc-c', data: {value: R2, updatedAt: T + 120_000}}]);
    await settle();
    await engine.resolveConflict('test__doc-c', 'keepMine');
    await settle();
    await engine.__flushForTests();
    await settle();

    await restart(engine, uid);
    const R3 = 'R3: el otro edita una hora despues';
    fire(uid, [{id: 'doc-c', data: {value: R3, updatedAt: Date.now()}}]);
    await settle();

    expect({
      conflicts: engine.__getConflictsForTests(),
      local: localStore.get('doc-c')?.value,
    }).toEqual({conflicts: [], local: R3});
  });
});

describe('R9-161 — «quedarme con lo suyo» deja lo local igual que la nube', () => {
  // keepTheirs aplicaba `conflict.remoteVersion` y no encolaba nada: «la nube
  // ya lo tiene». Deja de ser cierto si la nube se movio desde la deteccion.
  // Lo que movio el OTRO telefono ya lo refresca R9-160; lo que queda es lo
  // de ESTE: su borrado (F3), una edicion que ya subio, o una que sigue en la
  // cola. Entonces lo local quedaba en R y la nube en otra cosa, para siempre
  // si otro doc llevaba el cursor por encima.
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  const HOUR = 60 * 60 * 1000;
  const L = 'L: mi parrafo';
  const R = 'R: su parrafo';
  const R2 = 'R2: su parrafo, dos minutos despues';

  type Doc = {id: string; data: Record<string, unknown>};

  /** Un telefono con un conflicto L/R pendiente sobre doc-c (L en T, R 10 s
   *  despues), y la nube de la cuenta: lo ultimo que le llego, sea lo que la
   *  prueba entrega por el listener o lo que el motor subio. `antes` corre
   *  entre el arranque y la llegada de R. */
  async function phoneWithConflict(
    uid: string,
    antes?: (engine: SyncEngine, T: number) => Promise<void>,
  ) {
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    const T = Date.now() - HOUR;
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    fixture.localStore.set('doc-c', {value: L, updatedAt: T});
    const engine = new SyncEngine();
    engine.register(fixture.adapter);
    await engine.start(uid);
    await settle();
    await antes?.(engine, T);

    const nube = new Map<string, Record<string, unknown>>();
    let vistos = 0;
    const absorber = () => {
      for (const d of mockDocSets.slice(vistos)) {
        if (d.path === `users/${uid}/test`) {
          nube.set(d.id, d.data as Record<string, unknown>);
        }
      }
      vistos = mockDocSets.length;
    };
    const entregar = (docs: Doc[]) => {
      absorber();
      for (const d of docs) nube.set(d.id, d.data);
      fireRemote(
        uid,
        docs.map(d => ({
          type: 'modified',
          doc: {id: d.id, exists: true, data: () => d.data},
        })),
      );
    };
    const sincronizar = async () => {
      await settle();
      await engine.__flushForTests();
      await settle();
      absorber();
    };
    /** Lo local y la nube de doc-c: el valor, o null si esta borrado. */
    const estado = () => {
      const enNube = nube.get('doc-c');
      return {
        local: fixture.localStore.get('doc-c')?.value ?? null,
        nube: enNube && enNube.deleted !== true ? enNube.value : null,
      };
    };
    /** Cierra y abre la app: el enganche nuevo recibe de la nube todo lo que
     *  pasa su piso (el mock filtra por el `where`). */
    const reiniciar = async () => {
      engine.stop();
      await engine.start(uid);
      await settle();
      entregar([...nube].map(([id, data]) => ({id, data})));
      await settle();
    };
    const subidasDe = (id: string) =>
      mockDocSets
        .filter(d => d.path === `users/${uid}/test` && d.id === id)
        .map(d => d.data as Record<string, unknown>);

    entregar([{id: 'doc-c', data: {value: R, updatedAt: T + 10_000}}]);
    await settle();
    // Control: el conflicto L/R existe.
    expect(
      engine.__getConflictsForTests().map(c => c.remoteVersion.value),
    ).toEqual([R]);
    return {
      engine,
      T,
      nube,
      entregar,
      sincronizar,
      estado,
      reiniciar,
      subidasDe,
      ...fixture,
    };
  }

  /** Borra doc-c en ESTE telefono a T + `offset` (la lapida lleva esa fecha)
   *  y la sube, con su eco de vuelta. */
  async function borrarAqui(
    w: Awaited<ReturnType<typeof phoneWithConflict>>,
    offset: number,
  ): Promise<Record<string, unknown>> {
    w.localStore.delete('doc-c');
    const clock = jest.spyOn(Date, 'now').mockReturnValue(w.T + offset);
    try {
      w.engine.queueDelete('test', 'doc-c', {value: L});
    } finally {
      clock.mockRestore();
    }
    await w.sincronizar();
    const lapida = w.nube.get('doc-c')!;
    // Control: la lapida subio.
    expect(lapida.deleted).toBe(true);
    w.entregar([{id: 'doc-c', data: lapida}]);
    await settle();
    return lapida;
  }

  it('E2: el otro escribio R2 y otro doc adelanto el cursor: keepTheirs deja lo local en R2 sin subir nada, tambien tras reiniciar', async () => {
    const w = await phoneWithConflict('uid-161-e2');
    w.entregar([{id: 'doc-c', data: {value: R2, updatedAt: w.T + 120_000}}]);
    await settle();
    w.entregar([
      {id: 'doc-otro', data: {value: 'x', updatedAt: w.T + 900_000}},
    ]);
    await settle();

    await w.engine.resolveConflict('test__doc-c', 'keepTheirs');
    await w.sincronizar();
    const trasResolver = w.estado();
    await w.reiniciar();

    // Pre-fix (sonda de la S25): lo local en R, la nube en R2, y tras
    // reiniciar el piso quedaba por encima de R2: no volvia nunca.
    expect({
      trasResolver,
      trasReiniciar: w.estado(),
      subidas: w.subidasDe('doc-c'),
    }).toEqual({
      trasResolver: {local: R2, nube: R2},
      trasReiniciar: {local: R2, nube: R2},
      subidas: [],
    });
  });

  it('F3: borre la nota aqui despues de la deteccion: keepMine no puede, y keepTheirs revive R aqui Y en la nube, tambien tras reiniciar', async () => {
    const w = await phoneWithConflict('uid-161-f3');
    const lapida = await borrarAqui(w, 60_000);
    w.entregar([
      {id: 'doc-otro', data: {value: 'x', updatedAt: w.T + 900_000}},
    ]);
    await settle();
    // Control: sin copia local, keepMine rechaza, y «Combinar» no abre: lo
    // unico que el usuario puede elegir es lo suyo.
    await expect(
      w.engine.resolveConflict('test__doc-c', 'keepMine'),
    ).rejects.toThrow('no local copy');

    await w.engine.resolveConflict('test__doc-c', 'keepTheirs');
    await w.sincronizar();
    const trasResolver = w.estado();
    const subida = w.subidasDe('doc-c').at(-1)!;
    await w.reiniciar();

    // Pre-fix (sonda de la S25): R revivia solo aqui, la nube se quedaba con
    // la lapida, y tras reiniciar la lapida estaba por debajo del piso.
    expect({
      trasResolver,
      trasReiniciar: w.estado(),
      // Re-sellada: los demas telefonos ya vieron la lapida, y una R con su
      // fecha vieja la ignorarian por LWW.
      leGanaALaLapida:
        (subida.updatedAt as number) > (lapida.updatedAt as number),
    }).toEqual({
      trasResolver: {local: R, nube: R},
      trasReiniciar: {local: R, nube: R},
      leGanaALaLapida: true,
    });
  });

  it('borre la nota aqui y despues el otro escribio R2: keepTheirs aplica R2 y no sube nada, la nube ya lo tiene', async () => {
    // No discrimina contra el codigo sin subida, a proposito: impide que la
    // marca de «escribi aqui» sobreviva a la R2 del otro, que llego despues.
    const w = await phoneWithConflict('uid-161-borrado-r2');
    await borrarAqui(w, 60_000);
    w.entregar([{id: 'doc-c', data: {value: R2, updatedAt: w.T + 120_000}}]);
    await settle();
    const subidasAntes = w.subidasDe('doc-c').length;

    await w.engine.resolveConflict('test__doc-c', 'keepTheirs');
    await w.sincronizar();

    expect({
      estado: w.estado(),
      subidasNuevas: w.subidasDe('doc-c').slice(subidasAntes),
    }).toEqual({estado: {local: R2, nube: R2}, subidasNuevas: []});
  });

  it('segui escribiendo aqui y esa edicion ya subio: keepTheirs sube lo suyo, tambien tras reiniciar', async () => {
    const w = await phoneWithConflict('uid-161-edite');
    const edit = {value: 'L1: sigo escribiendo', updatedAt: w.T + 60_000};
    w.localStore.set('doc-c', edit);
    w.engine.queueWrite('test', 'doc-c', edit);
    await w.sincronizar();
    w.entregar([{id: 'doc-c', data: edit}]);
    await settle();
    // Control: la edicion esta en la nube.
    expect(w.estado().nube).toBe('L1: sigo escribiendo');

    await w.engine.resolveConflict('test__doc-c', 'keepTheirs');
    await w.sincronizar();
    const trasResolver = w.estado();
    await w.reiniciar();

    // Sin subir, lo local quedaba en R y la nube en L1.
    expect({trasResolver, trasReiniciar: w.estado()}).toEqual({
      trasResolver: {local: R, nube: R},
      trasReiniciar: {local: R, nube: R},
    });
  });

  it('una edicion mia de ANTES de la deteccion no pudo subir y espera en la cola: keepTheirs la reemplaza por lo suyo', async () => {
    const w = await phoneWithConflict('uid-161-cola', async (engine, T) => {
      // La subida falla (y queda esperando su reintento) antes de que llegue R.
      mockSetShouldFail = true;
      engine.queueWrite('test', 'doc-c', {value: L, updatedAt: T});
      await settle();
    });
    mockSetShouldFail = false;
    // Control: L sigue en la cola, esperando.
    expect(
      w.engine
        .__getQueueForTests()
        .map(q => (q.data as {value?: string}).value),
    ).toEqual([L]);

    await w.engine.resolveConflict('test__doc-c', 'keepTheirs');
    await w.sincronizar();

    // Sin reemplazarla, L salia en su reintento y pisaba a R en la nube.
    expect({
      estado: w.estado(),
      cola: w.engine
        .__getQueueForTests()
        .map(q => (q.data as {value?: string}).value),
    }).toEqual({estado: {local: R, nube: R}, cola: []});
  });

  it('una edicion mia seguia en la cola cuando llego R2 y subio despues: keepTheirs igual sube lo suyo', async () => {
    const w = await phoneWithConflict('uid-161-cola-r2');
    const edit = {value: 'L1: sigo escribiendo', updatedAt: w.T + 60_000};
    mockSetShouldFail = true;
    w.localStore.set('doc-c', edit);
    w.engine.queueWrite('test', 'doc-c', edit);
    await settle();
    mockSetShouldFail = false;
    w.entregar([{id: 'doc-c', data: {value: R2, updatedAt: w.T + 120_000}}]);
    await settle();

    // Pasa la espera del reintento y L1 sube, DESPUES de R2.
    const now = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(now + 31_000);
    try {
      await w.sincronizar();
    } finally {
      clock.mockRestore();
    }
    w.entregar([{id: 'doc-c', data: edit}]);
    await settle();
    // Control: la nube tiene L1, y la cola ya no.
    expect({
      nube: w.estado().nube,
      cola: w.engine.__getQueueForTests().length,
    }).toEqual({nube: 'L1: sigo escribiendo', cola: 0});

    await w.engine.resolveConflict('test__doc-c', 'keepTheirs');
    await w.sincronizar();

    // Si R2 borraba la marca aunque L1 siguiera en la cola, aqui no subia
    // nada: lo local en R2 y la nube en L1.
    expect(w.estado()).toEqual({local: R2, nube: R2});
  });

  it.each<['keepMine' | 'disuelto' | 'reinicio']>([
    ['keepMine'],
    ['disuelto'],
    ['reinicio'],
  ])(
    'la marca de «escribi aqui» se va con su conflicto (%s): uno nuevo del mismo doc no sube lo suyo sin motivo',
    async fin => {
      // No discrimina contra el codigo sin subida, a proposito: es la regla de
      // sincronizar lo minimo. Una marca vieja subiria «lo suyo» re-sellado
      // aunque la nube ya lo tenga.
      const w = await phoneWithConflict(`uid-161-marca-${fin}`);
      const edit = {value: 'L1: sigo escribiendo', updatedAt: w.T + 60_000};
      w.localStore.set('doc-c', edit);
      w.engine.queueWrite('test', 'doc-c', edit);
      await w.sincronizar();
      w.entregar([{id: 'doc-c', data: edit}]);
      await settle();

      if (fin === 'keepMine') {
        await w.engine.resolveConflict('test__doc-c', 'keepMine');
        await w.sincronizar();
        w.entregar([{id: 'doc-c', data: w.nube.get('doc-c')!}]);
      } else if (fin === 'disuelto') {
        // El otro escribe lo mismo que yo, despues.
        w.entregar([{id: 'doc-c', data: {...edit, updatedAt: w.T + 120_000}}]);
      } else {
        await w.reiniciar();
      }
      await settle();
      // Control: el primer conflicto termino.
      expect(w.engine.__getConflictsForTests()).toEqual([]);

      // Un conflicto nuevo: el otro escribe R3 a 5 s de lo local.
      const R3 = 'R3: otro conflicto';
      const localTs = w.localStore.get('doc-c')!.updatedAt;
      w.entregar([
        {id: 'doc-c', data: {value: R3, updatedAt: localTs + 5_000}},
      ]);
      await settle();
      const subidasAntes = w.subidasDe('doc-c').length;
      await w.engine.resolveConflict('test__doc-c', 'keepTheirs');
      await w.sincronizar();

      expect({
        estado: w.estado(),
        subidasNuevas: w.subidasDe('doc-c').slice(subidasAntes),
      }).toEqual({estado: {local: R3, nube: R3}, subidasNuevas: []});
    },
  );

  it('el otro lo borro y despues segui escribiendo aqui: keepTheirs borra aqui Y en la nube', async () => {
    const w = await phoneWithConflict('uid-161-lapida-suya');
    w.entregar([
      {
        id: 'doc-c',
        data: {
          value: R,
          updatedAt: w.T + 120_000,
          deleted: true,
          deletedAt: w.T + 120_000,
        },
      },
    ]);
    await settle();
    const edit = {value: 'L1: sigo escribiendo', updatedAt: w.T + 180_000};
    w.localStore.set('doc-c', edit);
    w.engine.queueWrite('test', 'doc-c', edit);
    await w.sincronizar();
    w.entregar([{id: 'doc-c', data: edit}]);
    await settle();

    await w.engine.resolveConflict('test__doc-c', 'keepTheirs');
    await w.sincronizar();
    const trasResolver = w.estado();
    await w.reiniciar();

    expect({trasResolver, trasReiniciar: w.estado()}).toEqual({
      trasResolver: {local: null, nube: null},
      trasReiniciar: {local: null, nube: null},
    });
  });
});
