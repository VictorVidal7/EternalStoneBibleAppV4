import {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useColorScheme} from 'react-native';

type ThemeMode = 'light' | 'dark' | 'auto';
type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type ColorTheme =
  | 'ocean'
  | 'celestial'
  | 'forest'
  | 'sunset'
  | 'graphite'
  | 'royal'
  | 'midnight'
  | 'cafe';

// Función para determinar la hora del día
function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// ==================== TEMAS DE COLOR ====================
export const colorThemes = {
  ocean: {
    name: 'Océano',
    icon: 'water',
    preview: ['#0c4a6e', '#0369a1', '#0ea5e9'],
    gradients: {
      morning: {
        colors: ['#0c4a6e', '#0284c7', '#38bdf8'] as const,
        headerColors: ['#0c4a6e', '#0369a1', '#0ea5e9'] as const,
        accentGlow: '#38bdf8',
      },
      afternoon: {
        colors: ['#0c4a6e', '#0369a1', '#0ea5e9'] as const,
        headerColors: ['#082f49', '#0c4a6e', '#0369a1'] as const,
        accentGlow: '#0ea5e9',
      },
      evening: {
        colors: ['#082f49', '#0c4a6e', '#0369a1'] as const,
        headerColors: ['#051c2c', '#082f49', '#0c4a6e'] as const,
        accentGlow: '#38bdf8',
      },
      night: {
        colors: ['#020617', '#051c2c', '#082f49'] as const,
        headerColors: ['#020617', '#051c2c', '#0c4a6e'] as const,
        accentGlow: '#38bdf8',
      },
    },
  },
  celestial: {
    name: 'Celestial',
    icon: 'sparkles',
    preview: ['#4c1d95', '#7c3aed', '#a855f7'],
    gradients: {
      morning: {
        colors: ['#5b21b6', '#7c3aed', '#a78bfa'] as const,
        headerColors: ['#4c1d95', '#6d28d9', '#8b5cf6'] as const,
        accentGlow: '#a78bfa',
      },
      afternoon: {
        colors: ['#4c1d95', '#7c3aed', '#a855f7'] as const,
        headerColors: ['#3b0764', '#4c1d95', '#6d28d9'] as const,
        accentGlow: '#a855f7',
      },
      evening: {
        colors: ['#3b0764', '#4c1d95', '#6d28d9'] as const,
        headerColors: ['#1e1b4b', '#3b0764', '#4c1d95'] as const,
        accentGlow: '#c084fc',
      },
      night: {
        colors: ['#0f0a1e', '#1e1b4b', '#3b0764'] as const,
        headerColors: ['#0f0a1e', '#1e1b4b', '#4c1d95'] as const,
        accentGlow: '#818cf8',
      },
    },
  },
  forest: {
    name: 'Bosque',
    icon: 'leaf',
    preview: ['#14532d', '#166534', '#22c55e'],
    gradients: {
      morning: {
        colors: ['#14532d', '#15803d', '#4ade80'] as const,
        headerColors: ['#14532d', '#166534', '#22c55e'] as const,
        accentGlow: '#4ade80',
      },
      afternoon: {
        colors: ['#14532d', '#166534', '#22c55e'] as const,
        headerColors: ['#052e16', '#14532d', '#166534'] as const,
        accentGlow: '#22c55e',
      },
      evening: {
        colors: ['#052e16', '#14532d', '#166534'] as const,
        headerColors: ['#022c22', '#052e16', '#14532d'] as const,
        accentGlow: '#34d399',
      },
      night: {
        colors: ['#020617', '#022c22', '#052e16'] as const,
        headerColors: ['#020617', '#022c22', '#14532d'] as const,
        accentGlow: '#34d399',
      },
    },
  },
  sunset: {
    name: 'Atardecer',
    icon: 'sunny',
    preview: ['#9a3412', '#ea580c', '#fb923c'],
    gradients: {
      morning: {
        colors: ['#fbbf24', '#f97316', '#ea580c'] as const,
        headerColors: ['#c2410c', '#ea580c', '#f97316'] as const,
        accentGlow: '#fbbf24',
      },
      afternoon: {
        colors: ['#9a3412', '#ea580c', '#fb923c'] as const,
        headerColors: ['#7c2d12', '#9a3412', '#c2410c'] as const,
        accentGlow: '#fb923c',
      },
      evening: {
        colors: ['#7c2d12', '#9a3412', '#c2410c'] as const,
        headerColors: ['#431407', '#7c2d12', '#9a3412'] as const,
        accentGlow: '#f97316',
      },
      night: {
        colors: ['#1c1917', '#431407', '#7c2d12'] as const,
        headerColors: ['#0c0a09', '#1c1917', '#7c2d12'] as const,
        accentGlow: '#fb923c',
      },
    },
  },
  graphite: {
    name: 'Grafito',
    icon: 'moon',
    preview: ['#18181b', '#3f3f46', '#71717a'],
    gradients: {
      morning: {
        colors: ['#27272a', '#3f3f46', '#52525b'] as const,
        headerColors: ['#18181b', '#27272a', '#3f3f46'] as const,
        accentGlow: '#a1a1aa',
      },
      afternoon: {
        colors: ['#18181b', '#27272a', '#3f3f46'] as const,
        headerColors: ['#09090b', '#18181b', '#27272a'] as const,
        accentGlow: '#71717a',
      },
      evening: {
        colors: ['#09090b', '#18181b', '#27272a'] as const,
        headerColors: ['#09090b', '#18181b', '#27272a'] as const,
        accentGlow: '#a1a1aa',
      },
      night: {
        colors: ['#09090b', '#18181b', '#27272a'] as const,
        headerColors: ['#09090b', '#18181b', '#27272a'] as const,
        accentGlow: '#71717a',
      },
    },
  },
  royal: {
    name: 'Royal',
    icon: 'diamond',
    preview: ['#1e3a8a', '#2563eb', '#3b82f6'],
    gradients: {
      morning: {
        colors: ['#1e40af', '#2563eb', '#60a5fa'] as const,
        headerColors: ['#1e3a8a', '#2563eb', '#3b82f6'] as const,
        accentGlow: '#60a5fa',
      },
      afternoon: {
        colors: ['#1e3a8a', '#1d4ed8', '#2563eb'] as const,
        headerColors: ['#172554', '#1e3a8a', '#1d4ed8'] as const,
        accentGlow: '#3b82f6',
      },
      evening: {
        colors: ['#172554', '#1e3a8a', '#1d4ed8'] as const,
        headerColors: ['#0f172a', '#172554', '#1e3a8a'] as const,
        accentGlow: '#60a5fa',
      },
      night: {
        colors: ['#020617', '#0f172a', '#172554'] as const,
        headerColors: ['#020617', '#0f172a', '#1e3a8a'] as const,
        accentGlow: '#3b82f6',
      },
    },
  },
  midnight: {
    name: 'Midnight',
    icon: 'moon-outline',
    preview: ['#020617', '#0f172a', '#1e293b'],
    gradients: {
      morning: {
        colors: ['#0f172a', '#1e293b', '#334155'] as const,
        headerColors: ['#020617', '#0f172a', '#1e293b'] as const,
        accentGlow: '#94a3b8',
      },
      afternoon: {
        colors: ['#020617', '#0f172a', '#1e293b'] as const,
        headerColors: ['#020617', '#0f172a', '#1e293b'] as const,
        accentGlow: '#64748b',
      },
      evening: {
        colors: ['#020617', '#0f172a', '#1e293b'] as const,
        headerColors: ['#020617', '#0f172a', '#1e293b'] as const,
        accentGlow: '#475569',
      },
      night: {
        colors: ['#020617', '#0f172a', '#1e293b'] as const,
        headerColors: ['#020617', '#0f172a', '#1e293b'] as const,
        accentGlow: '#475569',
      },
    },
  },
  cafe: {
    name: 'Café',
    icon: 'cafe',
    preview: ['#78350f', '#92400e', '#b45309'],
    gradients: {
      morning: {
        colors: ['#78350f', '#92400e', '#d97706'] as const,
        headerColors: ['#78350f', '#92400e', '#b45309'] as const,
        accentGlow: '#fbbf24',
      },
      afternoon: {
        colors: ['#78350f', '#92400e', '#b45309'] as const,
        headerColors: ['#451a03', '#78350f', '#92400e'] as const,
        accentGlow: '#f59e0b',
      },
      evening: {
        colors: ['#451a03', '#78350f', '#92400e'] as const,
        headerColors: ['#1c0a00', '#451a03', '#78350f'] as const,
        accentGlow: '#d97706',
      },
      night: {
        colors: ['#1c0a00', '#451a03', '#78350f'] as const,
        headerColors: ['#1c0a00', '#451a03', '#78350f'] as const,
        accentGlow: '#b45309',
      },
    },
  },
};

