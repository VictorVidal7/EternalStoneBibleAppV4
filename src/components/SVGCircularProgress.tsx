/**
 * 🎨 SVG CIRCULAR PROGRESS
 *
 * Componente de progreso circular usando SVG para renderizado preciso
 * Creado para la gloria de Dios Todopoderoso
 *
 * Features:
 * - Renderizado vectorial con react-native-svg
 * - Animaciones suaves y fluidas
 * - Soporte para gradientes
 * - Customizable (tamaño, color, grosor)
 * - Etiquetas opcionales en el centro
 * - Glow effects opcionales
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
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import {useTheme} from '../hooks/useTheme';
import {fontSize} from '../styles/designTokens';

// Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface SVGCircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  useGradient?: boolean;
  gradientColors?: [string, string];
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
  duration?: number;
  glow?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const SVGCircularProgress: React.FC<SVGCircularProgressProps> = ({
  progress,
  size = 120,
  strokeWidth = 12,
  color,
  backgroundColor,
  useGradient = false,
  gradientColors = ['#6366f1', '#9333ea'],
  showPercentage = true,
  label,
  animated = true,
  duration = 1000,
  glow = false,
  style,
  textStyle,
}) => {
  const {colors, isDark} = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Clamp progress between 0-100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  // Colors
  const strokeColor = color || colors.primary;
  const bgColor =
    backgroundColor || (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)');

  // Circle dimensions
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate progress
  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: clampedProgress,
        duration,
        useNativeDriver: true,
      }).start();
    } else {
      animatedValue.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  // Calculate strokeDashoffset for the progress arc
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, {width: size, height: size}, style]}>
      {/* SVG Circle */}
      <Svg width={size} height={size}>
        {/* Gradient Definition */}
        {useGradient && (
          <Defs>
            <SvgLinearGradient
              id="gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%">
              <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
              <Stop
                offset="100%"
                stopColor={gradientColors[1]}
                stopOpacity="1"
              />
            </SvgLinearGradient>
          </Defs>
        )}

        {/* Background Circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Circle */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={useGradient ? 'url(#gradient)' : strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
          style={
            glow && {
              shadowColor: strokeColor,
              shadowOffset: {width: 0, height: 0},
              shadowOpacity: 0.6,
              shadowRadius: 10,
            }
          }
        />
      </Svg>

      {/* Center Content */}
      {(showPercentage || label) && (
        <View style={styles.centerContent}>
          {showPercentage && (
            <Text
              style={[
                styles.percentage,
                {
                  color: colors.text,
                  fontSize: size * 0.2,
                },
                textStyle,
              ]}>
              {Math.round(clampedProgress)}%
            </Text>
          )}
          {label && (
            <Text
              style={[
                styles.label,
                {
                  color: colors.textSecondary,
                  fontSize: size * 0.1,
                },
              ]}>
              {label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// ==================== PRESET VARIANTS ====================

/**
 * Circular Progress para lectura de la Biblia
 */
export const ReadingCircularProgress: React.FC<{
  progress: number;
  size?: number;
  style?: ViewStyle;
}> = ({progress, size = 140, style}) => (
  <SVGCircularProgress
    progress={progress}
    size={size}
    strokeWidth={14}
    useGradient
    gradientColors={['#6366f1', '#9333ea']}
    showPercentage
    label="Lectura"
    animated
    glow
    style={style}
  />
);

/**
 * Circular Progress para nivel/experiencia
 */
export const LevelCircularProgress: React.FC<{
  progress: number;
  level: number;
  size?: number;
  style?: ViewStyle;
}> = ({progress, level, size = 120, style}) => {
  const {colors} = useTheme();

  return (
    <SVGCircularProgress
      progress={progress}
      size={size}
      strokeWidth={12}
      useGradient
      gradientColors={['#10b981', '#14b8a6']}
      showPercentage
      label={`Nivel ${level}`}
      animated
      glow
      style={style}
    />
  );
};

/**
 * Circular Progress para streak/racha
 */
export const StreakCircularProgress: React.FC<{
  days: number;
  maxDays?: number;
  size?: number;
  style?: ViewStyle;
}> = ({days, maxDays = 365, size = 100, style}) => {
  const progress = (days / maxDays) * 100;

  return (
    <SVGCircularProgress
      progress={progress}
      size={size}
      strokeWidth={10}
      useGradient
      gradientColors={['#fbbf24', '#f59e0b']}
      showPercentage={false}
      label={`${days} días`}
      animated
      style={style}
    />
  );
};

/**
 * Mini Circular Progress (para stats pequeños)
 */
export const MiniCircularProgress: React.FC<{
  progress: number;
  size?: number;
  color?: string;
  style?: ViewStyle;
}> = ({progress, size = 60, color, style}) => (
  <SVGCircularProgress
    progress={progress}
    size={size}
    strokeWidth={6}
    color={color}
    showPercentage
    animated
    style={style}
  />
);

/**
 * Achievement Circular Progress
 */
export const AchievementCircularProgress: React.FC<{
  progress: number;
  size?: number;
  style?: ViewStyle;
}> = ({progress, size = 80, style}) => (
  <SVGCircularProgress
    progress={progress}
    size={size}
    strokeWidth={8}
    useGradient
    gradientColors={['#ec4899', '#db2777']}
    showPercentage
    animated
    glow
    style={style}
  />
);

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  label: {
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
  },
});

export default SVGCircularProgress;
