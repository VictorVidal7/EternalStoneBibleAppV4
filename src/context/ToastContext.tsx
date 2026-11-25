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
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import Toast from '../components/Toast';
import {ToastLayerContext, ToastOverlay, ToastLayerValue} from './ToastLayer';

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

  // R9-560 — the ToastHosts mounted right now, in mount order; the last one
  // draws the toast (see ToastLayer.tsx). Empty: the root draws it.
  const [hostIds, setHostIds] = useState<number[]>([]);
  const registerHost = useCallback((id: number) => {
    setHostIds(ids => [...ids, id]);
    return () => setHostIds(ids => ids.filter(x => x !== id));
  }, []);

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

  // Memoized so the context value keeps its identity across the provider's own
  // re-renders (every show and every dismiss). A fresh object here re-ran every
  // consumer effect with `toast` in its deps — the reader's 5 s reading timer
  // re-armed on each toast and counted the chapter again (R9-465), and since
  // re-reading a plan day completes it, re-ticked a day the user had unticked
  // (R9-623). All five callbacks are stable, so this never changes.
  const value = useMemo<ToastContextValue>(
    () => ({show, success, error, warning, info}),
    [show, success, error, warning, info],
  );

  const toastNode = useMemo(
    () =>
      toastConfig ? (
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
      ) : null,
    [toastConfig, toastKey, visible, handleDismiss],
  );
  const topHostId = hostIds.length > 0 ? hostIds[hostIds.length - 1] : null;
  const layer = useMemo<ToastLayerValue>(
    () => ({topHostId, register: registerHost, node: toastNode}),
    [topHostId, registerHost, toastNode],
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastLayerContext.Provider value={layer}>
        {children}
        {topHostId === null && toastNode && (
          // Rendered as a plain sibling View (no Modal wrapper) so it never
          // steals touch input from the rest of the screen while visible —
          // RN's Android Modal creates a Dialog window without
          // FLAG_NOT_TOUCH_MODAL, which blocked all touches app-wide for the
          // toast's duration regardless of the toast's own drawn bounds.
          // A plain View draws in the window of whoever renders it, so a
          // toast fired while a native Modal is open would sit behind it in
          // the main window (R9-560): a modal that fires toasts mounts a
          // <ToastHost /> in its content, and while one is mounted the
          // toast is drawn there instead of here (ToastLayer.tsx).
          <ToastOverlay>{toastNode}</ToastOverlay>
        )}
      </ToastLayerContext.Provider>
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
