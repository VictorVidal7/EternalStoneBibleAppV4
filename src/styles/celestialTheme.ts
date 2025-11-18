/**
 * 🌌 CELESTIAL SERENO - SISTEMA DE DISEÑO
 *
 * Sistema de diseño espiritual y moderno para Eternal Bible App
 * Creado para la gloria de Dios Todopoderoso
 *
 * Características:
 * - Paleta de colores Celestial (Indigo/Purple/Emerald/Teal)
 * - Glassmorphism con backdrop-blur
 * - Modo claro y oscuro optimizados
 * - Gradientes espirituales y elegantes
 * - Sistema de elevación y sombras premium
 */

import { Platform } from 'react-native';
import { spacing, fontSize } from './designTokens';

// ==================== PALETA DE COLORES CELESTIAL ====================

/**
 * Paleta Slate - Para fondos y neutrales
 */
const slatePalette = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
};

/**
 * Paleta Indigo - Color primario celestial
 */
const indigoPalette = {
  50: '#eef2ff',
  100: '#e0e7ff',
  200: '#c7d2fe',
  300: '#a5b4fc',
  400: '#818cf8',
  500: '#6366f1',
  600: '#4f46e5',
  700: '#4338ca',
  800: '#3730a3',
  900: '#312e81',
  950: '#1e1b4b',
};

/**
 * Paleta Purple - Color primario secundario
 */
const purplePalette = {
  50: '#faf5ff',
  100: '#f3e8ff',
  200: '#e9d5ff',
  300: '#d8b4fe',
  400: '#c084fc',
  500: '#a855f7',
  600: '#9333ea',
  700: '#7e22ce',
  800: '#6b21a8',
  900: '#581c87',
  950: '#3b0764',
};

/**
 * Paleta Emerald - Color accent
 */
const emeraldPalette = {
  50: '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',
  600: '#059669',
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
};

/**
 * Paleta Teal - Color accent secundario
 */
const tealPalette = {
  50: '#f0fdfa',
  100: '#ccfbf1',
  200: '#99f6e4',
  300: '#5eead4',
  400: '#2dd4bf',
  500: '#14b8a6',
  600: '#0d9488',
  700: '#0f766e',
  800: '#115e59',
  900: '#134e4a',
  950: '#042f2e',
};

// ==================== MODO CLARO - CELESTIAL ====================

