/**
 * AudioPlayerContext.web — inert web stub (stopgap crash fix).
 *
 * See PremiumContext.web.tsx's header comment for the full crash story —
 * this is the same fix for useAudioPlayer(), the third of the three hooks
 * that ~27 web-reachable route files call unconditionally with no
 * AudioPlayerProvider mounted on web.
 *
 * The native provider drives expo-speech TTS, expo-keep-awake, and a fair
 * amount of state (sleep timer, playlists, karaoke word-boundary fan-out).
 * None of that has a web implementation, and this file must not pull any of
 * those native-only modules into the web bundle just to satisfy the type —
 * so every field is a static "nothing is loaded / nothing is playing" value
 * and every control is a no-op. No screen currently renders the mini player
 * on web (app/_layout.web.tsx never mounts MiniAudioPlayer), so none of this
 * is expected to be visibly exercised yet; it only exists so the ~27 routes
 * that call useAudioPlayer() for premium-speed gating / queue metadata don't
 * throw.
 *
 * Metro resolves this file automatically in place of AudioPlayerContext.tsx
 * for any web bundle (see data-loader.web.ts for the established platform-
 * split precedent), so every existing `useAudioPlayer()` call site gets this
 * safe value with ZERO changes to the 27 route files. tsc always resolves a
 * bare `.../context/AudioPlayerContext` import against the NATIVE file, so
 * this file's exported surface must keep matching it (AudioPlayerContextValue
 * comes from the shared, non-platform-split ../types/audio.ts).
 *
 * Scope note: whether Audio Bible should actually work on web (via the
 * browser's SpeechSynthesis API or otherwise) is a later product decision,
 * not addressed here.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React, {createContext, useContext, ReactNode} from 'react';
import {
  AudioPlayerState,
  AudioPlayerContextValue,
  SleepTimerState,
  AudioQueueInfo,
  AudioQueueOptions,
} from '../types/audio';
import {
  DEFAULT_PLAYBACK_SPEED,
  DEFAULT_LANGUAGE,
} from '../constants/audioConstants';

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(
  undefined,
);

const STUB_PLAYER_STATE: AudioPlayerState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  currentVerseIndex: 0,
  totalVerses: 0,
  playbackSpeed: DEFAULT_PLAYBACK_SPEED,
  selectedVoice: null,
  selectedLanguage: DEFAULT_LANGUAGE,
  contentLanguage: null,
  contentVersionId: null,
  isExpanded: false,
  bottomOffset: 0,
  chapterEndCount: 0,
};

const STUB_SLEEP_TIMER_STATE: SleepTimerState = {
  isActive: false,
  remainingMinutes: 0,
  endTime: null,
  mode: null,
};

const STUB_QUEUE_INFO: AudioQueueInfo = {mode: 'chapter', label: null};
const STUB_QUEUE_OPTIONS: AudioQueueOptions = {shuffle: false, repeat: false};

// No-op controls. Named (not inline) so the STUB_VALUE object below has a
// single, stable identity across renders — no consumer ever re-renders just
// because the provider re-rendered.
function noop(): void {}
function noopUnsubscribe(): () => void {
  return () => {};
}

// Static — nothing here ever changes at runtime (there is no audio engine on
// web), so a single stable value object avoids re-rendering every consumer.
const STUB_VALUE: AudioPlayerContextValue = {
  state: STUB_PLAYER_STATE,
  sleepTimer: STUB_SLEEP_TIMER_STATE,
  currentVerse: null,
  verses: [],
  isVisible: false,
  isSuppressed: false,

  play: noop,
  pause: noop,
  stop: noop,
  togglePlayPause: noop,
  nextVerse: noop,
  previousVerse: noop,
  goToVerse: noop,

  setPlaybackSpeed: noop,
  setVoice: noop,
  setLanguage: noop,

  autoAdvanceChapter: false,
  setAutoAdvanceChapter: noop,

  readerFollowsAudio: false,
  setReaderFollowsAudio: noop,

  repeatVerse: false,
  setRepeatVerse: noop,

  expand: noop,
  collapse: noop,
  toggleExpanded: noop,
  showPlayer: noop,
  hidePlayer: noop,
  setSuppressed: noop,

  setSleepTimer: noop,
  setSleepTimerEndOfChapter: noop,
  setSleepTimerEndOfBook: noop,
  cancelSleepTimer: noop,

  loadChapter: noop,
  clearChapter: noop,
  setBottomOffset: noop,

  queueInfo: STUB_QUEUE_INFO,
  queueOptions: STUB_QUEUE_OPTIONS,
  setQueueShuffle: noop,
  setQueueRepeat: noop,

  subscribeToBoundary: noopUnsubscribe,
};

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({
  children,
}) => (
  <AudioPlayerContext.Provider value={STUB_VALUE}>
    {children}
  </AudioPlayerContext.Provider>
);

export const useAudioPlayer = (): AudioPlayerContextValue => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      'useAudioPlayer must be used within an AudioPlayerProvider',
    );
  }
  return context;
};

export default AudioPlayerContext;