// Gradientes por defecto (usa el tema midnight - serio y profesional)
export const timeBasedGradients = colorThemes.midnight.gradients;

// ==================== COLORES PRIMARIOS POR TEMA ====================
// Colores primarios para cada tema de color (afectan toda la UI)
export const themePrimaryColors = {
  ocean: {
    light: {
      primary: '#0284c7', // sky-600
      primaryLight: '#e0f2fe', // sky-100
      primaryDark: '#0369a1', // sky-700
      secondary: '#0ea5e9',
      accent: '#06b6d4',
      info: '#0284c7',
      onPrimary: '#ffffff', // dark-enough light-mode primary
    },
    dark: {
      primary: '#38bdf8', // sky-400
      primaryLight: '#7dd3fc', // sky-300
      primaryDark: '#0284c7', // sky-600
      secondary: '#0ea5e9',
      accent: '#22d3ee',
      info: '#38bdf8',
      onPrimary: '#0f172a', // dark ink: dark-mode primaries are LIGHT hues
    },
  },
  celestial: {
    light: {
      primary: '#7c3aed', // violet-600
      primaryLight: '#ede9fe', // violet-100
      primaryDark: '#6d28d9', // violet-700
      secondary: '#7c3aed',
      accent: '#9333ea',
      info: '#7c3aed',
      onPrimary: '#ffffff', // dark-enough light-mode primary
    },
    dark: {
      primary: '#a78bfa', // violet-400
      primaryLight: '#c4b5fd', // violet-300
      primaryDark: '#7c3aed', // violet-600
      secondary: '#a78bfa',
      accent: '#c084fc',
      info: '#a78bfa',
      onPrimary: '#0f172a', // dark ink: dark-mode primaries are LIGHT hues
    },
  },
  forest: {
    light: {
      primary: '#16a34a', // green-600
      primaryLight: '#dcfce7', // green-100
      primaryDark: '#15803d', // green-700
      secondary: '#166534',
      accent: '#10b981',
      info: '#16a34a',
      onPrimary: '#ffffff', // dark-enough light-mode primary
    },
    dark: {
      primary: '#4ade80', // green-400
      primaryLight: '#86efac', // green-300
      primaryDark: '#16a34a', // green-600
      secondary: '#22c55e',
      accent: '#34d399',
      info: '#4ade80',
      onPrimary: '#0f172a', // dark ink: dark-mode primaries are LIGHT hues
    },
  },
  sunset: {
    light: {
      primary: '#ea580c', // orange-600
      primaryLight: '#ffedd5', // orange-100
      primaryDark: '#c2410c', // orange-700
      secondary: '#f97316',
      accent: '#fbbf24',
      info: '#ea580c',
      onPrimary: '#ffffff', // dark-enough light-mode primary
    },
    dark: {
      primary: '#fb923c', // orange-400
      primaryLight: '#fdba74', // orange-300
      primaryDark: '#ea580c', // orange-600
      secondary: '#f97316',
      accent: '#fbbf24',
      info: '#fb923c',
      onPrimary: '#0f172a', // dark ink: dark-mode primaries are LIGHT hues
    },
  },
  graphite: {
    light: {
      primary: '#52525b', // zinc-600
      primaryLight: '#e4e4e7', // zinc-200
      primaryDark: '#3f3f46', // zinc-700
      secondary: '#3f3f46',
      accent: '#71717a',
      info: '#52525b',
      onPrimary: '#ffffff', // dark-enough light-mode primary
    },
    dark: {
      primary: '#a1a1aa', // zinc-400
      primaryLight: '#d4d4d8', // zinc-300
      primaryDark: '#71717a', // zinc-500
      secondary: '#71717a',
      accent: '#52525b',
      info: '#a1a1aa',
      onPrimary: '#0f172a', // dark ink: dark-mode primaries are LIGHT hues
    },
  },
  royal: {
    light: {
      primary: '#2563eb', // blue-600
      primaryLight: '#dbeafe', // blue-100
      primaryDark: '#1d4ed8', // blue-700
      secondary: '#1d4ed8',
      accent: '#3b82f6',
      info: '#2563eb',
      onPrimary: '#ffffff', // dark-enough light-mode primary
    },
    dark: {
      primary: '#60a5fa', // blue-400
      primaryLight: '#93c5fd', // blue-300
      primaryDark: '#2563eb', // blue-600
      secondary: '#3b82f6',
      accent: '#93c5fd',
      info: '#60a5fa',
      onPrimary: '#0f172a', // dark ink: dark-mode primaries are LIGHT hues
    },
  },
  midnight: {
    light: {
      primary: '#334155', // slate-700 - neutral gray
      primaryLight: '#f1f5f9', // slate-100
      primaryDark: '#0f172a', // slate-900
      secondary: '#475569',
      accent: '#64748b',
      info: '#334155',
      onPrimary: '#ffffff', // dark-enough light-mode primary
    },
    dark: {
      primary: '#cbd5e1', // slate-300 - neutral gray
      primaryLight: '#f1f5f9', // slate-100
      primaryDark: '#94a3b8', // slate-400
      secondary: '#94a3b8',
      accent: '#475569',
      info: '#cbd5e1',
      onPrimary: '#0f172a', // dark ink: dark-mode primaries are LIGHT hues
    },
  },
  cafe: {
    light: {
      primary: '#92400e', // amber-800
      primaryLight: '#fef3c7', // amber-100
      primaryDark: '#78350f', // amber-900
      secondary: '#b45309',
      accent: '#d97706',
      info: '#92400e',
      onPrimary: '#ffffff', // dark-enough light-mode primary
    },
    dark: {
      primary: '#fbbf24', // yellow-400
      primaryLight: '#fcd34d', // yellow-300
      primaryDark: '#d97706', // amber-600
      secondary: '#fbbf24',
      accent: '#f59e0b',
      info: '#fbbf24',
      onPrimary: '#0f172a', // dark ink: dark-mode primaries are LIGHT hues
    },
  },
};

