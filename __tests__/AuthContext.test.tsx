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
import {Text} from 'react-native';
import {act, render, waitFor} from '@testing-library/react-native';

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
const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockLinkWithCredential = jest
  .fn()
  .mockResolvedValue({user: {uid: 'anon-uid'}});

type MockCurrentUser = {
  uid: string;
  isAnonymous: boolean;
  linkWithCredential: jest.Mock;
} | null;
let mockCurrentUser: MockCurrentUser = null;

const mockAuthFn: any = jest.fn(() => ({
  onAuthStateChanged: mockOnAuthStateChanged,
  get currentUser() {
    return mockCurrentUser;
  },
  signInAnonymously: mockSignInAnonymously,
  signInWithCredential: mockSignInWithCredential,
  signOut: mockSignOut,
}));
mockAuthFn.GoogleAuthProvider = {
  credential: jest.fn((idToken: string) => ({
    providerId: 'google.com',
    idToken,
  })),
};

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: mockAuthFn,
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

beforeEach(() => {
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
