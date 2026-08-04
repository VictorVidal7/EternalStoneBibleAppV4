/**
 * 🔢 CountUpText — a number that ticks up to its value on mount (Sprint 65).
 *
 * A drop-in replacement for an `<AppText>` rendering a number: on mount (and
 * whenever `value` changes) it animates from 0 up to `value` with an ease-out
 * curve, so dashboard hero numbers feel alive instead of snapping in. Inherits
 * every AppText prop (scaleRole/style/…) so the font-scale cap still applies.
 *
 * Accessibility: fully reduce-motion aware via [[useReducedMotion]] — when the
 * user prefers reduced motion the final value renders immediately with NO
 * animation. The math lives in the pure [[countUpValue]]; this only wires the
 * RN Animated 0→1 driver and samples it.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useRef, useState} from 'react';
import {Animated, Easing} from 'react-native';
import {AppText, AppTextProps} from './AppText';
import {useReducedMotion} from '@hooks/useReducedMotion';
import {useLanguage} from '@hooks/useLanguage';
import {countUpValue} from '@lib/animation/countUp';

export interface CountUpTextProps extends Omit<AppTextProps, 'children'> {
  /** The target number to count up to. */
  value: number;
  /** Count-up duration in ms. Default 900. */
  durationMs?: number;
  /** Formats the displayed integer (default: locale-grouped, e.g. "1,234"). */
  format?: (n: number) => string;
}

export const CountUpText: React.FC<CountUpTextProps> = ({
  value,
  durationMs = 900,
  format,
  ...textProps
}) => {
  // No custom `format` passed → default to the app's CHOSEN language
  // (independent of device locale), same convention as journey/reading-insights.
  const {language} = useLanguage();
  const resolvedFormat =
    format ??
    ((n: number): string =>
      n.toLocaleString(language === 'en' ? 'en-US' : 'es-ES'));
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  // Start already settled when motion is reduced so the first paint is final.
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    progress.setValue(0);
    const id = progress.addListener(({value: p}) => {
      setDisplay(countUpValue(value, p));
    });
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      // Drives JS state (the rendered text), so it can't use the native driver.
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      progress.removeListener(id);
      anim.stop();
    };
  }, [value, reduced, durationMs, progress]);

  return <AppText {...textProps}>{resolvedFormat(display)}</AppText>;
};

export default CountUpText;
