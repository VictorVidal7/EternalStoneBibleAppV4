import {
  computeReviewHistory,
  computeReviewHistoryWithFloor,
  findLeeches,
  HEATMAP_WEEKS,
  historySummary,
  LEECH_MIN_LAPSES,
  MAX_HEATMAP_WEEKS,
  retentionByBook,
  retentionByInterval,
  retentionByIntervalWithFloor,
  retentionTrend,
  reviewHeatmap,
  reviewHeatmapWithFloor,
  TREND_MONTHS,
  weeksSinceFirstEvent,
  type HeatmapCell,
} from '../src/lib/memory/history';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';
import type {MemoryCard} from '../src/lib/memory/srs';
import type {MemoryStatsSummary} from '../src/lib/memory/memoryStats';

/** Local-midnight-ms key for `offset` days from NOW (the recentDays key form). */
function dayKey(offset: number): string {
  return String(sod(dayAt(NOW, offset)));
}

/** A minimal MemoryCard for the findLeeches cards-floor tests. */
function mkCard(over: Partial<MemoryCard> & {verseKey: string}): MemoryCard {
  return {
    verseKey: over.verseKey,
    bookName: over.bookName ?? 'John',
    chapter: over.chapter ?? 3,
    verse: over.verse ?? 16,
    text: over.text ?? 'text',
    version: over.version ?? 'KJV',
    box: over.box ?? 1,
    dueAt: over.dueAt ?? NOW.toISOString(),
    addedAt: over.addedAt ?? NOW.toISOString(),
    lastReviewedAt: over.lastReviewedAt ?? null,
    reviewCount: over.reviewCount ?? 0,
    lapseCount: over.lapseCount ?? 0,
    ease: over.ease ?? 1,
    updatedAt: over.updatedAt ?? NOW.getTime(),
  };
}

// Thursday 2026-05-28 12:00 local — getDay() === 4. Constructed via the
// numeric ctor so it's local time, matching history.ts's local-day logic.
const NOW = new Date(2026, 4, 28, 12, 0, 0, 0);

