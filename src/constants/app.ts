/**
 * 📝 APPLICATION CONSTANTS
 *
 * Constantes globales de la aplicación para evitar magic numbers
 * y mejorar la mantenibilidad del código.
 */

// ==================== ANIMATION ====================

export const ANIMATION = {
  /** Duración estándar de animaciones rápidas (ms) */
  DURATION_FAST: 200,
  /** Duración estándar de animaciones normales (ms) */
  DURATION_NORMAL: 300,
  /** Duración estándar de animaciones lentas (ms) */
  DURATION_SLOW: 500,
  /** Tensión para spring animations */
  SPRING_TENSION: 50,
  /** Fricción para spring animations */
  SPRING_FRICTION: 7,
} as const;

// ==================== PERFORMANCE ====================

export const PERFORMANCE = {
  /** Debounce time para búsqueda (ms) */
  SEARCH_DEBOUNCE: 300,
  /** Debounce time para auto-save (ms) */
  AUTOSAVE_DEBOUNCE: 1000,
  /** Número de items por página en listas virtuales */
  ITEMS_PER_PAGE: 50,
  /** Número inicial de items a renderizar */
  INITIAL_RENDER_COUNT: 10,
  /** Window size para FlashList */
  WINDOW_SIZE: 5,
} as const;

// ==================== DATABASE ====================

export const DATABASE = {
  /** Nombre de la base de datos */
  NAME: 'eternal_bible.db',
  /** Versión de la base de datos */
  VERSION: 1,
  /** Tamaño máximo de caché (MB) */
  MAX_CACHE_SIZE: 50,
  /** Timeout para queries (ms) */
  QUERY_TIMEOUT: 5000,
} as const;

// ==================== BIBLE ====================

export const BIBLE = {
  /** Número total de libros en la Biblia */
  TOTAL_BOOKS: 66,
  /** Número de libros en el Antiguo Testamento */
  OLD_TESTAMENT_BOOKS: 39,
  /** Número de libros en el Nuevo Testamento */
  NEW_TESTAMENT_BOOKS: 27,
  /** Número total de versículos */
  TOTAL_VERSES: 31102,
  /** Número total de capítulos */
  TOTAL_CHAPTERS: 1189,
} as const;

// ==================== USER LEVELS ====================

export const USER_LEVELS = [
  {level: 1, name: 'Aprendiz', minPoints: 0},
  {level: 2, name: 'Estudiante', minPoints: 500},
  {level: 3, name: 'Lector', minPoints: 1500},
  {level: 4, name: 'Devoto', minPoints: 3000},
  {level: 5, name: 'Erudito', minPoints: 5000},
  {level: 6, name: 'Sabio', minPoints: 8000},
  {level: 7, name: 'Maestro', minPoints: 12000},
  {level: 8, name: 'Mentor', minPoints: 17000},
  {level: 9, name: 'Guía', minPoints: 23000},
  {level: 10, name: 'Leyenda', minPoints: 30000},
] as const;

// ==================== ACHIEVEMENTS ====================

export const ACHIEVEMENT_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
} as const;

export const ACHIEVEMENT_POINTS = {
  [ACHIEVEMENT_TIERS.BRONZE]: 10,
  [ACHIEVEMENT_TIERS.SILVER]: 25,
  [ACHIEVEMENT_TIERS.GOLD]: 50,
  [ACHIEVEMENT_TIERS.PLATINUM]: 100,
  [ACHIEVEMENT_TIERS.DIAMOND]: 200,
} as const;

// ==================== HIGHLIGHTS ====================

export const HIGHLIGHT_COLORS = {
  YELLOW: '#fef3c7',
  GREEN: '#d1fae5',
  BLUE: '#dbeafe',
  PURPLE: '#e9d5ff',
  PINK: '#fce7f3',
  ORANGE: '#fed7aa',
  RED: '#fecaca',
  GRAY: '#e5e7eb',
} as const;

export const HIGHLIGHT_CATEGORIES = [
  'Promise',
  'Prayer',
  'Commandment',
  'Wisdom',
  'Prophecy',
  'Worship',
  'Teaching',
  'Personal',
] as const;

// ==================== VALIDATION ====================

export const VALIDATION = {
  /** Longitud mínima de nota */
  MIN_NOTE_LENGTH: 1,
  /** Longitud máxima de nota */
  MAX_NOTE_LENGTH: 5000,
  /** Longitud mínima de búsqueda */
  MIN_SEARCH_LENGTH: 2,
  /** Longitud máxima de búsqueda */
  MAX_SEARCH_LENGTH: 100,
} as const;

// ==================== STORAGE KEYS ====================

export const STORAGE_KEYS = {
  // User Preferences
  THEME: '@theme',
  LANGUAGE: '@language',
  FONT_SIZE: '@fontSize',
  FONT_FAMILY: '@fontFamily',
  LINE_SPACING: '@lineSpacing',
  TEXT_ZOOM: '@textZoom',
  COLOR_THEME: '@colorTheme',

  // Reading
  LAST_READ: '@lastRead',
  READING_PLAN: '@readingPlan',
  READING_MODE: '@readingMode',

  // Data
  USER_STATS: '@userStats',
  ACHIEVEMENTS: '@achievements',
  STREAK_DATA: '@streakData',

  // Settings
  HAPTIC_ENABLED: '@hapticEnabled',
  NOTIFICATIONS_ENABLED: '@notificationsEnabled',
  AUTO_SCROLL_ENABLED: '@autoScrollEnabled',
} as const;

// ==================== COLORS ====================

export const COLORS = {
  // Primary
  PRIMARY: '#6366f1',
  PRIMARY_DARK: '#4f46e5',
  PRIMARY_LIGHT: '#818cf8',

  // Secondary
  SECONDARY: '#10b981',
  SECONDARY_DARK: '#059669',
  SECONDARY_LIGHT: '#34d399',

  // Status
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',

  // Neutral
  WHITE: '#ffffff',
  BLACK: '#000000',
  TRANSPARENT: 'transparent',
} as const;

// ==================== FEATURE FLAGS ====================

export const FEATURES = {
  /** Habilitar analytics */
  ANALYTICS_ENABLED: true,
  /** Habilitar reportes de errores */
  ERROR_REPORTING_ENABLED: true,
  /** Habilitar haptic feedback */
  HAPTIC_FEEDBACK_ENABLED: true,
  /** Habilitar modo offline */
  OFFLINE_MODE_ENABLED: true,
} as const;

// ==================== BREAKPOINTS ====================

export const BREAKPOINTS = {
  /** Ancho mínimo para tablets */
  TABLET: 768,
  /** Ancho mínimo para desktop */
  DESKTOP: 1024,
} as const;

// ==================== Z-INDEX ====================

export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1100,
  FIXED: 1200,
  MODAL_BACKDROP: 1300,
  MODAL: 1400,
  POPOVER: 1500,
  TOOLTIP: 1600,
  NOTIFICATION: 1700,
} as const;
