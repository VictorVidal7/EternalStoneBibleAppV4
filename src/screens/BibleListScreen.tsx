/**
 * BibleListScreen - Lista de libros de la Biblia con FlashList
 * Migrado a TypeScript con mejoras de performance y UX
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { BibleListSkeleton } from '../components/SkeletonLoader';
import { getBookName } from '../data/bookNames';
import { addBreadcrumb } from '../lib/monitoring/sentry';
import bibleBooks from '../data/bibleBooks.json';
import * as Haptics from 'expo-haptics';

interface BookItem {
  fileName: string;
  bookKey: string;
  displayName: string;
  testament: 'OT' | 'NT';
  index: number;
}

interface SectionData {
  type: 'header' | 'book';
  title?: string;
  book?: BookItem;
  id: string;
}

/**
 * Pantalla de lista de libros bíblicos con performance optimizada
 */
const BibleListScreen: React.FC = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  // Simular carga inicial (puedes quitar esto si no es necesario)
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Convertir estructura de libros a lista plana para FlashList
   */
  const flatListData = useMemo((): SectionData[] => {
    const oldTestamentBooks: BookItem[] = (bibleBooks["Antiguo Testamento"] || []).map(
      (fileName: string, index: number) => {
        const bookKey = fileName.replace('.json', '').replace(/-/g, '');
        return {
          fileName,
          bookKey,
          displayName: getBookName(bookKey, 'es'),
          testament: 'OT' as const,
          index,
        };
      }
    );

    const newTestamentBooks: BookItem[] = (bibleBooks["Nuevo Testamento"] || []).map(
      (fileName: string, index: number) => {
        const bookKey = fileName.replace('.json', '').replace(/-/g, '');
        return {
          fileName,
          bookKey,
          displayName: getBookName(bookKey, 'es'),
          testament: 'NT' as const,
          index,
        };
      }
    );

    const data: SectionData[] = [];

    // Antiguo Testamento
    data.push({
      type: 'header',
      title: 'Antiguo Testamento',
      id: 'header-ot',
    });
    oldTestamentBooks.forEach((book, idx) => {
      data.push({
        type: 'book',
        book,
        id: `book-ot-${idx}`,
      });
    });

    // Nuevo Testamento
    data.push({
      type: 'header',
      title: 'Nuevo Testamento',
      id: 'header-nt',
    });
    newTestamentBooks.forEach((book, idx) => {
      data.push({
        type: 'book',
        book,
        id: `book-nt-${idx}`,
      });
    });

    return data;
  }, []);

  /**
   * Navegar a la pantalla de capítulos
   */
  const navigateToChapter = useCallback(
    (bookKey: string, bookName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Breadcrumb para tracking
      addBreadcrumb({
        message: `Usuario seleccionó libro: ${bookName}`,
        category: 'navigation',
        level: 'info',
        data: { bookKey, bookName },
      });

      router.push(`/verse/${bookKey}` as any);
    },
    [router]
  );

  /**
   * Renderizar item de la lista
   */
  const renderItem = useCallback(
    ({ item }: { item: SectionData }) => {
      if (item.type === 'header') {
        return (
          <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.sectionHeaderText, { color: colors.primary }]}>
              {item.title}
            </Text>
          </View>
        );
      }

      if (item.type === 'book' && item.book) {
        const { bookKey, displayName } = item.book;
        return (
          <TouchableOpacity
            style={[styles.bookItem, { borderBottomColor: colors.border }]}
            onPress={() => navigateToChapter(bookKey, displayName)}
            accessibilityRole="button"
            accessibilityLabel={`Libro de ${displayName}`}
            accessibilityHint={`Toca para ver los capítulos de ${displayName}`}
          >
            <View style={[styles.bookIconContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.bookIcon, { color: colors.primary }]}>📖</Text>
            </View>

            <Text style={[styles.bookName, { color: colors.text }]}>{displayName}</Text>

            <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
          </TouchableOpacity>
        );
      }

      return null;
    },
    [colors, navigateToChapter]
  );

  /**
   * Estimación de tamaño de item para mejor performance
   */
  const getItemType = useCallback((item: SectionData) => {
    return item.type;
  }, []);

  if (isLoading) {
    return <BibleListSkeleton count={10} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlashList
        data={flatListData}
        renderItem={renderItem}
        estimatedItemSize={70}
        getItemType={getItemType}
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
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bookIcon: {
    fontSize: 20,
  },
  bookName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
  },
  chevron: {
    fontSize: 28,
    fontWeight: '300',
  },
});

export default React.memo(BibleListScreen);
