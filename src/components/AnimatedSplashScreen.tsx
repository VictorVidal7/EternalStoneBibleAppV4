/**
 * 🎨 ANIMATED SPLASH SCREEN - PREMIUM
 *
 * Splash screen impresionante con:
 * - Gradientes animados
 * - Partículas flotantes
 * - Animaciones de texto suaves
 * - Progress bar elegante
 * - Transición fluida
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  loadingProgress: { loaded: number; total: number };
  message?: string;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  loadingProgress,
  message,
}) => {
  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Partículas
  const particles = useRef(
    Array.from({ length: 20 }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Animación principal
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(slideUpAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Rotación continua del ícono
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();

    // Pulso continuo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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

    // Animar partículas
    particles.forEach((particle, index) => {
      const delay = index * 100;
      const randomX = (Math.random() - 0.5) * SCREEN_WIDTH;
      const randomY = -(Math.random() * SCREEN_HEIGHT * 0.8 + 200);

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: Math.random() * 0.6 + 0.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: Math.random() * 0.8 + 0.5,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.translateY, {
              toValue: randomY,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateX, {
              toValue: randomX,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(particle.scale, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(particle.translateY, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateX, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    });
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progress =
    loadingProgress.total > 0
      ? (loadingProgress.loaded / loadingProgress.total) * 100
      : 0;

  return (
    <View style={styles.container}>
      {/* Gradiente de fondo */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Partículas flotantes */}
      <View style={styles.particlesContainer}>
        {particles.map((particle, index) => (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  { scale: particle.scale },
                ],
              },
            ]}
          >
            <Ionicons
              name={
                ['star', 'sparkles', 'heart', 'moon'][index % 4] as any
              }
              size={16}
              color="rgba(255,255,255,0.8)"
            />
          </Animated.View>
        ))}
      </View>

      {/* Contenido principal */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: slideUpAnim },
            ],
          },
        ]}
      >
        {/* Logo con rotación */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [
                { rotate: rotateInterpolate },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          <View style={styles.logoCircle}>
            <Ionicons name="book" size={64} color="#ffffff" />
          </View>
        </Animated.View>

        {/* Título */}
        <Text style={styles.title}>Eternal Bible</Text>
        <Text style={styles.subtitle}>La Palabra que transforma vidas</Text>

        {/* Progress container */}
        <View style={styles.progressContainer}>
          {loadingProgress.total > 0 ? (
            <>
              <Text style={styles.progressText}>
                Cargando versículos...
              </Text>
              <Text style={styles.progressNumbers}>
                {loadingProgress.loaded.toLocaleString()} /{' '}
                {loadingProgress.total.toLocaleString()}
              </Text>

              {/* Barra de progreso premium */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      { width: `${progress}%` },
                    ]}
                  >
                    <LinearGradient
                      colors={['#fbbf24', '#f59e0b', '#d97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  </Animated.View>
                </View>
                <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              </View>
            </>
          ) : (
            <View style={styles.loadingIndicator}>
              <Animated.View
                style={{
                  transform: [{ rotate: rotateInterpolate }],
                }}
              >
                <Ionicons name="sync" size={32} color="#ffffff" />
              </Animated.View>
              <Text style={styles.preparingText}>
                {message || 'Preparando la aplicación...'}
              </Text>
            </View>
          )}
        </View>

        {/* Versículo inspirador */}
        <View style={styles.verseContainer}>
          <Text style={styles.verseText}>
            "Lámpara es a mis pies tu palabra,{'\n'}y lumbrera a mi camino."
          </Text>
          <Text style={styles.verseReference}>— Salmos 119:105</Text>
        </View>
      </Animated.View>

      {/* Decoración inferior */}
      <View style={styles.bottomDecoration}>
        <View style={styles.decorationDot} />
        <View style={styles.decorationDot} />
        <View style={styles.decorationDot} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particlesContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 60,
    fontStyle: 'italic',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 48,
  },
  progressText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
    fontWeight: '600',
  },
  progressNumbers: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 16,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingIndicator: {
    alignItems: 'center',
  },
  preparingText: {
    fontSize: 16,
    color: '#ffffff',
    marginTop: 16,
    fontWeight: '500',
  },
  verseContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  verseText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verseReference: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 8,
  },
  decorationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
