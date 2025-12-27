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

import React, {useState, useCallback} from 'react';
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
import {PLAYER_DIMENSIONS, AUDIO_ICONS} from '../constants/audioConstants';
import {SPRING_CONFIGS} from '../../../styles/reanimatedAnimations';

interface MiniAudioPlayerProps {
  bottomOffset?: number;
}

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

  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      expandProgress.value,
      [0.7, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  // Don't render if no verses loaded
  if (!currentVerse || verses.length === 0) {
    return null;
  }

  const verseTitle = `${currentVerse.book} ${currentVerse.chapter}:${currentVerse.verse}`;
  const canGoPrevious = state.currentVerseIndex > 0;
  const canGoNext = state.currentVerseIndex < verses.length - 1;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.container,
          {
            bottom:
              bottomOffset + insets.bottom + PLAYER_DIMENSIONS.bottomMargin,
          },
          containerStyle,
        ]}>
        <BlurView
          intensity={isDark ? 80 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurContainer}>
          <View
            style={[
              styles.innerContainer,
              {
                backgroundColor: isDark
                  ? 'rgba(26, 29, 46, 0.85)'
                  : 'rgba(255, 255, 255, 0.9)',
                borderColor: colors.glassBorder,
              },
            ]}>
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
              style={[styles.collapsedContent, collapsedContentStyle]}>
              <Pressable
                style={styles.collapsedMain}
                onPress={handleToggleExpand}>
                {/* Play/Pause Button */}
                <TouchableOpacity
                  style={[
                    styles.miniPlayButton,
                    {backgroundColor: colors.primary},
                  ]}
                  onPress={togglePlayPause}>
                  <Ionicons
                    name={
                      state.isPlaying ? AUDIO_ICONS.pause : AUDIO_ICONS.play
                    }
                    size={18}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Verse Info */}
                <View style={styles.verseInfo}>
                  <Text
                    style={[styles.verseTitle, {color: colors.text}]}
                    numberOfLines={1}>
                    {verseTitle}
                  </Text>
                  <MiniProgressDots
                    currentIndex={state.currentVerseIndex}
                    totalVerses={verses.length}
                  />
                </View>

                {/* Next Button */}
                <TouchableOpacity
                  style={styles.miniNextButton}
                  onPress={nextVerse}
                  disabled={!canGoNext}>
                  <Ionicons
                    name={AUDIO_ICONS.next}
                    size={20}
                    color={canGoNext ? colors.text : colors.textTertiary}
                  />
                </TouchableOpacity>

                {/* Speed Indicator */}
                <TouchableOpacity
                  style={[
                    styles.speedBadge,
                    {backgroundColor: colors.surfaceVariant},
                  ]}
                  onPress={handleToggleExpand}>
                  <Text style={[styles.speedText, {color: colors.primary}]}>
                    {state.playbackSpeed}x
                  </Text>
                </TouchableOpacity>

                {/* Expand Button */}
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={handleToggleExpand}>
                  <Ionicons
                    name={AUDIO_ICONS.expand}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </Pressable>
            </Animated.View>

            {/* ==================== EXPANDED CONTENT ==================== */}
            <Animated.View
              style={[styles.expandedContent, expandedContentStyle]}>
              {/* Header */}
              <View style={styles.expandedHeader}>
                <TouchableOpacity
                  style={styles.collapseButton}
                  onPress={handleToggleExpand}>
                  <Ionicons
                    name={AUDIO_ICONS.collapse}
                    size={24}
                    color={colors.textSecondary}
                  />
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
                  style={styles.closeButton}
                  onPress={hidePlayer}>
                  <Ionicons
                    name={AUDIO_ICONS.close}
                    size={24}
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
              <View style={styles.controlsContainer}>
                <AudioControls
                  isPlaying={state.isPlaying}
                  isLoading={state.isLoading}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  size="medium"
                  onPlayPause={togglePlayPause}
                  onNext={nextVerse}
                  onPrevious={previousVerse}
                />
              </View>

              {/* Bottom Options */}
              <View style={styles.optionsRow}>
                {/* Speed Selector */}
                <AudioSpeedSelector
                  currentSpeed={state.playbackSpeed}
                  onSpeedChange={setPlaybackSpeed}
                  variant="compact"
                />

                {/* Sleep Timer Button */}
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
                    size={18}
                    color={sleepTimer.isActive ? colors.primary : colors.text}
                  />
                  {sleepTimer.isActive && sleepTimer.remainingMinutes > 0 && (
                    <Text style={[styles.timerBadge, {color: colors.primary}]}>
                      {sleepTimer.remainingMinutes}m
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Voice Selector */}
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    {backgroundColor: colors.surfaceVariant},
                  ]}>
                  <Ionicons name="mic" size={18} color={colors.text} />
                </TouchableOpacity>
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.4,
  },
  // Collapsed styles
  collapsedContent: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    height: 52,
  },
  collapsedMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
  },
  miniPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    padding: 8,
  },
  speedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  speedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandButton: {
    padding: 4,
  },
  // Expanded styles
  expandedContent: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
  },
  expandedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  collapseButton: {
    padding: 4,
  },
  expandedTitle: {
    flex: 1,
  },
  expandedVerseTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  expandedVerseText: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  controlsContainer: {
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  timerBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MiniAudioPlayer;
