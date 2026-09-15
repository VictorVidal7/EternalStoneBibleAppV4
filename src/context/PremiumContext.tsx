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
  useRef,
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
  /**
   * R9-10 — whether RevenueCat has already spoken in this mount. The cache is
   * only ever a bridge value for the first paint (see the module docstring:
   * CustomerInfo "wins over anything written here"), but the mount read was
   * applied UNCONDITIONALLY when it resolved, so whichever of the two landed
   * last won. A slow first keystore access on a cold start — exactly the case
   * `expo-secure-store` is slow in — inverts the order and the stale cache
   * overwrites the live value for the whole session.
   *
   * Paired with R9-9 on purpose: R9-9 makes the revocation actually arrive,
   * and without this it would arrive and then be thrown away. Fixing one
   * without the other leaves the refunded user with their paid access.
   */
  const revenueCatSpokeRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Subscribe BEFORE kicking off the cache read: an entitlement change that
    // lands in between would otherwise reach no listener at all.
    const unsubscribe = onEntitlementChange(unlocked => {
      revenueCatSpokeRef.current = true;
      if (mounted) setIsPremium(unlocked);
    });

    (async () => {
      const unlocked = await getPremiumUnlocked();
      if (!mounted) return;
      // Only bridge the first paint if nothing truer has arrived meanwhile.
      if (!revenueCatSpokeRef.current) setIsPremium(unlocked);
      setIsLoading(false);
    })();

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

/**
 * Non-throwing variant for code that can render without a PremiumProvider
 * ancestor (unit tests that mount a narrower tree) — returns undefined
 * instead of throwing. Mirrors useBibleVersionOptional's rationale.
 */
export function usePremiumOptional(): PremiumContextValue | undefined {
  return useContext(PremiumContext);
}

export default PremiumContext;
