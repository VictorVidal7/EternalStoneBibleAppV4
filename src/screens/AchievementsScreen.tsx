/**
 * Achievements Screen
 * Shows all user achievements, progress and statistics
 */

import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ScrollView,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
// react-native's SafeAreaView is deprecated; use the safe-area-context one,
// matching the rest of the app and silencing the RN deprecation warning.
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, router} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import {
  AchievementCard,
  getAchievementRarity,
} from '../components/achievements/AchievementCard';
import {
  AchievementImageModal,
  type ShareableAccomplishment,
} from '../components/insights/AchievementImageModal';
import {haptics} from '@lib/haptics';
import {UserStatsPanel} from '../components/achievements/UserStatsPanel';
import {AchievementUnlockedModal} from '../components/achievements/AchievementUnlockedModal';
import {useAchievements} from '../hooks/useAchievements';
import {useTheme} from '../hooks/useTheme';
import {useReducedMotion} from '../hooks/useReducedMotion';
import {centeredMaxWidth} from '../styles/responsive';
import {useLanguage} from '../hooks/useLanguage';
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
import {
  DURATIONS,
  EASING_CURVES,
  SPRING_CONFIGS,
} from '../styles/reanimatedAnimations';

// ==================== STAGGERED GRID ENTRANCE ====================
// "Make the app feel more alive" backlog: each achievement card fades +
// scales in with a small per-index delay so the list reads as cascading in
// rather than popping in all at once. Capped so a 30+ item list still
// settles well under a second, and cards that mount later (scrolled into
// view, past FlatList's initial render window) skip the delay entirely —
// they're already entering via scroll, an extra artificial wait would just
// read as lag. Manual shared-value timing (not the declarative `entering`
// prop) to match this codebase's existing Reanimated convention — see
// AchievementUnlockedModal, the only other hand-rolled entrance in this
// feature. No rotation, no confetti/particles, no looping motion, per the
// backlog's explicit avoid-list.
const STAGGER_STEP_MS = 35;
const STAGGER_MAX_INDEX = 12; // items at/after this index render with no delay

interface AnimatedAchievementCardProps {
  achievement: Achievement;
  index: number;
  reduced: boolean;
  seenIdsRef: React.MutableRefObject<Set<string>>;
  onPress: () => void;
  onLongPress?: () => void;
  shareHintA11y?: string;
}

