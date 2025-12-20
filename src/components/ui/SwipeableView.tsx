/**
 * 👆 SwipeableView - Contenedor con Gestos de Swipe
 *
 * Wrapper para detectar gestos de swipe horizontal/vertical
 * Ideal para navegación entre capítulos/páginas
 *
 * Características:
 * - Detección de swipe izquierda/derecha/arriba/abajo
 * - Umbral configurable
 * - Velocidad mínima configurable
 * - Callbacks por dirección
 * - Haptic feedback opcional
 * - Indicadores visuales opcionales
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useCallback} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import {SPRING_CONFIGS} from '../../styles/reanimatedAnimations';

// ==================== TYPES ====================

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

interface SwipeableViewProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
  swipeThreshold?: number;
  velocityThreshold?: number;
  enableHorizontal?: boolean;
  enableVertical?: boolean;
  enableHaptics?: boolean;
  showIndicators?: boolean;
  indicatorColor?: string;
  maxTranslate?: number;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

type GestureContext = {
  startX: number;
  startY: number;
};

// ==================== SWIPE INDICATOR ====================

interface SwipeIndicatorProps {
  direction: 'left' | 'right';
  translateX: Animated.SharedValue<number>;
  color: string;
}

const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({
  direction,
  translateX,
  color,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isLeft = direction === 'left';
    const progress = interpolate(
      translateX.value,
      isLeft ? [0, -50] : [-50, 0, 50],
      isLeft ? [0, 1] : [0, 0, 1],
      Extrapolation.CLAMP,
    );

    return {
      opacity: progress * 0.8,
      transform: [
        {
          scale: interpolate(progress, [0, 1], [0.5, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.indicator,
        direction === 'left' ? styles.indicatorLeft : styles.indicatorRight,
        {backgroundColor: color},
        animatedStyle,
      ]}>
      <Animated.Text style={styles.indicatorText}>
        {direction === 'left' ? '→' : '←'}
      </Animated.Text>
    </Animated.View>
  );
};

// ==================== MAIN COMPONENT ====================

export const SwipeableView: React.FC<SwipeableViewProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onSwipe,
  swipeThreshold = 50,
  velocityThreshold = 500,
  enableHorizontal = true,
  enableVertical = false,
  enableHaptics = true,
  showIndicators = false,
  indicatorColor = 'rgba(99, 102, 241, 0.9)',
  maxTranslate = 100,
  containerStyle,
  disabled = false,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Trigger haptic feedback
  const triggerHaptic = useCallback(() => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [enableHaptics]);

  // Handle swipe completion
  const handleSwipe = useCallback(
    (direction: SwipeDirection) => {
      triggerHaptic();
      onSwipe?.(direction);

      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    },
    [triggerHaptic, onSwipe, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown],
  );

  // Gesture handler
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (enableHorizontal) {
        // Limit translation
        const newX = context.startX + event.translationX;
        translateX.value = Math.max(
          -maxTranslate,
          Math.min(maxTranslate, newX),
        );
      }
      if (enableVertical) {
        const newY = context.startY + event.translationY;
        translateY.value = Math.max(
          -maxTranslate,
          Math.min(maxTranslate, newY),
        );
      }
    },
    onEnd: event => {
      const {translationX, translationY, velocityX, velocityY} = event;

      // Check horizontal swipe
      if (enableHorizontal) {
        const isSwipeLeft =
          translationX < -swipeThreshold || velocityX < -velocityThreshold;
        const isSwipeRight =
          translationX > swipeThreshold || velocityX > velocityThreshold;

        if (isSwipeLeft) {
          runOnJS(handleSwipe)('left');
        } else if (isSwipeRight) {
          runOnJS(handleSwipe)('right');
        }
      }

      // Check vertical swipe
      if (enableVertical) {
        const isSwipeUp =
          translationY < -swipeThreshold || velocityY < -velocityThreshold;
        const isSwipeDown =
          translationY > swipeThreshold || velocityY > velocityThreshold;

        if (isSwipeUp) {
          runOnJS(handleSwipe)('up');
        } else if (isSwipeDown) {
          runOnJS(handleSwipe)('down');
        }
      }

      // Reset position
      translateX.value = withSpring(0, SPRING_CONFIGS.snappy);
      translateY.value = withSpring(0, SPRING_CONFIGS.snappy);
    },
  });

  // Animated style for content
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value) + Math.abs(translateY.value),
      [0, maxTranslate],
      [1, 0.98],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        {translateX: translateX.value * 0.3}, // Subtle movement
        {translateY: translateY.value * 0.3},
        {scale},
      ],
    };
  });

  if (disabled) {
    return <View style={containerStyle}>{children}</View>;
  }

  return (
    <GestureHandlerRootView style={[styles.container, containerStyle]}>
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        activeOffsetX={enableHorizontal ? [-10, 10] : [-10000, 10000]}
        activeOffsetY={enableVertical ? [-10, 10] : [-10000, 10000]}>
        <Animated.View style={[styles.content, animatedStyle]}>
          {children}

          {/* Swipe Indicators */}
          {showIndicators && enableHorizontal && (
            <>
              <SwipeIndicator
                direction="left"
                translateX={translateX}
                color={indicatorColor}
              />
              <SwipeIndicator
                direction="right"
                translateX={translateX}
                color={indicatorColor}
              />
            </>
          )}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    top: '50%',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -24,
  },
  indicatorLeft: {
    right: 16,
  },
  indicatorRight: {
    left: 16,
  },
  indicatorText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

// ==================== EXPORTS ====================

export default SwipeableView;
