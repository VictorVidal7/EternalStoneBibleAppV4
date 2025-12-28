import React, {useEffect} from 'react';
import {View, StyleSheet, Dimensions, ViewStyle, StyleProp} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../../hooks/useTheme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface ShimmerEffectProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shimmerColor?: string;
  duration?: number;
  delay?: number;
  enabled?: boolean;
}

export const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  children,
  style,
  shimmerColor,
  duration = 3000,
  delay = 0,
  enabled = true,
}) => {
  const {gradient} = useTheme();
  const translateX = useSharedValue(-SCREEN_WIDTH);

  const defaultShimmerColor = shimmerColor || gradient.accentGlow;

  useEffect(() => {
    if (enabled) {
      translateX.value = withDelay(
        delay,
        withRepeat(
          withTiming(SCREEN_WIDTH * 2, {
            duration,
            easing: Easing.inOut(Easing.ease),
          }),
          -1,
          false,
        ),
      );
    }
  }, [enabled, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
  }));

  if (!enabled) {
    return <View style={style}>{children}</View>;
  }

  return (
    <View style={[styles.container, style]}>
      {children}
      <Animated.View style={[styles.shimmerContainer, animatedStyle]}>
        <LinearGradient
          colors={
            [
              'transparent',
              `${defaultShimmerColor}20`,
              `${defaultShimmerColor}40`,
              `${defaultShimmerColor}20`,
              'transparent',
            ] as const
          }
          start={{x: 0, y: 0.5}}
          end={{x: 1, y: 0.5}}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// Shimmer wrapper for cards with glow effect
interface ShimmerCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  showGlow?: boolean;
}

export const ShimmerCard: React.FC<ShimmerCardProps> = ({
  children,
  style,
  glowColor,
  showGlow = true,
}) => {
  const {gradient, isDark} = useTheme();
  const glowOpacity = useSharedValue(0.3);

  const effectiveGlowColor = glowColor || gradient.accentGlow;

  useEffect(() => {
    if (showGlow) {
      glowOpacity.value = withRepeat(
        withTiming(0.6, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      );
    }
  }, [showGlow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.cardContainer, style]}>
      {/* Glow effect behind card */}
      {showGlow && (
        <Animated.View
          style={[
            styles.cardGlow,
            {
              backgroundColor: effectiveGlowColor,
              shadowColor: effectiveGlowColor,
            },
            glowStyle,
          ]}
        />
      )}

      {/* Card content with shimmer */}
      <ShimmerEffect
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? 'rgba(26, 29, 46, 0.85)'
              : 'rgba(255, 255, 255, 0.95)',
            borderColor: isDark
              ? 'rgba(99, 102, 241, 0.2)'
              : 'rgba(79, 70, 229, 0.15)',
          },
        ]}
        shimmerColor={effectiveGlowColor}
        duration={4000}
        delay={1000}>
        {children}
      </ShimmerEffect>
    </View>
  );
};

// Pulsing glow effect for badges/icons
interface PulsingGlowProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const PulsingGlow: React.FC<PulsingGlowProps> = ({
  children,
  color,
  size = 60,
  style,
}) => {
  const {gradient} = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  const glowColor = color || gradient.accentGlow;

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.3, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );

    opacity.value = withRepeat(
      withTiming(0.2, {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.pulsingContainer, style]}>
      <Animated.View
        style={[
          styles.pulsingGlow,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: glowColor,
          },
          animatedGlowStyle,
        ]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  cardContainer: {
    position: 'relative',
  },
  cardGlow: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    bottom: -5,
    borderRadius: 24,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pulsingContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsingGlow: {
    position: 'absolute',
  },
});

export default ShimmerEffect;
