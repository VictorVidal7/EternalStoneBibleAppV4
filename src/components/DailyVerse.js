import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import DailyVerseService from '../services/DailyVerseService';
import { useTranslation } from 'react-i18next';
import { AnalyticsService } from '../services/AnalyticsService';

const DailyVerse = () => {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const { colors, roundness } = useTheme();
  const { t } = useTranslation();

  const fetchDailyVerse = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const dailyVerse = await DailyVerseService.getDailyVerse();
      if (dailyVerse) {
        setVerse(dailyVerse);
        console.log('Daily verse fetched:', dailyVerse);
        AnalyticsService.logEvent('daily_verse_fetched', {
          book: dailyVerse.book,
          chapter: dailyVerse.chapter,
          verse: dailyVerse.number
        });
      } else {
        throw new Error('No se pudo obtener el versículo diario');
      }
    } catch (error) {
      console.error('Error al obtener el versículo del día:', error);
      setError(error.message);
      AnalyticsService.logEvent('daily_verse_fetch_error', { error: error.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyVerse();
  }, [fetchDailyVerse]);

  const handlePress = useCallback(() => {
    if (verse) {
      console.log('Navigating to verse:', verse);
      navigation.navigate('Biblia', {
        screen: 'Verse',
        params: { 
          book: verse.book, 
          chapter: verse.chapter, 
          verse: verse.number 
        }
      });
      AnalyticsService.logEvent('daily_verse_opened', {
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.number
      });
    }
  }, [navigation, verse]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: roundness,
      margin: 16,
      elevation: 2,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 8,
    },
    verseText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
      fontStyle: 'italic',
    },
    reference: {
      fontSize: 14,
      color: colors.secondary,
      textAlign: 'right',
    },
    errorText: {
      color: colors.error,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 10,
      padding: 10,
      backgroundColor: colors.primary,
      borderRadius: roundness,
      alignSelf: 'center',
    },
    retryButtonText: {
      color: colors.background,
      fontWeight: 'bold',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDailyVerse}>
          <Text style={styles.retryButtonText}>{t('Reintentar')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!verse) {
    return null;
  }

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      accessibilityLabel={t('Versículo diario')}
      accessibilityHint={t('Toca para ver el versículo completo')}
    >
      <Text style={styles.title}>{t('Versículo del día')}</Text>
      <Text style={styles.verseText}>{verse.text}</Text>
      <Text style={styles.reference}>
        {verse.book} {verse.chapter}:{verse.number}
      </Text>
    </TouchableOpacity>
  );
};

export default React.memo(DailyVerse);