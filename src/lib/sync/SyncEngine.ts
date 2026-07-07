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
  isReviewEventEligibleForCloudCleanup,
  REVIEW_EVENT_SYNC_WINDOW_MS,
} from '@lib/memory/reviewEvents';
import {
  getFirestore,
  type CollectionRef,
  type DocumentChange,
  type FirestoreFn,
  type Query,
  type QuerySnapshot,
} from './firestore';
import {getNetInfo, isStateOnline} from './netinfo';
import {deepWithoutUndefined} from './sanitize';
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
/**
 * Sprint 78 — the done-marker is VERSIONED. The S77/S78 `undefined` fix
 * revealed that entities whose payload carried an undefined field were
 * silently DROPPED from the queue for months (note-less favorites,
 * label-less bookmarks, note-less/category-less highlights), so devices
 * whose flag holds the legacy '1' re-run the initial bulk push ONCE to
 * heal them — idempotent (stable doc ids + merge:true), cost is bandwidth.
 * A user opt-out ("Just sign in") is recorded as 'skip' from now on and is
 * honored permanently; a legacy '1' written by a pre-v2 opt-out can't be
 * told apart from a pre-v2 done, and the healing push deliberately wins —
 * every post-opt-out edit already re-uploads its entity via queueWrite, so
 * the migration skip was never a durable privacy boundary.
 */
const BULK_PUSH_DONE_VALUE = '2';
const BULK_PUSH_SKIP_VALUE = 'skip';
const MAX_RETRY_ATTEMPTS = 8;
/**
 * Sprint 47 — a safety-net flush interval. The queue is normally drained by
 * queueWrite / NetInfo / the post-hydration flush, but a push that failed on
 * a transient error (the loop `break`s and leaves it queued) would otherwise
 * sit until the next external trigger. This periodic tick retries it while
 * the engine is active + online + has pending work.
 */
const FLUSH_INTERVAL_MS = 60000;
/**
 * Sprint 43 — when a remote change lands within this many ms of the
 * local updatedAt, AND material fields differ, the engine surfaces it
 * as a conflict instead of applying via LWW. 30s matches "two users
 * actively editing the same doc"; older remote changes are stale and
 * LWW handles them correctly.
 */
const CONFLICT_WINDOW_MS = 30000;

/**
 * Sprint 49 — hard cap on how many resolved-conflict docs
 * fetchResolvedConflicts() will read in one call. Conflicts are rare
 * (see CONFLICT_WINDOW_MS), so this is generous headroom rather than a
 * realistic ceiling — it exists to bound Firestore reads, not to trim
 * real usage.
 */
const MAX_RESOLVED_CONFLICTS = 500;

/**
 * Quota hardening — per-collection incremental sync cursor.
 *
 * Before this change, `attachListener` opened an UNFILTERED
 * `onSnapshot` on the whole collection: every reattach (app cold start,
 * reinstall, a cache that didn't survive) re-delivered EVERY existing
 * doc as an "added" change, billed as one Firestore read per doc. For
 * an account with years of favorites/notes/highlights/etc. that's a
 * full-history re-read on every single app start.
 *
 * The fix: persist, per collection, the highest `updatedAt` we've ever
 * successfully observed (AsyncStorage key `@sync_cursor_{collection}:
 * {uid}` — see `cursorStorageKey`), and attach the listener with
 * `where('updatedAt', '>=', cursor - CURSOR_SAFETY_MARGIN_MS)` instead
 * of no filter at all. A brand-new user/device has no persisted cursor
 * (defaults to 0), so the first-ever attach still pulls full history —
 * that's a one-time, expected cost, not a recurring one.
 *
 * `updatedAt` is a CLIENT clock timestamp (`Date.now()` at queue time),
 * not a Firestore server timestamp — see `queueWrite`/`queueDelete`. Two
 * devices' clocks are never perfectly in sync, so a naive cursor could
 * permanently exclude a genuinely-new write from a device whose clock
 * runs behind the device that set the cursor. CURSOR_SAFETY_MARGIN_MS
 * is a deliberate over-fetch buffer: as long as any two devices sharing
 * an account are within this many ms of each other, no write is ever
 * permanently missed — we'd just re-read (never lose) a few extra
 * minutes' worth of already-seen docs on reattach. This directly serves
 * this project's rule that a quota optimization must never risk losing
 * a user's data; see the "residual risks" write-up in the commit that
 * introduced this constant for the (narrow, accepted) case this doesn't
 * fully cover: clock skew LARGER than this margin between two devices.
 */
