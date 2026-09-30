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
/** R9-33 — when true, every `doc.set()` rejects, the way the server rejects a
 *  write: after its echo, which the listener then takes back (R9-179). Reset
 *  in beforeEach. */
let mockSetShouldFail = false;
/** R9-104 — when it returns a promise for a (path, id), that `doc.set()`
 *  waits on it before landing (or rejects with it). It is the only way to hold
 *  ONE push in flight across a `stop()` + `start()`. Reset in beforeEach. */
let mockSetGate:
  ((path: string, id: string) => Promise<void> | undefined) | null = null;
/** R9-124 — like `mockSetGate`, for a doc's `get()`: holds the read that
 *  tells a `removed` doc from a deleted one. Reset in beforeEach. */
let mockGetGate:
  ((path: string, id: string) => Promise<void> | undefined) | null = null;
/** R9-124 — when true, every doc `get()` rejects. Reset in beforeEach. */
let mockGetShouldFail = false;
/** R9-177 — RNFirebase on Android runs a doc's `get()`, `set()` and `delete()`
 *  on ONE executor (pool size 1 by default). A read holds it until the server
 *  answers (`Tasks.await`); a write holds it only to be issued, and is answered
 *  later. So a write made while a read waits is issued only once the read is
 *  back: a `set()` with its echo; this mock's `delete()` raises no event at all
 *  (R9-188). The tail of that queue, and how many turns are on it. Reset in
 *  beforeEach. */
