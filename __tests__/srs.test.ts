import {
  applyMask,
  applyReview,
  buildVerseKey,
  createCard,
  isMastered,
  MASK_LEVEL_PERCENT,
  maskLevelForBox,
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

describe('maskLevelForBox', () => {
  it('maps box → level (box-1)', () => {
    expect(maskLevelForBox(1)).toBe(0);
    expect(maskLevelForBox(2)).toBe(1);
    expect(maskLevelForBox(3)).toBe(2);
    expect(maskLevelForBox(4)).toBe(3);
    expect(maskLevelForBox(5)).toBe(4);
  });

  it('keeps percent table monotonic 0→100', () => {
    expect(MASK_LEVEL_PERCENT[0]).toBe(0);
    expect(MASK_LEVEL_PERCENT[1]).toBeLessThan(MASK_LEVEL_PERCENT[2]);
    expect(MASK_LEVEL_PERCENT[2]).toBeLessThan(MASK_LEVEL_PERCENT[3]);
    expect(MASK_LEVEL_PERCENT[3]).toBeLessThan(MASK_LEVEL_PERCENT[4]);
    expect(MASK_LEVEL_PERCENT[4]).toBe(100);
  });
});

describe('applyMask', () => {
  const TEXT = 'For God so loved the world that He gave His only Son.';

  it('level 0 returns the text untouched', () => {
    expect(applyMask(TEXT, 0)).toBe(TEXT);
  });

  it('level 1 hides every 4th word (~25%)', () => {
    // words: For(0) God(1) so(2) loved(3*) the(4) world(5) that(6) He(7*)
    //        gave(8) His(9) only(10) Son(11*) → indices 3,7,11 hidden
    const out = applyMask(TEXT, 1);
    expect(out).toBe('For God so _____ the world that __ gave His only ___.');
  });

  it('level 2 hides every other word (~50%)', () => {
    const out = applyMask(TEXT, 2);
    expect(out).toBe('For ___ so _____ the _____ that __ gave ___ only ___.');
  });

  it('level 3 hides 3 of every 4 words (~75%)', () => {
    const out = applyMask(TEXT, 3);
    // keep indices 0, 4, 8 → For, the, gave
    expect(out).toBe('For ___ __ _____ the _____ ____ __ gave ___ ____ ___.');
  });

  it('level 4 keeps only the first letter of every word', () => {
    const out = applyMask(TEXT, 4);
    expect(out).toBe('F__ G__ s_ l____ t__ w____ t___ H_ g___ H__ o___ S__.');
  });

  it('preserves punctuation and whitespace', () => {
    expect(applyMask('Jesus wept.', 4)).toBe('J____ w___.');
    expect(applyMask('Hi, John!', 2)).toBe('Hi, ____!');
  });

  it('handles accented Spanish letters via Unicode word class', () => {
    // "Señor" should fully mask at level 2 (every other word: idx 1)
    expect(applyMask('Mi Señor es bueno', 2)).toBe('Mi _____ es _____');
    // level 4 keeps the accented first letter as anchor
    expect(applyMask('Señor', 4)).toBe('S____');
  });

  it('returns empty string for empty input regardless of level', () => {
    expect(applyMask('', 3)).toBe('');
  });
});
