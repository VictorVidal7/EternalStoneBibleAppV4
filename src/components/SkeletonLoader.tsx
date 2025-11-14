/**
 * SkeletonLoader - Componentes de skeleton screen para estados de carga
 * Proporciona feedback visual mientras se cargan los datos
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface SkeletonProps {
  /** Ancho del skeleton */
  width?: number | string;

  /** Alto del skeleton */
  height?: number | string;

  /** Radio de borde */
  borderRadius?: number;

  /** Estilos personalizados */
  style?: ViewStyle;

  /** Variante del skeleton */
  variant?: 'text' | 'circular' | 'rectangular';
}

/**
 * Skeleton básico con animación de shimmer
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  variant = 'rectangular',
}) => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'circular':
        return {
          width: typeof width === 'number' ? width : 40,
          height: typeof height === 'number' ? height : 40,
          borderRadius: typeof width === 'number' ? width / 2 : 20,
        };
      case 'text':
        return {
          width,
          height,
          borderRadius: height as number / 2,
        };
      default:
        return {
          width,
          height,
          borderRadius,
        };
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { backgroundColor: colors.border, opacity },
        getVariantStyles(),
        style,
      ]}
    />
  );
};

/**
 * Skeleton para un item de libro en la lista
 */
export const BookItemSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.bookItem, { borderBottomColor: colors.border }]}>
      <Skeleton variant="circular" width={24} height={24} style={{ marginRight: 16 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="60%" height={16} />
      </View>
      <Skeleton variant="circular" width={24} height={24} />
    </View>
  );
};

/**
 * Skeleton para la lista de libros bíblicos
 */
export const BibleListSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Skeleton width={200} height={18} />
      </View>
      {Array.from({ length: count }).map((_, index) => (
        <BookItemSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton para grid de capítulos
 */
export const ChapterGridSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.chapterItem}>
          <Skeleton width={60} height={60} borderRadius={8} />
        </View>
      ))}
    </View>
  );
};

/**
 * Skeleton para versículos
 */
export const VerseSkeleton: React.FC = () => {
  return (
    <View style={styles.verseContainer}>
      <Skeleton variant="circular" width={24} height={24} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="90%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
};

/**
 * Skeleton para lista de versículos
 */
export const VerseListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <VerseSkeleton key={index} />
      ))}
    </View>
  );
};

/**
 * Skeleton para tarjeta de logro
 */
export const AchievementCardSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.achievementCard, { backgroundColor: colors.card }]}>
      <Skeleton variant="circular" width={60} height={60} style={{ marginBottom: 12 }} />
      <Skeleton width="80%" height={18} style={{ marginBottom: 8 }} />
      <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={12} />
    </View>
  );
};

/**
 * Skeleton para estadísticas
 */
export const StatsSkeleton: React.FC = () => {
  return (
    <View style={styles.statsContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.statItem}>
          <Skeleton width={60} height={32} style={{ marginBottom: 8 }} />
          <Skeleton width={80} height={14} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  container: {
    flex: 1,
  },
  sectionHeader: {
    padding: 16,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  chapterItem: {
    margin: 8,
  },
  verseContainer: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
  },
  achievementCard: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
    margin: 8,
  },
});

export default Skeleton;
