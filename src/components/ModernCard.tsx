/**
 * 🎴 MODERN CARD COMPONENT
 *
 * Card component moderno con glassmorphism, gradientes,
 * y múltiples variantes de diseño.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { BlurView } from 'expo-blur'; // Commented out temporarily
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, shadows } from '../styles/designTokens';
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

  const paddingMap = {
    none: 0,
    small: spacing.md,
    medium: spacing.base,
    large: spacing.lg,
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
          ...shadows[elevation],
        };

      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: borderWidth,
          borderColor: borderColor || colors.border,
        };

      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
        };

      case 'glass':
        return {
          ...baseStyle,
          backgroundColor: colors.glass,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          ...shadows.sm,
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

    // Temporarily disabled BlurView until expo-blur is installed
    // if (variant === 'glass' && useBlur) {
    //   return (
    //     <View style={[styles.glassContainer, style]}>
    //       <BlurView
    //         intensity={80}
    //         tint={isDark ? 'dark' : 'light'}
    //         style={[getCardStyle(), styles.blurView]}
    //       >
    //         {children}
    //       </BlurView>
    //     </View>
    //   );
    // }

    return <View style={[getCardStyle(), style]}>{children}</View>;
  };

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        onLongPress={handleLongPress}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return renderContent();
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
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  headerAction: {
    marginLeft: spacing.md,
  },

  // Footer
  footer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },

  // Section
  section: {
    paddingVertical: spacing.md,
  },
});

export default ModernCard;
