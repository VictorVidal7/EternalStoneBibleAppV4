/**
 * Sprint 42 — register the adapters that don't live inside a React
 * context (Notes + Highlights). Called once from SyncEngineProvider
 * on mount.
 */

import type {SyncEngine} from './SyncEngine';
import {notesSyncAdapter} from './adapters/notes';
import {highlightsSyncAdapter} from './adapters/highlights';

export function registerOfflineAdapters(engine: SyncEngine): void {
  engine.register(notesSyncAdapter);
  engine.register(highlightsSyncAdapter);
}
