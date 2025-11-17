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

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  SectionList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { BIBLE_BOOKS } from '../../src/constants/bible';
import { useTheme } from '../../src/hooks/useTheme';
import { useLanguage } from '../../src/hooks/useLanguage';

// Design tokens
import {
  spacing,
  borderRadius,
  fontSize,
  shadows,
  iconSize,
} from '../../src/styles/designTokens';

interface BibleBook {
  id: number;
  name: string;
  abbr: string;
  chapters: number;
  testament: 'old' | 'new';
}

export default function BibleScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBooks, setFilteredBooks] = useState<BibleBook[]>(BIBLE_BOOKS);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

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
      const filtered = BIBLE_BOOKS.filter((book) =>
        book.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  }, [searchQuery]);

  const oldTestament = filteredBooks.filter((book) => book.testament === 'old');
  const newTestament = filteredBooks.filter((book) => book.testament === 'new');

  const sections = [
    { title: t.bible.oldTestament, data: oldTestament, color: '#3b82f6' },
    { title: t.bible.newTestament, data: newTestament, color: '#ef4444' },
  ].filter((section) => section.data.length > 0);

  function goToChapterSelection(bookName: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chapter/${bookName}` as any);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        }}
      >
        <LinearGradient
          colors={
            isDark
              ? ['#7c8dff', '#9b6dd6', '#c7a8ff']
              : ['#7c8dff', '#9b6dd6', '#c7a8ff']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1.3, y: 1.3 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTitleContainer}>
              <Ionicons name="book" size={32} color="#ffffff" />
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{t.home.bibleLibrary}</Text>
                <Text style={styles.headerSubtitle}>
                  {filteredBooks.length} {t.home.booksAvailable}
                </Text>
              </View>
            </View>

            {/* Stats mini */}
            <View style={styles.headerStats}>
              <View style={styles.statMini}>
                <Text style={styles.statMiniNumber}>{oldTestament.length}</Text>
                <Text style={styles.statMiniLabel}>AT</Text>
              </View>
              <View style={styles.statMini}>
                <Text style={styles.statMiniNumber}>{newTestament.length}</Text>
                <Text style={styles.statMiniLabel}>NT</Text>
              </View>
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
        ]}
      >
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              ...shadows.md,
            },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={t.home.searchBook}
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Lista de libros */}
      {filteredBooks.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id.toString()}
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              count={section.data.length}
              color={section.color}
              isOldTestament={section.title.includes('Antiguo')}
            />
          )}
          renderItem={({ item, index }) => (
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
  color: string;
  isOldTestament: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  color,
  isOldTestament,
}) => {
  return (
    <LinearGradient
      colors={[color, color + 'dd']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.sectionHeader, shadows.md]}
    >
      <View style={styles.sectionIconContainer}>
        <Ionicons
          name={isOldTestament ? 'book' : 'heart'}
          size={24}
          color="#ffffff"
        />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
    </LinearGradient>
  );
};

// ==================== BOOK CARD ====================

interface BookCardProps {
  book: BibleBook;
  index: number;
  onPress: () => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, index, onPress }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
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

  const bookColor = book.testament === 'old' ? '#3b82f6' : '#ef4444';

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: scaleAnim,
      }}
    >
      <TouchableOpacity
        style={[
          styles.bookCard,
          {
            backgroundColor: colors.card,
            ...shadows.sm,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Accent line */}
        <View style={[styles.accentLine, { backgroundColor: bookColor }]} />

        {/* Book icon */}
        <LinearGradient
          colors={[bookColor, bookColor + 'cc']}
          style={styles.bookIconContainer}
        >
          <Text style={styles.bookIcon}>{book.abbr}</Text>
        </LinearGradient>

        {/* Book info */}
        <View style={styles.bookInfo}>
          <Text style={[styles.bookName, { color: colors.text }]}>
            {book.name}
          </Text>
          <View style={styles.bookMeta}>
            <Ionicons
              name="document-text-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={[styles.bookChapters, { color: colors.textSecondary }]}>
              {book.chapters} {book.chapters === 1 ? t.bible.chapter : t.bible.chapters}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <View style={[styles.chevronContainer, { backgroundColor: bookColor + '15' }]}>
          <Ionicons name="chevron-forward" size={20} color={bookColor} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ==================== EMPTY STATE ====================

interface EmptyStateProps {
  searchQuery: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ searchQuery }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        {t.bible.noResultsFound}
      </Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
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

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    shadowColor: '#7c8dff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  headerStats: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statMini: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  statMiniNumber: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#ffffff',
  },
  statMiniLabel: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.9)',
  },

  // Search
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: spacing.base,
    height: 52,
    borderWidth: 1.5,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1,
  },
  sectionBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 40,
    alignItems: 'center',
  },
  sectionCount: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Book Card
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  bookIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginRight: spacing.md,
  },
  bookIcon: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#ffffff',
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  bookMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  bookChapters: {
    fontSize: fontSize.sm,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
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
