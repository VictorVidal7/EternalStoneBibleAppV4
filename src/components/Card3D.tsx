/**
 * 🎴 CARD 3D COMPONENT
 *
 * Card component con efectos 3D impresionantes:
 * - Sombras profundas realistas
 * - Efecto de elevación en press
 * - Animaciones suaves
 * - Parallax sutil
 */

import React, {useRef} from 'react';
import {StyleSheet, TouchableOpacity, Animated, ViewStyle} from 'react-native';
import {haptics} from '@lib/haptics';
import {borderRadius} from '../styles/designTokens';
import {usePressScale} from '../hooks/usePressScale';

interface Card3DProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevation?: number;
  borderRadius?: number;
  backgroundColor?: string;
  hapticFeedback?: boolean;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  onPress,
  style,
  elevation = 3,
  borderRadius: customBorderRadius = borderRadius.lg,
  backgroundColor = '#ffffff',
  hapticFeedback = true,
}) => {
  // Sprint 67: shared, reduce-motion-aware press depress (see usePressScale);
  // the shadow-softening on press stays local.
  const press = usePressScale();
  const elevationAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (hapticFeedback) {
      haptics.tap();
    }

    press.onPressIn();
    Animated.timing(elevationAnim, {
      toValue: 0.6,
      duration: 100,
      useNativeDriver: false,
    }).start();
  };

  const handlePressOut = () => {
    press.onPressOut();
    Animated.timing(elevationAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Crear sombras 3D sutiles y modernas
  const get3DShadows = () => {
    const baseElevation = elevation;

    return {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: baseElevation,
      },
      shadowOpacity: 0.06, // Reducido dramáticamente de 0.25
      shadowRadius: baseElevation * 2, // Reducido de baseElevation * 4
      elevation: baseElevation, // Reducido de baseElevation * 3
    };
  };

  const animatedShadow = {
    ...get3DShadows(),
    shadowOpacity: elevationAnim.interpolate({
      inputRange: [0.6, 1],
      outputRange: [0.04, 0.06], // Reducido de [0.15, 0.25]
    }),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor,
              borderRadius: customBorderRadius,
              transform: [{scale: press.scale}],
            },
            animatedShadow,
            style,
          ]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor,
          borderRadius: customBorderRadius,
        },
        get3DShadows(),
        style,
      ]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'visible', // Importante para que las sombras sean visibles
  },
});

export default Card3D;
