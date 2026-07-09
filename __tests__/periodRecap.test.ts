/**
 * Sprint 87 — the pure period recap ("Tu año/trimestre en la Palabra"). Pins
 * the window resolution (this year / this quarter, ending now) and the
 * per-period aggregation across reading, reviews, mastery, favorites, cards,
 * listening and mood — only windowable metrics, nothing from cumulative stats.
 */
import {
  buildPeriodRecap,
  periodWindow,
  type PeriodInput,
} from '../src/features/journey/periodRecap';
import type {MemoryCard, SrsBox} from '../src/lib/memory/srs';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';

// Wednesday 17 Jun 2026 — year starts Jan 1, quarter (Q2) starts Apr 1.
const NOW = new Date(2026, 5, 17, 12, 0, 0);
const ms = (y: number, mo: number, d: number) =>
  new Date(y, mo, d, 9).getTime();

const card = (addedAt: string): MemoryCard => ({
  verseKey: `k/${addedAt}`,
  bookName: 'John',
  chapter: 3,
  verse: 16,
  text: 't',
  version: 'RVR1960',
  box: 1 as SrsBox,
  dueAt: addedAt,
  addedAt,
  lastReviewedAt: null,
  reviewCount: 0,
  lapseCount: 0,
  ease: 1,
  updatedAt: Date.parse(addedAt),
});

const ev = (
  verseKey: string,
  boxBefore: SrsBox,
  boxAfter: SrsBox,
  reviewedAt: number,
): ReviewEvent => ({
  id: `${verseKey}__${reviewedAt}`,
  verseKey,
  bookName: verseKey.split('/')[0],
  grade: 'good',
  boxBefore,
  boxAfter,
  intervalDays: 1,
  reviewedAt,
});

const input: PeriodInput = {
  readingLog: [
    {date: '2026-06-10', versesRead: 20, timeSpent: 600}, // year + quarter
    {date: '2026-02-15', versesRead: 10, timeSpent: 300}, // year only
    {date: '2025-12-20', versesRead: 5, timeSpent: 100}, // neither
  ],
  reviewEvents: [
    ev('John/3/16', 4, 5, ms(2026, 5, 12)), // graduated, quarter
    ev('Psalms/23/1', 3, 4, ms(2026, 1, 15)), // review, year only
    ev('Matthew/5/9', 4, 5, ms(2025, 10, 1)), // last year
  ],
  cards: [card('2026-05-01'), card('2025-01-01')],
  favorites: [
    {book: 'John', createdAt: ms(2026, 4, 1)}, // quarter
    {book: 'Genesis', createdAt: ms(2026, 0, 5)}, // year only
    {book: 'X', createdAt: ms(2025, 5, 1)}, // neither
  ],
  listeningStats: {
    days: {
      '2026-06-09': {ms: 120000, verses: 8}, // quarter
      '2026-01-10': {ms: 60000, verses: 4}, // year only
      '2025-06-09': {ms: 99999, verses: 9}, // neither
    },
  },
  feelingsLog: {
    days: {'2026-06-15': 'grateful', '2026-05-01': 'joyful'},
  },
};

describe('periodWindow', () => {
  it('this year starts on Jan 1, this quarter on the quarter boundary', () => {
    const y = periodWindow('year', NOW);
    expect(new Date(y.start).getMonth()).toBe(0);
    expect(new Date(y.start).getDate()).toBe(1);
    expect(y.year).toBe(2026);

    const q = periodWindow('quarter', NOW);
    expect(q.quarter).toBe(2);
    expect(new Date(q.start).getMonth()).toBe(3); // April
    expect(new Date(q.start).getDate()).toBe(1);
  });
});

describe('buildPeriodRecap — year', () => {
  const r = buildPeriodRecap(input, 'year', NOW);
  it('aggregates everything since Jan 1', () => {
    expect(r.versesRead).toBe(30); // 20 + 10
    expect(r.readingTimeSeconds).toBe(900);
    expect(r.activeDays).toBe(2);
    expect(r.busiestDay?.date).toBe('2026-06-10');
    expect(r.memoryReviews).toBe(2); // John grad + Psalms review
    expect(r.versesMastered).toBe(1); // only John graduated
    expect(r.favoritesAdded).toBe(2);
    expect(r.cardsAdded).toBe(1);
    expect(r.listeningTimeMs).toBe(180000);
    expect(r.versesHeard).toBe(12);
    expect(r.listeningDays).toBe(2);
    expect(r.mood?.daysLogged).toBe(2);
    expect(r.hasData).toBe(true);
  });
});

describe('buildPeriodRecap — quarter', () => {
  const r = buildPeriodRecap(input, 'quarter', NOW);
  it('only counts activity since the quarter boundary (Apr 1)', () => {
    expect(r.versesRead).toBe(20); // Feb excluded
    expect(r.activeDays).toBe(1);
    expect(r.memoryReviews).toBe(1); // Feb review excluded
    expect(r.versesMastered).toBe(1);
    expect(r.favoritesAdded).toBe(1); // Jan favorite excluded
    expect(r.cardsAdded).toBe(1);
    expect(r.listeningDays).toBe(1); // Jan listening excluded
    expect(r.versesHeard).toBe(8);
    expect(r.mood?.daysLogged).toBe(2); // both check-ins are Apr–Jun
  });
});

describe('buildPeriodRecap — empty', () => {
  it('reports no data for an empty period', () => {
    const r = buildPeriodRecap(
      {readingLog: [], reviewEvents: [], cards: [], favorites: []},
      'quarter',
      NOW,
    );
    expect(r.hasData).toBe(false);
    expect(r.versesRead).toBe(0);
    expect(r.mood).toBeNull();
  });
});
