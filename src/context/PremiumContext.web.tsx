/**
 * PremiumContext.web — inert web stub (stopgap crash fix).
 *
 * `app/_layout.web.tsx` deliberately mounts a reduced provider tree (T21):
 * no PremiumProvider, no OfferingSheetProvider, no AudioPlayerProvider. But
 * ~27 route files under app/features/** (dictionary, quiz, prep, sermon
 * notes, etc.) call usePremium() unconditionally with no .web.tsx sibling
 * and no Platform.OS guard, and firebase.json's catch-all SPA rewrite makes
 * every one of those routes reachable via a direct URL/bookmark on the live
 * site — so the real PremiumContext's "must be used within a
 * PremiumProvider" throw was taking down the ENTIRE web app (ErrorBoundary
 * wraps the whole Stack, not per-route).
 *
 * Metro resolves this file automatically in place of PremiumContext.tsx for
 * any web bundle (same precedent as data-loader.web.ts / redLetterText.web.ts
 * — see their header comments), so every existing `usePremium()` call site
 * gets this safe value with ZERO changes to the 27 route files. tsc has no
 * platform awareness and always resolves a bare `@context/PremiumContext`
 * import against the NATIVE file, so this file's exported surface
 * (PremiumContextValue / PremiumProvider / usePremium / usePremiumOptional /
 * default export) must keep matching PremiumContext.tsx's.
 *
 * There is no RevenueCat/billing integration on web at all — this always
 * reports "not premium" and never throws. `setPremium` is a no-op (warns
 * once via logger rather than pretending to grant an entitlement).
 *
 * Scope note: this is intentionally the bare minimum to stop the crash.
 * Whether premium should ever be purchasable on web, or how gated features
 * should *look* when "always free" on web, is a product decision for a
 * later pass — not addressed here.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React, {createContext, useContext, ReactNode} from 'react';
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

async function setPremiumNoop(_value: boolean): Promise<void> {
  logger.warn(
    'PremiumContext.web: setPremium is a no-op (no billing/premium support on web)',
    {component: 'PremiumContext.web', action: 'setPremium'},
  );
}

// Static — web premium status never changes at runtime, so a single stable
// value object avoids re-rendering every consumer on every PremiumProvider
// render.
const STUB_VALUE: PremiumContextValue = {
  isPremium: false,
  isLoading: false,
  setPremium: setPremiumNoop,
};

interface PremiumProviderProps {
  children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({children}) => (
  <PremiumContext.Provider value={STUB_VALUE}>
    {children}
  </PremiumContext.Provider>
);

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
 * instead of throwing. Mirrors the native file's usePremiumOptional.
 */
export function usePremiumOptional(): PremiumContextValue | undefined {
  return useContext(PremiumContext);
}

export default PremiumContext;
