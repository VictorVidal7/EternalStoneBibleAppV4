/**
 * 🎬 REANIMATED 3 ANIMATION SYSTEM - Celestial Premium 2.0
 *
 * Sistema de animaciones de alto rendimiento usando Reanimated 3
 * Animaciones fluidas a 60fps en el hilo de UI nativo
 *
 * Para la gloria de Dios Todopoderoso
 */

import {
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

// ==================== SPRING CONFIGURATIONS ====================
// Configuraciones de spring optimizadas para diferentes casos de uso

export const SPRING_CONFIGS = {
  // Suave y elegante - para transiciones de pantalla
  gentle: {
    damping: 20,
    stiffness: 90,
    mass: 1,
  },

  // Predeterminado - para la mayoría de animaciones
  default: {
    damping: 15,
    stiffness: 120,
    mass: 1,
  },

  // Rápido y responsivo - para feedback de botones
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },

  // Con rebote - para celebraciones y logros
  bouncy: {
    damping: 8,
    stiffness: 180,
    mass: 1,
  },

  // Muy elástico - para efectos dramáticos
  wobbly: {
    damping: 6,
    stiffness: 150,
    mass: 1.2,
  },

  // Rígido y preciso - para UI crítica
  stiff: {
    damping: 25,
    stiffness: 400,
    mass: 0.5,
  },

  // Ultra suave - para modales y overlays
  smooth: {
    damping: 30,
    stiffness: 100,
    mass: 1,
  },
} as const;

// ==================== TIMING CONFIGURATIONS ====================
// Duraciones y curvas de easing

export const DURATIONS = {
  instant: 100,
  fast: 200,
  normal: 300,
  smooth: 400,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

export const EASING_CURVES = {
  // Material Design 3 curves
  standard: Easing.bezier(0.2, 0, 0, 1),
  standardDecelerate: Easing.bezier(0, 0, 0, 1),
  standardAccelerate: Easing.bezier(0.3, 0, 1, 1),

  // Emphasized curves
  emphasized: Easing.bezier(0.2, 0, 0, 1),
  emphasizedDecelerate: Easing.bezier(0.05, 0.7, 0.1, 1),
  emphasizedAccelerate: Easing.bezier(0.3, 0, 0.8, 0.15),

  // iOS-style curves
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
  easeOut: Easing.bezier(0, 0, 0.58, 1),
  easeIn: Easing.bezier(0.42, 0, 1, 1),

  // Custom premium curves
  premium: Easing.bezier(0.16, 1, 0.3, 1),
  elastic: Easing.bezier(0.68, -0.55, 0.265, 1.55),
  smooth: Easing.bezier(0.25, 0.1, 0.25, 1),
} as const;

// ==================== ANIMATION PRESETS ====================

/**
 * Fade In con timing suave
 */
export const fadeIn = (
  value: SharedValue<number>,
  duration = DURATIONS.normal,
) => {
  'worklet';
  value.value = withTiming(1, {
    duration,
    easing: EASING_CURVES.emphasizedDecelerate,
  });
};

/**
 * Fade Out con timing suave
 */
export const fadeOut = (
  value: SharedValue<number>,
  duration = DURATIONS.fast,
) => {
  'worklet';
  value.value = withTiming(0, {
    duration,
    easing: EASING_CURVES.standardAccelerate,
  });
};

/**
 * Scale In con spring bouncy
 */
export const scaleIn = (
  value: SharedValue<number>,
  config = SPRING_CONFIGS.snappy,
) => {
  'worklet';
  value.value = withSpring(1, config);
};

/**
 * Scale Out con timing
 */
export const scaleOut = (
  value: SharedValue<number>,
  duration = DURATIONS.fast,
) => {
  'worklet';
  value.value = withTiming(0, {
    duration,
    easing: EASING_CURVES.standardAccelerate,
  });
};

/**
 * Slide In desde abajo
 */
export const slideInFromBottom = (
  value: SharedValue<number>,
  config = SPRING_CONFIGS.default,
) => {
  'worklet';
  value.value = withSpring(0, config);
};

/**
 * Slide Out hacia abajo
 */
export const slideOutToBottom = (
  value: SharedValue<number>,
  distance = 100,
  duration = DURATIONS.normal,
) => {
  'worklet';
  value.value = withTiming(distance, {
    duration,
    easing: EASING_CURVES.standardAccelerate,
  });
};

/**
 * Bounce In - perfecto para logros y celebraciones
 */
export const bounceIn = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSpring(1, SPRING_CONFIGS.bouncy);
};

