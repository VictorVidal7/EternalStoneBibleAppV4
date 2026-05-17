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

import {Platform} from 'react-native';
import {spacing, fontSize} from './designTokens';

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
/* const tealPalette = {
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
}; */

// ==================== MODO CLARO - CELESTIAL ====================

export const celestialLightTheme = {
  // --- Nombre del tema ---
  name: 'Celestial Sereno Light',

  // --- Backgrounds con gradiente suave y minimalista ---
  background: '#ffffff', // Blanco puro para máxima claridad
  backgroundGradient: ['#ffffff', '#fafbff', '#f8f9ff'], // white → casi blanco con tinte indigo muy sutil
  backgroundSecondary: '#f8f9fc', // Gris muy claro
  backgroundTertiary: '#f1f3f9', // Gris claro

  // --- Surfaces y Cards con glassmorphism mejorado ---
  surface: 'rgba(255, 255, 255, 0.95)', // bg-white/95 - más sólido
  surfaceElevated: 'rgba(255, 255, 255, 0.98)',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)', // Para glassmorphism más visible
  card: 'rgba(255, 255, 255, 0.95)',
  cardHover: 'rgba(255, 255, 255, 1)',

  // --- Primary Colors (Indigo) - REFINADO Y PROFESIONAL ---
  primary: indigoPalette[600], // #4f46e5 - Color principal
  primaryLight: indigoPalette[500], // #6366f1 - Variante clara
  primaryDark: indigoPalette[700], // #4338ca - Variante oscura
  primaryGradient: [indigoPalette[600], indigoPalette[500], purplePalette[500]], // Gradiente sofisticado
  primaryGradientReverse: [
    purplePalette[500],
    indigoPalette[500],
    indigoPalette[600],
  ],

  // --- Accent Colors (Emerald) - PARA CTAs Y ACCIONES POSITIVAS ---
  accent: emeraldPalette[600], // #059669 - Más saturado
  accentLight: emeraldPalette[500], // #10b981
  accentDark: emeraldPalette[700], // #047857
  accentGradient: [emeraldPalette[600], emeraldPalette[500]], // Gradiente simple y elegante
  accentGradientReverse: [emeraldPalette[500], emeraldPalette[600]],

  // --- Text Colors - CONTRASTE MEJORADO ---
  text: slatePalette[900], // #0f172a - Negro azulado
  textSecondary: slatePalette[600], // #475569 - Gris medio
  textTertiary: slatePalette[500], // #64748b - Gris claro
  textDisabled: slatePalette[400], // #94a3b8 - Gris muy claro
  textInverse: '#ffffff',

  // --- Borders (sutiles y minimalistas) ---
  border: 'rgba(226, 232, 240, 0.60)', // slate-200/60 - Más neutral
  borderLight: 'rgba(226, 232, 240, 0.40)',
  borderStrong: 'rgba(226, 232, 240, 0.90)',
  divider: 'rgba(226, 232, 240, 0.50)', // slate-200/50

  // --- States - MEJORADOS ---
  hover: 'rgba(79, 70, 229, 0.06)', // indigo-600/6 - Más sutil
  pressed: 'rgba(79, 70, 229, 0.12)', // indigo-600/12
  focus: indigoPalette[600],
  selected: 'rgba(79, 70, 229, 0.08)', // indigo-600/8
  disabled: slatePalette[200],

  // --- Semantic Colors - OPTIMIZADOS ---
  success: emeraldPalette[600], // #059669
  successLight: 'rgba(5, 150, 105, 0.1)', // emerald-600/10
  error: '#dc2626', // red-600 - Más profesional
  errorLight: 'rgba(220, 38, 38, 0.1)', // red-600/10
  warning: '#ea580c', // orange-600 - Más visible
  warningLight: 'rgba(234, 88, 12, 0.1)', // orange-600/10
  info: indigoPalette[600],
  infoLight: 'rgba(79, 70, 229, 0.1)', // indigo-600/10

  // --- Overlays - MÁS SUTILES ---
  overlay: 'rgba(15, 23, 42, 0.40)', // slate-900/40
  overlayLight: 'rgba(15, 23, 42, 0.20)',
  overlayStrong: 'rgba(15, 23, 42, 0.60)',

  // --- Glassmorphism específico - REFINADO ---
  glassBorder: 'rgba(226, 232, 240, 0.50)', // slate-200/50 - Más visible
  glassBackground: 'rgba(255, 255, 255, 0.85)',
  backdropBlur: 'xl', // Para BlurView intensity

  // --- Shadows (sutiles y naturales) ---
  shadowColor: '#0f172a', // slate-900 - Más natural
  shadowLight: 'rgba(15, 23, 42, 0.08)', // slate-900/8
  shadowMedium: 'rgba(15, 23, 42, 0.12)', // slate-900/12
  shadowStrong: 'rgba(15, 23, 42, 0.16)', // slate-900/16

  // --- Special Effects ---
  highlight: '#fef08a', // yellow para highlights
  glow: 'rgba(79, 70, 229, 0.20)', // indigo glow effect
  shimmer: 'rgba(255, 255, 255, 0.60)',
};

