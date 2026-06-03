/**
 * 🎬 useAnimations - Hooks de Animación Premium
 *
 * Hooks reutilizables para animaciones fluidas con Reanimated 3
 * Simplifica la implementación de micro-interacciones profesionales
 */

import {useCallback, useEffect} from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  SPRING_CONFIGS,
  DURATIONS,
  EASING_CURVES,
} from '../styles/reanimatedAnimations';
import {useReducedMotion} from './useReducedMotion';
import {PRESS_SCALE, pressTargetScale} from '../lib/animation/springs';

// ==================== useFadeIn ====================
/**
 * Hook para animación de fade in al montar
 */
export const useFadeIn = (delay = 0, duration = DURATIONS.normal) => {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      return;
    }
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: EASING_CURVES.emphasizedDecelerate,
      }),
    );
  }, [delay, duration, opacity, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return {opacity, animatedStyle};
};

// ==================== useSlideIn ====================
/**
 * Hook para animación de slide in desde abajo
 */
export const useSlideIn = (
  delay = 0,
  initialOffset = 50,
  config = SPRING_CONFIGS.default,
) => {
  const reduced = useReducedMotion();
  const translateY = useSharedValue(initialOffset);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      translateY.value = 0;
      opacity.value = 1;
      return;
    }
    translateY.value = withDelay(delay, withSpring(0, config));
    opacity.value = withDelay(
      delay,
      withTiming(1, {duration: DURATIONS.normal}),
    );
  }, [delay, config, translateY, opacity, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  return {translateY, opacity, animatedStyle};
};

// ==================== useScaleIn ====================
/**
 * Hook para animación de scale in
 */
export const useScaleIn = (
  delay = 0,
  initialScale = 0.8,
  config = SPRING_CONFIGS.snappy,
) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    scale.value = withDelay(delay, withSpring(1, config));
    opacity.value = withDelay(
      delay,
      withTiming(1, {duration: DURATIONS.normal}),
    );
  }, [delay, config, scale, opacity, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  return {scale, opacity, animatedStyle};
};

// ==================== usePressAnimation ====================
/**
 * Hook para animación de presión de botón/card.
 *
 * Sprint 67: shares the app-wide PRESS_SCALE default + the pure
 * `pressTargetScale` reduce-motion policy with the RN-Animated `usePressScale`
 * hook, so both animation engines depress to the same target and BOTH suppress
 * the shrink under reduced motion (this is the Reanimated half of the press
 * unification — usePressScale covers the RN-Animated half).
 */
export const usePressAnimation = (pressedScale = PRESS_SCALE) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(
      pressTargetScale(true, reduced, pressedScale),
      SPRING_CONFIGS.snappy,
    );
  }, [pressedScale, scale, reduced]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(
      pressTargetScale(false, reduced, pressedScale),
      SPRING_CONFIGS.snappy,
    );
  }, [pressedScale, scale, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return {scale, onPressIn, onPressOut, animatedStyle};
};

// ==================== useCardPress ====================
/**
 * Hook específico para cards con escala más sutil
 */
export const useCardPress = () => {
  return usePressAnimation(0.98);
};

// ==================== usePulse ====================
/**
 * Hook para animación de pulso continuo
 */
export const usePulse = (minScale = 0.97, maxScale = 1.03, active = true) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      return;
    }
    if (active) {
      scale.value = withRepeat(
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
        -1,
        true,
      );
    } else {
      scale.value = withTiming(1, {duration: DURATIONS.fast});
    }
  }, [active, minScale, maxScale, scale, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return {scale, animatedStyle};
};

// ==================== useShimmer ====================
/**
 * Hook para efecto shimmer en skeleton loaders
 */
export const useShimmer = (duration = 1500) => {
  const reduced = useReducedMotion();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      // Park the shimmer offscreen so the skeleton renders as a flat block.
      shimmerValue.value = 0;
      return;
    }
    shimmerValue.value = withRepeat(
      withTiming(1, {
        duration,
        easing: EASING_CURVES.easeInOut,
      }),
      -1,
      true,
    );
  }, [duration, shimmerValue, reduced]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-100, 100],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{translateX}],
    };
  });

  return {shimmerValue, animatedStyle};
};

// ==================== useRotate ====================
/**
 * Hook para rotación continua (loaders)
 */
