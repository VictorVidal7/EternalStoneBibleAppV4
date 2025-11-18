/**
 * ⚡ QUICK ACCESS BUTTON - Botón de Acceso Rápido
 *
 * Botón para la grilla de Quick Access con:
 * - Íconos vectoriales (no emojis)
 * - Indicador de "recently accessed" (punto pulsante)
 * - Hover effect: scale(1.02)
 * - Glassmorphism sutil
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { createCelestialTheme, celestialBorderRadius } from '../../styles/celestialTheme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

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
                : 'rgba(0,0,0,0.02)',
              borderColor: theme.colors.border,
              borderRadius: celestialBorderRadius.cardSmall, // 20px
            },
            theme.shadows.sm,
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

          {/* Ícono con contenedor de color */}
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
    width: (SCREEN_WIDTH - 24 * 3) / 2, // 2 columnas con padding
    marginBottom: 20,
  },
  card: {
    height: 100,
    borderWidth: 1,
    padding: 12,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 14, // sm
    fontWeight: '600',
    textAlign: 'left',
    letterSpacing: 0,
  },
});

export default QuickAccessButton;
