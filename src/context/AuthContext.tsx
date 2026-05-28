/**
 * Sprint 41 - Firebase Auth context.
 *
 * Model: optional auth + anonymous-by-default + Google upgrade path.
 *  - At first launch (or after sign-out) we call signInAnonymously()
 *    so the user always has a stable uid. This is invisible to the user
 *    but lets S42's Firestore sync attach favorites/notes to the same
 *    document later, even if the user signs in months down the road.
 *  - When the user taps "Sign in with Google" while still anonymous,
 *    we call linkWithCredential (not signInWithCredential) so the
 *    same uid is preserved.
 *  - When the user signs in with Google AFTER a previous sign-out,
 *    no anonymous user exists yet; falls through to direct credential
 *    sign-in.
 *
 * Sign-out only clears the Firebase Auth token; it does NOT touch
 * AsyncStorage or the SQLite stores (favorites/notes/highlights/
 * memoria/bookmarks). Local data survives sign-out.
 *
 * Native modules are loaded lazily via require() inside try/catch so
 * jest unit tests work without explicit native mocks (mirrors the
 * Crashlytics pattern from Sprint 40).
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';

import {logger} from '@lib/utils/logger';

// Web OAuth client id from google-services.json (oauth_client where
// client_type === 3). It is already public in the bundled
// google-services.json, so embedding it directly is fine and avoids a
// runtime JSON parse.
const WEB_CLIENT_ID =
  '682262373872-i6vk5ncqi9sgd3sg7ulc0d6mfv48al90.apps.googleusercontent.com';

export interface AuthUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type FirebaseAuthModule = {
  (): {
    onAuthStateChanged: (cb: (user: any) => void) => () => void;
    currentUser: any;
    signInAnonymously: () => Promise<{user: any}>;
    signInWithCredential: (credential: any) => Promise<{user: any}>;
    signOut: () => Promise<void>;
  };
  GoogleAuthProvider: {credential: (idToken: string) => any};
};

type GoogleSigninApi = {
  configure: (config: {webClientId: string}) => void;
  hasPlayServices: (opts?: {
    showPlayServicesUpdateDialog?: boolean;
  }) => Promise<boolean>;
  signIn: () => Promise<any>;
  signOut: () => Promise<void>;
  revokeAccess: () => Promise<void>;
};

let _authModule: FirebaseAuthModule | null | undefined;
function getAuth(): FirebaseAuthModule | null {
  if (_authModule !== undefined) return _authModule;
  try {
    const mod = require('@react-native-firebase/auth');
    _authModule = (mod.default || mod) as FirebaseAuthModule;
  } catch {
    _authModule = null;
  }
  return _authModule;
}

let _googleSignin: GoogleSigninApi | null | undefined;
function getGoogleSignin(): GoogleSigninApi | null {
  if (_googleSignin !== undefined) return _googleSignin;
  try {
    const mod = require('@react-native-google-signin/google-signin');
    _googleSignin = mod.GoogleSignin as GoogleSigninApi;
  } catch {
    _googleSignin = null;
  }
  return _googleSignin;
}

export function mapFirebaseUser(fbUser: any): AuthUser | null {
  if (!fbUser) return null;
  return {
    uid: String(fbUser.uid),
    isAnonymous: Boolean(fbUser.isAnonymous),
    displayName: fbUser.displayName ?? null,
    email: fbUser.email ?? null,
    photoURL: fbUser.photoURL ?? null,
  };
}

/**
 * Extract an id token from any of the shapes returned by
 * GoogleSignin.signIn(). The library has had several response shapes
 * across versions: {idToken, user} (legacy), {data: {idToken}} (v15+),
 * and on some platforms {user: {idToken}}. We probe all of them so
 * the call site stays version-agnostic.
 */
export function extractIdToken(signInResult: any): string | null {
  if (!signInResult) return null;
  if (typeof signInResult.idToken === 'string') return signInResult.idToken;
  if (signInResult.data && typeof signInResult.data.idToken === 'string') {
    return signInResult.data.idToken;
  }
  if (signInResult.user && typeof signInResult.user.idToken === 'string') {
    return signInResult.user.idToken;
  }
  return null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({children}: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Track whether we have kicked off the initial anonymous sign-in so
  // we do not loop if the first onAuthStateChanged fires with a null
  // user (which it will on a fresh install). Re-armed on signOut.
  const triggeredAnonymousRef = useRef(false);

  useEffect(() => {
    const gs = getGoogleSignin();
    if (gs) {
      try {
        gs.configure({webClientId: WEB_CLIENT_ID});
      } catch (err) {
        logger.warn('GoogleSignin.configure failed', {
          component: 'AuthProvider',
          action: 'configure',
          error: err,
        });
      }
    }

    const authMod = getAuth();
    if (!authMod) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = authMod().onAuthStateChanged(fbUser => {
      const next = mapFirebaseUser(fbUser);
      setUser(next);
      setIsLoading(false);

      try {
        logger.setUserId(next?.uid ?? '');
      } catch {
        // setUserId is best-effort; wrap defensively just in case.
      }

      if (!fbUser && !triggeredAnonymousRef.current) {
        triggeredAnonymousRef.current = true;
        authMod()
          .signInAnonymously()
          .catch(err => {
            logger.error('Anonymous sign-in failed', err as Error, {
              component: 'AuthProvider',
              action: 'signInAnonymously',
            });
            triggeredAnonymousRef.current = false;
          });
      }
    });

    return () => {
      try {
        unsubscribe();
      } catch {
        // listener may already be torn down.
      }
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const authMod = getAuth();
    const gs = getGoogleSignin();
    if (!authMod || !gs) {
      throw new Error('Auth native modules not available');
    }

    await gs.hasPlayServices({showPlayServicesUpdateDialog: true});
    const result = await gs.signIn();
    const idToken = extractIdToken(result);
    if (!idToken) {
      throw new Error('GoogleSignin returned no idToken');
    }
    const credential = authMod.GoogleAuthProvider.credential(idToken);

    const current = authMod().currentUser;
    if (current && current.isAnonymous) {
      try {
        await current.linkWithCredential(credential);
        return;
      } catch (err: any) {
        if (err?.code !== 'auth/credential-already-in-use') {
          throw err;
        }
        logger.warn('Google credential already linked, signing in directly', {
          component: 'AuthProvider',
          action: 'signInWithGoogle',
        });
      }
    }

    await authMod().signInWithCredential(credential);
  }, []);

  const signOut = useCallback(async () => {
    const authMod = getAuth();
    const gs = getGoogleSignin();

    if (gs) {
      try {
        await gs.signOut();
      } catch {
        // user might not have a Google session
      }
    }
    if (authMod) {
      triggeredAnonymousRef.current = false;
      await authMod().signOut();
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({user, isLoading, signInWithGoogle, signOut}),
    [user, isLoading, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
