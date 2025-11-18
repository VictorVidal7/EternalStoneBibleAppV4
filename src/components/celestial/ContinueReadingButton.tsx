/**
 * 📖 CONTINUE READING BUTTON - Botón de Continuar Leyendo
 *
 * Componente hermoso para continuar la lectura con:
 * - Gradiente emerald → teal
 * - Porcentaje grande en esquina superior derecha
 * - Barra de progreso con backdrop-blur
 * - ChevronRight con animación
 * - Shadow-lg con tinte emerald
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createCelestialTheme, celestialBorderRadius } from '../../styles/celestialTheme';

interface ContinueReadingButtonProps {
  /**
   * Nombre del libro
   */
  bookName: string;

  /**
   * Número de capítulo
   */
  chapter: number;

  /**
   * Progreso en porcentaje (0-100)
   */
  progress: number;

  /**
   * Callback al presionar
   */
  onPress: () => void;

  /**
   * Texto del botón
   * @default "Continuar Leyendo"
   */
  buttonText?: string;

  /**
   * Modo oscuro
   * @default false
   */
  isDark?: boolean;
}

const ContinueReadingButton: React.FC<ContinueReadingButtonProps> = ({
  bookName,
  chapter,
  progress,
  onPress,
  buttonText = 'Continuar Leyendo',
  isDark = false,
}) => {
  const theme = createCelestialTheme(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animar el progreso cuando cambia
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 700,
      useNativeDriver: false, // No podemos usar native driver para width
    }).start();
  }, [progress]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(chevronAnim, {
        toValue: 4,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(chevronAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient
          colors={
            isDark
              ? ['#059669', '#0d9488'] // emerald-600 → teal-600
              : ['#10b981', '#14b8a6'] // emerald-500 → teal-500
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradientButton,
            {
              borderRadius: celestialBorderRadius.cardMedium, // 24px
            },
            Platform.select({
              ios: {
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
              },
              android: {
                elevation: 5,
              },
            }),
          ]}
        >
          {/* Contenido principal */}
          <View style={styles.content}>
            {/* Título y capítulo */}
            <View style={styles.textContainer}>
              <Text style={styles.buttonText}>{buttonText}</Text>
              <Text style={styles.bookInfo}>
                {bookName} - Capítulo {chapter}
              </Text>
            </View>

            {/* Porcentaje en esquina superior derecha */}
            <View style={styles.percentageContainer}>
              <Text style={styles.percentage}>{Math.round(progress)}%</Text>
              <Animated.View
                style={{
                  transform: [{ translateX: chevronAnim }],
                }}
              >
                <Ionicons name="chevron-forward" size={24} color="#ffffff" />
              </Animated.View>
            </View>
          </View>

          {/* Texto completado */}
          <Text style={styles.completedText}>{Math.round(progress)}% completado</Text>

          {/* Barra de progreso */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  gradientButton: {
    padding: 24,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  textContainer: {
    flex: 1,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  bookInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.1,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  completedText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 9999, // full pill shape
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default ContinueReadingButton;
