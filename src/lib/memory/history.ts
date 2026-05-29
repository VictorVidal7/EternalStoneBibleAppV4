/**
 * 📈 REVIEW HISTORY — pure analytics over the review-event log (Sprint 45)
 *
 * Where `insights.ts` reads the *current state* of the deck, this module
 * reads the *history*: the append-only `ReviewEvent[]` log built up one
 * row per review. It powers two new insights surfaces:
 *
 *   1. a daily-activity heatmap (GitHub-contributions style), and
 *   2. a retention-by-interval curve — "after waiting N days, did you
 *      still recall the verse?" — plus headline streak/retention numbers.
 *
 * Pure and React-free (no SQLite, no AsyncStorage, no clock of its own —
 * the caller passes `now`), exactly like `srs.ts` / `insights.ts`, so it
 * unit-tests deterministically. Day bucketing iterates by *calendar* day
 * (via Date.setDate) rather than fixed 86 400 000 ms steps so it stays
 * correct across daylight-saving transitions.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {ReviewEvent} from './reviewEvents';
import {isRecallSuccess} from './reviewEvents';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Week-columns the heatmap spans (~4 months — fits a phone as squares). */
export const HEATMAP_WEEKS = 17;

/** Visual intensity of a heatmap cell. */
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

/** One day in the heatmap grid. */
export interface HeatmapCell {
  /** Local-midnight millis of the day this cell represents. */
  dateMs: number;
  /** Reviews recorded that day. */
  count: number;
  /** Intensity bucket, 0 (none) … 4 (most). */
  level: HeatmapLevel;
}

/** The full heatmap: contiguous days, oldest first, Sunday-aligned. */
export interface ReviewHeatmap {
  /** Days from a Sunday `weeks` columns back, through today, inclusive. */
  cells: HeatmapCell[];
  /** Number of week-columns the cells span. */
  weeks: number;
  /** Highest single-day count in the window. */
  maxCount: number;
  /** Sum of counts across the window. */
  windowTotal: number;
}

/** Retention measured for one elapsed-interval band. */
export interface RetentionBucket {
  /** Stable key for i18n / ordering. */
  key: string;
  minDays: number;
  /** Inclusive upper bound; Infinity for the open-ended last bucket. */
  maxDays: number;
  /** Reviews that fell in this interval band (excludes first-ever reviews). */
  total: number;
  /** Of those, how many were recalled (grade !== 'again'). */
  recalled: number;
  /** recalled / total in [0, 1], or null when the band has no data. */
  retention: number | null;
}

/** Headline numbers for the history hero. */
export interface HistorySummary {
  totalReviews: number;
  /** Reviews recorded today (local calendar day). Powers the daily goal. */
  reviewsToday: number;
  reviewsLast7: number;
  reviewsLast30: number;
  /** Distinct calendar days with ≥ 1 review. */
  activeDays: number;
  /** Consecutive review days ending today (or yesterday, as a grace). */
  currentStreak: number;
  /** Longest run of consecutive review days, ever. */
  longestStreak: number;
  /** recalled / reviews-with-a-prior-review, [0, 1], or null if none. */
  overallRetention: number | null;
  /**
   * Reviews that had a prior review (intervalDays != null) — the denominator
   * behind `overallRetention`. Sprint 48 uses it as the calibration sample
   * size: the ease prior is only trusted once enough of these accumulate.
   */
  reviewsWithInterval: number;
}

/**
 * A "leech" — a verse the user keeps lapsing on (pressing "again"). Unlike
 * the current-state "struggling" list in `insights.ts` (which scores box +
 * reviewCount on the card snapshot), a leech is a *historical* property the
 * card snapshot can't see: how many times you've actually failed it over
 * time. Computed purely from the append-only review log.
 */
export interface LeechCard {
  /** "Book/Chapter/Verse" key — also lets the UI rebuild the reference. */
  verseKey: string;
  /** Localized book name from the most recent review event. */
  bookName: string;
  /** Total reviews logged for this verse. */
  totalReviews: number;
  /** Reviews graded "again" (a recall failure). */
  lapses: number;
  /** lapses / totalReviews in [0, 1]. */
  lapseRate: number;
  /** Millis of the most recent review of this verse. */
  lastReviewedAt: number;
}

