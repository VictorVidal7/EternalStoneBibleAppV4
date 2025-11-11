import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook personalizado para detectar si el lector de pantalla está habilitado
 * @returns {boolean} screenReaderEnabled - Estado del lector de pantalla
 */
export const useScreenReaderListener = () => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    // Verificar estado inicial
    AccessibilityInfo.isScreenReaderEnabled().then(
      enabled => {
        setScreenReaderEnabled(enabled);
      }
    );

    // Agregar listener para cambios
    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      enabled => {
        setScreenReaderEnabled(enabled);
      }
    );

    // Cleanup
    return () => {
      listener.remove();
    };
  }, []);

  return screenReaderEnabled;
};
