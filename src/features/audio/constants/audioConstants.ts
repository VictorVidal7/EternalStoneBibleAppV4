/**
 * Audio Bible Constants
 *
 * Constantes para la funcionalidad de Audio Bible
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import {PlaybackSpeed, AudioLanguage} from '../types/audio';

// ==================== PLAYBACK SPEEDS ====================

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [
  0.5, 0.75, 1, 1.25, 1.5, 1.75, 2,
];

export const PLAYBACK_SPEED_LABELS: Record<PlaybackSpeed, string> = {
  0.5: '0.5x',
  0.75: '0.75x',
  1: '1x',
  1.25: '1.25x',
  1.5: '1.5x',
  1.75: '1.75x',
  2: '2x',
};

export const DEFAULT_PLAYBACK_SPEED: PlaybackSpeed = 1;

// ==================== LANGUAGES ====================

export const SUPPORTED_LANGUAGES: Record<AudioLanguage, string[]> = {
  es: ['es-ES', 'es-MX', 'es-US', 'es-AR', 'es-CO'],
  en: ['en-US', 'en-GB', 'en-AU', 'en-IN'],
};

export const LANGUAGE_LABELS: Record<AudioLanguage, string> = {
  es: 'Espanol',
  en: 'English',
};

export const LANGUAGE_FLAGS: Record<AudioLanguage, string> = {
  es: '🇪🇸',
  en: '🇺🇸',
};

export const DEFAULT_LANGUAGE: AudioLanguage = 'es';

// ==================== SLEEP TIMER ====================

// Minutes — the label is composed from i18n in the modal so it stays
// localized for both languages (60 → "1 hora" / "1 hour", others → "5 min" …).
export const SLEEP_TIMER_OPTIONS = [
  {minutes: 5},
  {minutes: 10},
  {minutes: 15},
  {minutes: 30},
  {minutes: 60},
] as const;

// ==================== LISTENING QUEUE ====================

// How many upcoming chapters the listening-queue sheet previews (Sprint 75).
export const AUDIO_QUEUE_LENGTH = 5;

// ==================== KEEP-AWAKE ====================

// Tag for the screen wake-lock held WHILE narration is actively playing, so the
// device screen never times out mid-chapter and kills expo-speech (which only
// runs in the foreground). Released the moment playback pauses/stops. A unique
// tag scopes the lock to the audio engine — no other feature's keep-awake is
// affected when we release ours.
export const AUDIO_KEEP_AWAKE_TAG = 'eternal-bible-audio-playback';

// ==================== PLAYER DIMENSIONS ====================

export const PLAYER_DIMENSIONS = {
  collapsedHeight: 64,
  // Bumped from 220 in Sprint 50 to fit the taller premium verse scrubber
  // (draggable track + destination caption) and the free-tier upsell row.
  expandedHeight: 248,
  borderRadius: 20,
  bottomMargin: 16,
  horizontalPadding: 24,
} as const;

// ==================== ANIMATION CONFIGS ====================

export const AUDIO_ANIMATIONS = {
  expandDuration: 300,
  collapseDuration: 250,
  fadeInDuration: 200,
  pulseMinScale: 0.95,
  pulseMaxScale: 1.05,
  pulseDuration: 800,
} as const;

// ==================== STORAGE KEYS ====================

export const AUDIO_STORAGE_KEYS = {
  preferences: '@audio_preferences',
  lastPosition: '@audio_last_position',
  selectedVoice: '@audio_selected_voice',
  listeningStats: '@audio_listening_stats',
  bookmarks: '@audio_bookmarks',
} as const;

// ==================== ICONS ====================

export const AUDIO_ICONS = {
  play: 'play' as const,
  pause: 'pause' as const,
  stop: 'stop' as const,
  next: 'play-skip-forward' as const,
  previous: 'play-skip-back' as const,
  speed: 'speedometer' as const,
  timer: 'timer' as const,
  voice: 'mic' as const,
  close: 'close' as const,
  expand: 'chevron-up' as const,
  collapse: 'chevron-down' as const,
  volume: 'volume-high' as const,
  volumeMute: 'volume-mute' as const,
};

// ==================== CONTROL SIZES ====================

export const AUDIO_CONTROL_SIZES = {
  small: {
    main: 42,
    secondary: 34,
    iconMain: 18,
    iconSecondary: 14,
  },
  medium: {
    main: 56,
    secondary: 44,
    iconMain: 28,
    iconSecondary: 20,
  },
  large: {
    main: 72,
    secondary: 52,
    iconMain: 36,
    iconSecondary: 24,
  },
} as const;

export const AUDIO_CONTROL_GAP = 24;

// ==================== COLORS ====================

export const AUDIO_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  shadow: '#000000',
};