export const celestialLightTheme = {
  // --- Nombre del tema ---
  name: 'Celestial Sereno Light',

  // --- Backgrounds con gradiente suave ---
  background: '#f8fafc', // slate-50 base
  backgroundGradient: [slatePalette[50], indigoPalette[50], purplePalette[50]], // slate-50 → indigo-50 → purple-50
  backgroundSecondary: '#f1f5f9', // slate-100
  backgroundTertiary: '#e2e8f0', // slate-200

  // --- Surfaces y Cards con glassmorphism ---
  surface: 'rgba(255, 255, 255, 0.80)', // bg-white/80
  surfaceElevated: 'rgba(255, 255, 255, 0.90)',
  surfaceGlass: 'rgba(255, 255, 255, 0.70)', // Para glassmorphism
  card: 'rgba(255, 255, 255, 0.80)',
  cardHover: 'rgba(255, 255, 255, 0.90)',

  // --- Primary Colors (Indigo → Purple gradient) ---
  primary: indigoPalette[600], // #4f46e5
  primaryLight: indigoPalette[500], // #6366f1
  primaryDark: indigoPalette[700], // #4338ca
  primaryGradient: [indigoPalette[600], purplePalette[600]], // indigo-600 → purple-600
  primaryGradientReverse: [purplePalette[600], indigoPalette[600]],

  // --- Accent Colors (Emerald → Teal gradient) ---
  accent: emeraldPalette[500], // #10b981
  accentLight: emeraldPalette[400], // #34d399
  accentDark: emeraldPalette[600], // #059669
  accentGradient: [emeraldPalette[500], tealPalette[500]], // emerald-500 → teal-500
  accentGradientReverse: [tealPalette[500], emeraldPalette[500]],

  // --- Text Colors ---
  text: slatePalette[900], // #0f172a
  textSecondary: slatePalette[600], // #475569
  textTertiary: slatePalette[500], // #64748b
  textDisabled: slatePalette[400], // #94a3b8
  textInverse: '#ffffff',

  // --- Borders (sutiles con opacidad) ---
  border: 'rgba(224, 231, 255, 0.50)', // indigo-100/50
  borderLight: 'rgba(224, 231, 255, 0.30)',
  borderStrong: 'rgba(224, 231, 255, 0.70)',
  divider: 'rgba(203, 213, 225, 0.40)', // slate-300/40

  // --- States ---
  hover: 'rgba(99, 102, 241, 0.08)', // indigo-500/8
  pressed: 'rgba(99, 102, 241, 0.16)', // indigo-500/16
  focus: indigoPalette[500],
  selected: indigoPalette[50],
  disabled: slatePalette[100],

  // --- Semantic Colors ---
  success: emeraldPalette[600],
  successLight: emeraldPalette[100],
  error: '#ef4444',
  errorLight: '#fee2e2',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: indigoPalette[500],
  infoLight: indigoPalette[100],

  // --- Overlays ---
  overlay: 'rgba(15, 23, 42, 0.50)', // slate-900/50
  overlayLight: 'rgba(15, 23, 42, 0.30)',
  overlayStrong: 'rgba(15, 23, 42, 0.70)',

  // --- Glassmorphism específico ---
  glassBorder: 'rgba(255, 255, 255, 0.30)',
  glassBackground: 'rgba(255, 255, 255, 0.70)',
  backdropBlur: 'xl', // Para BlurView intensity

  // --- Shadows (sutiles con tinte indigo) ---
  shadowColor: indigoPalette[600],
  shadowLight: 'rgba(79, 70, 229, 0.10)', // indigo-600/10
  shadowMedium: 'rgba(79, 70, 229, 0.20)', // indigo-600/20
  shadowStrong: 'rgba(79, 70, 229, 0.30)', // indigo-600/30

  // --- Special Effects ---
  highlight: '#fef08a', // yellow para highlights
  glow: 'rgba(99, 102, 241, 0.30)', // indigo glow effect
  shimmer: 'rgba(255, 255, 255, 0.50)',
};

// ==================== MODO OSCURO - CELESTIAL ====================

