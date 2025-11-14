import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import bibleDB from '../../src/lib/database';
import { BibleVerse, ReadingProgress } from '../../src/types/bible';
import { READING_PLANS } from '../../src/constants/reading-plans';
import { useTheme } from '../../src/hooks/useTheme';
import { useBibleVersion } from '../../src/hooks/useBibleVersion';
import { useServices } from '../../src/context/ServicesContext';
import { useLanguage } from '../../src/hooks/useLanguage';

export default function HomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { selectedVersion } = useBibleVersion();
  const { achievementService, initialized: servicesInitialized } = useServices();
  const { t } = useLanguage();
  const [dailyVerse, setDailyVerse] = useState<BibleVerse | null>(null);
  const [lastRead, setLastRead] = useState<ReadingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [selectedVersion.id]);

  async function loadHomeData() {
    try {
      await bibleDB.initialize();

      // Get daily verse (random for now, can be improved with actual daily logic)
      const verse = await bibleDB.getRandomVerse(selectedVersion.id);
      setDailyVerse(verse);

      // Get last reading position
      const progress = await bibleDB.getReadingProgress();
      setLastRead(progress);

      setLoading(false);
    } catch (error) {
      console.error('Error loading home data:', error);
      setLoading(false);
    }
  }

  function goToLastRead() {
    if (lastRead) {
      router.push(`/verse/${lastRead.book}/${lastRead.chapter}` as any);
    }
  }

  function goToBook(bookName: string) {
    router.push(`/chapter/${bookName}` as any);
  }

  async function testAchievements() {
    if (!achievementService || !servicesInitialized) {
      Alert.alert(t.achievements.title, t.achievements.loading);
      return;
    }

    try {
      // Simular lectura de 10 versículos
      const achievements = await achievementService.trackVersesRead(10, 5);

      if (achievements.length > 0) {
        Alert.alert(
          `${t.achievements.unlockTitle} 🎉`,
          `${t.achievements.unlockMessage} ${achievements.map(a => a.name).join(', ')}`,
          [
            { text: t.achievements.viewAchievements, onPress: () => router.push('/achievements' as any) },
            { text: t.achievements.ok }
          ]
        );
      } else {
        const stats = await achievementService.getUserStats();
        const message = t.achievements.readingStats
          .replace('{{verses}}', stats.totalVersesRead.toString())
          .replace('{{level}}', stats.level.toString())
          .replace('{{points}}', stats.totalPoints.toString());

        Alert.alert(
          `${t.achievements.readingRegistered} ✓`,
          message,
          [
            { text: t.achievements.viewAchievements, onPress: () => router.push('/achievements' as any) },
            { text: t.achievements.ok }
          ]
        );
      }
    } catch (error) {
      console.error('Error testing achievements:', error);
      Alert.alert(t.error, t.achievements.errorTracking);
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const themedStyles = createThemedStyles(colors);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
      {/* Welcome Section */}
      <View style={themedStyles.welcomeCard}>
        <Text style={themedStyles.welcomeTitle}>{t.home.welcome}</Text>
        <Text style={themedStyles.welcomeSubtitle}>
          {t.home.subtitle}
        </Text>
      </View>

      {/* Daily Verse */}
      {dailyVerse && (
        <View style={themedStyles.card}>
          <View style={themedStyles.cardHeader}>
            <Ionicons name="sparkles" size={20} color={colors.warning} />
            <Text style={themedStyles.cardTitle}>{t.home.dailyVerse}</Text>
          </View>

          <Text style={themedStyles.verseText}>"{dailyVerse.text}"</Text>

          <Text style={themedStyles.verseReference}>
            {dailyVerse.book} {dailyVerse.chapter}:{dailyVerse.verse}
          </Text>

          <TouchableOpacity
            style={themedStyles.verseButton}
            onPress={() => router.push(`/verse/${dailyVerse.book}/${dailyVerse.chapter}` as any)}
          >
            <Text style={themedStyles.verseButtonText}>{t.home.readFullChapter}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Continue Reading */}
      {lastRead && (
        <TouchableOpacity style={themedStyles.card} onPress={goToLastRead}>
          <View style={themedStyles.cardHeader}>
            <Ionicons name="book-outline" size={20} color={colors.success} />
            <Text style={themedStyles.cardTitle}>{t.home.continueReading}</Text>
          </View>

          <Text style={themedStyles.continueText}>
            {lastRead.book} {lastRead.chapter}:{lastRead.verse}
          </Text>

          <View style={themedStyles.continueButton}>
            <Text style={themedStyles.continueButtonText}>{t.home.continue}</Text>
            <Ionicons name="play-circle" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Reading Plans */}
      <View style={themedStyles.card}>
        <View style={themedStyles.cardHeader}>
          <Ionicons name="calendar-outline" size={20} color={colors.accent} />
          <Text style={themedStyles.cardTitle}>{t.home.readingPlans}</Text>
        </View>

        <Text style={themedStyles.sectionDescription}>
          {t.home.plansDescription}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.plansScrollView}
          contentContainerStyle={styles.plansScrollContent}
        >
          {READING_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[themedStyles.planCard, { borderLeftColor: plan.color }]}
              onPress={() => {
                // TODO: Navigate to plan details
                router.push(`/chapter/${plan.days[0].readings[0].book}` as any);
              }}
            >
              <View style={[styles.planIcon, { backgroundColor: plan.color + '20' }]}>
                <Ionicons name={plan.icon as any} size={24} color={plan.color} />
              </View>
              <Text style={themedStyles.planName} numberOfLines={2}>
                {plan.name}
              </Text>
              <Text style={themedStyles.planDuration}>{plan.duration} {t.home.days}</Text>
              <Text style={themedStyles.planDescription} numberOfLines={2}>
                {plan.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Access */}
      <View style={themedStyles.card}>
        <View style={themedStyles.cardHeader}>
          <Ionicons name="flash" size={20} color={colors.error} />
          <Text style={themedStyles.cardTitle}>{t.home.quickAccess}</Text>
        </View>

        <View style={styles.quickAccessGrid}>
          <TouchableOpacity
            style={themedStyles.quickAccessItem}
            onPress={() => goToBook('Génesis')}
          >
            <Ionicons name="star" size={28} color="#3498DB" />
            <Text style={themedStyles.quickAccessText}>Génesis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={themedStyles.quickAccessItem}
            onPress={() => goToBook('Salmos')}
          >
            <Ionicons name="musical-notes" size={28} color="#9B59B6" />
            <Text style={themedStyles.quickAccessText}>Salmos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={themedStyles.quickAccessItem}
            onPress={() => goToBook('Proverbios')}
          >
            <Ionicons name="bulb" size={28} color="#F39C12" />
            <Text style={themedStyles.quickAccessText}>Proverbios</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={themedStyles.quickAccessItem}
            onPress={() => goToBook('Juan')}
          >
            <Ionicons name="heart" size={28} color="#E74C3C" />
            <Text style={themedStyles.quickAccessText}>Juan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={themedStyles.quickAccessItem}
            onPress={() => goToBook('Romanos')}
          >
            <Ionicons name="book" size={28} color="#1ABC9C" />
            <Text style={themedStyles.quickAccessText}>Romanos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={themedStyles.quickAccessItem}
            onPress={() => goToBook('Apocalipsis')}
          >
            <Ionicons name="flame" size={28} color="#E67E22" />
            <Text style={themedStyles.quickAccessText}>Apocalipsis</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Demo Button - Prueba el sistema de logros */}
      {servicesInitialized && achievementService && (
        <TouchableOpacity
          style={[themedStyles.card, { backgroundColor: '#FFF3CD', borderWidth: 2, borderColor: '#FFD700' }]}
          onPress={testAchievements}
        >
          <View style={themedStyles.cardHeader}>
            <Ionicons name="trophy" size={20} color="#F39C12" />
            <Text style={[themedStyles.cardTitle, { color: '#856404' }]}>{t.achievements.testButton}</Text>
          </View>
          <Text style={{ fontSize: 14, color: '#856404', marginBottom: 12 }}>
            {t.achievements.testDescription} 🎮
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F39C12',
            borderRadius: 8,
            paddingVertical: 12,
          }}>
            <Text style={{ fontSize: 16, color: '#FFFFFF', fontWeight: 'bold', marginRight: 8 }}>
              {t.achievements.simulateReading}
            </Text>
            <Ionicons name="play-circle" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Footer Quote */}
      <View style={styles.footerQuote}>
        <Text style={themedStyles.footerQuoteText}>
          {t.home.footerQuote}
        </Text>
      </View>
    </ScrollView>
  );
}

