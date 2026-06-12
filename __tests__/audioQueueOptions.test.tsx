/**
 * Sprint 80 — playlist queue options (devotional shuffle + repeat-the-list)
 * on the real AudioPlayerProvider.
 *
 * Pins the contracts: both toggles are playlist-only no-ops in chapter mode,
 * a plain loadChapter resets them, shuffle permutes ONLY the upcoming verses
 * (played history + the current verse never move, so in-flight indexes stay
 * valid), un-shuffle restores the loaded order, and a repeating playlist
 * wraps from its last verse back to index 0 instead of stopping.
 */
import React from 'react';
import {renderHook, act} from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import type {AudioVerse} from '../src/features/audio/types/audio';

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(() => Promise.resolve()),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
}));

jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {Light: 'light', Medium: 'medium', Heavy: 'heavy'},
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
}));

const playlist: AudioVerse[] = [
  {book: 'Génesis', chapter: 1, verse: 1, text: 'Verso A'},
  {book: 'Salmos', chapter: 23, verse: 1, text: 'Verso B'},
  {book: 'Proverbios', chapter: 3, verse: 5, text: 'Verso C'},
  {book: 'Isaías', chapter: 41, verse: 10, text: 'Verso D'},
  {book: 'Juan', chapter: 3, verse: 16, text: 'Verso E'},
  {book: 'Romanos', chapter: 8, verse: 28, text: 'Verso F'},
];

const chapter: AudioVerse[] = [1, 2].map(v => ({
  book: 'Psalms',
  chapter: 118,
  verse: v,
  text: `Verse ${v}`,
}));

const wrapper = ({children}: {children: React.ReactNode}) => (
  <AudioPlayerProvider>{children}</AudioPlayerProvider>
);

async function loadAsPlaylist(
  result: {current: ReturnType<typeof useAudioPlayer>},
  verses: AudioVerse[] = playlist,
) {
  await act(async () =>
    result.current.loadChapter(verses, {mode: 'playlist', label: 'Lista'}),
  );
}

describe('playlist queue options (Sprint 80)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts with both options off and a plain load keeps them off', () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    expect(result.current.queueOptions).toEqual({
      shuffle: false,
      repeat: false,
    });
  });

  it('the toggles are no-ops in chapter mode', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.loadChapter(chapter));
    await act(async () => {
      result.current.setQueueShuffle(true);
      result.current.setQueueRepeat(true);
    });
    expect(result.current.queueOptions).toEqual({
      shuffle: false,
      repeat: false,
    });
    expect(result.current.verses).toEqual(chapter);
  });

  it('a plain loadChapter resets options armed on a playlist', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await loadAsPlaylist(result);
    await act(async () => {
      result.current.setQueueShuffle(true);
      result.current.setQueueRepeat(true);
    });
    expect(result.current.queueOptions).toEqual({shuffle: true, repeat: true});
    await act(async () => result.current.loadChapter(chapter));
    expect(result.current.queueOptions).toEqual({
      shuffle: false,
      repeat: false,
    });
  });

  it('shuffle only permutes the verses AFTER the playing one', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await loadAsPlaylist(result);
    await act(async () => result.current.goToVerse(2));
    await act(async () => result.current.setQueueShuffle(true));

    const after = result.current.verses;
    // History + current (indexes 0..2) are untouched…
    expect(after.slice(0, 3)).toEqual(playlist.slice(0, 3));
    expect(result.current.state.currentVerseIndex).toBe(2);
    expect(result.current.state.totalVerses).toBe(6);
    // …and the upcoming three are the same verses, possibly reordered.
    expect([...after.slice(3)].sort((a, b) => a.verse - b.verse)).toEqual(
      [...playlist.slice(3)].sort((a, b) => a.verse - b.verse),
    );
  });

  it('un-shuffle restores the loaded order', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await loadAsPlaylist(result);
    await act(async () => result.current.setQueueShuffle(true));
    await act(async () => result.current.setQueueShuffle(false));
    expect(result.current.verses).toEqual(playlist);
    expect(result.current.queueOptions.shuffle).toBe(false);
  });

  it('a repeating playlist wraps from its last verse back to the start', async () => {
    jest.useFakeTimers();
    try {
      const speak = Speech.speak as jest.Mock;
      const {result} = renderHook(() => useAudioPlayer(), {wrapper});
      await loadAsPlaylist(result);
      await act(async () => result.current.setQueueRepeat(true));
      await act(async () => result.current.goToVerse(5));
      await act(async () => result.current.play());

      const lastCall = speak.mock.calls.at(-1);
      expect(lastCall?.[0]).toBe('Verso F');
      const opts = lastCall?.[1];
      act(() => opts.onStart());
      await act(async () => {
        opts.onDone();
        jest.advanceTimersByTime(60);
      });

      // Wrapped: the engine is speaking the FIRST verse again.
      expect(speak.mock.calls.at(-1)?.[0]).toBe('Verso A');
      expect(result.current.state.currentVerseIndex).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('without repeat the playlist still stops at its end', async () => {
    jest.useFakeTimers();
    try {
      const speak = Speech.speak as jest.Mock;
      const {result} = renderHook(() => useAudioPlayer(), {wrapper});
      await loadAsPlaylist(result);
      await act(async () => result.current.goToVerse(5));
      await act(async () => result.current.play());

      const opts = speak.mock.calls.at(-1)?.[1];
      act(() => opts.onStart());
      const callsBefore = speak.mock.calls.length;
      await act(async () => {
        opts.onDone();
        jest.advanceTimersByTime(60);
      });

      expect(speak.mock.calls.length).toBe(callsBefore);
      expect(result.current.state.isPlaying).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});
