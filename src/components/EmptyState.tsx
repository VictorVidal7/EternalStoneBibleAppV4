/**
 * 🎭 EMPTY STATE COMPONENT
 *
 * Estado vacío elegante con:
 * - Ilustraciones/iconos grandes
 * - Animaciones de entrada
 * - Acción primaria
 * - Múltiples variantes
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PremiumButton from './PremiumButton';
import { spacing, fontSize, borderRadius } from '../styles/designTokens';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionGradient?: string[];
  style?: ViewStyle;
  variant?: 'default' | 'gradient' | 'minimal';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'albums-outline',
  title,
  description,
  actionLabel,
  onAction,
  actionGradient = ['#667eea', '#764ba2'],
  style,
  variant = 'default',
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
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
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
    >
      {/* Icon Container */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {variant === 'gradient' ? (
          <LinearGradient
            colors={actionGradient}
            style={styles.iconGradientBg}
          >
            <Ionicons name={icon} size={64} color="#ffffff" />
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.iconBg,
              variant === 'minimal' && styles.iconBgMinimal,
            ]}
          >
            <Ionicons
              name={icon}
              size={64}
              color={variant === 'minimal' ? '#cccccc' : '#667eea'}
            />
          </View>
        )}
      </Animated.View>

      {/* Title */}
      <Animated.Text
        style={[
          styles.title,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {title}
      </Animated.Text>

      {/* Description */}
      {description && (
        <Animated.Text
          style={[
            styles.description,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          {description}
        </Animated.Text>
      )}

      {/* Action Button */}
      {actionLabel && onAction && (
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            marginTop: spacing.xl,
          }}
        >
          <PremiumButton
            title={actionLabel}
            onPress={onAction}
            gradient={actionGradient}
            variant="gradient"
            size="large"
          />
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['3xl'],
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBgMinimal: {
    backgroundColor: 'transparent',
  },
  iconGradientBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    color: '#718096',
    textAlign: 'center',
    lineHeight: fontSize.base * 1.5,
    maxWidth: 300,
  },
});

export default EmptyState;
