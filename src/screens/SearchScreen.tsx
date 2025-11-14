import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../hooks/useLanguage';
import {useStyles} from '../hooks/useStyles';
import {searchBible} from '../services/bibleDataManager';
import {getBookName} from '../data/bookNames';
import CustomIconButton from '../components/CustomIconButton';
import HapticFeedback from '../services/HapticFeedback';
import {AnalyticsService} from '../services/AnalyticsService';
import {logger} from '../lib/utils/logger';

// Interfaces
interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

interface RenderItemProps {
  item: SearchResult;
  index: number;
}

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const styles = useStyles(createStyles);

  const handleSearch = useCallback(async () => {
    if (query.length < 3) {
      logger.breadcrumb('Search query too short', 'search', {
        queryLength: query.length,
        screen: 'SearchScreen',
      });
      return;
    }

    setIsLoading(true);

    logger.breadcrumb('Search initiated', 'search', {
      query,
      screen: 'SearchScreen',
    });

    try {
      const startTime = Date.now();
      const searchResults = await searchBible(query);
      const duration = Date.now() - startTime;

      setResults(searchResults);

      // Log analytics
      AnalyticsService.logEvent('search_performed', {
        query,
        resultsCount: searchResults.length,
      });

      // Log performance
      logger.performance('Bible search', duration, {
        query,
        resultsCount: searchResults.length,
        screen: 'SearchScreen',
      });

      // Haptic feedback
      HapticFeedback.light();

      // Accessibility announcement
      const announcement =
        searchResults.length === 1
          ? t.search.noResults // Using existing translation for 1 result case
          : `${t.search.results}: ${searchResults.length}`;

      AccessibilityInfo.announceForAccessibility(announcement);

      logger.breadcrumb('Search completed successfully', 'search', {
        query,
        resultsCount: searchResults.length,
        duration,
        screen: 'SearchScreen',
      });
    } catch (error) {
      logger.error('Error searching the Bible', error as Error, {
        query,
        screen: 'SearchScreen',
        action: 'handleSearch',
      });

      setResults([]);
      AccessibilityInfo.announceForAccessibility(t.error);
    } finally {
      setIsLoading(false);
    }
  }, [query, t]);

  // Debounce search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 3) {
        handleSearch();
      } else if (query.length > 0) {
        // Clear results if query is too short
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, handleSearch]);

  const handleResultPress = useCallback(
    (item: SearchResult) => {
      HapticFeedback.light();

      logger.breadcrumb('Search result selected', 'navigation', {
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
        query,
        screen: 'SearchScreen',
      });

      AnalyticsService.logEvent('search_result_selected', {
        book: item.book,
        chapter: item.chapter,
        verse: item.verse,
      });

      navigation.navigate('Biblia', {
        screen: 'Verse',
        params: {book: item.book, chapter: item.chapter, verse: item.verse},
      });
    },
    [navigation, query],
  );

  const handleClearQuery = useCallback(() => {
    setQuery('');
    setResults([]);
    HapticFeedback.light();

    logger.breadcrumb('Search query cleared', 'user-action', {
      screen: 'SearchScreen',
    });
  }, []);

  const renderItem = useCallback(
    ({item}: RenderItemProps) => {
      const bookName = getBookName(item.book, language);
      const referenceText = `${bookName} ${item.chapter}:${item.verse}`;

      return (
        <TouchableOpacity
          style={styles.resultItem}
          onPress={() => handleResultPress(item)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${referenceText}. ${item.text}`}
          accessibilityHint={t.bible.tapToRead}>
          <Text style={styles.resultReference}>{referenceText}</Text>
          <Text style={styles.resultText} numberOfLines={2}>
            {item.text}
          </Text>
        </TouchableOpacity>
      );
    },
    [styles, language, handleResultPress, t],
  );

  const keyExtractor = useCallback(
    (item: SearchResult, index: number) =>
      `${item.book}-${item.chapter}-${item.verse}-${index}`,
    [],
  );

  const renderEmptyComponent = useMemo(() => {
    const emptyText = query.length < 3 ? t.search.minChars : t.search.noResults;
    const emptyHint =
      query.length < 3 ? t.search.minChars : t.search.tryDifferent;

    return (
      <Text
        style={[styles.emptyResult, {color: colors.text}]}
        accessible={true}
        accessibilityLabel={emptyText}
        accessibilityHint={emptyHint}>
        {emptyText}
      </Text>
    );
  }, [query, t, styles, colors]);

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background}]}
      accessible={true}
      accessibilityLabel={t.search.title}
      accessibilityHint={t.search.initialSubtitle}>
      <View style={styles.searchInputContainer}>
        <CustomIconButton
          name="search"
          color={colors.primary}
          onPress={handleSearch}
          style={undefined}
          accessibilityLabel={t.search.title}
          accessibilityHint={t.search.placeholder}
        />
        <TextInput
          style={[styles.searchInput, {color: colors.text}]}
          value={query}
          onChangeText={setQuery}
          placeholder={t.search.placeholder}
          placeholderTextColor={colors.secondary}
          accessible={true}
          accessibilityLabel={t.search.placeholder}
          accessibilityHint={t.search.minChars}
          accessibilityRole="search"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <CustomIconButton
            name="close"
            color={colors.secondary}
            onPress={handleClearQuery}
            style={undefined}
            accessibilityLabel={t.cancel}
            accessibilityHint="Clear search query"
          />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
          accessible={true}
          accessibilityLabel={t.loading}
        />
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={renderEmptyComponent}
          accessible={true}
          accessibilityLabel="Search results list"
          accessibilityHint="Scroll to explore search results"
          contentContainerStyle={
            results.length === 0 ? styles.emptyListContainer : undefined
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

const createStyles = (colors: any, fontSize: number, fontFamily: string) =>
  StyleSheet.create({
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
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
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
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 1,
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
      lineHeight: fontSize * 1.4,
    },
    emptyResult: {
      textAlign: 'center',
      marginTop: 32,
      fontFamily,
      fontSize: fontSize,
    },
    emptyListContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    loader: {
      marginTop: 32,
    },
  });

export default React.memo(SearchScreen);
