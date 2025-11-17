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
                ? ['#6366f1', '#818cf8', '#a5b4fc'] // Índigo refinado
                : ['#6366f1', '#4f46e5', '#7c3aed'] // Gradiente sofisticado
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
        width: (SCREEN_WIDTH - spacing.xl * 3) / 2,
        marginBottom: spacing.base,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.quickAccessCardContainer}
      >
        {/* DISEÑO MINIMALISTA - Sin gradientes ni decoraciones */}
        <View
          style={[
            styles.quickAccessCard,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
            },
          ]}
        >
          {/* Icono simple */}
          <View style={[styles.quickAccessIconContainer, { backgroundColor: color + '10' }]}>
            <Ionicons name={icon} size={28} color={color} />
          </View>

          <Text style={[styles.quickAccessText, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
        </View>
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
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* DISEÑO MINIMALISTA - Sin gradientes */}
        <View
          style={[
            styles.planContainer,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
            },
          ]}
        >
          {/* Header con ícono */}
          <View style={styles.planHeader}>
            <View style={[styles.planIconContainer, { backgroundColor: plan.color + '15' }]}>
              <Ionicons name={plan.icon as any} size={24} color={plan.color} />
            </View>

            <View style={[styles.planDurationBadge, { backgroundColor: plan.color + '15' }]}>
              <Text style={[styles.planDurationBadgeText, { color: plan.color }]}>
                {plan.duration} días
              </Text>
            </View>
          </View>

          {/* Contenido */}
          <View style={styles.planContent}>
            <Text style={[styles.planName, { color: colors.text }]} numberOfLines={2}>
              {plan.name}
            </Text>

            <Text style={[styles.planDescription, { color: colors.textSecondary }]} numberOfLines={2}>
              {plan.description}
            </Text>
          </View>

          {/* Footer simple */}
          <View style={styles.planFooter}>
            <Text style={[styles.planStartText, { color: plan.color }]}>
              {t.home.startPlan || 'Comenzar'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={plan.color} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== DATA ====================

const QUICK_ACCESS_BOOKS = [
  { name: 'Génesis', icon: 'book-outline' as const, color: '#6366f1' },
  { name: 'Salmos', icon: 'musical-notes-outline' as const, color: '#8b5cf6' },
  { name: 'Proverbios', icon: 'bulb-outline' as const, color: '#f59e0b' },
  { name: 'Juan', icon: 'heart-outline' as const, color: '#ef4444' },
  { name: 'Romanos', icon: 'document-text-outline' as const, color: '#10b981' },
  { name: 'Apocalipsis', icon: 'flash-outline' as const, color: '#ec4899' },
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
    paddingHorizontal: spacing.xl,  // Más espacioso
    paddingTop: Platform.OS === 'ios' ? 70 : 50,  // Más altura
    paddingBottom: spacing['4xl'],  // Más respiración
    borderBottomLeftRadius: 40,  // Curvas más suaves
    borderBottomRightRadius: 40,
    shadowColor: '#6366f1',  // Sombra refinada
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,  // Más sutil
    shadowRadius: 24,
    elevation: 10,
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
    fontWeight: '800',  // Más bold
    color: '#ffffff',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.5,  // Tracking más apretado para títulos
  },
  heroSubtitle: {
    fontSize: fontSize.md,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: spacing['2xl'],  // Más separación
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',  // Más sutil
    borderRadius: 24,  // Más suave
    paddingVertical: spacing.lg,  // Más espacioso
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize['2xl'],  // Más grande
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: fontSize.xs,
    fontWeight: '500',  // Más legible
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',  // Más sofisticado
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
    marginBottom: spacing.lg,  // Más separación
  },
  cardIconContainer: {
    marginRight: spacing.base,
  },
  cardTitle: {
    fontSize: fontSize.xl,  // Más grande
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    marginTop: 4,
    opacity: 0.7,
  },

  // Verse
  verseText: {
    fontSize: fontSize.md,  // Más legible
    lineHeight: fontSize.md * 1.7,  // Mejor line-height
    fontStyle: 'italic',
    marginBottom: spacing.lg,
    opacity: 0.95,
  },
  cardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    marginRight: spacing.sm,
    letterSpacing: 0.2,
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
    paddingHorizontal: spacing.xl,  // Más padding
    marginBottom: spacing.lg,  // Más separación
    marginTop: spacing.xl,  // Más espacio arriba
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],  // Más grande
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Quick Access - MINIMALISTA
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
  },
  quickAccessCardContainer: {
    flex: 1,
  },
  quickAccessCard: {
    height: 100,  // Más compacto
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,  // Sombra sutil
    justifyContent: 'space-between',
  },
  quickAccessIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'left',
    letterSpacing: 0,
  },

  // Reading Plans - MINIMALISTA
  plansScroll: {
    paddingHorizontal: spacing.xl,
  },
  planCard: {
    width: 240,  // Más compacto
    marginRight: spacing.md,
  },
  planContainer: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    ...shadows.sm,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  planIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planDurationBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  planDurationBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
    lineHeight: fontSize.lg * 1.3,
  },
  planDescription: {
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.4,
    opacity: 0.7,
  },
  planFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  planStartText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
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
