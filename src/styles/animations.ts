/**
 * 🎬 ANIMATION SYSTEM - Animaciones Premium
 *
 * Sistema de animaciones fluidas y profesionales
 * para micro-interacciones y transiciones suaves
 */

import {Animated, Easing} from 'react-native';

// ==================== DURATIONS ====================
export const DURATIONS = {
  instant: 100,
  fast: 200,
  normal: 300,
  smooth: 400,
  slow: 500,
  slower: 600,
  slowest: 800,
} as const;

// ==================== EASING CURVES ====================
export const EASING = {
  // Standard Material Design curves
  standard: Easing.bezier(0.4, 0.0, 0.2, 1),
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0.0, 1, 1),
  sharp: Easing.bezier(0.4, 0.0, 0.6, 1),

  // iOS-style curves
  easeInOut: Easing.inOut(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeIn: Easing.in(Easing.ease),

  // Spring-like curves
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),

  // Custom premium curves
  premium: Easing.bezier(0.25, 0.1, 0.25, 1),
  smooth: Easing.bezier(0.4, 0.0, 0.2, 1),
} as const;

// ==================== SPRING CONFIGS ====================
export const SPRING_CONFIGS = {
  // Gentle spring - para elementos delicados
  gentle: {
    tension: 120,
    friction: 14,
    useNativeDriver: true,
  },

  // Default spring - para uso general
  default: {
    tension: 170,
    friction: 26,
    useNativeDriver: true,
  },

  // Snappy spring - para feedback inmediato
  snappy: {
    tension: 300,
    friction: 20,
    useNativeDriver: true,
  },

  // Bouncy spring - para efectos juguetones
  bouncy: {
    tension: 180,
    friction: 12,
    useNativeDriver: true,
  },

  // Wobbly spring - para efectos dramáticos
  wobbly: {
    tension: 180,
    friction: 8,
    useNativeDriver: true,
  },

  // Stiff spring - para movimientos rápidos y precisos
  stiff: {
    tension: 400,
    friction: 28,
    useNativeDriver: true,
  },
} as const;

// ==================== TIMING CONFIGS ====================
export const TIMING_CONFIGS = {
  // Fade animations
  fadeIn: {
    duration: DURATIONS.normal,
    easing: EASING.easeOut,
    useNativeDriver: true,
  },
  fadeOut: {
    duration: DURATIONS.fast,
    easing: EASING.easeIn,
    useNativeDriver: true,
  },

  // Scale animations
  scaleIn: {
    duration: DURATIONS.normal,
    easing: EASING.premium,
    useNativeDriver: true,
  },
  scaleOut: {
    duration: DURATIONS.fast,
    easing: EASING.sharp,
    useNativeDriver: true,
  },

  // Slide animations
  slideIn: {
    duration: DURATIONS.smooth,
    easing: EASING.decelerate,
    useNativeDriver: true,
  },
  slideOut: {
    duration: DURATIONS.normal,
    easing: EASING.accelerate,
    useNativeDriver: true,
  },

  // Rotate animations
  rotate: {
    duration: DURATIONS.smooth,
    easing: EASING.standard,
    useNativeDriver: true,
  },

  // Layout animations (no native driver)
  layout: {
    duration: DURATIONS.normal,
    easing: EASING.standard,
    useNativeDriver: false,
  },
} as const;

// ==================== ANIMATION PRESETS ====================

/**
 * Fade In - Aparece con fade
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration = DURATIONS.normal,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    easing: EASING.easeOut,
    useNativeDriver: true,
  });
};

/**
 * Fade Out - Desaparece con fade
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  duration = DURATIONS.fast,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.easeIn,
    useNativeDriver: true,
  });
};

/**
 * Scale In - Crece desde 0
 */
export const scaleIn = (
  animatedValue: Animated.Value,
  duration = DURATIONS.normal,
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    ...SPRING_CONFIGS.snappy,
  });
};

/**
 * Scale Out - Se reduce a 0
 */
export const scaleOut = (
  animatedValue: Animated.Value,
  duration = DURATIONS.fast,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: EASING.sharp,
    useNativeDriver: true,
  });
};

/**
 * Slide In From Bottom
 */
export const slideInFromBottom = (
  animatedValue: Animated.Value,
  distance = 50,
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue: 0,
    ...SPRING_CONFIGS.default,
  });
};

/**
 * Slide Out To Bottom
 */
export const slideOutToBottom = (
  animatedValue: Animated.Value,
  distance = 50,
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: distance,
    ...TIMING_CONFIGS.slideOut,
  });
};

/**
 * Bounce In - Entra con efecto de rebote
 */
export const bounceIn = (
  animatedValue: Animated.Value,
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue: 1,
    ...SPRING_CONFIGS.bouncy,
  });
};

