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
// Account deletion — full erasure of a user's Firestore data.
export {deleteAllCloudData} from './deleteAccountData';
// Sprint 77 — every *ToRemote payload must strip `undefined` values.
// Sprint 78 — deep variant for nested payloads (engine boundary).
export {withoutUndefined, deepWithoutUndefined} from './sanitize';
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

// Sprint 49 — conflict-analytics dashboard over the resolved-conflict log.
export {
  computeConflictAnalytics,
  MIN_VERDICT_SAMPLE,
  ACTIVITY_WEEKS,
  CHOICE_ORDER,
} from './conflictAnalytics';
export type {
  ConflictAnalytics,
  ChoiceBreakdown,
  CollectionTally,
  FieldTally,
  WeeklyBucket,
} from './conflictAnalytics';
