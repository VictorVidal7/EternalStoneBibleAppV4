/**
 * 🔔 TOAST CONTEXT
 *
 * Proveedor global para mostrar toasts/notificaciones
 * en cualquier parte de la app
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
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
}

interface ToastContextValue {
  show: (options: ToastOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toastConfig, setToastConfig] = useState<ToastOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((options: ToastOptions) => {
    setToastConfig(options);
    setVisible(true);
  }, []);

  const success = useCallback((message: string, duration = 3000) => {
    show({ message, variant: 'success', duration });
  }, [show]);

  const error = useCallback((message: string, duration = 3000) => {
    show({ message, variant: 'error', duration });
  }, [show]);

  const warning = useCallback((message: string, duration = 3000) => {
    show({ message, variant: 'warning', duration });
  }, [show]);

  const info = useCallback((message: string, duration = 3000) => {
    show({ message, variant: 'info', duration });
  }, [show]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      {toastConfig && (
        <View style={styles.toastContainer}>
          <Toast
            visible={visible}
            message={toastConfig.message}
            variant={toastConfig.variant || 'default'}
            duration={toastConfig.duration || 3000}
            position={toastConfig.position || 'top'}
            action={toastConfig.action}
            onDismiss={handleDismiss}
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
