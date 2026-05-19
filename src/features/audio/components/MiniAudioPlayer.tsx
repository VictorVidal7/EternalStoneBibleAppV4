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
} from 'react-native';
import {usePathname} from 'expo-router';
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
import * as Haptics from 'expo-haptics';
import {useTheme} from '../../../hooks/useTheme';
import {useLanguage} from '../../../hooks/useLanguage';
import {getBookByName} from '../../../constants/bible';
import {useAudioPlayer} from '../context/AudioPlayerContext';
import {AudioControls} from './AudioControls';
import {AudioProgressBar, MiniProgressDots} from './AudioProgressBar';
import {AudioWaveform} from './AudioWaveform';
import {AudioSpeedSelector} from './AudioSpeedSelector';
import {SleepTimerModal} from './SleepTimerModal';
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

export const MiniAudioPlayer: React.FC<MiniAudioPlayerProps> = ({
  bottomOffset = 0,
}) => {
  const {colors, isDark} = useTheme();
  const {language} = useLanguage();
  const insets = useSafeAreaInsets();
  const [sleepTimerModalVisible, setSleepTimerModalVisible] = useState(false);

  const {
    state,
    sleepTimer,
    currentVerse,
    verses,
    isVisible,
    togglePlayPause,
    nextVerse,
    previousVerse,
    setPlaybackSpeed,
    expand,
    collapse,
    hidePlayer,
    setSleepTimer,
    setSleepTimerEndOfChapter,
    cancelSleepTimer,
    setVoice,
    setLanguage,
  } = useAudioPlayer();

  // Animation values
  const expandProgress = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startY = useSharedValue(0);

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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  if (!isVisible || !currentVerse || verses.length === 0) {
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
  const canGoPrevious = state.currentVerseIndex > 0;
  const canGoNext = state.currentVerseIndex < verses.length - 1;

  const TAB_BAR_HEIGHT = isTabScreen ? (Platform.OS === 'ios' ? 88 : 68) : 0;
  const finalBottomOffset =
    (state.bottomOffset || 0) + bottomOffset + TAB_BAR_HEIGHT;

  return (
    <GestureDetector gesture={panGesture}>
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
                  onPress={togglePlayPause}>
                  <Ionicons
                    name={
                      state.isPlaying ? AUDIO_ICONS.pause : AUDIO_ICONS.play
                    }
                    size={16}
                    color={AUDIO_COLORS.white}
                  />
                </TouchableOpacity>

                <Pressable
                  disabled={state.isExpanded}
                  style={styles.verseInfo}
                  onPress={handleToggleExpand}>
                  <Text
                    style={[styles.verseTitle, {color: colors.text}]}
                    numberOfLines={1}>
                    {verseTitle}
                  </Text>
                  <MiniProgressDots
                    currentIndex={state.currentVerseIndex}
                    totalVerses={verses.length}
                  />
                </Pressable>

                {/* Next Button */}
                <TouchableOpacity
                  style={styles.miniNextButton}
                  onPress={nextVerse}
                  disabled={!canGoNext || state.isExpanded}>
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
                    const nextSpeed =
                      state.playbackSpeed === 1
                        ? 1.5
                        : state.playbackSpeed === 1.5
                          ? 2
                          : 1;
                    setPlaybackSpeed(nextSpeed);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}>
                  <Text style={[styles.speedText, {color: colors.primary}]}>
                    {state.playbackSpeed}x
                  </Text>
                </TouchableOpacity>

                {/* Expand Button */}
                <TouchableOpacity
                  disabled={state.isExpanded}
                  style={styles.expandButton}
                  onPress={handleToggleExpand}>
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
                  <Text
                    style={[styles.expandedVerseTitle, {color: colors.text}]}
                    numberOfLines={1}>
                    {verseTitle}
                  </Text>
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
                  {/* Collapse Button */}
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleToggleExpand}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
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
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      hidePlayer();
                    }}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Ionicons name="close" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.waveformContainer}>
                <AudioWaveform
                  isPlaying={state.isPlaying && state.isExpanded}
                  barCount={14}
                  height={18}
                  color={colors.primary}
                  mutedColor={colors.border}
                />
              </View>

              {/* Progress Bar */}
              <View style={styles.progressContainer}>
                <AudioProgressBar
                  currentIndex={state.currentVerseIndex}
                  totalVerses={verses.length}
                  showLabels={true}
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
                    onPress={() => setSleepTimerModalVisible(true)}>
                    <Ionicons
                      name="moon"
                      size={16}
                      color={sleepTimer.isActive ? colors.primary : colors.text}
                    />
                    {sleepTimer.isActive && (
                      <Text
                        style={[styles.timerBadge, {color: colors.primary}]}>
                        {sleepTimer.remainingMinutes}m
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Voice Selector */}
                <View style={styles.optionSlot}>
                  <VoiceSelector
                    currentVoice={state.selectedVoice}
                    currentLanguage={state.selectedLanguage}
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
          onCancelTimer={cancelSleepTimer}
          currentTimer={sleepTimer}
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
  },
  speedText: {
    fontSize: 11,
    fontWeight: '600',
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
