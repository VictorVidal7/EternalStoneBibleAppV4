/**
 * S154 — R9-128 en `resolveConflict`: un apply local que falla no resuelve nada.
 *
 * El arnés (los mocks de Firestore y NetInfo, `makeAdapter`, `fireRemote`) es una
 * copia del de `SyncEngine.test.ts`.
 *
 * Para la gloria de Dios Todopoderoso ✨
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
import {SyncEngine, unsettledStorageKey} from '../src/lib/sync/SyncEngine';
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

function fireRemote(uid: string, changes: unknown[]): void {
  const coll = mockCollections.get(`users/${uid}/test`);
  if (!coll) throw new Error(`mock collection not registered for ${uid}`);
  (coll as MockCollRef & {__fire: (c: unknown[]) => void}).__fire(changes);
}

// =============================================================
// S154 (agente 2) — R9-128 en `resolveConflict`.
//
// Un adaptador que no pudo escribir RECHAZA (el contrato de R9-128). Entonces
// la resolución no ocurrió: el conflicto sigue esperando al usuario, el doc
// sigue retenido bajo el piso, el cursor no se mueve y no sube nada. La pantalla
// de conflictos ya muestra «No se pudo resolver el conflicto» con un rechazo.
// Cuando el adaptador se tragaba el error, la resolución se daba por hecha: el
// conflicto desaparecía, el cursor pasaba por encima de «lo suyo» y lo local
// seguía con lo mío.
// =============================================================

const UID = 'uid-r128';
const DOC = 'doc-r128';

async function conflictWith(opts: {
  failUpsert?: () => boolean;
  failDelete?: () => boolean;
  theirs?: Record<string, unknown>;
  queuedEdit?: boolean;
}) {
  const engine = new SyncEngine();
  const made = makeAdapter({getMaterialFields: () => ['value']});
  const {adapter, localStore} = made;
  const baseUpsert = adapter.applyRemoteUpsert.bind(adapter);
  const baseDelete = adapter.applyRemoteDelete.bind(adapter);
  adapter.applyRemoteUpsert = async (id, data) => {
    if (opts.failUpsert?.()) throw new Error('database is locked');
    return baseUpsert(id, data);
  };
  adapter.applyRemoteDelete = async id => {
    if (opts.failDelete?.()) throw new Error('database is locked');
    return baseDelete(id);
  };
  localStore.set(DOC, {value: 'mio', updatedAt: 1000});
  // Sin el bulk push inicial: su subida de DOC dejaría una escritura en la
  // cola, y keepTheirs subiría lo suyo re-sellado (R9-161).
  await AsyncStorage.setItem(`@sync_first_push_done:${UID}`, '2');
  engine.register(adapter);
  await engine.start(UID);
  await drain();
  fireRemote(UID, [
    {
      type: 'modified',
      doc: {
        id: DOC,
        exists: true,
        data: () => opts.theirs ?? {value: 'suyo', updatedAt: 1005},
      },
    },
  ]);
  await drain();
  const [conflict] = engine.__getConflictsForTests();
  if (!conflict) throw new Error('la sonda no armó el conflicto');
  if (opts.queuedEdit) {
    // Una edición de este teléfono escrita mientras el conflicto espera:
    // keepTheirs tiene que subir lo suyo re-sellado (R9-161), siga en la cola
    // o ya haya subido (`conflictsWrittenHere`). El CONTROL lo comprueba.
    engine.queueWrite('test', DOC, {value: 'mio-2', updatedAt: 1010});
  }
  const setsBefore = mockDocSets.length;
  return {engine, conflict, setsBefore, ...made};
}

async function unsettledOnDisk(): Promise<Record<string, number>> {
  const raw = await AsyncStorage.getItem(unsettledStorageKey('test', UID));
  return raw ? (JSON.parse(raw) as Record<string, number>) : {};
}

describe('S154 — R9-128: resolveConflict con un apply local que falla', () => {
  it('keepTheirs: rechaza, el conflicto sigue, el cursor no pasa lo suyo y lo local queda', async () => {
    let fail = true;
    const {engine, localStore, conflict} = await conflictWith({
      failUpsert: () => fail,
    });
    expect(await unsettledOnDisk()).toHaveProperty(DOC);

    const outcome = await engine
      .resolveConflict(conflict.id, 'keepTheirs')
      .then(
        () => 'resuelto',
        (e: Error) => e.message,
      );
    await drain();

    expect(engine.__getConflictsForTests().map(c => c.id)).toEqual([
      conflict.id,
    ]);
    expect(engine.getState().conflicts.map(c => c.id)).toEqual([conflict.id]);
    expect(engine.__getCursorForTests('test')).toBe(0);
    expect(await unsettledOnDisk()).toHaveProperty(DOC);
    expect(localStore.get(DOC)?.value).toBe('mio');
    expect(outcome).toBe('database is locked');

    // Y se puede volver a intentar: con el disco sano, se resuelve.
    fail = false;
    await engine.resolveConflict(conflict.id, 'keepTheirs');
    await drain();
    expect(engine.__getConflictsForTests()).toHaveLength(0);
    expect(localStore.get(DOC)?.value).toBe('suyo');
    expect(engine.__getCursorForTests('test')).toBe(1005);
    expect(await unsettledOnDisk()).not.toHaveProperty(DOC);
  });

  it('keepTheirs con lo suyo borrado: el borrado local que falla tampoco asienta', async () => {
    const {engine, localStore, conflict} = await conflictWith({
      failDelete: () => true,
    });
    // El otro teléfono borró el doc mientras el conflicto esperaba (R9-160).
    fireRemote(UID, [
      {
        type: 'modified',
        doc: {
          id: DOC,
          exists: true,
          data: () => ({value: 'suyo', deleted: true, updatedAt: 1020}),
        },
      },
    ]);
    await drain();
    const [pending] = engine.__getConflictsForTests();
    expect(pending.remoteVersion.deleted).toBe(true);

    const outcome = await engine
      .resolveConflict(conflict.id, 'keepTheirs')
      .then(
        () => 'resuelto',
        (e: Error) => e.message,
      );
    await drain();

    expect(engine.__getConflictsForTests()).toHaveLength(1);
    expect(engine.__getCursorForTests('test')).toBe(0);
    expect(await unsettledOnDisk()).toHaveProperty(DOC);
    expect(localStore.get(DOC)?.value).toBe('mio');
    expect(outcome).toBe('database is locked');
  });

  it('keepTheirs con una edición propia escrita después: no sube lo suyo si no se escribió aquí', async () => {
    const {engine, conflict, setsBefore} = await conflictWith({
      failUpsert: () => true,
      queuedEdit: true,
    });

    const outcome = await engine
      .resolveConflict(conflict.id, 'keepTheirs')
      .then(
        () => 'resuelto',
        (e: Error) => e.message,
      );
    await drain();
    await engine.__flushForTests();
    await drain();

    expect(engine.__getConflictsForTests()).toHaveLength(1);
    const pushedValues = mockDocSets
      .slice(setsBefore)
      .filter(d => d.id === DOC)
      .map(d => (d.data as {value: string}).value);
    expect(pushedValues).not.toContain('suyo');
    expect(
      engine
        .__getQueueForTests()
        .filter(w => w.id === DOC)
        .map(w => (w.data as unknown as {value: string}).value),
    ).not.toContain('suyo');
    expect(outcome).toBe('database is locked');
  });

  it('CONTROL: la misma edición con el disco sano, y keepTheirs sí sube lo suyo re-sellado', async () => {
    const {engine, conflict, setsBefore, localStore} = await conflictWith({
      queuedEdit: true,
    });

    await engine.resolveConflict(conflict.id, 'keepTheirs');
    await drain();
    await engine.__flushForTests();
    await drain();

    expect(engine.__getConflictsForTests()).toHaveLength(0);
    expect(localStore.get(DOC)?.value).toBe('suyo');
    const pushed = mockDocSets
      .slice(setsBefore)
      .filter(
        d => d.id === DOC && (d.data as {value: string}).value === 'suyo',
      );
    expect(pushed).toHaveLength(1);
    expect((pushed[0].data as {updatedAt: number}).updatedAt).toBeGreaterThan(
      1010,
    );
  });

  it('keepMine: rechaza sin subir lo mío ni mover el cursor', async () => {
    const {engine, localStore, conflict, setsBefore} = await conflictWith({
      failUpsert: () => true,
    });

    const outcome = await engine.resolveConflict(conflict.id, 'keepMine').then(
      () => 'resuelto',
      (e: Error) => e.message,
    );
    await drain();
    await engine.__flushForTests();
    await drain();

    expect(engine.__getConflictsForTests()).toHaveLength(1);
    expect(engine.__getQueueForTests().filter(w => w.id === DOC)).toHaveLength(
      0,
    );
    expect(
      mockDocSets.slice(setsBefore).filter(d => d.id === DOC),
    ).toHaveLength(0);
    expect(engine.__getCursorForTests('test')).toBe(0);
    expect(await unsettledOnDisk()).toHaveProperty(DOC);
    expect(localStore.get(DOC)).toEqual({value: 'mio', updatedAt: 1000});
    expect(outcome).toBe('database is locked');
  });

  it('merge: rechaza sin subir la mezcla ni mover el cursor', async () => {
    const {engine, localStore, conflict, setsBefore} = await conflictWith({
      failUpsert: () => true,
    });

    const outcome = await engine
      .resolveConflict(conflict.id, 'merge', {
        value: 'mezcla',
        updatedAt: 1,
      })
      .then(
        () => 'resuelto',
        (e: Error) => e.message,
      );
    await drain();
    await engine.__flushForTests();
    await drain();

    expect(engine.__getConflictsForTests()).toHaveLength(1);
    expect(engine.__getQueueForTests().filter(w => w.id === DOC)).toHaveLength(
      0,
    );
    expect(
      mockDocSets.slice(setsBefore).filter(d => d.id === DOC),
    ).toHaveLength(0);
    expect(engine.__getCursorForTests('test')).toBe(0);
    expect(await unsettledOnDisk()).toHaveProperty(DOC);
    expect(localStore.get(DOC)?.value).toBe('mio');
    expect(outcome).toBe('database is locked');
  });
});
