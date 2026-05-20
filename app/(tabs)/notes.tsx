import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useState, useCallback, useMemo} from 'react';
import {useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import bibleDB from '@lib/database';
import {Note} from '@/types/bible';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {IllustratedEmptyState} from '@components/IllustratedEmptyState';
import {logger} from '@lib/utils/logger';
import {getBookByName} from '@/constants/bible';

export default function NotesScreen() {
  const router = useRouter();
  const {colors, isDark, gradient} = useTheme();
  const headerGradient = useMemo(
    () =>
      (gradient?.headerColors
        ? [...gradient.headerColors]
        : ['#4f46e5', '#7c3aed', '#a855f7']) as [string, string, string],
    [gradient?.headerColors],
  );
  const {t, language} = useLanguage();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, []),
  );

  async function loadNotes() {
    try {
      await bibleDB.initialize();
      const data = await bibleDB.getNotes();
      setNotes(data);
      setLoading(false);
    } catch (error) {
      logger.error('Error loading notes', error as Error, {
        component: 'NotesScreen',
        action: 'loadNotes',
      });
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert(t.notes.deleteTitle, t.notes.deleteMessage, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await bibleDB.removeNote(id);
          loadNotes();
        },
      },
    ]);
  }

  function goToVerse(note: Note) {
    router.push(
      `/verse/${note.book}/${note.chapter}?verse=${note.verse}` as any,
    );
  }

  // El nombre del libro se guarda en el idioma activo al crear la nota;
  // se relocaliza para que la referencia siga al idioma de la app.
  function localizeBook(book: string): string {
    const info = getBookByName(book);
    if (!info) return book;
    return language === 'en' ? info.nameEn : info.name;
  }

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]} />
    );
  }

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
            <Ionicons name="document-text" size={32} color="#ffffff" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t.tabs.notes}
            </Text>
            <Text style={styles.headerSubtitle}>
              {notes.length}{' '}
              {notes.length === 1
                ? t.notes.countLabelSingular
                : t.notes.countLabel}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={notes}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.noteItem, {backgroundColor: colors.surface}]}
            onPress={() => goToVerse(item)}
            activeOpacity={0.7}>
            <View style={styles.noteHeader}>
              <View
                style={[
                  styles.noteIcon,
                  {backgroundColor: colors.success + '20'},
                ]}>
                <Ionicons
                  name="document-text"
                  size={20}
                  color={colors.success}
                />
              </View>

              <View style={styles.noteHeaderText}>
                <Text style={[styles.noteReference, {color: colors.success}]}>
                  {localizeBook(item.book)} {item.chapter}:{item.verse}
                </Text>
                <Text style={[styles.noteDate, {color: colors.textSecondary}]}>
                  {new Date(item.updatedAt).toLocaleDateString(
                    language === 'es' ? 'es-ES' : 'en-US',
                    {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    },
                  )}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
                accessibilityRole="button"
                accessibilityLabel={t.delete}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.verseText, {color: colors.textSecondary}]}
              numberOfLines={2}>
              "{item.text}"
            </Text>

            <View
              style={[styles.noteDivider, {backgroundColor: colors.border}]}
            />

            <Text
              style={[styles.noteText, {color: colors.text}]}
              numberOfLines={3}>
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
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espacio para tab bar (88px iOS / 68px Android)
  },
  noteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
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
