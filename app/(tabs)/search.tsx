/* eslint-disable react-native/no-unused-styles -- styles consumed via a
   themed-styles factory; the linter cannot trace factory returns. */
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {staticColors} from '@/styles/designTokens';

import React, {useState, useCallback, useMemo, useEffect, memo} from 'react';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useDebouncedCallback} from 'use-debounce';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bibleDB from '@lib/database';
import {BibleVerse} from '@/types/bible';
import {useTheme, ThemeColors} from '@hooks/useTheme';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useLanguage} from '@hooks/useLanguage';
import {translations} from '@/i18n/translations';
import {IllustratedEmptyState} from '@components/IllustratedEmptyState';
import {VerseSkeleton} from '@components/SkeletonLoader';
import {
  applyTestamentFilter,
  type TestamentFilter,
} from '@/lib/search/testamentFilter';

// Tope de filas que devuelve searchVerses; al alcanzarlo el conteo se muestra
// como "200+" porque puede haber más resultados sin cargar.
const SEARCH_RESULT_LIMIT = 200;

// Recent searches: persisted to AsyncStorage so the chips survive relaunches.
// Capped at 8 to keep the empty-state screen tidy.
const SEARCH_HISTORY_KEY = '@bible_search_history';
const MAX_SEARCH_HISTORY = 8;

/**
 * Create themed styles for the search screen
 */
function createThemedStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    searchContainer: {
      backgroundColor: colors.surface,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    hint: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
    },
    versionBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    versionBadgeText: {
      fontSize: 11,
      fontWeight: '600' as const,
      // En modo oscuro usar color oscuro para contrastar con fondo claro
      color: isDark ? colors.primaryDark : colors.primary,
    },
    filterButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: staticColors.white,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
    resultsHeader: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultsCount: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    resultItem: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: staticColors.black,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    resultReference: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    resultText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.text,
    },
    highlightedText: {
      backgroundColor: colors.highlight,
      fontWeight: '600' as const,
      color: colors.text,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: 'center' as const,
    },
    emptyHint: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 8,
    },
    initialTitle: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: colors.text,
      marginTop: 20,
    },
    initialSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center' as const,
    },
    suggestionsTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    suggestionChip: {
      backgroundColor: colors.primaryLight,
      borderRadius: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      marginBottom: 10,
      marginHorizontal: 5,
    },
    suggestionText: {
      fontSize: 15,
      // En modo oscuro usar color oscuro para contrastar con fondo claro
      color: isDark ? colors.primaryDark : colors.primary,
      fontWeight: '500' as const,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
  });
}

/**
 * Optimized highlighting function
 */
function getHighlightedText(text: string, query: string) {
  if (!query.trim()) return [{text, highlight: false}];

  const words = query
    .toLowerCase()
    .split(' ')
    .filter(w => w.length > 0);
  const parts: {text: string; highlight: boolean}[] = [];
  let lastIndex = 0;
  const lowerText = text.toLowerCase();

  // Encontrar todas las coincidencias
  const matches: {start: number; end: number}[] = [];
  words.forEach(word => {
    let index = 0;
    while ((index = lowerText.indexOf(word, index)) !== -1) {
      matches.push({start: index, end: index + word.length});
      index += word.length;
    }
  });

  if (matches.length === 0) return [{text, highlight: false}];

  // Ordenar y fusionar coincidencias superpuestas
  matches.sort((a, b) => a.start - b.start);
  const mergedMatches: {start: number; end: number}[] = [];
  matches.forEach(match => {
    if (mergedMatches.length === 0) {
      mergedMatches.push(match);
    } else {
      const last = mergedMatches[mergedMatches.length - 1];
      if (match.start <= last.end) {
        last.end = Math.max(last.end, match.end);
      } else {
        mergedMatches.push(match);
      }
    }
  });

  // Crear partes con highlights
  mergedMatches.forEach(match => {
    if (match.start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, match.start),
        highlight: false,
      });
    }
    parts.push({text: text.slice(match.start, match.end), highlight: true});
    lastIndex = match.end;
  });

  if (lastIndex < text.length) {
    parts.push({text: text.slice(lastIndex), highlight: false});
  }

  return parts;
}

/**
 * Memoized list item to prevent re-renders during search
 */
