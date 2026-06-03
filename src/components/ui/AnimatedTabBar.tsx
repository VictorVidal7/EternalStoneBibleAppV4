/**
 * 🎯 AnimatedTabBar - Control de Pestañas Premium
 *
 * TabBar/SegmentedControl con indicador animado fluido
 * Diseñado para Celestial Premium 2.0
 *
 * Características:
 * - Indicador animado con spring physics (60fps)
 * - Haptic feedback en cambios
 * - Soporte para íconos y badges
 * - Variantes: pills, underline, filled
 * - Temas claro/oscuro
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useMemo, useCallback, useEffect} from 'react';
import {staticColors} from '@/styles/designTokens';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  LayoutChangeEvent,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import {haptics} from '@lib/haptics';
import {
  SPRING_CONFIGS,
  DURATIONS,
  EASING_CURVES,
} from '../../styles/reanimatedAnimations';
import {usePressAnimation} from '../../hooks/useAnimations';

// ==================== TYPES ====================

export type TabVariant = 'pills' | 'underline' | 'filled';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

interface AnimatedTabBarProps {
  tabs: Tab[];
  selectedKey: string;
  onTabChange: (key: string) => void;
  variant?: TabVariant;
  isDark?: boolean;
  enableHaptics?: boolean;
  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  labelStyle?: TextStyle;
  indicatorColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  fullWidth?: boolean;
}

// ==================== ANIMATED COMPONENTS ====================

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ==================== TAB ITEM ====================

interface TabItemProps {
  tab: Tab;
  isSelected: boolean;
  onPress: () => void;
  variant: TabVariant;
  isDark: boolean;
  activeColor: string;
  inactiveColor: string;
  labelStyle?: TextStyle;
  tabStyle?: ViewStyle;
  fullWidth: boolean;
}

const TabItem: React.FC<TabItemProps> = ({
  tab,
  isSelected,
  onPress,
  variant,
  isDark,
  activeColor,
  inactiveColor,
  labelStyle,
  tabStyle,
  fullWidth,
}) => {
  // Sprint 67: shared, reduce-motion-aware press depress (see usePressAnimation).
  const {
    onPressIn,
    onPressOut,
    animatedStyle: animatedContainerStyle,
  } = usePressAnimation(0.95);
  const colorProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    colorProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: DURATIONS.normal,
      easing: EASING_CURVES.standard,
    });
  }, [isSelected, colorProgress]);

  const animatedLabelStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      colorProgress.value,
      [0, 1],
      [inactiveColor, activeColor],
    );
    return {color};
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={tab.disabled}
      style={[
        styles.tabItem,
        fullWidth && styles.tabItemFullWidth,
        variant === 'filled' && isSelected && styles.tabItemFilledActive,
        tab.disabled && styles.tabItemDisabled,
        tabStyle,
        animatedContainerStyle,
      ]}
      accessibilityRole="tab"
      accessibilityState={{selected: isSelected, disabled: tab.disabled}}
      accessibilityLabel={tab.label}>
      {/* Icon */}
      {tab.icon && <View style={styles.iconContainer}>{tab.icon}</View>}

      {/* Label */}
      <Animated.Text
        style={[
          styles.tabLabel,
          variant === 'underline' && styles.tabLabelUnderline,
          isSelected && styles.tabLabelActive,
          labelStyle,
          animatedLabelStyle,
        ]}>
        {tab.label}
      </Animated.Text>

      {/* Badge */}
      {tab.badge !== undefined && (
        <View
          style={[
            styles.badge,
            isSelected && styles.badgeActive,
            isDark && styles.badgeDark,
          ]}>
          <Text style={styles.badgeText}>
            {typeof tab.badge === 'number' && tab.badge > 99
              ? '99+'
              : tab.badge}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

// ==================== ANIMATED INDICATOR ====================

interface IndicatorProps {
  variant: TabVariant;
  tabWidths: number[];
  tabPositions: number[];
  selectedIndex: number;
  indicatorColor: string;
}

const AnimatedIndicator: React.FC<IndicatorProps> = ({
  variant,
  tabWidths,
  tabPositions,
  selectedIndex,
  indicatorColor,
}) => {
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);

  useEffect(() => {
    if (tabPositions[selectedIndex] !== undefined) {
      translateX.value = withSpring(
        tabPositions[selectedIndex],
        SPRING_CONFIGS.snappy,
      );
      width.value = withSpring(
        tabWidths[selectedIndex] || 0,
        SPRING_CONFIGS.snappy,
      );
    }
  }, [selectedIndex, tabPositions, tabWidths, translateX, width]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}],
    width: width.value,
  }));

  if (variant === 'pills') {
    return (
      <Animated.View
        style={[
          styles.indicatorPills,
          {backgroundColor: indicatorColor},
          animatedStyle,
        ]}
      />
    );
  }

  if (variant === 'underline') {
    return (
      <Animated.View
        style={[
          styles.indicatorUnderline,
          {backgroundColor: indicatorColor},
          animatedStyle,
        ]}
      />
    );
  }

  return null;
};

