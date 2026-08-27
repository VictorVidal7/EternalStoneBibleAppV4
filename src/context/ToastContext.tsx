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
  useRef,
  ReactNode,
} from 'react';
import {StyleSheet, View} from 'react-native';
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
  // Bumped on every show() and applied as `<Toast key={toastKey}>` below —
  // forces a fresh Toast instance (fresh Animated values, fresh mount
  // effect, fresh auto-dismiss timer) per toast. Without this, Toast's own
  // entrance/timer effect depends only on `visible`: a second toast firing
  // while the first is still visible is a no-op state-wise, so the timer
  // never resets and the newer toast can silently inherit the older one's
  // almost-expired timer — confirmed via BadgeCollectionScreen's staggered
  // 600ms-apart achievement toasts, where later toasts vanished near-
  // instantly instead of showing for their own full duration.
  const [toastKey, setToastKey] = useState(0);
  // Kept in sync with toastKey on every render (no effect needed — refs
  // don't trigger re-renders) so handleDismiss can tell a STALE toast
  // instance's dismiss request apart from the current one, see below.
  const currentKeyRef = useRef(0);
  currentKeyRef.current = toastKey;

  const show = useCallback((options: ToastOptions) => {
    setToastConfig(options);
    setVisible(true);
    setToastKey(k => k + 1);
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

  // A stale (just-superseded) Toast instance's exit-animation completion
  // can still fire its onDismiss AFTER a newer toast has already mounted —
  // unmounting only cancels the old instance's pending auto-dismiss
  // *timeout*, not an exit animation already in flight when it was
  // superseded. Ignoring a dismiss that doesn't match the CURRENT key stops
  // that stale callback from hiding the newer toast out from under it.
  const handleDismiss = useCallback((forKey: number) => {
    if (forKey === currentKeyRef.current) {
      setVisible(false);
    }
  }, []);

  return (
    <ToastContext.Provider value={{show, success, error, warning, info}}>
      {children}
      {toastConfig && (
        // Rendered as a plain sibling View (no Modal wrapper) so it never
        // steals touch input from the rest of the screen while visible —
        // RN's Android Modal creates a Dialog window without
        // FLAG_NOT_TOUCH_MODAL, which blocked all touches app-wide for the
        // toast's duration regardless of the toast's own drawn bounds.
        // Trade-off accepted: since this View renders in the app's main
        // window rather than its own, a toast can rarely be drawn behind
        // another screen's own native Modal (OfferingSheet, ImageShareModal)
        // if one happens to already be open at the same moment.
        <View style={styles.toastContainer} pointerEvents="box-none">
          <Toast
            key={toastKey}
            visible={visible}
            message={toastConfig.message}
            variant={toastConfig.variant || 'default'}
            duration={toastConfig.duration || 3000}
            position={toastConfig.position || 'top'}
            action={toastConfig.action}
            numberOfLines={toastConfig.numberOfLines}
            onDismiss={() => handleDismiss(toastKey)}
          />
        </View>
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
