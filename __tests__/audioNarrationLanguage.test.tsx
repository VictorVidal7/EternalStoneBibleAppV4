/**
 * Sprint 100 — the live engine narrates in the loaded text's language.
 *
 * End-to-end on the real AudioPlayerProvider: a chapter loaded with a Spanish
 * `language` is spoken in Spanish even when an English voice was selected (the
 * "se hace bolas la voz" bug when switching the Bible version mid-listen), and
 * a matching voice is still honoured.
 */
import React from 'react';
import {renderHook, act} from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import type {AudioVerse, VoiceInfo} from '../src/features/audio/types/audio';

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

const chapter: AudioVerse[] = [1, 2].map(v => ({
  book: 'Salmos',
  chapter: 23,
  verse: v,
  text: `Verso ${v}`,
}));

const englishVoice: VoiceInfo = {
  identifier: 'en-voice-1',
  name: 'English Voice',
  language: 'en-US',
  quality: 'Default',
};

const wrapper = ({children}: {children: React.ReactNode}) => (
  <AudioPlayerProvider>{children}</AudioPlayerProvider>
);

function lastSpeakOptions() {
  const speak = Speech.speak as jest.Mock;
  return speak.mock.calls[speak.mock.calls.length - 1]?.[1];
}

describe('narration follows the loaded content language (Sprint 100)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('reads a Spanish-loaded chapter in Spanish despite a selected English voice', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    // The user had picked an English voice (e.g. listening to WEB)…
    await act(async () => result.current.setVoice(englishVoice));
    // …then a Spanish chapter (RVR1960) is loaded (version switched).
    await act(async () =>
      result.current.loadChapter(chapter, {language: 'es'}),
    );
    await act(async () => result.current.play());

    expect(Speech.speak as jest.Mock).toHaveBeenCalled();
    const opts = lastSpeakOptions();
    expect(opts.language).toBe('es-ES');
    expect(opts.voice).toBeUndefined();
  });

  it('honours a matching voice for the content language', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.setVoice(englishVoice));
    await act(async () =>
      result.current.loadChapter(chapter, {language: 'en'}),
    );
    await act(async () => result.current.play());

    const opts = lastSpeakOptions();
    expect(opts.language).toBe('en-US');
    expect(opts.voice).toBe('en-voice-1');
  });
});
