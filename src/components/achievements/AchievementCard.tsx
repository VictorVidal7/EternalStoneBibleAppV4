/**
 * Tarjeta de Logro con animación y diseño moderno
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Achievement, ACHIEVEMENT_TIER_COLORS } from '../../lib/achievements/types';
import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, fontSize, shadows } from '../../styles/designTokens';

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: (achievement: Achievement) => void;
  showProgress?: boolean;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  showProgress = true,
}) => {
  const { colors, isDark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animar progreso
    Animated.spring(progressAnim, {
      toValue: achievement.isUnlocked
        ? 1
        : achievement.currentProgress / achievement.requirement,
      useNativeDriver: false,
      friction: 5,
    }).start();
  }, [achievement.currentProgress, achievement.isUnlocked]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const tierColor = ACHIEVEMENT_TIER_COLORS[achievement.tier];
  const progress = achievement.isUnlocked
    ? 100
    : Math.min(100, (achievement.currentProgress / achievement.requirement) * 100);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={() => onPress?.(achievement)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: achievement.isUnlocked
              ? (isDark ? colors.primary + '15' : colors.primary + '08')
              : colors.card,
            borderColor: achievement.isUnlocked ? tierColor : colors.border,
          },
          achievement.isUnlocked && styles.cardUnlocked,
          !achievement.isUnlocked && (isDark ? shadows.md : shadows.sm),
          achievement.isUnlocked && shadows.md,
        ]}
      >
        {/* Icono del logro */}
        <View style={[styles.iconContainer, { backgroundColor: tierColor + '20' }]}>
          <Text style={[styles.icon, !achievement.isUnlocked && styles.iconLocked]}>
            {achievement.icon}
          </Text>
        </View>

        {/* Información */}
        <View style={styles.info}>
          <Text style={[
            styles.name,
            { color: achievement.isUnlocked ? colors.primary : colors.text }
          ]}>
            {achievement.name}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
            {achievement.description}
          </Text>

          {/* Barra de progreso */}
          {showProgress && !achievement.isUnlocked && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: tierColor,
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textTertiary }]}>
                {achievement.currentProgress}/{achievement.requirement}
              </Text>
            </View>
          )}

          {/* Puntos */}
          <View style={styles.footer}>
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Text style={styles.tierText}>{achievement.tier.toUpperCase()}</Text>
            </View>
            <Text style={[styles.points, { color: colors.secondary }]}>
              +{achievement.points} pts
            </Text>
          </View>
        </View>

        {/* Badge de desbloqueado */}
        {achievement.isUnlocked && (
          <View style={[styles.unlockedBadge, { backgroundColor: colors.secondary }]}>
            <Text style={styles.unlockedText}>✓</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1.5,
  },
  cardUnlocked: {},
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    fontSize: 32,
  },
  iconLocked: {
    opacity: 0.4,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: fontSize.base,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  progressText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  tierBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing['0.5'],
    borderRadius: borderRadius.sm,
  },
  tierText: {
    fontSize: fontSize['2xs'],
    fontWeight: '700',
    color: '#FFFFFF',
  },
  points: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  unlockedBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
