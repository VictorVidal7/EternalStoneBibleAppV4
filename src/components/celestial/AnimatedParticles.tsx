import React, {useEffect, useMemo} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {useTheme, celestialTheme} from '../../hooks/useTheme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  type: 'star' | 'sparkle' | 'cross';
}

interface AnimatedParticlesProps {
  count?: number;
  height?: number;
  color?: string;
}

// Individual particle component
const ParticleItem = ({
  particle,
  color,
}: {
  particle: Particle;
  color: string;
}) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(0);

  useEffect(() => {
    // Fade in/out animation
    opacity.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(1, {
          duration: particle.duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );

    // Pulse scale animation
    scale.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(1.2, {
          duration: particle.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );

    // Float up animation
    translateY.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(-20, {
          duration: particle.duration * 2,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}, {translateY: translateY.value}],
  }));

  const renderParticle = () => {
    const baseSize = particle.size;

    switch (particle.type) {
      case 'star':
        return (
          <View
            style={[
              styles.star,
              {
                width: baseSize,
                height: baseSize,
                backgroundColor: color,
                shadowColor: color,
                shadowOpacity: 0.8,
                shadowRadius: baseSize,
              },
            ]}
          />
        );
      case 'sparkle':
        return (
          <View style={styles.sparkleContainer}>
            <View
              style={[
                styles.sparkleHorizontal,
                {
                  width: baseSize * 1.5,
                  height: 2,
                  backgroundColor: color,
                },
              ]}
            />
            <View
              style={[
                styles.sparkleVertical,
                {
                  width: 2,
                  height: baseSize * 1.5,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
        );
      case 'cross':
        return (
          <View
            style={[
              styles.cross,
              {
                width: baseSize,
                height: baseSize,
                borderColor: color,
                borderWidth: 1,
              },
            ]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x,
          top: particle.y,
        },
        animatedStyle,
      ]}>
      {renderParticle()}
    </Animated.View>
  );
};

export const AnimatedParticles: React.FC<AnimatedParticlesProps> = ({
  count = celestialTheme.particles.count,
  height = 200,
  color,
}) => {
  const {gradient, isDark} = useTheme();
  const particleColor = color || (isDark ? '#fbbf24' : gradient.accentGlow);

  // Generate particles with random positions
  const particles = useMemo<Particle[]>(() => {
    const types: Particle['type'][] = ['star', 'sparkle', 'cross'];
    return Array.from({length: count}, (_, i) => ({
      id: i,
      x: Math.random() * (SCREEN_WIDTH - 20),
      y: Math.random() * (height - 20),
      size:
        celestialTheme.particles.minSize +
        Math.random() *
          (celestialTheme.particles.maxSize - celestialTheme.particles.minSize),
      delay: Math.random() * 2000,
      duration: 2000 + Math.random() * 2000,
      type: types[Math.floor(Math.random() * types.length)],
    }));
  }, [count, height]);

  return (
    <View style={[styles.container, {height}]} pointerEvents="none">
      {particles.map(particle => (
        <ParticleItem
          key={particle.id}
          particle={particle}
          color={particleColor}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
  star: {
    borderRadius: 50,
    shadowOffset: {width: 0, height: 0},
    elevation: 5,
  },
  sparkleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleHorizontal: {
    position: 'absolute',
    borderRadius: 1,
  },
  sparkleVertical: {
    position: 'absolute',
    borderRadius: 1,
  },
  cross: {
    borderRadius: 2,
    transform: [{rotate: '45deg'}],
  },
});

export default AnimatedParticles;
