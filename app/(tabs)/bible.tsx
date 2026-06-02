/**
 * 📚 BIBLE LIST SCREEN - REDISEÑO MODERNO
 *
 * Pantalla de lista de libros bíblicos con:
 * - Cards modernos con animaciones
 * - Búsqueda integrada
 * - Glassmorphism y gradientes
 * - FlashList para mejor performance
 * - Animaciones de entrada suaves
 */

import React, {useState, useRef, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  SectionList,
  RefreshControl,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {BlurView} from 'expo-blur';
import * as Haptics from 'expo-haptics';

import {BIBLE_BOOKS} from '@/constants/bible';
import {parseReference} from '@/lib/references/parseReference';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';

// Design tokens
import {spacing, fontSize, staticColors} from '@/styles/designTokens';

interface BibleBook {
  id: number;
  name: string;
  nameEn: string;
  abbr: string;
  abbrEn: string;
  chapters: number;
  testament: 'old' | 'new';
}

export default function BibleScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const {t, language} = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'old' | 'new'>('all');
  const [filteredBooks, setFilteredBooks] = useState<BibleBook[]>(BIBLE_BOOKS);
  const [refreshing, setRefreshing] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#4f46e5', '#7c3aed', '#a855f7']) as [string, string, string],
    [gradient?.headerColors],
  );

  useEffect(() => {
    // Animación inicial
    Animated.parallel([
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(searchAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Filtrar libros por búsqueda
    if (searchQuery.trim() === '') {
      setFilteredBooks(BIBLE_BOOKS);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = BIBLE_BOOKS.filter(
        book =>
          book.name.toLowerCase().includes(query) ||
          book.nameEn.toLowerCase().includes(query),
      );
      setFilteredBooks(filtered);
    }
  }, [searchQuery]);

  const oldTestament = filteredBooks.filter(book => book.testament === 'old');
  const newTestament = filteredBooks.filter(book => book.testament === 'new');

  // Quick-jump: if the user types a complete Bible reference into the
  // book filter ("Juan 3:16", "Gen 1", "1 Sa 16:7"…), surface a banner
  // above the list so they can jump straight to the verse instead of
  // navigating book → chapter → verse manually.
  const parsedRef = useMemo(() => parseReference(searchQuery), [searchQuery]);
  const quickJumpLabel = useMemo(() => {
    if (!parsedRef) return null;
    const name =
      language === 'en' ? parsedRef.book.nameEn : parsedRef.book.name;
    let ref = `${name} ${parsedRef.chapter}`;
    if (parsedRef.verse !== undefined) {
      ref += `:${parsedRef.verse}`;
      if (parsedRef.verseEnd !== undefined) ref += `-${parsedRef.verseEnd}`;
    }
    return ref;
  }, [parsedRef, language]);

  function handleQuickJump() {
    if (!parsedRef) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const base = `/verse/${parsedRef.book.name}/${parsedRef.chapter}`;
    router.push(
      (parsedRef.verse !== undefined
        ? `${base}?verse=${parsedRef.verse}`
        : base) as never,
    );
  }

  const sections = [
    {
      title: t.bible.oldTestament,
      data: oldTestament,
      type: 'old' as const,
    },
    {
      title: t.bible.newTestament,
      data: newTestament,
      type: 'new' as const,
    },
  ].filter(section => {
    if (filter === 'all') return section.data.length > 0;
    return section.type === filter && section.data.length > 0;
  });

  async function onRefresh() {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Reset search and filter if there is one
    if (searchQuery || filter !== 'all') {
      setSearchQuery('');
      setFilter('all');
      setFilteredBooks(BIBLE_BOOKS);
    }

    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  }

  function goToChapterSelection(bookName: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chapter/${bookName}` as never);
  }
  function toggleFilter(newFilter: 'old' | 'new') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFilter(prev => (prev === newFilter ? 'all' : newFilter));
  }
  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header con gradiente */}
      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [
            {
              translateY: headerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        }}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.header}>
          {/* No back button — this is a root tab; bottom bar is the nav. */}

          <View style={styles.headerContent}>
            <View
              style={[
                styles.headerIconContainer,
                {
                  backgroundColor: staticColors.glassWhite12,
                  borderColor: staticColors.glassWhite20,
                },
              ]}>
              <Ionicons name="library" size={32} color="#ffffff" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>{t.home.bibleLibrary}</Text>
              <Text style={styles.headerSubtitle}>
                {filteredBooks.length} {t.home.booksAvailable}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            opacity: searchAnim,
            transform: [
              {
                scale: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark
                  ? staticColors.glassWhite05
                  : staticColors.overlayBlack03,
                borderColor: colors.glassBorder,
              },
            ]}>
            <Ionicons
              name="search"
              size={18}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, {color: colors.text}]}
              placeholder={t.home.searchBook}
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              onPress={() => toggleFilter('old')}
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filter === 'old'
                      ? colors.primary + '40' // Traslúcido activo
                      : isDark
                        ? staticColors.glassWhite05
                        : 'rgba(0,0,0,0.03)',
                  borderColor:
                    filter === 'old' ? colors.primary : colors.glassBorder,
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      filter === 'old' ? colors.primary : colors.textSecondary,
                  },
                ]}>
                {t.bible.oldTestamentShort}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => toggleFilter('new')}
              activeOpacity={0.7}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    filter === 'new'
                      ? colors.primary + '40' // Traslúcido activo
                      : isDark
                        ? staticColors.glassWhite05
                        : 'rgba(0,0,0,0.03)',
                  borderColor:
                    filter === 'new' ? colors.primary : colors.glassBorder,
                },
              ]}>
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color:
                      filter === 'new' ? colors.primary : colors.textSecondary,
                  },
                ]}>
                {t.bible.newTestamentShort}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Quick-jump banner — only when the query parses as a complete ref. */}
      {parsedRef && quickJumpLabel && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleQuickJump}
          accessibilityRole="button"
          accessibilityLabel={`${t.bible.goTo} ${quickJumpLabel}`}
          style={[
            styles.quickJumpBanner,
            {
              backgroundColor: colors.primary + (isDark ? '33' : '22'),
              borderColor: colors.primary,
            },
          ]}>
          <Ionicons
            name="arrow-forward-circle"
            size={20}
            color={colors.primary}
          />
          <Text style={[styles.quickJumpLabel, {color: colors.primary}]}>
            {t.bible.goTo} {quickJumpLabel}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Lista de libros */}
      {filteredBooks.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderSectionHeader={({section}) => (
            <SectionHeader
              title={section.title}
              count={section.data.length}
              isOldTestament={section.type === 'old'}
            />
          )}
          renderItem={({item, index}) => (
            <BookCard
              book={item}
              index={index}
              onPress={() => goToChapterSelection(item.name)}
            />
          )}
          stickySectionHeadersEnabled
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState searchQuery={searchQuery} />
      )}
    </View>
  );
}

// ==================== SECTION HEADER ====================

interface SectionHeaderProps {
  title: string;
  count: number;
  isOldTestament: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  isOldTestament,
}) => {
  const {colors, isDark} = useTheme();

  return (
    <View style={styles.sectionHeaderWrapper}>
      <BlurView
        intensity={isDark ? 40 : 80}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.sectionHeader,
          {
            backgroundColor: isDark
              ? staticColors.glassWhite08
              : staticColors.glassWhite85,
            borderColor: colors.glassBorder,
          },
        ]}>
        <View
          style={[
            styles.sectionIconContainer,
            {backgroundColor: colors.primary + '20'},
          ]}>
          <Ionicons
            name={isOldTestament ? 'library' : 'bookmark'}
            size={20}
            color={colors.primary}
          />
        </View>
        <Text style={[styles.sectionTitle, {color: colors.text}]}>{title}</Text>
        <View
          style={[
            styles.sectionBadge,
            {backgroundColor: colors.primary + '20'},
          ]}>
          <Text style={[styles.sectionCount, {color: colors.primary}]}>
            {count}
          </Text>
        </View>
      </BlurView>
    </View>
  );
};

// ==================== BOOK CARD ====================

interface BookCardProps {
  book: BibleBook;
  index: number;
  onPress: () => void;
}

const BookCard: React.FC<BookCardProps> = ({book, index, onPress}) => {
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 30, // Stagger animation
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{scale: scaleAnim}],
        opacity: scaleAnim,
      }}>
      <TouchableOpacity
        style={[
          styles.bookCard,
          styles.bookCardFlat,
          {
            backgroundColor: staticColors.transparent,
            borderColor: colors.glassBorder,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}>
        {/* Accent line */}
        <View style={[styles.accentLine, {backgroundColor: colors.primary}]} />

        {/* Book icon */}
        <View
          style={[
            styles.bookIconContainer,
            {backgroundColor: colors.primary + '15'},
          ]}>
          <Text style={[styles.bookIcon, {color: colors.primary}]}>
            {language === 'en' ? book.abbrEn : book.abbr}
          </Text>
        </View>

        {/* Book info - Ultra Linear Layout */}
        <View style={styles.bookInfo}>
          <Text
            style={[styles.bookName, {color: colors.text}]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {language === 'en' ? book.nameEn : book.name}
          </Text>
          <View style={styles.bookRightContent}>
            <Text style={[styles.bookChapters, {color: colors.textSecondary}]}>
              {book.chapters}{' '}
              {book.chapters === 1 ? t.bible.chapter : t.bible.chapters}
            </Text>
            <View style={styles.chevronContainer}>
              <Ionicons
                name="chevron-forward"
                size={14}
                color={colors.textTertiary}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== EMPTY STATE ====================

interface EmptyStateProps {
  searchQuery: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({searchQuery}) => {
  const {colors} = useTheme();
  const {t} = useLanguage();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, {color: colors.text}]}>
        {t.bible.noResultsFound}
      </Text>
      <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
        {t.bible.noMatchingBooks} "{searchQuery}"
      </Text>
    </View>
  );
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Quick-jump banner — surfaces when the book filter doubles as a
  // reference input (e.g. typing "Juan 3:16" instead of just "Juan").
  quickJumpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickJumpLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },

  // Header - Estandarizado con todas las pantallas
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
  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    flex: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },

  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 44,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100, // Espacio para tab bar (88px iOS / 68px Android)
  },

  // Section Header
  sectionHeaderWrapper: {
    backgroundColor: staticColors.transparent,
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.5,
  },
  sectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 32,
    alignItems: 'center',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Book Card - Estilo profesional con profundidad
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 8, // Altura mínima elegante
    paddingHorizontal: 10,
    marginBottom: 6,
    overflow: 'hidden',
  },
  bookCardFlat: {
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 1,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  bookIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 12,
  },
  bookIcon: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bookInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    flex: 1,
  },
  bookRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookChapters: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '500',
  },
  chevronContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: fontSize.base,
    textAlign: 'center',
  },
});
