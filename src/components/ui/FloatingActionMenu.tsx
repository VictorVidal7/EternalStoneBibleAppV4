/**
 * 🎯 FloatingActionMenu - Menú Radial Flotante
 *
 * FAB expandible con acciones en disposición radial o vertical
 * Diseñado para Celestial Premium 2.0
 *
 * Características:
 * - Animaciones fluidas de expansión (60fps)
 * - Disposición radial o vertical
 * - Backdrop con blur
 * - Labels con aparición secuencial
 * - Haptic feedback
 * - Rotación del ícono principal
 * - Colores personalizables
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, Pressable, ViewStyle} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {staticColors} from '@/styles/designTokens';

import {BlurView} from 'expo-blur';
import {haptics} from '@lib/haptics';
import {SPRING_CONFIGS, DURATIONS} from '../../styles/reanimatedAnimations';

// ==================== TYPES ====================

export type MenuLayout = 'radial' | 'vertical' | 'horizontal';
export type MenuPosition =
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'top-right'
  | 'top-left';

export interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
}

interface FloatingActionMenuProps {
  actions: FABAction[];
  mainIcon?: React.ReactNode;
  mainIconOpen?: React.ReactNode;
  mainColor?: string;
  layout?: MenuLayout;
  position?: MenuPosition;
  showLabels?: boolean;
  enableBackdrop?: boolean;
  backdropBlur?: boolean;
  isDark?: boolean;
  enableHaptics?: boolean;
  spacing?: number;
  actionSize?: number;
  mainSize?: number;
  onOpen?: () => void;
  onClose?: () => void;
  containerStyle?: ViewStyle;
}

// ==================== ANIMATED COMPONENTS ====================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ==================== ACTION BUTTON ====================

interface ActionButtonProps {
  action: FABAction;
  index: number;
  isOpen: boolean;
  layout: MenuLayout;
  totalActions: number;
  spacing: number;
  size: number;
  showLabel: boolean;
  isDark: boolean;
  position: MenuPosition;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  index,
  isOpen,
  layout,
  totalActions,
  spacing,
  size,
  showLabel,
  isDark,
  position,
}) => {
  const openProgress = useSharedValue(0);
  const scale = useSharedValue(1);
  const labelOpacity = useSharedValue(0);

  React.useEffect(() => {
    const delay = index * 40;

    if (isOpen) {
      openProgress.value = withDelay(
        delay,
        withSpring(1, SPRING_CONFIGS.snappy),
      );
      labelOpacity.value = withDelay(
        delay + 100,
        withTiming(1, {duration: DURATIONS.fast}),
      );
    } else {
      openProgress.value = withSpring(0, SPRING_CONFIGS.stiff);
      labelOpacity.value = withTiming(0, {duration: DURATIONS.instant});
    }
  }, [isOpen, index, openProgress, labelOpacity]);

  // Calculate position based on layout
  const animatedStyle = useAnimatedStyle(() => {
    let translateX = 0;
    let translateY = 0;

    if (layout === 'vertical') {
      translateY = -(spacing + size) * (index + 1);
    } else if (layout === 'horizontal') {
      const direction = position.includes('right') ? -1 : 1;
      translateX = direction * (spacing + size) * (index + 1);
    } else {
      // Radial layout
      const startAngle = position.includes('right') ? 180 : 0;
      const angleSpread = 90;
      const angle =
        startAngle + (angleSpread / (totalActions + 1)) * (index + 1);
      const radians = (angle * Math.PI) / 180;
      const radius = (spacing + size) * 1.5;

      translateX = interpolate(
        openProgress.value,
        [0, 1],
        [0, Math.cos(radians) * radius],
        Extrapolation.CLAMP,
      );
      translateY = interpolate(
        openProgress.value,
        [0, 1],
        [0, Math.sin(radians) * radius],
        Extrapolation.CLAMP,
      );
    }

    if (layout !== 'radial') {
      translateX = interpolate(
        openProgress.value,
        [0, 1],
        [0, translateX],
        Extrapolation.CLAMP,
      );
      translateY = interpolate(
        openProgress.value,
        [0, 1],
        [0, translateY],
        Extrapolation.CLAMP,
      );
    }

    const actionScale = interpolate(
      openProgress.value,
      [0, 0.5, 1],
      [0, 0.8, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        {translateX},
        {translateY},
        {scale: actionScale * scale.value},
      ],
      opacity: openProgress.value,
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [
      {
        translateX: interpolate(
          labelOpacity.value,
          [0, 1],
          [10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, SPRING_CONFIGS.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, [scale]);

  const bgColor = action.color || '#6366f1';
  const isLabelLeft = position.includes('right');

  return (
    <Animated.View style={[styles.actionContainer, animatedStyle]}>
      {/* Label */}
      {showLabel && (
        <Animated.View
          style={[
            styles.labelContainer,
            isLabelLeft ? styles.labelLeft : styles.labelRight,
            isDark && styles.labelContainerDark,
            animatedLabelStyle,
          ]}>
          <Text style={[styles.labelText, isDark && styles.labelTextDark]}>
            {action.label}
          </Text>
        </Animated.View>
      )}

      {/* Button */}
      <AnimatedPressable
        onPress={action.onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={action.disabled}
        style={[
          styles.actionButton,
          {width: size, height: size, backgroundColor: bgColor},
          action.disabled && styles.actionButtonDisabled,
        ]}
        accessibilityLabel={action.label}
        accessibilityRole="button">
        {action.icon}
      </AnimatedPressable>
    </Animated.View>
  );
};

