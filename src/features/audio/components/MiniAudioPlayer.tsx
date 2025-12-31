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

import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
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
import {useAudioPlayer} from '../context/AudioPlayerContext';
import {AudioControls} from './AudioControls';
import {AudioProgressBar, MiniProgressDots} from './AudioProgressBar';
import {AudioSpeedSelector} from './AudioSpeedSelector';
import {SleepTimerModal} from './SleepTimerModal';
import {VoiceSelector} from './VoiceSelector';
import {
  PLAYER_DIMENSIONS,
  AUDIO_ICONS,
  AUDIO_CONTROL_SIZES,
  AUDIO_CONTROL_GAP,
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
  // Handle expand/collapse
  const handleToggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (state.isExpanded) {
      expandProgress.value = withSpring(0, SPRING_CONFIGS.snappy);
      collapse();
    } else {
      expandProgress.value = withSpring(1, SPRING_CONFIGS.snappy);
      expand();
    }
  }, [state.isExpanded, expand, collapse, expandProgress]);

  // Gesture handler for swipe down to close using new Gesture API
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
        // Close player
        translateY.value = withSpring(300, SPRING_CONFIGS.snappy, () => {
          runOnJS(hidePlayer)();
        });
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

  // Don't render if not visible or no verses loaded
  if (!isVisible || !currentVerse || verses.length === 0) {
    return null;
  }

  const verseTitle = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
  const canGoPrevious = state.currentVerseIndex > 0;
  const canGoNext = state.currentVerseIndex < verses.length - 1;

  const finalBottomOffset = (state.bottomOffset || 0) + bottomOffset;

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
              pointerEvents={state.isExpanded ? 'none' : 'box-none'}
              style={[
                styles.collapsedContent,
                collapsedContentStyle,
                {zIndex: state.isExpanded ? 0 : 10},
              ]}>
              <View style={styles.collapsedMain}>
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
                    color="#FFFFFF"
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
              pointerEvents={state.isExpanded ? 'box-none' : 'none'}
              style={[
                styles.expandedContent,
                expandedContentStyle,
                {zIndex: state.isExpanded ? 10 : 0},
              ]}>
              {/* Header */}
              <View style={styles.expandedHeader}>
                <TouchableOpacity
                  style={styles.collapseButton}
                  onPress={handleToggleExpand}
                  hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}>
                  <Ionicons name={AUDIO_ICONS.collapse} size={22} />
                </TouchableOpacity>
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
                <TouchableOpacity
                  style={styles.closeButtonContainer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    hidePlayer();
                  }}
                  hitSlop={{top: 25, bottom: 25, left: 25, right: 25}}>
                  <Text
                    style={[styles.closeText, {color: colors.textSecondary}]}>
                    Cerrar
                  </Text>
                  <Ionicons
                    name={AUDIO_ICONS.close}
                    size={22}
                    color={colors.text}
                  />
                </TouchableOpacity>
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

              {/* Bottom Options */}
              <View
                style={[
                  styles.optionsRow,
                  {width: EXPANDED_CONTROLS_WIDTH, gap: AUDIO_CONTROL_GAP},
                ]}>
                {/* Speed Selector */}
                <View style={styles.optionSlot}>
                  <AudioSpeedSelector
                    currentSpeed={state.playbackSpeed}
                    onSpeedChange={setPlaybackSpeed}
                    variant="compact"
                  />
                </View>

                {/* Sleep Timer Button */}
                <View style={styles.optionSlotMain}>
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
                    {sleepTimer.isActive && sleepTimer.remainingMinutes > 0 && (
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
    shadowColor: '#000',
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
  collapseButton: {
    padding: 2,
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
  closeButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 2,
  },
  closeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 4,
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
    marginTop: 6,
  },
  optionSlot: {
    width: AUDIO_CONTROL_SIZES.small.secondary,
    alignItems: 'center',
  },
  optionSlotMain: {
    width: AUDIO_CONTROL_SIZES.small.main,
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
});

export default MiniAudioPlayer;
