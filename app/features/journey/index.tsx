/* eslint-disable react-native/no-color-literals, react-native/no-inline-styles --
   bespoke "Tu camino" Wrapped palette: each slide is a full-bleed branded
   gradient with white text, intentionally outside the app theme
   (Spotify-Wrapped convention), with the Instagram-style progress segments
   sized inline per slide index; mirrors ImmersiveReader's celestial palette. */
/**
 * 🛤️ "TU CAMINO" — Wrapped story screen (Sprint 57)
 *
 * A Spotify-Wrapped style recap of the user's lifetime journey in the Word:
 * verses read, reading streak, favorite book, memorization, achievements —
 * each a full-screen gradient slide you tap through, building to a shareable
 * finale card.
 *
 * Architecture (Sprint 42-56 rigor):
 *  - All numbers come from the PURE `buildJourneyRecap` (no math here).
 *  - This is a ROUTE, not a react-native <Modal> — so the S52 gotcha
 *    (reanimated/RNGH go inert inside a Modal) never bites; navigation is
 *    plain-RN tap zones layered BEHIND the content (pointerEvents="box-none"
 *    so empty areas advance while the share button keeps its own touch).
 *  - Entrance animation uses RN Animated, gated by `useReducedMotion` (S55)
 *    so reduce-motion (the emulator default) renders the final frame instantly.
 *  - The shareable finale reuses the S56 view-shot pipeline (captureRef +
 *    expo-sharing) — no rebuild (view-shot linked since Sprint 3).
 *
 * 100% device-local, zero Firestore. Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {captureRef} from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useReducedMotion} from '@hooks/useReducedMotion';
import {useToast} from '@context/ToastContext';
import {useServices} from '@context/ServicesContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {useFavorites} from '@context/FavoritesContext';
import {getAllReviewEvents} from '@lib/memory/reviewEventStore';
import {logger} from '@lib/utils/logger';
import {formatReadingTime} from '@lib/utils/formatReadingTime';
import {getBookByName} from '@/constants/bible';
import {TOTAL_BIBLE_BOOKS} from '@lib/achievements/bookCompletion';
import {
  buildJourneyRecap,
  type JourneyRecap,
} from '@/features/journey/journeyRecap';
import {
  spacing,
  fontSize as fontSizes,
  borderRadius,
} from '@/styles/designTokens';

type SlideKey =
  | 'intro'
  | 'verses'
  | 'chapters'
  | 'books'
  | 'streak'
  | 'time'
  | 'mostRead'
  | 'favorite'
  | 'engagement'
  | 'memory'
  | 'achievements'
  | 'finale';

interface SecondaryRow {
  label: string;
  value: string;
}

interface Slide {
  key: SlideKey;
  gradient: readonly [string, string, ...string[]];
  icon: keyof typeof Ionicons.glyphMap;
  a11y: string;
  render: () => React.ReactNode;
}

/** Bespoke per-slide gradients (white text over each). */
const SLIDE_GRADIENTS: Record<SlideKey, [string, string, string]> = {
  intro: ['#4f46e5', '#7c3aed', '#a855f7'],
  verses: ['#0ea5e9', '#2563eb', '#1e3a8a'],
  chapters: ['#10b981', '#0d9488', '#115e59'],
  books: ['#16a34a', '#15803d', '#14532d'],
  streak: ['#f59e0b', '#ea580c', '#b91c1c'],
  time: ['#0f766e', '#0e7490', '#0c4a6e'],
  mostRead: ['#d97706', '#b45309', '#78350f'],
  favorite: ['#ec4899', '#be185d', '#831843'],
  engagement: ['#8b5cf6', '#6d28d9', '#4c1d95'],
  memory: ['#06b6d4', '#0e7490', '#155e75'],
  achievements: ['#eab308', '#a16207', '#713f12'],
  finale: ['#6366f1', '#7c3aed', '#1e1b4b'],
};

