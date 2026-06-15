/**
 * 📅 "TU AÑO/TRIMESTRE EN LA PALABRA" — PERIOD RECAP (Sprint 87)
 *
 * The temporal counterpart of the all-time "Tu camino" {@link buildJourneyRecap}:
 * a recap scoped to THIS year or THIS quarter (both ending now). Unlike the
 * lifetime recap — which leans on the cumulative `UserStats` totals — a windowed
 * recap can only honestly use the per-day / per-event sources the app keeps
 * (the reading log, the review-event log, favorites, cards, listening buckets,
 * the feelings log), filtered to the period. Cumulative-only figures (level,
 * lifetime streaks, total points) have NO honest per-period value, so they are
 * simply absent here.
 *
 * Pure and React-free (every input injected, `now` passed in), like
 * [[journeyRecap]] / [[weeklyChallenge]], so it unit-tests deterministically.
 * Everything is device-local; never reads or writes Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {MemoryCard} from '../../lib/memory/srs';
import type {ReviewEvent} from '../../lib/memory/reviewEvents';
import type {ReadingDay, JourneyFavoriteLike, BusiestDay} from './journeyRecap';
import {
  EMPTY_LISTENING_STATS,
  type ListeningStats,
} from '../audio/lib/listeningStats';
import {
  monthMood,
  emptyFeelingsLog,
  type FeelingsLog,
} from '../study/feelingsLog';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The supported recap scopes (both end at `now`). */
export type RecapPeriod = 'year' | 'quarter';

/** The resolved time window for a period. */
export interface PeriodWindow {
  period: RecapPeriod;
  /** Local-midnight ms of the period's first day. */
  start: number;
  /** `now` in ms — the window's inclusive end. */
  end: number;
  /** Calendar year of the window. */
  year: number;
  /** Quarter 1-4 (meaningful for 'quarter'; the current quarter for 'year'). */
  quarter: number;
  /** Whole days from start through now, inclusive (≥ 1). */
  days: number;
}

/** The period's emotional tenor (mirrors the journey MoodRecap). */
export interface PeriodMood {
  dominantFeelingId: string;
  daysLogged: number;
}

/** Everything the period recap reports — only windowable metrics. */
export interface PeriodRecap {
  window: PeriodWindow;
  versesRead: number;
  readingTimeSeconds: number;
  activeDays: number;
  busiestDay: BusiestDay | null;
  memoryReviews: number;
  /** Distinct verses that graduated to mastery (box 5) within the window. */
  versesMastered: number;
  /** Favorites created within the window. */
  favoritesAdded: number;
  /** Memory cards added within the window. */
  cardsAdded: number;
  listeningTimeMs: number;
  versesHeard: number;
  listeningDays: number;
  mood: PeriodMood | null;
  /** False ⇒ no recorded activity in this period (empty-state path). */
  hasData: boolean;
}

/** Everything {@link buildPeriodRecap} consumes — injected snapshots. */
export interface PeriodInput {
  readingLog: ReadingDay[];
  reviewEvents: ReviewEvent[];
  cards: MemoryCard[];
  favorites: JourneyFavoriteLike[];
  listeningStats?: ListeningStats;
  feelingsLog?: FeelingsLog;
}

const MASTERY_BOX = 5;

/** Resolve the window for `period` ending at `now` (both local). */
export function periodWindow(period: RecapPeriod, now: Date): PeriodWindow {
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const start =
    period === 'year'
      ? new Date(year, 0, 1).getTime()
      : new Date(year, (quarter - 1) * 3, 1).getTime();
  const end = now.getTime();
  const days = Math.max(1, Math.floor((end - start) / DAY_MS) + 1);
  return {period, start, end, year, quarter, days};
}

/** Coerce to a finite, non-negative integer. */
function safeCount(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.floor(v);
}

/** Local-midnight ms for a `YYYY-MM-DD` key, or NaN if unparseable. */
function localDayMs(date: string): number {
  if (typeof date !== 'string') return NaN;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return NaN;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
}

/**
 * Build the period recap from the injected snapshots, scoped to `period`
 * (ending at `now`). Pure and defensive — degenerate input yields a coherent
 * empty recap, never a throw.
 */
export function buildPeriodRecap(
  input: PeriodInput,
  period: RecapPeriod,
  now: Date = new Date(),
): PeriodRecap {
  const window = periodWindow(period, now);
  const {start, end} = window;
  const inWindowMs = (ms: number) =>
    Number.isFinite(ms) && ms >= start && ms <= end;

  // Reading log (per-day).
  let versesRead = 0;
  let readingTimeSeconds = 0;
  let activeDays = 0;
  let busiestDay: BusiestDay | null = null;
  for (const day of input.readingLog ?? []) {
    if (!inWindowMs(localDayMs(day?.date))) continue;
    const verses = safeCount(day?.versesRead);
    readingTimeSeconds += safeCount(day?.timeSpent);
    if (verses <= 0) continue;
    versesRead += verses;
    activeDays += 1;
    if (!busiestDay || verses > busiestDay.versesRead) {
      busiestDay = {date: day.date, versesRead: verses};
    }
  }

  // Review log (per-event): reviews + verses graduated to mastery this period.
  let memoryReviews = 0;
  const masteredKeys = new Set<string>();
  for (const e of input.reviewEvents ?? []) {
    if (!inWindowMs(e?.reviewedAt)) continue;
    memoryReviews += 1;
    if (e.boxBefore < MASTERY_BOX && e.boxAfter === MASTERY_BOX) {
      masteredKeys.add(e.verseKey);
    }
  }

  const favoritesAdded = (input.favorites ?? []).filter(f =>
    inWindowMs(typeof f?.createdAt === 'number' ? f.createdAt : NaN),
  ).length;

  const cardsAdded = (input.cards ?? []).filter(c =>
    inWindowMs(Date.parse(c?.addedAt ?? '')),
  ).length;

  // Listening buckets (per-day) within the window.
  const lStats = input.listeningStats ?? EMPTY_LISTENING_STATS;
  let listeningTimeMs = 0;
  let versesHeard = 0;
  let listeningDays = 0;
  for (const [dayKey, bucket] of Object.entries(lStats.days ?? {})) {
    if (!inWindowMs(localDayMs(dayKey))) continue;
    const ms = safeCount(bucket?.ms);
    const verses = safeCount(bucket?.verses);
    if (ms <= 0 && verses <= 0) continue;
    listeningTimeMs += ms;
    versesHeard += verses;
    listeningDays += 1;
  }

  // Emotional tenor over the window (period ends at now → monthMood works).
  const moodSummary = monthMood(
    input.feelingsLog ?? emptyFeelingsLog(),
    end,
    window.days,
  );
  const mood: PeriodMood | null =
    moodSummary.dominant && moodSummary.daysLogged > 0
      ? {
          dominantFeelingId: moodSummary.dominant,
          daysLogged: moodSummary.daysLogged,
        }
      : null;

  const hasData =
    versesRead > 0 ||
    memoryReviews > 0 ||
    favoritesAdded > 0 ||
    cardsAdded > 0 ||
    versesHeard > 0 ||
    mood !== null;

  return {
    window,
    versesRead,
    readingTimeSeconds,
    activeDays,
    busiestDay,
    memoryReviews,
    versesMastered: masteredKeys.size,
    favoritesAdded,
    cardsAdded,
    listeningTimeMs,
    versesHeard,
    listeningDays,
    mood,
    hasData,
  };
}
