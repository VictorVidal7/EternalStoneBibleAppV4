import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
  FC,
  Dispatch,
  SetStateAction,
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
 * Default color themes configuration
 */
export const COLOR_THEMES: ColorThemes = {
  default: {
    light: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#FFFFFF',
      text: '#000000',
      card: '#F2F2F7',
      border: '#C7C7CC',
      highlight: '#FFFF00',
    },
    dark: {
      primary: '#0A84FF',
      secondary: '#5E5CE6',
      background: '#000000',
      text: '#FFFFFF',
      card: '#1C1C1E',
      border: '#38383A',
      highlight: '#FFFF00',
    },
  },
  sepia: {
    light: {
      primary: '#8B4513',
      secondary: '#D2691E',
      background: '#FFF8DC',
      text: '#5D4037',
      card: '#FAEBD7',
      border: '#DEB887',
      highlight: '#FFD700',
    },
    dark: {
      primary: '#D2691E',
      secondary: '#8B4513',
      background: '#5D4037',
      text: '#FFF8DC',
      card: '#3E2723',
      border: '#8B4513',
      highlight: '#FFD700',
    },
  },
  green: {
    light: {
      primary: '#4CAF50',
      secondary: '#81C784',
      background: '#E8F5E9',
      text: '#1B5E20',
      card: '#C8E6C9',
      border: '#A5D6A7',
      highlight: '#FFEB3B',
    },
    dark: {
      primary: '#81C784',
      secondary: '#4CAF50',
      background: '#1B5E20',
      text: '#E8F5E9',
      card: '#2E7D32',
      border: '#4CAF50',
      highlight: '#FFEB3B',
    },
  },
  purple: {
    light: {
      primary: '#9C27B0',
      secondary: '#BA68C8',
      background: '#F3E5F5',
      text: '#4A148C',
      card: '#E1BEE7',
      border: '#CE93D8',
      highlight: '#FFC107',
    },
    dark: {
      primary: '#BA68C8',
      secondary: '#9C27B0',
      background: '#4A148C',
      text: '#F3E5F5',
      card: '#6A1B9A',
      border: '#9C27B0',
      highlight: '#FFC107',
    },
  },
  ocean: {
    light: {
      primary: '#0277BD',
      secondary: '#4DD0E1',
      background: '#E0F7FA',
      text: '#01579B',
      card: '#B2EBF2',
      border: '#80DEEA',
      highlight: '#FFEB3B',
    },
    dark: {
      primary: '#4DD0E1',
      secondary: '#0277BD',
      background: '#01579B',
      text: '#E0F7FA',
      card: '#0288D1',
      border: '#0277BD',
      highlight: '#FFEB3B',
    },
  },
  sunset: {
    light: {
      primary: '#FF5722',
      secondary: '#FF9800',
      background: '#FFF3E0',
      text: '#BF360C',
      card: '#FFE0B2',
      border: '#FFCC80',
      highlight: '#FFC107',
    },
    dark: {
      primary: '#FF9800',
      secondary: '#FF5722',
      background: '#BF360C',
      text: '#FFF3E0',
      card: '#E64A19',
      border: '#FF5722',
      highlight: '#FFC107',
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
