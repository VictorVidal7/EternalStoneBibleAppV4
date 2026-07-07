/**
 * ♿ useReducedMotion — honor the OS "reduce / remove animations" setting,
 * OR the app's own "Reducir animaciones" override (T15 — #9, for OEM skins
 * that bury or omit the OS toggle).
 *
 * Mirrors [[useScreenReaderListener]]: it reads the initial value from
 * `AccessibilityInfo` and subscribes to changes. Consumers — high-visibility
 * motion sites (skeleton shimmer, achievement celebration, immersive reader,
 * count-up text) — use the returned boolean to fall back to an instant,
 * motion-free end state. The SharedValue still
 * lands on its final value, so nothing breaks visually; the only thing that
 * changes is whether the transition is animated.
 *
 * When the OS setting is OFF and the app override is OFF, the app is
 * byte-identical to before — the same "defaults match legacy" discipline as
 * the Sprint-54 reader themes.
 *
 * OS value is device-local, no persistence, no sync. The app override is
 * persisted (see `AccessibilityPreferencesContext`) but still device-local.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';
import {useAccessibilityPreferences} from '@context/AccessibilityPreferencesContext';

/**
 * @returns `true` when the OS OR the app's own override asks to reduce/remove
 * motion. Starts at just the app override (synchronous) and resolves to
 * include the real OS value on mount (that platform API has no synchronous
 * getter), then stays in sync via the listener.
 */
export const useReducedMotion = (): boolean => {
  const [osReduced, setOsReduced] = useState(false);
  const {reduceMotionOverride} = useAccessibilityPreferences();

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (mounted) {
        setOsReduced(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setOsReduced,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return osReduced || reduceMotionOverride;
};

export default useReducedMotion;
