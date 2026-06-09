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
  bottomOffset?: number;
  /**
   * Monotonic counter bumped each time a chapter finishes playing naturally
   * (the last verse's narration completes). The `AudioChapterAdvancer`
   * orchestrator watches this to load + play the next chapter for continuous
   * playback (Sprint 72); a counter (not a boolean) so back-to-back chapter
   * ends each fire exactly once.
   */
  chapterEndCount: number;
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
  /** Transient: hide the mini player UI without stopping audio. */
  isSuppressed: boolean;

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

  /**
   * Continuous playback — when on, the player auto-advances into the next
   * chapter once the current one finishes (Sprint 72). Persisted in
   * `AudioPreferences`; a sleep timer set to "end of chapter" still stops.
   */
  autoAdvanceChapter: boolean;
  setAutoAdvanceChapter: (enabled: boolean) => void;

  // Player UI
  expand: () => void;
  collapse: () => void;
  toggleExpanded: () => void;
  showPlayer: () => void;
  hidePlayer: () => void;
  /**
   * Temporarily hide the mini-player without stopping audio. Use when an
   * overlay (bottom sheet, modal) would otherwise be obscured by the
   * player's high elevation/z-index. Audio keeps playing.
   */
  setSuppressed: (suppressed: boolean) => void;

  // Sleep timer
  setSleepTimer: (minutes: number) => void;
  setSleepTimerEndOfChapter: () => void;
  cancelSleepTimer: () => void;

  // Chapter loading
  loadChapter: (verses: AudioVerse[]) => void;
  clearChapter: () => void;
  setBottomOffset: (offset: number) => void;
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
  /** Continuous playback across chapters (Sprint 72). Defaults to true. */
  autoAdvanceChapter: boolean;
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
