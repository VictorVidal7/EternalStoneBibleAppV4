/**
 * AudioWaveform Component
 *
 * Lightweight animated waveform for audio playback.
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
  const heightValue = useSharedValue(0.35);
  const duration = 360 + (index % 5) * 120;
  const delay = index * 70;

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
      heightValue.value = withTiming(0.3, {duration: 200});
    }
  }, [delay, duration, heightValue, isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: Math.max(2, maxHeight * heightValue.value),
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        {
          backgroundColor: isPlaying ? color : mutedColor,
          opacity: isPlaying ? 1 : 0.5,
        },
      ]}
    />
  );
};

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  barCount = 14,
  height = 20,
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});

export default AudioWaveform;
