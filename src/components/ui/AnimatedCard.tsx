/**
 * 🃏 AnimatedCard - Card Premium con Animaciones
 *
 * Card interactivo con animaciones de presión fluidas
 * Usando Reanimated 3 para rendimiento de 60fps
 */

import React, {ReactNode} from 'react';
import {StyleSheet, ViewStyle, Pressable, PressableProps} from 'react-native';
import Animated from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import {useTheme} from '../../context/ThemeContext';
import {useCardPress, useStaggeredItem} from '../../hooks/useAnimations';
import {borderRadius, shadows} from '../../styles/designTokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedCardProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'gradient' | 'elevated';
  gradientColors?: string[];
  index?: number; // Para animación staggered
  enableStagger?: boolean;
  blurIntensity?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  variant = 'default',
  gradientColors,
  index = 0,
  enableStagger = false,
  blurIntensity = 50,
  onPress,
  ...pressableProps
}) => {
  const {colors, isDarkMode} = useTheme();
  const {onPressIn, onPressOut, animatedStyle: pressStyle} = useCardPress();
  const {animatedStyle: staggerStyle} = useStaggeredItem(
    enableStagger ? index : 0,
    enableStagger ? 60 : 0,
  );

  // Determinar colores de gradiente
  const defaultGradient = isDarkMode
    ? ['rgba(26, 29, 46, 0.8)', 'rgba(26, 29, 46, 0.6)']
    : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'];

  const finalGradientColors = gradientColors || defaultGradient;

  // Estilos base del card
  const cardStyles: ViewStyle = {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
    ...(isDarkMode
      ? {
          shadowColor: '#000',
          shadowOpacity: 0.4,
        }
      : {}),
  };

  // Renderizar según variante
  const renderContent = () => {
    switch (variant) {
      case 'glass':
        return (
          <BlurView
            intensity={blurIntensity}
            tint={isDarkMode ? 'dark' : 'light'}
            style={[styles.cardContent, style]}>
            {children}
          </BlurView>
        );

      case 'gradient':
        return (
          <LinearGradient
            colors={finalGradientColors as [string, string, ...string[]]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={[styles.cardContent, style]}>
            {children}
          </LinearGradient>
        );

      case 'elevated':
        return (
          <Animated.View
            style={[
              styles.cardContent,
              {
                backgroundColor: colors?.surface || '#fff',
                ...shadows.lg,
              },
              style,
            ]}>
            {children}
          </Animated.View>
        );

      default:
        return (
          <Animated.View
            style={[
              styles.cardContent,
              {
                backgroundColor: colors?.surface || '#fff',
                borderWidth: 1,
                borderColor: colors?.border || 'rgba(0,0,0,0.1)',
              },
              style,
            ]}>
            {children}
          </Animated.View>
        );
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[cardStyles, pressStyle, enableStagger && staggerStyle]}
      {...pressableProps}>
      {renderContent()}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  cardContent: {
    padding: 20,
    borderRadius: borderRadius.xl,
  },
});

export default AnimatedCard;
