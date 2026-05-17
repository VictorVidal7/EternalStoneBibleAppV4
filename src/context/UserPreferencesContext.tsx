import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
  FC,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {logger} from '../lib/utils/logger';

/**
 * Type definitions for User Preferences and Related Constants
 */

export enum FontSizeEnum {
  SMALL = 12,
  MEDIUM = 16,
  LARGE = 20,
  EXTRA_LARGE = 24,
}

export type FontSize = 12 | 16 | 20 | 24 | number;

export enum FontFamilyEnum {
  DEFAULT = 'default',
  SERIF = 'serif',
  MONOSPACE = 'monospace',
  SANS_SERIF = 'sans-serif',
}

export type FontFamily =
  | 'default'
  | 'serif'
  | 'monospace'
  | 'sans-serif'
  | string;

export type ColorThemeName =
  | 'default'
  | 'sepia'
  | 'green'
  | 'purple'
  | 'ocean'
  | 'sunset';

export type ThemeMode = 'light' | 'dark';

/**
 * Color set interface for theme colors
 */
export interface ColorSet {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  card: string;
  border: string;
  highlight: string;
}

/**
 * Complete theme interface
 */
export interface ThemeDefinition {
  light: ColorSet;
  dark: ColorSet;
}

/**
 * Color themes collection
 */
export interface ColorThemes {
  [key: string]: ThemeDefinition;
  default: ThemeDefinition;
  sepia: ThemeDefinition;
  green: ThemeDefinition;
  purple: ThemeDefinition;
  ocean: ThemeDefinition;
  sunset: ThemeDefinition;
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  nightMode: boolean;
  fontSize: FontSize;
  fontFamily: FontFamily;
  lineSpacing: number;
  textZoom: number;
  colorTheme: ColorThemeName;
}

/**
 * Context value interface
 */
export interface UserPreferencesContextType extends UserPreferences {
  toggleNightMode: () => void;
  changeFontSize: (size: FontSize) => void;
  changeFontFamily: (family: FontFamily) => void;
  changeLineSpacing: (spacing: number) => void;
  changeTextZoom: (zoom: number) => void;
  changeColorTheme: (theme: ColorThemeName) => void;
  COLOR_THEMES: ColorThemes;
}

/**
 * Provider props interface
 */
export interface UserPreferencesProviderProps {
  children: ReactNode;
}

/**
 * 🎨 PREMIUM COLOR THEMES
 * Paletas de colores profesionales y modernas optimizadas para legibilidad
 * y experiencia visual impresionante
 */
