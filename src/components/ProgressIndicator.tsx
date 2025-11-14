/**
 * 📊 PROGRESS INDICATOR
 *
 * Indicadores de progreso modernos con animaciones suaves,
 * múltiples variantes y estilos glassmorphism.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, fontSize } from '../styles/designTokens';
import { useTheme } from '../hooks/useTheme';

type ProgressVariant = 'linear' | 'circular' | 'ring';
type ProgressSize = 'small' | 'medium' | 'large';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  variant?: ProgressVariant;
  size?: ProgressSize;
  showLabel?: boolean;
  label?: string;
  color?: string;
  backgroundColor?: string;
  useGradient?: boolean;
  animated?: boolean;
  thickness?: number;
  style?: ViewStyle;
}

// ==================== LINEAR PROGRESS ====================

export const LinearProgress: React.FC<
  Omit<ProgressIndicatorProps, 'variant'>
> = ({
  progress,
  size = 'medium',
  showLabel = false,
  label,
  color,
  backgroundColor,
  useGradient = true,
  animated = true,
  style,
}) => {
  const { theme } = useTheme();
  const animatedProgress = useRef(new Animated.Value(0)).current;

  const heightMap = {
    small: 4,
    medium: 6,
    large: 8,
  };

  const height = heightMap[size];
  const progressColor = color || theme.colors.primary;
  const bgColor = backgroundColor || theme.colors.disabled;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress]);

  const width = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.linearContainer, style]}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            {label || 'Progress'}
          </Text>
          <Text style={[styles.percentage, { color: theme.colors.text }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}

      <View
        style={[
          styles.linearTrack,
          {
            height,
            backgroundColor: bgColor,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View style={{ width }}>
          {useGradient ? (
            <LinearGradient
              colors={[progressColor, theme.colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.linearFill,
                {
                  height,
                  borderRadius: height / 2,
                },
              ]}
            />
          ) : (
            <View
              style={[
                styles.linearFill,
                {
                  height,
                  backgroundColor: progressColor,
                  borderRadius: height / 2,
                },
              ]}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
};

// ==================== CIRCULAR PROGRESS ====================

export const CircularProgress: React.FC<
  Omit<ProgressIndicatorProps, 'variant'>
> = ({
  progress,
  size = 'medium',
  showLabel = true,
  color,
  backgroundColor,
  thickness = 8,
  style,
}) => {
  const { theme } = useTheme();

  const sizeMap = {
    small: 60,
    medium: 100,
    large: 140,
  };

  const circleSize = sizeMap[size];
  const progressColor = color || theme.colors.primary;
  const bgColor = backgroundColor || theme.colors.disabled;

  const radius = (circleSize - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={[styles.circularContainer, { width: circleSize, height: circleSize }, style]}>
      {/* Background Circle */}
      <View
        style={[
          styles.circle,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth: thickness,
            borderColor: bgColor,
          },
        ]}
      />

      {/* Progress Circle */}
      <View
        style={[
          styles.circle,
          styles.circleAbsolute,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth: thickness,
            borderColor: progressColor,
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />

      {/* Center Label */}
      {showLabel && (
        <View style={styles.circularLabel}>
          <Text style={[styles.circularPercentage, { color: theme.colors.text }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </View>
  );
};

// ==================== RING PROGRESS ====================
// Versión más moderna del circular con glassmorphism

export const RingProgress: React.FC<
  Omit<ProgressIndicatorProps, 'variant'>
> = ({
  progress,
  size = 'medium',
  showLabel = true,
  label,
  color,
  useGradient = true,
  thickness = 12,
  style,
}) => {
  const { theme } = useTheme();

  const sizeMap = {
    small: 80,
    medium: 120,
    large: 160,
  };

  const circleSize = sizeMap[size];
  const progressColor = color || theme.colors.primary;

  return (
    <View
      style={[
        styles.ringContainer,
        {
          width: circleSize,
          height: circleSize,
        },
        style,
      ]}
    >
      {/* Glassmorphic background */}
      <View
        style={[
          styles.ringBackground,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            backgroundColor: theme.colors.glass,
            borderColor: theme.colors.glassBorder,
          },
        ]}
      >
        {showLabel && (
          <View style={styles.ringLabel}>
            <Text
              style={[
                styles.ringPercentage,
                { color: theme.colors.text, fontSize: circleSize * 0.2 },
              ]}
            >
              {Math.round(progress)}%
            </Text>
            {label && (
              <Text
                style={[
                  styles.ringSubtext,
                  { color: theme.colors.textSecondary, fontSize: circleSize * 0.1 },
                ]}
              >
                {label}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Progress ring */}
      <View
        style={[
          styles.ringProgress,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderWidth: thickness,
            borderColor: 'transparent',
            borderTopColor: progressColor,
            transform: [{ rotate: `${(progress / 100) * 360}deg` }],
          },
        ]}
      />
    </View>
  );
};

// ==================== MAIN COMPONENT ====================

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  variant = 'linear',
  ...props
}) => {
  switch (variant) {
    case 'circular':
      return <CircularProgress {...props} />;
    case 'ring':
      return <RingProgress {...props} />;
    case 'linear':
    default:
      return <LinearProgress {...props} />;
  }
};

const styles = StyleSheet.create({
  // Linear
  linearContainer: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
  },
  percentage: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  linearTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  linearFill: {
    width: '100%',
  },

  // Circular
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    borderColor: 'transparent',
  },
  circleAbsolute: {
    position: 'absolute',
  },
  circularLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularPercentage: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
  },

  // Ring
  ringContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  ringLabel: {
    alignItems: 'center',
  },
  ringPercentage: {
    fontWeight: '700',
  },
  ringSubtext: {
    marginTop: spacing.xs,
  },
  ringProgress: {
    position: 'absolute',
  },
});

export default ProgressIndicator;
