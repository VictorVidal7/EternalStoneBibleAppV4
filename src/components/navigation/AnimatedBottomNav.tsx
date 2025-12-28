/**
 * Animated Bottom Navigation Bar
 *
 * A custom bottom navigation bar that can be used in screens outside of tabs.
 * Supports hide/show animation based on scroll direction.
 */

import React, {useEffect, useRef} from 'react';
import {TouchableOpacity, StyleSheet, Animated, Platform} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useTheme, colorThemes} from '../../hooks/useTheme';

interface AnimatedBottomNavProps {
  visible?: boolean;
  activeTab?: string;
}

export const AnimatedBottomNav: React.FC<AnimatedBottomNavProps> = ({
  visible = true,
  activeTab,
}) => {
  const router = useRouter();
  const {colors, isDark, colorTheme} = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;

  // Animate tab bar visibility
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 100,
      tension: 100,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  const themePreview = colorThemes[colorTheme]?.preview;
  const activeColor = themePreview?.[1] ?? colors.primary;

  const tabs = [
    {name: 'index', icon: 'home', route: '/(tabs)'},
    {name: 'bible', icon: 'book', route: '/(tabs)/bible'},
    {name: 'search', icon: 'search', route: '/(tabs)/search'},
    {name: 'achievements', icon: 'trophy', route: '/(tabs)/achievements'},
    {name: 'bookmarks', icon: 'bookmark', route: '/(tabs)/bookmarks'},
    {name: 'notes', icon: 'create', route: '/(tabs)/notes'},
    {name: 'settings', icon: 'settings', route: '/(tabs)/settings'},
  ];

  const handleTabPress = (route: string) => {
    router.replace(route as any);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? 'rgba(26, 29, 46, 0.95)'
            : 'rgba(255, 255, 255, 0.98)',
          borderTopColor: isDark
            ? 'rgba(71, 85, 105, 0.15)'
            : 'rgba(226, 232, 240, 0.60)',
          transform: [{translateY}],
        },
      ]}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tabButton}
            onPress={() => handleTabPress(tab.route)}
            activeOpacity={0.7}>
            <Ionicons
              name={tab.icon as any}
              size={24}
              color={isActive ? activeColor : colors.textTertiary}
            />
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

// Hook to manage scroll direction for hiding/showing the nav bar
export const useScrollDirection = () => {
  const lastScrollY = useRef(0);
  const [isVisible, setIsVisible] = React.useState(true);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollThreshold = 10;

    if (currentScrollY < 10) {
      // At top, always show
      setIsVisible(true);
    } else if (currentScrollY - lastScrollY.current > scrollThreshold) {
      // Scrolling down
      setIsVisible(false);
    } else if (lastScrollY.current - currentScrollY > scrollThreshold) {
      // Scrolling up
      setIsVisible(true);
    }

    lastScrollY.current = currentScrollY;
  };

  return {isVisible, handleScroll};
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 10,
    height: Platform.OS === 'ios' ? 88 : 68,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});

export default AnimatedBottomNav;
