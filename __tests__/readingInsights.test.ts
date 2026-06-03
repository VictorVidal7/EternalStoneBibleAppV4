import {
  buildReadingInsights,
  readingLevelForVerses,
  ReadingInsightsInput,
} from '../src/features/reading-insights/readingInsights';

const MS_PER_DAY = 86_400_000;
// Fixed "now": 2026-06-02 12:00 UTC (matches the project's current date).
const NOW = Date.UTC(2026, 5, 2, 12, 0, 0);
const TODAY_NUM = Math.floor(NOW / MS_PER_DAY);

const emptyInput: ReadingInsightsInput = {
  readingLog: [],
  totals: {totalVersesRead: 0, totalChaptersRead: 0, totalBooksCompleted: 0},
  bookProgress: {},
};

describe('readingLevelForVerses', () => {
  it('buckets verse counts into 0..4', () => {
    expect(readingLevelForVerses(0)).toBe(0);
    expect(readingLevelForVerses(-5)).toBe(0);
    expect(readingLevelForVerses(1)).toBe(1);
    expect(readingLevelForVerses(15)).toBe(1);
    expect(readingLevelForVerses(16)).toBe(2);
    expect(readingLevelForVerses(40)).toBe(2);
    expect(readingLevelForVerses(41)).toBe(3);
    expect(readingLevelForVerses(90)).toBe(3);
    expect(readingLevelForVerses(91)).toBe(4);
    expect(readingLevelForVerses(500)).toBe(4);
  });
});

