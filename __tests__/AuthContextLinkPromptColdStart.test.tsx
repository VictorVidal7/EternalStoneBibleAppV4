/**
 * R9-166 — the link branch of `signInWithGoogle` asked AFTER linking.
 *
 * `linkWithCredential` turns the anonymous uid into the Google account for
 * good: on the server and in Firebase's persisted session. With the migration
 * question still open, a process death (swiped away from recents, or Android
 * reclaiming it in the background) left a LINKED user behind and no answer.
 * The cold start rehydrated it as non-anonymous, SyncEngineProvider started
 * the engine, and the initial bulk push uploaded the previous owner's whole
 * store into the new account without asking.
 *
 * The bug lives in the hand-off between the auth provider and the engine, so
 * both are REAL here: AuthProvider, SyncEngineProvider and SyncEngine. Only
 * the native edges are stubbed: Firebase Auth, Google Sign-In, Firestore
 * (every `doc().set()` is recorded as a push), NetInfo, and the adapter
 * registry (one in-memory "notes" adapter holding Ana's 12 notes).
 * AsyncStorage stands in for the disk, so it survives a kill:
 *  - kill the app = unmount the tree, stop its engine and drop the auth
 *    listeners (a dead process keeps nothing in memory);
 *  - cold start = mount a fresh tree and emit the session Firebase persisted.
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Text} from 'react-native';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';

// ---- Firestore: every doc().set() is a push to the cloud ----
const mockPushes: Array<{path: string; id: string}> = [];
jest.mock('../src/lib/sync/firestore', () => {
  const query = (path: string): Record<string, unknown> => {
    const q: Record<string, unknown> = {
      where: () => q,
      orderBy: () => q,
      limit: () => q,
      onSnapshot: (...args: unknown[]) => {
        // R9-126 option E — like the SDK, a listener gets its first snapshot (empty
        // here): the initial bulk push waits for it.
        const next = args.find(a => typeof a === 'function');
        setImmediate(() => {
          if (typeof next === 'function') next({docChanges: () => [], size: 0});
        });
        return () => {};
      },
      get: async () => ({docs: [], docChanges: () => [], size: 0}),
      doc: (id: string) => ({
        set: async () => {
          mockPushes.push({path, id});
        },
        get: async () => ({exists: false, id, data: () => undefined}),
        delete: async () => {},
      }),
    };
    return q;
  };
  return {
    __esModule: true,
    getFirestore: () => () => ({collection: query}),
    serverTimestamp: () => 'SERVER_TS',
    __resetFirestoreCacheForTests: () => {},
  };
});

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: () => () => {},
    fetch: () =>
      Promise.resolve({isConnected: true, isInternetReachable: true}),
  },
}));

// ---- Firebase Auth ----
type MockFbUser = {uid: string; isAnonymous: boolean};
/** Firebase's persisted session: what a cold start rehydrates. */
let mockCurrentUser: MockFbUser | null = null;
const mockAuthListeners: Array<(user: unknown) => void> = [];
// A successful link upgrades the anonymous user in place (same uid) and, like
// the real SDK, does not fire onAuthStateChanged.
const mockLinkWithCredential = jest.fn(
  async (user: MockFbUser, _credential: unknown) => {
    user.isAnonymous = false;
    return {user};
  },
);
const mockSignInWithCredential = jest.fn(async (_credential: unknown) => ({
  user: mockCurrentUser,
}));
const mockSignInAnonymously = jest.fn(async () => ({user: mockCurrentUser}));
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  getAuth: () => ({
    get currentUser() {
      return mockCurrentUser;
    },
  }),
  onAuthStateChanged: (_auth: unknown, cb: (user: unknown) => void) => {
    mockAuthListeners.push(cb);
    return () => {
      const i = mockAuthListeners.indexOf(cb);
      if (i >= 0) mockAuthListeners.splice(i, 1);
    };
  },
  signInAnonymously: () => mockSignInAnonymously(),
  signInWithCredential: (_auth: unknown, credential: unknown) =>
    mockSignInWithCredential(credential),
  signOut: async () => {},
  linkWithCredential: (user: MockFbUser, credential: unknown) =>
    mockLinkWithCredential(user, credential),
  updateProfile: async () => {},
  deleteUser: async () => {},
  reauthenticateWithCredential: async () => ({user: null}),
  GoogleAuthProvider: {
    credential: (idToken: string) => ({providerId: 'google.com', idToken}),
  },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: () => {},
    hasPlayServices: async () => true,
    signIn: async () => ({idToken: 'beto-id-token'}),
    signOut: async () => {},
    revokeAccess: async () => {},
  },
}));

