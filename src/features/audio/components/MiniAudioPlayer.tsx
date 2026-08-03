/**
 * MiniAudioPlayer Component
 *
 * Player flotante estilo Spotify para Audio Bible
 * Estado colapsado: Barra de 64px
 * Estado expandido: Panel de 220px con controles completos
 *
 * Caracteristicas:
 * - Glassmorphism con BlurView
 * - Animacion spring al expandir/colapsar
 * - Swipe down para cerrar
 * - Controles de reproduccion
 * - Selector de velocidad
 * - Timer de sueno
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React, {useState, useCallback, useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import {usePathname} from 'expo-router';
import {AppText} from '@components/ui/AppText';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {BlurView} from 'expo-blur';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {haptics} from '@lib/haptics';
import {hitSlopToMinTarget} from '../../../lib/a11y/touchTarget';
import {useTheme} from '../../../hooks/useTheme';
import {useLanguage} from '../../../hooks/useLanguage';
import {useReducedMotion} from '../../../hooks/useReducedMotion';
import {getBookByName} from '../../../constants/bible';
import {useFavorites} from '../../../context/FavoritesContext';
import {matchingFavorite} from '../lib/playingFavorite';
import {staticColors} from '../../../styles/designTokens';
import {nextChapterTitle} from '../lib/chapterNavigation';
import {nextPlaybackSpeed} from '../lib/playbackSpeed';
import {
  resolveHorizontalSwipe,
  swipeDisplacement,
  swipeTargetIndex,
  PAUSED_SWIPE_FLASH_MS,
  BOOKMARK_PIN_FLASH_MS,
} from '../lib/miniPlayerGestures';
import {addAudioBookmark, createAudioBookmark} from '../lib/audioBookmarks';
import {
  getAudioBookmarks,
  saveAudioBookmarks,
} from '../lib/audioBookmarksStore';
import {logger} from '@lib/utils/logger';
import {useToast} from '../../../context/ToastContext';
import {useAudioPlayer} from '../context/AudioPlayerContext';
import {usePremium} from '../../../context/PremiumContext';
import {AudioControls} from './AudioControls';
import {MiniVerseProgress} from './AudioProgressBar';
import {VerseScrubber} from './VerseScrubber';
import {AudioWaveform} from './AudioWaveform';
import {AudioSpeedSelector} from './AudioSpeedSelector';
import {SleepTimerModal} from './SleepTimerModal';
import {AudioQueueSheet} from './AudioQueueSheet';
import {VoiceSelector} from './VoiceSelector';
import {
  PLAYER_DIMENSIONS,
  AUDIO_ICONS,
  AUDIO_CONTROL_SIZES,
  AUDIO_CONTROL_GAP,
  AUDIO_COLORS,
} from '../constants/audioConstants';
import {SPRING_CONFIGS} from '../../../styles/reanimatedAnimations';

interface MiniAudioPlayerProps {
  bottomOffset?: number;
}

const EXPANDED_CONTROLS_WIDTH =
  AUDIO_CONTROL_SIZES.small.secondary * 2 +
  AUDIO_CONTROL_SIZES.small.main +
  AUDIO_CONTROL_GAP * 2;

// Collapsed-bar controls render well under the 48dp minimum touch target
// (S74 hit-target audit) — expand the touchable area, not the visuals.
const MINI_PLAY_HIT_SLOP = hitSlopToMinTarget(32); // 32dp round play button
const MINI_NEXT_HIT_SLOP = hitSlopToMinTarget(30); // 18 icon + 6dp padding
const SPEED_BADGE_HIT_SLOP = hitSlopToMinTarget(20); // ~13dp text + 2dp pad
const MINI_EXPAND_HIT_SLOP = hitSlopToMinTarget(22); // 18 icon + 2dp padding

export const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({
  bottomOffset = 0,
}) => {
  const {colors, isDark} = useTheme();
  const {language, t} = useLanguage();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const [sleepTimerModalVisible, setSleepTimerModalVisible] = useState(false);
  const [queueSheetVisible, setQueueSheetVisible] = useState(false);

  const {
    state,
    sleepTimer,
    currentVerse,
    verses,
    isVisible,
    isSuppressed,
    togglePlayPause,
    nextVerse,
    previousVerse,
    goToVerse,
    setPlaybackSpeed,
    expand,
    collapse,
    hidePlayer,
    setSleepTimer,
    setSleepTimerEndOfChapter,
    setSleepTimerEndOfBook,
    cancelSleepTimer,
    setVoice,
    setLanguage,
    autoAdvanceChapter,
    setAutoAdvanceChapter,
    readerFollowsAudio,
    setReaderFollowsAudio,
    repeatVerse,
    setRepeatVerse,
    queueInfo,
  } = useAudioPlayer();
  const {isPremium} = usePremium();
  const {favorites, addFavorite, removeFavorite, isFavorite} = useFavorites();

  // Localized reference for a verse index — fuels the scrubber's drag preview.
  const labelForIndex = useCallback(
    (index: number): string => {
      const v = verses[index];
      if (!v) return '';
      const info = getBookByName(v.book);
      const name = info
        ? language === 'en'
          ? info.nameEn
          : info.name
        : v.book;
      return `${name} ${v.chapter}:${v.verse}`;
    },
    [verses, language],
  );

  // Animation values
  const expandProgress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);
  // Horizontal rubber-band of the collapsed bar while swiping (Sprint 75).
  const collapsedTranslateX = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  // Ref to prevent accidental taps during animation
  const isAnimatingRef = useRef(false);

  // Handle collapse only (for swipe gesture)
  const handleCollapseOnly = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    expandProgress.value = withSpring(0, SPRING_CONFIGS.snappy);
    collapse();
    // Reset animation lock after animation duration
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 300);
  }, [collapse, expandProgress]);

  // Handle expand/collapse
  const handleToggleExpand = useCallback(() => {
    // Prevent accidental double taps during animation
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    haptics.tap();
    if (state.isExpanded) {
      expandProgress.value = withSpring(0, SPRING_CONFIGS.snappy);
      collapse();
    } else {
      expandProgress.value = withSpring(1, SPRING_CONFIGS.snappy);
      expand();
    }

    // Reset animation lock after animation duration
    setTimeout(() => {
      isAnimatingRef.current = false;
    }, 300);
  }, [state.isExpanded, expand, collapse, expandProgress]);

  // Gesture handler for swipe down to collapse (not close) using new Gesture API
  const panGesture = Gesture.Pan()
    .enabled(state.isExpanded)
    .activeOffsetY(12)
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate(event => {
      // Only allow downward swipe
      if (event.translationY > 0) {
        translateY.value = startY.value + event.translationY;
      }
    })
    .onEnd(event => {
      if (event.translationY > 100 || event.velocityY > 500) {
        // Collapse player (not close - keep audio playing)
        translateY.value = withSpring(0, SPRING_CONFIGS.snappy);
        runOnJS(handleCollapseOnly)();
      } else {
        // Snap back
        translateY.value = withSpring(0, SPRING_CONFIGS.snappy);
      }
    });

  // Post-swipe confirmation while PAUSED (Sprint 77): a paused swipe moves
  // the resume point with no audible cue, so the bar briefly tints the title
  // primary with a ▶ glyph. A static color swap — already reduce-motion-safe.
  const [pausedSwipeFlash, setPausedSwipeFlash] = useState(false);
  const pausedSwipeFlashTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(
    () => () => {
      if (pausedSwipeFlashTimer.current) {
        clearTimeout(pausedSwipeFlashTimer.current);
      }
    },
    [],
  );

  // 🔖 Long-press on the collapsed bar pins the PLAYING verse as an audio
  // bookmark without opening the queue sheet (Sprint 78). Always pins —
  // dedupe replaces an existing pin on the same verse; removal lives in the
  // queue sheet. Confirmation = the S77 flash idiom (static tint, RM-safe)
  // + haptic + SR announce.
  const [bookmarkFlash, setBookmarkFlash] = useState(false);
  const bookmarkFlashTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(
    () => () => {
      if (bookmarkFlashTimer.current) {
        clearTimeout(bookmarkFlashTimer.current);
      }
    },
    [],
  );
  const handleLongPressBookmark = useCallback(async () => {
    const verse = currentVerse;
    if (!verse) return;
    const created = createAudioBookmark(verse, Date.now());
    if (!created) return;
    haptics.success();
    const stored = await getAudioBookmarks();
    await saveAudioBookmarks(addAudioBookmark(stored, created));
    const info = getBookByName(verse.book);
    const localizedBook = info
      ? language === 'en'
        ? info.nameEn
        : info.name
      : verse.book;
    const pinnedTitle = `${localizedBook} ${verse.chapter}:${verse.verse}`;
    AccessibilityInfo.announceForAccessibility(
      t.audio.queue.bookmarkPinned.replace('{{verse}}', pinnedTitle),
    );
    logger.info('Audio bookmark pinned from collapsed bar', {
      component: 'MiniAudioPlayer',
      verse: `${created.book} ${created.chapter}:${created.verse}`,
    });
    setBookmarkFlash(true);
    if (bookmarkFlashTimer.current) {
      clearTimeout(bookmarkFlashTimer.current);
    }
    bookmarkFlashTimer.current = setTimeout(() => {
      setBookmarkFlash(false);
    }, BOOKMARK_PIN_FLASH_MS);
  }, [currentVerse, language, t]);

  // ♥ Quick-favorite of the verse being heard (Sprint 77): the expanded
  // player gains a one-tap save of the CURRENT verse — favorites canonicalize
  // the book name and queue to the existing sync, no new storage. Toggling
  // off removes the matching favorite (canonical-book match, like isFavorite).
  const currentIsFavorite = currentVerse
    ? isFavorite(currentVerse.book, currentVerse.chapter, currentVerse.verse)
    : false;
  const handleToggleFavorite = useCallback(async () => {
    const verse = currentVerse;
    if (!verse) return;
    const existing = matchingFavorite(favorites, verse);
    if (existing) {
      haptics.tap();
      await removeFavorite(existing.id);
    } else {
      haptics.success();
      await addFavorite(
        {
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text,
        },
        'other',
        5,
      );
    }
  }, [currentVerse, favorites, addFavorite, removeFavorite]);

  // Resolve a finished collapsed-bar drag (Sprint 75): swipe left = next
  // verse, right = previous. nextVerse/previousVerse haptic on their own; the
  // announce tells a screen-reader user where the bar landed (the swipe is a
  // shortcut — the equivalent buttons remain for TalkBack navigation).
  const handleCollapsedSwipe = useCallback(
    (translationX: number, velocityX: number) => {
      const action = resolveHorizontalSwipe({translationX, velocityX});
      const target = swipeTargetIndex({
        action,
        currentIndex: state.currentVerseIndex,
        totalVerses: verses.length,
      });
      if (target === null) return;
      if (action === 'next') {
        nextVerse();
      } else {
        previousVerse();
      }
      AccessibilityInfo.announceForAccessibility(labelForIndex(target));
      if (!state.isPlaying) {
        setPausedSwipeFlash(true);
        if (pausedSwipeFlashTimer.current) {
          clearTimeout(pausedSwipeFlashTimer.current);
        }
        pausedSwipeFlashTimer.current = setTimeout(() => {
          setPausedSwipeFlash(false);
        }, PAUSED_SWIPE_FLASH_MS);
      }
    },
    [
      state.currentVerseIndex,
      state.isPlaying,
      verses.length,
      nextVerse,
      previousVerse,
      labelForIndex,
    ],
  );

  // Collapsed-bar horizontal swipe (Sprint 75) — verse prev/next, Spotify
  // mini-player style. Horizontal activation + vertical fail keep it clear of
  // the inner taps (which need no travel) and of the expanded panel's
  // swipe-down (enabled only while expanded, so the two never overlap).
  const collapsedSwipeGesture = Gesture.Pan()
    .enabled(!state.isExpanded)
    .activeOffsetX([-20, 20])
    .failOffsetY([-12, 12])
    .onUpdate(event => {
      // Rubber-band hint; zeroed under reduce-motion (the action still fires).
      collapsedTranslateX.value = reduceMotion
        ? 0
        : swipeDisplacement(event.translationX);
    })
    .onEnd(event => {
      collapsedTranslateX.value = withSpring(0, SPRING_CONFIGS.snappy);
      runOnJS(handleCollapsedSwipe)(event.translationX, event.velocityX);
    });

  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      expandProgress.value,
      [0, 1],
      [PLAYER_DIMENSIONS.collapsedHeight, PLAYER_DIMENSIONS.expandedHeight],
      Extrapolation.CLAMP,
    );

    return {
      height,
      transform: [{translateY: translateY.value}],
    };
  });

  const collapsedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expandProgress.value,
      [0, 0.3],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    // Horizontal rubber-band while swiping verse prev/next (Sprint 75).
    transform: [{translateX: collapsedTranslateX.value}],
  }));

  const dynamicStyles = useMemo(() => {
    return {
      innerContainer: {
        backgroundColor: isDark
          ? 'rgba(26, 29, 46, 0.85)'
          : 'rgba(255, 255, 255, 0.9)',
        borderColor: colors.glassBorder,
      },
    };
  }, [isDark, colors.glassBorder]);

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expandProgress.value,
      [0.7, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const pathname = usePathname();

  // Auto-colapsar el reproductor expandido al cambiar de pantalla: un panel
  // flotante a tamaño completo no debe quedarse sobre contenido ajeno (p. ej.
  // tapando la sección de temas en Ajustes).
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (state.isExpanded) {
        expandProgress.value = withSpring(0, SPRING_CONFIGS.snappy);
        translateY.value = 0;
        collapse();
      }
    }
  }, [pathname, state.isExpanded, collapse, expandProgress, translateY]);

  // Determinar si la pantalla actual tiene la barra de pestañas inferior.
  // Todas las rutas del grupo (tabs) la muestran —la barra va posicionada de
  // forma absoluta sobre cada pantalla—; sólo las pantallas de /features/*,
  // apiladas en el Stack raíz, no la tienen. Comprobarlo por exclusión evita
  // que el reproductor se descoloque al añadir rutas a (tabs): la lista
  // anterior se quedó sin /highlights ni /plan/[id] y el panel tapaba la
  // barra de pestañas en esas pantallas.
  const isTabScreen = useMemo(
    () => !pathname.startsWith('/features'),
    [pathname],
  );

  // Don't render if not visible or no verses loaded
  if (!isVisible || isSuppressed || !currentVerse || verses.length === 0) {
    return null;
  }

  // Localize the book name so the title matches the app language even when
  // it was changed after audio playback started.
  const verseBookInfo = getBookByName(currentVerse.book);
  const verseBookName = verseBookInfo
    ? language === 'en'
      ? verseBookInfo.nameEn
      : verseBookInfo.name
    : currentVerse.book;
  const verseTitle = `${verseBookName} ${currentVerse.chapter}:${currentVerse.verse}`;
  // Resuming makes the paused-swipe confirmation moot — drop it immediately
  // instead of letting the timeout run out (Sprint 77).
  const showSwipeFlash = pausedSwipeFlash && !state.isPlaying;
  const canGoPrevious = state.currentVerseIndex > 0;
  const canGoNext = state.currentVerseIndex < verses.length - 1;
  // "Up next" peek — only while continuous playback is ON and a next chapter
  // exists (hidden at the end of the canon). Makes the ∞ toggle's effect concrete
  // by naming exactly where audio will roll into (Sprint 73).
  // A verse playlist (Sprint 79) replaces it with its own identity row — the
  // queue sheet entry stays reachable regardless of the ∞ toggle.
  const isPlaylistQueue = queueInfo.mode === 'playlist';
  const playlistPeek = isPlaylistQueue
    ? t.audio.playlistRow.replace(
        '{{label}}',
        queueInfo.label ?? t.audio.queue.playlistTitle,
      )
    : null;
  const nextChapterPeek =
    !isPlaylistQueue && autoAdvanceChapter
      ? nextChapterTitle(currentVerse, language === 'en' ? 'en' : 'es')
      : null;

  const TAB_BAR_HEIGHT = isTabScreen ? (Platform.OS === 'ios' ? 88 : 68) : 0;
  const finalBottomOffset =
    (state.bottomOffset || 0) + bottomOffset + TAB_BAR_HEIGHT;

  return (
    <GestureDetector gesture={Gesture.Race(panGesture, collapsedSwipeGesture)}>
      <Animated.View
        style={[
          styles.container,
          {
            bottom:
              finalBottomOffset +
              insets.bottom +
              PLAYER_DIMENSIONS.bottomMargin,
          },
          containerStyle,
        ]}>
        <BlurView
          intensity={isDark ? 80 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurContainer}>
          <View style={[styles.innerContainer, dynamicStyles.innerContainer]}>
            {/* Drag Handle */}
            <View style={styles.dragHandle}>
              <View
                style={[
                  styles.dragIndicator,
                  {backgroundColor: colors.textTertiary},
                ]}
              />
            </View>

            {/* ==================== COLLAPSED CONTENT ==================== */}
            <Animated.View
              pointerEvents={state.isExpanded ? 'none' : 'auto'}
              style={[
                styles.collapsedContent,
                collapsedContentStyle,
                state.isExpanded ? styles.hidden : styles.visible,
              ]}>
              <View
                pointerEvents={state.isExpanded ? 'none' : 'auto'}
                style={styles.collapsedMain}>
                {/* Play/Pause Button */}
                <TouchableOpacity
                  disabled={state.isExpanded}
                  style={[
                    styles.miniPlayButton,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={togglePlayPause}
                  hitSlop={MINI_PLAY_HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={
                    state.isPlaying ? t.audio.a11y.pause : t.audio.a11y.play
                  }
                  accessibilityState={{selected: state.isPlaying}}>
                  <Ionicons
                    name={
                      state.isPlaying ? AUDIO_ICONS.pause : AUDIO_ICONS.play
                    }
                    size={16}
                    color={colors.onPrimary}
                  />
                </TouchableOpacity>

                <Pressable
                  disabled={state.isExpanded}
                  style={styles.verseInfo}
                  onPress={handleToggleExpand}
                  // Long-press pins the playing verse as an audio bookmark
                  // (Sprint 78) — exposed to TalkBack as a custom action.
                  onLongPress={handleLongPressBookmark}
                  accessibilityActions={[
                    {name: 'longpress', label: t.audio.queue.bookmarkAdd},
                  ]}
                  onAccessibilityAction={event => {
                    if (event.nativeEvent.actionName === 'longpress') {
                      void handleLongPressBookmark();
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={verseTitle}
                  accessibilityHint={t.audio.a11y.expandHint}
                  // The visual progress counter ("1/29") is grouped under this
                  // label — voice it as a value so TalkBack hears it too.
                  accessibilityValue={{
                    text: t.audio.scrub.preview
                      .replace('{{n}}', String(state.currentVerseIndex + 1))
                      .replace('{{total}}', String(verses.length)),
                  }}>
                  <AppText
                    scaleRole="display"
                    style={[
                      styles.verseTitle,
                      {
                        color:
                          bookmarkFlash || showSwipeFlash
                            ? colors.primary
                            : colors.text,
                      },
                    ]}
                    numberOfLines={1}>
                    {bookmarkFlash ? (
                      <>
                        <Ionicons
                          name="bookmark"
                          size={12}
                          color={colors.primary}
                        />{' '}
                      </>
                    ) : showSwipeFlash ? (
                      <>
                        <Ionicons
                          name="play"
                          size={12}
                          color={colors.primary}
                        />{' '}
                      </>
                    ) : null}
                    {verseTitle}
                  </AppText>
                  <MiniVerseProgress
                    currentIndex={state.currentVerseIndex}
                    totalVerses={verses.length}
                  />
                </Pressable>

                {/* Next Button */}
                <TouchableOpacity
                  style={styles.miniNextButton}
                  onPress={nextVerse}
                  disabled={!canGoNext || state.isExpanded}
                  hitSlop={MINI_NEXT_HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={t.audio.a11y.nextVerse}
                  accessibilityState={{disabled: !canGoNext}}>
                  <Ionicons
                    name={AUDIO_ICONS.next}
                    size={18}
                    color={canGoNext ? colors.text : colors.textTertiary}
                  />
                </TouchableOpacity>

                {/* Speed Indicator */}
                <TouchableOpacity
                  disabled={state.isExpanded}
                  style={[
                    styles.speedBadge,
                    {backgroundColor: colors.surfaceVariant},
                  ]}
                  onPress={() => {
                    // Walk the FULL speed list (shared with the expanded
                    // player's selector) — a hardcoded 1→1.5→2 cycle here
                    // used to reset 1.25x listeners straight back to 1x.
                    setPlaybackSpeed(
                      nextPlaybackSpeed(state.playbackSpeed, isPremium),
                    );
                    haptics.tap();
                  }}
                  hitSlop={SPEED_BADGE_HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={t.audio.a11y.speed}
                  accessibilityValue={{text: `${state.playbackSpeed}x`}}>
                  <AppText
                    scaleRole="compact"
                    style={[styles.speedText, {color: colors.primary}]}>
                    {state.playbackSpeed}x
                  </AppText>
                </TouchableOpacity>

                {/* Expand Button */}
                <TouchableOpacity
                  disabled={state.isExpanded}
                  style={styles.expandButton}
                  onPress={handleToggleExpand}
                  hitSlop={MINI_EXPAND_HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={t.audio.a11y.expand}
                  accessibilityHint={t.audio.a11y.expandHint}>
                  <Ionicons
                    name={AUDIO_ICONS.expand}
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ==================== EXPANDED CONTENT ==================== */}
            <Animated.View
              pointerEvents={state.isExpanded ? 'auto' : 'none'}
              style={[
                styles.expandedContent,
                expandedContentStyle,
                state.isExpanded ? styles.expandedVisible : styles.hidden,
              ]}>
              {/* Header */}
              <View style={styles.expandedHeader}>
                <View style={styles.expandedTitle}>
                  <AppText
                    scaleRole="display"
                    style={[styles.expandedVerseTitle, {color: colors.text}]}
                    numberOfLines={1}>
                    {verseTitle}
                  </AppText>
                  <Text
                    style={[
                      styles.expandedVerseText,
                      {color: colors.textSecondary},
                    ]}
                    numberOfLines={1}>
                    {currentVerse.text.substring(0, 50)}...
                  </Text>
                </View>
                <View style={styles.headerButtons}>
                  {/* ♥ Quick-favorite of the verse being heard (Sprint 77). */}
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleToggleFavorite}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    accessibilityRole="button"
                    accessibilityLabel={
                      currentIsFavorite
                        ? t.verse.removeFavorite
                        : t.verse.addFavorite
                    }
                    accessibilityState={{selected: currentIsFavorite}}>
                    <Ionicons
                      name={currentIsFavorite ? 'heart' : 'heart-outline'}
                      size={20}
                      color={
                        currentIsFavorite
                          ? staticColors.red500
                          : colors.textTertiary
                      }
                    />
                  </TouchableOpacity>
                  {/* Continuous-playback toggle — when on, audio rolls into the
                      next chapter instead of stopping (Sprint 72). */}
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => {
                      // Tap just toggles, quietly (Sprint 82) — the per-tap
                      // caption was noisy; long-press explains it instead.
                      haptics.tap();
                      setAutoAdvanceChapter(!autoAdvanceChapter);
                    }}
                    onLongPress={() => {
                      // Long-press = a tooltip describing what the control does
                      // in its CURRENT state, without changing it (Sprint 82).
                      haptics.tap();
                      toast.info(
                        autoAdvanceChapter
                          ? t.audio.autoAdvanceOnToast
                          : t.audio.autoAdvanceOffToast,
                      );
                    }}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    accessibilityRole="button"
                    accessibilityLabel={t.audio.a11y.autoAdvance}
                    accessibilityHint={t.audio.a11y.autoAdvanceHint}
                    accessibilityState={{selected: autoAdvanceChapter}}>
                    <Ionicons
                      name="infinite"
                      size={22}
                      color={
                        autoAdvanceChapter
                          ? colors.primary
                          : colors.textTertiary
                      }
                    />
                  </TouchableOpacity>
                  {/* Reader-follow toggle — when on, the reader screen
                      navigates along with the continuous auto-advance
                      (Sprint 74, defaults ON). Only meaningful while continuous
                      playback is on, so it hides when ∞ is off. */}
                  {autoAdvanceChapter && (
                    <TouchableOpacity
                      style={styles.headerButton}
                      onPress={() => {
                        // Tap toggles quietly; long-press explains (Sprint 82).
                        haptics.tap();
                        setReaderFollowsAudio(!readerFollowsAudio);
                      }}
                      onLongPress={() => {
                        haptics.tap();
                        toast.info(
                          readerFollowsAudio
                            ? t.audio.readerFollowOnToast
                            : t.audio.readerFollowOffToast,
                        );
                      }}
                      hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                      accessibilityRole="button"
                      accessibilityLabel={t.audio.a11y.readerFollow}
                      accessibilityHint={t.audio.a11y.readerFollowHint}
                      accessibilityState={{selected: readerFollowsAudio}}>
                      <Ionicons
                        name="book"
                        size={20}
                        color={
                          readerFollowsAudio
                            ? colors.primary
                            : colors.textTertiary
                        }
                      />
                    </TouchableOpacity>
                  )}
                  {/* Repeat-verse toggle (memorization) — when on, the current
                      verse loops instead of advancing, so it can be memorized.
                      Tap toggles quietly; long-press explains (mirrors ∞). */}
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => {
                      haptics.tap();
                      setRepeatVerse(!repeatVerse);
                    }}
                    onLongPress={() => {
                      haptics.tap();
                      toast.info(
                        repeatVerse
                          ? t.audio.repeatVerseOnToast
                          : t.audio.repeatVerseOffToast,
                      );
                    }}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    accessibilityRole="button"
                    accessibilityLabel={t.audio.a11y.repeatVerse}
                    accessibilityHint={t.audio.a11y.repeatVerseHint}
                    accessibilityState={{selected: repeatVerse}}>
                    <Ionicons
                      name="repeat"
                      size={22}
                      color={repeatVerse ? colors.primary : colors.textTertiary}
                    />
                  </TouchableOpacity>
                  {/* Collapse Button */}
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleToggleExpand}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    accessibilityRole="button"
                    accessibilityLabel={t.audio.a11y.collapse}>
                    <Ionicons
                      name={AUDIO_ICONS.collapse}
                      size={22}
                      color={colors.text}
                    />
                  </TouchableOpacity>
                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => {
                      haptics.press();
                      hidePlayer();
                    }}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    accessibilityRole="button"
                    accessibilityLabel={t.audio.a11y.close}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ♾️ Up-next peek (Sprint 73) — names the chapter continuous
                  playback will roll into; hidden at the end of the canon.
                  Tappable since Sprint 75: opens the listening-queue sheet.
                  A playlist (Sprint 79) shows its identity here instead. */}
              {(playlistPeek || nextChapterPeek) && (
                <TouchableOpacity
                  style={styles.nextChapterRow}
                  onPress={() => {
                    haptics.tap();
                    setQueueSheetVisible(true);
                  }}
                  hitSlop={{top: 8, bottom: 8, left: 12, right: 12}}
                  accessibilityRole="button"
                  accessibilityLabel={t.audio.queue.openLabel}
                  accessibilityHint={t.audio.queue.openHint}>
                  <Ionicons
                    name={playlistPeek ? 'list' : 'infinite'}
                    size={12}
                    color={colors.primary}
                  />
                  <Text
                    style={[
                      styles.nextChapterText,
                      {color: colors.textSecondary},
                    ]}
                    numberOfLines={1}>
                    {playlistPeek ??
                      t.audio.nextChapterUp.replace(
                        '{{chapter}}',
                        nextChapterPeek ?? '',
                      )}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={12}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              )}

              <View style={styles.waveformContainer}>
                <AudioWaveform
                  isPlaying={state.isPlaying && state.isExpanded}
                  barCount={14}
                  height={18}
                  color={colors.primary}
                  mutedColor={colors.border}
                />
              </View>

              {/* Progress Bar — the draggable verse scrubber is free for all
                  users (verse-seek is not a premium gate). */}
              <View style={styles.progressContainer}>
                <VerseScrubber
                  currentIndex={state.currentVerseIndex}
                  totalVerses={verses.length}
                  labelForIndex={labelForIndex}
                  onSeek={goToVerse}
                />
              </View>

              {/* Controls */}
              <View
                pointerEvents="auto"
                style={[
                  styles.controlsContainer,
                  {width: EXPANDED_CONTROLS_WIDTH},
                ]}>
                <AudioControls
                  isPlaying={state.isPlaying}
                  isLoading={state.isLoading}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  size="small"
                  onPlayPause={togglePlayPause}
                  onNext={nextVerse}
                  onPrevious={previousVerse}
                />
              </View>

              <View style={[styles.optionsRow, {gap: AUDIO_CONTROL_GAP}]}>
                {/* Speed Selector */}
                <View style={styles.optionSlot}>
                  <AudioSpeedSelector
                    currentSpeed={state.playbackSpeed}
                    onSpeedChange={setPlaybackSpeed}
                    variant="compact"
                    isPremium={isPremium}
                  />
                </View>

                {/* Sleep Timer Button */}
                <View style={styles.optionSlot}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: sleepTimer.isActive
                          ? colors.primary + '20'
                          : colors.surfaceVariant,
                      },
                    ]}
                    onPress={() => setSleepTimerModalVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t.audio.sleepTimer.openTimer}>
                    <Ionicons
                      name="moon"
                      size={16}
                      color={sleepTimer.isActive ? colors.primary : colors.text}
                    />
                    {sleepTimer.isActive && (
                      <AppText
                        scaleRole="compact"
                        style={[styles.timerBadge, {color: colors.primary}]}>
                        {sleepTimer.remainingMinutes}m
                      </AppText>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Voice Selector */}
                <View style={styles.optionSlot}>
                  <VoiceSelector
                    currentVoice={state.selectedVoice}
                    currentLanguage={state.selectedLanguage}
                    contentLanguage={state.contentLanguage}
                    onVoiceSelect={setVoice}
                    onLanguageChange={setLanguage}
                    variant="compact"
                  />
                </View>
              </View>
            </Animated.View>
          </View>
        </BlurView>

        {/* Sleep Timer Modal */}
        <SleepTimerModal
          visible={sleepTimerModalVisible}
          onClose={() => setSleepTimerModalVisible(false)}
          onSetTimer={setSleepTimer}
          onSetEndOfChapter={setSleepTimerEndOfChapter}
          onSetEndOfBook={setSleepTimerEndOfBook}
          onCancelTimer={cancelSleepTimer}
          currentTimer={sleepTimer}
        />

        {/* Listening queue (Sprint 75) */}
        <AudioQueueSheet
          visible={queueSheetVisible}
          onClose={() => setQueueSheetVisible(false)}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: PLAYER_DIMENSIONS.horizontalPadding,
    right: PLAYER_DIMENSIONS.horizontalPadding,
    borderRadius: PLAYER_DIMENSIONS.borderRadius,
    overflow: 'hidden',
    shadowColor: AUDIO_COLORS.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 9999,
  },
  blurContainer: {
    flex: 1,
    borderRadius: PLAYER_DIMENSIONS.borderRadius,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
    borderRadius: PLAYER_DIMENSIONS.borderRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  dragHandle: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 0,
  },
  dragIndicator: {
    width: 32,
    height: 3,
    borderRadius: 2,
    opacity: 0.4,
  },
  // Collapsed styles
  collapsedContent: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 44,
  },
  collapsedMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  miniPlayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseInfo: {
    flex: 1,
    gap: 4,
  },
  verseTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  miniNextButton: {
    padding: 6,
  },
  speedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 32,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
    includeFontPadding: false,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  expandButton: {
    padding: 2,
  },
  // Expanded styles
  expandedContent: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  expandedTitle: {
    flex: 1,
  },
  expandedVerseTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  expandedVerseText: {
    fontSize: 11,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 6,
    borderRadius: 16,
  },
  progressContainer: {
    marginBottom: 2,
  },
  nextChapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 2,
  },
  nextChapterText: {
    fontSize: 11,
    fontWeight: '600',
  },
  waveformContainer: {
    marginBottom: 4,
    marginTop: 2,
  },
  controlsContainer: {
    alignSelf: 'center',
    marginBottom: 2,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingBottom: 4,
  },
  optionSlot: {
    minWidth: 54,
    alignItems: 'center',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    height: 24,
    minWidth: 32,
    justifyContent: 'center',
    borderRadius: 10,
    gap: 6,
  },
  timerBadge: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 13,
    includeFontPadding: false,
  },
  hidden: {
    zIndex: -1,
  },
  visible: {
    zIndex: 10,
  },
  expandedVisible: {
    zIndex: 100,
  },
});

export default MiniAudioPlayer;
