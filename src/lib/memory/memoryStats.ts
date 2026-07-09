/**
 * 🧮 MEMORY STATS SUMMARY — the cross-device continuity aggregate (pure).
 *
 * Local-first quota feature: per-review `reviewEvents` no longer sync to
 * Firestore (see MemoryDeckContext.reviewCard), so on a reinstall / new
 * device the review log starts empty. This single, bounded aggregate doc —
 * `users/{uid}/memoryStats/summary` — is the cheap substitute that lets a
 * fresh device restore streak / heatmap / retention until real local reviews
 * accumulate again.
 *
 * This module is **pure** (no Firestore, no AsyncStorage, no SQLite, no clock
 * of its own — the caller passes `now`), like `srs.ts` / `history.ts`, so the
 * merge math unit-tests deterministically. The impure read/write plumbing
 * (Firestore fetch/set, the local `@memory_stats_floor` cache) lives in
 * `memoryStatsSync.ts`.
 *
 * The SAME merge is used on both sides: when WRITING the doc the caller passes
 * the frozen local floor as `previous`, and when READING on a fresh device the
 * floor is folded into history.ts's floor-aware views — so the two can never
 * drift. The floor is disjoint from local events (null on the device that owns
 * the full history, and frozen-before-any-local-review on a seeded device), so
 * summing retention bands never double-counts.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {ReviewEvent} from './reviewEvents';
import {historySummary, retentionByInterval} from './history';

/** Firestore location of the aggregate — a single doc, not a growing set. */
export const MEMORY_STATS_COLLECTION = 'memoryStats';
export const MEMORY_STATS_DOC_ID = 'summary';

/**
 * Days of per-day heatmap history the doc retains, so `recentDays` can never
 * grow unbounded. Matches the OLD 12-month cloud sync window (not the free
 * heatmap's 17-week display window) so a fresh-device restore can still feed
 * the offering-unlocked EXTENDED heatmap (up to `MAX_HEATMAP_WEEKS`), not
 * just the free one — the whole point of this doc is to not regress restore
 * fidelity for premium users. One Firestore doc with ~365 small day-count
 * entries is still trivially under the 1 MiB doc-size limit, and this is a
 * per-SESSION write regardless of window size, so widening it costs nothing
 * extra in write quota — only a marginally larger (still tiny) document.
 */
export const RECENT_DAYS_WINDOW = 365;

/** Running per-band retention totals, keyed by history.ts's RETENTION_BANDS key. */
export interface RetentionBandTotals {
  total: number;
  recalled: number;
}

/**
 * The aggregate doc / local floor. `recentDays` keys are local-midnight millis
 * stringified, so a reader trivially round-trips them back to the heatmap's
 * day-set. Bounded by construction (`recentDays` pruned to RECENT_DAYS_WINDOW,
 * `retentionBands` fixed-cardinality).
 */
export interface MemoryStatsSummary {
  updatedAt: number;
  longestStreak: number;
  earliestReviewMs: number | null;
  recentDays: Record<string, number>;
  retentionBands: Record<string, RetentionBandTotals>;
}

