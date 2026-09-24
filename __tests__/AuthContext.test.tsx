/**
 * Sprint 41 - AuthContext unit tests.
 *
 * Mocks @react-native-firebase/auth and @react-native-google-signin so
 * the lazy `require()` inside AuthContext resolves to controllable
 * fakes. Each test asserts a specific invariant:
 *
 *  - mapFirebaseUser collapses Firebase user shapes into our AuthUser.
 *  - extractIdToken tolerates the three GoogleSignin response shapes.
 *  - The provider hydrates with isLoading=true then flips to false.
 *  - On first null user, signInAnonymously is called exactly once.
 *  - signInWithGoogle on an anonymous user calls linkWithCredential
 *    (the uid-preserving path that S42 sync depends on).
 *  - signInWithGoogle on no current user calls signInWithCredential.
 *  - signOut tears down both Google and Firebase Auth sessions.
 *  - useAuth throws outside the provider.
 */

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Text} from 'react-native';
import {act, render, waitFor, fireEvent} from '@testing-library/react-native';

// Sprint 43 — mock the sync module so the migration block in
// AuthContext can interrogate a stub engine. We replace getSyncEngine
// only for tests that opt in by setting mockEngineStub; the default
// is null so the existing tests behave exactly as before.
const mockExportLocalData = jest.fn().mockResolvedValue([]);
const mockQueueSkipNextBulkPush = jest.fn();
// Sign-out race-fix test — records the ORDER stop()/signOut() actually
// fire in, not just whether they fired, since the bug this guards
// against is specifically about ordering (see AuthContext.signOut).
const callOrder: string[] = [];
const mockEngineStop = jest.fn(() => {
  callOrder.push('engine.stop');
});
let mockEngineStub: {
  exportLocalData: jest.Mock;
  queueSkipNextBulkPush: jest.Mock;
  stop?: jest.Mock;
} | null = null;
jest.mock('@lib/sync', () => ({
  __esModule: true,
  getSyncEngine: () => mockEngineStub,
}));

// --- Mocks must be set up BEFORE importing AuthContext (which lazily
// resolves them via require). The factory returns plain jest.fn()s so
// each test can assert call counts/arguments.

type Listener = (user: unknown) => void;
const mockListeners: Listener[] = [];
const mockOnAuthStateChanged = jest.fn((cb: Listener) => {
  mockListeners.push(cb);
  return () => {
    const idx = mockListeners.indexOf(cb);
    if (idx >= 0) mockListeners.splice(idx, 1);
  };
});
const mockSignInAnonymously = jest
  .fn()
  .mockResolvedValue({user: {uid: 'anon-uid'}});
const mockSignInWithCredential = jest
  .fn()
  .mockResolvedValue({user: {uid: 'google-uid'}});
const mockSignOut = jest.fn(async () => {
  callOrder.push('firebaseAuth.signOut');
});
const mockLinkWithCredential = jest
  .fn()
  .mockResolvedValue({user: {uid: 'anon-uid'}});

type MockCurrentUser = {
  uid: string;
  isAnonymous: boolean;
  linkWithCredential?: jest.Mock;
} | null;
let mockCurrentUser: MockCurrentUser = null;

// Modular API (v26) — auth() is no longer a callable namespaced instance;
// getAuth() returns the instance and every verb (onAuthStateChanged,
// signInAnonymously, signInWithCredential, signOut, linkWithCredential,
// updateProfile, deleteUser, reauthenticateWithCredential) is a free
// function taking the instance/user as its first argument. Kept as one
// `mockAuthFn` object (rather than separate named exports) so the rest
// of this file's `mockAuthFn.GoogleAuthProvider...` references stay
// valid — jest.mock below spreads it into the module's named exports.
const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);
const mockDeleteUser = jest.fn().mockResolvedValue(undefined);
const mockReauthenticateWithCredential = jest
  .fn()
  .mockResolvedValue({user: {uid: 'reauthed-uid'}});

