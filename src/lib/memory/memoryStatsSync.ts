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
import {getSyncEngine, withoutUndefined} from '@lib/sync';
import {logger} from '@lib/utils/logger';
import {getAllReviewEvents} from './reviewEventStore';
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
 *  accounts on the same device, and never cleared on sign-out). */
const FLOOR_KEY = '@memory_stats_floor';

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
      .set(withoutUndefined({...summary}));
    lastWrittenSignature = signature;
  } catch (err) {
    logger.warn('memoryStatsSync: maybeWriteMemoryStatsSummary failed', {
      component: 'memory/memoryStatsSync',
      uid,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Test-only — reset the session write guard between cases. */
export function __resetMemoryStatsSessionForTests(): void {
  lastWrittenSignature = null;
  lastWrittenUid = null;
}
