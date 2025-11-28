/**
 * 🎯 MISSION WIDGET
 *
 * Widget que muestra la misión activa del día
 * Diseño enfocado en motivar al usuario a completar sus objetivos
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {widgetTaskHandler, MissionWidgetData} from './WidgetTaskHandler';
import {useTheme} from '../hooks/useTheme';

interface MissionWidgetProps {
  userId: string;
  onPress?: (missionId?: string) => void;
}

export const MissionWidget: React.FC<MissionWidgetProps> = ({
  userId,
  onPress,
}) => {
  const {colors, isDark} = useTheme();
  const [missionData, setMissionData] = useState<MissionWidgetData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMission();
  }, [userId]);

  const loadMission = async () => {
    try {
      setLoading(true);
      const data = await widgetTaskHandler.getActiveMission(userId);
      setMissionData(data);
    } catch (error) {
      console.error('Error loading mission widget:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.surface}]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!missionData) {
    return (
      <View style={[styles.container, {backgroundColor: colors.surface}]}>
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={40} color={colors.success} />
          <Text style={[styles.emptyText, {color: colors.text}]}>
            ¡Todas las misiones completadas!
          </Text>
        </View>
      </View>
    );
  }

  const progressPercentage = Math.min(
    100,
    (missionData.progress / missionData.target) * 100,
  );

  const getDifficultyColor = () => {
    switch (missionData.difficulty) {
      case 'easy':
        return '#22C55E';
      case 'medium':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return colors.primary;
    }
  };

  const getDifficultyLabel = () => {
    switch (missionData.difficulty) {
      case 'easy':
        return 'Fácil';
      case 'medium':
        return 'Medio';
      case 'hard':
        return 'Difícil';
      default:
        return '';
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expiresAt = new Date(missionData.expiresAt);
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const gradientColors = isDark
    ? ['#064E3B', '#065F46', '#047857']
    : ['#D1FAE5', '#A7F3D0', '#6EE7B7'];

  const isCompleted = missionData.progress >= missionData.target;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.()}
      activeOpacity={0.9}>
      <LinearGradient
        colors={gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Ionicons name="trophy" size={20} color={colors.warning} />
            <Text style={[styles.headerText, {color: colors.text}]}>
              Misión del Día
            </Text>
          </View>
          <View
            style={[
              styles.difficultyBadge,
              {backgroundColor: getDifficultyColor()},
            ]}>
            <Text style={styles.difficultyText}>{getDifficultyLabel()}</Text>
          </View>
        </View>

        {/* Mission Title */}
        <Text
          style={[styles.missionTitle, {color: colors.text}]}
          numberOfLines={2}>
          {missionData.title}
        </Text>

        {/* Description */}
        <Text
          style={[styles.missionDescription, {color: colors.textSecondary}]}
          numberOfLines={2}>
          {missionData.description}
        </Text>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, {color: colors.textSecondary}]}>
              Progreso
            </Text>
            <Text style={[styles.progressValue, {color: colors.text}]}>
              {missionData.progress}/{missionData.target}
            </Text>
          </View>
          <View
            style={[
              styles.progressBar,
              {backgroundColor: 'rgba(0, 0, 0, 0.1)'},
            ]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: isCompleted ? '#22C55E' : colors.accent,
                },
              ]}>
              {isCompleted && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
              )}
            </View>
          </View>
          <Text style={[styles.progressPercent, {color: colors.textTertiary}]}>
            {Math.round(progressPercentage)}% completado
          </Text>
        </View>

        {/* Rewards */}
        <View style={styles.rewardsSection}>
          <Text style={[styles.rewardsLabel, {color: colors.textSecondary}]}>
            Recompensas:
          </Text>
          <View style={styles.rewardsList}>
            {missionData.reward.xp > 0 && (
              <View style={styles.rewardItem}>
                <Ionicons name="star" size={14} color="#FCD34D" />
                <Text style={[styles.rewardText, {color: colors.text}]}>
                  +{missionData.reward.xp} XP
                </Text>
              </View>
            )}
            {missionData.reward.coins > 0 && (
              <View style={styles.rewardItem}>
                <Ionicons name="cash" size={14} color="#F59E0B" />
                <Text style={[styles.rewardText, {color: colors.text}]}>
                  +{missionData.reward.coins} monedas
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Time Remaining */}
        <View style={styles.timerSection}>
          <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.timerText, {color: colors.textTertiary}]}>
            Expira en {getTimeRemaining()}
          </Text>
        </View>

        {/* CTA */}
        {isCompleted ? (
          <View style={[styles.ctaCompleted, {backgroundColor: '#22C55E'}]}>
            <Ionicons name="checkmark-circle" size={18} color="#FFF" />
            <Text style={styles.ctaTextCompleted}>¡Completado!</Text>
          </View>
        ) : (
          <View
            style={[styles.cta, {backgroundColor: 'rgba(255, 255, 255, 0.2)'}]}>
            <Text style={[styles.ctaText, {color: colors.text}]}>
              Continuar misión
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text} />
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    marginVertical: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gradient: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
    textTransform: 'uppercase',
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 24,
  },
  missionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 4,
  },
  checkmark: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 10,
    fontWeight: '600',
  },
  rewardsSection: {
    marginBottom: 12,
  },
  rewardsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  rewardsList: {
    flexDirection: 'row',
    gap: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
  },
  ctaCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  ctaTextCompleted: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});
