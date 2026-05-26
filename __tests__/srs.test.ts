import {
  applyReview,
  buildVerseKey,
  createCard,
  isMastered,
  MemoryCard,
  selectDueCards,
  SRS_BOX_INTERVALS_DAYS,
} from '../src/lib/memory/srs';

const T0 = new Date('2026-01-01T12:00:00.000Z');

function freshCard(over: Partial<MemoryCard> = {}): MemoryCard {
  const base = createCard({
    verseKey: 'John/3/16',
    bookName: 'John',
    chapter: 3,
    verse: 16,
    text: 'For God so loved the world…',
    version: 'KJV',
    now: T0.toISOString(),
  });
  return {...base, ...over};
}

function daysFromT0(days: number): Date {
  const d = new Date(T0.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

describe('createCard', () => {
  it('seeds the card in box 1 due immediately', () => {
    const c = freshCard();
    expect(c.box).toBe(1);
    expect(c.dueAt).toBe(T0.toISOString());
    expect(c.lastReviewedAt).toBeNull();
    expect(c.reviewCount).toBe(0);
  });
});

describe('applyReview — again', () => {
  it('resets a box-3 card to box 1 due immediately', () => {
    const c = freshCard({box: 3, reviewCount: 4});
    const next = applyReview(c, 'again', T0);
    expect(next.box).toBe(1);
    expect(next.dueAt).toBe(T0.toISOString());
    expect(next.lastReviewedAt).toBe(T0.toISOString());
    expect(next.reviewCount).toBe(5);
  });

  it('keeps a box-1 card in box 1 (no negatives)', () => {
    const c = freshCard({box: 1});
    const next = applyReview(c, 'again', T0);
    expect(next.box).toBe(1);
  });
});

describe('applyReview — hard', () => {
  it('keeps the box and schedules +1 day', () => {
    const c = freshCard({box: 3});
    const next = applyReview(c, 'hard', T0);
    expect(next.box).toBe(3);
    expect(new Date(next.dueAt).toISOString()).toBe(
      daysFromT0(1).toISOString(),
    );
  });
});

describe('applyReview — good', () => {
  it('promotes box 1 → 2 with the 1-day interval', () => {
    const next = applyReview(freshCard({box: 1}), 'good', T0);
    expect(next.box).toBe(2);
    expect(new Date(next.dueAt).toISOString()).toBe(
      daysFromT0(SRS_BOX_INTERVALS_DAYS[2]).toISOString(),
    );
  });

  it('promotes box 4 → 5 with the 30-day interval', () => {
    const next = applyReview(freshCard({box: 4}), 'good', T0);
    expect(next.box).toBe(5);
    expect(new Date(next.dueAt).toISOString()).toBe(
      daysFromT0(30).toISOString(),
    );
  });

  it('clamps at box 5 (cannot go beyond)', () => {
    const next = applyReview(freshCard({box: 5}), 'good', T0);
    expect(next.box).toBe(5);
  });
});

describe('applyReview — easy', () => {
  it('jumps box 1 → 3 with the 3-day interval', () => {
    const next = applyReview(freshCard({box: 1}), 'easy', T0);
    expect(next.box).toBe(3);
    expect(new Date(next.dueAt).toISOString()).toBe(
      daysFromT0(3).toISOString(),
    );
  });

  it('clamps the +2 jump at box 5', () => {
    const next = applyReview(freshCard({box: 4}), 'easy', T0);
    expect(next.box).toBe(5);
  });
});

describe('selectDueCards', () => {
  it('includes cards whose dueAt is in the past', () => {
    const cards = [
      freshCard({verseKey: 'past', dueAt: daysFromT0(-1).toISOString()}),
      freshCard({verseKey: 'today', dueAt: T0.toISOString()}),
      freshCard({verseKey: 'future', dueAt: daysFromT0(1).toISOString()}),
    ];
    const due = selectDueCards(cards, T0);
    expect(due.map(c => c.verseKey)).toEqual(['past', 'today']);
  });
});

describe('isMastered', () => {
  it('is true only at box 5', () => {
    expect(isMastered(freshCard({box: 5}))).toBe(true);
    expect(isMastered(freshCard({box: 4}))).toBe(false);
    expect(isMastered(freshCard({box: 1}))).toBe(false);
  });
});

describe('buildVerseKey', () => {
  it('joins book/chapter/verse', () => {
    expect(buildVerseKey('John', 3, 16)).toBe('John/3/16');
  });
});
