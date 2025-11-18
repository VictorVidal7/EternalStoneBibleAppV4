/**
 * ✨ VERSE OF DAY CARD - Tarjeta del Verso del Día
 *
 * Componente hermoso para mostrar el verso diario con:
 * - Glassmorphism y backdrop blur
 * - Tipografía serif para el texto bíblico
 * - Border-left de 4px estilo blockquote
 * - Botones con estados hover/active
 * - Ícono Sparkles con gradiente
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createCelestialTheme, celestialBorderRadius } from '../../styles/celestialTheme';

interface VerseOfDayCardProps {
  /**
   * Texto del versículo
   */
  verseText: string;

  /**
   * Referencia bíblica (ej: "Juan 3:16")
   */
  reference: string;

  /**
   * Título de la card
   * @default "Verso del Día"
   */
  title?: string;

  /**
   * Callback al presionar la card
   */
  onPress?: () => void;

  /**
   * Callback al presionar el botón de compartir
   */
  onShare?: () => void;

  /**
   * Callback al presionar el botón de favorito
   */
  onFavorite?: () => void;

  /**
   * Modo oscuro
   * @default false
   */
  isDark?: boolean;
}

const VerseOfDayCard: React.FC<VerseOfDayCardProps> = ({
  verseText,
  reference,
  title = '✨ Verso del Día',
  onPress,
  onShare,
  onFavorite,
  isDark = false,
}) => {
  const theme = createCelestialTheme(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isFavorited, setIsFavorited] = useState(false);

  // Animaciones de interacción
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

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
      >
        <BlurView
          intensity={isDark ? 30 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceGlass,
              borderColor: theme.colors.glassBorder,
              borderRadius: celestialBorderRadius.cardMedium, // 24px
            },
            theme.shadows.lg,
          ]}
        >
          {/* Header con ícono sparkles */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#fbbf24', '#f59e0b']} // amber gradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="sparkles" size={24} color="#ffffff" />
              </LinearGradient>
            </View>

            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                {reference}
              </Text>
            </View>
          </View>

          {/* Verso con tipografía serif y border-left */}
          <View
            style={[
              styles.verseContainer,
              {
                borderLeftColor: theme.colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.verseText,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.fontFamily.serif,
                },
              ]}
            >
              "{verseText}"
            </Text>
          </View>

          {/* Footer con botones de acción */}
          <View style={styles.footer}>
            {/* Botón leer capítulo completo */}
            {onPress && (
              <TouchableOpacity style={styles.actionButton} onPress={onPress}>
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                  Leer capítulo completo
                </Text>
                <Ionicons name="arrow-forward" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            )}

            {/* Botones de share y favorite */}
            <View style={styles.iconButtons}>
              {onShare && (
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: theme.colors.hover }]}
                  onPress={onShare}
                >
                  <Ionicons name="share-outline" size={20} color={theme.colors.text} />
                </TouchableOpacity>
              )}

              {onFavorite && (
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: theme.colors.hover }]}
                  onPress={handleFavorite}
                >
                  <Ionicons
                    name={isFavorited ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFavorited ? '#ef4444' : theme.colors.text}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    padding: 24, // celestialSpacing.cardPadding
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20, // lg
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12, // xs
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.7,
  },
  verseContainer: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginBottom: 16,
  },
  verseText: {
    fontSize: 16, // base
    lineHeight: 25.6, // 16 * 1.6
    fontStyle: 'italic',
    opacity: 0.95,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  iconButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VerseOfDayCard;