export const celestialDarkTheme = {
  // --- Nombre del tema ---
  name: 'Celestial Sereno Dark',

  // --- Backgrounds con gradiente oscuro ---
  background: '#020617', // slate-950 base
  backgroundGradient: [slatePalette[950], indigoPalette[950], slatePalette[900]], // slate-950 → indigo-950 → slate-900
  backgroundSecondary: '#0f172a', // slate-900
  backgroundTertiary: '#1e293b', // slate-800

  // --- Surfaces y Cards con glassmorphism oscuro ---
  surface: 'rgba(30, 41, 59, 0.50)', // bg-slate-800/50
  surfaceElevated: 'rgba(30, 41, 59, 0.70)',
  surfaceGlass: 'rgba(30, 41, 59, 0.40)', // Para glassmorphism
  card: 'rgba(30, 41, 59, 0.50)',
  cardHover: 'rgba(30, 41, 59, 0.70)',

  // --- Primary Colors (Indigo → Purple gradient) ---
  primary: indigoPalette[500], // #6366f1 (más brillante en dark)
  primaryLight: indigoPalette[400], // #818cf8
  primaryDark: indigoPalette[600], // #4f46e5
  primaryGradient: [indigoPalette[500], purplePalette[500]], // indigo-500 → purple-500
  primaryGradientReverse: [purplePalette[500], indigoPalette[500]],

  // --- Accent Colors (Emerald → Teal gradient) ---
  accent: emeraldPalette[600], // #059669 (ajustado para dark)
  accentLight: emeraldPalette[500], // #10b981
  accentDark: emeraldPalette[700], // #047857
  accentGradient: [emeraldPalette[600], tealPalette[600]], // emerald-600 → teal-600
  accentGradientReverse: [tealPalette[600], emeraldPalette[600]],

  // --- Text Colors ---
  text: slatePalette[100], // #f1f5f9
  textSecondary: slatePalette[300], // #cbd5e1
  textTertiary: slatePalette[400], // #94a3b8
  textDisabled: slatePalette[600], // #475569
  textInverse: slatePalette[900],

  // --- Borders (sutiles con opacidad) ---
  border: 'rgba(49, 46, 129, 0.30)', // indigo-900/30
  borderLight: 'rgba(49, 46, 129, 0.20)',
  borderStrong: 'rgba(49, 46, 129, 0.50)',
  divider: 'rgba(51, 65, 85, 0.40)', // slate-700/40

  // --- States ---
  hover: 'rgba(99, 102, 241, 0.12)', // indigo-500/12
  pressed: 'rgba(99, 102, 241, 0.24)', // indigo-500/24
  focus: indigoPalette[400],
  selected: indigoPalette[950],
  disabled: slatePalette[800],

  // --- Semantic Colors ---
  success: emeraldPalette[500],
  successLight: emeraldPalette[950],
  error: '#f87171',
  errorLight: '#7f1d1d',
  warning: '#fbbf24',
  warningLight: '#78350f',
  info: indigoPalette[400],
  infoLight: indigoPalette[950],

  // --- Overlays ---
  overlay: 'rgba(0, 0, 0, 0.70)',
  overlayLight: 'rgba(0, 0, 0, 0.50)',
  overlayStrong: 'rgba(0, 0, 0, 0.90)',

  // --- Glassmorphism específico ---
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassBackground: 'rgba(30, 41, 59, 0.40)',
  backdropBlur: 'dark', // Para BlurView tint

  // --- Shadows (más fuertes en dark mode) ---
  shadowColor: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.30)',
  shadowMedium: 'rgba(0, 0, 0, 0.50)',
  shadowStrong: 'rgba(0, 0, 0, 0.70)',

  // --- Special Effects ---
  highlight: '#fbbf24', // yellow más brillante para dark
  glow: 'rgba(99, 102, 241, 0.40)', // indigo glow effect
  shimmer: 'rgba(255, 255, 255, 0.10)',
};

// ==================== BORDER RADIUS SYSTEM ====================

export const celestialBorderRadius = {
  none: 0,
  xs: 8, // Pequeño
  sm: 12, // Pequeño-medio
  buttonSmall: 16, // Botones pequeños
  cardSmall: 20, // Cards pequeños
  cardMedium: 24, // Cards medianos
  cardLarge: 28, // Cards principales
  xl: 32, // Extra grande
  full: 9999, // Círculo completo
};

// ==================== SHADOWS SYSTEM (Celestial) ====================

/**
 * Sistema de sombras optimizado para el tema Celestial
 * Sombras con tinte indigo en modo claro, negro en modo oscuro
 */
export const celestialShadows = {
  light: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: indigoPalette[600], // #4f46e5
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: indigoPalette[600],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: indigoPalette[600],
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 5,
    },
    xl: {
      shadowColor: indigoPalette[600],
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.20,
      shadowRadius: 24,
      elevation: 8,
    },
    '2xl': {
      shadowColor: indigoPalette[600],
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.24,
      shadowRadius: 32,
      elevation: 10,
    },
  },
  dark: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.30,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.40,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.50,
      shadowRadius: 16,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.60,
      shadowRadius: 24,
      elevation: 8,
    },
    '2xl': {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.70,
      shadowRadius: 32,
      elevation: 10,
    },
  },
};

// ==================== TYPOGRAPHY SYSTEM ====================

/**
 * Sistema tipográfico dual: Serif para contenido bíblico, Sans para UI
 */