// Side effects of an auth event that this file does not look at. These are
// the only named imports the provider tree takes from each module.
jest.mock('@lib/memory/memoryStatsSync', () => ({
  __esModule: true,
  seedMemoryStatsFloorIfFresh: async () => {},
  clearMemoryStatsFloor: async () => {},
}));
jest.mock('@lib/offering/offeringService', () => ({
  __esModule: true,
  linkUser: async () => {},
  linkUpgradedUser: async () => {},
  setSessionAccount: () => {},
  forgetSessionAccount: async () => {},
}));

// ---- Ana's private notes, left on the shared phone after she signed out ----
type MockNote = {text: string; updatedAt: number};
const mockLocalNotes = new Map<string, MockNote>();
jest.mock('@lib/sync/registerOfflineAdapters', () => ({
  __esModule: true,
  registerOfflineAdapters: (engine: {register: (adapter: unknown) => void}) => {
    engine.register({
      collection: 'notes',
      getLocal: async (id: string) => mockLocalNotes.get(id) ?? null,
      applyRemoteUpsert: async (id: string, data: MockNote) => {
        mockLocalNotes.set(id, data);
      },
      applyRemoteDelete: async (id: string) => {
        mockLocalNotes.delete(id);
      },
      pullAllLocal: async () =>
        Array.from(mockLocalNotes, ([id, data]) => ({id, data})),
    });
  },
}));

import {logger} from '../src/lib/utils/logger';
import {AuthProvider, useAuth} from '../src/context/AuthContext';
import {
  SyncEngineProvider,
  useSyncEngine,
} from '../src/context/SyncEngineContext';
import type {SyncEngine} from '../src/lib/sync';

jest.spyOn(logger, 'error').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});
jest.spyOn(logger, 'info').mockImplementation(() => {});

const ANA = 'ana-uid';
/** Beto's anonymous uid. A successful link keeps it: it becomes his account. */
const BETO = 'anon-beto';
/** Beto's Google account when it ALREADY exists (the link collides). */
const BETO_EXISTING = 'beto-google-uid';
const JUST_SIGN_IN = 'Solo iniciar sesión';
const MIGRATE = 'Migrar';

const app: {
  auth: ReturnType<typeof useAuth> | null;
  engine: SyncEngine | null;
} = {auth: null, engine: null};

function Probe() {
  const auth = useAuth();
  const {engine} = useSyncEngine();
  React.useEffect(() => {
    app.auth = auth;
    app.engine = engine;
  }, [auth, engine]);
  const account = !auth.user
    ? 'none'
    : auth.user.isAnonymous
      ? 'anonymous'
      : 'google';
  return <Text testID="account">{account}</Text>;
}

type Screen = ReturnType<typeof render>;

function launch(): Screen {
  return render(
    <AuthProvider>
      <SyncEngineProvider>
        <Probe />
      </SyncEngineProvider>
    </AuthProvider>,
  );
}

/** Firebase hands the provider whatever session it persisted. */
async function rehydrate() {
  await act(async () => {
    mockAuthListeners.forEach(l => l(mockCurrentUser));
  });
}

/** The process dies: only AsyncStorage and Firebase's session survive. */
function kill(screen: Screen) {
  const engine = app.engine;
  screen.unmount();
  engine?.stop();
  mockAuthListeners.length = 0;
  app.auth = null;
  app.engine = null;
}

/** Give a started engine every tick it needs: hydrate, attach, bulk push and
 *  flush. Long enough to see all 12 pushes land when the bug is present. */
