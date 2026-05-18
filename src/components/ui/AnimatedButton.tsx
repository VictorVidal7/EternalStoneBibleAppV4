/**
 * 🔘 AnimatedButton - Botón Premium con Animaciones
 *
 * Botón interactivo con feedback visual fluido
 * Múltiples variantes: primary, secondary, outline, ghost
 */

import React, {ReactNode} from 'react';
import {
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {useTheme} from '../../context/ThemeContext';
import {usePressAnimation} from '../../hooks/useAnimations';
import {borderRadius, fontSize, fontWeight} from '../../styles/designTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AnimatedButtonProps {
  children?: ReactNode;
  title?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  gradientColors?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  gradientColors,
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const {colors, isDarkMode} = useTheme();
  const {onPressIn, onPressOut, animatedStyle} = usePressAnimation(0.96);

  // Tamaños
  const sizeStyles: Record<
    ButtonSize,
    {height: number; paddingHorizontal: number; fontSize: number}
  > = {
    sm: {height: 36, paddingHorizontal: 12, fontSize: fontSize.sm},
    md: {height: 48, paddingHorizontal: 20, fontSize: fontSize.base},
    lg: {height: 56, paddingHorizontal: 28, fontSize: fontSize.lg},
  };

  const currentSize = sizeStyles[size];

  // Colores según variante
  const getVariantStyles = (): {container: ViewStyle; text: TextStyle} => {
    const primary = colors?.primary || '#6366f1';
    const textSecondary = colors?.textSecondary || '#666';

    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: primary,
          },
          text: {
            color: '#ffffff',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: isDarkMode
              ? 'rgba(99, 102, 241, 0.15)'
              : 'rgba(99, 102, 241, 0.1)',
          },
          text: {
            color: primary,
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: primary,
          },
          text: {
            color: primary,
          },
        };
      case 'ghost':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: textSecondary,
          },
        };
      case 'gradient':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: '#ffffff',
          },
        };
      default:
        return {
          container: {backgroundColor: primary},
          text: {color: '#ffffff'},
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Handler de presión con haptic feedback
  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  // Contenido del botón
  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Animated.View style={styles.iconLeft}>{icon}</Animated.View>
          )}
          {(title || children) && (
            <Text
              style={[
                styles.text,
                {fontSize: currentSize.fontSize},
                variantStyles.text,
                textStyle,
              ]}>
              {title || children}
            </Text>
          )}
          {icon && iconPosition === 'right' && (
            <Animated.View style={styles.iconRight}>{icon}</Animated.View>
          )}
        </>
      )}
    </>
  );

  // Estilos del contenedor
  const containerStyle: ViewStyle = {
    height: currentSize.height,
    paddingHorizontal: currentSize.paddingHorizontal,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth && {width: '100%'}),
    ...variantStyles.container,
    ...style,
  };

  // Gradiente para variante gradient
  const defaultGradient = ['#6366f1', '#8b5cf6', '#a855f7'];
  const finalGradient = gradientColors || defaultGradient;

  if (variant === 'gradient') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={[
          animatedStyle,
          {borderRadius: borderRadius.md, overflow: 'hidden'},
        ]}>
        <LinearGradient
          colors={finalGradient as [string, string, ...string[]]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={containerStyle}>
          {renderContent()}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      style={[containerStyle, animatedStyle]}>
      {renderContent()}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: fontWeight.semibold as TextStyle['fontWeight'],
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});

export default AnimatedButton;