// ==================== MAIN COMPONENT ====================

export const AnimatedTabBar: React.FC<AnimatedTabBarProps> = ({
  tabs,
  selectedKey,
  onTabChange,
  variant = 'pills',
  isDark = false,
  enableHaptics = true,
  containerStyle,
  tabStyle,
  labelStyle,
  indicatorColor,
  activeColor,
  inactiveColor,
  fullWidth = false,
}) => {
  // Calculate selected index
  const selectedIndex = useMemo(
    () => tabs.findIndex(tab => tab.key === selectedKey),
    [tabs, selectedKey],
  );

  // Track tab measurements
  const [tabWidths, setTabWidths] = React.useState<number[]>([]);
  const [tabPositions, setTabPositions] = React.useState<number[]>([]);

  // Colors based on theme
  const colors = useMemo(
    () => ({
      indicator: indicatorColor || (isDark ? '#6366f1' : '#6366f1'),
      active: activeColor || (isDark ? staticColors.white : staticColors.white),
      inactive:
        inactiveColor ||
        (isDark ? staticColors.glassWhite50 : staticColors.overlayBlack50),
      background: isDark
        ? staticColors.glassWhite10
        : staticColors.overlayBlack05,
    }),
    [indicatorColor, activeColor, inactiveColor, isDark],
  );

  // Handle tab measurement
  const handleTabLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      const {width, x} = event.nativeEvent.layout;
      setTabWidths(prev => {
        const newWidths = [...prev];
        newWidths[index] = width;
        return newWidths;
      });
      setTabPositions(prev => {
        const newPositions = [...prev];
        newPositions[index] = x;
        return newPositions;
      });
    },
    [],
  );

  // Handle tab press
  const handleTabPress = useCallback(
    (key: string) => {
      if (enableHaptics) {
        haptics.tap();
      }
      onTabChange(key);
    },
    [enableHaptics, onTabChange],
  );

  return (
    <View
      style={[
        styles.container,
        variant === 'pills' && styles.containerPills,
        variant === 'underline' && styles.containerUnderline,
        {
          backgroundColor:
            variant === 'pills' ? colors.background : staticColors.transparent,
        },
        containerStyle,
      ]}>
      {/* Animated Indicator */}
      {(variant === 'pills' || variant === 'underline') && (
        <AnimatedIndicator
          variant={variant}
          tabWidths={tabWidths}
          tabPositions={tabPositions}
          selectedIndex={selectedIndex}
          indicatorColor={colors.indicator}
        />
      )}

      {/* Tab Items */}
      {tabs.map((tab, index) => (
        <View
          key={tab.key}
          onLayout={e => handleTabLayout(e, index)}
          style={fullWidth && styles.tabWrapper}>
          <TabItem
            tab={tab}
            isSelected={tab.key === selectedKey}
            onPress={() => handleTabPress(tab.key)}
            variant={variant}
            isDark={isDark}
            activeColor={colors.active}
            inactiveColor={colors.inactive}
            labelStyle={labelStyle}
            tabStyle={tabStyle}
            fullWidth={fullWidth}
          />
        </View>
      ))}
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  containerPills: {
    borderRadius: 16,
    padding: 4,
  },
  containerUnderline: {
    borderBottomWidth: 1,
    borderBottomColor: staticColors.overlayBlack10,
  },
  tabWrapper: {
    flex: 1,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
  },
  tabItemFullWidth: {
    flex: 1,
  },
  tabItemFilledActive: {
    backgroundColor: staticColors.indigoTint15,
  },
  tabItemDisabled: {
    opacity: 0.4,
  },
  iconContainer: {
    marginRight: 4,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLabelUnderline: {
    fontSize: 16,
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: staticColors.redTint90,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 6,
  },
  badgeActive: {
    backgroundColor: staticColors.red500,
  },
  badgeDark: {
    backgroundColor: staticColors.red400,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: staticColors.white,
  },
  // Indicators
  indicatorPills: {
    position: 'absolute',
    height: '100%',
    borderRadius: 12,
    zIndex: -1,
  },
  indicatorUnderline: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderRadius: 2,
  },
});

// ==================== EXPORTS ====================

export default AnimatedTabBar;
