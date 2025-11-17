/**
 * 🎨 MODERN THEME SYSTEM
 *
 * Sistema de temas avanzado con:
 * - Paletas de colores ricas y modernas
 * - Glassmorphism y gradientes
 * - Dark mode optimizado
 * - Colores semánticos completos
 */

import { borderRadius, shadows, spacing, fontSize, gradients } from './designTokens';

// ==================== COLOR PALETTES ====================

/**
 * Paleta de colores primaria REFINADA - Azul Profundo Premium
 * Balance perfecto entre vibrante y profesional
 */
const primaryPalette = {
  50: '#f0f4ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1', // PRIMARY - Azul índigo sofisticado
  600: '#4f46e5', // Más profundo y elegante
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
  950: '#1e1b4b',
};

/**
 * Paleta de colores secundaria REFINADA - Verde Esmeralda Premium
 * Sofisticado y moderno sin ser agresivo
 */
const secondaryPalette = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981', // SECONDARY - Verde esmeralda balanceado
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
};

/**
 * Paleta de grises - Para textos y fondos
 */
const grayPalette = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
  950: '#0a0a0a',
};

// ==================== SEMANTIC COLORS ====================

/**
 * Colores para Light Mode
 */
export const lightTheme = {
  // Primary & Secondary - Actualizados con nueva paleta
  primary: primaryPalette[500],
  primaryLight: primaryPalette[400],
  primaryDark: primaryPalette[700],
  secondary: secondaryPalette[500],
  secondaryLight: secondaryPalette[400],
  secondaryDark: secondaryPalette[600],

  // Backgrounds - Elegantes y espaciosos con mejor separación
  background: '#fafbfc',  // Gris ultra suave - mejor contraste
  backgroundSecondary: '#f5f7fa',
  backgroundTertiary: '#eef1f5',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  // Cards & Components - Optimizado para evitar superposiciones
  card: '#ffffff',
  cardHover: '#f8f9fa',
  cardPressed: '#f0f2f5',

  // Text
  text: grayPalette[900],
  textSecondary: grayPalette[700],
  textTertiary: grayPalette[600],
  textDisabled: grayPalette[400],
  textInverse: '#ffffff',

  // Borders - Más sutiles para evitar superposiciones visuales
  border: 'rgba(0, 0, 0, 0.06)',
  borderLight: 'rgba(0, 0, 0, 0.04)',
  borderStrong: 'rgba(0, 0, 0, 0.12)',
  divider: 'rgba(0, 0, 0, 0.08)',

  // States
  hover: 'rgba(0, 0, 0, 0.04)',
  pressed: 'rgba(0, 0, 0, 0.08)',
  focus: primaryPalette[500],
  selected: primaryPalette[50],
  disabled: grayPalette[100],

  // Semantic
  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#047857',
  error: '#ef4444',
  errorLight: '#fee2e2',
  errorDark: '#b91c1c',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#d97706',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#1e40af',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayStrong: 'rgba(0, 0, 0, 0.7)',

  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.7)',
  glassLight: 'rgba(255, 255, 255, 0.5)',
  glassStrong: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',

  // Special
  highlight: '#fef08a', // Yellow for highlights
  accent: '#ec4899', // Pink for accents
  link: primaryPalette[600],

  // Shadows
  shadowColor: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.05)',
  shadowMedium: 'rgba(0, 0, 0, 0.1)',
  shadowStrong: 'rgba(0, 0, 0, 0.2)',
};

/**
 * Colores para Dark Mode - Optimizado para OLED
 */
export const darkTheme = {
  // Primary & Secondary - Actualizados con nueva paleta
  primary: primaryPalette[500],
  primaryLight: primaryPalette[400],
  primaryDark: primaryPalette[600],
  secondary: secondaryPalette[500],
  secondaryLight: secondaryPalette[400],
  secondaryDark: secondaryPalette[600],

  // Backgrounds - True Black premium para OLED con gradación más sutil
  background: '#000000',
  backgroundSecondary: '#0f0f0f',  // Separación más sutil
  backgroundTertiary: '#1a1a1a',
  surface: '#121212',  // Material Design Dark Theme estándar
  surfaceElevated: '#1e1e1e',

  // Cards & Components
  card: '#1a1a1a',
  cardHover: '#252525',
  cardPressed: '#303030',

  // Text
  text: '#ffffff',
  textSecondary: grayPalette[300],
  textTertiary: grayPalette[400],
  textDisabled: grayPalette[600],
  textInverse: grayPalette[900],

  // Borders
  border: grayPalette[800],
  borderLight: grayPalette[900],
  borderStrong: grayPalette[700],
  divider: grayPalette[800],

  // States
  hover: 'rgba(255, 255, 255, 0.05)',
  pressed: 'rgba(255, 255, 255, 0.1)',
  focus: primaryPalette[400],
  selected: primaryPalette[900],
  disabled: grayPalette[800],

  // Semantic
  success: '#34d399',
  successLight: '#064e3b',
  successDark: '#6ee7b7',
  error: '#f87171',
  errorLight: '#7f1d1d',
  errorDark: '#fca5a5',
  warning: '#fbbf24',
  warningLight: '#78350f',
  warningDark: '#fcd34d',
  info: '#60a5fa',
  infoLight: '#1e3a8a',
  infoDark: '#93c5fd',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  overlayStrong: 'rgba(0, 0, 0, 0.9)',

  // Glassmorphism - Ajustado para dark mode
  glass: 'rgba(26, 26, 26, 0.7)',
  glassLight: 'rgba(26, 26, 26, 0.5)',
  glassStrong: 'rgba(26, 26, 26, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',

  // Special
  highlight: '#fbbf24', // Yellow más brillante para dark mode
  accent: '#f472b6', // Pink más brillante
  link: primaryPalette[400],

  // Shadows
  shadowColor: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowMedium: 'rgba(0, 0, 0, 0.4)',
  shadowStrong: 'rgba(0, 0, 0, 0.6)',
};

