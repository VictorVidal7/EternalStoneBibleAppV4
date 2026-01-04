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
  maxHeight: number;
  color: string;
  mutedColor: string;
}

const WaveBar: React.FC<WaveBarProps> = ({
  index,
  isPlaying,
  maxHeight,
  color,
  mutedColor,
}) => {
  const heightValue = useSharedValue(0.3);
  const duration = 400 + (index % 5) * 150;
  const delay = index * 50;

  useEffect(() => {
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
  }, [delay, duration, heightValue, isPlaying]);

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
  const bars = useMemo(
    () => Array.from({length: barCount}, (_, index) => index),
    [barCount],
  );

  const activeColor = color ?? colors.primary;
  const idleColor = mutedColor ?? colors.border;

  return (
    <View style={[styles.container, {height}]}>
      {bars.map(index => (
        <WaveBar
          key={index}
          index={index}
          isPlaying={isPlaying}
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
