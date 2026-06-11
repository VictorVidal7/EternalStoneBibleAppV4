/**
 * Sprint 77 — paused verse navigation on AudioPlayerProvider.
 *
 * A collapsed-bar swipe while PAUSED moves the resume point with no audible
 * cue. These tests pin the contract that makes that move trustworthy: the
 * index shifts WITHOUT speaking, and a play() landing in the same tick as the
 * move resumes from the moved verse — previousVerse used to skip the
 * synchronous stateRef sync that nextVerse already had, so an immediate
 * resume replayed the pre-swipe verse.
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

const mockSpeech = Speech as jest.Mocked<typeof Speech>;

const verses: AudioVerse[] = [1, 2, 3].map(v => ({
  book: 'Psalms',
  chapter: 118,
  verse: v,
  text: `Verse ${v} text`,
}));

const wrapper = ({children}: {children: React.ReactNode}) => (
  <AudioPlayerProvider>{children}</AudioPlayerProvider>
);

describe('paused verse navigation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('moves the index without speaking while paused', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.loadChapter(verses));
    await act(async () => result.current.goToVerse(2));
    await act(async () => result.current.previousVerse());

    expect(result.current.state.currentVerseIndex).toBe(1);
    expect(mockSpeech.speak).not.toHaveBeenCalled();
  });

  it('previousVerse + immediate play resumes from the moved verse', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.loadChapter(verses));
    await act(async () => result.current.goToVerse(2));

    // Same tick: the effect mirroring state into the ref has not run yet, so
    // play() must see the move through the synchronous ref sync.
    await act(async () => {
      result.current.previousVerse();
      result.current.play();
    });

    expect(mockSpeech.speak).toHaveBeenCalledTimes(1);
    expect(mockSpeech.speak.mock.calls[0][0]).toBe('Verse 2 text');
  });

  it('nextVerse + immediate play resumes from the moved verse (parity)', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.loadChapter(verses));

    await act(async () => {
      result.current.nextVerse();
      result.current.play();
    });

    expect(mockSpeech.speak).toHaveBeenCalledTimes(1);
    expect(mockSpeech.speak.mock.calls[0][0]).toBe('Verse 2 text');
  });

  it('clamps at the chapter edges without speaking', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.loadChapter(verses));
    await act(async () => result.current.previousVerse());

    expect(result.current.state.currentVerseIndex).toBe(0);
    expect(mockSpeech.speak).not.toHaveBeenCalled();
  });
});
