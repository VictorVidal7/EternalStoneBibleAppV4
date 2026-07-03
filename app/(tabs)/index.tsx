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

import React, {useEffect, useState, useRef, useCallback, useMemo} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  RefreshControl,
} from 'react-native';
// ♿ Dynamic-type: cap OS font-scale on this screen's chrome (reading content
// lives in the reader, which stays uncapped). See src/lib/a11y/fontScale.ts.
import {AppText as Text} from '@components/ui/AppText';
import {staticColors} from '@/styles/designTokens';

import {useRouter, useFocusEffect} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import {haptics} from '@lib/haptics';

import bibleDB from '@lib/database';
import {BibleVerse, ReadingProgress} from '@/types/bible';
import {READING_PLANS, getLocalizedPlan} from '@/constants/reading-plans';
import {effectivePlanDays} from '@/lib/reading/planReflow';
import {getDailyVerseRef} from '@/constants/daily-verses';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getBookByName} from '@/constants/bible';
import {orderAlsoVersions} from '@/lib/home/alsoInVersions';
import {
  shiftDaysBack,
  clampDayOffset,
  dayCaptionKind,
  canGoBack,
  canGoForward,
} from '@/lib/home/dailyVerseHistory';

// Persisted visibility of the daily verse's "see it in …" chips (Sprint 77).
const HOME_ALSO_VERSIONS_KEY = '@home_also_versions';
import {useTheme} from '@hooks/useTheme';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useServices} from '@context/ServicesContext';
import {useLanguage} from '@hooks/useLanguage';
import ShareService from '@/services/ShareService';
import {logger} from '@lib/utils/logger';
import {useReadingProgress} from '@context/ReadingProgressContext';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import {useTogether} from '@context/TogetherContext';
import {useCustomPlans} from '@context/CustomPlansContext';
import {useFavorites} from '@context/FavoritesContext';
import {useBookmarks} from '@context/BookmarksContext';
import {useMemoryDeck} from '@context/MemoryDeckContext';
import {usePremium} from '@context/PremiumContext';
import {useToast} from '@context/ToastContext';
import {
  chapterLocationFromVerse,
  getLastPosition,
  isResumable,
  MiniVerseProgress,
  nextChapterTitle,
  resumeCardMode,
  useAudioPlayer,
} from '@/features/audio';
import type {PlaybackPosition} from '@/features/audio';
import {getMergedStudyConnections} from '@/features/study/crossReferences';
import {
  getChristConnectionById,
  parseChristRef,
  formatChristRefLabel,
} from '@/features/study/christConnections';
import {getDailyProphecy} from '@/features/study/messianicProphecies';
import {getDailyFact} from '@/features/study/bibleFacts';
import {translations} from '@/i18n/translations';
import {timeOfDay, homeNudge} from '@/lib/home/homeGreeting';
import {planPace, formatDayReadings} from '@/lib/reading/planPace';

// Componentes Celestial
import {
  StatsCard,
  VerseOfDayCard,
  ReadingPlanCard,
  ShimmerCard,
} from '@components/celestial';

// Skeleton Loaders
import {Skeleton} from '@components/SkeletonLoader';

// Emotional check-in (Sprint 79)
import {FeelingChips} from '@components/FeelingChips';
import {MoodVerseCard} from '@components/MoodVerseCard';
import {DevotionStreakCard} from '@components/DevotionStreakCard';
import {ConstancyRingsCard} from '@components/ConstancyRingsCard';
import {NextMilestoneCard} from '@components/NextMilestoneCard';
import {PrayerCard} from '@components/PrayerCard';
import {DiscoverTile} from '@components/home/DiscoverTile';