// ==================== THEME OBJECT ====================

export interface Theme {
  colors: typeof lightTheme;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  fontSize: typeof fontSize;
  gradients: typeof gradients;
  isDark: boolean;
}

export const createTheme = (isDark: boolean): Theme => ({
  colors: isDark ? darkTheme : lightTheme,
  spacing,
  borderRadius,
  shadows,
  fontSize,
  gradients,
  isDark,
});

// ==================== HIGHLIGHT COLORS ====================
// Colores específicos para el sistema de resaltado de versículos

export const highlightColors = {
  yellow: {
    light: '#fef08a',
    medium: '#fde047',
    dark: '#facc15',
    text: '#422006',
  },
  green: {
    light: '#bbf7d0',
    medium: '#86efac',
    dark: '#4ade80',
    text: '#14532d',
  },
  blue: {
    light: '#bfdbfe',
    medium: '#93c5fd',
    dark: '#60a5fa',
    text: '#1e3a8a',
  },
  purple: {
    light: '#e9d5ff',
    medium: '#d8b4fe',
    dark: '#c084fc',
    text: '#581c87',
  },
  pink: {
    light: '#fbcfe8',
    medium: '#f9a8d4',
    dark: '#f472b6',
    text: '#831843',
  },
  orange: {
    light: '#fed7aa',
    medium: '#fdba74',
    dark: '#fb923c',
    text: '#7c2d12',
  },
  red: {
    light: '#fecaca',
    medium: '#fca5a5',
    dark: '#f87171',
    text: '#7f1d1d',
  },
  gray: {
    light: '#e5e7eb',
    medium: '#d1d5db',
    dark: '#9ca3af',
    text: '#1f2937',
  },
};

// ==================== CATEGORY COLORS ====================
// Colores para categorías de notas

export const categoryColors = {
  promise: primaryPalette[500],
  prayer: secondaryPalette[500],
  commandment: '#f59e0b',
  wisdom: '#8b5cf6',
  prophecy: '#ec4899',
  favorite: '#ef4444',
  memorize: '#06b6d4',
  study: '#64748b',
};

// ==================== GRADIENT PRESETS ====================
// Gradientes pre-definidos para diferentes secciones

export const themeGradients = {
  light: {
    primary: ['#667eea', '#764ba2'],
    secondary: ['#2ecc71', '#27ae60'],
    hero: ['#667eea', '#764ba2', '#f093fb'],
    success: ['#10b981', '#059669'],
    error: ['#ef4444', '#dc2626'],
    warning: ['#f59e0b', '#d97706'],
    info: ['#3b82f6', '#2563eb'],
  },
  dark: {
    primary: ['#8098fc', '#9b6dd6'],
    secondary: ['#4ddeba', '#34d399'],
    hero: ['#8098fc', '#9b6dd6', '#f5b4fc'],
    success: ['#34d399', '#10b981'],
    error: ['#f87171', '#ef4444'],
    warning: ['#fbbf24', '#f59e0b'],
    info: ['#60a5fa', '#3b82f6'],
  },
};

// ==================== ACCESSIBILITY ====================
// Colores que cumplen con WCAG 2.1 AA

export const a11yColors = {
  focus: {
    light: primaryPalette[600],
    dark: primaryPalette[400],
  },
  error: {
    light: '#dc2626',
    dark: '#f87171',
  },
  success: {
    light: '#059669',
    dark: '#34d399',
  },
};

// ==================== HELPERS ====================

/**
 * Obtiene el color apropiado basado en el tema
 */
export const getThemedColor = (
  lightColor: string,
  darkColor: string,
  isDark: boolean
) => (isDark ? darkColor : lightColor);

/**
 * Obtiene opacidad del color
 */
export const withOpacity = (color: string, opacity: number) => {
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// ==================== EXPORTS ====================

export default {
  light: lightTheme,
  dark: darkTheme,
  createTheme,
  highlightColors,
  categoryColors,
  themeGradients,
  a11yColors,
  getThemedColor,
  withOpacity,
};
