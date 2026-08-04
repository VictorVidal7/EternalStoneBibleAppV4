import {
  boxDistribution,
  computeDeckInsights,
  FORECAST_HORIZON_DAYS,
  masterySummary,
  reviewForecast,
  strugglingCards,
  STRUGGLE_MAX_BOX,
  STRUGGLE_MIN_REVIEWS,
} from '../src/lib/memory/insights';
import {createCard, MemoryCard} from '../src/lib/memory/srs';

const T0 = new Date('2026-01-01T12:00:00.000Z');
const DAY_MS = 24 * 60 * 60 * 1000;

/** Build a card seeded at T0, then apply overrides (box, reviewCount, …). */
function mk(over: Partial<MemoryCard> = {}): MemoryCard {
  const base = createCard({
    verseKey: over.verseKey ?? 'John/3/16',
    bookName: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world…',
    version: 'KJV',
    now: T0.toISOString(),
  });
  return {...base, ...over};
}

/** ISO timestamp `days` whole days from T0 (negative = overdue). */
function dueIn(days: number): string {
  return new Date(T0.getTime() + days * DAY_MS).toISOString();
}

describe('boxDistribution', () => {
  it('returns five zero-filled boxes for an empty deck', () => {
    const dist = boxDistribution([]);
    expect(dist).toHaveLength(5);
    expect(dist.map(d => d.box)).toEqual([1, 2, 3, 4, 5]);
    expect(dist.every(d => d.count === 0)).toBe(true);
  });

  it('counts cards per box and keeps boxes 1-5 in order', () => {
    const dist = boxDistribution([
      mk({box: 1, verseKey: 'a'}),
      mk({box: 1, verseKey: 'b'}),
      mk({box: 3, verseKey: 'c'}),
      mk({box: 5, verseKey: 'd'}),
      mk({box: 5, verseKey: 'e'}),
      mk({box: 5, verseKey: 'f'}),
    ]);
    expect(dist.map(d => d.count)).toEqual([2, 0, 1, 0, 3]);
  });

  it('clamps an out-of-range box into the 1-5 buckets', () => {
    const dist = boxDistribution([
      mk({box: 9 as never, verseKey: 'hi'}),
      mk({box: 0 as never, verseKey: 'lo'}),
    ]);
    expect(dist[0].count).toBe(1); // box 0 → clamped to 1
    expect(dist[4].count).toBe(1); // box 9 → clamped to 5
  });
});

describe('strugglingCards', () => {
  it('excludes cards below the review threshold', () => {
    const result = strugglingCards([
      mk({box: 1, reviewCount: STRUGGLE_MIN_REVIEWS - 1, verseKey: 'fresh'}),
    ]);
    expect(result).toHaveLength(0);
  });

  it('excludes cards that have graduated past the struggle box', () => {
    const result = strugglingCards([
      mk({
        box: (STRUGGLE_MAX_BOX + 1) as never,
        reviewCount: 9,
        verseKey: 'graduated',
      }),
      mk({box: 5, reviewCount: 10, verseKey: 'mastered'}),
    ]);
    expect(result).toHaveLength(0);
  });

  it('includes low-box high-review cards sorted hardest-first', () => {
    const result = strugglingCards([
      mk({box: 2, reviewCount: 3, verseKey: 'mid'}), // score 3*4 = 12
      mk({box: 1, reviewCount: 5, verseKey: 'worst'}), // score 5*5 = 25
      mk({box: 1, reviewCount: 1, verseKey: 'skip'}), // below threshold
    ]);
    expect(result.map(r => r.card.verseKey)).toEqual(['worst', 'mid']);
    expect(result[0].score).toBe(25);
    expect(result[1].score).toBe(12);
  });

  it('breaks score ties by reviewCount then verseKey deterministically', () => {
    const result = strugglingCards([
      mk({box: 1, reviewCount: 4, verseKey: 'zeta'}), // score 4*5 = 20
      mk({box: 2, reviewCount: 5, verseKey: 'alpha'}), // score 5*4 = 20
    ]);
    // Equal score (20) → higher reviewCount (5) wins.
    expect(result.map(r => r.card.verseKey)).toEqual(['alpha', 'zeta']);
  });
});

