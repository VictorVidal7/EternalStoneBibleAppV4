/**
 * Premium entitlement context (Sprint 50; rewired for the offering
 * infrastructure tanda).
 *
 * Reads the cached entitlement once on mount (for a correct-looking cold
 * start) and subscribes to offeringService's real entitlement changes for
 * the rest of the session — those come from RevenueCat's CustomerInfo, not
 * from this context, and win over anything written here.
 *
 * `setPremium` is a __DEV__-only manual override for local testing (the
 * Settings toggle predates real purchases and is being replaced by an
 * actual offering/restore flow in a later tanda) — in production builds it
 * warns and no-ops rather than pretending to grant a real entitlement.
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
import {onEntitlementChange} from '@lib/offering/offeringService';
import {logger} from '@lib/utils/logger';

export interface PremiumContextValue {
  /** Whether premium features are unlocked on this device. */
  isPremium: boolean;
  /** True until the persisted flag has been read on mount. */
  isLoading: boolean;
  /** __DEV__-only manual override; no-ops in production. See module docstring. */
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

    const unsubscribe = onEntitlementChange(unlocked => {
      if (mounted) setIsPremium(unlocked);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const setPremium = useCallback(async (value: boolean) => {
    if (!__DEV__) {
      logger.warn(
        'PremiumContext.setPremium is a __DEV__-only override; ignored in production',
        {component: 'PremiumContext', action: 'setPremium'},
      );
      return;
    }
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
