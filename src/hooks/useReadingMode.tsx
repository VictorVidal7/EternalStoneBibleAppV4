/**
 * 📖 READING MODE HOOK
 *
 * Hook personalizado para manejar modos de lectura:
 * - Modo nocturno con temperatura de color
 * - Ajustes de brillo
 * - Filtros de color (sepia, blanco y negro)
 * - Persistencia de preferencias
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Brightness from 'expo-brightness';

export type ReadingSize = 'compact' | 'normal' | 'comfortable' | 'large' | 'extraLarge';
export type ColorTemperature = 'cool' | 'normal' | 'warm' | 'sepia' | 'grayscale';
export type NightMode = 'off' | 'auto' | 'always';

interface ReadingModeSettings {
  size: ReadingSize;
  colorTemperature: ColorTemperature;
  nightMode: NightMode;
  brightness: number; // 0-1
  lineSpacing: number; // multiplier
  fontFamily: 'system' | 'serif' | 'sans-serif';
}

const DEFAULT_SETTINGS: ReadingModeSettings = {
  size: 'comfortable',
  colorTemperature: 'normal',
  nightMode: 'off',
  brightness: 0.8,
  lineSpacing: 1.6,
  fontFamily: 'serif',
};

const STORAGE_KEY = '@reading_mode_settings';

export const useReadingMode = () => {
  const [settings, setSettings] = useState<ReadingModeSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar preferencias al iniciar
  useEffect(() => {
    loadSettings();
  }, []);

  // Guardar preferencias cuando cambien
  useEffect(() => {
    if (!isLoading) {
      saveSettings();
    }
  }, [settings, isLoading]);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Error loading reading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving reading settings:', error);
    }
  };

  // ==================== SETTERS ====================

  const setSize = useCallback((size: ReadingSize) => {
    setSettings((prev) => ({ ...prev, size }));
  }, []);

  const setColorTemperature = useCallback((colorTemperature: ColorTemperature) => {
    setSettings((prev) => ({ ...prev, colorTemperature }));
  }, []);

  const setNightMode = useCallback((nightMode: NightMode) => {
    setSettings((prev) => ({ ...prev, nightMode }));
  }, []);

  const setBrightness = useCallback(async (brightness: number) => {
    setSettings((prev) => ({ ...prev, brightness }));
    try {
      await Brightness.setBrightnessAsync(brightness);
    } catch (error) {
      console.error('Error setting brightness:', error);
    }
  }, []);

  const setLineSpacing = useCallback((lineSpacing: number) => {
    setSettings((prev) => ({ ...prev, lineSpacing }));
  }, []);

  const setFontFamily = useCallback((fontFamily: ReadingModeSettings['fontFamily']) => {
    setSettings((prev) => ({ ...prev, fontFamily }));
  }, []);

  // ==================== COMPUTED VALUES ====================

  /**
   * Obtiene el tamaño de fuente base según el modo de lectura
   */
  const getFontSize = useCallback((): number => {
    const sizes = {
      compact: 14,
      normal: 16,
      comfortable: 18,
      large: 20,
      extraLarge: 24,
    };
    return sizes[settings.size];
  }, [settings.size]);

  /**
   * Obtiene el color de overlay para la temperatura
   */
  const getTemperatureOverlay = useCallback((): string => {
    const overlays = {
      cool: 'rgba(200, 220, 255, 0.05)',
      normal: 'transparent',
      warm: 'rgba(255, 220, 180, 0.08)',
      sepia: 'rgba(255, 240, 200, 0.15)',
      grayscale: 'rgba(128, 128, 128, 0.1)',
    };
    return overlays[settings.colorTemperature];
  }, [settings.colorTemperature]);

  /**
   * Obtiene los colores ajustados para el modo actual
   */
  const getAdjustedColors = useCallback(
    (baseColors: any) => {
      if (settings.colorTemperature === 'grayscale') {
        // Convertir a escala de grises
        return {
          ...baseColors,
          primary: '#666666',
          secondary: '#888888',
          text: baseColors.isDark ? '#e0e0e0' : '#333333',
        };
      }

      if (settings.colorTemperature === 'sepia') {
        return {
          ...baseColors,
          background: baseColors.isDark ? '#1a1510' : '#f4ecd8',
          card: baseColors.isDark ? '#2a2420' : '#f9f5e8',
          text: baseColors.isDark ? '#d4c5a9' : '#5c4d37',
        };
      }

      return baseColors;
    },
    [settings.colorTemperature]
  );

  /**
   * Obtiene estilos de texto para el modo actual
   */
  const getTextStyles = useCallback(() => {
    const baseFontSize = getFontSize();

    return {
      fontSize: baseFontSize,
      lineHeight: baseFontSize * settings.lineSpacing,
      fontFamily: settings.fontFamily === 'serif' ? 'Georgia' : undefined,
    };
  }, [settings, getFontSize]);

  /**
   * Verifica si debe estar en modo nocturno
   */
  const isNightModeActive = useCallback((): boolean => {
    if (settings.nightMode === 'always') return true;
    if (settings.nightMode === 'off') return false;

    // Auto: basado en la hora del día
    const hour = new Date().getHours();
    return hour >= 20 || hour < 7; // 8pm - 7am
  }, [settings.nightMode]);

  // ==================== PRESETS ====================

  const applyPreset = useCallback((preset: 'day' | 'night' | 'reading' | 'focus') => {
    const presets: Record<string, Partial<ReadingModeSettings>> = {
      day: {
        colorTemperature: 'normal',
        brightness: 0.8,
        size: 'normal',
      },
      night: {
        colorTemperature: 'warm',
        brightness: 0.4,
        size: 'comfortable',
      },
      reading: {
        colorTemperature: 'sepia',
        size: 'comfortable',
        lineSpacing: 1.8,
        fontFamily: 'serif',
      },
      focus: {
        colorTemperature: 'grayscale',
        size: 'large',
        lineSpacing: 2.0,
      },
    };

    setSettings((prev) => ({ ...prev, ...presets[preset] }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    // State
    settings,
    isLoading,

    // Setters
    setSize,
    setColorTemperature,
    setNightMode,
    setBrightness,
    setLineSpacing,
    setFontFamily,

    // Computed
    getFontSize,
    getTemperatureOverlay,
    getAdjustedColors,
    getTextStyles,
    isNightModeActive,

    // Presets
    applyPreset,
    resetToDefaults,
  };
};
