/**
 * ✨ PREMIUM SKELETON - Skeleton Loader de Lujo
 *
 * Skeleton loaders con animación shimmer suave y profesional
 * - Gradiente animado
 * - Múltiples variantes
 * - Completamente personalizable
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, ViewStyle} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../hooks/useTheme';
import {borderRadius, spacing} from '../styles/designTokens';

interface PremiumSkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

export const PremiumSkeleton: React.FC<PremiumSkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius: customBorderRadius,
  style,
  variant = 'text',
  animation = 'wave',
}) => {
  const {colors, isDark} = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animation === 'wave') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else if (animation === 'pulse') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [animation]);

  const getBorderRadius = () => {
    if (customBorderRadius !== undefined) return customBorderRadius;
    switch (variant) {
      case 'circular':
        return 9999;
      case 'rounded':
        return borderRadius.lg;
      case 'rectangular':
        return borderRadius.xs;
      case 'text':
      default:
        return borderRadius.sm;
    }
  };

  const getSkeletonColors = () => {
    if (isDark) {
      return {
        base: 'rgba(255, 255, 255, 0.05)',
        highlight: 'rgba(255, 255, 255, 0.10)',
        shimmer: 'rgba(255, 255, 255, 0.08)',
      };
    } else {
      return {
        base: 'rgba(0, 0, 0, 0.06)',
        highlight: 'rgba(0, 0, 0, 0.08)',
        shimmer: 'rgba(255, 255, 255, 0.5)',
      };
    }
  };

  const skeletonColors = getSkeletonColors();

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height: variant === 'circular' ? width : height,
          borderRadius: getBorderRadius(),
          backgroundColor: skeletonColors.base,
          overflow: 'hidden',
        },
        style,
      ]}>
      {animation === 'wave' && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{translateX}],
            },
          ]}>
          <LinearGradient
            colors={[
              'transparent',
              skeletonColors.shimmer,
              skeletonColors.shimmer,
              'transparent',
            ]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      )}
      {animation === 'pulse' && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: skeletonColors.highlight,
              opacity,
            },
          ]}
        />
      )}
    </View>
  );
};

// ==================== PRESET COMPONENTS ====================

/**
 * Skeleton para texto (una línea)
 */
export const SkeletonText: React.FC<{
  width?: number | string;
  style?: ViewStyle;
}> = ({width = '100%', style}) => (
  <PremiumSkeleton width={width} height={16} variant="text" style={style} />
);

/**
 * Skeleton para título
 */
export const SkeletonTitle: React.FC<{
  width?: number | string;
  style?: ViewStyle;
}> = ({width = '60%', style}) => (
  <PremiumSkeleton width={width} height={28} variant="rounded" style={style} />
);

/**
 * Skeleton para avatar circular
 */
export const SkeletonAvatar: React.FC<{
  size?: number;
  style?: ViewStyle;
}> = ({size = 48, style}) => (
  <PremiumSkeleton
    width={size}
    height={size}
    variant="circular"
    style={style}
  />
);

/**
 * Skeleton para botón
 */
export const SkeletonButton: React.FC<{
  width?: number | string;
  style?: ViewStyle;
}> = ({width = 120, style}) => (
  <PremiumSkeleton width={width} height={44} variant="rounded" style={style} />
);

/**
 * Skeleton para card completo
 */
export const SkeletonCard: React.FC<{style?: ViewStyle}> = ({style}) => {
  return (
    <View
      style={[
        styles.cardContainer,
        {
          padding: spacing.lg,
          borderRadius: borderRadius.xl,
        },
        style,
      ]}>
      <View style={styles.cardHeader}>
        <SkeletonAvatar size={40} />
        <View style={styles.cardHeaderText}>
          <SkeletonText width="70%" style={{marginBottom: spacing.xs}} />
          <SkeletonText width="50%" />
        </View>
      </View>
      <View style={{marginTop: spacing.lg}}>
        <SkeletonText width="100%" style={{marginBottom: spacing.xs}} />
        <SkeletonText width="95%" style={{marginBottom: spacing.xs}} />
        <SkeletonText width="85%" />
      </View>
    </View>
  );
};

/**
 * Skeleton para lista de versículos
 */
export const SkeletonVerseList: React.FC<{count?: number}> = ({count = 3}) => {
  return (
    <View>
      {Array.from({length: count}).map((_, index) => (
        <View
          key={index}
          style={[
            styles.verseItem,
            {
              marginBottom: spacing.md,
              padding: spacing.md,
              borderRadius: borderRadius.lg,
            },
          ]}>
          <View style={styles.verseHeader}>
            <SkeletonText width={60} style={{marginBottom: spacing.sm}} />
          </View>
          <SkeletonText width="100%" style={{marginBottom: spacing.xs}} />
          <SkeletonText width="95%" style={{marginBottom: spacing.xs}} />
          <SkeletonText width="80%" />
        </View>
      ))}
    </View>
  );
};

/**
 * Skeleton para grid de libros de la Biblia
 */
export const SkeletonBookGrid: React.FC<{count?: number}> = ({count = 6}) => {
  return (
    <View style={styles.bookGrid}>
      {Array.from({length: count}).map((_, index) => (
        <View
          key={index}
          style={[
            styles.bookItem,
            {
              padding: spacing.md,
              borderRadius: borderRadius.lg,
              marginBottom: spacing.sm,
            },
          ]}>
          <SkeletonText width="80%" style={{marginBottom: spacing.xs}} />
          <SkeletonText width="50%" />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  shimmer: {
    width: 100,
    height: '100%',
  },
  shimmerGradient: {
    width: 300,
    height: '100%',
  },
  cardContainer: {
    backgroundColor: 'transparent',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  verseItem: {
    backgroundColor: 'transparent',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookItem: {
    width: '48%',
    backgroundColor: 'transparent',
  },
});

export default PremiumSkeleton;
