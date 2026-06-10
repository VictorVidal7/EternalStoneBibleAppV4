/**
 * 🛤️ "TU CAMINO" — JOURNEY RECAP (Sprint 57)
 *
 * Pure, React-free aggregator that turns the snapshots the app already
 * keeps — reading stats, the daily reading log, the memorization review
 * log, the deck, and favorites — into ONE recap object the Spotify-Wrapped
 * style "Tu camino" story screen renders as full-screen slides.
 *
 * Like `insights.ts` / `history.ts` / `conflictAnalytics.ts`, every input
 * is INJECTED (no AsyncStorage, no SQLite, no React, no clock of its own —
 * the caller passes `now`) so the math is deterministic and unit-testable.
 * It does NOT re-derive the memorization analytics: it COMPOSES the existing
 * pure modules (`masterySummary` for the deck, `computeReviewHistory` for the
 * review log) and only adds the reading/favorites highlights on top.
 *
 * Everything is device-local; this module never reads or writes Firestore.
 * It is defensive by construction — an empty deck / empty log / missing
 * field yields a coherent "just getting started" recap, never a throw.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import type {UserStats} from '../../lib/achievements/types';
import type {MemoryCard} from '../../lib/memory/srs';
import type {ReviewEvent} from '../../lib/memory/reviewEvents';
import {masterySummary} from '../../lib/memory/insights';
import {computeReviewHistory} from '../../lib/memory/history';
import {
  topBookReading,
  type BookReadingEntry,
} from '../../lib/reading/bookReadingLog';
import {
  summarizeListening,
  listeningStreaks,
  EMPTY_LISTENING_STATS,
  type ListeningStats,
} from '../audio/lib/listeningStats';

const DAY_MS = 24 * 60 * 60 * 1000;

/** One day of the reading-streak log (`reading_streak_log` row, camelCased). */
export interface ReadingDay {
  /** Local calendar day, `YYYY-MM-DD`. */
  date: string;
  /** Verses read that day. */
  versesRead: number;
  /** Seconds (as stored) attributed to that day. */
  timeSpent: number;
}

/** The only favorite fields the recap needs (decoupled from the context). */
export interface JourneyFavoriteLike {
  /** Book name as stored (may be localized, e.g. RVR1960 "Génesis"). */
  book: string;
  /** Millis since epoch the favorite was created. */
  createdAt: number;
}

/** Everything `buildJourneyRecap` consumes — all injected snapshots. */
export interface JourneyInput {
  stats: UserStats;
  readingLog: ReadingDay[];
  reviewEvents: ReviewEvent[];
  cards: MemoryCard[];
  favorites: JourneyFavoriteLike[];
  /** REAL per-book reading aggregates (book_reading_log); optional. */
  bookReadingLog?: BookReadingEntry[];
  /** Per-day listening buckets (S75 audio tracking); optional. */
  listeningStats?: ListeningStats;
}

/** The most-read book by REAL verses + time, or null when none yet. */
export interface MostReadBookRecap {
  /** Canonical (English) book key — the screen localizes it. */
  book: string;
  versesRead: number;
  /** Accumulated reading time for the book, in SECONDS. */
  timeSpent: number;
}

/** A book paired with how many times it appears (favorites / cards). */
export interface BookTally {
  /** Book name as stored — the screen localizes it via `getBookByName`. */
  book: string;
  count: number;
}

/** The single most active reading day, if the log has one. */
export interface BusiestDay {
  date: string;
  versesRead: number;
}

/**
 * The whole recap, computed in one pass. The story screen decides which
 * slides to show (skipping sections with no data) and how to render them —
 * this object stays a plain, presentation-free data bag.
 */
export interface JourneyRecap {
  // Reading
  versesRead: number;
  chaptersRead: number;
  booksCompleted: number;
  /** Distinct calendar days with ≥ 1 verse read. */
  activeDays: number;
  busiestDay: BusiestDay | null;
  /** Lifetime accumulated reading time, in SECONDS (UserStats.totalReadingTime). */
  readingTimeSeconds: number;

  // Streaks (reading)
  currentStreak: number;
  longestStreak: number;

  // Engagement
  favoritesCount: number;
  notesCount: number;
  highlightsCount: number;
  bookmarksCount: number;
  /** Most-favorited book, or null when there are no favorites. */
  favoriteBook: BookTally | null;
  /** REAL most-read book (by verses, with time), or null when none yet. */
  mostReadBook: MostReadBookRecap | null;

