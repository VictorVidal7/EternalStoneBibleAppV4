/**
 * 🌀 PROGRESS CIRCLE - Componente de Círculo de Progreso
 *
 * Círculo de progreso animado con gradiente para el sistema Celestial Sereno
 * Usado en ReadingPlanCard y otros componentes que requieran indicador circular
 *
 * Features:
 * - Gradiente en el stroke
 * - Animación suave del progreso
 * - Customizable en tamaño y colores
 * - Optimizado para React Native
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressCircleProps {
  /**
   * Progreso de 0 a 100
   */
  progress: number;

  /**
   * Tamaño del círculo (diámetro)
   * @default 80
   */
  size?: number;

  /**
   * Grosor del stroke
   * @default 6
   */
  strokeWidth?: number;

  /**
   * Colores del gradiente [inicio, fin]
   * @default ['#6366f1', '#a855f7'] (indigo → purple)
   */
  gradientColors?: [string, string];

  /**
   * Color del background circle
   * @default 'rgba(99, 102, 241, 0.1)'
   */
  backgroundColor?: string;

  /**
   * Duración de la animación en ms
   * @default 700
   */
  animationDuration?: number;

  /**
   * Mostrar animación
   * @default true
   */
  animated?: boolean;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  gradientColors = ['#6366f1', '#a855f7'], // indigo-500 → purple-500
  backgroundColor = 'rgba(99, 102, 241, 0.1)',
  animationDuration = 700,
  animated = true,
}) => {
  const animatedProgress = useRef(new Animated.Value(0)).current;

  // Calcular dimensiones
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: animationDuration,
        useNativeDriver: true, // Usar native driver para mejor performance
      }).start();
    } else {
      animatedProgress.setValue(progress);
    }
  }, [progress, animated, animationDuration]);

  // Interpolar el strokeDashoffset basado en el progreso
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Definir gradiente lineal */}
        <Defs>
          <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Círculo de fondo (gris/transparente) */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Círculo de progreso con gradiente */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90" // Empezar desde arriba
          origin={`${center}, ${center}`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProgressCircle;
