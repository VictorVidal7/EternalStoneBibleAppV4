/**
 * R9-37 — `attachListener` checked «already attached» BEFORE awaiting the
 * collection's cursor and unsettled set, and set `unsubs` AFTER. Two attaches
 * of the same collection in flight at once both passed the check, both opened
 * a listener, and the second `unsubs.set` dropped the first one's unsub: a
 * live listener no `stop()` or `unregister()` could close. Every remote change
 * was then applied twice, and billed twice.
 *
 * Its own harness: every `onSnapshot` gets its own unsub, so a listener left
 * open is counted (the shared one in SyncEngine.test.ts keeps a single
 * callback and cannot tell two listeners apart).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface MockListener {
  path: string;
  live: boolean;
  cb: (snapshot: unknown) => void;
}

const mockListeners: MockListener[] = [];

function mockMakeQuery(path: string): Record<string, unknown> {
  const query: Record<string, unknown> = {
    where: jest.fn(() => query),
    orderBy: jest.fn(() => query),
    limit: jest.fn(() => query),
    get: jest.fn(async () => ({docs: [], docChanges: () => [], size: 0})),
    doc: jest.fn(() => ({
      set: jest.fn(async () => {}),
      get: jest.fn(async () => ({exists: false, data: () => undefined})),
      delete: jest.fn(async () => {}),
    })),
    onSnapshot: jest.fn((cb: (snapshot: unknown) => void) => {
      const listener: MockListener = {path, live: true, cb};
      mockListeners.push(listener);
      return () => {
        listener.live = false;
      };
    }),
  };
  return query;
}

const mockFirestoreFn = jest.fn(() => ({
  collection: jest.fn((path: string) => mockMakeQuery(path)),
}));

jest.mock('../src/lib/sync/firestore', () => ({
  __esModule: true,
  getFirestore: () => mockFirestoreFn,
  serverTimestamp: () => 'SERVER_TS',
  __resetFirestoreCacheForTests: () => {},
}));

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: () => () => {},
    fetch: jest.fn(() =>
      Promise.resolve({isConnected: true, isInternetReachable: true}),
    ),
  },
}));

import {SyncEngine, cursorStorageKey} from '../src/lib/sync/SyncEngine';
import {logger} from '../src/lib/utils/logger';
import type {SyncAdapter} from '../src/lib/sync/types';

jest.spyOn(logger, 'error').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});

const UID = 'uid-r937';

function makeAdapter(applied: string[] = []): SyncAdapter<{value: string}> {
  return {
    collection: 'test',
    async getLocal() {
      return null;
    },
    async applyRemoteUpsert(id) {
      applied.push(id);
    },
    async applyRemoteDelete() {},
    async pullAllLocal() {
      return [];
    },
  };
}

/** Holds the read of the `test` cursor until `open()`, the way a slow
 *  AsyncStorage keeps `attachListener` inside its `await`. */
function gateCursorRead(): {open: () => void; waiting: () => number} {
  const original = AsyncStorage.getItem.bind(AsyncStorage);
  const parked: Array<() => void> = [];
  let isOpen = false;
  jest
    .spyOn(AsyncStorage, 'getItem')
    .mockImplementation(async (key: string) => {
      if (!isOpen && key === cursorStorageKey('test', UID)) {
        await new Promise<void>(resolve => parked.push(resolve));
      }
      return original(key);
    });
  return {
    open: () => {
      isOpen = true;
      parked.splice(0).forEach(resolve => resolve());
    },
    waiting: () => parked.length,
  };
}

const flush = () => new Promise(r => setImmediate(r));
const drain = async () => {
  for (let i = 0; i < 10; i++) await flush();
};

const live = () =>
  mockListeners.filter(l => l.live && l.path.endsWith('/test'));

beforeEach(async () => {
  jest.restoreAllMocks();
  jest.spyOn(logger, 'error').mockImplementation(() => {});
  jest.spyOn(logger, 'warn').mockImplementation(() => {});
  await AsyncStorage.clear();
  mockListeners.length = 0;
  // The bulk push is not what this suite is about.
  await AsyncStorage.setItem(`@sync_first_push_done:${UID}`, '2');
});

describe('R9-37 — attachListener no deja un listener huérfano', () => {
  it('un register() mientras start() espera el cursor abre UN listener, y stop() lo cierra', async () => {
    const engine = new SyncEngine();
    const gate = gateCursorRead();
    const started = engine.start(UID);
    // A context registers its adapter while the engine is starting: `start()`
    // set the uid before its first await, so `register()` attaches at once,
    // and `start()` attaches every registered adapter after hydrating.
    engine.register(makeAdapter());
    await drain();
    expect(gate.waiting()).toBe(2); // both attaches are inside the await
    gate.open();
    await started;
    await drain();

    expect(live()).toHaveLength(1);
    engine.stop();
    expect(live()).toHaveLength(0);
  });

  it('start → stop → start del mismo uid con el cursor en vuelo: un listener, y stop() lo cierra', async () => {
    const engine = new SyncEngine();
    engine.register(makeAdapter());
    const gate = gateCursorRead();
    // The cold-start flicker (SyncEngineContext): `user` goes through null for
    // an account still signed in, so stop() and start() of the same uid.
    const first = engine.start(UID);
    await drain();
    expect(gate.waiting()).toBe(1);
    engine.stop();
    const second = engine.start(UID);
    await drain();
    expect(gate.waiting()).toBe(2);
    gate.open();
    await Promise.all([first, second]);
    await drain();

    expect(live()).toHaveLength(1);
    engine.stop();
    expect(live()).toHaveLength(0);
  });

  it('unregister() con el attach en vuelo: no queda ningún listener', async () => {
    const engine = new SyncEngine();
    await engine.start(UID);
    await drain();
    const gate = gateCursorRead();
    // A fresh adapter instance under a collection never attached in this
    // session: the cursor cache is empty, so its attach reads the disk.
    const adapter = makeAdapter();
    engine.register(adapter);
    await drain();
    expect(gate.waiting()).toBe(1);
    engine.unregister('test');
    gate.open();
    await drain();

    expect(live()).toHaveLength(0);
    engine.stop();
  });

  it('un adaptador reemplazado con su attach en vuelo: el listener que queda aplica con el adaptador nuevo', async () => {
    const engine = new SyncEngine();
    await engine.start(UID);
    await drain();
    const gate = gateCursorRead();
    const viejo: string[] = [];
    const nuevo: string[] = [];
    // A context remounts: its adapter is registered again, as a new object,
    // while the first one's attach still waits.
    engine.register(makeAdapter(viejo));
    await drain();
    engine.register(makeAdapter(nuevo));
    await drain();
    expect(gate.waiting()).toBe(2);
    gate.open();
    await drain();

    expect(live()).toHaveLength(1);
    const doc = {value: 'remota', updatedAt: Date.now()};
    live()[0].cb({
      docChanges: () => [
        {type: 'added', doc: {id: 'd1', exists: true, data: () => doc}},
      ],
      size: 1,
    });
    await drain();
    expect({viejo, nuevo}).toEqual({viejo: [], nuevo: ['d1']});
    engine.stop();
  });

  it('CONTROL: un solo attach, sin carrera, abre un listener y stop() lo cierra', async () => {
    const engine = new SyncEngine();
    engine.register(makeAdapter());
    await engine.start(UID);
    await drain();
    expect(live()).toHaveLength(1);
    engine.stop();
    expect(live()).toHaveLength(0);
  });
});