let mockExecutorTail: Promise<void> = Promise.resolve();
let mockExecutorTurns = 0;
function mockOnExecutor<T>(turn: () => Promise<T>): Promise<T> {
  mockExecutorTurns += 1;
  const run = mockExecutorTail.then(turn).finally(() => {
    mockExecutorTurns -= 1;
  });
  mockExecutorTail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
/** What made the mock listener deliver a change (R9-179): the test firing a
 *  change of the cloud, the first snapshot of a new listener, or one of this
 *  device's own writes — its echo, its rejection taking it back, or its ack
 *  when the cloud's copy differed from what the echo showed. */
type MockDeliveryCause = 'fire' | 'attach' | 'echo' | 'revert' | 'ack';
/** R9-124 — every change the mock listener actually delivered, so a test can
 *  check it exercised the `removed` path it claims to. Reset in beforeEach. */
const mockDelivered: Array<{
  path: string;
  type: string;
  id: string;
  via: MockDeliveryCause;
}> = [];
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

/** R9-179 — whether two versions of a doc hold the same data. The SDK raises
 *  nothing for a doc whose data did not change (only its metadata did, like
 *  `hasPendingWrites` when the server acks a write), unless the listener
 *  asked for metadata changes, which SyncEngine never does. */
function sameDocData(a: unknown, b: unknown): boolean {
  return stableJson(a) === stableJson(b);
}

function stableJson(v: unknown): string {
  if (v === null || typeof v !== 'object') {
    return JSON.stringify(v) ?? 'undefined';
  }
  if (Array.isArray(v)) return `[${v.map(stableJson).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map(k => `${JSON.stringify(k)}:${stableJson(o[k])}`)
    .join(',')}}`;
}

/** A change as the listener delivers it. */
type MockChange = {
  type: string;
  doc: {id: string; exists: boolean; data: () => unknown};
};

function mockMakeCollection(path: string): MockCollRef {
  const existing = mockCollections.get(path);
  if (existing) return existing;
  const docs = new Map<string, MockDocRef>();
  // R9-124 — the cloud's copy of every doc (what a test fired, and this
  // device's writes once the server took them), and the docs the live
  // listener currently holds in its result set (the ones that can leave it as
  // `removed`), with their last matching data.
  const serverDocs = new Map<string, unknown>();
  const listenerSet = new Map<string, unknown>();
  // R9-179 — this device's writes the server has not answered yet, oldest
  // first. The SDK shows them at once (latency compensation; on the native
  // SDK in S26 the echo came with `hasPendingWrites: true`): `get()` and the
  // listener see the cloud's copy with these on top, until the server takes
  // each one or rejects it. Before, an own write reached the listener only if
  // the test fired it back by hand, so a test could pass on an order the SDK
  // never produces (R9-179, R9-180).
  const ownInFlight = new Map<
    string,
    Array<{data: Record<string, unknown>; merge: boolean}>
  >();
  let snapshotCb: ((s: unknown) => void) | null = null;
  let errorCb: ((err: Error) => void) | null = null;
  let whereClauses: MockWhereClause[] = [];

  /** R9-179 — the doc as this device sees it: the cloud's copy, then every
   *  own write still in flight. `undefined` when it does not exist. */
  const localView = (docId: string): Record<string, unknown> | undefined => {
    let doc = serverDocs.get(docId) as Record<string, unknown> | undefined;
    for (const w of ownInFlight.get(docId) ?? []) {
      doc = w.merge ? {...(doc ?? {}), ...w.data} : w.data;
    }
    return doc;
  };

  /** R9-179 — what the live listener raises for `docId` once this device's
   *  view of it changed, computed like the SDK against the listener's result
   *  set: `added` if it enters, `modified` if it stays with other data,
   *  `removed` (with its last matching data) if it leaves, else nothing. */
  const viewChange = (docId: string): MockChange | null => {
    const doc = localView(docId);
    if (doc !== undefined && matchesWhereClauses(doc, whereClauses)) {
      const wasIn = listenerSet.has(docId);
      const before = listenerSet.get(docId);
      listenerSet.set(docId, doc);
      if (wasIn && sameDocData(before, doc)) return null;
      return {
        type: wasIn ? 'modified' : 'added',
        doc: {id: docId, exists: true, data: () => doc},
      };
    }
    if (!listenerSet.has(docId)) return null;
    const last = listenerSet.get(docId);
    listenerSet.delete(docId);
    return {type: 'removed', doc: {id: docId, exists: true, data: () => last}};
  };

  const deliver = (changes: MockChange[], via: MockDeliveryCause): void => {
    if (!snapshotCb || changes.length === 0) return;
    for (const c of changes) {
      mockDelivered.push({path, type: c.type, id: c.doc.id, via});
    }
    snapshotCb({docChanges: () => changes, size: changes.length});
  };

  /** R9-179 — what an own write changed in this device's view reaches the
   *  listener as an event of its own, a beat later (it crosses the native
   *  bridge), and only if that listener is still the one attached. Returns
   *  whether there was anything to raise. */
  const raiseOwn = (docId: string, via: MockDeliveryCause): boolean => {
    const cb = snapshotCb;
    if (!cb) return false;
    const change = viewChange(docId);
    if (!change) return false;
    setImmediate(() => {
      if (snapshotCb === cb) deliver([change], via);
    });
    return true;
  };

  const coll: MockCollRef = {
    __path: path,
    __whereClauses: whereClauses,
    doc: jest.fn((id: string) => {
      const cached = docs.get(id);
      if (cached) return cached;
      const ref: MockDocRef = {
        set: jest.fn(async (data: unknown, options?: {merge?: boolean}) => {
          // R9-179 — latency compensation: the write is in this device's view
          // as soon as it is issued. `get()` reads it, and the listener raises
          // its echo (`added`, `modified`, or `removed` if it drops the doc
          // below the floor) BEFORE the server answers.
          const issue = () => {
            const write = {
              data: data as Record<string, unknown>,
              merge: options?.merge === true,
            };
            const inFlight = ownInFlight.get(id) ?? [];
            inFlight.push(write);
            ownInFlight.set(id, inFlight);
            const echoed = raiseOwn(id, 'echo');
            // The write leaves now, so the server applies it before any
            // change a test fires while its ack is on the way; that change
            // shows up when the ack takes the write off the view.
            const hadCloud = serverDocs.has(id);
            const cloud = serverDocs.get(id) as
              Record<string, unknown> | undefined;
            const landed = write.merge
              ? {...(cloud ?? {}), ...write.data}
              : write.data;
            serverDocs.set(id, landed);
            return {write, inFlight, echoed, hadCloud, cloud, landed};
          };
          // R9-177 — behind a read still waiting on the server, if any.
          const {write, inFlight, echoed, hadCloud, cloud, landed} =
            mockExecutorTurns > 0
              ? await mockOnExecutor(async () => issue())
              : issue();
          const answered = () => {
            inFlight.splice(inFlight.indexOf(write), 1);
            if (inFlight.length === 0) ownInFlight.delete(id);
          };
          try {
            const gate = mockSetGate?.(path, id);
            if (gate) await gate;
            // The echo lands before the ack even when nothing holds the push:
            // on the SDK the ack is a round trip away.
            if (echoed) await new Promise(resolve => setImmediate(resolve));
            // R9-33 — lets a test make every push fail, which is the only way
            // to exercise the retry/backoff/give-up path at all.
            if (mockSetShouldFail) throw new Error('permission-denied');
          } catch (err) {
            // Rejected: the server never applied it, and the SDK drops it from
            // its view. The listener sees the doc go back to the cloud's copy:
            // `modified`, `added` if the write had dropped it below the floor,
            // or `removed` if the cloud never had it. The rejection reaches
            // the caller first.
            if (serverDocs.get(id) === landed) {
              if (hadCloud) serverDocs.set(id, cloud);
              else serverDocs.delete(id);
            }
            answered();
            raiseOwn(id, 'revert');
            throw err;
          }
          // Taken: off the view. What it shows now is the cloud's copy, the
          // write itself unless a later change landed on top of it.
          answered();
          raiseOwn(id, 'ack');
          mockDocSets.push({path, id, data});
        }),
        // R9-177 — the read holds the executor until the server answers, so
        // its answer never includes a write made meanwhile.
        get: jest.fn(() =>
          mockOnExecutor(async () => {
            const gate = mockGetGate?.(path, id);
            if (gate) await gate;
            if (mockGetShouldFail) throw new Error('unavailable');
            // R9-179 — the read sees this device's view: an own write issued
            // before it and still in flight is already there.
            const doc = localView(id);
            return doc !== undefined
              ? {exists: true, id, data: () => doc}
              : {exists: false, id, data: () => undefined};
          }),
        ),
        delete: jest.fn(async () => {
          if (mockExecutorTurns > 0) await mockOnExecutor(async () => {});
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
        // A new listener is a new query: it starts with an empty result set,
        // and its first snapshot, a beat later, brings every doc of this
        // device's view that matches, as `added` — own writes in flight
        // included (R9-179: the SDK does; before, a restart re-delivered
        // only what a test fired again).
        listenerSet.clear();
        setImmediate(() => {
          if (snapshotCb !== cb) return;
          const initial: MockChange[] = [];
          const ids = new Set([...serverDocs.keys(), ...ownInFlight.keys()]);
          for (const docId of ids) {
            const change = viewChange(docId);
            if (change) initial.push(change);
          }
          deliver(initial, 'attach');
        });
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
  // expose a way for the test to fire snapshots: each change is a write to
  // the cloud, seen through whatever `.where()` clauses SyncEngine most
  // recently attached with, the way the real SDK sees it:
  // - a doc that matches is delivered, and joins the listener's result set;
  // - a doc that no longer matches LEAVES the set: it is delivered as
  //   `removed`, carrying its last MATCHING data (R9-124, measured on the
  //   native Android SDK in S26). The doc still exists: `get()` returns it;
  // - a doc that never matched is never even seen ("a doc older than the
  //   cursor floor is never delivered");
  // - a change fired as `removed` is a real delete: `get()` stops finding it;
  // - R9-179 — while an own write of the doc is in flight, this device sees
  //   that write on top of the cloud's copy, and so does the listener: what
  //   it raises is what the VIEW did, usually nothing, until the server
  //   answers the write.
  (coll as MockCollRef & {__fire: (changes: unknown[]) => void}).__fire = (
    changes: unknown[],
  ) => {
    const filtered: MockChange[] = [];
    for (const change of changes) {
      const c = change as MockChange;
      const docId = c.doc?.id ?? '';
      const data = c.doc?.data?.() as Record<string, unknown> | undefined;
      if (c.type === 'removed') serverDocs.delete(docId);
      else serverDocs.set(docId, data);
      if (ownInFlight.has(docId)) {
        const masked = viewChange(docId);
        if (masked) filtered.push(masked);
        continue;
      }
      if (c.type === 'removed') {
        listenerSet.delete(docId);
        filtered.push(c);
        continue;
      }
      if (matchesWhereClauses(data, whereClauses)) {
        listenerSet.set(docId, data);
        filtered.push(c);
      } else if (listenerSet.has(docId)) {
        const last = listenerSet.get(docId);
        listenerSet.delete(docId);
        filtered.push({
          type: 'removed',
          doc: {id: docId, exists: true, data: () => last},
        });
      }
    }
    deliver(filtered, 'fire');
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
/** R9-179 — a push lands a macrotask after its echo (on the SDK the ack is a
 *  round trip away), so one `flush()` no longer sees it land, and
 *  `__flushForTests()` returns at once while the flush of `start()` holds the
 *  lock. This lets that flush finish its pushes. */
const drain = async (): Promise<void> => {
  for (let i = 0; i < 5; i++) await flush();
};

beforeEach(async () => {
  await AsyncStorage.clear();
  mockCollections.clear();
  mockDocSets.length = 0;
  mockSetShouldFail = false;
  mockSetGate = null;
  mockGetGate = null;
  mockGetShouldFail = false;
  mockExecutorTail = Promise.resolve();
  mockExecutorTurns = 0;
  mockDelivered.length = 0;
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
    // R9-179 — no initial bulk push: it would upload doc-x live, and its echo
    // would bring it back here after the tombstone (R9-126, not this test).
    await AsyncStorage.setItem('@sync_first_push_done:uid', '2');
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
    await drain();
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
    await drain();
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
    // R9-179 — no initial bulk push: while its upload of doc-r is in flight,
    // the SDK shows it on top of the cloud and holds the remote writes back.
    await AsyncStorage.setItem('@sync_first_push_done:uid-rep', '2');
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
    // No initial bulk push, so the assertion below is clean. R9-179 — draining
    // it is not enough: while its upload of doc-kt is in flight the SDK holds
    // the remote write back, and keepTheirs finds it still queued (R9-161).
    await AsyncStorage.setItem('@sync_first_push_done:uid-kt', '2');
    engine.register(adapter);
    await engine.start('uid-kt');
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
    // R9-179 — no initial bulk push: its flush, still in flight, would hold
    // the lock when the merge's push is due.
    await AsyncStorage.setItem('@sync_first_push_done:uid-mg', '2');
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
    // R9-179 — no initial bulk push: with its upload of doc-c2 still queued,
    // keepTheirs pushes theirs re-stamped (R9-161) and the cursor jumps to now.
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
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

describe('R9-182 — cuando el motor se rinde, la reversion del rechazo no borra la copia local', () => {
  // El SDK muestra el `set()` en el acto y, al rechazarlo, lo retira de su
  // vista: si la nube no tiene el doc, sale de la query como `removed`. Mientras
  // la escritura sigue en la cola la guarda de R9-176 lo cubre, pero el rechazo
  // llega al flush ANTES que la reversion (el orden del SDK de JS, el que modela
  // el mock), asi que tras el octavo la escritura ya no esta en la cola, la
  // lectura dice «no existe» y se borraba la fila local.
  const HOUR = 60 * 60 * 1000;

  /** Sube `nuevo` con todos los `set()` rechazados hasta que el motor se
   *  rinde (R9-33). Devuelve lo que entrego el listener en el ultimo intento. */
  async function rechazarHastaRendirse(
    engine: SyncEngine,
    localStore: Map<string, SyncEntity<TestEntity>>,
  ): Promise<{colaAntes: unknown[]; entregasUltimo: string[]}> {
    const T0 = Date.now() - 60_000;
    mockSetShouldFail = true;
    localStore.set('nuevo', {value: 'mio', updatedAt: T0});
    engine.queueWrite('test', 'nuevo', {value: 'mio', updatedAt: T0});
    await drain();
    const realNow = Date.now();
    const nowSpy = jest.spyOn(Date, 'now');
    let colaAntes: unknown[] = [];
    let desde = 0;
    for (let i = 1; i <= 7; i++) {
      nowSpy.mockReturnValue(realNow + i * HOUR);
      colaAntes = engine.__getQueueForTests().map(q => [q.id, q.attempts]);
      desde = mockDelivered.length;
      await engine.__flushForTests();
      await drain();
    }
    nowSpy.mockRestore();
    mockSetShouldFail = false;
    return {
      colaAntes,
      entregasUltimo: mockDelivered
        .slice(desde)
        .filter(d => d.id === 'nuevo')
        .map(d => `${d.type}/${d.via}`),
    };
  }

  it('la nube no tiene el doc y el servidor rechaza sus 8 subidas: la copia local se queda', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteDeleteCalls} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');
    await drain();
    const r = await rechazarHastaRendirse(engine, localStore);
    // Pre-fix: `local: null` y `borrados: ['nuevo']`. El aviso de R9-33 solo
    // decia que el cambio no habia subido.
    expect({
      ...r,
      cola: engine.__getQueueForTests().length,
      droppedWrites: engine.getState().droppedWrites,
      local: localStore.get('nuevo')?.value ?? null,
      borrados: remoteDeleteCalls,
    }).toEqual({
      // Control del mecanismo: el octavo intento, y su reversion como `removed`.
      colaAntes: [['nuevo', 7]],
      entregasUltimo: ['added/echo', 'removed/revert'],
      cola: 0,
      droppedWrites: 1,
      local: 'mio',
      borrados: [],
    });
    engine.stop();
  });

  it('si la nube tenia el doc, la reversion es un `modified`, y un borrado de verdad posterior del otro telefono se aplica como siempre', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteDeleteCalls} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');
    await drain();
    const ayer = {value: 'de ayer', updatedAt: Date.now() - 24 * HOUR};
    fireRemote('uid', [
      {type: 'modified', doc: {id: 'nuevo', exists: true, data: () => ayer}},
    ]);
    await drain();
    const r = await rechazarHastaRendirse(engine, localStore);
    fireRemote('uid', [
      {type: 'removed', doc: {id: 'nuevo', exists: true, data: () => ayer}},
    ]);
    await drain();
    await drain();
    // Si la espera de la reversion solo la terminara un `removed`, seguia
    // armada y este borrado de verdad no se aplicaba: la fila quedaba aqui y
    // no en la nube.
    expect({
      ...r,
      local: localStore.get('nuevo')?.value ?? null,
      borrados: remoteDeleteCalls,
    }).toEqual({
      colaAntes: [['nuevo', 7]],
      entregasUltimo: ['modified/echo', 'modified/revert'],
      local: null,
      borrados: ['nuevo'],
    });
    engine.stop();
  });

  it('tras rendirse, si la misma version vuelve a subir y despues el otro telefono la borra de verdad, se borra aqui', async () => {
    const engine = new SyncEngine();
    const {adapter, localStore, remoteDeleteCalls} = makeAdapter();
    engine.register(adapter);
    await engine.start('uid');
    await drain();
    await rechazarHastaRendirse(engine, localStore);
    // Control: la copia local sobrevivio al descarte (la primera prueba).
    const antes = localStore.get('nuevo')?.value ?? null;
    // Un re-push de la fila tal como esta guardada: su eco trae el mismo
    // `updatedAt` que la escritura descartada.
    const mio = localStore.get('nuevo')!;
    engine.queueWrite('test', 'nuevo', {...mio});
    await drain();
    await drain();
    const subida = mockDocSets.filter(d => d.id === 'nuevo').length;
    fireRemote('uid', [
      {type: 'removed', doc: {id: 'nuevo', exists: true, data: () => mio}},
    ]);
    await drain();
    await drain();
    // Si la reversion no terminara la espera, el eco de la misma version
    // tampoco (es la excepcion), y este borrado de verdad no se aplicaba.
    expect({
      antes,
      subida,
      local: localStore.get('nuevo')?.value ?? null,
      borrados: remoteDeleteCalls,
    }).toEqual({antes: 'mio', subida: 1, local: null, borrados: ['nuevo']});
    engine.stop();
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

describe('R9-184 — el flush no sube una entrada que otra edicion ya reemplazo en la cola', () => {
  // `flush()` sube una FOTO de la cola tomada al empezar. Si mientras sube otro
  // doc el usuario vuelve a editar uno que espera detras, la foto todavia trae
  // la version vieja. Subida igual, su eco llega con la nueva en local y, a
  // menos de 30 s y con otro valor, se registra un conflicto entre dos
  // versiones de este telefono que nada disuelve: el eco de la nueva no es
  // «mas nuevo» que lo local.
  it('una edicion que reemplaza en la cola a otra que no subio todavia: sube solo la nueva y no aparece ningun conflicto', async () => {
    const T0 = 1_000_000;
    const engine = new SyncEngine();
    const {adapter, localStore} = makeAdapter({
      getMaterialFields: () => ['value'],
    });
    engine.register(adapter);
    await engine.start('uid');
    await drain();
    // El dano puede ser pasajero: se anota cada conflicto que llega a publicarse.
    const conflictosVistos = new Set<string>();
    engine.subscribe(s => {
      for (const c of s.conflicts) {
        conflictosVistos.add(
          `${c.docId}: ${(c.localVersion as unknown as TestEntity).value} / ` +
            `${(c.remoteVersion as unknown as TestEntity).value}`,
        );
      }
    });
    // Sin red: al volver, UN flush con los dos docs en la cola.
    engine.__setOnlineForTests(false);
    localStore.set('docA', {value: 'a', updatedAt: T0});
    engine.queueWrite('test', 'docA', {value: 'a', updatedAt: T0});
    localStore.set('docB', {value: 'w1', updatedAt: T0 + 1000});
    engine.queueWrite('test', 'docB', {value: 'w1', updatedAt: T0 + 1000});
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const emitidos: string[] = [];
    mockSetGate = (_path, id) => {
      emitidos.push(id);
      return id === 'docA' ? gate : undefined;
    };
    engine.__setOnlineForTests(true);
    await drain();
    // Mientras docA sube, el usuario edita docB otra vez, 5 s despues.
    localStore.set('docB', {value: 'w2', updatedAt: T0 + 6000});
    engine.queueWrite('test', 'docB', {value: 'w2', updatedAt: T0 + 6000});

    // Control del mecanismo: docA esta en vuelo, nada subio todavia, y W2 ya
    // ocupa en la cola el lugar de W1.
    expect({
      emitidos: [...emitidos],
      subidas: mockDocSets.length,
      cola: engine
        .__getQueueForTests()
        .map(q => [q.id, (q.data as unknown as TestEntity).value]),
    }).toEqual({
      emitidos: ['docA'],
      subidas: 0,
      cola: [
        ['docA', 'a'],
        ['docB', 'w2'],
      ],
    });

    release();
    await drain();
    await drain();

    // Pre-fix: subian W1 y despues W2, y quedaba publicado el conflicto
    // «docB: w2 / w1», lo mio contra una version mia. Elegir «lo suyo» dejaba
    // w1 en local y w2 en la nube.
    expect({
      subidas: mockDocSets.map(d => [d.id, (d.data as TestEntity).value]),
      conflictosVistos: [...conflictosVistos],
      cola: engine.__getQueueForTests().length,
      local: localStore.get('docB')?.value,
    }).toEqual({
      subidas: [
        ['docA', 'a'],
        ['docB', 'w2'],
      ],
      conflictosVistos: [],
      cola: 0,
      local: 'w2',
    });
    engine.stop();
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
    // R9-179 — Beto already did his initial bulk push on this phone. With the
    // SDK, Ana's first snapshot brings her pending writes (the listener shows
    // them before the ack) and the adapter stores them: this fixture has ONE
    // local store for both accounts, like the phone. Beto's bulk push would
    // then upload them to his cloud — the store changing hands at sign-in
    // (claimLocalStore, R9-158), not the queue these tests are about.
    await AsyncStorage.setItem('@sync_first_push_done:uid-beto', '2');
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

  it('R9-187: si el set de Ana vuelve bien DESPUES del cambio, no deja la sesion de Beto como recien sincronizada', async () => {
    // El corte de la rama de exito tiene un efecto propio, ademas de no seguir
    // con el lote de Ana: el `updateState` que estampa `lastSyncedAt` y borra
    // `lastError` es de la sesion que ya no esta. Un solo doc en el lote, para
    // que no haya un push siguiente que lo delate por otro camino.
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    const {engine, heldSets} = await anaWithHeldPush(
      [anaEntry('doc1', 'uno-de-ana')],
      'doc1',
      gate,
    );
    engine.stop();
    await engine.start('uid-beto');
    await settle();
    const deBeto = engine.getState().lastSyncedAt;
    // Un reloj que se distingue: lo que se estampe al volver el set de Ana.
    const luego = Date.now() + 24 * 60 * 60 * 1000;
    const clock = jest.spyOn(Date, 'now').mockReturnValue(luego);
    try {
      release();
      await settle();
    } finally {
      clock.mockRestore();
    }

    // Pre-fix (sin el corte): `lastSyncedAt: luego` en la sesion de Beto, que
    // no subio nada.
    expect({
      heldSets, // CONTROL: el set de Ana estaba en vuelo al cambiar
      aterrizo: mockDocSets.map(d => [d.path, d.id]), // CONTROL: volvio bien
      lastSyncedAt: engine.getState().lastSyncedAt,
    }).toEqual({
      heldSets: ['doc1'],
      aterrizo: [['users/uid-ana/test', 'doc1']],
      lastSyncedAt: deBeto,
    });
    engine.stop();
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
    // R9-175 — dos LOTES del mismo doc ya no se solapan: los de una coleccion
    // corren de a uno. Lo que todavia solapa dos applies del mismo doc es
    // resolver dos veces el mismo conflicto (un doble toque): el conflicto se
    // quita de la lista DESPUES del apply, y el segundo `resolveConflict` lo
    // encuentra todavia pendiente.
    await AsyncStorage.setItem('@sync_first_push_done:uid-prof', '2');
    const engine = new SyncEngine();
    const gates: Array<() => void> = [];
    const echoes: string[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    let gateOn = false;
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    const realUpsert = fixture.adapter.applyRemoteUpsert;
    fixture.adapter.applyRemoteUpsert = async (id, data) => {
      if (!gateOn) return realUpsert(id, data);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>(resolve => gates.push(resolve));
      await realUpsert(id, data);
      echoes.push(`${id}@${data.updatedAt}`);
      engine.queueWrite('test', id, data);
      inFlight -= 1;
    };
    fixture.localStore.set('doc-p', {value: 'local', updatedAt: 1000});
    engine.register(fixture.adapter);
    await engine.start('uid-prof');
    await settle();
    fireRemote('uid-prof', [
      {
        type: 'modified',
        doc: {
          id: 'doc-p',
          exists: true,
          data: () => ({value: 'remote', updatedAt: 1005}),
        },
      },
    ]);
    await settle();
    expect(engine.__getConflictsForTests().map(c => c.id)).toEqual([
      'test__doc-p',
    ]);

    gateOn = true;
    const first = engine.resolveConflict('test__doc-p', 'keepTheirs');
    const second = engine.resolveConflict('test__doc-p', 'keepTheirs');
    await settle();
    // Control: los dos applies estan EN VUELO a la vez; si no se solaparan, la
    // profundidad no tendria nada que contar.
    expect(maxInFlight).toBe(2);

    gates[0]();
    await settle();
    gates[1]();
    await settle();
    await Promise.all([first, second]);
    await engine.__flushForTests();
    await settle();

    // Sin el conteo, el primer apply que termina quita la supresion del doc y
    // el eco del segundo sale a la nube.
    expect(echoes).toEqual(['doc-p@1005', 'doc-p@1005']);
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

  it('R9-181: el otro lo borra de verdad y yo sigo escribiendo: el eco de lo mio no lleva la marca a una copia mia, y tras reiniciar no pasa a ser «su version»', async () => {
    const uid = 'uid-181-marca-propia';
    const {engine, T, localStore} = await pendingConflict(uid);
    // Borrado de verdad: la lectura dice «no existe», nada se toca en local y
    // el doc sale del conjunto; el conflicto sigue en memoria.
    fireRemote(uid, [
      {
        type: 'removed',
        doc: {
          id: 'doc-c',
          exists: true,
          data: () => ({value: R, updatedAt: T + 10_000}),
        },
      },
    ]);
    await settle();
    // E sube y su eco vuelve: el conflicto lo vuelve a retener...
    const E = {value: 'E: lo reescribo', updatedAt: T + 60_000};
    localStore.set('doc-c', E);
    engine.queueWrite('test', 'doc-c', E);
    await settle();
    fire(uid, [{id: 'doc-c', data: E}]);
    await settle();
    const retenidoTrasEco = JSON.parse(
      (await AsyncStorage.getItem(`@sync_conflicted_test:${uid}`)) ?? '[]',
    );
    // ...y E2, un minuto despues, todavia no subio cuando se cierra la app.
    localStore.set('doc-c', {value: 'E2: sin subir', updatedAt: T + 120_000});
    await restart(engine, uid);
    fire(uid, [{id: 'doc-c', data: E}]);
    await settle();

    expect({
      retenidoTrasEco, // CONTROL
      theirs: theirs(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      retenidoTrasEco: ['doc-c'],
      theirs: [],
      local: 'E2: sin subir',
    });
  });

  it('R9-181: la marca sigue a «su version» mas nueva: mientras el conflicto espera, el piso no se queda en la primera copia', async () => {
    const uid = 'uid-181-marca-suya';
    const {engine, T} = await pendingConflict(uid);
    const marca = async () =>
      JSON.parse(
        (await AsyncStorage.getItem(unsettledStorageKey('test', uid)))!,
      )['doc-c'] - T;
    const marcaAntes = await marca();
    fire(uid, [{id: 'doc-c', data: {value: R2, updatedAt: T + 120_000}}]);
    await settle();

    // No cambia que el conflicto vuelva tras reiniciar (R2 es mas nuevo que
    // L, y eso ya lo re-detecta), sino cuanto relee cada enganche mientras
    // espera: sin esto la marca se quedaba en R.
    expect({
      marcaAntes, // CONTROL
      theirs: theirs(engine).map(t => t.value), // CONTROL: R2 es «su version»
      marca: await marca(),
    }).toEqual({marcaAntes: 10_000, theirs: [R2], marca: 120_000});
  });

  it('control: tras resolver, lo retenido se va con el conflicto: despues de reiniciar, un cambio posterior del otro entra por LWW', async () => {
    // No discrimina contra R9-160, a proposito: impide que la marca que
    // sobrevive al reinicio convierta en conflicto lo que ya no lo es.
    // R9-180 — tampoco vigila que `resolveConflict` suelte la marca: el eco de
    // keepMine (L, sellado ahora) llega antes del reinicio y la rama retenida,
    // sin campos distintos, lo aplica por LWW y la asienta ella sola. Esa
    // guarda la vigila la siguiente, donde el eco no llega.
    const uid = 'uid-160-control';
    const {engine, T, localStore} = await pendingConflict(uid);
    fire(uid, [{id: 'doc-c', data: {value: R2, updatedAt: T + 120_000}}]);
    await settle();
    await engine.resolveConflict('test__doc-c', 'keepMine');
    await settle();
    await engine.__flushForTests();
    await settle();

    await restart(engine, uid);
    // Una hora despues de keepMine de verdad: a `Date.now()` caia dentro de
    // la ventana de 30 s del eco de keepMine y era un conflicto legitimo.
    const R3 = 'R3: el otro edita una hora despues';
    fire(uid, [{id: 'doc-c', data: {value: R3, updatedAt: Date.now() + HOUR}}]);
    await settle();

    expect({
      conflicts: engine.__getConflictsForTests(),
      local: localStore.get('doc-c')?.value,
    }).toEqual({conflicts: [], local: R3});
  });

  it('R9-180: keepMine sin red y la app se cierra antes de subir: la marca se va igual, y al volver lo posterior del otro entra por LWW', async () => {
    // Aqui el eco de keepMine no llega antes del reinicio, asi que lo unico
    // que suelta la marca es `resolveConflict`. El usuario elige sin red (el
    // flush no sale), la app se cierra, vuelve sin red, y R3 entra por el
    // listener antes de que NetInfo avise que hay red: el stream de Firestore
    // y NetInfo reconectan cada uno por su lado.
    const uid = 'uid-160-sin-red';
    const {engine, T, localStore} = await pendingConflict(uid);
    fire(uid, [{id: 'doc-c', data: {value: R2, updatedAt: T + 120_000}}]);
    await settle();
    engine.__setOnlineForTests(false);
    await engine.resolveConflict('test__doc-c', 'keepMine');
    await settle();
    // Control del mecanismo: keepMine espera en la cola, sin subir y sin eco.
    expect(engine.__getQueueForTests().map(q => q.id)).toEqual(['doc-c']);
    expect(pushesOf(uid, 'doc-c')).toEqual([]);
    expect(mockDelivered.filter(d => d.via === 'echo')).toEqual([]);
    const marcaTrasResolver = await AsyncStorage.getItem(
      unsettledStorageKey('test', uid),
    );

    const netInfo = jest.requireMock('@react-native-community/netinfo')
      .default as {fetch: jest.Mock};
    netInfo.fetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });
    await restart(engine, uid);
    const R3 = 'R3: el otro edita una hora despues';
    fire(uid, [{id: 'doc-c', data: {value: R3, updatedAt: Date.now() + HOUR}}]);
    await settle();

    // Sin la guarda, la marca seguia en disco: el piso bajaba hasta R2, R2
    // volvia como conflicto al enganchar, y R3 lo refrescaba (L contra R3)
    // cuando el usuario ya habia elegido.
    expect({
      marcaTrasResolver,
      conflicts: engine
        .__getConflictsForTests()
        .map(c => c.remoteVersion.value),
      local: localStore.get('doc-c')?.value,
      pushes: pushesOf(uid, 'doc-c'),
    }).toEqual({marcaTrasResolver: null, conflicts: [], local: R3, pushes: []});
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
      // R9-188 — la nube no tiene doc-c, asi que la reversion del rechazo llega
      // como `removed` y la lectura dice que no existe; L no se borra porque
      // su escritura sigue en la cola (la guarda de R9-176). Solo se borraria
      // si el motor se rindiera tras 8 intentos (R9-182).
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

describe('R9-124 — un `removed` de la query filtrada no es un borrado', () => {
  // El listener escucha `where('updatedAt', '>=', piso)`. En Firestore,
  // `removed` quiere decir «el doc SALIO de la query», y un doc reescrito con
  // un updatedAt mas viejo que el piso sale de ella sin dejar de existir
  // (medido en el SDK nativo de Android en la sesion 26: el `removed` trae la
  // version VIEJA, y un borrado de verdad llega igual). El motor lo borraba
  // de local, y como su copia en la nube queda bajo el piso, ningun enganche
  // la volvia a traer.
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  const HOUR = 60 * 60 * 1000;
  const DAY = 24 * HOUR;
  type Data = Record<string, unknown>;

  /** Un telefono con la coleccion ya sincronizada hasta `cursor`: el piso
   *  del listener queda en `cursor` menos el margen. */
  async function engineFor(uid: string, cursor: number, material = true) {
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('test', uid), String(cursor));
    const fixture = makeAdapter(
      material ? {getMaterialFields: () => ['value']} : {},
    );
    const engine = new SyncEngine();
    engine.register(fixture.adapter);
    await engine.start(uid);
    await settle();
    return {engine, ...fixture};
  }

  /** Una escritura en la nube (de este telefono o del otro). */
  function write(uid: string, id: string, data: Data): void {
    fireRemote(uid, [
      {type: 'modified', doc: {id, exists: true, data: () => data}},
    ]);
  }

  /** Un borrado de verdad en la nube: llega con su ultima version. */
  function hardDelete(uid: string, id: string, last: Data): void {
    fireRemote(uid, [
      {type: 'removed', doc: {id, exists: true, data: () => last}},
    ]);
  }

  /** Control del mecanismo: los `removed` que el listener entrego de verdad. */
  function removedDelivered(uid: string): string[] {
    return mockDelivered
      .filter(d => d.path === `users/${uid}/test` && d.type === 'removed')
      .map(d => d.id);
  }

  async function persisted(uid: string) {
    const unsettled = await AsyncStorage.getItem(
      unsettledStorageKey('test', uid),
    );
    const conflicted = await AsyncStorage.getItem(
      `@sync_conflicted_test:${uid}`,
    );
    return {
      unsettled: unsettled
        ? (JSON.parse(unsettled) as Record<string, number>)
        : {},
      conflicted: conflicted ? (JSON.parse(conflicted) as string[]) : [],
    };
  }

  function floorOf(uid: string): number {
    return mockCollections
      .get(`users/${uid}/test`)!
      .__whereClauses.find(c => c.field === 'updatedAt')?.value as number;
  }

  it('restaurar el respaldo de ayer: la fila restaurada sale como `removed` y NO se borra de local', async () => {
    const uid = 'uid-124-respaldo';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    // Hoy: la nota editada y subida; su eco entra en la query.
    const hoy = {value: 'editada hoy', updatedAt: T + 60_000};
    localStore.set('nota', hoy);
    write(uid, 'nota', hoy);
    await settle();
    // Restaurar el respaldo de ayer: importBackup escribe la fila en local y
    // la re-encola con el updatedAt DEL ARCHIVO, asi que su eco cae bajo el
    // piso del propio listener.
    const ayer = {value: 'la de ayer', updatedAt: T - DAY};
    localStore.set('nota', ayer);
    write(uid, 'nota', ayer);
    await settle();

    // Pre-fix: borrados ['nota'] y la fila restaurada desaparecia de local.
    expect({
      removed: removedDelivered(uid),
      borrados: remoteDeleteCalls,
      local: localStore.get('nota')?.value,
    }).toEqual({removed: ['nota'], borrados: [], local: 'la de ayer'});
    engine.stop();
  });

  it('el doc sigue en la nube: se trata como el cambio que es, igual que sin filtro', async () => {
    const uid = 'uid-124-como-sin-filtro';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteUpsertCalls} = await engineFor(uid, T);
    write(uid, 'doc-b', {value: 'v1', updatedAt: T + 60_000});
    await settle();
    // Aqui ya no esta (el usuario lo borro en este telefono), y el otro
    // telefono restaura un respaldo que lo trae con un updatedAt de ayer.
    localStore.delete('doc-b');
    write(uid, 'doc-b', {value: 'del respaldo del otro', updatedAt: T - DAY});
    await settle();

    // Sin filtro habria llegado como `modified` y el LWW lo aplicaba (no hay
    // copia local). Ignorar el `removed` lo perdia igual que borrarlo.
    expect({
      removed: removedDelivered(uid),
      aplicados: remoteUpsertCalls.map(c => c.data.value),
      local: localStore.get('doc-b')?.value,
    }).toEqual({
      removed: ['doc-b'],
      aplicados: ['v1', 'del respaldo del otro'],
      local: 'del respaldo del otro',
    });
    engine.stop();
  });

  it('R9-160: con un conflicto pendiente no toma nada, y el conflicto sigue retenido CON su marca y a su updatedAt nuevo: tras reiniciar vuelve', async () => {
    const uid = 'uid-124-conflicto';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    localStore.set('doc-c', {value: 'lo mio', updatedAt: T + 60_000});
    write(uid, 'doc-c', {value: 'lo suyo', updatedAt: T + 65_000});
    await settle();
    const conflictosAntes = engine.__getConflictsForTests().map(c => c.docId);
    // El otro telefono restaura un respaldo: el doc sale de la query.
    write(uid, 'doc-c', {value: 'su respaldo viejo', updatedAt: T - DAY});
    await settle();
    const p = await persisted(uid);
    engine.stop();
    await engine.start(uid);
    await settle();

    // Pre-fix: lo local se borraba y el doc salia del conjunto. Soltarlo a
    // ciegas (sin borrar) perdia la marca de conflicto en disco (R9-160).
    // Retenido a su updatedAt NUEVO, el piso baja hasta el y vuelve (R9-164),
    // y vuelve COMO conflicto aunque sea mas viejo que lo local (R9-181).
    expect({
      conflictosAntes,
      removed: removedDelivered(uid),
      local: localStore.get('doc-c')?.value,
      conflictos: engine.__getConflictsForTests().length,
      unsettled: p.unsettled['doc-c'] - T,
      conflicted: p.conflicted,
      pisoTrasReiniciar: floorOf(uid) - T,
    }).toEqual({
      conflictosAntes: ['doc-c'],
      removed: ['doc-c'],
      local: 'lo mio',
      // El reinicio vacia los de memoria (R9-65); lo vuelve a mostrar la
      // re-entrega al enganchar. Antes de R9-181, 0: el LWW lo asentaba solo.
      conflictos: 1,
      unsettled: -DAY,
      conflicted: ['doc-c'],
      pisoTrasReiniciar: -DAY - 1 - CURSOR_SAFETY_MARGIN_MS,
    });
    engine.stop();
  });

  it('R9-164: un doc retenido que sale de la query no deja el piso clavado', async () => {
    const uid = 'uid-124-retenido';
    const T = Date.now() - HOUR;
    const fixture = makeAdapter();
    const {adapter, localStore, remoteDeleteCalls} = fixture;
    let failOnce = true;
    adapter.getLocal = async (id: string) => {
      if (id === 'doc-s' && failOnce) {
        failOnce = false;
        throw new Error('SQLITE_BUSY');
      }
      return localStore.get(id) ?? null;
    };
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('test', uid), String(T));
    const engine = new SyncEngine();
    engine.register(adapter);
    await engine.start(uid);
    await settle();
    const mio = {value: 'mio', updatedAt: T + 60_000};
    localStore.set('doc-s', mio);
    write(uid, 'doc-s', mio); // su lectura falla: queda retenido (R9-46)
    await settle();
    const retenidoAntes = (await persisted(uid)).unsettled['doc-s'] - T;
    write(uid, 'doc-s', {value: 'viejo', updatedAt: T - DAY});
    await settle();
    const p = await persisted(uid);
    engine.stop();
    await engine.start(uid);
    await settle();

    expect({
      retenidoAntes,
      removed: removedDelivered(uid),
      borrados: remoteDeleteCalls,
      local: localStore.get('doc-s')?.value,
      unsettled: p.unsettled,
      pisoTrasReiniciar: floorOf(uid) - T,
    }).toEqual({
      retenidoAntes: 60_000,
      removed: ['doc-s'],
      borrados: [],
      local: 'mio',
      unsettled: {},
      pisoTrasReiniciar: -CURSOR_SAFETY_MARGIN_MS,
    });
    engine.stop();
  });

  it('un borrado DE VERDAD sigue borrando de local', async () => {
    const uid = 'uid-124-borrado';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    const v1 = {value: 'v1', updatedAt: T + 60_000};
    write(uid, 'doc-x', v1);
    await settle();
    const localAntes = localStore.get('doc-x')?.value;
    hardDelete(uid, 'doc-x', v1);
    await settle();

    expect({
      localAntes,
      borrados: remoteDeleteCalls,
      local: localStore.get('doc-x'),
      unsettled: (await persisted(uid)).unsettled,
    }).toEqual({
      localAntes: 'v1',
      borrados: ['doc-x'],
      local: undefined,
      unsettled: {},
    });
    engine.stop();
  });

  it('R9-160: un borrado de verdad con el conflicto pendiente no toca lo local, en memoria y tras reiniciar', async () => {
    const uid = 'uid-124-borrado-conflicto';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    localStore.set('doc-m', {value: 'lo mio m', updatedAt: T + 60_000});
    localStore.set('doc-r', {value: 'lo mio r', updatedAt: T + 60_000});
    const suyoM = {value: 'lo suyo m', updatedAt: T + 65_000};
    const suyoR = {value: 'lo suyo r', updatedAt: T + 65_000};
    write(uid, 'doc-m', suyoM);
    write(uid, 'doc-r', suyoR);
    await settle();
    const conflictosAntes = engine.__getConflictsForTests().map(c => c.docId);
    // doc-m: el conflicto esta en memoria.
    hardDelete(uid, 'doc-m', suyoM);
    await settle();
    const pendientesTrasM = engine.__getConflictsForTests().map(c => c.docId);
    // doc-r: tras reiniciar solo queda retenido con su marca en disco.
    engine.stop();
    await engine.start(uid);
    await settle();
    hardDelete(uid, 'doc-r', suyoR);
    await settle();

    // Ya no puede volver: se suelta del conjunto en los dos casos.
    expect({
      conflictosAntes,
      pendientesTrasM,
      borrados: remoteDeleteCalls,
      localM: localStore.get('doc-m')?.value,
      localR: localStore.get('doc-r')?.value,
      unsettled: (await persisted(uid)).unsettled,
    }).toEqual({
      conflictosAntes: ['doc-m', 'doc-r'],
      pendientesTrasM: ['doc-m', 'doc-r'],
      borrados: [],
      localM: 'lo mio m',
      localR: 'lo mio r',
      unsettled: {},
    });
    engine.stop();
  });

  it('R9-153: un stop() durante la lectura del doc corta el lote: no borra nada despues', async () => {
    const uid = 'uid-124-stop';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    const v1 = {value: 'v1', updatedAt: T + 60_000};
    write(uid, 'doc-x', v1);
    await settle();
    let release!: () => void;
    mockGetGate = (_path, id) =>
      id === 'doc-x' ? new Promise<void>(r => (release = r)) : undefined;
    hardDelete(uid, 'doc-x', v1);
    await flush();
    engine.stop();
    release();
    await settle();

    expect({
      borrados: remoteDeleteCalls,
      local: localStore.get('doc-x')?.value,
    }).toEqual({
      borrados: [],
      local: 'v1',
    });
  });

  it('la lectura va FUERA de la supresion: una edicion de este telefono mientras tanto se sube', async () => {
    const uid = 'uid-124-edicion';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    const v1 = {value: 'v1', updatedAt: T + 60_000};
    localStore.set('doc-e', v1);
    write(uid, 'doc-e', v1);
    await settle();
    let release!: () => void;
    mockGetGate = (_path, id) =>
      id === 'doc-e' ? new Promise<void>(r => (release = r)) : undefined;
    write(uid, 'doc-e', {value: 'respaldo viejo', updatedAt: T - DAY});
    await flush();
    // El usuario edita el doc mientras el motor pregunta si existe.
    const editada = {
      value: 'editada durante la lectura',
      updatedAt: T + 120_000,
    };
    localStore.set('doc-e', editada);
    engine.queueWrite('test', 'doc-e', editada);
    release();
    await settle();

    expect({
      removed: removedDelivered(uid),
      subidas: mockDocSets
        .filter(s => s.path === `users/${uid}/test` && s.id === 'doc-e')
        .map(s => (s.data as Data).value),
      local: localStore.get('doc-e')?.value,
    }).toEqual({
      removed: ['doc-e'],
      subidas: ['editada durante la lectura'],
      local: 'editada durante la lectura',
    });
    engine.stop();
  });

  it('si la lectura falla, no toca lo local y lo suelta del conjunto', async () => {
    const uid = 'uid-124-lectura-falla';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    const v1 = {value: 'v1', updatedAt: T + 60_000};
    localStore.set('doc-f', v1);
    write(uid, 'doc-f', v1);
    await settle();
    mockGetShouldFail = true;
    write(uid, 'doc-f', {value: 'viejo', updatedAt: T - DAY});
    await settle();

    expect({
      removed: removedDelivered(uid),
      borrados: remoteDeleteCalls,
      local: localStore.get('doc-f')?.value,
      unsettled: (await persisted(uid)).unsettled,
      avisado: loggerWarnSpy.mock.calls.some(([m]) =>
        String(m).includes('could not tell a removed doc'),
      ),
    }).toEqual({
      removed: ['doc-f'],
      borrados: [],
      local: 'v1',
      unsettled: {},
      avisado: true,
    });
    engine.stop();
  });

  it('R9-181: tras reiniciar, la re-entrega de la copia mas vieja vuelve a mostrar el conflicto: lo mio contra su respaldo', async () => {
    const uid = 'uid-181-reentrega';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    localStore.set('doc-c', {value: 'lo mio', updatedAt: T + 60_000});
    write(uid, 'doc-c', {value: 'lo suyo', updatedAt: T + 65_000});
    await settle();
    // El otro telefono restaura un respaldo: el doc sale de la query.
    const respaldo = {value: 'su respaldo viejo', updatedAt: T - DAY};
    write(uid, 'doc-c', respaldo);
    await settle();
    engine.stop();
    await engine.start(uid);
    await settle();
    // El SDK entrega en el primer snapshot todo lo que casa con el piso nuevo.
    const casaConElPiso = respaldo.updatedAt >= floorOf(uid);
    write(uid, 'doc-c', respaldo);
    await settle();

    // Pre-fix: el LWW se quedaba con lo local y la marca se iba: el conflicto
    // desaparecia sin que el usuario eligiera, y la nube (el respaldo) y este
    // telefono (lo mio) quedaban distintos para siempre.
    expect({
      casaConElPiso, // CONTROL
      removed: removedDelivered(uid), // CONTROL
      conflictos: engine
        .__getConflictsForTests()
        .map(c => [c.localVersion.value, c.remoteVersion.value]),
      local: localStore.get('doc-c')?.value,
      marca: await persisted(uid),
    }).toEqual({
      casaConElPiso: true,
      removed: ['doc-c'],
      conflictos: [['lo mio', 'su respaldo viejo']],
      local: 'lo mio',
      marca: {unsettled: {'doc-c': T - DAY}, conflicted: ['doc-c']},
    });
    engine.stop();
  });

  it('control R9-181: un doc retenido SIN la marca de conflicto (R9-46) no pasa a conflicto con la misma re-entrega mas vieja', async () => {
    // Solo la marca de conflicto vuelve a mostrar una copia mas vieja: un doc
    // retenido porque su lectura local fallo va por LWW, como antes.
    const uid = 'uid-181-control-46';
    const T = Date.now() - HOUR;
    const respaldo = {value: 'su respaldo viejo', updatedAt: T - DAY};
    await AsyncStorage.setItem(
      unsettledStorageKey('test', uid),
      JSON.stringify({'doc-c': respaldo.updatedAt}),
    );
    const {engine, localStore} = await engineFor(uid, T);
    localStore.set('doc-c', {value: 'lo mio', updatedAt: T + 60_000});
    const casaConElPiso = respaldo.updatedAt >= floorOf(uid);
    write(uid, 'doc-c', respaldo);
    await settle();

    expect({
      casaConElPiso, // CONTROL
      conflictos: engine.__getConflictsForTests().length,
      local: localStore.get('doc-c')?.value,
      marca: await persisted(uid),
    }).toEqual({
      casaConElPiso: true,
      conflictos: 0,
      local: 'lo mio',
      marca: {unsettled: {}, conflicted: []},
    });
    engine.stop();
  });

  /** RNFirebase corre la lectura y las escrituras en un solo hilo (R9-177), y
   *  el mock tambien: lo que este telefono escribe durante la lectura sale
   *  DESPUES de ella (con su eco), y la respuesta nunca lo trae. Retiene la
   *  lectura del doc hasta `releaseRead`. */
  function holdRead(docId: string) {
    let release!: () => void;
    mockGetGate = (_p, id) =>
      id === docId ? new Promise<void>(r => (release = r)) : undefined;
    return {releaseRead: () => release()};
  }

  it('R9-176: un borrado de verdad mientras el usuario edita el doc: la respuesta de la lectura no borra la edicion', async () => {
    const uid = 'uid-176-edita';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    const v1 = {value: 'v1', updatedAt: T + 60_000};
    localStore.set('doc-e', v1);
    write(uid, 'doc-e', v1);
    await settle();
    const hilo = holdRead('doc-e');
    hardDelete(uid, 'doc-e', v1);
    await flush();
    const editada = {
      value: 'editada durante la lectura',
      updatedAt: T + 120_000,
    };
    localStore.set('doc-e', editada);
    engine.queueWrite('test', 'doc-e', editada);
    await flush();
    const enCola = engine.__getQueueForTests().some(q => q.id === 'doc-e');
    hilo.releaseRead();
    await settle();
    const trasLectura = {
      borrados: [...remoteDeleteCalls],
      local: localStore.get('doc-e')?.value,
    };
    await settle();

    // Pre-fix: «no existe» borraba la edicion de local hasta que llegara su eco.
    expect({
      removed: removedDelivered(uid), // CONTROL
      enCola, // CONTROL
      trasLectura,
      subidas: mockDocSets
        .filter(s => s.path === `users/${uid}/test` && s.id === 'doc-e')
        .map(s => (s.data as Data).value),
    }).toEqual({
      removed: ['doc-e'],
      enCola: true,
      trasLectura: {borrados: [], local: 'editada durante la lectura'},
      subidas: ['editada durante la lectura'],
    });
    engine.stop();
  });

  it('R9-176: el otro restaura el doc mientras el usuario lo borra: la respuesta de la lectura no lo revive', async () => {
    const uid = 'uid-176-borra';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteUpsertCalls} = await engineFor(uid, T);
    const mio = {value: 'mio', updatedAt: T + 60_000};
    localStore.set('doc-e', mio);
    write(uid, 'doc-e', mio);
    await settle();
    const hilo = holdRead('doc-e');
    write(uid, 'doc-e', {value: 'su respaldo', updatedAt: T - DAY});
    await flush();
    localStore.delete('doc-e');
    engine.queueDelete('test', 'doc-e', mio);
    await flush();
    const enCola = engine.__getQueueForTests().some(q => q.id === 'doc-e');
    hilo.releaseRead();
    await settle();
    const trasLectura = {
      aplicados: remoteUpsertCalls.map(c => c.data.value),
      local: localStore.get('doc-e')?.value ?? null,
    };
    await settle();

    // Pre-fix: sin copia local con la que comparar, la version restaurada se
    // aplicaba y el doc resucitaba hasta que llegara el eco de la lapida.
    expect({
      removed: removedDelivered(uid), // CONTROL
      enCola, // CONTROL
      trasLectura,
    }).toEqual({
      removed: ['doc-e'],
      enCola: true,
      trasLectura: {aplicados: [], local: null},
    });
    engine.stop();
  });

  it('R9-176: una edicion encolada ANTES, que todavia no pudo subir, tampoco la borra la respuesta de la lectura', async () => {
    const uid = 'uid-176-antes';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    const v1 = {value: 'v1', updatedAt: T + 60_000};
    localStore.set('doc-e', v1);
    write(uid, 'doc-e', v1);
    await settle();
    mockSetShouldFail = true;
    const editada = {value: 'editada sin subir', updatedAt: T + 120_000};
    localStore.set('doc-e', editada);
    engine.queueWrite('test', 'doc-e', editada);
    await settle();
    mockSetShouldFail = false;
    const enCola = engine.__getQueueForTests().some(q => q.id === 'doc-e');
    hardDelete(uid, 'doc-e', v1);
    await settle();

    // Pre-fix: la edicion desaparecia de local hasta que su reintento subiera
    // y volviera el eco; y si se descartaba tras 8 intentos (R9-33), para
    // siempre.
    expect({
      removed: removedDelivered(uid), // CONTROL
      enCola, // CONTROL
      borrados: remoteDeleteCalls,
      local: localStore.get('doc-e')?.value,
    }).toEqual({
      removed: ['doc-e'],
      enCola: true,
      borrados: [],
      local: 'editada sin subir',
    });
    engine.stop();
  });

  /** Un conflicto L/R pendiente y retenido con su marca. */
  async function conflictFor(uid: string, T: number, L: Data, R: Data) {
    const w = await engineFor(uid, T);
    w.localStore.set('doc-c', L as unknown as SyncEntity<TestEntity>);
    write(uid, 'doc-c', R);
    await settle();
    // CONTROL: el conflicto existe y nada se aplico en local.
    expect({
      conflictos: w.engine.__getConflictsForTests().map(c => c.docId),
      local: w.localStore.get('doc-c')?.value,
    }).toEqual({conflictos: ['doc-c'], local: L.value});
    return w;
  }

  it('R9-178: keepMine durante la lectura de un borrado de verdad: lo que el usuario acaba de conservar no se borra', async () => {
    const uid = 'uid-178-keepmine';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore, remoteDeleteCalls} = await conflictFor(
      uid,
      T,
      L,
      R,
    );
    const hilo = holdRead('doc-c');
    hardDelete(uid, 'doc-c', R);
    await flush();
    await engine.resolveConflict('test__doc-c', 'keepMine');
    await flush();
    const enCola = engine.__getQueueForTests().some(q => q.id === 'doc-c');
    hilo.releaseRead();
    await settle();

    // Pre-fix: la resolucion quitaba la marca y «no existe» borraba L de local
    // hasta que llegara el eco de su subida.
    expect({
      removed: removedDelivered(uid), // CONTROL
      enCola, // CONTROL
      borrados: remoteDeleteCalls,
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      removed: ['doc-c'],
      enCola: true,
      borrados: [],
      local: 'lo mio',
    });
    engine.stop();
  });

  it('R9-178: keepMine durante la lectura, con la nube a menos de 30 s de lo local: no aparece un conflicto fantasma', async () => {
    const uid = 'uid-178-fantasma';
    const T = Date.now() - HOUR;
    const F = T - CURSOR_SAFETY_MARGIN_MS; // el piso de la query
    const L = {value: 'lo mio', updatedAt: F - 20_000};
    const R = {value: 'lo suyo', updatedAt: F + 5_000};
    const X = {value: 'su respaldo', updatedAt: F - 5_000};
    const {engine} = await conflictFor(uid, T, L, R);
    const hilo = holdRead('doc-c');
    write(uid, 'doc-c', X); // bajo el piso: sale de la query
    await flush();
    await engine.resolveConflict('test__doc-c', 'keepMine');
    await flush();
    const enCola = engine.__getQueueForTests().some(q => q.id === 'doc-c');
    // El eco de keepMine sale en cuanto vuelve la lectura (R9-177) y disuelve
    // el fantasma en el lote siguiente: el estado final no lo muestra. Se
    // anota cada lista de conflictos que el motor publica desde aqui.
    const vistos: string[][] = [];
    engine.subscribe(st => vistos.push(st.conflicts.map(c => c.docId)));
    hilo.releaseRead();
    await settle();

    // Pre-fix: justo despues de resolver aparecia un conflicto L/X (con su
    // marca en disco) hasta que llegaba el eco.
    expect({
      removed: removedDelivered(uid), // CONTROL
      enCola, // CONTROL
      publicados: vistos.length > 0, // CONTROL
      fantasma: vistos.some(v => v.includes('doc-c')),
      conflictos: engine.__getConflictsForTests().map(c => c.docId),
      marca: await persisted(uid),
    }).toEqual({
      removed: ['doc-c'],
      enCola: true,
      publicados: true,
      fantasma: false,
      conflictos: [],
      marca: {unsettled: {}, conflicted: []},
    });
    engine.stop();
  });

  it('control R9-178: keepTheirs sin subida durante la lectura de un borrado de verdad: lo local se borra, igual que la nube', async () => {
    // Nada de este telefono va a pisar la respuesta: aplicarla es converger.
    // Saltarla por «el conflicto se resolvio durante la lectura» dejaba en
    // local «lo suyo» de un doc que la nube ya no tiene.
    const uid = 'uid-178-keeptheirs';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore, remoteDeleteCalls} = await conflictFor(
      uid,
      T,
      L,
      R,
    );
    const hilo = holdRead('doc-c');
    hardDelete(uid, 'doc-c', R);
    await flush();
    await engine.resolveConflict('test__doc-c', 'keepTheirs');
    await flush();
    const trasResolver = localStore.get('doc-c')?.value;
    hilo.releaseRead();
    await settle();

    expect({
      removed: removedDelivered(uid), // CONTROL
      trasResolver, // CONTROL
      borrados: remoteDeleteCalls,
      local: localStore.get('doc-c')?.value ?? null,
      subidas: mockDocSets.filter(s => s.id === 'doc-c').length,
    }).toEqual({
      removed: ['doc-c'],
      trasResolver: 'lo suyo',
      borrados: ['doc-c'],
      local: null,
      subidas: 0,
    });
    engine.stop();
  });

  it('R9-185: con un conflicto retenido y una edicion mia en cola, el respaldo del otro no le quita la marca, y tras reiniciar el conflicto vuelve', async () => {
    const uid = 'uid-185-marca';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    // El usuario edita el doc y la subida falla: espera su reintento (R9-33).
    const editada = {value: 'lo mio editado', updatedAt: T + 120_000};
    localStore.set('doc-c', editada as unknown as SyncEntity<TestEntity>);
    mockSetShouldFail = true;
    engine.queueWrite('test', 'doc-c', editada);
    await settle();
    const cola = engine.__getQueueForTests().map(q => [q.id, q.attempts]);
    // El otro telefono restaura un respaldo: el doc sale de la query.
    const respaldo = {value: 'su respaldo viejo', updatedAt: T - DAY};
    write(uid, 'doc-c', respaldo);
    await settle();
    const marca = await persisted(uid);
    engine.stop();
    await engine.start(uid);
    await settle();

    // Pre-fix: la guarda de R9-176 soltaba el doc y la marca se borraba de
    // disco mientras la edicion esperaba; tras reiniciar no volvia ningun
    // conflicto, y la subida se quedaba con lo mio sin que el usuario eligiera.
    expect({
      removed: removedDelivered(uid), // CONTROL
      cola, // CONTROL: la edicion sigue en cola, tras un intento
      marca,
      conflictos: engine
        .__getConflictsForTests()
        .map(c => [c.localVersion.value, c.remoteVersion.value]),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      removed: ['doc-c'],
      cola: [['doc-c', 1]],
      marca: {unsettled: {'doc-c': T - DAY}, conflicted: ['doc-c']},
      conflictos: [['lo mio editado', 'su respaldo viejo']],
      local: 'lo mio editado',
    });
    engine.stop();
  });

  it('R9-176: con una edicion mia en cola, la lectura suelta un doc retenido SIN conflicto (R9-46): el piso no se queda en esa copia mientras la subida espera', async () => {
    const uid = 'uid-176-suelta';
    const T = Date.now() - HOUR;
    const F = T - CURSOR_SAFETY_MARGIN_MS; // el piso de la query
    const {engine, adapter, localStore} = await engineFor(uid, T);
    const v1 = {value: 'v1', updatedAt: T + 60_000};
    localStore.set('doc-e', v1);
    write(uid, 'doc-e', v1);
    await settle();
    mockSetShouldFail = true;
    const editada = {value: 'editada sin subir', updatedAt: T + 120_000};
    localStore.set('doc-e', editada);
    engine.queueWrite('test', 'doc-e', editada);
    await settle();
    // Un cambio del otro que este telefono no pudo leer en local: retenido
    // sin marca de conflicto (R9-46), por debajo del piso del proximo enganche.
    const getLocal = adapter.getLocal;
    adapter.getLocal = async () => {
      throw new Error('disco');
    };
    write(uid, 'doc-e', {value: 'suyo', updatedAt: F + 5_000});
    await settle();
    adapter.getLocal = getLocal;
    const retenido = await persisted(uid);
    // El otro restaura un respaldo: el doc sale de la query.
    write(uid, 'doc-e', {value: 'su respaldo', updatedAt: T - DAY});
    await settle();
    const marca = await persisted(uid);
    engine.stop();
    await engine.start(uid);
    await settle();

    expect({
      removed: removedDelivered(uid), // CONTROL
      cola: engine.__getQueueForTests().map(q => q.id), // CONTROL
      retenido, // CONTROL
      marca,
      piso: floorOf(uid) - F,
      local: localStore.get('doc-e')?.value,
    }).toEqual({
      removed: ['doc-e'],
      cola: ['doc-e'],
      retenido: {unsettled: {'doc-e': F + 5_000}, conflicted: []},
      marca: {unsettled: {}, conflicted: []},
      // el cursor (el eco de mi edicion) menos el margen, no la marca (5 s)
      piso: 120_000,
      local: 'editada sin subir',
    });
    engine.stop();
  });

  /** R9-186 — los conflictos retenidos que el proximo enganche tiene que leer. */
  async function rereadOf(uid: string): Promise<string[]> {
    const raw = await AsyncStorage.getItem(`@sync_reread_test:${uid}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  }

  it('R9-186: la lectura del `removed` de un conflicto retenido falla: conserva la marca, y el enganche siguiente lo lee y vuelve a mostrar el conflicto', async () => {
    const uid = 'uid-186-falla';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine} = await conflictFor(uid, T, L, R);
    mockGetShouldFail = true;
    write(uid, 'doc-c', {value: 'su respaldo viejo', updatedAt: T - DAY});
    await settle();
    const trasFallo = {
      marca: await persisted(uid),
      releer: await rereadOf(uid),
    };
    const avisado = loggerWarnSpy.mock.calls.some(([m]) =>
      String(m).includes('could not tell a removed doc'),
    );
    mockGetShouldFail = false;
    engine.stop();
    await engine.start(uid);
    await settle();

    // Pre-fix: la lectura fallida soltaba el doc y la marca se borraba de
    // disco; el doc ya esta fuera de la query, nada lo volvia a entregar, y
    // tras reiniciar el conflicto no volvia.
    expect({
      removed: removedDelivered(uid), // CONTROL
      avisado, // CONTROL: la lectura fallo
      trasFallo,
      conflictos: engine
        .__getConflictsForTests()
        .map(c => [c.localVersion.value, c.remoteVersion.value]),
      marca: await persisted(uid),
      releer: await rereadOf(uid),
    }).toEqual({
      removed: ['doc-c'],
      avisado: true,
      trasFallo: {
        marca: {unsettled: {'doc-c': T + 65_000}, conflicted: ['doc-c']},
        releer: ['doc-c'],
      },
      conflictos: [['lo mio', 'su respaldo viejo']],
      marca: {unsettled: {'doc-c': T - DAY}, conflicted: ['doc-c']},
      releer: [],
    });
    engine.stop();
  });

  it('R9-186: si la lectura del enganche siguiente tambien falla, lo deja para el otro', async () => {
    const uid = 'uid-186-otra-vez';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine} = await conflictFor(uid, T, L, R);
    mockGetShouldFail = true;
    write(uid, 'doc-c', {value: 'su respaldo viejo', updatedAt: T - DAY});
    await settle();
    engine.stop();
    await engine.start(uid);
    await settle();
    const trasOtroFallo = {
      conflictos: engine.__getConflictsForTests().length,
      releer: await rereadOf(uid),
    };
    mockGetShouldFail = false;
    engine.stop();
    await engine.start(uid);
    await settle();

    expect({
      trasOtroFallo,
      conflictos: engine
        .__getConflictsForTests()
        .map(c => [c.localVersion.value, c.remoteVersion.value]),
    }).toEqual({
      trasOtroFallo: {conflictos: 0, releer: ['doc-c']},
      conflictos: [['lo mio', 'su respaldo viejo']],
    });
    engine.stop();
  });

  const nubeDe = async (uid: string, id: string) => {
    const snap = await mockCollections.get(`users/${uid}/test`)!.doc(id).get();
    return snap.exists ? ((snap.data() as Data).value as string) : null;
  };
  const suyaDe = (engine: SyncEngine) =>
    engine.__getConflictsForTests().map(c => c.remoteVersion.value);

  it('R9-190: mi propio respaldo, restaurado con un conflicto retenido, no se lleva la marca: tras reiniciar no aparece «lo mio contra lo mio»', async () => {
    const uid = 'uid-190-propio';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    const vistos: string[] = [];
    engine.subscribe(st =>
      vistos.push(
        ...st.conflicts.map(
          c => `${c.localVersion.value}|${c.remoteVersion.value}`,
        ),
      ),
    );
    // importBackup: local y cola con el updatedAt del archivo, bajo el piso.
    const W0 = {value: 'mi respaldo', updatedAt: T - 2 * DAY};
    localStore.set('doc-c', W0 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', W0);
    await settle();
    // El usuario edita otra vez, y esa subida falla: espera su reintento.
    const W2 = {value: 'lo mio nuevo', updatedAt: T + 300_000};
    localStore.set('doc-c', W2 as unknown as SyncEntity<TestEntity>);
    mockSetShouldFail = true;
    engine.queueWrite('test', 'doc-c', W2);
    await settle();
    mockSetShouldFail = false;
    const cola = engine.__getQueueForTests().map(q => [q.id, q.attempts]);
    engine.stop();
    await engine.start(uid);
    await settle();

    // Pre-fix: la guarda (R9-185) pasaba la marca a MI respaldo, y tras
    // reiniciar `remoteTs === heldAt` lo mostraba como «su version» contra W2;
    // elegir «lo suyo» perdia W2.
    expect({
      removed: removedDelivered(uid), // CONTROL: el eco de W0 y la reversion de W2
      nube: await nubeDe(uid, 'doc-c'), // CONTROL: W0 llego a la nube
      cola, // CONTROL: W2 en cola tras un intento
      // cualquier lista publicada con MI respaldo como «su version»
      fantasma: vistos.filter(v => v.endsWith('|mi respaldo')),
      conflictos: engine.__getConflictsForTests().map(c => c.docId),
      marca: await persisted(uid),
    }).toEqual({
      removed: ['doc-c', 'doc-c'],
      nube: 'mi respaldo',
      cola: [['doc-c', 1]],
      fantasma: [],
      conflictos: [],
      marca: {unsettled: {}, conflicted: []},
    });
    engine.stop();
  });

  it('R9-190: mi respaldo leido ANTES de que el servidor confirme su subida tampoco se lleva la marca', async () => {
    // La lectura del `removed` de mi eco puede volver antes que el ack: la
    // escritura sigue en la cola, y es su copia la que encuentra.
    const uid = 'uid-190-sin-ack';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    let ack!: () => void;
    mockSetGate = (_p, id) =>
      id === 'doc-c' ? new Promise<void>(r => (ack = r)) : undefined;
    const W0 = {value: 'mi respaldo', updatedAt: T - 2 * DAY};
    localStore.set('doc-c', W0 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', W0);
    await settle();
    const enCola = engine.__getQueueForTests().map(q => q.id);
    const marca = await persisted(uid);
    // El usuario edita otra vez, y la app se cierra antes del ack.
    const W2 = {value: 'lo mio nuevo', updatedAt: T + 300_000};
    localStore.set('doc-c', W2 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', W2);
    engine.stop();
    mockSetGate = null;
    ack();
    await engine.start(uid);
    await settle();

    // Sin reconocer la escritura en cola como propia, la marca pasaba a mi
    // respaldo mientras el ack no llegaba (medido: la marca, no un fantasma
    // tras este reinicio; el fantasma lo muestra la prueba de arriba).
    expect({
      removed: removedDelivered(uid), // CONTROL: el eco de W0 salio de la query
      enCola, // CONTROL: W0 seguia en cola cuando volvio la lectura
      marca,
      conflictos: engine
        .__getConflictsForTests()
        .map(c => [c.localVersion.value, c.remoteVersion.value]),
    }).toEqual({
      removed: ['doc-c'],
      enCola: ['doc-c'],
      marca: {unsettled: {}, conflicted: []},
      conflictos: [],
    });
    engine.stop();
  });

  it('R9-190: lo que el servidor le tomo a Ana no hace «mia» una copia de Beto con el mismo reloj', async () => {
    // El mismo milisegundo en las dos cuentas es a proposito. Con los sellos
    // de R9-193 es un control: la escritura de Ana no es de un doc en
    // conflicto, y su sello no se anota. Que los sellos de una cuenta no
    // valgan para otra lo vigila «R9-193: los sellos de Ana no hacen…».
    const ana = 'uid-190-ana';
    const beto = 'uid-190-beto';
    const T = Date.now() - HOUR;
    const K = T - DAY;
    const {engine, localStore} = await engineFor(ana, T);
    const deAna = {value: 'de ana', updatedAt: K};
    localStore.set('doc-c', deAna as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', deAna);
    await settle();
    const subioAna = mockDocSets.some(
      s => s.path === `users/${ana}/test` && s.id === 'doc-c',
    );
    engine.stop();
    // Beto, en el mismo telefono: conflicto L/R retenido en doc-c.
    await AsyncStorage.setItem(`@sync_first_push_done:${beto}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('test', beto), String(T));
    localStore.set('doc-c', {
      value: 'lo mio',
      updatedAt: T + 60_000,
    } as unknown as SyncEntity<TestEntity>);
    await engine.start(beto);
    await settle();
    write(beto, 'doc-c', {value: 'lo suyo', updatedAt: T + 65_000});
    await settle();
    const conflicto = suyaDe(engine);
    // Beto edita y la subida falla; su otro telefono restaura un respaldo con
    // el reloj K.
    const editada = {value: 'lo mio editado', updatedAt: T + 120_000};
    localStore.set('doc-c', editada as unknown as SyncEntity<TestEntity>);
    mockSetShouldFail = true;
    engine.queueWrite('test', 'doc-c', editada);
    await settle();
    write(beto, 'doc-c', {value: 'respaldo de beto', updatedAt: K});
    await settle();
    mockSetShouldFail = false;
    engine.stop();
    await engine.start(beto);
    await settle();

    expect({
      subioAna, // CONTROL
      conflicto, // CONTROL
      removed: removedDelivered(beto), // CONTROL
      conflictos: suyaDe(engine),
    }).toEqual({
      subioAna: true,
      conflicto: ['lo suyo'],
      removed: ['doc-c'],
      conflictos: ['respaldo de beto'],
    });
    engine.stop();
  });

  it('R9-191: la lista de releer ilegible en un arranque: el conflicto vuelve igual, y no queda perdido tras guardar el conjunto y reiniciar', async () => {
    const uid = 'uid-191-ilegible';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    mockGetShouldFail = true;
    write(uid, 'doc-c', {value: 'su respaldo viejo', updatedAt: T - DAY});
    await settle();
    mockGetShouldFail = false;
    const releer = await rereadOf(uid);
    const getItemMock = AsyncStorage.getItem as unknown as jest.Mock;
    const realImpl = getItemMock.getMockImplementation()!;
    let arranque1: unknown;
    let avisado = false;
    try {
      getItemMock.mockImplementation((k: string) =>
        k.startsWith('@sync_reread_')
          ? Promise.reject(new Error('disco'))
          : realImpl(k),
      );
      engine.stop();
      await engine.start(uid);
      await settle();
      getItemMock.mockImplementation(realImpl);
      avisado = loggerWarnSpy.mock.calls.some(([m]) =>
        String(m).includes('conflicts to read again'),
      );
      arranque1 = suyaDe(engine);
      // Otro conflicto, resuelto en esta sesion: guarda el conjunto.
      localStore.set('doc-d', {
        value: 'd mio',
        updatedAt: T + 600_000,
      } as unknown as SyncEntity<TestEntity>);
      write(uid, 'doc-d', {value: 'd suyo', updatedAt: T + 605_000});
      await settle();
      await engine.resolveConflict('test__doc-d', 'keepMine');
      await settle();
    } finally {
      getItemMock.mockImplementation(realImpl);
    }
    engine.stop();
    await engine.start(uid);
    await settle();

    // Pre-fix: sin la lista nadie releia el doc (fuera de la query), la marca
    // quedaba en «lo suyo» clavando el piso, el guardado borraba la lista, y
    // el conflicto no volvia nunca.
    expect({
      releer, // CONTROL
      avisado, // CONTROL: la lectura de la lista fallo
      arranque1,
      conflictos: suyaDe(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      releer: ['doc-c'],
      avisado: true,
      arranque1: ['su respaldo viejo'],
      conflictos: ['su respaldo viejo'],
      local: 'lo mio',
    });
    engine.stop();
  });

  /** R9-196 — el conflicto L/R con L2 ya subida (su sello es propio) y L3
   *  despues: en cola (`descartada` false) o descartada tras 8 rechazos
   *  (R9-33). Devuelve el motor listo para reiniciar. */
  async function conL2SubidaYL3(uid: string, descartada: boolean) {
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    const L2 = {value: 'lo mio 2', updatedAt: T + 120_000};
    localStore.set('doc-c', L2 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L2);
    await settle();
    const L3 = {value: 'lo mio 3', updatedAt: T + 180_000};
    localStore.set('doc-c', L3 as unknown as SyncEntity<TestEntity>);
    mockSetShouldFail = true;
    engine.queueWrite('test', 'doc-c', L3);
    await settle();
    if (descartada) {
      const realNow = Date.now();
      const nowSpy = jest.spyOn(Date, 'now');
      for (let i = 1; i <= 7; i++) {
        nowSpy.mockReturnValue(realNow + i * HOUR);
        await engine.__flushForTests();
        await settle();
      }
      nowSpy.mockRestore();
    }
    mockSetShouldFail = false;
    return {engine, localStore};
  }

  /** R9-196 — reinicia con la lista de releer ilegible (R9-191: se releen
   *  todos los conflictos retenidos) y anota cada par de conflicto que el
   *  motor publica desde el reinicio. */
  async function reiniciarSinListaDeReleer(engine: SyncEngine, uid: string) {
    const getItemMock = AsyncStorage.getItem as unknown as jest.Mock;
    const realImpl = getItemMock.getMockImplementation()!;
    const lecturas = () =>
      mockCollections.get(`users/${uid}/test`)!.doc('doc-c').get.mock.calls
        .length;
    const vistos = new Set<string>();
    engine.stop();
    const l0 = lecturas();
    engine.subscribe(st =>
      st.conflicts.forEach(c =>
        vistos.add(`${c.localVersion.value}|${c.remoteVersion.value}`),
      ),
    );
    try {
      getItemMock.mockImplementation((k: string) =>
        k.startsWith('@sync_reread_')
          ? Promise.reject(new Error('disco'))
          : realImpl(k),
      );
      await engine.start(uid);
      await settle();
    } finally {
      getItemMock.mockImplementation(realImpl);
    }
    return {lecturas: lecturas() - l0, vistos};
  }

  it('R9-196: con la lista de releer ilegible, la relectura de un conflicto con mi edicion en cola no muestra «lo mio contra lo mio»', async () => {
    const uid = 'uid-196-cola';
    const {engine, localStore} = await conL2SubidaYL3(uid, false);
    const cola = engine.__getQueueForTests().map(q => [q.id, q.attempts]);
    const nube = await nubeDe(uid, 'doc-c');
    const {lecturas, vistos} = await reiniciarSinListaDeReleer(engine, uid);

    // Pre-fix (sellos solo en memoria, `ownAcked`): tras el reinicio la
    // copia leida, L2, no se reconocia como mia; la guarda le pasaba la marca
    // y su entrega llegaba a `remoteTs === heldAt`: «lo mio 3 | lo mio 2».
    expect({
      cola, // CONTROL: L3 en cola tras un intento
      nube, // CONTROL: L2 subio
      lecturas, // CONTROL: el enganche releyo el doc
      vistos: [...vistos],
      enCola: engine.__getQueueForTests().map(q => q.id),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      cola: [['doc-c', 1]],
      nube: 'lo mio 2',
      lecturas: 1,
      vistos: [],
      enCola: ['doc-c'],
      local: 'lo mio 3',
    });
    engine.stop();
  });

  it('R9-196: con la lista de releer ilegible, una copia mia leida sin nada en cola (mi edicion siguiente se descarto) no muestra «lo mio contra lo mio», ni tras otro reinicio', async () => {
    const uid = 'uid-196-descartada';
    const {engine, localStore} = await conL2SubidaYL3(uid, true);
    const cola = engine.__getQueueForTests().length;
    const nube = await nubeDe(uid, 'doc-c');
    const {lecturas, vistos} = await reiniciarSinListaDeReleer(engine, uid);
    engine.stop();
    await engine.start(uid);
    await settle();

    // Pre-fix: la rama retenida tomaba toda copia leida (`fromRead`), fuera
    // cual fuera su edad, y registraba L2 contra L3; la marca quedaba en L2 y
    // volvia en cada reinicio. Lo local (L3) y la nube (L2) siguen distintos:
    // una edicion descartada que no vuelve a subir es R9-38, no esto.
    expect({
      cola, // CONTROL: L3 se descarto
      nube, // CONTROL: L2 subio
      lecturas, // CONTROL: el enganche releyo el doc
      vistos: [...vistos],
      trasOtroReinicio: engine.__getConflictsForTests().length,
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      cola: 0,
      nube: 'lo mio 2',
      lecturas: 1,
      vistos: [],
      trasOtroReinicio: 0,
      local: 'lo mio 3',
    });
    engine.stop();
  });

  it('R9-192: con una edicion mia en cola, el respaldo del otro pasa a ser «su version» del conflicto, y keepTheirs deja local y nube en ese respaldo', async () => {
    const uid = 'uid-192-cola';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    const editada = {value: 'lo mio editado', updatedAt: T + 120_000};
    localStore.set('doc-c', editada as unknown as SyncEntity<TestEntity>);
    mockSetShouldFail = true;
    engine.queueWrite('test', 'doc-c', editada);
    await settle();
    write(uid, 'doc-c', {value: 'su respaldo viejo', updatedAt: T - DAY});
    await settle();
    mockSetShouldFail = false;
    const cola = engine.__getQueueForTests().map(q => [q.id, q.attempts]);
    const suya = suyaDe(engine);
    await engine.resolveConflict('test__doc-c', 'keepTheirs');
    await settle();
    await engine.__flushForTests();
    await settle();

    // Pre-fix: la guarda no refrescaba el conflicto: seguia mostrando «lo
    // suyo», que la nube ya no tenia, y keepTheirs lo subia encima del
    // respaldo del otro.
    expect({
      removed: removedDelivered(uid), // CONTROL
      cola, // CONTROL: la edicion sigue en cola
      suya,
      local: localStore.get('doc-c')?.value,
      nube: await nubeDe(uid, 'doc-c'),
    }).toEqual({
      removed: ['doc-c'],
      cola: [['doc-c', 1]],
      suya: ['su respaldo viejo'],
      local: 'su respaldo viejo',
      nube: 'su respaldo viejo',
    });
    engine.stop();
  });

  it('R9-192: si el respaldo que encuentra la guarda coincide con mi version de cuando se detecto el conflicto, el conflicto conserva el campo en disputa', async () => {
    const uid = 'uid-192-igual';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    const editada = {value: 'lo mio editado', updatedAt: T + 120_000};
    localStore.set('doc-c', editada as unknown as SyncEntity<TestEntity>);
    mockSetShouldFail = true;
    engine.queueWrite('test', 'doc-c', editada);
    await settle();
    // El otro restaura un respaldo que trae MI version de entonces.
    write(uid, 'doc-c', {value: 'lo mio', updatedAt: T - DAY});
    await settle();
    mockSetShouldFail = false;

    // Comparada con la foto local del conflicto, esa copia no difiere en nada:
    // sin conservar los campos de antes, `differingFields` quedaba vacio (la
    // pantalla de conflictos muestra y mezcla solo esos campos: leido en
    // `app/(tabs)/conflicts.tsx`, no medido aqui).
    expect({
      removed: removedDelivered(uid), // CONTROL
      cola: engine.__getQueueForTests().map(q => [q.id, q.attempts]), // CONTROL
      conflictos: engine
        .__getConflictsForTests()
        .map(c => [c.remoteVersion.value, [...c.differingFields]]),
    }).toEqual({
      removed: ['doc-c'],
      cola: [['doc-c', 1]],
      conflictos: [['lo mio', ['value']]],
    });
    engine.stop();
  });

  it('R9-192: sin escrituras mias, el respaldo del otro leido tras el `removed` pasa a ser «su version», y keepTheirs no deja local y nube distintos', async () => {
    const uid = 'uid-192-leida';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    write(uid, 'doc-c', {value: 'su respaldo viejo', updatedAt: T - DAY});
    await settle();
    const suya = suyaDe(engine);
    await engine.resolveConflict('test__doc-c', 'keepTheirs');
    await settle();
    engine.stop();
    await engine.start(uid);
    await settle();

    // Pre-fix: la rama `pending` tomaba la copia leida por un eco propio (mas
    // vieja que lo local): el conflicto seguia en «lo suyo», keepTheirs lo
    // aplicaba sin subir, y la nube se quedaba en el respaldo, bajo el piso.
    expect({
      removed: removedDelivered(uid), // CONTROL
      suya,
      local: localStore.get('doc-c')?.value,
      nube: await nubeDe(uid, 'doc-c'),
      conflictos: engine.__getConflictsForTests().length,
    }).toEqual({
      removed: ['doc-c'],
      suya: ['su respaldo viejo'],
      local: 'su respaldo viejo',
      nube: 'su respaldo viejo',
      conflictos: 0,
    });
    engine.stop();
  });

  it('R9-192: la relectura del enganche lee Z; detras llega Y (entra) y el `removed` real de Z: el conflicto termina en Z, no en Y', async () => {
    const uid = 'uid-192-relectura';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    mockGetShouldFail = true;
    write(uid, 'doc-c', {value: 'su respaldo viejo', updatedAt: T - DAY});
    await settle();
    mockGetShouldFail = false;
    const releer = await rereadOf(uid);
    engine.stop();
    const hilo = holdRead('doc-c');
    await engine.start(uid);
    await settle();
    write(uid, 'doc-c', {value: 'Y nuevo', updatedAt: T + 400_000});
    await settle();
    write(uid, 'doc-c', {value: 'Z viejo', updatedAt: T - 3 * DAY});
    await settle();
    hilo.releaseRead();
    mockGetGate = null;
    await settle();
    const suya = suyaDe(engine);
    await engine.resolveConflict('test__doc-c', 'keepTheirs');
    await settle();

    // Pre-fix: la entrega de Y (mas nueva que lo local) quedaba como «su
    // version», y la lectura de Z (mas vieja) se descartaba: keepTheirs dejaba
    // Y en local con la nube en Z.
    expect({
      releer, // CONTROL: el enganche tenia que releer
      removed: removedDelivered(uid), // CONTROL: el de X y el REAL de Z
      suya,
      local: localStore.get('doc-c')?.value,
      nube: await nubeDe(uid, 'doc-c'),
    }).toEqual({
      releer: ['doc-c'],
      removed: ['doc-c', 'doc-c'],
      suya: ['Z viejo'],
      local: 'Z viejo',
      nube: 'Z viejo',
    });
    engine.stop();
  });

  it('R9-186: la lectura vence el plazo: la marca queda y el proceso siguiente lo lee', async () => {
    const uid = 'uid-186-plazo';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, adapter} = await conflictFor(uid, T, L, R);
    engine.__setLookupTimeoutForTests(30);
    mockGetGate = (_p, id) =>
      id === 'doc-c' ? new Promise<void>(() => {}) : undefined;
    write(uid, 'doc-c', {value: 'su respaldo viejo', updatedAt: T - DAY});
    await settle();
    await new Promise(r => setTimeout(r, 80));
    await settle();
    const trasPlazo = {
      marca: await persisted(uid),
      releer: await rereadOf(uid),
    };
    engine.stop();
    // Otro proceso: la lectura colgada ya no ocupa el unico hilo de RNFirebase
    // (R9-177), que un stop() no libera.
    mockGetGate = null;
    mockExecutorTail = Promise.resolve();
    const otro = new SyncEngine();
    otro.register(adapter);
    await otro.start(uid);
    await settle();

    expect({
      removed: removedDelivered(uid), // CONTROL
      trasPlazo,
      conflictos: otro
        .__getConflictsForTests()
        .map(c => [c.localVersion.value, c.remoteVersion.value]),
    }).toEqual({
      removed: ['doc-c'],
      trasPlazo: {
        marca: {unsettled: {'doc-c': T + 65_000}, conflicted: ['doc-c']},
        releer: ['doc-c'],
      },
      conflictos: [['lo mio', 'su respaldo viejo']],
    });
    otro.stop();
  });

  // ---- R9-193 — «¿esta copia es mia?»: los sellos propios ----

  /** R9-193 — la lista de conflictos, como [lo mio, lo suyo]. */
  const parejas = (engine: SyncEngine) =>
    engine
      .__getConflictsForTests()
      .map(c => [c.localVersion.value, c.remoteVersion.value]);

  /** R9-193 — el proceso muere: desde `morir()`, ninguna escritura de
   *  AsyncStorage llega a disco (en el mock, `setItem` y `removeItem` pasan
   *  por `multiSet` y `multiRemove`); `morirTras(f)` muere justo despues de
   *  la primera escritura que cumple `f`. `revivir()` en un `finally`. */
  function caida() {
    type Pairs = Array<[string, string]>;
    const store = AsyncStorage as unknown as {
      multiSet: jest.Mock;
      multiRemove: jest.Mock;
    };
    const realSet = store.multiSet.getMockImplementation()!;
    const realRemove = store.multiRemove.getMockImplementation()!;
    let dead = false;
    let after: ((pairs: Pairs) => boolean) | null = null;
    store.multiSet.mockImplementation((pairs: Pairs, cb?: unknown) => {
      if (dead) return Promise.resolve(null);
      const r = realSet(pairs, cb);
      if (after?.(pairs)) {
        dead = true;
        after = null;
      }
      return r;
    });
    store.multiRemove.mockImplementation((keys: string[], cb?: unknown) =>
      dead ? Promise.resolve(null) : realRemove(keys, cb),
    );
    return {
      morir: () => {
        dead = true;
      },
      morirTras: (f: (pairs: Pairs) => boolean) => {
        after = f;
      },
      murio: () => dead,
      revivir: () => {
        store.multiSet.mockImplementation(realSet);
        store.multiRemove.mockImplementation(realRemove);
        dead = false;
        after = null;
      },
    };
  }

  /** R9-193 — el reloj de un payload, relativo a T. */
  const updatedAtRel = (data: object, T: number) =>
    ((data as Data).updatedAt as number) - T;

  /** R9-193 — la cola de una escritura de AsyncStorage, si la trae. */
  const colaEn = (pairs: Array<[string, string]>) => {
    const raw = pairs.find(([k]) => k === '@sync_queue_v1')?.[1];
    return raw === undefined
      ? undefined
      : (JSON.parse(raw) as Array<{id: string; data: Data}>);
  };

  /** R9-193 — un proceso nuevo (la memoria del anterior se perdio), sin red. */
  async function procesoNuevo(uid: string, adapter: SyncAdapter<TestEntity>) {
    const netInfo = jest.requireMock('@react-native-community/netinfo')
      .default as {fetch: jest.Mock};
    netInfo.fetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });
    const otro = new SyncEngine();
    otro.register(adapter);
    await otro.start(uid);
    await settle();
    return otro;
  }

  it('R9-193: el otro telefono, con el reloj atrasado, escribe con la app cerrada: su copia, mas vieja que lo mio y fuera de la ventana, vuelve a mostrar el conflicto tras reiniciar', async () => {
    const uid = 'uid-193-cerrada';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    engine.stop();
    // Con la app cerrada, el otro escribe R2 con el reloj 2 min atrasado: mas
    // vieja que L, fuera de la ventana de 30 s y por encima del piso.
    const R2 = {
      value: 'R2: su reloj atrasado',
      updatedAt: L.updatedAt - 120_000,
    };
    write(uid, 'doc-c', R2);
    const entregasAntes = mockDelivered.length;
    await engine.start(uid);
    await settle();

    // Pre-fix: la rama del conflicto retenido la tomaba por una escritura mia
    // anterior; el LWW se quedaba con L, `settle` borraba la marca, y el
    // conflicto desaparecia sin que el usuario eligiera, con la nube en R2 y
    // este telefono en L.
    expect({
      entregada: mockDelivered // CONTROL: el enganche entrega R2
        .slice(entregasAntes)
        .map(d => `${d.id}/${d.type}/${d.via}`),
      conflictos: parejas(engine),
      local: localStore.get('doc-c')?.value,
      nube: await nubeDe(uid, 'doc-c'),
      marca: await persisted(uid),
    }).toEqual({
      entregada: ['doc-c/added/attach'],
      conflictos: [['lo mio', R2.value]],
      local: 'lo mio',
      nube: R2.value,
      marca: {unsettled: {'doc-c': R2.updatedAt}, conflicted: ['doc-c']},
    });
    engine.stop();
  });

  it('R9-193: sigo escribiendo y el otro, con el reloj 2 min atrasado, escribe casi a la vez: su copia mas vieja que la mia pasa a ser «su version» al llegar, y el conflicto sigue tras reiniciar', async () => {
    // El otro telefono va 2 min atrasado: R, escrita a las T+185 reales, lleva
    // T+65; el usuario sigue escribiendo aqui (L1, a las T+190), y el otro
    // escribe R2 a las T+190 reales, sellada T+70.
    const uid = 'uid-193-sigo';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    const L1 = {value: 'L1: sigo escribiendo', updatedAt: T + 190_000};
    localStore.set('doc-c', L1 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L1);
    await settle();
    await engine.__flushForTests();
    await settle();
    const subioL1 = mockDocSets.some(
      s =>
        s.path === `users/${uid}/test` &&
        s.id === 'doc-c' &&
        (s.data as Data).value === L1.value,
    );
    // El dano es pasajero hasta el reinicio: se anota cada lista publicada.
    const vistos: unknown[][] = [];
    engine.subscribe(st =>
      vistos.push(st.conflicts.map(c => c.remoteVersion.value)),
    );
    const R2 = {value: 'R2: su reloj atrasado', updatedAt: T + 70_000};
    write(uid, 'doc-c', R2);
    await settle();
    const alLlegar = engine
      .__getConflictsForTests()
      .map(c => c.remoteVersion.value);
    engine.stop();
    await engine.start(uid);
    await settle();

    // Pre-fix: con el conflicto en memoria, R2 (mas vieja que L1) se tomaba
    // por el eco de una escritura mia: «su version» seguia en R, que ya no
    // esta en la nube. Tras reiniciar, la rama retenida hacia lo mismo, y el
    // conflicto desaparecia con la nube en R2 y este telefono en L1.
    expect({
      subioL1, // CONTROL
      alLlegar,
      publicoR2: vistos.some(v => v.includes(R2.value)),
      conflictos: parejas(engine),
      local: localStore.get('doc-c')?.value,
      marca: await persisted(uid),
    }).toEqual({
      subioL1: true,
      alLlegar: [R2.value],
      publicoR2: true,
      conflictos: [[L1.value, R2.value]],
      local: L1.value,
      marca: {unsettled: {'doc-c': R2.updatedAt}, conflicted: ['doc-c']},
    });
    engine.stop();
  });

  it('R9-193: con el conflicto en memoria, «quedarme con lo suyo» aplica la copia atrasada del otro que esta en la nube, no la foto R: la nube y el telefono quedan iguales', async () => {
    const uid = 'uid-193-suyo';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    const R2 = {
      value: 'R2: su reloj atrasado',
      updatedAt: L.updatedAt - 120_000,
    };
    write(uid, 'doc-c', R2);
    await settle();
    const suVersion = suyaDe(engine);
    await engine.resolveConflict('test__doc-c', 'keepTheirs');
    await settle();
    await engine.__flushForTests();
    await settle();

    // Pre-fix: «su version» era R; keepTheirs aplicaba R y no subia nada (la
    // nube «ya lo tiene»): este telefono en R y la nube en R2, para siempre,
    // sin conflicto ni marca.
    expect({
      suVersion,
      local: localStore.get('doc-c')?.value,
      nube: await nubeDe(uid, 'doc-c'),
      subidas: mockDocSets.filter(s => s.id === 'doc-c').length,
    }).toEqual({
      suVersion: [R2.value],
      local: R2.value,
      nube: R2.value,
      subidas: 0,
    });
    engine.stop();
  });

  it('R9-193 (control): una escritura mia encolada ANTES del conflicto, que sube despues, no pasa a ser «su version» tras reiniciar', async () => {
    // Pasa sin R9-193 (toda copia mas vieja era mia). Con los sellos vigila
    // que el servidor, al tomarla con el conflicto ya abierto, la deje anotada.
    const uid = 'uid-193-antes';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    // L se escribe sin red: queda en la cola.
    engine.__setOnlineForTests(false);
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    localStore.set('doc-c', L);
    engine.queueWrite('test', 'doc-c', L);
    await settle();
    // El stream reconecta antes que NetInfo: llega R y hay conflicto.
    write(uid, 'doc-c', {value: 'lo suyo', updatedAt: T + 65_000});
    await settle();
    const conflicto = engine.__getConflictsForTests().map(c => c.docId);
    // Vuelve la red: L sube y pisa a R en la nube.
    engine.__setOnlineForTests(true);
    await settle();
    await engine.__flushForTests();
    await settle();
    // L1 se escribe sin red, y la app se cierra antes de subirla.
    engine.__setOnlineForTests(false);
    const L1 = {value: 'L1: sin subir', updatedAt: T + 120_000};
    localStore.set('doc-c', L1);
    engine.queueWrite('test', 'doc-c', L1);
    await settle();
    const netInfo = jest.requireMock('@react-native-community/netinfo')
      .default as {fetch: jest.Mock};
    netInfo.fetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });
    engine.stop();
    await engine.start(uid);
    await settle();

    expect({
      conflicto, // CONTROL
      nube: await nubeDe(uid, 'doc-c'), // CONTROL: una copia mia, mas vieja
      cola: engine.__getQueueForTests().map(q => q.id), // CONTROL
      conflictos: parejas(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      conflicto: ['doc-c'],
      nube: 'lo mio',
      cola: ['doc-c'],
      conflictos: [],
      local: 'L1: sin subir',
    });
    engine.stop();
  });

  it('R9-193: el proceso muere justo despues de guardar la cola sin mi escritura ya subida, y lo que escribi despues no llego a la cola: tras reiniciar no aparece «lo mio contra lo mio»', async () => {
    // Pasa sin R9-193 (toda copia mas vieja era mia). Vigila que los sellos
    // no abran este fantasma: la tabla va en la MISMA escritura que la cola.
    const uid = 'uid-193-caida';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore, adapter} = await conflictFor(uid, T, L, R);
    const disco = caida();
    let otro: SyncEngine | null = null;
    try {
      const L1 = {value: 'L1: tecleo', updatedAt: T + 120_000};
      // Muere justo despues de la escritura de la cola que ya no tiene L1 (la
      // del final del flush, tras el ack).
      disco.morirTras(pairs => {
        const cola = colaEn(pairs);
        return (
          cola !== undefined &&
          !cola.some(q => q.data.updatedAt === L1.updatedAt)
        );
      });
      localStore.set('doc-c', L1 as unknown as SyncEntity<TestEntity>);
      engine.queueWrite('test', 'doc-c', L1);
      await settle();
      await engine.__flushForTests();
      await settle();
      const murioTrasSubir = disco.murio();
      // L2 llega a la base local; su cola, no.
      engine.__setOnlineForTests(false);
      const L2 = {value: 'L2: sigo tecleando', updatedAt: T + 200_000};
      localStore.set('doc-c', L2 as unknown as SyncEntity<TestEntity>);
      engine.queueWrite('test', 'doc-c', L2);
      await settle();
      disco.morir();
      engine.stop();
      await settle();
      disco.revivir();
      otro = await procesoNuevo(uid, adapter);

      // Sin el sello de L1 en disco, la rama retenida tomaba L1 (mia, en la
      // nube) por una copia del otro: «L2 contra L1», y «quedarme con lo
      // suyo» dejaba L1 en local.
      expect({
        murioTrasSubir, // CONTROL: murio tras guardar la cola sin L1
        nube: await nubeDe(uid, 'doc-c'), // CONTROL
        cola: otro.__getQueueForTests().map(q => q.id), // CONTROL
        conflictos: parejas(otro),
        local: localStore.get('doc-c')?.value,
      }).toEqual({
        murioTrasSubir: true,
        nube: L1.value,
        cola: [],
        conflictos: [],
        local: L2.value,
      });
    } finally {
      disco.revivir();
      otro?.stop();
    }
  });

  it('R9-193: con el conflicto en memoria, el eco de una escritura mia que otra edicion reemplazo en la cola mientras subia no pasa a ser «su version»', async () => {
    // Pasa sin R9-193 (toda copia mas vieja era mia). Vigila que los sellos
    // no abran este fantasma: la entrada nueva lleva el reloj de la que
    // reemplazo.
    const uid = 'uid-193-reemplazo';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    // El ack de L1 espera: su eco llega antes, con L2 ya en local.
    let ack!: () => void;
    mockSetGate = (_p, id) =>
      id === 'doc-c' ? new Promise<void>(r => (ack = r)) : undefined;
    const L1 = {value: 'L1: tecleo', updatedAt: T + 120_000};
    localStore.set('doc-c', L1 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L1);
    // En el mismo instante, otra edicion reemplaza a L1 en la cola.
    const L2 = {value: 'L2: sigo tecleando', updatedAt: T + 125_000};
    localStore.set('doc-c', L2 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L2);
    await settle();
    const ecoL1 = mockDelivered.some(d => d.id === 'doc-c' && d.via === 'echo');
    const trasEco = suyaDe(engine);
    mockSetGate = null;
    ack();
    await settle();

    // Sin el reloj de L1 en la entrada que la reemplazo, L1 (mia, mas vieja
    // que lo local) pasaba a ser «su version».
    expect({
      ecoL1, // CONTROL: el eco de L1 llego
      trasEco,
      alFinal: suyaDe(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      ecoL1: true,
      trasEco: ['lo suyo'],
      alFinal: ['lo suyo'],
      local: L2.value,
    });
    engine.stop();
  });

  it('R9-193: tras «quedarme con lo suyo», los sellos del conflicto se van con el: en un conflicto nuevo del mismo doc, una copia del otro con el reloj de una escritura mia de entonces es «su version»', async () => {
    // El otro telefono restaura un respaldo suyo que traia MI copia W de
    // entonces, con su reloj: es una escritura suya (reescribe la nube).
    const uid = 'uid-193-olvido';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    // Durante el conflicto escribo W, y sube.
    const W = {value: 'W: mi copia de entonces', updatedAt: T + 62_000};
    localStore.set('doc-c', W as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', W);
    await settle();
    await engine.__flushForTests();
    await settle();
    // El otro escribe despues (R2), y elijo lo suyo: la nube ya lo tiene.
    write(uid, 'doc-c', {value: 'R2', updatedAt: T + 66_000});
    await settle();
    await engine.resolveConflict('test__doc-c', 'keepTheirs');
    await settle();
    const trasElegir = {
      local: localStore.get('doc-c')?.value,
      subidas: mockDocSets.filter(s => s.id === 'doc-c').length,
    };
    // Conflicto nuevo: el otro escribe R3 a 14 s de lo local (R2).
    write(uid, 'doc-c', {value: 'R3', updatedAt: T + 80_000});
    await settle();
    const conflicto2 = suyaDe(engine);
    // El otro restaura su respaldo: la nube pasa a tener W.
    write(uid, 'doc-c', W);
    await settle();

    // Con los sellos del conflicto anterior, W se tomaba por mia: «su
    // version» seguia en R3, que la nube ya no tiene.
    expect({
      trasElegir, // CONTROL: keepTheirs no subio nada (solo W)
      conflicto2, // CONTROL
      suVersion: suyaDe(engine),
      nube: await nubeDe(uid, 'doc-c'), // CONTROL
    }).toEqual({
      trasElegir: {local: 'R2', subidas: 1},
      conflicto2: ['R3'],
      suVersion: [W.value],
      nube: W.value,
    });
    engine.stop();
  });

  it('R9-193: un conflicto que se disuelve suelta sus sellos: en un conflicto nuevo del mismo doc, una copia del otro con el reloj de una escritura mia de entonces es «su version»', async () => {
    const uid = 'uid-193-disuelto';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    const W = {value: 'W: mi copia de entonces', updatedAt: T + 62_000};
    localStore.set('doc-c', W as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', W);
    await settle();
    await engine.__flushForTests();
    await settle();
    // El otro escribe lo mismo que tengo: el conflicto se disuelve (R9-160).
    write(uid, 'doc-c', {value: W.value, updatedAt: T + 70_000});
    await settle();
    const disuelto = suyaDe(engine);
    // Sigo escribiendo (L3, ya sin conflicto), y el otro escribe R3 a 5 s.
    const L3 = {value: 'L3', updatedAt: T + 75_000};
    localStore.set('doc-c', L3 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L3);
    await settle();
    await engine.__flushForTests();
    await settle();
    write(uid, 'doc-c', {value: 'R3', updatedAt: T + 80_000});
    await settle();
    const conflicto2 = suyaDe(engine);
    // El otro restaura su respaldo, que trae mi W.
    write(uid, 'doc-c', W);
    await settle();

    // Con los sellos del conflicto disuelto, W se tomaba por mia: «su
    // version» seguia en R3, que la nube ya no tiene.
    expect({
      disuelto, // CONTROL
      conflicto2, // CONTROL
      suVersion: suyaDe(engine),
    }).toEqual({
      disuelto: [],
      conflicto2: ['R3'],
      suVersion: [W.value],
    });
    engine.stop();
  });

  it('R9-193: la sesion termina mientras el flush sube otra escritura: el sello de la mia ya tomada llega a disco, y al volver no aparece «lo mio contra lo mio»', async () => {
    // Pasa sin R9-193 (toda copia mas vieja era mia). Vigila que `stop()`
    // escriba los sellos pendientes.
    const uid = 'uid-193-stop';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    // Dos escrituras sin red: L1 en el doc del conflicto, y otra en doc-x.
    engine.__setOnlineForTests(false);
    const L1 = {value: 'L1: tecleo', updatedAt: T + 120_000};
    localStore.set('doc-c', L1 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L1);
    localStore.set('doc-x', {value: 'x', updatedAt: T + 121_000});
    engine.queueWrite('test', 'doc-x', {value: 'x', updatedAt: T + 121_000});
    await settle();
    // Vuelve la red: L1 sube, y la subida de doc-x se queda esperando.
    let ackX!: () => void;
    mockSetGate = (_p, id) =>
      id === 'doc-x' ? new Promise<void>(r => (ackX = r)) : undefined;
    engine.__setOnlineForTests(true);
    await settle();
    const subioL1 = mockDocSets.some(
      s => s.id === 'doc-c' && (s.data as Data).value === L1.value,
    );
    // La sesion termina (cerrar sesion); despues vuelve el ack de doc-x, y el
    // flush viejo guarda la cola sin L1.
    engine.stop();
    mockSetGate = null;
    ackX();
    await settle();
    const colaEnDisco = (
      JSON.parse(
        (await AsyncStorage.getItem('@sync_queue_v1')) ?? '[]',
      ) as Array<{id: string}>
    ).map(q => q.id);
    // Sin sesion, la edicion queda solo en local (queueWrite no hace nada).
    const L2 = {value: 'L2: sin sesion', updatedAt: T + 200_000};
    localStore.set('doc-c', L2 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L2);
    const netInfo = jest.requireMock('@react-native-community/netinfo')
      .default as {fetch: jest.Mock};
    netInfo.fetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });
    await engine.start(uid);
    await settle();

    // Sin guardar los sellos al terminar la sesion, el de L1 no llegaba a
    // disco, la cola ya no lo tenia, y el enganche siguiente carga la tabla de
    // disco: L1 (mia, en la nube) volvia como «su version» contra L2.
    expect({
      subioL1, // CONTROL
      colaEnDisco, // CONTROL: el flush viejo guardo la cola sin L1
      conflictos: parejas(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      subioL1: true,
      colaEnDisco: [],
      conflictos: [],
      local: L2.value,
    });
    engine.stop();
  });

  it('R9-193: la subida de una edicion del doc en conflicto vuelve despues de cerrar sesion: su sello llega a disco, y al volver no aparece «lo mio contra lo mio»', async () => {
    // Pasa sin R9-193 (toda copia mas vieja era mia). Vigila que `stop()`
    // anote la escritura que se esta subiendo: su ack ya no la anota.
    const uid = 'uid-193-ack-tardio';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore} = await conflictFor(uid, T, L, R);
    // L1 sale hacia la nube; su ack espera.
    let ack!: () => void;
    mockSetGate = (_p, id) =>
      id === 'doc-c' ? new Promise<void>(r => (ack = r)) : undefined;
    const L1 = {value: 'L1: tecleo', updatedAt: T + 120_000};
    localStore.set('doc-c', L1 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L1);
    await settle();
    // Cierra sesion; despues vuelve el ack, y la entrada sale de la cola.
    engine.stop();
    mockSetGate = null;
    ack();
    await settle();
    const colaEnDisco = (
      JSON.parse(
        (await AsyncStorage.getItem('@sync_queue_v1')) ?? '[]',
      ) as Array<{id: string}>
    ).map(q => q.id);
    // Sin sesion, la edicion queda solo en local (queueWrite no hace nada).
    const L2 = {value: 'L2: sin sesion', updatedAt: T + 200_000};
    localStore.set('doc-c', L2 as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', L2);
    const netInfo = jest.requireMock('@react-native-community/netinfo')
      .default as {fetch: jest.Mock};
    netInfo.fetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });
    await engine.start(uid);
    await settle();

    // Sin anotarla al cerrar sesion, el sello de L1 no llegaba a ninguna
    // parte: L1 (mia, en la nube) volvia como «su version» contra L2.
    expect({
      nube: await nubeDe(uid, 'doc-c'), // CONTROL: L1 llego a la nube
      colaEnDisco, // CONTROL: y salio de la cola
      conflictos: parejas(engine),
      local: localStore.get('doc-c')?.value,
    }).toEqual({
      nube: L1.value,
      colaEnDisco: [],
      conflictos: [],
      local: L2.value,
    });
    engine.stop();
  });

  it('R9-193: los sellos de Ana no hacen «mia» para Beto una copia de su otro telefono con el mismo reloj', async () => {
    // El mismo milisegundo en las dos cuentas es a proposito.
    const ana = 'uid-193-ana';
    const beto = 'uid-193-beto';
    const T = Date.now() - HOUR;
    // Mas viejo que lo local de Beto (L): solo un sello propio lo haria suyo.
    const K = T + 58_000;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    // Beto: conflicto L/R en doc-c, retenido; cierra sesion.
    const {engine, localStore} = await conflictFor(beto, T, L, R);
    engine.stop();
    // Ana, en el mismo telefono: conflicto en doc-c, y escribe K, que sube.
    await AsyncStorage.setItem(`@sync_first_push_done:${ana}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('test', ana), String(T));
    localStore.set('doc-c', L as unknown as SyncEntity<TestEntity>);
    await engine.start(ana);
    await settle();
    write(ana, 'doc-c', R);
    await settle();
    const conflictoAna = suyaDe(engine);
    const deAna = {value: 'de ana', updatedAt: K};
    localStore.set('doc-c', deAna as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-c', deAna);
    await settle();
    await engine.__flushForTests();
    await settle();
    // En disco hay una tabla de sellos con K (sea cual sea su clave).
    const tablas = await Promise.all(
      (await AsyncStorage.getAllKeys())
        .filter(k => k.startsWith('@sync_own_'))
        .map(k => AsyncStorage.getItem(k)),
    );
    const selloK = tablas.some(t => (t ?? '').includes(String(K)));
    engine.stop();
    // Beto vuelve: su conflicto retenido se vuelve a mostrar al enganchar.
    localStore.set('doc-c', L as unknown as SyncEntity<TestEntity>);
    await engine.start(beto);
    await settle();
    const conflictoBeto = suyaDe(engine);
    // El otro telefono de Beto escribe con el reloj K.
    write(beto, 'doc-c', {value: 'de beto', updatedAt: K});
    await settle();

    expect({
      conflictoAna, // CONTROL
      selloK, // CONTROL: el sello de Ana llego a disco
      conflictoBeto, // CONTROL
      suVersion: suyaDe(engine),
    }).toEqual({
      conflictoAna: ['lo suyo'],
      selloK: true,
      conflictoBeto: ['lo suyo'],
      suVersion: ['de beto'],
    });
    engine.stop();
  });

  it('R9-193: la entrada de la cola lleva a lo sumo 16 relojes de las que reemplazo, los mas nuevos y sin repetir', async () => {
    // Vigila el tamano de la cola, no una consecuencia para el usuario.
    const uid = 'uid-193-tope';
    const T = Date.now() - HOUR;
    const {engine} = await engineFor(uid, T);
    engine.__setOnlineForTests(false);
    // 20 ediciones sin red; la 10 se reescribe con el mismo reloj.
    for (let i = 1; i <= 20; i++) {
      engine.queueWrite('test', 'doc-t', {value: `v${i}`, updatedAt: T + i});
      if (i === 10) {
        engine.queueWrite('test', 'doc-t', {value: 'v10b', updatedAt: T + i});
      }
    }
    await settle();
    const [entrada] = engine.__getQueueForTests();

    expect({
      reloj: updatedAtRel(entrada.data, T),
      own: (entrada.own ?? []).map(s => s - T),
    }).toEqual({
      reloj: 20,
      own: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    });
    engine.stop();
  });

  it('R9-193: al enganchar, la tabla de sellos se queda solo con los conflictos retenidos: los de un doc que ya no lo esta se sueltan de disco', async () => {
    // Vigila el tamano de la tabla, no una consecuencia para el usuario.
    const uid = 'uid-193-poda';
    const T = Date.now() - HOUR;
    await AsyncStorage.setItem(
      `@sync_own_test:${uid}`,
      JSON.stringify({'doc-viejo': [T - 5_000], 'doc-c': [T + 62_000]}),
    );
    await AsyncStorage.setItem(
      unsettledStorageKey('test', uid),
      JSON.stringify({'doc-c': T + 65_000}),
    );
    await AsyncStorage.setItem(
      `@sync_conflicted_test:${uid}`,
      JSON.stringify(['doc-c']),
    );
    const {engine, localStore} = await engineFor(uid, T);
    // Cualquier escritura de la cola guarda la tabla que cambio.
    localStore.set('doc-z', {value: 'z', updatedAt: T + 300_000});
    engine.queueWrite('test', 'doc-z', {value: 'z', updatedAt: T + 300_000});
    await settle();

    expect(
      JSON.parse((await AsyncStorage.getItem(`@sync_own_test:${uid}`))!),
    ).toEqual({'doc-c': [T + 62_000]});
    engine.stop();
  });

  it('R9-193: un suscriptor que encola otra escritura al ver el ack no guarda la cola sin el sello de la mia', async () => {
    // Pasa sin R9-193 (toda copia mas vieja era mia). Vigila que el sello se
    // anote antes de avisar el estado; lo que mide es el fantasma tras morir
    // el proceso justo despues de esa escritura de la cola.
    const uid = 'uid-193-orden';
    const T = Date.now() - HOUR;
    const L = {value: 'lo mio', updatedAt: T + 60_000};
    const R = {value: 'lo suyo', updatedAt: T + 65_000};
    const {engine, localStore, adapter} = await conflictFor(uid, T, L, R);
    const disco = caida();
    let otro: SyncEngine | null = null;
    try {
      const L1 = {value: 'L1: tecleo', updatedAt: T + 120_000};
      // Al ver la cola vacia tras el ack de L1, el suscriptor escribe doc-o.
      let encolo = false;
      engine.subscribe(st => {
        if (!encolo && st.pendingWrites === 0 && st.lastSyncedAt !== null) {
          const q = engine.__getQueueForTests();
          if (q.length === 0 && mockDocSets.some(s => s.id === 'doc-c')) {
            encolo = true;
            engine.queueWrite('test', 'doc-o', {value: 'o'});
          }
        }
      });
      // Muere justo despues de la primera escritura de la cola sin L1: la del
      // suscriptor.
      disco.morirTras(pairs => {
        const cola = colaEn(pairs);
        return (
          cola !== undefined &&
          !cola.some(q => q.data.updatedAt === L1.updatedAt)
        );
      });
      localStore.set('doc-c', L1 as unknown as SyncEntity<TestEntity>);
      engine.queueWrite('test', 'doc-c', L1);
      await settle();
      await engine.__flushForTests();
      await settle();
      const L2 = {value: 'L2: sigo tecleando', updatedAt: T + 200_000};
      localStore.set('doc-c', L2 as unknown as SyncEntity<TestEntity>);
      disco.morir();
      engine.stop();
      await settle();
      disco.revivir();
      otro = await procesoNuevo(uid, adapter);

      expect({
        encolo, // CONTROL: el suscriptor encolo doc-o tras el ack
        conflictos: parejas(otro),
      }).toEqual({encolo: true, conflictos: []});
    } finally {
      disco.revivir();
      otro?.stop();
    }
  });
});

describe('R9-175 — los lotes de una coleccion corren de a uno', () => {
  // Cada snapshot hacia `void this.handleSnapshot(...)`: los lotes corrian a la
  // vez y compartian el cursor. Mientras uno esperaba (la lectura de un
  // `removed`, un `getLocal`), otro lote corria entero y adelantaba el cursor;
  // si el primero se cortaba despues (un `stop()`, el proceso que muere), lo
  // que le faltaba aplicar quedaba bajo el piso de todo enganche siguiente.
  async function settle(): Promise<void> {
    for (let i = 0; i < 8; i++) await flush();
  }
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  type Data = Record<string, unknown>;

  async function engineFor(uid: string, cursor: number) {
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('test', uid), String(cursor));
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    const engine = new SyncEngine();
    engine.register(fixture.adapter);
    await engine.start(uid);
    await settle();
    return {engine, ...fixture};
  }
  function write(uid: string, id: string, data: Data): void {
    fireRemote(uid, [
      {type: 'modified', doc: {id, exists: true, data: () => data}},
    ]);
  }
  function hardDelete(uid: string, id: string, last: Data): void {
    fireRemote(uid, [
      {type: 'removed', doc: {id, exists: true, data: () => last}},
    ]);
  }
  function delivered(uid: string, from = 0): string[] {
    return mockDelivered
      .slice(from)
      .filter(d => d.path === `users/${uid}/test`)
      .map(d => `${d.type}:${d.id}`);
  }
  function floorOf(uid: string): number {
    return mockCollections
      .get(`users/${uid}/test`)!
      .__whereClauses.find(c => c.field === 'updatedAt')?.value as number;
  }
  async function storedCursor(uid: string): Promise<number | null> {
    const raw = await AsyncStorage.getItem(cursorStorageKey('test', uid));
    return raw == null ? null : Number(raw);
  }
  /** Minutos desde T, para leer los cursores y pisos. */
  const relTo = (T: number) => (x: number | null | undefined) =>
    x == null ? null : Math.round(((x - T) / MIN) * 1000) / 1000;

  /** Retiene la lectura del `removed` de `docId`. Al soltarla responde con la
   *  nube del mock en ese momento. */
  function holdGet(docId: string) {
    const g = {hits: 0, released: false, release: () => {}};
    let r: (() => void) | null = null;
    mockGetGate = (_p, id) => {
      if (id !== docId) return undefined;
      g.hits += 1;
      return new Promise<void>(res => {
        r = res;
      });
    };
    g.release = () => {
      if (!r) return;
      g.released = true;
      (r as () => void)();
    };
    return g;
  }

  /** El lote [removed X, modified Y] espera la lectura de X; mientras, `during`
   *  hace algo que podria mover el cursor. Despues el lote se corta (stop), se
   *  reengancha y la nube re-entrega Y si casa con el piso. */
  async function cutBatch(
    uid: string,
    during: (
      f: Awaited<ReturnType<typeof engineFor>>,
      T: number,
    ) => Promise<void>,
    before?: (
      f: Awaited<ReturnType<typeof engineFor>>,
      T: number,
    ) => Promise<void>,
  ) {
    const T = Date.now() - HOUR;
    const rel = relTo(T);
    const f = await engineFor(uid, T);
    const {engine, localStore} = f;
    await before?.(f, T);
    const conflictos = engine.__getConflictsForTests().map(c => c.docId);
    const x1 = {value: 'x1', updatedAt: T + MIN};
    localStore.set('X', x1);
    write(uid, 'X', x1);
    await settle();
    const g = holdGet('X');
    const y1 = {value: 'y del otro', updatedAt: T + 2 * MIN};
    const antes = mockDelivered.length;
    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'X',
          exists: true,
          data: () => ({value: 'respaldo', updatedAt: T - DAY}),
        },
      },
      {type: 'modified', doc: {id: 'Y', exists: true, data: () => y1}},
    ]);
    await flush();
    const lote = delivered(uid, antes);
    await during(f, T);
    const enVuelo = {
      lecturas: g.hits,
      liberada: g.released,
      yAplicado: localStore.has('Y'),
      cursorGuardado: rel(await storedCursor(uid)),
    };
    engine.stop();
    g.release();
    await settle();
    await engine.start(uid);
    await settle();
    const piso = rel(floorOf(uid));
    write(uid, 'Y', y1);
    await settle();
    const localY = localStore.get('Y')?.value ?? null;
    engine.stop();
    return {conflictos, lote, enVuelo, piso, localY};
  }

  /** Otro lote de la misma coleccion llega durante la lectura. */
  const otherBatch = async (
    f: Awaited<ReturnType<typeof engineFor>>,
    T: number,
  ) => {
    write(f.engine.getActiveUid()!, 'W', {value: 'w', updatedAt: T + 20 * MIN});
    await settle();
  };

  it('mientras un lote espera la lectura de un `removed`, otro lote no mueve el cursor', async () => {
    const r = await cutBatch('uid-175-mec', otherBatch);
    expect(r.lote).toEqual(['removed:X', 'modified:Y']); // CONTROL: un solo lote
    expect(r.enVuelo.lecturas).toBe(1); // CONTROL
    expect(r.enVuelo.liberada).toBe(false); // CONTROL
    expect(r.enVuelo.yAplicado).toBe(false); // CONTROL
    // Antes: 20, el de W.
    expect(r.enVuelo.cursorGuardado).toBe(1);
  });

  it('cortado ese lote, lo que le faltaba vuelve al reenganchar', async () => {
    const r = await cutBatch('uid-175-cons', otherBatch);
    expect(r.enVuelo.lecturas).toBe(1); // CONTROL
    // Antes: piso 15, Y no volvia nunca.
    expect(r.localY).toBe('y del otro');
  });

  /** R9-183 — un conflicto pendiente en Z antes del lote; durante la lectura,
   *  el usuario lo resuelve con keepMine, que lleva el cursor a «ahora». */
  const conflictZ = async (
    f: Awaited<ReturnType<typeof engineFor>>,
    T: number,
  ) => {
    f.localStore.set('Z', {value: 'z mio', updatedAt: T + MIN});
    write(f.engine.getActiveUid()!, 'Z', {
      value: 'z suyo',
      updatedAt: T + MIN + 5000,
    });
    await settle();
  };
  const resolveZ = async (f: Awaited<ReturnType<typeof engineFor>>) => {
    await f.engine.resolveConflict('test__Z', 'keepMine');
    await settle();
  };

  it('R9-183: resolver OTRO conflicto con keepMine mientras un lote espera su lectura no mueve el cursor', async () => {
    const r = await cutBatch('uid-183-mec', resolveZ, conflictZ);
    expect(r.conflictos).toEqual(['Z']); // CONTROL
    expect(r.enVuelo.lecturas).toBe(1); // CONTROL
    expect(r.enVuelo.liberada).toBe(false); // CONTROL
    expect(r.enVuelo.yAplicado).toBe(false); // CONTROL
    // Antes: 60, el «ahora» de keepMine.
    expect(r.enVuelo.cursorGuardado).toBe(1);
  });

  it('R9-183: cortado el lote tras resolver otro conflicto, lo que le faltaba vuelve al reenganchar', async () => {
    const r = await cutBatch('uid-183-cons', resolveZ, conflictZ);
    expect(r.conflictos).toEqual(['Z']); // CONTROL
    expect(r.enVuelo.lecturas).toBe(1); // CONTROL
    // Antes: piso 55, Y no volvia nunca.
    expect(r.localY).toBe('y del otro');
  });

  it('R9-183: si la sesion termina con esa resolucion esperando detras del lote, su cursor no cae en la cuenta siguiente', async () => {
    const ana = 'uid-183-ana';
    const beto = 'uid-183-beto';
    const T = Date.now() - HOUR;
    const rel = relTo(T);
    const f = await engineFor(ana, T);
    const {engine, localStore} = f;
    await conflictZ(f, T);
    const x1 = {value: 'x1', updatedAt: T + MIN};
    localStore.set('X', x1);
    write(ana, 'X', x1);
    await settle();
    const g = holdGet('X');
    write(ana, 'X', {value: 'respaldo', updatedAt: T - DAY}); // B1: removed X
    await flush();
    await resolveZ(f);
    const control = {
      conflictos: engine.__getConflictsForTests().map(c => c.docId),
      lecturas: g.hits,
      cursorAna: rel(await storedCursor(ana)),
    };
    engine.stop();
    const betoCursor = T - 2 * HOUR;
    await AsyncStorage.setItem(`@sync_first_push_done:${beto}`, '2');
    await AsyncStorage.setItem(
      cursorStorageKey('test', beto),
      String(betoCursor),
    );
    await engine.start(beto);
    await settle();
    g.release();
    await settle();
    // Sin mirar la sesion, el cursor de Ana («ahora», el de keepMine) caia bajo
    // la clave y en la cache de Beto: su enganche siguiente ya no bajaba sus
    // propios docs de la ultima hora (la clase de R9-122.4).
    expect({
      control,
      cursorBeto: rel(await storedCursor(beto)),
      cacheBeto: rel(engine.__getCursorForTests('test')),
    }).toEqual({
      control: {conflictos: [], lecturas: 1, cursorAna: 1},
      cursorBeto: rel(betoCursor),
      cacheBeto: rel(betoCursor),
    });
    engine.stop();
  });

  it('lo mismo con la ventana de un `getLocal`, sin `removed` (ya existia antes de R9-124)', async () => {
    const uid = 'uid-175-getlocal';
    const T = Date.now() - HOUR;
    const {engine, localStore, adapter} = await engineFor(uid, T);
    const real = adapter.getLocal.bind(adapter);
    let hits = 0;
    let soltar: (() => void) | null = null;
    adapter.getLocal = async id => {
      if (id === 'X2' && hits === 0) {
        hits += 1;
        await new Promise<void>(res => {
          soltar = res;
        });
      }
      return real(id);
    };
    const y1 = {value: 'y del otro', updatedAt: T + 2 * MIN};
    fireRemote(uid, [
      {
        type: 'modified',
        doc: {
          id: 'X2',
          exists: true,
          data: () => ({value: 'x2', updatedAt: T + MIN}),
        },
      },
      {type: 'modified', doc: {id: 'Y', exists: true, data: () => y1}},
    ]);
    await flush();
    write(uid, 'W', {value: 'w', updatedAt: T + 20 * MIN});
    await settle();
    expect(hits).toBe(1); // CONTROL
    expect(localStore.has('Y')).toBe(false); // CONTROL
    engine.stop();
    if (soltar) (soltar as () => void)();
    await settle();
    await engine.start(uid);
    await settle();
    write(uid, 'Y', y1);
    await settle();
    expect(localStore.get('Y')?.value).toBe('y del otro');
    engine.stop();
  });

  it('un lote que espero en la cola a traves de un stop() no corre en la sesion de la cuenta siguiente', async () => {
    const ana = 'uid-175-ana';
    const beto = 'uid-175-beto';
    const T = Date.now() - HOUR;
    const rel = relTo(T);
    const {engine, localStore} = await engineFor(ana, T);
    const x1 = {value: 'x1', updatedAt: T + MIN};
    localStore.set('X', x1);
    write(ana, 'X', x1);
    await settle();
    const g = holdGet('X');
    write(ana, 'X', {value: 'respaldo', updatedAt: T - DAY}); // B1: removed X
    await flush();
    write(ana, 'Y', {value: 'y de ana', updatedAt: T + 30 * MIN}); // B2, en cola
    await settle();
    expect(g.hits).toBe(1); // CONTROL
    expect(localStore.has('Y')).toBe(false); // CONTROL: B2 espera detras de B1
    engine.stop();
    const betoCursor = T - 2 * HOUR;
    await AsyncStorage.setItem(`@sync_first_push_done:${beto}`, '2');
    await AsyncStorage.setItem(
      cursorStorageKey('test', beto),
      String(betoCursor),
    );
    await engine.start(beto);
    await settle();
    g.release();
    await settle();
    // Tomando la sesion al EMPEZAR el lote: la Y de Ana entraba en la sesion
    // de Beto, y su updatedAt, en el cursor de Beto.
    expect(localStore.has('Y')).toBe(false);
    expect(rel(await storedCursor(beto))).toBe(rel(betoCursor));
    engine.stop();
  });

  it('ese lote termina antes de empezar: no lee la nube desde la sesion de la cuenta siguiente', async () => {
    const ana = 'uid-175-ana2';
    const beto = 'uid-175-beto2';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(ana, T);
    for (const id of ['X', 'Q']) {
      const v = {value: id, updatedAt: T + MIN};
      localStore.set(id, v);
      write(ana, id, v);
    }
    await settle();
    const pedidas: string[] = [];
    const soltar = new Map<string, () => void>();
    mockGetGate = (_p, id) =>
      id === 'X' || id === 'Q'
        ? new Promise<void>(res => {
            pedidas.push(id);
            soltar.set(id, res);
          })
        : undefined;
    write(ana, 'X', {value: 'x vieja', updatedAt: T - DAY}); // B1: removed X
    await flush();
    write(ana, 'Q', {value: 'q vieja', updatedAt: T - DAY}); // B2: removed Q
    await settle();
    expect(pedidas).toEqual(['X']); // CONTROL: B2 espera detras de B1
    engine.stop();
    await AsyncStorage.setItem(`@sync_first_push_done:${beto}`, '2');
    await engine.start(beto);
    await settle();
    soltar.get('X')!();
    await settle();
    expect(pedidas).toEqual(['X']);
    engine.stop();
    for (const s of soltar.values()) s();
    await settle();
  });

  it('la cuenta siguiente no espera detras de una lectura colgada de la anterior', async () => {
    const ana = 'uid-175-ana3';
    const beto = 'uid-175-beto3';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(ana, T);
    const x1 = {value: 'x1', updatedAt: T + MIN};
    localStore.set('X', x1);
    write(ana, 'X', x1);
    await settle();
    const g = holdGet('X'); // no vuelve durante la prueba
    write(ana, 'X', {value: 'respaldo', updatedAt: T - DAY});
    await flush();
    expect(g.hits).toBe(1); // CONTROL
    engine.stop();
    await AsyncStorage.setItem(`@sync_first_push_done:${beto}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('test', beto), String(T));
    await engine.start(beto);
    await settle();
    write(beto, 'Z', {value: 'z de beto', updatedAt: T + 10 * MIN});
    await settle();
    expect(g.released).toBe(false); // CONTROL
    expect(localStore.get('Z')?.value).toBe('z de beto');
    engine.stop();
    g.release();
    await settle();
  });

  it('un re-enganche en la misma sesion (unregister + register) sigue esperando al lote del listener viejo', async () => {
    const r = await cutBatch('uid-175-reeng', async (f, T) => {
      f.engine.unregister('test');
      f.engine.register(f.adapter);
      await settle();
      write(f.engine.getActiveUid()!, 'W', {
        value: 'w',
        updatedAt: T + 20 * MIN,
      }); // por el listener NUEVO
      await settle();
    });
    expect(r.enVuelo.lecturas).toBe(1); // CONTROL
    expect(r.enVuelo.yAplicado).toBe(false); // CONTROL
    // Con una cola por listener, W adelantaba el cursor a 20 y Y no volvia.
    expect(r.localY).toBe('y del otro');
  });

  it('una lectura que no vuelve nunca: al vencer el plazo cuenta como fallida y los lotes de detras corren', async () => {
    const uid = 'uid-175-plazo';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    engine.__setLookupTimeoutForTests(40);
    const x1 = {value: 'x1', updatedAt: T + MIN};
    localStore.set('X', x1);
    write(uid, 'X', x1);
    await settle();
    const g = holdGet('X'); // no se suelta hasta el final
    write(uid, 'X', {value: 'respaldo', updatedAt: T - DAY}); // B1
    await flush();
    write(uid, 'Y', {value: 'y', updatedAt: T + 2 * MIN}); // B2
    await settle();
    expect(g.hits).toBe(1); // CONTROL
    expect(localStore.has('Y')).toBe(false); // CONTROL: B2 espera
    await sleep(120);
    await settle();
    expect(localStore.get('Y')?.value).toBe('y');
    // Como una lectura fallida: se deja lo local.
    expect(localStore.get('X')?.value).toBe('x1');
    engine.stop();
    g.release();
    await settle();
  });

  it('R9-187: un lote que lanza fuera de su guarda no para la cadena: los lotes de detras corren', async () => {
    // Hoy nada lanza fuera del `try` de `handleSnapshot`, asi que el `.catch`
    // de la cadena no se alcanza. Se queda por su costo: sin el, un lote que
    // lanzara dejaria la cadena rechazada, y ningun lote posterior de la
    // coleccion correria hasta el `stop()`, sin un aviso.
    const uid = 'uid-187-cadena';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    const lote = jest
      .spyOn(
        engine as unknown as {handleSnapshot: () => Promise<void>},
        'handleSnapshot',
      )
      .mockRejectedValueOnce(new Error('fuera de la guarda'));
    write(uid, 'doc-a', {value: 'a', updatedAt: T + MIN});
    await settle();
    write(uid, 'doc-b', {value: 'b', updatedAt: T + 2 * MIN});
    await settle();
    const lotes = lote.mock.calls.length;
    lote.mockRestore();

    // Sin el `.catch`, el rechazo del primer lote se escapa de la cadena, y jest
    // lo reporta como el fallo de esta prueba antes de llegar aqui. La cadena
    // queda rechazada, y un `.then` sobre una promesa rechazada no corre su
    // lote: ninguno de detras correria.
    expect({
      lotes, // CONTROL: el primero lanzo, y hubo otro detras
      avisado: loggerErrorSpy.mock.calls.some(([m]) =>
        String(m).includes('snapshot batch threw outside its own guard'),
      ),
      local: localStore.get('doc-b')?.value ?? null,
    }).toEqual({lotes: 2, avisado: true, local: 'b'});
    engine.stop();
  });

  it('la respuesta que llega despues del plazo se descarta', async () => {
    const uid = 'uid-175-tarde';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    engine.__setLookupTimeoutForTests(40);
    const x1 = {value: 'x1', updatedAt: T + MIN};
    localStore.set('X', x1);
    write(uid, 'X', x1);
    await settle();
    const g = holdGet('X');
    hardDelete(uid, 'X', x1); // la respuesta dira «no existe»
    await flush();
    write(uid, 'Y', {value: 'y', updatedAt: T + 2 * MIN});
    await settle();
    await sleep(120);
    await settle();
    expect(localStore.get('Y')?.value).toBe('y'); // CONTROL: el plazo vencio
    g.release();
    await settle();
    expect(remoteDeleteCalls).toEqual([]);
    expect(localStore.get('X')?.value).toBe('x1');
    expect(loggerErrorSpy).not.toHaveBeenCalled();
    engine.stop();
  });
});
