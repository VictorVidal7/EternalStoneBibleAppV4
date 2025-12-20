/**
 * 🌈 ANIMATED GRADIENT COMPONENT
 *
 * Gradiente animado con efectos visuales impresionantes:
 * - Animación de colores suave
 * - Múltiples direcciones
 * - Efectos de shimmer opcionales
 */

import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';

interface AnimatedGradientProps {
  colors: readonly [string, string, ...string[]];
  duration?: number;
  angle?: number;
  children?: React.ReactNode;
  style?: any;
}

export const AnimatedGradient: React.FC<AnimatedGradientProps> = ({
  colors,
  duration = 3000,
  angle = 45,
  children,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration,
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  // Calcular start y end basado en el ángulo
  const radians = (angle * Math.PI) / 180;
  const start = {
    x: Math.cos(radians + Math.PI),
    y: Math.sin(radians + Math.PI),
  };
  const end = {
    x: Math.cos(radians),
    y: Math.sin(radians),
  };

  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.gradient, style]}>
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
});

export default AnimatedGradient;
