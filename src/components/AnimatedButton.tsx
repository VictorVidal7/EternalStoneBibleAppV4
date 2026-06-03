/**
 * 🎯 ANIMATED BUTTON - Componente de Botón Moderno
 *
 * Botón premium con:
 * - Animaciones fluidas y profesionales
 * - Múltiples variantes y tamaños
 * - Feedback háptico
 * - Efectos de presión realistas
 * - Gradientes y sombras personalizables
 */

import React, {useRef} from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';

import {spacing, borderRadius, fontSize, shadows} from '../styles/designTokens';
import {useTheme} from '../hooks/useTheme';
import {usePressScale} from '../hooks/usePressScale';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
type ButtonSize = 'small' | 'medium' | 'large';

interface AnimatedButtonProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  gradientColors?: string[];
  hapticFeedback?: boolean;
}

export default function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  gradientColors,
  hapticFeedback = true,
}: AnimatedButtonProps) {
  const {colors, isDark} = useTheme();
  // Sprint 67: shared, reduce-motion-aware press depress (see usePressScale).
  // The opacity dip stays local — it's a fade, not motion, so it's fine to keep
  // under reduced motion.
  const press = usePressScale();
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;

    press.onPressIn();
    Animated.timing(opacityAnim, {
      toValue: 0.8,
      duration: 100,
      useNativeDriver: true,
    }).start();

    if (hapticFeedback) {
      haptics.tap();
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    press.onPressOut();
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const getButtonColors = () => {
    switch (variant) {
      case 'primary':
        return {
          background: colors.primary,
          text: '#ffffff',
          border: colors.primary,
        };
      case 'secondary':
        return {
          background: colors.secondary,
          text: '#ffffff',
          border: colors.secondary,
        };
      case 'outline':
        return {
          background: 'transparent',
          text: colors.primary,
          border: colors.primary,
        };
      case 'ghost':
        return {
          background: 'transparent',
          text: colors.text,
          border: 'transparent',
        };
      case 'gradient':
        return {
          background: 'gradient',
          text: '#ffffff',
          border: 'transparent',
        };
      default:
        return {
          background: colors.primary,
          text: '#ffffff',
          border: colors.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
          fontSize: fontSize.sm,
          height: 36,
          iconSize: 16,
        };
      case 'medium':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          fontSize: fontSize.base,
          height: 48,
          iconSize: 20,
        };
      case 'large':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xl,
          fontSize: fontSize.lg,
          height: 56,
          iconSize: 24,
        };
      default:
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          fontSize: fontSize.base,
          height: 48,
          iconSize: 20,
        };
    }
  };

  const buttonColors = getButtonColors();
  const sizeStyles = getSizeStyles();

  const defaultGradientColors: readonly [string, string] = gradientColors
    ? [
        gradientColors[0] || colors.primary,
        gradientColors[1] || colors.primaryDark,
      ]
    : [colors.primary, colors.primaryDark];

  const buttonContent = (
    <>
      {icon && iconPosition === 'left' && (
        <Ionicons
          name={icon}
          size={sizeStyles.iconSize}
          color={buttonColors.text}
          style={styles.iconLeft}
        />
      )}
      <Text
        style={[
          styles.text,
          styles.textWeight,
          {color: buttonColors.text, fontSize: sizeStyles.fontSize},
          textStyle,
        ]}>
        {loading ? 'Cargando...' : title}
      </Text>
      {icon && iconPosition === 'right' && (
        <Ionicons
          name={icon}
          size={sizeStyles.iconSize}
          color={buttonColors.text}
          style={styles.iconRight}
        />
      )}
    </>
  );

  const containerStyle = [
    styles.container,
    {
      height: sizeStyles.height,
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderColor: buttonColors.border,
      borderWidth: variant === 'outline' ? 2 : 0,
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  if (variant === 'gradient') {
    return (
      <Animated.View
        style={{
          transform: [{scale: press.scale}],
          opacity: opacityAnim,
        }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}>
          <LinearGradient
            colors={defaultGradientColors}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[containerStyle, isDark ? shadows.lg : shadows.md]}>
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        transform: [{scale: press.scale}],
        opacity: opacityAnim,
      }}>
      <TouchableOpacity
        style={[
          containerStyle,
          {backgroundColor: buttonColors.background},
          variant !== 'ghost' &&
            variant !== 'outline' &&
            (isDark ? shadows.md : shadows.sm),
        ]}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}>
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  textWeight: {fontWeight: '600'},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
});
