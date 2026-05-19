import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import React, {useState, useCallback, useMemo, memo} from 'react';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useDebouncedCallback} from 'use-debounce';
import bibleDB from '@lib/database';
import {BibleVerse} from '@/types/bible';
import {useTheme, ThemeColors} from '@hooks/useTheme';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useLanguage} from '@hooks/useLanguage';
import {IllustratedEmptyState} from '@components/IllustratedEmptyState';
import {VerseSkeleton} from '@components/SkeletonLoader';

type TestamentFilter = 'all' | 'old' | 'new';

// Tope de filas que devuelve searchVerses; al alcanzarlo el conteo se muestra
// como "200+" porque puede haber más resultados sin cargar.
const SEARCH_RESULT_LIMIT = 200;

// Libros del Antiguo Testamento (1-39)
const OLD_TESTAMENT_BOOKS = [
  'Génesis',
  'Éxodo',
  'Levítico',
  'Números',
  'Deuteronomio',
  'Josué',
  'Jueces',
  'Rut',
  '1 Samuel',
  '2 Samuel',
  '1 Reyes',
  '2 Reyes',
  '1 Crónicas',
  '2 Crónicas',
  'Esdras',
  'Nehemías',
  'Ester',
  'Job',
  'Salmos',
  'Proverbios',
  'Eclesiastés',
  'Cantares',
  'Isaías',
  'Jeremías',
  'Lamentaciones',
  'Ezequiel',
  'Daniel',
  'Oseas',
  'Joel',
  'Amós',
  'Abdías',
  'Jonás',
  'Miqueas',
  'Nahúm',
  'Habacuc',
  'Sofonías',
  'Hageo',
  'Zacarías',
  'Malaquías',
];

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
      color: '#FFFFFF',
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
      shadowColor: '#000',
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

  const applyTestamentFilter = useCallback(
    (verses: BibleVerse[], filter: TestamentFilter) => {
      if (filter === 'all') return verses;

      if (filter === 'old') {
        return verses.filter(v => OLD_TESTAMENT_BOOKS.includes(v.book));
      }

      // Nuevo Testamento
      return verses.filter(v => !OLD_TESTAMENT_BOOKS.includes(v.book));
    },
    [],
  );

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

      try {
        await bibleDB.initialize();
        const searchResults = await bibleDB.searchVerses(
          query,
          selectedVersion.id,
          SEARCH_RESULT_LIMIT,
        );
        setAllResults(searchResults);
        setResults(applyTestamentFilter(searchResults, testamentFilter));
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
        setAllResults([]);
      } finally {
        setLoading(false);
      }
    },
    [testamentFilter, applyTestamentFilter, selectedVersion.id],
  );

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
      `/verse/${verse.book}/${verse.chapter}?verse=${verse.verse}` as any,
    );
  }

  const themedStyles = useMemo(
    () => createThemedStyles(colors, isDark),
    [colors, isDark],
  );

  // Se alcanzó el tope de searchVerses: el conteo real puede ser mayor.
  const capReached = allResults.length >= SEARCH_RESULT_LIMIT;
  const resultsCountLabel = `${results.length}${capReached ? '+' : ''} ${t.search.results}`;

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
        {/* Boton de regreso */}
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.bible.back}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

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

          <View style={styles.suggestionsContainer}>
            <Text style={themedStyles.suggestionsTitle}>
              {t.search.popularSearches}
            </Text>
            <View style={styles.suggestionsWrap}>
              {t.search.suggestions.map(suggestion => (
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(127, 140, 141, 0.1)',
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
    marginTop: 40,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
