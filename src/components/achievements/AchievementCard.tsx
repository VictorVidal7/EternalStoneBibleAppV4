/**
 * 🏆 ACHIEVEMENT CARD COMPONENT
 *
 * Tarjeta visual para mostrar logros con raridades
 * Para la gloria de Dios y del Rey Jesús
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {
  Achievement,
  getRarityInfo,
  RARITY_COLORS,
} from '../../lib/achievements/expandedDefinitions';
import {useTheme} from '../../hooks/useTheme';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number;
  compact?: boolean;
}

export function AchievementCard({
  achievement,
  unlocked,
  progress = 0,
  compact = false,
}: AchievementCardProps) {
  const {isDark, colors} = useTheme();
  const rarityInfo = getRarityInfo(achievement.rarity, isDark);
  const rarityColors = RARITY_COLORS[achievement.rarity];

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderColor: unlocked ? rarityInfo.color : colors.border,
          borderWidth: unlocked ? 2 : 1,
          opacity: unlocked ? 1 : 0.6,
        },
      ]}>
      {/* Glow effect for unlocked legendary/epic */}
      {unlocked &&
        (achievement.rarity === 'legendary' ||
          achievement.rarity === 'epic') && (
          <View
            style={[
              styles.glowEffect,
              {
                backgroundColor: rarityColors.glow,
                shadowColor: rarityInfo.color,
              },
            ]}
          />
        )}

      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: unlocked
              ? rarityInfo.color + '20'
              : colors.surface,
          },
        ]}>
        <Ionicons
          name={achievement.icon as any}
          size={compact ? 24 : 32}
          color={unlocked ? rarityInfo.color : colors.textTertiary}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title and Rarity */}
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              compact && styles.titleCompact,
              {color: unlocked ? colors.text : colors.textSecondary},
            ]}
            numberOfLines={1}>
            {achievement.title}
          </Text>
          <View
            style={[
              styles.rarityBadge,
              {
                backgroundColor: rarityInfo.color + '20',
                borderColor: rarityInfo.color,
              },
            ]}>
            <Text style={[styles.rarityText, {color: rarityInfo.color}]}>
              {rarityInfo.label}
            </Text>
          </View>
        </View>

        {/* Description */}
        {!compact && (
          <Text
            style={[styles.description, {color: colors.textSecondary}]}
            numberOfLines={2}>
            {achievement.description}
          </Text>
        )}

        {/* Progress Bar (if not unlocked) */}
        {!unlocked && progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBg, {backgroundColor: colors.border}]}>
              <LinearGradient
                colors={rarityColors.gradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={[styles.progressFill, {width: `${progress}%`}]}
              />
            </View>
            <Text style={[styles.progressText, {color: colors.textTertiary}]}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}

        {/* Points and Reward */}
        <View style={styles.footer}>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={14} color="#fbbf24" />
            <Text style={[styles.pointsText, {color: colors.textSecondary}]}>
              {achievement.points} pts
            </Text>
          </View>

          {unlocked && achievement.reward && (
            <View style={styles.rewardBadge}>
              <Ionicons name="gift" size={14} color={rarityInfo.color} />
              <Text style={[styles.rewardText, {color: rarityInfo.color}]}>
                {achievement.reward.name}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  containerCompact: {
    padding: 12,
    marginBottom: 8,
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  titleCompact: {
    fontSize: 14,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
