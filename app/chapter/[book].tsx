/**
 * CHAPTER SELECTION SCREEN
 *
 * Pantalla de seleccion de capitulos con diseno limpio y profesional
 */

import React, {useCallback, useEffect, useState, useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {FlatList} from 'react-native';
import {useRouter, useLocalSearchParams, Stack} from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {getBookByName} from '../../src/constants/bible';
import {useTheme} from '../../src/hooks/useTheme';
import {useLanguage} from '../../src/hooks/useLanguage';
import {PremiumSkeleton} from '../../src/components/PremiumSkeleton';
import {useReadingProgress} from '../../src/context/ReadingProgressContext';
import {AnimatedBottomNav} from '../../src/components/navigation/AnimatedBottomNav';

// Design tokens
import {spacing, fontSize, shadows} from '../../src/styles/designTokens';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARDS_PER_ROW = 5;
const CARD_SIZE = (SCREEN_WIDTH - spacing.lg * 2) / CARDS_PER_ROW;

interface ChapterItem {
  chapter: number;
  id: string;
}

export default function ChapterSelectionScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const {t} = useLanguage();
  const params = useLocalSearchParams<{book: string}>();
  const {getChapterProgress} = useReadingProgress();
  const [isLoading, setIsLoading] = useState(true);

  // Manejar el parametro book (puede venir como string o array)
  const rawBook = params.book;
  const book = typeof rawBook === 'string' ? rawBook : rawBook?.[0] || '';

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const bookInfo = getBookByName(book);

  // Gradiente dinámico sincronizado con el tema de la app (con fallback)
  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#4f46e5', '#7c3aed', '#a855f7']) as [string, string, string],
    [gradient?.headerColors],
  );

  /**
   * Generar lista de capitulos
   */
  const chapters = useMemo((): ChapterItem[] => {
    if (!bookInfo) {
      return [];
    }

    const chapterList = Array.from({length: bookInfo.chapters}, (_, i) => ({
      chapter: i + 1,
      id: `chapter-${i + 1}`,
    }));

    return chapterList;
  }, [bookInfo, book]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      startAnimations();
    }, 100);
    return () => clearTimeout(timer);
  }, [book, bookInfo, chapters]);

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
    ]).start();
  };

  /**
   * Navegar a la pantalla de versiculos
   */
  const navigateToVerse = useCallback(
    (chapter: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/verse/${book}/${chapter}` as any);
    },
    [router, book],
  );

  /**
   * Navegar hacia atras
   */
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  /**
   * Renderizar item de capitulo con animacion
   */
  const renderItem = useCallback(
    ({item}: {item: ChapterItem}) => {
      const chapterProgress = getChapterProgress(
        bookInfo?.name || '',
        item.chapter.toString(),
      );
      const isCompleted = chapterProgress >= 100;

      return (
        <ChapterCard
          chapter={item.chapter}
          onPress={() => navigateToVerse(item.chapter)}
          isDark={isDark}
          colors={colors}
          t={t}
          bookName={bookInfo?.name || ''}
          isCompleted={isCompleted}
          progressPercentage={chapterProgress}
        />
      );
    },
    [isDark, colors, navigateToVerse, bookInfo, t, getChapterProgress],
  );

  // Mostrar error si no se encuentra el libro
  if (!bookInfo) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        <View
          style={[
            styles.container,
            styles.errorContainer,
            {backgroundColor: colors.background},
          ]}>
          <LinearGradient
            colors={isDark ? ['#ef4444', '#dc2626'] : ['#f87171', '#ef4444']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.errorHeader}>
            <Ionicons name="alert-circle" size={64} color="#ffffff" />
            <Text style={styles.errorTitle}>{t.bible.bookNotFound}</Text>
            <Text style={styles.errorSubtitle}>
              {t.bible.couldNotFind}: "{book}"
            </Text>
          </LinearGradient>

          <View style={styles.errorDetails}>
            <Text style={[styles.errorLabel, {color: colors.textSecondary}]}>
              {t.bible.parameterReceived}:
            </Text>
            <Text style={[styles.errorValue, {color: colors.text}]}>
              {JSON.stringify(params, null, 2)}
            </Text>

            <TouchableOpacity
              style={[styles.backButton, {backgroundColor: colors.primary}]}
              onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
              <Text style={styles.backButtonText}>{t.bible.back}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Skeleton Grid Component
  const SkeletonGrid = () => (
    <View style={[styles.listContainer, {paddingTop: spacing.lg}]}>
      <View
        style={[
          styles.listContent,
          {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          },
        ]}>
        {Array.from({length: 20}).map((_, i) => (
          <View key={i} style={styles.cardWrapper}>
            <PremiumSkeleton
              width={CARD_SIZE - 12}
              height={CARD_SIZE - 12}
              borderRadius={16}
              variant="rounded"
              animation="wave"
            />
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.container, {backgroundColor: colors.background}]}>
        {/* Header con gradiente */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          }}>
          <LinearGradient
            colors={headerGradient}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={styles.header}>
            {/* Boton de regreso */}
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="book-outline" size={32} color="#ffffff" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerSubtitle}>
                  {t.bible.selectChapter}
                </Text>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {bookInfo.name}
                </Text>
                <View style={styles.chapterCountBadge}>
                  <Ionicons name="document-text" size={14} color="#fbbf24" />
                  <Text style={styles.chapterCountText}>
                    {chapters.length}{' '}
                    {chapters.length === 1 ? t.bible.chapter : t.bible.chapters}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Grid de capitulos */}
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <View style={styles.listContainer}>
            {chapters.length > 0 ? (
              <FlatList
                data={chapters}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={CARDS_PER_ROW}
                key={CARDS_PER_ROW}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.listContent,
                  {paddingBottom: Platform.OS === 'ios' ? 100 : 80},
                ]}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="book-outline"
                  size={64}
                  color={colors.textTertiary}
                />
                <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
                  {t.bible.couldNotLoadChapters}
                </Text>
                <Text
                  style={[styles.emptySubtext, {color: colors.textTertiary}]}>
                  {t.bible.book}: {book || t.bible.notSpecified}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Bottom Navigation */}
        <AnimatedBottomNav activeTab="bible" />
      </View>
    </>
  );
}

// ==================== CHAPTER CARD COMPONENT ====================

interface ChapterCardProps {
  chapter: number;
  onPress: () => void;
  isDark: boolean;
  colors: any;
  t: any;
  bookName: string;
  isCompleted: boolean;
  progressPercentage: number;
}

const ChapterCard: React.FC<ChapterCardProps> = React.memo(
  ({
    chapter,
    onPress,
    isDark,
    colors,
    t,
    bookName,
    isCompleted,
    progressPercentage,
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <View style={styles.cardWrapper}>
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityRole="button"
            accessibilityLabel={`${t.bible.chapter} ${chapter} ${t.bible.of} ${bookName}`}
            accessibilityHint={`${t.bible.openChapter} ${chapter} ${t.bible.of} ${bookName}`}
            style={styles.cardTouchable}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: 'transparent',
                  shadowOpacity: 0,
                  shadowRadius: 0,
                  elevation: 0,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                },
              ]}>
              {/* Numero del capitulo */}
              <Text
                style={[
                  styles.chapterNumber,
                  {
                    color: colors.primary,
                  },
                ]}>
                {chapter}
              </Text>

              {/* Indicador de completado */}
              {isCompleted && (
                <View style={styles.completedIndicator}>
                  <Ionicons name="checkmark" size={12} color="#10b981" />
                </View>
              )}

              {/* Indicador de progreso (si tiene progreso pero no esta completado) */}
              {!isCompleted && progressPercentage > 0 && (
                <View style={styles.progressIndicator}>
                  <View
                    style={[
                      styles.progressDot,
                      {
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  },
);

ChapterCard.displayName = 'ChapterCard';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Error State
  errorContainer: {
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorHeader: {
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: spacing.xl,
    ...shadows.lg,
  },
  errorTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#ffffff',
    marginTop: spacing.base,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: fontSize.base,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorDetails: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.base,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  errorValue: {
    fontSize: fontSize.xs,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: spacing.base,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.base,
    borderRadius: 16,
    marginTop: spacing.base,
    gap: spacing.xs,
  },
  backButtonText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Loading State
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingCard: {
    padding: spacing['2xl'],
    borderRadius: 16,
    alignItems: 'center',
    width: SCREEN_WIDTH - spacing.xl * 2,
    ...shadows.xl,
  },
  loadingTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#ffffff',
    marginTop: spacing.base,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: fontSize.base,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.9,
  },

  // Header - Estandarizado con todas las pantallas
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    ...shadows.lg,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
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
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  chapterCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 4,
  },
  chapterCountText: {
    fontSize: fontSize.xs,
    color: '#ffffff',
    fontWeight: '600',
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginTop: spacing.base,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Card - Estilo profesional con profundidad
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    padding: 4, // Menos padding para 5 por fila
  },
  cardTouchable: {
    width: CARD_SIZE - 8,
    height: CARD_SIZE - 8,
  },
  card: {
    width: CARD_SIZE - 8,
    height: CARD_SIZE - 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumber: {
    fontSize: 20, // Reducido para 5 por fila
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  completedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
