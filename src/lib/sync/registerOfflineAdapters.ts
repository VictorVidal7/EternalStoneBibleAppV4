/**
 * Sprint 42 — register the adapters that don't live inside a React
 * context (Notes + Highlights). Called once from SyncEngineProvider
 * on mount.
 *
 * Sprint 45 — reviewEvents (the append-only SRS review log) joins here:
 * it's persisted in SQLite with no React context, same as notes/
 * highlights, so its adapter is registered at engine start too.
 */

import type {SyncEngine} from './SyncEngine';
import {notesSyncAdapter} from './adapters/notes';
import {highlightsSyncAdapter} from './adapters/highlights';
import {reviewEventsSyncAdapter} from './adapters/reviewEvents';

export function registerOfflineAdapters(engine: SyncEngine): void {
  engine.register(notesSyncAdapter);
  engine.register(highlightsSyncAdapter);
  engine.register(reviewEventsSyncAdapter);
}
