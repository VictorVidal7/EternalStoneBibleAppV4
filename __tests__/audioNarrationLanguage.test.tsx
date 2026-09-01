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

function lastSpeakText() {
  const speak = Speech.speak as jest.Mock;
  return speak.mock.calls[speak.mock.calls.length - 1]?.[0];
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

describe('Spanish-voice pronunciation fixes are applied at speak time', () => {
  beforeEach(() => jest.clearAllMocks());

  const versesWithFixWords: AudioVerse[] = [
    {
      book: 'Salmos',
      chapter: 87,
      verse: 6,
      text: 'Y dijeron: No verá JAH, Ni entenderá el Dios de Jacob.',
    },
  ];

  it('respells JAH before handing text to the engine, leaving Jacob untouched (no default voice)', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () =>
      result.current.loadChapter(versesWithFixWords, {language: 'es'}),
    );
    await act(async () => result.current.play());

    expect(lastSpeakText()).toBe(
      'Y dijeron: No verá Yah, Ni entenderá el Dios de Jacob.',
    );
  });

  it('still applies the fix when a MATCHING Spanish voice is selected (e.g. es-MX, not just es-ES)', async () => {
    const mexicanVoice: VoiceInfo = {
      identifier: 'es-mx-voice-1',
      name: 'Voz Mexicana',
      language: 'es-MX',
      quality: 'Default',
    };
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => result.current.setVoice(mexicanVoice));
    await act(async () =>
      result.current.loadChapter(versesWithFixWords, {language: 'es'}),
    );
    await act(async () => result.current.play());

    // Sanity: the matched-voice branch is the one under test (resolveNarration
    // returns the VOICE's own language tag here, not a bare 'es-ES').
    expect(lastSpeakOptions().language).toBe('es-MX');
    expect(lastSpeakText()).toBe(
      'Y dijeron: No verá Yah, Ni entenderá el Dios de Jacob.',
    );
  });

  it('leaves English narration byte-identical even with the same words present', async () => {
    const englishVerses: AudioVerse[] = [
      {
        book: 'Psalms',
        chapter: 87,
        verse: 6,
        text: 'And they said: shall not see JAH, nor the God of Jacob understand.',
      },
    ];
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () =>
      result.current.loadChapter(englishVerses, {language: 'en'}),
    );
    await act(async () => result.current.play());

    expect(lastSpeakText()).toBe(englishVerses[0].text);
  });
});

describe('es-ES voice auto-selection for Spanish narration (56th session)', () => {
  beforeEach(() => jest.clearAllMocks());

  // Mirrors what the emulator's Google TTS actually reports (57th session):
  // several concrete es-ES local voices + a -network sibling + an es-ES-language
  // alias, all quality "Enhanced".
  const systemVoices = [
    {
      identifier: 'es-us-x-esd-local',
      name: 'es-US',
      language: 'es-US',
      quality: 'Enhanced',
    },
    {
      identifier: 'es-es-x-eee-network',
      name: 'es-ES net',
      language: 'es-ES',
      quality: 'Enhanced',
    },
    {
      identifier: 'es-ES-language',
      name: 'es-ES alias',
      language: 'es-ES',
      quality: 'Enhanced',
    },
    {
      identifier: 'es-es-x-eee-local',
      name: 'es-ES eee',
      language: 'es-ES',
      quality: 'Enhanced',
    },
    {
      identifier: 'es-es-x-eea-local',
      name: 'es-ES eea',
      language: 'es-ES',
      quality: 'Enhanced',
    },
    {
      identifier: 'en-us-x-iom-local',
      name: 'en-US',
      language: 'en-US',
      quality: 'Enhanced',
    },
  ];

  it('pins the deterministic offline concrete es-ES voice when no voice is chosen and Spanish text is loaded', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue(
      systemVoices,
    );
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    // let the mount-time voice enumeration resolve
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () =>
      result.current.loadChapter(chapter, {language: 'es'}),
    );
    await act(async () => result.current.play());

    const opts = lastSpeakOptions();
    expect(opts.language).toBe('es-ES');
    // offline concrete es-ES, lowest identifier — not -network, not the alias
    expect(opts.voice).toBe('es-es-x-eea-local');
  });

  it('does not pin a voice for English narration', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue(
      systemVoices,
    );
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () =>
      result.current.loadChapter(chapter, {language: 'en'}),
    );
    await act(async () => result.current.play());

    const opts = lastSpeakOptions();
    expect(opts.language).toBe('en-US');
    expect(opts.voice).toBeUndefined();
  });

  it('falls back to the OS default when the system has no es-ES voice', async () => {
    (Speech.getAvailableVoicesAsync as jest.Mock).mockResolvedValue([
      {
        identifier: 'es-us-x-esd-local',
        name: 'es-US',
        language: 'es-US',
        quality: 'Enhanced',
      },
    ]);
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () =>
      result.current.loadChapter(chapter, {language: 'es'}),
    );
    await act(async () => result.current.play());

    const opts = lastSpeakOptions();
    expect(opts.language).toBe('es-ES');
    expect(opts.voice).toBeUndefined();
  });
});
