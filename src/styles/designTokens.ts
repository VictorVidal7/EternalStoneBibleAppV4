/**
 * 🎨 DESIGN TOKENS - Sistema de Diseño Moderno
 *
 * Design tokens centralizados para mantener consistencia visual
 * a lo largo de toda la aplicación.
 */

// ==================== SPACING SYSTEM ====================
// Sistema de espaciado basado en múltiplos de 4
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

// ==================== TYPOGRAPHY ====================
// Escala tipográfica modular (1.25 ratio - Major Third)
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
} as const;

export const fontWeight = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

export const lineHeight = {
  tight: 1.2,
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
  widest: 1,
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
// Sistema de sombras para diferentes elevaciones
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// ==================== ANIMATION ====================
export const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'spring',
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
// Gradientes modernos pre-definidos
export const gradients = {
  primary: ['#667eea', '#764ba2'],
  sunset: ['#ff6b6b', '#feca57'],
  ocean: ['#4facfe', '#00f2fe'],
  forest: ['#2ecc71', '#27ae60'],
  purple: ['#a8c0ff', '#3f2b96'],
  fire: ['#f12711', '#f5af19'],
  aurora: ['#667eea', '#764ba2', '#f093fb'],
  midnight: ['#232526', '#414345'],
  royal: ['#141e30', '#243b55'],
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
