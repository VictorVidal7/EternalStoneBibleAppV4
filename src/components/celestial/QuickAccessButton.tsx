/**
 * ⚡ QUICK ACCESS BUTTON - Botón de Acceso Rápido
 *
 * Botón para la grilla de Quick Access con:
 * - Gradientes vibrantes en modo claro
 * - Íconos vectoriales blancos sobre gradientes
 * - Backgrounds tintados por libro en modo claro
 * - Indicador de "recently accessed" (punto pulsante)
 * - Animaciones suaves de press
 * - Border radius: 20px
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { createCelestialTheme, celestialBorderRadius } from '../../styles/celestialTheme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

/**
 * Configuración de gradientes para cada color base
 * SOLO se usan en modo claro
 */
const getGradientForColor = (baseColor: string): [string, string] => {
  const gradientMap: Record<string, [string, string]> = {
    // Génesis - Blue
    '#3b82f6': ['#3b82f6', '#06b6d4'], // blue-500 → cyan-500
    // Salmos - Purple
    '#a855f7': ['#a855f7', '#ec4899'], // purple-500 → pink-500
    // Proverbios - Amber
    '#f59e0b': ['#f59e0b', '#f97316'], // amber-500 → orange-500
    // Juan - Rose
    '#f43f5e': ['#f43f5e', '#dc2626'], // rose-500 → red-500
    // Romanos - Emerald
    '#10b981': ['#10b981', '#22c55e'], // emerald-500 → green-500
    // Apocalipsis - Violet
    '#8b5cf6': ['#8b5cf6', '#a855f7'], // violet-500 → purple-500
  };

  return gradientMap[baseColor] || [baseColor, baseColor];
};

/**
 * Obtiene el background para modo claro
 * Usa blanco semi-transparente uniforme para diseño ligero y elegante
 * El color vibrante viene SOLO del gradiente del ícono
 */
const getBackgroundForColor = (baseColor: string): string => {
  // Background blanco uniforme para todos los cards
  // El color distintivo viene del gradiente del ícono
  return 'rgba(255, 255, 255, 0.75)'; // Blanco semi-transparente
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface QuickAccessButtonProps {
  /**
   * Nombre del libro/sección
   */
  name: string;

  /**
   * Ícono de Ionicons
   * Ejemplos: 'book-outline', 'musical-notes-outline', 'bulb-outline'
   */
  icon: IoniconsName;

  /**
   * Color del ícono y gradiente
   */
  color: string;

  /**
   * Callback al presionar
   */
  onPress: () => void;

  /**
   * Mostrar indicador de "recently accessed"
   * @default false
   */
  recentlyAccessed?: boolean;

  /**
   * Delay de animación de entrada (ms)
   * @default 0
   */
  delay?: number;

  /**
   * Modo oscuro
   * @default false
   */
  isDark?: boolean;
}

const QuickAccessButton: React.FC<QuickAccessButtonProps> = ({
  name,
  icon,
  color,
  onPress,
  recentlyAccessed = false,
  delay = 0,
  isDark = false,
}) => {
  const theme = createCelestialTheme(isDark);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Obtener gradiente y background para modo claro
  const gradientColors = getGradientForColor(color);
  const lightModeBackground = getBackgroundForColor(color);

  // Animación de entrada
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  // Animación pulse para el indicador "recently accessed"
  useEffect(() => {
    if (recentlyAccessed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [recentlyAccessed]);

  // Interacciones
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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
          opacity: fadeAnim,
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
                : lightModeBackground,
              borderColor: theme.colors.border,
              borderRadius: celestialBorderRadius.cardSmall, // 20px
            },
            isDark ? theme.shadows.sm : styles.lightModeShadow,
          ]}
        >
          {/* Indicador de "recently accessed" */}
          {recentlyAccessed && (
            <Animated.View
              style={[
                styles.recentIndicator,
                {
                  backgroundColor: color,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          )}

          {/* Ícono con gradiente vibrante (MODO CLARO) o fondo sutil (MODO OSCURO) */}
          {!isDark ? (
            // MODO CLARO: Gradiente vibrante con ícono blanco
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.iconContainer, styles.iconGradient]}
            >
              <Ionicons name={icon} size={28} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            // MODO OSCURO: Mantener diseño actual
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: `${color}15`, // color con 15% opacidad
                },
              ]}
            >
              <Ionicons name={icon} size={28} color={color} />
            </View>
          )}

          {/* Nombre del libro */}
          <Text
            style={[styles.name, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {name}
          </Text>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%', // Exactamente la mitad para 2 columnas con gap
    marginBottom: 16,
  },
  card: {
    aspectRatio: 1, // Proporción 1:1 para cards cuadrados
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    position: 'relative',
  },
  recentIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    // Sombras mejoradas para el gradiente en modo claro
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, // Aumentado de 0.15 a 0.25 para más visibilidad
        shadowRadius: 8,
      },
      android: {
        elevation: 8, // Aumentado de 6 a 8
      },
    }),
  },
  lightModeShadow: {
    // Sombras sutiles para modo claro - diseño ligero
    ...Platform.select({
      ios: {
        shadowColor: '#64748b', // slate-500
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, // MUY sutil - reducido de 0.18
        shadowRadius: 8,
      },
      android: {
        elevation: 2, // Reducido de 5 a 2 para diseño más ligero
      },
    }),
  },
  name: {
    fontSize: 14, // sm
    fontWeight: '600',
    textAlign: 'left',
    letterSpacing: 0,
  },
});

export default QuickAccessButton;