async function settle() {
  for (let i = 0; i < 25; i++) {
    await act(async () => {
      await new Promise(resolve => setImmediate(resolve));
    });
  }
}

function tapSignIn(): Promise<unknown> {
  let pending!: Promise<unknown>;
  act(() => {
    pending = app.auth!.signInWithGoogle();
  });
  return pending;
}

async function answer(screen: Screen, label: string) {
  const button = await waitFor(() => screen.getByText(label));
  await act(async () => {
    fireEvent.press(button);
  });
}

const account = (screen: Screen) =>
  screen.getByTestId('account').props.children;
const pushesInto = (uid: string) =>
  mockPushes.filter(p => p.path === `users/${uid}/notes`).length;
const bulkPushFlag = (uid: string) =>
  AsyncStorage.getItem(`@sync_first_push_done:${uid}`);
const storeOwner = () => AsyncStorage.getItem('@local_store_owner_uid');

beforeEach(async () => {
  await AsyncStorage.clear();
  mockPushes.length = 0;
  mockAuthListeners.length = 0;
  mockLocalNotes.clear();
  for (let i = 1; i <= 12; i++) {
    mockLocalNotes.set(`note-${i}`, {
      text: `Nota privada ${i} de Ana`,
      updatedAt: 1_000 + i,
    });
  }
  // Ana signed out (local data survives by design): the store is still hers,
  // and the anonymous session that started on top of it is Beto's.
  await AsyncStorage.setItem('@local_store_owner_uid', ANA);
  mockCurrentUser = {uid: BETO, isAnonymous: true};
  mockLinkWithCredential.mockClear();
  mockSignInWithCredential.mockClear();
  mockSignInAnonymously.mockClear();
});

afterEach(() => {
  app.engine?.stop();
});

