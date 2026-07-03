/**
 * Offering sheet context — lets any screen open the "ofrenda" unlock sheet
 * (see OfferingSheet.tsx) with a single call, the same pattern already used
 * for ToastContext. The sheet itself is rendered once here, as a sibling of
 * `children`, rather than duplicated at every call site.
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
import {OfferingSheet} from '@components/offering/OfferingSheet';

interface OfferingSheetContextValue {
  open: () => void;
}

const OfferingSheetContext = createContext<
  OfferingSheetContextValue | undefined
>(undefined);

interface OfferingSheetProviderProps {
  children: ReactNode;
}

export const OfferingSheetProvider: React.FC<OfferingSheetProviderProps> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  return (
    <OfferingSheetContext.Provider value={{open}}>
      {children}
      <OfferingSheet visible={visible} onClose={close} />
    </OfferingSheetContext.Provider>
  );
};

export function useOfferingSheet(): OfferingSheetContextValue {
  const ctx = useContext(OfferingSheetContext);
  if (!ctx) {
    throw new Error(
      'useOfferingSheet must be used within an OfferingSheetProvider',
    );
  }
  return ctx;
}