/** Local midnight of `ms` — mirrors the module's private startOfLocalDay. */
function sod(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Millis at `hour` on the day `offset` calendar days from `now`. */
function dayAt(now: Date, offset: number, hour = 12): number {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d.getTime();
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

/** N events on the day `offset` from NOW, all with the given grade. */
function eventsOnDay(
  offset: number,
  count: number,
  grade: ReviewEvent['grade'] = 'good',
): ReviewEvent[] {
  return Array.from({length: count}, (_, k) =>
    mkEvent({reviewedAt: dayAt(NOW, offset, 9 + k), grade, intervalDays: 1}),
  );
}

function cellForOffset(
  cells: HeatmapCell[],
  offset: number,
): HeatmapCell | undefined {
  const target = sod(dayAt(NOW, offset));
  return cells.find(c => c.dateMs === target);
}

describe('reviewHeatmap', () => {
  it('builds a Sunday-aligned grid ending today for an empty log', () => {
    const hm = reviewHeatmap([], NOW);
    // (17-1)*7 + weekday(Thu=4) + 1 = 117 cells.
    expect(hm.cells).toHaveLength((HEATMAP_WEEKS - 1) * 7 + 4 + 1);
    expect(hm.weeks).toBe(HEATMAP_WEEKS);
    // First cell is a Sunday; last cell is today.
    expect(new Date(hm.cells[0].dateMs).getDay()).toBe(0);
    expect(hm.cells[hm.cells.length - 1].dateMs).toBe(sod(NOW.getTime()));
    // Empty log → everything flat.
    expect(hm.maxCount).toBe(0);
    expect(hm.windowTotal).toBe(0);
    expect(hm.cells.every(c => c.count === 0 && c.level === 0)).toBe(true);
  });

  it('tallies reviews into the right day and aggregates totals', () => {
    const events = [
      ...eventsOnDay(0, 1), // today
      ...eventsOnDay(-1, 2), // yesterday
      ...eventsOnDay(-3, 4), // three days ago
    ];
    const hm = reviewHeatmap(events, NOW);
    expect(cellForOffset(hm.cells, 0)?.count).toBe(1);
    expect(cellForOffset(hm.cells, -1)?.count).toBe(2);
    expect(cellForOffset(hm.cells, -3)?.count).toBe(4);
    expect(hm.maxCount).toBe(4);
    expect(hm.windowTotal).toBe(7);
  });

  it('maps counts to intensity levels on the documented thresholds', () => {
    const hm = reviewHeatmap(
      [
        ...eventsOnDay(-1, 1), // → level 1
        ...eventsOnDay(-2, 3), // → level 2
        ...eventsOnDay(-3, 6), // → level 3
        ...eventsOnDay(-4, 7), // → level 4
      ],
      NOW,
    );
    expect(cellForOffset(hm.cells, -1)?.level).toBe(1);
    expect(cellForOffset(hm.cells, -2)?.level).toBe(2);
    expect(cellForOffset(hm.cells, -3)?.level).toBe(3);
    expect(cellForOffset(hm.cells, -4)?.level).toBe(4);
  });

  it('drops reviews older than the window', () => {
    const hm = reviewHeatmap(eventsOnDay(-200, 5), NOW);
    expect(hm.windowTotal).toBe(0);
  });

  it('honors a custom week span', () => {
    const hm = reviewHeatmap([], NOW, 4);
    expect(hm.weeks).toBe(4);
    expect(hm.cells).toHaveLength((4 - 1) * 7 + 4 + 1);
  });
});

describe('retentionByInterval', () => {
  it('returns the fixed six bands zero-filled for an empty log', () => {
    const r = retentionByInterval([]);
    expect(r.map(b => b.key)).toEqual([
      'd1',
      'd2_3',
      'd4_7',
      'd8_14',
      'd15_30',
      'd30plus',
    ]);
    expect(r.every(b => b.total === 0 && b.retention === null)).toBe(true);
  });

  it('excludes first-ever reviews (intervalDays null)', () => {
    const r = retentionByInterval([
      mkEvent({reviewedAt: dayAt(NOW, -1), intervalDays: null}),
    ]);
    expect(r.every(b => b.total === 0)).toBe(true);
  });

  it('buckets by elapsed interval and computes the recall rate', () => {
    const r = retentionByInterval([
      mkEvent({reviewedAt: 1, intervalDays: 0, grade: 'good'}),
      mkEvent({reviewedAt: 2, intervalDays: 1, grade: 'again'}),
      mkEvent({reviewedAt: 3, intervalDays: 1, grade: 'hard'}),
      mkEvent({reviewedAt: 4, intervalDays: 3, grade: 'easy'}),
      mkEvent({reviewedAt: 5, intervalDays: 10, grade: 'good'}),
      mkEvent({reviewedAt: 6, intervalDays: 20, grade: 'again'}),
      mkEvent({reviewedAt: 7, intervalDays: 45, grade: 'good'}),
    ]);
    const byKey = Object.fromEntries(r.map(b => [b.key, b]));
    // d1 band holds intervals 0 and 1: 3 events, 2 recalled (good, hard).
    expect(byKey.d1.total).toBe(3);
    expect(byKey.d1.recalled).toBe(2);
    expect(byKey.d1.retention).toBeCloseTo(2 / 3);
    expect(byKey.d2_3.total).toBe(1); // interval 3 (easy → recalled)
    expect(byKey.d2_3.retention).toBe(1);
    expect(byKey.d8_14.total).toBe(1); // interval 10
    expect(byKey.d15_30.total).toBe(1); // interval 20 (again → 0)
    expect(byKey.d15_30.retention).toBe(0);
    expect(byKey.d30plus.total).toBe(1); // interval 45
    expect(byKey.d4_7.total).toBe(0); // empty band stays null
    expect(byKey.d4_7.retention).toBeNull();
  });
});

describe('historySummary', () => {
  it('returns all zeros / null for an empty log', () => {
    const s = historySummary([], NOW);
    expect(s).toEqual({
      totalReviews: 0,
      reviewsToday: 0,
      reviewsLast7: 0,
      reviewsLast30: 0,
      activeDays: 0,
      currentStreak: 0,
      longestStreak: 0,
      overallRetention: null,
      reviewsWithInterval: 0,
    });
  });

  it('counts rolling 7/30-day windows and distinct active days', () => {
    const events = [
      ...eventsOnDay(0, 2),
      ...eventsOnDay(-3, 1),
      ...eventsOnDay(-10, 1),
      ...eventsOnDay(-40, 1),
    ];
    const s = historySummary(events, NOW);
    expect(s.totalReviews).toBe(5);
    expect(s.reviewsToday).toBe(2); // the 2 events on day 0
    expect(s.reviewsLast7).toBe(3); // today(2) + 3-days-ago(1)
    expect(s.reviewsLast30).toBe(4); // + 10-days-ago(1)
    expect(s.activeDays).toBe(4);
  });

  it('measures the current streak ending today', () => {
    const events = [
      ...eventsOnDay(0, 1),
      ...eventsOnDay(-1, 1),
      ...eventsOnDay(-2, 1),
      ...eventsOnDay(-5, 1), // gap → outside the current run
    ];
    expect(historySummary(events, NOW).currentStreak).toBe(3);
  });

  it('keeps the streak alive through yesterday when today is empty', () => {
    const events = [...eventsOnDay(-1, 1), ...eventsOnDay(-2, 1)];
    expect(historySummary(events, NOW).currentStreak).toBe(2);
  });

  it('finds the longest historical run of consecutive days', () => {
    const events = [
      ...eventsOnDay(-20, 1),
      ...eventsOnDay(-19, 1),
      ...eventsOnDay(-18, 1),
      ...eventsOnDay(-17, 1), // run of 4
      ...eventsOnDay(-1, 1),
      ...eventsOnDay(0, 1), // run of 2 (current)
    ];
    const s = historySummary(events, NOW);
    expect(s.longestStreak).toBe(4);
    expect(s.currentStreak).toBe(2);
  });

  it('computes overall retention only over reviews with a prior review', () => {
    const events = [
      mkEvent({reviewedAt: dayAt(NOW, 0), intervalDays: null, grade: 'good'}),
      mkEvent({reviewedAt: dayAt(NOW, -1), intervalDays: 2, grade: 'good'}),
      mkEvent({reviewedAt: dayAt(NOW, -2), intervalDays: 3, grade: 'again'}),
      mkEvent({reviewedAt: dayAt(NOW, -3), intervalDays: 4, grade: 'easy'}),
    ];
    // 3 events have an interval; 2 recalled → 2/3.
    const s = historySummary(events, NOW);
    expect(s.overallRetention).toBeCloseTo(2 / 3);
    // The same 3 interval-bearing reviews are the calibration sample size.
    expect(s.reviewsWithInterval).toBe(3);
  });
});

describe('findLeeches', () => {
  /** `count` events for a verse, `lapses` of which are graded "again". */
  function cardEvents(
    verseKey: string,
    bookName: string,
    total: number,
    lapses: number,
  ): ReviewEvent[] {
    return Array.from({length: total}, (_, k) =>
      mkEvent({
        verseKey,
        bookName,
        id: `${verseKey}__${k}`,
        reviewedAt: 1000 + k,
        grade: k < lapses ? 'again' : 'good',
      }),
    );
  }

  it('returns nothing for an empty log', () => {
    expect(findLeeches([])).toEqual([]);
  });

  it('flags only verses at or above the lapse threshold', () => {
    const events = [
      ...cardEvents('John/3/16', 'John', 5, LEECH_MIN_LAPSES), // exactly threshold → leech
      ...cardEvents('Psalms/23/1', 'Psalms', 4, LEECH_MIN_LAPSES - 1), // below → not
      ...cardEvents('Romans/8/28', 'Romans', 2, 0), // no lapses → not
    ];
    const leeches = findLeeches(events);
    expect(leeches.map(l => l.verseKey)).toEqual(['John/3/16']);
    expect(leeches[0].totalReviews).toBe(5);
    expect(leeches[0].lapses).toBe(LEECH_MIN_LAPSES);
    expect(leeches[0].lapseRate).toBeCloseTo(LEECH_MIN_LAPSES / 5);
  });

  it('sorts hardest first (lapses → lapse rate → verseKey)', () => {
    const events = [
      ...cardEvents('B/1/1', 'B', 10, 4), // 4 lapses, rate 0.4
      ...cardEvents('A/1/1', 'A', 5, 5), // 5 lapses, rate 1.0
      ...cardEvents('C/1/1', 'C', 6, 4), // 4 lapses, rate ~0.67
    ];
    const leeches = findLeeches(events);
    // A (5 lapses) first; then C (4 lapses, higher rate) before B (4, lower).
    expect(leeches.map(l => l.verseKey)).toEqual(['A/1/1', 'C/1/1', 'B/1/1']);
  });

  it('honors a custom minimum-lapses threshold', () => {
    const events = cardEvents('John/3/16', 'John', 3, 1);
    expect(findLeeches(events, 1).map(l => l.verseKey)).toEqual(['John/3/16']);
    expect(findLeeches(events, 2)).toEqual([]);
  });

  it('keeps the book name and last-reviewed from the most recent event', () => {
    const events = [
      mkEvent({
        verseKey: 'X/1/1',
        bookName: 'Old',
        reviewedAt: 100,
        grade: 'again',
      }),
      mkEvent({
        verseKey: 'X/1/1',
        bookName: 'New',
        reviewedAt: 300,
        grade: 'again',
      }),
      mkEvent({
        verseKey: 'X/1/1',
        bookName: 'Mid',
        reviewedAt: 200,
        grade: 'again',
      }),
    ];
    const [leech] = findLeeches(events, 3);
    expect(leech.bookName).toBe('New');
    expect(leech.lastReviewedAt).toBe(300);
  });

  it('surfaces a leech from the cards floor when the local log is empty', () => {
    // Fresh device: the synced deck carries lapseCount but the review log is
    // empty. The card alone must be enough to flag the leech.
    const cards = [
      mkCard({
        verseKey: 'John/3/16',
        bookName: 'John',
        reviewCount: 8,
        lapseCount: 4,
      }),
      mkCard({
        verseKey: 'Psalms/23/1',
        bookName: 'Psalms',
        reviewCount: 5,
        lapseCount: 1,
      }),
    ];
    const leeches = findLeeches([], LEECH_MIN_LAPSES, cards);
    expect(leeches.map(l => l.verseKey)).toEqual(['John/3/16']);
    expect(leeches[0].totalReviews).toBe(8);
    expect(leeches[0].lapses).toBe(4);
    expect(leeches[0].lapseRate).toBeCloseTo(0.5);
  });

  it('takes the max of the event log and the card floor per verse', () => {
    // Log shows 2 lapses; card carries 4 → the card floor dominates.
    const events = cardEvents('John/3/16', 'John', 3, 2);
    const cards = [
      mkCard({verseKey: 'John/3/16', reviewCount: 9, lapseCount: 4}),
    ];
    const [leech] = findLeeches(events, LEECH_MIN_LAPSES, cards);
    expect(leech.totalReviews).toBe(9); // max(3, 9)
    expect(leech.lapses).toBe(4); // max(2, 4)
    expect(leech.lapseRate).toBeLessThanOrEqual(1);
  });

  it('is unaffected by cards with fewer lapses than the log', () => {
    const events = cardEvents('John/3/16', 'John', 6, 5);
    const cards = [
      mkCard({verseKey: 'John/3/16', reviewCount: 2, lapseCount: 1}),
    ];
    const [leech] = findLeeches(events, LEECH_MIN_LAPSES, cards);
    expect(leech.totalReviews).toBe(6); // max(6, 2)
    expect(leech.lapses).toBe(5); // max(5, 1)
  });

  it('behaves exactly like the events-only signature when cards omitted', () => {
    const events = cardEvents('John/3/16', 'John', 5, LEECH_MIN_LAPSES);
    expect(findLeeches(events)).toEqual(findLeeches(events, LEECH_MIN_LAPSES));
    expect(findLeeches(events, LEECH_MIN_LAPSES, [])).toEqual(
      findLeeches(events),
    );
  });
});

describe('computeReviewHistory', () => {
  it('bundles heatmap, retention, summary, and leeches consistently', () => {
    const events = [
      ...eventsOnDay(0, 2, 'good'),
      ...eventsOnDay(-1, 1, 'again'),
    ];
    const h = computeReviewHistory(events, NOW);
    expect(h.heatmap.windowTotal).toBe(3);
    expect(h.summary.totalReviews).toBe(3);
    expect(h.retention).toHaveLength(6);
    // eventsOnDay stamps intervalDays:1 → all land in the d1 band.
    const d1 = h.retention.find(b => b.key === 'd1');
    expect(d1?.total).toBe(3);
    expect(d1?.recalled).toBe(2); // the two 'good', not the 'again'
    // Only one 'again' total here → below the leech threshold.
    expect(h.leeches).toEqual([]);
  });
});

describe('reviewHeatmapWithFloor', () => {
  it('folds floor day counts in where the local log is empty', () => {
    const floorDays = {[dayKey(-1)]: 3, [dayKey(-2)]: 2};
    const h = reviewHeatmapWithFloor([], NOW, floorDays);
    expect(h.windowTotal).toBe(5);
    const yesterday = h.cells.find(c => c.dateMs === sod(dayAt(NOW, -1)));
    expect(yesterday?.count).toBe(3);
  });

  it('lets local reviews win on a day the floor also covers', () => {
    const floorDays = {[dayKey(0)]: 9};
    const events = eventsOnDay(0, 2, 'good'); // 2 real reviews today
    const h = reviewHeatmapWithFloor(events, NOW, floorDays);
    const today = h.cells.find(c => c.dateMs === sod(dayAt(NOW, 0)));
    expect(today?.count).toBe(2); // local wins, not the floor's 9
  });

  it('matches reviewHeatmap when there is no floor', () => {
    const events = [...eventsOnDay(0, 2), ...eventsOnDay(-3, 1)];
    expect(reviewHeatmapWithFloor(events, NOW, undefined)).toEqual(
      reviewHeatmap(events, NOW),
    );
  });
});

describe('retentionByIntervalWithFloor', () => {
  it('sums floor band totals on top of the local ones', () => {
    const events = eventsOnDay(0, 2, 'good'); // 2 in d1, both recalled
    const floorBands = {d1: {total: 4, recalled: 3}};
    const buckets = retentionByIntervalWithFloor(events, floorBands);
    const d1 = buckets.find(b => b.key === 'd1')!;
    expect(d1.total).toBe(6); // 2 local + 4 floor
    expect(d1.recalled).toBe(5); // 2 local + 3 floor
    expect(d1.retention).toBeCloseTo(5 / 6);
  });

  it('matches retentionByInterval when there is no floor', () => {
    const events = eventsOnDay(0, 3, 'again');
    expect(retentionByIntervalWithFloor(events, undefined)).toEqual(
      retentionByInterval(events),
    );
  });
});

describe('computeReviewHistoryWithFloor', () => {
  it('reproduces computeReviewHistory with a null floor and no cards', () => {
    const events = [
      ...eventsOnDay(0, 2, 'good'),
      ...eventsOnDay(-1, 1, 'again'),
    ];
    expect(computeReviewHistoryWithFloor(events, NOW, null)).toEqual(
      computeReviewHistory(events, NOW),
    );
  });

  it('drives streak / heatmap / retention from the floor on a fresh device', () => {
    // Empty local log; floor carries 3 consecutive prior days + history.
    const floor: MemoryStatsSummary = {
      updatedAt: NOW.getTime(),
      longestStreak: 12,
      earliestReviewMs: dayAt(NOW, -300),
      recentDays: {[dayKey(-1)]: 1, [dayKey(-2)]: 1, [dayKey(-3)]: 1},
      retentionBands: {d1: {total: 10, recalled: 8}},
    };
    const h = computeReviewHistoryWithFloor([], NOW, floor);
    // currentStreak: today has no review → grace, count back through the
    // 3 consecutive floor days.
    expect(h.summary.currentStreak).toBe(3);
    expect(h.summary.activeDays).toBe(3);
    expect(h.summary.longestStreak).toBe(12); // floor beats local 0
    expect(h.heatmap.windowTotal).toBe(3);
    const d1 = h.retention.find(b => b.key === 'd1')!;
    expect(d1.total).toBe(10);
    expect(d1.retention).toBeCloseTo(0.8);
  });

  it('takes the max of local and floor longestStreak', () => {
    // Local has a 2-day streak; floor claims 1 → local wins.
    const events = [...eventsOnDay(0, 1), ...eventsOnDay(-1, 1)];
    const floor: MemoryStatsSummary = {
      updatedAt: NOW.getTime(),
      longestStreak: 1,
      earliestReviewMs: null,
      recentDays: {},
      retentionBands: {},
    };
    const h = computeReviewHistoryWithFloor(events, NOW, floor);
    expect(h.summary.longestStreak).toBe(2);
  });

  it('passes cards through to findLeeches', () => {
    const cards = [
      mkCard({verseKey: 'John/3/16', reviewCount: 8, lapseCount: 4}),
    ];
    const h = computeReviewHistoryWithFloor([], NOW, null, cards);
    expect(h.leeches.map(l => l.verseKey)).toEqual(['John/3/16']);
  });
});

describe('weeksSinceFirstEvent', () => {
  it('falls back to HEATMAP_WEEKS for an empty log', () => {
    expect(weeksSinceFirstEvent([], NOW)).toBe(HEATMAP_WEEKS);
  });

  it('never returns less than HEATMAP_WEEKS for a very recent log', () => {
    const events = [mkEvent({reviewedAt: dayAt(NOW, 0)})];
    expect(weeksSinceFirstEvent(events, NOW)).toBe(HEATMAP_WEEKS);
  });

  it('grows to cover a much older first event', () => {
    // First event 400 days ago → needs more than HEATMAP_WEEKS.
    const events = [mkEvent({reviewedAt: dayAt(NOW, -400)})];
    const weeks = weeksSinceFirstEvent(events, NOW);
    expect(weeks).toBeGreaterThan(HEATMAP_WEEKS);
    expect(weeks).toBeGreaterThanOrEqual(Math.ceil(401 / 7));
  });

  it('caps at MAX_HEATMAP_WEEKS for an extremely old first event', () => {
    const events = [mkEvent({reviewedAt: dayAt(NOW, -10000)})];
    expect(weeksSinceFirstEvent(events, NOW)).toBe(MAX_HEATMAP_WEEKS);
  });

  it('uses the earliest event regardless of array order', () => {
    const events = [
      mkEvent({reviewedAt: dayAt(NOW, -10)}),
      mkEvent({reviewedAt: dayAt(NOW, -400)}),
      mkEvent({reviewedAt: dayAt(NOW, -50)}),
    ];
    expect(weeksSinceFirstEvent(events, NOW)).toBe(
      weeksSinceFirstEvent([mkEvent({reviewedAt: dayAt(NOW, -400)})], NOW),
    );
  });
});

describe('retentionByBook', () => {
  it('returns nothing for an empty log', () => {
    expect(retentionByBook([])).toEqual([]);
  });

  it('aggregates totals, eligible reviews, and retention per book', () => {
    const events = [
      // John: 2 eligible (1 recalled), 1 first-ever (not eligible).
      mkEvent({bookName: 'John', reviewedAt: 1, intervalDays: null}),
      mkEvent({
        bookName: 'John',
        reviewedAt: 2,
        intervalDays: 3,
        grade: 'good',
      }),
      mkEvent({
        bookName: 'John',
        reviewedAt: 3,
        intervalDays: 5,
        grade: 'again',
      }),
      // Psalms: 1 eligible, recalled.
      mkEvent({
        bookName: 'Psalms',
        reviewedAt: 4,
        intervalDays: 2,
        grade: 'good',
      }),
    ];
    const rows = retentionByBook(events);
    const john = rows.find(r => r.bookName === 'John')!;
    expect(john.totalReviews).toBe(3);
    expect(john.reviewsWithInterval).toBe(2);
    expect(john.recalled).toBe(1);
    expect(john.retention).toBeCloseTo(0.5);

    const psalms = rows.find(r => r.bookName === 'Psalms')!;
    expect(psalms.totalReviews).toBe(1);
    expect(psalms.retention).toBe(1);
  });

  it('reports null retention for a book with no eligible reviews yet', () => {
    const rows = retentionByBook([
      mkEvent({bookName: 'Genesis', reviewedAt: 1, intervalDays: null}),
    ]);
    expect(rows[0].reviewsWithInterval).toBe(0);
    expect(rows[0].retention).toBeNull();
  });

  it('sorts most-reviewed book first, alphabetically breaking ties', () => {
    const events = [
      mkEvent({bookName: 'Z', reviewedAt: 1, intervalDays: 1}),
      mkEvent({bookName: 'Z', reviewedAt: 2, intervalDays: 1}),
      mkEvent({bookName: 'A', reviewedAt: 3, intervalDays: 1}),
      mkEvent({bookName: 'A', reviewedAt: 4, intervalDays: 1}),
      mkEvent({bookName: 'M', reviewedAt: 5, intervalDays: 1}),
    ];
    expect(retentionByBook(events).map(r => r.bookName)).toEqual([
      'A',
      'Z',
      'M',
    ]);
  });
});

describe('retentionTrend', () => {
  it('returns TREND_MONTHS zero-filled points for an empty log', () => {
    const points = retentionTrend([], NOW);
    expect(points).toHaveLength(TREND_MONTHS);
    expect(points.every(p => p.total === 0 && p.retention === null)).toBe(true);
    // Chronological, ending with the current month.
    const lastMonth = new Date(points[points.length - 1].monthStartMs);
    expect(lastMonth.getFullYear()).toBe(NOW.getFullYear());
    expect(lastMonth.getMonth()).toBe(NOW.getMonth());
  });

  it('buckets eligible reviews by calendar month and computes retention', () => {
    const thisMonth = new Date(NOW.getFullYear(), NOW.getMonth(), 15).getTime();
    const lastMonth = new Date(
      NOW.getFullYear(),
      NOW.getMonth() - 1,
      15,
    ).getTime();
    const events = [
      mkEvent({reviewedAt: thisMonth, intervalDays: 2, grade: 'good'}),
      mkEvent({reviewedAt: thisMonth, intervalDays: 3, grade: 'again'}),
      mkEvent({reviewedAt: lastMonth, intervalDays: 1, grade: 'good'}),
      // First-ever review this month — excluded from the eligible totals.
      mkEvent({reviewedAt: thisMonth, intervalDays: null}),
    ];
    const points = retentionTrend(events, NOW);
    const current = points[points.length - 1];
    const previous = points[points.length - 2];
    expect(current.total).toBe(2);
    expect(current.recalled).toBe(1);
    expect(current.retention).toBeCloseTo(0.5);
    expect(previous.total).toBe(1);
    expect(previous.retention).toBe(1);
  });

  it('ignores reviews outside the requested window', () => {
    const wayBack = new Date(
      NOW.getFullYear() - 5,
      NOW.getMonth(),
      1,
    ).getTime();
    const points = retentionTrend(
      [mkEvent({reviewedAt: wayBack, intervalDays: 1})],
      NOW,
    );
    expect(points.reduce((sum, p) => sum + p.total, 0)).toBe(0);
  });

  it('honors a custom month count', () => {
    expect(retentionTrend([], NOW, 3)).toHaveLength(3);
    expect(retentionTrend([], NOW, 24)).toHaveLength(24);
  });
});