  // Listening (Sprint 76 — from the S75 per-day buckets)
  /** Lifetime listening time, in MILLISECONDS (0 = never listened). */
  listeningTimeMs: number;
  /** Verses that began voicing, lifetime. */
  versesHeard: number;
  /** Distinct local days with any listening. */
  listeningDays: number;
  /** Consecutive listening days ending today (or yesterday). */
  listeningCurrentStreak: number;
  listeningLongestStreak: number;

  // Memorization
  cardsTotal: number;
  versesMastered: number;
  memoryReviews: number;
  /** Recall rate over reviews with a prior review, 0-100 int, or null. */
  retentionPercent: number | null;
  /** Consecutive memorization-review days ending today. */
  memoryStreak: number;

  // Achievements / level
  achievementsUnlocked: number;
  totalAchievements: number;
  level: number;
  totalPoints: number;

  // Meta
  /** Earliest signal across reading/reviews/favorites/cards, or null. */
  journeyStartMs: number | null;
  /** Inclusive day count from the journey start through `now`, or null. */
  daysSinceStart: number | null;
  /** False ⇒ the user has no recorded activity yet (empty-state path). */
  hasData: boolean;
}

/** Coerce anything to a finite, non-negative integer (defensive). */
function safeCount(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.floor(v);
}

/** Local midnight (ms) for a `YYYY-MM-DD` string, or NaN if unparseable. */
function dayStringToMs(date: string): number {
  if (typeof date !== 'string' || date.length === 0) return NaN;
  // `YYYY-MM-DD` parses as UTC midnight — fine, we only ever compare/min it.
  return Date.parse(date);
}

/** Distinct days that recorded at least one verse, and the busiest one. */
function summarizeReadingLog(log: ReadingDay[]): {
  activeDays: number;
  busiestDay: BusiestDay | null;
  earliestMs: number | null;
} {
  let activeDays = 0;
  let busiestDay: BusiestDay | null = null;
  let earliestMs: number | null = null;
  for (const day of log) {
    const verses = safeCount(day?.versesRead);
    const ms = dayStringToMs(day?.date);
    if (Number.isFinite(ms)) {
      if (earliestMs === null || ms < earliestMs) earliestMs = ms;
    }
    if (verses <= 0) continue;
    activeDays += 1;
    if (!busiestDay || verses > busiestDay.versesRead) {
      busiestDay = {date: day.date, versesRead: verses};
    }
  }
  return {activeDays, busiestDay, earliestMs};
}

/** Most-favorited book (alphabetical tie-break), or null when none. */
function mostFavoritedBook(favorites: JourneyFavoriteLike[]): BookTally | null {
  const counts = new Map<string, number>();
  for (const fav of favorites) {
    const book = typeof fav?.book === 'string' ? fav.book.trim() : '';
    if (!book) continue;
    counts.set(book, (counts.get(book) ?? 0) + 1);
  }
  let best: BookTally | null = null;
  for (const [book, count] of counts) {
    if (
      !best ||
      count > best.count ||
      (count === best.count && book.localeCompare(best.book) < 0)
    ) {
      best = {book, count};
    }
  }
  return best;
}

/** Earliest createdAt across favorites, or null. */
function earliestFavoriteMs(favorites: JourneyFavoriteLike[]): number | null {
  let earliest: number | null = null;
  for (const fav of favorites) {
    const ms = typeof fav?.createdAt === 'number' ? fav.createdAt : NaN;
    if (!Number.isFinite(ms)) continue;
    if (earliest === null || ms < earliest) earliest = ms;
  }
  return earliest;
}

/** Earliest addedAt across deck cards (ISO → ms), or null. */
function earliestCardMs(cards: MemoryCard[]): number | null {
  let earliest: number | null = null;
  for (const card of cards) {
    const ms = Date.parse(card?.addedAt ?? '');
    if (!Number.isFinite(ms)) continue;
    if (earliest === null || ms < earliest) earliest = ms;
  }
  return earliest;
}

/**
 * Build the full "Tu camino" recap from the injected snapshots. Pure and
 * deterministic given `now`. Never throws on degenerate input — every
 * section degrades to zero / null and `hasData` reports whether there is
 * anything worth celebrating yet.
 */
