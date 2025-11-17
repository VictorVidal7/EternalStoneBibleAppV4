/**
 * ✨ PARTICLE SYSTEM
 *
 * Sistema de partículas para celebraciones y efectos visuales:
 * - Confetti explosions
 * - Floating particles
 * - Achievement celebrations
 * - Interactive effects
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleSystemProps {
  type?: 'confetti' | 'stars' | 'hearts' | 'sparkles';
  count?: number;
  duration?: number;
  colors?: string[];
  autoStart?: boolean;
  onComplete?: () => void;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  type = 'confetti',
  count = 30,
  duration = 3000,
  colors = ['#667eea', '#764ba2', '#f093fb', '#fbbf24', '#10b981'],
  autoStart = true,
  onComplete,
}) => {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (autoStart) {
      startAnimation();
    }
  }, [autoStart]);

  const startAnimation = () => {
    const animations = particles.map((particle, index) => {
      const delay = index * 50;
      const randomX = (Math.random() - 0.5) * SCREEN_WIDTH * 1.5;
      const randomY = -(Math.random() * SCREEN_HEIGHT * 0.8 + SCREEN_HEIGHT * 0.2);
      const randomRotate = Math.random() * 720 - 360;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          // Aparecer
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(particle.scale, {
            toValue: Math.random() * 0.5 + 0.5,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
          }),
          // Movimiento
          Animated.timing(particle.translateX, {
            toValue: randomX,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateY, {
            toValue: randomY,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(particle.rotate, {
            toValue: randomRotate,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
        // Desaparecer
        Animated.timing(particle.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start(() => {
      onComplete?.();
    });
  };

  const getIcon = (index: number) => {
    switch (type) {
      case 'stars':
        return 'star';
      case 'hearts':
        return 'heart';
      case 'sparkles':
        return 'sparkles';
      default:
        return ['star', 'heart', 'sparkles', 'diamond'][index % 4] as any;
    }
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => {
        const color = colors[index % colors.length];
        const icon = getIcon(index);

        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  {
                    rotate: particle.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                  { scale: particle.scale },
                ],
              },
            ]}
          >
            <Ionicons name={icon} size={24} color={color} />
          </Animated.View>
        );
      })}
    </View>
  );
};

// ==================== CONFETTI COMPONENT ====================

interface ConfettiProps {
  active?: boolean;
  onComplete?: () => void;
}

export const Confetti: React.FC<ConfettiProps> = ({ active = false, onComplete }) => {
  if (!active) return null;

  return (
    <ParticleSystem
      type="confetti"
      count={40}
      duration={2500}
      autoStart={active}
      onComplete={onComplete}
    />
  );
};

// ==================== ACHIEVEMENT CELEBRATION ====================

interface AchievementCelebrationProps {
  active?: boolean;
  achievementColor?: string;
  onComplete?: () => void;
}

export const AchievementCelebration: React.FC<AchievementCelebrationProps> = ({
  active = false,
  achievementColor = '#fbbf24',
  onComplete,
}) => {
  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Estrellas principales */}
      <ParticleSystem
        type="stars"
        count={20}
        duration={2000}
        colors={[achievementColor, '#ffffff', achievementColor]}
        autoStart={active}
      />

      {/* Sparkles secundarios */}
      <ParticleSystem
        type="sparkles"
        count={15}
        duration={2500}
        colors={[achievementColor]}
        autoStart={active}
        onComplete={onComplete}
      />
    </View>
  );
};

// ==================== FLOATING PARTICLES ====================

interface FloatingParticlesProps {
  count?: number;
  colors?: string[];
  speed?: 'slow' | 'normal' | 'fast';
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 10,
  colors = ['rgba(102, 126, 234, 0.3)', 'rgba(118, 75, 162, 0.3)'],
  speed = 'normal',
}) => {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    startContinuousAnimation();
  }, []);

  const getDuration = () => {
    switch (speed) {
      case 'slow':
        return 5000;
      case 'fast':
        return 2000;
      default:
        return 3500;
    }
  };

  const startContinuousAnimation = () => {
    particles.forEach((particle, index) => {
      const delay = index * 300;
      const randomX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.8;
      const randomY = -(Math.random() * SCREEN_HEIGHT * 0.5 + SCREEN_HEIGHT * 0.3);
      const baseDuration = getDuration();
      const duration = baseDuration + Math.random() * 1000;

      const animate = () => {
        particle.translateY.setValue(0);
        particle.translateX.setValue(0);
        particle.opacity.setValue(0);
        particle.scale.setValue(0);

        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
              Animated.timing(particle.opacity, {
                toValue: Math.random() * 0.5 + 0.3,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: Math.random() * 0.6 + 0.4,
                duration: 800,
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(particle.translateY, {
                toValue: randomY,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateX, {
                toValue: randomX,
                duration: duration,
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
          ])
        ).start();
      };

      animate();
    });
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => {
        const color = colors[index % colors.length];
        const size = Math.random() * 20 + 10;

        return (
          <Animated.View
            key={index}
            style={[
              styles.floatingParticle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: color,
                opacity: particle.opacity,
                transform: [
                  { translateX: particle.translateX },
                  { translateY: particle.translateY },
                  { scale: particle.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  particle: {
    position: 'absolute',
  },
  floatingParticle: {
    position: 'absolute',
  },
});