describe('buildReadingInsights', () => {
  it('returns a zeroed, no-data snapshot for empty input (but a full grid)', () => {
    const r = buildReadingInsights(emptyInput, NOW);
    expect(r.hasData).toBe(false);
    expect(r.activeDays).toBe(0);
    expect(r.currentStreak).toBe(0);
    expect(r.longestStreak).toBe(0);
    expect(r.mostReadBook).toBeNull();
    expect(r.windowVerses).toBe(0);
    // The heatmap is always a full Sunday-aligned grid, even with no activity.
    expect(r.heatmap.length).toBeGreaterThanOrEqual(16 * 7 + 1);
    expect(r.heatmap.length).toBeLessThanOrEqual(17 * 7);
    // The last cell is always today.
    expect(r.heatmap[r.heatmap.length - 1].dateMs).toBe(TODAY_NUM * MS_PER_DAY);
    expect(r.heatmap.every(c => c.count === 0 && c.level === 0)).toBe(true);
  });

  it('composes streak, momentum, best day and heatmap from the log', () => {
    const input: ReadingInsightsInput = {
      readingLog: [
        {date: '2026-06-02', versesRead: 30, timeSpent: 300}, // today
        {date: '2026-06-01', versesRead: 50, timeSpent: 600}, // yesterday
        {date: '2026-05-31', versesRead: 10, timeSpent: 120},
        {date: '2026-05-20', versesRead: 100, timeSpent: 900}, // 13 days ago
        {date: 'not-a-date', versesRead: 999, timeSpent: 999}, // tolerated/ignored
      ],
      totals: {
        totalVersesRead: 1422,
        totalChaptersRead: 46,
        totalBooksCompleted: 2,
      },
      bookProgress: {
        John: {3: 100, 4: 50, 5: 0},
        Genesis: {1: 100},
      },
    };

    const r = buildReadingInsights(input, NOW);

    expect(r.hasData).toBe(true);
    expect(r.activeDays).toBe(4); // 4 valid days; malformed entry dropped
    expect(r.bestDayVerses).toBe(100);
    expect(r.currentStreak).toBe(3); // 06-02, 06-01, 05-31 consecutive
    expect(r.longestStreak).toBe(3);
    expect(r.thisWeekVerses).toBe(90); // last 7 days: 30+50+10
    expect(r.lastWeekVerses).toBe(100); // 13 days ago falls in [7,14)
    expect(r.windowVerses).toBe(190); // all four valid days are in-window
    expect(r.totalVersesRead).toBe(1422);
    expect(r.totalChaptersRead).toBe(46);
    expect(r.totalBooksCompleted).toBe(2);
    // No real per-book log here → the chapters-touched PROXY (source 'progress').
    expect(r.mostReadBook).toEqual({
      book: 'John',
      chapters: 2,
      source: 'progress',
    });

    // Today's cell carries today's verses and the matching intensity level.
    const todayCell = r.heatmap[r.heatmap.length - 1];
    expect(todayCell.count).toBe(30);
    expect(todayCell.level).toBe(2);
  });

  it('derives reading-time metrics from the per-day log + lifetime totals', () => {
    const input: ReadingInsightsInput = {
      readingLog: [
        {date: '2026-06-02', versesRead: 30, timeSpent: 300}, // today
        {date: '2026-06-01', versesRead: 50, timeSpent: 600}, // yesterday
        {date: '2026-05-31', versesRead: 10, timeSpent: 120}, // 2 days ago
        {date: '2026-05-20', versesRead: 100, timeSpent: 900}, // 13 days ago
      ],
      totals: {
        totalVersesRead: 1422,
        totalChaptersRead: 46,
        totalBooksCompleted: 2,
        totalReadingSeconds: 9131,
      },
      bookProgress: {},
    };
    const r = buildReadingInsights(input, NOW);
    // Lifetime time comes from the authoritative UserStats total.
    expect(r.totalReadingSeconds).toBe(9131);
    // This-week = the three days within 7 days; the 13-days-ago day is excluded.
    expect(r.thisWeekReadingSeconds).toBe(1020); // 300 + 600 + 120
    // Best single day, ever (includes the out-of-week day).
    expect(r.bestDayReadingSeconds).toBe(900);
  });

  it('defaults reading-time to zero when totals omit it / log has no seconds', () => {
    const r = buildReadingInsights(
      {
        ...emptyInput,
        readingLog: [{date: '2026-06-02', versesRead: 10, timeSpent: 0}],
      },
      NOW,
    );
    expect(r.totalReadingSeconds).toBe(0);
    expect(r.thisWeekReadingSeconds).toBe(0);
    expect(r.bestDayReadingSeconds).toBe(0);
  });

  it('marks hasData via lifetime totals even when the daily log is empty', () => {
    const r = buildReadingInsights(
      {...emptyInput, totals: {...emptyInput.totals, totalVersesRead: 500}},
      NOW,
    );
    expect(r.hasData).toBe(true);
    expect(r.totalVersesRead).toBe(500);
    expect(r.activeDays).toBe(0);
  });

  it('aggregates duplicate day rows and ignores zero/negative verse days for active count', () => {
    const r = buildReadingInsights(
      {
        ...emptyInput,
        readingLog: [
          {date: '2026-06-02', versesRead: 10, timeSpent: 0},
          {date: '2026-06-02', versesRead: 20, timeSpent: 0}, // same day
          {date: '2026-06-01', versesRead: 0, timeSpent: 0}, // no verses
        ],
      },
      NOW,
    );
    expect(r.activeDays).toBe(1); // only 06-02 has verses
    const todayCell = r.heatmap[r.heatmap.length - 1];
    expect(todayCell.count).toBe(30); // 10 + 20 merged
  });

  it('never throws on malformed input', () => {
    const bad = {
      readingLog: null,
      totals: null,
      bookProgress: null,
    } as unknown as ReadingInsightsInput;
    expect(() => buildReadingInsights(bad, NOW)).not.toThrow();
  });

  describe('most-read book — real per-book log vs proxy', () => {
    it('prefers the REAL log (by verses) over the chapters-touched proxy', () => {
      const r = buildReadingInsights(
        {
          ...emptyInput,
          // Proxy would pick John (more chapters); the real log says Genesis.
          bookProgress: {John: {1: 100, 2: 100, 3: 100}, Genesis: {1: 100}},
          bookReadingLog: [
            {book: 'John', versesRead: 40, timeSpent: 120, lastReadAt: 2},
            {book: 'Genesis', versesRead: 200, timeSpent: 600, lastReadAt: 1},
          ],
        },
        NOW,
      );
      expect(r.mostReadBook).toEqual({
        book: 'Genesis',
        chapters: 1, // chapters touched, carried alongside the real metrics
        versesRead: 200,
        timeSpent: 600,
        source: 'log',
      });
    });

    it('falls back to the proxy when the real log is empty / all-zero', () => {
      const r = buildReadingInsights(
        {
          ...emptyInput,
          bookProgress: {Mark: {1: 100, 2: 50}},
          bookReadingLog: [
            {book: 'Mark', versesRead: 0, timeSpent: 30, lastReadAt: 1},
          ],
        },
        NOW,
      );
      expect(r.mostReadBook).toEqual({
        book: 'Mark',
        chapters: 2,
        source: 'progress',
      });
    });
  });
});
