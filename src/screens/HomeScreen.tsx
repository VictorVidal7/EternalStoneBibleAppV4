/**
 * 🏠 HOME SCREEN - Pantalla Principal
 *
 * Pantalla principal refinada con diseño Celestial Premium 2.0:
 * - Header con glassmorphism y gradiente
 * - Welcome Card con estadísticas animadas
 * - Verso del Día con tipografía serif
 * - Continue Reading con barra de progreso
 * - Quick Access con gradientes vibrantes
 * - Reading Plans con círculos de progreso
 * - Animaciones fluidas de 60fps con Reanimated 3
 *
 * Para la gloria de Dios - Eternal Bible App
 */

import React, {useEffect, useCallback, useState, useMemo} from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  FadeIn,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../hooks/useLanguage';
import {useReadingProgress} from '../context/ReadingProgressContext';
import HapticFeedback from '../services/HapticFeedback';
import {logger} from '../lib/utils/logger';
import DailyVerseService from '../services/DailyVerseService';
import {getBookName} from '../data/bookNames';

// Componentes Celestial
import {
  WelcomeCard,
  VerseOfDayCard,
  ContinueReadingButton,
  QuickAccessButton,
  ReadingPlanCard,
} from '../components/celestial';
import {createCelestialTheme} from '../styles/celestialTheme';
import {SPRING_CONFIGS, DURATIONS} from '../styles/reanimatedAnimations';

const {width} = Dimensions.get('window');

interface LastReadPosition {
  book: string;
  chapter: number;
  verse: number;
}

interface DailyVerse {
  book: string;
  chapter: number;
  number: number;
  text: string;
}

// Configuración de Quick Access con gradientes vibrantes
const QUICK_ACCESS_BOOKS = [
  {name: 'Génesis', icon: 'book-outline', color: '#3b82f6', screen: 'Biblia'},
  {
    name: 'Salmos',
    icon: 'musical-notes-outline',
    color: '#a855f7',
    screen: 'Biblia',
  },
  {
    name: 'Proverbios',
    icon: 'bulb-outline',
    color: '#f59e0b',
    screen: 'Biblia',
  },
  {name: 'Juan', icon: 'heart-outline', color: '#f43f5e', screen: 'Biblia'},
  {
    name: 'Romanos',
    icon: 'document-text-outline',
    color: '#10b981',
    screen: 'Biblia',
  },
  {
    name: 'Apocalipsis',
    icon: 'flash-outline',
    color: '#8b5cf6',
    screen: 'Biblia',
  },
] as const;

