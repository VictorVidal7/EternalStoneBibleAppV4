import {
  coerceMemoryStatsSummary,
  computeMemoryStatsSummary,
  dayCounts,
  earliestReviewMs,
  localRetentionBands,
  mergeRecentDays,
  mergeRetentionBands,
  minMs,
  pruneRecentDays,
  RECENT_DAYS_WINDOW,
  summarySignature,
  type MemoryStatsSummary,
} from '../src/lib/memory/memoryStats';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';

// Thursday 2026-05-28 12:00 local — mirrors history.test's NOW.
const NOW = new Date(2026, 4, 28, 12, 0, 0, 0);

/** Local midnight of `ms`. */
function sod(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Millis at noon on the day `offset` calendar days from NOW. */
function dayAt(offset: number): number {
  const d = new Date(NOW);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getTime();
}

/** recentDays key (local-midnight-ms string) for `offset` days from NOW. */
function key(offset: number): string {
  return String(sod(dayAt(offset)));
}

function mkEvent(
  over: Partial<ReviewEvent> & {reviewedAt: number},
): ReviewEvent {
  return {
    id: over.id ?? `John/3/16__${over.reviewedAt}`,
    verseKey: over.verseKey ?? 'John/3/16',
    bookName: over.bookName ?? 'John',
    grade: over.grade ?? 'good',
    boxBefore: over.boxBefore ?? 1,
    boxAfter: over.boxAfter ?? 2,
    intervalDays: over.intervalDays === undefined ? null : over.intervalDays,
    reviewedAt: over.reviewedAt,
  };
}

describe('dayCounts', () => {
  it('tallies reviews per local day, keyed by midnight-ms string', () => {
    const events = [
      mkEvent({reviewedAt: dayAt(0)}),
      mkEvent({reviewedAt: dayAt(0)}),
      mkEvent({reviewedAt: dayAt(-2)}),
    ];
    expect(dayCounts(events)).toEqual({[key(0)]: 2, [key(-2)]: 1});
  });
});

describe('mergeRecentDays', () => {
  it('lets local win on shared days and keeps floor-only days', () => {
    const floor = {[key(-1)]: 5, [key(-2)]: 2};
    const local = {[key(-1)]: 1, [key(0)]: 3};
    expect(mergeRecentDays(floor, local)).toEqual({
      [key(-2)]: 2, // floor only
      [key(-1)]: 1, // local wins
      [key(0)]: 3, // local only
    });
  });

  it('treats a missing floor as empty', () => {
    expect(mergeRecentDays(undefined, {[key(0)]: 2})).toEqual({[key(0)]: 2});
  });
});

describe('pruneRecentDays', () => {
  it('drops days older than the window start', () => {
    const days = {[key(0)]: 1, [key(-5)]: 1, [key(-500)]: 1};
    const windowStart = sod(dayAt(-10));
    expect(pruneRecentDays(days, windowStart)).toEqual({
      [key(0)]: 1,
      [key(-5)]: 1,
    });
  });
});

describe('localRetentionBands', () => {
  it('reduces the review log into per-band totals', () => {
    const events = [
      mkEvent({reviewedAt: dayAt(0), intervalDays: 1, grade: 'good'}),
      mkEvent({reviewedAt: dayAt(0), intervalDays: 1, grade: 'again'}),
      mkEvent({reviewedAt: dayAt(0), intervalDays: null}), // first-ever: no band
    ];
    const bands = localRetentionBands(events);
    expect(bands.d1).toEqual({total: 2, recalled: 1});
  });
});

describe('mergeRetentionBands', () => {
  it('sums totals and recalls per band', () => {
    const floor = {d1: {total: 4, recalled: 3}, d2_3: {total: 1, recalled: 1}};
    const local = {d1: {total: 2, recalled: 2}};
    expect(mergeRetentionBands(floor, local)).toEqual({
      d1: {total: 6, recalled: 5},
      d2_3: {total: 1, recalled: 1},
    });
  });

  it('treats a missing floor as empty', () => {
    const local = {d1: {total: 2, recalled: 1}};
    expect(mergeRetentionBands(undefined, local)).toEqual(local);
  });
});

describe('earliestReviewMs / minMs', () => {
  it('finds the earliest reviewedAt, or null when empty', () => {
    expect(earliestReviewMs([])).toBeNull();
    expect(
      earliestReviewMs([
        mkEvent({reviewedAt: 300}),
        mkEvent({reviewedAt: 100}),
        mkEvent({reviewedAt: 200}),
      ]),
    ).toBe(100);
  });

  it('minMs ignores nulls', () => {
    expect(minMs(null, null)).toBeNull();
    expect(minMs(5, null)).toBe(5);
    expect(minMs(null, 5)).toBe(5);
    expect(minMs(9, 4)).toBe(4);
  });
});

describe('computeMemoryStatsSummary', () => {
  it('summarizes local events with no floor (the source device)', () => {
    const events = [
      mkEvent({reviewedAt: dayAt(0), intervalDays: 1, grade: 'good'}),
      mkEvent({reviewedAt: dayAt(-1), intervalDays: 1, grade: 'again'}),
    ];
    const s = computeMemoryStatsSummary(events, null, NOW);
    expect(s.updatedAt).toBe(NOW.getTime());
    expect(s.earliestReviewMs).toBe(dayAt(-1));
    expect(s.longestStreak).toBe(2); // two consecutive days
    expect(s.recentDays).toEqual({[key(0)]: 1, [key(-1)]: 1});
    expect(s.retentionBands.d1).toEqual({total: 2, recalled: 1});
  });

  it('merges monotonic fields with the frozen floor (a seeded device)', () => {
    // Local only has a review today; the floor (from the old device) is richer.
    const events = [
      mkEvent({reviewedAt: dayAt(0), intervalDays: 1, grade: 'good'}),
    ];
    const floor: MemoryStatsSummary = {
      updatedAt: 1,
      longestStreak: 9,
      earliestReviewMs: dayAt(-300),
      recentDays: {[key(-1)]: 2, [key(-2)]: 1},
      retentionBands: {d1: {total: 5, recalled: 4}},
    };
    const s = computeMemoryStatsSummary(events, floor, NOW);
    expect(s.longestStreak).toBe(9); // floor beats local
    expect(s.earliestReviewMs).toBe(dayAt(-300)); // floor is earlier
    // Floor days preserved, local day added (local would win any overlap).
    expect(s.recentDays).toEqual({
      [key(-2)]: 1,
      [key(-1)]: 2,
      [key(0)]: 1,
    });
    // Bands summed (disjoint floor + local, no double count).
    expect(s.retentionBands.d1).toEqual({total: 6, recalled: 5});
  });

  it('prunes recentDays to the retained window', () => {
    const floor: MemoryStatsSummary = {
      updatedAt: 1,
      longestStreak: 0,
      earliestReviewMs: null,
      // One day just inside the window, one well outside it.
      recentDays: {
        [key(-(RECENT_DAYS_WINDOW - 1))]: 1,
        [key(-(RECENT_DAYS_WINDOW + 30))]: 1,
      },
      retentionBands: {},
    };
    const s = computeMemoryStatsSummary([], floor, NOW);
    expect(s.recentDays).toEqual({[key(-(RECENT_DAYS_WINDOW - 1))]: 1});
  });
});

describe('summarySignature', () => {
  const base: MemoryStatsSummary = {
    updatedAt: 100,
    longestStreak: 3,
    earliestReviewMs: 50,
    recentDays: {[key(0)]: 1},
    retentionBands: {d1: {total: 1, recalled: 1}},
  };

  it('is stable across a pure updatedAt change (so writes are skippable)', () => {
    expect(summarySignature({...base, updatedAt: 999})).toBe(
      summarySignature(base),
    );
  });

  it('changes when a material field changes', () => {
    expect(summarySignature({...base, longestStreak: 4})).not.toBe(
      summarySignature(base),
    );
  });
});

describe('coerceMemoryStatsSummary', () => {
  it('rejects non-objects', () => {
    expect(coerceMemoryStatsSummary(null)).toBeNull();
    expect(coerceMemoryStatsSummary(42)).toBeNull();
  });

  it('parses a well-formed doc', () => {
    const doc = {
      updatedAt: 10,
      longestStreak: 4,
      earliestReviewMs: 99,
      recentDays: {[key(0)]: 2},
      retentionBands: {d1: {total: 3, recalled: 2}},
    };
    expect(coerceMemoryStatsSummary(doc)).toEqual(doc);
  });

  it('defends against missing / malformed fields', () => {
    const s = coerceMemoryStatsSummary({
      longestStreak: -5, // invalid → 0
      earliestReviewMs: 'nope', // invalid → null
      recentDays: {good: 3, bad: 'x'}, // drops the non-numeric
      retentionBands: {d1: {total: 2}}, // missing recalled → 0
    });
    expect(s).toEqual({
      updatedAt: 0,
      longestStreak: 0,
      earliestReviewMs: null,
      recentDays: {good: 3},
      retentionBands: {d1: {total: 2, recalled: 0}},
    });
  });
});
