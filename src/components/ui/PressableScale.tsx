/**
 * 👆 PressableScale — a drop-in Pressable that depresses with the shared,
 * reduce-motion-aware press spring (Sprint 66).
 *
 * Replaces the per-component `Animated.Value` + handlePressIn/handlePressOut
 * boilerplate with one cohesive feel (see [[usePressScale]] / [[springs]]).
 * Forwards every Pressable prop (onPress, accessibility*, hitSlop, disabled…)
 * and composes the scale onto whatever `style` is passed.
 *
 * `Pressable` has no built-in press feedback of its own (unlike
 * `TouchableOpacity`'s `activeOpacity`), so a caller migrating off a plain
 * opacity-only `TouchableOpacity` should pass {@link pressedOpacity} — it
 * keeps that dim as a SEPARATE, opacity-only animation that is NOT gated by
 * reduced motion (a subtle opacity dim isn't "motion"). That way a
 * reduced-motion reader still gets the original opacity feedback even though
 * the scale is suppressed, instead of losing all press feedback outright.
 * Omit it to keep the original scale-only behavior (the existing call site
 * in chapter/[book].tsx doesn't pass it).
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
import React, {useRef} from 'react';
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

/** Duration (ms) of the optional opacity dim — quick, like activeOpacity. */
const OPACITY_DURATION = 100;

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  /** Pressed scale (default {@link PRESS_SCALE}). */
  scaleTo?: number;
  /**
   * Opacity to dim toward while pressed, mirroring `TouchableOpacity`'s
   * `activeOpacity`. Unset by default (scale-only). Runs ungated by reduced
   * motion — see the component doc above.
   */
  pressedOpacity?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const PressableScale: React.FC<PressableScaleProps> = ({
  scaleTo = PRESS_SCALE,
  pressedOpacity,
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
  const opacity = useRef(new Animated.Value(1)).current;

  const animateOpacity = (pressed: boolean) => {
    if (pressedOpacity === undefined) return;
    Animated.timing(opacity, {
      toValue: pressed ? pressedOpacity : 1,
      duration: OPACITY_DURATION,
      useNativeDriver: true,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      onPressIn={e => {
        pressIn();
        animateOpacity(true);
        onPressIn?.(e);
      }}
      onPressOut={e => {
        pressOut();
        animateOpacity(false);
        onPressOut?.(e);
      }}
      style={[
        style,
        {transform: [{scale}]},
        pressedOpacity !== undefined ? {opacity} : null,
      ]}>
      {children}
    </AnimatedPressable>
  );
};

export default PressableScale;
