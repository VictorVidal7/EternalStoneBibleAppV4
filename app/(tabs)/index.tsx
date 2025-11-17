/**
 * 🏠 HOME SCREEN - REDISEÑO MODERNO
 *
 * Pantalla principal completamente rediseñada con:
 * - Hero section con gradientes impactantes
 * - Animaciones suaves y profesionales
 * - Glassmorphism y design tokens modernos
 * - Mejor jerarquía visual y tipografía
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import bibleDB from '../../src/lib/database';
import { BibleVerse, ReadingProgress } from '../../src/types/bible';
import { READING_PLANS } from '../../src/constants/reading-plans';
import { useTheme } from '../../src/hooks/useTheme';
import { useBibleVersion } from '../../src/hooks/useBibleVersion';
import { useServices } from '../../src/context/ServicesContext';
import { useLanguage } from '../../src/hooks/useLanguage';

// Componentes modernos
import ModernCard from '../../src/components/ModernCard';
import ProgressIndicator from '../../src/components/ProgressIndicator';
import Skeleton from '../../src/components/SkeletonLoader';

// Design tokens
import {
  spacing,
  borderRadius,
  fontSize,
  shadows,
  iconSize,
} from '../../src/styles/designTokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { selectedVersion } = useBibleVersion();
  const { achievementService, initialized: servicesInitialized } = useServices();
  const { t } = useLanguage();

  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  const [lastRead, setLastRead] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({ progress: 0, streak: 0, level: 1 });

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    loadHomeData();
    startAnimations();
  }, [selectedVersion.id]);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  async function loadHomeData() {
    try {
      await bibleDB.initialize();

      // Get daily verse
      const verse = await bibleDB.getRandomVerse(selectedVersion.id);
      setDailyVerse(verse);

      // Get last reading position
      const progress = await bibleDB.getReadingProgress();
      setLastRead(progress);

      // Get user stats (simulated for now)
      if (achievementService && servicesInitialized) {
        const stats = await achievementService.getUserStats();
        setUserStats({
          progress: stats.totalVersesRead / 311 * 100, // % of Bible read
          streak: stats.currentStreak || 0,
          level: stats.level,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading home data:', error);
      setLoading(false);
    }
  }

  const handlePress = (callback: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    callback();
  };

  if (loading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
      >
        <Skeleton variant="rectangular" width="100%" height={200} />
        <View style={{ marginTop: spacing.lg }}>
          <Skeleton variant="rectangular" width="100%" height={150} />
        </View>
        <View style={{ marginTop: spacing.lg }}>
          <Skeleton variant="rectangular" width="100%" height={150} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* HERO SECTION - Gradiente impactante con stats */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        }}
      >
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={
              isDark
                ? ['#667eea', '#764ba2', '#f093fb']
                : ['#667eea', '#764ba2']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Stars decoration */}
            <View style={styles.starsContainer}>
              <Ionicons name="star" size={20} color="rgba(255,255,255,0.3)" style={styles.star1} />
              <Ionicons name="star" size={16} color="rgba(255,255,255,0.2)" style={styles.star2} />
              <Ionicons name="star" size={12} color="rgba(255,255,255,0.25)" style={styles.star3} />
            </View>

            <View style={styles.heroContent}>
              <Ionicons name="book" size={48} color="#ffffff" />
              <Text style={styles.heroTitle}>{t.home.welcome}</Text>
              <Text style={styles.heroSubtitle}>{t.home.subtitle}</Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="flame" size={24} color="#fbbf24" />
                  </View>
                  <Text style={styles.statValue}>{userStats.streak}</Text>
                  <Text style={styles.statLabel}>{t.home.streakDays}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="trophy" size={24} color="#fbbf24" />
                  </View>
                  <Text style={styles.statValue}>{t.achievements.level} {userStats.level}</Text>
                  <Text style={styles.statLabel}>{t.home.rank}</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="book-outline" size={24} color="#fbbf24" />
                  </View>
                  <Text style={styles.statValue}>{Math.round(userStats.progress)}%</Text>
                  <Text style={styles.statLabel}>{t.home.progress}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* DAILY VERSE - Card con glassmorphism */}
      {dailyVerse && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <ModernCard
            variant="glass"
            padding="large"
            style={{ marginBottom: spacing.lg }}
            onPress={() =>
              handlePress(() =>
                router.push(`/verse/${dailyVerse.book}/${dailyVerse.chapter}` as any)
              )
            }
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="sparkles" size={24} color="#fbbf24" />
              </View>
              <View>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  ✨ {t.home.dailyVerse}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}
                </Text>
              </View>
            </View>

            <Text style={[styles.verseText, { color: colors.text }]}>
              "{dailyVerse.text}"
            </Text>

            <View style={styles.cardAction}>
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {t.home.readFullChapter}
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.primary} />
            </View>
          </ModernCard>
        </Animated.View>
      )}

      {/* CONTINUE READING - Card elevado con gradiente */}
      {lastRead && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <ModernCard
            variant="gradient"
            gradient={
              isDark
                ? ['#10b981', '#059669']
                : ['#34d399', '#10b981']
            }
            padding="large"
            style={{ marginBottom: spacing.lg }}
            onPress={() =>
              handlePress(() =>
                router.push(`/verse/${lastRead.book}/${lastRead.chapter}` as any)
              )
            }
          >
            <View style={styles.continueHeader}>
              <Ionicons name="play-circle" size={32} color="#ffffff" />
              <Text style={styles.continueTitle}>{t.home.continueReading}</Text>
            </View>

            <Text style={styles.continueReference}>
              {lastRead.book} {lastRead.chapter}:{lastRead.verse}
            </Text>

            <View style={styles.continueProgress}>
              <ProgressIndicator
                progress={65}
                variant="linear"
                size="small"
                color="#ffffff"
                backgroundColor="rgba(255,255,255,0.3)"
                animated
              />
            </View>
          </ModernCard>
        </Animated.View>
      )}

      {/* QUICK ACCESS - Grid moderno */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.home.quickAccess}
          </Text>
          <Ionicons name="flash" size={20} color={colors.warning} />
        </View>

        <View style={styles.quickGrid}>
          {QUICK_ACCESS_BOOKS.map((book, index) => (
            <QuickAccessCard
              key={book.name}
              {...book}
              onPress={() => handlePress(() => router.push(`/chapter/${book.name}` as any))}
              delay={index * 50}
            />
          ))}
        </View>
      </Animated.View>

      {/* READING PLANS - Horizontal scroll con cards modernos */}
      <Animated.View style={{ opacity: fadeAnim }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.home.readingPlans}
          </Text>
          <Ionicons name="calendar" size={20} color={colors.secondary} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.plansScroll}
        >
          {READING_PLANS.slice(0, 3).map((plan, index) => (
            <ReadingPlanCard
              key={plan.id}
              plan={plan}
              onPress={() =>
                handlePress(() =>
                  router.push(`/chapter/${plan.days[0].readings[0].book}` as any)
                )
              }
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."
        </Text>
        <Text style={[styles.footerReference, { color: colors.textTertiary }]}>
          — Salmos 119:105
        </Text>
      </View>
    </ScrollView>
  );
}

// ==================== QUICK ACCESS CARD ====================

interface QuickAccessCardProps {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  delay: number;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  name,
  icon,
  color,
  onPress,
  delay,
}) => {
  const { colors, isDark } = useTheme();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
    ]).start();

    // Animación de rotación sutil
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ scale }],
        width: (SCREEN_WIDTH - spacing.lg * 3) / 2,
        marginBottom: spacing.md,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        style={styles.quickAccessCardContainer}
      >
        <LinearGradient
          colors={isDark
            ? [color + '30', color + '10']
            : [color + '25', color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.quickAccessGradient, { borderColor: color + '40' }]}
        >
          {/* Círculo decorativo de fondo */}
          <View style={[styles.quickAccessCircle, { backgroundColor: color + '15' }]} />

          <Animated.View style={{ transform: [{ rotate }] }}>
            <View style={[styles.quickAccessIconContainer, { backgroundColor: color + '30' }]}>
              <Ionicons name={icon} size={36} color={color} />
            </View>
          </Animated.View>

          <Text style={[styles.quickAccessText, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>

          {/* Icono de flecha pequeño */}
          <View style={styles.quickAccessArrow}>
            <Ionicons name="chevron-forward" size={16} color={color} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== READING PLAN CARD ====================

interface ReadingPlanCardProps {
  plan: any;
  onPress: () => void;
}

const ReadingPlanCard: React.FC<ReadingPlanCardProps> = ({ plan, onPress }) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.planCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={isDark
            ? [plan.color + '35', plan.color + '15']
            : [plan.color + '25', plan.color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.planGradient, { borderColor: plan.color + '50' }]}
        >
          {/* Decoración de líneas diagonales */}
          <View style={styles.planDecorativeLines}>
            <View style={[styles.planLine, { backgroundColor: plan.color + '10' }]} />
            <View style={[styles.planLine, { backgroundColor: plan.color + '15' }]} />
          </View>

          {/* Icono del plan */}
          <View style={[styles.planIconContainer, { backgroundColor: plan.color + '30', borderColor: plan.color }]}>
            <Ionicons name={plan.icon as any} size={32} color={plan.color} />
          </View>

          {/* Badge de duración */}
          <View style={[styles.planDurationBadge, { backgroundColor: plan.color }]}>
            <Ionicons name="calendar-outline" size={14} color="#ffffff" />
            <Text style={styles.planDurationBadgeText}>
              {plan.duration} {t.home.days}
            </Text>
          </View>

          {/* Contenido del plan */}
          <View style={styles.planContent}>
            <Text style={[styles.planName, { color: colors.text }]} numberOfLines={2}>
              {plan.name}
            </Text>

            <Text style={[styles.planDescription, { color: colors.textSecondary }]} numberOfLines={3}>
              {plan.description}
            </Text>

            {/* Botón de comenzar */}
            <View style={[styles.planStartButton, { backgroundColor: plan.color }]}>
              <Text style={styles.planStartButtonText}>{t.home.startPlan || 'Comenzar'}</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== DATA ====================

const QUICK_ACCESS_BOOKS = [
  { name: 'Génesis', icon: 'star' as const, color: '#3b82f6' },
  { name: 'Salmos', icon: 'musical-notes' as const, color: '#8b5cf6' },
  { name: 'Proverbios', icon: 'bulb' as const, color: '#f59e0b' },
  { name: 'Juan', icon: 'heart' as const, color: '#ef4444' },
  { name: 'Romanos', icon: 'book' as const, color: '#10b981' },
  { name: 'Apocalipsis', icon: 'flame' as const, color: '#f97316' },
];

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing['2xl'],
  },

  // Hero
  heroContainer: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  heroGradient: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
    ...shadows.xl,
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star1: {
    position: 'absolute',
    top: 30,
    right: 40,
  },
  star2: {
    position: 'absolute',
    top: 70,
    right: 100,
  },
  star3: {
    position: 'absolute',
    top: 50,
    left: 50,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: '700',
    color: '#ffffff',
    marginTop: spacing.base,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: spacing.md,
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  cardIconContainer: {
    marginRight: spacing.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    marginTop: 2,
  },

  // Verse
  verseText: {
    fontSize: fontSize.base,
    lineHeight: fontSize.base * 1.6,
    fontStyle: 'italic',
    marginBottom: spacing.base,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.md,
  },
  actionText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    marginRight: spacing.xs,
  },

  // Continue Reading
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  continueTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: spacing.md,
  },
  continueReference: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: spacing.base,
  },
  continueProgress: {
    marginTop: spacing.md,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.base,
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
  },

  // Quick Access
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  quickAccessCardContainer: {
    flex: 1,
  },
  quickAccessGradient: {
    height: 135,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.md,
  },
  quickAccessCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -30,
    right: -20,
  },
  quickAccessIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  quickAccessText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    textAlign: 'left',
  },
  quickAccessArrow: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Reading Plans
  plansScroll: {
    paddingHorizontal: spacing.lg,
  },
  planCard: {
    width: 260,
    marginRight: spacing.base,
  },
  planGradient: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.lg,
  },
  planDecorativeLines: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    opacity: 0.3,
  },
  planLine: {
    width: 2,
    height: '100%',
    transform: [{ skewX: '-10deg' }],
  },
  planIconContainer: {
    width: 68,
    height: 68,
    borderRadius: borderRadius['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.base,
    borderWidth: 2,
    ...shadows.md,
  },
  planDurationBadge: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: 4,
  },
  planDurationBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#ffffff',
  },
  planContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.base,
  },
  planName: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.sm,
    lineHeight: fontSize.xl * 1.3,
  },
  planDescription: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    marginBottom: spacing.md,
    minHeight: 60,
  },
  planStartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    ...shadows.sm,
  },
  planStartButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: fontSize.base,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  footerReference: {
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
