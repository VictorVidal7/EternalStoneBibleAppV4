/**
 * R9-126 (opcion C) — una entrada en cola que ya perdio LWW en este telefono
 * no sube.
 *
 * Una edicion D espera en la cola sin red y el otro telefono escribe R
 * despues: LWW aplica R aqui, y la entrada de D subia encima. La nube quedaba
 * con D, este telefono con R, y el otro (con R) ignoraba D por mas vieja.
 * Ahora, cuando LWW aplica una copia mas nueva, la entrada sale de la cola.
 *
 * El arnes de Firestore es una copia del de `SyncEngine.test.ts` (sin tocar
 * ese archivo), contra el motor real.
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
    // R9-221 — RNFirebase parses each delivery into new objects
    // (`FirestoreDocumentSnapshot` keeps one `_data` per snapshot): the same
    // object within a delivery, a new one in the next, even when the cloud's
    // copy did not change.
    const fresh = changes.map(c => {
      const data = structuredClone(c.doc.data());
      return {...c, doc: {...c.doc, data: () => data}};
    });
    snapshotCb({docChanges: () => fresh, size: fresh.length});
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
import {SyncEngine, cursorStorageKey} from '../src/lib/sync/SyncEngine';
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

// =============================================================

function fireRemote(uid: string, changes: unknown[]): void {
  const coll = mockCollections.get(`users/${uid}/test`);
  if (!coll) throw new Error(`mock collection not registered for ${uid}`);
  (coll as MockCollRef & {__fire: (c: unknown[]) => void}).__fire(changes);
}

describe('R9-126 — opcion C: una entrada en cola que ya perdio LWW no sube', () => {
  async function settle(): Promise<void> {
    for (let i = 0; i < 5; i++) await flush();
  }

  const HOUR = 60 * 60 * 1000;
  type Data = Record<string, unknown>;
  type Fixture = ReturnType<typeof makeAdapter>;

  /** Un telefono con la coleccion ya sincronizada hasta `cursor`. */
  async function engineFor(uid: string, cursor: number, fixture?: Fixture) {
    await AsyncStorage.setItem(`@sync_first_push_done:${uid}`, '2');
    await AsyncStorage.setItem(cursorStorageKey('test', uid), String(cursor));
    const f = fixture ?? makeAdapter({getMaterialFields: () => ['value']});
    const engine = new SyncEngine();
    engine.register(f.adapter);
    await engine.start(uid);
    await settle();
    return {engine, ...f};
  }

  /** Una escritura en la nube (del otro telefono). */
  function write(uid: string, id: string, data: Data): void {
    fireRemote(uid, [
      {type: 'modified', doc: {id, exists: true, data: () => data}},
    ]);
  }

  const nubeDe = async (uid: string, id: string) => {
    const snap = await mockCollections.get(`users/${uid}/test`)!.doc(id).get();
    return snap.exists ? ((snap.data() as Data).value as string) : null;
  };

  /** La cola persistida, como [uid, id]. */
  const colaEnDisco = async () => {
    const raw = await AsyncStorage.getItem('@sync_queue_v1');
    const list = raw
      ? (JSON.parse(raw) as Array<{uid?: string; id: string}>)
      : [];
    return list.map(e => [e.uid, e.id]);
  };

  const enCola = (engine: SyncEngine) =>
    engine.__getQueueForTests().map(e => [e.uid, e.id]);

  /** Un proceso nuevo (la memoria del anterior se perdio), sin red. */
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

  async function online(engine: SyncEngine): Promise<void> {
    engine.__setOnlineForTests(true);
    await settle();
    await engine.__flushForTests();
    await drain();
  }

  it('R9-126: D espera en la cola sin red, el otro escribe R 60 s despues; LWW aplica R y la entrada de D sale de la cola (memoria, conteo y disco): no sube', async () => {
    const uid = 'uid-126-c';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    engine.__setOnlineForTests(false);
    const D = {value: 'D', updatedAt: T + 60_000};
    localStore.set('doc-q', D as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-q', D);
    await settle();
    // Control del mecanismo: D esta en la cola, en memoria y en disco.
    expect(engine.getState().pendingWrites).toBe(1);
    expect(await colaEnDisco()).toEqual([[uid, 'doc-q']]);

    write(uid, 'doc-q', {value: 'R', updatedAt: T + 120_000});
    await settle();
    // LWW aplico R (fuera de la ventana de 30 s no hay conflicto).
    expect(localStore.get('doc-q')!.value).toBe('R');
    expect(engine.__getConflictsForTests()).toEqual([]);
    // La entrada de D perdio aqui: se va.
    expect(enCola(engine)).toEqual([]);
    expect(engine.getState().pendingWrites).toBe(0);
    expect(await colaEnDisco()).toEqual([]);

    await online(engine);
    expect(await nubeDe(uid, 'doc-q')).toBe('R');
    expect(localStore.get('doc-q')!.value).toBe('R');
    engine.stop();
  });

  /** La sonda de la 49 (S49-sonda-lww): D en cola en disco, el proceso
   *  muere, el otro escribe R, y un proceso nuevo la relee. `fallos`: cuantas
   *  lecturas de la cola fallan antes de la buena (R9-212). */
  async function caso49(uid: string, fallos: number) {
    const T = Date.now() - HOUR;
    const getItemMock = AsyncStorage.getItem as unknown as jest.Mock;
    const realGet = getItemMock.getMockImplementation()!;
    const {engine, localStore, adapter} = await engineFor(uid, T);
    engine.__setOnlineForTests(false);
    const D = {value: 'D', updatedAt: T + 60_000};
    localStore.set('doc-q', D as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-q', D);
    await settle();
    engine.stop();
    await settle();
    write(uid, 'doc-q', {value: 'R', updatedAt: T + 120_000});
    let n = 0;
    getItemMock.mockImplementation((k: string) => {
      if (k !== '@sync_queue_v1') return realGet(k);
      n += 1;
      return n <= fallos ? Promise.reject(new Error('disco')) : realGet(k);
    });
    let p1: SyncEngine | null = null;
    try {
      p1 = await procesoNuevo(uid, adapter);
      // Otra edicion, para que la cola se escriba (y, sin leer, se relea).
      const z = {value: 'z', updatedAt: T + 300_000};
      localStore.set('doc-z', z as unknown as SyncEntity<TestEntity>);
      p1.queueWrite('test', 'doc-z', z);
      await settle();
      await online(p1);
      return {
        lecturasDeCola: n,
        conflictos: p1.__getConflictsForTests().length,
        local: localStore.get('doc-q')!.value,
        nube: await nubeDe(uid, 'doc-q'),
        cola: enCola(p1),
      };
    } finally {
      getItemMock.mockImplementation(realGet);
      p1?.stop();
      await settle();
    }
  }

  it('R9-126: la sonda de la 49 con la cola leida: tras reiniciar, LWW aplica R y D no sube encima (local R, nube R)', async () => {
    const r = await caso49('uid-126-49-leida', 0);
    expect(r).toEqual({
      lecturasDeCola: 1,
      conflictos: 0,
      local: 'R',
      nube: 'R',
      cola: [],
    });
  }, 30_000);

  it('R9-126: la sonda de la 49 con la primera lectura de la cola fallida (R9-212): la entrada de D, unida despues, tampoco sube', async () => {
    const r = await caso49('uid-126-49-unaVez', 1);
    expect(r.lecturasDeCola).toBeGreaterThanOrEqual(2);
    expect(r).toMatchObject({conflictos: 0, local: 'R', nube: 'R', cola: []});
  }, 30_000);

  it('CONTROL R9-126: una entrada MAS NUEVA que la copia que LWW aplica se queda y sube', async () => {
    const uid = 'uid-126-nueva';
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    engine.__setOnlineForTests(false);
    // La copia local sigue en L (el adaptador aun no la reflejo, R9-174) y
    // la entrada en cola es N, mas nueva que R.
    localStore.set('doc-q', {
      value: 'L',
      updatedAt: T,
    } as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-q', {value: 'N', updatedAt: T + 200_000});
    await settle();
    write(uid, 'doc-q', {value: 'R', updatedAt: T + 120_000});
    await settle();
    // Control del mecanismo: LWW aplico R (paso por la rama del arreglo).
    expect(localStore.get('doc-q')!.value).toBe('R');
    expect(enCola(engine)).toEqual([[uid, 'doc-q']]);
    expect(engine.getState().pendingWrites).toBe(1);
    expect(await colaEnDisco()).toEqual([[uid, 'doc-q']]);
    await online(engine);
    expect(await nubeDe(uid, 'doc-q')).toBe('N');
    engine.stop();
  });

  it('CONTROL R9-126: la entrada de OTRA cuenta del mismo doc no se toca', async () => {
    const T = Date.now() - HOUR;
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    await AsyncStorage.setItem('@sync_first_push_done:uid-126-b', '2');
    await AsyncStorage.setItem(
      cursorStorageKey('test', 'uid-126-b'),
      String(T),
    );
    const {engine, localStore} = await engineFor('uid-126-b', T, fixture);
    engine.__setOnlineForTests(false);
    const D = {value: 'D de B', updatedAt: T + 60_000};
    localStore.set('doc-q', D as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-q', D);
    await settle();
    engine.stop();
    await settle();
    await AsyncStorage.setItem('@sync_first_push_done:uid-126-a', '2');
    await AsyncStorage.setItem(
      cursorStorageKey('test', 'uid-126-a'),
      String(T),
    );
    await engine.start('uid-126-a');
    await settle();
    engine.__setOnlineForTests(false);
    write('uid-126-a', 'doc-q', {value: 'R de A', updatedAt: T + 120_000});
    await settle();
    // Control del mecanismo: LWW aplico la copia de A.
    expect(localStore.get('doc-q')!.value).toBe('R de A');
    expect(enCola(engine)).toEqual([['uid-126-b', 'doc-q']]);
    expect(await colaEnDisco()).toEqual([['uid-126-b', 'doc-q']]);
    engine.stop();
  });

  it('CONTROL R9-126: un apply que lanza (R9-128) no quita la entrada en cola', async () => {
    const uid = 'uid-126-lanza';
    const T = Date.now() - HOUR;
    const fixture = makeAdapter({getMaterialFields: () => ['value']});
    let applyCalls = 0;
    fixture.adapter.applyRemoteUpsert = async () => {
      applyCalls += 1;
      throw new Error('disco lleno');
    };
    const {engine, localStore} = await engineFor(uid, T, fixture);
    engine.__setOnlineForTests(false);
    const D = {value: 'D', updatedAt: T + 60_000};
    localStore.set('doc-q', D as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-q', D);
    await settle();
    write(uid, 'doc-q', {value: 'R', updatedAt: T + 120_000});
    await settle();
    // Control del mecanismo: el apply se intento y fallo.
    expect(applyCalls).toBe(1);
    expect(localStore.get('doc-q')!.value).toBe('D');
    expect(enCola(engine)).toEqual([[uid, 'doc-q']]);
    expect(engine.getState().pendingWrites).toBe(1);
    expect(await colaEnDisco()).toEqual([[uid, 'doc-q']]);
    engine.stop();
  });

  /** Un doc en la nube: su valor, `lapida` o `null`. */
  const nubeRaw = async (uid: string, id: string) => {
    const snap = await mockCollections.get(`users/${uid}/test`)!.doc(id).get();
    if (!snap.exists) return null;
    const d = snap.data() as Data;
    return d.deleted === true ? 'lapida' : (d.value as string);
  };

  it('R9-126 + R9-212: con la cola sin leer, quitar la entrada no escribe la cola; si la relectura tambien falla, el disco conserva la entrada de OTRO doc', async () => {
    const uid = 'uid-126-guarda';
    const T = Date.now() - HOUR;
    const getItemMock = AsyncStorage.getItem as unknown as jest.Mock;
    const realGet = getItemMock.getMockImplementation()!;
    const {engine, localStore, adapter} = await engineFor(uid, T);
    engine.__setOnlineForTests(false);
    // Proceso 1: deja en disco D1 (doc-q) y O (doc-o, una edicion sin subir).
    const D1 = {value: 'D1', updatedAt: T + 30_000};
    const O = {value: 'O', updatedAt: T + 40_000};
    localStore.set('doc-q', D1 as unknown as SyncEntity<TestEntity>);
    localStore.set('doc-o', O as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-q', D1);
    engine.queueWrite('test', 'doc-o', O);
    await settle();
    engine.stop();
    await settle();
    write(uid, 'doc-q', {value: 'R', updatedAt: T + 120_000});
    await AsyncStorage.setItem('@local_store_owner_uid', uid);
    // Proceso 2: las 4 primeras lecturas de la cola fallan.
    let n = 0;
    getItemMock.mockImplementation((k: string) => {
      if (k !== '@sync_queue_v1') return realGet(k);
      n += 1;
      return n <= 4 ? Promise.reject(new Error('disco')) : realGet(k);
    });
    const p = new SyncEngine();
    try {
      p.register(adapter);
      // Una edicion D2 de doc-q en memoria, antes del attach.
      const D2 = {value: 'D2', updatedAt: T + 60_000};
      localStore.set('doc-q', D2 as unknown as SyncEntity<TestEntity>);
      p.queueWrite('test', 'doc-q', D2);
      await settle();
      const netInfo = jest.requireMock('@react-native-community/netinfo')
        .default as {fetch: jest.Mock};
      netInfo.fetch.mockResolvedValueOnce({
        isConnected: false,
        isInternetReachable: false,
      });
      await p.start(uid);
      await settle();
      // Control del mecanismo: LWW aplico R y la entrada de D2 salio (C).
      expect(localStore.get('doc-q')!.value).toBe('R');
      expect(enCola(p)).toEqual([]);
      // O sigue en disco: llega al proceso siguiente.
      const raw = (await realGet('@sync_queue_v1')) as string | null;
      const disco = raw
        ? (JSON.parse(raw) as Array<{uid: string; id: string}>).map(e => [
            e.uid,
            e.id,
          ])
        : [];
      expect(disco).toContainEqual([uid, 'doc-o']);
    } finally {
      getItemMock.mockImplementation(realGet);
      p.stop();
      await settle();
    }
  }, 30_000);

  it('R9-126: un borrado remoto MAS NUEVO que una entrada viva en cola la quita: no sube, y la nube queda con la lapida (no revive el doc)', async () => {
    const uid = 'uid-126-borrado';
    const T = Date.now() - HOUR;
    const {engine, localStore, remoteDeleteCalls} = await engineFor(uid, T);
    write(uid, 'doc-d', {value: 'V', updatedAt: T});
    await settle();
    engine.__setOnlineForTests(false);
    const D = {value: 'D', updatedAt: T + 60_000};
    localStore.set('doc-d', D as unknown as SyncEntity<TestEntity>);
    engine.queueWrite('test', 'doc-d', D);
    await settle();
    write(uid, 'doc-d', {
      value: 'V',
      updatedAt: T + 120_000,
      deleted: true,
      deletedAt: T + 120_000,
    });
    await settle();
    // Control del mecanismo: LWW aplico el borrado.
    expect(remoteDeleteCalls).toEqual(['doc-d']);
    expect(localStore.has('doc-d')).toBe(false);
    expect(enCola(engine)).toEqual([]);
    expect(engine.getState().pendingWrites).toBe(0);
    expect(await colaEnDisco()).toEqual([]);
    await online(engine);
    expect(await nubeRaw(uid, 'doc-d')).toBe('lapida');
    engine.stop();
  });

  /** Una lapida propia en cola (sin red, sin copia local) y una copia viva
   *  del otro, `delta` ms respecto de la lapida. */
  async function lapidaEnCola(uid: string, delta: number) {
    const T = Date.now() - HOUR;
    const {engine, localStore} = await engineFor(uid, T);
    const V = {value: 'V', updatedAt: T};
    write(uid, 'doc-t', V);
    await settle();
    engine.__setOnlineForTests(false);
    localStore.delete('doc-t');
    engine.queueDelete('test', 'doc-t', V);
    await settle();
    const tomb = engine.__getQueueForTests().find(e => e.id === 'doc-t')!
      .data as {updatedAt: number; deleted?: unknown};
    expect(tomb.deleted).toBe(true);
    write(uid, 'doc-t', {value: 'R', updatedAt: tomb.updatedAt + delta});
    await settle();
    return {engine, localStore};
  }

  it('R9-126: una lapida propia en cola y una copia viva MAS NUEVA del otro: LWW aplica la copia y la lapida sale de la cola (no borra en la nube)', async () => {
    const uid = 'uid-126-lapida';
    const {engine, localStore} = await lapidaEnCola(uid, 60_000);
    expect(localStore.get('doc-t')!.value).toBe('R');
    expect(enCola(engine)).toEqual([]);
    await online(engine);
    expect(await nubeRaw(uid, 'doc-t')).toBe('R');
    expect(localStore.get('doc-t')!.value).toBe('R');
    engine.stop();
  });

  it('CONTROL R9-126 / R9-262: una lapida propia en cola y una copia NO mas nueva: el doc sigue retenido, la lapida sube', async () => {
    const uid = 'uid-126-lapida-vieja';
    const {engine, localStore} = await lapidaEnCola(uid, -60_000);
    expect(localStore.has('doc-t')).toBe(false);
    expect(enCola(engine)).toEqual([[uid, 'doc-t']]);
    await online(engine);
    expect(await nubeRaw(uid, 'doc-t')).toBe('lapida');
    expect(localStore.has('doc-t')).toBe(false);
    engine.stop();
  });
});
