/**
 * 🏷️ PREMIUM BADGE COMPONENT
 *
 * Badge elegante con:
 * - Múltiples variantes
 * - Animaciones opcionales
 * - Gradientes
 * - Dot indicator
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize } from '../styles/designTokens';

type BadgeVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'gradient';
type BadgeSize = 'small' | 'medium' | 'large';

interface PremiumBadgeProps {
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
  dot?: boolean;
  pulse?: boolean;
  gradient?: string[];
  customColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  icon,
  count,
  dot = false,
  pulse = false,
  gradient,
  customColor,
  style,
  textStyle,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [pulse]);

  const getVariantColors = () => {
    if (customColor) {
      return { background: customColor, text: '#ffffff' };
    }

    switch (variant) {
      case 'primary':
        return { background: '#667eea', text: '#ffffff' };
      case 'secondary':
        return { background: '#10b981', text: '#ffffff' };
      case 'success':
        return { background: '#34d399', text: '#ffffff' };
      case 'error':
        return { background: '#f87171', text: '#ffffff' };
      case 'warning':
        return { background: '#fbbf24', text: '#000000' };
      case 'info':
        return { background: '#60a5fa', text: '#ffffff' };
      default:
        return { background: '#667eea', text: '#ffffff' };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xs / 2,
          paddingHorizontal: spacing.xs,
          fontSize: fontSize.xs,
          iconSize: 12,
        };
      case 'large':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.base,
          fontSize: fontSize.base,
          iconSize: 20,
        };
      default:
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          fontSize: fontSize.sm,
          iconSize: 16,
        };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();
  const displayText = count !== undefined ? count.toString() : label;

  const getGradientColors = () => {
    if (gradient) return gradient;
    return ['#667eea', '#764ba2'];
  };

  if (dot) {
    return (
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: colors.background,
            width: size === 'small' ? 8 : size === 'large' ? 16 : 12,
            height: size === 'small' ? 8 : size === 'large' ? 16 : 12,
            transform: [{ scale: pulse ? pulseAnim : 1 }],
          },
          style,
        ]}
      />
    );
  }

  const BadgeContent = (
    <View
      style={[
        styles.badge,
        {
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        variant !== 'gradient' && { backgroundColor: colors.background },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={sizeStyles.iconSize}
          color={colors.text}
          style={styles.icon}
        />
      )}
      {displayText && (
        <Text
          style={[
            styles.text,
            {
              color: colors.text,
              fontSize: sizeStyles.fontSize,
              fontWeight: '600',
            },
            textStyle,
          ]}
        >
          {displayText}
        </Text>
      )}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View style={{ transform: [{ scale: pulse ? pulseAnim : 1 }] }}>
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.badge,
            {
              paddingVertical: sizeStyles.paddingVertical,
              paddingHorizontal: sizeStyles.paddingHorizontal,
            },
            style,
          ]}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color="#ffffff"
              style={styles.icon}
            />
          )}
          {displayText && (
            <Text
              style={[
                styles.text,
                {
                  color: '#ffffff',
                  fontSize: sizeStyles.fontSize,
                  fontWeight: '600',
                },
                textStyle,
              ]}
            >
              {displayText}
            </Text>
          )}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: pulse ? pulseAnim : 1 }] }}>
      {BadgeContent}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
  icon: {
    marginRight: spacing.xs / 2,
  },
  dot: {
    borderRadius: 999,
  },
});

export default PremiumBadge;
