import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, AccessibilityInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStyles } from '../hooks/useStyles';
import { useScreenReaderListener } from '../hooks/useScreenReaderListener';
import { searchBible } from '../services/bibleDataManager';
import { getBookName } from '../data/bookNames';
import { useTranslation } from 'react-i18next';
import { withTheme } from '../hoc/withTheme';
import { AnalyticsService } from '../services/AnalyticsService';
import CustomIconButton from '../components/CustomIconButton';
import HapticFeedback from '../services/HapticFeedback';

const SearchScreen = ({ theme }) => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const screenReaderEnabled = useScreenReaderListener();
  const { colors } = theme;
  const styles = useStyles(createStyles);
  const { t, i18n } = useTranslation();

  const handleSearch = useCallback(async () => {
    if (query.length < 3) return;
    setIsLoading(true);
    try {
      const searchResults = await searchBible(query);
      setResults(searchResults);
      AnalyticsService.logEvent('search_performed', { query, resultsCount: searchResults.length });
      HapticFeedback.light();
      AccessibilityInfo.announceForAccessibility(t('Búsqueda completada. Se encontraron {{count}} resultados', { count: searchResults.length }));
    } catch (error) {
      console.error('Error searching the Bible:', error);
      setResults([]);
      AccessibilityInfo.announceForAccessibility(t('Error al realizar la búsqueda'));
    } finally {
      setIsLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 3) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, handleSearch]);

  const renderItem = useCallback(({ item }) => {
    const bookName = getBookName(item.book, i18n.language);
    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => {
          navigation.navigate('Biblia', {
            screen: 'Verse',
            params: { book: item.book, chapter: item.chapter, verse: item.verse }
          });
          AnalyticsService.logEvent('search_result_selected', { book: item.book, chapter: item.chapter, verse: item.verse });
          HapticFeedback.light();
        }}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t('{{book}} capítulo {{chapter}}, versículo {{verse}}', { book: bookName, chapter: item.chapter, verse: item.verse })}
        accessibilityHint={t('Toca para ir a este versículo')}
      >
        <Text style={styles.resultReference}>{bookName} {item.chapter}:{item.verse}</Text>
        <Text style={styles.resultText} numberOfLines={2}>{item.text}</Text>
      </TouchableOpacity>
    );
  }, [navigation, styles, t, i18n.language]);

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
      accessible={true}
      accessibilityLabel={t('Pantalla de búsqueda')}
      accessibilityHint={t('Ingresa texto para buscar en la Biblia')}
    >
      <View style={styles.searchInputContainer}>
        <CustomIconButton 
          name="search" 
          color={colors.primary} 
          onPress={handleSearch}
          accessibilityLabel={t('Buscar')}
          accessibilityHint={t('Realizar búsqueda')}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder={t('Buscar en la Biblia')}
          placeholderTextColor={colors.secondary}
          accessibilityLabel={t('Campo de búsqueda')}
          accessibilityHint={t('Ingresa texto para buscar en la Biblia')}
        />
        {query.length > 0 && (
          <CustomIconButton 
            name="close" 
            color={colors.secondary} 
            onPress={() => {
              setQuery('');
              HapticFeedback.light();
            }}
            accessibilityLabel={t('Limpiar búsqueda')}
            accessibilityHint={t('Borrar el texto de búsqueda')}
          />
        )}
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} accessibilityLabel={t('Cargando resultados')} />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.book}-${item.chapter}-${item.verse}-${index}`}
          ListEmptyComponent={
            <Text 
              style={[styles.emptyResult, { color: colors.text }]}
              accessibilityLabel={query.length < 3 ? t('Escribe al menos 3 letras') : t('No se encontraron resultados')}
            >
              {query.length < 3 ? t('Escribe al menos 3 letras') : t('No se encontraron resultados')}
            </Text>
          }
          accessible={true}
          accessibilityLabel={t('Lista de resultados de búsqueda')}
          accessibilityHint={t('Desplázate para explorar los resultados')}
        />
      )}
    </View>
  );
};

const createStyles = (colors, fontSize, fontFamily) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: colors.card,
    borderRadius: 25,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: fontSize,
    fontFamily,
    marginLeft: 8,
  },
  resultItem: {
    backgroundColor: colors.card,
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  resultReference: {
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
    fontFamily,
    fontSize: fontSize,
  },
  resultText: {
    color: colors.text,
    fontFamily,
    fontSize: fontSize - 2,
  },
  emptyResult: {
    textAlign: 'center',
    marginTop: 32,
    fontFamily,
    fontSize: fontSize,
  },
  loader: {
    marginTop: 32,
  },
});

export default withTheme(React.memo(SearchScreen));