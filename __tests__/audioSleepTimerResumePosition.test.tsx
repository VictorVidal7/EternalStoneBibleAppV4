/**
 * Regression — sleep timer expiry must PAUSE, not STOP (AudioPlayerContext).
 *
 * Bug: both places the timed sleep timer fires — the live in-foreground
 * setTimeout in armSleepTimers, and the "expired while backgrounded"
 * reconciliation on the next AppState 'active' event — used to call the bare
 * stop(), which resets currentVerseIndex to 0. The position-autosave effect
 * persists whatever currentVerseIndex is as the "Continue listening" position
 * on every change, so that reset silently overwrote a real mid-chapter resume
 * point with verse 0 the instant the timer fired — defeating the entire point
 * of falling asleep mid-chapter and resuming later where you left off.
 *
 * Fix: both call sites now call pause() instead — same effect on
 * isPlaying/isLoading, but isPaused: true and currentVerseIndex left
 * untouched, mirroring the existing "pause on backgrounding" effect a few
 * lines down in the same file. hidePlayer/clearChapter still call the real
 * stop() unchanged (those two really do mean "reset").
 */
import React from 'react';
import {renderHook, act} from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import {getLastPosition} from '../src/features/audio/lib/playbackPositionStore';
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

const chapter: AudioVerse[] = [1, 2, 3, 4, 5].map(v => ({
  book: 'Juan',
  chapter: 3,
  verse: v,
  text: `Verso ${v}`,
}));

const wrapper = ({children}: {children: React.ReactNode}) => (
  <AudioPlayerProvider>{children}</AudioPlayerProvider>
);

/** Load the chapter, jump to (and start "playing") a mid-chapter verse. */
async function playFromMidChapter(result: {
  current: ReturnType<typeof useAudioPlayer>;
}) {
  const speak = Speech.speak as jest.Mock;
  await act(async () => result.current.loadChapter(chapter));
  await act(async () => result.current.goToVerse(3)); // verse 4 of 5
  await act(async () => result.current.play());

  const lastCall = speak.mock.calls.at(-1);
  expect(lastCall?.[0]).toBe('Verso 4');
  act(() => lastCall?.[1].onStart());

  expect(result.current.state.isPlaying).toBe(true);
  expect(result.current.state.currentVerseIndex).toBe(3);
}

describe('sleep timer expiry preserves the resume position (regression)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('pauses instead of stopping when the live setTimeout fires mid-chapter', async () => {
    jest.useFakeTimers();
    try {
      const {result} = renderHook(() => useAudioPlayer(), {wrapper});
      await playFromMidChapter(result);

      await act(async () => result.current.setSleepTimer(5));

      // The timer's setTimeout is armed for 5 minutes — let it fire.
      await act(async () => {
        jest.advanceTimersByTime(5 * 60 * 1000 + 1);
      });

      // Playback actually stopped…
      expect(Speech.stop).toHaveBeenCalled();
      expect(result.current.state.isPlaying).toBe(false);
      // …but as a PAUSE, not a full stop: the verse index must survive.
      expect(result.current.state.isPaused).toBe(true);
      expect(result.current.state.currentVerseIndex).toBe(3);

      // The saved "Continue listening" position must not have been
      // overwritten down to verse 0/1 by a stop()-driven reset.
      const saved = await getLastPosition();
      expect(saved?.verseIndex).toBe(3);
      expect(saved?.verse).toBe(4);
    } finally {
      jest.useRealTimers();
    }
  });

  it('pauses instead of stopping when reconciled on foreground return after expiring while backgrounded', async () => {
    jest.useFakeTimers();
    try {
      const {result} = renderHook(() => useAudioPlayer(), {wrapper});
      await playFromMidChapter(result);

      await act(async () => result.current.setSleepTimer(5));
      const endTimeMs = result.current.sleepTimer.endTime?.getTime();
      expect(typeof endTimeMs).toBe('number');

      // Simulate the timer's wall-clock endTime elapsing while backgrounded
      // WITHOUT the JS setTimeout actually firing (JS timers are
      // suspended/throttled while backgrounded — the whole reason the
      // foreground-reconciliation effect exists). jest.setSystemTime moves
      // the clock without running any pending timers.
      jest.setSystemTime(new Date((endTimeMs as number) + 5_000));

      // Fire every registered AppState 'change' listener with 'active', as
      // real app-foregrounding would. The OTHER 'change' listener in this
      // file (pause-on-backgrounding) only acts on 'background' and is a
      // no-op here.
      const changeHandlers = (AppState.addEventListener as jest.Mock).mock.calls
        .filter(([type]) => type === 'change')
        .map(([, handler]) => handler as (state: string) => void);
      expect(changeHandlers.length).toBeGreaterThan(0);

      await act(async () => {
        changeHandlers.forEach(handler => handler('active'));
      });

      expect(Speech.stop).toHaveBeenCalled();
      expect(result.current.state.isPlaying).toBe(false);
      expect(result.current.state.isPaused).toBe(true);
      expect(result.current.state.currentVerseIndex).toBe(3);

      const saved = await getLastPosition();
      expect(saved?.verseIndex).toBe(3);
      expect(saved?.verse).toBe(4);
    } finally {
      jest.useRealTimers();
    }
  });
});
