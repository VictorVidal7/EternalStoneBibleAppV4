/**
 * ♿ ACCESSIBILITY PREFERENCES CONTEXT
 *
 * App-level accessibility overrides that live independently of the OS
 * setting they complement — currently just "Reducir animaciones" (T15 —
 * #9), which lets a user force motion-free rendering even when their OS
 * hasn't been told to reduce motion (some Android OEM skins bury or omit
 * that toggle). `useReducedMotion` ORs this override with the real OS
 * value, so every one of its existing call sites benefits with no changes
 * of their own.
 *
 * Mirrors `useTheme`'s own graceful-fallback pattern: reading the hook
 * outside a provider returns a safe default instead of throwing, so
 * `useReducedMotion`'s existing standalone tests don't need a wrapper.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccessibilityPreferencesContextValue {
  reduceMotionOverride: boolean;
  setReduceMotionOverride: (enabled: boolean) => Promise<void>;
}

const REDUCE_MOTION_STORAGE_KEY = '@app_reduce_motion_override';

const AccessibilityPreferencesContext = createContext<
  AccessibilityPreferencesContextValue | undefined
>(undefined);

export const AccessibilityPreferencesProvider: React.FC<{
  children: ReactNode;
}> = ({children}) => {
  const [reduceMotionOverride, setReduceMotionOverrideState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(REDUCE_MOTION_STORAGE_KEY)
      .then(saved => {
        if (saved === 'true') setReduceMotionOverrideState(true);
      })
      .catch(error => {
        console.error('Error loading reduce-motion override:', error);
      });
  }, []);

  const setReduceMotionOverride = useCallback(async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem(
        REDUCE_MOTION_STORAGE_KEY,
        enabled ? 'true' : 'false',
      );
      setReduceMotionOverrideState(enabled);
    } catch (error) {
      console.error('Error saving reduce-motion override:', error);
    }
  }, []);

  return (
    <AccessibilityPreferencesContext.Provider
      value={{reduceMotionOverride, setReduceMotionOverride}}>
      {children}
    </AccessibilityPreferencesContext.Provider>
  );
};

const defaultValue: AccessibilityPreferencesContextValue = {
  reduceMotionOverride: false,
  setReduceMotionOverride: async () => {},
};

export function useAccessibilityPreferences(): AccessibilityPreferencesContextValue {
  const context = useContext(AccessibilityPreferencesContext);
  return context ?? defaultValue;
}