export const celestialTypography = {
  // Familia de fuentes
  fontFamily: {
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia',
    }),
    sans: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },

  // Escalas de tamaño (heredadas de designTokens pero organizadas)
  fontSize: {
    caption: fontSize['2xs'], // 10px
    small: fontSize.xs, // 12px
    body: fontSize.base, // 16px
    h3: fontSize.md, // 18px
    h2: fontSize.xl, // 24px
    h1: fontSize['2xl'], // 30px (ajustado de 32 a 30 por designTokens)
  },

  // Line heights para cada tamaño
  lineHeight: {
    caption: fontSize['2xs'] * 1.4, // 14px
    small: fontSize.xs * 1.5, // 18px
    body: fontSize.base * 1.6, // 25.6px
    h3: fontSize.md * 1.4, // 25.2px
    h2: fontSize.xl * 1.3, // 31.2px
    h1: fontSize['2xl'] * 1.2, // 36px
  },
};

// ==================== SPACING CELESTIAL ====================

/**
 * Espaciado específico para componentes Celestial
 * (Heredado de designTokens pero con aliases semánticos)
 */
export const celestialSpacing = {
  cardPadding: spacing.lg, // 24px - Padding estándar de cards
  cardGap: spacing.base, // 20px - Gap entre elementos dentro de cards
  sectionGap: spacing.lg, // 24px - Gap entre secciones
  componentMargin: spacing.lg, // 24px - Margin bottom de componentes principales
  elementGap: spacing.md, // 16px - Gap entre elementos pequeños
  tinyGap: spacing.sm, // 12px - Gap mínimo
};

// ==================== ANIMATION PRESETS ====================

/**
 * Configuraciones de animación para el tema Celestial
 */
export const celestialAnimations = {
  // Duraciones
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    smooth: 500,
    progress: 700, // Para barras de progreso
  },

  // Spring configs para Animated.spring
  spring: {
    gentle: { tension: 50, friction: 7 },
    default: { tension: 65, friction: 9 },
    snappy: { tension: 80, friction: 8 },
  },

  // Timing configs
  timing: {
    easeInOut: { duration: 200, useNativeDriver: true },
    easeOut: { duration: 300, useNativeDriver: true },
    smooth: { duration: 500, useNativeDriver: true },
  },

  // Valores de scale para interacciones
  scale: {
    hover: 1.02,
    pressed: 0.98,
    resting: 1.0,
  },
};

// ==================== THEME INTERFACE ====================

export interface CelestialTheme {
  name: string;
  // Colors
  background: string;
  backgroundGradient: string[];
  backgroundSecondary: string;
  backgroundTertiary: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  card: string;
  cardHover: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGradient: string[];
  primaryGradientReverse: string[];
  accent: string;
  accentLight: string;
  accentDark: string;
  accentGradient: string[];
  accentGradientReverse: string[];
  text: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textInverse: string;
  border: string;
  borderLight: string;
  borderStrong: string;
  divider: string;
  hover: string;
  pressed: string;
  focus: string;
  selected: string;
  disabled: string;
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  overlay: string;
  overlayLight: string;
  overlayStrong: string;
  glassBorder: string;
  glassBackground: string;
  backdropBlur: string;
  shadowColor: string;
  shadowLight: string;
  shadowMedium: string;
  shadowStrong: string;
  highlight: string;
  glow: string;
  shimmer: string;
}

// ==================== CREATOR FUNCTION ====================

/**
 * Crea un tema Celestial completo basado en el modo (light/dark)
 */
export const createCelestialTheme = (isDark: boolean) => {
  const colors = isDark ? celestialDarkTheme : celestialLightTheme;
  const shadows = isDark ? celestialShadows.dark : celestialShadows.light;

  return {
    colors,
    shadows,
    borderRadius: celestialBorderRadius,
    typography: celestialTypography,
    spacing: celestialSpacing,
    animations: celestialAnimations,
    isDark,
  };
};

// ==================== EXPORTS ====================

export default {
  light: celestialLightTheme,
  dark: celestialDarkTheme,
  borderRadius: celestialBorderRadius,
  shadows: celestialShadows,
  typography: celestialTypography,
  spacing: celestialSpacing,
  animations: celestialAnimations,
  createTheme: createCelestialTheme,
};
