/**
 * Sprint 42 — defensive lazy load of @react-native-firebase/firestore.
 *
 * Mirrors the pattern from AuthContext (S41) / logger (S40 Crashlytics):
 * native modules are not available in jest, so requiring them at module
 * load time would crash every test. We resolve once, cache the result
 * (or `null` to mark "unavailable"), and gate every public method.
 *
 * The wrapping types stay loose (`unknown`/`any`) so the firestore
 * native types don't leak into the rest of the codebase — the engine
 * only needs the verbs.
 */

import {logger} from '@lib/utils/logger';

type FirestoreFn = (() => FirestoreInstance) & {
  FieldValue?: {
    serverTimestamp: () => unknown;
  };
};

interface FirestoreInstance {
  collection: (path: string) => CollectionRef;
  // Native module also exposes batch, runTransaction etc., not needed yet.
}

interface CollectionRef {
  doc: (id: string) => DocumentRef;
  onSnapshot: (
    onNext: (snapshot: QuerySnapshot) => void,
    onError?: (err: Error) => void,
  ) => () => void;
  /**
   * Sprint 49 — one-shot read of every doc in the collection. Used by
   * the conflict-analytics dashboard to read the resolved-conflict audit
   * log (users/{uid}/conflicts), which is NOT a synced dataset (no
   * onSnapshot listener / no local mirror) — just an append-only log we
   * read on demand.
   */
  get: () => Promise<QuerySnapshot>;
}

interface DocumentRef {
  set: (data: object, options?: {merge?: boolean}) => Promise<void>;
  get: () => Promise<DocumentSnapshot>;
  delete: () => Promise<void>;
}

interface DocumentSnapshot {
  exists: boolean;
  id: string;
  data: () => Record<string, unknown> | undefined;
}

interface DocumentChange {
  type: 'added' | 'modified' | 'removed';
  doc: DocumentSnapshot;
}

interface QuerySnapshot {
  docChanges: () => DocumentChange[];
  /** Sprint 49 — every doc in the snapshot (used by one-shot `get()`). */
  docs: DocumentSnapshot[];
  size: number;
}

let cached: FirestoreFn | null | undefined;

/**
 * Returns the firestore() factory, or null if the native module isn't
 * available (jest, web bundle without the native binding). Always check
 * the result before using.
 */
export function getFirestore(): FirestoreFn | null {
  if (cached !== undefined) return cached;
  try {
    const mod = require('@react-native-firebase/firestore');
    const fn = (mod.default ?? mod) as FirestoreFn;
    if (typeof fn !== 'function') {
      logger.warn('Firestore default export was not callable', {
        component: 'sync/firestore',
      });
      cached = null;
      return null;
    }
    cached = fn;
    return fn;
  } catch (err) {
    logger.warn('Firestore native module not available — sync disabled', {
      component: 'sync/firestore',
      error: err instanceof Error ? err.message : String(err),
    });
    cached = null;
    return null;
  }
}

/**
 * Convenience: returns the server-timestamp sentinel. Useful when
 * writing docs so the canonical updatedAt comes from the Firestore
 * server (and not the device clock, which can be wrong).
 *
 * Falls back to a plain Date.now() value when the module isn't
 * available, so unit tests can still exercise the engine.
 */
export function serverTimestamp(): unknown {
  const firestore = getFirestore();
  const fv = firestore?.FieldValue;
  if (fv && typeof fv.serverTimestamp === 'function') {
    return fv.serverTimestamp();
  }
  return Date.now();
}

/** Test-only — reset the cache so a follow-up call re-attempts the require. */
export function __resetFirestoreCacheForTests(): void {
  cached = undefined;
}

export type {
  CollectionRef,
  DocumentChange,
  DocumentRef,
  DocumentSnapshot,
  FirestoreFn,
  FirestoreInstance,
  QuerySnapshot,
};