/**
 * Pulse - Efecto de pulso continuo
 */
export const pulse = (
  animatedValue: Animated.Value,
  minScale = 0.95,
  maxScale = 1.05,
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxScale,
        duration: DURATIONS.slow,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minScale,
        duration: DURATIONS.slow,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
    ]),
  );
};

/**
 * Shimmer - Efecto shimmer para skeleton loaders
 */
export const shimmer = (
  animatedValue: Animated.Value,
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1200,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 1200,
        easing: EASING.easeInOut,
        useNativeDriver: true,
      }),
    ]),
  );
};

/**
 * Rotate - Rotación continua
 */
export const rotate360 = (
  animatedValue: Animated.Value,
  duration = 2000,
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    }),
  );
};

/**
 * Shake - Efecto de sacudida (para errores)
 */
export const shake = (
  animatedValue: Animated.Value,
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
};

// ==================== COMBINED ANIMATIONS ====================

/**
 * Fade and Scale In - Combinación de fade y scale
 */
export const fadeAndScaleIn = (
  fadeValue: Animated.Value,
  scaleValue: Animated.Value,
  duration = DURATIONS.normal,
): Animated.CompositeAnimation => {
  return Animated.parallel([
    fadeIn(fadeValue, duration),
    scaleIn(scaleValue, duration),
  ]);
};

/**
 * Fade and Slide In - Combinación de fade y slide
 */
export const fadeAndSlideIn = (
  fadeValue: Animated.Value,
  slideValue: Animated.Value,
  duration = DURATIONS.normal,
): Animated.CompositeAnimation => {
  return Animated.parallel([
    fadeIn(fadeValue, duration),
    slideInFromBottom(slideValue),
  ]);
};

/**
 * Stagger Animation - Para animar múltiples elementos en secuencia
 */
export const stagger = (
  animations: Animated.CompositeAnimation[],
  delay = 80,
): Animated.CompositeAnimation => {
  return Animated.stagger(delay, animations);
};

// ==================== INTERACTION ANIMATIONS ====================

/**
 * Button Press Animation
 */
export const buttonPress = (
  scaleValue: Animated.Value,
): {
  onPressIn: () => void;
  onPressOut: () => void;
} => {
  return {
    onPressIn: () => {
      Animated.spring(scaleValue, {
        toValue: 0.95,
        ...SPRING_CONFIGS.snappy,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        ...SPRING_CONFIGS.snappy,
      }).start();
    },
  };
};

/**
 * Card Press Animation - Para cards interactivos
 */
export const cardPress = (
  scaleValue: Animated.Value,
): {
  onPressIn: () => void;
  onPressOut: () => void;
} => {
  return {
    onPressIn: () => {
      Animated.spring(scaleValue, {
        toValue: 0.97,
        ...SPRING_CONFIGS.gentle,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        ...SPRING_CONFIGS.gentle,
      }).start();
    },
  };
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Create Animated Value
 */
export const createAnimatedValue = (initialValue = 0): Animated.Value => {
  return new Animated.Value(initialValue);
};

/**
 * Create Multiple Animated Values
 */
export const createAnimatedValues = (
  count: number,
  initialValue = 0,
): Animated.Value[] => {
  return Array.from({length: count}, () => new Animated.Value(initialValue));
};

/**
 * Interpolate for common transforms
 */
export const interpolations = {
  /**
   * Rotate interpolation (0 to 360 degrees)
   */
  rotate: (animatedValue: Animated.Value) =>
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    }),

  /**
   * Translate Y interpolation
   */
  translateY: (animatedValue: Animated.Value, distance = 100) =>
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [distance, 0],
    }),

  /**
   * Translate X interpolation
   */
  translateX: (animatedValue: Animated.Value, distance = 100) =>
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [distance, 0],
    }),

  /**
   * Opacity interpolation
   */
  opacity: (animatedValue: Animated.Value) =>
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),

  /**
   * Scale interpolation
   */
  scale: (animatedValue: Animated.Value, min = 0, max = 1) =>
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [min, max],
    }),

  /**
   * Shimmer interpolation para skeleton loaders
   */
  shimmer: (animatedValue: Animated.Value) =>
    animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-1, 1],
    }),
};

// ==================== EXPORTS ====================
export default {
  DURATIONS,
  EASING,
  SPRING_CONFIGS,
  TIMING_CONFIGS,
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInFromBottom,
  slideOutToBottom,
  bounceIn,
  pulse,
  shimmer,
  rotate360,
  shake,
  fadeAndScaleIn,
  fadeAndSlideIn,
  stagger,
  buttonPress,
  cardPress,
  createAnimatedValue,
  createAnimatedValues,
  interpolations,
};
