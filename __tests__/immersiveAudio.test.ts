/**
 * Sprint 52 — immersive ↔ audio bridge helpers (pure module).
 */

import {
  toAudioVerses,
  isSameAudioChapter,
  bibleVersesFromAudio,
  immersiveStartIndex,
  resolveImmersiveOpen,
  VerseLike,
} from '../src/features/audio/lib/immersiveAudio';
import type {AudioVerse} from '../src/features/audio/types/audio';
import type {BibleVerse} from '../src/types/bible';

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

describe('bibleVersesFromAudio (S73 — immersive cross-chapter follow)', () => {
  it('reconstructs BibleVerse rows from the engine AudioVerse[] with the live version', () => {
    const audio: AudioVerse[] = [
      av('Salmos', 118, 1, 'Alabad a Jehová'),
      av('Salmos', 118, 2, 'Diga ahora Israel'),
    ];
    expect(bibleVersesFromAudio(audio, 'RVR1960')).toEqual([
      {
        id: 0,
        book: 'Salmos',
        bookNumber: 19,
        chapter: 118,
        verse: 1,
        text: 'Alabad a Jehová',
        version: 'RVR1960',
      },
      {
        id: 0,
        book: 'Salmos',
        bookNumber: 19,
        chapter: 118,
        verse: 2,
        text: 'Diga ahora Israel',
        version: 'RVR1960',
      },
    ]);
  });

  it('round-trips with toAudioVerses (same chapter detection holds afterwards)', () => {
    const audio: AudioVerse[] = [av('Génesis', 2, 1), av('Génesis', 2, 2)];
    const back = toAudioVerses(bibleVersesFromAudio(audio, 'RVR1960'));
    expect(isSameAudioChapter(audio, back)).toBe(true);
  });

  it('defends against an unknown book (bookNumber → 0)', () => {
    expect(bibleVersesFromAudio([av('???', 1, 1)], 'KJV')[0].bookNumber).toBe(
      0,
    );
  });

  it('returns an empty array for empty input', () => {
    expect(bibleVersesFromAudio([], 'WEB')).toEqual([]);
  });
});

describe('immersiveStartIndex (#7 — immersive opens where the audio already is)', () => {
  it('seeds from the engine verse index when bound to the same chapter', () => {
    expect(immersiveStartIndex(true, 14, 30)).toBe(14);
  });

  it('falls back to 0 (chapter start) when not bound to the reader chapter', () => {
    expect(immersiveStartIndex(false, 14, 30)).toBe(0);
  });

  it('clamps the engine index into the displayed chapter bounds (version mismatch)', () => {
    expect(immersiveStartIndex(true, 99, 10)).toBe(9);
    expect(immersiveStartIndex(true, -1, 10)).toBe(0);
  });

  it('never indexes past an empty chapter', () => {
    expect(immersiveStartIndex(true, 5, 0)).toBe(0);
  });
});

describe('resolveImmersiveOpen (#7 part 2 — engine on a DIFFERENT chapter)', () => {
  const bv = (
    book: string,
    chapter: number,
    verse: number,
    text = 't',
  ): BibleVerse => ({
    id: 0,
    book,
    bookNumber: 1,
    chapter,
    verse,
    text,
    version: 'RVR1960',
  });
  const readerVerses = [bv('Juan', 3, 1), bv('Juan', 3, 2), bv('Juan', 3, 3)];
  const elsewhereEngineVerses = [
    av('Salmos', 118, 1),
    av('Salmos', 118, 2),
    av('Salmos', 118, 3),
    av('Salmos', 118, 4),
  ];

  it('opens on the reader chapter, seeded, when the engine is bound to it', () => {
    const result = resolveImmersiveOpen({
      readerVerses,
      audioEngineVerses: [av('Juan', 3, 1), av('Juan', 3, 2), av('Juan', 3, 3)],
      audioBoundToReader: true,
      audioIsPlaying: true,
      isAudioVisible: true,
      engineVerseIndex: 2,
      versionAbbr: 'RVR1960',
    });
    expect(result.verses).toBe(readerVerses);
    expect(result.startIndex).toBe(2);
  });

  it('opens on the ENGINE chapter when it is actively narrating a different one', () => {
    const result = resolveImmersiveOpen({
      readerVerses,
      audioEngineVerses: elsewhereEngineVerses,
      audioBoundToReader: false,
      audioIsPlaying: true,
      isAudioVisible: true,
      engineVerseIndex: 3,
      versionAbbr: 'RVR1960',
    });
    expect(result.verses).toEqual(
      bibleVersesFromAudio(elsewhereEngineVerses, 'RVR1960'),
    );
    expect(result.startIndex).toBe(3);
  });

  it('opens on the reader chapter (verse 1) when the engine is paused elsewhere', () => {
    const result = resolveImmersiveOpen({
      readerVerses,
      audioEngineVerses: elsewhereEngineVerses,
      audioBoundToReader: false,
      audioIsPlaying: false,
      isAudioVisible: true,
      engineVerseIndex: 3,
      versionAbbr: 'RVR1960',
    });
    expect(result.verses).toBe(readerVerses);
    expect(result.startIndex).toBe(0);
  });

  it('opens on the reader chapter when there is no audio session at all', () => {
    const result = resolveImmersiveOpen({
      readerVerses,
      audioEngineVerses: [],
      audioBoundToReader: false,
      audioIsPlaying: false,
      isAudioVisible: false,
      engineVerseIndex: 0,
      versionAbbr: 'RVR1960',
    });
    expect(result.verses).toBe(readerVerses);
    expect(result.startIndex).toBe(0);
  });

  it('opens on the reader chapter when the mini-player is hidden even if isPlaying is stale-true', () => {
    const result = resolveImmersiveOpen({
      readerVerses,
      audioEngineVerses: elsewhereEngineVerses,
      audioBoundToReader: false,
      audioIsPlaying: true,
      isAudioVisible: false,
      engineVerseIndex: 3,
      versionAbbr: 'RVR1960',
    });
    expect(result.verses).toBe(readerVerses);
    expect(result.startIndex).toBe(0);
  });

  it('clamps the engine index into the engine chapter bounds', () => {
    const result = resolveImmersiveOpen({
      readerVerses,
      audioEngineVerses: elsewhereEngineVerses,
      audioBoundToReader: false,
      audioIsPlaying: true,
      isAudioVisible: true,
      engineVerseIndex: 999,
      versionAbbr: 'RVR1960',
    });
    expect(result.startIndex).toBe(elsewhereEngineVerses.length - 1);
  });
});
