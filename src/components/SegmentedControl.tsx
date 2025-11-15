/**
 * 🎛️ SEGMENTED CONTROL PREMIUM
 *
 * Control segmentado moderno con:
 * - Animaciones fluidas
 * - Glassmorphism
 * - Múltiples variantes
 * - Haptic feedback
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, fontSize, shadows } from '../styles/designTokens';

export interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  selectedValue: string;
  onValueChange: (value: string) => void;
  gradient?: string[];
  backgroundColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  variant?: 'default' | 'gradient' | 'outlined';
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedValue,
  onValueChange,
  gradient = ['#667eea', '#764ba2'],
  backgroundColor = '#f0f0f0',
  activeTextColor = '#ffffff',
  inactiveTextColor = '#666666',
  variant = 'gradient',
}) => {
  const [segmentWidth, setSegmentWidth] = React.useState(0);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  const selectedIndex = options.findIndex((opt) => opt.value === selectedValue);

  useEffect(() => {
    if (containerWidth && options.length) {
      const width = containerWidth / options.length;
      setSegmentWidth(width);
    }
  }, [containerWidth, options.length]);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: selectedIndex,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex]);

  const handlePress = (value: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animate scale
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    onValueChange(value);
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  const translateX = animatedValue.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => i * segmentWidth),
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            variant === 'outlined' ? 'transparent' : backgroundColor,
          borderWidth: variant === 'outlined' ? 2 : 0,
          borderColor: gradient[0],
        },
      ]}
      onLayout={handleLayout}
    >
      {/* Animated Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: segmentWidth,
            transform: [{ translateX }, { scale: scaleValue }],
          },
        ]}
      >
        {variant === 'gradient' ? (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.indicatorGradient}
          />
        ) : (
          <View
            style={[
              styles.indicatorSolid,
              {
                backgroundColor:
                  variant === 'outlined' ? 'transparent' : gradient[0],
              },
            ]}
          />
        )}
      </Animated.View>

      {/* Segments */}
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;

        return (
          <TouchableOpacity
            key={option.value}
            style={styles.segment}
            onPress={() => handlePress(option.value, index)}
            activeOpacity={0.7}
          >
            {option.icon && (
              <View style={styles.iconContainer}>{option.icon}</View>
            )}
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? activeTextColor : inactiveTextColor,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    position: 'relative',
    ...shadows.sm,
  },
  indicator: {
    position: 'absolute',
    top: spacing.xs,
    bottom: spacing.xs,
    left: spacing.xs,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  indicatorSolid: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 1,
  },
  iconContainer: {
    marginRight: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
  },
});

export default SegmentedControl;
