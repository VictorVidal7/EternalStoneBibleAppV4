/**
 * 🎨 CHAPTER SELECTION SCREEN - PREMIUM
 *
 * Pantalla de selección de capítulos con diseño premium
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
import {getBookTheme} from '../../src/constants/bookThemes';
import {useChapterFavorites} from '../../src/hooks/useChapterFavorites';
import {useReadingProgress} from '../../src/context/ReadingProgressContext';

// Design tokens
import {
  spacing,
  borderRadius,
  fontSize,
  shadows,
} from '../../src/styles/designTokens';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARDS_PER_ROW = 4;
const CARD_SIZE = (SCREEN_WIDTH - spacing.lg * 2) / CARDS_PER_ROW - spacing.md;

interface ChapterItem {
  chapter: number;
  id: string;
}

export default function ChapterSelectionScreen() {
  const router = useRouter();
  const {colors, isDark} = useTheme();
  const {t} = useLanguage();
  const params = useLocalSearchParams<{book: string}>();
  const {isFavorite, toggleFavorite} = useChapterFavorites();
  const {getChapterProgress} = useReadingProgress();
  const [isLoading, setIsLoading] = useState(true);

  // Manejar el parámetro book (puede venir como string o array)
  const rawBook = params.book;
  const book = typeof rawBook === 'string' ? rawBook : rawBook?.[0] || '';

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;

  const bookInfo = getBookByName(book);
  const bookTheme = useMemo(
    () => getBookTheme(bookInfo?.name || ''),
    [bookInfo],
  );

  // Optimización: Gradientes memorizados con tema dinámico del libro
  const headerGradient = useMemo(
    () => (isDark ? bookTheme.gradientDark : bookTheme.gradient),
    [isDark, bookTheme],
  );

  /**
   * Generar lista de capítulos
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
   * Navegar a la pantalla de versículos
   */
  const navigateToVerse = useCallback(
    (chapter: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/verse/${book}/${chapter}` as any);
    },
    [router, book],
  );

  /**
   * Renderizar item de capítulo con animación
   */
  const renderItem = useCallback(
    ({item, index}: {item: ChapterItem; index: number}) => {
      const chapterProgress = getChapterProgress(
        bookInfo?.name || '',
        item.chapter.toString(),
      );
      const isCompleted = chapterProgress >= 100;

      return (
        <ChapterCard
          chapter={item.chapter}
          onPress={() => navigateToVerse(item.chapter)}
          index={index}
          colors={colors}
          isDark={isDark}
          t={t}
          bookName={bookInfo?.name || ''}
          isFavorite={isFavorite(bookInfo?.name || '', item.chapter)}
          onToggleFavorite={() =>
            toggleFavorite(bookInfo?.name || '', item.chapter)
          }
          isCompleted={isCompleted}
          progressPercentage={chapterProgress}
        />
      );
    },
    [
      colors,
      isDark,
      navigateToVerse,
      bookInfo,
      t,
      isFavorite,
      toggleFavorite,
      getChapterProgress,
    ],
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
                <View style={styles.headerBadges}>
                  <View style={styles.chapterCountBadge}>
                    <Ionicons name="document-text" size={14} color="#fbbf24" />
                    <Text style={styles.chapterCountText}>
                      {chapters.length}{' '}
                      {chapters.length === 1
                        ? t.bible.chapter
                        : t.bible.chapters}
                    </Text>
                  </View>
                  <View style={styles.themeBadge}>
                    <Text style={styles.themeEmoji}>{bookTheme.emoji}</Text>
                    <Text style={styles.themeDescription}>
                      {bookTheme.description}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Decoración */}
            <View style={styles.headerDecoration}>
              <Ionicons
                name="sparkles"
                size={20}
                color="rgba(255,255,255,0.3)"
                style={styles.decorationIcon1}
              />
              <Ionicons
                name="star"
                size={16}
                color="rgba(255,255,255,0.2)"
                style={styles.decorationIcon2}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Grid de capítulos */}
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
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
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
      </View>
    </>
  );
}

// ==================== CHAPTER CARD COMPONENT ====================

interface ChapterCardProps {
  chapter: number;
  onPress: () => void;
  index: number;
  colors: any;
  isDark: boolean;
  t: any;
  bookName: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isCompleted: boolean;
  progressPercentage: number;
}

const ChapterCard: React.FC<ChapterCardProps> = React.memo(
  ({
    chapter,
    onPress,
    index,
    colors,
    isDark,
    t,
    bookName,
    isFavorite,
    onToggleFavorite,
    isCompleted,
    progressPercentage,
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const [isPressed, setIsPressed] = useState(false);

    const handlePressIn = () => {
      setIsPressed(true);
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      setIsPressed(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`${t.bible.chapter} ${chapter} ${t.bible.of} ${bookName}`}
          accessibilityHint={`${t.bible.openChapter} ${chapter} ${t.bible.of} ${bookName}`}
          accessibilityState={{selected: isFavorite}}
          style={styles.cardTouchable}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#35384E' : '#FFFFFF',
                shadowColor: isDark ? '#000000' : '#000000',
                shadowOffset: {width: 0, height: 2},
                shadowOpacity: isDark ? 0.3 : 0.08,
                shadowRadius: 12,
                elevation: 3,
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              },
            ]}>
            {/* Botón de favorito */}
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={e => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              accessibilityRole="button"
              accessibilityLabel={
                isFavorite
                  ? `${t.bible.removeFavorite} ${t.bible.chapter} ${chapter}`
                  : `${t.bible.addFavorite} ${t.bible.chapter} ${chapter}`
              }
              accessibilityHint={
                isFavorite
                  ? t.bible.removeFromFavorites
                  : t.bible.addToFavorites
              }>
              <Ionicons
                name={isFavorite ? 'star' : 'star-outline'}
                size={16}
                color={isFavorite ? '#fbbf24' : isDark ? '#9ca3af' : '#d1d5db'}
              />
            </TouchableOpacity>

            {/* Badge de progreso completado */}
            {isCompleted && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              </View>
            )}

            {/* Badge de progreso en curso (si está entre 1% y 99%) */}
            {!isCompleted && progressPercentage > 0 && (
              <View style={styles.progressBadge}>
                <View
                  style={[
                    styles.progressIndicator,
                    {
                      backgroundColor: isDark
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(59, 130, 246, 0.1)',
                      borderColor: isDark
                        ? 'rgba(59, 130, 246, 0.4)'
                        : 'rgba(59, 130, 246, 0.3)',
                    },
                  ]}>
                  <Ionicons
                    name="book-outline"
                    size={12}
                    color={isDark ? '#60a5fa' : '#3b82f6'}
                  />
                </View>
              </View>
            )}

            {/* Número del capítulo */}
            <Text
              style={[
                styles.chapterNumber,
                {
                  color: isDark ? '#E0E7FF' : '#4A90E2',
                },
              ]}>
              {chapter}
            </Text>
          </View>
        </TouchableOpacity>
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
    borderRadius: borderRadius.xl,
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
    borderRadius: borderRadius.lg,
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
    borderRadius: borderRadius.lg,
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
    borderRadius: borderRadius.xl,
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

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 80 : 40,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius['2xl'],
    borderBottomRightRadius: borderRadius['2xl'],
    ...shadows.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
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
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  chapterCountText: {
    fontSize: fontSize.xs,
    color: '#ffffff',
    fontWeight: '600',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  themeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  themeEmoji: {
    fontSize: 14,
  },
  themeDescription: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '500',
  },
  headerDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  decorationIcon1: {
    position: 'absolute',
    top: 70,
    right: 30,
  },
  decorationIcon2: {
    position: 'absolute',
    top: 110,
    right: 50,
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

  // Card - Estilo profesional con profundidad (matching BibleLibrary)
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    padding: 6, // Margen entre botones
  },
  cardTouchable: {
    width: CARD_SIZE - 12,
    height: CARD_SIZE - 12,
  },
  card: {
    width: CARD_SIZE - 12,
    height: CARD_SIZE - 12,
    borderRadius: 16, // Esquinas generosas y modernas
    borderWidth: 0, // Sin bordes duros
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterNumber: {
    fontSize: 26, // Tamaño óptimo para legibilidad
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  favoriteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    padding: 4,
    zIndex: 10,
  },
  completedBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    zIndex: 10,
  },
  progressBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    zIndex: 10,
  },
  progressIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
