/**
 * 💎 PREMIUM INPUT - Input Field de Lujo
 *
 * Campo de texto con diseño premium y micro-interacciones
 * - Animaciones fluidas
 * - Glow effects al enfocar
 * - Floating labels
 * - Validación visual
 */

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ViewStyle,
  TextInputProps,
  Platform,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {haptics} from '@lib/haptics';
import {useTheme} from '../hooks/useTheme';
import {
  borderRadius,
  fontSize,
  spacing,
  staticColors,
} from '../styles/designTokens';
import {SPRING_CONFIGS, DURATIONS, EASING} from '../styles/animations';

interface PremiumInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  variant?: 'outlined' | 'filled' | 'underlined';
  size?: 'small' | 'medium' | 'large';
  success?: boolean;
  containerStyle?: ViewStyle;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  error,
  helperText,
  icon,
  rightIcon,
  onRightIconPress,
  variant = 'outlined',
  size = 'medium',
  success = false,
  containerStyle,
  value,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const {colors, isDark} = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);

  // Animated values
  const focusAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Animate on focus/blur
  useEffect(() => {
    Animated.parallel([
      Animated.timing(focusAnim, {
        toValue: isFocused ? 1 : 0,
        duration: DURATIONS.normal,
        easing: EASING.premium,
        useNativeDriver: false,
      }),
      Animated.spring(glowAnim, {
        toValue: isFocused ? 1 : 0,
        ...SPRING_CONFIGS.gentle,
      }),
    ]).start();
  }, [isFocused]);

  // Animate label
  useEffect(() => {
    Animated.spring(labelAnim, {
      toValue: isFocused || hasValue ? 1 : 0,
      ...SPRING_CONFIGS.snappy,
    }).start();
  }, [isFocused, hasValue]);

  // Shake on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      if (Platform.OS !== 'web') {
        haptics.error();
      }
    }
  }, [error]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (Platform.OS !== 'web') {
      haptics.tap();
    }
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(text.length > 0);
    textInputProps.onChangeText?.(text);
  };

  // Size configurations
  const sizeConfig = {
    small: {
      height: 44,
      fontSize: fontSize.sm,
      paddingHorizontal: spacing.md,
      iconSize: 18,
    },
    medium: {
      height: 52,
      fontSize: fontSize.base,
      paddingHorizontal: spacing.lg,
      iconSize: 20,
    },
    large: {
      height: 60,
      fontSize: fontSize.md,
      paddingHorizontal: spacing.xl,
      iconSize: 24,
    },
  };

  const config = sizeConfig[size];

  // Border color animation
  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? colors.error : colors.border,
      success ? colors.success : colors.primary,
    ],
  });

  // Glow opacity
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isDark ? 0.3 : 0.15],
  });

  // Label position
  const labelTop = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [config.height / 2 - 10, -10],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.85],
  });

  // Get border style based on variant
  const getBorderStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          borderWidth: 2,
          borderColor: borderColor,
          backgroundColor: 'transparent',
        };
      case 'filled':
        return {
          borderWidth: 0,
          borderBottomWidth: 2,
          borderBottomColor: borderColor,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.03)',
        };
      case 'underlined':
        return {
          borderWidth: 0,
          borderBottomWidth: 2,
          borderBottomColor: borderColor,
          backgroundColor: 'transparent',
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {transform: [{translateX: shakeAnim}]},
        containerStyle,
      ]}>
      {/* Glow effect cuando está focused */}
      {variant === 'outlined' && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              opacity: glowOpacity,
              borderRadius: borderRadius.md,
              shadowColor: error
                ? colors.error
                : success
                  ? colors.success
                  : colors.primary,
            },
          ]}
        />
      )}

      {/* Input container */}
      <Animated.View
        style={[
          styles.inputContainer,
          getBorderStyle(),
          variant === 'outlined'
            ? styles.inputRadiusOutlined
            : styles.inputRadiusFlat,
          {
            height: config.height,
            paddingHorizontal: config.paddingHorizontal,
          },
        ]}>
        {/* Left Icon */}
        {icon && (
          <Ionicons
            name={icon}
            size={config.iconSize}
            color={
              isFocused
                ? colors.primary
                : error
                  ? colors.error
                  : colors.textTertiary
            }
            style={styles.leftIcon}
          />
        )}

        {/* Input Field */}
        <TextInput
          {...textInputProps}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          style={[
            styles.input,
            icon && styles.inputPadLeft,
            rightIcon && styles.inputPadRight,
            {
              fontSize: config.fontSize,
              color: colors.text,
            },
          ]}
          placeholderTextColor={colors.textTertiary}
          selectionColor={colors.primary}
        />

        {/* Floating Label */}
        {label && (
          <Animated.View
            style={[
              styles.labelContainer,
              {
                top: labelTop,
                transform: [{scale: labelScale}],
              },
            ]}
            pointerEvents="none">
            <View
              style={[
                styles.labelBackground,
                {
                  backgroundColor:
                    variant === 'outlined'
                      ? colors.background
                      : staticColors.transparent,
                },
              ]}>
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused
                      ? error
                        ? colors.error
                        : success
                          ? colors.success
                          : colors.primary
                      : colors.textSecondary,
                    fontSize: fontSize.sm,
                  },
                ]}>
                {label}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Right Icon */}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            activeOpacity={0.7}>
            <Ionicons
              name={rightIcon}
              size={config.iconSize}
              color={
                isFocused
                  ? colors.primary
                  : error
                    ? colors.error
                    : colors.textTertiary
              }
            />
          </TouchableOpacity>
        )}

        {/* Success/Error Indicator */}
        {(success || error) && !rightIcon && (
          <View style={styles.statusIcon}>
            <Ionicons
              name={success ? 'checkmark-circle' : 'alert-circle'}
              size={config.iconSize}
              color={success ? colors.success : colors.error}
            />
          </View>
        )}
      </Animated.View>

      {/* Helper Text / Error Message */}
      {(helperText || error) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? colors.error : colors.textSecondary,
              fontSize: fontSize.xs,
              marginTop: spacing.xs,
            },
          ]}>
          {error || helperText}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputRadiusOutlined: {borderRadius: borderRadius.md},
  inputRadiusFlat: {borderRadius: 0},
  inputPadLeft: {paddingLeft: spacing.xs},
  inputPadRight: {paddingRight: spacing.xs},
  container: {
    marginBottom: spacing.md,
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    shadowOffset: {width: 0, height: 0},
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIconContainer: {
    marginLeft: spacing.xs,
    padding: spacing.xs,
  },
  statusIcon: {
    marginLeft: spacing.xs,
  },
  labelContainer: {
    position: 'absolute',
    left: spacing.lg,
  },
  labelBackground: {
    paddingHorizontal: 4,
  },
  label: {
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  helperText: {
    marginLeft: spacing.md,
    fontWeight: '500',
  },
});

export default PremiumInput;
