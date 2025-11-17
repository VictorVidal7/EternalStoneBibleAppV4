/**
 * 🎨 DESIGN TOKENS - Sistema de Diseño Moderno
 *
 * Design tokens centralizados para mantener consistencia visual
 * a lo largo de toda la aplicación.
 */

// ==================== SPACING SYSTEM ====================
// Sistema de espaciado basado en múltiplos de 4 (Escala perfecta 8pt grid)
export const spacing = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  xs: 8,
  sm: 12,
  md: 16,
  base: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
  '6xl': 96,
} as const;

// ==================== TYPOGRAPHY ====================
// Escala tipográfica modular perfecta (1.25 ratio - Major Third)
// Sistema refinado para máxima legibilidad y jerarquía visual
export const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 30,  // Mejorado para títulos más impactantes
  '3xl': 36,
  '4xl': 44,
  '5xl': 52,
  '6xl': 64,
  '7xl': 72,
  '8xl': 84,
  '9xl': 96,
} as const;

export const fontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',  // Añadido para títulos ultra destacados
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.375,  // Añadido para mejor control
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
  super: 1.5,  // Para textos con mucha separación
} as const;

// ==================== BORDER RADIUS ====================
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
} as const;

// ==================== SHADOWS ====================
// Sistema de sombras mejorado con profundidad realista
// Inspirado en Material Design 3 y iOS Human Interface Guidelines
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
  },
  '3xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  // Sombras especiales
  inner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 0,
  },
  colored: {
    primary: {
      shadowColor: '#667eea',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    secondary: {
      shadowColor: '#10b981',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    accent: {
      shadowColor: '#f59e0b',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
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
    fadeIn: { duration: 300, useNativeDriver: true },
    fadeOut: { duration: 200, useNativeDriver: true },
    slideIn: { duration: 350, useNativeDriver: true },
    slideOut: { duration: 250, useNativeDriver: true },
    scale: { duration: 300, useNativeDriver: true },
    rotate: { duration: 400, useNativeDriver: true },
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
  sm: 375,  // iPhone SE
  md: 414,  // iPhone Pro Max
  lg: 768,  // iPad
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