// Module-scope (not defined inside AchievementsScreen's body): the screen
// re-renders on every filter tap, "almost there" expand, modal open/close,
// etc. A component TYPE recreated per render would remount this whole
// subtree on each of those and replay the entrance animation — the thing
// requirement 5 explicitly rules out.
const AnimatedAchievementCard: React.FC<AnimatedAchievementCardProps> = ({
  achievement,
  index,
  reduced,
  seenIdsRef,
  onPress,
  onLongPress,
  shareHintA11y,
}) => {
  // Decide ONCE per mounted instance whether this card should play the
  // entrance animation. An id already in the set has animated in before —
  // e.g. it scrolled out of FlatList's virtualization window and back in,
  // creating a fresh instance — so it renders at rest immediately instead
  // of replaying the cascade. Only READ the set during render (writing here
  // would be unsafe if React ever discarded and retried this render pass);
  // the corresponding write happens in the mount effect below.
  const shouldAnimateRef = useRef<boolean | null>(null);
  if (shouldAnimateRef.current === null) {
    shouldAnimateRef.current = !seenIdsRef.current.has(achievement.id);
  }
  const shouldAnimate = shouldAnimateRef.current && !reduced;

  const opacity = useSharedValue(shouldAnimate ? 0 : 1);
  const scale = useSharedValue(shouldAnimate ? 0.95 : 1);

  useEffect(() => {
    // Mark this id as seen on mount (Set.add is idempotent, so re-running
    // this effect when `reduced` changes later is harmless).
    seenIdsRef.current.add(achievement.id);
    if (!shouldAnimate) {
      // Reduced motion (OS or in-app override) or an already-seen card:
      // present at rest, no animated motion getting there.
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    const delay = index < STAGGER_MAX_INDEX ? index * STAGGER_STEP_MS : 0;
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: DURATIONS.normal,
        easing: EASING_CURVES.emphasizedDecelerate,
      }),
    );
    scale.value = withDelay(delay, withSpring(1, SPRING_CONFIGS.gentle));
    // `reduced` starts false and can flip true shortly after mount, once
    // useReducedMotion's async OS read resolves (see its own doc comment);
    // re-run so a late "reduce motion" answer still snaps to rest instead
    // of finishing a motion animation that should never have started.
    // index/shouldAnimate are stable for the lifetime of this instance (this
    // eslint config has no react-hooks/exhaustive-deps rule, so no
    // suppression directive is needed here).
  }, [reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{scale: scale.value}],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        accessibilityHint={shareHintA11y}>
        <AchievementCard
          achievement={achievement}
          unlocked={achievement.isUnlocked}
          progress={
            (achievement.currentProgress / achievement.requirement) * 100
          }
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export const AchievementsScreen: React.FC = () => {
  const {achievements, stats, loading, newUnlocks, clearNewUnlocks, reload} =
    useAchievements();
  const {colors, isDark, gradient} = useTheme();
  const {t} = useLanguage();
  const reducedMotion = useReducedMotion();
  // Tracks which achievement ids have already played their entrance so a
  // FlatList remount (scrolled far out of the virtualization window and
  // back) never replays the stagger — see AnimatedAchievementCard above.
  const seenCardIdsRef = useRef<Set<string>>(new Set());

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
  // Fade-edge scroll affordance for the category chip row (below): tracks
  // scroll position vs. content/container width so each edge's gradient
  // only shows when there's actually more to reveal in that direction,
  // rather than a static hint that's wrong once you've scrolled to an end.
  const [categoryScrollX, setCategoryScrollX] = useState(0);
  const [categoryContentWidth, setCategoryContentWidth] = useState(0);
  const [categoryContainerWidth, setCategoryContainerWidth] = useState(0);
  const handleCategoryScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setCategoryScrollX(e.nativeEvent.contentOffset.x);
    },
    [],
  );
  const showCategoryLeftFade = categoryScrollX > 4;
  const showCategoryRightFade =
    categoryContentWidth - categoryContainerWidth - categoryScrollX > 4;
  // Which "almost there" row has its description revealed (tap to toggle) — so
  // readers can see what an upcoming achievement actually asks for (Sprint 98).
  const [expandedAlmostId, setExpandedAlmostId] = useState<string | null>(null);
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [shareItem, setShareItem] = useState<ShareableAccomplishment | null>(
    null,
  );

  // Long-press an UNLOCKED card to share it as an image (you share what you
  // have earned, mirroring the timeline long-press in Sprint 83).
  const handleShareAchievement = useCallback(
    (achievement: Achievement) => {
      if (!achievement.isUnlocked) return;
      const localized = getLocalizedAchievement(achievement, t);
      const rarity = getAchievementRarity(achievement);
      haptics.press();
      setShareItem({
        icon: achievement.icon,
        title: localized.name,
        description: localized.description,
        tierLabel: t.achievements.rarities[rarity].toUpperCase(),
        points: achievement.points,
      });
    },
    [t],
  );

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
      icon: '✨',
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
          {/* No back button — this is a root tab; bottom bar is the nav.
              Cross-link to the equippable Titles screen: Achievements is the
              single source of truth (same user_stats row), Titles are the
              reward layer, so we bridge the two systems instead of leaving
              them disconnected (Sprint 92). */}
          <Pressable
            style={[
              styles.titlesLink,
              {backgroundColor: staticColors.glassWhite20},
            ]}
            onPress={() => router.push('/features/badges')}
            accessibilityRole="button"
            accessibilityLabel={t.achievements.viewMyTitlesA11y}>
            <Ionicons name="ribbon" size={16} color="#ffffff" />
            <Text style={styles.titlesLinkText}>
              {t.achievements.viewMyTitles}
            </Text>
          </Pressable>
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
          {/* Category filters — ONE horizontal row (Sprint 91). The old
              wrapping View pushed the 10 chips onto four rows, eating ~210px
              of vertical space so only a thin strip at the bottom was left to
              scroll the achievements. A horizontal ScrollView keeps them to a
              single, always-reachable row; mirrors the Home FeelingChips strip
              (no flex on the ScrollView → it sizes to chip height, never
              stretching under Fabric). Fade edges (below) hint that it
              scrolls — confirmed via live device testing that the row itself
              already scrolled fine, but nothing signaled that to the reader
              (33rd-session clipping-bug investigation). */}
          <View
            style={[
              styles.categoryScroll,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
              },
            ]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
              onScroll={handleCategoryScroll}
              scrollEventThrottle={16}
              onContentSizeChange={w => setCategoryContentWidth(w)}
              onLayout={e =>
                setCategoryContainerWidth(e.nativeEvent.layout.width)
              }>
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
                    onPress={() => setSelectedCategory(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{selected: isActive}}
                    accessibilityLabel={item.name}>
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
            </ScrollView>
            {showCategoryLeftFade ? (
              <LinearGradient
                pointerEvents="none"
                colors={[colors.background, 'transparent']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.categoryFadeLeft}
              />
            ) : null}
            {showCategoryRightFade ? (
              <LinearGradient
                pointerEvents="none"
                colors={['transparent', colors.background]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.categoryFadeRight}
              />
            ) : null}
          </View>

          {/* Achievements list. The summary + "almost there" cards ride in the
              ListHeaderComponent (Sprint 91) so they scroll WITH the list
              instead of pinning ~150px of fixed chrome above it — the whole
              screen below the filter row now scrolls. */}
          <FlatList
            data={sortedAchievements}
            keyExtractor={item => item.id}
            ListHeaderComponent={
              <>
                {/* Summary - Optimized without double borders */}
                {stats && (
                  <View
                    style={[
                      styles.summary,
                      {backgroundColor: colors.card},
                      isDark ? shadows.md : shadows.sm,
                    ]}>
                    <View style={styles.summaryItem}>
                      <Text
                        style={[styles.summaryValue, {color: colors.primary}]}>
                        {achievements.filter(a => a.isUnlocked).length}
                      </Text>
                      <Text
                        style={[
                          styles.summaryLabel,
                          {color: colors.textSecondary},
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}>
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
                      <Text
                        style={[
                          styles.summaryValue,
                          {color: colors.secondary},
                        ]}>
                        {stats.totalPoints}
                      </Text>
                      <Text
                        style={[
                          styles.summaryLabel,
                          {color: colors.textSecondary},
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}>
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
                        style={[
                          styles.summaryLabel,
                          {color: colors.textSecondary},
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}>
                        {stats.level >= 10
                          ? `👑 ${t.achievements.legend}`
                          : t.achievements.inProgress}
                      </Text>
                    </View>
                  </View>
                )}
                {almostThere.length > 0 ? (
                  <View
                    style={[
                      styles.almostCard,
                      {backgroundColor: colors.card},
                      isDark ? shadows.md : shadows.sm,
                    ]}>
                    <Text
                      style={[
                        styles.almostTitle,
                        {color: colors.textSecondary},
                      ]}>
                      ✨ {t.achievements.almostThere}
                    </Text>
                    {almostThere.map(a => {
                      const {name, description} = getLocalizedAchievement(a, t);
                      const pct = Math.min(
                        100,
                        Math.round((a.currentProgress / a.requirement) * 100),
                      );
                      const expanded = expandedAlmostId === a.id;
                      return (
                        <TouchableOpacity
                          key={a.id}
                          style={styles.almostRow}
                          activeOpacity={0.7}
                          onPress={() => {
                            haptics.tap();
                            setExpandedAlmostId(expanded ? null : a.id);
                          }}
                          accessibilityRole="button"
                          accessibilityState={{expanded}}
                          accessibilityHint={t.achievements.almostThereHint}
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
                                style={[
                                  styles.almostName,
                                  {color: colors.text},
                                ]}
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
                              <Ionicons
                                name={expanded ? 'chevron-up' : 'chevron-down'}
                                size={14}
                                color={colors.textTertiary}
                                style={styles.almostChevron}
                              />
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
                            {expanded ? (
                              <Text
                                style={[
                                  styles.almostDescription,
                                  {color: colors.textSecondary},
                                ]}>
                                {description}
                              </Text>
                            ) : null}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}
              </>
            }
            renderItem={({item, index}) => (
              <AnimatedAchievementCard
                achievement={item}
                index={index}
                reduced={reducedMotion}
                seenIdsRef={seenCardIdsRef}
                onPress={() => setSelectedAchievement(item)}
                onLongPress={
                  item.isUnlocked
                    ? () => handleShareAchievement(item)
                    : undefined
                }
                shareHintA11y={
                  item.isUnlocked
                    ? t.achievements.shareLongPressA11y
                    : undefined
                }
              />
            )}
            contentContainerStyle={[styles.list, centeredMaxWidth()]}
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

      {/* Share an unlocked achievement as an image (long-press a card) */}
      {shareItem && (
        <AchievementImageModal
          visible
          item={shareItem}
          headerTitle={t.achievements.shareTitle}
          eyebrow={t.achievements.shareUnlockedLabel}
          onClose={() => setShareItem(null)}
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
    // Titles cross-link on the left, stats-view toggle on the right.
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titlesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  titlesLinkText: {
    color: staticColors.white,
    fontSize: 13,
    fontWeight: '700',
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
    alignItems: 'center',
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
  // Scroll-affordance fades over the category row — width tuned to be wide
  // enough to read as an intentional edge-fade, narrow enough not to mask a
  // whole chip.
  categoryFadeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 28,
  },
  categoryFadeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 28,
  },
  summary: {
    flexDirection: 'row',
    padding: spacing.xl,
    // No horizontal margin: the summary now rides inside the FlatList content
    // padding (Sprint 91), so it spans the same width as the cards below it.
    marginBottom: spacing.sm,
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
    alignItems: 'center',
    marginBottom: 4,
  },
  almostName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  almostCount: {
    fontSize: fontSize.xs,
    fontVariant: ['tabular-nums'],
  },
  almostChevron: {
    marginLeft: spacing.xs,
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
  almostDescription: {
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * 1.5,
    marginTop: spacing.sm,
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
