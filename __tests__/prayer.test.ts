/**
 * Sprint 93 — the pure prayer-journal domain model. Pins the immutable
 * operations (add/edit/answer/reopen/delete), the read views
 * (active/answered sorting, category filter), validation (trim/cap, category
 * fallback) and the summary stats.
 */
import {
  newPrayerRequest,
  addRequest,
  editRequest,
  markAnswered,
  reopenRequest,
  deleteRequest,
  activeRequests,
  answeredRequests,
  filterByCategory,
  prayerStats,
  isPrayerCategory,
  isBlankTitle,
  PRAYER_CATEGORY_ORDER,
  PRAYER_TITLE_MAX,
  PRAYER_DETAIL_MAX,
  type PrayerRequest,
} from '../src/features/prayer/prayer';

const make = (
  id: string,
  over: Partial<PrayerRequest> = {},
): PrayerRequest => ({
  id,
  title: `Prayer ${id}`,
  category: 'supplication',
  createdAt: 1000,
  answered: false,
  ...over,
});

describe('newPrayerRequest (Sprint 93)', () => {
  it('trims the title, drops an empty detail, starts unanswered', () => {
    const r = newPrayerRequest(
      {title: '  My friend Ana  ', detail: '   ', category: 'intercession'},
      'id1',
      500,
    );
    expect(r).toEqual({
      id: 'id1',
      title: 'My friend Ana',
      category: 'intercession',
      createdAt: 500,
      answered: false,
    });
    expect(r.detail).toBeUndefined();
  });

  it('keeps a cleaned detail and caps both fields', () => {
    const r = newPrayerRequest(
      {
        title: 'x'.repeat(PRAYER_TITLE_MAX + 50),
        detail: 'y'.repeat(PRAYER_DETAIL_MAX + 50),
        category: 'praise',
      },
      'id2',
      1,
    );
    expect(r.title.length).toBe(PRAYER_TITLE_MAX);
    expect(r.detail?.length).toBe(PRAYER_DETAIL_MAX);
  });

  it('falls back to supplication for an unknown category', () => {
    const r = newPrayerRequest(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {title: 'x', category: 'bogus' as any},
      'id3',
      1,
    );
    expect(r.category).toBe('supplication');
  });
});

describe('isBlankTitle / isPrayerCategory', () => {
  it('detects blank titles', () => {
    expect(isBlankTitle('   ')).toBe(true);
    expect(isBlankTitle(undefined)).toBe(true);
    expect(isBlankTitle('ok')).toBe(false);
  });
  it('narrows categories', () => {
    expect(isPrayerCategory('confession')).toBe(true);
    expect(isPrayerCategory('nope')).toBe(false);
    expect(isPrayerCategory(3)).toBe(false);
  });
});

describe('mutations are immutable + correct', () => {
  it('addRequest prepends without mutating', () => {
    const base = [make('a')];
    const next = addRequest(base, make('b'));
    expect(next.map(r => r.id)).toEqual(['b', 'a']);
    expect(base).toHaveLength(1);
  });

  it('markAnswered stamps answeredAt + note once and is idempotent', () => {
    const list = [make('a')];
    const once = markAnswered(list, 'a', 2000, '  Praise God!  ');
    expect(once[0]).toMatchObject({
      answered: true,
      answeredAt: 2000,
      answeredNote: 'Praise God!',
    });
    // Re-answering keeps the FIRST answeredAt.
    const twice = markAnswered(once, 'a', 9999);
    expect(twice[0].answeredAt).toBe(2000);
    // original untouched
    expect(list[0].answered).toBe(false);
  });

  it('reopenRequest clears the answered stamp', () => {
    const answered = markAnswered([make('a')], 'a', 2000, 'note');
    const reopened = reopenRequest(answered, 'a');
    expect(reopened[0].answered).toBe(false);
    expect(reopened[0].answeredAt).toBeUndefined();
    expect(reopened[0].answeredNote).toBeUndefined();
  });

  it('editRequest updates fields and removes a cleared detail', () => {
    const list = [make('a', {detail: 'old', category: 'praise'})];
    const next = editRequest(list, 'a', {
      title: '  New  ',
      detail: '',
      category: 'confession',
    });
    expect(next[0]).toMatchObject({title: 'New', category: 'confession'});
    expect(next[0].detail).toBeUndefined();
  });

  it('deleteRequest removes only the target', () => {
    const next = deleteRequest([make('a'), make('b')], 'a');
    expect(next.map(r => r.id)).toEqual(['b']);
  });
});

describe('read views', () => {
  const list = [
    make('a', {createdAt: 100}),
    make('b', {createdAt: 300}),
    make('c', {answered: true, answeredAt: 50, createdAt: 10}),
    make('d', {answered: true, answeredAt: 80, createdAt: 20}),
  ];

  it('activeRequests are unanswered, newest-first', () => {
    expect(activeRequests(list).map(r => r.id)).toEqual(['b', 'a']);
  });

  it('answeredRequests are answered, most-recently-answered first', () => {
    expect(answeredRequests(list).map(r => r.id)).toEqual(['d', 'c']);
  });

  it('filterByCategory honors "all" and a specific category', () => {
    const mixed = [
      make('p', {category: 'praise'}),
      make('s', {category: 'supplication'}),
    ];
    expect(filterByCategory(mixed, 'all')).toHaveLength(2);
    expect(filterByCategory(mixed, 'praise').map(r => r.id)).toEqual(['p']);
  });
});

describe('prayerStats', () => {
  it('counts totals + active-by-category', () => {
    const list = [
      make('a', {category: 'praise'}),
      make('b', {category: 'praise'}),
      make('c', {category: 'intercession'}),
      make('d', {answered: true, category: 'praise'}),
    ];
    const s = prayerStats(list);
    expect(s.total).toBe(4);
    expect(s.active).toBe(3);
    expect(s.answered).toBe(1);
    expect(s.activeByCategory.praise).toBe(2);
    expect(s.activeByCategory.intercession).toBe(1);
    expect(s.activeByCategory.confession).toBe(0);
  });

  it('every category appears in the order list once', () => {
    expect(new Set(PRAYER_CATEGORY_ORDER).size).toBe(
      PRAYER_CATEGORY_ORDER.length,
    );
  });
});
