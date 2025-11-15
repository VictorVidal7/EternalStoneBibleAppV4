/**
 * 🎯 FLOATING MENU PREMIUM
 *
 * Menú flotante con efectos visuales impresionantes:
 * - Animaciones radiales suaves
 * - Glassmorphism
 * - Haptic feedback
 * - Configuración flexible
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { spacing, borderRadius, shadows } from '../styles/designTokens';

export interface MenuAction {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  color?: string;
  gradient?: string[];
}

interface FloatingMenuProps {
  actions: MenuAction[];
  mainIcon?: keyof typeof Ionicons.glyphMap;
  mainGradient?: string[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'small' | 'medium' | 'large';
  useGlassmorphism?: boolean;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
  actions,
  mainIcon = 'add',
  mainGradient = ['#667eea', '#764ba2'],
  position = 'bottom-right',
  size = 'large',
  useGlassmorphism = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Animaciones para cada acción
  const actionAnimations = useRef(
    actions.map(() => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  const getSizeValue = () => {
    switch (size) {
      case 'small':
        return 48;
      case 'medium':
        return 56;
      case 'large':
        return 64;
      default:
        return 64;
    }
  };

  const buttonSize = getSizeValue();
  const actionButtonSize = buttonSize * 0.75;

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const toValue = isOpen ? 0 : 1;
    const newState = !isOpen;

    // Rotar botón principal
    Animated.spring(rotation, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Animar botones de acción
    if (newState) {
      // Abrir
      Animated.stagger(
        50,
        actionAnimations.map((anim) =>
          Animated.parallel([
            Animated.spring(anim.opacity, {
              toValue: 1,
              tension: 100,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.spring(anim.scale, {
              toValue: 1,
              tension: 100,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.spring(anim.translateY, {
              toValue: 0,
              tension: 100,
              friction: 10,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    } else {
      // Cerrar
      Animated.parallel(
        actionAnimations.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.spring(anim.scale, {
              toValue: 0,
              tension: 100,
              friction: 10,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: 20,
              duration: 150,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    }

    setIsOpen(newState);
  };

  const handleActionPress = (action: MenuAction, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    action.onPress();
    toggleMenu();
  };

  const rotationDegrees = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      bottom: spacing.xl,
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyle, right: spacing.xl };
      case 'bottom-left':
        return { ...baseStyle, left: spacing.xl };
      case 'bottom-center':
        return { ...baseStyle, alignSelf: 'center' as const };
      default:
        return { ...baseStyle, right: spacing.xl };
    }
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      {/* Action Buttons */}
      {actions.map((action, index) => {
        const angle = (Math.PI * 1.5) / actions.length;
        const radius = buttonSize + 20;
        const x = Math.cos(angle * (index + 1) - Math.PI / 2) * radius;
        const y = Math.sin(angle * (index + 1) - Math.PI / 2) * radius;

        return (
          <Animated.View
            key={action.label}
            style={[
              styles.actionButton,
              {
                width: actionButtonSize,
                height: actionButtonSize,
                opacity: actionAnimations[index].opacity,
                transform: [
                  { scale: actionAnimations[index].scale },
                  { translateX: x },
                  { translateY: y },
                ],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleActionPress(action, index)}
            >
              {action.gradient ? (
                <LinearGradient
                  colors={action.gradient}
                  style={[
                    styles.actionButtonInner,
                    { width: actionButtonSize, height: actionButtonSize },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={actionButtonSize * 0.5}
                    color="#ffffff"
                  />
                </LinearGradient>
              ) : (
                <View
                  style={[
                    styles.actionButtonInner,
                    {
                      width: actionButtonSize,
                      height: actionButtonSize,
                      backgroundColor: action.color || '#667eea',
                    },
                  ]}
                >
                  <Ionicons
                    name={action.icon}
                    size={actionButtonSize * 0.5}
                    color="#ffffff"
                  />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        );
      })}

      {/* Main Button */}
      <Animated.View
        style={{
          transform: [{ scale }, { rotate: rotationDegrees }],
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={toggleMenu}
          onPressIn={() => {
            Animated.spring(scale, {
              toValue: 0.9,
              tension: 200,
              friction: 10,
              useNativeDriver: true,
            }).start();
          }}
          onPressOut={() => {
            Animated.spring(scale, {
              toValue: 1,
              tension: 200,
              friction: 10,
              useNativeDriver: true,
            }).start();
          }}
        >
          <LinearGradient
            colors={mainGradient}
            style={[
              styles.mainButton,
              {
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
              },
              shadows.xl,
            ]}
          >
            <Ionicons name={mainIcon} size={buttonSize * 0.45} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Backdrop */}
      {isOpen && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              opacity: rotation,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={toggleMenu}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  mainButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    position: 'absolute',
    bottom: 0,
  },
  actionButtonInner: {
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
});

export default FloatingMenu;
