/**
 * Sprint 42 — sync engine singleton accessor.
 *
 * The engine is created inside SyncEngineContext (so React lifecycle
 * owns its mount/unmount), but a lot of the call sites that need to
 * queue writes live outside React (e.g. the chapter screen's
 * `saveNote()` function, the highlight service callers). They use
 * `getSyncEngine()` to reach the instance, and gracefully no-op when it
 * returns null (the provider not mounted). R9-38 — with no session the
 * engine is there, stopped: `queueWrite` queues for the owner of the local
 * store.
 */

import type {SyncEngine} from './SyncEngine';

let instance: SyncEngine | null = null;

export function setSyncEngine(engine: SyncEngine | null): void {
  instance = engine;
}

export function getSyncEngine(): SyncEngine | null {
  return instance;
}
