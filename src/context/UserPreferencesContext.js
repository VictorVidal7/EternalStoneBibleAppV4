import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserPreferencesContext = createContext();

export const COLOR_THEMES = {
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
  // Nuevo tema: Ocean
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
  // Nuevo tema: Sunset
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

export const UserPreferencesProvider = ({ children }) => {
  const [nightMode, setNightMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('default');
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [textZoom, setTextZoom] = useState(100);
  const [colorTheme, setColorTheme] = useState('default');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await AsyncStorage.getItem('userPreferences');
      if (savedPreferences !== null) {
        const prefs = JSON.parse(savedPreferences);
        setNightMode(prefs.nightMode);
        setFontSize(Number(prefs.fontSize) || 16);
        setFontFamily(prefs.fontFamily);
        setLineSpacing(Number(prefs.lineSpacing) || 1.5);
        setTextZoom(prefs.textZoom);
        setColorTheme(prefs.colorTheme || 'default');
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (preferences) => {
    try {
      await AsyncStorage.setItem('userPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const toggleNightMode = useCallback(() => {
    setNightMode(prev => {
      const newValue = !prev;
      savePreferences({ ...getCurrentPreferences(), nightMode: newValue });
      return newValue;
    });
  }, []);

  const changeFontSize = useCallback((size) => {
    const newSize = Number(size);
    if (!isNaN(newSize)) {
      setFontSize(newSize);
      savePreferences({ ...getCurrentPreferences(), fontSize: newSize });
    } else {
      console.error('Invalid font size:', size);
    }
  }, []);

  const changeFontFamily = useCallback((family) => {
    setFontFamily(family);
    savePreferences({ ...getCurrentPreferences(), fontFamily: family });
  }, []);

  const changeLineSpacing = useCallback((spacing) => {
    const newSpacing = Number(spacing);
    if (!isNaN(newSpacing)) {
      setLineSpacing(newSpacing);
      savePreferences({ ...getCurrentPreferences(), lineSpacing: newSpacing });
    } else {
      console.error('Invalid line spacing:', spacing);
    }
  }, []);

  const changeTextZoom = useCallback((zoom) => {
    setTextZoom(zoom);
    savePreferences({ ...getCurrentPreferences(), textZoom: zoom });
  }, []);

  const changeColorTheme = useCallback((theme) => {
    setColorTheme(theme);
    savePreferences({ ...getCurrentPreferences(), colorTheme: theme });
  }, []);

  const getCurrentPreferences = () => ({
    nightMode,
    fontSize,
    fontFamily,
    lineSpacing,
    textZoom,
    colorTheme,
  });

  return (
    <UserPreferencesContext.Provider
      value={{
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
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
};