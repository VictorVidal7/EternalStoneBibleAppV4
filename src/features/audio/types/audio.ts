/**
 * Audio Bible Types
 *
 * Tipos TypeScript para la funcionalidad de Audio Bible con TTS
 * Para la gloria de Dios - Eternal Stone Bible App
 */

// ==================== PLAYBACK TYPES ====================

export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2;

export type AudioLanguage = 'es' | 'en';

export interface VoiceInfo {
  identifier: string;
  name: string;
  language: string;
  quality: 'Default' | 'Enhanced' | 'Premium';
  isNetworkRequired?: boolean;
}

// ==================== PLAYER STATE ====================

export interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentVerseIndex: number;
  totalVerses: number;
  playbackSpeed: PlaybackSpeed;
  selectedVoice: VoiceInfo | null;
  selectedLanguage: AudioLanguage;
  isExpanded: boolean;
}

export interface SleepTimerState {
  isActive: boolean;
  remainingMinutes: number;
  endTime: Date | null;
  mode: 'time' | 'end-of-chapter' | null;
}

// ==================== VERSE TYPES ====================

export interface AudioVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface AudioChapter {
  book: string;
  chapter: number;
  verses: AudioVerse[];
  totalVerses: number;
}

// ==================== CONTEXT TYPES ====================

export interface AudioPlayerContextValue {
  // State
  state: AudioPlayerState;
  sleepTimer: SleepTimerState;
  currentVerse: AudioVerse | null;
  verses: AudioVerse[];
  isVisible: boolean;

  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlayPause: () => void;
  nextVerse: () => void;
  previousVerse: () => void;
  goToVerse: (index: number) => void;

  // Settings
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  setVoice: (voice: VoiceInfo) => void;
  setLanguage: (language: AudioLanguage) => void;

  // Player UI
  expand: () => void;
  collapse: () => void;
  toggleExpanded: () => void;
  showPlayer: () => void;
  hidePlayer: () => void;

  // Sleep timer
  setSleepTimer: (minutes: number) => void;
  setSleepTimerEndOfChapter: () => void;
  cancelSleepTimer: () => void;

  // Chapter loading
  loadChapter: (verses: AudioVerse[]) => void;
  clearChapter: () => void;
}

// ==================== COMPONENT PROPS ====================

export interface MiniAudioPlayerProps {
  onClose?: () => void;
  bottomOffset?: number;
}

export interface AudioControlsProps {
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export interface AudioProgressBarProps {
  progress: number;
  duration?: number;
  onSeek?: (position: number) => void;
  showTime?: boolean;
  mini?: boolean;
}

export interface AudioSpeedSelectorProps {
  currentSpeed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  variant?: 'chips' | 'dropdown';
}

export interface VoiceSelectorProps {
  currentVoice: VoiceInfo | null;
  onVoiceSelect: (voice: VoiceInfo) => void;
  language?: AudioLanguage;
}

export interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
  onSetTimer: (minutes: number) => void;
  onSetEndOfChapter: () => void;
  currentTimer: SleepTimerState;
}

// ==================== STORAGE TYPES ====================

export interface AudioPreferences {
  playbackSpeed: PlaybackSpeed;
  selectedVoiceId: string | null;
  selectedLanguage: AudioLanguage;
  autoPlay: boolean;
  continueFromLastPosition: boolean;
}

// ==================== EVENTS ====================

export type AudioEvent =
  | {type: 'PLAY'}
  | {type: 'PAUSE'}
  | {type: 'STOP'}
  | {type: 'NEXT'}
  | {type: 'PREVIOUS'}
  | {type: 'VERSE_COMPLETE'; verseIndex: number}
  | {type: 'CHAPTER_COMPLETE'}
  | {type: 'ERROR'; error: string}
  | {type: 'SLEEP_TIMER_END'};
