/**
 * 🎴 MODERN CARD COMPONENT
 *
 * Card component moderno con glassmorphism, gradientes,
 * y múltiples variantes de diseño.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, shadows, fontSize } from '../styles/designTokens';
import { useTheme } from '../hooks/useTheme';

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'glass' | 'gradient';
type CardPadding = 'none' | 'small' | 'medium' | 'large';

interface ModernCardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  gradient?: [string, string];
  elevation?: keyof typeof shadows;
  disabled?: boolean;
  hapticFeedback?: boolean;
  borderColor?: string;
  borderWidth?: number;
  useBlur?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  onPress,
  onLongPress,
  style,
  gradient,
  elevation = 'md',
  disabled = false,
  hapticFeedback = true,
  borderColor,
  borderWidth = 1,
  useBlur = Platform.OS === 'ios',
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fadeAnim, {
      toValue: 1,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const paddingMap = {
    none: 0,
    small: spacing.md,
    medium: spacing.base,
    large: spacing.lg,
  };

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  };

  const handleLongPress = () => {
    if (disabled) return;
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLongPress?.();
  };

  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.lg,
      padding: paddingMap[padding],
      opacity: disabled ? 0.5 : 1,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: colors.card,
          ...(isDark ? shadows[elevation] : shadows[elevation === 'xl' ? 'md' : elevation === 'lg' ? 'sm' : 'xs']),
          borderWidth: 0,
        };

      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.8)',
          borderWidth: borderWidth,
          borderColor: borderColor || colors.border,
        };

      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          ...(isDark ? {} : shadows.xs),
        };

      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          ...shadows.md,  // Sombra más profunda
        };

      case 'gradient':
        return {
          ...baseStyle,
          ...shadows[elevation],
        };

      default:
        return baseStyle;
    }
  };

  const renderContent = () => {
    if (variant === 'gradient' && gradient) {
      return (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[getCardStyle(), style]}
        >
          {children}
        </LinearGradient>
      );
    }

    // Glassmorphism con BlurView
    if (variant === 'glass' && useBlur) {
      return (
        <View style={[styles.glassContainer, style]}>
          <BlurView
            intensity={isDark ? 60 : 80}
            tint={isDark ? 'dark' : 'light'}
            style={[getCardStyle(), styles.blurView]}
          >
            {children}
          </BlurView>
        </View>
      );
    }

    return <View style={[getCardStyle(), style]}>{children}</View>;
  };

  if (onPress || onLongPress) {
    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessible
          accessibilityRole="button"
          accessibilityState={{ disabled }}
        >
          {renderContent()}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {renderContent()}
    </Animated.View>
  );
};

// ==================== CARD HEADER ====================

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  style,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        {icon && <View style={styles.headerIcon}>{icon}</View>}
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {action && <View style={styles.headerAction}>{action}</View>}
    </View>
  );
};

// ==================== CARD FOOTER ====================

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.footer,
        { borderTopColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// ==================== CARD SECTION ====================

interface CardSectionProps {
  children: React.ReactNode;
  divider?: boolean;
  style?: ViewStyle;
}

export const CardSection: React.FC<CardSectionProps> = ({
  children,
  divider = false,
  style,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.section,
        divider && {
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  glassContainer: {
    overflow: 'hidden',
    borderRadius: borderRadius.lg,
  },
  blurView: {
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,  // Más separación
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: spacing.base,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.xl,  // Más grande
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    opacity: 0.7,
  },
  headerAction: {
    marginLeft: spacing.lg,
  },

  // Footer
  footer: {
    marginTop: spacing.lg,  // Más separación
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },

  // Section
  section: {
    paddingVertical: spacing.lg,  // Más espacioso
  },
});

export default ModernCard;
