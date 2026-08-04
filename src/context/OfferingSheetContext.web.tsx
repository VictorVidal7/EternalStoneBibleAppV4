/**
 * OfferingSheetContext.web — inert web stub (stopgap crash fix).
 *
 * See PremiumContext.web.tsx's header comment for the full crash story —
 * this is the same fix for useOfferingSheet(), the second of the three hooks
 * that ~27 web-reachable route files call unconditionally with no
 * OfferingSheetProvider mounted on web.
 *
 * `open()` is a safe no-op rather than rendering the real OfferingSheet: that
 * component (and offeringService underneath it) exists to drive a RevenueCat
 * purchase flow that has no web counterpart, and this file must not pull any
 * of that — or its native-only transitive imports — into the web bundle.
 * "Does nothing harmful" is explicitly preferred over "does something
 * clever" for this pass; a real web offering/donation experience is a later
 * product decision, not addressed here.
 *
 * Metro resolves this file automatically in place of OfferingSheetContext.tsx
 * for any web bundle (see data-loader.web.ts for the established platform-
 * split precedent), so every existing `useOfferingSheet()` call site gets
 * this safe value with ZERO changes to the 27 route files. tsc always
 * resolves a bare `@context/OfferingSheetContext` import against the NATIVE
 * file, so this file's exported surface must keep matching it.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React, {createContext, useContext, ReactNode} from 'react';
import {logger} from '@lib/utils/logger';

interface OfferingSheetContextValue {
  open: () => void;
}

const OfferingSheetContext = createContext<
  OfferingSheetContextValue | undefined
>(undefined);

function openNoop(): void {
  logger.info(
    'OfferingSheetContext.web: open() is a no-op (no offering/purchase flow on web)',
    {component: 'OfferingSheetContext.web', action: 'open'},
  );
}

// Static — nothing here ever changes at runtime, so a single stable value
// object avoids re-rendering every consumer.
const STUB_VALUE: OfferingSheetContextValue = {open: openNoop};

interface OfferingSheetProviderProps {
  children: ReactNode;
}

export const OfferingSheetProvider: React.FC<OfferingSheetProviderProps> = ({
  children,
}) => (
  <OfferingSheetContext.Provider value={STUB_VALUE}>
    {children}
  </OfferingSheetContext.Provider>
);

export function useOfferingSheet(): OfferingSheetContextValue {
  const ctx = useContext(OfferingSheetContext);
  if (!ctx) {
    throw new Error(
      'useOfferingSheet must be used within an OfferingSheetProvider',
    );
  }
  return ctx;
}
