/**
 * ⭐ PREMIUM RATING COMPONENT
 *
 * Sistema de calificación con:
 * - Estrellas animadas
 * - Medio estrellas
 * - Interactivo u solo visualización
 * - Múltiples tamaños
 */

import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { spacing } from '../styles/designTokens';

interface PremiumRatingProps {
  value: number;
  maxStars?: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  color?: string;
  emptyColor?: string;
  allowHalf?: boolean;
  style?: ViewStyle;
  animated?: boolean;
}

export const PremiumRating: React.FC<PremiumRatingProps> = ({
  value,
  maxStars = 5,
  onRatingChange,
  readonly = false,
  size = 24,
  color = '#fbbf24',
  emptyColor = '#d1d5db',
  allowHalf = false,
  style,
  animated = true,
}) => {
  const [currentValue, setCurrentValue] = useState(value);

  const handlePress = (index: number, isHalf: boolean = false) => {
    if (readonly) return;

    const newValue = isHalf ? index + 0.5 : index + 1;
    setCurrentValue(newValue);

    if (onRatingChange) {
      onRatingChange(newValue);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderStar = (index: number) => {
    const filled = index < Math.floor(currentValue);
    const halfFilled = allowHalf && index < currentValue && index >= Math.floor(currentValue);

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handlePress(index)}
        disabled={readonly}
        activeOpacity={0.7}
        style={styles.starContainer}
      >
        {halfFilled ? (
          <View style={{ position: 'relative' }}>
            {/* Empty star */}
            <Ionicons name="star-outline" size={size} color={emptyColor} />
            {/* Half filled star */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: size / 2,
                overflow: 'hidden',
              }}
            >
              <Ionicons name="star" size={size} color={color} />
            </View>
          </View>
        ) : (
          <AnimatedStar
            filled={filled}
            size={size}
            color={color}
            emptyColor={emptyColor}
            animated={animated}
            delay={index * 50}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: maxStars }, (_, i) => renderStar(i))}
    </View>
  );
};

// Animated Star Component
interface AnimatedStarProps {
  filled: boolean;
  size: number;
  color: string;
  emptyColor: string;
  animated: boolean;
  delay: number;
}

const AnimatedStar: React.FC<AnimatedStarProps> = ({
  filled,
  size,
  color,
  emptyColor,
  animated,
  delay,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (filled && animated) {
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(filled ? 1 : 0);
    }
  }, [filled]);

  return (
    <View style={{ position: 'relative' }}>
      {/* Empty star (always visible) */}
      <Ionicons name="star-outline" size={size} color={emptyColor} />

      {/* Filled star (animated on top) */}
      {filled && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <Ionicons name="star" size={size} color={color} />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    marginHorizontal: spacing.xs / 2,
  },
});

export default PremiumRating;
