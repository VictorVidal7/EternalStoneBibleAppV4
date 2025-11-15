/**
 * 🎬 SPLASH SCREEN COMPONENT
 *
 * Pantalla de bienvenida impresionante con:
 * - Animaciones fluidas
 * - Gradientes dinámicos
 * - Logo animado
 * - Transiciones suaves
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, borderRadius } from '../styles/designTokens';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  duration = 2500,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Secuencia de animaciones
    Animated.sequence([
      // Logo aparece con escala
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      // Rotación sutil del icono
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Texto aparece desde abajo
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Esperar un poco y llamar onComplete
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          onComplete?.();
        });
      }, 800);
    });
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Círculo de fondo con glassmorphism */}
          <View style={styles.circle}>
            <Animated.View
              style={{
                transform: [{ rotate: spin }],
              }}
            >
              <Ionicons name="book" size={80} color="#ffffff" />
            </Animated.View>
          </View>

          {/* Título y subtítulo */}
          <Animated.View
            style={{
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            }}
          >
            <Text style={styles.title}>Eternal Bible</Text>
            <Text style={styles.subtitle}>Tu compañero espiritual diario</Text>
          </Animated.View>

          {/* Puntos de carga animados */}
          <View style={styles.dotsContainer}>
            <AnimatedDot delay={0} />
            <AnimatedDot delay={150} />
            <AnimatedDot delay={300} />
          </View>
        </Animated.View>

        {/* Decoración de estrellas */}
        <View style={styles.starsContainer}>
          {[...Array(20)].map((_, i) => (
            <AnimatedStar key={i} index={i} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// Componente de punto animado
const AnimatedDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
};

// Componente de estrella animada
const AnimatedStar: React.FC<{ index: number }> = ({ index }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: Math.random() * 0.5 + 0.3,
            duration: 1000 + Math.random() * 1000,
            delay: index * 100,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            delay: index * 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const size = Math.random() * 3 + 2;
  const top = Math.random() * height;
  const left = Math.random() * width;

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top,
          left,
          width: size,
          height: size,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    fontSize: fontSize['4xl'],
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
});

export default SplashScreen;
