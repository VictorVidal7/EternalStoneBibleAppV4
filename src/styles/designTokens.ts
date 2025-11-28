/**
 * 🎨 DESIGN TOKENS - Sistema de Diseño Moderno
 *
 * Design tokens centralizados para mantener consistencia visual
 * a lo largo de toda la aplicación.
 */

// ==================== SPACING SYSTEM ====================
// Sistema de espaciado basado en múltiplos de 4 (Escala perfecta 8pt grid)
// Minimalista y profesional - Espaciado consistente en toda la app
export const spacing = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
  // Aliases semánticos para mejor legibilidad
  xs: 8, // 2
  sm: 12, // 3
  md: 16, // 4
  base: 20, // 5
  lg: 24, // 6
  xl: 32, // 8
  '2xl': 40, // 10
  '3xl': 48, // 12
  '4xl': 64, // 16
  '5xl': 80, // 20
  '6xl': 96, // 24
} as const;

// ==================== TYPOGRAPHY ====================
// Escala tipográfica modular perfecta (1.2 ratio - Minor Third)
// Sistema refinado para máxima legibilidad, jerarquía visual y profesionalismo
export const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16, // Base óptimo para lectura
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 28, // Optimizado para títulos principales
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 56,
  '7xl': 64,
  '8xl': 72,
  '9xl': 80,
} as const;

export const fontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900', // Añadido para títulos ultra destacados
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.375, // Añadido para mejor control
  normal: 1.5,
  relaxed: 1.75,
  loose: 2.0,
} as const;

export const letterSpacing = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.25,
  wider: 0.5,
  widest: 1.0,
  super: 1.5, // Para textos con mucha separación
} as const;

// ==================== BORDER RADIUS ====================
// Sistema de border radius moderno y consistente
// Minimalista con bordes suaves para una estética profesional
export const borderRadius = {
  none: 0,
  xs: 6, // Elementos pequeños
  sm: 10, // Botones pequeños, inputs
  md: 14, // Botones estándar
  lg: 18, // Cards pequeños
  xl: 22, // Cards medianos
  '2xl': 28, // Cards grandes
  '3xl': 36, // Elementos destacados
  full: 9999, // Círculos y pills
} as const;

// ==================== SHADOWS ====================
// Sistema de sombras PROFESIONAL - Balance perfecto de profundidad
// Inspirado en Material Design 3 y iOS Human Interface Guidelines
// Sombras optimizadas para crear jerarquía visual clara
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05, // Sutil pero visible
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08, // Cards pequeños
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1, // Cards principales
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.12, // Cards elevados
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15, // Modales y popovers
    shadowRadius: 16,
    elevation: 6,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.2, // Elementos flotantes principales
    shadowRadius: 24,
    elevation: 8,
  },
  '3xl': {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.25, // Diálogos y elementos de máxima elevación
    shadowRadius: 32,
    elevation: 10,
  },
  // Sombras especiales
  inner: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 0,
  },
  colored: {
    primary: {
      shadowColor: '#6366f1', // Indigo shadow
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25, // Más visible para CTA
      shadowRadius: 12,
      elevation: 4,
    },
    secondary: {
      shadowColor: '#10b981', // Green shadow
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    accent: {
      shadowColor: '#FFB74D', // Orange shadow para CTAs
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    error: {
      shadowColor: '#ef4444', // Red shadow
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 2,
    },
  },
} as const;

// ==================== ANIMATION ====================
// Configuraciones de animación siguiendo las curvas de Material Design y iOS
export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 400,
    slower: 500,
    slowest: 700,
  },
  // Configuraciones de spring para React Native Animated
  spring: {
    gentle: {
      tension: 180,
      friction: 12,
    },
    default: {
      tension: 280,
      friction: 20,
    },
    snappy: {
      tension: 380,
      friction: 18,
    },
    bouncy: {
      tension: 300,
      friction: 10,
    },
  },
  // Timing para diferentes tipos de animaciones
  timing: {
    fadeIn: {duration: 300, useNativeDriver: true},
    fadeOut: {duration: 200, useNativeDriver: true},
    slideIn: {duration: 350, useNativeDriver: true},
    slideOut: {duration: 250, useNativeDriver: true},
    scale: {duration: 300, useNativeDriver: true},
    rotate: {duration: 400, useNativeDriver: true},
  },
} as const;

