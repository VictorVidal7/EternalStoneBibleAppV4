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
          backgroundColor: isDarkMode ? '#121212' : '#F5F5F5',
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
          fontSize: 28,
          fontWeight: 'bold',
          color: isDarkMode ? '#FFFFFF' : '#000000',
          marginBottom: 4,
        },
        headerSubtitle: {
          fontSize: 16,
          color: isDarkMode ? '#CCCCCC' : '#666666',
          opacity: 0.8,
        },
        section: {
          margin: 20,
        },
        sectionTitle: {
          fontSize: 22,
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: 15,
        },
        startReadingButton: {
          backgroundColor: colors.primary,
          padding: 15,
          borderRadius: 12,
          alignItems: 'center',
          marginVertical: 20,
        },
        startReadingText: {
          color: '#FFFFFF',
          fontSize: 18,
          fontWeight: 'bold',
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
          backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          borderRadius: 12,
          padding: 15,
          marginBottom: 20,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: 2},
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        menuItemText: {
          marginTop: 10,
          fontSize: 14,
          color: colors.text,
          textAlign: 'center',
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
        backgroundColor={colors.primary}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <LinearGradient
        colors={[colors.primary, isDarkMode ? '#121212' : '#F5F5F5']}
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