// Tema Celestial
import {
  createCelestialTheme,
  celestialBorderRadius,
  celestialSpacing,
} from '@/styles/celestialTheme';
import {withOpacity} from '@/styles/modernTheme';
import {CONTENT_MAX_WIDTH} from '@/styles/responsive';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CONTENT_HORIZONTAL_PADDING = 20;
const SAVED_CARD_GAP = 12;
// Sprint 96: on wide screens the Home column is capped at CONTENT_MAX_WIDTH,
// so 2-up grid card widths must derive from the CAPPED width — using the full
// screen width would size the cards too wide for the column and they'd wrap to
// a single column. On phones this is a no-op (screen is narrower than the cap).
const EFFECTIVE_CONTENT_WIDTH = Math.min(SCREEN_WIDTH, CONTENT_MAX_WIDTH);
// Saved/Explore grids are 2×2, so each card spans half the content width minus
// a single inter-card gap. FLOOR the width: the exact half + gap fills the
// available row to the pixel, and Yoga's subpixel rounding then tips the second
// card onto its own row (collapsing the grid to ONE column on some densities,
// e.g. the Pixel 9 Pro @ 480dpi). Flooring leaves a sub-dp of slack so two
// cards + the gap always fit and the 2-column layout holds.
const SAVED_CARD_WIDTH = Math.floor(
  (EFFECTIVE_CONTENT_WIDTH - CONTENT_HORIZONTAL_PADDING * 2 - SAVED_CARD_GAP) /
    2,
);

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const {selectedVersion, availableVersions} = useBibleVersion();
  const {
    achievementService,
    highlightService,
    initialized: servicesInitialized,
  } = useServices();
  const {t, language} = useLanguage();
  // Book names on the Home cards follow the READING version's language (RVR1960
  // → "Juan"), matching the rest of the app; `language` is kept only for the
  // speech locale (reading the daily verse aloud).
  const bookLang: 'es' | 'en' = selectedVersion.language === 'es' ? 'es' : 'en';
  const {getChapterProgress} = useReadingProgress();
  const {getCompletedDays, getStartedAt, getPlanDuration} =
    useReadingPlanProgress();
  const {getMembership} = useTogether();
  const {customPlans} = useCustomPlans();
  const {addFavorite, isFavorite, favorites} = useFavorites();
  const {bookmarks} = useBookmarks();
  const bookmarksCount = bookmarks.length;
  const {stats: memoryStats} = useMemoryDeck();
  const {isPremium} = usePremium();
  const toast = useToast();
  // The "Continue listening" card now COMPOSES with the floating player
  // (Sprint 75): while the cold-start-restored player sits paused-collapsed on
  // the saved chapter, the card stays up as a one-tap resume surface; once
  // audio plays (or the player holds another chapter) it defers to the player.
  const {
    isVisible: audioPlayerVisible,
    autoAdvanceChapter,
    state: audioState,
    currentVerse: audioCurrentVerse,
    verses: audioVerses,
    play: resumeAudioPlayback,
  } = useAudioPlayer();
  const progressTrackColor = isDark
    ? staticColors.transparent
    : withOpacity(colors.primary, isDark ? 0.3 : 0.8);

  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  // Fulfillment verse text for the "Christ in this passage" reveal, in the
  // SELECTED Bible version, so it matches the day's verse (Sprint 98).
  const [christFulfillmentText, setChristFulfillmentText] = useState<
    string | undefined
  >(undefined);
  // How many study connections today's verse has — counted from the SAME
  // merged web (curated parallels + the broad bundled cross-reference web)
  // that the reader's Study mode and parallels sheet use, so the card's
  // "Estudia este versículo" CTA appears for EVERY verse that actually has
  // connections, not only the ~207 with hand-curated parallels (UX review #6).
  const [dailyStudyCount, setDailyStudyCount] = useState(0);
  const [lastRead, setLastRead] = useState<ReadingProgress | null>(null);
  // Last audio position for the premium "Continue listening" card (Sprint 51).
  const [audioResumePos, setAudioResumePos] = useState<PlaybackPosition | null>(
    null,
  );
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
  // "Ver también en…" chips on the daily verse card (Sprint 77). OFF by
  // default to keep the card minimal; the footer globe toggles it and the
  // choice persists across sessions.
  const [alsoVersionsVisible, setAlsoVersionsVisible] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(HOME_ALSO_VERSIONS_KEY)
      .then(value => setAlsoVersionsVisible(value === '1'))
      .catch(() => {});
  }, []);
  const toggleAlsoVersions = useCallback(() => {
    haptics.tap();
    setAlsoVersionsVisible(prev => {
      const next = !prev;
      AsyncStorage.setItem(HOME_ALSO_VERSIONS_KEY, next ? '1' : '0').catch(
        () => {},
      );
      return next;
    });
  }, []);

  // Daily verse history (Sprint 78): 0 = today, up to DAILY_HISTORY_MAX_BACK
  // days into the past — the verse is deterministic per calendar day, so a
  // past day recomputes purely. The ref mirrors the state so loadHomeData
  // (focus refresh) keeps honoring the browsed day instead of resetting it.
  const [dailyDayOffset, setDailyDayOffset] = useState(0);
  const dailyDayOffsetRef = useRef(0);
  const dailyHistoryTouchedRef = useRef(false);
  useEffect(() => {
    dailyDayOffsetRef.current = dailyDayOffset;
    // Skip the mount run — loadHomeData already loads today's verse.
    if (!dailyHistoryTouchedRef.current) {
      dailyHistoryTouchedRef.current = true;
      return;
    }
    let active = true;
    (async () => {
      const ref = getDailyVerseRef(shiftDaysBack(new Date(), dailyDayOffset));
      const verse = await bibleDB
        .getVerse(ref.book, ref.chapter, ref.verse, selectedVersion.id)
        .catch(() => null);
      if (active) {
        setDailyVerse(
          verse ?? (await bibleDB.getRandomVerse(selectedVersion.id)),
        );
      }
    })();
    return () => {
      active = false;
    };
  }, [dailyDayOffset, selectedVersion.id]);

  // Recompute the daily verse's MERGED study-connection count whenever the
  // verse changes (UX review #6). This is async because it reads the broad
  // bundled cross-reference web from SQLite — the same source Study mode and
  // the parallels sheet use — so a verse like Matthew 28:6 (0 curated, 13 in
  // the web) now shows the "Estudia este versículo" CTA on Home too. Defensive:
  // any failure leaves the count at 0 (CTA simply hidden, never crashes).
  useEffect(() => {
    if (!dailyVerse) {
      setDailyStudyCount(0);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const web = await getMergedStudyConnections(
          dailyVerse.book,
          dailyVerse.chapter,
          dailyVerse.verse,
        );
        if (!cancelled) setDailyStudyCount(web.totalConnections);
      } catch {
        if (!cancelled) setDailyStudyCount(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dailyVerse]);

  const goPrevDailyDay = useCallback(() => {
    haptics.tap();
    setDailyDayOffset(o => clampDayOffset(o + 1));
  }, []);
  const goNextDailyDay = useCallback(() => {
    haptics.tap();
    setDailyDayOffset(o => clampDayOffset(o - 1));
  }, []);
  const goTodayDaily = useCallback(() => {
    haptics.tap();
    setDailyDayOffset(0);
  }, []);
  // Caption for the browsed day: null = today (the card shows "Hoy"),
  // "Ayer" for 1, a localized "lunes, 8 jun" beyond that.
  const dailyHistoryLabel = useMemo(() => {
    const kind = dayCaptionKind(dailyDayOffset);
    if (kind === 'today') return null;
    if (kind === 'yesterday') return t.home.dailyYesterday;
    return shiftDaysBack(new Date(), dailyDayOffset).toLocaleDateString(
      language === 'en' ? 'en-US' : 'es-ES',
      {weekday: 'long', day: 'numeric', month: 'short'},
    );
  }, [dailyDayOffset, t, language]);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const formatSavedCount = (count: number) => {
    if (count > 99) return '99+';
    return count.toString();
  };

  useEffect(() => {
    startAnimations();
  }, []);

  // Refresh home data whenever the tab regains focus so "Continue Reading",
  // saved counts and stats reflect activity from the reader and other screens.
  // Re-keys on the selected version so the daily verse re-pulls in it.
  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [selectedVersion.id]),
  );

  useEffect(() => {
    setSavedCounts(prev => ({
      ...prev,
      favorites: favorites.length,
    }));
  }, [favorites.length]);

  // Resolve the "Christ in this passage" fulfillment verse text in the SELECTED
  // version (Sprint 98), so the Home reveal shows real scripture in the same
  // version as the verse above — not just a reference chip.
  useEffect(() => {
    let cancelled = false;
    const bn = dailyVerse?.bookNumber;
    if (!bn) {
      setChristFulfillmentText(undefined);
      return;
    }
    const conn = getChristConnectionById(
      bn,
      dailyVerse.chapter,
      dailyVerse.verse,
    );
    const fp = conn?.fulfillment ? parseChristRef(conn.fulfillment) : null;
    const fbook = fp ? getBookByName(fp.book) : undefined;
    if (!fp || !fbook) {
      setChristFulfillmentText(undefined);
      return;
    }
    void bibleDB
      .getVerse(fbook.id, fp.chapter, fp.verse, selectedVersion.id)
      .then(row => {
        if (!cancelled) setChristFulfillmentText(row?.text ?? undefined);
      })
      .catch(() => {
        if (!cancelled) setChristFulfillmentText(undefined);
      });
    return () => {
      cancelled = true;
    };
  }, [dailyVerse, selectedVersion.id]);

  // Re-resolve the saved audio position whenever the floating player appears
  // or disappears: closing the player CLEARS the stored position (hidePlayer),
  // and the cold-start restore flips visibility right after Home's first load —
  // both must refresh the "Continue listening" card instead of trusting a
  // stale focus-time snapshot.
  useEffect(() => {
    let cancelled = false;
    void getLastPosition().then(pos => {
      if (!cancelled) {
        setAudioResumePos(isResumable(pos, Date.now()) ? pos : null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [audioPlayerVisible]);

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

      // Honor the browsed history day (Sprint 78) — a focus refresh while
      // the user is reading yesterday's verse must not snap back to today.
      const dailyRef = getDailyVerseRef(
        shiftDaysBack(new Date(), dailyDayOffsetRef.current),
      );
      // Daily verse comes from the user's SELECTED reading version — the
      // same text the reader opens in when the card is tapped, and the same
      // version the daily-verse notification already uses. (It used to pull
      // from the first version matching the UI language — S18, when there
      // was exactly one version per language — which ignored the selection
      // and, once WEB landed in S66, could even show KJV to a WEB reader.)
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

      // Get last audio position for the "Continue listening" card (premium).
      // Only surface a fresh one (isResumable); a stale/closed position is
      // dropped so the card never resurrects a chapter the user moved on from.
      const audioPos = await getLastPosition();
      setAudioResumePos(isResumable(audioPos, Date.now()) ? audioPos : null);

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
      // A silent catch left the reader looking at an empty/stale Home with no
      // indication anything went wrong. Surface it with a one-tap retry
      // instead of a blocking screen, since pull-to-refresh already exists.
      toast.show({
        message: t.home.loadError,
        variant: 'error',
        action: {label: t.app.retry, onPress: () => loadHomeData()},
      });
    }
  }

  async function onRefresh() {
    setRefreshing(true);

    try {
      haptics.tap();
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
    haptics.tap();
    callback();
  };

  // "Profecía del día" — the Hilo-profético discover tile teases today's
  // prophecy and opens the thread's intro hub (índice / mapa / fuentes all
  // reachable there, and the intro features today's prophecy to open it).
  const dailyProphecyLabel = useMemo(() => {
    const p = getDailyProphecy();
    return (t.prophecies.items as Record<string, {label: string}>)[p.id]?.label;
  }, [t.prophecies.items]);

  // "Dato del día" — the ¿Sabías qué? Explorar tile teases today's fact and
  // opens the hub, mirroring the prophecies tile above.
  const dailyFactLabel = useMemo(() => {
    const f = getDailyFact();
    return (t.bibleFacts.items as Record<string, {label: string}>)[f.id]?.label;
  }, [t.bibleFacts.items]);

  // "Continue listening" card mode (Sprint 75): 'navigate' deep-links into the
  // reader (no player up), 'resume' plays the paused restored player in place,
  // 'hidden' defers to an active session. Pure policy in resumeCardMode.
  const audioResumeMode = resumeCardMode({
    isPremium,
    position: audioResumePos,
    now: Date.now(),
    playerVisible: audioPlayerVisible,
    playerPlaying: audioState.isPlaying,
    playerLocation: chapterLocationFromVerse(audioCurrentVerse),
  });
  // In resume mode the LIVE player state is the truth (the saved snapshot can
  // trail a scrub); in navigate mode only the snapshot exists.
  const audioResumeLive = audioResumeMode === 'resume' && audioCurrentVerse;
  const audioResumeIndex = audioResumeLive
    ? audioState.currentVerseIndex
    : (audioResumePos?.verseIndex ?? 0);
  const audioResumeTotal = audioResumeLive
    ? audioVerses.length
    : (audioResumePos?.totalVerses ?? 1);

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
                    width={
                      (EFFECTIVE_CONTENT_WIDTH -
                        celestialSpacing.sectionGap * 3) /
                      2
                    }
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

  // Personalized hero (Sprint 71): a time-of-day greeting + a single
  // contextual nudge (active streak → continue reading → today's verse),
  // both derived from a pure tested module.
  const greetingKey = timeOfDay(new Date().getHours());
  const heroGreeting =
    greetingKey === 'morning'
      ? t.home.greetingMorning
      : greetingKey === 'afternoon'
        ? t.home.greetingAfternoon
        : greetingKey === 'evening'
          ? t.home.greetingEvening
          : t.home.greetingNight;
  const nudge = homeNudge({
    streak: userStats.streak,
    hasLastRead: !!lastRead,
  });
  const heroSubtitle =
    nudge.kind === 'streak'
      ? nudge.days === 1
        ? t.home.nudgeStreakOne
        : t.home.nudgeStreak.replace('{{days}}', String(nudge.days))
      : nudge.kind === 'continue' && lastRead
        ? t.home.nudgeContinue.replace(
            '{{book}}',
            (() => {
              const info = getBookByName(lastRead.book);
              return info
                ? bookLang === 'en'
                  ? info.nameEn
                  : info.name
                : lastRead.book;
            })(),
          )
        : t.home.nudgeDaily;

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
              styles.heroCardShadow,
              {shadowColor: colors.primary},
            ]}>
            <View style={styles.heroContent}>
              {/* Compact header with icon */}
              <View style={styles.heroHeader}>
                <Ionicons name="book" size={28} color="#ffffff" />
                <View style={styles.heroTextContainer}>
                  <Text style={styles.heroTitle}>{heroGreeting}</Text>
                  <Text style={styles.heroSubtitle} numberOfLines={2}>
                    {heroSubtitle}
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
        {dailyVerse &&
          (() => {
            // The stored book name reflects the Bible-version language (Spanish
            // for RVR1960, English for KJV). Localize the reference to match
            // the UI language so the card reads naturally regardless of which
            // version is active, mirroring "Continue Reading" above.
            const verseBookInfo = getBookByName(dailyVerse.book);
            const verseBookName = verseBookInfo
              ? bookLang === 'en'
                ? verseBookInfo.nameEn
                : verseBookInfo.name
              : dailyVerse.book;
            const verseReference = `${verseBookName} ${dailyVerse.chapter}:${dailyVerse.verse}`;
            // Innovation (S62): how many study connections this verse has, so
            // the card can invite the reader into the two-way study web (S61).
            // Counted from the MERGED web (curated + broad bundled), resolved
            // async above — matches the reader's Study mode / parallels exactly
            // (UX review #6).
            const studyConnectionsCount = dailyStudyCount;
            // "Christ in this passage" (S97) — a curated, faithful note when
            // today's verse points to / reveals Jesus.
            const christConn = dailyVerse.bookNumber
              ? getChristConnectionById(
                  dailyVerse.bookNumber,
                  dailyVerse.chapter,
                  dailyVerse.verse,
                )
              : null;
            // The card speaks the SELECTED Bible version's language (S98), so
            // its note + labels match the verse, even with a different UI lang.
            const christLang = selectedVersion.language === 'es' ? 'es' : 'en';
            const christCC = translations[christLang].christConnections;
            const christNote = christConn
              ? (christCC.notes as Record<string, string>)[christConn.id]
              : undefined;
            let christPointsTo: string | undefined;
            let christNav:
              | {book: string; chapter: number; verse: number}
              | undefined;
            if (christConn?.fulfillment) {
              const fp = parseChristRef(christConn.fulfillment);
              const fbook = fp ? getBookByName(fp.book) : undefined;
              if (fp && fbook) {
                christPointsTo = formatChristRefLabel(
                  christConn.fulfillment,
                  christLang,
                );
                christNav = {
                  book: christLang === 'en' ? fbook.nameEn : fbook.name,
                  chapter: fp.chapter,
                  verse: fp.verse,
                };
              }
            }
            return (
              <Animated.View
                style={{
                  opacity: fadeAnim,
                  marginTop: celestialSpacing.cardGap,
                }}>
                {/* Glow-only (S98): the calm pulsing glow, no left-to-right
                    sweep — homologated with every other Home card. */}
                <ShimmerCard glowColor={colors.primary} shimmerEnabled={false}>
                  <VerseOfDayCard
                    // Re-key per browsed day (Sprint 78) so the S77 per-
                    // version peek cache + local favorite flash reset with
                    // the verse they describe.
                    key={`daily-${dailyDayOffset}`}
                    verseText={dailyVerse.text}
                    reference={verseReference}
                    title={t.home.dailyVerse}
                    isDark={isDark}
                    versionLabel={selectedVersion.abbreviation}
                    historyEnabled
                    historyLabel={dailyHistoryLabel}
                    onPrevDay={
                      canGoBack(dailyDayOffset) ? goPrevDailyDay : undefined
                    }
                    onNextDay={
                      canGoForward(dailyDayOffset) ? goNextDailyDay : undefined
                    }
                    onToday={
                      canGoForward(dailyDayOffset) ? goTodayDaily : undefined
                    }
                    onPress={() =>
                      handlePress(() =>
                        // Land on the EXACT daily verse, not the chapter top
                        // (UX follow-up) — the reader scrolls to / highlights
                        // the `verse` param, same as the cross-ref jumps.
                        router.push(
                          `/verse/${dailyVerse.book}/${dailyVerse.chapter}?verse=${dailyVerse.verse}` as never,
                        ),
                      )
                    }
                    studyConnectionsCount={studyConnectionsCount}
                    onStudy={() =>
                      handlePress(() =>
                        router.push({
                          pathname: '/features/study' as never,
                          params: {
                            book: dailyVerse.book,
                            chapter: String(dailyVerse.chapter),
                            verse: String(dailyVerse.verse),
                            version: selectedVersion.id,
                          },
                        } as never),
                      )
                    }
                    alternates={orderAlsoVersions(
                      selectedVersion,
                      availableVersions,
                    )}
                    alternatesVisible={alsoVersionsVisible}
                    onToggleAlternates={toggleAlsoVersions}
                    loadAlternateText={async versionId => {
                      const alt = await bibleDB
                        .getVerse(
                          dailyVerse.bookNumber,
                          dailyVerse.chapter,
                          dailyVerse.verse,
                          versionId,
                        )
                        .catch(() => null);
                      return alt?.text ?? null;
                    }}
                    onCompare={() =>
                      handlePress(() =>
                        router.push({
                          pathname: '/features/version-comparison' as never,
                          params: {
                            book: dailyVerse.book,
                            chapter: String(dailyVerse.chapter),
                            verse: String(dailyVerse.verse),
                          },
                        } as never),
                      )
                    }
                    onShare={async () => {
                      if (dailyVerse) {
                        await ShareService.shareVerse(
                          dailyVerse,
                          verseReference,
                          {},
                          (variant, message) =>
                            variant === 'success'
                              ? toast.success(message)
                              : toast.error(message),
                        );
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
                          haptics.success();
                        }
                      }
                    }}
                    christNote={christNote}
                    christPointsTo={christPointsTo}
                    christFulfillmentText={christFulfillmentText}
                    christCardTitle={christCC.cardTitle}
                    christPointsToLabel={christCC.pointsTo}
                    christVersionAbbrev={selectedVersion.abbreviation}
                    onChristPointsTo={
                      christNav
                        ? () =>
                            handlePress(() =>
                              router.push(
                                `/verse/${christNav.book}/${christNav.chapter}?verse=${christNav.verse}` as never,
                              ),
                            )
                        : undefined
                    }
                    onPrep={() =>
                      handlePress(() =>
                        router.push({
                          pathname: '/features/prep' as never,
                          params: {
                            book: dailyVerse.book,
                            chapter: String(dailyVerse.chapter),
                            startVerse: String(dailyVerse.verse),
                            endVerse: String(dailyVerse.verse),
                          },
                        } as never),
                      )
                    }
                  />
                </ShimmerCard>
              </Animated.View>
            );
          })()}

        {/* ==================== HOW ARE YOU FEELING (Sprint 79) ==================== */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.cardGap}}>
          <FeelingChips
            onOpenFeeling={feelingId =>
              handlePress(() =>
                router.push(`/features/feelings/${feelingId}` as never),
              )
            }
            onOpenAll={() =>
              handlePress(() => router.push('/features/feelings' as never))
            }
          />
          {/* A verse for TODAY's check-in (Sprint 81) — renders nothing
              until the reader names a feeling today. */}
          <MoodVerseCard
            onOpenVerse={(book, chapter, verse) =>
              handlePress(() =>
                // `verse` is the reader's highlight-and-scroll param (it
                // renames it to highlightVerse internally).
                router.push(
                  `/verse/${book}/${chapter}?verse=${verse}` as never,
                ),
              )
            }
          />
          {/* 🕯️ Devotion streak (Sprint 84) — renders nothing until the
              reader has completed at least one "Momento con Dios". Tapping it
              opens the guided devotion to continue today. */}
          <DevotionStreakCard
            onPress={() =>
              handlePress(() => router.push('/features/guided' as never))
            }
          />

          {/* 🙏 Prayer (Sprint 93) — renders nothing until the reader has kept
              a request in the journal OR completed a guided prayer. Shows the
              prayer streak + what's before God now; taps open the journal. */}
          <PrayerCard
            onPress={() =>
              handlePress(() => router.push('/features/prayer' as never))
            }
          />
        </Animated.View>

        {/* ==================== TU CONSTANCIA HOY (rings, Sprint 85) ========== */}
        {/* Apple-Watch-style rings composing today's reading, memorization,
            devotion and emotional check-in. Renders nothing until the reader
            has any footprint in any habit. Tapping opens Mi lectura. The card
            owns its own top gap so it collapses cleanly when it renders null —
            an opacity-only wrapper here leaves no phantom space on an empty
            Home (e.g. a fresh install with no habit footprint yet). */}
        <Animated.View style={{opacity: fadeAnim}}>
          <ConstancyRingsCard
            onPress={() =>
              handlePress(() =>
                router.push('/features/reading-insights' as never),
              )
            }
          />
        </Animated.View>

        {/* ==================== PRÓXIMO HITO (Sprint 92) ===================== */}
        {/* The single achievement the reader is closest to unlocking, bridging
            Home to the Trophy tab. Renders nothing until they are measurably
            walking toward one. Tapping opens the Achievements tab. The card
            owns its own top gap (opacity-only wrapper) so it leaves no phantom
            space when it renders null. */}
        <Animated.View style={{opacity: fadeAnim}}>
          <NextMilestoneCard
            onPress={() =>
              handlePress(() => router.push('/(tabs)/achievements' as never))
            }
          />
        </Animated.View>

        {/* ==================== CONTINUE READING (Compact) ==================== */}
        {lastRead && (
          <Animated.View
            style={{opacity: fadeAnim, marginTop: celestialSpacing.cardGap}}>
            <TouchableOpacity
              activeOpacity={0.9}
              accessibilityRole="button"
              accessible={true}
              onPress={() =>
                handlePress(() =>
                  router.push(
                    `/verse/${lastRead.book}/${lastRead.chapter}` as never,
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
                        styles.iconChip,
                        {backgroundColor: colors.primary + '20'},
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
                            ? bookLang === 'en'
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

        {/* ============ CONTINUE LISTENING (Premium, Sprint 51) ============ */}
        {/* Hidden when the floating player is already showing this position
            (cold-start restore, Sprint 53) — no duplicate resume surface. */}
        {audioResumeMode !== 'hidden' && audioResumePos && (
          <Animated.View
            style={{opacity: fadeAnim, marginTop: celestialSpacing.cardGap}}>
            <TouchableOpacity
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={t.home.continueListening}
              accessibilityHint={
                audioResumeMode === 'resume' ? t.home.tapToResume : undefined
              }
              accessibilityValue={{
                text: t.audio.scrub.preview
                  .replace('{{n}}', String(audioResumeIndex + 1))
                  .replace('{{total}}', String(audioResumeTotal)),
              }}
              onPress={() => {
                if (audioResumeMode === 'resume') {
                  // One-tap resume of the paused restored player — play()
                  // haptics + announces state on its own.
                  resumeAudioPlayback();
                  return;
                }
                handlePress(() =>
                  // Land on the EXACT verse the card names (UX review #7) — it
                  // used to open at the chapter top, which read as "it took me
                  // somewhere else than it said". The `verse` param scrolls to /
                  // highlights it; audioResume=1 still resumes playback there.
                  router.push(
                    `/verse/${audioResumePos.book}/${audioResumePos.chapter}?verse=${audioResumePos.verse}&audioResume=1` as never,
                  ),
                );
              }}>
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
                        styles.iconChip,
                        {backgroundColor: colors.primary + '20'},
                      ]}>
                      <Ionicons
                        name="headset"
                        size={14}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.continueTextContainer}>
                      <Text
                        style={[styles.continueTitle, {color: colors.text}]}
                        numberOfLines={1}>
                        {t.home.continueListening}
                      </Text>
                      <Text
                        style={[
                          styles.continueReference,
                          {color: colors.textSecondary},
                        ]}
                        numberOfLines={1}>
                        {(() => {
                          // Resume mode shows the LIVE player verse (the saved
                          // snapshot can trail it); navigate mode shows the
                          // snapshot — the only thing there is.
                          const shown = audioResumeLive
                            ? audioCurrentVerse
                            : audioResumePos;
                          const info = getBookByName(shown.book);
                          const name = info
                            ? bookLang === 'en'
                              ? info.nameEn
                              : info.name
                            : shown.book;
                          return `${name} ${shown.chapter}:${shown.verse}`;
                        })()}
                      </Text>
                      {/* Verse progress — same bar + counter the collapsed
                          player shows, so both resume surfaces read alike
                          (Sprint 75). */}
                      <View style={styles.continueVerseProgress}>
                        <MiniVerseProgress
                          currentIndex={audioResumeIndex}
                          totalVerses={audioResumeTotal}
                        />
                      </View>
                      {/* Continuous playback peek (S74): when ∞ is on, resuming
                          here won't stop at the chapter's end — surface what
                          comes next, mirroring the expanded player's peek. */}
                      {(() => {
                        const upNext = autoAdvanceChapter
                          ? nextChapterTitle(audioResumePos, bookLang)
                          : null;
                        return upNext ? (
                          <Text
                            style={[
                              styles.continueUpNext,
                              {color: colors.primary},
                            ]}
                            numberOfLines={1}>
                            {'∞ '}
                            {t.audio.nextChapterUp.replace(
                              '{{chapter}}',
                              upNext,
                            )}
                          </Text>
                        ) : null;
                      })()}
                      {audioResumeMode === 'resume' && (
                        <Text
                          style={[
                            styles.continueResumeHint,
                            {color: colors.primary},
                          ]}
                          numberOfLines={1}>
                          {t.home.tapToResume}
                        </Text>
                      )}
                    </View>
                    <View style={styles.continueProgress}>
                      <Ionicons
                        name="play-circle"
                        size={28}
                        color={colors.primary}
                      />
                    </View>
                  </View>
                </View>
              </ShimmerCard>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ==================== EXPLORAR (discover grid) ==================== */}
        {/* Leads Home's titled sections (ahead of Tu progreso) per the
            user's 2026-06-30 Home-reorder call: discovery content (Luz
            diaria / Temas / Profecías) is consulted more often by the
            average user than the personal-progress tiles below. */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              {t.home.exploreTitle}
            </Text>
            <Ionicons
              name="compass"
              size={26}
              color={celestialTheme.colors.accent}
            />
          </View>

          <View style={styles.savedGrid}>
            <View style={styles.savedCardWrapper}>
              <DiscoverTile
                icon="sunny"
                title={t.dailyLight.cardTitle}
                subtitle={t.dailyLight.cardSubtitle}
                onPress={() =>
                  handlePress(() =>
                    router.push('/features/daily-light' as never),
                  )
                }
              />
            </View>
            <View style={styles.savedCardWrapper}>
              <DiscoverTile
                icon="grid"
                title={t.themes.cardTitle}
                subtitle={t.themes.cardSubtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/themes' as never))
                }
              />
            </View>
            <View style={styles.savedCardWrapper}>
              <DiscoverTile
                icon="git-network"
                title={t.prophecies.title}
                subtitle={
                  dailyProphecyLabel
                    ? `${t.prophecies.todayLabel} · ${dailyProphecyLabel}`
                    : t.prophecies.subtitle
                }
                onPress={() =>
                  handlePress(() =>
                    router.push('/features/prophecies' as never),
                  )
                }
              />
            </View>
            <View style={styles.savedCardWrapper}>
              <DiscoverTile
                icon="bulb"
                title={t.bibleFacts.title}
                subtitle={
                  dailyFactLabel
                    ? `${t.bibleFacts.todayLabel} · ${dailyFactLabel}`
                    : t.bibleFacts.subtitle
                }
                onPress={() =>
                  handlePress(() => router.push('/features/facts' as never))
                }
              />
            </View>
            <View style={styles.savedCardWrapper}>
              <DiscoverTile
                icon="map"
                title={t.journeys.title}
                subtitle={t.journeys.subtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/journeys' as never))
                }
              />
            </View>
            <View style={styles.savedCardWrapper}>
              <DiscoverTile
                icon="happy"
                title={t.kids.cardTitle}
                subtitle={t.kids.cardSubtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/kids' as never))
                }
              />
            </View>
          </View>
        </Animated.View>

        {/* ==================== TU PROGRESO ==================== */}
        {/* Your-progress surfaces (journey + activity/constancy), their own
            section below Explorar. */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              {t.home.progressTitle}
            </Text>
            <Ionicons
              name="trending-up"
              size={26}
              color={celestialTheme.colors.accent}
            />
          </View>

          <View style={styles.savedGrid}>
            <View style={styles.savedCardWrapper}>
              <DiscoverTile
                icon="footsteps"
                title={t.journey.cardTitle}
                subtitle={t.journey.cardSubtitle}
                onPress={() =>
                  handlePress(() => router.push('/features/journey' as never))
                }
              />
            </View>
            <View style={styles.savedCardWrapper}>
              <DiscoverTile
                icon="stats-chart"
                title={t.readingInsights.cardTitle}
                subtitle={t.readingInsights.cardSubtitle}
                onPress={() =>
                  handlePress(() =>
                    router.push('/features/reading-insights' as never),
                  )
                }
              />
            </View>
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
            {/* Show the WHOLE catalogue (Sprint 95): this horizontal carousel
                was capped at slice(0, 3), which hid every plan past the third —
                so the 4 new plans (and 2 older ones) were unreachable, as the
                user noticed. The carousel scrolls, so it comfortably carries
                all of them. */}
            {READING_PLANS.map(plan => {
              const planDays = getCompletedDays(plan.id);
              const planDaysDone = planDays.length;
              // A reader-chosen duration (Sprint 111) reflows the SAME
              // curated chapters across a different day count — use the
              // EFFECTIVE days/duration everywhere below, not the curated
              // default, so the card matches what the detail screen shows.
              const effectiveDays = effectivePlanDays(
                plan,
                getPlanDuration(plan.id),
              );
              const effectiveDuration = effectiveDays.length;
              const localizedPlan = getLocalizedPlan(
                plan,
                t,
                effectiveDuration,
              );
              // "Día 4 · Mateo 9–10" once the plan is underway (Sprint 79);
              // the static duration label before the first interaction.
              const pace = planPace({
                startedAt: getStartedAt(plan.id),
                completedDays: planDays,
                duration: effectiveDuration,
                now: new Date(),
              });
              const nextDayReadings =
                pace.nextDay != null
                  ? effectiveDays.find(d => d.day === pace.nextDay)?.readings
                  : undefined;
              const planSubtitle =
                pace.status === 'complete'
                  ? t.readingPlan.planCompletedShort
                  : pace.status !== 'notStarted' && nextDayReadings
                    ? t.readingPlan.planNextUp
                        .replace('{{day}}', String(pace.nextDay))
                        .replace(
                          '{{readings}}',
                          formatDayReadings(nextDayReadings, book => {
                            const info = getBookByName(book);
                            if (!info) return book;
                            return bookLang === 'en' ? info.nameEn : info.name;
                          }),
                        )
                    : t.home.planDays.replace(
                        '{{days}}',
                        effectiveDuration.toString(),
                      );
              return (
                <ReadingPlanCard
                  key={plan.id}
                  name={localizedPlan.name}
                  description={localizedPlan.description}
                  subtitle={planSubtitle}
                  icon="book-outline"
                  duration={effectiveDuration}
                  daysCompleted={planDaysDone}
                  onPress={() =>
                    handlePress(() => router.push(`/plan/${plan.id}` as never))
                  }
                  continueText={
                    planDaysDone > 0 ? t.home.continue : t.home.start
                  }
                  isDark={isDark}
                  inGroup={getMembership(plan.id) !== null}
                  groupLabel={getMembership(plan.id)?.name}
                />
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ==================== MIS PLANES (Sprint 108) ==================== */}
        {/* The user's own plans (built in the editor or imported from a shared
            cplan link) live in their own section. "Create" is a compact button
            in the header (it's just an action — it shouldn't claim a big card),
            and the plans themselves use the SAME card as the curated carousel. */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              {t.home.myPlans}
            </Text>
            <TouchableOpacity
              style={[
                styles.createPlanButton,
                {
                  backgroundColor: withOpacity(
                    colors.primary,
                    isDark ? 0.2 : 0.12,
                  ),
                  borderColor: colors.primary,
                },
              ]}
              onPress={() =>
                handlePress(() =>
                  router.push('/features/plan-builder' as never),
                )
              }
              accessibilityRole="button"
              accessibilityLabel={t.planBuilder.cardTitle}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text
                style={[styles.createPlanButtonText, {color: colors.primary}]}>
                {t.home.createPlanShort}
              </Text>
            </TouchableOpacity>
          </View>

          {customPlans.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.plansScroll}>
              {customPlans.map(plan => {
                const planDays = getCompletedDays(plan.id);
                const planDaysDone = planDays.length;
                const pace = planPace({
                  startedAt: getStartedAt(plan.id),
                  completedDays: planDays,
                  duration: plan.duration,
                  now: new Date(),
                });
                const nextDayReadings =
                  pace.nextDay != null
                    ? plan.days.find(d => d.day === pace.nextDay)?.readings
                    : undefined;
                const planSubtitle =
                  pace.status === 'complete'
                    ? t.readingPlan.planCompletedShort
                    : pace.status !== 'notStarted' && nextDayReadings
                      ? t.readingPlan.planNextUp
                          .replace('{{day}}', String(pace.nextDay))
                          .replace(
                            '{{readings}}',
                            formatDayReadings(nextDayReadings, book => {
                              const info = getBookByName(book);
                              if (!info) return book;
                              return bookLang === 'en'
                                ? info.nameEn
                                : info.name;
                            }),
                          )
                      : t.home.planDays.replace(
                          '{{days}}',
                          plan.duration.toString(),
                        );
                // Localized "N days · M chapters" — a custom plan bakes no
                // language, so describe it in the active UI language (S108).
                const chapters = plan.days.reduce(
                  (sum, d) => sum + d.readings.length,
                  0,
                );
                const planDescription = t.together.customMeta
                  .replace('{{days}}', String(plan.duration))
                  .replace('{{chapters}}', String(chapters));
                return (
                  <ReadingPlanCard
                    key={plan.id}
                    name={plan.name}
                    description={planDescription}
                    subtitle={planSubtitle}
                    icon="book-outline"
                    duration={plan.duration}
                    daysCompleted={planDaysDone}
                    onPress={() =>
                      handlePress(() =>
                        router.push(`/plan/${plan.id}` as never),
                      )
                    }
                    continueText={
                      planDaysDone > 0 ? t.home.continue : t.home.start
                    }
                    isDark={isDark}
                  />
                );
              })}
            </ScrollView>
          ) : (
            <Text
              style={[
                styles.noPlansText,
                {color: celestialTheme.colors.textSecondary},
              ]}>
              {t.home.noPlansYet}
            </Text>
          )}
        </Animated.View>

        {/* ==================== GROW WITH GOD (Sprint 94 follow-up) ======== */}
        {/* Was "Study Tools" — but 3 of 4 entries are devotional/relational
            practices (guided devotion, lectio, guided prayer) and only one is
            an analytical study aid (version comparison), so the label
            mislabeled the section. Renamed to "Crece con Dios"/"Grow with God"
            (echoes 2 Pe 3:18) and reordered devotion-first; the study aid
            (version comparison) closes the section. */}
        <Animated.View
          style={{opacity: fadeAnim, marginTop: celestialSpacing.sectionGap}}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {color: celestialTheme.colors.text},
              ]}>
              {t.home.growTitle}
            </Text>
            <Ionicons
              name="sparkles-outline"
              size={24}
              color={celestialTheme.colors.accent}
            />
          </View>

          {/* 🕊️ Guided devotion — begins with how your heart is today (S83) */}
          <TouchableOpacity
            activeOpacity={0.9}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t.guided.cardTitle}
            accessibilityHint={t.guided.cardSubtitle}
            onPress={() =>
              handlePress(() => router.push('/features/guided' as never))
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
                  <Ionicons name="leaf" size={28} color={colors.primary} />
                </View>
                <View style={styles.toolInfo}>
                  <Text
                    style={[
                      styles.toolTitle,
                      {color: celestialTheme.colors.text},
                    ]}>
                    {t.guided.cardTitle}
                  </Text>
                  <Text
                    style={[
                      styles.toolDescription,
                      {color: celestialTheme.colors.textSecondary},
                    ]}>
                    {t.guided.cardSubtitle}
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

          {/* 🕯️ Moment with God — lectio on the daily verse (Sprint 79) */}
          {dailyVerse && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={{marginTop: celestialSpacing.cardGap}}
              accessibilityRole="button"
              accessible={true}
              accessibilityLabel={t.lectio.cardTitle}
              accessibilityHint={t.lectio.cardSubtitle}
              onPress={() =>
                handlePress(() =>
                  router.push({
                    pathname: '/features/lectio' as never,
                    params: {
                      book: dailyVerse.book,
                      chapter: String(dailyVerse.chapter),
                      verse: String(dailyVerse.verse),
                    },
                  } as never),
                )
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
                    <Ionicons name="flame" size={28} color={colors.primary} />
                  </View>
                  <View style={styles.toolInfo}>
                    <Text
                      style={[
                        styles.toolTitle,
                        {color: celestialTheme.colors.text},
                      ]}>
                      {t.lectio.cardTitle}
                    </Text>
                    <Text
                      style={[
                        styles.toolDescription,
                        {color: celestialTheme.colors.textSecondary},
                      ]}>
                      {t.lectio.cardSubtitle}
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
          )}

          {/* 🙏 Guided prayer — the ACTS path (Sprint 93) */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={{marginTop: celestialSpacing.cardGap}}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t.prayer.studyToolTitle}
            accessibilityHint={t.prayer.studyToolSubtitle}
            onPress={() =>
              handlePress(() => router.push('/features/prayer/acts' as never))
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
                  <Ionicons name="rose" size={28} color={colors.primary} />
                </View>
                <View style={styles.toolInfo}>
                  <Text
                    style={[
                      styles.toolTitle,
                      {color: celestialTheme.colors.text},
                    ]}>
                    {t.prayer.studyToolTitle}
                  </Text>
                  <Text
                    style={[
                      styles.toolDescription,
                      {color: celestialTheme.colors.textSecondary},
                    ]}>
                    {t.prayer.studyToolSubtitle}
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

          {/* 🔀 Version comparison — the study aid (S51), closes the section */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={{marginTop: celestialSpacing.cardGap}}
            accessibilityRole="button"
            accessible={true}
            accessibilityLabel={t.settingsV51.versionComparison}
            accessibilityHint={t.settingsV51.versionComparisonDesc}
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
              accessibilityRole="button"
              accessible={true}
              onPress={() =>
                handlePress(() => router.push('/(tabs)/favorites' as never))
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
              accessibilityRole="button"
              accessible={true}
              onPress={() =>
                handlePress(() => router.push('/(tabs)/notes' as never))
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
                    <Ionicons
                      name="document-text"
                      size={20}
                      color={colors.primary}
                    />
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
              accessibilityRole="button"
              accessible={true}
              onPress={() =>
                handlePress(() => router.push('/(tabs)/highlights' as never))
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
                    <Ionicons
                      name="color-palette"
                      size={20}
                      color={colors.primary}
                    />
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

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.savedCardWrapper}
              accessibilityRole="button"
              accessible={true}
              onPress={() =>
                handlePress(() => router.push('/(tabs)/bookmarks' as never))
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
                    <Ionicons
                      name="bookmark"
                      size={20}
                      color={colors.primary}
                    />
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
                        {formatSavedCount(bookmarksCount)}
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
                  {t.bookmarks.short}
                </Text>
              </BlurView>
            </TouchableOpacity>

            {/* Memory — Sprint 34: badge shows due-today count (or total
                if nothing is due) so the user sees "what's calling me
                back" at a glance. */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.savedCardWrapper}
              accessibilityRole="button"
              accessible={true}
              onPress={() =>
                handlePress(() => router.push('/features/memory' as never))
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
                    <Ionicons name="school" size={20} color={colors.primary} />
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
                        {/* Show deck size — consistent with other Saved
                            cards. "Due today" has context on the deck
                            screen, but on Home the user expects the
                            number to grow when they add a card. */}
                        {formatSavedCount(memoryStats.total)}
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
                  {t.memory.short}
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

      {/* Sprint 99: a soft top scrim so content stays legible as it scrolls
          under the translucent status bar / camera cutout. It just extends the
          theme's own background colour over the status-bar band and fades to
          transparent; theme-derived, never blocks touches, no-op visual at the
          very top (the content already starts below it). */}
      <LinearGradient
        colors={[
          celestialTheme.colors.backgroundGradient[0],
          staticColors.transparent,
        ]}
        style={[styles.topScrim, {height: insets.top + 12}]}
        pointerEvents="none"
      />
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
  topScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20, // Más ajustado para pantallas pequeñas
    paddingTop: Platform.OS === 'ios' ? 68 : 44, // Más espacio superior para mejor visibilidad
    paddingBottom: 100, // Más espacio para el tab bar
    // Sprint 96: cap + center the Home column on wide screens (foldable /
    // tablet / landscape) so cards don't stretch edge-to-edge. No-op on
    // phones (narrower than the cap).
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  },
  // Hero Card - Compact and Professional
  heroCard: {
    overflow: 'hidden',
    padding: 16,
    marginBottom: 0,
  },
  heroCardShadow: {
    borderRadius: celestialBorderRadius.xl,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconChip: {
    borderRadius: 10,
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
    color: staticColors.white,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: staticColors.glassWhite85,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: staticColors.glassWhite12,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: staticColors.glassWhite20,
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
  continueUpNext: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  continueVerseProgress: {
    marginTop: 4,
  },
  continueResumeHint: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
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
  // Compact "create a plan" button in the "Mis planes" header (Sprint 108).
  createPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  createPlanButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  noPlansText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Quick Access Grid
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // Saved shortcuts: 2×2 grid wrapping after two cards so the four
  // saved-item entry points (Favorites/Notes/Highlights/Bookmarks) all
  // fit comfortably on a single Home screen.
  savedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: SAVED_CARD_GAP,
    rowGap: SAVED_CARD_GAP,
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
