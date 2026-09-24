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
import {deepNullifyUndefined} from './sanitize';
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

/** R9-103 — the per-doc echo-suppression key. Collection names are fixed
 *  identifiers in code and none carries a NUL, so no two (collection, id)
 *  pairs can map to the same key. */
function suppressKey(collection: string, id: string): string {
  return `${collection}\u0000${id}`;
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

const UNSETTLED_STORAGE_PREFIX = '@sync_unsettled_';

/**
 * R9-39 / R9-106 — where a collection's unsettled docs live (see
 * `unsettled`). Per uid, like the cursor it holds down. Exported so tests can
 * seed/assert it without duplicating the format.
 */
export function unsettledStorageKey(collection: string, uid: string): string {
  return `${UNSETTLED_STORAGE_PREFIX}${collection}:${uid}`;
}

const CONFLICTED_STORAGE_PREFIX = '@sync_conflicted_';

/**
 * R9-160 — which of a collection's unsettled docs are pending CONFLICTS (the
 * rest were skipped by R9-46). A JSON array of doc ids, next to
 * `unsettledStorageKey`, whose format the older builds still read.
 */
function conflictedStorageKey(collection: string, uid: string): string {
  return `${CONFLICTED_STORAGE_PREFIX}${collection}:${uid}`;
}

/** R9-39 / R9-106 — one unsettled doc: the remote `updatedAt` held, and
 *  whether it is held as a pending conflict (R9-160). */
interface HeldDoc {
  updatedAt: number;
  conflict: boolean;
}

const DROPPED_STORAGE_PREFIX = '@sync_dropped_';

/** R9-33 — where the give-up counter lives. Per-uid, like the cursors: one
 *  account's lost writes are not the other's business. */
export function droppedStorageKey(uid: string): string {
  return `${DROPPED_STORAGE_PREFIX}${uid}`;
}

/**
 * R9-33 — the retry backoff that `types.ts` and `netinfo.ts` both already
 * CLAIMED existed. It did not: `queuedAt` was written in three places and
 * read in none, so the 8 allowed attempts were spent as fast as something
 * called `flush()` — measured at **1 ms end to end** — and the write was
 * thrown away. With the periodic flush alone, a plain few-minute outage was
 * enough to lose it.
 *
 * Exponential from the last ATTEMPT, capped: 30s, 1m, 2m, 4m, 8m, 16m, 30m
 * between the 8 allowed attempts — 61.5 min of real wall-clock before a
 * write is given up on, instead of milliseconds. (Only ever MORE in
 * practice: nothing re-flushes the instant a window elapses, the 60s
 * periodic tick does.)
 */
export const RETRY_BASE_DELAY_MS = 30 * 1000;
export const RETRY_MAX_DELAY_MS = 30 * 60 * 1000;

export function retryDelayMs(attempts: number): number {
  if (attempts <= 0) return 0;
  const exponential = RETRY_BASE_DELAY_MS * 2 ** (attempts - 1);
  return Math.min(exponential, RETRY_MAX_DELAY_MS);
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

/** A doc's LWW clock, 0 when it carries none. */
function updatedAtOf(entity: {updatedAt?: unknown}): number {
  return typeof entity.updatedAt === 'number' ? entity.updatedAt : 0;
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
  /**
   * R9-104 — bumped by every `stop()`. A flush belongs to the session it
   * started in, and once that session is gone it may not touch anything the
   * next one owns: not the lock, not the state, not the next push.
   *
   * `flush()` used to snapshot the uid only to FILTER the queue, then
   * `await pushOne(...)` item by item without looking again. When Ana signed
   * out with a push in flight and Beto signed in, whatever ran after that
   * `await` ran in Beto's session. There are two outcomes, depending on what
   * the SDK does with a `set()` in flight when the user changes:
   *  - it resolves after the switch → the rest of Ana's batch was written
   *    under `users/<beto>`; and if it FAILED, it burned one of Ana's
   *    retries, and on the last one dropped her write and recorded the drop
   *    against Beto;
   *  - it never resolves → `flushInFlight` stayed `true` and Beto uploaded
   *    nothing until the app restarted (or Ana came back). Re-checking the
   *    account AFTER the `await` cannot help here, because that `await` never
   *    returns — so `stop()` releases the lock itself.
   * The JS SDK (4.17, read in its source) takes the second branch: it keeps a
   * write's callback under the user who issued it and, on a user change,
   * neither resolves nor rejects it. The native SDK the app runs on Android
   * was not measured; the fix does not depend on which branch it takes.
   *
   * R9-153 — a snapshot batch belongs to its session too, for the same
   * reason: `handleSnapshot` awaits once per doc. See there.
   */
  private flushSession = 0;
  /** The docs we are applying a remote change to RIGHT NOW, keyed by
   *  `suppressKey(collection, id)` → nesting depth. An adapter's own
   *  queueWrite/queueDelete for one of THESE docs is the echo of what is being
   *  applied and must not bounce back as a push.
   *
   *  R9-103 — this used to be one global counter, so while ANY apply awaited
   *  SQLite every queueWrite/queueDelete returned early for EVERY doc. No
   *  adapter queues inside an apply, so the only thing it ever swallowed was
   *  the user's own edits that happened to coincide with a pull: queue empty,
   *  nothing uploaded, `pendingWrites 0`, `droppedWrites 0` — and a lost
   *  delete never reached the account's other devices. The window is widest exactly when the
   *  most is being pulled: a new device, a reinstall, R9-35's re-download.
   *
   *  What remains, on purpose: a user edit to the SAME doc while its remote
   *  copy is being applied is still dropped. The two writes race for the same
   *  local row anyway, and telling them apart would take an async context JS
   *  does not have. */
  private suppressedDocs = new Map<string, number>();
  /** Sprint 43 — active conflicts awaiting user resolution. */
  private conflicts: ConflictRecord[] = [];
  /**
   * R9-161 — the pending conflicts whose doc THIS device has written since
   * their `remoteVersion` arrived: an edit the user kept making, a delete.
   * The cloud may then hold that write instead of "theirs", and keepTheirs
   * has to push it (see `resolveConflict`). Cleared with the conflicts.
   */
  private conflictsWrittenHere = new Set<string>();
  /**
   * Quota hardening — in-memory cache of each collection's sync cursor
   * (highest `updatedAt` observed), mirrored to AsyncStorage on every
   * advance. Keyed by collection name only, so whatever writes it after a
   * `stop()` writes into the NEXT account's session. It is cleared on every
   * `stop()` (and `start()` always calls `stop()` first when the uid
   * changes), and a snapshot batch still in flight at that moment no longer
   * touches it afterwards (R9-122.4, see `handleSnapshot`).
   */
  private cursors = new Map<string, number>();
  /**
   * R9-39 / R9-106 — per collection, the docs whose remote change this device
   * has NOT settled yet: pending conflicts, and docs skipped because their
   * local state could not be read (R9-46). docId → the remote `updatedAt`
   * being held. Persisted per uid (`unsettledStorageKey`) and loaded with the
   * cursor on every attach, where the query floor is held below the lowest
   * of them; a doc leaves the set once it settles (applied, ignored by LWW,
   * removed, or its conflict resolved).
   *
   * The cursor alone could never do this. It is ONE value per collection
   * that only moves forward, so holding it below a held doc worked only
   * inside that doc's own batch (R9-65 / R9-46): any later batch of the same
   * collection — the echo of an edit of the user's own, say — carried it
   * past, and so did a `keepMine` on another conflict (it advances to now).
   * After that, `stop()` dropping the in-memory conflicts lost them for
   * good: the next attach's floor no longer reached them, and the next edit
   * of either side let LWW delete the other one in silence.
   *
   * Cleared on `stop()` with the cursors, for the same reason.
   *
   * R9-160 — a held conflict is marked as one, on disk too: after a restart
   * its redelivery has to be detected again even when it is no longer within
   * CONFLICT_WINDOW_MS of the local copy (see `applyRemoteChange`).
   */
  private unsettled = new Map<string, Map<string, HeldDoc>>();
  /** R9-106 — collections whose `unsettled` set did not reach disk. While
   *  one is here, `advanceCursor` holds the persisted cursor itself below
   *  its lowest held doc: after a restart, the cursor is all there is. */
  private unsettledUnsaved = new Set<string>();
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
    droppedWrites: 0,
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

  /** The active (non-anonymous) uid while the engine is running, else null.
   *  Lets non-adapter write paths (e.g. the memoryStats aggregate) target the
   *  right account without re-reading auth. */
  getActiveUid(): string | null {
    return this.uid;
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
    // R9-22 follow-up — `hydrateQueue()` returns early once the queue has
    // been read from disk, so on a SECOND `start()` in the same app session
    // (one account signs out, another signs in) nothing recomputed this for
    // the new uid — and `stop()` keeps the old count on purpose, because the
    // queue is persisted. Settings would then tell the arriving user they
    // have N changes syncing that are not theirs and that they can do nothing
    // about, and it would never say "sincronizado" again. Recompute here, on
    // every start, not only on the first one.
    this.updateState({
      pendingWrites: this.pendingForActiveUid(),
      droppedWrites: await this.loadDroppedWrites(uid),
    });
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
    // R9-104 — a push still in flight belongs to the session that is ending.
    // Release the lock here instead of waiting for it: it may never come back
    // (see `flushSession`), and the next account must be able to flush.
    this.flushSession += 1;
    this.flushInFlight = false;
    this.uid = null;
    // Conflicts are transient — they snapshot the local doc at detection
    // time. If the user signs back in, fresh onSnapshot events will
    // re-detect any still-divergent docs: each one is still in its
    // collection's persisted `unsettled` set, and the next attach's query
    // floor is held below it (R9-39 / R9-106). Before that set existed this
    // promise was false as soon as any other doc of the collection had moved
    // the cursor past the conflict. The set also marks it as a conflict, so it
    // is re-detected even when the other device kept writing past the 30 s
    // window while it waited (R9-160).
    this.conflicts = [];
    this.conflictsWrittenHere.clear();
    // Quota hardening — drop the in-memory cursor cache so a later
    // start() (same uid signing back in, or a DIFFERENT uid on the same
    // device) always re-derives cursors from AsyncStorage (uid-scoped
    // keys) rather than risking a stale value leaking across accounts.
    // The unsettled sets go with them, for the same reason.
    this.cursors.clear();
    this.unsettled.clear();
    this.unsettledUnsaved.clear();
    this.updateState({
      isActive: false,
      isSyncing: false,
      conflicts: [],
      // R9-33 — the dropped-write notice is per-uid state, exactly like the
      // conflicts and the cursors cleared just above, and it has to go out
      // with its account for the same reason. It is NOT lost: it lives in
      // AsyncStorage under `droppedStorageKey(uid)` and `start()` reloads it,
      // so it comes back with its owner. Keeping it live here instead would
      // show Ana's notice inside Beto's session for as long as
      // `start('uid-beto')` takes to resolve its two AsyncStorage reads.
      droppedWrites: 0,
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
   *
   * R9-45 — the write CLEARS the tombstone explicitly (`deleted: false`).
   * Adapters whose doc id is a reusable natural key (highlights use the
   * `verseId`, memoryCards the `verseKey`) can legitimately see the same id
   * deleted and then re-created. `queueDelete` sets `deleted: true`, and
   * because `pushOne` writes with `{merge: true}`, a later write that simply
   * omitted the flag left the doc carrying the NEW data and the OLD
   * tombstone — every other device kept reading it as deleted, forever, and
   * a re-highlight of the same verse never arrived. Nothing in the app ever
   * wrote `deleted: false`; this is the one place that can.
   */
  queueWrite(collection: string, id: string, data: object): void {
    if (!this.uid) return;
    if (this.isSuppressed(collection, id)) return;
    this.noteOwnWrite(collection, id);
    const asRecord = data as Record<string, unknown>;
    const entity: SyncEntity<object> = {
      ...asRecord,
      updatedAt:
        typeof asRecord.updatedAt === 'number'
          ? asRecord.updatedAt
          : Date.now(),
      deleted: false,
      deletedAt: null,
    };
    this.upsertQueueEntry({
      uid: this.uid,
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
    if (this.isSuppressed(collection, id)) return;
    this.noteOwnWrite(collection, id);
    const base = (lastKnownData as Record<string, unknown> | undefined) ?? {};
    const tombstone: SyncEntity<object> = {
      ...base,
      updatedAt: Date.now(),
      deleted: true,
      deletedAt: Date.now(),
    };
    this.upsertQueueEntry({
      uid: this.uid,
      collection,
      id,
      data: tombstone,
      queuedAt: Date.now(),
      attempts: 0,
    });
    void this.flush();
  }

  /**
   * Wrap an adapter mutation of ONE doc so the engine knows to ignore any
   * `queueWrite`/`queueDelete` for that same doc the adapter triggers as a
   * side effect. Used internally by applyRemoteChange so a remote pull
   * doesn't bounce back as a local push — and scoped to the doc (R9-103), so
   * it can't swallow the user's edits to every other one.
   */
  private async withLocalWriteSuppressed<T>(
    collection: string,
    id: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const key = suppressKey(collection, id);
    this.suppressedDocs.set(key, (this.suppressedDocs.get(key) ?? 0) + 1);
    try {
      return await fn();
    } finally {
      const depth = (this.suppressedDocs.get(key) ?? 1) - 1;
      if (depth > 0) this.suppressedDocs.set(key, depth);
      else this.suppressedDocs.delete(key);
    }
  }

  private isSuppressed(collection: string, id: string): boolean {
    return this.suppressedDocs.has(suppressKey(collection, id));
  }

  // ---------- private: queue persistence ----------

  private async hydrateQueue(): Promise<void> {
    if (this.queueHydrated) return;
    let droppedOnHydrate = false;
    try {
      const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Defensive filter — drop anything that doesn't look like a
          // PendingWrite. A malformed entry would block the flush loop.
          const before = parsed.length;
          this.queue = parsed.filter(
            (e): e is PendingWrite =>
              e &&
              // R9-22 — an entry with no `uid` predates ownership tracking,
              // so there is no way to tell whose it is. Dropping it is the
              // conservative read: the local change it represents is already
              // applied locally and is NOT lost, whereas pushing it could
              // write one account's data into another's cloud (and a parked
              // tombstone could delete a row on all of that account's
              // devices). Only ever affects writes that were still unflushed
              // across the upgrade.
              typeof e.uid === 'string' &&
              typeof e.collection === 'string' &&
              typeof e.id === 'string' &&
              e.data &&
              typeof e.data === 'object',
          );
          if (this.queue.length < before) {
            logger.info(
              'SyncEngine: dropped pre-R9-22 queue entries with no owner uid',
              {
                component: 'SyncEngine',
                dropped: before - this.queue.length,
              },
            );
            // Write the cleaned queue back, or the dropped entries sit on
            // disk forever and get re-filtered on every single launch.
            droppedOnHydrate = true;
          }
        }
      }
    } catch (err) {
      logger.warn('SyncEngine: failed to hydrate queue', {
        component: 'SyncEngine',
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      this.queueHydrated = true;
      this.updateState({pendingWrites: this.pendingForActiveUid()});
    }
    if (droppedOnHydrate) await this.persistQueue();
  }

  /**
   * R9-33 — the give-up counter survives a restart on purpose. A dropped
   * write is permanent data loss; a notice the user happens to miss because
   * the app was backgrounded is no notice at all. Cleared only by
   * `acknowledgeDroppedWrites()`, i.e. when the user has actually seen it.
   */
  private async loadDroppedWrites(uid: string): Promise<number> {
    try {
      const raw = await AsyncStorage.getItem(droppedStorageKey(uid));
      const parsed = raw != null ? Number(raw) : NaN;
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch (err) {
      logger.warn('SyncEngine: failed to read dropped-write count', {
        component: 'SyncEngine',
        error: err instanceof Error ? err.message : String(err),
      });
      return 0;
    }
  }

  private async recordDroppedWrite(): Promise<void> {
    const uid = this.uid;
    if (!uid) return;
    const next = this.state.droppedWrites + 1;
    this.updateState({droppedWrites: next});
    try {
      await AsyncStorage.setItem(droppedStorageKey(uid), String(next));
    } catch (err) {
      // Best-effort: the in-memory count still drives the UI for THIS
      // session, which is the case that matters most.
      logger.warn('SyncEngine: failed to persist dropped-write count', {
        component: 'SyncEngine',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /** R9-33 — the user has seen the notice; stop showing it. */
  async acknowledgeDroppedWrites(): Promise<void> {
    const uid = this.uid;
    this.updateState({droppedWrites: 0});
    if (!uid) return;
    try {
      await AsyncStorage.removeItem(droppedStorageKey(uid));
    } catch (err) {
      logger.warn('SyncEngine: failed to clear dropped-write count', {
        component: 'SyncEngine',
        error: err instanceof Error ? err.message : String(err),
      });
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

  /**
   * How many queued writes belong to the account signed in RIGHT NOW.
   *
   * R9-22 — the raw queue can also hold a previous user's parked entries,
   * which will never be pushed under this uid. Counting those would leave
   * Settings reporting "N pendientes" for a user who has nothing pending and
   * can do nothing about it, and the engine would never report a clean
   * "sincronizado" again.
   */
  private pendingForActiveUid(): number {
    const activeUid = this.uid;
    if (!activeUid) return 0;
    return this.queue.reduce((n, q) => (q.uid === activeUid ? n + 1 : n), 0);
  }

  /**
   * R9-33 — how many of this account's queued writes are actually DUE right
   * now, i.e. past their backoff window.
   *
   * Kept separate from `pendingForActiveUid()` on purpose. That one answers
   * "how much unflushed work does this user have" and drives the Settings
   * label, which must keep counting a write that is merely waiting out its
   * backoff — it is still pending. THIS one drives loop control, and it must
   * NOT count a deferred entry: the re-flush at the tail of `flush()` fires
   * whenever the loop ended cleanly and the queue is non-empty, so counting a
   * backed-off entry there would re-enter `flush()` forever — the same hot
   * spin the uid filter had to avoid (see the R9-22 note at the tail).
   */
  private flushableCount(now: number = Date.now()): number {
    const activeUid = this.uid;
    if (!activeUid) return 0;
    return this.queue.reduce(
      (n, q) => (this.isDue(q, activeUid, now) ? n + 1 : n),
      0,
    );
  }

  private isDue(entry: PendingWrite, activeUid: string, now: number): boolean {
    if (entry.uid !== activeUid) return false;
    return now >= (entry.lastAttemptAt ?? 0) + retryDelayMs(entry.attempts);
  }

  private upsertQueueEntry(entry: PendingWrite): void {
    // R9-22 — the dedupe key includes the uid. Two accounts on one phone can
    // legitimately hold a pending write for the SAME (collection, id): the
    // memoryCards id is the verseKey and the highlights id is the verseId,
    // both stable across users, so Juan 3:16 collides between Ana and Beto.
    const idx = this.queue.findIndex(
      e =>
        e.uid === entry.uid &&
        e.collection === entry.collection &&
        e.id === entry.id,
    );
    if (idx >= 0) {
      // Replace existing pending write — newer wins.
      this.queue[idx] = entry;
    } else {
      this.queue.push(entry);
    }
    this.updateState({pendingWrites: this.pendingForActiveUid()});
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
    const uidAtAttach = this.uid;
    let collectionRef: CollectionRef;
    try {
      collectionRef = fn().collection(
        `users/${uidAtAttach}/${adapter.collection}`,
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
    const lowestUnsettled = await this.loadUnsettled(
      adapter.collection,
      uidAtAttach,
    );
    // stop() (sign-out/deleteAccount, or a uid change) can land while the
    // AsyncStorage reads above are in flight. Attaching anyway would put a
    // live listener into `unsubs` for an engine that's supposed to be
    // stopped — exactly the listener the ordering fix in
    // AuthContext.signOut exists to prevent, just via a different path.
    if (this.uid !== uidAtAttach) return;
    // R9-39 / R9-106 — and never past a doc this device has not settled
    // yet, whatever other docs moved the cursor since: a pending conflict
    // must come back after a restart to be detected again, and a skipped
    // doc to be applied at last. `-1` keeps the held doc itself at/above
    // the floor; with nothing held this is `cursor` (Infinity - 1).
    const floorCursor = Math.min(cursor, lowestUnsettled - 1);
    const queryFloor = Math.max(0, floorCursor - CURSOR_SAFETY_MARGIN_MS);
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
        // AuthContext.signOut/deleteAccount call stop() synchronously
        // before the Auth token is invalidated, but react-native-firebase's
        // native unsubscribe isn't guaranteed to land before an in-flight
        // listen stream observes the now-invalid token — a stray
        // permission-denied can still reach this callback a beat after
        // teardown. `unsubs` no longer holding this collection is how we
        // tell that apart from a genuine permission problem on a listener
        // we still consider active: only THIS specific case is downgraded,
        // not permission-denied errors in general.
        if (!this.unsubs.has(adapter.collection)) {
          logger.warn('SyncEngine: snapshot error after teardown (ignored)', {
            component: 'SyncEngine',
            collection: adapter.collection,
            error: err.message,
          });
          return;
        }
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
    // R9-153 — the session this batch belongs to, like `flush()`'s. Every
    // `await` below can come back after `stop()`, and whatever ran after it ran
    // in the NEXT account's session: a conflict recorded here was inherited by
    // whoever signed in (`stop()` clears `this.conflicts`, `start()` does not),
    // and resolving it wrote this account's cloud copy into theirs; and
    // `advanceCursor` wrote this batch's max under THEIR cursor key and
    // in-memory cache, so their first attach started from this account's floor
    // and never pulled their own older docs (R9-122.4). From the first `await`
    // that comes back in another session the batch ends: no conflict, no
    // cursor, no state. Nothing is lost — the cursor did not move, so the
    // owner's next attach delivers the batch again.
    const session = this.flushSession;
    const isCurrent = () => session === this.flushSession;
    // R9-39 / R9-106 — the uid whose `unsettled` set this batch writes: the
    // batch's own, captured with its session, never "whoever is signed in by
    // the time the write runs".
    const uid = this.uid;
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
    // R9-39 / R9-106 — the docs this batch holds back or settles. Every
    // change below happens after an `isCurrent()` check, so it is always
    // this session's set.
    let unsettledChanged = false;
    const hold = (id: string, updatedAt: unknown, conflict = false) => {
      if (typeof updatedAt !== 'number') return;
      const held = this.unsettledOf(adapter.collection);
      const prev = held.get(id);
      // R9-160 — a conflict stays one until it settles: a later skip of the
      // same doc (R9-46) does not make it forget.
      const next = {updatedAt, conflict: conflict || prev?.conflict === true};
      if (
        prev?.updatedAt === next.updatedAt &&
        prev.conflict === next.conflict
      ) {
        return;
      }
      held.set(id, next);
      unsettledChanged = true;
    };
    const settle = (id: string) => {
      if (this.unsettledOf(adapter.collection).delete(id)) {
        unsettledChanged = true;
      }
    };
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
          await this.withLocalWriteSuppressed(adapter.collection, id, () =>
            adapter.applyRemoteDelete(id),
          );
          if (!isCurrent()) return;
          // Nor can a held doc that is gone ever come back to be settled:
          // keeping it would hold the floor down for good.
          settle(id);
          continue;
        }
        const remote = data as SyncEntity<Record<string, unknown>>;
        const remoteChange: RemoteChange<Record<string, unknown>> = {
          id,
          data: remote,
          deleted: remote.deleted === true,
        };
        const localKnown = await this.applyRemoteChange(
          adapter,
          remoteChange,
          isCurrent,
        );
        if (!isCurrent()) return;
        if (!localKnown) {
          // R9-46 — the doc was NOT applied. Skip the cursor fold below AND
          // hold it in the unsettled set, so no query floor moves past a
          // change this device never took; the next reattach redelivers it.
          hold(id, remote.updatedAt);
          continue;
        }

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
        if (stillConflicted) {
          // R9-65 — a conflict is more fragile than a skipped doc: `stop()`
          // clears `this.conflicts` because they are transient, so a restart
          // before the user picks a winner loses the conflict, and only a
          // redelivery can bring it back. Hold it like an unapplied doc.
          //
          // The cost is re-reading from its `updatedAt` on every attach until
          // the user resolves it, which `resolveConflict` ends by settling it;
          // and `recordConflict` dedupes by doc id, so the redeliveries just
          // refresh the snapshot instead of piling up.
          hold(id, remote.updatedAt, true);
        } else {
          settle(id);
          if (
            typeof remote.updatedAt === 'number' &&
            remote.updatedAt > maxSeenUpdatedAt
          ) {
            maxSeenUpdatedAt = remote.updatedAt;
          }
        }
      }
      // R9-106 — the held docs reach disk BEFORE the cursor moves past them.
      // The batch max no longer stops below them (that only ever worked
      // inside their own batch); it does not have to: the next attach reads
      // the set and holds the floor down itself.
      if (unsettledChanged || this.unsettledUnsaved.has(adapter.collection)) {
        await this.saveUnsettled(adapter.collection, uid, isCurrent);
        // R9-153 — `stop()` can land on this write too. The cursor below
        // belongs to this session, and after it `this.uid` is the next one.
        if (!isCurrent()) return;
      }
      if (maxSeenUpdatedAt > 0) {
        await this.advanceCursor(adapter.collection, maxSeenUpdatedAt);
      }
      // R9-153 — `advanceCursor` waits on AsyncStorage: `stop()` can land
      // there too, and this "synced, no error" would then be the next
      // session's.
      if (!isCurrent()) return;
      this.updateState({lastSyncedAt: Date.now(), lastError: null});
    } catch (err) {
      logger.error(
        'SyncEngine: handleSnapshot threw',
        err instanceof Error ? err : new Error(String(err)),
        {component: 'SyncEngine', collection: adapter.collection},
      );
      // R9-153 — a failure of a batch whose session is over is not the next
      // account's error to show.
      if (isCurrent()) {
        this.updateState({
          lastError: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      // R9-153 — once `stop()` has run, `isSyncing` is the next session's:
      // clearing it here would hide a push of theirs still in flight.
      if (isCurrent()) this.updateState({isSyncing: false});
    }
  }

  /**
   * Returns `false` when the local state of this doc could NOT be
   * established (R9-46). The caller must then leave the doc alone AND
   * withhold its contribution to the sync cursor, so it gets redelivered on
   * the next reattach instead of being skipped forever.
   *
   * The alternative — treating an unreadable local row as "absent" — is what
   * made a failed `getLocal` destructive: both the last-write-wins guard and
   * the conflict check below live inside `if (local && data)`, so a `null`
   * local falls straight through to `applyRemoteUpsert` and an OLDER remote
   * copy overwrites a NEWER local one.
   *
   * Also `false`, touching nothing, when the batch's session ended during the
   * read (R9-153); `handleSnapshot` then ends the batch without looking at it.
   */
  private async applyRemoteChange(
    adapter: AnyAdapter,
    change: RemoteChange<Record<string, unknown>>,
    isCurrent: () => boolean,
  ): Promise<boolean> {
    const {id, data, deleted} = change;
    let local: SyncEntity<Record<string, unknown>> | null;
    try {
      local = (await adapter.getLocal(id)) as SyncEntity<
        Record<string, unknown>
      > | null;
    } catch (err) {
      logger.warn(
        'SyncEngine: getLocal failed — skipping this doc rather than ' +
          'overwriting local data with the remote copy',
        {
          component: 'SyncEngine',
          collection: adapter.collection,
          id,
          error: err instanceof Error ? err.message : String(err),
        },
      );
      return false;
    }
    // R9-153 — past this line the conflict is recorded or the change applied,
    // and after a `stop()` both would happen in the next account's session:
    // the conflict would be theirs to see and to resolve into their cloud.
    if (!isCurrent()) return false;

    // R9-160 — while its conflict waits for the user, a doc takes nothing from
    // the remote side. A later change of the other device (outside the 30 s
    // window and newer than the local copy) used to land here by LWW: the
    // local copy the conflict was about was gone from the store, the screen
    // showed the other device's newer copy as "mine", and keepMine pushed it.
    // Now that change becomes "theirs", and the local copy stays this
    // device's until the user picks.
    const pending = this.conflicts.find(
      c => c.collection === adapter.collection && c.docId === id,
    );
    if (pending && data) {
      // Which device wrote it. This one writes its local copy first and pushes
      // that same `updatedAt` (every adapter builds the payload from the stored
      // row), so its own echoes are never newer than the local copy: anything
      // newer is the other device's. With no local copy (the user deleted it
      // here), a tombstone is the echo of that delete, and a live copy is
      // theirs unless it is the one the conflict already shows.
      const theirs = local
        ? updatedAtOf(data) > updatedAtOf(local)
        : !deleted && data.updatedAt !== pending.remoteVersion.updatedAt;
      if (!theirs) return true;
      const differing = this.conflictFields(adapter, local, data, deleted);
      if (differing.length > 0) {
        this.recordConflict({
          ...pending,
          remoteVersion: data,
          differingFields: differing,
        });
        // R9-161 — theirs is the cloud's latest now, unless a write of this
        // device is still queued: that one lands after it.
        if (!this.hasQueuedWrite(this.uid, adapter.collection, id)) {
          this.conflictsWrittenHere.delete(pending.id);
        }
        return true;
      }
      // The other device now holds what this one holds: there is nothing left
      // to choose, and LWW below applies it like any newer change.
      this.dropConflict(pending.id);
    }

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
          return true;
        }
      }

      // R9-160 — a conflict still waiting when the engine last stopped (one
      // still in memory was handled above). The redelivery is the other
      // device's copy as it is now, which may be long past the 30 s window if
      // it kept writing (or deleted it) meanwhile: detected again anyway, or
      // LWW would drop the local copy after all.
      if (
        !pending &&
        remoteTs > localTs &&
        this.isHeldConflict(adapter.collection, id)
      ) {
        const differing = this.conflictFields(adapter, local, data, deleted);
        if (differing.length > 0) {
          this.recordConflict({
            id: `${adapter.collection}__${id}`,
            collection: adapter.collection,
            docId: id,
            localVersion: local as SyncEntity<Record<string, unknown>>,
            remoteVersion: data,
            differingFields: differing,
            detectedAt: Date.now(),
          });
          return true;
        }
      }

      if (remoteTs <= localTs) {
        // LWW: local is at least as fresh, ignore the remote change.
        return true;
      }
    }

    if (deleted) {
      await this.withLocalWriteSuppressed(adapter.collection, id, () =>
        adapter.applyRemoteDelete(id),
      );
    } else if (data) {
      await this.withLocalWriteSuppressed(adapter.collection, id, () =>
        adapter.applyRemoteUpsert(id, data),
      );
    }
    return true;
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
        if (Number.isFinite(parsed) && parsed > 0) {
          // R9-35 — a cursor that sits in the FUTURE is poisoned, and the
          // device cannot recover on its own: the query floor is
          // `cursor - CURSOR_SAFETY_MARGIN_MS`, so every legitimate change
          // from now on falls below it and the listener simply stops
          // delivering. The cursor never moves backward by design and
          // nothing anywhere resets it, so before this the only remedy was
          // reinstalling the app.
          //
          // Clamping it to "now" is NOT enough: the changes missed during
          // the poisoned window are older than now - 5 min and would stay
          // below the floor forever. A poisoned cursor is simply not
          // trustworthy, so we throw it away and re-read the collection
          // once — exactly what a new device does, and it is self-limiting
          // because `advanceCursor` can no longer be pushed into the future.
          if (parsed > Date.now() + CURSOR_SAFETY_MARGIN_MS) {
            logger.warn(
              'SyncEngine: discarding a sync cursor dated in the future — ' +
                'resyncing this collection once to recover what it hid',
              {
                component: 'SyncEngine',
                collection,
                cursor: parsed,
                now: Date.now(),
              },
            );
            value = 0;
            await AsyncStorage.removeItem(
              cursorStorageKey(collection, this.uid),
            );
          } else {
            value = parsed;
          }
        }
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
    // R9-35 — the cursor may never run ahead of our own clock. `updatedAt`
    // is a CLIENT timestamp (`queueWrite`), and `handleSnapshot` folds in the
    // echoes of this device's own writes too, so a phone with its clock set
    // forward poisons itself: once the clock is corrected, every later write
    // falls below the `cursor - CURSOR_SAFETY_MARGIN_MS` floor and the pull
    // stops for good. Capping costs nothing — at worst we re-read a
    // future-dated doc on the next reattach, and LWW ignores it.
    let capped = Math.min(seenUpdatedAt, Date.now());
    // R9-106 — the held docs are normally on disk and the next attach holds
    // the floor below them. When that write failed they are not, and the
    // persisted cursor is all a restart would have: it may not pass them.
    if (this.unsettledUnsaved.has(collection)) {
      capped = Math.min(capped, this.lowestUnsettled(collection) - 1);
    }
    const current = this.cursors.get(collection) ?? 0;
    if (capped <= current) return;
    this.cursors.set(collection, capped);
    try {
      await AsyncStorage.setItem(
        cursorStorageKey(collection, this.uid),
        String(capped),
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

  // ---------- private: unsettled docs (R9-39 / R9-106) ----------

  /** This session's in-memory unsettled set for `collection`, created
   *  empty if the attach has not loaded one. */
  private unsettledOf(collection: string): Map<string, HeldDoc> {
    let held = this.unsettled.get(collection);
    if (!held) {
      held = new Map();
      this.unsettled.set(collection, held);
    }
    return held;
  }

  /** The lowest `updatedAt` held for `collection`, Infinity if none. */
  private lowestUnsettled(collection: string): number {
    let lowest = Number.POSITIVE_INFINITY;
    for (const {updatedAt} of this.unsettled.get(collection)?.values() ?? []) {
      if (updatedAt < lowest) lowest = updatedAt;
    }
    return lowest;
  }

  /** R9-160 — whether `id` is held as a pending conflict, which after a
   *  restart is the only trace of it left (`stop()` clears `conflicts`). */
  private isHeldConflict(collection: string, id: string): boolean {
    return this.unsettled.get(collection)?.get(id)?.conflict === true;
  }

  /**
   * Load `uid`'s unsettled set for `collection` into memory (once per
   * session, like the cursor) and return its lowest `updatedAt`.
   *
   * A set that cannot be read returns 0, so this attach reads the collection
   * from the start, as `loadCursor` does for an unreadable cursor: more than
   * strictly necessary, never less. That full read redelivers every held doc,
   * which puts the in-memory set back together before anything writes it.
   */
  private async loadUnsettled(
    collection: string,
    uid: string,
  ): Promise<number> {
    if (this.unsettled.has(collection)) return this.lowestUnsettled(collection);
    const session = this.flushSession;
    const held = new Map<string, HeldDoc>();
    let readable = true;
    try {
      const raw = await AsyncStorage.getItem(
        unsettledStorageKey(collection, uid),
      );
      const parsed: unknown = raw != null ? JSON.parse(raw) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        for (const [id, updatedAt] of Object.entries(parsed)) {
          if (
            typeof updatedAt === 'number' &&
            Number.isFinite(updatedAt) &&
            updatedAt > 0
          ) {
            held.set(id, {updatedAt, conflict: false});
          }
        }
      }
    } catch (err) {
      readable = false;
      logger.warn('SyncEngine: failed to read unsettled docs', {
        component: 'SyncEngine',
        collection,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    // R9-160 — which of them are conflicts. Unreadable, it marks none: they
    // are then re-detected only within the 30 s window, as before the mark.
    if (held.size > 0) {
      try {
        const raw = await AsyncStorage.getItem(
          conflictedStorageKey(collection, uid),
        );
        const ids: unknown = raw != null ? JSON.parse(raw) : [];
        for (const id of Array.isArray(ids) ? ids : []) {
          const doc = typeof id === 'string' ? held.get(id) : undefined;
          if (doc) doc.conflict = true;
        }
      } catch (err) {
        logger.warn('SyncEngine: failed to read held conflicts', {
          component: 'SyncEngine',
          collection,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    // Only this session's cache: after a `stop()` it is the next account's.
    if (session === this.flushSession && !this.unsettled.has(collection)) {
      this.unsettled.set(collection, held);
    }
    if (!readable) return 0;
    let lowest = Number.POSITIVE_INFINITY;
    for (const {updatedAt} of held.values()) {
      if (updatedAt < lowest) lowest = updatedAt;
    }
    return lowest;
  }

  /**
   * Write `collection`'s unsettled set under `uid`'s key — the uid of the
   * session that changed it, passed in, never read here. An empty set
   * removes the key. On failure the collection is marked, so the cursor is
   * held below the set until a later write lands (see `advanceCursor`).
   */
  private async saveUnsettled(
    collection: string,
    uid: string | null,
    isCurrent: () => boolean,
  ): Promise<void> {
    // Both payloads are taken NOW: after the first `await`, a `stop()` may
    // have handed the in-memory set to the next session.
    const held = [...this.unsettledOf(collection)];
    const heldAt = Object.fromEntries(held.map(([id, h]) => [id, h.updatedAt]));
    const conflicted = held.filter(([, h]) => h.conflict).map(([id]) => id);
    let saved = false;
    if (uid) {
      try {
        const key = unsettledStorageKey(collection, uid);
        if (held.length === 0) {
          await AsyncStorage.removeItem(key);
        } else {
          await AsyncStorage.setItem(key, JSON.stringify(heldAt));
        }
        // R9-160 — which of them are conflicts.
        const conflictedKey = conflictedStorageKey(collection, uid);
        if (conflicted.length === 0) {
          await AsyncStorage.removeItem(conflictedKey);
        } else {
          await AsyncStorage.setItem(conflictedKey, JSON.stringify(conflicted));
        }
        saved = true;
      } catch (err) {
        logger.warn('SyncEngine: failed to persist unsettled docs', {
          component: 'SyncEngine',
          collection,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    if (!isCurrent()) return;
    if (saved) this.unsettledUnsaved.delete(collection);
    else this.unsettledUnsaved.add(collection);
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

  /** R9-160 — a pending conflict the other device settled by writing what
   *  this one already has. The caller applies that write. */
  private dropConflict(conflictId: string): void {
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
    this.conflictsWrittenHere.delete(conflictId);
    this.updateState({conflicts: [...this.conflicts]});
    logger.info('SyncEngine: conflict dissolved', {
      component: 'SyncEngine',
      conflictId,
    });
  }

  /** R9-161 — see `conflictsWrittenHere`. */
  private noteOwnWrite(collection: string, id: string): void {
    const conflictId = `${collection}__${id}`;
    if (this.conflicts.some(c => c.id === conflictId)) {
      this.conflictsWrittenHere.add(conflictId);
    }
  }

  /** R9-161 — whether `uid` has a write of this doc waiting in the queue
   *  (not yet acknowledged, so not in the cloud yet). */
  private hasQueuedWrite(
    uid: string | null,
    collection: string,
    id: string,
  ): boolean {
    return this.queue.some(
      q => q.uid === uid && q.collection === collection && q.id === id,
    );
  }

  /**
   * R9-160 — the material fields a conflict between `local` and `remote`
   * shows. When one side no longer exists (a tombstone, or no local copy),
   * all of them: the whole doc is what the user is choosing about.
   */
  private conflictFields(
    adapter: AnyAdapter,
    local: Record<string, unknown> | null,
    remote: Record<string, unknown>,
    deleted: boolean,
  ): string[] {
    const material = adapter.getMaterialFields?.() ?? [];
    if (deleted || !local) return [...material];
    return material.filter(f => !valuesEqual(local[f], remote[f]));
  }

  // ---------- public: conflict resolution ----------

  /** Sprint 43 — current pending conflicts. Snapshot, safe to keep. */
  getConflicts(): readonly ConflictRecord[] {
    return [...this.conflicts];
  }

  /**
   * R9-36 — the local copy of a conflicted doc as it is NOW.
   *
   * `conflict.localVersion` is a snapshot taken when the conflict was
   * detected, and a conflict waits for the user to open the screen: in the
   * meantime they can keep editing that same doc. The conflicts screen shows
   * "mine" and seeds (and bases) the merge from this, not from the snapshot.
   *
   * Throws when the copy cannot be read, or the conflict or its adapter is
   * gone; `null` means the doc no longer exists here.
   */
  async readCurrentLocal(
    conflictId: string,
  ): Promise<SyncEntity<Record<string, unknown>> | null> {
    const conflict = this.conflicts.find(c => c.id === conflictId);
    if (!conflict) {
      throw new Error(`readCurrentLocal: unknown conflict ${conflictId}`);
    }
    const adapter = this.adapters.get(conflict.collection);
    if (!adapter) {
      throw new Error(
        `readCurrentLocal: no adapter for ${conflict.collection}`,
      );
    }
    return (await adapter.getLocal(conflict.docId)) as SyncEntity<
      Record<string, unknown>
    > | null;
  }

  /**
   * Resolve a pending conflict. `keepMine` re-stamps the local doc with
   * now and pushes (so it wins next sync); `keepTheirs` applies the
   * remote locally; `merge` applies mergedValue + pushes.
   *
   * The resolved record is logged to users/{uid}/conflicts/{id} for
   * cross-device audit (best-effort, errors are warned not thrown).
   *
   * `keepMine` rejects, leaving the conflict pending and touching nothing,
   * when the local copy cannot be read or no longer exists (R9-36).
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
    // R9-153 — like a snapshot batch, a resolution belongs to its session:
    // after an `await` that comes back past a `stop()`, `this.uid` is the
    // next account's and `queueWrite` would push into THEIR cloud.
    const session = this.flushSession;
    const isCurrent = () => session === this.flushSession;
    const uid = this.uid;
    let resolvedValue: SyncEntity<Record<string, unknown>>;
    let pushTheirs = false;

    if (choice === 'keepMine') {
      // R9-36 — "mine" is the local copy NOW, not `conflict.localVersion`.
      // That is a snapshot from detection time, and conflicts wait for the
      // user: pushing it re-stamped with `now` reverted every edit made to
      // the doc since, and once that edit was more than CONFLICT_WINDOW_MS
      // old the echo came back as plain LWW and overwrote it locally too.
      // A read that fails, or finds the doc gone, resolves nothing: a
      // `null` is not "keep an empty doc", and from the highlights adapter
      // it can also be a failed read (R9-132), so neither the snapshot nor a
      // tombstone is safe to push in its place.
      // R9-160 — and the local copy now is always THIS device's: nothing the
      // other device writes lands in it while the conflict waits.
      const current = (await adapter.getLocal(conflict.docId)) as SyncEntity<
        Record<string, unknown>
      > | null;
      if (!isCurrent()) {
        throw new Error('resolveConflict: the session ended while resolving');
      }
      if (!current) {
        throw new Error('resolveConflict: keepMine found no local copy');
      }
      resolvedValue = {...current, updatedAt: now};
      this.queueWrite(conflict.collection, conflict.docId, resolvedValue);
    } else if (choice === 'keepTheirs') {
      // R9-161 — "the cloud already has theirs" holds only while nothing of
      // this device's reached it since, or waits in the queue to: its delete
      // (then keepMine and the merge have nothing to work with, and this is
      // the only way out), an edit the user kept making, one that could not
      // upload. Then theirs is pushed too, re-stamped: the other devices may
      // already hold that newer write, and LWW would ignore theirs with its
      // old date. Otherwise nothing is pushed: the cloud has it.
      pushTheirs =
        this.conflictsWrittenHere.has(conflict.id) ||
        this.hasQueuedWrite(uid, conflict.collection, conflict.docId);
      resolvedValue = pushTheirs
        ? {...conflict.remoteVersion, updatedAt: now}
        : conflict.remoteVersion;
      // R9-160 — "theirs" can be a delete now: the other device deleted the
      // doc while the conflict waited.
      const theirsDeleted = resolvedValue.deleted === true;
      await this.withLocalWriteSuppressed(
        conflict.collection,
        conflict.docId,
        () =>
          theirsDeleted
            ? adapter.applyRemoteDelete(conflict.docId)
            : adapter.applyRemoteUpsert(
                conflict.docId,
                resolvedValue as SyncEntity<unknown>,
              ),
      );
    } else {
      if (!mergedValue) {
        throw new Error('resolveConflict: merge choice requires mergedValue');
      }
      resolvedValue = {...mergedValue, updatedAt: now};
      await this.withLocalWriteSuppressed(
        conflict.collection,
        conflict.docId,
        () =>
          adapter.applyRemoteUpsert(
            conflict.docId,
            resolvedValue as SyncEntity<unknown>,
          ),
      );
    }
    // R9-153 — keepTheirs and merge wait on the local apply. Past a `stop()`
    // everything below would run in the next account's session: merge's
    // push into their cloud, this audit record into their `conflicts`, and
    // the cursor and the unsettled set into their cache.
    if (!isCurrent()) {
      throw new Error('resolveConflict: the session ended while resolving');
    }
    if (choice === 'merge') {
      this.queueWrite(conflict.collection, conflict.docId, resolvedValue);
    }
    if (pushTheirs) {
      if (resolvedValue.deleted === true) {
        this.queueDelete(conflict.collection, conflict.docId, resolvedValue);
      } else {
        this.queueWrite(conflict.collection, conflict.docId, resolvedValue);
      }
    }

    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
    this.conflictsWrittenHere.delete(conflictId);
    this.updateState({conflicts: [...this.conflicts]});

    // R9-39 / R9-106 — the doc is settled: stop holding the query floor
    // below it. Only THIS doc: another pending conflict of the collection
    // stays held, even though the cursor below may jump to "now" (keepMine,
    // merge) — before the unsettled set, that jump buried it.
    if (this.unsettledOf(conflict.collection).delete(conflict.docId)) {
      void this.saveUnsettled(conflict.collection, uid, isCurrent);
    }

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
        .set(deepNullifyUndefined(record));
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
            uid,
            collection: adapter.collection,
            id: row.id,
            // Cast: SyncEntity<unknown> is structurally a SyncEntity<object>
            // (every adapter's T is an object in practice).
            // `deleted: false` for the same reason `queueWrite` stamps it
            // (R9-45): `pullAllLocal` only ever returns rows that EXIST
            // locally, so under `{merge: true}` this is what clears a stale
            // server tombstone left by an earlier delete of the same
            // natural-key id.
            data: {
              ...(row.data as SyncEntity<object>),
              deleted: false,
              deletedAt: null,
            },
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
    // R9-33 — nothing DUE, not merely nothing queued. Testing the raw queue
    // here would flip `isSyncing` on and off on every periodic tick for a
    // user whose only entries are another account's parked writes or their
    // own writes waiting out a backoff.
    if (this.flushableCount() === 0) return;
    const fn = getFirestore();
    if (!fn) return;

    this.flushInFlight = true;
    this.updateState({isSyncing: true});
    // R9-104 — the session this flush belongs to. Every `await` below can come
    // back after `stop()`; from then on `isCurrent()` is false for good.
    const session = this.flushSession;
    const isCurrent = () => session === this.flushSession;
    // Sprint 47 — track whether the loop bailed on an error so we know
    // whether a non-empty queue afterwards is genuinely-new work (safe to
    // re-flush) vs. a failed push we must NOT hot-loop on.
    let erroredOut = false;
    try {
      // Snapshot the current queue — flushes that come in mid-loop will
      // be picked up on the next call.
      //
      // R9-22 — ONLY this account's entries. A previous user's unflushed
      // writes stay parked in the queue until that user signs back in;
      // draining them here would write their data into whoever is signed in
      // now, and for the natural-key adapters (memoryCards on the verseKey,
      // highlights on the verseId) a parked tombstone would delete the
      // current user's row on every device they own.
      //
      // R9-33 — and only the entries whose backoff window has elapsed. A
      // permanently-failing entry therefore stops blocking the ones behind
      // it: the loop still breaks on its error, but on the next flush it is
      // skipped entirely and the rest get their turn.
      const activeUid = this.uid;
      const dueAt = Date.now();
      const items = this.queue.filter(q => this.isDue(q, activeUid, dueAt));
      for (const item of items) {
        try {
          await this.pushOne(fn, item);
          // Success — drop this entry, but only if it is STILL the entry we
          // just pushed.
          //
          // R9-11 — the twin of the R9-34 note below, on the branch that
          // actually fires most of the time: pushes usually succeed. Removing
          // by `uid+collection+id` alone deleted whatever occupied that slot,
          // so a re-edit that landed while `pushOne` was in flight was thrown
          // away AS IF it had been uploaded — local ends up green, Firestore
          // stays yellow forever, and nothing ever retries because the queue
          // is empty. A queued DELETE was worse: the tombstone vanished and
          // the row came back on every other device the account owns.
          //
          // Identity is exact here and costs nothing: `items` came from
          // `this.queue.filter(...)`, which preserves the SAME object
          // references, while `upsertQueueEntry` always assigns a fresh
          // object. So `!== item` means precisely "someone replaced this
          // while I was pushing" — leave it queued and let the next flush
          // send it.
          const doneIdx = this.queue.findIndex(
            q =>
              q.uid === item.uid &&
              q.collection === item.collection &&
              q.id === item.id,
          );
          if (doneIdx >= 0 && this.queue[doneIdx] === item) {
            this.queue.splice(doneIdx, 1);
          }
          // R9-104 — the push landed where it was issued, in `item.uid`'s
          // cloud, so taking it off the queue above is right even after a
          // `stop()`. Nothing else is: the rest of this batch, the state and
          // the lock belong to whoever signed in next.
          if (!isCurrent()) break;
          this.updateState({
            pendingWrites: this.pendingForActiveUid(),
            lastSyncedAt: Date.now(),
            lastError: null,
          });
        } catch (err) {
          // R9-104 — a failure that comes back after `stop()` says nothing
          // about the write: the sign-out may be exactly what made it fail.
          // Leave the entry untouched for its owner's next session. Counting
          // it would burn a retry, could drop the write, and the drop would be
          // recorded against whoever is signed in NOW.
          if (!isCurrent()) break;
          erroredOut = true;
          // Increment attempts; drop only after MAX_RETRY_ATTEMPTS so
          // a poisoned entry can't block the queue forever.
          const idx = this.queue.findIndex(
            q =>
              q.uid === item.uid &&
              q.collection === item.collection &&
              q.id === item.id,
          );
          if (idx >= 0) {
            // R9-34 — spread the entry as it is in the queue RIGHT NOW, not
            // the `item` snapshot taken when this flush started. If the user
            // re-edited the doc while `pushOne` was in flight, `upsertQueueEntry`
            // already replaced this slot with the newer payload; spreading
            // `item` would put the OLD one back and no later retry could ever
            // recover the newer edit, because the queue itself had regressed.
            const live = this.queue[idx];
            this.queue[idx] = {
              ...live,
              attempts: live.attempts + 1,
              // R9-33 — stamp the attempt so the backoff has a baseline.
              lastAttemptAt: Date.now(),
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
              // R9-33 — a dropped write is a local change that will never
              // reach the cloud. Record it so the UI can SAY so: without
              // this, dropping the last queued write takes `pendingWrites`
              // to 0 and Settings switches to "Sincronizado hace un momento"
              // in the same instant the change was thrown away.
              void this.recordDroppedWrite();
            }
          }
          this.updateState({
            pendingWrites: this.pendingForActiveUid(),
            lastError: err instanceof Error ? err.message : String(err),
          });
          // Stop the flush — likely network problem, NetInfo or a later
          // queueWrite call will trigger another flush attempt.
          break;
        }
      }
      await this.persistQueue();
    } finally {
      // R9-104 — once `stop()` has run, the lock and `isSyncing` are the next
      // session's; releasing them here would cut into its flush.
      if (isCurrent()) {
        this.flushInFlight = false;
        this.updateState({isSyncing: false});
      }
    }

    // Sprint 47 — if the loop completed cleanly but the queue still holds
    // entries, they were queued DURING this flush: e.g. reviewCard queues
    // memoryCards and THEN reviewEvents in the same tick, and the second
    // queueWrite hit the flushInFlight guard so its own flush() returned
    // early. A clean loop removes every snapshotted item on success, so a
    // non-empty queue here is genuinely-new work — drain it now instead of
    // waiting for the next NetInfo event / queueWrite / periodic tick. We do
    // NOT re-flush after an error (erroredOut) to avoid a hot retry loop.
    //
    // R9-22 — this MUST count only the active uid's entries. The queue can
    // also hold a previous user's parked writes, which this flush will never
    // drain; testing `this.queue.length` would see a permanently non-empty
    // queue, conclude "genuinely-new work" and re-enter flush() forever —
    // a hot spin for as long as the app is open.
    //
    // R9-33 — and it must count only entries that are DUE. An entry waiting
    // out its retry backoff is pending but not flushable; counting it here
    // would re-enter flush() immediately, find nothing to do, and come
    // straight back — a hot spin for as long as the backoff lasts.
    if (
      !erroredOut &&
      this.flushableCount() > 0 &&
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
    // R9-104 — the path is the OWNER's, never "whoever is signed in by the
    // time this line runs". `flush()` stops at the first `await` that comes
    // back in another session, so today both are always the same uid; this
    // makes it true by construction instead of by timing.
    if (item.uid !== this.uid) {
      throw new Error('engine inactive or on another account during push');
    }
    const ref = firestoreFn()
      .collection(`users/${item.uid}/${item.collection}`)
      .doc(toDocId(item.id));
    // Sprint 78 — defense-in-depth: Firestore rejects `undefined` field
    // values and a rejected write would retry until the queue DROPS it
    // (the S77 silent-loss bug). Builders sanitize at the source; this
    // engine-boundary sweep covers what they can't (conflict-resolution
    // merges typed in the UI, future adapters).
    //
    // `{merge: true}` is kept deliberately — it protects a field written by a
    // NEWER app version on another device from being erased by this one. The
    // price is that an OMITTED key means "keep the server's value", which is
    // why the sweep above nullifies instead of dropping (R9-44/45/50): every
    // queued payload is a COMPLETE entity, so an absent optional must travel
    // as an explicit `null` to actually clear the server copy.
    await ref.set(deepNullifyUndefined(item.data), {merge: true});
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
