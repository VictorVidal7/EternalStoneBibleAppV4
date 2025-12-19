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
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  SPRING_CONFIGS,
  DURATIONS,
  EASING_CURVES,
} from '../styles/reanimatedAnimations';

// ==================== useFadeIn ====================
/**
 * Hook para animación de fade in al montar
 */
export const useFadeIn = (delay = 0, duration = DURATIONS.normal) => {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration,
        easing: EASING_CURVES.emphasizedDecelerate,
      }),
    );
  }, [delay, duration, opacity]);

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
  const translateY = useSharedValue(initialOffset);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, config));
    opacity.value = withDelay(
      delay,
      withTiming(1, {duration: DURATIONS.normal}),
    );
  }, [delay, config, translateY, opacity]);

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
  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, config));
    opacity.value = withDelay(
      delay,
      withTiming(1, {duration: DURATIONS.normal}),
    );
  }, [delay, config, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  return {scale, opacity, animatedStyle};
};

// ==================== usePressAnimation ====================
/**
 * Hook para animación de presión de botón/card
 */
export const usePressAnimation = (pressedScale = 0.95) => {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(pressedScale, SPRING_CONFIGS.snappy);
  }, [pressedScale, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, [scale]);

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
  const scale = useSharedValue(1);

  useEffect(() => {
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
  }, [active, minScale, maxScale, scale]);

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
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, {
        duration,
        easing: EASING_CURVES.easeInOut,
      }),
      -1,
      true,
    );
  }, [duration, shimmerValue]);

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
  const rotation = useSharedValue(0);

  useEffect(() => {
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
  }, [active, duration, rotation]);

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
  const translateX = useSharedValue(0);

  const shake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(10, {duration: 50}),
      withTiming(-10, {duration: 50}),
      withTiming(8, {duration: 50}),
      withTiming(-8, {duration: 50}),
      withTiming(5, {duration: 50}),
      withTiming(0, {duration: 50}),
    );
  }, [translateX]);

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
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, SPRING_CONFIGS.bouncy));
    opacity.value = withDelay(delay, withTiming(1, {duration: DURATIONS.fast}));
  }, [delay, scale, opacity]);

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
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * delayPerItem;
    opacity.value = withDelay(
      delay,
      withTiming(1, {duration: DURATIONS.normal}),
    );
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.default));
  }, [index, delayPerItem, opacity, translateY]);

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
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const celebrate = useCallback(() => {
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
  }, [scale, rotation]);

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
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(targetProgress, {
      duration,
      easing: EASING_CURVES.emphasizedDecelerate,
    });
  }, [targetProgress, duration, progress]);

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
  onUpdate?: (value: number) => void,
) => {
  const animatedValue = useSharedValue(0);
  const displayValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(targetValue, {
      duration,
      easing: EASING_CURVES.emphasizedDecelerate,
    });
  }, [targetValue, duration, animatedValue]);

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