// ==================== MAIN COMPONENT ====================

export const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  actions,
  mainIcon,
  mainIconOpen,
  mainColor = '#6366f1',
  layout = 'vertical',
  position = 'bottom-right',
  showLabels = true,
  enableBackdrop = true,
  backdropBlur = true,
  isDark = false,
  enableHaptics = true,
  spacing = 16,
  actionSize = 52,
  mainSize = 60,
  onOpen,
  onClose,
  containerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const openProgress = useSharedValue(0);
  const mainRotation = useSharedValue(0);
  const mainScale = useSharedValue(1);

  // Toggle menu
  const toggleMenu = useCallback(() => {
    if (enableHaptics) {
      haptics.press();
    }

    const newState = !isOpen;
    setIsOpen(newState);

    if (newState) {
      openProgress.value = withSpring(1, SPRING_CONFIGS.snappy);
      mainRotation.value = withSpring(45, SPRING_CONFIGS.snappy);
      onOpen?.();
    } else {
      openProgress.value = withSpring(0, SPRING_CONFIGS.snappy);
      mainRotation.value = withSpring(0, SPRING_CONFIGS.snappy);
      onClose?.();
    }
  }, [isOpen, enableHaptics, openProgress, mainRotation, onOpen, onClose]);

  // Close menu
  const closeMenu = useCallback(() => {
    if (isOpen) {
      toggleMenu();
    }
  }, [isOpen, toggleMenu]);

  // Main button animation
  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${mainRotation.value}deg`}, {scale: mainScale.value}],
  }));

  // Backdrop animation
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: openProgress.value,
    pointerEvents: isOpen ? 'auto' : 'none',
  }));

  const handleMainPressIn = useCallback(() => {
    mainScale.value = withSpring(0.92, SPRING_CONFIGS.snappy);
  }, [mainScale]);

  const handleMainPressOut = useCallback(() => {
    mainScale.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, [mainScale]);

  // Position styles
  const positionStyle = useMemo<ViewStyle>(() => {
    const base: ViewStyle = {position: 'absolute'};

    switch (position) {
      case 'bottom-right':
        return {...base, bottom: 24, right: 24};
      case 'bottom-left':
        return {...base, bottom: 24, left: 24};
      case 'bottom-center':
        return {...base, bottom: 24, alignSelf: 'center'};
      case 'top-right':
        return {...base, top: 24, right: 24};
      case 'top-left':
        return {...base, top: 24, left: 24};
      default:
        return {...base, bottom: 24, right: 24};
    }
  }, [position]);

  // Default icons
  const defaultMainIcon = <Text style={styles.mainIconText}>+</Text>;

  return (
    <>
      {/* Backdrop */}
      {enableBackdrop && (
        <AnimatedPressable
          onPress={closeMenu}
          style={[styles.backdrop, backdropStyle]}>
          {backdropBlur ? (
            <BlurView
              intensity={10}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? staticColors.overlayBlack50
                    : staticColors.overlayBlack30,
                },
              ]}
            />
          )}
        </AnimatedPressable>
      )}

      {/* Menu Container */}
      <View style={[styles.container, positionStyle, containerStyle]}>
        {/* Action Buttons */}
        {actions.map((action, index) => (
          <ActionButton
            key={action.id}
            action={{
              ...action,
              onPress: () => {
                if (enableHaptics) {
                  haptics.tap();
                }
                action.onPress();
                closeMenu();
              },
            }}
            index={index}
            isOpen={isOpen}
            layout={layout}
            totalActions={actions.length}
            spacing={spacing}
            size={actionSize}
            showLabel={showLabels}
            isDark={isDark}
            position={position}
          />
        ))}

        {/* Main FAB */}
        <AnimatedPressable
          onPress={toggleMenu}
          onPressIn={handleMainPressIn}
          onPressOut={handleMainPressOut}
          style={[
            styles.mainButton,
            {
              width: mainSize,
              height: mainSize,
              backgroundColor: mainColor,
              borderRadius: mainSize / 2,
            },
            mainButtonStyle,
          ]}
          accessibilityLabel={isOpen ? 'Cerrar menú' : 'Abrir menú'}
          accessibilityRole="button">
          {isOpen
            ? mainIconOpen || mainIcon || defaultMainIcon
            : mainIcon || defaultMainIcon}
        </AnimatedPressable>
      </View>
    </>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  mainButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainIconText: {
    fontSize: 28,
    fontWeight: '300',
    color: staticColors.white,
    marginTop: -2,
  },
  actionContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  labelContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: staticColors.white,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'absolute',
  },
  labelContainerDark: {
    backgroundColor: staticColors.gray700,
  },
  labelLeft: {
    right: 64,
  },
  labelRight: {
    left: 64,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: staticColors.grayNeutral,
  },
  labelTextDark: {
    color: staticColors.white,
  },
});

// ==================== EXPORTS ====================

export default FloatingActionMenu;