export function buildJourneyRecap(
  input: JourneyInput,
  now: Date = new Date(),
): JourneyRecap {
  const {stats, readingLog, reviewEvents, cards, favorites, bookReadingLog} =
    input;

  const reading = summarizeReadingLog(readingLog ?? []);
  const favs = favorites ?? [];
  const deck = masterySummary(cards ?? [], now);
  const history = computeReviewHistory(reviewEvents ?? [], now);
  const favoriteBook = mostFavoritedBook(favs);

  // REAL most-read book (verses → time), null until the per-book log has data.
  const topRead = topBookReading(bookReadingLog ?? []);
  const mostReadBook: MostReadBookRecap | null = topRead
    ? {
        book: topRead.book,
        versesRead: topRead.versesRead,
        timeSpent: topRead.timeSpent,
      }
    : null;

  const versesRead = safeCount(stats?.totalVersesRead);
  const chaptersRead = safeCount(stats?.totalChaptersRead);
  const booksCompleted = safeCount(stats?.totalBooksCompleted);
  const favoritesCount = favs.length;
  const notesCount = safeCount(stats?.totalNotes);
  const highlightsCount = safeCount(stats?.totalHighlights);
  const bookmarksCount = safeCount(stats?.totalBookmarks);

  // Journey start = the earliest footprint of any kind.
  const candidates = [
    reading.earliestMs,
    history.summary.totalReviews > 0
      ? earliestReviewMs(reviewEvents ?? [])
      : null,
    earliestFavoriteMs(favs),
    earliestCardMs(cards ?? []),
  ].filter((m): m is number => m !== null && Number.isFinite(m));
  const journeyStartMs = candidates.length ? Math.min(...candidates) : null;
  const daysSinceStart =
    journeyStartMs === null
      ? null
      : Math.max(1, Math.floor((now.getTime() - journeyStartMs) / DAY_MS) + 1);

  const retentionPercent =
    history.summary.overallRetention === null
      ? null
      : Math.round(history.summary.overallRetention * 100);

  // Listening (optional input — degrades to zeros like everything else).
  const lStats = input.listeningStats ?? EMPTY_LISTENING_STATS;
  const listening = summarizeListening(lStats, now.getTime());
  const lStreaks = listeningStreaks(lStats, now.getTime());

  const hasData =
    versesRead > 0 ||
    chaptersRead > 0 ||
    deck.total > 0 ||
    favoritesCount > 0 ||
    history.summary.totalReviews > 0 ||
    highlightsCount > 0 ||
    notesCount > 0;

  return {
    versesRead,
    chaptersRead,
    booksCompleted,
    activeDays: reading.activeDays,
    busiestDay: reading.busiestDay,
    readingTimeSeconds: safeCount(stats?.totalReadingTime),

    currentStreak: safeCount(stats?.currentStreak),
    longestStreak: safeCount(stats?.longestStreak),

    favoritesCount,
    notesCount,
    highlightsCount,
    bookmarksCount,
    favoriteBook,
    mostReadBook,

    listeningTimeMs: listening.totalMs,
    versesHeard: listening.totalVerses,
    listeningDays: listening.daysListened,
    listeningCurrentStreak: lStreaks.currentStreak,
    listeningLongestStreak: lStreaks.longestStreak,

    cardsTotal: deck.total,
    versesMastered: deck.mastered,
    memoryReviews: history.summary.totalReviews,
    retentionPercent,
    memoryStreak: history.summary.currentStreak,

    achievementsUnlocked: safeCount(stats?.achievementsUnlocked),
    totalAchievements: safeCount(stats?.totalAchievements),
    level: Math.max(1, safeCount(stats?.level)),
    totalPoints: safeCount(stats?.totalPoints),

    journeyStartMs,
    daysSinceStart,
    hasData,
  };
}

/** Earliest reviewedAt across the review log, or null. */
function earliestReviewMs(events: ReviewEvent[]): number | null {
  let earliest: number | null = null;
  for (const e of events) {
    const ms = typeof e?.reviewedAt === 'number' ? e.reviewedAt : NaN;
    if (!Number.isFinite(ms)) continue;
    if (earliest === null || ms < earliest) earliest = ms;
  }
  return earliest;
}
