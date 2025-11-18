/**
 * 🎯 ANIMATED BUTTON - Modern Button Component
 *
 * Premium button with:
 * - Fluid and professional animations
 * - Multiple variants and sizes
 * - Haptic feedback
 * - Realistic press effects
 * - Customizable gradients and shadows
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { spacing, borderRadius, fontSize, shadows } from '../styles/designTokens';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

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
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
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

  const defaultGradientColors = gradientColors || [
    colors.primary,
    colors.primaryDark,
  ];

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
          {
            color: buttonColors.text,
            fontSize: sizeStyles.fontSize,
            fontWeight: '600',
          },
          textStyle,
        ]}
      >
        {loading ? t.loading : title}
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
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || loading}
        >
          <LinearGradient
            colors={defaultGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[containerStyle, isDark ? shadows.lg : shadows.md]}
          >
            {buttonContent}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        style={[
          containerStyle,
          { backgroundColor: buttonColors.background },
          variant !== 'ghost' && variant !== 'outline' && (isDark ? shadows.md : shadows.sm),
        ]}
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        {buttonContent}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
