/**
 * 🔁 MEMORY STATS SYNC — the impure read/write plumbing for the aggregate.
 *
 * Wraps the pure `memoryStats.ts` math with the three side-effecting pieces it
 * needs: the Firestore doc (`users/{uid}/memoryStats/summary`), the local
 * `review_events` SQLite log (to detect a fresh device), and the local floor
 * cache in AsyncStorage (`@memory_stats_floor`).
 *
 * Two entry points:
 *  - `seedMemoryStatsFloorIfFresh(uid)` — ONE-TIME bootstrap on a fresh device
 *    (zero local review rows): fetch the cloud aggregate once and freeze it as
 *    the local floor. Guarded so it never refetches/overwrites an existing
 *    floor — that immutability is load-bearing (see memoryStats.ts).
 *  - `maybeWriteMemoryStatsSummary()` — recompute the aggregate from the local
 *    log + frozen floor and push it, at most when something changed this
 *    session. Wired to app-background, NOT per review.
 *
 * All best-effort: every failure is swallowed (a lost/late aggregate only
 * costs some cross-device continuity, never local data or app stability).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {getFirestore} from '@lib/sync/firestore';
import {getSyncEngine, nullifyUndefined} from '@lib/sync';
import {logger} from '@lib/utils/logger';
import {getAllReviewEvents, clearAllReviewEvents} from './reviewEventStore';
import {
  coerceMemoryStatsSummary,
  computeMemoryStatsSummary,
  MEMORY_STATS_COLLECTION,
  MEMORY_STATS_DOC_ID,
  summarySignature,
  type MemoryStatsSummary,
} from './memoryStats';

/** Device-level, one-time restore floor. Not uid-scoped — the local review
 *  log it substitutes for isn't either (both are device data, shared across
 *  accounts on the same device). Cleared via `clearMemoryStatsFloor`, called
 *  from `AuthContext`'s `signOut`/`deleteAccount` (an explicit user action,
 *  deliberately NOT a reactive effect watching auth state — that raced with
 *  ordinary cold-start Auth rehydration and wiped+silently-re-seeded the
 *  floor on every launch, confirmed live 2026-07-09) so a second account on
 *  a shared device never inherits the first account's restored aggregate. */
const FLOOR_KEY = '@memory_stats_floor';

/** Set alongside the floor when it's freshly seeded; cleared once the
 *  restore banner has been shown+dismissed (or the floor itself is cleared
 *  on sign-out). Drives a one-time "we restored your progress" notice,
 *  never a per-session nag. */
const RESTORE_BANNER_KEY = '@memory_stats_floor_banner_pending';

/**
 * R9-48 — WHOSE review history the local `review_events` table currently
 * holds. The table is device-level and was never uid-scoped, and nothing
 * clears it on sign-out (`clearMemoryStatsFloor` says so in its own
 * docstring), so on a shared phone it keeps Ana's reviews after Beto signs
 * in. That broke the memoryStats aggregate in BOTH directions:
 *
 *  - `maybeWriteMemoryStatsSummary` combined `getActiveUid()` = Beto with
 *    Ana's events and wrote them to `users/{beto}/memoryStats/summary` with
 *    `.set()` — a TOTAL overwrite, not a merge. Since `reviewEvents` no
 *    longer syncs, that doc is Beto's only anchor in the cloud, so his real
 *    history was replaced by hers.
 *  - `seedMemoryStatsFloorIfFresh` treats "any local events" as "not a fresh
 *    device", so Ana's leftovers stopped Beto's own cloud floor from ever
 *    being restored.
 *
 * This marker keeps the two apart WITHOUT deleting anyone's local history:
 * an unclaimed log is claimed by the first account that writes, and a log
 * owned by someone else is neither uploaded nor counted as this device's
 * history. Whether signing out should also WIPE the local log is a separate
 * product question (R9-59) and deliberately not decided here.
 */
const REVIEW_LOG_OWNER_KEY = '@review_log_owner_uid';

/** The uid whose reviews the local log holds, or null if unclaimed. */
async function getReviewLogOwner(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REVIEW_LOG_OWNER_KEY);
  } catch {
    // Unreadable marker: treat as unclaimed rather than blocking the write.
    return null;
  }
}

/** Session guard so app-background writes stay cheap (skip when unchanged). */
let lastWrittenSignature: string | null = null;
let lastWrittenUid: string | null = null;

