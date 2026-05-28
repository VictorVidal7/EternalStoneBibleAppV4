/**
 * Sprint 42 — SyncEngine.
 *
 * Single class owns:
 *  - Per-collection Firestore onSnapshot listeners
 *  - Queue of pending writes/deletes, persisted to AsyncStorage so an
 *    app-kill while offline doesn't lose work
 *  - NetInfo gate: stop trying to push when offline, resume when back
 *  - Initial bulk push when a uid first authenticates (so anonymous
 *    data gets attached to the Google account on linkWithCredential)
 *  - Last-write-wins reconciliation (the simple version — S43 layers
 *    a real conflict-resolution UI on top)
 *
 * The engine is auth-aware but does not own the auth listener. The
 * SyncEngineContext above it watches AuthContext and calls
 * engine.start(uid) / engine.stop() at the right moments.
 *
 * What this sprint deliberately does NOT do:
 *  - Multi-device verified live (S43 — needs two emulators)
 *  - Smart conflict resolution (S43 — LWW is the starting point)
 *  - Field-level merging (we set with merge:true so independent fields
 *    can co-exist, but two devices writing the same field still resolve
 *    via updatedAt)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '@lib/utils/logger';
import {
  getFirestore,
  type CollectionRef,
  type DocumentChange,
  type FirestoreFn,
} from './firestore';
import {getNetInfo, isStateOnline} from './netinfo';
import type {
  ConflictChoice,
  ConflictRecord,
  PendingWrite,
  RemoteChange,
  ResolvedConflictRecord,
  SyncAdapter,
  SyncEngineListener,
  SyncEngineState,
  SyncEntity,
} from './types';

const QUEUE_STORAGE_KEY = '@sync_queue_v1';
const BULK_PUSH_FLAG_PREFIX = '@sync_first_push_done:';
const MAX_RETRY_ATTEMPTS = 8;
/**
 * Sprint 43 — when a remote change lands within this many ms of the
 * local updatedAt, AND material fields differ, the engine surfaces it
 * as a conflict instead of applying via LWW. 30s matches "two users
 * actively editing the same doc"; older remote changes are stale and
 * LWW handles them correctly.
 */
const CONFLICT_WINDOW_MS = 30000;

/** Deep equality good enough for our small payloads (text, tags arrays, etc).
 *  null and undefined are treated as equivalent — SQLite NULL surfaces as
 *  null locally while an absent Firestore field surfaces as undefined,
 *  but semantically both mean "no value" for our adapters. */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object') {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

type AnyAdapter = SyncAdapter<unknown>;

export class SyncEngine {
  private adapters = new Map<string, AnyAdapter>();
  private listeners = new Set<SyncEngineListener>();
  /** Active firestore listener teardowns, keyed by collection. */
  private unsubs = new Map<string, () => void>();
  private netUnsub: (() => void) | null = null;
  private uid: string | null = null;
  private queue: PendingWrite[] = [];
  private queueHydrated = false;
  private flushInFlight = false;
  /** True while we're applying a remote change to local — adapters
   *  should NOT re-queue their writes during this window. */
  private suppressLocalWriteCount = 0;
  /** Sprint 43 — active conflicts awaiting user resolution. */
  private conflicts: ConflictRecord[] = [];
  /** Sprint 43 — when set, the next maybeRunInitialBulkPush persists the
   *  done-flag without actually queueing any rows. Used by the migration
   *  flow in AuthContext when the user opts out of migrating anonymous
   *  data into an existing Google account. */
  private skipNextBulkPush = false;
  private state: SyncEngineState = {
    isActive: false,
    isOnline: true,
    isSyncing: false,
    pendingWrites: 0,
    lastSyncedAt: null,
    lastError: null,
    conflicts: [],
  };

  // ---------- public API ----------

  /** Register a context's adapter. Safe to call before or after start(). */
  register(adapter: AnyAdapter): void {
    if (this.adapters.has(adapter.collection)) {
      logger.warn('SyncEngine: adapter re-registered, overwriting', {
        component: 'SyncEngine',
        collection: adapter.collection,
      });
    }
    this.adapters.set(adapter.collection, adapter);
    if (this.uid) {
      // Already active — wire this adapter's listener immediately and
      // ensure the initial bulk push picks it up if it hasn't run.
      void this.attachListener(adapter);
    }
  }