// ==================== OPACITY ====================
export const opacity = {
  disabled: 0.38,
  inactive: 0.54,
  active: 0.87,
  full: 1,
} as const;

// ==================== BREAKPOINTS ====================
export const breakpoints = {
  sm: 375, // iPhone SE
  md: 414, // iPhone Pro Max
  lg: 768, // iPad
  xl: 1024, // iPad Pro
} as const;

// ==================== Z-INDEX ====================
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ==================== GRADIENTS ====================
// 🎨 Gradientes premium modernos optimizados para impacto visual
export const gradients = {
  // Gradientes principales
  primary: ['#667eea', '#764ba2'],
  primaryLight: ['#8098fc', '#9b6dd6'],

  // Naturales
  sunset: ['#ff6b6b', '#ff9a76', '#feca57'],
  sunrise: ['#ff6b95', '#ff8e53', '#feb47b'],
  ocean: ['#4facfe', '#00c6ff', '#00f2fe'],
  forest: ['#2ecc71', '#06d6a0', '#27ae60'],
  aurora: ['#667eea', '#764ba2', '#f093fb', '#4facfe'],

  // Vibrantes
  purple: ['#a8c0ff', '#7c3aed', '#3f2b96'],
  fire: ['#f12711', '#ff5e62', '#f5af19'],
  paradise: ['#1cd8d2', '#93edc7', '#fef9d7'],
  cosmic: ['#6a11cb', '#2575fc', '#00c6fb'],

  // Elegantes
  midnight: ['#000000', '#1a1a2e', '#16213e'],
  royal: ['#141e30', '#1e3c72', '#243b55'],
  rose: ['#ff9a9e', '#fad0c4', '#ffecd2'],
  champagne: ['#dfe9f3', '#ffffff'],

  // Energéticos
  neon: ['#00f2fe', '#4facfe', '#667eea'],
  tropical: ['#f093fb', '#f5576c', '#ffd868'],
  candy: ['#ff6a88', '#ff99ac', '#ffc1cc'],
  citrus: ['#fdeb71', '#f8d800', '#ff6b6b'],

  // Sofisticados
  slate: ['#667eea', '#88a5dd', '#a4b8e0'],
  emerald: ['#134e5e', '#10b981', '#71b280'],
  sapphire: ['#0f2027', '#203a43', '#2c5364'],
  amethyst: ['#7c3aed', '#a78bfa', '#c4b5fd'],

  // Suaves
  peach: ['#ffecd2', '#fcb69f'],
  lavender: ['#a8edea', '#fed6e3'],
  mint: ['#d1fae5', '#a7f3d0', '#6ee7b7'],
  sky: ['#e0f7fa', '#b2ebf2', '#80deea'],

  // Oscuros premium
  deepSpace: ['#000000', '#0f2027', '#203a43'],
  darkPurple: ['#0f0c29', '#302b63', '#24243e'],
  darkOcean: ['#000046', '#1cb5e0'],
  charcoal: ['#0d0d0d', '#1a1a1a', '#2d2d2d'],
} as const;

// ==================== GLASSMORPHISM ====================
// Efectos de vidrio para diseño moderno
export const glass = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  dark: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
} as const;

// ==================== BLUR ====================
export const blur = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
} as const;

// ==================== ICON SIZES ====================
export const iconSize = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  '2xl': 64,
} as const;

// ==================== HELPERS ====================
/**
 * Obtiene el valor de spacing de manera type-safe
 */
export const getSpacing = (...values: (keyof typeof spacing)[]) => {
  return values.map(key => spacing[key]);
};

/**
 * Obtiene múltiplos del spacing base
 */
export const getSpacingMultiple = (multiple: number) => {
  return spacing.base * multiple;
};

// ==================== TYPES ====================
export type Spacing = keyof typeof spacing;
export type FontSize = keyof typeof fontSize;
export type FontWeight = keyof typeof fontWeight;
export type BorderRadius = keyof typeof borderRadius;
export type Shadow = keyof typeof shadows;
export type Gradient = keyof typeof gradients;
export type IconSize = keyof typeof iconSize;