/** The frozen restore floor, or null if this device was never seeded. */
export async function getMemoryStatsFloor(): Promise<MemoryStatsSummary | null> {
  try {
    const raw = await AsyncStorage.getItem(FLOOR_KEY);
    if (raw == null) return null;
    return coerceMemoryStatsSummary(JSON.parse(raw));
  } catch (err) {
    logger.warn('memoryStatsSync: getMemoryStatsFloor failed', {
      component: 'memory/memoryStatsSync',
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/**
 * Fresh-device bootstrap. Fresh = zero local review rows for a signed-in user
 * at engine start. Fetches the cloud aggregate once and stores it as the local
 * floor. No-ops (in this order) when: Firestore is unavailable, a floor already
 * exists, the device isn't fresh, or the cloud has no aggregate yet.
 */
export async function seedMemoryStatsFloorIfFresh(uid: string): Promise<void> {
  const fn = getFirestore();
  if (!fn) return; // no-op fast — never touches SQLite when sync is disabled
  try {
    // Never refetch/overwrite an existing floor — it's a one-time snapshot,
    // and its immutability keeps the write-side merge from double-counting.
    const existing = await AsyncStorage.getItem(FLOOR_KEY);
    if (existing != null) return;

    // R9-48 — a log owned by ANOTHER account is handed over here, at the one
    // point where a new uid is known to have signed in. Leaving it in place
    // is what caused the bug in both directions: its rows made this user look
    // like a returning heavy user (so their own cloud floor was never
    // restored, below), and `maybeWriteMemoryStatsSummary` folded them into
    // an aggregate written to THIS user's doc with `.set()`.
    //
    // The departing account loses nothing the design doesn't already treat as
    // recoverable — their aggregate is in their own cloud doc and re-seeds as
    // their floor when they sign back in, the same path a new device takes.
    // Ownership is claimed only if the clear actually succeeded.
    const owner = await getReviewLogOwner();
    if (owner !== null && owner !== uid) {
      try {
        await clearAllReviewEvents();
        await AsyncStorage.setItem(REVIEW_LOG_OWNER_KEY, uid);
        logger.info(
          'memoryStatsSync: review log handed over to the account signing in',
          {component: 'memory/memoryStatsSync', uid},
        );
      } catch (err) {
        logger.warn('memoryStatsSync: could not hand over the review log', {
          component: 'memory/memoryStatsSync',
          uid,
          error: err instanceof Error ? err.message : String(err),
        });
        // Leave ownership with the previous account: the write-side guard
        // still refuses to upload their history into this user's doc.
        return;
      }
    }

    // Fresh-device signal: no local review history to restore over.
    const events = await getAllReviewEvents();
    if (events.length > 0) return;

    const snap = await fn()
      .collection(`users/${uid}/${MEMORY_STATS_COLLECTION}`)
      .doc(MEMORY_STATS_DOC_ID)
      .get();
    if (!snap || !snap.exists) return;
    const floor = coerceMemoryStatsSummary(snap.data());
    if (!floor) return;
    await AsyncStorage.setItem(FLOOR_KEY, JSON.stringify(floor));
    await AsyncStorage.setItem(RESTORE_BANNER_KEY, '1');
    logger.info('memoryStatsSync: seeded restore floor on fresh device', {
      component: 'memory/memoryStatsSync',
      uid,
    });
  } catch (err) {
    logger.warn('memoryStatsSync: seedMemoryStatsFloorIfFresh failed', {
      component: 'memory/memoryStatsSync',
      uid,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Recompute the aggregate from the local log + frozen floor and push it to
 * Firestore — but only when the engine has an active uid AND the material
 * fields changed since the last write this session. Meant for the app-background
 * trigger, never per review. Best-effort.
 */
export async function maybeWriteMemoryStatsSummary(): Promise<void> {
  const fn = getFirestore();
  if (!fn) return;
  const uid = getSyncEngine()?.getActiveUid() ?? null;
  if (!uid) return;
  try {
    if (uid !== lastWrittenUid) {
      // New account this session — reset the cheapness guard.
      lastWrittenUid = uid;
      lastWrittenSignature = null;
    }
    // R9-48 — refuse to upload a log that belongs to a DIFFERENT account.
    // The write below is `.set()`, a total overwrite of the one doc that
    // anchors this user's memory stats in the cloud; writing Ana's history
    // into Beto's document destroys his outright. An unclaimed log is this
    // user's by definition (they are the first to write from this device).
    const owner = await getReviewLogOwner();
    if (owner !== null && owner !== uid) {
      logger.warn(
        'memoryStatsSync: local review log belongs to another account — ' +
          'skipping the aggregate write so it cannot overwrite this one',
        {component: 'memory/memoryStatsSync', uid},
      );
      return;
    }
    if (owner === null) {
      await AsyncStorage.setItem(REVIEW_LOG_OWNER_KEY, uid);
    }

    const [events, floor] = await Promise.all([
      getAllReviewEvents(),
      getMemoryStatsFloor(),
    ]);
    // Nothing worth writing until there's some signal (local or restored).
    if (events.length === 0 && !floor) return;
    const summary = computeMemoryStatsSummary(events, floor, new Date());
    const signature = summarySignature(summary);
    if (signature === lastWrittenSignature) return; // unchanged — skip write
    await fn()
      .collection(`users/${uid}/${MEMORY_STATS_COLLECTION}`)
      .doc(MEMORY_STATS_DOC_ID)
      .set(nullifyUndefined({...summary}));
    lastWrittenSignature = signature;
  } catch (err) {
    logger.warn('memoryStatsSync: maybeWriteMemoryStatsSummary failed', {
      component: 'memory/memoryStatsSync',
      uid,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** True once, right after a fresh-device floor seed, until dismissed. Drives
 *  the one-time "we restored your progress" notice on the insights screen. */
export async function shouldShowRestoreBanner(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RESTORE_BANNER_KEY)) != null;
  } catch {
    return false;
  }
}

/** Mark the restore banner seen so it never shows again for this floor. */
export async function dismissRestoreBanner(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RESTORE_BANNER_KEY);
  } catch {
    // best-effort — worst case the banner reappears once more.
  }
}

/** Clears the device-level restore floor (and its pending-banner flag) on
 *  sign-out, so a second account signing into a shared device never inherits
 *  the first account's restored streak/heatmap/retention. Does NOT touch the
 *  local review-event log or any other local data — only this cross-device
 *  continuity aid, which is safe to lose (it just re-seeds from the cloud on
 *  the next real sign-in, same as a genuinely fresh device). */
export async function clearMemoryStatsFloor(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([FLOOR_KEY, RESTORE_BANNER_KEY]);
  } catch (err) {
    logger.warn('memoryStatsSync: clearMemoryStatsFloor failed', {
      component: 'memory/memoryStatsSync',
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Test-only — reset the session write guard between cases. */
export function __resetMemoryStatsSessionForTests(): void {
  lastWrittenSignature = null;
  lastWrittenUid = null;
}
