/**
 * 🏆 ACHIEVEMENT CARD COMPONENT
 *
 * Tarjeta visual para mostrar logros con raridades
 * Soporta ambos sistemas de logros (types.ts y expandedDefinitions.ts)
 * Para la gloria de Dios y del Rey Jesús
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {
  Achievement as ExpandedAchievement,
  AchievementRarity,
  getRarityInfo,
  RARITY_COLORS,
} from '../../lib/achievements/expandedDefinitions';
import {
  Achievement as BaseAchievement,
  AchievementTier,
} from '../../lib/achievements/types';
import {getLocalizedAchievement} from '../../lib/achievements/definitions';
import {useTheme} from '../../hooks/useTheme';
import {staticColors} from '../../styles/designTokens';
import {useLanguage} from '../../hooks/useLanguage';

// ==================== TYPE COMPATIBILITY ====================

/**
 * Union type to support both achievement systems
 */
type AnyAchievement = ExpandedAchievement | BaseAchievement;

/**
 * Map tier (from types.ts) to rarity (from expandedDefinitions.ts)
 */
const tierToRarity: Record<AchievementTier, AchievementRarity> = {
  [AchievementTier.BRONZE]: 'common',
  [AchievementTier.SILVER]: 'uncommon',
  [AchievementTier.GOLD]: 'rare',
  [AchievementTier.PLATINUM]: 'epic',
  [AchievementTier.DIAMOND]: 'legendary',
};

/**
 * Helper to get rarity from any achievement type
 */
function getAchievementRarity(achievement: AnyAchievement): AchievementRarity {
  // Check for rarity field (expandedDefinitions format)
  if ('rarity' in achievement && achievement.rarity) {
    return achievement.rarity;
  }
  // Check for tier field (types.ts format)
  if ('tier' in achievement && achievement.tier) {
    return tierToRarity[achievement.tier] || 'common';
  }
  // Default fallback
  return 'common';
}

/**
 * Helper to check if rarity is high (for glow effects)
 */
function isHighRarity(rarity: AchievementRarity): boolean {
  return rarity === 'legendary' || rarity === 'epic';
}

/**
 * Helper to get reward from any achievement type
 */
function getAchievementReward(achievement: AnyAchievement) {
  if ('reward' in achievement && achievement.reward) {
    return achievement.reward;
  }
  return null;
}

// ==================== COMPONENT ====================

interface AchievementCardProps {
  achievement: AnyAchievement;
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
  const {t} = useLanguage();

  // Get normalized values that work with both achievement types
  const rarity = getAchievementRarity(achievement);
  const localized = getLocalizedAchievement(achievement, t);
  const title = localized.name;
  const reward = getAchievementReward(achievement);

  // Get rarity info and colors (now safe since rarity is guaranteed)
  const rarityInfo = getRarityInfo(rarity, isDark);
  const rarityColors = RARITY_COLORS[rarity];

  return (
    <View
      style={[
        styles.container,
        compact && styles.containerCompact,
        unlocked ? styles.cardUnlocked : styles.cardLocked,
        {
          backgroundColor: isDark
            ? staticColors.grayNeutral
            : staticColors.white,
          borderColor: unlocked ? rarityInfo.color : colors.border,
        },
      ]}>
      {/* Glow effect for unlocked legendary/epic */}
      {unlocked && isHighRarity(rarity) && (
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
        {/* Achievement icons are emoji (see definitions.ts), so they must be
            rendered as Text — passing them to <Ionicons name> yields the
            font's missing-glyph "?" (this is how AchievementUnlockedModal
            already renders them). */}
        <Text
          style={[
            styles.iconEmoji,
            compact && styles.iconEmojiCompact,
            !unlocked && styles.iconEmojiLocked,
          ]}
          allowFontScaling={false}>
          {achievement.icon}
        </Text>
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
            {title}
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
              {t.achievements.rarities[rarity]}
            </Text>
          </View>
        </View>

        {/* Description */}
        {!compact && (
          <Text
            style={[styles.description, {color: colors.textSecondary}]}
            numberOfLines={2}>
            {localized.description}
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

          {unlocked && reward && (
            <View style={styles.rewardBadge}>
              <Ionicons name="gift" size={14} color={rarityInfo.color} />
              <Text style={[styles.rewardText, {color: rarityInfo.color}]}>
                {reward.name}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardUnlocked: {borderWidth: 2, opacity: 1},
  cardLocked: {borderWidth: 1, opacity: 0.6},
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: staticColors.black,
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
  iconEmoji: {
    fontSize: 30,
  },
  iconEmojiCompact: {
    fontSize: 22,
  },
  iconEmojiLocked: {
    opacity: 0.45,
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
