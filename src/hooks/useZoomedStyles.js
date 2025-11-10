import { useMemo } from 'react';
import { useUserPreferences } from '../context/UserPreferencesContext';

export const useZoomedStyles = (styleCreator) => {
  const { textZoom } = useUserPreferences();

  return useMemo(() => {
    const styles = styleCreator();
    const zoomedStyles = {};

    Object.keys(styles).forEach(key => {
      zoomedStyles[key] = { ...styles[key] };
      if (zoomedStyles[key].fontSize) {
        zoomedStyles[key].fontSize = zoomedStyles[key].fontSize * (textZoom / 100);
      }
    });

    return zoomedStyles;
  }, [styleCreator, textZoom]);
};