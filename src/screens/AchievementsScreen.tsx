/**
 * Achievements Screen
 * Shows all user achievements, progress and statistics
 */

import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {AchievementCard} from '../components/achievements/AchievementCard';
import {UserStatsPanel} from '../components/achievements/UserStatsPanel';
import {AchievementUnlockedModal} from '../components/achievements/AchievementUnlockedModal';
import {useAchievements} from '../hooks/useAchievements';
import {useTheme} from '../hooks/useTheme';
import {useLanguage} from '../hooks/useLanguage';
import {BibleDatabase} from '../lib/database';
import {Achievement, AchievementCategory} from '../lib/achievements/types';
import {spacing, borderRadius, fontSize, shadows} from '../styles/designTokens';

interface AchievementsScreenProps {
  database: BibleDatabase;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  database,
}) => {
  const {achievements, stats, loading, newUnlocks, clearNewUnlocks} =
    useAchievements(database);
  const {colors, isDark, gradient} = useTheme();
  const {t} = useLanguage();
  const router = useRouter();

  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#4f46e5', '#7c3aed', '#a855f7']) as [string, string, string],
    [gradient?.headerColors],
  );

  const [selectedCategory, setSelectedCategory] = useState<
    AchievementCategory | 'all'
  >('all');
  const [showStats, setShowStats] = useState(false);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);

  // Filter achievements by category
  const filteredAchievements = achievements.filter(
    achievement =>
      selectedCategory === 'all' || achievement.category === selectedCategory,
  );

  // Sort: unlocked first, then by progress
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

  const categories: Array<{
    id: AchievementCategory | 'all';
    name: string;
    icon: string;
  }> = [
    {id: 'all', name: 'All', icon: '📋'},
    {id: AchievementCategory.READING, name: 'Reading', icon: '📖'},
    {id: AchievementCategory.STREAK, name: 'Streaks', icon: '🔥'},
    {id: AchievementCategory.CHAPTERS, name: 'Chapters', icon: '📄'},
    {id: AchievementCategory.BOOKS, name: 'Books', icon: '📚'},
    {id: AchievementCategory.HIGHLIGHTS, name: 'Highlights', icon: '🖍️'},
    {id: AchievementCategory.NOTES, name: 'Notes', icon: '📝'},
    {id: AchievementCategory.SPECIAL, name: 'Special', icon: '⭐'},
  ];

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: colors.textSecondary}]}>
            {t.achievements.loading}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header with toggle - Modern and elegant design */}
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          <Pressable
            style={[
              styles.toggleButton,
              {backgroundColor: 'rgba(255,255,255,0.2)'},
            ]}
            onPress={() => setShowStats(!showStats)}
            accessibilityRole="button"
            accessibilityLabel={
              showStats
                ? t.achievements.viewAchievements
                : t.achievements.yourStats
            }>
            <Text style={styles.toggleIcon}>{showStats ? '🏅' : '📊'}</Text>
          </Pressable>
        </View>

        <View style={styles.headerContentContainer}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="trophy" size={32} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>
              {showStats
                ? t.achievements.yourStats
                : t.achievements.yourAchievements}
            </Text>
            <Text style={styles.headerSubtitle}>
              {achievements.filter(a => a.isUnlocked).length} /{' '}
              {achievements.length} {t.achievements.achievementsUnlocked}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {showStats ? (
        // Statistics view
        stats && <UserStatsPanel stats={stats} />
      ) : (
        // Achievements view
        <>
          {/* Category filters */}
          <FlatList
            horizontal
            data={categories}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <Pressable
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === item.id
                        ? colors.primary
                        : colors.surface,
                  },
                  selectedCategory === item.id && styles.categoryChipSelected,
                ]}
                onPress={() => setSelectedCategory(item.id)}>
                <Text style={styles.categoryIcon}>{item.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color:
                        selectedCategory === item.id ? '#fff' : colors.text,
                    },
                  ]}>
                  {item.name}
                </Text>
              </Pressable>
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
            style={[
              styles.categoryScroll,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
              },
            ]}
          />

          {/* Summary - Optimized without double borders */}
          {stats && (
            <View
              style={[
                styles.summary,
                {backgroundColor: colors.card},
                isDark ? shadows.md : shadows.sm,
              ]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, {color: colors.primary}]}>
                  {achievements.filter(a => a.isUnlocked).length}
                </Text>
                <Text
                  style={[styles.summaryLabel, {color: colors.textSecondary}]}>
                  {t.achievements.achievementsUnlocked}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryDivider,
                  {backgroundColor: colors.divider},
                ]}
              />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, {color: colors.secondary}]}>
                  {stats.totalPoints}
                </Text>
                <Text
                  style={[styles.summaryLabel, {color: colors.textSecondary}]}>
                  {t.achievements.totalPoints}
                </Text>
              </View>
              <View
                style={[
                  styles.summaryDivider,
                  {backgroundColor: colors.divider},
                ]}
              />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, {color: colors.text}]}>
                  {t.achievements.level} {stats.level}
                </Text>
                <Text
                  style={[styles.summaryLabel, {color: colors.textSecondary}]}>
                  {stats.level >= 10 ? '👑 Legend' : 'In progress'}
                </Text>
              </View>
            </View>
          )}

          {/* Achievements list */}
          <FlatList
            data={sortedAchievements}
            keyExtractor={item => item.id}
            renderItem={({item}) => (
              <TouchableOpacity onPress={() => setSelectedAchievement(item)}>
                <AchievementCard
                  achievement={item}
                  unlocked={item.isUnlocked}
                  progress={(item.currentProgress / item.requirement) * 100}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, {color: colors.textTertiary}]}>
                  No achievements in this category
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* Achievement detail modal */}
      {selectedAchievement && (
        <AchievementUnlockedModal
          visible={!!selectedAchievement}
          achievement={selectedAchievement}
          onClose={() => setSelectedAchievement(null)}
        />
      )}

      {/* New achievement unlocked modal */}
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
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
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
    padding: spacing.xl,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    marginBottom: spacing['1'],
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    marginHorizontal: spacing.sm,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
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
