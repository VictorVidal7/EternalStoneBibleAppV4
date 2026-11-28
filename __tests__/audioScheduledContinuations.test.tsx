/**
 * Regression — R9-426: what is paused, stopped or closed in a gap of the
 * narration must not sound again.
 *
 * Two gaps:
 * - between two verses: onDone schedules the next verse 50 ms later, and the
 *   scheduled call never asked whether playback was paused since (a timed
 *   sleep timer expiring there, a pause, backgrounding). Its onStart then
 *   overwrote the pause.
 * - between two chapters: AudioChapterAdvancer reads the next chapter from
 *   the DB, loads it (which reopens the player) and plays it 150 ms later,
 *   whether or not the user closed the player or paused in the meantime.
 *
 * Fix: the engine carries a private run id that pause / stop / background /
 * load / a direct start advance, and every scheduled continuation checks it;
 * the advancer gives up when the player was hidden, paused or started.
 * R9-425 (the end-of-chapter timer) is untouched: its own test stays green.
 *
 * The REAL provider and the REAL advancer; only the DB, the version hook and
 * expo-speech are mocked (Speech.speak is the spy of what sounds).
 */
import React from 'react';
import {AppState} from 'react-native';
import {renderHook, act} from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from '../src/features/audio/context/AudioPlayerContext';
import {AudioChapterAdvancer} from '../src/features/audio/components/AudioChapterAdvancer';
import {getLastPosition} from '../src/features/audio/lib/playbackPositionStore';
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

const chapterOf = (chapter: number, count = 2): AudioVerse[] =>
  Array.from({length: count}, (_, i) => ({
    book: 'Juan',
    chapter,
    verse: i + 1,
    text: `Juan ${chapter}:${i + 1}`,
  }));

const wrapper = ({children}: {children: React.ReactNode}) => (
  <AudioPlayerProvider>
    <AudioChapterAdvancer />
    {children}
  </AudioPlayerProvider>
);

const speak = Speech.speak as jest.Mock;
const spokenTexts = () => speak.mock.calls.map(call => call[0]);

async function tick(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

/** The utterance in flight starts and ends; the 50 ms gap is NOT run. */
async function endCurrentVerse(expectedText: string) {
  const call = speak.mock.calls.at(-1);
  expect(call?.[0]).toBe(expectedText);
  act(() => call?.[1].onStart());
  await act(async () => {
    call?.[1].onDone();
  });
}

async function startChapter(result: Player, chapter: number, count = 2) {
  await act(async () => result.current.loadChapter(chapterOf(chapter, count)));
  await act(async () => result.current.play());
}

function sendAppState(next: string) {
  const handlers = (AppState.addEventListener as jest.Mock).mock.calls
    .filter(([type]) => type === 'change')
    .map(([, handler]) => handler as (s: string) => void);
  expect(handlers.length).toBeGreaterThan(0);
  handlers.forEach(handler => handler(next));
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockGetChapter.mockImplementation(async (_bookId: number, chapter: number) =>
    chapterOf(chapter),
  );
});

afterEach(() => {
  jest.useRealTimers();
});

