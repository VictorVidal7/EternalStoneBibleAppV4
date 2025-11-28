/**
 * 🌟 IMMERSIVE READING MODE
 *
 * Modo de lectura inmersivo cinematográfico con:
 * - Animaciones de fade/slide entre versículos
 * - Text-to-Speech narration
 * - Backgrounds celestiales animados
 * - Auto-scroll inteligente
 * - Controles minimalistas
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {BibleVerse} from '../../types/bible';
import {useTheme} from '../../hooks/useTheme';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

interface ImmersiveReaderProps {
  verses: BibleVerse[];
  onClose: () => void;
  startIndex?: number;
}

type BackgroundType = 'celestial' | 'minimal' | 'nature' | 'paper';
type AnimationType = 'fade' | 'slide' | 'none';

export const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({
  verses,
  onClose,
  startIndex = 0,
}) => {
  const {colors, isDark} = useTheme();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [backgroundType, setBackgroundType] =
    useState<BackgroundType>('celestial');
  const [fontSize, setFontSize] = useState(22);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  const currentVerse = verses[currentIndex];

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        hideControls();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  // Auto-scroll logic
  useEffect(() => {
    if (autoScroll && currentIndex < verses.length - 1) {
      const wordsInVerse = currentVerse.text.split(' ').length;
      const avgReadingSpeed = 200; // words per minute
      const timeToRead = (wordsInVerse / avgReadingSpeed) * 60000; // milliseconds

      const timer = setTimeout(
        () => {
          goToNext();
        },
        Math.max(timeToRead, 3000),
      ); // Minimum 3 seconds

      return () => clearTimeout(timer);
    }
  }, [currentIndex, autoScroll, currentVerse]);

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(callback, 300);
  };

  const goToNext = () => {
    if (currentIndex < verses.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateTransition(() => setCurrentIndex(currentIndex + 1));
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateTransition(() => setCurrentIndex(currentIndex - 1));
    }
  };

  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const revealControls = () => {
    setShowControls(true);
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleScreenTap = () => {
    if (showControls) {
      hideControls();
    } else {
      revealControls();
    }
  };

  const increaseFontSize = () => {
    setFontSize(Math.min(fontSize + 2, 32));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const decreaseFontSize = () => {
    setFontSize(Math.max(fontSize - 2, 16));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getBackgroundGradient = (): string[] => {
    if (backgroundType === 'celestial') {
      return isDark
        ? ['#0f172a', '#1e1b4b', '#312e81', '#4c1d95']
        : ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa'];
    } else if (backgroundType === 'nature') {
      return isDark
        ? ['#064e3b', '#065f46', '#047857', '#059669']
        : ['#d1fae5', '#a7f3d0', '#6ee7b7', '#34d399'];
    } else if (backgroundType === 'paper') {
      return isDark
        ? ['#292524', '#1c1917', '#0c0a09']
        : ['#fef3c7', '#fde68a', '#fcd34d'];
    }
    return [colors.background, colors.background]; // minimal
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Animated Background */}
      <LinearGradient
        colors={getBackgroundGradient()}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating stars/particles for celestial mode */}
      {backgroundType === 'celestial' && (
        <View style={styles.starsContainer}>
          <Ionicons
            name="star"
            size={20}
            color="rgba(255,255,255,0.3)"
            style={[styles.star, {top: '10%', left: '20%'}]}
          />
          <Ionicons
            name="star"
            size={16}
            color="rgba(255,255,255,0.2)"
            style={[styles.star, {top: '30%', right: '15%'}]}
          />
          <Ionicons
            name="star"
            size={14}
            color="rgba(255,255,255,0.25)"
            style={[styles.star, {top: '60%', left: '10%'}]}
          />
          <Ionicons
            name="star"
            size={18}
            color="rgba(255,255,255,0.3)"
            style={[styles.star, {top: '80%', right: '25%'}]}
          />
        </View>
      )}

      {/* Main Content - Tappable */}
      <TouchableOpacity
        style={styles.contentContainer}
        activeOpacity={1}
        onPress={handleScreenTap}>
        <Animated.View
          style={[
            styles.verseContainer,
            {
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}],
            },
          ]}>
          {/* Verse Text */}
          <Text
            style={[
              styles.verseText,
              {
                fontSize,
                color: isDark ? '#f1f5f9' : '#1e293b',
                textShadowColor: isDark
                  ? 'rgba(0,0,0,0.5)'
                  : 'rgba(255,255,255,0.8)',
              },
            ]}>
            {currentVerse.text}
          </Text>

          {/* Reference */}
          <Text
            style={[
              styles.reference,
              {
                color: isDark ? '#cbd5e1' : '#64748b',
              },
            ]}>
            {currentVerse.book} {currentVerse.chapter}:{currentVerse.verse}
          </Text>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <Text
              style={[
                styles.progressText,
                {color: isDark ? '#94a3b8' : '#94a3b8'},
              ]}>
              {currentIndex + 1} / {verses.length}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${((currentIndex + 1) / verses.length) * 100}%`,
                    backgroundColor: isDark ? '#60a5fa' : '#3b82f6',
                  },
                ]}
              />
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>

      {/* Controls Overlay */}
      {showControls && (
        <Animated.View
          style={[styles.controlsOverlay, {opacity: controlsOpacity}]}>
          {/* Top Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={[
                styles.controlButton,
                {backgroundColor: 'rgba(0,0,0,0.5)'},
              ]}
              onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.topRightControls}>
              {/* Font size controls */}
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  {backgroundColor: 'rgba(0,0,0,0.5)'},
                ]}
                onPress={decreaseFontSize}>
                <Ionicons name="remove" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.controlButton,
                  {backgroundColor: 'rgba(0,0,0,0.5)'},
                ]}
                onPress={increaseFontSize}>
                <Ionicons name="add" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Controls */}
          <View style={styles.bottomControls}>
            {/* Previous */}
            <TouchableOpacity
              style={[
                styles.navButton,
                {opacity: currentIndex === 0 ? 0.3 : 1},
              ]}
              onPress={goToPrevious}
              disabled={currentIndex === 0}>
              <Ionicons name="chevron-back" size={32} color="#fff" />
            </TouchableOpacity>

            {/* Center Controls */}
            <View style={styles.centerControls}>
              {/* Auto-scroll toggle */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  autoScroll && styles.actionButtonActive,
                ]}
                onPress={toggleAutoScroll}>
                <Ionicons
                  name={autoScroll ? 'pause' : 'play'}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.actionButtonText}>
                  {autoScroll ? 'Pausar' : 'Auto'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Next */}
            <TouchableOpacity
              style={[
                styles.navButton,
                {opacity: currentIndex === verses.length - 1 ? 0.3 : 1},
              ]}
              onPress={goToNext}
              disabled={currentIndex === verses.length - 1}>
              <Ionicons name="chevron-forward" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  starsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  star: {
    position: 'absolute',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  verseContainer: {
    alignItems: 'center',
    maxWidth: 700,
  },
  verseText: {
    fontFamily: Platform.select({ios: 'Georgia', android: 'serif'}),
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 32,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  reference: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(59,130,246,0.8)',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