export const CURSOR_SAFETY_MARGIN_MS = 5 * 60 * 1000; // 5 minutes

const CURSOR_STORAGE_PREFIX = '@sync_cursor_';

/**
 * Quota hardening — reviewEvents is the one synced collection that grows
 * WITHOUT bound (every review appends a new immutable event; nothing
 * ever removes one locally). This caps how many stale docs one
 * `cleanupOldReviewEvents` pass deletes from Firestore per engine
 * start(), so a very long-lived account's first cleanup after this
 * feature ships can't turn a single app launch into an unbounded delete
 * spree. Any leftover old docs are simply caught on the NEXT start() —
 * the cleanup is idempotent and safe to run partially.
 */
export const REVIEW_EVENTS_CLEANUP_BATCH_SIZE = 200;

/**
 * Sprint 46 — map a logical doc id to a Firestore-safe doc id and back.
 *
 * Some collections key on ids that contain "/" — memoryCards use the
 * `verseKey` ("Book/Chapter/Verse") and reviewEvents use `${verseKey}__${ts}`.
 * Passed straight to `.doc(id)`, a slash is a PATH separator, so the write
 * lands at a *nested* document (e.g. `memoryCards/Genesis/1/1`) that the
 * collection's `onSnapshot` listener never sees — silently breaking
 * cross-device sync for exactly those datasets (the bug surfaced once the
 * S46 NetInfo fix let outbound writes actually reach the server). We encode
 * "/" as "~" (a char that never appears in a verseKey or event id) at the
 * Firestore boundary only — the queue, adapters and local stores keep using
 * the real id. Clean ids (favorites `fav_…`, etc.) pass through untouched.
 */
