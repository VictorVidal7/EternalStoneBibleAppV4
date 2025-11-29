/**
 * 🌙 NIGHT READING MODE HOOK
 *
 * Hook para gestionar el modo de lectura nocturna
 * Auto-activa entre 21:00 y 06:00 para reducir fatiga visual
 * Para la gloria de Dios y del Rey Jesús
 */

import {useState, useEffect, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';

const NIGHT_MODE_STORAGE_KEY = '@eternal_bible_night_reading_mode';
const AUTO_NIGHT_MODE_KEY = '@eternal_bible_auto_night_mode';

// Horario nocturno: 21:00 - 06:00
const NIGHT_START_HOUR = 21; // 9 PM
const NIGHT_END_HOUR = 6; // 6 AM

export interface NightReadingTheme {
  background: string;
  text: string;
  textSecondary: string;
  accent: string;
  card: string;
  border: string;
  sepiaStrength: number;
  fontSizeMultiplier: number;
}

export const nightReadingTheme: NightReadingTheme = {
  background: '#000000', // Negro puro para máximo contraste
  text: '#D4AF37', // Dorado suave - reduce luz azul
  textSecondary: '#B8860B', // Dorado oscuro para texto secundario
  accent: '#FF6B35', // Naranja cálido para acentos
  card: '#0a0a0a', // Negro ligeramente más claro para cards
  border: 'rgba(212, 175, 55, 0.15)', // Borde dorado sutil
  sepiaStrength: 0.3, // Filtro sepia para reducir luz azul
  fontSizeMultiplier: 1.15, // Texto 15% más grande
};

export function useNightReading() {
  const [isNightMode, setIsNightMode] = useState(false);
  const [autoNightMode, setAutoNightMode] = useState(true);
  const [loading, setLoading] = useState(true);

  /**
   * Verificar si es horario nocturno
   */
  const isNightTime = useCallback((): boolean => {
    const currentHour = new Date().getHours();
    return currentHour >= NIGHT_START_HOUR || currentHour < NIGHT_END_HOUR;
  }, []);

  /**
   * Cargar preferencias al iniciar
   */
  useEffect(() => {
    loadPreferences();
  }, []);

  /**
   * Auto-activar modo nocturno basado en la hora
   */
  useEffect(() => {
    if (!autoNightMode) {
      return;
    }

    // Verificar inmediatamente
    const shouldActivate = isNightTime();
    if (shouldActivate !== isNightMode) {
      setIsNightMode(shouldActivate);
      logger.info('Night reading mode auto-activated', {
        component: 'useNightReading',
        isNightTime: shouldActivate,
        currentHour: new Date().getHours(),
      });
    }

    // Verificar cada minuto
    const interval = setInterval(() => {
      const shouldActivate = isNightTime();
      if (shouldActivate !== isNightMode) {
        setIsNightMode(shouldActivate);
        logger.info('Night reading mode auto-toggled', {
          component: 'useNightReading',
          isNightTime: shouldActivate,
          currentHour: new Date().getHours(),
        });
      }
    }, 60000); // Revisar cada minuto

    return () => clearInterval(interval);
  }, [autoNightMode, isNightMode, isNightTime]);

  /**
   * Cargar preferencias desde AsyncStorage
   */
  const loadPreferences = async () => {
    try {
      const [savedNightMode, savedAutoMode] = await Promise.all([
        AsyncStorage.getItem(NIGHT_MODE_STORAGE_KEY),
        AsyncStorage.getItem(AUTO_NIGHT_MODE_KEY),
      ]);

      const autoMode =
        savedAutoMode !== null ? JSON.parse(savedAutoMode) : true;
      setAutoNightMode(autoMode);

      // Si auto mode está activado, usar la hora actual
      if (autoMode) {
        setIsNightMode(isNightTime());
      } else if (savedNightMode !== null) {
        // Sino, usar la preferencia guardada
        setIsNightMode(JSON.parse(savedNightMode));
      }

      logger.info('Night reading preferences loaded', {
        component: 'useNightReading',
        autoMode,
        isNightMode:
          savedNightMode !== null ? JSON.parse(savedNightMode) : false,
      });
    } catch (error) {
      logger.error('Failed to load night reading preferences', {
        component: 'useNightReading',
        error,
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle manual de modo nocturno
   */
  const toggleNightMode = useCallback(async () => {
    const newValue = !isNightMode;
    setIsNightMode(newValue);

    try {
      await AsyncStorage.setItem(
        NIGHT_MODE_STORAGE_KEY,
        JSON.stringify(newValue),
      );

      logger.info('Night reading mode toggled', {
        component: 'useNightReading',
        isNightMode: newValue,
      });
    } catch (error) {
      logger.error('Failed to save night reading mode', {
        component: 'useNightReading',
        error,
      });
    }
  }, [isNightMode]);

  /**
   * Toggle auto-activación
   */
  const toggleAutoNightMode = useCallback(async () => {
    const newValue = !autoNightMode;
    setAutoNightMode(newValue);

    try {
      await AsyncStorage.setItem(AUTO_NIGHT_MODE_KEY, JSON.stringify(newValue));

      // Si se activa auto mode, aplicar basado en hora actual
      if (newValue) {
        const shouldActivate = isNightTime();
        setIsNightMode(shouldActivate);
      }

      logger.info('Auto night reading mode toggled', {
        component: 'useNightReading',
        autoNightMode: newValue,
      });
    } catch (error) {
      logger.error('Failed to save auto night reading mode', {
        component: 'useNightReading',
        error,
      });
    }
  }, [autoNightMode, isNightTime]);

  /**
   * Obtener colores del tema nocturno
   */
  const getTheme = useCallback((): NightReadingTheme => {
    return nightReadingTheme;
  }, []);

  return {
    isNightMode,
    autoNightMode,
    loading,
    isNightTime: isNightTime(),
    theme: nightReadingTheme,
    toggleNightMode,
    toggleAutoNightMode,
    getTheme,
  };
}
