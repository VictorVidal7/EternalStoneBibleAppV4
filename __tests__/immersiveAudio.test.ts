/**
 * Sprint 52 — immersive ↔ audio bridge helpers (pure module).
 */

import {
  toAudioVerses,
  isSameAudioChapter,
  VerseLike,
} from '../src/features/audio/lib/immersiveAudio';
import type {AudioVerse} from '../src/features/audio/types/audio';

const av = (
  book: string,
  chapter: number,
  verse: number,
  text = 't',
): AudioVerse => ({
  book,
  chapter,
  verse,
  text,
});

describe('toAudioVerses', () => {
  it('maps a full BibleVerse-like list to AudioVerse shape', () => {
    const input: VerseLike[] = [
      {book: 'Génesis', chapter: 1, verse: 1, text: 'En el principio'},
      {book: 'Génesis', chapter: 1, verse: 2, text: 'Y la tierra'},
    ];
    expect(toAudioVerses(input)).toEqual([
      {book: 'Génesis', chapter: 1, verse: 1, text: 'En el principio'},
      {book: 'Génesis', chapter: 1, verse: 2, text: 'Y la tierra'},
    ]);
  });

  it('coerces missing/nullish fields defensively (book→"", nums→0, text→String)', () => {
    const input: VerseLike[] = [
      {book: null, chapter: null, verse: null, text: null},
      {},
    ];
    expect(toAudioVerses(input)).toEqual([
      {book: '', chapter: 0, verse: 0, text: ''},
      {book: '', chapter: 0, verse: 0, text: ''},
    ]);
  });

  it('stringifies non-string text', () => {
    const input = [
      {book: 'X', chapter: 2, verse: 3, text: 123 as unknown as string},
    ];
    expect(toAudioVerses(input)[0].text).toBe('123');
  });

  it('returns an empty array for empty input', () => {
    expect(toAudioVerses([])).toEqual([]);
  });
});

describe('isSameAudioChapter', () => {
  const loaded: AudioVerse[] = [
    av('Génesis', 1, 1),
    av('Génesis', 1, 2),
    av('Génesis', 1, 3),
  ];

  it('matches when length + head book + head chapter are equal', () => {
    const candidate: AudioVerse[] = [
      av('Génesis', 1, 1, 'x'),
      av('Génesis', 1, 2),
      av('Génesis', 1, 3),
    ];
    expect(isSameAudioChapter(loaded, candidate)).toBe(true);
  });

  it('rejects a different verse count (e.g. another Bible version)', () => {
    const candidate: AudioVerse[] = [av('Génesis', 1, 1), av('Génesis', 1, 2)];
    expect(isSameAudioChapter(loaded, candidate)).toBe(false);
  });

  it('rejects a different book at the head', () => {
    const candidate: AudioVerse[] = [
      av('Éxodo', 1, 1),
      av('Éxodo', 1, 2),
      av('Éxodo', 1, 3),
    ];
    expect(isSameAudioChapter(loaded, candidate)).toBe(false);
  });

  it('rejects a different chapter at the head', () => {
    const candidate: AudioVerse[] = [
      av('Génesis', 2, 1),
      av('Génesis', 2, 2),
      av('Génesis', 2, 3),
    ];
    expect(isSameAudioChapter(loaded, candidate)).toBe(false);
  });

  it('never matches when the loaded list is empty', () => {
    expect(isSameAudioChapter([], [])).toBe(false);
    expect(isSameAudioChapter([], [av('Génesis', 1, 1)])).toBe(false);
  });

  it('rejects when the candidate is empty but the loaded list is not', () => {
    expect(isSameAudioChapter(loaded, [])).toBe(false);
  });
});
