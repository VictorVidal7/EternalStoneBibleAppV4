/**
 * Sprint 86 — the pure weekly mastery challenge. Pins the "mastered this week"
 * derivation (only graduations to box 5 inside the Mon-anchored week, distinct
 * verses), the reviews-this-week count, the focus list ordering, and the
 * target clamp / week boundary.
 */
import {
  DEFAULT_WEEKLY_TARGET,
  MAX_WEEKLY_TARGET,
  MIN_WEEKLY_TARGET,
  buildWeeklyChallenge,
  clampWeeklyTarget,
  startOfLocalWeek,
} from '../src/lib/memory/weeklyChallenge';
import type {MemoryCard, SrsBox} from '../src/lib/memory/srs';
import type {ReviewEvent} from '../src/lib/memory/reviewEvents';
import type {ReviewGrade} from '../src/lib/memory/srs';

const card = (
  verseKey: string,
  box: SrsBox,
  dueAt = '2026-06-20',
): MemoryCard => {
  const [bookName, c, v] = verseKey.split('/');
  return {
    verseKey,
    bookName,
    chapter: Number(c),
    verse: Number(v),
    text: 'snapshot',
    version: 'RVR1960',
    box,
    dueAt,
    addedAt: '2026-05-01',
    lastReviewedAt: '2026-06-16',
    reviewCount: 3,
    lapseCount: 0,
    ease: 1,
    updatedAt: Date.parse('2026-06-16'),
  };
};

const ev = (
  verseKey: string,
  boxBefore: SrsBox,
  boxAfter: SrsBox,
  reviewedAt: number,
  grade: ReviewGrade = 'good',
): ReviewEvent => ({
  id: `${verseKey}__${reviewedAt}`,
  verseKey,
  bookName: verseKey.split('/')[0],
  grade,
  boxBefore,
  boxAfter,
  intervalDays: 1,
  reviewedAt,
});

// Wednesday 2026-06-17 → the week starts Monday 2026-06-15.
const NOW = new Date(2026, 5, 17, 12, 0, 0);
const ms = (y: number, mo: number, d: number) =>
  new Date(y, mo, d, 9).getTime();

describe('clampWeeklyTarget', () => {
  it('defaults non-finite and clamps/rounds the rest', () => {
    expect(clampWeeklyTarget(NaN)).toBe(DEFAULT_WEEKLY_TARGET);
    expect(clampWeeklyTarget(0)).toBe(MIN_WEEKLY_TARGET);
    expect(clampWeeklyTarget(99)).toBe(MAX_WEEKLY_TARGET);
    expect(clampWeeklyTarget(2.6)).toBe(3);
  });
});

describe('startOfLocalWeek', () => {
  it('rolls back to Monday local midnight', () => {
    const monday = new Date(startOfLocalWeek(NOW));
    expect(monday.getDay()).toBe(1); // Monday
    expect(monday.getDate()).toBe(15);
    expect(monday.getHours()).toBe(0);
    // Sunday belongs to the week that started the prior Monday.
    const sun = new Date(startOfLocalWeek(new Date(2026, 5, 21, 23)));
    expect(sun.getDate()).toBe(15);
  });
});

describe('buildWeeklyChallenge', () => {
  const cards: MemoryCard[] = [
    card('Juan/3/16', 5),
    card('Salmos/23/1', 4),
    card('Mateo/5/9', 5),
    card('Genesis/1/1', 3),
  ];
  const events: ReviewEvent[] = [
    ev('Juan/3/16', 3, 4, ms(2026, 5, 15)), // this week, not mastery
    ev('Juan/3/16', 4, 5, ms(2026, 5, 16)), // graduated this week
    ev('Mateo/5/9', 4, 5, ms(2026, 5, 17)), // graduated today
    ev('Salmos/23/1', 4, 5, ms(2026, 5, 10)), // LAST week — excluded
  ];

  it('hides for an empty deck', () => {
    const c = buildWeeklyChallenge({
      cards: [],
      reviewEvents: [],
      target: 3,
      practiceStreak: 0,
      now: NOW,
    });
    expect(c.hasDeck).toBe(false);
    expect(c.mastered).toBe(0);
  });

  it('counts only this-week graduations to box 5, distinct verses', () => {
    const c = buildWeeklyChallenge({
      cards,
      reviewEvents: events,
      target: 3,
      practiceStreak: 4,
      now: NOW,
    });
    expect(c.mastered).toBe(2); // Juan 3:16 + Mateo 5:9
    expect(c.masteredVerses.map(v => v.verseKey)).toEqual([
      'Mateo/5/9', // newest first
      'Juan/3/16',
    ]);
    expect(c.remaining).toBe(1);
    expect(c.met).toBe(false);
    expect(c.fraction).toBeCloseTo(2 / 3);
    // Reviews this week = the 3 inside the week (last-week one excluded).
    expect(c.reviewsThisWeek).toBe(3);
    expect(c.practiceStreak).toBe(4);
    expect(c.hasDeck).toBe(true);
  });

  it('lists focus verses (box < 5) closest to mastery first', () => {
    const c = buildWeeklyChallenge({
      cards,
      reviewEvents: events,
      target: 3,
      practiceStreak: 0,
      now: NOW,
    });
    expect(c.focusVerses.map(v => v.verseKey)).toEqual([
      'Salmos/23/1', // box 4
      'Genesis/1/1', // box 3
    ]);
  });

  it('flags met when the target is reached', () => {
    const c = buildWeeklyChallenge({
      cards,
      reviewEvents: events,
      target: 2,
      practiceStreak: 0,
      now: NOW,
    });
    expect(c.met).toBe(true);
    expect(c.remaining).toBe(0);
    expect(c.fraction).toBe(1);
  });
});