// ==================== MODO OSCURO - CELESTIAL ====================

export const celestialDarkTheme = {
  // --- Nombre del tema ---
  name: 'Celestial Sereno Dark',

  // --- Backgrounds con gradiente oscuro y profundo ---
  background: '#0a0d1a', // Casi negro con tinte azul
  backgroundGradient: ['#0a0d1a', '#0f1419', '#12151f'], // Gradiente sutil oscuro
  backgroundSecondary: '#111422', // Gris oscuro
  backgroundTertiary: '#1a1d2e', // Gris oscuro medio

  // --- Surfaces y Cards con glassmorphism oscuro mejorado ---
  surface: 'rgba(26, 29, 46, 0.70)', // Más opaco para mejor contraste
  surfaceElevated: 'rgba(26, 29, 46, 0.85)',
  surfaceGlass: 'rgba(26, 29, 46, 0.60)', // Para glassmorphism
  card: 'rgba(26, 29, 46, 0.70)',
  cardHover: 'rgba(26, 29, 46, 0.90)',

  // --- Primary Colors (Indigo) - MÁS VIBRANTE EN DARK ---
  primary: indigoPalette[500], // #6366f1 - Más brillante en dark
  primaryLight: indigoPalette[400], // #818cf8 - Aún más brillante
  primaryDark: indigoPalette[600], // #4f46e5
  primaryGradient: [indigoPalette[500], indigoPalette[400], purplePalette[400]], // Gradiente vibrante
  primaryGradientReverse: [
    purplePalette[400],
    indigoPalette[400],
    indigoPalette[500],
  ],

  // --- Accent Colors (Emerald) - VIBRANTE ---
  accent: emeraldPalette[500], // #10b981 - Más brillante
  accentLight: emeraldPalette[400], // #34d399
  accentDark: emeraldPalette[600], // #059669
  accentGradient: [emeraldPalette[500], emeraldPalette[400]], // Gradiente simple
  accentGradientReverse: [emeraldPalette[400], emeraldPalette[500]],

  // --- Text Colors - ALTO CONTRASTE ---
  text: '#f8f9fc', // Casi blanco
  textSecondary: slatePalette[300], // #cbd5e1 - Gris claro
  textTertiary: slatePalette[400], // #94a3b8 - Gris medio
  textDisabled: slatePalette[600], // #475569 - Gris oscuro
  textInverse: slatePalette[900],

  // --- Borders (sutiles con mejor visibilidad) ---
  border: 'rgba(71, 85, 105, 0.30)', // slate-600/30 - Más visible
  borderLight: 'rgba(71, 85, 105, 0.20)',
  borderStrong: 'rgba(71, 85, 105, 0.50)',
  divider: 'rgba(71, 85, 105, 0.25)', // slate-600/25

  // --- States - OPTIMIZADOS PARA DARK ---
  hover: 'rgba(99, 102, 241, 0.15)', // indigo-500/15 - Más visible en dark
  pressed: 'rgba(99, 102, 241, 0.25)', // indigo-500/25
  focus: indigoPalette[500],
  selected: 'rgba(99, 102, 241, 0.18)', // indigo-500/18
  disabled: 'rgba(26, 29, 46, 0.50)',

  // --- Semantic Colors - VIBRANTES PARA DARK ---
  success: emeraldPalette[500], // #10b981 - Más brillante
  successLight: 'rgba(16, 185, 129, 0.15)', // emerald-500/15
  error: '#f87171', // red-400 - Más brillante
  errorLight: 'rgba(248, 113, 113, 0.15)', // red-400/15
  warning: '#fbbf24', // yellow-400 - Más brillante
  warningLight: 'rgba(251, 191, 36, 0.15)', // yellow-400/15
  info: indigoPalette[500],
  infoLight: 'rgba(99, 102, 241, 0.15)', // indigo-500/15

  // --- Overlays - MEJORADOS ---
  overlay: 'rgba(0, 0, 0, 0.60)',
  overlayLight: 'rgba(0, 0, 0, 0.40)',
  overlayStrong: 'rgba(0, 0, 0, 0.80)',

  // --- Glassmorphism específico - REFINADO ---
  glassBorder: 'rgba(71, 85, 105, 0.30)', // slate-600/30 - Más visible
  glassBackground: 'rgba(26, 29, 46, 0.60)',
  backdropBlur: 'dark', // Para BlurView tint

  // --- Shadows (fuertes y profundas en dark mode) ---
  shadowColor: '#000000',
  shadowLight: 'rgba(0, 0, 0, 0.40)',
  shadowMedium: 'rgba(0, 0, 0, 0.60)',
  shadowStrong: 'rgba(0, 0, 0, 0.80)',

  // --- Special Effects ---
  highlight: '#fbbf24', // yellow brillante para dark
  glow: 'rgba(99, 102, 241, 0.30)', // indigo glow effect
  shimmer: 'rgba(255, 255, 255, 0.15)',
};

