/**
 * Panel de Estadísticas del Usuario
 * Muestra nivel, progreso, rachas y estadísticas
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { UserStats, calculateLevelProgress } from '../../lib/achievements/types';
import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, fontSize, shadows } from '../../styles/designTokens';

interface UserStatsPanelProps {
  stats: UserStats;
}

export const UserStatsPanel: React.FC<UserStatsPanelProps> = ({ stats }) => {
  const { colors, isDark } = useTheme();
  const levelProgress = calculateLevelProgress(stats.totalPoints);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Nivel y Progreso */}
      <View style={[styles.levelCard, { backgroundColor: colors.card }, isDark ? shadows.md : shadows.sm]}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelIcon}>{levelProgress.currentLevel.icon}</Text>
          <View style={styles.levelInfo}>
            <Text style={[styles.levelTitle, { color: colors.text }]}>{levelProgress.currentLevel.title}</Text>
            <Text style={[styles.levelNumber, { color: colors.textSecondary }]}>Nivel {stats.level}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${levelProgress.progress}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {stats.totalPoints} / {levelProgress.nextLevel?.minPoints || '∞'} pts
          </Text>
        </View>

        {levelProgress.nextLevel && (
          <Text style={[styles.nextLevelText, { color: colors.textTertiary }]}>
            {levelProgress.pointsNeeded} puntos para {levelProgress.nextLevel.title}
          </Text>
        )}
      </View>

      {/* Racha */}
      <View style={[styles.streakCard, { backgroundColor: isDark ? colors.primary + '20' : '#FEF3C7' }]}>
        <View style={styles.streakRow}>
          <View style={styles.streakItem}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={[styles.streakValue, { color: isDark ? colors.text : '#92400E' }]}>{stats.currentStreak}</Text>
            <Text style={[styles.streakLabel, { color: isDark ? colors.textSecondary : '#78350F' }]}>Racha actual</Text>
          </View>
          <View style={[styles.streakDivider, { backgroundColor: isDark ? colors.border : '#FCD34D' }]} />
          <View style={styles.streakItem}>
            <Text style={styles.streakIcon}>🏆</Text>
            <Text style={[styles.streakValue, { color: isDark ? colors.text : '#92400E' }]}>{stats.longestStreak}</Text>
            <Text style={[styles.streakLabel, { color: isDark ? colors.textSecondary : '#78350F' }]}>Racha máxima</Text>
          </View>
        </View>
      </View>

      {/* Estadísticas de Lectura */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.card }, isDark ? shadows.sm : shadows.xs]}>
          <Text style={styles.statIcon}>📖</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalVersesRead.toLocaleString()}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Versículos leídos</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }, isDark ? shadows.sm : shadows.xs]}>
          <Text style={styles.statIcon}>📄</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalChaptersRead}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Capítulos</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }, isDark ? shadows.sm : shadows.xs]}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalBooksCompleted}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Libros completados</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }, isDark ? shadows.sm : shadows.xs]}>
          <Text style={styles.statIcon}>⏱️</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {Math.floor(stats.totalReadingTime / 60)}h{' '}
            {stats.totalReadingTime % 60}m
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tiempo de lectura</Text>
        </View>
      </View>

      {/* Estadísticas de Interacción */}
      <View style={[styles.interactionCard, { backgroundColor: colors.card }, isDark ? shadows.md : shadows.sm]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Interacción</Text>
        <View style={styles.interactionGrid}>
          <StatRow icon="🖍️" label="Destacados" value={stats.totalHighlights} colors={colors} />
          <StatRow icon="📝" label="Notas" value={stats.totalNotes} colors={colors} />
          <StatRow icon="🔖" label="Marcadores" value={stats.totalBookmarks} colors={colors} />
          <StatRow icon="🔍" label="Búsquedas" value={stats.totalSearches} colors={colors} />
        </View>
      </View>

      {/* Logros */}
      <View style={[styles.achievementsCard, { backgroundColor: isDark ? colors.secondary + '20' : '#DBEAFE' }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? colors.text : '#1F2937' }]}>Logros</Text>
        <View style={styles.achievementsRow}>
          <Text style={styles.achievementsIcon}>🏅</Text>
          <View style={styles.achievementsInfo}>
            <Text style={[styles.achievementsValue, { color: isDark ? colors.text : '#1E3A8A' }]}>
              {stats.achievementsUnlocked} / {stats.totalAchievements}
            </Text>
            <View style={[styles.achievementsBar, { backgroundColor: isDark ? colors.border : '#93C5FD' }]}>
              <View
                style={[
                  styles.achievementsFill,
                  {
                    width: `${
                      (stats.achievementsUnlocked / stats.totalAchievements) * 100
                    }%`,
                    backgroundColor: colors.primary,
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

const StatRow: React.FC<{ icon: string; label: string; value: number; colors: any }> = ({
  icon,
  label,
  value,
  colors,
}) => (
  <View style={styles.statRow}>
    <Text style={styles.statRowIcon}>{icon}</Text>
    <Text style={[styles.statRowLabel, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.statRowValue, { color: colors.text }]}>{value.toLocaleString()}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.base,
  },
  levelCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
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
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  levelNumber: {
    fontSize: fontSize.base,
    marginTop: spacing['0.5'],
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressBar: {
    height: 12,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.md,
  },
  progressText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  nextLevelText: {
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  streakCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
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
    fontSize: fontSize['2xl'],
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: fontSize.sm,
    marginTop: spacing['1'],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  statCard: {
    borderRadius: borderRadius.md,
    padding: spacing.base,
    width: '48%',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing['1'],
  },
  statLabel: {
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  interactionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    marginBottom: spacing.base,
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
    fontSize: fontSize.base,
  },
  statRowValue: {
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  achievementsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.base,
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
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  achievementsBar: {
    height: 8,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
  },
  achievementsFill: {
    height: '100%',
    borderRadius: borderRadius.xs,
  },
});