export const COLOR_THEMES: ColorThemes = {
  default: {
    light: {
      primary: '#667eea', // Azul vibrante premium
      secondary: '#764ba2', // Púrpura elegante
      background: '#ffffff', // Blanco puro
      text: '#1a202c', // Gris carbón profundo
      card: '#f7fafc', // Gris muy claro
      border: '#e2e8f0', // Borde suave
      highlight: '#fef08a', // Amarillo brillante
    },
    dark: {
      primary: '#8098fc', // Azul luminoso
      secondary: '#9b6dd6', // Púrpura brillante
      background: '#000000', // Negro puro OLED
      text: '#f7fafc', // Blanco casi puro
      card: '#1a1a1a', // Gris oscuro
      border: '#2d3748', // Borde oscuro
      highlight: '#fbbf24', // Amarillo dorado
    },
  },
  sepia: {
    light: {
      primary: '#92400e', // Marrón cálido
      secondary: '#b45309', // Ámbar oscuro
      background: '#fefce8', // Crema suave
      text: '#451a03', // Marrón oscuro
      card: '#fef3c7', // Crema dorado
      border: '#fde68a', // Borde dorado
      highlight: '#fbbf24', // Dorado brillante
    },
    dark: {
      primary: '#f59e0b', // Ámbar brillante
      secondary: '#d97706', // Ámbar oscuro
      background: '#1c1917', // Marrón muy oscuro
      text: '#fef3c7', // Crema claro
      card: '#292524', // Gris marrón
      border: '#44403c', // Borde marrón
      highlight: '#fbbf24', // Dorado
    },
  },
  green: {
    light: {
      primary: '#059669', // Verde esmeralda
      secondary: '#10b981', // Verde vibrante
      background: '#f0fdf4', // Verde muy claro
      text: '#064e3b', // Verde oscuro
      card: '#d1fae5', // Verde pastel
      border: '#a7f3d0', // Verde menta
      highlight: '#fef08a', // Amarillo
    },
    dark: {
      primary: '#34d399', // Verde luminoso
      secondary: '#6ee7b7', // Verde brillante
      background: '#000000', // Negro puro
      text: '#ecfdf5', // Verde muy claro
      card: '#064e3b', // Verde oscuro profundo
      border: '#047857', // Verde bosque
      highlight: '#fbbf24', // Dorado
    },
  },
  purple: {
    light: {
      primary: '#7c3aed', // Púrpura real
      secondary: '#a78bfa', // Lavanda
      background: '#faf5ff', // Lavanda muy claro
      text: '#3b0764', // Púrpura oscuro
      card: '#ede9fe', // Lavanda claro
      border: '#c4b5fd', // Lavanda medio
      highlight: '#fef08a', // Amarillo
    },
    dark: {
      primary: '#a78bfa', // Lavanda brillante
      secondary: '#c4b5fd', // Lavanda claro
      background: '#000000', // Negro puro
      text: '#f5f3ff', // Lavanda muy claro
      card: '#2e1065', // Púrpura oscuro
      border: '#5b21b6', // Púrpura profundo
      highlight: '#fbbf24', // Dorado
    },
  },
  ocean: {
    light: {
      primary: '#0891b2', // Cian oceánico
      secondary: '#06b6d4', // Cian brillante
      background: '#ecfeff', // Cian muy claro
      text: '#164e63', // Cian oscuro
      card: '#cffafe', // Cian pastel
      border: '#a5f3fc', // Cian claro
      highlight: '#fef08a', // Amarillo
    },
    dark: {
      primary: '#22d3ee', // Cian luminoso
      secondary: '#67e8f9', // Cian brillante
      background: '#000000', // Negro puro
      text: '#ecfeff', // Cian muy claro
      card: '#083344', // Cian oscuro profundo
      border: '#155e75', // Cian profundo
      highlight: '#fbbf24', // Dorado
    },
  },
  sunset: {
    light: {
      primary: '#dc2626', // Rojo vibrante
      secondary: '#f97316', // Naranja brillante
      background: '#fff7ed', // Naranja muy claro
      text: '#7c2d12', // Naranja oscuro
      card: '#fed7aa', // Naranja pastel
      border: '#fdba74', // Naranja claro
      highlight: '#fef08a', // Amarillo
    },
    dark: {
      primary: '#f87171', // Rojo luminoso
      secondary: '#fb923c', // Naranja brillante
      background: '#000000', // Negro puro
      text: '#fff7ed', // Naranja muy claro
      card: '#7c2d12', // Naranja oscuro profundo
      border: '#9a3412', // Naranja profundo
      highlight: '#fbbf24', // Dorado
    },
  },
};

// Create context with undefined initial value
const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined);

/**
 * UserPreferencesProvider component
 * Provides user preferences state and methods to all consuming components
 */