  unregister(collection: string): void {
    this.adapters.delete(collection);
    const off = this.unsubs.get(collection);
    if (off) {
      off();
      this.unsubs.delete(collection);
    }
  }

  /** Subscribe to state changes. Returns unsubscribe. */
  subscribe(listener: SyncEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): SyncEngineState {
    return this.state;
  }

  /**
   * Activate the engine for a given uid. Sets up firestore listeners,
   * hydrates the persisted queue, subscribes to NetInfo. Idempotent —
   * calling with the same uid is a no-op.
   */
  async start(uid: string): Promise<void> {
    if (this.uid === uid && this.state.isActive) return;
    if (this.uid && this.uid !== uid) {
      // uid changed (rare — sign-out then sign-in as a different user).
      // Tear everything down first so we don't leak listeners.
      this.stop();
    }
    this.uid = uid;
    this.updateState({isActive: true, lastError: null});

    await this.hydrateQueue();
    this.subscribeNetInfo();

    // Attach a listener per already-registered adapter.
    for (const adapter of this.adapters.values()) {
      // Fire and forget — each listener manages its own errors.
      void this.attachListener(adapter);
    }

    // Initial bulk push: if we've never pushed for this uid, snapshot
    // every adapter and queue everything. This is what runs after
    // linkWithCredential turns an anonymous user into a Google one —
    // the local data gets attached to the new uid.
    void this.maybeRunInitialBulkPush(uid);

    // Try to flush whatever's queued (from a prior session or just-now).
    void this.flush();
  }

  /** Detach all listeners + clear in-memory state. Persisted queue survives. */
  stop(): void {
    for (const off of this.unsubs.values()) off();
    this.unsubs.clear();
    if (this.netUnsub) {
      this.netUnsub();
      this.netUnsub = null;
    }
    this.uid = null;
    // Conflicts are transient — they snapshot the local doc at detection
    // time. If the user signs back in, fresh onSnapshot events will
    // re-detect any still-divergent docs.
    this.conflicts = [];
    this.updateState({
      isActive: false,
      isSyncing: false,
      conflicts: [],
      // keep pendingWrites count — the queue is persisted, and if the
      // user signs back in we'll attempt to flush it again.
    });
  }

  /**
   * Queue an upsert. Called by every context's add/update function
   * after the local persistence succeeds.
   *
   * No-op when the engine isn't active (anonymous user, or no auth
   * yet). The local change still went through; we just don't bother
   * recording a queue entry that would never have anywhere to land.
   */
  queueWrite(collection: string, id: string, data: object): void {
    if (!this.uid) return;
    if (this.suppressLocalWriteCount > 0) return;
    const asRecord = data as Record<string, unknown>;
    const entity: SyncEntity<object> = {
      ...asRecord,
      updatedAt:
        typeof asRecord.updatedAt === 'number'
          ? asRecord.updatedAt
          : Date.now(),
    };
    this.upsertQueueEntry({
      collection,
      id,
      data: entity,
      queuedAt: Date.now(),
      attempts: 0,
    });
    void this.flush();
  }

  /**
   * Queue a delete. Pushes a tombstone (`deleted: true`) to Firestore
   * so other devices can see the delete on their next pull.
   */
  queueDelete(collection: string, id: string, lastKnownData?: object): void {
    if (!this.uid) return;
    if (this.suppressLocalWriteCount > 0) return;
    const base = (lastKnownData as Record<string, unknown> | undefined) ?? {};
    const tombstone: SyncEntity<object> = {
      ...base,
      updatedAt: Date.now(),
      deleted: true,
      deletedAt: Date.now(),
    };
    this.upsertQueueEntry({
      collection,
      id,
      data: tombstone,
      queuedAt: Date.now(),
      attempts: 0,
    });
    void this.flush();
  }

