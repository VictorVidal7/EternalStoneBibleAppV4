/**
 * 👆 PressableScale — a drop-in Pressable that depresses with the shared,
 * reduce-motion-aware press spring (Sprint 66).
 *
 * Replaces the per-component `Animated.Value` + handlePressIn/handlePressOut
 * boilerplate with one cohesive feel (see [[usePressScale]] / [[springs]]).
 * Forwards every Pressable prop (onPress, accessibility*, hitSlop, disabled…)
 * and composes the scale onto whatever `style` is passed.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import React from 'react';
import {
  Animated,
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {usePressScale} from '@hooks/usePressScale';
import {PRESS_SCALE} from '@lib/animation/springs';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Pressed scale (default {@link PRESS_SCALE}). */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  scaleTo = PRESS_SCALE,
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}) => {
  const {
    scale,
    onPressIn: pressIn,
    onPressOut: pressOut,
  } = usePressScale(scaleTo);

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={e => {
        pressIn();
        onPressIn?.(e);
      }}
      onPressOut={e => {
        pressOut();
        onPressOut?.(e);
      }}
      style={[style, {transform: [{scale}]}]}>
      {children}
    </AnimatedPressable>
  );
};

export default PressableScale;