describe('R9-166 — the link branch decides before the account exists', () => {
  it.each([
    [JUST_SIGN_IN, 0, 'skip'],
    [MIGRATE, 12, '2'],
  ])(
    'the app dies with the question open: the cold start uploads nothing, and the next sign-in asks again (%s → %i)',
    async (label, pushes, flag) => {
      let screen = launch();
      await rehydrate();
      expect(account(screen)).toBe('anonymous');

      void tapSignIn();
      await waitFor(() => screen.getByText(JUST_SIGN_IN));
      kill(screen);

      screen = launch();
      await rehydrate();
      await settle();
      expect(pushesInto(BETO)).toBe(0);
      expect(await bulkPushFlag(BETO)).toBeNull();
      // No answer, no account: Beto is still the anonymous session he was,
      // and Ana's store is still unclaimed by anyone else.
      expect(account(screen)).toBe('anonymous');
      expect(await storeOwner()).toBe(ANA);
      expect(mockSignInAnonymously).not.toHaveBeenCalled();

      // He taps «Iniciar sesión» again, and the question comes back.
      const signIn = tapSignIn();
      await answer(screen, label);
      await act(async () => {
        await signIn;
      });
      await waitFor(async () => expect(await bulkPushFlag(BETO)).toBe(flag));
      await settle();
      expect(pushesInto(BETO)).toBe(pushes);
      expect(account(screen)).toBe('google');
      expect(await storeOwner()).toBe(BETO);
    },
  );

  it.each([
    [JUST_SIGN_IN, 0, 'skip'],
    [MIGRATE, 12, '2'],
  ])(
    'control — answered normally, the link branch does what the answer says (%s → %i)',
    async (label, pushes, flag) => {
      const screen = launch();
      await rehydrate();

      const signIn = tapSignIn();
      await answer(screen, label);
      await act(async () => {
        await signIn;
      });
      await waitFor(async () => expect(await bulkPushFlag(BETO)).toBe(flag));
      await settle();
      expect(mockLinkWithCredential).toHaveBeenCalledTimes(1);
      expect(pushesInto(BETO)).toBe(pushes);
      expect(await storeOwner()).toBe(BETO);

      // And the answer outlives the process: a later cold start of the same
      // account neither re-asks nor pushes again.
      kill(screen);
      const again = launch();
      await rehydrate();
      await settle();
      expect(again.queryByText(JUST_SIGN_IN)).toBeNull();
      expect(pushesInto(BETO)).toBe(pushes);
    },
  );

  it('a link that fails for another reason leaves nothing armed: the next sign-in asks again and «Migrar» uploads', async () => {
    const screen = launch();
    await rehydrate();

    mockLinkWithCredential.mockRejectedValueOnce(
      Object.assign(new Error('network'), {
        code: 'auth/network-request-failed',
      }),
    );
    const first = tapSignIn();
    first.catch(() => {});
    await answer(screen, JUST_SIGN_IN);
    await expect(first).rejects.toMatchObject({
      code: 'auth/network-request-failed',
    });
    // The sign-in never happened, so neither did the answer's consequences:
    // no account, and the store is not claimed.
    expect(account(screen)).toBe('anonymous');
    expect(await storeOwner()).toBe(ANA);

    const second = tapSignIn();
    await answer(screen, MIGRATE);
    await act(async () => {
      await second;
    });
    await waitFor(() => expect(pushesInto(BETO)).toBe(12));
    expect(await bulkPushFlag(BETO)).toBe('2');
    expect(mockLinkWithCredential).toHaveBeenCalledTimes(2);
  });

  describe('the collision branch (the Google account already exists)', () => {
    beforeEach(() => {
      mockLinkWithCredential.mockRejectedValueOnce(
        Object.assign(new Error('already in use'), {
          code: 'auth/credential-already-in-use',
        }),
      );
      mockSignInWithCredential.mockImplementationOnce(async () => {
        mockCurrentUser = {uid: BETO_EXISTING, isAnonymous: false};
        // A real sign-in fires onAuthStateChanged: that starts the engine.
        mockAuthListeners.forEach(l => l(mockCurrentUser));
        return {user: mockCurrentUser};
      });
    });

    it('the app dies with the question open: the user is still anonymous, nothing uploads', async () => {
      let screen = launch();
      await rehydrate();
      void tapSignIn();
      await waitFor(() => screen.getByText(JUST_SIGN_IN));
      kill(screen);

      screen = launch();
      await rehydrate();
      await settle();
      expect(mockSignInWithCredential).not.toHaveBeenCalled();
      expect(account(screen)).toBe('anonymous');
      expect(pushesInto(BETO)).toBe(0);
      expect(pushesInto(BETO_EXISTING)).toBe(0);
    });

    it.each([
      [JUST_SIGN_IN, 0, 'skip'],
      [MIGRATE, 12, '2'],
    ])(
      'asked once, and the answer holds for the existing account (%s → %i)',
      async (label, pushes, flag) => {
        const screen = launch();
        await rehydrate();

        const signIn = tapSignIn();
        await answer(screen, label);
        // One question: nothing asks again once the link has collided.
        await waitFor(() =>
          expect(mockSignInWithCredential).toHaveBeenCalledTimes(1),
        );
        expect(screen.queryByText(JUST_SIGN_IN)).toBeNull();
        await act(async () => {
          await signIn;
        });
        await waitFor(async () =>
          expect(await bulkPushFlag(BETO_EXISTING)).toBe(flag),
        );
        await settle();
        expect(pushesInto(BETO_EXISTING)).toBe(pushes);
        expect(pushesInto(BETO)).toBe(0);
        expect(await storeOwner()).toBe(BETO_EXISTING);
      },
    );
  });
});

/**
 * R9-158 — the owner guard failed OPEN. `getLocalStoreOwner` answered `null`
 * for a marker it could not read, which every branch reads as «first sign-in,
 * don't ask», and `claimLocalStore` swallowed a write that failed, so the
 * marker on disk stayed an older owner (or none) and the next sign-in took it
 * for the truth. Either way the bulk push uploaded Ana's 12 notes into Beto's
 * account without a word (measured in session 25). Decided: fail CLOSED, ask.
 *
 * Same harness as above: the real AuthProvider, SyncEngineProvider and engine.
 * AsyncStorage fails for the marker's key only, a read or a write.
 */
