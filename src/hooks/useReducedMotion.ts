/**
 * ♿ useReducedMotion — honor the OS "reduce / remove animations" setting.
 *
 * Mirrors [[useScreenReaderListener]]: it reads the initial value from
 * `AccessibilityInfo` and subscribes to changes. Consumers — the shared
 * animation hooks in [[useAnimations]] plus a few high-visibility motion
 * sites (audio waveform, achievement celebration) — use the returned boolean
 * to fall back to an instant, motion-free end state. The SharedValue still
 * lands on its final value, so nothing breaks visually; the only thing that
 * changes is whether the transition is animated.
 *
 * When the OS setting is OFF the app is byte-identical to before — the same
 * "defaults match legacy" discipline as the Sprint-54 reader themes.
 *
 * Device-local, no persistence, no sync.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';

/**
 * @returns `true` when the user has asked the OS to reduce/remove motion.
 * Starts `false` and resolves to the real value on mount (the platform API is
 * async with no synchronous getter), then stays in sync via the listener.
 */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {
        setReduced(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
};

export default useReducedMotion;
