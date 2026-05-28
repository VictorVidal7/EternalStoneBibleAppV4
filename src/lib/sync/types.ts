/**
 * Sprint 42 — sync engine type contracts.
 *
 * Each user-data context (favorites, notes, highlights, memoria, marcadores)
 * implements a `SyncAdapter<T>` and hands it to the engine via
 * `engine.register(adapter)`. The engine owns:
 *   - the per-collection Firestore listener (onSnapshot)
 *   - the queue of pending local writes/deletes
 *   - retry + offline survival
 *   - the last-write-wins comparison
 * Adapters only know how to talk to their own local store and how to
 * apply a remote change. They don't know about Firestore, NetInfo, or
 * the auth state.
 */

/** Metadata every synced doc carries, on top of the entity's own fields. */
export interface SyncMetadata {
  /** Last-write-wins clock. Milliseconds since epoch. */
  updatedAt: number;
  /** Soft-delete tombstone. When true, treat the row as gone. */
  deleted?: boolean;
  /** Server timestamp from Firestore (millis). Only present after a sync. */
  deletedAt?: number;
}

/** Wraps an entity with its sync metadata for transport. */
export type SyncEntity<T> = T & SyncMetadata;

/** A single change pulled from a Firestore snapshot. */
export interface RemoteChange<T> {
  id: string;
  /** When deleted is true, data carries the tombstone metadata only. */
  data: SyncEntity<T> | null;
  deleted: boolean;
}

/**
 * Each context registers one of these. The engine never instantiates
 * adapters itself — they're owned by the context that knows the local
 * store's shape.
 */
export interface SyncAdapter<T = unknown> {
  /** Firestore subcollection name under users/{uid}/. */
  collection: string;

  /**
   * Read the local row for an id, so the engine can decide whether a
   * remote change should win (LWW). Return null if the row doesn't
   * exist locally.
   */
  getLocal(id: string): Promise<SyncEntity<T> | null>;

  /**
   * Apply a remote create/update locally. The engine has already
   * decided this should win (newer updatedAt than the local copy, or
   * the local row didn't exist). The adapter must NOT re-queue this
   * change to the engine.
   */
  applyRemoteUpsert(id: string, data: SyncEntity<T>): Promise<void>;

  /**
   * Apply a remote soft-delete locally. The adapter typically removes
   * the local row entirely (the tombstone lives on Firestore so other
   * devices can see the delete).
   */
  applyRemoteDelete(id: string): Promise<void>;

  /**
   * Snapshot every local row for the initial bulk push when the user
   * first authenticates with Google. Called by the engine inside
   * `runInitialBulkPush()`.
   */
  pullAllLocal(): Promise<Array<{id: string; data: SyncEntity<T>}>>;

  /**
   * Sprint 43 — fields that matter for conflict detection. When the
   * engine sees a remote change land inside CONFLICT_WINDOW_MS of the
   * local updatedAt, it compares only these fields; if any differ, the
   * change is held as a conflict instead of applied via LWW.
   *
   * Return an empty array to opt out (= LWW always wins for this
   * adapter). Omit to inherit the default behaviour (also LWW).
   */
  getMaterialFields?(): readonly string[];
}

/** A pending write the engine is trying to push to Firestore. */
export interface PendingWrite {
  collection: string;
  id: string;
  /** The full doc to write (includes updatedAt + optional deleted).
   *  Stored as a structural object — TypeScript's `Record<string,
   *  unknown>` doesn't accept typed adapters' payloads without an
   *  index signature, so we use the looser `object` constraint and
   *  cast at the firestore boundary. */
  data: SyncEntity<object>;
  /** When we first queued this write. Used for retry backoff. */
  queuedAt: number;
  /** How many push attempts we've made. */
  attempts: number;
}

/** Snapshot of the engine state, surfaced to UI consumers. */
export interface SyncEngineState {
  /** Engine is mounted and authenticated (non-anonymous). */
  isActive: boolean;
  /** Device reports network connectivity (NetInfo). */
  isOnline: boolean;
  /** A push or pull is currently in flight. */
  isSyncing: boolean;
  /** Number of writes queued but not yet acked by Firestore. */
  pendingWrites: number;
  /** Epoch ms of the last successful push or pull, or null. */
  lastSyncedAt: number | null;
  /** Last error message, if any (cleared on next success). */
  lastError: string | null;
  /** Sprint 43 — pending conflicts awaiting user resolution. */
  conflicts: readonly ConflictRecord[];
}

/** Sprint 43 — user's choice when resolving a conflict. */
export type ConflictChoice = 'keepMine' | 'keepTheirs' | 'merge';

/**
 * Sprint 43 — one detected conflict between a local row and an incoming
 * remote change. Lives in the engine's queue until the user resolves
 * it via SyncEngine.resolveConflict(). Surfaced via SyncEngineState.
 */
export interface ConflictRecord {
  /** Stable id = `${collection}__${docId}` so a re-detection replaces. */
  id: string;
  collection: string;
  docId: string;
  /** Snapshot of the local doc at detection time. */
  localVersion: SyncEntity<Record<string, unknown>>;
  /** Snapshot of the remote doc at detection time. */
  remoteVersion: SyncEntity<Record<string, unknown>>;
  /** Subset of material fields that actually differed. */
  differingFields: readonly string[];
  /** Wall-clock when the conflict was first detected, ms. */
  detectedAt: number;
}

/**
 * Sprint 43 — what we log to Firestore under users/{uid}/conflicts/{id}
 * once the user resolves a conflict. Lets a 2nd device see the history.
 */
export interface ResolvedConflictRecord extends ConflictRecord {
  resolvedAt: number;
  choice: ConflictChoice;
  /** The value that actually got written locally + pushed. */
  resolvedValue: SyncEntity<Record<string, unknown>>;
}

/** Engine notifications surfaced to the React layer. */
export type SyncEngineListener = (state: SyncEngineState) => void;
