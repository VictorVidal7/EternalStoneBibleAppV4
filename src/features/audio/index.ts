/**
 * Audio Bible Feature
 *
 * Text-to-Speech con reproductor flotante estilo Spotify
 * Soporta espanol e ingles
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

// Context & Provider
export {
  AudioPlayerProvider,
  useAudioPlayer,
} from './context/AudioPlayerContext';

// Components
export {
  MiniAudioPlayer,
  AudioControls,
  AudioProgressBar,
  MiniProgressDots,
  AudioSpeedSelector,
  VoiceSelector,
  SleepTimerModal,
} from './components';

// Hooks
export {useVoices} from './hooks/useVoices';
export {useSleepTimer} from './hooks/useSleepTimer';

// Types
export type {
  AudioPlayerState,
  AudioPlayerContextValue,
  AudioVerse,
  AudioChapter,
  VoiceInfo,
  PlaybackSpeed,
  AudioLanguage,
  SleepTimerState,
  AudioPreferences,
  AudioEvent,
} from './types/audio';

// Constants
export {
  PLAYBACK_SPEEDS,
  PLAYBACK_SPEED_LABELS,
  DEFAULT_PLAYBACK_SPEED,
  SUPPORTED_LANGUAGES,
  LANGUAGE_LABELS,
  LANGUAGE_FLAGS,
  DEFAULT_LANGUAGE,
  SLEEP_TIMER_OPTIONS,
  PLAYER_DIMENSIONS,
  AUDIO_STORAGE_KEYS,
  AUDIO_ICONS,
} from './constants/audioConstants';

// Playback position — "Continue listening" (Sprint 51)
export {
  getLastPosition,
  setLastPosition,
  clearLastPosition,
} from './lib/playbackPositionStore';
export {
  clampVerseIndex,
  isResumable,
  isSameChapter,
  createPosition,
  parsePosition,
  serializePosition,
  RESUME_MAX_AGE_MS,
} from './lib/playbackPosition';
export type {PlaybackPosition} from './lib/playbackPosition';
