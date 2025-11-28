/**
 * CustomButton - Botón personalizado con diseño Celestial Sereno
 *
 * Características:
 * - Diseño minimalista y profesional
 * - Soporte completo para modo claro/oscuro
 * - Feedback háptico y accesibilidad
 * - Múltiples variantes y tamaños
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
import {useTheme} from '../hooks/useTheme';
import {borderRadius, fontSize, spacing} from '../styles/designTokens';

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
  const {colors, isDark} = useTheme();

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

  // Estilos dinámicos basados en tema
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
    };

    // Padding según tamaño
    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.sm,
      },
      medium: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
      },
      large: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.base,
        borderRadius: borderRadius.lg,
      },
    };

    // Colores según variante
    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: colors.primary,
        shadowColor: isDark ? '#000' : colors.primary,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: isDark ? 0.3 : 0.2,
        shadowRadius: 8,
        elevation: 4,
      },
      secondary: {
        backgroundColor: colors.accent,
        shadowColor: isDark ? '#000' : colors.accent,
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: isDark ? 0.25 : 0.15,
        shadowRadius: 6,
        elevation: 3,
      },
      danger: {
        backgroundColor: colors.error,
        shadowColor: isDark ? '#000' : colors.error,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: isDark ? 0.3 : 0.2,
        shadowRadius: 4,
        elevation: 2,
      },
      ghost: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(isDisabled && {
        opacity: 0.5,
        shadowOpacity: 0,
        elevation: 0,
      }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles: Record<string, TextStyle> = {
      small: {
        fontSize: fontSize.sm,
      },
      medium: {
        fontSize: fontSize.base,
      },
      large: {
        fontSize: fontSize.md,
      },
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: {
        color: '#FFFFFF',
      },
      secondary: {
        color: '#FFFFFF',
      },
      danger: {
        color: '#FFFFFF',
      },
      ghost: {
        color: colors.primary,
      },
    };

    return {
      fontWeight: '600',
      textAlign: 'center',
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const buttonStyle = [getButtonStyle(), style];
  const textStyles = [getTextStyle(), textStyle];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled: isDisabled, busy: loading}}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? colors.primary : '#FFFFFF'}
          size={size === 'small' ? 'small' : 'small'}
        />
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

export default React.memo(CustomButton);
