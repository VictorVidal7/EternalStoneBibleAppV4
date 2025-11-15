/**
 * 🎯 FLOATING ACTION BUTTON (FAB)
 *
 * Botón de acción flotante con animaciones, menú radial opcional
 * y diseño Material Design moderno.
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
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, borderRadius, shadows, iconSize } from '../styles/designTokens';
import { useTheme } from '../hooks/useTheme';

interface FABAction {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  actions?: FABAction[];
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'small' | 'medium' | 'large';
  useGradient?: boolean;
  color?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon = 'add',
  onPress,
  actions,
  position = 'bottom-right',
  size = 'large',
  useGradient = true,
  color,
}) => {
  const { colors, isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const sizeMap = {
    small: 48,
    medium: 56,
    large: 64,
  };

  const iconSizeMap = {
    small: iconSize.md,
    medium: iconSize.lg,
    large: iconSize.xl,
  };

  const fabSize = sizeMap[size];
  const fabIconSize = iconSizeMap[size];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (actions && actions.length > 0) {
      toggleMenu();
    } else {
      onPress?.();
      animatePress();
    }
  };

  const toggleMenu = () => {
    const toValue = isExpanded ? 0 : 1;

    Animated.parallel([
      Animated.spring(rotation, {
        toValue,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
    ]).start();

    setIsExpanded(!isExpanded);
  };

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 3,
      }),
    ]).start();
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const positionStyle = (() => {
    switch (position) {
      case 'bottom-left':
        return { bottom: spacing.xl, left: spacing.xl };
      case 'bottom-center':
        return { bottom: spacing.xl, alignSelf: 'center' };
      case 'bottom-right':
      default:
        return { bottom: spacing.xl, right: spacing.xl };
    }
  })();

  const fabColor = color || colors.primary;
  const gradientColors = useGradient
    ? [fabColor, colors.primaryDark]
    : [fabColor, fabColor];

  return (
    <View style={[styles.container, positionStyle]}>
      {/* Action Items */}
      {actions && actions.length > 0 && isExpanded && (
        <View style={styles.actionsContainer}>
          {actions.map((action, index) => (
            <ActionItem
              key={index}
              {...action}
              index={index}
              total={actions.length}
              isExpanded={isExpanded}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                action.onPress();
                toggleMenu();
              }}
            />
          ))}
        </View>
      )}

      {/* Main FAB */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Floating action button"
      >
        <Animated.View
          style={[
            {
              transform: [{ scale }, { rotate: rotateInterpolate }],
            },
          ]}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.fab,
              {
                width: fabSize,
                height: fabSize,
                borderRadius: fabSize / 2,
                ...shadows['2xl'],
              },
            ]}
          >
            <Ionicons name={icon} size={fabIconSize} color="#ffffff" />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Backdrop overlay when expanded */}
      {isExpanded && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}
    </View>
  );
};

// ==================== ACTION ITEM ====================

interface ActionItemProps extends FABAction {
  index: number;
  total: number;
  isExpanded: boolean;
}

const ActionItem: React.FC<ActionItemProps> = ({
  icon,
  label,
  onPress,
  color,
  index,
  total,
  isExpanded,
}) => {
  const { colors, isDark } = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isExpanded) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: -(index + 1) * 70,
          useNativeDriver: true,
          tension: 40,
          friction: 7,
          delay: index * 50,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isExpanded]);

  const actionColor = color || colors.secondary;

  return (
    <Animated.View
      style={[
        styles.actionItem,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.actionButton,
          {
            backgroundColor: actionColor,
            ...shadows.lg,
          },
        ]}
        activeOpacity={0.9}
      >
        <Ionicons name={icon} size={24} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 999,
  },
  fab: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  actionItem: {
    position: 'absolute',
    alignItems: 'center',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
});

export default FloatingActionButton;