/** Local midnight (ms) of the day containing `ms`. */
function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Per-local-day review counts across `events`, keyed by midnight-ms string. */
export function dayCounts(events: ReviewEvent[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of events) {
    const key = String(startOfLocalDay(e.reviewedAt));
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/**
 * Merge two per-day count maps — **local wins** on any day both cover, and the
 * floor fills days local doesn't. Mirrors the read-side rule ("floor drives a
 * day only where local is empty"), so a same-day cross-device overlap keeps the
 * local count rather than double-counting the floor's.
 */
export function mergeRecentDays(
  floor: Record<string, number> | undefined,
  local: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {...(floor ?? {})};
  for (const [day, count] of Object.entries(local)) out[day] = count;
  return out;
}

/** Drop day entries older than `windowStartMs` so the map stays bounded. */
export function pruneRecentDays(
  days: Record<string, number>,
  windowStartMs: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [day, count] of Object.entries(days)) {
    if (Number(day) >= windowStartMs) out[day] = count;
  }
  return out;
}

/** Per-band retention totals from the local event log. */
export function localRetentionBands(
  events: ReviewEvent[],
): Record<string, RetentionBandTotals> {
  const out: Record<string, RetentionBandTotals> = {};
  for (const b of retentionByInterval(events)) {
    out[b.key] = {total: b.total, recalled: b.recalled};
  }
  return out;
}

/**
 * Merge two per-band retention maps by **summing** — safe because the floor is
 * disjoint from local events (see the module header), so no review is counted
 * twice.
 */
export function mergeRetentionBands(
  floor: Record<string, RetentionBandTotals> | undefined,
  local: Record<string, RetentionBandTotals>,
): Record<string, RetentionBandTotals> {
  const out: Record<string, RetentionBandTotals> = {};
  const keys = new Set([...Object.keys(floor ?? {}), ...Object.keys(local)]);
  for (const key of keys) {
    const f = floor?.[key];
    const l = local[key];
    out[key] = {
      total: (f?.total ?? 0) + (l?.total ?? 0),
      recalled: (f?.recalled ?? 0) + (l?.recalled ?? 0),
    };
  }
  return out;
}

/** Earliest reviewedAt across `events`, or null when empty. */
export function earliestReviewMs(events: ReviewEvent[]): number | null {
  let earliest: number | null = null;
  for (const e of events) {
    if (typeof e.reviewedAt !== 'number' || !Number.isFinite(e.reviewedAt)) {
      continue;
    }
    if (earliest === null || e.reviewedAt < earliest) earliest = e.reviewedAt;
  }
  return earliest;
}

/** min ignoring nulls (null only when BOTH are null). */
export function minMs(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

/**
 * Build the aggregate for `now` from the local event log and the frozen local
 * `floor` (null on the device that owns the full history). Monotonic fields are
 * merged so a seeded device never regresses the cloud copy it was seeded from;
 * `recentDays` is pruned to the retained window.
 */
export function computeMemoryStatsSummary(
  events: ReviewEvent[],
  floor: MemoryStatsSummary | null,
  now: Date,
): MemoryStatsSummary {
  const windowStart = startOfLocalDay(
    now.getTime() - (RECENT_DAYS_WINDOW - 1) * 24 * 60 * 60 * 1000,
  );
  const merged = mergeRecentDays(floor?.recentDays, dayCounts(events));
  const localLongest = historySummary(events, now).longestStreak;
  return {
    updatedAt: now.getTime(),
    longestStreak: Math.max(localLongest, floor?.longestStreak ?? 0),
    earliestReviewMs: minMs(
      earliestReviewMs(events),
      floor?.earliestReviewMs ?? null,
    ),
    recentDays: pruneRecentDays(merged, windowStart),
    retentionBands: mergeRetentionBands(
      floor?.retentionBands,
      localRetentionBands(events),
    ),
  };
}

/**
 * A stable signature of the material (non-timestamp) fields, so the writer can
 * cheaply skip a Firestore write when nothing changed since the last one.
 */
export function summarySignature(summary: MemoryStatsSummary): string {
  return JSON.stringify({
    longestStreak: summary.longestStreak,
    earliestReviewMs: summary.earliestReviewMs,
    recentDays: summary.recentDays,
    retentionBands: summary.retentionBands,
  });
}

/**
 * Defensively coerce an untrusted object (a Firestore doc, or a parsed local
 * floor blob) into a MemoryStatsSummary — returns null if it can't be trusted.
 */
export function coerceMemoryStatsSummary(
  raw: unknown,
): MemoryStatsSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const recentDays: Record<string, number> = {};
  if (r.recentDays && typeof r.recentDays === 'object') {
    for (const [day, count] of Object.entries(
      r.recentDays as Record<string, unknown>,
    )) {
      if (typeof count === 'number' && Number.isFinite(count)) {
        recentDays[day] = count;
      }
    }
  }
  const retentionBands: Record<string, RetentionBandTotals> = {};
  if (r.retentionBands && typeof r.retentionBands === 'object') {
    for (const [key, val] of Object.entries(
      r.retentionBands as Record<string, unknown>,
    )) {
      if (val && typeof val === 'object') {
        const v = val as Record<string, unknown>;
        const total = typeof v.total === 'number' ? v.total : 0;
        const recalled = typeof v.recalled === 'number' ? v.recalled : 0;
        retentionBands[key] = {total, recalled};
      }
    }
  }
  return {
    updatedAt: typeof r.updatedAt === 'number' ? r.updatedAt : 0,
    longestStreak:
      typeof r.longestStreak === 'number' && r.longestStreak > 0
        ? Math.floor(r.longestStreak)
        : 0,
    earliestReviewMs:
      typeof r.earliestReviewMs === 'number' &&
      Number.isFinite(r.earliestReviewMs)
        ? r.earliestReviewMs
        : null,
    recentDays,
    retentionBands,
  };
}