const WHITE = '#FFFFFF';
const WHITE_DIM = 'rgba(255,255,255,0.82)';
const WHITE_FAINT = 'rgba(255,255,255,0.16)';

export default function JourneyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const reduced = useReducedMotion();
  const toast = useToast();

  const {achievementService} = useServices();
  const {cards} = useMemoryDeck();
  const {favorites} = useFavorites();
  const {width} = useWindowDimensions();

  const j = t.journey;
  const ri = t.readingInsights; // reuses the reading-time unit words

  const [recap, setRecap] = useState<JourneyRecap | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [index, setIndex] = useState(0);
  const [sharing, setSharing] = useState(false);

  const shareCardRef = useRef<any>(null);

  // ---- Data load (read-only; pure module does the math) -------------------
  const loadRecap = useCallback(async () => {
    if (!achievementService) return;
    try {
      setStatus('loading');
      const [stats, readingLog, reviewEvents, bookReadingLog] =
        await Promise.all([
          achievementService.getUserStats(),
          achievementService.getReadingLog(),
          getAllReviewEvents(),
          achievementService.getBookReadingLog(),
        ]);
      const built = buildJourneyRecap(
        {
          stats,
          readingLog,
          reviewEvents,
          cards,
          favorites: favorites.map(f => ({
            book: f.book,
            createdAt: f.createdAt,
          })),
          bookReadingLog,
        },
        new Date(),
      );
      setRecap(built);
      setStatus('ready');
    } catch (err) {
      logger.error('Journey recap load failed', err as Error, {
        component: 'JourneyScreen',
        action: 'loadRecap',
      });
      setStatus('error');
    }
  }, [achievementService, cards, favorites]);

  useEffect(() => {
    loadRecap();
  }, [loadRecap]);

  // ---- Slides (derived from the recap; skip empty sections) ---------------
  const slides = useMemo<Slide[]>(() => {
    if (!recap || !recap.hasData) return [];

    const fmtDate = (ms: number): string =>
      new Date(ms).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    const num = (n: number): string => n.toLocaleString();

    const list: Slide[] = [];

    // 1 — Intro
    list.push({
      key: 'intro',
      gradient: SLIDE_GRADIENTS.intro,
      icon: 'footsteps',
      a11y: `${j.introTitle}. ${j.introBody}`,
      render: () => (
        <SlideBody
          icon="footsteps"
          title={j.introTitle}
          big=""
          bigLabel={j.introBody}
          caption={
            recap.journeyStartMs
              ? j.since.replace('{{date}}', fmtDate(recap.journeyStartMs))
              : undefined
          }
        />
      ),
    });

    // 2 — Verses read
    list.push({
      key: 'verses',
      gradient: SLIDE_GRADIENTS.verses,
      icon: 'book',
      a11y: `${num(recap.versesRead)} ${j.versesReadLabel}`,
      render: () => (
        <SlideBody
          icon="book"
          title={j.versesReadTitle}
          big={num(recap.versesRead)}
          bigLabel={j.versesReadLabel}
          caption={j.versesReadCaption}
        />
      ),
    });

    // 3 — Chapters
    if (recap.chaptersRead > 0) {
      list.push({
        key: 'chapters',
        gradient: SLIDE_GRADIENTS.chapters,
        icon: 'library',
        a11y: `${num(recap.chaptersRead)} ${j.chaptersLabel}`,
        render: () => (
          <SlideBody
            icon="library"
            title={j.chaptersBooksTitle}
            big={num(recap.chaptersRead)}
            bigLabel={j.chaptersLabel}
          />
        ),
      });
    }

    // 3b — Books of the Bible completed (dedicated; the count is REAL since the
    // Sprint 64 completion ledger, framed against the whole 66-book canon).
    if (recap.booksCompleted > 0) {
      const pct = Math.min(
        100,
        Math.round((recap.booksCompleted / TOTAL_BIBLE_BOOKS) * 100),
      );
      list.push({
        key: 'books',
        gradient: SLIDE_GRADIENTS.books,
        icon: 'book',
        a11y: `${j.booksReadTitle}. ${num(recap.booksCompleted)} / ${num(
          TOTAL_BIBLE_BOOKS,
        )}`,
        render: () => (
          <SlideBody
            icon="book"
            title={j.booksReadTitle}
            big={num(recap.booksCompleted)}
            bigLabel={j.booksLabel}
            caption={j.booksReadCaption
              .replace('{{done}}', num(recap.booksCompleted))
              .replace('{{total}}', num(TOTAL_BIBLE_BOOKS))
              .replace('{{pct}}', `${pct}`)}
          />
        ),
      });
    }

    // 4 — Reading streak
    if (recap.longestStreak > 0 || recap.activeDays > 0) {
      list.push({
        key: 'streak',
        gradient: SLIDE_GRADIENTS.streak,
        icon: 'flame',
        a11y: `${j.streakTitle}. ${num(recap.activeDays)} ${j.activeDaysLabel}`,
        render: () => (
          <SlideBody
            icon="flame"
            title={j.streakTitle}
            big={num(recap.activeDays)}
            bigLabel={j.activeDaysLabel}
            rows={[
              {label: j.longestStreakLabel, value: num(recap.longestStreak)},
              {label: j.currentStreakLabel, value: num(recap.currentStreak)},
            ]}
          />
        ),
      });
    }

    // 5 — Time in the Word (reading time, finally surfaced — Sprint 62)
    if (recap.readingTimeSeconds > 0) {
      const timeStr = formatReadingTime(recap.readingTimeSeconds, {
        hour: ri.hourUnit,
        minute: ri.minuteUnit,
        lessThanMinute: ri.lessThanMinute,
      });
      list.push({
        key: 'time',
        gradient: SLIDE_GRADIENTS.time,
        icon: 'hourglass',
        a11y: `${j.timeTitle}. ${timeStr} ${j.timeReadLabel}`,
        render: () => (
          <SlideBody
            icon="hourglass"
            title={j.timeTitle}
            big={timeStr}
            bigLabel={j.timeReadLabel}
            bigIsText
            caption={
              recap.activeDays > 0
                ? j.timeCaption.replace('{{days}}', num(recap.activeDays))
                : undefined
            }
          />
        ),
      });
    }

    // 5b — Most-read book (REAL, by verses + time — Sprint 65). Distinct from
    // the favorite-book slide below (which counts hearts, not reading).
    if (recap.mostReadBook) {
      const mr = recap.mostReadBook;
      const info = getBookByName(mr.book);
      const bookName = info
        ? language === 'en'
          ? info.nameEn
          : info.name
        : mr.book;
      const timeStr = formatReadingTime(mr.timeSpent, {
        hour: ri.hourUnit,
        minute: ri.minuteUnit,
        lessThanMinute: ri.lessThanMinute,
      });
      list.push({
        key: 'mostRead',
        gradient: SLIDE_GRADIENTS.mostRead,
        icon: 'bookmarks',
        a11y: `${j.mostReadTitle}: ${bookName}. ${num(mr.versesRead)} ${
          j.versesReadLabel
        }`,
        render: () => (
          <SlideBody
            icon="bookmarks"
            title={j.mostReadTitle}
            big={bookName}
            bigLabel={`${num(mr.versesRead)} ${j.versesReadLabel}`}
            bigIsText
            caption={
              mr.timeSpent > 0
                ? j.mostReadCaption.replace('{{time}}', timeStr)
                : undefined
            }
          />
        ),
      });
    }

    // 6 — Favorite book
    if (recap.favoriteBook) {
      const fav = recap.favoriteBook;
      const info = getBookByName(fav.book);
      const bookName = info
        ? language === 'en'
          ? info.nameEn
          : info.name
        : fav.book;
      list.push({
        key: 'favorite',
        gradient: SLIDE_GRADIENTS.favorite,
        icon: 'heart',
        a11y: `${j.favoriteBookTitle}: ${bookName}`,
        render: () => (
          <SlideBody
            icon="heart"
            title={j.favoriteBookTitle}
            big={bookName}
            bigLabel={`${num(fav.count)} ${j.favoritesLabel}`}
            bigIsText
          />
        ),
      });
    }

    // 7 — Highlights & notes
    if (recap.highlightsCount > 0 || recap.notesCount > 0) {
      list.push({
        key: 'engagement',
        gradient: SLIDE_GRADIENTS.engagement,
        icon: 'create',
        a11y: `${j.engagementTitle}. ${num(recap.highlightsCount)} ${
          j.highlightsLabel
        }, ${num(recap.notesCount)} ${j.notesLabel}`,
        render: () => (
          <SlideBody
            icon="create"
            title={j.engagementTitle}
            big={num(recap.highlightsCount)}
            bigLabel={j.highlightsLabel}
            rows={[{label: j.notesLabel, value: num(recap.notesCount)}]}
          />
        ),
      });
    }

    // 8 — Memorization
    if (recap.cardsTotal > 0 || recap.memoryReviews > 0) {
      const rows: SecondaryRow[] = [
        {label: j.masteredLabel, value: num(recap.versesMastered)},
      ];
      if (recap.retentionPercent !== null) {
        rows.push({
          label: j.retentionLabel,
          value: `${recap.retentionPercent}%`,
        });
      }
      list.push({
        key: 'memory',
        gradient: SLIDE_GRADIENTS.memory,
        icon: 'sparkles',
        a11y: `${j.memoryTitle}. ${num(recap.cardsTotal)} ${j.memorizedLabel}`,
        render: () => (
          <SlideBody
            icon="sparkles"
            title={j.memoryTitle}
            big={num(recap.cardsTotal)}
            bigLabel={j.memorizedLabel}
            rows={rows}
          />
        ),
      });
    }

    // 9 — Achievements & level
    if (recap.achievementsUnlocked > 0 || recap.totalPoints > 0) {
      list.push({
        key: 'achievements',
        gradient: SLIDE_GRADIENTS.achievements,
        icon: 'trophy',
        a11y: `${j.achievementsTitle}. ${num(recap.achievementsUnlocked)} / ${num(
          recap.totalAchievements,
        )}`,
        render: () => (
          <SlideBody
            icon="trophy"
            title={j.achievementsTitle}
            big={`${num(recap.achievementsUnlocked)}`}
            bigLabel={`/ ${num(recap.totalAchievements)} ${j.achievementsLabel}`}
            rows={[
              {
                label: j.levelLabel.replace('{{level}}', num(recap.level)),
                value: `${num(recap.totalPoints)} ${j.pointsLabel}`,
              },
            ]}
          />
        ),
      });
    }

    // 10 — Finale (shareable)
    list.push({
      key: 'finale',
      gradient: SLIDE_GRADIENTS.finale,
      icon: 'sparkles',
      a11y: `${j.finaleTitle}. ${j.closingVerse}`,
      render: renderFinale,
    });

    return list;
    // Deps capture everything that changes slide content. `sharing` is
    // deliberately EXCLUDED: it must not rebuild the finale's captured
    // LinearGradient (a rebuild invalidates the view-shot reactTag — the
    // capture then fails with "No view found"); the share button lives
    // outside this memo so only it re-renders while sharing. (This eslint has
    // no react-hooks/exhaustive-deps rule, so a disable directive would error.)
  }, [recap, j, ri, language, width]);

  // Clamp the cursor if the slide set shrinks (defensive).
  useEffect(() => {
    if (index > slides.length - 1) setIndex(Math.max(0, slides.length - 1));
  }, [slides.length, index]);

  // ---- Entrance animation (reduce-motion aware) ---------------------------
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, reduced, progress]);

  const goNext = useCallback(() => {
    setIndex(i => Math.min(i + 1, slides.length - 1));
  }, [slides.length]);
  const goPrev = useCallback(() => {
    setIndex(i => Math.max(i - 1, 0));
  }, []);

  // ---- Share (S56 view-shot pipeline) -------------------------------------
  async function handleShare() {
    if (sharing || !shareCardRef.current) return;
    try {
      setSharing(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      if (!(await Sharing.isAvailableAsync())) {
        toast.error(j.shareError);
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t.share,
        UTI: 'public.png',
      });
    } catch (err) {
      logger.error('Journey share failed', err as Error, {
        component: 'JourneyScreen',
        action: 'handleShare',
      });
      toast.error(j.shareError);
    } finally {
      setSharing(false);
    }
  }

  // ---- Finale renderer (defined after handlers it closes over) ------------
  function renderFinale(): React.ReactNode {
    if (!recap) return null;
    const cardWidth = Math.min(width - 64, 420);
    const summary: SecondaryRow[] = [];
    if (recap.versesRead > 0) {
      summary.push({
        label: j.versesReadLabel,
        value: recap.versesRead.toLocaleString(),
      });
    }
    if (recap.longestStreak > 0) {
      summary.push({
        label: j.longestStreakLabel,
        value: recap.longestStreak.toLocaleString(),
      });
    }
    if (recap.cardsTotal > 0) {
      summary.push({
        label: j.memorizedLabel,
        value: recap.cardsTotal.toLocaleString(),
      });
    }
    if (recap.favoriteBook) {
      const info = getBookByName(recap.favoriteBook.book);
      summary.push({
        label: j.favoriteBookShort,
        value: info
          ? language === 'en'
            ? info.nameEn
            : info.name
          : recap.favoriteBook.book,
      });
    }

    return (
      <View style={styles.finaleWrap} pointerEvents="box-none">
        <LinearGradient
          // The captured card — a self-contained branded gradient so the
          // exported PNG looks the same regardless of the slide behind it.
          // `collapsable={false}` keeps the native view from being flattened
          // on Android (otherwise view-shot's captureRef can't find it →
          // "No view found with reactTag"); same as S56's ImageShareModal.
          ref={shareCardRef}
          collapsable={false}
          colors={['#312e81', '#6d28d9', '#0ea5e9']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.shareCard, {width: cardWidth}]}>
          <Ionicons name="book" size={30} color={WHITE} />
          <Text style={styles.shareCardKicker}>{j.shareCardTitle}</Text>
          <Text style={styles.shareCardTitle}>{j.title}</Text>
          <View style={styles.shareStats}>
            {summary.map(s => (
              <View key={s.label} style={styles.shareStatRow}>
                <Text style={styles.shareStatValue} numberOfLines={1}>
                  {s.value}
                </Text>
                <Text style={styles.shareStatLabel} numberOfLines={1}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.shareVerse}>“{j.closingVerse}”</Text>
          <Text style={styles.shareReference}>{j.closingReference}</Text>
          <Text style={styles.shareApp}>Eternal Stone Bible</Text>
        </LinearGradient>
      </View>
    );
  }

  // ---- Render -------------------------------------------------------------
  if (status === 'loading') {
    return (
      <>
        <Stack.Screen options={{headerShown: false}} />
        <View style={[styles.stateWrap, {backgroundColor: colors.background}]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.stateText, {color: colors.textSecondary}]}>
            {j.loading}
          </Text>
        </View>
      </>
    );
  }

  if (status === 'error') {
    return (
      <>
        <Stack.Screen options={{headerShown: false}} />
        <View style={[styles.stateWrap, {backgroundColor: colors.background}]}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={[styles.stateTitle, {color: colors.text}]}>
            {j.error}
          </Text>
          <Pressable
            onPress={loadRecap}
            accessibilityRole="button"
            accessibilityLabel={j.retry}
            style={[styles.ctaButton, {backgroundColor: colors.primary}]}>
            <Text style={styles.ctaText}>{j.retry}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkButton}>
            <Text style={[styles.linkText, {color: colors.textSecondary}]}>
              {t.close}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  // ready but no activity yet → gentle empty state
  if (!recap || !recap.hasData || slides.length === 0) {
    return (
      <>
        <Stack.Screen options={{headerShown: false}} />
        <View style={[styles.stateWrap, {backgroundColor: colors.background}]}>
          <Text style={styles.emptyEmoji}>🛤️</Text>
          <Text style={[styles.stateTitle, {color: colors.text}]}>
            {j.emptyTitle}
          </Text>
          <Text style={[styles.stateText, {color: colors.textSecondary}]}>
            {j.emptyBody}
          </Text>
          <Pressable
            onPress={() => router.replace('/(tabs)/bible')}
            accessibilityRole="button"
            accessibilityLabel={j.emptyCta}
            style={[styles.ctaButton, {backgroundColor: colors.primary}]}>
            <Text style={styles.ctaText}>{j.emptyCta}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.linkButton}>
            <Text style={[styles.linkText, {color: colors.textSecondary}]}>
              {t.close}
            </Text>
          </Pressable>
        </View>
      </>
    );
  }

  const clampedIndex = Math.min(index, slides.length - 1);
  const slide = slides[clampedIndex];
  const isFinale = slide.key === 'finale';

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={styles.container}>
        <LinearGradient
          colors={slide.gradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={StyleSheet.absoluteFill}
        />

        {/* Tap layer BEHIND the content (S52 pattern): empty areas advance /
            go back; interactive content above keeps its own touches. */}
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.tapRow}>
            <Pressable
              style={styles.tapLeft}
              onPress={goPrev}
              accessibilityRole="button"
              accessibilityLabel={j.previous}
            />
            <Pressable
              style={styles.tapRight}
              onPress={goNext}
              accessibilityRole="button"
              accessibilityLabel={j.next}
            />
          </View>
        </View>

        {/* Slide content */}
        <Animated.View
          pointerEvents="box-none"
          accessible={!isFinale}
          accessibilityLabel={isFinale ? undefined : slide.a11y}
          style={[
            styles.content,
            {
              paddingTop: insets.top + 64,
              paddingBottom: insets.bottom + spacing.xl,
              opacity: progress,
              transform: [
                {
                  translateY: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
              ],
            },
          ]}>
          {slide.render()}
        </Animated.View>

        {/* Share dock (finale only) — OUTSIDE the memoized slide so toggling
            `sharing` never rebuilds the captured card (keeps its view-shot
            reactTag valid), mirroring S56's stable-card / separate-button. */}
        {isFinale && (
          <View
            pointerEvents="box-none"
            style={[styles.shareDock, {bottom: insets.bottom + spacing.xl}]}>
            <Pressable
              onPress={handleShare}
              disabled={sharing}
              accessibilityRole="button"
              accessibilityLabel={j.share}
              accessibilityHint={j.shareHint}
              accessibilityState={{disabled: sharing}}
              style={({pressed}) => [
                styles.shareButton,
                {opacity: pressed || sharing ? 0.7 : 1},
              ]}>
              {sharing ? (
                <ActivityIndicator color="#1e1b4b" />
              ) : (
                <>
                  <Ionicons name="share-social" size={20} color="#1e1b4b" />
                  <Text style={styles.shareButtonText}>{j.share}</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Top chrome: progress segments + close (painted last → on top) */}
        <View style={[styles.topChrome, {paddingTop: insets.top + 8}]}>
          <View style={styles.progressRow}>
            {slides.map((s, i) => (
              <View key={s.key} style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {width: i <= clampedIndex ? '100%' : '0%'},
                  ]}
                />
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.close}
            hitSlop={12}
            style={styles.closeButton}>
            <Ionicons name="close" size={26} color={WHITE} />
          </Pressable>
        </View>
      </View>
    </>
  );
}

/** One slide's body: icon, title, a big hero value, and optional rows. */
function SlideBody({
  icon,
  title,
  big,
  bigLabel,
  caption,
  rows,
  bigIsText,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  big: string;
  bigLabel: string;
  caption?: string;
  rows?: SecondaryRow[];
  bigIsText?: boolean;
}) {
  return (
    <View style={styles.slideBody} pointerEvents="none">
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={34} color={WHITE} />
      </View>
      <Text style={styles.slideTitle}>{title}</Text>
      {big.length > 0 && (
        <Text
          style={bigIsText ? styles.bigText : styles.bigNumber}
          numberOfLines={2}
          adjustsFontSizeToFit>
          {big}
        </Text>
      )}
      <Text style={styles.bigLabel}>{bigLabel}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      {rows && rows.length > 0 ? (
        <View style={styles.rows}>
          {rows.map(r => (
            <View key={r.label} style={styles.row}>
              <Text style={styles.rowValue}>{r.value}</Text>
              <Text style={styles.rowLabel}>{r.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  // States
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.base,
  },
  stateTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  stateText: {
    fontSize: fontSizes.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyEmoji: {fontSize: 56},
  ctaButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  ctaText: {color: WHITE, fontWeight: '700', fontSize: fontSizes.base},
  linkButton: {paddingVertical: spacing.sm},
  linkText: {fontSize: fontSizes.base, fontWeight: '600'},
  // Tap zones
  tapRow: {flex: 1, flexDirection: 'row'},
  tapLeft: {width: '35%'},
  tapRight: {flex: 1},
  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideBody: {alignItems: 'center', justifyContent: 'center'},
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: WHITE_FAINT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  slideTitle: {
    color: WHITE_DIM,
    fontSize: fontSizes.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  bigNumber: {
    color: WHITE,
    fontSize: 76,
    fontWeight: '900',
    textAlign: 'center',
  },
  bigText: {
    color: WHITE,
    fontSize: 44,
    fontWeight: '900',
    textAlign: 'center',
  },
  bigLabel: {
    color: WHITE,
    fontSize: fontSizes.lg,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  caption: {
    color: WHITE_DIM,
    fontSize: fontSizes.base,
    textAlign: 'center',
    marginTop: spacing.base,
    lineHeight: 22,
  },
  rows: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing['2xl'],
  },
  row: {alignItems: 'center'},
  rowValue: {color: WHITE, fontSize: fontSizes['2xl'], fontWeight: '800'},
  rowLabel: {
    color: WHITE_DIM,
    fontSize: fontSizes.sm,
    marginTop: spacing['0.5'],
    textAlign: 'center',
  },
  // Top chrome
  topChrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.base,
  },
  progressRow: {flexDirection: 'row', gap: 4},
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: WHITE_FAINT,
    overflow: 'hidden',
  },
  progressFill: {height: '100%', borderRadius: 2, backgroundColor: WHITE},
  closeButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    padding: spacing.xs,
  },
  // Finale
  finaleWrap: {alignItems: 'center', justifyContent: 'center', width: '100%'},
  shareDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shareCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  shareCardKicker: {
    color: WHITE_DIM,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginTop: spacing.sm,
  },
  shareCardTitle: {
    color: WHITE,
    fontSize: fontSizes['3xl'],
    fontWeight: '900',
    marginBottom: spacing.base,
  },
  shareStats: {
    width: '100%',
    gap: spacing.sm,
    marginVertical: spacing.base,
  },
  shareStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareStatValue: {
    color: WHITE,
    fontSize: fontSizes.lg,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.base,
  },
  shareStatLabel: {color: WHITE_DIM, fontSize: fontSizes.base},
  shareVerse: {
    color: WHITE,
    fontSize: fontSizes.base,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: spacing.base,
  },
  shareReference: {
    color: WHITE_DIM,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  shareApp: {
    color: WHITE_DIM,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: spacing.lg,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: WHITE,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 180,
  },
  shareButtonText: {
    color: '#1e1b4b',
    fontWeight: '800',
    fontSize: fontSizes.base,
  },
});
