import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import bibleDB from '../../src/lib/database';
import { Bookmark } from '../../src/types/bible';
import { useCallback } from 'react';
import { useTheme } from '../../src/hooks/useTheme';
import { useLanguage } from '../../src/hooks/useLanguage';
import { IllustratedEmptyState } from '../../src/components/IllustratedEmptyState';
import { useToast } from '../../src/context/ToastContext';

export default function BookmarksScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const toast = useToast();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  async function loadBookmarks() {
    try {
      console.log('📑 [BookmarksScreen] Initializing database...');
      await bibleDB.initialize();
      console.log('📑 [BookmarksScreen] Calling getBookmarks()...');
      const data = await bibleDB.getBookmarks();
      console.log(`📑 [BookmarksScreen] Successfully loaded ${data.length} bookmarks`);
      setBookmarks(data);
      setLoading(false);
    } catch (error) {
      console.error('❌ [BookmarksScreen] Error loading bookmarks:', error);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert(
      t.bookmarks.deleteTitle,
      t.bookmarks.deleteMessage,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            await bibleDB.removeBookmark(id);
            toast.success('Bookmark removed successfully');
            loadBookmarks();
          },
        },
      ]
    );
  }

  function goToVerse(bookmark: Bookmark) {
    router.push(`/verse/${bookmark.book}/${bookmark.chapter}?verse=${bookmark.verse}` as any);
  }

  if (loading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.bookmarkItem, { backgroundColor: colors.surface }]}
            onPress={() => goToVerse(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.bookmarkIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="bookmark" size={20} color={colors.primary} />
            </View>

            <View style={styles.bookmarkContent}>
              <Text style={[styles.bookmarkReference, { color: colors.primary }]}>
                {item.book} {item.chapter}:{item.verse}
              </Text>
              <Text style={[styles.bookmarkText, { color: colors.text }]} numberOfLines={2}>
                {item.text}
              </Text>
              <Text style={[styles.bookmarkDate, { color: colors.textSecondary }]}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <IllustratedEmptyState
            type="no-bookmarks"
            colors={colors}
            isDark={isDark}
            onAction={() => router.push('/(tabs)/bible' as any)}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    padding: 16,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  bookmarkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F4FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkReference: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 6,
  },
  bookmarkText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495E',
    marginBottom: 6,
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#7F8C8D',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
