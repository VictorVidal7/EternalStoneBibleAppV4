/**
 * R9-127 — the bulk-push skip belongs to the account it was asked for.
 *
 * `skipNextBulkPush` was one boolean on the engine, with no uid: whoever
 * armed it, the next `start()` of ANY uid consumed it and wrote
 * `@sync_first_push_done:<uid> = 'skip'`, honoured for good. Two doors left it
 * armed for the wrong account:
 *  - `deleteAccount` armed it for "whoever signs in next", and that sign-in's
 *    own question (R9-23: the store's owner is `(deleted)`) could be answered
 *    «Migrar»: the answer was overruled, and nothing local ever went up.
 *    Since session 155 the deletion arms its own skip, only once the wipe and
 *    the deletion went through, and an explicit «Migrar» suspends it (the
 *    second describe below). Written by agent 6 in session 154.
 *  - `signInWithGoogle` arms it BEFORE `signInWithCredential` in the collision
 *    branch and the one with no anonymous user (the uid is unknown until that
 *    sign-in resolves). When the sign-in failed, the skip outlived it.
 *
 * Measured here with the REAL `AuthProvider` and the REAL `SyncEngine` (the
 * native Firestore, NetInfo, Firebase Auth and Google Sign-In are mocked). The
 * engine is started by hand where `SyncEngineProvider` would start it.
 */
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Text} from 'react-native';
import {act, render, waitFor, fireEvent} from '@testing-library/react-native';

// ---- the native Firestore: a set records, a listener never fires ----
const mockSets: Array<{path: string; id: string}> = [];
function mockColl(path: string): Record<string, unknown> {
  const coll: Record<string, unknown> = {
    where: () => coll,
    orderBy: () => coll,
    limit: () => coll,
    onSnapshot: () => () => {},
    get: async () => ({docs: [], empty: true, size: 0}),
    doc: (id: string) => ({
      set: async () => {
        mockSets.push({path, id});
      },
      get: async () => ({exists: false, id, data: () => undefined}),
      delete: async () => {},
    }),
  };
  return coll;
}
const mockFirestoreFn: jest.Mock & {
  FieldValue?: {serverTimestamp: () => string};
} = jest.fn(() => ({
  collection: (path: string) => mockColl(path),
}));
mockFirestoreFn.FieldValue = {serverTimestamp: () => 'SERVER_TS'};
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

// ---- the REAL engine behind `getSyncEngine()` ----
let mockEngine!: SyncEngine;
const mockDeleteAllCloudData = jest.fn(async (_uid: string) => {});
jest.mock('@lib/sync', () => ({
  __esModule: true,
  getSyncEngine: () => mockEngine,
  deleteAllCloudData: (uid: string) => mockDeleteAllCloudData(uid),
}));

// ---- Firebase Auth and Google Sign-In (the shape of AuthContext.test) ----
type Listener = (user: unknown) => void;
const mockListeners: Listener[] = [];
let mockCurrentUser: {uid: string; isAnonymous: boolean} | null = null;
const mockSignInWithCredential = jest.fn();
const mockLinkWithCredential = jest.fn(async (_c: unknown) => ({}));
const mockDeleteUser = jest.fn(async () => {});
const mockSignInAnonymously = jest.fn(async () => {
  mockCurrentUser = {uid: 'anon-x', isAnonymous: true};
  return {user: mockCurrentUser};
});
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  getAuth: () => ({
    get currentUser() {
      return mockCurrentUser;
    },
  }),
  onAuthStateChanged: (_a: unknown, cb: Listener) => {
    mockListeners.push(cb);
    return () => {
      const i = mockListeners.indexOf(cb);
      if (i >= 0) mockListeners.splice(i, 1);
    };
  },
  signInAnonymously: () => mockSignInAnonymously(),
  signInWithCredential: (_a: unknown, c: unknown) =>
    mockSignInWithCredential(c),
  signOut: jest.fn(async () => {}),
  linkWithCredential: (_u: unknown, c: unknown) => mockLinkWithCredential(c),
  updateProfile: jest.fn(async () => {}),
  deleteUser: () => mockDeleteUser(),
  reauthenticateWithCredential: jest.fn(async () => ({})),
  GoogleAuthProvider: {credential: (idToken: string) => ({idToken})},
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(async () => true),
    signIn: jest.fn(async () => ({idToken: 'tok'})),
    signOut: jest.fn(async () => {}),
    revokeAccess: jest.fn(async () => {}),
  },
}));

