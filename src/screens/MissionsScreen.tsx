/**
 * 🎯 MISSIONS SCREEN
 *
 * Pantalla de misiones diarias, semanales y especiales
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Mission,
  MissionType,
  MissionDifficulty,
  MissionService,
} from '../lib/missions/MissionService';
import {useTheme} from '../hooks/useTheme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface MissionsScreenProps {
  missionService: MissionService;
  onClaimReward: (rewards: any[]) => void;
}

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  missionService,
  onClaimReward,
}) => {
  const {colors, isDark} = useTheme();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedTab, setSelectedTab] = useState<MissionType>(
    MissionType.DAILY,
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    dailyCompleted: 0,
    weeklyCompleted: 0,
    totalRewardsClaimed: 0,
  });

  useEffect(() => {
    loadMissions();
    loadStats();
  }, [selectedTab]);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const allMissions = await missionService.getMissionsByType(selectedTab);
      setMissions(allMissions);
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const missionStats = await missionService.getMissionStats();
      setStats(missionStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleClaimReward = async (mission: Mission) => {
    if (!mission.isCompleted || mission.claimedReward) {
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const rewards = await missionService.claimRewards(mission.id);

      if (rewards.length > 0) {
        Alert.alert(
          '🎉 ¡Recompensa Reclamada!',
          rewards.map(r => r.displayName).join('\n'),
          [{text: 'Genial!', style: 'default'}],
        );

        onClaimReward(rewards);
        loadMissions();
        loadStats();
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };

  const getDifficultyColor = (difficulty: MissionDifficulty): string => {
    switch (difficulty) {
      case MissionDifficulty.EASY:
        return '#10B981'; // Green
      case MissionDifficulty.MEDIUM:
        return '#F59E0B'; // Amber
      case MissionDifficulty.HARD:
        return '#EF4444'; // Red
      case MissionDifficulty.LEGENDARY:
        return '#8B5CF6'; // Purple
      default:
        return colors.textSecondary;
    }
  };

  const getDifficultyLabel = (difficulty: MissionDifficulty): string => {
    const labels: Record<MissionDifficulty, string> = {
      easy: 'Fácil',
      medium: 'Media',
      hard: 'Difícil',
      legendary: 'Legendaria',
    };
    return labels[difficulty];
  };

  const getTimeRemaining = (expiresAt: number): string => {
    const now = Date.now();
    const diff = expiresAt - now;

    if (diff <= 0) return 'Expirado';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d restantes`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const renderMissionCard = (mission: Mission) => {
    const progress = mission.requirements[0];
    const progressPercentage = (progress.current / progress.target) * 100;

    return (
      <View
        key={mission.id}
        style={[styles.missionCard, {backgroundColor: colors.surface}]}>
        {/* Header */}
        <View style={styles.missionHeader}>
          <View style={styles.missionHeaderLeft}>
            <Text style={[styles.missionTitle, {color: colors.text}]}>
              {mission.title}
            </Text>
            <View
              style={[
                styles.difficultyBadge,
                {
                  backgroundColor:
                    getDifficultyColor(mission.difficulty) + '20',
                },
              ]}>
              <Text
                style={[
                  styles.difficultyText,
                  {color: getDifficultyColor(mission.difficulty)},
                ]}>
                {getDifficultyLabel(mission.difficulty)}
              </Text>
            </View>
          </View>

          <Text style={[styles.timeRemaining, {color: colors.textTertiary}]}>
            {getTimeRemaining(mission.expiresAt)}
          </Text>
        </View>

        {/* Description */}
        <Text
          style={[styles.missionDescription, {color: colors.textSecondary}]}>
          {mission.description}
        </Text>

        {/* Progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, {color: colors.text}]}>
              Progreso: {progress.current} / {progress.target}
            </Text>
            <Text style={[styles.progressPercentage, {color: colors.primary}]}>
              {Math.round(progressPercentage)}%
            </Text>
          </View>

          <View
            style={[
              styles.progressBar,
              {backgroundColor: colors.surfaceVariant},
            ]}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={[styles.progressFill, {width: `${progressPercentage}%`}]}
            />
          </View>
        </View>

        {/* Rewards */}
        <View style={styles.rewardsSection}>
          <Text style={[styles.rewardsLabel, {color: colors.textSecondary}]}>
            Recompensas:
          </Text>
          <View style={styles.rewardsList}>
            {mission.rewards.map((reward, index) => (
              <View
                key={index}
                style={[
                  styles.rewardBadge,
                  {backgroundColor: colors.primaryLight},
                ]}>
                <Ionicons
                  name={
                    reward.type === 'points'
                      ? 'star'
                      : reward.type === 'badge'
                        ? 'medal'
                        : 'trophy'
                  }
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.rewardText, {color: colors.primary}]}>
                  {reward.displayName}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        {mission.isCompleted && !mission.claimedReward && (
          <TouchableOpacity
            style={[styles.claimButton, {backgroundColor: colors.success}]}
            onPress={() => handleClaimReward(mission)}>
            <Ionicons name="gift" size={20} color="#FFF" />
            <Text style={styles.claimButtonText}>Reclamar Recompensa</Text>
          </TouchableOpacity>
        )}

        {mission.isCompleted && mission.claimedReward && (
          <View
            style={[
              styles.completedBadge,
              {backgroundColor: colors.success + '20'},
            ]}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.success}
            />
            <Text style={[styles.completedText, {color: colors.success}]}>
              ¡Completado!
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1e1b4b', '#312e81'] : ['#4f46e5', '#6366f1']}
        style={styles.header}>
        <Text style={styles.headerTitle}>Misiones</Text>
        <Text style={styles.headerSubtitle}>
          Completa misiones y gana recompensas épicas
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.statValue}>{stats.totalCompleted}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="gift" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.totalRewardsClaimed}</Text>
            <Text style={styles.statLabel}>Reclamadas</Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="flame" size={24} color="#EF4444" />
            <Text style={styles.statValue}>{stats.dailyCompleted}</Text>
            <Text style={styles.statLabel}>Diarias</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={[styles.tabsContainer, {backgroundColor: colors.surface}]}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === MissionType.DAILY && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setSelectedTab(MissionType.DAILY)}>
          <Ionicons
            name="sunny"
            size={20}
            color={
              selectedTab === MissionType.DAILY
                ? colors.primary
                : colors.textTertiary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === MissionType.DAILY
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}>
            Diarias
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === MissionType.WEEKLY && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setSelectedTab(MissionType.WEEKLY)}>
          <Ionicons
            name="calendar"
            size={20}
            color={
              selectedTab === MissionType.WEEKLY
                ? colors.primary
                : colors.textTertiary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === MissionType.WEEKLY
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}>
            Semanales
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === MissionType.SPECIAL && {
              borderBottomColor: colors.primary,
              borderBottomWidth: 3,
            },
          ]}
          onPress={() => setSelectedTab(MissionType.SPECIAL)}>
          <Ionicons
            name="star"
            size={20}
            color={
              selectedTab === MissionType.SPECIAL
                ? colors.primary
                : colors.textTertiary
            }
          />
          <Text
            style={[
              styles.tabText,
              {
                color:
                  selectedTab === MissionType.SPECIAL
                    ? colors.primary
                    : colors.textSecondary,
              },
            ]}>
            Especiales
          </Text>
        </TouchableOpacity>
      </View>

      {/* Missions List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.missionsContainer}
        showsVerticalScrollIndicator={false}>
        {missions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="trophy-outline"
              size={64}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              No hay misiones {selectedTab} disponibles
            </Text>
          </View>
        ) : (
          missions.map(renderMissionCard)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  missionsContainer: {
    padding: 16,
    gap: 16,
  },
  missionCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  missionHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: '600',
  },
  missionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 13,
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
    flexWrap: 'wrap',
    gap: 6,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: '600',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  claimButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  completedText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
