/**
 * 📖 readingInsights — "Mi lectura" dashboard model (PURE, no React/RN).
 *
 * Composes a Bible-reading insights snapshot from data the app already keeps:
 *   • the per-day `reading_streak_log` (AchievementService.getReadingLog),
 *   • lifetime UserStats (verses / chapters / books),
 *   • the per-book/chapter ReadingProgress map (ReadingProgressContext).
 *
 * It produces a GitHub-style activity heatmap (reusing the existing
 * [[ContributionHeatmap]] primitive + its HeatmapCell type — until now only
 * the memorization "insights" screen fed it), the current/longest reading
 * streak (reusing [[computeStreaks]] from the S58 streak fix), this-week vs
 * last-week momentum, the best single day, and the most-read book.
 *
 * Everything is injected so the model is deterministic and unit-testable; the
 * screen wires the real snapshots. 100% JS, zero new native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {HeatmapCell, HeatmapLevel} from '@lib/memory/history';
import {HEATMAP_WEEKS} from '@lib/memory/history';
import {computeStreaks} from '@lib/achievements/streak';
import {
  topBookReading,
  type BookReadingEntry,
} from '@lib/reading/bookReadingLog';
import {localDayKey} from '@lib/utils/dateKey';

const MS_PER_DAY = 86_400_000;

/** One row of the per-day reading log (AchievementService.getReadingLog). */
export interface ReadingLogEntry {
  /** Calendar day, `YYYY-MM-DD` (same basis the streak log + computeStreaks use). */
  date: string;
  versesRead: number;
  timeSpent: number;
}

/** Lifetime totals (a subset of UserStats). */
export interface ReadingTotals {
  totalVersesRead: number;
  totalChaptersRead: number;
  totalBooksCompleted: number;
  /** Accumulated reading time, in SECONDS (UserStats.totalReadingTime). */
  totalReadingSeconds?: number;
}

/** ReadingProgress: canonical book → chapter number → percent (0–100). */
export type BookProgressMap = Record<string, Record<string | number, number>>;

export interface ReadingInsightsInput {
  readingLog: ReadingLogEntry[];
  totals: ReadingTotals;
  /** Per-book chapter progress, used as the most-read FALLBACK (proxy). */
  bookProgress: BookProgressMap;
  /**
   * REAL per-book reading aggregates (book_reading_log). When present and
   * non-empty this is the authoritative source for the most-read book; the
   * chapters-touched proxy is only used when this is empty (pre-S65 readers).
   */
  bookReadingLog?: BookReadingEntry[];
}

export interface MostReadBook {
  /** Canonical (English) book key as stored in ReadingProgress. */
  book: string;
  /** Number of chapters with any recorded progress. */
  chapters: number;
  /** REAL verses read for this book (only when `source === 'log'`). */
  versesRead?: number;
  /** REAL accumulated reading time, in SECONDS (only when `source === 'log'`). */
  timeSpent?: number;
  /**
   * 'log' = the real per-book aggregate (verses + time); 'progress' = the
   * legacy chapters-touched proxy. The screen renders verses + time for 'log'
   * and chapter count for 'progress'.
   */
  source: 'log' | 'progress';
}

export interface ReadingInsights {
  /** False when there is no reading footprint at all (drives an empty state). */
  hasData: boolean;
  /** Heatmap cells for ContributionHeatmap (oldest first, Sunday-aligned). */
  heatmap: HeatmapCell[];
  /** Week-columns the heatmap spans. */
  heatmapWeeks: number;
  /** Sum of verses across the heatmap window. */
  windowVerses: number;
  /** Distinct calendar days the user has ever read (verses > 0). */
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
  totalVersesRead: number;
  totalChaptersRead: number;
  totalBooksCompleted: number;
  /** Most verses read in a single day, ever. */
  bestDayVerses: number;
  /** Verses read in the last 7 days (incl. today). */
  thisWeekVerses: number;
  /** Verses read in the 7 days before that. */
  lastWeekVerses: number;
  /** The book with the most chapters touched, or null when none. */
  mostReadBook: MostReadBook | null;
  /** Lifetime accumulated reading time, in SECONDS (from UserStats). */
  totalReadingSeconds: number;
  /** Reading time in the last 7 days (incl. today), in SECONDS (from the log). */
  thisWeekReadingSeconds: number;
  /** Most reading time recorded in a single day, ever, in SECONDS. */
  bestDayReadingSeconds: number;
}

