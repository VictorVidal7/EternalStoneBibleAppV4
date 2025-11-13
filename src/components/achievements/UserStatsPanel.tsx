/**
 * Panel de Estadísticas del Usuario
 * Muestra nivel, progreso, rachas y estadísticas
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { UserStats, calculateLevelProgress } from '../../lib/achievements/types';

interface UserStatsPanelProps {
  stats: UserStats;
}

export const UserStatsPanel: React.FC<UserStatsPanelProps> = ({ stats }) => {
  const levelProgress = calculateLevelProgress(stats.totalPoints);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Nivel y Progreso */}
      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelIcon}>{levelProgress.currentLevel.icon}</Text>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{levelProgress.currentLevel.title}</Text>
            <Text style={styles.levelNumber}>Nivel {stats.level}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${levelProgress.progress}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {stats.totalPoints} / {levelProgress.nextLevel?.minPoints || '∞'} pts
          </Text>
        </View>

        {levelProgress.nextLevel && (
          <Text style={styles.nextLevelText}>
            {levelProgress.pointsNeeded} puntos para {levelProgress.nextLevel.title}
          </Text>
        )}
      </View>

      {/* Racha */}
      <View style={styles.streakCard}>
        <View style={styles.streakRow}>
          <View style={styles.streakItem}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakValue}>{stats.currentStreak}</Text>
            <Text style={styles.streakLabel}>Racha actual</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakIcon}>🏆</Text>
            <Text style={styles.streakValue}>{stats.longestStreak}</Text>
            <Text style={styles.streakLabel}>Racha máxima</Text>
          </View>
        </View>
      </View>

      {/* Estadísticas de Lectura */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📖</Text>
          <Text style={styles.statValue}>{stats.totalVersesRead.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Versículos leídos</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📄</Text>
          <Text style={styles.statValue}>{stats.totalChaptersRead}</Text>
          <Text style={styles.statLabel}>Capítulos</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statValue}>{stats.totalBooksCompleted}</Text>
          <Text style={styles.statLabel}>Libros completados</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={styles.statValue}>
            {Math.floor(stats.totalReadingTime / 60)}h{' '}
            {stats.totalReadingTime % 60}m
          </Text>
          <Text style={styles.statLabel}>Tiempo de lectura</Text>
        </View>
      </View>

      {/* Estadísticas de Interacción */}
      <View style={styles.interactionCard}>
        <Text style={styles.sectionTitle}>Interacción</Text>
        <View style={styles.interactionGrid}>
          <StatRow icon="🖍️" label="Destacados" value={stats.totalHighlights} />
          <StatRow icon="📝" label="Notas" value={stats.totalNotes} />
          <StatRow icon="🔖" label="Marcadores" value={stats.totalBookmarks} />
          <StatRow icon="🔍" label="Búsquedas" value={stats.totalSearches} />
        </View>
      </View>

      {/* Logros */}
      <View style={styles.achievementsCard}>
        <Text style={styles.sectionTitle}>Logros</Text>
        <View style={styles.achievementsRow}>
          <Text style={styles.achievementsIcon}>🏅</Text>
          <View style={styles.achievementsInfo}>
            <Text style={styles.achievementsValue}>
              {stats.achievementsUnlocked} / {stats.totalAchievements}
            </Text>
            <View style={styles.achievementsBar}>
              <View
                style={[
                  styles.achievementsFill,
                  {
                    width: `${
                      (stats.achievementsUnlocked / stats.totalAchievements) * 100
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const StatRow: React.FC<{ icon: string; label: string; value: number }> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.statRow}>
    <Text style={styles.statRowIcon}>{icon}</Text>
    <Text style={styles.statRowLabel}>{label}</Text>
    <Text style={styles.statRowValue}>{value.toLocaleString()}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  levelNumber: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '600',
  },
  nextLevelText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  streakCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#FCD34D',
  },
  streakIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#92400E',
  },
  streakLabel: {
    fontSize: 13,
    color: '#78350F',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  interactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  interactionGrid: {
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statRowIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statRowLabel: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  achievementsCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  achievementsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementsIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  achievementsInfo: {
    flex: 1,
  },
  achievementsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  achievementsBar: {
    height: 8,
    backgroundColor: '#93C5FD',
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementsFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
});