function toDocId(id: string): string {
  return id.replace(/\//g, '~');
}

function fromDocId(docId: string): string {
  return docId.replace(/~/g, '/');
}

/**
 * Quota hardening — the AsyncStorage key a collection's sync cursor is
 * persisted under. Exported (not just internal) so tests can seed/assert
 * a cursor without duplicating the string format. Scoped by uid so
 * signing out of one account and into another on the same device can
 * never reuse the wrong account's cursor (see `stop()`, which also
 * clears the in-memory cursor cache on every uid change).
 */
export function cursorStorageKey(collection: string, uid: string): string {
  return `${CURSOR_STORAGE_PREFIX}${collection}:${uid}`;
}

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
  /** Sprint 47 — periodic safety-net flush timer (see FLUSH_INTERVAL_MS). */
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private uid: string | null = null;
  private queue: PendingWrite[] = [];
  private queueHydrated = false;
  private flushInFlight = false;
  /** True while we're applying a remote change to local — adapters
   *  should NOT re-queue their writes during this window. */
  private suppressLocalWriteCount = 0;
  /** Sprint 43 — active conflicts awaiting user resolution. */
  private conflicts: ConflictRecord[] = [];
  /**
   * Quota hardening — in-memory cache of each collection's sync cursor
   * (highest `updatedAt` observed), mirrored to AsyncStorage on every
   * advance. Keyed by collection name only — safe because it is fully
   * cleared on every `stop()`, and `start()` always calls `stop()` first
   * when the uid changes, so it can never leak one account's cursor into
   * another's session on the same device.
   */
  private cursors = new Map<string, number>();
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
    this.startPeriodicFlush();

    // Quota hardening — purge cloud-only reviewEvents older than the
    // 12-month sync window BEFORE any listener attaches. Awaited so the
    // deletes complete first: a freshly-attached (cursor-less) listener
    // on a brand-new device would otherwise be able to observe these
    // docs disappear as a live 'removed' change mid-session, and while
    // the reviewEvents adapter treats that as a no-op (see
    // adapters/reviewEvents.ts), attaching AFTER cleanup means the
    // listener's very first snapshot never includes them at all — one
    // less edge case to reason about. Best-effort: a failure here must
    // never block sync from starting for the other 5 collections.
    await this.cleanupOldReviewEvents(uid).catch(err => {
      logger.warn('SyncEngine: cleanupOldReviewEvents failed', {
        component: 'SyncEngine',
        uid,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    // Attach a listener per already-registered adapter. Awaited — unlike
    // before this tanda, attachListener now does a genuine async step
    // (loading the collection's persisted cursor from AsyncStorage), so
    // it can no longer be treated as "effectively synchronous, fire and
    // forget". Awaiting here keeps start()'s contract intact: any code
    // (screens, tests, other contexts) that assumes listeners are live
    // once `await engine.start(uid)` resolves still gets that guarantee.
    // Each attach still manages its own errors internally (logged, never
    // thrown), so one failing collection can't block the others.
    await Promise.all(
      Array.from(this.adapters.values()).map(adapter =>
        this.attachListener(adapter),
      ),
    );

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
    this.stopPeriodicFlush();
    this.uid = null;
    // Conflicts are transient — they snapshot the local doc at detection
    // time. If the user signs back in, fresh onSnapshot events will
    // re-detect any still-divergent docs.
    this.conflicts = [];
    // Quota hardening — drop the in-memory cursor cache so a later
    // start() (same uid signing back in, or a DIFFERENT uid on the same
    // device) always re-derives cursors from AsyncStorage (uid-scoped
    // keys) rather than risking a stale value leaking across accounts.
    this.cursors.clear();
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

  // ---------- private: periodic flush (Sprint 47) ----------

  private startPeriodicFlush(): void {
    if (this.flushTimer) return;
    const timer = setInterval(() => {
      if (this.uid && this.state.isOnline && this.queue.length > 0) {
        void this.flush();
      }
    }, FLUSH_INTERVAL_MS);
    // In Node (jest) the timer would keep the process alive; unref so the
    // test runner exits cleanly. React Native's setInterval returns a number
    // with no unref — the optional chaining no-ops there.
    (timer as unknown as {unref?: () => void}).unref?.();
    this.flushTimer = timer;
  }

  private stopPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
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

    // Quota hardening — filter the live listener to docs changed at or
    // after our persisted cursor (minus the clock-skew safety margin —
    // see CURSOR_SAFETY_MARGIN_MS) instead of the whole collection. A
    // cursor-less collection (new user, new device, or a collection this
    // uid has never synced before) defaults to 0, so `where('updatedAt',
    // '>=', 0)` matches everything — the first attach still pulls full
    // history, exactly as before this change.
    const cursor = await this.loadCursor(adapter.collection);
    const queryFloor = Math.max(0, cursor - CURSOR_SAFETY_MARGIN_MS);
    let query: Query = collectionRef;
    try {
      query = collectionRef.where('updatedAt', '>=', queryFloor);
    } catch (err) {
      // Defensive fallback — prefer an unfiltered (more expensive but
      // never wrong) listener over not syncing this collection at all.
      logger.warn('SyncEngine: where() query build failed, using no filter', {
        component: 'SyncEngine',
        collection: adapter.collection,
        error: err instanceof Error ? err.message : String(err),
      });
      query = collectionRef;
    }

    const off = query.onSnapshot(
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
    // Quota hardening — highest `updatedAt` observed in THIS batch, used
    // to advance the collection's sync cursor once we're done. Tracked
    // regardless of whether a change was actually applied locally: this
    // must also advance for LWW-ignored "echoes" of this device's own
    // writes (queueWrite triggers the same listener), or every reattach
    // would keep re-reading docs we already know about. See the
    // CURSOR_SAFETY_MARGIN_MS comment for why "advance the cursor" and
    // "never lose a change" aren't in tension here.
    let maxSeenUpdatedAt = 0;
    try {
      for (const change of changes) {
        // Decode the Firestore doc id back to the logical id (see toDocId):
        // a memoryCards/reviewEvents id carries "/" which we store as "~".
        const id = fromDocId(change.doc.id);
        const data = change.doc.data();
        if (change.type === 'removed' || !data) {
          // Hard remove (rare — we soft-delete via tombstone). Treat
          // same as a deleted-true upsert: drop the local row. No
          // timestamp to advance the cursor by — safe to skip: a
          // genuinely-removed doc can never be re-delivered as "added"
          // by a future reattach anyway (it no longer exists).
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

        // Quota hardening — withhold this doc's contribution to the
        // cursor if it is STILL a pending conflict after the call above.
        // A held conflict hasn't been applied anywhere yet (the user
        // hasn't picked a winner), so folding its timestamp into the
        // cursor could make a future reattach's query floor exclude it
        // before it's ever resolved — resolveConflict() advances the
        // cursor itself once the doc is actually settled (see below).
        const stillConflicted = this.conflicts.some(
          c => c.collection === adapter.collection && c.docId === id,
        );
        if (
          !stillConflicted &&
          typeof remote.updatedAt === 'number' &&
          remote.updatedAt > maxSeenUpdatedAt
        ) {
          maxSeenUpdatedAt = remote.updatedAt;
        }
      }
      if (maxSeenUpdatedAt > 0) {
        await this.advanceCursor(adapter.collection, maxSeenUpdatedAt);
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

  // ---------- private: sync cursor (quota hardening) ----------

  /**
   * Load a collection's persisted cursor (highest `updatedAt` we've ever
   * successfully observed for this uid), caching it in-memory for the
   * rest of the session. Returns 0 (= "sync everything") when nothing is
   * persisted yet — a brand-new user, a reinstall/new device
   * (AsyncStorage is gone), or a collection this uid has simply never
   * synced before. That 0 is exactly what makes the "new device still
   * gets full history" guarantee hold: there is no special-case branch
   * for it anywhere else, it falls straight out of this default.
   */
  private async loadCursor(collection: string): Promise<number> {
    const cached = this.cursors.get(collection);
    if (cached !== undefined) return cached;
    let value = 0;
    if (this.uid) {
      try {
        const raw = await AsyncStorage.getItem(
          cursorStorageKey(collection, this.uid),
        );
        const parsed = raw != null ? Number(raw) : NaN;
        if (Number.isFinite(parsed) && parsed > 0) value = parsed;
      } catch (err) {
        logger.warn('SyncEngine: failed to read sync cursor', {
          component: 'SyncEngine',
          collection,
          error: err instanceof Error ? err.message : String(err),
        });
        // Fall through with value = 0 — worst case we re-read the whole
        // collection once more than strictly necessary, never less.
      }
    }
    this.cursors.set(collection, value);
    return value;
  }

  /**
   * Advance a collection's cursor to `seenUpdatedAt` if it's newer than
   * what we already have, persisting the new value to AsyncStorage. A
   * no-op — not an error — when `seenUpdatedAt` isn't actually newer:
   * batches can legitimately re-deliver older docs than we've already
   * advanced past (that's the whole point of CURSOR_SAFETY_MARGIN_MS),
   * and the cursor must never move BACKWARD.
   */
  private async advanceCursor(
    collection: string,
    seenUpdatedAt: number,
  ): Promise<void> {
    if (!this.uid) return;
    if (!Number.isFinite(seenUpdatedAt) || seenUpdatedAt <= 0) return;
    const current = this.cursors.get(collection) ?? 0;
    if (seenUpdatedAt <= current) return;
    this.cursors.set(collection, seenUpdatedAt);
    try {
      await AsyncStorage.setItem(
        cursorStorageKey(collection, this.uid),
        String(seenUpdatedAt),
      );
    } catch (err) {
      logger.warn('SyncEngine: failed to persist sync cursor', {
        component: 'SyncEngine',
        collection,
        error: err instanceof Error ? err.message : String(err),
      });
      // Best-effort — the in-memory cursor still advanced for the rest
      // of THIS session (we won't re-process this batch again now), and
      // if the process dies before a later write persists it, the next
      // session simply falls back to an older cursor and re-reads a bit
      // more than strictly necessary. Never less.
    }
  }

  // ---------- private: reviewEvents cloud-only cleanup (quota hardening) ----------

  /**
   * Delete reviewEvents docs from Firestore whose `updatedAt` is older
   * than the 12-month sync window (REVIEW_EVENT_SYNC_WINDOW_MS) for
   * `uid`. Called once per engine start() — not on a timer/tick — so a
   * single session pays a bounded, occasional cost instead of a
   * recurring one; any leftovers past the batch cap are simply caught on
   * the next start().
   *
   * Firestore-ONLY. This function must NEVER touch local SQLite —
   * reviewEvents' local copy (`review_events` table) is the permanent
   * record behind every on-device stat, including premium "full
   * history" insights that intentionally look further back than 12
   * months (see history.ts). Only the cloud copy is pruned. (The
   * reviewEvents adapter's `applyRemoteDelete` is also a deliberate
   * no-op precisely so that even a live listener that happens to
   * observe one of these deletes can't cascade it into a local
   * SQLite delete — see adapters/reviewEvents.ts.)
   *
   * Defensive twice over:
   *  1. The Firestore query only matches `updatedAt < cutoff` — a doc
   *     with a missing/non-numeric `updatedAt` never matches an
   *     inequality filter on that field, so Firestore itself excludes
   *     ambiguously-dated docs from the candidate set.
   *  2. Belt-and-suspenders: every candidate is re-checked locally via
   *     `isReviewEventEligibleForCloudCleanup` immediately before the
   *     delete call, so even a malformed doc that somehow slipped
   *     through can never be deleted on a doubtful date.
   */
  private async cleanupOldReviewEvents(uid: string): Promise<void> {
    const fn = getFirestore();
    if (!fn) return;
    const now = Date.now();
    const cutoff = now - REVIEW_EVENT_SYNC_WINDOW_MS;
    const path = `users/${uid}/reviewEvents`;

    let snapshot: QuerySnapshot;
    try {
      const query = fn()
        .collection(path)
        .where('updatedAt', '<', cutoff)
        .orderBy('updatedAt', 'asc')
        .limit(REVIEW_EVENTS_CLEANUP_BATCH_SIZE);
      snapshot = await query.get();
    } catch (err) {
      logger.warn('SyncEngine: cleanupOldReviewEvents query failed', {
        component: 'SyncEngine',
        uid,
        error: err instanceof Error ? err.message : String(err),
      });
      return;
    }
    if (!snapshot.docs || snapshot.docs.length === 0) return;

    let deleted = 0;
    let skipped = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updatedAt = data
        ? (data as Record<string, unknown>).updatedAt
        : undefined;
      if (!isReviewEventEligibleForCloudCleanup(updatedAt, now)) {
        skipped += 1;
        continue; // Never delete a doc we can't confidently date as old.
      }
      try {
        await fn().collection(path).doc(doc.id).delete();
        deleted += 1;
      } catch (err) {
        logger.warn('SyncEngine: cleanupOldReviewEvents delete failed', {
          component: 'SyncEngine',
          uid,
          docId: doc.id,
          error: err instanceof Error ? err.message : String(err),
        });
        // Keep going — one failed delete must not abort the rest of the
        // batch; it (and any others) will be retried on the next start().
      }
    }
    if (deleted > 0 || skipped > 0) {
      logger.info('SyncEngine: cleanupOldReviewEvents finished', {
        component: 'SyncEngine',
        uid,
        candidates: snapshot.docs.length,
        deleted,
        skipped,
      });
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

    // Quota hardening — this doc's timestamp was withheld from the
    // cursor while the conflict was pending (see handleSnapshot); now
    // that the user has settled it, fold it in so a future reattach
    // doesn't needlessly re-read it. Safe either way — omitting this
    // would only cost an extra (never a lost) read on some future
    // reattach.
    const resolvedTs =
      typeof resolvedValue.updatedAt === 'number'
        ? resolvedValue.updatedAt
        : now;
    void this.advanceCursor(conflict.collection, resolvedTs);

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
      // Sprint 78 — the record NESTS whole entities (localVersion/
      // remoteVersion/resolvedValue); a single undefined field anywhere in
      // them would make Firestore reject the whole audit write.
      await fn()
        .collection(`users/${this.uid}/conflicts`)
        .doc(record.id)
        .set(deepWithoutUndefined(record));
    } catch (err) {
      logger.warn('SyncEngine: logResolvedConflict failed', {
        component: 'SyncEngine',
        conflictId: record.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Sprint 49 — one-shot read of the resolved-conflict audit log that
   * logResolvedConflict writes to users/{uid}/conflicts. Read-only: this
   * collection is NOT a synced dataset (no adapter, no local store, no
   * onSnapshot listener), so the analytics dashboard fetches it directly
   * on demand instead of mirroring it. Returns [] when the engine is
   * inactive or the native firestore module is unavailable (jest/web).
   *
   * Defensive: only docs that carry a resolution (numeric resolvedAt +
   * string choice) are returned, so a half-written or foreign doc can't
   * break the aggregation.
   *
   * Quota hardening — capped at the most recent MAX_RESOLVED_CONFLICTS
   * (ordered by resolvedAt desc) instead of reading the whole collection.
   * Conflicts only arise from concurrent edits on the same doc across
   * devices within CONFLICT_WINDOW_MS, so this is a rare event in
   * practice; the cap is a backstop against unbounded growth, not an
   * expected truncation. If it ever binds, the dashboard reflects the
   * most recent conflicts rather than the true lifetime total.
   */
  async fetchResolvedConflicts(): Promise<ResolvedConflictRecord[]> {
    if (!this.uid) return [];
    const fn = getFirestore();
    if (!fn) return [];
    try {
      const snap = await fn()
        .collection(`users/${this.uid}/conflicts`)
        .orderBy('resolvedAt', 'desc')
        .limit(MAX_RESOLVED_CONFLICTS)
        .get();
      const out: ResolvedConflictRecord[] = [];
      for (const doc of snap.docs) {
        const data = doc.data();
        if (!data) continue;
        if (
          typeof data.resolvedAt === 'number' &&
          typeof data.choice === 'string'
        ) {
          out.push(data as unknown as ResolvedConflictRecord);
        }
      }
      return out;
    } catch (err) {
      logger.warn('SyncEngine: fetchResolvedConflicts failed', {
        component: 'SyncEngine',
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
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
        await AsyncStorage.setItem(flagKey, BULK_PUSH_SKIP_VALUE);
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
      // Legacy '1' deliberately falls through: re-push once to heal the
      // entries the pre-fix engine dropped (see BULK_PUSH_DONE_VALUE).
      if (done === BULK_PUSH_DONE_VALUE || done === BULK_PUSH_SKIP_VALUE) {
        return;
      }
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
      await AsyncStorage.setItem(flagKey, BULK_PUSH_DONE_VALUE);
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
    // Sprint 47 — track whether the loop bailed on an error so we know
    // whether a non-empty queue afterwards is genuinely-new work (safe to
    // re-flush) vs. a failed push we must NOT hot-loop on.
    let erroredOut = false;
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
          erroredOut = true;
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

    // Sprint 47 — if the loop completed cleanly but the queue still holds
    // entries, they were queued DURING this flush: e.g. reviewCard queues
    // memoryCards and THEN reviewEvents in the same tick, and the second
    // queueWrite hit the flushInFlight guard so its own flush() returned
    // early. A clean loop removes every snapshotted item on success, so a
    // non-empty queue here is genuinely-new work — drain it now instead of
    // waiting for the next NetInfo event / queueWrite / periodic tick. We do
    // NOT re-flush after an error (erroredOut) to avoid a hot retry loop.
    if (
      !erroredOut &&
      this.queue.length > 0 &&
      this.uid &&
      this.state.isOnline
    ) {
      void this.flush();
    }
  }

  private async pushOne(
    firestoreFn: FirestoreFn,
    item: PendingWrite,
  ): Promise<void> {
    if (!this.uid) throw new Error('engine inactive during push');
    const ref = firestoreFn()
      .collection(`users/${this.uid}/${item.collection}`)
      .doc(toDocId(item.id));
    // Sprint 78 — defense-in-depth: Firestore rejects `undefined` field
    // values and a rejected write would retry until the queue DROPS it
    // (the S77 silent-loss bug). Builders sanitize at the source; this
    // engine-boundary sweep covers what they can't (conflict-resolution
    // merges typed in the UI, future adapters).
    await ref.set(deepWithoutUndefined(item.data), {merge: true});
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

  /** Test-only: current in-memory cursor for a collection (undefined if
   *  never loaded/advanced this session). */
  __getCursorForTests(collection: string): number | undefined {
    return this.cursors.get(collection);
  }
}
