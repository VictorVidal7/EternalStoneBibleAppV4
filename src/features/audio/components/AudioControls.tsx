/**
 * AudioControls Component
 *
 * Controles de reproduccion de audio con animaciones premium
 * Botones: Previous, Play/Pause, Next con haptic feedback
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React from 'react';
import {View, TouchableOpacity, StyleSheet, Text} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {useTheme} from '../../../hooks/useTheme';
import {staticColors} from '../../../styles/designTokens';
import {useLanguage} from '../../../hooks/useLanguage';
import {
  AUDIO_ICONS,
  AUDIO_CONTROL_SIZES,
  AUDIO_CONTROL_GAP,
} from '../constants/audioConstants';

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading?: boolean;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  onPlayPause: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  isLoading = false,
  canGoNext = true,
  canGoPrevious = true,
  size = 'medium',
  showLabels = false,
  onPlayPause,
  onNext,
  onPrevious,
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const a11y = t.audio.a11y;
  const sizeConfig = AUDIO_CONTROL_SIZES[size];

  // Animation values
  const playButtonScale = useSharedValue(1);
  const prevButtonScale = useSharedValue(1);
  const nextButtonScale = useSharedValue(1);

  // Play button pulse animation when playing
  const playButtonStyle = useAnimatedStyle(() => ({
    transform: [{scale: playButtonScale.value}],
  }));

  const prevButtonStyle = useAnimatedStyle(() => ({
    transform: [{scale: prevButtonScale.value}],
  }));

  const nextButtonStyle = useAnimatedStyle(() => ({
    transform: [{scale: nextButtonScale.value}],
  }));

  const handlePlayPause = () => {
    playButtonScale.value = withSequence(
      withTiming(0.85, {duration: 100}),
      withSpring(1, {damping: 15, stiffness: 300}),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlayPause();
  };

  const handlePrevious = () => {
    if (!canGoPrevious || !onPrevious) return;
    prevButtonScale.value = withSequence(
      withTiming(0.85, {duration: 100}),
      withSpring(1, {damping: 15, stiffness: 300}),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPrevious();
  };

  const handleNext = () => {
    if (!canGoNext || !onNext) return;
    nextButtonScale.value = withSequence(
      withTiming(0.85, {duration: 100}),
      withSpring(1, {damping: 15, stiffness: 300}),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNext();
  };

  return (
    <View style={[styles.container, {gap: AUDIO_CONTROL_GAP}]}>
      {/* Previous Button */}
      <View style={styles.buttonWrapper}>
        <AnimatedTouchable
          style={[
            styles.secondaryButton,
            {
              width: sizeConfig.secondary,
              height: sizeConfig.secondary,
              borderRadius: sizeConfig.secondary / 2,
              backgroundColor: colors.surfaceVariant,
              opacity: canGoPrevious ? 1 : 0.4,
            },
            prevButtonStyle,
          ]}
          onPress={handlePrevious}
          disabled={!canGoPrevious}
          accessibilityLabel={a11y.previousVerse}
          accessibilityHint={a11y.previousVerseHint}
          accessibilityRole="button"
          accessibilityState={{disabled: !canGoPrevious}}>
          <Ionicons
            name={AUDIO_ICONS.previous}
            size={sizeConfig.iconSecondary}
            color={colors.text}
          />
        </AnimatedTouchable>
        {showLabels && (
          <Text style={[styles.buttonLabel, {color: colors.textSecondary}]}>
            {t.previous}
          </Text>
        )}
      </View>

      {/* Play/Pause Button */}
      <View style={styles.buttonWrapper}>
        <AnimatedTouchable
          style={[
            styles.mainButton,
            {
              width: sizeConfig.main,
              height: sizeConfig.main,
              borderRadius: sizeConfig.main / 2,
              backgroundColor: colors.primary,
            },
            playButtonStyle,
          ]}
          onPress={handlePlayPause}
          disabled={isLoading}
          accessibilityLabel={isPlaying ? a11y.pause : a11y.play}
          accessibilityHint={a11y.playHint}
          accessibilityRole="button"
          accessibilityState={{disabled: isLoading, selected: isPlaying}}>
          {isLoading ? (
            <Ionicons
              name="ellipsis-horizontal"
              size={sizeConfig.iconMain}
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name={isPlaying ? AUDIO_ICONS.pause : AUDIO_ICONS.play}
              size={sizeConfig.iconMain}
              color="#FFFFFF"
            />
          )}
        </AnimatedTouchable>
        {showLabels && (
          <Text style={[styles.buttonLabel, {color: colors.textSecondary}]}>
            {isPlaying ? t.verse.pause : t.verse.audio}
          </Text>
        )}
      </View>

      {/* Next Button */}
      <View style={styles.buttonWrapper}>
        <AnimatedTouchable
          style={[
            styles.secondaryButton,
            {
              width: sizeConfig.secondary,
              height: sizeConfig.secondary,
              borderRadius: sizeConfig.secondary / 2,
              backgroundColor: colors.surfaceVariant,
              opacity: canGoNext ? 1 : 0.4,
            },
            nextButtonStyle,
          ]}
          onPress={handleNext}
          disabled={!canGoNext}
          accessibilityLabel={a11y.nextVerse}
          accessibilityHint={a11y.nextVerseHint}
          accessibilityRole="button"
          accessibilityState={{disabled: !canGoNext}}>
          <Ionicons
            name={AUDIO_ICONS.next}
            size={sizeConfig.iconSecondary}
            color={colors.text}
          />
        </AnimatedTouchable>
        {showLabels && (
          <Text style={[styles.buttonLabel, {color: colors.textSecondary}]}>
            {t.next}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWrapper: {
    alignItems: 'center',
  },
  mainButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: staticColors.indigoShadow,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '500',
  },
});

export default AudioControls;
