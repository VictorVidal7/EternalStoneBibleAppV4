/**
 * Regression — R9-425: the "end of chapter" sleep timer must STOP the
 * narration at the end of the chapter.
 *
 * Bug: on the last verse's onDone the engine cancelled the end-of-chapter timer
 * (mode → null) and, in the same callback, raised the chapter-end signal
 * (`chapterEndCount`). AudioChapterAdvancer reads the timer mode on its next
 * render — already null — so with continuous playback on (the default) it
 * loaded and played the next chapter, and then every chapter after it, with no
 * timer left. The only earlier test covered the pure `shouldAdvanceChapter`,
 * which does return false for 'end-of-chapter': a false green.
 *
 * Fix: the engine honours the timer itself — when an end-of-chapter timer is
 * what stopped the chapter, the chapter-end signal is not raised.
 *
 * The REAL provider and the REAL advancer; only the DB, the version hook and
 * expo-speech are mocked.
 */
import React from 'react';
import {renderHook, act} from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import {AudioChapterAdvancer} from '../src/features/audio/components/AudioChapterAdvancer';
import type {AudioVerse} from '../src/features/audio/types/audio';

const mockGetChapter = jest.fn();
jest.mock('@lib/database', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(() => Promise.resolve()),
    getChapter: (...args: unknown[]) => mockGetChapter(...args),
  },
}));
jest.mock('@hooks/useBibleVersion', () => {
  const version = {id: 'RVR1960', language: 'es'};
  return {
    useBibleVersion: () => ({selectedVersion: version}),
    useBibleVersionOptional: () => ({selectedVersion: version}),
  };
});
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

type Player = {current: ReturnType<typeof useAudioPlayer>};

/** A two-verse chapter of Juan whose texts read "Juan <chapter>:<verse>". */
const chapterOf = (chapter: number): AudioVerse[] =>
  [1, 2].map(verse => ({
    book: 'Juan',
    chapter,
    verse,
    text: `Juan ${chapter}:${verse}`,
  }));

const wrapper = ({children}: {children: React.ReactNode}) => (
  <AudioPlayerProvider>
    <AudioChapterAdvancer />
    {children}
  </AudioPlayerProvider>
);

const speak = Speech.speak as jest.Mock;
const spokenTexts = () => speak.mock.calls.map(call => call[0]);

/** Let the advancer run: getChapter → loadChapter → 150 ms → play(). */
async function letTheAdvancerRun() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
  }
}

/** The utterance in flight finishes naturally (onStart … onDone). */
async function finishCurrentVerse(expectedText: string) {
  const call = speak.mock.calls.at(-1);
  expect(call?.[0]).toBe(expectedText);
  act(() => call?.[1].onStart());
  await act(async () => {
    call?.[1].onDone();
    jest.advanceTimersByTime(60); // the 50 ms gap before the next verse
  });
  await act(async () => {});
}

/** Load a chapter of Juan, play it, and let both verses finish. */
async function playChapterToItsEnd(result: Player, chapter: number) {
  await act(async () => result.current.loadChapter(chapterOf(chapter)));
  await act(async () => result.current.play());
  await finishCurrentVerse(`Juan ${chapter}:1`);
  await finishCurrentVerse(`Juan ${chapter}:2`);
  await letTheAdvancerRun();
}

describe('R9-425 — the end-of-chapter sleep timer stops the narration', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    await AsyncStorage.clear();
    mockGetChapter.mockImplementation(
      async (_bookId: number, chapter: number) => chapterOf(chapter),
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('control — no timer: continuous playback rolls into the next chapter', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});

    await playChapterToItsEnd(result, 3);

    expect(spokenTexts().at(-1)).toBe('Juan 4:1');
    expect(mockGetChapter).toHaveBeenCalledTimes(1);
  });

  it('"end of chapter": the narration stops at the last verse, the next chapter is never loaded, and the timer is consumed', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.setSleepTimerEndOfChapter());
    expect(result.current.sleepTimer.mode).toBe('end-of-chapter');

    await playChapterToItsEnd(result, 3);

    expect(mockGetChapter).not.toHaveBeenCalled();
    expect(spokenTexts()).toEqual(['Juan 3:1', 'Juan 3:2']);
    expect(result.current.verses.map(v => v.chapter)).toEqual([3, 3]);
    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.sleepTimer.isActive).toBe(false);
    expect(result.current.sleepTimer.mode).toBeNull();
  });

  it('the timer is for ONE chapter: playing again after it stopped advances normally at the next chapter end', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.setSleepTimerEndOfChapter());
    await playChapterToItsEnd(result, 3);
    expect(mockGetChapter).not.toHaveBeenCalled();

    // The player stayed on the last verse; play it again, with no timer now.
    await act(async () => result.current.play());
    await finishCurrentVerse('Juan 3:2');
    await letTheAdvancerRun();

    expect(mockGetChapter).toHaveBeenCalledTimes(1);
    expect(spokenTexts().at(-1)).toBe('Juan 4:1');
  });

  it('mirror — "end of book" in the middle of a book: it advances, and the timer survives', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.setSleepTimerEndOfBook());

    await playChapterToItsEnd(result, 3);

    expect(spokenTexts().at(-1)).toBe('Juan 4:1');
    expect(result.current.sleepTimer.mode).toBe('end-of-book');
  });

  it('mirror — "end of book" on the book\'s last chapter: it stops and the timer is consumed', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.setSleepTimerEndOfBook());

    await playChapterToItsEnd(result, 21); // Juan has 21 chapters

    expect(mockGetChapter).not.toHaveBeenCalled();
    expect(spokenTexts().at(-1)).toBe('Juan 21:2');
    expect(result.current.sleepTimer.mode).toBeNull();
  });

  it('control — continuous playback off, no timer: it stays stopped at the end of the chapter', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.setAutoAdvanceChapter(false));

    await playChapterToItsEnd(result, 3);

    expect(mockGetChapter).not.toHaveBeenCalled();
    expect(spokenTexts().at(-1)).toBe('Juan 3:2');
  });
});
