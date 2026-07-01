import {useCallback, useEffect, useRef} from 'react';
import {BackHandler} from 'react-native';
import {useFocusEffect} from 'expo-router';

/**
 * Wires Android hardware back (and the matching edge-swipe gesture) to a
 * screen's own local step/phase state instead of letting it pop the route.
 *
 * `onBack` should retreat one internal step and return `true` to consume the
 * event, or return `false` when there's nothing left to retreat to — the
 * event then falls through to the default route-pop.
 *
 * The handler is read from a ref on every press, so callers can pass a plain
 * (non-memoized) closure each render without re-subscribing the listener.
 */
export function useBackHandlerStep(onBack: () => boolean): void {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () =>
        onBackRef.current(),
      );
      return () => sub.remove();
    }, []),
  );
}
