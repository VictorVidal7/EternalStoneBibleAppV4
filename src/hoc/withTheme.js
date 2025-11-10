import React from 'react';
import { useTheme } from '../context/ThemeContext';

export const withTheme = (WrappedComponent) => {
  return (props) => {
    const theme = useTheme();
    return <WrappedComponent {...props} theme={theme} />;
  };
};