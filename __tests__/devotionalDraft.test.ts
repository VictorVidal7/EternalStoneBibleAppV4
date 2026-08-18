/**
 * Devotional-builder local persistence — draft parsing/serialization and the
 * "my devotionals" saved list (src/lib/together/devotionalDraft.ts). Pure
 * functions only (no AsyncStorage/React here), same spirit as
 * togetherBundle.test.ts: round trips + defensive parsing of untrusted/stale
 * storage content.
 */
import {makeCalBundle} from '@/lib/together/bundle';
import {
  addSavedDevotional,
  isDraftWorthSaving,
  MAX_SAVED_DEVOTIONALS,
  parseDevotionalDraft,
  parseSavedDevotionals,
  serializeDevotionalDraft,
  serializeSavedDevotionals,
  type DevotionalDraft,
} from '@/lib/together/devotionalDraft';

const DAY = {bookId: 43, chapter: 3, verse: 16, note: 'Juan 3:16'};

describe('parseDevotionalDraft', () => {
  it('round-trips a draft with a title, start date and days', () => {
    const draft: DevotionalDraft = {
      title: 'Una semana en los Salmos',
      startDate: '2026-09-01',
      days: [DAY],
    };
    const raw = serializeDevotionalDraft(draft);
    expect(parseDevotionalDraft(raw, new Date('2026-08-15'))).toEqual(draft);
  });

  it('returns null for null/empty/garbage input', () => {
    expect(parseDevotionalDraft(null)).toBeNull();
    expect(parseDevotionalDraft('')).toBeNull();
    expect(parseDevotionalDraft('not json')).toBeNull();
    expect(parseDevotionalDraft('42')).toBeNull();
    expect(parseDevotionalDraft('null')).toBeNull();
  });

  it('returns null for a blank title with no days (nothing worth restoring)', () => {
    const raw = serializeDevotionalDraft({
      title: '  ',
      startDate: '2026-09-01',
      days: [],
    });
    expect(parseDevotionalDraft(raw)).toBeNull();
  });

  it('restores a title-only draft (no days yet)', () => {
    const raw = serializeDevotionalDraft({
      title: 'Ayuno de 21 días',
      startDate: '2026-09-01',
      days: [],
    });
    const draft = parseDevotionalDraft(raw, new Date('2026-08-15'));
    expect(draft).toEqual({
      title: 'Ayuno de 21 días',
      startDate: '2026-09-01',
      days: [],
    });
  });

  it('drops malformed days but keeps the valid ones', () => {
    const raw = JSON.stringify({
      title: 'Mixto',
      startDate: '2026-09-01',
      days: [
        DAY,
        {bookId: 999, chapter: 1, verse: 1, note: ''}, // bookId out of range
        {bookId: 1, chapter: 1}, // missing fields
        'garbage',
      ],
    });
    const draft = parseDevotionalDraft(raw, new Date('2026-08-15'));
    expect(draft?.days).toEqual([DAY]);
  });

  it('clamps a stale start date forward to today', () => {
    const raw = serializeDevotionalDraft({
      title: 'Viejo',
      startDate: '2026-01-01',
      days: [DAY],
    });
    const draft = parseDevotionalDraft(raw, new Date(2026, 7, 15));
    expect(draft?.startDate).toBe('2026-08-15');
  });

  it('rejects an invalid startDate shape', () => {
    const raw = JSON.stringify({
      title: 'x',
      startDate: 'not-a-date',
      days: [DAY],
    });
    expect(parseDevotionalDraft(raw)).toBeNull();
  });
});

describe('isDraftWorthSaving', () => {
  it('is false for a fully blank draft', () => {
    expect(
      isDraftWorthSaving({title: '', startDate: '2026-09-01', days: []}),
    ).toBe(false);
    expect(
      isDraftWorthSaving({title: '   ', startDate: '2026-09-01', days: []}),
    ).toBe(false);
  });

  it('is true once there is a title or a day', () => {
    expect(
      isDraftWorthSaving({title: 'x', startDate: '2026-09-01', days: []}),
    ).toBe(true);
    expect(
      isDraftWorthSaving({title: '', startDate: '2026-09-01', days: [DAY]}),
    ).toBe(true);
  });
});

describe('saved devotionals list', () => {
  it('round-trips through serialize/parse', () => {
    const bundle = makeCalBundle('2026-09-01', 'Una semana en los Salmos', [
      {bookId: 19, chapter: 1, verse: 1},
      {bookId: 19, chapter: 23, verse: 1, note: 'El Señor es mi pastor'},
    ]);
    expect(bundle).not.toBeNull();
    const list = addSavedDevotional(
      [],
      bundle!,
      new Date('2026-08-15T10:00:00Z'),
    );
    const raw = serializeSavedDevotionals(list);
    expect(parseSavedDevotionals(raw)).toEqual(list);
  });

  it('drops entries whose payload no longer decodes', () => {
    const corrupted = JSON.stringify([
      {id: '1', createdAt: '2026-08-01T00:00:00Z', d: '!!! not base64'},
      {id: '2', createdAt: 'x'}, // missing d
      'garbage',
    ]);
    expect(parseSavedDevotionals(corrupted)).toEqual([]);
  });

  it('addSavedDevotional prepends a new entry, most-recent first', () => {
    const a = makeCalBundle('2026-09-01', 'A', [
      {bookId: 1, chapter: 1, verse: 1},
    ]);
    const b = makeCalBundle('2026-09-02', 'B', [
      {bookId: 2, chapter: 1, verse: 1},
    ]);
    const list1 = addSavedDevotional([], a!, new Date('2026-08-01'));
    const list2 = addSavedDevotional(list1, b!, new Date('2026-08-02'));
    expect(list2).toHaveLength(2);
    expect(list2[0].bundle).toEqual(b);
    expect(list2[1].bundle).toEqual(a);
  });

  it('re-sharing identical content bumps the existing entry instead of duplicating it', () => {
    const bundle = makeCalBundle('2026-09-01', 'Repetido', [
      {bookId: 1, chapter: 1, verse: 1},
    ]);
    const list1 = addSavedDevotional([], bundle!, new Date('2026-08-01'));
    const list2 = addSavedDevotional(list1, bundle!, new Date('2026-08-10'));
    expect(list2).toHaveLength(1);
    expect(list2[0].bundle).toEqual(bundle);
    expect(list2[0].createdAt).toBe(new Date('2026-08-10').toISOString());
  });

  it('caps the list at MAX_SAVED_DEVOTIONALS', () => {
    let list: ReturnType<typeof addSavedDevotional> = [];
    for (let i = 0; i < MAX_SAVED_DEVOTIONALS + 5; i++) {
      const bundle = makeCalBundle(`2026-09-01`, `Devocional ${i}`, [
        {bookId: 1, chapter: 1, verse: i + 1},
      ]);
      list = addSavedDevotional(list, bundle!, new Date(2026, 7, i + 1));
    }
    expect(list).toHaveLength(MAX_SAVED_DEVOTIONALS);
    expect(list[0].bundle.ti).toBe(`Devocional ${MAX_SAVED_DEVOTIONALS + 4}`);
  });
});
