/**
 * 🎨 ILLUSTRATED EMPTY STATE
 *
 * Empty state components with premium illustrations:
 * - Attractive and professional designs
 * - Smooth animations
 * - Clear and actionable messages
 * - Expressive iconography
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { spacing, borderRadius, fontSize, shadows } from '../styles/designTokens';
import { typography } from '../styles/typography';
import { useLanguage } from '../hooks/useLanguage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IllustratedEmptyStateProps {
  type:
    | 'no-bookmarks'
    | 'no-notes'
    | 'no-highlights'
    | 'no-search-results'
    | 'no-achievements'
    | 'no-reading-plan';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  colors: any;
  isDark: boolean;
}

export const IllustratedEmptyState: React.FC<IllustratedEmptyStateProps> = ({
  type,
  title,
  message,
  actionLabel,
  onAction,
  colors,
  isDark,
}) => {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -10,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAction?.();
  };

  const getConfig = () => {
    const configs = {
      'no-bookmarks': {
        icon: 'bookmark-outline' as const,
        gradient: ['#667eea', '#764ba2'],
        defaultTitle: t.bookmarks.empty,
        defaultMessage: t.bookmarks.emptyHint,
        defaultAction: t.home.menu.exploreBible.replace(/\n/g, ' '),
      },
      'no-notes': {
        icon: 'create-outline' as const,
        gradient: ['#10b981', '#059669'],
        defaultTitle: t.notes.empty,
        defaultMessage: t.notes.emptyHint,
        defaultAction: t.home.startReading,
      },
      'no-highlights': {
        icon: 'color-palette-outline' as const,
        gradient: ['#f59e0b', '#d97706'],
        defaultTitle: 'No highlights yet',
        defaultMessage: 'Highlight important verses while reading',
        defaultAction: t.tabs.bible,
      },
      'no-search-results': {
        icon: 'search-outline' as const,
        gradient: ['#3b82f6', '#2563eb'],
        defaultTitle: t.search.noResults,
        defaultMessage: t.search.tryDifferent,
        defaultAction: 'Clear search',
      },
      'no-achievements': {
        icon: 'trophy-outline' as const,
        gradient: ['#ec4899', '#db2777'],
        defaultTitle: 'No achievements unlocked',
        defaultMessage: 'Read the Bible daily to unlock achievements',
        defaultAction: 'View challenges',
      },
      'no-reading-plan': {
        icon: 'calendar-outline' as const,
        gradient: ['#8b5cf6', '#7c3aed'],
        defaultTitle: 'No active reading plan',
        defaultMessage: 'Choose a plan to guide your daily reading',
        defaultAction: 'Explore plans',
      },
    };

    return configs[type];
  };

  const config = getConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Illustration */}
      <Animated.View
        style={{
          transform: [{ translateY: bounceAnim }],
        }}
      >
        <View style={styles.illustrationContainer}>
          {/* Decorative background circles */}
          <View style={styles.decorativeCircles}>
            <View
              style={[
                styles.circle,
                styles.circle1,
                {
                  backgroundColor: isDark
                    ? 'rgba(102, 126, 234, 0.1)'
                    : 'rgba(102, 126, 234, 0.08)',
                },
              ]}
            />
            <View
              style={[
                styles.circle,
                styles.circle2,
                {
                  backgroundColor: isDark
                    ? 'rgba(118, 75, 162, 0.1)'
                    : 'rgba(118, 75, 162, 0.08)',
                },
              ]}
            />
            <View
              style={[
                styles.circle,
                styles.circle3,
                {
                  backgroundColor: isDark
                    ? 'rgba(240, 147, 251, 0.1)'
                    : 'rgba(240, 147, 251, 0.08)',
                },
              ]}
            />
          </View>

          {/* Main icon with gradient */}
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Ionicons name={config.icon} size={64} color="#ffffff" />
          </LinearGradient>

          {/* Floating decorative icons */}
          <View style={styles.floatingIcons}>
            <Ionicons
              name="sparkles"
              size={20}
              color={config.gradient[0]}
              style={[styles.floatingIcon, styles.floatingIcon1]}
            />
            <Ionicons
              name="star"
              size={16}
              color={config.gradient[1]}
              style={[styles.floatingIcon, styles.floatingIcon2]}
            />
            <Ionicons
              name="heart"
              size={18}
              color={config.gradient[0]}
              style={[styles.floatingIcon, styles.floatingIcon3]}
            />
          </View>
        </View>
      </Animated.View>

      {/* Text */}
      <View style={styles.textContainer}>
        <Text style={[typography.h4, { color: colors.text, textAlign: 'center' }]}>
          {title || config.defaultTitle}
        </Text>
        <Text
          style={[
            typography.body,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: spacing.md,
            },
          ]}
        >
          {message || config.defaultMessage}
        </Text>
      </View>

      {/* Action button */}
      {onAction && (
        <TouchableOpacity
          onPress={handleAction}
          activeOpacity={0.8}
          style={styles.actionButton}
        >
          <LinearGradient
            colors={config.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.actionButtonGradient, shadows.md]}
          >
            <Text style={styles.actionButtonText}>
              {actionLabel || config.defaultAction}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Bottom decorative dots */}
      <View style={styles.bottomDots}>
        <View style={[styles.dot, { backgroundColor: config.gradient[0] + '40' }]} />
        <View style={[styles.dot, { backgroundColor: config.gradient[1] + '40' }]} />
        <View style={[styles.dot, { backgroundColor: config.gradient[0] + '40' }]} />
      </View>
    </Animated.View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Illustration
  illustrationContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  decorativeCircles: {
    ...StyleSheet.absoluteFillObject,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
  },
  circle1: {
    width: 200,
    height: 200,
    top: 0,
    left: 0,
  },
  circle2: {
    width: 150,
    height: 150,
    top: 25,
    left: 25,
  },
  circle3: {
    width: 100,
    height: 100,
    top: 50,
    left: 50,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    ...shadows.xl,
  },
  floatingIcons: {
    ...StyleSheet.absoluteFillObject,
  },
  floatingIcon: {
    position: 'absolute',
  },
  floatingIcon1: {
    top: 20,
    right: 30,
  },
  floatingIcon2: {
    bottom: 30,
    left: 20,
  },
  floatingIcon3: {
    top: 60,
    left: 10,
  },

  // Text
  textContainer: {
    maxWidth: 320,
    marginBottom: spacing.xl,
  },

  // Action button
  actionButton: {
    marginTop: spacing.md,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  actionButtonText: {
    ...typography.button,
    color: '#ffffff',
  },

  // Bottom decoration
  bottomDots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
