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
import { AchievementCard } from '../components/achievements/AchievementCard';
import { UserStatsPanel } from '../components/achievements/UserStatsPanel';
import { AchievementUnlockedModal } from '../components/achievements/AchievementUnlockedModal';
import { useAchievements } from '../hooks/useAchievements';
import { BibleDatabase } from '../lib/database';
import { Achievement, AchievementCategory } from '../lib/achievements/types';

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando logros...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {showStats ? 'Tus Estadísticas' : 'Tus Logros'}
        </Text>
        <Pressable
          style={styles.toggleButton}
          onPress={() => setShowStats(!showStats)}
        >
          <Text style={styles.toggleIcon}>{showStats ? '🏅' : '📊'}</Text>
        </Pressable>
      </View>

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
                  selectedCategory === item.id && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === item.id && styles.categoryTextSelected,
                  ]}
                >
                  {item.name}
                </Text>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            style={styles.categoryScroll}
          />

          {/* Resumen */}
          {stats && (
            <View style={styles.summary}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {achievements.filter((a) => a.isUnlocked).length}
                </Text>
                <Text style={styles.summaryLabel}>Desbloqueados</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{stats.totalPoints}</Text>
                <Text style={styles.summaryLabel}>Puntos totales</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>Nivel {stats.level}</Text>
                <Text style={styles.summaryLabel}>{stats.level >= 10 ? '👑 Leyenda' : 'En progreso'}</Text>
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
                <Text style={styles.emptyText}>
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
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  toggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIcon: {
    fontSize: 20,
  },
  categoryScroll: {
    maxHeight: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#3B82F6',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