/**
 * Pulse continuo - para llamar la atención
 */
export const pulse = (
  value: SharedValue<number>,
  minScale = 0.95,
  maxScale = 1.05,
) => {
  'worklet';
  value.value = withRepeat(
    withSequence(
      withTiming(maxScale, {
        duration: DURATIONS.slow,
        easing: EASING_CURVES.easeInOut,
      }),
      withTiming(minScale, {
        duration: DURATIONS.slow,
        easing: EASING_CURVES.easeInOut,
      }),
    ),
    -1, // Infinito
    true, // Reverse
  );
};

/**
 * Shake - para errores o validación
 */
export const shake = (value: SharedValue<number>) => {
  'worklet';
  value.value = withSequence(
    withTiming(10, {duration: 50}),
    withTiming(-10, {duration: 50}),
    withTiming(8, {duration: 50}),
    withTiming(-8, {duration: 50}),
    withTiming(5, {duration: 50}),
    withTiming(0, {duration: 50}),
  );
};

/**
 * Glow/Shimmer effect - para skeleton loaders premium
 */
export const shimmer = (value: SharedValue<number>, duration = 1500) => {
  'worklet';
  value.value = withRepeat(
    withTiming(1, {
      duration,
      easing: EASING_CURVES.easeInOut,
    }),
    -1, // Infinito
    true, // Reverse
  );
};

/**
 * Rotate 360 continuo - para loaders
 */
export const rotate360 = (value: SharedValue<number>, duration = 1000) => {
  'worklet';
  value.value = withRepeat(
    withTiming(360, {
      duration,
      easing: Easing.linear,
    }),
    -1, // Infinito
  );
};

/**
 * Staggered entrance - para listas
 */
export const staggeredEntrance = (
  value: SharedValue<number>,
  index: number,
  delayPerItem = 50,
) => {
  'worklet';
  const delay = index * delayPerItem;
  value.value = withDelay(delay, withSpring(1, SPRING_CONFIGS.default));
};

// ==================== INTERPOLATION HELPERS ====================

/**
 * Interpolación de opacidad
 */
export const interpolateOpacity = (
  progress: SharedValue<number>,
  inputRange = [0, 1],
  outputRange = [0, 1],
) => {
  'worklet';
  return interpolate(
    progress.value,
    inputRange,
    outputRange,
    Extrapolation.CLAMP,
  );
};

/**
 * Interpolación de escala
 */
export const interpolateScale = (
  progress: SharedValue<number>,
  inputRange = [0, 1],
  outputRange = [0.8, 1],
) => {
  'worklet';
  return interpolate(
    progress.value,
    inputRange,
    outputRange,
    Extrapolation.CLAMP,
  );
};

/**
 * Interpolación de traducción Y
 */
export const interpolateTranslateY = (
  progress: SharedValue<number>,
  inputRange = [0, 1],
  outputRange = [50, 0],
) => {
  'worklet';
  return interpolate(
    progress.value,
    inputRange,
    outputRange,
    Extrapolation.CLAMP,
  );
};

/**
 * Interpolación de rotación (grados)
 */
export const interpolateRotation = (
  progress: SharedValue<number>,
  inputRange = [0, 1],
  outputRange = [0, 360],
) => {
  'worklet';
  return `${interpolate(progress.value, inputRange, outputRange)}deg`;
};

// ==================== BUTTON PRESS ANIMATIONS ====================

/**
 * Crear handlers para animación de presión de botón
 */
export const createPressAnimation = (
  scale: SharedValue<number>,
  pressedScale = 0.95,
) => {
  return {
    onPressIn: () => {
      'worklet';
      scale.value = withSpring(pressedScale, SPRING_CONFIGS.snappy);
    },
    onPressOut: () => {
      'worklet';
      scale.value = withSpring(1, SPRING_CONFIGS.snappy);
    },
  };
};

