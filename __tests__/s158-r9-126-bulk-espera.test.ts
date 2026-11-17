/**
 * R9-126 option E (S158) — the initial bulk push waits, per collection, for
 * its listener's first snapshot from the server, and does not push a row the
 * cloud already holds at the same or a newer clock.
 *
 * Harness copied from SyncEngine.test.ts (with its `mockAttachFromCache` and
 * `__fireMetadataSync`).
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
/** R9-126 option E — when true, a listener's first snapshot comes from the
 *  cache (`metadata.fromCache: true`), as the SDK delivers it offline or with
 *  the collection cached; `__fireMetadataSync()` then raises the step to the
 *  server. Every other delivery carries no metadata (counts as the server's).
 *  Reset in beforeEach. */
let mockAttachFromCache = false;
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
  /** R9-126 option E — whether the live listener asked for metadata changes. */
  let metadataChanges = false;
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

  const deliver = (
    changes: MockChange[],
    via: MockDeliveryCause,
    metadata?: {fromCache: boolean},
    raiseEmpty = false,
  ): void => {
    if (!snapshotCb || (changes.length === 0 && !raiseEmpty)) return;
    for (const c of changes) {
      mockDelivered.push({path, type: c.type, id: c.doc.id, via});
    }
    // R9-221 — RNFirebase parses each delivery into new objects
    // (`FirestoreDocumentSnapshot` keeps one `_data` per snapshot): the same
    // object within a delivery, a new one in the next, even when the cloud's
    // copy did not change.
    const fresh = changes.map(c => {
      const data = structuredClone(c.doc.data());
      return {...c, doc: {...c.doc, data: () => data}};
    });
    snapshotCb({
      docChanges: () => fresh,
      size: fresh.length,
      ...(metadata ? {metadata} : {}),
    });
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
            // R9-221 — and a new object on every read, like a delivery.
            const view = localView(id);
            const doc = view === undefined ? undefined : structuredClone(view);
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
    onSnapshot: jest.fn((...args: unknown[]) => {
      // R9-126 option E — the engine passes `{includeMetadataChanges}` first.
      const [cb, onError] = (
        typeof args[0] === 'function' ? args : args.slice(1)
      ) as [(s: unknown) => void, ((err: Error) => void) | undefined];
      const opts = typeof args[0] === 'function' ? undefined : args[0];
      metadataChanges =
        (opts as {includeMetadataChanges?: boolean} | undefined)
          ?.includeMetadataChanges === true;
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
        // R9-126 option E — the SDK raises a listener's first snapshot
        // even when it is empty.
        deliver(
          initial,
          'attach',
          mockAttachFromCache ? {fromCache: true} : undefined,
          true,
        );
      });
      return () => {
        snapshotCb = null;
        // Deliberately NOT clearing errorCb here — real native teardown
        // is async, so the JS error closure SyncEngine registered can
        // still be invoked a beat after this unsub runs. __fireError
        // below uses that to simulate exactly this race.
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
  /** R9-126 option E — the view caught up with the server and no doc changed:
   *  an event with no change, `fromCache: false` (the listener asks for
   *  metadata changes). */
  (coll as MockCollRef & {__fireMetadataSync: () => void}).__fireMetadataSync =
    () => {
      // Without metadata changes the SDK raises nothing for it.
      if (!metadataChanges) return;
      deliver([], 'fire', {fromCache: false}, true);
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
import {SyncEngine} from '../src/lib/sync/SyncEngine';
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
  mockAttachFromCache = false;
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

function fireRemote(uid: string, changes: unknown[]): void {
  const coll = mockCollections.get(`users/${uid}/test`);
  if (!coll) throw new Error(`mock collection not registered for ${uid}`);
  (coll as MockCollRef & {__fire: (c: unknown[]) => void}).__fire(changes);
}

describe('R9-126 — opcion E: el bulk push del primer inicio espera al servidor', () => {
  const HOUR = 60 * 60 * 1000;
  type Data = Record<string, unknown>;

  async function settle(): Promise<void> {
    for (let i = 0; i < 8; i++) await flush();
  }

  /** La nube de la cuenta, antes de que el telefono arranque. */
  function nube(uid: string, docs: Record<string, Data>): void {
    mockFirestoreFn().collection(`users/${uid}/test`);
    fireRemote(
      uid,
      Object.entries(docs).map(([id, data]) => ({
        type: 'modified',
        doc: {id, exists: true, data: () => data},
      })),
    );
  }

  const nubeDe = async (uid: string, id: string) => {
    const snap = await mockCollections.get(`users/${uid}/test`)!.doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as Data;
    return d.deleted ? 'lapida' : (d.value as string);
  };

  /** Los `set` de esta cuenta, por id. */
  const subidos = (uid: string) =>
    mockDocSets.filter(d => d.path === `users/${uid}/test`).map(d => d.id);

  const marca = (uid: string) =>
    AsyncStorage.getItem(`@sync_first_push_done:${uid}`);

  function metadataSync(uid: string): void {
    (
      mockCollections.get(`users/${uid}/test`) as MockCollRef & {
        __fireMetadataSync: () => void;
      }
    ).__fireMetadataSync();
  }

  function sinRed(): void {
    const netInfo = jest.requireMock('@react-native-community/netinfo')
      .default as {fetch: jest.Mock};
    netInfo.fetch.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
    });
  }

  async function arrancar(
    uid: string,
    local: Record<string, Data>,
    overrides: Parameters<typeof makeAdapter>[0] = {},
  ) {
    const f = makeAdapter(overrides);
    for (const [id, data] of Object.entries(local)) {
      f.localStore.set(id, data as unknown as SyncEntity<TestEntity>);
    }
    const engine = new SyncEngine();
    engine.register(f.adapter);
    await engine.start(uid);
    await settle();
    return {engine, ...f};
  }

  async function terminar(engine: SyncEngine): Promise<void> {
    await engine.__flushForTests();
    await drain();
  }

  it('C2 en linea: lo local viejo (V) no pisa la copia mas nueva de la nube (N); A, la nube y un telefono nuevo quedan con N, y lo solo-local sube', async () => {
    const uid = 'uid-e-c2';
    const T = Date.now() - HOUR;
    nube(uid, {'doc-1': {value: 'N', updatedAt: T + 120_000}});
    mockDocSets.length = 0;
    const {engine, localStore} = await arrancar(uid, {
      'doc-1': {value: 'V', updatedAt: T + 60_000},
      'doc-2': {value: 'L', updatedAt: T},
    });
    await terminar(engine);
    expect(localStore.get('doc-1')!.value).toBe('N');
    expect(await nubeDe(uid, 'doc-1')).toBe('N');
    expect(await nubeDe(uid, 'doc-2')).toBe('L');
    expect(subidos(uid)).toEqual(['doc-2']);
    expect(await marca(uid)).toBe('2');
    engine.stop();
  });

  it('primero la cache (con N): nada se encola ni sube hasta el evento del servidor; despues sube solo lo que la nube no tiene', async () => {
    const uid = 'uid-e-cache';
    const T = Date.now() - HOUR;
    nube(uid, {'doc-1': {value: 'N', updatedAt: T + 120_000}});
    mockDocSets.length = 0;
    mockAttachFromCache = true;
    const {engine, localStore} = await arrancar(uid, {
      'doc-1': {value: 'V', updatedAt: T + 60_000},
      'doc-2': {value: 'L', updatedAt: T},
    });
    await terminar(engine);
    expect(engine.__getQueueForTests()).toEqual([]);
    expect(subidos(uid)).toEqual([]);
    expect(await marca(uid)).toBeNull();

    metadataSync(uid);
    await settle();
    await terminar(engine);
    expect(localStore.get('doc-1')!.value).toBe('N');
    expect(subidos(uid)).toEqual(['doc-2']);
    expect(await nubeDe(uid, 'doc-1')).toBe('N');
    expect(await marca(uid)).toBe('2');
    engine.stop();
  });

  it('cuenta nueva sin red: cache vacia; al volver la red, el servidor vacio (solo metadata) deja subir lo local', async () => {
    const uid = 'uid-e-nueva';
    const T = Date.now() - HOUR;
    mockAttachFromCache = true;
    sinRed();
    const {engine} = await arrancar(uid, {
      'doc-1': {value: 'L1', updatedAt: T},
      'doc-2': {value: 'L2', updatedAt: T + 1},
    });
    expect(engine.__getQueueForTests()).toEqual([]);
    expect(await marca(uid)).toBeNull();

    engine.__setOnlineForTests(true);
    metadataSync(uid);
    await settle();
    await terminar(engine);
    expect(subidos(uid).sort()).toEqual(['doc-1', 'doc-2']);
    expect(await nubeDe(uid, 'doc-1')).toBe('L1');
    expect(await marca(uid)).toBe('2');
    engine.stop();
  });

  it('«Migrar» a una cuenta con datos: lo que vino de la nube no se re-sube (cero escrituras); lo solo-local si', async () => {
    const uid = 'uid-e-migrar';
    const T = Date.now() - HOUR;
    nube(uid, {
      x1: {value: 'X1', updatedAt: T + 1},
      x2: {value: 'X2', updatedAt: T + 2},
      x3: {value: 'X3', updatedAt: T + 3},
    });
    mockDocSets.length = 0;
    const {engine, localStore} = await arrancar(uid, {
      l1: {value: 'L1', updatedAt: T + 10},
      l2: {value: 'L2', updatedAt: T + 11},
    });
    await terminar(engine);
    expect(localStore.get('x2')!.value).toBe('X2');
    expect(subidos(uid).sort()).toEqual(['l1', 'l2']);
    engine.stop();
  });

  it('conflicto retenido a 10 s: lo local V no sube sobre N mientras la persona no elige', async () => {
    const uid = 'uid-e-conflicto';
    const T = Date.now() - HOUR;
    nube(uid, {'doc-1': {value: 'N', updatedAt: T + 10_000}});
    mockDocSets.length = 0;
    const {engine, localStore} = await arrancar(
      uid,
      {'doc-1': {value: 'V', updatedAt: T}},
      {getMaterialFields: () => ['value']},
    );
    await terminar(engine);
    expect(engine.__getConflictsForTests()).toHaveLength(1);
    expect(localStore.get('doc-1')!.value).toBe('V');
    expect(subidos(uid)).toEqual([]);
    expect(await nubeDe(uid, 'doc-1')).toBe('N');
    engine.stop();
  });

  it('una lapida mas nueva en la nube: la fila local se borra y nada sube', async () => {
    const uid = 'uid-e-lapida-nueva';
    const T = Date.now() - HOUR;
    nube(uid, {
      'doc-1': {
        value: 'N',
        deleted: true,
        deletedAt: T + 120_000,
        updatedAt: T + 120_000,
      },
    });
    mockDocSets.length = 0;
    const {engine, localStore} = await arrancar(uid, {
      'doc-1': {value: 'V', updatedAt: T + 60_000},
    });
    await terminar(engine);
    expect(localStore.has('doc-1')).toBe(false);
    expect(subidos(uid)).toEqual([]);
    expect(await nubeDe(uid, 'doc-1')).toBe('lapida');
    engine.stop();
  });

  it('una lapida mas vieja que la fila: la fila (una edicion mas nueva) sube', async () => {
    const uid = 'uid-e-lapida-vieja';
    const T = Date.now() - HOUR;
    nube(uid, {
      'doc-1': {value: 'O', deleted: true, deletedAt: T, updatedAt: T},
    });
    mockDocSets.length = 0;
    const {engine} = await arrancar(uid, {
      'doc-1': {value: 'V', updatedAt: T + 60_000},
    });
    await terminar(engine);
    expect(subidos(uid)).toEqual(['doc-1']);
    expect(await nubeDe(uid, 'doc-1')).toBe('V');
    engine.stop();
  });

  it('stop() durante la espera: sin marca ni subidas; el start siguiente lo corre entero', async () => {
    const uid = 'uid-e-stop';
    const T = Date.now() - HOUR;
    mockAttachFromCache = true;
    const f = makeAdapter();
    f.localStore.set('doc-1', {value: 'L', updatedAt: T} as never);
    const engine = new SyncEngine();
    engine.register(f.adapter);
    await engine.start(uid);
    await settle();
    engine.stop();
    await settle();
    expect(await marca(uid)).toBeNull();
    expect(subidos(uid)).toEqual([]);

    mockAttachFromCache = false;
    const otro = new SyncEngine();
    otro.register(f.adapter);
    await otro.start(uid);
    await settle();
    await terminar(otro);
    expect(subidos(uid)).toEqual(['doc-1']);
    expect(await marca(uid)).toBe('2');
    otro.stop();
  });

  it('error del listener durante la espera: la coleccion va a la lista de R9-257, la marca queda en 2, y el start siguiente la sube', async () => {
    const uid = 'uid-e-error';
    const T = Date.now() - HOUR;
    mockAttachFromCache = true;
    const f = makeAdapter();
    f.localStore.set('doc-1', {value: 'L', updatedAt: T} as never);
    const engine = new SyncEngine();
    engine.register(f.adapter);
    await engine.start(uid);
    await settle();
    (
      mockCollections.get(`users/${uid}/test`) as MockCollRef & {
        __fireError: (e: Error) => void;
      }
    ).__fireError(new Error('unavailable'));
    await settle();
    expect(await marca(uid)).toBe('2');
    expect(await AsyncStorage.getItem(`@sync_first_push_retry:${uid}`)).toBe(
      '["test"]',
    );
    expect(subidos(uid)).toEqual([]);
    engine.stop();

    mockAttachFromCache = false;
    const otro = new SyncEngine();
    otro.register(f.adapter);
    await otro.start(uid);
    await settle();
    await terminar(otro);
    expect(subidos(uid)).toEqual(['doc-1']);
    expect(await AsyncStorage.getItem(`@sync_first_push_retry:${uid}`)).toBe(
      null,
    );
    otro.stop();
  });

  it('control (R9-127): el salto pedido para la cuenta sigue sin subir nada', async () => {
    const uid = 'uid-e-salto';
    const T = Date.now() - HOUR;
    const f = makeAdapter();
    f.localStore.set('doc-1', {value: 'L', updatedAt: T} as never);
    const engine = new SyncEngine();
    engine.register(f.adapter);
    engine.queueSkipNextBulkPush(uid);
    await engine.start(uid);
    await settle();
    await terminar(engine);
    expect(subidos(uid)).toEqual([]);
    expect(await marca(uid)).toBe('skip');
    engine.stop();
  });
});