// ==================== BORDER RADIUS SYSTEM ====================
// Sistema de border radius unificado y minimalista

export const celestialBorderRadius = {
  none: 0,
  xs: 6, // Elementos muy pequeños
  sm: 10, // Botones pequeños, badges
  md: 14, // Botones estándar
  lg: 18, // Cards pequeños
  xl: 22, // Cards medianos
  '2xl': 28, // Cards grandes
  full: 9999, // Círculo completo (avatares, pills)
  // Card-specific aliases
  cardSmall: 20, // Quick Access buttons
  cardMedium: 24, // Standard cards
  cardLarge: 28, // Large feature cards
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
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: indigoPalette[600], // #4f46e5
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: indigoPalette[600],
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: indigoPalette[600],
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 5,
    },
    xl: {
      shadowColor: indigoPalette[600],
      shadowOffset: {width: 0, height: 12},
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 8,
    },
    '2xl': {
      shadowColor: indigoPalette[600],
      shadowOffset: {width: 0, height: 16},
      shadowOpacity: 0.24,
      shadowRadius: 32,
      elevation: 10,
    },
  },
  dark: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 12},
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 8,
    },
    '2xl': {
      shadowColor: '#000000',
      shadowOffset: {width: 0, height: 16},
      shadowOpacity: 0.7,
      shadowRadius: 32,
      elevation: 10,
    },
  },
};

// ==================== TYPOGRAPHY SYSTEM ====================

