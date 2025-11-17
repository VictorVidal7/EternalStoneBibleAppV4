/**
 * ChapterScreen - Vista de capítulos de un libro con FlashList
 * Migrado a TypeScript con mejoras de performance y UX
 */

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { ChapterGridSkeleton } from '../components/SkeletonLoader';
import { getBookName } from '../data/bookNames';
import { addBreadcrumb } from '../lib/monitoring/sentry';
import bibleChapters from '../data/bibleChapters.json';
import * as Haptics from 'expo-haptics';

interface ChapterItem {
  chapter: number;
  id: string;
}

/**
 * Pantalla de selección de capítulos con grid optimizado
 */
const ChapterScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ book: string }>();
  const { colors } = useTheme();
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

  const bookKey = params.book || '';
  const bookName = useMemo(() => getBookName(bookKey, language), [bookKey, language]);

  /**
   * Generar lista de capítulos
   */
  const chapters = useMemo((): ChapterItem[] => {
    // Obtener número de capítulos desde bibleChapters.json
    const chapterCount = (bibleChapters as Record<string, number>)[bookName] || 0;

    if (!chapterCount) {
      console.warn(`No se encontró el número de capítulos para: ${bookName}`);
      return [];
    }

    return Array.from({ length: chapterCount }, (_, i) => ({
      chapter: i + 1,
      id: `chapter-${i + 1}`,
    }));
  }, [bookName]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Navegar a la pantalla de versículos
   */
  const navigateToVerse = useCallback(
    (chapter: number) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      addBreadcrumb({
        message: `Usuario seleccionó capítulo ${chapter} de ${bookName}`,
        category: 'navigation',
        level: 'info',
        data: { bookKey, chapter, bookName },
      });

      router.push({
        pathname: '/chapter',
        params: { book: bookKey, chapter: chapter.toString() },
      } as any);
    },
    [router, bookKey, bookName]
  );

  /**
   * Renderizar item de capítulo
   */
  const renderItem = useCallback(
    ({ item }: { item: ChapterItem }) => (
      <TouchableOpacity
        style={[styles.chapterItem, { backgroundColor: colors.surface }]}
        onPress={() => navigateToVerse(item.chapter)}
        accessibilityRole="button"
        accessibilityLabel={`${t.bible.chapter} ${item.chapter}`}
        accessibilityHint={`${t.bible.tapToRead} ${item.chapter} ${t.bible.of} ${bookName}`}
      >
        <Text style={[styles.chapterText, { color: colors.text }]}>{item.chapter}</Text>
      </TouchableOpacity>
    ),
    [colors, navigateToVerse, bookName, t]
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View
            style={[styles.bookIconContainer, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={[styles.bookIcon, { color: colors.primary }]}>📖</Text>
          </View>
          <Text style={[styles.bookTitle, { color: colors.text }]}>{bookName}</Text>
        </View>
        <ChapterGridSkeleton count={12} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View
          style={[styles.bookIconContainer, { backgroundColor: colors.primaryLight }]}
        >
          <Text style={[styles.bookIcon, { color: colors.primary }]}>📖</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.bookTitle, { color: colors.text }]}>{bookName}</Text>
          <Text style={[styles.chapterCount, { color: colors.textSecondary }]}>
            {chapters.length} {chapters.length === 1 ? t.bible.chapter : t.bible.chapters}
          </Text>
        </View>
      </View>

      {/* Grid de capítulos */}
      <FlashList
        data={chapters}
        renderItem={renderItem}
        estimatedItemSize={80}
        numColumns={3}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookIcon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  chapterCount: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  listContent: {
    padding: 12,
  },
  chapterItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chapterText: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

export default React.memo(ChapterScreen);
