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
  StatusBar as RNStatusBar,
  RefreshControl,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import * as Haptics from 'expo-haptics';

import bibleDB from '../../src/lib/database';
import {BibleVerse, ReadingProgress} from '../../src/types/bible';
import {READING_PLANS} from '../../src/constants/reading-plans';
import {useTheme} from '../../src/hooks/useTheme';
import {useBibleVersion} from '../../src/hooks/useBibleVersion';
import {useServices} from '../../src/context/ServicesContext';
import {useLanguage} from '../../src/hooks/useLanguage';
import ShareService from '../../src/services/ShareService';
import {logger} from '../../src/lib/utils/logger';
import {useReadingProgress} from '../../src/context/ReadingProgressContext';
import {useFavorites} from '../../src/context/FavoritesContext';

// Componentes Celestial
import {
  StatsCard,
  VerseOfDayCard,
  QuickAccessButton,
  ReadingPlanCard,
} from '../../src/components/celestial';

// Skeleton Loaders
import {Skeleton} from '../../src/components/SkeletonLoader';

// Tema Celestial
import {
  createCelestialTheme,
  celestialBorderRadius,
  celestialSpacing,
} from '../../src/styles/celestialTheme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const {isDark, colors} = useTheme();
  const celestialTheme = createCelestialTheme(isDark);
  const {selectedVersion} = useBibleVersion();
  const {achievementService, initialized: servicesInitialized} = useServices();
  const {t} = useLanguage();
  const {getChapterProgress} = useReadingProgress();
  const {addFavorite, isFavorite} = useFavorites();

  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  const [lastRead, setLastRead] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chapterProgress, setChapterProgress] = useState(0);
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
          colors={celestialTheme.colors.backgroundGradient}
          style={styles.gradientBackground}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>
            {/* Skeleton for Verse of Day Card */}
            <View style={styles.section}>
              <Skeleton
                width="100%"
                height={240}
                borderRadius={celestialBorderRadius['2xl']}
                style={{marginBottom: celestialSpacing.lg}}
              />
            </View>

            {/* Skeleton for Stats Card */}
            <View style={styles.section}>
              <Skeleton
                width="100%"
                height={160}
                borderRadius={celestialBorderRadius['2xl']}
                style={{marginBottom: celestialSpacing.lg}}
              />
            </View>

            {/* Skeleton for Quick Access Buttons */}
            <View style={styles.section}>
              <Skeleton
                width={120}
                height={20}
                borderRadius={celestialBorderRadius.md}
                style={{marginBottom: celestialSpacing.base}}
              />
              <View style={styles.quickAccessGrid}>
                {[1, 2, 3, 4].map(i => (
                  <Skeleton
                    key={i}
                    width={(SCREEN_WIDTH - celestialSpacing.xl * 3) / 2}
                    height={100}
                    borderRadius={celestialBorderRadius.xl}
                  />
                ))}
              </View>
            </View>

            {/* Skeleton for Reading Plan */}
            <View style={styles.section}>
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
        colors={celestialTheme.colors.backgroundGradient}
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
        {/* ==================== HERO SECTION - Welcome Card ==================== */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}, {scale: scaleAnim}],
          }}>
          <BlurView
            intensity={isDark ? 40 : 70}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.heroCard,
              {
                backgroundColor: celestialTheme.colors.surfaceGlass,
                borderColor: celestialTheme.colors.glassBorder,
                borderRadius: celestialBorderRadius.cardLarge, // 28px
                shadowColor: '#6366f1',
                shadowOffset: {width: 0, height: 12},
                shadowOpacity: 0.35, // Sombra DRAMÁTICA
                shadowRadius: 24,
                elevation: 12, // Elevación DRAMÁTICA para Android
              },
            ]}>
            {/* Decorative circles blur effect */}
            <View style={styles.decorativeCircles}>
              <View
                style={[
                  styles.circle1,
                  {backgroundColor: celestialTheme.colors.glow},
                ]}
              />
              <View
                style={[
                  styles.circle2,
                  {backgroundColor: celestialTheme.colors.glow},
                ]}
              />
            </View>

            {/* Gradiente de fondo del hero */}
            <LinearGradient
              colors={celestialTheme.colors.primaryGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.heroGradient}>
              {/* Stars decoration - MÁS GRANDES Y VISIBLES */}
              <Ionicons
                name="star"
                size={28}
                color="rgba(255,255,255,0.45)"
                style={styles.star1}
              />
              <Ionicons
                name="star"
                size={22}
                color="rgba(255,255,255,0.35)"
                style={styles.star2}
              />
              <Ionicons
                name="star"
                size={18}
                color="rgba(255,255,255,0.40)"
                style={styles.star3}
              />

              <View style={styles.heroContent}>
                {/* Ícono principal - MÁS GRANDE */}
                <Ionicons name="book" size={64} color="#ffffff" />

                {/* Título y subtítulo */}
                <Text style={styles.heroTitle}>Bienvenido</Text>
                <Text style={styles.heroSubtitle}>
                  Tu viaje espiritual continúa
                </Text>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <StatsCard
                    icon="flame"
                    value={userStats.streak}
                    label="Días"
                    iconColor="#fbbf24"
                    pulse={userStats.streak > 0}
                  />

                  <View style={styles.statDivider} />

                  <StatsCard
                    icon="star"
                    value={`Nivel ${userStats.level}`}
                    label="Rango"
                    iconColor="#fbbf24"
                  />

                  <View style={styles.statDivider} />

                  <StatsCard
                    icon="trending-up"
                    value={`${Math.round(userStats.progress)}%`}
                    label="Progreso"
                    iconColor="#fbbf24"
                  />
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* ==================== VERSE OF THE DAY ==================== */}
        {dailyVerse && (
          <Animated.View
            style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
            <VerseOfDayCard
              verseText={dailyVerse.text}
              reference={`${dailyVerse.book} ${dailyVerse.chapter}:${dailyVerse.verse}`}
              title="✨ Verso del Día"
              isDark={isDark}
              shadowIntensity="xl" // Sombra más pronunciada
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
          </Animated.View>
        )}

        {/* ==================== CONTINUE READING ==================== */}
        {lastRead && (
          <Animated.View
            style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() =>
                handlePress(() =>
                  router.push(
                    `/verse/${lastRead.book}/${lastRead.chapter}` as any,
                  ),
                )
              }>
              <LinearGradient
                colors={['#FFB74D', '#FF9800', '#F57C00']} // Gradiente naranja vibrante
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={[
                  styles.continueButton,
                  {
                    borderRadius: celestialBorderRadius.cardMedium, // 24px
                    shadowColor: '#FFB74D',
                    shadowOffset: {width: 0, height: 8},
                    shadowOpacity: 0.4, // MÁS visible
                    shadowRadius: 16,
                    elevation: 12, // DUPLICADO para Android
                  },
                ]}>
                <View style={styles.continueHeader}>
                  <Ionicons name="play-circle" size={48} color="#ffffff" />
                  <Text style={styles.continueTitle}>Continuar Leyendo</Text>
                </View>

                <Text style={styles.continueReference}>
                  {lastRead.book} {lastRead.chapter}:{lastRead.verse || 1}
                </Text>

                {/* Progress bar */}
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <Animated.View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.round(chapterProgress)}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(chapterProgress)}% completado
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ==================== QUICK ACCESS ==================== */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              Acceso Rápido
            </Text>
            <Ionicons
              name="flash"
              size={26}
              color={celestialTheme.colors.warning}
            />
          </View>

          <View style={styles.quickGrid}>
            {QUICK_ACCESS_BOOKS.map((book, index) => (
              <QuickAccessButton
                key={book.name}
                name={book.name}
                icon={book.icon}
                color={book.color}
                onPress={() =>
                  handlePress(() => router.push(`/chapter/${book.name}` as any))
                }
                recentlyAccessed={index === 0} // Primer libro como recently accessed
                delay={index * 50}
                isDark={isDark}
              />
            ))}
          </View>
        </Animated.View>

        {/* ==================== READING PLANS ==================== */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              Planes de Lectura
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
            {READING_PLANS.slice(0, 3).map((plan, index) => (
              <ReadingPlanCard
                key={plan.id}
                name={plan.name}
                description={plan.description}
                subtitle={`Plan de ${plan.duration} días`}
                icon="book-outline"
                color={PLAN_COLORS[index % PLAN_COLORS.length]}
                duration={plan.duration}
                daysCompleted={Math.floor(plan.duration * 0.3)} // Simulado
                onPress={() =>
                  handlePress(() =>
                    router.push(
                      `/chapter/${plan.days[0].readings[0].book}` as any,
                    ),
                  )
                }
                continueText="Comenzar"
                isDark={isDark}
              />
            ))}
          </ScrollView>
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
            "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."
          </Text>
          <Text
            style={[
              styles.footerReference,
              {color: celestialTheme.colors.textTertiary},
            ]}>
            — Salmos 119:105
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ==================== DATA ====================

/**
 * Libros de acceso rápido con íconos vectoriales (NO emojis)
 */
const QUICK_ACCESS_BOOKS = [
  {name: 'Génesis', icon: 'book-outline' as const, color: '#6366f1'}, // indigo
  {name: 'Salmos', icon: 'musical-notes-outline' as const, color: '#8b5cf6'}, // purple
  {name: 'Proverbios', icon: 'bulb-outline' as const, color: '#f59e0b'}, // amber
  {name: 'Juan', icon: 'heart-outline' as const, color: '#ef4444'}, // red
  {name: 'Romanos', icon: 'document-text-outline' as const, color: '#10b981'}, // emerald
  {name: 'Apocalipsis', icon: 'flash-outline' as const, color: '#ec4899'}, // pink
];

/**
 * Colores para los planes de lectura
 */
const PLAN_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
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

  // Hero Card - Diseño minimalista y profesional
  heroCard: {
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 24,
  },
  decorativeCircles: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -50,
    right: -50,
    opacity: 0.3,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    bottom: -30,
    left: -30,
    opacity: 0.2,
  },
  heroGradient: {
    padding: 32,
    paddingTop: 40,
    paddingBottom: 32,
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
    fontSize: 36, // 3xl - MÁS GRANDE Y DRAMÁTICO
    fontWeight: '800', // Más bold
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: 19, // lg - MÁS GRANDE
    fontWeight: '500', // Más bold
    color: 'rgba(255,255,255,0.95)', // Más contraste
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 26,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },

  // Continue Reading Button - DRAMÁTICO Y VISIBLE
  continueButton: {
    padding: 32, // Incrementado de 24
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16, // Incrementado de 12
  },
  continueTitle: {
    fontSize: 28, // Incrementado de 24
    fontWeight: '800', // Más bold
    color: '#ffffff',
    marginLeft: 16, // Incrementado de 12
    letterSpacing: -0.5,
  },
  continueReference: {
    fontSize: 22, // Incrementado de 20
    fontWeight: '700', // Incrementado de 600
    color: 'rgba(255,255,255,1)', // Máximo contraste
    marginBottom: 20, // Incrementado de 16
    letterSpacing: 0.2,
  },
  progressBarContainer: {
    marginTop: 12, // Incrementado de 8
  },
  progressBarBackground: {
    height: 10, // Incrementado de 8
    backgroundColor: 'rgba(255,255,255,0.35)', // Más visible
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10, // Incrementado de 8
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 5,
    shadowColor: '#ffffff',
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  progressText: {
    fontSize: 14, // Incrementado de 12
    fontWeight: '700', // Incrementado de 600
    color: 'rgba(255,255,255,1)', // Máximo contraste
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
});