import {SyncEngine} from '../src/lib/sync/SyncEngine';
import {AuthProvider, useAuth, type AuthUser} from '../src/context/AuthContext';
import {__resetPrepAccountForTests} from '../src/features/study/prepAccount';
import {__resetFirestoreCacheForTests} from '../src/lib/sync/firestore';
import {__resetNetInfoCacheForTests} from '../src/lib/sync/netinfo';
import {logger} from '../src/lib/utils/logger';
import type {SyncAdapter, SyncEntity} from '../src/lib/sync/types';

jest.spyOn(logger, 'error').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'info').mockImplementation(() => {});

const flush = () => new Promise(r => setImmediate(r));
const drain = async () => {
  for (let i = 0; i < 8; i++) await flush();
};
const flag = (uid: string) =>
  AsyncStorage.getItem(`@sync_first_push_done:${uid}`);
const pushesOf = (uid: string) =>
  mockSets.filter(s => s.path === `users/${uid}/notes`).length;

/** An engine with ONE local note that was never pushed anywhere. */
function engineWithLocalNote(): SyncEngine {
  const rows = new Map<string, SyncEntity<{v: string}>>([
    ['n1', {v: 'mi nota', updatedAt: 1000}],
  ]);
  const adapter: SyncAdapter<{v: string}> = {
    collection: 'notes',
    getLocal: async id => rows.get(id) ?? null,
    applyRemoteUpsert: async (id, d) => {
      rows.set(id, d);
    },
    applyRemoteDelete: async id => {
      rows.delete(id);
    },
    pullAllLocal: async () =>
      Array.from(rows.entries()).map(([id, data]) => ({id, data})),
  };
  const engine = new SyncEngine();
  engine.register(adapter);
  return engine;
}

type AuthApi = ReturnType<typeof useAuth>;
function mount() {
  const ref: {current: AuthApi | null} = {current: null};
  function Probe() {
    const api = useAuth();
    React.useEffect(() => {
      ref.current = api;
    }, [api]);
    return <Text>{api.user?.uid ?? 'nadie'}</Text>;
  }
  const utils = render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  return {ref, ...utils};
}
function emit(user: unknown) {
  act(() => {
    mockListeners.forEach(l => l(user));
  });
}
function nextSignInLandsAs(uid: string) {
  mockSignInWithCredential.mockImplementationOnce(async () => {
    mockCurrentUser = {uid, isAnonymous: false};
    return {user: mockCurrentUser};
  });
}
async function signInAnswering(
  ref: {current: AuthApi | null},
  getByText: ReturnType<typeof render>['getByText'],
  answer: 'Migrar' | 'Solo iniciar sesión',
): Promise<AuthUser | null | Error> {
  let p!: Promise<AuthUser | null>;
  act(() => {
    p = ref.current!.signInWithGoogle();
  });
  const btn = await waitFor(() => getByText(answer));
  let out: AuthUser | null | Error = null;
  await act(async () => {
    fireEvent.press(btn);
    out = await p.catch((e: Error) => e);
  });
  return out;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  __resetPrepAccountForTests();
  __resetFirestoreCacheForTests();
  __resetNetInfoCacheForTests();
  mockListeners.length = 0;
  mockSets.length = 0;
  mockCurrentUser = null;
  mockSignInWithCredential.mockReset();
  mockDeleteAllCloudData.mockReset();
  mockDeleteAllCloudData.mockImplementation(async () => {});
  mockEngine = engineWithLocalNote();
});

afterEach(() => {
  mockEngine?.stop();
});

