/**
 * Donation sheet context — lets any screen open the "Donación" sheet (see
 * DonationSheet.tsx) with a single call, mirroring OfferingSheetContext.
 * Deliberately separate from the offering flow: donating never unlocks
 * anything, so it has its own sheet, its own context, and its own entry
 * point in Settings, per the plan's "never inside the unlock flow" decision.
 *
 * Para la gloria de Dios Todopoderoso.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from 'react';
import {DonationSheet} from '@components/donation/DonationSheet';

interface DonationSheetContextValue {
  open: () => void;
}

const DonationSheetContext = createContext<
  DonationSheetContextValue | undefined
>(undefined);

interface DonationSheetProviderProps {
  children: ReactNode;
}

export const DonationSheetProvider: React.FC<DonationSheetProviderProps> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  return (
    <DonationSheetContext.Provider value={{open}}>
      {children}
      <DonationSheet visible={visible} onClose={close} />
    </DonationSheetContext.Provider>
  );
};

export function useDonationSheet(): DonationSheetContextValue {
  const ctx = useContext(DonationSheetContext);
  if (!ctx) {
    throw new Error(
      'useDonationSheet must be used within a DonationSheetProvider',
    );
  }
  return ctx;
}
