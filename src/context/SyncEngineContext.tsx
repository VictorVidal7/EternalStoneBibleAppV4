/**
 * Sprint 42 — SyncEngineContext.
 *
 * React glue between AuthContext and the SyncEngine instance.
 * Responsibilities:
 *  - Create the engine once (useRef), expose it via context.
 *  - Watch useAuth().user — when a non-anonymous user signs in, call
 *    engine.start(uid); when the user is null or anonymous, call
 *    engine.stop().
 *  - Expose the engine state to React consumers (used by the Cuenta
 *    section in Settings to show "Sincronizado hace Xs").
 *  - Mirror the engine instance into a module-level singleton via
 *    `setSyncEngine()` so non-React callsites (chapter screen
 *    saveNote, highlight callers) can reach it via `getSyncEngine()`.
 *
 * Note: this provider does NOT register adapters itself. Each context
 * (Favorites, Bookmarks, Memory) registers its own adapter inside a
 * useEffect that depends on `useSyncEngine().engine` so the adapter
 * has access to the context's setState. Notes + Highlights register
 * their module-level adapters via `registerOfflineAdapters()` once at
 * provider mount.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {useAuth} from './AuthContext';
import {
  SyncEngine,
  setSyncEngine,
  type ConflictRecord,
  type SyncEngineState,
} from '@lib/sync';
import {logger} from '@lib/utils/logger';
import {registerOfflineAdapters} from '@lib/sync/registerOfflineAdapters';
import {seedMemoryStatsFloorIfFresh} from '@lib/memory/memoryStatsSync';

interface SyncEngineContextValue {
  engine: SyncEngine;
  state: SyncEngineState;
}

const SyncEngineCtx = createContext<SyncEngineContextValue | undefined>(
  undefined,
);

interface SyncEngineProviderProps {
  children: ReactNode;
}

export const SyncEngineProvider: React.FC<SyncEngineProviderProps> = ({
  children,
}) => {
  const {user} = useAuth();
  // Engine lives for the entire app session. Created once.
  const engineRef = useRef<SyncEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = new SyncEngine();
  }
  const engine = engineRef.current;

  const [state, setState] = useState<SyncEngineState>(() => engine.getState());

  // Mirror into the module-level singleton + subscribe to state changes.
  useEffect(() => {
    setSyncEngine(engine);
    const unsub = engine.subscribe(setState);
    // Register the adapters that don't live inside a React context
    // (Notes, Highlights). Idempotent — engine.register() overwrites a
    // re-registered adapter without throwing.
    try {
      registerOfflineAdapters(engine);
    } catch (err) {
      logger.warn('SyncEngineProvider: failed to register offline adapters', {
        component: 'SyncEngineProvider',
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return () => {
      unsub();
      setSyncEngine(null);
    };
  }, [engine]);

  // Auth gate: start/stop the engine based on the user state.
  useEffect(() => {
    if (user && !user.isAnonymous) {
      const uid = user.uid;
      void engine
        .start(uid)
        .then(() => {
          // Local-first quota feature — after the engine is live, seed the
          // memoryStats restore floor if this is a fresh device (zero local
          // review rows). Kept OUT of SyncEngine.start() on purpose so the
          // engine never imports the SQLite review-event store — it stays
          // Firestore-only, like cleanupOldReviewEvents. Best-effort.
          void seedMemoryStatsFloorIfFresh(uid);
        })
        .catch(err => {
          logger.error(
            'SyncEngineProvider: engine.start failed',
            err instanceof Error ? err : new Error(String(err)),
            {component: 'SyncEngineProvider', uid},
          );
        });
    } else {
      // Anonymous user or signed out — engine is dormant. Local stores
      // still work; nothing goes to Firestore.
      //
      // NOTE: deliberately does NOT clear the memoryStats restore floor
      // here. `user` can tick through `null`/anonymous transiently during
      // ordinary cold-start Firebase Auth rehydration for an account that
      // IS actually still signed in (confirmed live 2026-07-09 — the floor
      // was being wiped and silently re-seeded on every cold start, which
      // also broke the restore banner's "show once" guarantee by
      // resurrecting its pending flag). Clearing the floor is instead tied
      // to the explicit user actions that really end a session — see
      // `AuthContext.signOut`/`deleteAccount` — never to this reactive,
      // race-prone observation of `user`.
      engine.stop();
    }
  }, [engine, user]);

  const value = useMemo<SyncEngineContextValue>(
    () => ({engine, state}),
    [engine, state],
  );

  return (
    <SyncEngineCtx.Provider value={value}>{children}</SyncEngineCtx.Provider>
  );
};

export function useSyncEngine(): SyncEngineContextValue {
  const ctx = useContext(SyncEngineCtx);
  if (!ctx) {
    throw new Error('useSyncEngine must be used within a SyncEngineProvider');
  }
  return ctx;
}

/** Same as useSyncEngine but returns undefined outside the provider
 *  instead of throwing — useful for contexts that may be mounted
 *  during tests without the SyncEngineProvider. */
export function useSyncEngineOptional(): SyncEngineContextValue | undefined {
  return useContext(SyncEngineCtx);
}

/**
 * Sprint 43 — convenience selector for the pending conflicts list.
 * Returns an empty array outside the provider so the Settings badge
 * and the conflicts screen can render safely in tests / non-auth flows.
 */
export function useConflicts(): readonly ConflictRecord[] {
  const ctx = useContext(SyncEngineCtx);
  return ctx?.state.conflicts ?? [];
}
