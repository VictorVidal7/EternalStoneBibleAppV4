/**
 * Sprint 79 — verse playlists on AudioPlayerProvider.
 *
 * Pins the queue-mode contract: loadChapter with {mode: 'playlist'} exposes
 * the playlist identity via queueInfo, a PLAIN loadChapter resets it (every
 * historical call site — advancer jumps, bookmark jumps, cold-start restore —
 * stays a chapter load by construction), and clearChapter drops it too.
 */
import React from 'react';
import {renderHook, act} from '@testing-library/react-native';
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
  {book: 'Génesis', chapter: 1, verse: 1, text: 'En el principio…'},
  {book: 'Salmos', chapter: 23, verse: 1, text: 'Jehová es mi pastor…'},
  {book: 'Juan', chapter: 3, verse: 16, text: 'Porque de tal manera…'},
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

describe('verse playlist queue mode', () => {
  beforeEach(() => jest.clearAllMocks());

  it('starts in chapter mode with no label', () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    expect(result.current.queueInfo).toEqual({mode: 'chapter', label: null});
  });

  it('exposes the playlist identity when loaded with options', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () =>
      result.current.loadChapter(playlist, {
        mode: 'playlist',
        label: 'Mis favoritos',
      }),
    );
    expect(result.current.queueInfo).toEqual({
      mode: 'playlist',
      label: 'Mis favoritos',
    });
    expect(result.current.state.totalVerses).toBe(3);
    expect(result.current.isVisible).toBe(true);
  });

  it('a plain loadChapter resets the queue back to chapter mode', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () =>
      result.current.loadChapter(playlist, {
        mode: 'playlist',
        label: 'Mis favoritos',
      }),
    );
    await act(async () => result.current.loadChapter(chapter));
    expect(result.current.queueInfo).toEqual({mode: 'chapter', label: null});
  });

  it('ignores a label without playlist mode', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () =>
      result.current.loadChapter(chapter, {label: 'ruido'}),
    );
    expect(result.current.queueInfo).toEqual({mode: 'chapter', label: null});
  });

  it('clearChapter drops the playlist identity', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () =>
      result.current.loadChapter(playlist, {
        mode: 'playlist',
        label: 'Mis favoritos',
      }),
    );
    await act(async () => {
      await result.current.clearChapter();
    });
    expect(result.current.queueInfo).toEqual({mode: 'chapter', label: null});
  });
});
