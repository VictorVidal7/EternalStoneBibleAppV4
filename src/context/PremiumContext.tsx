/**
 * Premium entitlement context (Sprint 50).
 *
 * Thin React glue over the device-local premium flag (`premiumStore`). Loads
 * the persisted flag once on mount and exposes it plus a setter that persists
 * optimistically. No IAP yet — `setPremium` is driven by the Settings toggle
 * that stands in for a future purchase; a real entitlement source would swap
 * out the store underneath this provider without touching consumers.
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  getPremiumUnlocked,
  setPremiumUnlocked,
} from '@lib/premium/premiumStore';

export interface PremiumContextValue {
  /** Whether premium features are unlocked on this device. */
  isPremium: boolean;
  /** True until the persisted flag has been read on mount. */
  isLoading: boolean;
  /** Persist + apply the premium flag. */
  setPremium: (value: boolean) => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue | undefined>(
  undefined,
);

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({children}) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const unlocked = await getPremiumUnlocked();
      if (mounted) {
        setIsPremium(unlocked);
        setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const setPremium = useCallback(async (value: boolean) => {
    // Optimistic: flip in-memory first so the gated UI reacts immediately,
    // then persist. The store swallows write errors (warns), so the in-memory
    // value is the source of truth for this session either way.
    setIsPremium(value);
    await setPremiumUnlocked(value);
  }, []);

  return (
    <PremiumContext.Provider value={{isPremium, isLoading, setPremium}}>
      {children}
    </PremiumContext.Provider>
  );
};

export function usePremium(): PremiumContextValue {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}

export default PremiumContext;
