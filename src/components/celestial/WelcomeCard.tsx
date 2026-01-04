/**
 * 🎉 WELCOME CARD - Tarjeta de Bienvenida
 *
 * Componente hermoso para dar la bienvenida con:
 * - Gradiente purple → indigo
 * - Elementos decorativos blur
 * - Estadísticas con animación pulse
 * - Glassmorphism en el stats container
 * - Border radius: 28px (cardLarge)
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import StatsCard from './StatsCard';
import {
  createCelestialTheme,
  celestialBorderRadius,
} from '../../styles/celestialTheme';
import {useTheme} from '../../hooks/useTheme';
import {useLanguage} from '../../hooks/useLanguage';

interface WelcomeCardProps {
  /**
   * Nombre del usuario o mensaje de bienvenida
   * @default "Bienvenido"
   */
  userName?: string;

  /**
   * Subtítulo
   * @default "Tu viaje espiritual continúa"
   */
  subtitle?: string;

  /**
   * Días de racha
   */
  streakDays: number;

  /**
   * Nivel del usuario
   */
  level: number;

  /**
   * Porcentaje de progreso
   */
  progress: number;

  /**
   * Modo oscuro
   * @default false
   */
  isDark?: boolean;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({
  userName = 'Bienvenido',
  subtitle = 'Tu viaje espiritual continúa',
  streakDays,
  level,
  progress,
  isDark = false,
}) => {
  const {colors: themeColors} = useTheme();
  const {t} = useLanguage();
  // Pasar colores dinámicos del tema seleccionado
  const theme = createCelestialTheme(isDark, {
    primary: themeColors.primary,
    primaryLight: themeColors.primaryLight,
    primaryDark: themeColors.primaryDark,
    secondary: themeColors.secondary,
    accent: themeColors.accent,
    info: themeColors.info,
  });

  // Usar colores dinámicos para el gradiente
  const gradientColors: [string, string, string] = [
    themeColors.primary,
    themeColors.primaryLight,
    themeColors.primaryDark,
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradientColors}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[
          styles.gradientCard,
          {
            borderRadius: celestialBorderRadius.cardLarge, // 28px
          },
          theme.shadows.xl,
        ]}>
        {/* Elementos decorativos blur */}
        <View style={styles.decorativeBlurs}>
          {/* Top-right blur */}
          <View style={[styles.blurElement, styles.blurTopRight]} />

          {/* Bottom-left blur - color dinámico */}
          <View
            style={[
              styles.blurElement,
              styles.blurBottomLeft,
              {backgroundColor: `${themeColors.primary}4D`}, // 30% opacity
            ]}
          />

          {/* Center-right blur - color dinámico */}
          <View
            style={[
              styles.blurElement,
              styles.blurCenterRight,
              {backgroundColor: `${themeColors.primaryLight}33`}, // 20% opacity
            ]}
          />
        </View>

        {/* Contenido principal */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Stats container con glassmorphism */}
          <BlurView
            intensity={30}
            tint={isDark ? 'dark' : 'light'}
            style={styles.statsContainer}>
            <View style={styles.statsInner}>
              {/* Días de racha con animación pulse */}
              <StatsCard
                icon="flame"
                value={streakDays}
                label={t.home.days}
                iconColor="#fbbf24" // amber-400
                valueColor="#ffffff"
                labelColor="rgba(255, 255, 255, 0.75)"
                pulse={true}
              />

              {/* Nivel */}
              <StatsCard
                icon="star"
                value={level}
                label={t.home.level}
                iconColor="#fbbf24" // amber-400
                valueColor="#ffffff"
                labelColor="rgba(255, 255, 255, 0.75)"
              />

              {/* Progreso */}
              <StatsCard
                icon="trending-up"
                value={`${progress}%`}
                label={t.home.progress}
                iconColor="#fbbf24" // amber-400
                valueColor="#ffffff"
                labelColor="rgba(255, 255, 255, 0.75)"
              />
            </View>
          </BlurView>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: 40,
    marginBottom: 24,
  },
  gradientCard: {
    overflow: 'hidden',
    minHeight: 180,
    position: 'relative',
  },
  decorativeBlurs: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  blurElement: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurTopRight: {
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurBottomLeft: {
    bottom: -30,
    left: -30,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(168, 85, 247, 0.3)', // purple-500/30
  },
  blurCenterRight: {
    top: '40%',
    right: -20,
    width: 80,
    height: 80,
    backgroundColor: 'rgba(99, 102, 241, 0.2)', // indigo-400/20
  },
  content: {
    padding: 24,
    position: 'relative',
    zIndex: 1,
  },
  header: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
  },
  statsContainer: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statsInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fallback para BlurView
  },
});

export default WelcomeCard;
