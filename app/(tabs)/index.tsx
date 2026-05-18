/**
 * 🏠 HOME SCREEN - CELESTIAL SERENO DESIGN
 *
 * Pantalla principal con el sistema de diseño Celestial Sereno
 * Creado para la gloria de Dios Todopoderoso
 *
 * Características:
 * - Glassmorphism con backdrop blur
 * - Gradientes celestiales (Indigo/Purple/Emerald/Teal)
 * - Íconos vectoriales (no emojis)
 * - Animaciones suaves y profesionales
 * - Modo claro y oscuro optimizado
 * - Tipografía dual (Serif para versículos, Sans para UI)
 */

import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  RefreshControl,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import * as Haptics from 'expo-haptics';

import bibleDB from '@lib/database';
import {BibleVerse, ReadingProgress} from '@/types/bible';
import {READING_PLANS, getLocalizedPlan} from '@/constants/reading-plans';
import {getDailyVerseRef} from '@/constants/daily-verses';
import {getBookByName} from '@/constants/bible';
import {useTheme} from '@hooks/useTheme';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useServices} from '@context/ServicesContext';
import {useLanguage} from '@hooks/useLanguage';
import ShareService from '@/services/ShareService';
import {logger} from '@lib/utils/logger';
import {useReadingProgress} from '@context/ReadingProgressContext';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import {useFavorites} from '@context/FavoritesContext';

// Componentes Celestial
import {
  StatsCard,
  VerseOfDayCard,
  ReadingPlanCard,
  ShimmerCard,
} from '@components/celestial';

// Skeleton Loaders
import {Skeleton} from '@components/SkeletonLoader';

// Tema Celestial
import {
  createCelestialTheme,
  celestialBorderRadius,
  celestialSpacing,
} from '@/styles/celestialTheme';
import {withOpacity} from '@/styles/modernTheme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CONTENT_HORIZONTAL_PADDING = 20;
const SAVED_CARD_GAP = 12;
const SAVED_CARD_WIDTH =
  (SCREEN_WIDTH - CONTENT_HORIZONTAL_PADDING * 2 - SAVED_CARD_GAP * 2) / 3;