/**
 * Crear handlers para animación de card
 */
export const createCardPressAnimation = (
  scale: SharedValue<number>,
  pressedScale = 0.98,
) => {
  return {
    onPressIn: () => {
      'worklet';
      scale.value = withSpring(pressedScale, SPRING_CONFIGS.gentle);
    },
    onPressOut: () => {
      'worklet';
      scale.value = withSpring(1, SPRING_CONFIGS.gentle);
    },
  };
};

// ==================== COMBINED ANIMATIONS ====================

/**
 * Fade + Scale entrada simultánea
 */
export const fadeAndScaleIn = (
  opacity: SharedValue<number>,
  scale: SharedValue<number>,
  config = SPRING_CONFIGS.default,
) => {
  'worklet';
  opacity.value = withTiming(1, {
    duration: DURATIONS.normal,
    easing: EASING_CURVES.emphasizedDecelerate,
  });
  scale.value = withSpring(1, config);
};

/**
 * Fade + Slide entrada simultánea
 */
export const fadeAndSlideIn = (
  opacity: SharedValue<number>,
  translateY: SharedValue<number>,
  config = SPRING_CONFIGS.default,
) => {
  'worklet';
  opacity.value = withTiming(1, {
    duration: DURATIONS.normal,
    easing: EASING_CURVES.emphasizedDecelerate,
  });
  translateY.value = withSpring(0, config);
};

/**
 * Celebración - para logros desbloqueados
 */
export const celebrationAnimation = (
  scale: SharedValue<number>,
  rotation: SharedValue<number>,
) => {
  'worklet';
  // Scale bounce
  scale.value = withSequence(
    withSpring(1.2, SPRING_CONFIGS.bouncy),
    withSpring(1, SPRING_CONFIGS.default),
  );
  // Slight rotation wiggle
  rotation.value = withSequence(
    withTiming(-5, {duration: 100}),
    withTiming(5, {duration: 100}),
    withTiming(-3, {duration: 100}),
    withTiming(3, {duration: 100}),
    withTiming(0, {duration: 100}),
  );
};

// ==================== LAYOUT ANIMATIONS ====================

/**
 * Configuraciones para LayoutAnimation de Reanimated
 */
export const LAYOUT_ANIMATIONS = {
  // Entrada con fade y slide
  entering: {
    fadeInDown: {
      duration: DURATIONS.normal,
      easing: EASING_CURVES.emphasizedDecelerate,
    },
    fadeInUp: {
      duration: DURATIONS.normal,
      easing: EASING_CURVES.emphasizedDecelerate,
    },
    scaleIn: {
      duration: DURATIONS.normal,
      easing: EASING_CURVES.emphasizedDecelerate,
    },
  },

  // Salida con fade
  exiting: {
    fadeOut: {
      duration: DURATIONS.fast,
      easing: EASING_CURVES.standardAccelerate,
    },
    scaleOut: {
      duration: DURATIONS.fast,
      easing: EASING_CURVES.standardAccelerate,
    },
  },

  // Transiciones de layout
  layout: {
    smooth: {
      duration: DURATIONS.normal,
      easing: EASING_CURVES.standard,
    },
  },
} as const;

// ==================== TYPES ====================

export type SpringConfig = (typeof SPRING_CONFIGS)[keyof typeof SPRING_CONFIGS];
export type Duration = (typeof DURATIONS)[keyof typeof DURATIONS];
export type EasingCurve = (typeof EASING_CURVES)[keyof typeof EASING_CURVES];

// ==================== EXPORTS ====================

export default {
  SPRING_CONFIGS,
  DURATIONS,
  EASING_CURVES,
  LAYOUT_ANIMATIONS,
  // Basic animations
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInFromBottom,
  slideOutToBottom,
  bounceIn,
  pulse,
  shake,
  shimmer,
  rotate360,
  staggeredEntrance,
  // Interpolations
  interpolateOpacity,
  interpolateScale,
  interpolateTranslateY,
  interpolateRotation,
  // Press animations
  createPressAnimation,
  createCardPressAnimation,
  // Combined
  fadeAndScaleIn,
  fadeAndSlideIn,
  celebrationAnimation,
};
