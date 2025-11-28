/**
 * 📊 PROGRESS WIDGET
 *
 * Widget que muestra progreso de lectura, racha y nivel
 * Diseño motivacional con métricas en tiempo real
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
import {widgetTaskHandler, ProgressWidgetData} from './WidgetTaskHandler';
import {useTheme} from '../hooks/useTheme';
import Svg, {Circle} from 'react-native-svg';

interface ProgressWidgetProps {
  userId: string;
  onPress?: () => void;
}

export const ProgressWidget: React.FC<ProgressWidgetProps> = ({
  userId,
  onPress,
}) => {
  const {colors, isDark} = useTheme();
  const [progressData, setProgressData] = useState<ProgressWidgetData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const data = await widgetTaskHandler.getProgressData(userId);
      setProgressData(data);
    } catch (error) {
      console.error('Error loading progress widget:', error);
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

  if (!progressData) {
    return null;
  }

  const gradientColors = isDark
    ? ['#312E81', '#4C1D95', '#5B21B6']
    : ['#FAE8FF', '#F3E8FF', '#E9D5FF'];

  // Cálculo para círculo de progreso
  const size = 80;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (progressData.xp / progressData.nextLevelXp) * 100;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}>
      <LinearGradient
        colors={gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="stats-chart" size={20} color={colors.primary} />
          <Text style={[styles.headerText, {color: colors.text}]}>
            Tu Progreso
          </Text>
        </View>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          {/* Level Circle */}
          <View style={styles.levelContainer}>
            <Svg width={size} height={size}>
              {/* Background circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress circle */}
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.accent}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            </Svg>
            <View style={styles.levelBadge}>
              <Text style={[styles.levelNumber, {color: colors.text}]}>
                {progressData.level}
              </Text>
              <Text style={[styles.levelLabel, {color: colors.textSecondary}]}>
                Nivel
              </Text>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            {/* Streak */}
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {backgroundColor: 'rgba(249, 115, 22, 0.15)'},
                ]}>
                <Ionicons name="flame" size={18} color="#F97316" />
              </View>
              <Text style={[styles.statValue, {color: colors.text}]}>
                {progressData.currentStreak}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                días
              </Text>
            </View>

            {/* Daily Goal */}
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIcon,
                  {backgroundColor: 'rgba(34, 197, 94, 0.15)'},
                ]}>
                <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              </View>
              <Text style={[styles.statValue, {color: colors.text}]}>
                {progressData.versesReadToday}/{progressData.dailyGoal}
              </Text>
              <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
                versos
              </Text>
            </View>
          </View>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpHeader}>
            <Text style={[styles.xpLabel, {color: colors.textSecondary}]}>
              XP hasta nivel {progressData.level + 1}
            </Text>
            <Text style={[styles.xpValue, {color: colors.text}]}>
              {progressData.xp}/{progressData.nextLevelXp}
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
                  width: `${progress}%`,
                  backgroundColor: colors.accent,
                },
              ]}
            />
          </View>
        </View>

        {/* Achievement Badge */}
        {progressData.currentStreak >= 7 && (
          <View style={styles.achievementBadge}>
            <Ionicons name="trophy" size={14} color="#FCD34D" />
            <Text style={[styles.achievementText, {color: colors.text}]}>
              ¡{progressData.currentStreak} días de racha! Sigue así
            </Text>
          </View>
        )}

        {/* Completion Percentage */}
        <View style={styles.completionSection}>
          <View
            style={[
              styles.completionBadge,
              {
                backgroundColor:
                  progressData.completionPercentage >= 100
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(59, 130, 246, 0.2)',
              },
            ]}>
            <Text
              style={[
                styles.completionText,
                {
                  color:
                    progressData.completionPercentage >= 100
                      ? '#22C55E'
                      : colors.primary,
                },
              ]}>
              {progressData.completionPercentage >= 100
                ? '✓ Meta diaria alcanzada'
                : `${progressData.completionPercentage}% completado hoy`}
            </Text>
          </View>
        </View>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  mainStats: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  levelContainer: {
    position: 'relative',
    marginRight: 20,
  },
  levelBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '800',
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statsGrid: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  xpSection: {
    marginBottom: 12,
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  xpValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 211, 77, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  achievementText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  completionSection: {
    alignItems: 'center',
  },
  completionBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  completionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