/** A verse needs at least this many lapses to surface as a leech. */
export const LEECH_MIN_LAPSES = 3;

/** Everything the history section renders, in one pass. */
export interface ReviewHistory {
  heatmap: ReviewHeatmap;
  retention: RetentionBucket[];
  summary: HistorySummary;
  leeches: LeechCard[];
}

/** Fixed interval bands, narrow→wide. Stable shape so the chart is too. */
const RETENTION_BANDS: ReadonlyArray<{
  key: string;
  minDays: number;
  maxDays: number;
}> = [
  {key: 'd1', minDays: 0, maxDays: 1},
  {key: 'd2_3', minDays: 2, maxDays: 3},
  {key: 'd4_7', minDays: 4, maxDays: 7},
  {key: 'd8_14', minDays: 8, maxDays: 14},
  {key: 'd15_30', minDays: 15, maxDays: 30},
  {key: 'd30plus', minDays: 31, maxDays: Infinity},
];

/** Local midnight (ms) of the day containing `ms`. */
function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Absolute count → intensity. Tuned for daily memorization: a single
 * review is the lightest shade, ~7+ in a day is the darkest. Absolute
 * (not relative to the window max) so the scale reads consistently
 * whether the deck is tiny or huge.
 */
function levelForCount(count: number): HeatmapLevel {
  if (count <= 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/** Distinct local days that have at least one review. */
function reviewDaySet(events: ReviewEvent[]): Set<number> {
  const set = new Set<number>();
  for (const e of events) set.add(startOfLocalDay(e.reviewedAt));
  return set;
}

/**
 * Daily-activity heatmap spanning `weeks` Sunday-aligned columns ending
 * today. The first cell is the Sunday of the oldest week, the last cell
 * is today; the UI chunks `cells` into columns of 7 (top = Sunday).
 */
export function reviewHeatmap(
  events: ReviewEvent[],
  now: Date,
  weeks: number = HEATMAP_WEEKS,
): ReviewHeatmap {
  const w = Math.max(1, Math.floor(weeks));
  const todayStart = startOfLocalDay(now.getTime());
  const todayWeekday = new Date(todayStart).getDay(); // 0 = Sunday
  const totalCells = (w - 1) * 7 + todayWeekday + 1;

  // First cell: walk back `totalCells - 1` calendar days from today
  // (DST-safe), which lands on a Sunday by construction.
  const start = new Date(todayStart);
  start.setDate(start.getDate() - (totalCells - 1));
  const startDayMs = startOfLocalDay(start.getTime());

  // Tally reviews per local day within the window.
  const counts = new Map<number, number>();
  for (const e of events) {
    const day = startOfLocalDay(e.reviewedAt);
    if (day < startDayMs || day > todayStart) continue;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  let maxCount = 0;
  let windowTotal = 0;
  const cursor = new Date(startDayMs);
  for (let i = 0; i < totalCells; i++) {
    const dateMs = startOfLocalDay(cursor.getTime());
    const count = counts.get(dateMs) ?? 0;
    if (count > maxCount) maxCount = count;
    windowTotal += count;
    cells.push({dateMs, count, level: levelForCount(count)});
    cursor.setDate(cursor.getDate() + 1);
  }

  return {cells, weeks: w, maxCount, windowTotal};
}

/**
 * Recall success rate grouped by how long the user waited before the
 * review. Only reviews with a prior review (intervalDays != null) count —
 * a verse's first-ever review has no interval to attribute. Returns the
 * fixed band set, zero-filled, so the chart shape is always stable.
 */
export function retentionByInterval(events: ReviewEvent[]): RetentionBucket[] {
  const buckets: RetentionBucket[] = RETENTION_BANDS.map(b => ({
    ...b,
    total: 0,
    recalled: 0,
    retention: null,
  }));
  for (const e of events) {
    if (e.intervalDays == null) continue;
    const d = e.intervalDays;
    const bucket = buckets.find(b => d >= b.minDays && d <= b.maxDays);
    if (!bucket) continue;
    bucket.total += 1;
    if (isRecallSuccess(e.grade)) bucket.recalled += 1;
  }
  for (const bucket of buckets) {
    bucket.retention = bucket.total > 0 ? bucket.recalled / bucket.total : null;
  }
  return buckets;
}

/** Consecutive review days ending today, with a one-day grace for today. */
function currentStreak(daySet: Set<number>, now: Date): number {
  let streak = 0;
  const cursor = new Date(startOfLocalDay(now.getTime()));
  // If today has no review yet, the streak can still be alive through
  // yesterday — start counting there instead of breaking at zero.
  if (!daySet.has(startOfLocalDay(cursor.getTime()))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daySet.has(startOfLocalDay(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Longest run of consecutive review days across all of history. */
function longestStreak(daySet: Set<number>): number {
  if (daySet.size === 0) return 0;
  const days = Array.from(daySet).sort((a, b) => a - b);
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const prevPlusOne = new Date(days[i - 1]);
    prevPlusOne.setDate(prevPlusOne.getDate() + 1);
    if (startOfLocalDay(prevPlusOne.getTime()) === days[i]) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
  }
  return longest;
}

/** Headline counts + streaks + overall retention. */
export function historySummary(
  events: ReviewEvent[],
  now: Date,
): HistorySummary {
  const nowMs = now.getTime();
  const since7 = nowMs - 7 * DAY_MS;
  const since30 = nowMs - 30 * DAY_MS;
  const todayStart = startOfLocalDay(nowMs);
  let reviewsToday = 0;
  let reviewsLast7 = 0;
  let reviewsLast30 = 0;
  let recalled = 0;
  let withInterval = 0;
  for (const e of events) {
    if (startOfLocalDay(e.reviewedAt) === todayStart) reviewsToday += 1;
    if (e.reviewedAt >= since7) reviewsLast7 += 1;
    if (e.reviewedAt >= since30) reviewsLast30 += 1;
    if (e.intervalDays != null) {
      withInterval += 1;
      if (isRecallSuccess(e.grade)) recalled += 1;
    }
  }
  const daySet = reviewDaySet(events);
  return {
    totalReviews: events.length,
    reviewsToday,
    reviewsLast7,
    reviewsLast30,
    activeDays: daySet.size,
    currentStreak: currentStreak(daySet, now),
    longestStreak: longestStreak(daySet),
    overallRetention: withInterval > 0 ? recalled / withInterval : null,
    reviewsWithInterval: withInterval,
  };
}

/**
 * Verses the user keeps lapsing on, computed from the review log. A verse
 * qualifies once its "again" count reaches `minLapses`. Sorted hardest
 * first (most lapses → highest lapse rate → verseKey for a stable tie
 * break) so the UI can show the top few.
 */
export function findLeeches(
  events: ReviewEvent[],
  minLapses: number = LEECH_MIN_LAPSES,
): LeechCard[] {
  interface Acc {
    bookName: string;
    total: number;
    lapses: number;
    last: number;
  }
  const byCard = new Map<string, Acc>();
  for (const e of events) {
    const acc = byCard.get(e.verseKey) ?? {
      bookName: e.bookName,
      total: 0,
      lapses: 0,
      last: 0,
    };
    acc.total += 1;
    if (!isRecallSuccess(e.grade)) acc.lapses += 1;
    // Keep the book name from the most recent event (latest known label).
    if (e.reviewedAt >= acc.last) {
      acc.last = e.reviewedAt;
      acc.bookName = e.bookName;
    }
    byCard.set(e.verseKey, acc);
  }

  const leeches: LeechCard[] = [];
  for (const [verseKey, acc] of byCard) {
    if (acc.lapses < minLapses) continue;
    leeches.push({
      verseKey,
      bookName: acc.bookName,
      totalReviews: acc.total,
      lapses: acc.lapses,
      lapseRate: acc.total > 0 ? acc.lapses / acc.total : 0,
      lastReviewedAt: acc.last,
    });
  }
  leeches.sort(
    (a, b) =>
      b.lapses - a.lapses ||
      b.lapseRate - a.lapseRate ||
      a.verseKey.localeCompare(b.verseKey),
  );
  return leeches;
}

/** One call bundling every history insight the screen needs. */
export function computeReviewHistory(
  events: ReviewEvent[],
  now: Date,
  weeks: number = HEATMAP_WEEKS,
): ReviewHistory {
  return {
    heatmap: reviewHeatmap(events, now, weeks),
    retention: retentionByInterval(events),
    summary: historySummary(events, now),
    leeches: findLeeches(events),
  };
}
