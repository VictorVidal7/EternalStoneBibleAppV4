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
import {getSyncEngine, deleteAllCloudData} from '@lib/sync';
import {useLanguage} from '@hooks/useLanguage';
import {ConfirmDialog} from '@components/ui/ConfirmDialog';
import {linkUser as linkOfferingUser} from '@lib/offering/offeringService';

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
  deleteAccount: () => Promise<void>;
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
  const {t} = useLanguage();
  // Track whether we have kicked off the initial anonymous sign-in so
  // we do not loop if the first onAuthStateChanged fires with a null
  // user (which it will on a fresh install). Re-armed on signOut.
  const triggeredAnonymousRef = useRef(false);
  // Themed replacement for the old Alert.alert-wrapped migration prompt
  // (UX audit): the dialog is state-driven, but the calling code below still
  // needs to `await` a yes/no answer, so a pending resolver bridges the two.
  const [migrationPrompt, setMigrationPrompt] = useState<{
    count: number;
  } | null>(null);
  const migrationResolveRef = useRef<((wantMigrate: boolean) => void) | null>(
    null,
  );
  const askMigration = useCallback((count: number): Promise<boolean> => {
    return new Promise(resolve => {
      migrationResolveRef.current = resolve;
      setMigrationPrompt({count});
    });
  }, []);
  const resolveMigrationPrompt = useCallback((wantMigrate: boolean) => {
    setMigrationPrompt(null);
    migrationResolveRef.current?.(wantMigrate);
    migrationResolveRef.current = null;
  }, []);

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

      // Associates this device's offering entitlement with the stable
      // Firebase uid (anonymous or signed-in) for cross-device persistence.
      // Best-effort and non-blocking — never awaited, never revoked on
      // sign-out (see offeringService.linkUser's docstring).
      if (next?.uid) {
        linkOfferingUser(next.uid).catch(() => {});
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

        // Sprint 43 — the Google account already has a different Firebase
        // uid, so linkWithCredential refused. We're about to drop the
        // anonymous uid and sign in as that existing user. The local
        // SQLite/AsyncStorage data on this device would normally get
        // bulk-pushed to the new uid on engine.start (S42 behaviour).
        // Ask the user first: if they decline, we mark the bulk-push
        // flag pre-emptively so the engine treats this device as
        // already-migrated and only pulls the existing remote data.
        const engine = getSyncEngine();
        if (engine) {
          try {
            const localData = await engine.exportLocalData();
            const total = localData.reduce((acc, d) => acc + d.count, 0);
            if (total > 0) {
              const wantMigrate = await askMigration(total);
              if (!wantMigrate) {
                engine.queueSkipNextBulkPush();
                logger.info('AuthProvider: user declined migration', {
                  component: 'AuthProvider',
                  localItems: total,
                });
              } else {
                logger.info('AuthProvider: user accepted migration', {
                  component: 'AuthProvider',
                  localItems: total,
                });
              }
            }
          } catch (exportErr) {
            // Non-fatal: fall through to the default bulk-push behaviour
            // (which still does the right thing via LWW).
            logger.warn('AuthProvider: migration check failed', {
              component: 'AuthProvider',
              error:
                exportErr instanceof Error
                  ? exportErr.message
                  : String(exportErr),
            });
          }
        }
      }
    }

    await authMod().signInWithCredential(credential);
  }, [askMigration]);

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

  /**
   * Full account deletion (Play Store account-deletion policy). Sequence
   * matters: cloud data must be fully gone BEFORE the Firebase Auth user
   * is deleted — deleting the Auth user first would orphan the Firestore
   * subcollections under the old uid with no way to reach them again
   * (a fresh sign-in gets a brand-new uid).
   *
   *  1. Stop the sync engine first — while it's running, its onSnapshot
   *     listeners echo every remote delete back into local SQLite
   *     (applyRemoteDelete), which would silently wipe on-device data
   *     too. Account deletion is scoped to the cloud copy only, same as
   *     sign-out ("Local data survives sign-out" above) — stopping the
   *     engine keeps that deterministic instead of racing the listeners.
   *  2. Queue a bulk-push skip — SyncEngineContext only calls engine.start()
   *     for a non-anonymous user, so the fresh anonymous session created
   *     below does NOT push anything on its own. This flag instead guards
   *     the case where the user signs back into Google in this same app
   *     session (no restart) right after deleting: that linkWithCredential
   *     would otherwise trigger a bulk push of the still-on-device rows
   *     with no "already pushed" marker for the new uid, silently
   *     re-uploading the exact data we just deleted.
   *  3. Delete every users/{uid}/* doc (see deleteAllCloudData — verified
   *     against the live Firestore rules, a permissive wildcard, so this
   *     is safe to do client-side for every collection incl. `conflicts`).
   *  4. Delete the Firebase Auth user itself, re-authenticating with a
   *     fresh Google credential if the session isn't "recent" enough.
   *  5. Best-effort revoke the on-device Google session so no stale token
   *     lingers, then let the existing null-user handler take over.
   */
  const deleteAccount = useCallback(async () => {
    const authMod = getAuth();
    const gs = getGoogleSignin();
    if (!authMod) {
      throw new Error('Auth native modules not available');
    }
    const current = authMod().currentUser;
    if (!current) {
      throw new Error('No signed-in user to delete');
    }
    const uid = String(current.uid);
    const engine = getSyncEngine();

    engine?.stop();
    engine?.queueSkipNextBulkPush();

    try {
      await deleteAllCloudData(uid);
    } catch (err) {
      // Cloud wipe failed — resume normal sync for the still-valid
      // account instead of leaving it stuck with sync off, then
      // propagate so the caller can surface a retry to the user.
      void engine?.start(uid);
      throw err;
    }

    try {
      await current.delete();
    } catch (err: any) {
      // Cloud data is already gone at this point — the account still
      // exists (Auth delete failed/was cancelled), so resume normal sync
      // for it rather than leaving the engine silently stopped until the
      // next cold start.
      const restoreSync = () => void engine?.start(uid);
      if (err?.code !== 'auth/requires-recent-login') {
        restoreSync();
        throw err;
      }
      try {
        if (!gs) throw err;
        await gs.hasPlayServices({showPlayServicesUpdateDialog: true});
        const result = await gs.signIn();
        const idToken = extractIdToken(result);
        if (!idToken) throw err;
        const credential = authMod.GoogleAuthProvider.credential(idToken);
        await current.reauthenticateWithCredential(credential);
        await current.delete();
      } catch (reauthErr) {
        restoreSync();
        throw reauthErr;
      }
    }

    if (gs) {
      try {
        await gs.revokeAccess();
      } catch {
        // best-effort — device may already lack a Google session.
      }
      try {
        await gs.signOut();
      } catch {
        // best-effort
      }
    }

    triggeredAnonymousRef.current = false;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({user, isLoading, signInWithGoogle, signOut, deleteAccount}),
    [user, isLoading, signInWithGoogle, signOut, deleteAccount],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Themed data-migration prompt (UX audit, replaces native Alert.alert) */}
      <ConfirmDialog
        visible={!!migrationPrompt}
        title={t.conflicts.migrationTitle}
        message={
          migrationPrompt
            ? t.conflicts.migrationBody.replace(
                '{{count}}',
                String(migrationPrompt.count),
              )
            : ''
        }
        confirmLabel={t.conflicts.migrationYes}
        cancelLabel={t.conflicts.migrationNo}
        onConfirm={() => resolveMigrationPrompt(true)}
        onCancel={() => resolveMigrationPrompt(false)}
        icon="cloud-upload-outline"
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
