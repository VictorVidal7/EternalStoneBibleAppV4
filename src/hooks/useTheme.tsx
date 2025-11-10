import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceVariant: string;

  // Text
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;

  // Accent colors
  accent: string;
  error: string;
  success: string;
  warning: string;

  // Borders and dividers
  border: string;
  divider: string;

  // Special
  highlight: string;
  overlay: string;

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

const lightColors: ThemeColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F8F9FA',

  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  textTertiary: '#95A5A6',

  primary: '#4A90E2',
  primaryLight: '#E8F4FD',
  primaryDark: '#2471C7',

  accent: '#9B59B6',
  error: '#E74C3C',
  success: '#27AE60',
  warning: '#F39C12',

  border: '#ECF0F1',
  divider: '#E0E0E0',

  highlight: '#FFF9C4',
  overlay: 'rgba(0, 0, 0, 0.5)',

  verseCard: '#FFFFFF',
  verseHighlight: '#FFF9E6',
  bookmark: '#F39C12',
};

const darkColors: ThemeColors = {
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2C',

  text: '#E8EAED',
  textSecondary: '#9AA0A6',
  textTertiary: '#6E7681',

  primary: '#5DA3F5',
  primaryLight: '#1A3A52',
  primaryDark: '#7DB8FF',

  accent: '#B380CC',
  error: '#F28B82',
  success: '#81C995',
  warning: '#FDD663',

  border: '#3C3C3C',
  divider: '#2C2C2C',

  highlight: '#3E3A2F',
  overlay: 'rgba(0, 0, 0, 0.7)',

  verseCard: '#1E1E1E',
  verseHighlight: '#2E2A1F',
  bookmark: '#FDD663',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

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
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'auto')) {
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
    <ThemeContext.Provider value={{ mode, colors, isDark, setThemeMode }}>
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
