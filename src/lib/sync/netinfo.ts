/**
 * Sprint 42 — defensive lazy load of @react-native-community/netinfo.
 *
 * Same pattern as firestore.ts: jest doesn't have the native module, so
 * we require lazily inside try/catch and cache the result. If netinfo
 * isn't available the engine just stays optimistic (assumes online),
 * which is the safest fallback — the worst case is a failed push that
 * the queue retries.
 */

import {logger} from '@lib/utils/logger';

interface NetInfoState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

type NetInfoModule = {
  addEventListener: (cb: (state: NetInfoState) => void) => () => void;
  fetch: () => Promise<NetInfoState>;
};

let cached: NetInfoModule | null | undefined;

export function getNetInfo(): NetInfoModule | null {
  if (cached !== undefined) return cached;
  try {
    const mod = require('@react-native-community/netinfo');
    const candidate = (mod.default ?? mod) as NetInfoModule;
    if (
      !candidate ||
      typeof candidate.addEventListener !== 'function' ||
      typeof candidate.fetch !== 'function'
    ) {
      logger.warn('NetInfo module did not expose expected API', {
        component: 'sync/netinfo',
      });
      cached = null;
      return null;
    }
    cached = candidate;
    return candidate;
  } catch (err) {
    logger.warn('NetInfo native module not available — assuming online', {
      component: 'sync/netinfo',
      error: err instanceof Error ? err.message : String(err),
    });
    cached = null;
    return null;
  }
}

/**
 * Coerce a NetInfoState into a single online/offline bool.
 *
 * Sprint 46 — we gate ONLY on `isConnected === false`. We deliberately no
 * longer treat `isInternetReachable === false` as offline: it's an
 * unreliable HTTP-reachability probe that reports false on emulators and
 * on networks that block the probe even when gRPC/HTTPS works fine. Under
 * the old rule the engine's `flush()` early-returned forever, so writes
 * queued but never pushed (the bug we hit verifying S45 outbound sync).
 *
 * The downside — attempting a push when there's genuinely no internet — is
 * harmless: @react-native-firebase/firestore has offline persistence (the
 * write commits to its local mutation queue and the SDK delivers it when
 * connectivity truly returns) and our own queue retries with backoff. So
 * an occasional failed attempt costs nothing; queueing forever cost real
 * users their sync.
 */
export function isStateOnline(state: NetInfoState | null | undefined): boolean {
  if (!state) return true; // optimistic — no signal means don't block
  if (state.isConnected === false) return false;
  return true;
}

/** Test-only — reset the cache so a follow-up call re-attempts the require. */
export function __resetNetInfoCacheForTests(): void {
  cached = undefined;
}

export type {NetInfoModule, NetInfoState};
