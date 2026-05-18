/**
 * 💀 SkeletonLoader - Skeleton Premium con Shimmer
 *
 * Placeholder animado para estados de carga
 * Efecto shimmer fluido con Reanimated 3
 */

import React from 'react';
import {StyleSheet, View, ViewStyle, DimensionValue} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../../context/ThemeContext';
import {borderRadius as br} from '../../styles/designTokens';
import {useEffect} from 'react';

type SkeletonVariant =
  | 'text'
  | 'title'
  | 'avatar'
  | 'thumbnail'
  | 'card'
  | 'custom';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  shimmerColors?: string[];
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  borderRadius,
  style,
  shimmerColors,
}) => {
  const {isDarkMode} = useTheme();
  const shimmerValue = useSharedValue(0);

  // Iniciar animación de shimmer
  useEffect(() => {
    shimmerValue.value = withRepeat(withTiming(1, {duration: 1500}), -1, false);
  }, [shimmerValue]);

  // Estilo animado para el shimmer
  const animatedShimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-200, 200],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{translateX}],
    };
  });

  // Dimensiones según variante
  const getVariantDimensions = (): {
    width: number | string;
    height: number;
    borderRadius: number;
  } => {
    switch (variant) {
      case 'text':
        return {width: '100%', height: 16, borderRadius: br.xs};
      case 'title':
        return {width: '70%', height: 24, borderRadius: br.xs};
      case 'avatar':
        return {width: 48, height: 48, borderRadius: br.full};
      case 'thumbnail':
        return {width: 80, height: 80, borderRadius: br.md};
      case 'card':
        return {width: '100%', height: 120, borderRadius: br.lg};
      default:
        return {width: 100, height: 20, borderRadius: br.sm};
    }
  };

  const dimensions = getVariantDimensions();

  // Colores del shimmer
  const baseColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.06)';
  const shimmerColor = isDarkMode
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.8)';

  const gradientColors = shimmerColors || [baseColor, shimmerColor, baseColor];

  const containerStyle: ViewStyle = {
    width: (width ?? dimensions.width) as DimensionValue,
    height: height ?? dimensions.height,
    borderRadius: borderRadius ?? dimensions.borderRadius,
    backgroundColor: baseColor,
    overflow: 'hidden',
    ...style,
  };

  return (
    <View style={containerStyle}>
      <Animated.View style={[styles.shimmerContainer, animatedShimmerStyle]}>
        <LinearGradient
          colors={gradientColors as [string, string, ...string[]]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
};

// ==================== SkeletonGroup ====================
/**
 * Grupo de skeletons para layouts comunes
 */

interface SkeletonGroupProps {
  type: 'list-item' | 'card' | 'verse' | 'stats';
  count?: number;
}

export const SkeletonGroup: React.FC<SkeletonGroupProps> = ({
  type,
  count = 1,
}) => {
  const renderItem = (index: number) => {
    switch (type) {
      case 'list-item':
        return (
          <View key={index} style={styles.listItem}>
            <SkeletonLoader variant="avatar" />
            <View style={styles.listItemContent}>
              <SkeletonLoader variant="title" width="60%" />
              <View style={{height: 8}} />
              <SkeletonLoader variant="text" width="90%" />
            </View>
          </View>
        );

      case 'card':
        return (
          <View key={index} style={styles.card}>
            <SkeletonLoader variant="card" height={150} />
            <View style={styles.cardContent}>
              <SkeletonLoader variant="title" />
              <View style={{height: 8}} />
              <SkeletonLoader variant="text" />
              <View style={{height: 4}} />
              <SkeletonLoader variant="text" width="80%" />
            </View>
          </View>
        );

      case 'verse':
        return (
          <View key={index} style={styles.verse}>
            <SkeletonLoader variant="text" width="15%" height={14} />
            <View style={{height: 8}} />
            <SkeletonLoader variant="text" />
            <View style={{height: 4}} />
            <SkeletonLoader variant="text" />
            <View style={{height: 4}} />
            <SkeletonLoader variant="text" width="70%" />
          </View>
        );

      case 'stats':
        return (
          <View key={index} style={styles.stats}>
            <View style={styles.statItem}>
              <SkeletonLoader
                variant="custom"
                width={60}
                height={60}
                borderRadius={br.full}
              />
              <View style={{height: 8}} />
              <SkeletonLoader variant="text" width={50} height={12} />
            </View>
            <View style={styles.statItem}>
              <SkeletonLoader
                variant="custom"
                width={60}
                height={60}
                borderRadius={br.full}
              />
              <View style={{height: 8}} />
              <SkeletonLoader variant="text" width={50} height={12} />
            </View>
            <View style={styles.statItem}>
              <SkeletonLoader
                variant="custom"
                width={60}
                height={60}
                borderRadius={br.full}
              />
              <View style={{height: 8}} />
              <SkeletonLoader variant="text" width={50} height={12} />
            </View>
          </View>
        );

      default:
        return <SkeletonLoader key={index} />;
    }
  };

  return <View>{Array.from({length: count}, (_, i) => renderItem(i))}</View>;
};

const styles = StyleSheet.create({
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '200%',
  },
  shimmerGradient: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  listItemContent: {
    flex: 1,
  },
  card: {
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  verse: {
    padding: 16,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
});

export default SkeletonLoader;
