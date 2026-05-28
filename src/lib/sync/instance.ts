/**
 * Sprint 42 — sync engine singleton accessor.
 *
 * The engine is created inside SyncEngineContext (so React lifecycle
 * owns its mount/unmount), but a lot of the call sites that need to
 * queue writes live outside React (e.g. the chapter screen's
 * `saveNote()` function, the highlight service callers). They use
 * `getSyncEngine()` to reach the active instance, and gracefully
 * no-op when it returns null (anonymous user, engine not started, or
 * Firestore native module missing).
 */

import type {SyncEngine} from './SyncEngine';

let instance: SyncEngine | null = null;

export function setSyncEngine(engine: SyncEngine | null): void {
  instance = engine;
}

export function getSyncEngine(): SyncEngine | null {
  return instance;
}