/** UTC day-number for a `YYYY-MM-DD` string, or null if unparseable. */
function dayNumberFromDateStr(date: string): number | null {
  if (typeof date !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / MS_PER_DAY);
}

/** UTC day-number for a millisecond timestamp. */
function dayNumberFromMs(ms: number): number {
  return Math.floor(ms / MS_PER_DAY);
}

/** `YYYY-MM-DD` for a UTC day-number (used to anchor computeStreaks on today). */
function dateStrFromDayNumber(dayNumber: number): string {
  return new Date(dayNumber * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * Reading-intensity bucket for a day's verse count. Tuned for reading (a
 * typical chapter ≈ 20–30 verses) rather than the review heatmap's per-card
 * thresholds.
 */
export function readingLevelForVerses(verses: number): HeatmapLevel {
  if (verses <= 0) return 0;
  if (verses <= 15) return 1;
  if (verses <= 40) return 2;
  if (verses <= 90) return 3;
  return 4;
}

/**
 * Build the Sunday-aligned reading heatmap from per-day verse counts.
 * Mirrors `reviewHeatmap`'s windowing but consumes per-day aggregates (the
 * reading log is already one row per day) on a UTC-day basis, consistent with
 * computeStreaks.
 */
function buildReadingHeatmap(
  versesByDay: Map<number, number>,
  todayNum: number,
  weeks: number,
): {cells: HeatmapCell[]; windowVerses: number} {
  const w = Math.max(1, Math.floor(weeks));
  const todayWeekday = new Date(todayNum * MS_PER_DAY).getUTCDay(); // 0 = Sun
  const totalCells = (w - 1) * 7 + todayWeekday + 1;
  const startDayNum = todayNum - (totalCells - 1);

  const cells: HeatmapCell[] = [];
  let windowVerses = 0;
  for (let i = 0; i < totalCells; i++) {
    const dayNum = startDayNum + i;
    const count = versesByDay.get(dayNum) ?? 0;
    windowVerses += count;
    cells.push({
      dateMs: dayNum * MS_PER_DAY,
      count,
      level: readingLevelForVerses(count),
    });
  }
  return {cells, windowVerses};
}

/** Chapters with any recorded progress for a book (the proxy metric). */
function chaptersTouched(bookProgress: BookProgressMap, book: string): number {
  return Object.values(bookProgress?.[book] ?? {}).filter(
    pct => typeof pct === 'number' && pct > 0,
  ).length;
}

/**
 * Most-read book — REAL when the per-book reading log has data (ranked by
 * verses, with time), else the legacy chapters-touched proxy. Falling back
 * keeps the card populated for readers who finished books before Sprint 65
 * wired the per-book log.
 */
function deriveMostReadBook(
  bookProgress: BookProgressMap,
  bookReadingLog: BookReadingEntry[] | undefined,
): MostReadBook | null {
  const real = topBookReading(bookReadingLog ?? []);
  if (real) {
    return {
      book: real.book,
      chapters: chaptersTouched(bookProgress, real.book),
      versesRead: real.versesRead,
      timeSpent: real.timeSpent,
      source: 'log',
    };
  }

  // Fallback: most chapters touched.
  let best: MostReadBook | null = null;
  for (const book of Object.keys(bookProgress ?? {})) {
    const chapters = chaptersTouched(bookProgress, book);
    if (chapters > 0 && (best === null || chapters > best.chapters)) {
      best = {book, chapters, source: 'progress'};
    }
  }
  return best;
}

/**
 * Compose the full reading-insights snapshot. Defensive: tolerates an empty or
 * malformed log/progress map and never throws.
 *
 * @param input injected data snapshots
 * @param now   current time (defaults to Date.now(); injectable for tests)
 */
export function buildReadingInsights(
  input: ReadingInsightsInput,
  now: number = Date.now(),
): ReadingInsights {
  const log = Array.isArray(input?.readingLog) ? input.readingLog : [];
  const totals = input?.totals ?? {
    totalVersesRead: 0,
    totalChaptersRead: 0,
    totalBooksCompleted: 0,
  };

  // `entry.date` strings are LOCAL calendar days (localDayKey, same basis
  // AchievementService's reading_streak_log uses since 55ff1a7). Anchoring
  // "today" on the UTC day of `now` instead would desync from those entries
  // for any negative-UTC-offset reader once UTC's date has already rolled
  // past local midnight — same class of bug 55ff1a7 fixed for the streak log
  // itself, just not yet ported to this screen's own day math.
  const todayNum =
    dayNumberFromDateStr(localDayKey(now)) ?? dayNumberFromMs(now);

  // Tally verses + seconds per UTC day, and collect active-day strings for the
  // streak. Reading time (seconds) rides alongside the verse count per day.
  const versesByDay = new Map<number, number>();
  const secondsByDay = new Map<number, number>();
  const activeDayStrings: string[] = [];
  let bestDayVerses = 0;
  let bestDayReadingSeconds = 0;
  for (const entry of log) {
    const dayNum = dayNumberFromDateStr(entry?.date);
    if (dayNum === null) continue;
    const verses = Math.max(0, Number(entry?.versesRead) || 0);
    const seconds = Math.max(0, Number(entry?.timeSpent) || 0);
    versesByDay.set(dayNum, (versesByDay.get(dayNum) ?? 0) + verses);
    secondsByDay.set(dayNum, (secondsByDay.get(dayNum) ?? 0) + seconds);
    if (verses > 0) activeDayStrings.push(entry.date);
  }
  for (const v of versesByDay.values()) {
    if (v > bestDayVerses) bestDayVerses = v;
  }
  for (const s of secondsByDay.values()) {
    if (s > bestDayReadingSeconds) bestDayReadingSeconds = s;
  }

  const activeDays = new Set(
    activeDayStrings.map(dayNumberFromDateStr).filter(n => n !== null),
  ).size;

  // This-week / last-week momentum (7-day windows ending today).
  let thisWeekVerses = 0;
  let lastWeekVerses = 0;
  for (const [dayNum, verses] of versesByDay.entries()) {
    const ago = todayNum - dayNum;
    if (ago >= 0 && ago < 7) thisWeekVerses += verses;
    else if (ago >= 7 && ago < 14) lastWeekVerses += verses;
  }
  let thisWeekReadingSeconds = 0;
  for (const [dayNum, seconds] of secondsByDay.entries()) {
    const ago = todayNum - dayNum;
    if (ago >= 0 && ago < 7) thisWeekReadingSeconds += seconds;
  }

  const {cells, windowVerses} = buildReadingHeatmap(
    versesByDay,
    todayNum,
    HEATMAP_WEEKS,
  );

  const {currentStreak, longestStreak} = computeStreaks(
    activeDayStrings,
    dateStrFromDayNumber(todayNum),
  );

  const mostReadBook = deriveMostReadBook(
    input?.bookProgress ?? {},
    input?.bookReadingLog,
  );

  const hasData =
    activeDays > 0 ||
    totals.totalVersesRead > 0 ||
    totals.totalChaptersRead > 0 ||
    mostReadBook !== null;

  return {
    hasData,
    heatmap: cells,
    heatmapWeeks: HEATMAP_WEEKS,
    windowVerses,
    activeDays,
    currentStreak,
    longestStreak,
    totalVersesRead: Math.max(0, totals.totalVersesRead || 0),
    totalChaptersRead: Math.max(0, totals.totalChaptersRead || 0),
    totalBooksCompleted: Math.max(0, totals.totalBooksCompleted || 0),
    bestDayVerses,
    thisWeekVerses,
    lastWeekVerses,
    mostReadBook,
    totalReadingSeconds: Math.max(0, totals.totalReadingSeconds || 0),
    thisWeekReadingSeconds,
    bestDayReadingSeconds,
  };
}
