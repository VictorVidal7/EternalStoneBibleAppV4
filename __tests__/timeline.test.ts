import {
  buildTimeline,
  timelineMonthKey,
  STREAK_RECORD_MIN,
  type TimelineInputs,
} from '../src/features/reading-insights/timeline';

function at(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day, 12, 0, 0).getTime();
}

const empty: TimelineInputs = {
  completedBooks: [],
  achievements: [],
  favorites: [],
  notes: [],
  highlights: [],
  plans: [],
  readingLog: [],
};

describe('timeline (Sprint 80 — Tu línea de tiempo)', () => {
  it('returns an empty feed for empty stores', () => {
    expect(buildTimeline(empty)).toEqual([]);
  });

  it('composes every source and sorts newest first', () => {
    const feed = buildTimeline({
      completedBooks: [{bookName: 'Genesis', completedAt: at(2026, 3, 10)}],
      achievements: [
        {
          id: 'first_verse',
          name: 'Primer verso',
          icon: 'book',
          isUnlocked: true,
          unlockedAt: at(2026, 1, 5),
        },
        {
          id: 'locked',
          name: 'Aún no',
          icon: 'lock-closed',
          isUnlocked: false,
        },
      ],
      favorites: [
        {book: 'John', chapter: 3, verse: 16, createdAt: at(2026, 2, 1)},
        {book: 'Psalms', chapter: 23, verse: 1, createdAt: at(2026, 4, 1)},
      ],
      notes: [],
      highlights: [],
      plans: [
        {
          planId: 'proverbs-month',
          startedAt: new Date(at(2026, 5, 2)).toISOString(),
        },
        {planId: 'never-started', startedAt: null},
      ],
      readingLog: [],
    });

    expect(feed.map(e => e.type)).toEqual([
      'plan-started',
      'book-completed',
      'first-favorite',
      'achievement',
    ]);
    expect(feed[1].subject).toBe('Genesis');
    // The FIRST favorite wins, not the latest.
    expect(feed[2].subject).toBe('John 3:16');
    expect(feed[3].icon).toBe('book');
  });

  it('accepts ISO-string stamps (bible.db notes) alongside ms numbers', () => {
    const feed = buildTimeline({
      ...empty,
      notes: [
        {
          book: '1 Peter',
          chapter: 4,
          verse: 8,
          createdAt: new Date(at(2026, 6, 11)).toISOString(),
        },
        {book: 'John', chapter: 1, verse: 1, createdAt: 'not a date'},
      ],
    });
    expect(feed).toHaveLength(1);
    expect(feed[0]).toMatchObject({
      type: 'first-note',
      subject: '1 Peter 4:8',
      timestamp: at(2026, 6, 11),
    });
  });

  it('skips events without a real date instead of inventing one', () => {
    const feed = buildTimeline({
      ...empty,
      completedBooks: [{bookName: 'Exodus', completedAt: NaN}],
      achievements: [{id: 'a', name: 'A', icon: 'star', isUnlocked: true}],
      favorites: [{book: 'John', chapter: 1, verse: 1}],
    });
    expect(feed).toEqual([]);
  });

  describe('streak records', () => {
    it('emits one event per record run, at the run end, with the length', () => {
      const feed = buildTimeline({
        ...empty,
        readingLog: [
          // A 3-day run (record), a gap, a 2-day run (no record), a 5-day run.
          {date: '2026-01-01'},
          {date: '2026-01-02'},
          {date: '2026-01-03'},
          {date: '2026-01-10'},
          {date: '2026-01-11'},
          {date: '2026-02-01'},
          {date: '2026-02-02'},
          {date: '2026-02-03'},
          {date: '2026-02-04'},
          {date: '2026-02-05'},
        ],
      });
      expect(feed).toHaveLength(2);
      expect(feed[0]).toMatchObject({
        type: 'streak-record',
        subject: '5',
        timestamp: at(2026, 2, 5),
      });
      expect(feed[1]).toMatchObject({subject: '3', timestamp: at(2026, 1, 3)});
    });

    it(`ignores runs shorter than ${STREAK_RECORD_MIN} days and ties with the best`, () => {
      const feed = buildTimeline({
        ...empty,
        readingLog: [
          {date: '2026-01-01'},
          {date: '2026-01-02'},
          {date: '2026-01-03'},
          // Another 3-day run — ties the record, no new event.
          {date: '2026-03-01'},
          {date: '2026-03-02'},
          {date: '2026-03-03'},
        ],
      });
      expect(feed).toHaveLength(1);
      expect(feed[0].subject).toBe('3');
    });

    it('collapses duplicate day rows and survives malformed dates', () => {
      const feed = buildTimeline({
        ...empty,
        readingLog: [
          {date: '2026-01-01'},
          {date: '2026-01-01'},
          {date: 'garbage'},
          {date: '2026-01-02'},
          {date: '2026-01-03'},
        ],
      });
      expect(feed).toHaveLength(1);
      expect(feed[0].subject).toBe('3');
    });
  });

  it('timelineMonthKey groups by local month', () => {
    expect(timelineMonthKey(at(2026, 6, 12))).toBe('2026-06');
    expect(timelineMonthKey(at(2026, 11, 1))).toBe('2026-11');
  });
});

describe('plan-completed (Sprint 81)', () => {
  const at = (y: number, m: number, d: number) =>
    new Date(y, m - 1, d, 12).getTime();

  it('emits a completion event when the stamp exists, after its start', () => {
    const feed = buildTimeline({
      completedBooks: [],
      achievements: [],
      favorites: [],
      notes: [],
      highlights: [],
      plans: [
        {
          planId: 'gospels-30',
          startedAt: new Date(at(2026, 5, 1)).toISOString(),
          completedAt: new Date(at(2026, 6, 10)).toISOString(),
        },
      ],
      readingLog: [],
    });
    expect(feed.map(e => e.type)).toEqual(['plan-completed', 'plan-started']);
    expect(feed[0].subject).toBe('gospels-30');
    expect(feed[0].id).toBe('plan-completed:gospels-30');
  });

  it('honestly omits plans completed before the stamp existed', () => {
    const feed = buildTimeline({
      completedBooks: [],
      achievements: [],
      favorites: [],
      notes: [],
      highlights: [],
      plans: [
        {
          planId: 'pre-s81',
          startedAt: new Date(at(2026, 1, 1)).toISOString(),
          completedAt: null,
        },
      ],
      readingLog: [],
    });
    expect(feed.map(e => e.type)).toEqual(['plan-started']);
  });

  it('ignores a malformed completion stamp', () => {
    const feed = buildTimeline({
      completedBooks: [],
      achievements: [],
      favorites: [],
      notes: [],
      highlights: [],
      plans: [{planId: 'bad', startedAt: null, completedAt: 'garbage'}],
      readingLog: [],
    });
    expect(feed).toEqual([]);
  });
});
