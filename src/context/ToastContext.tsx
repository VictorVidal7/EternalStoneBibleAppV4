/**
 * 🔔 TOAST CONTEXT
 *
 * Proveedor global para mostrar toasts/notificaciones
 * en cualquier parte de la app
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import {Modal, StyleSheet, View} from 'react-native';
import Toast from '../components/Toast';

type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';
type ToastPosition = 'top' | 'bottom';

interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  position?: ToastPosition;
  action?: {
    label: string;
    onPress: () => void;
  };
  /** Line cap for `message` — see `Toast`'s own prop doc. Defaults to 2. */
  numberOfLines?: number;
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number, numberOfLines?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({children}) => {
  const [toastConfig, setToastConfig] = useState<ToastOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((options: ToastOptions) => {
    setToastConfig(options);
    setVisible(true);
  }, []);

  const success = useCallback(
    (message: string, duration = 3000) => {
      show({message, variant: 'success', duration});
    },
    [show],
  );

  const error = useCallback(
    (message: string, duration = 3000) => {
      show({message, variant: 'error', duration});
    },
    [show],
  );

  const warning = useCallback(
    (message: string, duration = 3000) => {
      show({message, variant: 'warning', duration});
    },
    [show],
  );

  const info = useCallback(
    (message: string, duration = 3000, numberOfLines?: number) => {
      show({message, variant: 'info', duration, numberOfLines});
    },
    [show],
  );

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{show, success, error, warning, info}}>
      {children}
      {toastConfig && (
        // A plain absolute-positioned View here would render in the app's
        // main Android window — invisible behind any screen that opens its
        // own native `Modal` (ImageShareModal, OfferingSheet, etc., which
        // are genuinely separate windows on Android, stacked on top).
        // Wrapping in its own transparent Modal gives the toast its own
        // window too, shown last so it lands above whatever else is open.
        <Modal
          transparent
          animationType="none"
          statusBarTranslucent
          visible={visible}
          onRequestClose={handleDismiss}>
          <View style={styles.toastContainer} pointerEvents="box-none">
            <Toast
              visible={visible}
              message={toastConfig.message}
              variant={toastConfig.variant || 'default'}
              duration={toastConfig.duration || 3000}
              position={toastConfig.position || 'top'}
              action={toastConfig.action}
              numberOfLines={toastConfig.numberOfLines}
              onDismiss={handleDismiss}
            />
          </View>
        </Modal>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
});
