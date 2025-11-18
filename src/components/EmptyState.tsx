/**
 * 🎭 EMPTY STATE COMPONENT
 *
 * Estado vacío elegante con:
 * - Ilustraciones/iconos grandes
 * - Animaciones de entrada
 * - Acción primaria
 * - Múltiples variantes
 * - Soporte completo para tema dinámico
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  Text as RNText,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import PremiumButton from './PremiumButton';
import {spacing, fontSize} from '../styles/designTokens';
import {useTheme} from '../hooks/useTheme';
import {ANIMATION} from '../constants/app';

// Alias to use in component
const Text = RNText;

interface EmptyStateProps {
  /** Nombre del icono de Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Título principal */
  title: string;
  /** Descripción opcional */
  description?: string;
  /** Etiqueta del botón de acción */
  actionLabel?: string;
  /** Función ejecutada al presionar el botón */
  onAction?: () => void;
  /** Colores del gradiente para el botón */
  actionGradient?: string[];
  /** Estilos personalizados */
  style?: ViewStyle;
  /** Variante visual del componente */
  variant?: 'default' | 'gradient' | 'minimal';
  /** Label de accesibilidad */
  accessibilityLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({
    icon = 'albums-outline',
    title,
    description,
    actionLabel,
    onAction,
    actionGradient = ['#667eea', '#764ba2'],
    style,
    variant = 'default',
    accessibilityLabel,
  }) => {
    const {colors} = useTheme();
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
          tension: ANIMATION.SPRING_TENSION,
          friction: ANIMATION.SPRING_FRICTION,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: ANIMATION.SPRING_TENSION,
          friction: ANIMATION.SPRING_FRICTION + 1,
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
            transform: [{scale: scaleAnim}],
          },
          style,
        ]}
        accessible
        accessibilityRole="text"
        accessibilityLabel={
          accessibilityLabel || `${title}. ${description || ''}`
        }>
        {/* Icon Container */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{translateY: slideAnim}],
            },
          ]}>
          {variant === 'gradient' ? (
            <LinearGradient
              colors={actionGradient}
              style={styles.iconGradientBg}>
              <Ionicons name={icon} size={64} color="#ffffff" />
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.iconBg,
                variant === 'minimal' && styles.iconBgMinimal,
                variant !== 'minimal' && {
                  backgroundColor: colors.primary + '20',
                },
              ]}>
              <Ionicons
                name={icon}
                size={64}
                color={
                  variant === 'minimal' ? colors.textSecondary : colors.primary
                }
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
              transform: [{translateY: slideAnim}],
              color: colors.text,
            },
          ]}
          accessibilityRole="header">
          {title}
        </Animated.Text>

        {/* Description */}
        {description && (
          <Animated.Text
            style={[
              styles.description,
              {
                opacity: fadeAnim,
                color: colors.textSecondary,
              },
            ]}>
            {description}
          </Animated.Text>
        )}

        {/* Action Button */}
        {actionLabel && onAction && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}],
              marginTop: spacing.xl,
            }}>
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
  },
);

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
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: fontSize.base,
    textAlign: 'center',
    lineHeight: fontSize.base * 1.5,
    maxWidth: 300,
  },
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