const mockAuthFn: any = {
  getAuth: jest.fn(() => ({
    get currentUser() {
      return mockCurrentUser;
    },
  })),
  onAuthStateChanged: (_auth: unknown, cb: Listener) =>
    mockOnAuthStateChanged(cb),
  signInAnonymously: () => mockSignInAnonymously(),
  signInWithCredential: (_auth: unknown, credential: unknown) =>
    mockSignInWithCredential(credential),
  signOut: () => mockSignOut(),
  linkWithCredential: (_user: MockCurrentUser, credential: unknown) =>
    mockLinkWithCredential(credential),
  updateProfile: mockUpdateProfile,
  deleteUser: mockDeleteUser,
  reauthenticateWithCredential: mockReauthenticateWithCredential,
  GoogleAuthProvider: {
    credential: jest.fn((idToken: string) => ({
      providerId: 'google.com',
      idToken,
    })),
  },
};

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  ...mockAuthFn,
}));

const mockGoogleSignin = {
  configure: jest.fn(),
  hasPlayServices: jest.fn().mockResolvedValue(true),
  signIn: jest.fn().mockResolvedValue({idToken: 'fake-id-token'}),
  signOut: jest.fn().mockResolvedValue(undefined),
  revokeAccess: jest.fn().mockResolvedValue(undefined),
};
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: mockGoogleSignin,
}));

import {logger} from '../src/lib/utils/logger';
import {
  AuthProvider,
  useAuth,
  mapFirebaseUser,
  extractIdToken,
  type AuthUser,
} from '../src/context/AuthContext';

// Spy on the real logger — the lazy Crashlytics require returns null
// in jest (no native binding), so logger calls are effectively no-ops
// at the boundary; the spy lets us assert call sites without
// double-mocking the module path that babel-resolver rewrites.
const mockSetUserId = jest
  .spyOn(logger, 'setUserId')
  .mockImplementation(() => {});
jest.spyOn(logger, 'error').mockImplementation(() => {});
jest.spyOn(logger, 'warn').mockImplementation(() => {});