export default function HomeScreen() {
  const router = useRouter();
  const {isDark, colors, gradient} = useTheme();
  // Pasar colores dinámicos del tema seleccionado a celestialTheme
  const celestialTheme = createCelestialTheme(isDark, {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    secondary: colors.secondary,
    accent: colors.accent,
    info: colors.info,
  });
  const {selectedVersion} = useBibleVersion();
  const {
    achievementService,
    highlightService,
    initialized: servicesInitialized,
  } = useServices();
  const {t, language} = useLanguage();
  const {getChapterProgress} = useReadingProgress();
  const {getCompletedDays} = useReadingPlanProgress();
  const {addFavorite, isFavorite, favorites} = useFavorites();
  const progressTrackColor = isDark
    ? 'transparent'
    : withOpacity(colors.primary, isDark ? 0.3 : 0.8);

  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  const [lastRead, setLastRead] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [savedCounts, setSavedCounts] = useState({
    favorites: 0,
    notes: 0,
    highlights: 0,
  });
  const [userStats, setUserStats] = useState({
    progress: 0,
    streak: 0,
    level: 1,
    versesRead: 0,
  });

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const formatSavedCount = (count: number) => {
    if (count > 99) return '99+';
    return count.toString();
  };

  useEffect(() => {
    loadHomeData();
    startAnimations();
  }, [selectedVersion.id]);

  useEffect(() => {
    setSavedCounts(prev => ({
      ...prev,
      favorites: favorites.length,
    }));
  }, [favorites.length]);

  const startAnimations = () => {
    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  async function loadHomeData() {
    try {
      await bibleDB.initialize();

      const dailyRef = getDailyVerseRef();
      const [verse, progress, favoritesCount, notesCount, highlightsCount] =
        await Promise.all([
          bibleDB
            .getVerse(
              dailyRef.book,
              dailyRef.chapter,
              dailyRef.verse,
              selectedVersion.id,
            )
            .catch(() => null),
          bibleDB.getReadingProgress(),
          bibleDB.getFavoritesCount().catch(() => 0),
          bibleDB.getNotesCount().catch(() => 0),
          highlightService
            ? highlightService
                .getAllHighlights()
                .then(h => h.length)
                .catch(() => 0)
            : Promise.resolve(0),
        ]);

      // Curated verse of the day — deterministic by calendar day, so it is
      // the same for everyone and never changes mid-day. Fall back to a
      // random verse only if the reference can't be resolved.
      setDailyVerse(
        verse ?? (await bibleDB.getRandomVerse(selectedVersion.id)),
      );

      // Get last reading position
      setLastRead(progress);

      setSavedCounts({
        favorites: favoritesCount,
        notes: notesCount,
        highlights: highlightsCount,
      });

      // Get chapter progress if available
      if (progress) {
        const currentProgress = getChapterProgress(
          progress.book,
          progress.chapter.toString(),
        );
        setChapterProgress(currentProgress);
      }

      // Get user stats
      if (achievementService && servicesInitialized) {
        const stats = await achievementService.getUserStats();
        setUserStats({
          progress: (stats.totalVersesRead / 31102) * 100, // Total verses in Bible
          streak: stats.currentStreak || 0,
          level: stats.level || 1,
          versesRead: stats.totalVersesRead || 0,
        });
      }

      setLoading(false);
    } catch (error) {
      logger.error('Error loading home data', error as Error, {
        component: 'HomeScreen',
        action: 'loadHomeData',
      });
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await loadHomeData();

      logger.info('Home screen refreshed', {
        component: 'HomeScreen',
        action: 'onRefresh',
      });
    } catch (error) {
      logger.error('Error refreshing home screen', error as Error, {
        component: 'HomeScreen',
        action: 'onRefresh',
      });
    } finally {
      setRefreshing(false);
    }
  }

  const handlePress = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {backgroundColor: celestialTheme.colors.background},
        ]}>
        <LinearGradient
          colors={
            celestialTheme.colors.backgroundGradient as [
              string,
              string,
              ...string[],
            ]
          }
          style={styles.gradientBackground}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>
            {/* Skeleton for Verse of Day Card */}
            <View style={styles.skeletonSection}>
              <Skeleton
                width="100%"
                height={240}
                borderRadius={celestialBorderRadius['2xl']}
                style={{marginBottom: celestialSpacing.cardGap}}
              />
            </View>

            {/* Skeleton for Stats Card */}
            <View style={styles.skeletonSection}>
              <Skeleton
                width="100%"
                height={160}
                borderRadius={celestialBorderRadius['2xl']}
                style={{marginBottom: celestialSpacing.cardGap}}
              />
            </View>

            {/* Skeleton for Quick Access Buttons */}
            <View style={styles.skeletonSection}>
              <Skeleton
                width={120}
                height={20}
                borderRadius={celestialBorderRadius.md}
                style={{marginBottom: celestialSpacing.elementGap}}
              />
              <View style={styles.quickGrid}>
                {[1, 2, 3, 4].map(i => (
                  <Skeleton
                    key={i}
                    width={(SCREEN_WIDTH - celestialSpacing.sectionGap * 3) / 2}
                    height={100}
                    borderRadius={celestialBorderRadius.xl}
                  />
                ))}
              </View>
            </View>

            {/* Skeleton for Reading Plan */}
            <View style={styles.skeletonSection}>
              <Skeleton
                width="100%"
                height={140}
                borderRadius={celestialBorderRadius['2xl']}
              />
            </View>
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradiente de fondo */}
      <LinearGradient
        colors={
          celestialTheme.colors.backgroundGradient as [
            string,
            string,
            ...string[],
          ]
        }
        style={styles.gradientBackground}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }>
        {/* ==================== HERO SECTION - Welcome Card (Compact) ==================== */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}, {scale: scaleAnim}],
          }}>
          <LinearGradient
            colors={
              (gradient?.headerColors && gradient.headerColors.length >= 2
                ? [...gradient.headerColors]
                : [colors.primary, colors.primaryDark]) as [
                string,
                string,
                ...string[],
              ]
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[
              styles.heroCard,
              {
                borderRadius: celestialBorderRadius.xl,
                shadowColor: colors.primary,
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}>
            <View style={styles.heroContent}>
              {/* Compact header with icon */}
              <View style={styles.heroHeader}>
                <Ionicons name="book" size={28} color="#ffffff" />
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle}>{t.home.welcomeShort}</Text>
                  <Text style={styles.heroSubtitle}>
                    {t.home.journeyContinues}
                  </Text>
                </View>
              </View>

              {/* Stats Row - Compact */}
              <View style={styles.statsRow}>
                <StatsCard
                  icon="flame"
                  value={userStats.streak}
                  label={t.home.streakDays}
                  iconColor="#fbbf24"
                  iconSize={18}
                  pulse={userStats.streak > 0}
                />

                <View style={styles.statDivider} />

                <StatsCard
                  icon="star"
                  value={userStats.level}
                  label={t.home.level}
                  iconColor="#fbbf24"
                  iconSize={18}
                />

                <View style={styles.statDivider} />

                <StatsCard
                  icon="trending-up"
                  value={`${Math.round(userStats.progress)}%`}
                  label={t.home.progress}
                  iconColor="#fbbf24"
                  iconSize={18}
                />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ==================== VERSE OF THE DAY ==================== */}
        {dailyVerse && (
          <Animated.View
            style={{opacity: fadeAnim, marginTop: celestialSpacing.cardGap}}>
            <ShimmerCard glowColor={colors.primary}>
              <VerseOfDayCard
                verseText={dailyVerse.text}
                reference={`${dailyVerse.book} ${dailyVerse.chapter}:${dailyVerse.verse}`}
                title={t.home.dailyVerse}
                isDark={isDark}
                onPress={() =>
                  handlePress(() =>
                    router.push(
                      `/verse/${dailyVerse.book}/${dailyVerse.chapter}` as any,
                    ),
                  )
                }
                onShare={async () => {
                  if (dailyVerse) {
                    const reference = `${dailyVerse.book} ${dailyVerse.chapter}:${dailyVerse.verse}`;
                    await ShareService.shareVerse(dailyVerse, reference);
                  }
                }}
                onFavorite={async () => {
                  if (dailyVerse) {
                    const alreadyFavorite = isFavorite(
                      dailyVerse.book,
                      dailyVerse.chapter,
                      dailyVerse.verse,
                    );

                    if (!alreadyFavorite) {
                      await addFavorite(dailyVerse, 'worship', 5);
                      await Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success,
                      );
                    }
                  }
                }}
              />
            </ShimmerCard>
          </Animated.View>
        )}

        {/* ==================== CONTINUE READING (Compact) ==================== */}
        {lastRead && (
          <Animated.View
            style={{opacity: fadeAnim, marginTop: celestialSpacing.cardGap}}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                handlePress(() =>
                  router.push(
                    `/verse/${lastRead.book}/${lastRead.chapter}` as any,
                  ),
                )
              }>
              <ShimmerCard
                glowColor={colors.primary}
                shimmerEnabled={false}
                cardBackgroundColor={celestialTheme.colors.surfaceGlass}
                cardBorderColor={celestialTheme.colors.glassBorder}>
                <View style={styles.continueButton}>
                  <View style={styles.continueHeader}>
                    <View
                      style={[
                        styles.continueIconContainer,
                        {
                          backgroundColor: colors.primary + '20',
                          borderRadius: 10,
                        },
                      ]}>
                      <Ionicons name="play" size={14} color={colors.primary} />
                    </View>
                    <View style={styles.continueTextContainer}>
                      <Text
                        style={[styles.continueTitle, {color: colors.text}]}
                        numberOfLines={1}>
                        {t.home.continueReading}
                      </Text>
                      <Text
                        style={[
                          styles.continueReference,
                          {color: colors.textSecondary},
                        ]}>
                        {(() => {
                          const info = getBookByName(lastRead.book);
                          const name = info
                            ? language === 'en'
                              ? info.nameEn
                              : info.name
                            : lastRead.book;
                          return `${name} ${lastRead.chapter}:${
                            lastRead.verse || 1
                          }`;
                        })()}
                      </Text>
                    </View>
                    <View style={styles.continueProgress}>
                      <Text
                        style={[styles.progressText, {color: colors.primary}]}>
                        {Math.round(chapterProgress)}%
                      </Text>
                    </View>
                  </View>
                  {/* Progress bar - subtle */}
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarBackground,
                        {backgroundColor: progressTrackColor},
                      ]}>
                      <Animated.View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${Math.round(chapterProgress)}%`,
                            backgroundColor: colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </ShimmerCard>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ==================== READING PLANS ==================== */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              {t.home.readingPlans}
            </Text>
            <Ionicons
              name="calendar"
              size={26}
              color={celestialTheme.colors.accent}
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.plansScroll}>
            {READING_PLANS.slice(0, 3).map(plan => {
              const planDaysDone = getCompletedDays(plan.id).length;
              const localizedPlan = getLocalizedPlan(plan, t);
              return (
                <ReadingPlanCard
                  key={plan.id}
                  name={localizedPlan.name}
                  description={localizedPlan.description}
                  subtitle={t.home.planDays.replace(
                    '{{days}}',
                    plan.duration.toString(),
                  )}
                  icon="book-outline"
                  duration={plan.duration}
                  daysCompleted={planDaysDone}
                  onPress={() =>
                    handlePress(() => router.push(`/plan/${plan.id}` as any))
                  }
                  continueText={
                    planDaysDone > 0 ? t.home.continue : t.home.start
                  }
                  isDark={isDark}
                />
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ==================== STUDY TOOLS ==================== */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              {t.home.studyTools}
            </Text>
            <Ionicons
              name="construct-outline"
              size={24}
              color={colors.primary}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              handlePress(() => router.push('/features/version-comparison'))
            }>
            <ShimmerCard
              glowColor={colors.primary}
              shimmerEnabled={false}
              cardBackgroundColor={celestialTheme.colors.surfaceGlass}
              cardBorderColor={celestialTheme.colors.glassBorder}>
              <View style={styles.toolCard}>
                <View
                  style={[
                    styles.toolIconContainer,
                    {backgroundColor: colors.primary + '20'},
                  ]}>
                  <Ionicons
                    name="git-compare-outline"
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.toolInfo}>
                  <Text
                    style={[
                      styles.toolTitle,
                      {color: celestialTheme.colors.text},
                    ]}>
                    {t.settingsV51.versionComparison}
                  </Text>
                  <Text
                    style={[
                      styles.toolDescription,
                      {color: celestialTheme.colors.textSecondary},
                    ]}>
                    {t.settingsV51.versionComparisonDesc}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={colors.textTertiary}
                />
              </View>
            </ShimmerCard>
          </TouchableOpacity>
        </Animated.View>

        {/* ==================== SAVED SHORTCUTS ==================== */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              {t.home.savedTitle}
            </Text>
            <Ionicons
              name="heart"
              size={24}
              color={celestialTheme.colors.accent}
            />
          </View>

          <View style={styles.savedGrid}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.savedCardWrapper}
              onPress={() =>
                handlePress(() => router.push('/(tabs)/favorites' as any))
              }>
              <BlurView
                intensity={isDark ? 28 : 48}
                tint={isDark ? 'dark' : 'light'}
                style={[
                  styles.savedCard,
                  {
                    backgroundColor: celestialTheme.colors.surfaceGlass,
                    borderColor: celestialTheme.colors.glassBorder,
                  },
                  celestialTheme.shadows.md,
                ]}>
                <View style={styles.savedCardHeader}>
                  <View
                    style={[
                      styles.savedIcon,
                      {
                        backgroundColor: withOpacity(
                          colors.primary,
                          isDark ? 0.2 : 0.12,
                        ),
                      },
                    ]}>
                    <Ionicons name="heart" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.savedMeta}>
                    <View
                      style={[
                        styles.savedBadge,
                        {
                          backgroundColor: withOpacity(
                            colors.primary,
                            isDark ? 0.18 : 0.12,
                          ),
                        },
                      ]}>
                      <Text
                        style={[
                          styles.savedBadgeText,
                          {color: colors.primary},
                        ]}>
                        {formatSavedCount(savedCounts.favorites)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>
                </View>
                <Text
                  style={[styles.savedLabel, {color: colors.text}]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {t.tabs.favorites}
                </Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.savedCardWrapper}
              onPress={() =>
                handlePress(() => router.push('/(tabs)/notes' as any))
              }>
              <BlurView
                intensity={isDark ? 28 : 48}
                tint={isDark ? 'dark' : 'light'}
                style={[
                  styles.savedCard,
                  {
                    backgroundColor: celestialTheme.colors.surfaceGlass,
                    borderColor: celestialTheme.colors.glassBorder,
                  },
                  celestialTheme.shadows.md,
                ]}>
                <View style={styles.savedCardHeader}>
                  <View
                    style={[
                      styles.savedIcon,
                      {
                        backgroundColor: withOpacity(
                          colors.accent,
                          isDark ? 0.2 : 0.12,
                        ),
                      },
                    ]}>
                    <Ionicons
                      name="document-text"
                      size={20}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.savedMeta}>
                    <View
                      style={[
                        styles.savedBadge,
                        {
                          backgroundColor: withOpacity(
                            colors.accent,
                            isDark ? 0.18 : 0.12,
                          ),
                        },
                      ]}>
                      <Text
                        style={[styles.savedBadgeText, {color: colors.accent}]}>
                        {formatSavedCount(savedCounts.notes)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>
                </View>
                <Text
                  style={[styles.savedLabel, {color: colors.text}]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {t.tabs.notes}
                </Text>
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.savedCardWrapper}
              onPress={() =>
                handlePress(() => router.push('/(tabs)/highlights' as any))
              }>
              <BlurView
                intensity={isDark ? 28 : 48}
                tint={isDark ? 'dark' : 'light'}
                style={[
                  styles.savedCard,
                  {
                    backgroundColor: celestialTheme.colors.surfaceGlass,
                    borderColor: celestialTheme.colors.glassBorder,
                  },
                  celestialTheme.shadows.md,
                ]}>
                <View style={styles.savedCardHeader}>
                  <View
                    style={[
                      styles.savedIcon,
                      {
                        backgroundColor: withOpacity(
                          colors.info,
                          isDark ? 0.2 : 0.12,
                        ),
                      },
                    ]}>
                    <Ionicons
                      name="color-palette"
                      size={20}
                      color={colors.info}
                    />
                  </View>
                  <View style={styles.savedMeta}>
                    <View
                      style={[
                        styles.savedBadge,
                        {
                          backgroundColor: withOpacity(
                            colors.info,
                            isDark ? 0.18 : 0.12,
                          ),
                        },
                      ]}>
                      <Text
                        style={[styles.savedBadgeText, {color: colors.info}]}>
                        {formatSavedCount(savedCounts.highlights)}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textTertiary}
                    />
                  </View>
                </View>
                <Text
                  style={[styles.savedLabel, {color: colors.text}]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {t.highlights.short}
                </Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* ==================== FOOTER ==================== */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              {
                color: celestialTheme.colors.textTertiary,
                fontFamily: celestialTheme.typography.fontFamily.serif,
              },
            ]}>
            {t.home.footerQuote}
          </Text>
          <Text
            style={[
              styles.footerReference,
              {color: celestialTheme.colors.textTertiary},
            ]}>
            {t.home.footerReference}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ==================== DATA ====================

/**
 * Colores para los planes de lectura
 */
// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20, // Más ajustado para pantallas pequeñas
    paddingTop: Platform.OS === 'ios' ? 68 : 44, // Más espacio superior para mejor visibilidad
    paddingBottom: 100, // Más espacio para el tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Hero Card - Compact and Professional
  heroCard: {
    overflow: 'hidden',
    padding: 16,
    marginBottom: 0,
  },
  heroContent: {
    gap: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 8,
  },

  // Continue Reading Button - Compact
  continueButton: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderWidth: 0,
    overflow: 'hidden',
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  continueTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  continueReference: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  continueProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressBarContainer: {
    marginTop: 8,
    marginBottom: -2,
  },
  progressBarBackground: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Section Header - MÁS PROMINENTE
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24, // Incrementado de 20
  },
  sectionTitle: {
    fontSize: 26, // MÁS GRANDE - de 22 a 26
    fontWeight: '800', // Más bold
    letterSpacing: -0.5,
  },

  // Quick Access Grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Saved shortcuts
  savedGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: SAVED_CARD_GAP,
  },
  savedCardWrapper: {
    width: SAVED_CARD_WIDTH,
  },
  savedCard: {
    flex: 1,
    minHeight: 110,
    width: '100%',
    padding: 16,
    borderRadius: celestialBorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  savedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  savedBadge: {
    minWidth: 26,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  savedIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    lineHeight: 18,
  },

  // Reading Plans
  plansScroll: {
    paddingRight: 24,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerReference: {
    fontSize: 14,
    textAlign: 'center',
  },
  skeletonSection: {
    marginBottom: 16,
  },
  // Tool Card
  toolCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  toolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  toolDescription: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
    lineHeight: 18,
  },
});