/**
 * Sistema tipográfico profesional y minimalista
 * - Serif elegante para contenido bíblico (mejor legibilidad)
 * - Sans moderno para UI (interfaz limpia)
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
    mono: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'Courier',
    }),
  },

  // Escalas de tamaño optimizadas
  fontSize: {
    caption: fontSize['2xs'], // 10px - Textos muy pequeños
    small: fontSize.xs, // 12px - Etiquetas, metadata
    body: fontSize.base, // 16px - Texto principal
    bodyLarge: fontSize.md, // 18px - Texto destacado
    h4: fontSize.lg, // 20px - Subtítulos pequeños
    h3: fontSize.xl, // 24px - Subtítulos
    h2: fontSize['2xl'], // 28px - Títulos secundarios
    h1: fontSize['3xl'], // 32px - Títulos principales
  },

  // Line heights optimizados para legibilidad
  lineHeight: {
    tight: 1.25, // Títulos
    normal: 1.5, // UI text
    relaxed: 1.7, // Body text
    loose: 2.0, // Texto bíblico (máxima legibilidad)
  },

  // Pesos de fuente semánticos
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// ==================== SPACING CELESTIAL ====================

/**
 * Espaciado específico para componentes Celestial
 * Sistema consistente y minimalista para toda la app
 */
export const celestialSpacing = {
  // Padding de contenedores
  screenPadding: spacing.lg, // 24px - Padding de pantallas
  cardPadding: spacing.lg, // 24px - Padding interno de cards
  cardPaddingSmall: spacing.md, // 16px - Padding de cards pequeños

  // Gaps entre elementos
  sectionGap: spacing.xl, // 32px - Gap entre secciones principales
  cardGap: spacing.lg, // 24px - Gap entre cards
  elementGap: spacing.md, // 16px - Gap entre elementos relacionados
  smallGap: spacing.sm, // 12px - Gap pequeño
  tinyGap: spacing.xs, // 8px - Gap mínimo

  // Margins
  componentMargin: spacing.lg, // 24px - Margin de componentes
  listItemMargin: spacing.md, // 16px - Margin entre items de lista
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
    gentle: {tension: 50, friction: 7},
    default: {tension: 65, friction: 9},
    snappy: {tension: 80, friction: 8},
  },

  // Timing configs
  timing: {
    easeInOut: {duration: 200, useNativeDriver: true},
    easeOut: {duration: 300, useNativeDriver: true},
    smooth: {duration: 500, useNativeDriver: true},
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
 * Interface para colores dinámicos del tema
 */
interface DynamicThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary?: string;
  accent?: string;
  info: string;
}

/**
 * Crea un tema Celestial completo basado en el modo (light/dark)
 * Opcionalmente acepta colores dinámicos del tema seleccionado (useTheme)
 */
export const createCelestialTheme = (
  isDark: boolean,
  dynamicColors?: DynamicThemeColors,
) => {
  const baseColors = isDark ? celestialDarkTheme : celestialLightTheme;
  const shadows = isDark ? celestialShadows.dark : celestialShadows.light;

  // Si se proporcionan colores dinámicos, los aplicamos al tema
  const colors = dynamicColors
    ? {
        ...baseColors,
        primary: dynamicColors.primary,
        primaryLight: dynamicColors.primaryLight,
        primaryDark: dynamicColors.primaryDark,
        secondary: dynamicColors.secondary ?? dynamicColors.primary,
        accent: dynamicColors.accent ?? dynamicColors.primary,
        info: dynamicColors.info,
        // También actualizamos gradientes para usar los colores dinámicos
        primaryGradient: [
          dynamicColors.primary,
          dynamicColors.primaryLight,
          dynamicColors.primary,
        ],
        primaryGradientReverse: [
          dynamicColors.primaryLight,
          dynamicColors.primary,
          dynamicColors.primaryDark,
        ],
        // Actualizar glow para usar el color dinámico
        glow: `${dynamicColors.primary}33`, // 20% opacity
        focus: dynamicColors.primary,
      }
    : baseColors;

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
