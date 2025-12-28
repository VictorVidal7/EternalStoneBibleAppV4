import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useColorScheme} from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;
  card: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Secondary colors
  secondary: string;

  // Accent colors
  accent: string;
  error: string;
  success: string;
  warning: string;
  info: string;

  // Borders and dividers
  border: string;
  divider: string;
  glassBorder: string;

  // Special
  highlight: string;
  overlay: string;
  disabled: string;
  glass: string;

  // Specific to Bible app
  verseCard: string;
  verseHighlight: string;
  bookmark: string;
}

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

// Colores Celestial Sereno Light - Paleta Indigo/Purple profesional
const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: 'rgba(255, 255, 255, 0.95)',
  surfaceVariant: '#f8f9fc',
  card: 'rgba(255, 255, 255, 0.95)',

  text: '#0f172a', // slate-900
  textSecondary: '#475569', // slate-600
  textTertiary: '#64748b', // slate-500

  primary: '#4f46e5', // indigo-600 - Color principal celestial
  primaryLight: '#e0e7ff', // indigo-100
  primaryDark: '#4338ca', // indigo-700

  secondary: '#059669', // emerald-600

  accent: '#9333ea', // purple-600
  error: '#dc2626', // red-600
  success: '#059669', // emerald-600
  warning: '#ea580c', // orange-600
  info: '#4f46e5', // indigo-600

  border: 'rgba(226, 232, 240, 0.60)',
  divider: 'rgba(226, 232, 240, 0.50)',
  glassBorder: 'rgba(226, 232, 240, 0.50)',

  highlight: '#fef08a',
  overlay: 'rgba(15, 23, 42, 0.40)',
  disabled: '#e2e8f0',
  glass: 'rgba(255, 255, 255, 0.85)',

  verseCard: '#FFFFFF',
  verseHighlight: '#fef9c3',
  bookmark: '#f59e0b',
};

// Colores Celestial Sereno Dark - Paleta Indigo/Purple vibrante
const darkColors: ThemeColors = {
  background: '#0a0d1a', // Casi negro con tinte azul
  surface: 'rgba(26, 29, 46, 0.70)',
  surfaceVariant: '#1a1d2e',
  card: 'rgba(26, 29, 46, 0.70)',

  text: '#f8f9fc', // Casi blanco
  textSecondary: '#cbd5e1', // slate-300
  textTertiary: '#94a3b8', // slate-400

  primary: '#6366f1', // indigo-500 - Mas brillante en dark
  primaryLight: '#818cf8', // indigo-400
  primaryDark: '#4f46e5', // indigo-600

  secondary: '#10b981', // emerald-500

  accent: '#a855f7', // purple-500
  error: '#f87171', // red-400
  success: '#10b981', // emerald-500
  warning: '#fbbf24', // yellow-400
  info: '#6366f1', // indigo-500

  border: 'rgba(71, 85, 105, 0.30)',
  divider: 'rgba(71, 85, 105, 0.25)',
  glassBorder: 'rgba(71, 85, 105, 0.30)',

  highlight: '#fbbf24',
  overlay: 'rgba(0, 0, 0, 0.60)',
  disabled: 'rgba(26, 29, 46, 0.50)',
  glass: 'rgba(26, 29, 46, 0.60)',

  verseCard: '#1a1d2e',
  verseHighlight: '#2e2a1f',
  bookmark: '#fbbf24',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export function ThemeProvider({children}: {children: ReactNode}) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    'light',
  );

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update effective theme when mode or system preference changes
  useEffect(() => {
    if (mode === 'auto') {
      setEffectiveTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
    } else {
      setEffectiveTheme(mode);
    }
  }, [mode, systemColorScheme]);

  async function loadThemePreference() {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (
        savedMode &&
        (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')
      ) {
        setMode(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  }

  async function setThemeMode(newMode: ThemeMode) {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      setMode(newMode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }

  const colors = effectiveTheme === 'dark' ? darkColors : lightColors;
  const isDark = effectiveTheme === 'dark';

  return (
    <ThemeContext.Provider value={{mode, colors, isDark, setThemeMode}}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
