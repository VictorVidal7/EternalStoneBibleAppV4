/**
 * ⬅️ SCREEN HEADER BACK
 *
 * Botón de retroceso reutilizable para pantallas sin cabecera de navegación
 * (Stack con headerShown:false). Mantiene la salida consistente con el resto
 * de la app, que siempre ofrece un botón "atrás" visible en pantalla.
 */

import React from 'react';
import {TouchableOpacity, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useTheme} from '../hooks/useTheme';
import {useLanguage} from '../hooks/useLanguage';

interface ScreenHeaderBackProps {
  style?: StyleProp<ViewStyle>;
}

export const ScreenHeaderBack: React.FC<ScreenHeaderBackProps> = ({style}) => {
  const router = useRouter();
  const {colors} = useTheme();
  const {t} = useLanguage();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {backgroundColor: colors.surface, borderColor: colors.border},
        style,
      ]}
      onPress={() => router.back()}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={t.bible.back}>
      <Ionicons name="arrow-back" size={22} color={colors.text} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
