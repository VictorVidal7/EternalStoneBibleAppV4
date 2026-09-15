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
  CURSOR_SAFETY_MARGIN_MS,
} from '../src/lib/sync/SyncEngine';
import {__resetFirestoreCacheForTests} from '../src/lib/sync/firestore';
import {__resetNetInfoCacheForTests} from '../src/lib/sync/netinfo';
import {logger} from '../src/lib/utils/logger';
import type {SyncAdapter, SyncEntity} from '../src/lib/sync/types';

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
    const raw = await AsyncStorage.getItem('@sync_cursor_test:uid');
    const floor = raw === null ? 0 : Number(raw) - CURSOR_SAFETY_MARGIN_MS;
    // The next reattach queries updatedAt >= floor. If that floor is past
    // doc-old, the change this device never took is gone forever.
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
