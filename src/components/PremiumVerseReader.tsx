/**
 * 📖 PREMIUM VERSE READER
 *
 * Componente de lectura de versículos premium con:
 * - Tipografía optimizada para lectura prolongada
 * - Modos de lectura personalizables
 * - Gestos táctiles naturales
 * - Animaciones suaves
 * - Resaltado inteligente
 * - Control de brillo y temperatura de color
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { spacing, borderRadius, fontSize, shadows } from '../styles/designTokens';
import { typography, readingModes } from '../styles/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Verse {
  number: number;
  text: string;
  highlighted?: boolean;
  highlightColor?: string;
}

interface PremiumVerseReaderProps {
  verses: Verse[];
  bookName: string;
  chapter: number;
  colors: any;
  isDark: boolean;
  onVersePress?: (verseNumber: number) => void;
  onVerseLongPress?: (verseNumber: number) => void;
  initialReadingMode?: keyof typeof readingModes;
}

type ReadingMode = keyof typeof readingModes;
type ColorTemperature = 'cool' | 'normal' | 'warm' | 'sepia';

export const PremiumVerseReader: React.FC<PremiumVerseReaderProps> = ({
  verses,
  bookName,
  chapter,
  colors,
  isDark,
  onVersePress,
  onVerseLongPress,
  initialReadingMode = 'comfortable',
}) => {
  const [readingMode, setReadingMode] = useState<ReadingMode>(initialReadingMode);
  const [colorTemperature, setColorTemperature] = useState<ColorTemperature>('normal');
  const [showControls, setShowControls] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const controlsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startEntranceAnimation();
  }, []);

  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleControls = useCallback(() => {
    const newValue = showControls ? 0 : 1;
    setShowControls(!showControls);

    Animated.spring(controlsAnim, {
      toValue: newValue,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [showControls]);

  const handleReadingModeChange = (mode: ReadingMode) => {
    setReadingMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleTemperatureChange = (temp: ColorTemperature) => {
    setColorTemperature(temp);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getTemperatureOverlay = (): string => {
    switch (colorTemperature) {
      case 'cool':
        return 'rgba(200, 220, 255, 0.05)';
      case 'warm':
        return 'rgba(255, 220, 180, 0.08)';
      case 'sepia':
        return 'rgba(255, 240, 200, 0.15)';
      default:
        return 'transparent';
    }
  };

  const currentReadingStyle = readingModes[readingMode];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Temperature overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: getTemperatureOverlay() },
        ]}
        pointerEvents="none"
      />

      {/* Header con información del capítulo */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(102, 126, 234, 0.3)', 'transparent']
              : ['rgba(102, 126, 234, 0.1)', 'transparent']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <View style={styles.headerTextContainer}>
              <Text style={[typography.h5, { color: colors.text }]}>
                {bookName} {chapter}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {verses.length} {verses.length === 1 ? 'versículo' : 'versículos'}
              </Text>
            </View>

            {/* Control button */}
            <TouchableOpacity
              onPress={toggleControls}
              style={[
                styles.controlButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={showControls ? 'close' : 'settings-outline'}
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Controls panel */}
      <Animated.View
        style={[
          styles.controlsPanel,
          {
            opacity: controlsAnim,
            transform: [
              {
                translateY: controlsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showControls ? 'auto' : 'none'}
      >
        <View
          style={[
            styles.controlsContent,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            shadows.lg,
          ]}
        >
          {/* Reading mode selector */}
          <View style={styles.controlSection}>
            <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
              Tamaño de letra
            </Text>
            <View style={styles.modeButtons}>
              {(['compact', 'normal', 'comfortable', 'large'] as ReadingMode[]).map(
                (mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => handleReadingModeChange(mode)}
                    style={[
                      styles.modeButton,
                      {
                        backgroundColor:
                          readingMode === mode ? colors.primary : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.buttonSmall,
                        {
                          color:
                            readingMode === mode ? '#ffffff' : colors.text,
                        },
                      ]}
                    >
                      {mode === 'compact' && 'A'}
                      {mode === 'normal' && 'A'}
                      {mode === 'comfortable' && 'A'}
                      {mode === 'large' && 'A'}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Color temperature selector */}
          <View style={styles.controlSection}>
            <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
              Temperatura de color
            </Text>
            <View style={styles.temperatureButtons}>
              {(['cool', 'normal', 'warm', 'sepia'] as ColorTemperature[]).map(
                (temp) => (
                  <TouchableOpacity
                    key={temp}
                    onPress={() => handleTemperatureChange(temp)}
                    style={[
                      styles.tempButton,
                      {
                        backgroundColor:
                          colorTemperature === temp
                            ? colors.primary + '30'
                            : colors.surface,
                        borderColor:
                          colorTemperature === temp
                            ? colors.primary
                            : colors.border,
                        borderWidth: colorTemperature === temp ? 2 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        temp === 'cool'
                          ? 'snow'
                          : temp === 'warm'
                          ? 'sunny'
                          : temp === 'sepia'
                          ? 'leaf'
                          : 'contrast'
                      }
                      size={18}
                      color={
                        colorTemperature === temp ? colors.primary : colors.textSecondary
                      }
                    />
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Verses content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.versesContainer}>
          {verses.map((verse, index) => (
            <VerseItem
              key={verse.number}
              verse={verse}
              index={index}
              readingStyle={currentReadingStyle}
              colors={colors}
              isDark={isDark}
              onPress={onVersePress}
              onLongPress={onVerseLongPress}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// ==================== VERSE ITEM COMPONENT ====================

interface VerseItemProps {
  verse: Verse;
  index: number;
  readingStyle: any;
  colors: any;
  isDark: boolean;
  onPress?: (verseNumber: number) => void;
  onLongPress?: (verseNumber: number) => void;
}

const VerseItem: React.FC<VerseItemProps> = React.memo(
  ({ verse, index, readingStyle, colors, isDark, onPress, onLongPress }) => {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const [isPressed, setIsPressed] = useState(false);

    useEffect(() => {
      const delay = Math.min(index * 30, 500);

      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        delay,
        useNativeDriver: true,
      }).start();
    }, [index]);

    const handlePressIn = () => {
      setIsPressed(true);
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      setIsPressed(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(verse.number);
    };

    const handleLongPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress?.(verse.number);
    };

    return (
      <Animated.View
        style={[
          styles.verseWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          onLongPress={handleLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.verseContainer,
            verse.highlighted && {
              backgroundColor: verse.highlightColor || colors.highlight + '30',
              borderLeftColor: verse.highlightColor || colors.primary,
              borderLeftWidth: 3,
              paddingLeft: spacing.base - 3,
            },
          ]}
        >
          <View style={styles.verseNumberContainer}>
            <Text
              style={[
                typography.verseNumber,
                {
                  color: colors.textTertiary,
                },
              ]}
            >
              {verse.number}
            </Text>
          </View>
          <Text
            style={[
              typography.verse,
              readingStyle,
              {
                color: colors.text,
                flex: 1,
              },
            ]}
          >
            {verse.text}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

VerseItem.displayName = 'VerseItem';

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // Controls
  controlsPanel: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  controlsContent: {
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
  },
  controlSection: {
    marginBottom: spacing.md,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  modeButton: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  temperatureButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tempButton: {
    flex: 1,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Verses
  versesContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  verseWrapper: {
    marginBottom: spacing.base,
  },
  verseContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
  },
  verseNumberContainer: {
    marginRight: spacing.md,
    minWidth: 32,
    alignItems: 'flex-end',
  },
});
