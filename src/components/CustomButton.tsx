/**
 * CustomButton - Botón personalizado con feedback háptico y accesibilidad mejorada
 * Migrado a TypeScript con mejoras de UX y type safety
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import HapticFeedback from '../services/HapticFeedback';

interface CustomButtonProps {
  /** Función a ejecutar al presionar el botón */
  onPress: () => void | Promise<void>;

  /** Texto del botón */
  title: string;

  /** Estilos personalizados para el contenedor */
  style?: ViewStyle;

  /** Estilos personalizados para el texto */
  textStyle?: TextStyle;

  /** Desactivar el botón */
  disabled?: boolean;

  /** Mostrar indicador de carga */
  loading?: boolean;

  /** Variante del botón */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';

  /** Tamaño del botón */
  size?: 'small' | 'medium' | 'large';

  /** Label de accesibilidad */
  accessibilityLabel?: string;

  /** Hint de accesibilidad */
  accessibilityHint?: string;

  /** Icono opcional (componente React) */
  icon?: React.ReactNode;

  /** Posición del icono */
  iconPosition?: 'left' | 'right';

  /** Deshabilitar feedback háptico */
  disableHaptic?: boolean;
}

/**
 * Botón personalizado con soporte completo para accesibilidad y estados
 */
const CustomButton: React.FC<CustomButtonProps> = ({
  onPress,
  title,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'medium',
  accessibilityLabel,
  accessibilityHint,
  icon,
  iconPosition = 'left',
  disableHaptic = false,
}) => {
  const handlePress = async () => {
    if (disabled || loading) return;

    if (!disableHaptic) {
      HapticFeedback.light();
    }

    try {
      await onPress();
    } catch (error) {
      console.error('Error in CustomButton onPress:', error);
    }
  };

  const isDisabled = disabled || loading;

  // Determinar estilos basados en variante y tamaño
  const buttonStyle = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    isDisabled && styles.button_disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    isDisabled && styles.text_disabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#007AFF'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text style={textStyles}>{title}</Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Estilos base
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // Variantes
  button_primary: {
    backgroundColor: '#007AFF',
  },
  text_primary: {
    color: 'white',
  },

  button_secondary: {
    backgroundColor: '#E5E5EA',
  },
  text_secondary: {
    color: '#000000',
  },

  button_danger: {
    backgroundColor: '#FF3B30',
  },
  text_danger: {
    color: 'white',
  },

  button_ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  text_ghost: {
    color: '#007AFF',
  },

  // Tamaños
  button_small: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  text_small: {
    fontSize: 14,
  },

  button_medium: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text_medium: {
    fontSize: 16,
  },

  button_large: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  text_large: {
    fontSize: 18,
  },

  // Estados
  button_disabled: {
    opacity: 0.5,
  },
  text_disabled: {
    opacity: 0.7,
  },
});

export default React.memo(CustomButton);
