/**
 * 📖 READING PLAN CARD - Tarjeta de Plan de Lectura
 *
 * Componente hermoso para mostrar planes de lectura con:
 * - Círculo de progreso animado con SVG
 * - Gradiente en el stroke del círculo
 * - Información de días completados
 * - Botón de continuar con estados interactivos
 * - Border radius: 24px
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { createCelestialTheme, celestialBorderRadius } from '../../styles/celestialTheme';
import ProgressCircle from './ProgressCircle';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface ReadingPlanCardProps {
  /**
   * Nombre del plan
   */
  name: string;

  /**
   * Descripción breve
   */
  description?: string;

  /**
   * Subtítulo adicional (ej: "Libro de Proverbios")
   */
  subtitle?: string;

  /**
   * Ícono de Ionicons
   * @default 'book-outline'
   */
  icon?: IoniconsName;

  /**
   * Color del plan (para ícono y progreso)
   */
  color: string;

  /**
   * Duración en días
   */
  duration: number;

  /**
   * Días completados
   */
  daysCompleted: number;

  /**
   * Callback al presionar
   */
  onPress: () => void;

  /**
   * Texto del botón de continuar
   * @default "Continuar"
   */
  continueText?: string;

  /**
   * Modo oscuro
   * @default false
   */
  isDark?: boolean;

  /**
   * Ancho de la card
   * @default 260
   */
  width?: number;
}

const ReadingPlanCard: React.FC<ReadingPlanCardProps> = ({
  name,
  description,
  subtitle,
  icon = 'book-outline',
  color,
  duration,
  daysCompleted,
  onPress,
  continueText = 'Continuar',
  isDark = false,
  width = 260,
}) => {
  const theme = createCelestialTheme(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Calcular progreso
  const progress = Math.round((daysCompleted / duration) * 100);

  // Interacciones
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <BlurView
          intensity={isDark ? 20 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.card,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.03)'
                : 'rgba(0,0,0,0.02)',
              borderColor: theme.colors.border,
              borderRadius: celestialBorderRadius.cardMedium, // 24px
            },
            theme.shadows.md,
          ]}
        >
          {/* Header con ícono y duración */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: `${color}15`, // color con 15% opacidad
                },
              ]}
            >
              <Ionicons name={icon} size={24} color={color} />
            </View>

            <View
              style={[
                styles.durationBadge,
                {
                  backgroundColor: `${color}15`,
                },
              ]}
            >
              <Text style={[styles.durationText, { color }]}>
                {duration} días
              </Text>
            </View>
          </View>

          {/* Contenido con título y descripción */}
          <View style={styles.content}>
            <Text
              style={[styles.name, { color: theme.colors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {name}
            </Text>

            {subtitle && (
              <Text
                style={[styles.subtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            )}

            {description && (
              <Text
                style={[styles.description, { color: theme.colors.textSecondary }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {description}
              </Text>
            )}
          </View>

          {/* Progress Circle */}
          <View style={styles.progressContainer}>
            <ProgressCircle
              progress={progress}
              size={60}
              strokeWidth={5}
              gradientColors={[color, color]}
              backgroundColor={`${color}20`}
              animated
            />

            {/* Texto de progreso sobre el círculo */}
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressText, { color: theme.colors.text }]}>
                {daysCompleted}/{duration}
              </Text>
            </View>
          </View>

          {/* Footer con botón de continuar */}
          <View style={styles.footer}>
            <Text style={[styles.continueText, { color }]}>
              {continueText}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={color} />
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
  },
  card: {
    borderWidth: 1,
    padding: 20, // Aumentado de 16 a 20 para más espacio
    minHeight: 240, // Aumentado de 220 a 240 para acomodar texto
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999, // full
  },
  durationText: {
    fontSize: 10, // 2xs
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginBottom: 10,
  },
  name: {
    fontSize: 15, // Reducido de 16 a 15 para mejor ajuste
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 20, // Ajustado para 15px
  },
  subtitle: {
    fontSize: 12, // xs
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 16,
    opacity: 0.8,
  },
  description: {
    fontSize: 11, // Reducido de 12 a 11 para mejor ajuste
    lineHeight: 15, // 11 * 1.36
    opacity: 0.7,
  },
  progressContainer: {
    alignItems: 'center',
    marginVertical: 12,
    position: 'relative',
  },
  progressTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  continueText: {
    fontSize: 14, // sm
    fontWeight: '600',
  },
});

export default ReadingPlanCard;