describe('R9-127 — el salto del bulk push es de la cuenta a la que se le pidió', () => {
  it('tras eliminar la cuenta, un «Migrar» de la cuenta siguiente sube lo local', async () => {
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    mockCurrentUser = {uid: 'ana', isAnonymous: false};
    const {ref, getByText} = mount();
    emit(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('ana'));

    await act(async () => {
      await ref.current!.deleteAccount();
    });
    expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
      '(deleted)',
    );

    // The anonymous session that follows, and a brand-new Google account
    // linked on top of it: R9-23 asks, and the person says «Migrar».
    mockCurrentUser = {uid: 'anon-nuevo', isAnonymous: true};
    emit(mockCurrentUser);
    const out = await signInAnswering(ref, getByText, 'Migrar');
    expect((out as AuthUser | null)?.uid).toBe('anon-nuevo');
    expect(mockLinkWithCredential).toHaveBeenCalled();

    // Where SyncEngineProvider starts the engine for the linked account.
    await mockEngine.start('anon-nuevo');
    await drain();
    expect(await flag('anon-nuevo')).not.toBe('skip');
    expect(pushesOf('anon-nuevo')).toBe(1);
  });

  it('control: tras eliminar la cuenta, «Solo iniciar sesión» sí salta, y para esa cuenta', async () => {
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    mockCurrentUser = {uid: 'ana', isAnonymous: false};
    const {ref, getByText} = mount();
    emit(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('ana'));
    await act(async () => {
      await ref.current!.deleteAccount();
    });
    mockCurrentUser = {uid: 'anon-nuevo', isAnonymous: true};
    emit(mockCurrentUser);
    await signInAnswering(ref, getByText, 'Solo iniciar sesión');

    await mockEngine.start('anon-nuevo');
    await drain();
    expect(await flag('anon-nuevo')).toBe('skip');
    expect(pushesOf('anon-nuevo')).toBe(0);
  });

  it('un «Solo iniciar sesión» cuyo inicio de sesión FALLA no se lleva el «Migrar» del reintento', async () => {
    // No anonymous user to link (its sign-in failed offline): the skip is
    // armed before `signInWithCredential`, because the uid is unknown.
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
    const {ref, getByText} = mount();
    await act(async () => {
      mockListeners.forEach(l => l(null));
    });

    mockSignInWithCredential.mockRejectedValueOnce(new Error('network'));
    const first = await signInAnswering(ref, getByText, 'Solo iniciar sesión');
    expect(first).toBeInstanceOf(Error);

    nextSignInLandsAs('beto');
    const second = await signInAnswering(ref, getByText, 'Migrar');
    expect((second as AuthUser | null)?.uid).toBe('beto');

    await mockEngine.start('beto');
    await drain();
    expect(await flag('beto')).not.toBe('skip');
    expect(pushesOf('beto')).toBe(1);
  });

  it('lo mismo en la rama de colisión', async () => {
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    mockCurrentUser = {uid: 'anon-y', isAnonymous: true};
    const {ref, getByText} = mount();
    emit(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-y'));

    // The Google account already has a uid: the link refuses, and the
    // previous-owner answer (asked before the link) is applied there.
    mockLinkWithCredential.mockRejectedValue(
      Object.assign(new Error('in use'), {
        code: 'auth/credential-already-in-use',
      }),
    );
    mockSignInWithCredential.mockRejectedValueOnce(new Error('network'));
    const first = await signInAnswering(ref, getByText, 'Solo iniciar sesión');
    expect(first).toBeInstanceOf(Error);

    nextSignInLandsAs('carla');
    const second = await signInAnswering(ref, getByText, 'Migrar');
    expect((second as AuthUser | null)?.uid).toBe('carla');
    mockLinkWithCredential.mockReset();
    mockLinkWithCredential.mockImplementation(async (_c: unknown) => ({}));

    await mockEngine.start('carla');
    await drain();
    expect(await flag('carla')).not.toBe('skip');
    expect(pushesOf('carla')).toBe(1);
  });

  it('control: «Solo iniciar sesión» con el inicio de sesión que sale bien sigue saltando para esa cuenta', async () => {
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
    const {ref, getByText} = mount();
    await act(async () => {
      mockListeners.forEach(l => l(null));
    });
    nextSignInLandsAs('beto');
    await signInAnswering(ref, getByText, 'Solo iniciar sesión');

    await mockEngine.start('beto');
    await drain();
    expect(await flag('beto')).toBe('skip');
    expect(pushesOf('beto')).toBe(0);
  });

  it('el salto de un inicio de sesión que salió bien queda atado a esa cuenta: si su start no llegó, no se lo lleva la siguiente', async () => {
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
    const {ref, getByText} = mount();
    await act(async () => {
      mockListeners.forEach(l => l(null));
    });
    nextSignInLandsAs('beto');
    await signInAnswering(ref, getByText, 'Solo iniciar sesión');
    // Beto's start never reached the bulk push (the session closed first).
    await act(async () => {
      await ref.current!.signOut();
    });
    mockCurrentUser = {uid: 'anon-carla', isAnonymous: true};
    emit(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-carla'));
    // Carla links a new Google account; the store is Beto's: asked, «Migrar».
    await signInAnswering(ref, getByText, 'Migrar');

    await mockEngine.start('anon-carla');
    await drain();
    expect(await flag('anon-carla')).not.toBe('skip');
    expect(pushesOf('anon-carla')).toBe(1);
  });

  it('lo mismo en la rama del link: el salto lleva el uid que se enlazó', async () => {
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    mockCurrentUser = {uid: 'anon-carla', isAnonymous: true};
    const {ref, getByText} = mount();
    emit(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-carla'));
    await signInAnswering(ref, getByText, 'Solo iniciar sesión');
    // Carla's start never reached the bulk push (the session closed first).
    await act(async () => {
      await ref.current!.signOut();
    });
    mockCurrentUser = {uid: 'anon-dora', isAnonymous: true};
    emit(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-dora'));
    await signInAnswering(ref, getByText, 'Migrar');

    await mockEngine.start('anon-dora');
    await drain();
    expect(await flag('anon-dora')).not.toBe('skip');
    expect(pushesOf('anon-dora')).toBe(1);
  });

  it('el motor: el salto de una cuenta no lo toma el start de otra, y sí el de la suya', async () => {
    const engine: SyncEngine = mockEngine;
    engine.queueSkipNextBulkPush('beto');
    await engine.start('ana');
    await drain();
    expect(await flag('ana')).not.toBe('skip');
    expect(pushesOf('ana')).toBe(1);
    engine.stop();
    await engine.start('beto');
    await drain();
    expect(await flag('beto')).toBe('skip');
    expect(pushesOf('beto')).toBe(0);
  });

  it('el motor: un salto sin uid, asentado en la cuenta que entró, ya no lo toma otra', async () => {
    const engine: SyncEngine = mockEngine;
    engine.queueSkipNextBulkPush().settle('beto');
    await engine.start('ana');
    await drain();
    expect(await flag('ana')).not.toBe('skip');
    engine.stop();
    await engine.start('beto');
    await drain();
    expect(await flag('beto')).toBe('skip');
  });

  it('el motor: un salto sin uid, asentado con null (el inicio falló), no lo toma nadie', async () => {
    const engine: SyncEngine = mockEngine;
    engine.queueSkipNextBulkPush().settle(null);
    await engine.start('beto');
    await drain();
    expect(await flag('beto')).not.toBe('skip');
    expect(pushesOf('beto')).toBe(1);
  });

  it('el motor: un asa vieja no toca el salto que la reemplazó', async () => {
    const engine: SyncEngine = mockEngine;
    const old = engine.queueSkipNextBulkPush();
    engine.queueSkipNextBulkPush('beto');
    old.settle(null);
    old.settle('ana');
    await engine.start('beto');
    await drain();
    expect(await flag('beto')).toBe('skip');
  });

  it('un borrado cuya limpieza de la nube falla no le escribe «skip» a la cuenta que sigue viva', async () => {
    // The account was pushed long ago ('2'), with one collection still to
    // retry (R9-257). The failed wipe restarts the engine for it.
    await AsyncStorage.setItem('@sync_first_push_done:ana', '2');
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana');
    mockCurrentUser = {uid: 'ana', isAnonymous: false};
    const {ref} = mount();
    emit(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('ana'));

    mockDeleteAllCloudData.mockRejectedValueOnce(new Error('quota'));
    let err: unknown = null;
    await act(async () => {
      await ref.current!.deleteAccount().catch(e => {
        err = e;
      });
    });
    expect(err).toBeInstanceOf(Error);
    await drain();
    expect(await flag('ana')).toBe('2');
  });
});

// ---- R9-127, sesión 155: la red del borrado ----
//
// The deletion still leaves a skip for the next account, armed only once the
// wipe and the deletion went through: a sign-in that does not ask (the
// store's owner unreadable, or never recorded) must not upload the rows just
// deleted. A sign-in that asks overrules it: «Migrar» suspends it for that
// attempt, and declining queues its own.
const OWNER = '@local_store_owner_uid';
let ownerGetFails = false;
let ownerSetFails = false;
const realGet = (AsyncStorage.getItem as jest.Mock).getMockImplementation()!;
const realSet = (AsyncStorage.setItem as jest.Mock).getMockImplementation()!;
beforeEach(() => {
  ownerGetFails = false;
  ownerSetFails = false;
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k: string) => {
    if (k === OWNER && ownerGetFails) throw new Error('marca ilegible');
    return realGet(k);
  });
  (AsyncStorage.setItem as jest.Mock).mockImplementation(
    async (k: string, v: string) => {
      if (k === OWNER && ownerSetFails) throw new Error('disco');
      return realSet(k, v);
    },
  );
});

/** Ana, signed in, deletes her account; her note stays on the device. */
async function anaDeletes(opts: {neverClaimed?: boolean} = {}) {
  if (opts.neverClaimed) ownerSetFails = true;
  else await AsyncStorage.setItem(OWNER, 'ana');
  mockCurrentUser = {uid: 'ana', isAnonymous: false};
  const m = mount();
  emit(mockCurrentUser);
  await waitFor(() => expect(m.ref.current?.user?.uid).toBe('ana'));
  await act(async () => {
    await m.ref.current!.deleteAccount();
  });
  return m;
}

/** No anonymous user to link (its sign-in failed offline). */
async function noAnonymousUser() {
  mockCurrentUser = null;
  mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
  await act(async () => {
    mockListeners.forEach(l => l(null));
  });
}

/** A sign-in that asks nothing: it resolves on its own. */
async function signInUnasked(ref: {current: AuthApi | null}) {
  let out: unknown;
  await act(async () => {
    out = await ref.current!.signInWithGoogle().catch((e: Error) => e);
  });
  return out;
}

describe('R9-127 — la red del borrado: armada solo si salió bien, y un «Migrar» la suelta', () => {
  it('tras el borrado, con la marca de dueño ilegible, el link que no pregunta no sube lo borrado', async () => {
    const {ref} = await anaDeletes();
    ownerGetFails = true;
    mockCurrentUser = {uid: 'nuevo', isAnonymous: true};
    emit(mockCurrentUser);
    expect(await signInUnasked(ref)).not.toBeInstanceOf(Error);

    await mockEngine.start('nuevo');
    await drain();
    expect(await flag('nuevo')).toBe('skip');
    expect(pushesOf('nuevo')).toBe(0);
  });

  it('tras el borrado de un almacén nunca reclamado, cuyo reclamo de (deleted) también falla, el inicio sin anónimo no sube lo borrado', async () => {
    const {ref} = await anaDeletes({neverClaimed: true});
    expect(await realGet(OWNER)).toBeNull();
    await noAnonymousUser();
    nextSignInLandsAs('nuevo');
    expect(await signInUnasked(ref)).not.toBeInstanceOf(Error);

    await mockEngine.start('nuevo');
    await drain();
    expect(await flag('nuevo')).toBe('skip');
    expect(pushesOf('nuevo')).toBe(0);
  });

  it('un borrado cuyo deleteUser falla tampoco le escribe «skip» a la cuenta que sigue viva', async () => {
    await AsyncStorage.setItem('@sync_first_push_done:ana', '2');
    await AsyncStorage.setItem(OWNER, 'ana');
    mockCurrentUser = {uid: 'ana', isAnonymous: false};
    const {ref} = mount();
    emit(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('ana'));

    mockDeleteUser.mockRejectedValueOnce(
      Object.assign(new Error('net'), {code: 'auth/network-request-failed'}),
    );
    let err: unknown = null;
    await act(async () => {
      await ref.current!.deleteAccount().catch(e => {
        err = e;
      });
    });
    expect(err).toBeInstanceOf(Error);
    await drain();
    expect(await flag('ana')).toBe('2');
  });

  it('un «Migrar» cuyo inicio de sesión FALLA devuelve la red: el reintento que no pregunta no sube lo borrado', async () => {
    const {ref, getByText} = await anaDeletes();
    await noAnonymousUser();
    mockSignInWithCredential.mockRejectedValueOnce(new Error('network'));
    const first = await signInAnswering(ref, getByText, 'Migrar');
    expect(first).toBeInstanceOf(Error);

    ownerGetFails = true;
    nextSignInLandsAs('nuevo');
    expect(await signInUnasked(ref)).not.toBeInstanceOf(Error);

    await mockEngine.start('nuevo');
    await drain();
    expect(await flag('nuevo')).toBe('skip');
    expect(pushesOf('nuevo')).toBe(0);
  });

  it('lo mismo con un link que falla sin colisión', async () => {
    const {ref, getByText} = await anaDeletes();
    mockCurrentUser = {uid: 'anon-nuevo', isAnonymous: true};
    emit(mockCurrentUser);
    mockLinkWithCredential.mockRejectedValueOnce(new Error('network'));
    const first = await signInAnswering(ref, getByText, 'Migrar');
    expect(first).toBeInstanceOf(Error);

    ownerGetFails = true;
    expect(await signInUnasked(ref)).not.toBeInstanceOf(Error);

    await mockEngine.start('anon-nuevo');
    await drain();
    expect(await flag('anon-nuevo')).toBe('skip');
    expect(pushesOf('anon-nuevo')).toBe(0);
  });

  it('un «Solo iniciar sesión» cuyo inicio de sesión FALLA no se lleva la red del borrado', async () => {
    const {ref, getByText} = await anaDeletes();
    await noAnonymousUser();
    mockSignInWithCredential.mockRejectedValueOnce(new Error('network'));
    const first = await signInAnswering(ref, getByText, 'Solo iniciar sesión');
    expect(first).toBeInstanceOf(Error);

    ownerGetFails = true;
    nextSignInLandsAs('nuevo');
    expect(await signInUnasked(ref)).not.toBeInstanceOf(Error);

    await mockEngine.start('nuevo');
    await drain();
    expect(await flag('nuevo')).toBe('skip');
    expect(pushesOf('nuevo')).toBe(0);
  });

  it('un «Migrar» tras el borrado sube aunque el motor arranque dentro del inicio de sesión', async () => {
    const {ref, getByText} = await anaDeletes();
    await noAnonymousUser();
    // The auth event starts the engine before signInWithGoogle resumes.
    mockSignInWithCredential.mockImplementationOnce(async () => {
      mockCurrentUser = {uid: 'nuevo', isAnonymous: false};
      await mockEngine.start('nuevo');
      return {user: mockCurrentUser};
    });
    const out = await signInAnswering(ref, getByText, 'Migrar');
    expect((out as AuthUser | null)?.uid).toBe('nuevo');

    await drain();
    expect(await flag('nuevo')).not.toBe('skip');
    expect(pushesOf('nuevo')).toBe(1);
  });

  it('un «Migrar» a la pregunta propia de la colisión también suelta la red', async () => {
    // Never claimed: the link branch does not ask, so the collision does.
    const {ref, getByText} = await anaDeletes({neverClaimed: true});
    mockCurrentUser = {uid: 'anon-z', isAnonymous: true};
    emit(mockCurrentUser);
    mockLinkWithCredential.mockRejectedValueOnce(
      Object.assign(new Error('in use'), {
        code: 'auth/credential-already-in-use',
      }),
    );
    nextSignInLandsAs('nuevo');
    const out = await signInAnswering(ref, getByText, 'Migrar');
    expect((out as AuthUser | null)?.uid).toBe('nuevo');

    await mockEngine.start('nuevo');
    await drain();
    expect(await flag('nuevo')).not.toBe('skip');
    expect(pushesOf('nuevo')).toBe(1);
  });

  it('el motor: la red del borrado la toma el start de cualquier cuenta, una sola vez', async () => {
    const engine: SyncEngine = mockEngine;
    engine.queueSkipAfterAccountDeletion();
    await engine.start('nuevo');
    await drain();
    expect(await flag('nuevo')).toBe('skip');
    engine.stop();
    await engine.start('otra');
    await drain();
    expect(await flag('otra')).not.toBe('skip');
    expect(pushesOf('otra')).toBe(1);
  });
});
