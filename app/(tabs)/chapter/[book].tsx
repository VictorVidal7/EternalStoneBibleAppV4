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
import {haptics} from '@lib/haptics';

import {getBookByName} from '@/constants/bible';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {PremiumSkeleton} from '@components/PremiumSkeleton';
import {PressableScale} from '@components/ui/PressableScale';
import {useReadingProgress} from '@context/ReadingProgressContext';
import {
  summarizeChapterProgress,
  gridScrollOffsetForChapter,
} from '@lib/reading/chapterProgress';
import {hitSlopToMinTarget} from '@lib/a11y/touchTarget';
// import {AnimatedBottomNav} from '@components/navigation/AnimatedBottomNav';

// Design tokens
import {spacing, fontSize, shadows, staticColors} from '@/styles/designTokens';
import {centeredMaxWidth, CONTENT_MAX_WIDTH} from '@/styles/responsive';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARDS_PER_ROW = 5;
// Sprint 96: size the chapter-number cards from the CAPPED content width on
// wide screens (foldable/tablet) so the 5-up grid stays a comfortable size and
// the row centers, instead of 5 huge cards stretched across the full width.
// No-op on phones (screen narrower than the cap).
const EFFECTIVE_CONTENT_WIDTH = Math.min(SCREEN_WIDTH, CONTENT_MAX_WIDTH);
const CARD_SIZE = (EFFECTIVE_CONTENT_WIDTH - spacing.lg * 2) / CARDS_PER_ROW;

// 40dp header buttons + the ~28dp-tall Continue pill fall short of the 48dp
// minimum touch target (S74 hit-target audit).
const HEADER_BUTTON_HIT_SLOP = hitSlopToMinTarget(40);
const CONTINUE_HIT_SLOP = hitSlopToMinTarget(28);

interface ChapterItem {
  chapter: number;
  id: string;
}

