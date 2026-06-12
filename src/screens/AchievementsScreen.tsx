/**
 * Achievements Screen
 * Shows all user achievements, progress and statistics
 */

import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import {useFocusEffect} from 'expo-router';
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
import {nearestAchievements} from '../lib/achievements/nearby';
import {getLocalizedAchievement} from '../lib/achievements/definitions';
import {
  spacing,
  borderRadius,
  fontSize,
  shadows,
  staticColors,
} from '../styles/designTokens';

interface AchievementsScreenProps {
  database: BibleDatabase;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  database,
}) => {
  const {achievements, stats, loading, newUnlocks, clearNewUnlocks, reload} =
    useAchievements(database);
  const {colors, isDark, gradient} = useTheme();
  const {t} = useLanguage();

  // Re-read achievements and stats when the tab regains focus so reading
  // progress made elsewhere is reflected without an app restart.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

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

  // "Almost there" (Sprint 81): the locked achievements closest to unlocking,
  // shown only on the unfiltered view so the strip never contradicts the
  // category filter below it.
  const almostThere = useMemo(
    () => (selectedCategory === 'all' ? nearestAchievements(achievements) : []),
    [achievements, selectedCategory],
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
    {id: 'all', name: t.achievements.filterAll, icon: '📋'},
    {
      id: AchievementCategory.READING,
      name: t.achievements.categories.reading,
      icon: '📖',
    },
    {
      id: AchievementCategory.STREAK,
      name: t.achievements.categories.streak,
      icon: '🔥',
    },
    {
      id: AchievementCategory.CHAPTERS,
      name: t.achievements.categories.chapters,
      icon: '📄',
    },
    {
      id: AchievementCategory.BOOKS,
      name: t.achievements.categories.books,
      icon: '📚',
    },
    {
      id: AchievementCategory.HIGHLIGHTS,
      name: t.achievements.categories.highlights,
      icon: '🖍️',
    },
    {
      id: AchievementCategory.NOTES,
      name: t.achievements.categories.notes,
      icon: '📝',
    },
    // SEARCH and TIME achievements existed since day one but had no filter
    // chip, so they were only reachable through "All" (Sprint 81).
    {
      id: AchievementCategory.SEARCH,
      name: t.achievements.categories.search,
      icon: '🔍',
    },
    {
      id: AchievementCategory.TIME,
      name: t.achievements.categories.time,
      icon: '⏱️',
    },
    {
      id: AchievementCategory.SPECIAL,
      name: t.achievements.categories.special,
      icon: '⭐',
    },
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
          {/* No back button — this is a root tab; bottom bar is the nav. */}
          <Pressable
            style={[
              styles.toggleButton,
              {backgroundColor: staticColors.glassWhite20},
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
          <View
            style={[
              styles.categoryScroll,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
              },
            ]}>
            <View style={styles.categoryList}>
              {categories.map(item => {
                const isActive = selectedCategory === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isActive
                          ? colors.primary
                          : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(item.id)}>
                    <Text style={styles.categoryIcon}>{item.icon}</Text>
                    <Text
                      style={[
                        styles.categoryText,
                        {color: isActive ? colors.background : colors.text},
                      ]}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

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
                  {stats.level >= 10
                    ? `👑 ${t.achievements.legend}`
                    : t.achievements.inProgress}
                </Text>
              </View>
            </View>
          )}

          {/* Achievements list */}
          <FlatList
            data={sortedAchievements}
            keyExtractor={item => item.id}
            ListHeaderComponent={
              almostThere.length > 0 ? (
                <View
                  style={[
                    styles.almostCard,
                    {backgroundColor: colors.card},
                    isDark ? shadows.md : shadows.sm,
                  ]}>
                  <Text
                    style={[styles.almostTitle, {color: colors.textSecondary}]}>
                    ✨ {t.achievements.almostThere}
                  </Text>
                  {almostThere.map(a => {
                    const {name} = getLocalizedAchievement(a, t);
                    const pct = Math.min(
                      100,
                      Math.round((a.currentProgress / a.requirement) * 100),
                    );
                    return (
                      <View
                        key={a.id}
                        style={styles.almostRow}
                        accessible={true}
                        accessibilityLabel={t.achievements.almostThereA11y
                          .replace('{{name}}', name)
                          .replace('{{current}}', String(a.currentProgress))
                          .replace('{{requirement}}', String(a.requirement))}>
                        {/* Catalog icons are EMOJIS — standalone Text, never
                            Ionicons (renders '?'), per the S80 lesson. */}
                        <Text style={styles.almostIcon}>{a.icon}</Text>
                        <View style={styles.almostBody}>
                          <View style={styles.almostLabelRow}>
                            <Text
                              style={[styles.almostName, {color: colors.text}]}
                              numberOfLines={1}>
                              {name}
                            </Text>
                            <Text
                              style={[
                                styles.almostCount,
                                {color: colors.textTertiary},
                              ]}>
                              {a.currentProgress}/{a.requirement}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.almostTrack,
                              {backgroundColor: colors.surfaceVariant},
                            ]}>
                            <View
                              style={[
                                styles.almostFill,
                                {
                                  backgroundColor: colors.primary,
                                  width: `${pct}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : null
            }
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
                  {t.achievements.noCategoryAchievements}
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
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    // Stats-view toggle sits in the top-right corner now that the
    // (root tab) back button has been removed.
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: staticColors.glassWhite30,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: staticColors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: staticColors.glassWhite90,
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
    borderBottomWidth: 1,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
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
    paddingBottom: 100, // Espacio para tab bar (88px iOS / 68px Android)
  },
  // "Almost there" strip (Sprint 81)
  almostCard: {
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
  },
  almostTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  almostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  almostIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  almostBody: {
    flex: 1,
  },
  almostLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  almostName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  almostCount: {
    fontSize: fontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  almostTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  almostFill: {
    height: '100%',
    borderRadius: 3,
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
