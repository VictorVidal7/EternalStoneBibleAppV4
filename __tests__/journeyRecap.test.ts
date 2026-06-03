/**
 * Sprint 57 — "Tu camino" journey-recap pure-module tests.
 *
 * Covers the aggregation contract the Wrapped story screen depends on:
 *  - empty input → coherent zeroed shape, hasData=false, nulls where due
 *  - UserStats mapping (verses/chapters/books/streaks/notes/highlights)
 *  - reading-log summary (active days only count days with verses, busiest)
 *  - most-favorited book (count desc, alphabetical tie-break) + count
 *  - memorization composition (masterySummary + computeReviewHistory)
 *  - journey start = earliest footprint; daysSinceStart inclusive
 *  - hasData true when ANY single signal exists
 *  - defensive coercion of non-finite / negative / malformed input
 *
 * Pure module — no SQLite / React, deterministic with an injected `now`.
 */

import {
  buildJourneyRecap,
  type JourneyInput,
  type ReadingDay,
  type JourneyFavoriteLike,
} from '../src/features/journey/journeyRecap';
import type {UserStats} from '../src/lib/achievements/types';
import type {MemoryCard} from '../src/lib/memory/srs';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 4, 30, 12, 0, 0); // fixed local noon
const daysAgoMs = (n: number): number => NOW.getTime() - n * DAY;

function makeStats(over: Partial<UserStats> = {}): UserStats {
  return {
    totalVersesRead: 0,
    totalChaptersRead: 0,
    totalBooksCompleted: 0,
    totalReadingTime: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: '',
    totalHighlights: 0,
    totalNotes: 0,
    totalFavorites: 0,
    totalBookmarks: 0,
    totalSearches: 0,
    totalShares: 0,
    level: 1,
    totalPoints: 0,
    pointsToNextLevel: 0,
    achievementsUnlocked: 0,
    totalAchievements: 50,
    ...over,
  };
}

function makeCard(over: Partial<MemoryCard> = {}): MemoryCard {
  return {
    verseKey: 'Juan/3/16',
    bookName: 'Juan',
    chapter: 3,
    verse: 16,
    text: 'Porque de tal manera amó Dios al mundo…',
    version: 'RVR1960',
    box: 1,
    dueAt: new Date(NOW.getTime() + DAY).toISOString(),
    addedAt: new Date(daysAgoMs(10)).toISOString(),
    lastReviewedAt: null,
    reviewCount: 0,
    ease: 1.0,
    updatedAt: daysAgoMs(10),
    ...over,
  };
}

function makeEvent(over: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    id: 'Juan/3/16__1',
    verseKey: 'Juan/3/16',
    bookName: 'Juan',
    grade: 'good',
    boxBefore: 1,
    boxAfter: 2,
    intervalDays: 2,
    reviewedAt: daysAgoMs(1),
    ...over,
  };
}

const emptyInput: JourneyInput = {
  stats: makeStats(),
  readingLog: [],
  reviewEvents: [],
  cards: [],
  favorites: [],
};

