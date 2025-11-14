/**
 * Contexto Global de Tema
 * Proporciona acceso a la configuración de tema (modo oscuro/claro y colores)
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import {useColorScheme} from 'react-native';
import {useUserPreferences} from './UserPreferencesContext';
import {logger} from '../lib/utils/logger';

/**
 * Interfaz para los colores del tema
 */
interface Colors {
  primary?: string;
  secondary?: string;
  background?: string;
  surface?: string;
  text?: string;
  textSecondary?: string;
  border?: string;
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  [key: string]: string | undefined;
}

/**
 * Interfaz para la configuración de tema
 */
interface Theme {
  isDarkMode: boolean;
  colors: Colors;
  roundness: number;
}

/**
 * Interfaz para el contexto de tema
 */
interface ThemeContextType extends Theme {
  toggleDarkMode?: () => void;
}

// Crear contexto con valor por defecto
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook para utilizar el contexto de tema
 * @throws Error si se usa fuera del ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    logger.error(
      'useTheme must be used within a ThemeProvider',
      new Error('Missing ThemeProvider'),
      {
        component: 'ThemeContext',
        action: 'useTheme',
      },
    );
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Props para el ThemeProvider
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Componente Provider de Tema
 * Proporciona la configuración de tema a toda la aplicación
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const deviceTheme = useColorScheme();
  const {nightMode, colorTheme, COLOR_THEMES} = useUserPreferences();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(deviceTheme === 'dark');

  // Sincronizar cambios de nightMode desde preferencias
  useEffect(() => {
    logger.debug('Theme mode changed', {
      component: 'ThemeProvider',
      previousMode: isDarkMode,
      newMode: nightMode,
      source: 'UserPreferences',
    });
    setIsDarkMode(nightMode);
  }, [nightMode]);

  // Memoizar la configuración del tema para evitar renders innecesarios
  const theme = useMemo<ThemeContextType>(() => {
    try {
      const baseTheme = COLOR_THEMES[colorTheme];

      if (!baseTheme) {
        logger.warn('Color theme not found', {
          component: 'ThemeProvider',
          colorTheme,
          availableThemes: Object.keys(COLOR_THEMES),
        });
      }

      const colors: Colors = isDarkMode
        ? baseTheme?.dark || {}
        : baseTheme?.light || {};

      const themeConfig: ThemeContextType = {
        isDarkMode,
        colors,
        roundness: 8,
      };

      logger.debug('Theme updated', {
        component: 'ThemeProvider',
        isDarkMode,
        colorTheme,
      });

      return themeConfig;
    } catch (error) {
      logger.error('Error creating theme configuration', error as Error, {
        component: 'ThemeProvider',
        colorTheme,
        isDarkMode,
      });

      // Retornar tema por defecto en caso de error
      const defaultColors: Colors = {};
      return {
        isDarkMode,
        colors: defaultColors,
        roundness: 8,
      };
    }
  }, [isDarkMode, colorTheme, COLOR_THEMES]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

// Exportar tipos para uso en otros componentes
export type {Theme, Colors, ThemeContextType};
