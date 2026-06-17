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

import React from 'react';
import {View, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import {AppText as Text} from '@components/ui/AppText';
import {Ionicons} from '@expo/vector-icons';
import {BlurView} from 'expo-blur';
import type {ComponentProps} from 'react';
import {
  createCelestialTheme,
  celestialBorderRadius,
} from '../../styles/celestialTheme';
import {withOpacity} from '../../styles/modernTheme';
import {useTheme} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';
import {usePressScale} from '../../hooks/usePressScale';
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
   * @default 240
   */
  width?: number;
}

const ReadingPlanCard: React.FC<ReadingPlanCardProps> = ({
  name,
  description,
  subtitle,
  icon = 'book-outline',
  duration,
  daysCompleted,
  onPress,
  continueText = 'Continuar',
  isDark = false,
  width = 240,
}) => {
  const {colors: themeColors} = useTheme();
  const {t} = useLanguage();
  // Pasar colores dinámicos del tema seleccionado
  const theme = createCelestialTheme(isDark, {
    primary: themeColors.primary,
    primaryLight: themeColors.primaryLight,
    primaryDark: themeColors.primaryDark,
    info: themeColors.info,
  });
  const accentColor = themeColors.primary;
  const accentSoft = withOpacity(accentColor, isDark ? 0.2 : 0.12);
  // Sprint 67: shared, reduce-motion-aware press depress (see usePressScale).
  const press = usePressScale();

  // Calcular progreso
  const progress = Math.round((daysCompleted / duration) * 100);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          transform: [{scale: press.scale}],
        },
      ]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={[name, subtitle, `${daysCompleted}/${duration}`]
          .filter(Boolean)
          .join(', ')}
        accessibilityHint={continueText}>
        <BlurView
          intensity={isDark ? 30 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceGlass,
              borderColor: theme.colors.glassBorder,
              borderRadius: celestialBorderRadius.cardMedium,
            },
            theme.shadows.md,
          ]}>
          {/* Header con ícono y duración */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: accentSoft,
                },
              ]}>
              <Ionicons name={icon} size={24} color={accentColor} />
            </View>

            <View
              style={[
                styles.durationBadge,
                {
                  backgroundColor: accentSoft,
                },
              ]}>
              <Text style={[styles.durationText, {color: accentColor}]}>
                {duration} {t.readingPlans.days}
              </Text>
            </View>
          </View>

          {/* Contenido con título y descripción */}
          <View style={styles.content}>
            <Text
              style={[styles.name, {color: theme.colors.text}]}
              numberOfLines={2}
              ellipsizeMode="tail">
              {name}
            </Text>

            {subtitle && (
              <Text
                style={[styles.subtitle, {color: theme.colors.textSecondary}]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {subtitle}
              </Text>
            )}

            {description && (
              <Text
                style={[
                  styles.description,
                  {color: theme.colors.textSecondary},
                ]}
                numberOfLines={2}
                ellipsizeMode="tail">
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
              gradientColors={[
                accentColor,
                themeColors.primaryDark || accentColor,
              ]}
              backgroundColor={withOpacity(accentColor, isDark ? 0.18 : 0.12)}
              animated
            />

            {/* Texto de progreso sobre el círculo */}
            <View style={styles.progressTextContainer}>
              <Text style={[styles.progressText, {color: theme.colors.text}]}>
                {daysCompleted}/{duration}
              </Text>
            </View>
          </View>

          {/* Footer con botón de continuar */}
          <View style={styles.footer}>
            <Text style={[styles.continueText, {color: accentColor}]}>
              {continueText}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={accentColor} />
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
    padding: 16,
    paddingHorizontal: 14, // Más espacio horizontal para el texto
    // FIXED height (Sprint 95) so every plan card in the Home carousel is the
    // exact same size: `minHeight` let cards grow with their text (1- vs 2-line
    // name / description), so they looked uneven. The `content` block is
    // flex:1, so it absorbs the slack and the progress circle + footer stay
    // anchored; text is already capped with numberOfLines so nothing clips.
    height: 288,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    fontSize: 10, // 2xs
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginBottom: 8,
    paddingRight: 4, // Espacio extra para evitar que el texto toque el borde
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 17,
  },
  subtitle: {
    fontSize: 11, // Reducido para mejor ajuste
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 14,
    opacity: 0.8,
  },
  description: {
    fontSize: 10, // Reducido para mejor ajuste y evitar desbordamiento
    lineHeight: 14,
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