export const useRotate = (duration = 1000, active = true) => {
  const reduced = useReducedMotion();
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      rotation.value = 0;
      return;
    }
    if (active) {
      rotation.value = withRepeat(
        withTiming(360, {
          duration,
          easing: EASING_CURVES.easeInOut,
        }),
        -1,
        false,
      );
    } else {
      rotation.value = withTiming(0, {duration: DURATIONS.fast});
    }
  }, [active, duration, rotation, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${rotation.value}deg`}],
  }));

  return {rotation, animatedStyle};
};

// ==================== useShake ====================
/**
 * Hook para animación de shake (errores)
 */
export const useShake = () => {
  const reduced = useReducedMotion();
  const translateX = useSharedValue(0);

  const shake = useCallback(() => {
    if (reduced) {
      // Skip the lateral shake; callers pair it with haptics/messaging.
      translateX.value = 0;
      return;
    }
    translateX.value = withSequence(
      withTiming(10, {duration: 50}),
      withTiming(-10, {duration: 50}),
      withTiming(8, {duration: 50}),
      withTiming(-8, {duration: 50}),
      withTiming(5, {duration: 50}),
      withTiming(0, {duration: 50}),
    );
  }, [translateX, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  return {shake, animatedStyle};
};

// ==================== useBounceIn ====================
/**
 * Hook para animación bouncy de entrada
 */
export const useBounceIn = (delay = 0) => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }
    scale.value = withDelay(delay, withSpring(1, SPRING_CONFIGS.bouncy));
    opacity.value = withDelay(delay, withTiming(1, {duration: DURATIONS.fast}));
  }, [delay, scale, opacity, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  return {scale, opacity, animatedStyle};
};

// ==================== useStaggeredList ====================
/**
 * Hook para animar elementos de lista con stagger
 */
export const useStaggeredItem = (index: number, delayPerItem = 50) => {
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    const delay = index * delayPerItem;
    opacity.value = withDelay(
      delay,
      withTiming(1, {duration: DURATIONS.normal}),
    );
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.default));
  }, [index, delayPerItem, opacity, translateY, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }));

  return {animatedStyle};
};

// ==================== useCelebration ====================
/**
 * Hook para animación de celebración (logros)
 */
export const useCelebration = () => {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const celebrate = useCallback(() => {
    if (reduced) {
      // No bounce/wiggle; the achievement still surfaces via its modal/haptics.
      scale.value = 1;
      rotation.value = 0;
      return;
    }
    // Scale bounce
    scale.value = withSequence(
      withSpring(1.3, SPRING_CONFIGS.bouncy),
      withSpring(1, SPRING_CONFIGS.default),
    );
    // Rotation wiggle
    rotation.value = withSequence(
      withTiming(-8, {duration: 80}),
      withTiming(8, {duration: 80}),
      withTiming(-5, {duration: 80}),
      withTiming(5, {duration: 80}),
      withTiming(0, {duration: 80}),
    );
  }, [scale, rotation, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}, {rotate: `${rotation.value}deg`}],
  }));

  return {celebrate, animatedStyle};
};

// ==================== useProgressAnimation ====================
/**
 * Hook para animar barras de progreso
 */
export const useProgressAnimation = (
  targetProgress: number,
  duration = 700,
) => {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = targetProgress;
      return;
    }
    progress.value = withTiming(targetProgress, {
      duration,
      easing: EASING_CURVES.emphasizedDecelerate,
    });
  }, [targetProgress, duration, progress, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const animatedWidth = useAnimatedStyle(() => ({
    flex: progress.value,
  }));

  return {progress, animatedStyle, animatedWidth};
};

// ==================== useCountUp ====================
/**
 * Hook para animar números incrementando
 */
export const useCountUp = (
  targetValue: number,
  duration = 1000,
  _onUpdate?: (value: number) => void,
) => {
  const reduced = useReducedMotion();
  const animatedValue = useSharedValue(0);
  const displayValue = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      animatedValue.value = targetValue;
      return;
    }
    animatedValue.value = withTiming(targetValue, {
      duration,
      easing: EASING_CURVES.emphasizedDecelerate,
    });
  }, [targetValue, duration, animatedValue, reduced]);

  return {animatedValue, displayValue};
};

// ==================== EXPORTS ====================

export default {
  useFadeIn,
  useSlideIn,
  useScaleIn,
  usePressAnimation,
  useCardPress,
  usePulse,
  useShimmer,
  useRotate,
  useShake,
  useBounceIn,
  useStaggeredItem,
  useCelebration,
  useProgressAnimation,
  useCountUp,
};