describe('reviewForecast', () => {
  it('produces a bucket per horizon day, zero-filled', () => {
    const fc = reviewForecast([], T0);
    expect(fc).toHaveLength(FORECAST_HORIZON_DAYS);
    expect(fc.map(d => d.offset)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(fc.every(d => d.count === 0)).toBe(true);
  });

  it('folds overdue cards into today (offset 0)', () => {
    const fc = reviewForecast(
      [mk({dueAt: dueIn(-3), verseKey: 'overdue'}), mk({dueAt: dueIn(0)})],
      T0,
    );
    expect(fc[0].count).toBe(2);
  });

  it('buckets future cards by rounded day offset', () => {
    const fc = reviewForecast(
      [
        mk({dueAt: dueIn(1), verseKey: 'a'}),
        mk({dueAt: dueIn(1), verseKey: 'b'}),
        mk({dueAt: dueIn(3), verseKey: 'c'}),
      ],
      T0,
    );
    expect(fc[1].count).toBe(2);
    expect(fc[3].count).toBe(1);
  });

  it('drops cards due beyond the horizon', () => {
    const fc = reviewForecast([mk({dueAt: dueIn(30), verseKey: 'far'})], T0, 7);
    expect(fc.reduce((s, d) => s + d.count, 0)).toBe(0);
  });

  it('honors a custom horizon length', () => {
    const fc = reviewForecast([], T0, 3);
    expect(fc).toHaveLength(3);
  });
});

// `dueAt` (srs.ts computeDueDate) preserves the time-of-day of the review
// that scheduled a card rather than normalizing to midnight, so it can sit
// anywhere in the day. reviewForecast used to bucket cards by rounding a
// RAW millisecond gap to a day count, which — same bug class as
// `formatRelativeDate` on the deck screen — could put a card in the wrong
// forecast bar whenever `dueAt`'s clock-time didn't match `now`'s. These
// cases use LOCAL Date constructors (not UTC) so a card's calendar day is
// unambiguous regardless of the test runner's timezone.
describe('reviewForecast — midnight-normalized day diff', () => {
  it('buckets a card as "today" (offset 0) once `now` has rolled past midnight into its due day, even though the raw ms gap alone would round up to "tomorrow"', () => {
    const due = new Date(2026, 0, 2, 19, 0, 0); // due 7pm Jan 2
    const now = new Date(2026, 0, 2, 0, 30, 0); // checked 00:30 Jan 2 — ~18.5h raw gap
    const fc = reviewForecast([mk({dueAt: due.toISOString()})], now);
    expect(fc[0].count).toBe(1);
    expect(fc[1].count).toBe(0);
  });

  it('buckets a card as "tomorrow" (offset 1) when it is due just after midnight but `now` is minutes before that midnight, even though the raw ms gap alone would round down to "today"', () => {
    const due = new Date(2026, 0, 2, 1, 0, 0); // due 1am Jan 2
    const now = new Date(2026, 0, 1, 23, 50, 0); // checked 23:50 Jan 1 — ~1h10m raw gap
    const fc = reviewForecast([mk({dueAt: due.toISOString()})], now);
    expect(fc[0].count).toBe(0);
    expect(fc[1].count).toBe(1);
  });

  it('buckets a multi-day-away card into the correct calendar-day offset, not one short', () => {
    const due = new Date(2026, 0, 4, 6, 0, 0); // due Jan 4, 6am
    const now = new Date(2026, 0, 1, 22, 0, 0); // checked Jan 1, 10pm — ~56h raw gap
    const fc = reviewForecast([mk({dueAt: due.toISOString()})], now);
    expect(fc[3].count).toBe(1); // offset 3 = Jan 4, the correct calendar-day gap
    expect(fc[2].count).toBe(0); // a raw-ms round would have placed it here instead
  });
});

describe('masterySummary', () => {
  it('returns all zeros for an empty deck', () => {
    expect(masterySummary([], T0)).toEqual({
      total: 0,
      mastered: 0,
      due: 0,
      masteredPercent: 0,
      averageBox: 0,
      totalReviews: 0,
    });
  });

  it('computes mastery, due, average box and total reviews', () => {
    const summary = masterySummary(
      [
        mk({box: 1, reviewCount: 0, dueAt: dueIn(-1), verseKey: 'a'}), // due
        mk({box: 5, reviewCount: 4, dueAt: dueIn(5), verseKey: 'b'}), // mastered
        mk({box: 5, reviewCount: 6, dueAt: dueIn(8), verseKey: 'c'}), // mastered
        mk({box: 3, reviewCount: 2, dueAt: dueIn(0), verseKey: 'd'}), // due
      ],
      T0,
    );
    expect(summary.total).toBe(4);
    expect(summary.mastered).toBe(2);
    expect(summary.masteredPercent).toBe(50);
    expect(summary.averageBox).toBe(3.5); // (1+5+5+3)/4
    expect(summary.totalReviews).toBe(12); // 0+4+6+2
    expect(summary.due).toBe(2); // dueIn(-1) and dueIn(0)
  });
});

describe('computeDeckInsights', () => {
  it('bundles all four insight sets in one pass', () => {
    const cards = [
      mk({box: 1, reviewCount: 5, dueAt: dueIn(0), verseKey: 'struggle'}),
      mk({box: 5, reviewCount: 3, dueAt: dueIn(2), verseKey: 'mastered'}),
    ];
    const insights = computeDeckInsights(cards, T0);
    expect(insights.distribution).toHaveLength(5);
    expect(insights.forecast).toHaveLength(FORECAST_HORIZON_DAYS);
    expect(insights.summary.total).toBe(2);
    expect(insights.summary.mastered).toBe(1);
    expect(insights.struggling.map(s => s.card.verseKey)).toEqual(['struggle']);
  });
});
