import React, {useEffect, useCallback, useState, useMemo} from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../hooks/useLanguage';
import {useScreenReaderListener} from '../hooks/useScreenReaderListener';
import CustomIconButton from '../components/CustomIconButton';
import DailyVerse from '../components/DailyVerse';
import {useReadingProgress} from '../context/ReadingProgressContext';
import HapticFeedback from '../services/HapticFeedback';
import {logger} from '../lib/utils/logger';

const {width} = Dimensions.get('window');

interface MenuItem {
  title: string;
  icon: string;
  screen: string;
}

interface LastReadPosition {
  book: string;
  chapter: number;
  verse: number;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {colors, isDarkMode} = useTheme();
  const {t} = useLanguage();
  const readingProgressContext = useReadingProgress();
  const [lastRead, setLastRead] = useState<LastReadPosition | null>(null);
  const screenReaderEnabled = useScreenReaderListener();

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const translateY = useMemo(() => new Animated.Value(50), []);

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Load last read position
    const loadLastRead = async () => {
      try {
        if (
          readingProgressContext &&
          typeof readingProgressContext.getLastReadPosition === 'function'
        ) {
          const position = await readingProgressContext.getLastReadPosition();
          if (position) {
            setLastRead(position);
          }
        }
      } catch (error) {
        logger.error('Error loading last read position', error as Error, {
          screen: 'HomeScreen',
          action: 'loadLastRead',
        });
      }
    };

    loadLastRead();
  }, [readingProgressContext, fadeAnim, translateY]);

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        title: t('home.menu.exploreBible'),
        icon: 'book',
        screen: 'Biblia',
      },
      {
        title: t('home.menu.favorites'),
        icon: 'bookmark',
        screen: 'Favoritos',
      },
      {
        title: t('home.menu.readingPlan'),
        icon: 'event-note',
        screen: 'Plan',
      },
      {
        title: t('home.menu.notes'),
        icon: 'note',
        screen: 'Notas',
      },
      {
        title: t('home.menu.search'),
        icon: 'search',
        screen: 'Buscar',
      },
    ],
    [t],
  );

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

  const handleStartReading = useCallback(() => {
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

    logger.breadcrumb('Start reading', 'user-action', {
      hasLastRead: !!lastRead,
      screen: 'HomeScreen',
    });
  }, [navigation, lastRead]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: isDarkMode ? '#1A1A1E' : '#F5F5F7',
        },
        contentContainer: {
          flexGrow: 1,
        },
        gradientHeader: {
          height: 120,
        },
        header: {
          padding: 15,
          paddingTop: (StatusBar.currentHeight || 0) + 10,
        },
        headerTitle: {
          fontSize: 32,
          fontWeight: '800',
          color: '#FFFFFF',
          marginBottom: 6,
          letterSpacing: -0.5,
        },
        headerSubtitle: {
          fontSize: 16,
          fontWeight: '500',
          color: 'rgba(255, 255, 255, 0.9)',
        },
        section: {
          marginHorizontal: 20,
          marginTop: 8,
          marginBottom: 20,
        },
        sectionTitle: {
          fontSize: 24,
          fontWeight: '700',
          color: colors.text,
          marginBottom: 16,
          letterSpacing: -0.5,
        },
        startReadingButton: {
          backgroundColor: '#34C759',
          padding: 18,
          borderRadius: 16,
          alignItems: 'center',
          marginVertical: 20,
          borderWidth: 0,
          shadowColor: '#34C759',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 5,
        },
        startReadingText: {
          color: '#FFFFFF',
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        menuGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          marginTop: 20,
        },
        menuItem: {
          width: (width - 60) / 2,
          aspectRatio: 1,
          backgroundColor: isDarkMode ? '#2A2A3E' : '#FFFFFF',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 0,
          shadowColor: '#000000',
          shadowOffset: {width: 0, height: 3},
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 15,
          elevation: 4,
        },
        menuItemText: {
          marginTop: 12,
          fontSize: 15,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          letterSpacing: -0.2,
        },
      }),
    [isDarkMode, colors],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      accessible={true}
      accessibilityLabel={t('home.a11y.screenLabel')}
      accessibilityHint={t('home.a11y.screenHint')}>
      <StatusBar
        backgroundColor={isDarkMode ? '#1E3A5F' : '#4A90E2'}
        barStyle="light-content"
      />

      <LinearGradient
        colors={
          isDarkMode
            ? ['#1E3A5F', '#2C4B73', '#3A5C87']
            : ['#4A90E2', '#5B9FED', '#6EADFF']
        }
        style={styles.gradientHeader}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            {t('home.title')}
          </Text>
          <Text style={styles.headerSubtitle} accessibilityRole="text">
            {t('home.subtitle')}
          </Text>
        </View>
      </LinearGradient>

      <Animated.View style={{opacity: fadeAnim, transform: [{translateY}]}}>
        <DailyVerse />
      </Animated.View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.startReadingButton}
          onPress={handleStartReading}
          accessibilityRole="button"
          accessibilityLabel={
            lastRead ? t('home.continueReading') : t('home.startReading')
          }
          accessibilityHint={t('home.a11y.startReadingHint')}>
          <Text style={styles.startReadingText}>
            {lastRead ? t('home.continueReading') : t('home.startReading')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle} accessibilityRole="header">
          {t('home.quickAccess')}
        </Text>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => handleNavigation(item.screen)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityHint={`${t('home.a11y.navigateHint')} ${item.title}`}>
              <CustomIconButton
                name={item.icon}
                color={colors.primary}
                size={32}
                accessibilityLabel={item.title}
              />
              <Text style={styles.menuItemText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default React.memo(HomeScreen);
