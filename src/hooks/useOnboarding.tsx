/**
 * 🎯 ONBOARDING HOOK
 *
 * Persisted "has the user finished the first-run wizard?" flag.
 * `completed` starts as `null` (unknown) until AsyncStorage answers — so
 * callers can render a loading splash while waiting, instead of briefly
 * flashing the onboarding screen at every cold start.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@onboarding_completed';

export interface UseOnboardingResult {
  /** null = still hydrating; false = wizard pending; true = already done. */
  completed: boolean | null;
  /** Mark the wizard as finished (writes `'1'` to AsyncStorage). */
  complete: () => Promise<void>;
  /** Forget the flag (test / "show me the welcome again" affordance). */
  reset: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingResult {
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => setCompleted(value === '1'))
      .catch(() => setCompleted(false));
  }, []);

  const complete = useCallback(async () => {
    setCompleted(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Persisting is best-effort — if it fails the user just sees the
      // wizard once more on next cold start, which is a survivable loss.
    }
  }, []);

  const reset = useCallback(async () => {
    setCompleted(false);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // No-op on failure for the same reason as `complete`.
    }
  }, []);

  return {completed, complete, reset};
}