function flushListenerWith(user: unknown) {
  act(() => {
    mockListeners.forEach(l => l(user));
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  mockListeners.length = 0;
  mockCurrentUser = null;
  mockOnAuthStateChanged.mockClear();
  mockSignInAnonymously.mockClear();
  mockSignInWithCredential.mockClear();
  mockSignOut.mockClear();
  mockLinkWithCredential.mockClear();
  mockGoogleSignin.configure.mockClear();
  mockGoogleSignin.hasPlayServices.mockClear();
  mockGoogleSignin.signIn.mockClear();
  mockGoogleSignin.signOut.mockClear();
  mockSetUserId.mockClear();
  mockAuthFn.GoogleAuthProvider.credential.mockClear();
  mockExportLocalData.mockClear();
  mockQueueSkipNextBulkPush.mockClear();
  mockEngineStop.mockClear();
  callOrder.length = 0;
  mockEngineStub = null;
});

describe('mapFirebaseUser', () => {
  it('returns null for null/undefined input', () => {
    expect(mapFirebaseUser(null)).toBeNull();
    expect(mapFirebaseUser(undefined)).toBeNull();
  });

  it('collapses an anonymous Firebase user', () => {
    const result = mapFirebaseUser({
      uid: 'abc123',
      isAnonymous: true,
      displayName: null,
      email: null,
      photoURL: null,
    });
    expect(result).toEqual({
      uid: 'abc123',
      isAnonymous: true,
      displayName: null,
      email: null,
      photoURL: null,
    });
  });

  it('collapses a fully-populated Google-signed user', () => {
    const result = mapFirebaseUser({
      uid: 'g-uid',
      isAnonymous: false,
      displayName: 'Jane Doe',
      email: 'jane@example.com',
      photoURL: 'https://example.com/pic.png',
    });
    expect(result?.uid).toBe('g-uid');
    expect(result?.isAnonymous).toBe(false);
    expect(result?.displayName).toBe('Jane Doe');
    expect(result?.email).toBe('jane@example.com');
    expect(result?.photoURL).toBe('https://example.com/pic.png');
  });

  it('coerces uid to string and missing fields to null', () => {
    const result = mapFirebaseUser({uid: 123});
    expect(result?.uid).toBe('123');
    expect(result?.displayName).toBeNull();
    expect(result?.email).toBeNull();
    expect(result?.photoURL).toBeNull();
    expect(result?.isAnonymous).toBe(false);
  });
});

describe('extractIdToken', () => {
  it('returns null for empty input', () => {
    expect(extractIdToken(null)).toBeNull();
    expect(extractIdToken(undefined)).toBeNull();
    expect(extractIdToken({})).toBeNull();
  });

  it('finds idToken at the root (legacy GoogleSignin shape)', () => {
    expect(extractIdToken({idToken: 'tok-a'})).toBe('tok-a');
  });

  it('finds idToken under .data (v15+ shape)', () => {
    expect(extractIdToken({data: {idToken: 'tok-b'}})).toBe('tok-b');
  });

  it('finds idToken under .user', () => {
    expect(extractIdToken({user: {idToken: 'tok-c'}})).toBe('tok-c');
  });

  it('ignores non-string idToken values', () => {
    expect(extractIdToken({idToken: 42})).toBeNull();
    expect(extractIdToken({data: {idToken: null}})).toBeNull();
  });
});

type AuthApi = ReturnType<typeof useAuth>;

function Probe({onReady}: {onReady: (api: AuthApi) => void}) {
  const api = useAuth();
  React.useEffect(() => {
    onReady(api);
  }, [api, onReady]);
  return <Text testID="probe">{api.user ? api.user.uid : 'no-user'}</Text>;
}

/**
 * Capture the latest `useAuth()` value via a ref-shaped object so TS
 * narrowing does not collapse it back to `null` between assignments
 * inside the React callback closure.
 */
function captureAuthApi() {
  const ref: {current: AuthApi | null} = {current: null};
  const onReady = (api: AuthApi) => {
    ref.current = api;
  };
  return {ref, onReady};
}

describe('AuthProvider', () => {
  it('starts in isLoading=true and flips to false on first auth event', async () => {
    const {ref, onReady} = captureAuthApi();

    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    // Listener registered exactly once on mount.
    expect(mockOnAuthStateChanged).toHaveBeenCalledTimes(1);
    expect(ref.current?.isLoading).toBe(true);

    // Simulate the first null-user event.
    flushListenerWith(null);

    await waitFor(() => expect(ref.current?.isLoading).toBe(false));
    // No user yet (anonymous sign-in fires async).
    expect(ref.current?.user).toBeNull();
  });

  it('calls signInAnonymously exactly once when the first user is null', () => {
    render(
      <AuthProvider>
        <Probe onReady={() => {}} />
      </AuthProvider>,
    );

    flushListenerWith(null);
    expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);

    // A second null event (should not retrigger because we already
    // armed the ref).
    flushListenerWith(null);
    expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('exposes the anonymous user once the listener reports one', async () => {
    const {ref, onReady} = captureAuthApi();
    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    flushListenerWith({uid: 'anon-1', isAnonymous: true});

    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-1'));
    expect(ref.current?.user?.isAnonymous).toBe(true);
    expect(mockSetUserId).toHaveBeenCalledWith('anon-1');
  });

  it('uses linkWithCredential when signing in over an anonymous user (preserves uid)', async () => {
    const {ref, onReady} = captureAuthApi();
    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    // Establish an anonymous current user so the link path triggers.
    mockCurrentUser = {
      uid: 'anon-keep',
      isAnonymous: true,
      linkWithCredential: mockLinkWithCredential,
    };
    flushListenerWith(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-keep'));

    await act(async () => {
      await ref.current!.signInWithGoogle();
    });

    expect(mockGoogleSignin.signIn).toHaveBeenCalledTimes(1);
    expect(mockAuthFn.GoogleAuthProvider.credential).toHaveBeenCalledWith(
      'fake-id-token',
    );
    expect(mockLinkWithCredential).toHaveBeenCalledTimes(1);
    // The direct signInWithCredential path must NOT fire when linking
    // succeeded — that is the whole point of preserving the uid.
    expect(mockSignInWithCredential).not.toHaveBeenCalled();
  });

  it('falls back to signInWithCredential when no current user exists', async () => {
    const {ref, onReady} = captureAuthApi();
    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    mockCurrentUser = null;
    flushListenerWith(null);
    // (signInAnonymously fires but we ignore it for this scenario.)

    await act(async () => {
      await ref.current!.signInWithGoogle();
    });

    expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
    expect(mockLinkWithCredential).not.toHaveBeenCalled();
  });

  it('falls back to signInWithCredential when linkWithCredential reports the credential already in use', async () => {
    const {ref, onReady} = captureAuthApi();
    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    const collidingErr = Object.assign(new Error('already in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockLinkWithCredential.mockRejectedValueOnce(collidingErr);
    mockCurrentUser = {
      uid: 'anon-collide',
      isAnonymous: true,
      linkWithCredential: mockLinkWithCredential,
    };
    flushListenerWith(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-collide'));

    await act(async () => {
      await ref.current!.signInWithGoogle();
    });

    expect(mockLinkWithCredential).toHaveBeenCalledTimes(1);
    expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
  });

  it('Sprint 43 — credential-already-in-use + user declines migration → queueSkipNextBulkPush', async () => {
    const {ref, onReady} = captureAuthApi();
    mockEngineStub = {
      exportLocalData: mockExportLocalData,
      queueSkipNextBulkPush: mockQueueSkipNextBulkPush,
    };
    mockExportLocalData.mockResolvedValueOnce([
      {collection: 'favorites', count: 3},
      {collection: 'notes', count: 1},
    ]);

    // UX audit (2026-07-01) replaced the native Alert.alert with a themed,
    // state-driven ConfirmDialog — simulate the user tapping "Solo iniciar
    // sesión" (cancel) on it instead of spying on Alert.
    const {getByText} = render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    const collidingErr = Object.assign(new Error('already in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockLinkWithCredential.mockRejectedValueOnce(collidingErr);
    mockCurrentUser = {
      uid: 'anon-decline',
      isAnonymous: true,
      linkWithCredential: mockLinkWithCredential,
    };
    flushListenerWith(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-decline'));

    let signInPromise!: Promise<AuthUser | null>;
    act(() => {
      signInPromise = ref.current!.signInWithGoogle();
    });
    const cancelBtn = await waitFor(() => getByText('Solo iniciar sesión'));
    await act(async () => {
      fireEvent.press(cancelBtn);
      await signInPromise;
    });

    expect(mockExportLocalData).toHaveBeenCalledTimes(1);
    expect(mockQueueSkipNextBulkPush).toHaveBeenCalledTimes(1);
    expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);

    mockEngineStub = null;
  });

  it('R9-23 — a NEW Google account inheriting another owner’s local store is prompted', async () => {
    // Ana signed out (local data survives by design), an anonymous session
    // started on top of her store, and Beto signs in with a Google account
    // that has never touched this app — so linkWithCredential SUCCEEDS and
    // the pre-fix success branch asked nothing before bulk-pushing her notes
    // into his account.
    await AsyncStorage.setItem('@local_store_owner_uid', 'ana-uid');
    const {ref, onReady} = captureAuthApi();
    mockEngineStub = {
      exportLocalData: mockExportLocalData,
      queueSkipNextBulkPush: mockQueueSkipNextBulkPush,
    };
    mockExportLocalData.mockResolvedValueOnce([
      {collection: 'notes', count: 12},
    ]);

    const {getByText} = render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );
    mockCurrentUser = {
      uid: 'anon-beto',
      isAnonymous: true,
      linkWithCredential: mockLinkWithCredential,
    };
    flushListenerWith(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-beto'));

    let signInPromise!: Promise<AuthUser | null>;
    act(() => {
      signInPromise = ref.current!.signInWithGoogle();
    });
    const cancelBtn = await waitFor(() => getByText('Solo iniciar sesión'));
    await act(async () => {
      fireEvent.press(cancelBtn);
      await signInPromise;
    });

    expect(mockLinkWithCredential).toHaveBeenCalledTimes(1);
    expect(mockExportLocalData).toHaveBeenCalledTimes(1);
    expect(mockQueueSkipNextBulkPush).toHaveBeenCalledTimes(1);
    // R9-166 — asked BEFORE the link, which is what makes the account for
    // good (a question left open after it dies with the process and leaves a
    // linked user behind); the skip is queued only once the link succeeded.
    // AuthContextLinkPromptColdStart.test.tsx drives the same order through
    // the real engine.
    expect(mockExportLocalData.mock.invocationCallOrder[0]).toBeLessThan(
      mockLinkWithCredential.mock.invocationCallOrder[0],
    );
    expect(mockLinkWithCredential.mock.invocationCallOrder[0]).toBeLessThan(
      mockQueueSkipNextBulkPush.mock.invocationCallOrder[0],
    );
    // The store now belongs to whoever just claimed it.
    expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
      'anon-beto',
    );

    mockEngineStub = null;
  });

  it('R9-23 — a first-ever sign-in is NOT interrogated (no previous owner)', async () => {
    const {ref, onReady} = captureAuthApi();
    mockEngineStub = {
      exportLocalData: mockExportLocalData,
      queueSkipNextBulkPush: mockQueueSkipNextBulkPush,
    };
    mockExportLocalData.mockResolvedValueOnce([
      {collection: 'notes', count: 12},
    ]);

    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );
    mockCurrentUser = {
      uid: 'anon-fresh',
      isAnonymous: true,
      linkWithCredential: mockLinkWithCredential,
    };
    flushListenerWith(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-fresh'));

    await act(async () => {
      await ref.current!.signInWithGoogle();
    });

    // This is the ordinary upgrade path — the data IS theirs. No prompt, no
    // export probe, and the bulk push proceeds.
    expect(mockExportLocalData).not.toHaveBeenCalled();
    expect(mockQueueSkipNextBulkPush).not.toHaveBeenCalled();
    expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
      'anon-fresh',
    );

    mockEngineStub = null;
  });

  it('R9-23 — the same owner signing in again is NOT interrogated', async () => {
    await AsyncStorage.setItem('@local_store_owner_uid', 'anon-same');
    const {ref, onReady} = captureAuthApi();
    mockEngineStub = {
      exportLocalData: mockExportLocalData,
      queueSkipNextBulkPush: mockQueueSkipNextBulkPush,
    };

    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );
    mockCurrentUser = {
      uid: 'anon-same',
      isAnonymous: true,
      linkWithCredential: mockLinkWithCredential,
    };
    flushListenerWith(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-same'));

    await act(async () => {
      await ref.current!.signInWithGoogle();
    });

    expect(mockExportLocalData).not.toHaveBeenCalled();
    expect(mockQueueSkipNextBulkPush).not.toHaveBeenCalled();

    mockEngineStub = null;
  });

  describe('R9-125 / R9-130 — the previous owner is checked on EVERY branch', () => {
    // `signInWithCredential` must leave a real current user behind (the
    // default mock doesn't), since the direct path claims the store for
    // whatever `currentUser` is once it resolves.
    function nextSignInLandsAs(uid: string) {
      mockSignInWithCredential.mockImplementationOnce(async () => {
        mockCurrentUser = {uid, isAnonymous: false};
        return {user: mockCurrentUser};
      });
    }

    // A fresh stub per test: the shared `mockExportLocalData` carries
    // `mockResolvedValueOnce` values that earlier tests never consume, and
    // `mockClear()` does not drop them.
    function freshEngine(localNotes: {count: number}) {
      const engine = {
        exportLocalData: jest.fn(async () =>
          localNotes.count > 0
            ? [{collection: 'notes', count: localNotes.count}]
            : [],
        ),
        queueSkipNextBulkPush: jest.fn(),
        stop: jest.fn(),
      };
      mockEngineStub = engine;
      return engine;
    }

    const collision = () =>
      Object.assign(new Error('already in use'), {
        code: 'auth/credential-already-in-use',
      });

    afterEach(() => {
      mockEngineStub = null;
    });

    it('walks the three branches — collision, no anonymous user, link success — and each one hands the store to the next guard', async () => {
      const localNotes = {count: 0};
      const engine = freshEngine(localNotes);
      const {ref, onReady} = captureAuthApi();
      const {getByText, queryByText} = render(
        <AuthProvider>
          <Probe onReady={onReady} />
        </AuthProvider>,
      );

      // 1. COLLISION. Ana's Google account already exists (new phone), so the
      //    link is refused and she signs in directly. The store is empty, so
      //    there is nothing to ask about — but the store is now HERS, and
      //    that claim is the only thing that lets step 2 recognise her data
      //    as someone else's (R9-130).
      mockCurrentUser = {uid: 'anon-ana', isAnonymous: true};
      flushListenerWith(mockCurrentUser);
      await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-ana'));
      mockLinkWithCredential.mockRejectedValueOnce(collision());
      nextSignInLandsAs('ana-uid');
      await act(async () => {
        await ref.current!.signInWithGoogle();
      });
      flushListenerWith(mockCurrentUser);
      expect(mockLinkWithCredential).toHaveBeenCalledTimes(1);
      expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
      expect(engine.exportLocalData).toHaveBeenCalledTimes(1); // Sprint 43's check
      expect(queryByText('Solo iniciar sesión')).toBeNull();
      expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
        'ana-uid',
      );

      // Ana writes 12 private notes, then signs out. The anonymous sign-in
      // that follows FAILS (no network), so there is no anonymous user.
      localNotes.count = 12;
      await act(async () => {
        await ref.current!.signOut();
      });
      mockCurrentUser = null;
      mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
      await act(async () => {
        mockListeners.forEach(l => l(null));
      });
      expect(mockSignInAnonymously).toHaveBeenCalledTimes(1);
      expect(ref.current?.user).toBeNull();

      // 2. NO ANONYMOUS USER. Beto signs in with a Google account that has
      //    never used the app. Nothing to link, so the pre-fix code went
      //    straight to signInWithCredential and bulk-pushed Ana's notes into
      //    Beto's cloud without a word (R9-125).
      nextSignInLandsAs('beto-uid');
      let signInPromise!: Promise<AuthUser | null>;
      act(() => {
        signInPromise = ref.current!.signInWithGoogle();
      });
      const cancelBtn = await waitFor(() => getByText('Solo iniciar sesión'));
      await act(async () => {
        fireEvent.press(cancelBtn);
        await signInPromise;
      });
      flushListenerWith(mockCurrentUser);
      expect(mockLinkWithCredential).toHaveBeenCalledTimes(1); // still step 1's
      expect(engine.exportLocalData).toHaveBeenCalledTimes(2);
      expect(engine.queueSkipNextBulkPush).toHaveBeenCalledTimes(1);
      // The skip has to be queued BEFORE the sign-in: that sign-in is what
      // fires onAuthStateChanged, and SyncEngineContext starts the engine
      // (and its bulk push) on it. A skip queued after it is too late.
      expect(mockSignInWithCredential).toHaveBeenCalledTimes(2);
      expect(
        engine.queueSkipNextBulkPush.mock.invocationCallOrder[0],
      ).toBeLessThan(mockSignInWithCredential.mock.invocationCallOrder[1]);
      expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
        'beto-uid',
      );

      // 3. LINK SUCCESS. Beto signs out; this time the anonymous session
      //    starts, and Carla links a brand-new Google account on top of it.
      //    The store still holds data that is not hers, and it now belongs to
      //    Beto — the claim from step 2 is what makes this guard fire.
      await act(async () => {
        await ref.current!.signOut();
      });
      mockCurrentUser = {uid: 'anon-carla', isAnonymous: true};
      flushListenerWith(mockCurrentUser);
      await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-carla'));
      expect(queryByText('Solo iniciar sesión')).toBeNull();
      act(() => {
        signInPromise = ref.current!.signInWithGoogle();
      });
      const cancelBtn2 = await waitFor(() => getByText('Solo iniciar sesión'));
      await act(async () => {
        fireEvent.press(cancelBtn2);
        await signInPromise;
      });
      expect(mockLinkWithCredential).toHaveBeenCalledTimes(2);
      expect(mockSignInWithCredential).toHaveBeenCalledTimes(2); // linked, not signed in
      expect(engine.exportLocalData).toHaveBeenCalledTimes(3);
      expect(engine.queueSkipNextBulkPush).toHaveBeenCalledTimes(2);
      expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
        'anon-carla',
      );
    });

    it('R9-125 — no anonymous user and no previous owner: a first-ever sign-in is NOT interrogated', async () => {
      const engine = freshEngine({count: 12});
      const {ref, onReady} = captureAuthApi();
      render(
        <AuthProvider>
          <Probe onReady={onReady} />
        </AuthProvider>,
      );
      mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
      await act(async () => {
        mockListeners.forEach(l => l(null));
      });
      expect(mockCurrentUser).toBeNull();

      nextSignInLandsAs('first-uid');
      await act(async () => {
        await ref.current!.signInWithGoogle();
      });

      // Same rule as the link branch: an unclaimed store is the signer's own.
      expect(engine.exportLocalData).not.toHaveBeenCalled();
      expect(engine.queueSkipNextBulkPush).not.toHaveBeenCalled();
      expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
      expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
        'first-uid',
      );
    });

    it('R9-125 — no anonymous user, another owner, but an EMPTY store: nothing to ask, the sign-in goes through', async () => {
      await AsyncStorage.setItem('@local_store_owner_uid', 'ana-uid');
      const engine = freshEngine({count: 0});
      const {ref, onReady} = captureAuthApi();
      const {queryByText} = render(
        <AuthProvider>
          <Probe onReady={onReady} />
        </AuthProvider>,
      );
      mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
      await act(async () => {
        mockListeners.forEach(l => l(null));
      });

      nextSignInLandsAs('beto-uid');
      await act(async () => {
        await ref.current!.signInWithGoogle();
      });

      // The owner check ran, found nothing to migrate, and did not park the
      // sign-in behind a "migrate 0 items?" dialog.
      expect(engine.exportLocalData).toHaveBeenCalledTimes(1);
      expect(queryByText('Solo iniciar sesión')).toBeNull();
      expect(engine.queueSkipNextBulkPush).not.toHaveBeenCalled();
      expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
      expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
        'beto-uid',
      );
    });

    it('R9-125 — a failed owner check never blocks the sign-in itself', async () => {
      await AsyncStorage.setItem('@local_store_owner_uid', 'ana-uid');
      const engine = freshEngine({count: 12});
      engine.exportLocalData.mockRejectedValueOnce(new Error('SQLITE_BUSY'));
      const {ref, onReady} = captureAuthApi();
      render(
        <AuthProvider>
          <Probe onReady={onReady} />
        </AuthProvider>,
      );
      mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
      await act(async () => {
        mockListeners.forEach(l => l(null));
      });

      // The check now sits in FRONT of the only sign-in call this branch
      // has, so a local read failure that escaped it would make Google
      // sign-in impossible, not just unprompted.
      nextSignInLandsAs('beto-uid');
      let signedIn: AuthUser | null = null;
      await act(async () => {
        signedIn = await ref.current!.signInWithGoogle();
      });

      expect(engine.exportLocalData).toHaveBeenCalledTimes(1);
      expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
      expect(signedIn).toEqual(expect.objectContaining({uid: 'beto-uid'}));
      expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
        'beto-uid',
      );
    });

    it('R9-166 — a previous-owner check that fails before the link does not silence the collision branch’s own question', async () => {
      await AsyncStorage.setItem('@local_store_owner_uid', 'ana-uid');
      const engine = freshEngine({count: 12});
      engine.exportLocalData.mockRejectedValueOnce(new Error('SQLITE_BUSY'));
      const {ref, onReady} = captureAuthApi();
      const {getByText} = render(
        <AuthProvider>
          <Probe onReady={onReady} />
        </AuthProvider>,
      );
      mockCurrentUser = {uid: 'anon-beto', isAnonymous: true};
      flushListenerWith(mockCurrentUser);
      await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-beto'));

      mockLinkWithCredential.mockRejectedValueOnce(collision());
      nextSignInLandsAs('beto-uid');
      let signInPromise!: Promise<AuthUser | null>;
      act(() => {
        signInPromise = ref.current!.signInWithGoogle();
      });
      const cancelBtn = await waitFor(() => getByText('Solo iniciar sesión'));
      await act(async () => {
        fireEvent.press(cancelBtn);
        await signInPromise;
      });

      // The collision branch only reuses an ANSWER from before the link. The
      // check there could not run, so its own (Sprint 43) check runs as it
      // always did, and it is the one that asks.
      expect(engine.exportLocalData).toHaveBeenCalledTimes(2);
      expect(engine.queueSkipNextBulkPush).toHaveBeenCalledTimes(1);
      expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
    });

    it('R9-125 — no anonymous user, another owner, and the user ACCEPTS: the bulk push is NOT skipped', async () => {
      await AsyncStorage.setItem('@local_store_owner_uid', 'ana-uid');
      const engine = freshEngine({count: 12});
      const {ref, onReady} = captureAuthApi();
      const {getByText} = render(
        <AuthProvider>
          <Probe onReady={onReady} />
        </AuthProvider>,
      );
      mockSignInAnonymously.mockRejectedValueOnce(new Error('offline'));
      await act(async () => {
        mockListeners.forEach(l => l(null));
      });

      nextSignInLandsAs('beto-uid');
      let signInPromise!: Promise<AuthUser | null>;
      act(() => {
        signInPromise = ref.current!.signInWithGoogle();
      });
      const migrateBtn = await waitFor(() => getByText('Migrar'));
      await act(async () => {
        fireEvent.press(migrateBtn);
        await signInPromise;
      });

      expect(engine.exportLocalData).toHaveBeenCalledTimes(1);
      expect(engine.queueSkipNextBulkPush).not.toHaveBeenCalled();
      expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);
      expect(await AsyncStorage.getItem('@local_store_owner_uid')).toBe(
        'beto-uid',
      );
    });
  });

  it('Sprint 43 — credential-already-in-use + user accepts migration → bulk push NOT skipped', async () => {
    const {ref, onReady} = captureAuthApi();
    mockEngineStub = {
      exportLocalData: mockExportLocalData,
      queueSkipNextBulkPush: mockQueueSkipNextBulkPush,
    };
    mockExportLocalData.mockResolvedValueOnce([
      {collection: 'favorites', count: 2},
    ]);

    // Simulate the user tapping "Migrar" (confirm) on the themed dialog.
    const {getByText} = render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    const collidingErr = Object.assign(new Error('already in use'), {
      code: 'auth/credential-already-in-use',
    });
    mockLinkWithCredential.mockRejectedValueOnce(collidingErr);
    mockCurrentUser = {
      uid: 'anon-accept',
      isAnonymous: true,
      linkWithCredential: mockLinkWithCredential,
    };
    flushListenerWith(mockCurrentUser);
    await waitFor(() => expect(ref.current?.user?.uid).toBe('anon-accept'));

    let signInPromise!: Promise<AuthUser | null>;
    act(() => {
      signInPromise = ref.current!.signInWithGoogle();
    });
    const migrateBtn = await waitFor(() => getByText('Migrar'));
    await act(async () => {
      fireEvent.press(migrateBtn);
      await signInPromise;
    });

    expect(mockQueueSkipNextBulkPush).not.toHaveBeenCalled();
    expect(mockSignInWithCredential).toHaveBeenCalledTimes(1);

    mockEngineStub = null;
    mockQueueSkipNextBulkPush.mockClear();
  });

  it('signOut tears down Google and Firebase sessions', async () => {
    const {ref, onReady} = captureAuthApi();
    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    flushListenerWith({uid: 'logged-in', isAnonymous: false});
    await waitFor(() => expect(ref.current?.user?.uid).toBe('logged-in'));

    await act(async () => {
      await ref.current!.signOut();
    });

    expect(mockGoogleSignin.signOut).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('stops the sync engine BEFORE invalidating the Firebase Auth session (permission-denied race fix)', async () => {
    // Regression test: a Firestore onSnapshot listener still attached at
    // the instant the Auth token is invalidated gets a permission-denied
    // error and flashes a red LogBox toast. The fix is ORDERING — the
    // engine's listeners must be torn down first — so this test asserts
    // sequence, not just that both calls happened.
    const {ref, onReady} = captureAuthApi();
    mockEngineStub = {
      exportLocalData: mockExportLocalData,
      queueSkipNextBulkPush: mockQueueSkipNextBulkPush,
      stop: mockEngineStop,
    };

    render(
      <AuthProvider>
        <Probe onReady={onReady} />
      </AuthProvider>,
    );

    flushListenerWith({uid: 'logged-in', isAnonymous: false});
    await waitFor(() => expect(ref.current?.user?.uid).toBe('logged-in'));

    await act(async () => {
      await ref.current!.signOut();
    });

    expect(mockEngineStop).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(['engine.stop', 'firebaseAuth.signOut']);

    mockEngineStub = null;
  });

  it('clears the Crashlytics userId when the user becomes null', async () => {
    render(
      <AuthProvider>
        <Probe onReady={() => {}} />
      </AuthProvider>,
    );

    flushListenerWith({uid: 'temp', isAnonymous: false});
    await waitFor(() => expect(mockSetUserId).toHaveBeenCalledWith('temp'));

    flushListenerWith(null);
    expect(mockSetUserId).toHaveBeenLastCalledWith('');
  });
});

describe('useAuth', () => {
  it('throws when used outside an AuthProvider', () => {
    // Suppress the React error boundary warning for this expected throw.
    const origError = console.error;
    console.error = jest.fn();
    function Outside() {
      useAuth();
      return null;
    }
    expect(() => render(<Outside />)).toThrow(
      /useAuth must be used within an AuthProvider/,
    );
    console.error = origError;
  });
});
