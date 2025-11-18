import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import bibleDB from '../../src/lib/database';
import { Note } from '../../src/types/bible';
import { useTheme } from '../../src/hooks/useTheme';
import { useLanguage } from '../../src/hooks/useLanguage';
import { IllustratedEmptyState } from '../../src/components/IllustratedEmptyState';

export default function NotesScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  async function loadNotes() {
    try {
      await bibleDB.initialize();
      const data = await bibleDB.getNotes();
      setNotes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading notes:', error);
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert(
      t.notes.deleteTitle,
      t.notes.deleteMessage,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            await bibleDB.removeNote(id);
            loadNotes();
          },
        },
      ]
    );
  }

  function goToVerse(note: Note) {
    router.push(`/verse/${note.book}/${note.chapter}?verse=${note.verse}` as any);
  }

  if (loading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.noteItem, { backgroundColor: colors.surface }]}
            onPress={() => goToVerse(item)}
            activeOpacity={0.7}
          >
            <View style={styles.noteHeader}>
              <View style={[styles.noteIcon, { backgroundColor: colors.success + '20' }]}>
                <Ionicons name="document-text" size={20} color={colors.success} />
              </View>

              <View style={styles.noteHeaderText}>
                <Text style={[styles.noteReference, { color: colors.success }]}>
                  {item.book} {item.chapter}:{item.verse}
                </Text>
                <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
                  {new Date(item.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
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
            </View>

            <Text style={[styles.verseText, { color: colors.textSecondary }]} numberOfLines={2}>
              "{item.text}"
            </Text>

            <View style={[styles.noteDivider, { backgroundColor: colors.border }]} />

            <Text style={[styles.noteText, { color: colors.text }]} numberOfLines={3}>
              {item.note}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <IllustratedEmptyState
            type="no-notes"
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
  noteItem: {
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
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D5F4E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  noteHeaderText: {
    flex: 1,
  },
  noteReference: {
    fontSize: 15,
    fontWeight: '600',
    color: '#27AE60',
    marginBottom: 2,
  },
  noteDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  deleteButton: {
    padding: 8,
  },
  verseText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  noteDivider: {
    height: 1,
    backgroundColor: '#ECF0F1',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2C3E50',
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
