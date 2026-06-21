/**
 * Sprint 108 — custom-plan auto-distribute builder.
 */

import {
  buildCustomPlan,
  countChapters,
  daysToPassages,
  distributeChapters,
  inferPerDay,
  passagesToChapters,
  type PlanPassage,
} from '@/lib/reading/customPlanBuild';
import type {CustomReading} from '@/lib/together';

const john: PlanPassage = {bookId: 43, fromChapter: 1, toChapter: 21};

describe('passagesToChapters', () => {
  it('expands inclusive ranges across passages, in order', () => {
    const chapters = passagesToChapters([
      {bookId: 43, fromChapter: 1, toChapter: 3},
      {bookId: 19, fromChapter: 23, toChapter: 23},
    ]);
    expect(chapters).toEqual([
      [43, 1],
      [43, 2],
      [43, 3],
      [19, 23],
    ]);
  });

  it('tolerates a reversed range', () => {
    expect(
      passagesToChapters([{bookId: 1, fromChapter: 3, toChapter: 1}]),
    ).toEqual([
      [1, 1],
      [1, 2],
      [1, 3],
    ]);
  });
});

describe('countChapters', () => {
  it('counts inclusive chapters across passages', () => {
    expect(countChapters([john])).toBe(21);
    expect(
      countChapters([
        {bookId: 1, fromChapter: 1, toChapter: 1},
        {bookId: 1, fromChapter: 5, toChapter: 7},
      ]),
    ).toBe(4);
  });
});

describe('distributeChapters', () => {
  const chapters = passagesToChapters([john]); // 21 chapters

  it('returns [] for no chapters', () => {
    expect(distributeChapters([], {mode: 'perDay', chaptersPerDay: 3})).toEqual(
      [],
    );
  });

  it('perDay groups chapters in fixed-size days', () => {
    const days = distributeChapters(chapters, {
      mode: 'perDay',
      chaptersPerDay: 3,
    });
    expect(days).toHaveLength(7);
    expect(days.every(d => d.length === 3)).toBe(true);
  });

  it('perDay leaves a short final day for a remainder', () => {
    const days = distributeChapters(chapters, {
      mode: 'perDay',
      chaptersPerDay: 4,
    });
    expect(days).toHaveLength(6); // 4*5 + 1
    expect(days[5]).toHaveLength(1);
  });

  it('totalDays spreads evenly with no empty day', () => {
    const days = distributeChapters(chapters, {mode: 'totalDays', days: 7});
    expect(days).toHaveLength(7);
    expect(days.every(d => d.length >= 1)).toBe(true);
    // Every chapter placed exactly once, in order.
    expect(days.flat()).toEqual(chapters);
  });

  it('totalDays clamps days to the chapter count (never empty days)', () => {
    const three: CustomReading[] = [
      [1, 1],
      [1, 2],
      [1, 3],
    ];
    const days = distributeChapters(three, {mode: 'totalDays', days: 10});
    expect(days).toHaveLength(3);
    expect(days.every(d => d.length === 1)).toBe(true);
  });
});

describe('buildCustomPlan', () => {
  it('produces a valid, capped cplan bundle end-to-end', () => {
    const bundle = buildCustomPlan('Juan en una semana', [john], {
      mode: 'totalDays',
      days: 7,
    });
    expect(bundle.t).toBe('cplan');
    expect(bundle.n).toBe('Juan en una semana');
    expect(bundle.d).toHaveLength(7);
    expect(bundle.d.flat()).toHaveLength(21);
  });
});

describe('daysToPassages (Sprint 110 — editor reconstruction)', () => {
  it('coalesces consecutive chapters of one book across day boundaries', () => {
    const days: CustomReading[][] = [
      [
        [43, 1],
        [43, 2],
      ],
      [[43, 3]],
    ];
    expect(daysToPassages(days)).toEqual([
      {bookId: 43, fromChapter: 1, toChapter: 3},
    ]);
  });

  it('splits on a book change and on a chapter gap', () => {
    const days: CustomReading[][] = [
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [2, 5],
      ],
    ];
    expect(daysToPassages(days)).toEqual([
      {bookId: 1, fromChapter: 1, toChapter: 1},
      {bookId: 2, fromChapter: 1, toChapter: 2},
      {bookId: 2, fromChapter: 5, toChapter: 5},
    ]);
  });

  it('round-trips passages -> chapters -> days -> passages', () => {
    const passages: PlanPassage[] = [
      {bookId: 43, fromChapter: 1, toChapter: 5},
      {bookId: 19, fromChapter: 23, toChapter: 24},
    ];
    const days = distributeChapters(passagesToChapters(passages), {
      mode: 'perDay',
      chaptersPerDay: 3,
    });
    expect(daysToPassages(days)).toEqual(passages);
  });

  it('returns [] for no days', () => {
    expect(daysToPassages([])).toEqual([]);
  });
});

describe('inferPerDay', () => {
  it('returns the largest day length (>= 1)', () => {
    expect(
      inferPerDay([
        [
          [1, 1],
          [1, 2],
          [1, 3],
        ],
        [[1, 4]],
      ]),
    ).toBe(3);
    expect(inferPerDay([])).toBe(1);
  });

  it('matches the per-day count a plan was built with', () => {
    const days = distributeChapters(passagesToChapters([john]), {
      mode: 'perDay',
      chaptersPerDay: 4,
    });
    expect(inferPerDay(days)).toBe(4);
  });
});