// Datos de ejemplo para Reading Plans
const READING_PLANS = [
  {
    name: 'Sabiduría Diaria',
    subtitle: 'Proverbios',
    description: 'Un capítulo cada día',
    icon: 'bulb-outline',
    color: '#f59e0b',
    duration: 31,
    daysCompleted: 9,
  },
  {
    name: 'Nuevo Testamento',
    subtitle: '260 días',
    description: 'Completo en 260 días',
    icon: 'book-outline',
    color: '#6366f1',
    duration: 260,
    daysCompleted: 45,
  },
  {
    name: 'Salmos y Alabanza',
    subtitle: '150 días',
    description: 'Un salmo diario',
    icon: 'musical-notes-outline',
    color: '#a855f7',
    duration: 150,
    daysCompleted: 78,
  },
] as const;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {colors, isDarkMode} = useTheme();
  const {t} = useLanguage();
  const readingProgressContext = useReadingProgress();
  const [lastRead, setLastRead] = useState<LastReadPosition | null>(null);
  const [dailyVerse, setDailyVerse] = useState<DailyVerse | null>(null);
  const [loadingVerse, setLoadingVerse] = useState(true);

  // Reanimated 3 - Shared Values para animaciones de 60fps
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const headerScale = useSharedValue(0.95);

  const theme = createCelestialTheme(isDarkMode, {
    primary: colors.primary,
    primaryLight: colors.primaryLight,
    primaryDark: colors.primaryDark,
    secondary: colors.secondary,
    accent: colors.accent,
    info: colors.info,
  });

  // Estilo animado para el contenido principal
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{translateY: contentTranslateY.value}],
  }));

  // Estilo animado para el header
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    transform: [{scale: headerScale.value}],
  }));

  useEffect(() => {
    // Entrance animations con Reanimated 3 - Más fluidas
    contentOpacity.value = withDelay(
      200,
      withTiming(1, {duration: DURATIONS.slower}),
    );
    contentTranslateY.value = withDelay(
      200,
      withSpring(0, SPRING_CONFIGS.default),
    );
    headerScale.value = withSpring(1, SPRING_CONFIGS.gentle);

    // Load last read position
    const loadLastRead = async () => {
      try {
        if (
          readingProgressContext &&
          typeof readingProgressContext.getLastReadPosition === 'function'
        ) {
          const position = await readingProgressContext.getLastReadPosition();
          if (position) {
            setLastRead({
              book: position.book,
              chapter: parseInt(position.chapter, 10),
              verse: parseInt(position.verse, 10),
            });
          }
        }
      } catch (error) {
        logger.error('Error loading last read position', error as Error, {
          screen: 'HomeScreen',
          action: 'loadLastRead',
        });
      }
    };

    // Load daily verse
    const loadDailyVerse = async () => {
      try {
        setLoadingVerse(true);
        const verse = await DailyVerseService.getDailyVerse();
        if (verse) {
          setDailyVerse({
            book: verse.book,
            chapter: verse.chapter,
            number: verse.verse,
            text: verse.text,
          });
        }
      } catch (error) {
        logger.error('Error loading daily verse', error as Error, {
          screen: 'HomeScreen',
          action: 'loadDailyVerse',
        });
      } finally {
        setLoadingVerse(false);
      }
    };

    loadLastRead();
    loadDailyVerse();
  }, [readingProgressContext, contentOpacity, contentTranslateY, headerScale]);

  const handleNavigation = useCallback(
    (screen: string) => {
      HapticFeedback.light();
      navigation.navigate(screen);

      logger.breadcrumb('Navigate to screen', 'navigation', {
        screen,
        from: 'HomeScreen',
      });
    },
    [navigation],
  );

  const handleContinueReading = useCallback(() => {
    HapticFeedback.medium();

    if (lastRead) {
      navigation.navigate('Biblia', {
        screen: 'Verse',
        params: {
          book: lastRead.book,
          chapter: lastRead.chapter,
          verse: lastRead.verse,
        },
      });
    } else {
      navigation.navigate('Biblia', {screen: 'BibleList'});
    }

    logger.breadcrumb('Continue reading', 'user-action', {
      hasLastRead: !!lastRead,
      screen: 'HomeScreen',
    });
  }, [navigation, lastRead]);

  const handleVersePress = useCallback(() => {
    if (dailyVerse) {
      HapticFeedback.light();
      navigation.navigate('Biblia', {
        screen: 'Verse',
        params: {
          book: dailyVerse.book,
          chapter: dailyVerse.chapter,
          verse: dailyVerse.number,
        },
      });
    }
  }, [navigation, dailyVerse]);

  const handleVerseShare = useCallback(() => {
    HapticFeedback.light();
    // TODO: Implement share functionality
    console.log('Share verse');
  }, []);

  const handleVerseFavorite = useCallback(() => {
    HapticFeedback.light();
    // TODO: Implement favorite functionality
    console.log('Favorite verse');
  }, []);

  const handleReadingPlanPress = useCallback(
    (planName: string) => {
      HapticFeedback.light();
      navigation.navigate('Plan');
      console.log('Open reading plan:', planName);
    },
    [navigation],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: isDarkMode ? theme.colors.background : '#f8fafc', // slate-50 para modo claro
        },
        backgroundGradient: {
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        },
        contentContainer: {
          flexGrow: 1,
          paddingBottom: 100, // Para bottom navigation
        },
        headerGradient: {
          paddingTop: (StatusBar.currentHeight || 0) + 16,
          paddingBottom: 24,
          paddingHorizontal: 20,
        },
        headerContent: {
          position: 'relative',
          zIndex: 1,
        },
        headerTitle: {
          fontSize: 36,
          fontWeight: '800',
          color: '#FFFFFF',
          marginBottom: 6,
          letterSpacing: -0.5,
        },
        headerSubtitle: {
          fontSize: 17,
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.95)',
          letterSpacing: 0.2,
        },
        section: {
          marginTop: 8,
          marginBottom: 24,
        },
        sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginHorizontal: 20,
          marginBottom: 16,
        },
        sectionTitle: {
          fontSize: 24,
          fontWeight: '700',
          color: theme.colors.text,
          letterSpacing: -0.5,
        },
        sectionSubtitle: {
          fontSize: 14,
          fontWeight: '500',
          color: theme.colors.primary,
          letterSpacing: 0.2,
        },
        quickAccessGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          gap: 12,
        },
        readingPlansScroll: {
          paddingLeft: 20,
        },
        emptyVerse: {
          marginHorizontal: 20,
          padding: 24,
          backgroundColor: theme.colors.surface,
          borderRadius: 24,
          alignItems: 'center',
        },
        emptyVerseText: {
          fontSize: 16,
          color: theme.colors.textSecondary,
          textAlign: 'center',
        },
      }),
    [theme, isDarkMode],
  );

  return (
    <View style={styles.container}>
      {/* Gradiente de fondo sutil solo en modo claro */}
      {!isDarkMode && (
        <LinearGradient
          colors={[
            '#f8fafc', // slate-50
            '#f1f5f9', // slate-100
            '#eef2ff', // indigo-50
          ]}
          locations={[0, 0.6, 1]}
          style={styles.backgroundGradient}
        />
      )}

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent
        />

        {/* Header con Glassmorphism y Gradiente - Animado */}
        <Animated.View style={animatedHeaderStyle}>
          <LinearGradient
            colors={
              isDarkMode
                ? (['#6366f1', '#8b5cf6', '#7c3aed'] as const)
                : (['#6366f1', '#7c3aed'] as const)
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}>
            <BlurView
              intensity={isDarkMode ? 20 : 40}
              tint={isDarkMode ? 'dark' : 'light'}
              style={styles.headerGradient}>
              <View style={styles.headerContent}>
                <Animated.Text
                  entering={FadeIn.delay(100).duration(600)}
                  style={styles.headerTitle}
                  accessibilityRole="header">
                  {t.home.title || 'Eternal Bible'}
                </Animated.Text>
                <Animated.Text
                  entering={FadeIn.delay(200).duration(600)}
                  style={styles.headerSubtitle}
                  accessibilityRole="text">
                  {t.home.subtitle || 'Tu viaje espiritual continúa'}
                </Animated.Text>
              </View>
            </BlurView>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={animatedContentStyle}>
          {/* Welcome Card con Estadísticas */}
          <WelcomeCard
            userName="Bienvenido"
            subtitle="Tu viaje espiritual continúa"
            streakDays={7}
            level={5}
            progress={42}
            isDark={isDarkMode}
          />

          {/* Verso del Día */}
          {!loadingVerse && dailyVerse ? (
            <View style={{marginHorizontal: 20, marginBottom: 24}}>
              <VerseOfDayCard
                verseText={dailyVerse.text}
                reference={`${getBookName(dailyVerse.book, 'es')} ${dailyVerse.chapter}:${dailyVerse.number}`}
                title="✨ Verso del Día"
                onPress={handleVersePress}
                onShare={handleVerseShare}
                onFavorite={handleVerseFavorite}
                isDark={isDarkMode}
              />
            </View>
          ) : (
            <View style={styles.emptyVerse}>
              <Text style={styles.emptyVerseText}>
                {loadingVerse ? 'Cargando verso...' : 'No hay verso disponible'}
              </Text>
            </View>
          )}

          {/* Continue Reading */}
          {lastRead && (
            <ContinueReadingButton
              bookName={getBookName(lastRead.book, 'es')}
              chapter={lastRead.chapter}
              progress={65}
              onPress={handleContinueReading}
              buttonText={t.home.continueReading || 'Continuar Leyendo'}
              isDark={isDarkMode}
            />
          )}

          {/* Quick Access - Con animaciones staggered */}
          <Animated.View
            entering={FadeInDown.delay(400).duration(500).springify()}
            style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Acceso Rápido</Text>
            </View>

            <View style={styles.quickAccessGrid}>
              {QUICK_ACCESS_BOOKS.map((book, index) => (
                <Animated.View
                  key={book.name}
                  entering={FadeInDown.delay(500 + index * 80)
                    .duration(400)
                    .springify()}>
                  <QuickAccessButton
                    name={book.name}
                    icon={book.icon as any}
                    color={book.color}
                    onPress={() => handleNavigation(book.screen)}
                    delay={0}
                    isDark={isDarkMode}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Reading Plans - Con animaciones de entrada */}
          <Animated.View
            entering={FadeInDown.delay(700).duration(500).springify()}
            style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Planes de Lectura</Text>
              <Text
                style={styles.sectionSubtitle}
                onPress={() => handleNavigation('Plan')}>
                Ver todos
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.readingPlansScroll}>
              {READING_PLANS.map((plan, index) => (
                <Animated.View
                  key={plan.name}
                  entering={SlideInRight.delay(800 + index * 100)
                    .duration(400)
                    .springify()}>
                  <ReadingPlanCard
                    name={plan.name}
                    subtitle={plan.subtitle}
                    description={plan.description}
                    icon={plan.icon as any}
                    duration={plan.duration}
                    daysCompleted={plan.daysCompleted}
                    onPress={() => handleReadingPlanPress(plan.name)}
                    continueText="Continuar"
                    isDark={isDarkMode}
                    width={240}
                  />
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default React.memo(HomeScreen);