describe('buildJourneyRecap', () => {
  it('returns a coherent zeroed shape on empty input', () => {
    const r = buildJourneyRecap(emptyInput, NOW);
    expect(r.hasData).toBe(false);
    expect(r.versesRead).toBe(0);
    expect(r.chaptersRead).toBe(0);
    expect(r.activeDays).toBe(0);
    expect(r.busiestDay).toBeNull();
    expect(r.favoriteBook).toBeNull();
    expect(r.cardsTotal).toBe(0);
    expect(r.versesMastered).toBe(0);
    expect(r.memoryReviews).toBe(0);
    expect(r.retentionPercent).toBeNull();
    expect(r.journeyStartMs).toBeNull();
    expect(r.daysSinceStart).toBeNull();
    expect(r.level).toBe(1);
  });

  it('maps UserStats reading + engagement fields through', () => {
    const r = buildJourneyRecap(
      {
        ...emptyInput,
        stats: makeStats({
          totalVersesRead: 1234,
          totalChaptersRead: 89,
          totalBooksCompleted: 3,
          currentStreak: 5,
          longestStreak: 12,
          totalNotes: 7,
          totalHighlights: 21,
          totalBookmarks: 4,
          achievementsUnlocked: 9,
          totalAchievements: 50,
          level: 4,
          totalPoints: 640,
          totalReadingTime: 9131, // seconds
        }),
      },
      NOW,
    );
    expect(r.versesRead).toBe(1234);
    expect(r.readingTimeSeconds).toBe(9131);
    expect(r.chaptersRead).toBe(89);
    expect(r.booksCompleted).toBe(3);
    expect(r.currentStreak).toBe(5);
    expect(r.longestStreak).toBe(12);
    expect(r.notesCount).toBe(7);
    expect(r.highlightsCount).toBe(21);
    expect(r.bookmarksCount).toBe(4);
    expect(r.achievementsUnlocked).toBe(9);
    expect(r.totalAchievements).toBe(50);
    expect(r.level).toBe(4);
    expect(r.totalPoints).toBe(640);
    expect(r.hasData).toBe(true);
  });

  it('summarizes the reading log: active days count only days with verses, plus the busiest', () => {
    const log: ReadingDay[] = [
      {date: '2026-05-28', versesRead: 10, timeSpent: 5},
      {date: '2026-05-29', versesRead: 0, timeSpent: 0}, // not active
      {date: '2026-05-30', versesRead: 45, timeSpent: 9}, // busiest
    ];
    const r = buildJourneyRecap(
      {...emptyInput, stats: makeStats({totalVersesRead: 55}), readingLog: log},
      NOW,
    );
    expect(r.activeDays).toBe(2);
    expect(r.busiestDay).toEqual({date: '2026-05-30', versesRead: 45});
  });

  it('picks the most-favorited book with an alphabetical tie-break', () => {
    const favorites: JourneyFavoriteLike[] = [
      {book: 'Salmos', createdAt: daysAgoMs(20)},
      {book: 'Salmos', createdAt: daysAgoMs(19)},
      {book: 'Juan', createdAt: daysAgoMs(18)},
      {book: 'Génesis', createdAt: daysAgoMs(17)},
      {book: 'Génesis', createdAt: daysAgoMs(16)}, // tie 2 vs Salmos 2
    ];
    const r = buildJourneyRecap({...emptyInput, favorites}, NOW);
    expect(r.favoritesCount).toBe(5);
    // Génesis and Salmos both have 2; Génesis sorts first.
    expect(r.favoriteBook).toEqual({book: 'Génesis', count: 2});
  });

  it('composes deck mastery from masterySummary', () => {
    const cards: MemoryCard[] = [
      makeCard({verseKey: 'Juan/3/16', box: 5}),
      makeCard({verseKey: 'Salmos/23/1', box: 5}),
      makeCard({verseKey: 'Romanos/8/28', box: 2}),
    ];
    const r = buildJourneyRecap({...emptyInput, cards}, NOW);
    expect(r.cardsTotal).toBe(3);
    expect(r.versesMastered).toBe(2);
    expect(r.hasData).toBe(true);
  });

  it('composes memorization history (reviews, retention %, streak)', () => {
    const events: ReviewEvent[] = [
      makeEvent({
        id: 'a__1',
        intervalDays: 2,
        grade: 'good',
        reviewedAt: daysAgoMs(1),
      }),
      makeEvent({
        id: 'b__1',
        intervalDays: 3,
        grade: 'again',
        reviewedAt: daysAgoMs(1),
      }),
      makeEvent({
        id: 'c__1',
        intervalDays: null,
        grade: 'good',
        reviewedAt: daysAgoMs(0),
      }),
    ];
    const r = buildJourneyRecap({...emptyInput, reviewEvents: events}, NOW);
    expect(r.memoryReviews).toBe(3);
    // 2 reviews had a prior interval; 1 recalled → 50%.
    expect(r.retentionPercent).toBe(50);
    expect(r.memoryStreak).toBeGreaterThanOrEqual(1);
    expect(r.hasData).toBe(true);
  });

  it('derives the journey start from the earliest footprint and an inclusive day count', () => {
    const r = buildJourneyRecap(
      {
        ...emptyInput,
        stats: makeStats({totalVersesRead: 10}),
        readingLog: [{date: '2026-05-20', versesRead: 4, timeSpent: 2}],
        favorites: [{book: 'Juan', createdAt: daysAgoMs(40)}], // earliest
      },
      NOW,
    );
    expect(r.journeyStartMs).toBe(daysAgoMs(40));
    expect(r.daysSinceStart).toBe(41); // inclusive
  });

  it('reports hasData=true when only a single signal exists (favorites)', () => {
    const r = buildJourneyRecap(
      {...emptyInput, favorites: [{book: 'Juan', createdAt: daysAgoMs(1)}]},
      NOW,
    );
    expect(r.hasData).toBe(true);
    expect(r.favoritesCount).toBe(1);
  });

  it('defensively coerces non-finite / negative stats and floors level to ≥ 1', () => {
    const r = buildJourneyRecap(
      {
        ...emptyInput,
        stats: makeStats({
          totalVersesRead: -5 as unknown as number,
          totalChaptersRead: NaN as unknown as number,
          level: 0,
        }),
      },
      NOW,
    );
    expect(r.versesRead).toBe(0);
    expect(r.chaptersRead).toBe(0);
    expect(r.level).toBe(1);
  });

  it('skips malformed reading-log rows without throwing', () => {
    const log = [
      {date: '', versesRead: 9, timeSpent: 0}, // bad date, but verses count as active
      {date: '2026-05-30', versesRead: -3, timeSpent: 0}, // negative → not active
      {date: 'not-a-date', versesRead: 2, timeSpent: 0},
    ] as ReadingDay[];
    const r = buildJourneyRecap(
      {...emptyInput, stats: makeStats({totalVersesRead: 11}), readingLog: log},
      NOW,
    );
    // Two rows have positive verses (the empty-date one and the 'not-a-date' one).
    expect(r.activeDays).toBe(2);
    expect(typeof r.versesRead).toBe('number');
  });
});
