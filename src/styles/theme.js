import { DefaultTheme, DarkTheme } from '@react-navigation/native';

export const lightColors = {
  primary: '#3498db',
  secondary: '#2ecc71',
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#333333',
  border: '#dddddd',
  notification: '#f39c12',
  error: '#e74c3c',
  success: '#27ae60',
  warning: '#f1c40f',
  info: '#3498db',
  disabled: '#bdc3c7',
};

export const darkColors = {
  primary: '#3498db',
  secondary: '#2ecc71',
  background: '#121212',
  card: '#1e1e1e',
  text: '#ffffff',
  border: '#333333',
  notification: '#f39c12',
  error: '#e74c3c',
  success: '#27ae60',
  warning: '#f1c40f',
  info: '#3498db',
  disabled: '#636e72',
};

const fontConfig = {
  default: {
    regular: {
      fontFamily: 'Roboto-Regular',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'Roboto-Medium',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'Roboto-Light',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'Roboto-Thin',
      fontWeight: '100',
    },
  },
};

export const theme = {
  light: {
    ...DefaultTheme,
    colors: lightColors,
    fonts: fontConfig.default,
    roundness: 8,
  },
  dark: {
    ...DarkTheme,
    colors: darkColors,
    fonts: fontConfig.default,
    roundness: 8,
  },
};

export const getTheme = (isDark) => (isDark ? theme.dark : theme.light);

export const getStyle = (componentStyles, theme) => {
  if (typeof componentStyles === 'function') {
    return componentStyles(theme);
  }
  return componentStyles;
};