const VerseResultItem = memo(
  ({
    item,
    searchQuery,
    onPress,
    themedStyles,
    colors,
  }: {
    item: BibleVerse;
    searchQuery: string;
    onPress: () => void;
    themedStyles: ReturnType<typeof createThemedStyles>;
    colors: ThemeColors;
  }) => {
    return (
      <TouchableOpacity
        style={themedStyles.resultItem}
        onPress={onPress}
        activeOpacity={0.7}>
        <View style={themedStyles.resultHeader}>
          <Text style={themedStyles.resultReference}>
            {item.book} {item.chapter}:{item.verse}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textTertiary}
          />
        </View>

        <Text style={themedStyles.resultText} numberOfLines={3}>
          {getHighlightedText(item.text, searchQuery).map((part, index) => (
            <Text
              key={index}
              style={part.highlight ? themedStyles.highlightedText : undefined}>
              {part.text}
            </Text>
          ))}
        </Text>
      </TouchableOpacity>
    );
  },
);

export default function SearchScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#4f46e5', '#7c3aed', '#a855f7']) as [string, string, string],
    [gradient?.headerColors],
  );
  const {selectedVersion} = useBibleVersion();
  const {t} = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [allResults, setAllResults] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [testamentFilter, setTestamentFilter] =
    useState<TestamentFilter>('all');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  // Pagination state: hasMore is "the last fetched page filled the page
  // size, so there may be more rows behind the cursor"; loadingMore
  // gates the footer button while the next page is in flight.
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Hydrate recent searches from storage on mount.
  useEffect(() => {
    AsyncStorage.getItem(SEARCH_HISTORY_KEY)
      .then(raw => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSearchHistory(
              parsed
                .filter((x): x is string => typeof x === 'string')
                .slice(0, MAX_SEARCH_HISTORY),
            );
          }
        } catch {
          // Ignore corrupted history — it's a UX nicety, not critical data.
        }
      })
      .catch(() => undefined);
  }, []);

  const persistHistory = useCallback((next: string[]) => {
    setSearchHistory(next);
    AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)).catch(
      () => undefined,
    );
  }, []);

  // Add a query to recent searches: dedupe (case-insensitive), trim, MRU order.
  const recordSearch = useCallback((rawQuery: string) => {
    const query = rawQuery.trim();
    if (query.length < 3) return;
    setSearchHistory(prev => {
      const lower = query.toLowerCase();
      const filtered = prev.filter(q => q.toLowerCase() !== lower);
      const next = [query, ...filtered].slice(0, MAX_SEARCH_HISTORY);
      AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next)).catch(
        () => undefined,
      );
      return next;
    });
  }, []);

  const removeHistoryEntry = useCallback(
    (query: string) => {
      persistHistory(searchHistory.filter(q => q !== query));
    },
    [searchHistory, persistHistory],
  );

  const clearHistory = useCallback(() => {
    persistHistory([]);
  }, [persistHistory]);

  const performSearch = useCallback(
    async (query: string) => {
      if (query.trim().length < 3) {
        setResults([]);
        setAllResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      setLoadingMore(false);

      try {
        await bibleDB.initialize();
        const searchResults = await bibleDB.searchVerses(
          query,
          selectedVersion.id,
          SEARCH_RESULT_LIMIT,
        );
        setAllResults(searchResults);
        setResults(applyTestamentFilter(searchResults, testamentFilter));
        // A filled page is the only signal we have that more rows may
        // exist behind the cursor; a short page tells us we've hit the
        // end of the result set for this query+version.
        setHasMore(searchResults.length >= SEARCH_RESULT_LIMIT);
        // Only successful searches earn a slot in history — typos and
        // wrong-version queries (0 results) would just clutter it.
        if (searchResults.length > 0) {
          recordSearch(query);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setAllResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [testamentFilter, applyTestamentFilter, selectedVersion.id, recordSearch],
  );

  const loadMoreResults = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    if (!searchQuery.trim() || searchQuery.trim().length < 3) return;
    setLoadingMore(true);
    try {
      await bibleDB.initialize();
      const nextPage = await bibleDB.searchVerses(
        searchQuery.trim(),
        selectedVersion.id,
        SEARCH_RESULT_LIMIT,
        allResults.length,
      );
      if (nextPage.length === 0) {
        setHasMore(false);
        return;
      }
      const combined = [...allResults, ...nextPage];
      setAllResults(combined);
      setResults(applyTestamentFilter(combined, testamentFilter));
      // A short page means we've drained the result set.
      setHasMore(nextPage.length >= SEARCH_RESULT_LIMIT);
    } catch (error) {
      console.error('Load-more error:', error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [
    loadingMore,
    hasMore,
    searchQuery,
    selectedVersion.id,
    allResults,
    applyTestamentFilter,
    testamentFilter,
  ]);

  const debouncedSearch = useDebouncedCallback(performSearch, 500);

  function handleSearchChange(text: string) {
    setSearchQuery(text);
    debouncedSearch(text);
  }

  function handleFilterChange(filter: TestamentFilter) {
    setTestamentFilter(filter);
    setResults(applyTestamentFilter(allResults, filter));
  }

  async function onRefresh() {
    if (!searchQuery.trim() || searchQuery.trim().length < 3) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    await performSearch(searchQuery);
    setRefreshing(false);
  }

  function goToVerse(verse: BibleVerse) {
    router.push(
      `/verse/${verse.book}/${verse.chapter}?verse=${verse.verse}` as never,
    );
  }

  const themedStyles = useMemo(
    () => createThemedStyles(colors, isDark),
    [colors, isDark],
  );

  // While more rows may exist behind the cursor, present the count as
  // "N+" so the user knows there are unseen matches; once load-more
  // drains the result set, the suffix vanishes and we show the exact
  // total they've actually loaded.
  const resultsCountLabel = `${results.length}${hasMore ? '+' : ''} ${t.search.results}`;

  const renderItem = useCallback(
    ({item}: {item: BibleVerse}) => (
      <VerseResultItem
        item={item}
        searchQuery={searchQuery}
        onPress={() => goToVerse(item)}
        themedStyles={themedStyles}
        colors={colors}
      />
    ),
    [searchQuery, themedStyles, colors, goToVerse],
  );

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}>
        {/* No back button — this is a root tab; bottom bar is the nav. */}

        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="search" size={32} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t.tabs.search}
            </Text>
            <Text style={styles.headerSubtitle}>
              {results.length > 0
                ? resultsCountLabel
                : hasSearched
                  ? t.search.noResults
                  : t.search.readyToSearch}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search Input */}
      <View style={themedStyles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, {color: colors.text}]}
            placeholder={t.search.placeholder}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.hintRow}>
          <Text style={themedStyles.hint}>{t.search.minChars}</Text>
          <View style={themedStyles.versionBadge}>
            <Ionicons
              name="book-outline"
              size={12}
              color={isDark ? colors.primaryDark : colors.primary}
            />
            <Text style={themedStyles.versionBadgeText}>
              {selectedVersion.abbreviation}
            </Text>
          </View>
        </View>

        {/* Testament Filters */}
        {hasSearched && (
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[
                themedStyles.filterButton,
                testamentFilter === 'all' && themedStyles.filterButtonActive,
              ]}
              onPress={() => handleFilterChange('all')}>
              <Text
                style={[
                  themedStyles.filterText,
                  testamentFilter === 'all' && themedStyles.filterTextActive,
                ]}>
                {t.search.testament.all}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                themedStyles.filterButton,
                testamentFilter === 'old' && themedStyles.filterButtonActive,
              ]}
              onPress={() => handleFilterChange('old')}>
              <Text
                style={[
                  themedStyles.filterText,
                  testamentFilter === 'old' && themedStyles.filterTextActive,
                ]}>
                {t.search.testament.old}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                themedStyles.filterButton,
                testamentFilter === 'new' && themedStyles.filterButtonActive,
              ]}
              onPress={() => handleFilterChange('new')}>
              <Text
                style={[
                  themedStyles.filterText,
                  testamentFilter === 'new' && themedStyles.filterTextActive,
                ]}>
                {t.search.testament.new}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          {Array.from({length: 5}).map((_, index) => (
            <VerseSkeleton key={index} />
          ))}
        </View>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <>
          <View style={themedStyles.resultsHeader}>
            <Text style={themedStyles.resultsCount}>
              {results.length > 0 ? resultsCountLabel : t.search.noResults}
            </Text>
          </View>

          <FlatList
            data={results}
            keyExtractor={item =>
              `${item.id}-${item.book}-${item.chapter}-${item.verse}`
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            renderItem={renderItem}
            contentContainerStyle={styles.resultsList}
            ListFooterComponent={
              hasMore && results.length > 0 ? (
                <TouchableOpacity
                  onPress={loadMoreResults}
                  disabled={loadingMore}
                  accessibilityRole="button"
                  accessibilityLabel={t.search.loadMore}
                  style={[
                    styles.loadMoreButton,
                    loadingMore && styles.loadMoreButtonBusy,
                    {
                      backgroundColor: colors.primary + (isDark ? '33' : '22'),
                      borderColor: colors.primary,
                    },
                  ]}>
                  <Text style={[styles.loadMoreLabel, {color: colors.primary}]}>
                    {loadingMore ? t.loading : t.search.loadMore}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              !loading && hasSearched ? (
                <IllustratedEmptyState
                  type="no-search-results"
                  colors={colors}
                  isDark={isDark}
                  message={`${t.search.noResults} "${searchQuery}"`}
                  onAction={() => setSearchQuery('')}
                  actionLabel={t.search.tryDifferent}
                />
              ) : null
            }
          />
        </>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <View style={styles.initialContainer}>
          <Ionicons name="search" size={80} color={colors.border} />
          <Text style={themedStyles.initialTitle}>{t.search.initialTitle}</Text>
          <Text style={themedStyles.initialSubtitle}>
            {t.search.initialSubtitle}
          </Text>

          {/* Recent Searches — only render when the user has any history. */}
          {searchHistory.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Text style={themedStyles.suggestionsTitle}>
                  {t.search.recentSearches}
                </Text>
                <TouchableOpacity
                  onPress={clearHistory}
                  accessibilityRole="button"
                  accessibilityLabel={t.search.clearHistory}>
                  <Text
                    style={[
                      styles.clearHistoryText,
                      {color: colors.textSecondary},
                    ]}>
                    {t.search.clearHistory}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.suggestionsWrap}>
                {searchHistory.map(query => (
                  <View
                    key={query}
                    style={[themedStyles.suggestionChip, styles.historyChip]}>
                    <TouchableOpacity
                      onPress={() => handleSearchChange(query)}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.search.searchFor} ${query}`}>
                      <Text style={themedStyles.suggestionText}>{query}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.historyChipClose}
                      onPress={() => removeHistoryEntry(query)}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.search.removeFromHistory}: ${query}`}
                      hitSlop={8}>
                      <Ionicons
                        name="close"
                        size={14}
                        color={isDark ? colors.primaryDark : colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.suggestionsContainer}>
            <Text style={themedStyles.suggestionsTitle}>
              {t.search.popularSearches}
            </Text>
            <View style={styles.suggestionsWrap}>
              {/* Popular chips reflect the **Bible version** the user is
                  searching — not the UI language. Tapping "love" against a
                  Spanish version (or "amor" against KJV) previously
                  returned 0 results; pulling suggestions from the version
                  language keeps the chips aligned with the actual search
                  corpus. (BibleVersion.language is typed `string`; cast
                  to the translations key set with an English fallback.) */}
              {(
                translations[
                  (selectedVersion.language === 'es' ? 'es' : 'en') as
                    | 'es'
                    | 'en'
                ].search.suggestions as readonly string[]
              ).map(suggestion => (
                <TouchableOpacity
                  key={suggestion}
                  style={themedStyles.suggestionChip}
                  onPress={() => handleSearchChange(suggestion)}>
                  <Text style={themedStyles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: staticColors.glassWhite30,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: staticColors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: staticColors.glassWhite90,
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: staticColors.grayTint10,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  hintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  filtersContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    padding: 16,
    paddingBottom: 100, // Espacio para tab bar (88px iOS / 68px Android)
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  initialContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  suggestionsContainer: {
    marginTop: 28,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  clearHistoryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  historyChipClose: {
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  loadMoreButton: {
    marginTop: 12,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  loadMoreButtonBusy: {opacity: 0.6},
  loadMoreLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
