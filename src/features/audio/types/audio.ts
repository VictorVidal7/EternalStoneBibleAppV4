/**
 * Audio Bible Types
 *
 * Tipos TypeScript para la funcionalidad de Audio Bible con TTS
 * Para la gloria de Dios - Eternal Stone Bible App
 */

// ==================== PLAYBACK TYPES ====================

// 2.25/2.5 are premium-only (see FREE_MAX_PLAYBACK_SPEED in audioConstants.ts).
export type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2 | 2.25 | 2.5;

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
  /**
   * Language of the text currently loaded in the engine (its Bible version's
   * language), captured at load time — what the narration actually speaks
   * (Sprint 100). Null when nothing is loaded / a legacy load without version
   * info. The voice selector locks its list to this so the UI never offers a
   * voice that would be dropped for not matching the spoken language (S101).
   */
  contentLanguage: AudioLanguage | null;
  /**
   * Bible version id of the text currently loaded in the engine, captured at
   * load time (Sprint 102). Lets a screen detect that the user switched the
   * reading version mid-listen — the engine still holds the OLD version's
   * text/language — and re-sync the queue to the version now on screen. Null
   * when nothing is loaded / a legacy load without version info.
   */
  contentVersionId: string | null;
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
  mode: 'time' | 'end-of-chapter' | 'end-of-book' | null;
}

// ==================== VERSE TYPES ====================

export interface AudioVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

// ==================== QUEUE TYPES (Sprint 79) ====================

/**
 * What kind of queue the engine is holding. `chapter` is the historical
 * contract (one contiguous Bible chapter; continuous playback may roll into
 * the next one). `playlist` is an arbitrary mixed-verse queue (favorites, a
 * collection, a plan day) — continuous playback does NOT roll past its end and
 * the saved "continue listening" position is not overwritten.
 */
export type AudioQueueMode = 'chapter' | 'playlist';

export interface AudioQueueInfo {
  mode: AudioQueueMode;
  /** Display label for a playlist ("Mis favoritos", a collection name); null in chapter mode. */
  label: string | null;
}

/**
 * Runtime toggles of the playing queue (Sprint 80). Only playlists honour
 * them; a plain `loadChapter` resets both to off, so every historical call
 * site keeps its contract by construction.
 */
export interface AudioQueueOptions {
  /** Upcoming verses play in a random devotional order. */
  shuffle: boolean;
  /** The list wraps back to its start instead of stopping at the end. */
  repeat: boolean;
}

/** Optional `loadChapter` queue metadata; omitted = a plain chapter load. */
export interface LoadQueueOptions {
  mode?: AudioQueueMode;
  label?: string;
  /**
   * The language of the loaded text (its Bible version's language). Drives the
   * TTS narration so the voice matches the text — a Spanish chapter is never
   * read by an English voice (Sprint 100). Omitted: the engine falls back to
   * the live selected version's language, then to the manual audio-language
   * preference, preserving the historical behaviour.
   */
  language?: AudioLanguage;
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

  /**
   * Reader follow — when on, the NORMAL reader screen navigates along with
   * continuous playback when it auto-advances into the next chapter
   * (Sprint 74). Opt-in (defaults off); persisted in `AudioPreferences`.
   */
  readerFollowsAudio: boolean;
  setReaderFollowsAudio: (enabled: boolean) => void;

  /**
   * Memorization "repeat verse" loop — when on, the engine re-speaks the CURRENT
   * verse when it finishes instead of advancing, so a single verse loops while
   * the user memorizes it (pairs with the SRS). Runtime-only (not persisted);
   * defaults off. Takes precedence over continuous advance / playlist repeat.
   */
  repeatVerse: boolean;
  setRepeatVerse: (enabled: boolean) => void;

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
  setSleepTimerEndOfBook: () => void;
  cancelSleepTimer: () => void;

  // Chapter loading
  loadChapter: (verses: AudioVerse[], options?: LoadQueueOptions) => void;
  clearChapter: () => void;
  setBottomOffset: (offset: number) => void;

  /**
   * What the engine's queue currently is (Sprint 79 — verse playlists). A
   * plain `loadChapter(verses)` resets it to `{mode: 'chapter', label: null}`,
   * so every historical call site stays a chapter load by construction.
   */
  queueInfo: AudioQueueInfo;

  /**
   * Runtime queue toggles (Sprint 80 — devotional shuffle + repeat-the-list).
   * Playlist-only: the setters no-op in chapter mode and a plain
   * `loadChapter` resets both to off. Shuffle/un-shuffle only permute the
   * verses AFTER the one playing, so in-flight indexes stay valid.
   */
  queueOptions: AudioQueueOptions;
  setQueueShuffle: (on: boolean) => void;
  setQueueRepeat: (on: boolean) => void;

  /**
   * Subscribe to word-boundary events from the TTS engine (Sprint 75 —
   * karaoke word highlight). The callback fires on each word the engine is
   * about to voice; returns an unsubscribe. Ref-based fan-out: emitting does
   * NOT re-render the provider, so per-word events stay cheap. Engines that
   * never emit boundaries simply never call back (graceful fallback).
   */
  subscribeToBoundary: (cb: (boundary: SpeechBoundary) => void) => () => void;

  /**
   * Whether the system TTS has an es-ES (Castilian) voice that
   * `pickDefaultSpanishVoiceId` can pin for Spanish narration (58th session).
   * Computed once when the voice list resolves: `null` while unresolved,
   * `false` on a phone with Latin-America Spanish voice data only — the case
   * where "alabadle" et al. get mangled and the mini player shows the one-time
   * "install a Spain voice" prompt.
   */
  hasSpainVoice: boolean | null;
}

/** A word boundary voiced by the TTS engine (Sprint 75 — karaoke). */
export interface SpeechBoundary {
  /** Engine index of the verse being spoken when the boundary fired. */
  verseIndex: number;
  /** Char offset of the word inside that verse's text. */
  charIndex: number;
  /** Char length of the word (0 when the engine omits it). */
  charLength: number;
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
  /** The reader navigates along with continuous playback (Sprint 74). Opt-in. */
  readerFollowsAudio?: boolean;
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