export default function ChapterSelectionScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  // Book name follows the READING version's language (RVR1960 -> "Juan"), so the
  // grid matches the version and the reader, not the UI language.
  const bookNameLang: 'es' | 'en' =
    selectedVersion.language === 'es' ? 'es' : 'en';
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

  // Book-level reading-progress summary (Sprint 73) — rolls the same per-chapter
  // values the grid already paints into a "X/N · Y%" header + a one-tap Continue
  // into the first unfinished chapter. Keyed on the canonical book name (the
  // progress store's key), recomputes when progress changes.
  const progressSummary = useMemo(
    () =>
      summarizeChapterProgress(bookInfo?.chapters ?? 0, ch =>
        getChapterProgress(bookInfo?.name || '', String(ch)),
      ),
    [bookInfo, getChapterProgress],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      startAnimations();
    }, 100);
    return () => clearTimeout(timer);
  }, [book, bookInfo, chapters]);

  // Auto-scroll the grid to the Continue/Start target (Sprint 74): opening a
  // big book (Salmos, 150 chapters) used to land at chapter 1 even when the
  // reader left off 20 rows down. One instant jump per book, only once the
  // grid is mounted; early chapters resolve to offset 0 (no movement), so a
  // fresh book is untouched.
  const gridRef = useRef<FlatList<ChapterItem>>(null);
  const autoScrolledBookRef = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading || !bookInfo) return;
    if (autoScrolledBookRef.current === book) return;
    autoScrolledBookRef.current = book;
    const target = progressSummary.nextUnreadChapter;
    if (target === null || progressSummary.read === 0) return;
    const offset = gridScrollOffsetForChapter(target, CARDS_PER_ROW, CARD_SIZE);
    if (offset <= 0) return;
    // Non-animated: an initial position, not a transition (reduce-motion-safe).
    gridRef.current?.scrollToOffset({offset, animated: false});
  }, [isLoading, book, bookInfo, progressSummary]);

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
      haptics.press();
      router.push(`/verse/${book}/${chapter}` as never);
    },
    [router, book],
  );

  /**
   * Navegar hacia atras
   */
  const handleBack = useCallback(() => {
    haptics.tap();
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
      // Localized name for the accessibility label (the progress lookup above
      // stays keyed on the canonical name).
      const localizedBookName =
        (bookNameLang === 'en' ? bookInfo?.nameEn : bookInfo?.name) || '';

      return (
        <ChapterCard
          chapter={item.chapter}
          onPress={() => navigateToVerse(item.chapter)}
          isDark={isDark}
          colors={colors}
          t={t}
          bookName={localizedBookName}
          isCompleted={isCompleted}
          progressPercentage={chapterProgress}
        />
      );
    },
    [
      isDark,
      colors,
      navigateToVerse,
      bookInfo,
      t,
      getChapterProgress,
      bookNameLang,
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
              <Ionicons name="arrow-back" size={20} color={colors.onPrimary} />
              <Text style={[styles.backButtonText, {color: colors.onPrimary}]}>
                {t.bible.back}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  }

  // Skeleton Grid Component
  const SkeletonGrid = () => (
    <View style={[styles.listContainer, {paddingTop: spacing.lg}]}>
      <View style={[styles.listContent, styles.skeletonGridRow]}>
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
              hitSlop={HEADER_BUTTON_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Info button — Sprint 33: opens the per-book devotional intro. */}
            <TouchableOpacity
              style={styles.headerInfoButton}
              onPress={() => {
                haptics.tap();
                router.push(`/features/about-book/${book}` as never);
              }}
              hitSlop={HEADER_BUTTON_HIT_SLOP}
              accessibilityRole="button"
              accessibilityLabel={t.bookIntro.openLabel}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color="#ffffff"
              />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                {/* Decorative — the header title right after carries the
                    meaning, so keep TalkBack from landing on the glyph. */}
                <Ionicons
                  name="book-outline"
                  size={32}
                  color="#ffffff"
                  accessible={false}
                  importantForAccessibility="no"
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerSubtitle}>
                  {t.bible.selectChapter}
                </Text>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {bookNameLang === 'en' ? bookInfo.nameEn : bookInfo.name}
                </Text>
                <View style={styles.chapterCountBadge}>
                  <Ionicons
                    name="document-text"
                    size={14}
                    color="#fbbf24"
                    accessible={false}
                    importantForAccessibility="no"
                  />
                  <Text style={styles.chapterCountText}>
                    {chapters.length}{' '}
                    {chapters.length === 1 ? t.bible.chapter : t.bible.chapters}
                  </Text>
                </View>
              </View>
            </View>

            {/* Reading-progress summary + Continue CTA (Sprint 73) — elevates the
                per-chapter progress the grid already shows into a book overview
                and a one-tap jump to where the reader left off. */}
            {progressSummary.total > 0 && (
              <View style={styles.progressSummary}>
                <View style={styles.progressSummaryBarTrack}>
                  <View
                    style={[
                      styles.progressSummaryBarFill,
                      {width: `${progressSummary.percentComplete}%`},
                    ]}
                  />
                </View>
                <View style={styles.progressSummaryRow}>
                  <Text
                    style={styles.progressSummaryText}
                    // The compact "12/150 · 8%" is cryptic when read aloud —
                    // give screen readers the full sentence instead.
                    accessibilityLabel={t.bible.chaptersReadOfA11y
                      .replace(
                        '{{completed}}',
                        String(progressSummary.completed),
                      )
                      .replace('{{total}}', String(progressSummary.total))
                      .replace(
                        '{{percent}}',
                        String(progressSummary.percentComplete),
                      )}>
                    {t.bible.chaptersReadOf
                      .replace(
                        '{{completed}}',
                        String(progressSummary.completed),
                      )
                      .replace('{{total}}', String(progressSummary.total))
                      .replace(
                        '{{percent}}',
                        String(progressSummary.percentComplete),
                      )}
                  </Text>
                  {progressSummary.nextUnreadChapter !== null && (
                    <TouchableOpacity
                      style={styles.continueButton}
                      onPress={() =>
                        navigateToVerse(progressSummary.nextUnreadChapter ?? 1)
                      }
                      hitSlop={CONTINUE_HIT_SLOP}
                      accessibilityRole="button"
                      accessibilityLabel={
                        progressSummary.read > 0
                          ? t.bible.continueReading
                          : t.bible.startReading
                      }
                      accessibilityHint={t.bible.continueChapterHint.replace(
                        '{{chapter}}',
                        String(progressSummary.nextUnreadChapter),
                      )}>
                      <Ionicons
                        name={progressSummary.read > 0 ? 'play' : 'book'}
                        size={14}
                        color="#ffffff"
                      />
                      <Text style={styles.continueButtonText}>
                        {progressSummary.read > 0
                          ? t.bible.continueReading
                          : t.bible.startReading}{' '}
                        {progressSummary.nextUnreadChapter}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Grid de capitulos */}
        {isLoading ? (
          <SkeletonGrid />
        ) : (
          <View style={styles.listContainer}>
            {chapters.length > 0 ? (
              <FlatList
                ref={gridRef}
                data={chapters}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={CARDS_PER_ROW}
                key={CARDS_PER_ROW}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.listContent,
                  styles.listContentBottomPad,
                  centeredMaxWidth(CONTENT_MAX_WIDTH),
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

        {/* Bottom Navigation is now handled by TabLayout */}
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
    colors,
    t,
    bookName,
    isCompleted,
    progressPercentage,
  }) => {
    // Sprint 66: the bespoke press-scale (and 11 like it) is now the shared,
    // reduce-motion-aware PressableScale for one cohesive tap feel app-wide.
    return (
      <View style={styles.cardWrapper}>
        <PressableScale
          onPress={onPress}
          accessibilityRole="button"
          // Surface the read-state the card paints visually (checkmark / dot)
          // so TalkBack hears "Chapter 12 of Psalms, read" too.
          accessibilityLabel={
            `${t.bible.chapter} ${chapter} ${t.bible.of} ${bookName}` +
            (isCompleted
              ? `, ${t.bible.chapterReadA11y}`
              : progressPercentage > 0
                ? `, ${t.bible.chapterInProgressA11y}`
                : '')
          }
          accessibilityHint={`${t.bible.openChapter} ${chapter} ${t.bible.of} ${bookName}`}
          style={styles.cardTouchable}>
          <View
            style={[
              styles.card,
              styles.cardFlat,
              {
                backgroundColor: staticColors.transparent,
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
        </PressableScale>
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
    color: staticColors.white,
    marginTop: spacing.base,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: fontSize.base,
    color: staticColors.glassWhite90,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorDetails: {
    backgroundColor: staticColors.redTint10,
    padding: spacing.base,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: staticColors.redTint30,
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
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfoButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
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
  headerSubtitle: {
    fontSize: 16,
    color: staticColors.glassWhite90,
    fontWeight: '500',
    marginBottom: 4,
    textShadowColor: staticColors.overlayBlack20,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: staticColors.white,
    marginBottom: spacing.xs,
    textShadowColor: staticColors.overlayBlack30,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 4,
  },
  chapterCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.glassWhite20,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 4,
  },
  chapterCountText: {
    fontSize: fontSize.xs,
    color: staticColors.white,
    fontWeight: '600',
  },

  // Reading-progress summary (Sprint 73)
  progressSummary: {
    marginTop: 16,
  },
  progressSummaryBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: staticColors.glassWhite20,
    overflow: 'hidden',
  },
  progressSummaryBarFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: staticColors.white,
  },
  progressSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressSummaryText: {
    fontSize: fontSize.sm,
    color: staticColors.white,
    fontWeight: '600',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: staticColors.glassWhite20,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
  },
  continueButtonText: {
    fontSize: fontSize.xs,
    color: staticColors.white,
    fontWeight: '700',
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
  skeletonGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  listContentBottomPad: {
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
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
  cardFlat: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 1,
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
    backgroundColor: staticColors.emeraldTint15,
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
