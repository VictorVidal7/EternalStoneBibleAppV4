import {useMemo} from 'react';
import {useTheme} from '../context/ThemeContext';
import {useUserPreferences} from '../context/UserPreferencesContext';

export const useStyles = styleCreator => {
  const {colors} = useTheme();
  const {fontSize, fontFamily} = useUserPreferences();

  return useMemo(
    () => styleCreator(colors, fontSize, fontFamily),
    [colors, fontSize, fontFamily, styleCreator],
  );
};