  /**
   * Wrap an adapter mutation so the engine knows to ignore any
   * `queueWrite` calls the adapter triggers as a side effect. Used
   * internally by applyRemoteChange so a remote pull doesn't bounce
   * back as a local push.
   */
  private async withLocalWriteSuppressed<T>(fn: () => Promise<T>): Promise<T> {
    this.suppressLocalWriteCount += 1;
    try {
      return await fn();
    } finally {
      this.suppressLocalWriteCount -= 1;
    }
  }

  // ---------- private: queue persistence ----------

  private async hydrateQueue(): Promise<void> {
    if (this.queueHydrated) return;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Defensive filter — drop anything that doesn't look like a
          // PendingWrite. A malformed entry would block the flush loop.
          this.queue = parsed.filter(
            (e): e is PendingWrite =>
              e &&
              typeof e.collection === 'string' &&
              typeof e.id === 'string' &&
              e.data &&
              typeof e.data === 'object',
          );
        }
      }
    } catch (err) {
      logger.warn('SyncEngine: failed to hydrate queue', {
        component: 'SyncEngine',
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.queueHydrated = true;
      this.updateState({pendingWrites: this.queue.length});
    }
  }

  private async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (err) {
      logger.warn('SyncEngine: failed to persist queue', {
        component: 'SyncEngine',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private upsertQueueEntry(entry: PendingWrite): void {
    const idx = this.queue.findIndex(
      e => e.collection === entry.collection && e.id === entry.id,
    );
    if (idx >= 0) {
      // Replace existing pending write — newer wins.
      this.queue[idx] = entry;
    } else {
      this.queue.push(entry);
    }
    this.updateState({pendingWrites: this.queue.length});
    void this.persistQueue();
  }

  // ---------- private: NetInfo ----------

  private subscribeNetInfo(): void {
    if (this.netUnsub) return;
    const netInfo = getNetInfo();
    if (!netInfo) return;
    // Initial fetch so isOnline reflects reality before the first event.
    netInfo
      .fetch()
      .then(s => {
        this.updateState({isOnline: isStateOnline(s)});
        if (isStateOnline(s)) void this.flush();
      })
      .catch(() => undefined);
    this.netUnsub = netInfo.addEventListener(state => {
      const next = isStateOnline(state);
      const wasOffline = !this.state.isOnline;
      this.updateState({isOnline: next});
      if (next && wasOffline) {
        // Just came back online — try to drain the queue.
        void this.flush();
      }
    });
  }

  // ---------- private: firestore listeners ----------

  private async attachListener(adapter: AnyAdapter): Promise<void> {
    if (!this.uid) return;
    if (this.unsubs.has(adapter.collection)) return; // already attached
    const fn = getFirestore();
    if (!fn) return; // module unavailable — engine is a no-op
    let collectionRef: CollectionRef;
    try {
      collectionRef = fn().collection(
        `users/${this.uid}/${adapter.collection}`,
      );
    } catch (err) {
      logger.error(
        'SyncEngine: failed to resolve firestore collection',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'SyncEngine', collection: adapter.collection},
      );
      return;
    }
    const off = collectionRef.onSnapshot(
      snapshot => {
        void this.handleSnapshot(adapter, snapshot.docChanges());
      },
      err => {
        logger.error('SyncEngine: snapshot error', err, {
          component: 'SyncEngine',
          collection: adapter.collection,
        });
        this.updateState({lastError: err.message});
      },
    );
    this.unsubs.set(adapter.collection, off);
  }

  private async handleSnapshot(
    adapter: AnyAdapter,
    changes: DocumentChange[],
  ): Promise<void> {
    if (changes.length === 0) return;
    this.updateState({isSyncing: true});
    try {
      for (const change of changes) {
        const id = change.doc.id;
        const data = change.doc.data();
        if (change.type === 'removed' || !data) {
          // Hard remove (rare — we soft-delete via tombstone). Treat
          // same as a deleted-true upsert: drop the local row.
          await this.withLocalWriteSuppressed(() =>
            adapter.applyRemoteDelete(id),
          );
          continue;
        }
        const remote = data as SyncEntity<Record<string, unknown>>;
        const remoteChange: RemoteChange<Record<string, unknown>> = {
          id,
          data: remote,
          deleted: remote.deleted === true,
        };
        await this.applyRemoteChange(adapter, remoteChange);
      }
      this.updateState({lastSyncedAt: Date.now(), lastError: null});
    } catch (err) {
      logger.error(
        'SyncEngine: handleSnapshot threw',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'SyncEngine', collection: adapter.collection},
      );
      this.updateState({
        lastError: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.updateState({isSyncing: false});
    }
  }

  private async applyRemoteChange(
    adapter: AnyAdapter,
    change: RemoteChange<Record<string, unknown>>,
  ): Promise<void> {
    const {id, data, deleted} = change;
    const local = await adapter.getLocal(id);

    if (local && data) {
      const localTs = typeof local.updatedAt === 'number' ? local.updatedAt : 0;
      const remoteTs = typeof data.updatedAt === 'number' ? data.updatedAt : 0;
      const withinWindow = Math.abs(localTs - remoteTs) < CONFLICT_WINDOW_MS;
      const materialFields = adapter.getMaterialFields?.() ?? [];

      if (withinWindow && materialFields.length > 0 && !deleted) {
        const localRec = local as unknown as Record<string, unknown>;
        const differing = materialFields.filter(
          f => !valuesEqual(localRec[f], data[f]),
        );
        if (differing.length > 0) {
          // Conflict: both devices touched this doc inside the window
          // AND at least one material field differs. Hold instead of
          // applying LWW — user picks the winner via the conflicts UI.
          this.recordConflict({
            id: `${adapter.collection}__${id}`,
            collection: adapter.collection,
            docId: id,
            localVersion: local as SyncEntity<Record<string, unknown>>,
            remoteVersion: data,
            differingFields: differing,
            detectedAt: Date.now(),
          });
          return;
        }
      }

      if (remoteTs <= localTs) {
        // LWW: local is at least as fresh, ignore the remote change.
        return;
      }
    }

    if (deleted) {
      await this.withLocalWriteSuppressed(() => adapter.applyRemoteDelete(id));
    } else if (data) {
      await this.withLocalWriteSuppressed(() =>
        adapter.applyRemoteUpsert(id, data),
      );
    }
  }

  /**
   * Sprint 43 — snapshot the count per collection of local rows, used
   * by the AuthContext migration dialog to tell the user "you have X
   * favorites / Y notes on this device — migrate them?".
   *
   * Best-effort: adapters that throw are skipped, not propagated.
   */
  async exportLocalData(): Promise<Array<{collection: string; count: number}>> {
    const out: Array<{collection: string; count: number}> = [];
    for (const adapter of this.adapters.values()) {
      try {
        const rows = await adapter.pullAllLocal();
        if (rows.length > 0) {
          out.push({collection: adapter.collection, count: rows.length});
        }
      } catch (err) {
        logger.warn('SyncEngine: exportLocalData adapter failed', {
          component: 'SyncEngine',
          collection: adapter.collection,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return out;
  }

  /**
   * Sprint 43 — mark the next maybeRunInitialBulkPush to skip queuing
   * (and persist the done-flag so subsequent sessions skip too). Used
   * by AuthContext when the user picks "Just sign in" in the migration
   * dialog.
   */
  queueSkipNextBulkPush(): void {
    this.skipNextBulkPush = true;
  }

  // ---------- private: conflict bookkeeping ----------

  private recordConflict(record: ConflictRecord): void {
    // Replace existing record for the same doc with the latest snapshot
    // so the user always sees the most recent remote version.
    const idx = this.conflicts.findIndex(c => c.id === record.id);
    if (idx >= 0) {
      this.conflicts[idx] = record;
    } else {
      this.conflicts.push(record);
    }
    this.updateState({conflicts: [...this.conflicts]});
    logger.info('SyncEngine: conflict detected', {
      component: 'SyncEngine',
      conflictId: record.id,
      differingFields: record.differingFields.join(','),
    });
  }

  // ---------- public: conflict resolution ----------

  /** Sprint 43 — current pending conflicts. Snapshot, safe to keep. */
  getConflicts(): readonly ConflictRecord[] {
    return [...this.conflicts];
  }

  /**
   * Resolve a pending conflict. `keepMine` re-stamps the local doc with
   * now and pushes (so it wins next sync); `keepTheirs` applies the
   * remote locally; `merge` applies mergedValue + pushes.
   *
   * The resolved record is logged to users/{uid}/conflicts/{id} for
   * cross-device audit (best-effort, errors are warned not thrown).
   */
  async resolveConflict(
    conflictId: string,
    choice: ConflictChoice,
    mergedValue?: SyncEntity<Record<string, unknown>>,
  ): Promise<void> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      logger.warn('SyncEngine: resolveConflict for unknown id', {
        component: 'SyncEngine',
        conflictId,
      });
      return;
    }
    const adapter = this.adapters.get(conflict.collection);
    if (!adapter) {
      logger.warn('SyncEngine: no adapter for conflict collection', {
        component: 'SyncEngine',
        collection: conflict.collection,
      });
      return;
    }

    const now = Date.now();
    let resolvedValue: SyncEntity<Record<string, unknown>>;

    if (choice === 'keepMine') {
      resolvedValue = {...conflict.localVersion, updatedAt: now};
      // queueWrite handles the push; local store already has this value.
      this.queueWrite(conflict.collection, conflict.docId, resolvedValue);
    } else if (choice === 'keepTheirs') {
      resolvedValue = conflict.remoteVersion;
      await this.withLocalWriteSuppressed(() =>
        adapter.applyRemoteUpsert(
          conflict.docId,
          resolvedValue as SyncEntity<unknown>,
        ),
      );
    } else {
      if (!mergedValue) {
        throw new Error('resolveConflict: merge choice requires mergedValue');
      }
      resolvedValue = {...mergedValue, updatedAt: now};
      await this.withLocalWriteSuppressed(() =>
        adapter.applyRemoteUpsert(
          conflict.docId,
          resolvedValue as SyncEntity<unknown>,
        ),
      );
      this.queueWrite(conflict.collection, conflict.docId, resolvedValue);
    }

    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
    this.updateState({conflicts: [...this.conflicts]});

    void this.logResolvedConflict({
      ...conflict,
      resolvedAt: now,
      choice,
      resolvedValue,
    });
  }

  private async logResolvedConflict(
    record: ResolvedConflictRecord,
  ): Promise<void> {
    if (!this.uid) return;
    const fn = getFirestore();
    if (!fn) return;
    try {
      await fn()
        .collection(`users/${this.uid}/conflicts`)
        .doc(record.id)
        .set(record);
    } catch (err) {
      logger.warn('SyncEngine: logResolvedConflict failed', {
        component: 'SyncEngine',
        conflictId: record.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // ---------- private: initial bulk push ----------

  private async maybeRunInitialBulkPush(uid: string): Promise<void> {
    const flagKey = `${BULK_PUSH_FLAG_PREFIX}${uid}`;
    if (this.skipNextBulkPush) {
      // User opted out of migrating their local-only data into this
      // (existing) Google account. Persist the flag so subsequent
      // sessions also skip, then clear the in-memory marker.
      this.skipNextBulkPush = false;
      try {
        await AsyncStorage.setItem(flagKey, '1');
      } catch {
        // best-effort
      }
      logger.info('SyncEngine: bulk push skipped by user', {
        component: 'SyncEngine',
        uid,
      });
      return;
    }
    try {
      const done = await AsyncStorage.getItem(flagKey);
      if (done === '1') return;
    } catch {
      // If we can't read the flag, do the push — duplicate writes are
      // idempotent (the doc id is stable), so the worst case is
      // bandwidth, not correctness.
    }
    let queuedCount = 0;
    for (const adapter of this.adapters.values()) {
      try {
        const rows = await adapter.pullAllLocal();
        for (const row of rows) {
          this.upsertQueueEntry({
            collection: adapter.collection,
            id: row.id,
            // Cast: SyncEntity<unknown> is structurally a SyncEntity<object>
            // (every adapter's T is an object in practice).
            data: row.data as SyncEntity<object>,
            queuedAt: Date.now(),
            attempts: 0,
          });
          queuedCount += 1;
        }
      } catch (err) {
        logger.warn('SyncEngine: pullAllLocal failed during bulk push', {
          component: 'SyncEngine',
          collection: adapter.collection,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    try {
      await AsyncStorage.setItem(flagKey, '1');
    } catch {
      // best-effort; if we can't persist, next session retries the push
    }
    if (queuedCount > 0) {
      logger.info('SyncEngine: initial bulk push queued', {
        component: 'SyncEngine',
        uid,
        queuedCount,
      });
      void this.flush();
    }
  }

  // ---------- private: flush ----------

  /**
   * Try to push every queued write. Re-entrant safe (guarded by
   * flushInFlight) — a second concurrent call returns immediately.
   */
  private async flush(): Promise<void> {
    if (this.flushInFlight) return;
    if (!this.uid) return;
    if (!this.state.isOnline) return;
    if (this.queue.length === 0) return;
    const fn = getFirestore();
    if (!fn) return;

    this.flushInFlight = true;
    this.updateState({isSyncing: true});
    try {
      // Snapshot the current queue — flushes that come in mid-loop will
      // be picked up on the next call.
      const items = [...this.queue];
      for (const item of items) {
        try {
          await this.pushOne(fn, item);
          // Success — remove from queue (by reference match on
          // collection+id, the only stable key).
          this.queue = this.queue.filter(
            q => !(q.collection === item.collection && q.id === item.id),
          );
          this.updateState({
            pendingWrites: this.queue.length,
            lastSyncedAt: Date.now(),
            lastError: null,
          });
        } catch (err) {
          // Increment attempts; drop only after MAX_RETRY_ATTEMPTS so
          // a poisoned entry can't block the queue forever.
          const idx = this.queue.findIndex(
            q => q.collection === item.collection && q.id === item.id,
          );
          if (idx >= 0) {
            this.queue[idx] = {
              ...item,
              attempts: item.attempts + 1,
            };
            if (this.queue[idx].attempts >= MAX_RETRY_ATTEMPTS) {
              logger.error(
                'SyncEngine: dropping queue entry after max retries',
                err instanceof Error ? err : new Error(String(err)),
                {
                  component: 'SyncEngine',
                  collection: item.collection,
                  id: item.id,
                  attempts: this.queue[idx].attempts,
                },
              );
              this.queue.splice(idx, 1);
            }
          }
          this.updateState({
            pendingWrites: this.queue.length,
            lastError: err instanceof Error ? err.message : String(err),
          });
          // Stop the flush — likely network problem, NetInfo or a later
          // queueWrite call will trigger another flush attempt.
          break;
        }
      }
      await this.persistQueue();
    } finally {
      this.flushInFlight = false;
      this.updateState({isSyncing: false});
    }
  }

  private async pushOne(
    firestoreFn: FirestoreFn,
    item: PendingWrite,
  ): Promise<void> {
    if (!this.uid) throw new Error('engine inactive during push');
    const ref = firestoreFn()
      .collection(`users/${this.uid}/${item.collection}`)
      .doc(item.id);
    await ref.set(item.data, {merge: true});
  }

  // ---------- private: state plumbing ----------

  private updateState(patch: Partial<SyncEngineState>): void {
    const next = {...this.state, ...patch};
    // Skip notification if nothing actually changed.
    const changed = (Object.keys(patch) as Array<keyof SyncEngineState>).some(
      k => this.state[k] !== next[k],
    );
    if (!changed) return;
    this.state = next;
    for (const listener of this.listeners) {
      try {
        listener(next);
      } catch (err) {
        logger.warn('SyncEngine: listener threw', {
          component: 'SyncEngine',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // ---------- test helpers ----------

  /** Test-only: forcibly drain. Returns count actually pushed. */
  async __flushForTests(): Promise<void> {
    await this.flush();
  }

  __getQueueForTests(): readonly PendingWrite[] {
    return this.queue;
  }

  __setOnlineForTests(online: boolean): void {
    this.updateState({isOnline: online});
    if (online) void this.flush();
  }

  __getConflictsForTests(): readonly ConflictRecord[] {
    return [...this.conflicts];
  }

  __clearConflictsForTests(): void {
    this.conflicts = [];
    this.updateState({conflicts: []});
  }
}