describe('R9-426 — the gap between two verses', () => {
  it('control: uninterrupted, verse after verse and into the next chapter', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3);
    await endCurrentVerse('Juan 3:1');
    await tick(60);
    await endCurrentVerse('Juan 3:2');
    for (let i = 0; i < 5; i++) await tick(200);
    expect(spokenTexts()).toEqual(['Juan 3:1', 'Juan 3:2', 'Juan 4:1']);
    expect(result.current.isVisible).toBe(true);
  });

  it('a timed sleep timer that expires in the gap stops the narration', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 5);
    act(() => speak.mock.calls.at(-1)?.[1].onStart());
    await act(async () => result.current.setSleepTimer(1));
    await tick(60 * 1000 - 20);
    await act(async () => {
      speak.mock.calls.at(-1)?.[1].onDone();
    });
    await tick(25); // the timer expires (pause + cancel)
    await tick(40); // the 50 ms continuation comes due
    expect(spokenTexts()).toEqual(['Juan 3:1']);
    expect(result.current.state.isPaused).toBe(true);
    expect(result.current.state.isPlaying).toBe(false);
    expect(result.current.sleepTimer.isActive).toBe(false);
  });

  it('a pause in the gap holds', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 5);
    await endCurrentVerse('Juan 3:1');
    await act(async () => result.current.pause());
    await tick(200);
    expect(spokenTexts()).toEqual(['Juan 3:1']);
    expect(result.current.state.isPaused).toBe(true);
  });

  it('control: pause, then play, speaks again from where it paused', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 5);
    await endCurrentVerse('Juan 3:1');
    await act(async () => result.current.pause());
    await tick(200);
    await act(async () => result.current.play());
    act(() => speak.mock.calls.at(-1)?.[1].onStart());
    expect(spokenTexts()).toEqual(['Juan 3:1', 'Juan 3:1']);
    expect(result.current.state.isPlaying).toBe(true);
    await act(async () => {
      speak.mock.calls.at(-1)?.[1].onDone();
    });
    await tick(60);
    expect(spokenTexts()).toEqual(['Juan 3:1', 'Juan 3:1', 'Juan 3:2']);
  });

  it('backgrounding in the gap holds', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 5);
    await endCurrentVerse('Juan 3:1');
    await act(async () => sendAppState('background'));
    await tick(200);
    expect(spokenTexts()).toEqual(['Juan 3:1']);
    expect(result.current.state.isPaused).toBe(true);
  });

  it('a late onStart of the next verse does not undo a pause', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 5);
    await endCurrentVerse('Juan 3:1');
    await tick(60); // Juan 3:2 is handed to the engine
    expect(spokenTexts()).toEqual(['Juan 3:1', 'Juan 3:2']);
    await act(async () => result.current.pause());
    act(() => speak.mock.calls.at(-1)?.[1].onStart());
    expect(result.current.state.isPaused).toBe(true);
    expect(result.current.state.isPlaying).toBe(false);
  });

  it('a pause while the next verse is stopping the engine holds', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 5);
    await endCurrentVerse('Juan 3:1');
    // the continuation's own Speech.stop() hangs until released
    let releaseStop: () => void = () => undefined;
    (Speech.stop as jest.Mock).mockImplementationOnce(
      () =>
        new Promise<void>(res => {
          releaseStop = res;
        }),
    );
    await tick(60);
    await act(async () => result.current.pause());
    await act(async () => releaseStop());
    expect(spokenTexts()).toEqual(['Juan 3:1']);
    expect(result.current.state.isPaused).toBe(true);
  });

  it('control: the repeat-verse loop keeps looping', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 5);
    act(() => result.current.setRepeatVerse(true));
    await endCurrentVerse('Juan 3:1');
    await tick(60);
    await endCurrentVerse('Juan 3:1');
    await tick(60);
    expect(spokenTexts()).toEqual(['Juan 3:1', 'Juan 3:1', 'Juan 3:1']);
  });

  it('control: a repeating playlist wraps to its start', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await act(async () =>
      result.current.loadChapter(chapterOf(3), {
        mode: 'playlist',
        label: 'Lista',
      }),
    );
    act(() => result.current.setQueueRepeat(true));
    await act(async () => result.current.play());
    await endCurrentVerse('Juan 3:1');
    await tick(60);
    await endCurrentVerse('Juan 3:2');
    await tick(60);
    expect(spokenTexts()).toEqual(['Juan 3:1', 'Juan 3:2', 'Juan 3:1']);
  });
});

describe('R9-426 — the gap between two chapters', () => {
  it('closing the player while the next chapter is read from the DB keeps it closed and silent', async () => {
    let releaseChapter: () => void = () => undefined;
    mockGetChapter.mockImplementation(
      (_bookId: number, chapter: number) =>
        new Promise(res => {
          releaseChapter = () => res(chapterOf(chapter));
        }),
    );
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 1);
    await endCurrentVerse('Juan 3:1');
    await tick(10);
    expect(mockGetChapter).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.hidePlayer();
    });
    await act(async () => releaseChapter());
    for (let i = 0; i < 4; i++) await tick(100);
    expect(spokenTexts()).toEqual(['Juan 3:1']);
    expect(result.current.isVisible).toBe(false);
    expect(await getLastPosition()).toBeNull();
  });

  it('closing the player in the 150 ms before the next chapter plays keeps it silent', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 1);
    await endCurrentVerse('Juan 3:1');
    // getChapter resolved and the next chapter is loaded; play() is due
    expect(result.current.verses[0]?.text).toBe('Juan 4:1');
    await act(async () => {
      await result.current.hidePlayer();
    });
    for (let i = 0; i < 4; i++) await tick(100);
    expect(spokenTexts()).toEqual(['Juan 3:1']);
    expect(result.current.isVisible).toBe(false);
    expect(await getLastPosition()).toBeNull();
  });

  it('a pause in the chapter gap (a sleep timer expiring) holds', async () => {
    const {result} = renderHook(() => useAudioPlayer(), {wrapper});
    await startChapter(result, 3, 1);
    await endCurrentVerse('Juan 3:1');
    await act(async () => result.current.pause());
    for (let i = 0; i < 4; i++) await tick(100);
    expect(spokenTexts()).toEqual(['Juan 3:1']);
    expect(result.current.state.isPaused).toBe(true);
  });
});