// Configuración del tema celestial
export const celestialTheme = {
  // Acentos dorados (simbolismo bíblico)
  gold: {
    primary: '#f59e0b', // amber-500
    light: '#fbbf24', // amber-400
    dark: '#d97706', // amber-600
    glow: 'rgba(245, 158, 11, 0.3)',
  },
  // Efectos de glassmorphism
  glass: {
    blur: 20,
    opacity: 0.85,
    borderOpacity: 0.2,
  },
  // Configuración de partículas
  particles: {
    count: 20,
    minSize: 2,
    maxSize: 6,
    speed: 0.5,
  },
  // Bordes redondeados
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    card: 20,
    button: 12,
  },
  // Sombras dramáticas
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 8},
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: (color: string) => ({
      shadowColor: color,
      shadowOffset: {width: 0, height: 0},
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    }),
  },
};

export interface ThemeColors {
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
  /**
   * Ink for icons/labels drawn ON a `primary`-filled control. Dark themes use
   * LIGHT primaries (e.g. midnight dark = slate-300, café dark = yellow-400),
   * so a hardcoded white glyph washes out there — always pair primary
   * backgrounds with this token, never with a white literal.
   */
  onPrimary: string;

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
  timeOfDay: TimeOfDay;
  gradient: {
    readonly colors: readonly string[];
    readonly headerColors: readonly string[];
    readonly accentGlow: string;
  };
  colorTheme: ColorTheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setColorTheme: (theme: ColorTheme) => Promise<void>;
}