export const UserPreferencesProvider: FC<UserPreferencesProviderProps> = ({
  children,
}) => {
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<FontSize>(16);
  const [fontFamily, setFontFamily] = useState<FontFamily>('default');
  const [lineSpacing, setLineSpacing] = useState<number>(1.5);
  const [textZoom, setTextZoom] = useState<number>(100);
  const [colorTheme, setColorTheme] = useState<ColorThemeName>('default');

  /**
   * Load user preferences from AsyncStorage
   */
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async (): Promise<void> => {
    try {
      const savedPreferences = await AsyncStorage.getItem('userPreferences');
      if (savedPreferences !== null) {
        const prefs = JSON.parse(savedPreferences) as Partial<UserPreferences>;

        setNightMode(prefs.nightMode ?? false);
        setFontSize(Number(prefs.fontSize) || 16);
        setFontFamily(prefs.fontFamily || 'default');
        setLineSpacing(Number(prefs.lineSpacing) || 1.5);
        setTextZoom(prefs.textZoom ?? 100);
        setColorTheme((prefs.colorTheme || 'default') as ColorThemeName);

        logger.info('User preferences loaded successfully', {
          component: 'UserPreferencesContext',
          action: 'loadPreferences',
        });
      }
    } catch (error) {
      logger.error('Error loading user preferences', error as Error, {
        component: 'UserPreferencesContext',
        action: 'loadPreferences',
      });
    }
  };

  /**
   * Save preferences to AsyncStorage
   */
  const savePreferences = async (
    preferences: UserPreferences,
  ): Promise<void> => {
    try {
      await AsyncStorage.setItem(
        'userPreferences',
        JSON.stringify(preferences),
      );
      logger.info('User preferences saved successfully', {
        component: 'UserPreferencesContext',
        action: 'savePreferences',
      });
    } catch (error) {
      logger.error('Error saving user preferences', error as Error, {
        component: 'UserPreferencesContext',
        action: 'savePreferences',
      });
    }
  };

  /**
   * Get current preferences object
   */
  const getCurrentPreferences = (): UserPreferences => ({
    nightMode,
    fontSize,
    fontFamily,
    lineSpacing,
    textZoom,
    colorTheme,
  });

  /**
   * Toggle night mode on/off
   */
  const toggleNightMode = useCallback((): void => {
    setNightMode(prev => {
      const newValue = !prev;
      savePreferences({...getCurrentPreferences(), nightMode: newValue});
      logger.breadcrumb(
        `Night mode toggled to ${newValue}`,
        'user-preference',
        {nightMode: newValue},
      );
      return newValue;
    });
  }, []);

  /**
   * Change font size
   */
  const changeFontSize = useCallback((size: FontSize): void => {
    const newSize = Number(size);
    if (!isNaN(newSize)) {
      setFontSize(newSize);
      savePreferences({...getCurrentPreferences(), fontSize: newSize});
      logger.breadcrumb(`Font size changed to ${newSize}`, 'user-preference', {
        fontSize: newSize,
      });
    } else {
      logger.warn('Invalid font size provided', {
        component: 'UserPreferencesContext',
        action: 'changeFontSize',
        providedSize: size,
      });
    }
  }, []);

  /**
   * Change font family
   */
  const changeFontFamily = useCallback((family: FontFamily): void => {
    setFontFamily(family);
    savePreferences({...getCurrentPreferences(), fontFamily: family});
    logger.breadcrumb(`Font family changed to ${family}`, 'user-preference', {
      fontFamily: family,
    });
  }, []);

  /**
   * Change line spacing
   */
  const changeLineSpacing = useCallback((spacing: number): void => {
    const newSpacing = Number(spacing);
    if (!isNaN(newSpacing)) {
      setLineSpacing(newSpacing);
      savePreferences({...getCurrentPreferences(), lineSpacing: newSpacing});
      logger.breadcrumb(
        `Line spacing changed to ${newSpacing}`,
        'user-preference',
        {lineSpacing: newSpacing},
      );
    } else {
      logger.warn('Invalid line spacing provided', {
        component: 'UserPreferencesContext',
        action: 'changeLineSpacing',
        providedSpacing: spacing,
      });
    }
  }, []);

  /**
   * Change text zoom level
   */
  const changeTextZoom = useCallback((zoom: number): void => {
    setTextZoom(zoom);
    savePreferences({...getCurrentPreferences(), textZoom: zoom});
    logger.breadcrumb(`Text zoom changed to ${zoom}%`, 'user-preference', {
      textZoom: zoom,
    });
  }, []);

  /**
   * Change color theme
   */
  const changeColorTheme = useCallback((theme: ColorThemeName): void => {
    setColorTheme(theme);
    savePreferences({...getCurrentPreferences(), colorTheme: theme});
    logger.breadcrumb(`Color theme changed to ${theme}`, 'user-preference', {
      colorTheme: theme,
    });
  }, []);

  const value: UserPreferencesContextType = {
    nightMode,
    fontSize,
    fontFamily,
    lineSpacing,
    textZoom,
    colorTheme,
    toggleNightMode,
    changeFontSize,
    changeFontFamily,
    changeLineSpacing,
    changeTextZoom,
    changeColorTheme,
    COLOR_THEMES,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};

/**
 * Hook to use UserPreferencesContext
 * Must be used within UserPreferencesProvider
 */
export const useUserPreferences = (): UserPreferencesContextType => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      'useUserPreferences must be used within a UserPreferencesProvider',
    );
  }
  return context;
};

export default UserPreferencesContext;
