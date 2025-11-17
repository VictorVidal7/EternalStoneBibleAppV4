/**
 * 📝 TYPOGRAPHY SYSTEM - PREMIUM
 *
 * Sistema tipográfico profesional con:
 * - Escalas modulares perfectas
 * - Jerarquía visual clara
 * - Línea de base consistente
 * - Estilos predefinidos para todos los casos de uso
 */

import { TextStyle, Platform } from 'react-native';
import { fontSize, fontWeight, lineHeight, letterSpacing } from './designTokens';

// ==================== FONT FAMILIES ====================

/**
 * Familias de fuentes para iOS y Android
 * iOS usa San Francisco, Android usa Roboto
 */
export const fontFamily = {
  // Predeterminadas del sistema
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),

  // Fuente serif para contenido bíblico
  serif: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),

  // Fuente monospace para referencias
  mono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
} as const;

// ==================== TEXT STYLES ====================

/**
 * Estilos de texto predefinidos
 * Siguiendo las mejores prácticas de diseño tipográfico
 */
export const typography = {
  // ===== HEADINGS =====

  h1: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['6xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['6xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  h2: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['5xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['5xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  } as TextStyle,

  h3: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['4xl'] * lineHeight.tight,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  h4: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['3xl'] * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  h5: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize['2xl'] * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  h6: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xl * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  // ===== BODY TEXT =====

  bodyLarge: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  body: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  bodySmall: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  // ===== BIBLE VERSE TEXT =====
  // Estilos especiales para el contenido bíblico

  verseTitle: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: fontSize['2xl'] * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  verse: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    letterSpacing: letterSpacing.wide,
  } as TextStyle,

  verseNumber: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  verseReference: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.wide,
  } as TextStyle,

  // ===== LABELS & CAPTIONS =====

  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.base * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  labelSmall: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: fontSize.sm * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  caption: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.xs * lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,

  // ===== SPECIAL =====

  button: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.base * lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  } as TextStyle,

  buttonSmall: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.sm * lineHeight.tight,
    letterSpacing: letterSpacing.wide,
  } as TextStyle,

  overline: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: fontSize.xs * lineHeight.tight,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const,
  } as TextStyle,

  quote: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.lg * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
    fontStyle: 'italic' as const,
  } as TextStyle,

  code: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: fontSize.sm * lineHeight.relaxed,
    letterSpacing: letterSpacing.normal,
  } as TextStyle,
} as const;

// ==================== READING MODES ====================

/**
 * Estilos de lectura para diferentes preferencias
 */
export const readingModes = {
  // Modo normal - balance entre legibilidad y densidad
  normal: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.6,
    letterSpacing: 0.3,
  } as TextStyle,

  // Modo compacto - más denso
  compact: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    letterSpacing: 0.2,
  } as TextStyle,

  // Modo confortable - más espaciado
  comfortable: {
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * 1.7,
    letterSpacing: 0.5,
  } as TextStyle,

  // Modo grande - para lectura más fácil
  large: {
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * 1.7,
    letterSpacing: 0.6,
  } as TextStyle,

  // Modo extragrande - accesibilidad
  extraLarge: {
    fontSize: fontSize['2xl'],
    lineHeight: fontSize['2xl'] * 1.7,
    letterSpacing: 0.8,
  } as TextStyle,
} as const;

// ==================== TEXT UTILITIES ====================

/**
 * Utilidades para manipular texto
 */
export const textUtils = {
  // Truncar texto
  truncate: {
    numberOfLines: 1,
    ellipsizeMode: 'tail' as const,
  },

  // Centrar texto
  center: {
    textAlign: 'center' as const,
  },

  // Alinear a la derecha
  right: {
    textAlign: 'right' as const,
  },

  // Justificar
  justify: {
    textAlign: 'justify' as const,
  },

  // Mayúsculas
  uppercase: {
    textTransform: 'uppercase' as const,
  },

  // Minúsculas
  lowercase: {
    textTransform: 'lowercase' as const,
  },

  // Capitalizar
  capitalize: {
    textTransform: 'capitalize' as const,
  },
} as const;

// ==================== ACCESSIBILITY ====================

/**
 * Escalas de tamaño para accesibilidad
 */
export const accessibilityTextScale = {
  small: 0.85,
  normal: 1.0,
  large: 1.15,
  extraLarge: 1.3,
  huge: 1.5,
} as const;

/**
 * Aplica escala de accesibilidad a un tamaño de fuente
 */
export const scaleFont = (
  baseFontSize: number,
  scale: keyof typeof accessibilityTextScale = 'normal'
): number => {
  return baseFontSize * accessibilityTextScale[scale];
};

// ==================== HELPERS ====================

/**
 * Combina estilos de texto
 */
export const combineTextStyles = (...styles: TextStyle[]): TextStyle => {
  return Object.assign({}, ...styles);
};

/**
 * Crea un estilo de texto con color
 */
export const withColor = (style: TextStyle, color: string): TextStyle => {
  return { ...style, color };
};

/**
 * Crea un estilo de texto con peso personalizado
 */
export const withWeight = (
  style: TextStyle,
  weight: keyof typeof fontWeight
): TextStyle => {
  return { ...style, fontWeight: fontWeight[weight] };
};

// ==================== EXPORTS ====================

export default typography;
