/**
 * 👆 usePressScale — the shared press-depress spring for tappable surfaces.
 *
 * Sprint 66. Returns an Animated scale plus onPressIn/onPressOut handlers wired
 * to the app-wide [[springs]] config, so any card/button gets the same snappy
 * feel and (unlike most of the bespoke implementations it replaces) is
 * reduce-motion aware: when the user prefers reduced motion the scale simply
 * stays at 1. Use this when a component already owns its container (compose the
 * returned `scale` into its transform); use PressableScale for a drop-in.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import {useRef} from 'react';
import {Animated} from 'react-native';
import {useReducedMotion} from './useReducedMotion';
import {
  PRESS_SCALE,
  PRESS_SPRING,
  pressTargetScale,
} from '@lib/animation/springs';

export interface PressScale {
  /** Animated value (1 at rest) to feed a `transform: [{scale}]`. */
  scale: Animated.Value;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function usePressScale(scaleTo: number = PRESS_SCALE): PressScale {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (pressed: boolean) => {
    Animated.spring(scale, {
      toValue: pressTargetScale(pressed, reduced, scaleTo),
      ...PRESS_SPRING,
      useNativeDriver: true,
    }).start();
  };

  return {
    scale,
    onPressIn: () => animateTo(true),
    onPressOut: () => animateTo(false),
  };
}

export default usePressScale;
