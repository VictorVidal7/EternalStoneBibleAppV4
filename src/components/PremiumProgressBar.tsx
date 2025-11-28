/**
 * 📊 PREMIUM PROGRESS BAR - Barra de Progreso de Lujo
 *
 * Barra de progreso con animaciones fluidas y efectos visuales
 * - Animación suave del progreso
 * - Gradientes opcionales
 * - Glow effects
 * - Múltiples variantes
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../hooks/useTheme';
import {borderRadius, fontSize, spacing} from '../styles/designTokens';
import {SPRING_CONFIGS, DURATIONS, EASING} from '../styles/animations';

interface PremiumProgressBarProps {
  progress: number; // 0-100
  variant?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'warning'
    | 'gradient';
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  gradient?: [string, string];
  glow?: boolean;
  animated?: boolean;
  style?: ViewStyle;
  barStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export const PremiumProgressBar: React.FC<PremiumProgressBarProps> = ({
  progress,
  variant = 'primary',
  size = 'medium',
  showLabel = false,
  label,
  showPercentage = false,
  gradient,
  glow = false,
  animated = true,
  style,
  barStyle,
  labelStyle,
}) => {
  const {colors, isDark} = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Clamp progress between 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Animate progress
  useEffect(() => {
    if (animated) {
      Animated.spring(progressAnim, {
        toValue: clampedProgress,
        ...SPRING_CONFIGS.gentle,
      }).start();

      // Glow pulse when nearing completion
      if (clampedProgress > 80) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              easing: EASING.easeInOut,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              easing: EASING.easeInOut,
              useNativeDriver: false,
            }),
          ]),
        ).start();
      }
    } else {
      progressAnim.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  // Size configurations
  const sizeConfig = {
    small: {
      height: 6,
      borderRadius: borderRadius.full,
      fontSize: fontSize.xs,
    },
    medium: {
      height: 10,
      borderRadius: borderRadius.full,
      fontSize: fontSize.sm,
    },
    large: {
      height: 14,
      borderRadius: borderRadius.full,
      fontSize: fontSize.base,
    },
  };

  const config = sizeConfig[size];

  // Color configurations
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          color: colors.primary,
          background: isDark
            ? 'rgba(99, 102, 241, 0.15)'
            : 'rgba(99, 102, 241, 0.1)',
        };
      case 'secondary':
        return {
          color: colors.accent,
          background: isDark
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(16, 185, 129, 0.1)',
        };
      case 'success':
        return {
          color: colors.success,
          background: isDark
            ? 'rgba(16, 185, 129, 0.15)'
            : 'rgba(16, 185, 129, 0.1)',
        };
      case 'error':
        return {
          color: colors.error,
          background: isDark
            ? 'rgba(248, 113, 113, 0.15)'
            : 'rgba(220, 38, 38, 0.1)',
        };
      case 'warning':
        return {
          color: colors.warning,
          background: isDark
            ? 'rgba(251, 191, 36, 0.15)'
            : 'rgba(234, 88, 12, 0.1)',
        };
      case 'gradient':
      default:
        return {
          color: colors.primary,
          background: isDark
            ? 'rgba(99, 102, 241, 0.15)'
            : 'rgba(99, 102, 241, 0.1)',
        };
    }
  };

  const variantColors = getVariantColors();

  // Progress width interpolation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Glow opacity
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Label and Percentage */}
      {(showLabel || showPercentage) && (
        <View style={styles.header}>
          {showLabel && label && (
            <Text
              style={[
                styles.label,
                {
                  color: colors.textSecondary,
                  fontSize: config.fontSize,
                },
                labelStyle,
              ]}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text
              style={[
                styles.percentage,
                {
                  color: colors.text,
                  fontSize: config.fontSize,
                  fontWeight: '700',
                },
              ]}>
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}

      {/* Progress Bar Track */}
      <View
        style={[
          styles.track,
          {
            height: config.height,
            borderRadius: config.borderRadius,
            backgroundColor: variantColors.background,
          },
        ]}>
        {/* Progress Bar Fill */}
        {variant === 'gradient' && gradient ? (
          <Animated.View
            style={[
              styles.progressContainer,
              {
                width: progressWidth,
              },
            ]}>
            <LinearGradient
              colors={gradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[
                styles.progress,
                {
                  height: config.height,
                  borderRadius: config.borderRadius,
                },
                glow && {
                  shadowColor: gradient[0],
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: glowOpacity,
                  shadowRadius: 8,
                  elevation: 6,
                },
                barStyle,
              ]}
            />
          </Animated.View>
        ) : (
          <Animated.View
            style={[
              styles.progress,
              {
                width: progressWidth,
                height: config.height,
                borderRadius: config.borderRadius,
                backgroundColor: variantColors.color,
              },
              glow && {
                shadowColor: variantColors.color,
                shadowOffset: {width: 0, height: 0},
                shadowOpacity: isDark ? 0.6 : 0.4,
                shadowRadius: 8,
                elevation: 6,
              },
              barStyle,
            ]}
          />
        )}
      </View>
    </View>
  );
};

// ==================== PRESET COMPONENTS ====================

/**
 * Progress Bar de lectura de la Biblia
 */
export const ReadingProgress: React.FC<{
  versesRead: number;
  totalVerses: number;
  style?: ViewStyle;
}> = ({versesRead, totalVerses, style}) => {
  const progress = (versesRead / totalVerses) * 100;

  return (
    <PremiumProgressBar
      progress={progress}
      variant="gradient"
      gradient={['#6366f1', '#9333ea']}
      size="medium"
      showLabel
      label="Progreso de Lectura"
      showPercentage
      glow
      animated
      style={style}
    />
  );
};

/**
 * Progress Bar de nivel/experiencia
 */
export const LevelProgress: React.FC<{
  currentXP: number;
  requiredXP: number;
  level: number;
  style?: ViewStyle;
}> = ({currentXP, requiredXP, level, style}) => {
  const progress = (currentXP / requiredXP) * 100;

  return (
    <PremiumProgressBar
      progress={progress}
      variant="gradient"
      gradient={['#10b981', '#14b8a6']}
      size="large"
      showLabel
      label={`Nivel ${level}`}
      showPercentage
      glow
      animated
      style={style}
    />
  );
};

/**
 * Progress Bar de carga simple
 */
export const LoadingProgress: React.FC<{
  progress: number;
  label?: string;
  style?: ViewStyle;
}> = ({progress, label, style}) => (
  <PremiumProgressBar
    progress={progress}
    variant="primary"
    size="small"
    showLabel={!!label}
    label={label}
    animated
    style={style}
  />
);

/**
 * Progress Bar circular (para avatares o stats)
 */
export const CircularProgress: React.FC<{
  progress: number;
  size?: number;
  color?: string;
  children?: React.ReactNode;
}> = ({progress, size = 100, color, children}) => {
  const {colors} = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      ...SPRING_CONFIGS.gentle,
    }).start();
  }, [progress]);

  const circumference = 2 * Math.PI * (size / 2 - 10);
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View
      style={[
        styles.circularContainer,
        {
          width: size,
          height: size,
        },
      ]}>
      {/* TODO: Implement SVG circular progress */}
      {/* For now, showing placeholder */}
      <View
        style={[
          styles.circularPlaceholder,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 8,
            borderColor: color || colors.primary,
            opacity: 0.3,
          },
        ]}
      />
      {children && <View style={styles.circularContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  percentage: {
    letterSpacing: -0.3,
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  progressContainer: {
    height: '100%',
  },
  progress: {
    width: '100%',
  },
  circularContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circularPlaceholder: {
    position: 'absolute',
  },
  circularContent: {
    position: 'absolute',
  },
});

export default PremiumProgressBar;
