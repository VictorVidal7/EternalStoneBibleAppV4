/**
 * AudioWaveform Component
 *
 * Lightweight animated waveform for audio playback using standard Reanimated.
 * This version is 100% safe and doesn't rely on experimental Skia hooks.
 */

import React, {useEffect, useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import {useTheme} from '../../../hooks/useTheme';
import {useReducedMotion} from '../../../hooks/useReducedMotion';

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
  color?: string;
  mutedColor?: string;
}

interface WaveBarProps {
  index: number;
  isPlaying: boolean;
  reduced: boolean;
  maxHeight: number;
  color: string;
  mutedColor: string;
}

/** A frozen, varied waveform silhouette for the reduce-motion path. */
const staticHeight = (index: number) => 0.35 + (index % 5) * 0.13;

const WaveBar: React.FC<WaveBarProps> = ({
  index,
  isPlaying,
  reduced,
  maxHeight,
  color,
  mutedColor,
}) => {
  const heightValue = useSharedValue(0.3);
  const duration = 400 + (index % 5) * 150;
  const delay = index * 50;

  useEffect(() => {
    if (reduced) {
      // No looping motion: show a static silhouette while playing, flat at rest.
      heightValue.value = isPlaying ? staticHeight(index) : 0.2;
      return;
    }
    if (isPlaying) {
      heightValue.value = withDelay(
        delay,
        withRepeat(
          withSequence(withTiming(1, {duration}), withTiming(0.3, {duration})),
          -1,
          true,
        ),
      );
    } else {
      heightValue.value = withTiming(0.2, {duration: 300});
    }
  }, [delay, duration, heightValue, isPlaying, index, reduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: Math.max(3, maxHeight * heightValue.value),
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        {
          backgroundColor: isPlaying ? color : mutedColor,
          opacity: isPlaying ? 1 : 0.4,
        },
      ]}
    />
  );
};

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  barCount = 18,
  height = 24,
  color,
  mutedColor,
}) => {
  const {colors} = useTheme();
  const reduced = useReducedMotion();
  const bars = useMemo(
    () => Array.from({length: barCount}, (_, index) => index),
    [barCount],
  );

  const activeColor = color ?? colors.primary;
  const idleColor = mutedColor ?? colors.border;

  return (
    <View
      style={[styles.container, {height}]}
      // Purely decorative — the play state is conveyed by the labelled
      // play/pause control, so keep this out of the TalkBack focus order.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {bars.map(index => (
        <WaveBar
          key={index}
          index={index}
          isPlaying={isPlaying}
          reduced={reduced}
          maxHeight={height}
          color={activeColor}
          mutedColor={idleColor}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});

export default AudioWaveform;
