/**
 * AudioSpeedSelector Component
 *
 * Selector de velocidad de reproduccion con chips
 * Velocidades: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x
 *
 * Para la gloria de Dios - Eternal Stone Bible App
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {staticColors} from '@/styles/designTokens';

import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {useTheme} from '../../../hooks/useTheme';
import {useLanguage} from '../../../hooks/useLanguage';
import {PlaybackSpeed} from '../types/audio';
import {
  PLAYBACK_SPEEDS,
  PLAYBACK_SPEED_LABELS,
} from '../constants/audioConstants';

interface AudioSpeedSelectorProps {
  currentSpeed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  variant?: 'chips' | 'compact' | 'inline';
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const AudioSpeedSelector: React.FC<AudioSpeedSelectorProps> = ({
  currentSpeed,
  onSpeedChange,
  variant = 'chips',
}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();
  const speedLabel = t.audio.a11y.speed;

  const handleSpeedSelect = (speed: PlaybackSpeed) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSpeedChange(speed);
  };

  if (variant === 'compact') {
    return (
      <CompactSpeedSelector
        currentSpeed={currentSpeed}
        onSpeedChange={handleSpeedSelect}
        colors={colors}
      />
    );
  }

  if (variant === 'inline') {
    return (
      <InlineSpeedSelector
        currentSpeed={currentSpeed}
        onSpeedChange={handleSpeedSelect}
        colors={colors}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>
        {speedLabel}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}>
        {PLAYBACK_SPEEDS.map(speed => {
          const isSelected = speed === currentSpeed;
          return (
            <TouchableOpacity
              key={speed}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.surfaceVariant,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSpeedSelect(speed)}
              accessibilityLabel={`${speedLabel} ${PLAYBACK_SPEED_LABELS[speed]}`}
              accessibilityRole="button"
              accessibilityState={{selected: isSelected}}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? staticColors.white : colors.text,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}>
                {PLAYBACK_SPEED_LABELS[speed]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ==================== COMPACT VARIANT ====================

interface CompactSelectorProps {
  currentSpeed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

const CompactSpeedSelector: React.FC<CompactSelectorProps> = ({
  currentSpeed,
  onSpeedChange,
  colors,
}) => {
  const {t} = useLanguage();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const cycleSpeed = () => {
    scale.value = withSpring(0.9, {damping: 15}, () => {
      scale.value = withSpring(1);
    });

    const currentIndex = PLAYBACK_SPEEDS.indexOf(currentSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    onSpeedChange(PLAYBACK_SPEEDS[nextIndex]);
  };

  return (
    <AnimatedTouchable
      style={[
        styles.compactButton,
        {backgroundColor: colors.surfaceVariant},
        animatedStyle,
      ]}
      onPress={cycleSpeed}
      accessibilityLabel={`${t.audio.a11y.speed} ${PLAYBACK_SPEED_LABELS[currentSpeed]}`}>
      <Text
        style={[styles.compactText, {color: colors.primary}]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}>
        {PLAYBACK_SPEED_LABELS[currentSpeed]}
      </Text>
    </AnimatedTouchable>
  );
};

// ==================== INLINE VARIANT ====================

const InlineSpeedSelector: React.FC<CompactSelectorProps> = ({
  currentSpeed,
  onSpeedChange,
  colors,
}) => {
  // Show only common speeds inline
  const inlineSpeeds: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5, 2];

  return (
    <View style={styles.inlineContainer}>
      {inlineSpeeds.map(speed => {
        const isSelected = speed === currentSpeed;
        return (
          <TouchableOpacity
            key={speed}
            style={[
              styles.inlineChip,
              {
                backgroundColor: isSelected
                  ? colors.primary
                  : staticColors.transparent,
              },
            ]}
            onPress={() => onSpeedChange(speed)}>
            <Text
              style={[
                styles.inlineText,
                {
                  color: isSelected ? staticColors.white : colors.textSecondary,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}>
              {speed === 1 ? '1x' : `${speed}x`}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 4,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  // Compact styles
  compactButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minHeight: 32,
    minWidth: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
  },
  // Inline styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inlineChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  inlineText: {
    fontSize: 12,
  },
});

export default AudioSpeedSelector;
