/**
 * Sprint 42 — sync module public API.
 *
 * The engine class + types live here so contexts can:
 *   import {SyncEngine, type SyncAdapter} from '@lib/sync';
 *
 * The defensive firestore/netinfo loaders stay internal — nothing
 * outside this module should require @react-native-firebase/firestore
 * directly.
 */

export {SyncEngine} from './SyncEngine';
export {getSyncEngine, setSyncEngine} from './instance';
export type {
  SyncAdapter,
  SyncEngineState,
  SyncEngineListener,
  SyncEntity,
  SyncMetadata,
  PendingWrite,
  RemoteChange,
  ConflictChoice,
  ConflictRecord,
  ResolvedConflictRecord,
} from './types';
