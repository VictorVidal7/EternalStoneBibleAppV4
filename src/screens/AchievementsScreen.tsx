/**
 * Pantalla de Logros
 * Muestra todos los logros del usuario, progreso y estadísticas
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AchievementCard } from '../components/achievements/AchievementCard';
import { UserStatsPanel } from '../components/achievements/UserStatsPanel';
import { AchievementUnlockedModal } from '../components/achievements/AchievementUnlockedModal';
import { useAchievements } from '../hooks/useAchievements';
import { useTheme } from '../hooks/useTheme';
import { BibleDatabase } from '../lib/database';
import { Achievement, AchievementCategory } from '../lib/achievements/types';
import { spacing, borderRadius, fontSize, shadows } from '../styles/designTokens';

interface AchievementsScreenProps {
  database: BibleDatabase;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ database }) => {
  const {
    achievements,
    stats,
    loading,
    newUnlocks,
    clearNewUnlocks,
  } = useAchievements(database);
  const { colors, isDark } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [showStats, setShowStats] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  // Filtrar logros por categoría
  const filteredAchievements = achievements.filter(
    (achievement) =>
      selectedCategory === 'all' || achievement.category === selectedCategory
  );

  // Ordenar: desbloqueados primero, luego por progreso
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.isUnlocked && !b.isUnlocked) return -1;
    if (!a.isUnlocked && b.isUnlocked) return 1;
    if (!a.isUnlocked && !b.isUnlocked) {
      const aProgress = a.currentProgress / a.requirement;
      const bProgress = b.currentProgress / b.requirement;
      return bProgress - aProgress;
    }
    return (b.unlockedAt || 0) - (a.unlockedAt || 0);
  });

  const categories: Array<{ id: AchievementCategory | 'all'; name: string; icon: string }> = [
    { id: 'all', name: 'Todos', icon: '📋' },
    { id: AchievementCategory.READING, name: 'Lectura', icon: '📖' },
    { id: AchievementCategory.STREAK, name: 'Rachas', icon: '🔥' },
    { id: AchievementCategory.CHAPTERS, name: 'Capítulos', icon: '📄' },
    { id: AchievementCategory.BOOKS, name: 'Libros', icon: '📚' },
    { id: AchievementCategory.HIGHLIGHTS, name: 'Destacados', icon: '🖍️' },
    { id: AchievementCategory.NOTES, name: 'Notas', icon: '📝' },
    { id: AchievementCategory.SPECIAL, name: 'Especiales', icon: '⭐' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando logros...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header con toggle - Diseño moderno y elegante */}
      <LinearGradient
        colors={isDark ? ['#6366f1', '#818cf8'] : ['#6366f1', '#4f46e5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>
          {showStats ? 'Tus Estadísticas' : 'Tus Logros'}
        </Text>
        <Pressable
          style={[styles.toggleButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          onPress={() => setShowStats(!showStats)}
        >
          <Text style={styles.toggleIcon}>{showStats ? '🏅' : '📊'}</Text>
        </Pressable>
      </LinearGradient>

      {showStats ? (
        // Vista de estadísticas
        stats && <UserStatsPanel stats={stats} />
      ) : (
        // Vista de logros
        <>
          {/* Filtros de categoría */}
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.categoryChip,
                  { backgroundColor: selectedCategory === item.id ? colors.primary : colors.surface },
                  selectedCategory === item.id && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategory === item.id ? '#fff' : colors.text },
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            style={[styles.categoryScroll, { backgroundColor: colors.background, borderBottomColor: colors.border }]}
          />

          {/* Resumen - Mejorado para evitar superposiciones */}
          {stats && (
            <View style={[
              styles.summary,
              { backgroundColor: colors.card, borderColor: colors.border },
              isDark ? shadows.md : shadows.sm
            ]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {achievements.filter((a) => a.isUnlocked).length}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Desbloqueados
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.secondary }]}>
                  {stats.totalPoints}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  Puntos totales
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: colors.divider }]} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: colors.text }]}>
                  Nivel {stats.level}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {stats.level >= 10 ? '👑 Leyenda' : 'En progreso'}
                </Text>
              </View>
            </View>
          )}

          {/* Lista de logros */}
          <FlatList
            data={sortedAchievements}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <AchievementCard
                achievement={item}
                onPress={setSelectedAchievement}
                showProgress
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
                  No hay logros en esta categoría
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Modal de detalle de logro */}
      {selectedAchievement && (
        <AchievementUnlockedModal
          visible={!!selectedAchievement}
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}

      {/* Modal de nuevo logro desbloqueado */}
      {newUnlocks.length > 0 && (
        <AchievementUnlockedModal
          visible={newUnlocks.length > 0}
          achievement={newUnlocks[0]}
          onClose={clearNewUnlocks}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: '#ffffff',
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 22,
  },
  categoryScroll: {
    maxHeight: 60,
    borderBottomWidth: 1,
  },
  categoryList: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  categoryChipSelected: {},
  categoryIcon: {
    fontSize: fontSize.base,
    marginRight: spacing.xs,
  },
  categoryText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  summary: {
    flexDirection: 'row',
    padding: spacing.lg,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.xs,
  },
  summaryDivider: {
    width: 1,
  },
  list: {
    padding: spacing.base,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.base,
    textAlign: 'center',
  },
});
