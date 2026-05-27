/* eslint-disable react-native/no-unused-styles -- styles consumed via a
   themed-styles factory; the linter cannot trace factory returns. */
/**
 * 🌟 GlassmorphicHeader - Header Premium con Glassmorphism
 *
 * Header reutilizable con efecto glassmorphism, gradientes y animaciones
 * Diseñado para Celestial Premium 2.0
 *
 * Características:
 * - Blur dinámico con expo-blur
 * - Gradientes personalizables
 * - Animaciones de entrada fluidas (60fps)
 * - Safe area handling integrado
 * - Botón de retroceso opcional
 * - Acciones personalizables (derecha)
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SPRING_CONFIGS} from '../../styles/reanimatedAnimations';

// ==================== GRADIENT PRESETS ====================

export const HEADER_GRADIENTS = {
  celestial: ['#6366f1', '#8b5cf6', '#7c3aed'], // indigo → purple
  aurora: ['#10b981', '#06b6d4', '#3b82f6'], // emerald → cyan → blue
  sunset: ['#f97316', '#f43f5e', '#ec4899'], // orange → rose → pink
  ocean: ['#0ea5e9', '#6366f1', '#8b5cf6'], // sky → indigo → purple
  forest: ['#22c55e', '#10b981', '#059669'], // green → emerald → emerald
  royal: ['#8b5cf6', '#6366f1', '#4f46e5'], // purple → indigo → indigo
  golden: ['#f59e0b', '#d97706', '#b45309'], // amber shades
  midnight: ['#1e1b4b', '#312e81', '#4338ca'], // dark indigo
} as const;

export type GradientPreset = keyof typeof HEADER_GRADIENTS;

// ==================== TYPES ====================

interface HeaderAction {
  icon: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}

interface GlassmorphicHeaderProps {
  title: string;
  subtitle?: string;
  gradient?: GradientPreset | string[];
  showBackButton?: boolean;
  onBackPress?: () => void;
  backIcon?: React.ReactNode;
  rightActions?: HeaderAction[];
  blurIntensity?: number;
  isDark?: boolean;
  animated?: boolean;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  containerStyle?: ViewStyle;
  children?: React.ReactNode;
  compact?: boolean;
}

// ==================== ANIMATED BACK BUTTON ====================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface BackButtonProps {
  onPress: () => void;
  icon?: React.ReactNode;
}

const BackButton: React.FC<BackButtonProps> = ({onPress, icon}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, SPRING_CONFIGS.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.backButton, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
      {icon || <Text style={styles.backIcon}>←</Text>}
    </AnimatedPressable>
  );
};

// ==================== ACTION BUTTON ====================

interface ActionButtonProps {
  action: HeaderAction;
}

const ActionButton: React.FC<ActionButtonProps> = ({action}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, SPRING_CONFIGS.snappy);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_CONFIGS.snappy);
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={action.onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.actionButton, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
      {action.icon}
    </AnimatedPressable>
  );
};

// ==================== MAIN COMPONENT ====================

export const GlassmorphicHeader: React.FC<GlassmorphicHeaderProps> = ({
  title,
  subtitle,
  gradient = 'celestial',
  showBackButton = false,
  onBackPress,
  backIcon,
  rightActions = [],
  blurIntensity = 25,
  isDark = true,
  animated = true,
  titleStyle,
  subtitleStyle,
  containerStyle,
  children,
  compact = false,
}) => {
  const insets = useSafeAreaInsets();

  // Get gradient colors
  const gradientColors = useMemo(() => {
    if (Array.isArray(gradient)) {
      return gradient;
    }
    return HEADER_GRADIENTS[gradient] || HEADER_GRADIENTS.celestial;
  }, [gradient]);

  // Dynamic styles based on props
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingTop: insets.top + (compact ? 8 : 16),
          paddingBottom: compact ? 16 : 24,
          paddingHorizontal: 20,
        },
        title: {
          fontSize: compact ? 28 : 36,
          fontWeight: '800',
          color: '#FFFFFF',
          marginBottom: subtitle ? 6 : 0,
          letterSpacing: -0.5,
          ...titleStyle,
        },
        subtitle: {
          fontSize: compact ? 15 : 17,
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.95)',
          letterSpacing: 0.2,
          ...subtitleStyle,
        },
      }),
    [insets.top, compact, subtitle, titleStyle, subtitleStyle],
  );

  // Title content with optional animation
  const TitleContent = animated ? (
    <>
      <Animated.Text
        entering={FadeIn.delay(100).duration(600)}
        style={dynamicStyles.title}
        accessibilityRole="header">
        {title}
      </Animated.Text>
      {subtitle && (
        <Animated.Text
          entering={FadeIn.delay(200).duration(600)}
          style={dynamicStyles.subtitle}
          accessibilityRole="text">
          {subtitle}
        </Animated.Text>
      )}
    </>
  ) : (
    <>
      <Text style={dynamicStyles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle && (
        <Text style={dynamicStyles.subtitle} accessibilityRole="text">
          {subtitle}
        </Text>
      )}
    </>
  );

  return (
    <View style={containerStyle}>
      <StatusBar
        backgroundColor="transparent"
        barStyle="light-content"
        translucent
      />
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}>
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={dynamicStyles.container}>
          {/* Top Row: Back + Actions */}
          {(showBackButton || rightActions.length > 0) && (
            <View style={styles.topRow}>
              {showBackButton && onBackPress ? (
                <BackButton onPress={onBackPress} icon={backIcon} />
              ) : (
                <View style={styles.spacer} />
              )}

              <View style={styles.actionsContainer}>
                {rightActions.map((action, index) => (
                  <ActionButton key={`action-${index}`} action={action} />
                ))}
              </View>
            </View>
          )}

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {TitleContent}
            {children}
          </View>
        </BlurView>
      </LinearGradient>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  spacer: {
    width: 40,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    position: 'relative',
    zIndex: 1,
  },
});

// ==================== EXPORTS ====================

export default GlassmorphicHeader;
