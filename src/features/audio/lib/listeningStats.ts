/**
 * 🎧 listeningStats — PURE listening-time model (Sprint 75).
 *
 * Until now NOTHING about audio listening was tracked — "Time in the Word"
 * (S62) counts reading seconds only, and the TTS player kept no history. This
 * module models per-day listening buckets so "Mi lectura" can show a
 * "Listening time" card (today / this week / total + verses heard), closing
 * the listening-session arc (queue + resume + continuous playback).
 *
 * Shape: `{days: {"2026-06-09": {ms, verses}}}` — LOCAL calendar days (a
 * listening day is the day the listener experienced, not UTC), pruned to the
 * newest {@link LISTENING_RETENTION_DAYS} so the blob never grows unbounded.
 * Time is accumulated by the AudioListeningTracker host (wall-clock while
 * `isPlaying`); verses count once per verse that BEGINS voicing.
 *
 * Pure (React-/storage-free) and defensive on parse, mirroring
 * [[playbackPosition]]; the AsyncStorage I/O lives in
 * [[listeningStatsStore]].
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {
  computeStreaks,
  type StreakResult,
} from '../../../lib/achievements/streak';

/** One local calendar day of listening. */
export interface ListeningDay {
  /** Milliseconds of active playback. */
  ms: number;
  /** Verses that began voicing. */
  verses: number;
}

/** All retained listening history, keyed by local "YYYY-MM-DD". */
export interface ListeningStats {
  days: Record<string, ListeningDay>;
}

/** Aggregates the insights card renders. */
export interface ListeningSummary {
  todayMs: number;
  /** Rolling window: today + the 6 prior days. */
  weekMs: number;
  totalMs: number;
  totalVerses: number;
  /** Distinct days with any listening. */
  daysListened: number;
}

export const EMPTY_LISTENING_STATS: ListeningStats = {days: {}};

/** Keep this many newest day buckets (≈13 months — enough for a Wrapped). */
export const LISTENING_RETENTION_DAYS = 400;

const DAY_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The LOCAL calendar day a ms-epoch falls on, as "YYYY-MM-DD". Local on
 * purpose: a 23:30 listen belongs to the day the listener experienced.
 */
export function listeningDateKey(now: number): string {
  const d = new Date(now);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Defensively parse a raw storage blob. Malformed JSON, non-object days,
 * ill-typed buckets and bad keys are all dropped (never thrown) so a corrupt
 * blob degrades to "no history".
 */
export function parseListeningStats(
  raw: string | null | undefined,
): ListeningStats {
  if (!raw) return EMPTY_LISTENING_STATS;
  try {
    const obj = JSON.parse(raw) as {days?: unknown} | null;
    if (!obj || typeof obj !== 'object' || !obj.days) {
      return EMPTY_LISTENING_STATS;
    }
    const days: Record<string, ListeningDay> = {};
    for (const [key, value] of Object.entries(
      obj.days as Record<string, unknown>,
    )) {
      if (!DAY_KEY_RE.test(key) || !value || typeof value !== 'object') {
        continue;
      }
      const {ms, verses} = value as Record<string, unknown>;
      if (!isFiniteNonNegative(ms) || !isFiniteNonNegative(verses)) continue;
      days[key] = {ms: Math.round(ms), verses: Math.round(verses)};
    }
    return {days};
  } catch {
    return EMPTY_LISTENING_STATS;
  }
}

/** Serialize for storage. */
export function serializeListeningStats(stats: ListeningStats): string {
  return JSON.stringify(stats);
}

/**
 * Add listening to a day bucket (immutably), pruning to the newest
 * {@link LISTENING_RETENTION_DAYS}. Negative/invalid deltas clamp to 0; a
 * no-op delta returns the stats unchanged.
 */
export function recordListening(
  stats: ListeningStats,
  dateKey: string,
  ms: number,
  verses: number,
): ListeningStats {
  const addMs = isFiniteNonNegative(ms) ? Math.round(ms) : 0;
  const addVerses = isFiniteNonNegative(verses) ? Math.round(verses) : 0;
  if ((addMs === 0 && addVerses === 0) || !DAY_KEY_RE.test(dateKey)) {
    return stats;
  }

  const prev = stats.days[dateKey] ?? {ms: 0, verses: 0};
  const days: Record<string, ListeningDay> = {
    ...stats.days,
    [dateKey]: {ms: prev.ms + addMs, verses: prev.verses + addVerses},
  };

  // Prune: "YYYY-MM-DD" sorts lexicographically = chronologically.
  const keys = Object.keys(days);
  if (keys.length > LISTENING_RETENTION_DAYS) {
    keys.sort();
    for (const stale of keys.slice(0, keys.length - LISTENING_RETENTION_DAYS)) {
      delete days[stale];
    }
  }

  return {days};
}

/**
 * Aggregate the stats for display: today's bucket, a rolling 7-day window
 * (today + 6 prior local days), and lifetime totals across retained days.
 */
export function summarizeListening(
  stats: ListeningStats,
  now: number,
): ListeningSummary {
  const todayKey = listeningDateKey(now);
  const weekKeys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    weekKeys.add(listeningDateKey(now - i * DAY_MS));
  }

  let todayMs = 0;
  let weekMs = 0;
  let totalMs = 0;
  let totalVerses = 0;
  let daysListened = 0;

  for (const [key, day] of Object.entries(stats.days)) {
    if (day.ms === 0 && day.verses === 0) continue;
    totalMs += day.ms;
    totalVerses += day.verses;
    daysListened += 1;
    if (key === todayKey) todayMs += day.ms;
    if (weekKeys.has(key)) weekMs += day.ms;
  }

  return {todayMs, weekMs, totalMs, totalVerses, daysListened};
}

/**
 * Consecutive-day listening streaks (Sprint 76): the run ending today (or
 * yesterday — today simply hasn't happened yet) and the longest run ever.
 * Reuses the reading-streak day math (`computeStreaks`) over this module's
 * local day keys; empty buckets (0 ms / 0 verses) don't count as listening.
 */
export function listeningStreaks(
  stats: ListeningStats,
  now: number,
): StreakResult {
  const days = Object.entries(stats.days)
    .filter(([, day]) => day.ms > 0 || day.verses > 0)
    .map(([key]) => key);
  return computeStreaks(days, listeningDateKey(now));
}

export type {StreakResult as ListeningStreaks};
