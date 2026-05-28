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

/** Coerce a NetInfoState into a single online/offline bool. */
export function isStateOnline(state: NetInfoState | null | undefined): boolean {
  if (!state) return true; // optimistic
  // isInternetReachable can be null on Android during boot; treat null as ok
  // as long as isConnected is true.
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

/** Test-only — reset the cache so a follow-up call re-attempts the require. */
export function __resetNetInfoCacheForTests(): void {
  cached = undefined;
}

export type {NetInfoModule, NetInfoState};