describe('R9-158 — con el dueño del almacén sin poder saberse, se pregunta', () => {
  const OWNER = '@local_store_owner_uid';
  const getItem = AsyncStorage.getItem as unknown as jest.Mock;
  const setItem = AsyncStorage.setItem as unknown as jest.Mock;
  const realGet = getItem.getMockImplementation()!;
  const realSet = setItem.getMockImplementation()!;
  /** How many times the marker was asked for and could not be read. */
  let failedReads = 0;
  /** How many claims did not reach disk. */
  let failedClaims = 0;

  function markerUnreadable() {
    getItem.mockImplementation(async (k: string, ...rest: unknown[]) => {
      if (k === OWNER) {
        failedReads += 1;
        throw new Error('marca ilegible');
      }
      return realGet(k, ...rest);
    });
  }
  function claimsFail() {
    setItem.mockImplementation(
      async (k: string, v: string, ...rest: unknown[]) => {
        if (k === OWNER) {
          failedClaims += 1;
          throw new Error('disco');
        }
        return realSet(k, v, ...rest);
      },
    );
  }
  /** Whether the question came up; answered with `label` if it did. */
  async function answerIfAsked(screen: Screen, label: string) {
    const asked = await waitFor(() => screen.getByText(label)).then(
      () => true,
      () => false,
    );
    if (asked) await answer(screen, label);
    return asked;
  }

  beforeEach(() => {
    failedReads = 0;
    failedClaims = 0;
    // The collision tests above queue a `...Once` each that the one killed
    // with the question open never takes, and `mockClear()` keeps it: left
    // there, the first link here collided.
    mockLinkWithCredential.mockReset();
    mockLinkWithCredential.mockImplementation(async user => {
      user.isAnonymous = false;
      return {user};
    });
    mockSignInWithCredential.mockReset();
    mockSignInWithCredential.mockImplementation(async () => ({
      user: mockCurrentUser,
    }));
  });
  afterEach(() => {
    getItem.mockImplementation(realGet);
    setItem.mockImplementation(realSet);
  });

  it.each([
    [JUST_SIGN_IN, 0, 'skip'],
    [MIGRATE, 12, '2'],
  ])(
    'la marca ilegible, rama del link: pregunta, y el inicio de sesion termina con cualquiera de las dos respuestas (%s → %i)',
    async (label, pushes, flag) => {
      markerUnreadable();
      const screen = launch();
      await rehydrate();

      const signIn = tapSignIn();
      const asked = await answerIfAsked(screen, label);
      await act(async () => {
        await signIn;
      });
      await settle();
      // Sin R9-158: asked false y 12 subidas, con las dos respuestas.
      expect({
        ilegible: failedReads > 0, // CONTROL: la lectura fallo de verdad
        asked,
        subidas: pushesInto(BETO),
        flag: await bulkPushFlag(BETO),
        cuenta: account(screen),
        sigueAbierta: screen.queryByText(JUST_SIGN_IN) !== null,
      }).toEqual({
        ilegible: true,
        asked: true,
        subidas: pushes,
        flag,
        cuenta: 'google',
        sigueAbierta: false,
      });
    },
  );

  it('la marca ilegible, sin anonimo que enlazar: pregunta antes del signInWithCredential', async () => {
    markerUnreadable();
    // The anonymous sign-in after Ana's sign-out failed offline (R9-125).
    mockCurrentUser = null;
    mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
    mockSignInWithCredential.mockImplementationOnce(async () => {
      mockCurrentUser = {uid: BETO_EXISTING, isAnonymous: false};
      mockAuthListeners.forEach(l => l(mockCurrentUser));
      return {user: mockCurrentUser};
    });
    const screen = launch();
    await rehydrate();
    expect(account(screen)).toBe('none');

    const signIn = tapSignIn();
    const asked = await answerIfAsked(screen, JUST_SIGN_IN);
    await act(async () => {
      await signIn;
    });
    await settle();
    // Sin R9-158: asked false y 12 subidas a la cuenta que entra.
    expect({
      ilegible: failedReads > 0, // CONTROL
      asked,
      subidas: pushesInto(BETO_EXISTING),
      cuenta: account(screen),
    }).toEqual({ilegible: true, asked: true, subidas: 0, cuenta: 'google'});
  });

  it('una lectura que sigue fallando: una pregunta por intento, nunca sola ni dos veces', async () => {
    markerUnreadable();
    const screen = launch();
    await rehydrate();

    // First attempt: asked, and the link fails for another reason.
    mockLinkWithCredential.mockRejectedValueOnce(
      Object.assign(new Error('network'), {
        code: 'auth/network-request-failed',
      }),
    );
    const first = tapSignIn();
    first.catch(() => {});
    const askedFirst = await answerIfAsked(screen, JUST_SIGN_IN);
    await expect(first).rejects.toMatchObject({
      code: 'auth/network-request-failed',
    });
    await settle();
    // Nobody tapped «Iniciar sesión» again: nothing asks on its own.
    const askedAlone = screen.queryByText(JUST_SIGN_IN) !== null;

    const second = tapSignIn();
    const askedSecond = await answerIfAsked(screen, JUST_SIGN_IN);
    await act(async () => {
      await second;
    });
    await settle();
    expect({
      askedFirst,
      askedAlone,
      askedSecond,
      askedAgain: screen.queryByText(JUST_SIGN_IN) !== null,
      subidas: pushesInto(BETO),
      cuenta: account(screen),
    }).toEqual({
      askedFirst: true,
      askedAlone: false,
      askedSecond: true,
      askedAgain: false,
      subidas: 0,
      cuenta: 'google',
    });
  });

  it('control — la marca ilegible con el almacen vacio: nada que preguntar, y el inicio de sesion termina solo', async () => {
    markerUnreadable();
    mockLocalNotes.clear();
    const screen = launch();
    await rehydrate();

    // Nobody answers anything here: it resolves on its own or the test hangs.
    await act(async () => {
      await app.auth!.signInWithGoogle();
    });
    await settle();
    expect({
      ilegible: failedReads > 0, // CONTROL
      preguntando: screen.queryByText(JUST_SIGN_IN) !== null,
      cuenta: account(screen),
    }).toEqual({ilegible: true, preguntando: false, cuenta: 'google'});
  });

  it('el gemelo: un reclamo que no llego al disco no deja pasar a la cuenta siguiente sin pregunta, en el mismo proceso', async () => {
    // Ana's first session on this phone: the store was never claimed, and no
    // claim of hers reaches disk (the session restored, and her sign-out).
    await AsyncStorage.removeItem(OWNER);
    claimsFail();
    mockCurrentUser = {uid: ANA, isAnonymous: false};
    const screen = launch();
    await rehydrate();
    await settle();
    const deAna = pushesInto(ANA);
    await act(async () => {
      await app.auth!.signOut();
    });
    const trasAna = await realGet(OWNER);

    // Same process: the anonymous session that follows, and Beto signs in.
    mockCurrentUser = {uid: BETO, isAnonymous: true};
    await rehydrate();
    expect(account(screen)).toBe('anonymous');
    const signIn = tapSignIn();
    const asked = await answerIfAsked(screen, JUST_SIGN_IN);
    await act(async () => {
      await signIn;
    });
    await settle();
    // Sin R9-158: la marca leida es null («primer inicio»), asked false, y
    // las 12 notas de Ana suben a Beto.
    expect({
      deAna, // CONTROL: Ana tuvo su sesion, con sus notas
      reclamosFallidos: failedClaims >= 2, // CONTROL: el restaurado y el cierre
      trasAna, // CONTROL: en disco no quedo nadie
      asked,
      subidas: pushesInto(BETO),
      cuenta: account(screen),
    }).toEqual({
      deAna: 12,
      reclamosFallidos: true,
      trasAna: null,
      asked: true,
      subidas: 0,
      cuenta: 'google',
    });
  });
});
