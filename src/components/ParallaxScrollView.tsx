/**
 * 🌊 PARALLAX SCROLL VIEW
 *
 * ScrollView con efectos de parallax impresionantes:
 * - Header que se escala y desvanece
 * - Contenido con efecto de profundidad
 * - Animaciones suaves basadas en scroll
 * - Sticky header opcional
 */

import React, { useRef, ReactNode } from 'react';
import {
  ScrollView,
  Animated,
  View,
  StyleSheet,
  ViewStyle,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing } from '../styles/designTokens';

interface ParallaxScrollViewProps {
  headerHeight?: number;
  headerBackground?: ReactNode;
  headerGradient?: string[];
  children: ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  parallaxFactor?: number;
  fadeHeader?: boolean;
  stickyHeaderIndices?: number[];
}

export const ParallaxScrollView: React.FC<ParallaxScrollViewProps> = ({
  headerHeight = 300,
  headerBackground,
  headerGradient = ['#667eea', '#764ba2'],
  children,
  style,
  contentContainerStyle,
  parallaxFactor = 0.5,
  fadeHeader = true,
  stickyHeaderIndices,
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  // Transformación del header (parallax)
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, headerHeight],
    outputRange: [0, -headerHeight * parallaxFactor],
    extrapolate: 'clamp',
  });

  // Escala del header
  const headerScale = scrollY.interpolate({
    inputRange: [-headerHeight, 0, headerHeight],
    outputRange: [2, 1, 1],
    extrapolate: 'clamp',
  });

  // Opacidad del header
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight * 0.5, headerHeight],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  // Overlay gradient opacity
  const overlayOpacity = scrollY.interpolate({
    inputRange: [0, headerHeight * 0.3, headerHeight],
    outputRange: [0, 0.3, 0.7],
    extrapolate: 'clamp',
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true }
  );

  return (
    <View style={[styles.container, style]}>
      {/* Parallax Header */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            transform: [
              { translateY: headerTranslate },
              { scale: headerScale },
            ],
            opacity: fadeHeader ? headerOpacity : 1,
          },
        ]}
      >
        {headerBackground ? (
          headerBackground
        ) : (
          <LinearGradient
            colors={headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Dark overlay on scroll */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              opacity: overlayOpacity,
            },
          ]}
        />
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          { paddingTop: headerHeight },
          contentContainerStyle,
        ]}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeaderIndices}
      >
        {children}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
});

export default ParallaxScrollView;
