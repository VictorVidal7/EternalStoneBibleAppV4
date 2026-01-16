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

export const SLEEP_TIMER_OPTIONS = [
  {minutes: 5, label: '5 min'},
  {minutes: 10, label: '10 min'},
  {minutes: 15, label: '15 min'},
  {minutes: 30, label: '30 min'},
  {minutes: 60, label: '1 hora'},
] as const;

// ==================== PLAYER DIMENSIONS ====================

export const PLAYER_DIMENSIONS = {
  collapsedHeight: 64,
  expandedHeight: 220,
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

// ==================== ACCESSIBILITY ====================

export const AUDIO_A11Y_LABELS = {
  play: 'Reproducir audio',
  pause: 'Pausar audio',
  stop: 'Detener audio',
  nextVerse: 'Siguiente versiculo',
  previousVerse: 'Versiculo anterior',
  speed: 'Velocidad de reproduccion',
  timer: 'Temporizador de sueno',
  voice: 'Seleccionar voz',
  expand: 'Expandir reproductor',
  collapse: 'Minimizar reproductor',
  close: 'Cerrar reproductor',
};
// ==================== COLORS ====================

export const AUDIO_COLORS = {
  white: '#FFFFFF',
  black: '#000000',
  shadow: '#000000',
};
