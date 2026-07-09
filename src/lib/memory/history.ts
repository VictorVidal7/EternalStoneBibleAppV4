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
import type {MemoryCard} from './srs';
// Type-only import (erased at runtime) so the value import
// memoryStats.ts → history.ts never becomes a runtime cycle.
import type {MemoryStatsSummary} from './memoryStats';

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

/** Build the heatmap grid from a pre-tallied per-day counts map. */
function buildHeatmap(
  counts: Map<number, number>,
  now: Date,
  weeks: number,
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
 * Daily-activity heatmap spanning `weeks` Sunday-aligned columns ending
 * today. The first cell is the Sunday of the oldest week, the last cell
 * is today; the UI chunks `cells` into columns of 7 (top = Sunday).
 */
export function reviewHeatmap(
  events: ReviewEvent[],
  now: Date,
  weeks: number = HEATMAP_WEEKS,
): ReviewHeatmap {
  // Tally reviews per local day.
  const counts = new Map<number, number>();
  for (const e of events) {
    const day = startOfLocalDay(e.reviewedAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return buildHeatmap(counts, now, weeks);
}

/**
 * Like `reviewHeatmap`, but folds a stats floor's per-day counts in for any
 * day the local log has no review — so a freshly-restored device shows its
 * pre-restore activity until real local reviews accumulate. Local always wins
 * on a day both cover.
 */
export function reviewHeatmapWithFloor(
  events: ReviewEvent[],
  now: Date,
  floorDays: Record<string, number> | undefined,
  weeks: number = HEATMAP_WEEKS,
): ReviewHeatmap {
  const counts = new Map<number, number>();
  if (floorDays) {
    for (const [day, count] of Object.entries(floorDays)) {
      const ms = Number(day);
      if (Number.isFinite(ms)) counts.set(startOfLocalDay(ms), count);
    }
  }
  // Local wins — overwrite the floor's value on any day with real reviews.
  const local = new Map<number, number>();
  for (const e of events) {
    const day = startOfLocalDay(e.reviewedAt);
    local.set(day, (local.get(day) ?? 0) + 1);
  }
  for (const [day, count] of local) counts.set(day, count);
  return buildHeatmap(counts, now, weeks);
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

/**
 * Like `retentionByInterval`, but adds a stats floor's per-band totals on top
 * of the locally-computed ones (safe to sum — the floor is disjoint from the
 * local events, see memoryStats.ts). Retention per band is recomputed from the
 * combined totals.
 */
export function retentionByIntervalWithFloor(
  events: ReviewEvent[],
  floorBands: Record<string, {total: number; recalled: number}> | undefined,
): RetentionBucket[] {
  const buckets = retentionByInterval(events);
  for (const bucket of buckets) {
    const f = floorBands?.[bucket.key];
    if (f) {
      bucket.total += f.total;
      bucket.recalled += f.recalled;
    }
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
 *
 * `cards` (optional) acts as a floor: since the deck fully cross-device syncs
 * (its live listener), `card.reviewCount`/`card.lapseCount` survive a reinstall
 * even when the local review log doesn't. Each verse's totals are the `max` of
 * what the events show and what its card carries — so a leech stays visible on
 * a fresh device before its per-review history has re-accumulated. Since
 * `reviewCount ≥ lapseCount` and `eventsTotal ≥ eventsLapses`, the max-ed total
 * always dominates the max-ed lapses, keeping `lapseRate` ≤ 1.
 */
export function findLeeches(
  events: ReviewEvent[],
  minLapses: number = LEECH_MIN_LAPSES,
  cards?: MemoryCard[],
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

  for (const card of cards ?? []) {
    const cardMs = card.lastReviewedAt
      ? Date.parse(card.lastReviewedAt) || card.updatedAt
      : card.updatedAt;
    const acc = byCard.get(card.verseKey) ?? {
      bookName: card.bookName,
      total: 0,
      lapses: 0,
      last: cardMs,
    };
    acc.total = Math.max(acc.total, card.reviewCount);
    acc.lapses = Math.max(acc.lapses, card.lapseCount ?? 0);
    if (acc.last === 0) acc.last = cardMs;
    byCard.set(card.verseKey, acc);
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

/** Local-day-set built from events plus a floor's per-day keys (for streaks). */
function mergedDaySet(
  events: ReviewEvent[],
  floorDays: Record<string, number> | undefined,
): Set<number> {
  const set = reviewDaySet(events);
  if (floorDays) {
    for (const day of Object.keys(floorDays)) {
      const ms = Number(day);
      if (Number.isFinite(ms)) set.add(startOfLocalDay(ms));
    }
  }
  return set;
}

/**
 * Floor-aware variant of `computeReviewHistory` — folds a restored stats floor
 * (and the synced deck, for leeches) into the views that must survive a
 * reinstall: heatmap, retention bands, streaks, and leeches. Recent counts
 * (today / last-7 / last-30) and overall retention stay events-only — they
 * naturally self-heal as real local reviews accumulate. `computeReviewHistory`
 * is left untouched; passing a null floor + no cards reproduces it exactly.
 */
export function computeReviewHistoryWithFloor(
  events: ReviewEvent[],
  now: Date,
  floor: MemoryStatsSummary | null,
  cards?: MemoryCard[],
  weeks: number = HEATMAP_WEEKS,
): ReviewHistory {
  const base = historySummary(events, now);
  const daySet = mergedDaySet(events, floor?.recentDays);
  const summary: HistorySummary = {
    ...base,
    activeDays: daySet.size,
    currentStreak: currentStreak(daySet, now),
    longestStreak: Math.max(base.longestStreak, floor?.longestStreak ?? 0),
  };
  return {
    heatmap: reviewHeatmapWithFloor(events, now, floor?.recentDays, weeks),
    retention: retentionByIntervalWithFloor(events, floor?.retentionBands),
    summary,
    leeches: findLeeches(events, LEECH_MIN_LAPSES, cards),
  };
}

// ── T8.1 — expanded (offering-unlocked) history views ──────────────────
//
// These three additions extend the SAME append-only review-event log with
// wider/differently-sliced pure reads: a longer heatmap window, a per-book
// breakdown, and a month-by-month trend. Nothing here changes what the free
// screen above already shows.

/** Safety cap so an old, heavily-used deck can't render an unbounded heatmap. */
export const MAX_HEATMAP_WEEKS = 260; // ~5 years

/**
 * How many week-columns a heatmap would need to span every review ever
 * logged (at least `HEATMAP_WEEKS`, capped at `MAX_HEATMAP_WEEKS`). Powers
 * the "full history" premium heatmap view.
 */
export function weeksSinceFirstEvent(events: ReviewEvent[], now: Date): number {
  if (events.length === 0) return HEATMAP_WEEKS;
  let earliest = events[0].reviewedAt;
  for (const e of events) if (e.reviewedAt < earliest) earliest = e.reviewedAt;
  const daysSince = Math.max(
    0,
    Math.floor((now.getTime() - earliest) / DAY_MS),
  );
  const weeks = Math.ceil((daysSince + 1) / 7);
  return Math.min(MAX_HEATMAP_WEEKS, Math.max(HEATMAP_WEEKS, weeks));
}

/** Retention + activity for one Bible book, from the review log. */
export interface BookRetentionRow {
  /** Book name as stored on the events (matches `findLeeches`' convention). */
  bookName: string;
  /** Every review logged for this book (first-ever reviews included). */
  totalReviews: number;
  /** Of those, how many had a prior review (eligible for retention scoring). */
  reviewsWithInterval: number;
  /** Of the eligible reviews, how many were recalled. */
  recalled: number;
  /** recalled / reviewsWithInterval, or null when none are eligible yet. */
  retention: number | null;
}

/**
 * Per-book breakdown of review activity and retention, most-reviewed book
 * first (ties broken alphabetically for a stable order). Like `findLeeches`,
 * groups by the raw stored `bookName` — a user who switches UI language
 * mid-history could see the same book split in two, the same pre-existing
 * limitation the rest of the review-log UI already has.
 */
export function retentionByBook(events: ReviewEvent[]): BookRetentionRow[] {
  interface Acc {
    totalReviews: number;
    reviewsWithInterval: number;
    recalled: number;
  }
  const byBook = new Map<string, Acc>();
  for (const e of events) {
    const acc = byBook.get(e.bookName) ?? {
      totalReviews: 0,
      reviewsWithInterval: 0,
      recalled: 0,
    };
    acc.totalReviews += 1;
    if (e.intervalDays != null) {
      acc.reviewsWithInterval += 1;
      if (isRecallSuccess(e.grade)) acc.recalled += 1;
    }
    byBook.set(e.bookName, acc);
  }
  const rows: BookRetentionRow[] = [];
  for (const [bookName, acc] of byBook) {
    rows.push({
      bookName,
      totalReviews: acc.totalReviews,
      reviewsWithInterval: acc.reviewsWithInterval,
      recalled: acc.recalled,
      retention:
        acc.reviewsWithInterval > 0
          ? acc.recalled / acc.reviewsWithInterval
          : null,
    });
  }
  rows.sort(
    (a, b) =>
      b.totalReviews - a.totalReviews || a.bookName.localeCompare(b.bookName),
  );
  return rows;
}

/** Retention measured over one calendar month. */
export interface TrendPoint {
  /** Local-midnight millis of the 1st of the month. */
  monthStartMs: number;
  /** Reviews with a prior review (retention-eligible) in this month. */
  total: number;
  /** Of those, how many were recalled. */
  recalled: number;
  /** recalled / total, or null when the month has no eligible reviews. */
  retention: number | null;
}

/** How many trailing months `retentionTrend` covers by default. */
export const TREND_MONTHS = 12;

/**
 * Month-by-month retention trend, oldest to newest, ending with the current
 * (local) month. Zero-filled so the chart shape is always `months` wide
 * regardless of how sparse the log is.
 */
export function retentionTrend(
  events: ReviewEvent[],
  now: Date,
  months: number = TREND_MONTHS,
): TrendPoint[] {
  const m = Math.max(1, Math.floor(months));
  const starts: number[] = [];
  for (let i = m - 1; i >= 0; i--) {
    starts.push(new Date(now.getFullYear(), now.getMonth() - i, 1).getTime());
  }
  const byMonth = new Map<number, {total: number; recalled: number}>();
  for (const ms of starts) byMonth.set(ms, {total: 0, recalled: 0});
  for (const e of events) {
    if (e.intervalDays == null) continue;
    const d = new Date(e.reviewedAt);
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    const acc = byMonth.get(monthStart);
    if (!acc) continue; // outside the requested window
    acc.total += 1;
    if (isRecallSuccess(e.grade)) acc.recalled += 1;
  }
  return starts.map(ms => {
    const acc = byMonth.get(ms)!;
    return {
      monthStartMs: ms,
      total: acc.total,
      recalled: acc.recalled,
      retention: acc.total > 0 ? acc.recalled / acc.total : null,
    };
  });
}
