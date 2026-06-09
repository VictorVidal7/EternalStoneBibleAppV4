/**
 * Sprint 72 — pure search + sort for the Notes tab.
 */

import {
  matchesNoteQuery,
  searchNotes,
  sortNotes,
  type NoteSortOrder,
} from '../src/lib/notes/noteFilter';

interface TestNote {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  note: string;
  updatedAt: string;
  rank: number;
}

const note = (
  book: string,
  chapter: number,
  verse: number,
  text: string,
  body: string,
  updatedAt: string,
  rank: number,
): TestNote => ({book, chapter, verse, text, note: body, updatedAt, rank});

const haystackOf = (n: TestNote) =>
  `${n.book} ${n.chapter}:${n.verse} ${n.text} ${n.note}`;

describe('matchesNoteQuery', () => {
  it('is diacritic-insensitive', () => {
    expect(matchesNoteQuery('Una oración profunda', 'oracion')).toBe(true);
    expect(matchesNoteQuery('El Espíritu Santo', 'espiritu')).toBe(true);
  });

  it('requires EVERY query word to be present', () => {
    expect(matchesNoteQuery('fe y esperanza', 'fe esperanza')).toBe(true);
    expect(matchesNoteQuery('fe y esperanza', 'fe amor')).toBe(false);
  });

  it('matches everything when the query is empty/whitespace', () => {
    expect(matchesNoteQuery('anything', '')).toBe(true);
    expect(matchesNoteQuery('anything', '   ')).toBe(true);
  });
});

describe('searchNotes', () => {
  const notes = [
    note(
      'Juan',
      3,
      16,
      'Porque de tal manera amó Dios',
      'el amor de Dios',
      'a',
      43,
    ),
    note('Salmos', 23, 1, 'Jehová es mi pastor', 'confianza y reposo', 'b', 19),
  ];

  it('filters by the composed haystack, diacritic-insensitive', () => {
    expect(searchNotes(notes, 'pastor', haystackOf)).toHaveLength(1);
    expect(searchNotes(notes, 'amo', haystackOf)[0].book).toBe('Juan');
    // Reference is searchable too.
    expect(searchNotes(notes, 'salmos', haystackOf)[0].book).toBe('Salmos');
  });

  it('returns a copy of all notes for an empty query', () => {
    const result = searchNotes(notes, '', haystackOf);
    expect(result).toHaveLength(2);
    expect(result).not.toBe(notes);
  });

  it('returns an empty array when nothing matches', () => {
    expect(searchNotes(notes, 'zzz', haystackOf)).toHaveLength(0);
  });
});

describe('sortNotes', () => {
  // Juan (rank 43) updated newest; Génesis (rank 1) oldest.
  const a = note('Génesis', 1, 1, 't', 'b', '2026-01-01T00:00:00Z', 1);
  const b = note('Juan', 3, 16, 't', 'b', '2026-06-01T00:00:00Z', 43);
  const c = note('Génesis', 1, 5, 't', 'b', '2026-03-01T00:00:00Z', 1);
  const notes = [a, b, c];

  const ts = (n: TestNote) => new Date(n.updatedAt).getTime();
  const rank = (n: TestNote) => n.rank;
  const order = (o: NoteSortOrder) =>
    sortNotes(notes, o, ts, rank).map(n => n.updatedAt);

  it('sorts recent first (most recently updated)', () => {
    expect(order('recent')).toEqual([b.updatedAt, c.updatedAt, a.updatedAt]);
  });

  it('sorts oldest first', () => {
    expect(order('oldest')).toEqual([a.updatedAt, c.updatedAt, b.updatedAt]);
  });

  it('sorts by canonical book, then chapter, then verse', () => {
    // Génesis (rank 1) before Juan (rank 43); within Génesis, verse 1 before 5.
    const sorted = sortNotes(notes, 'book', ts, rank);
    expect(sorted.map(n => `${n.book} ${n.chapter}:${n.verse}`)).toEqual([
      'Génesis 1:1',
      'Génesis 1:5',
      'Juan 3:16',
    ]);
  });

  it('does not mutate the input array', () => {
    const snapshot = [...notes];
    sortNotes(notes, 'oldest', ts, rank);
    expect(notes).toEqual(snapshot);
  });
});