// Colores Celestial Sereno Light - Paleta Indigo/Purple profesional
// Exported so the WCAG contrast audit (themeContrast.test) can lock the core
// text/background pairs against the real source of truth.
export const lightColors: ThemeColors = {
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
  onPrimary: '#ffffff', // white ink on indigo-600 fills

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
export const darkColors: ThemeColors = {
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
  onPrimary: '#ffffff', // indigo-500 is still dark enough for white ink

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
const COLOR_THEME_STORAGE_KEY = '@app_color_theme';

export function ThemeProvider({children}: {children: ReactNode}) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('midnight'); // Default: Midnight (serio y profesional)
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(
    'light',
  );
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());

  // Load saved preferences on mount
  useEffect(() => {
    loadThemePreference();
    loadColorThemePreference();
  }, []);

  // Update time of day every minute
  useEffect(() => {
    const updateTimeOfDay = () => setTimeOfDay(getTimeOfDay());
    const interval = setInterval(updateTimeOfDay, 60000);
    return () => clearInterval(interval);
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

  async function loadColorThemePreference() {
    try {
      const savedColorTheme = await AsyncStorage.getItem(
        COLOR_THEME_STORAGE_KEY,
      );
      if (savedColorTheme && savedColorTheme in colorThemes) {
        setColorThemeState(savedColorTheme as ColorTheme);
      }
    } catch (error) {
      console.error('Error loading color theme preference:', error);
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

  async function setColorTheme(newColorTheme: ColorTheme) {
    try {
      await AsyncStorage.setItem(COLOR_THEME_STORAGE_KEY, newColorTheme);
      setColorThemeState(newColorTheme);
    } catch (error) {
      console.error('Error saving color theme preference:', error);
    }
  }

  const baseColors = effectiveTheme === 'dark' ? darkColors : lightColors;
  const isDark = effectiveTheme === 'dark';
  // Usar gradientes del tema de color seleccionado
  const gradient = colorThemes[colorTheme].gradients[timeOfDay];

  // Aplicar colores primarios y de realce según el tema de color seleccionado
  const themeColorsSet = themePrimaryColors[colorTheme][effectiveTheme];
  const colors: ThemeColors = {
    ...baseColors,
    primary: themeColorsSet.primary,
    primaryLight: themeColorsSet.primaryLight,
    primaryDark: themeColorsSet.primaryDark,
    onPrimary: themeColorsSet.onPrimary,
    secondary: themeColorsSet.secondary,
    accent: themeColorsSet.accent,
    info: themeColorsSet.info,
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors,
        isDark,
        timeOfDay,
        gradient,
        colorTheme,
        setThemeMode,
        setColorTheme,
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Default fallback values for when context is not yet available
const defaultThemeContext: ThemeContextType = {
  mode: 'auto',
  colors: lightColors,
  isDark: false,
  timeOfDay: getTimeOfDay(),
  gradient: colorThemes.midnight.gradients[getTimeOfDay()],
  colorTheme: 'midnight',
  setThemeMode: async () => {},
  setColorTheme: async () => {},
};

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return fallback instead of throwing error for smoother initialization
  if (context === undefined) {
    return defaultThemeContext;
  }
  return context;
}