function createThemedStyles(colors: any) {
  return StyleSheet.create({
    welcomeCard: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 24,
      marginBottom: 16,
      alignItems: 'center' as const,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: '#FFFFFF',
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    welcomeSubtitle: {
      fontSize: 16,
      color: '#ECF0F1',
      textAlign: 'center' as const,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.text,
      marginLeft: 8,
    },
    verseText: {
      fontSize: 16,
      lineHeight: 26,
      color: colors.text,
      fontStyle: 'italic' as const,
      marginBottom: 12,
    },
    verseReference: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600' as const,
      marginBottom: 16,
    },
    verseButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 10,
    },
    verseButtonText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: '600' as const,
      marginRight: 6,
    },
    continueText: {
      fontSize: 20,
      color: colors.text,
      fontWeight: '600' as const,
      marginBottom: 16,
    },
    continueButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.success,
      borderRadius: 8,
      paddingVertical: 12,
    },
    continueButtonText: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: 'bold' as const,
      marginRight: 8,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    planCard: {
      width: 200,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      marginRight: 12,
      borderLeftWidth: 4,
    },
    planName: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: colors.text,
      marginBottom: 6,
      minHeight: 40,
    },
    planDuration: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '600' as const,
      marginBottom: 8,
    },
    planDescription: {
      fontSize: 13,
      color: colors.textTertiary,
      lineHeight: 18,
    },
    quickAccessItem: {
      width: '30%',
      margin: '1.66%' as any,
      aspectRatio: 1,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickAccessText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '600' as const,
      marginTop: 8,
      textAlign: 'center' as const,
    },
    footerQuoteText: {
      fontSize: 13,
      color: colors.textTertiary,
      fontStyle: 'italic' as const,
    },
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  plansScrollView: {
    marginHorizontal: -20,
    marginBottom: -10,
  },
  plansScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerQuote: {
    alignItems: 'center',
    marginTop: 20,
  },
});
