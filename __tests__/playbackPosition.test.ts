/**
 * Sprint 51 — pure playback-position model ("Continue listening").
 */

import {
  clampVerseIndex,
  normalizePosition,
  parsePosition,
  serializePosition,
  createPosition,
  isSameChapter,
  isResumable,
  RESUME_MAX_AGE_MS,
  PlaybackPosition,
} from '../src/features/audio/lib/playbackPosition';

const base: PlaybackPosition = {
  book: 'Genesis',
  chapter: 1,
  verseIndex: 7,
  verse: 8,
  totalVerses: 31,
  updatedAt: 1_000_000,
};

describe('clampVerseIndex', () => {
  it('returns 0 for an empty/invalid chapter', () => {
    expect(clampVerseIndex(5, 0)).toBe(0);
    expect(clampVerseIndex(5, -3)).toBe(0);
  });

  it('clamps below 0 and above the last index', () => {
    expect(clampVerseIndex(-2, 10)).toBe(0);
    expect(clampVerseIndex(99, 10)).toBe(9);
  });

  it('rounds a fractional index and passes a valid one through', () => {
    expect(clampVerseIndex(3.4, 10)).toBe(3);
    expect(clampVerseIndex(3, 10)).toBe(3);
  });

  it('returns 0 for a non-finite index', () => {
    expect(clampVerseIndex(NaN, 10)).toBe(0);
    expect(clampVerseIndex(Infinity, 10)).toBe(0);
  });
});

describe('normalizePosition', () => {
  it('accepts a well-formed object and rounds numeric fields', () => {
    expect(
      normalizePosition({
        book: 'John',
        chapter: 3.0,
        verseIndex: 15.2,
        verse: 16.6,
        totalVerses: 36.4,
        updatedAt: 500,
      }),
    ).toEqual({
      book: 'John',
      chapter: 3,
      verseIndex: 15,
      verse: 17,
      totalVerses: 36,
      updatedAt: 500,
    });
  });

  it('clamps verseIndex to the stored chapter length', () => {
    const pos = normalizePosition({...base, verseIndex: 999, totalVerses: 31});
    expect(pos?.verseIndex).toBe(30);
  });

  it.each([
    ['non-object', 42],
    ['null', null],
    ['empty book', {...base, book: ''}],
    [
      'missing book',
      {chapter: 1, verseIndex: 0, verse: 1, totalVerses: 5, updatedAt: 1},
    ],
    ['chapter 0', {...base, chapter: 0}],
    ['negative verseIndex', {...base, verseIndex: -1}],
    ['verse 0', {...base, verse: 0}],
    ['totalVerses 0', {...base, totalVerses: 0}],
    ['NaN updatedAt', {...base, updatedAt: NaN}],
    ['string number', {...base, chapter: '1'}],
  ])('rejects %s with null', (_label, input) => {
    expect(normalizePosition(input)).toBeNull();
  });
});

describe('parsePosition / serializePosition', () => {
  it('returns null for empty/invalid input', () => {
    expect(parsePosition(null)).toBeNull();
    expect(parsePosition(undefined)).toBeNull();
    expect(parsePosition('')).toBeNull();
    expect(parsePosition('{not json')).toBeNull();
    expect(parsePosition('{"book":"x"}')).toBeNull();
  });

  it('round-trips a valid position', () => {
    expect(parsePosition(serializePosition(base))).toEqual(base);
  });
});

describe('createPosition', () => {
  it('stamps updatedAt=now, clamps the index and rounds', () => {
    expect(
      createPosition({
        book: 'Psalms',
        chapter: 23.0,
        verseIndex: 50,
        verse: 1,
        totalVerses: 6,
        now: 777,
      }),
    ).toEqual({
      book: 'Psalms',
      chapter: 23,
      verseIndex: 5,
      verse: 1,
      totalVerses: 6,
      updatedAt: 777,
    });
  });

  it('floors totalVerses at 1', () => {
    const pos = createPosition({
      book: 'X',
      chapter: 1,
      verseIndex: 0,
      verse: 1,
      totalVerses: 0,
      now: 1,
    });
    expect(pos.totalVerses).toBe(1);
    expect(pos.verseIndex).toBe(0);
  });
});

describe('isSameChapter', () => {
  it('matches on book + chapter, rejects mismatches and null', () => {
    expect(isSameChapter(base, 'Genesis', 1)).toBe(true);
    expect(isSameChapter(base, 'Genesis', 2)).toBe(false);
    expect(isSameChapter(base, 'Exodus', 1)).toBe(false);
    expect(isSameChapter(null, 'Genesis', 1)).toBe(false);
  });
});

describe('isResumable', () => {
  it('is false for null', () => {
    expect(isResumable(null, base.updatedAt)).toBe(false);
  });

  it('is true within the freshness window and false beyond it', () => {
    const now = base.updatedAt + RESUME_MAX_AGE_MS;
    expect(isResumable(base, now)).toBe(true);
    expect(isResumable(base, now + 1)).toBe(false);
  });

  it('is false for a position stamped in the future (clock moved back)', () => {
    expect(isResumable(base, base.updatedAt - 1000)).toBe(false);
  });

  it('honours a custom max age', () => {
    expect(isResumable(base, base.updatedAt + 100, 50)).toBe(false);
    expect(isResumable(base, base.updatedAt + 40, 50)).toBe(true);
  });
});
