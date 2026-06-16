import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import {staticColors, verseTextRightSlack} from '@/styles/designTokens';

import {useState, useCallback, useMemo} from 'react';
import {useRouter, useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import bibleDB from '@lib/database';
import {Note} from '@/types/bible';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {IllustratedEmptyState} from '@components/IllustratedEmptyState';
import {NoteImageModal} from '@components/reading/NoteImageModal';
import {
  searchNotes,
  sortNotes,
  type NoteSortOrder,
} from '@lib/notes/noteFilter';
import {logger} from '@lib/utils/logger';
import {getBookByName} from '@/constants/bible';
import {getSyncEngine} from '@lib/sync';
import {buildNoteRemotePayload} from '@lib/sync/adapters/notes';

const SORT_ORDERS: NoteSortOrder[] = ['recent', 'oldest', 'book'];

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
  const {width} = useWindowDimensions();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<NoteSortOrder>('recent');
  const [shareNote, setShareNote] = useState<Note | null>(null);

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
          // Snapshot the note so the tombstone payload pushed to
          // Firestore carries verse identity (Sprint 42).
          const last = notes.find(n => n.id === id);
          await bibleDB.removeNote(id);
          getSyncEngine()?.queueDelete(
            'notes',
            id,
            last ? buildNoteRemotePayload(last) : undefined,
          );
          loadNotes();
        },
      },
    ]);
  }

  function goToVerse(note: Note) {
    router.push(
      `/verse/${note.book}/${note.chapter}?verse=${note.verse}` as never,
    );
  }

  // El nombre del libro se guarda en el idioma activo al crear la nota;
  // se relocaliza para que la referencia siga al idioma de la app.
  function localizeBook(book: string): string {
    const info = getBookByName(book);
    if (!info) return book;
    return language === 'en' ? info.nameEn : info.name;
  }

  function referenceOf(note: Note): string {
    return `${localizeBook(note.book)} ${note.chapter}:${note.verse}`;
  }

  // Lista mostrada: búsqueda (acento-insensible, sobre referencia + versículo +
  // nota) y orden, derivadas vía useMemo — sin estado que pueda desincronizarse.
  const displayedNotes = useMemo(() => {
    const filtered = searchNotes(
      notes,
      query,
      n => `${referenceOf(n)} ${n.text} ${n.note}`,
    );
    return sortNotes(
      filtered,
      sortOrder,
      n => new Date(n.updatedAt).getTime(),
      n => getBookByName(n.book)?.id ?? 999,
    );
    // (referenceOf depends on `language`, which is in the deps below, so a
    // UI-language switch re-derives the localized search haystack.)
  }, [notes, query, sortOrder, language]);

  const sortLabel: Record<NoteSortOrder, string> = {
    recent: t.notes.sortRecent,
    oldest: t.notes.sortOldest,
    book: t.notes.sortByBook,
  };

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

      {/* Search + sort controls (only once there are notes to filter). */}
      {notes.length > 0 && (
        <View style={styles.controls}>
          <View
            style={[
              styles.searchBar,
              {backgroundColor: colors.surface, borderColor: colors.border},
            ]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, {color: colors.text}]}
              value={query}
              onChangeText={setQuery}
              placeholder={t.notes.searchPlaceholder}
              placeholderTextColor={colors.textTertiary}
              returnKeyType="search"
              accessibilityLabel={t.notes.searchPlaceholder}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                accessibilityRole="button"
                accessibilityLabel={t.cancel}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sortRow}>
            {SORT_ORDERS.map(order => {
              const active = order === sortOrder;
              return (
                <TouchableOpacity
                  key={order}
                  onPress={() => {
                    haptics.tap();
                    setSortOrder(order);
                  }}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{selected: active}}
                  accessibilityLabel={sortLabel[order]}>
                  <Text
                    style={[
                      styles.sortChipText,
                      {
                        color: active
                          ? staticColors.white
                          : colors.textSecondary,
                      },
                    ]}>
                    {sortLabel[order]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <FlatList
        data={displayedNotes}
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
                style={styles.noteAction}
                onPress={() => {
                  haptics.tap();
                  setShareNote(item);
                }}
                accessibilityRole="button"
                accessibilityLabel={t.notes.shareImage}>
                <Ionicons
                  name="share-outline"
                  size={20}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.noteAction}
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
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim().length > 0 ? (
            <View style={styles.noResults}>
              <Ionicons name="search" size={40} color={colors.textTertiary} />
              <Text
                style={[styles.noResultsText, {color: colors.textSecondary}]}>
                {t.notes.noResults}
              </Text>
            </View>
          ) : (
            <IllustratedEmptyState
              type="no-notes"
              colors={colors}
              isDark={isDark}
              onAction={() => router.push('/(tabs)/bible' as never)}
            />
          )
        }
      />

      {shareNote && (
        <NoteImageModal
          visible={shareNote !== null}
          reference={referenceOf(shareNote)}
          verseText={shareNote.text}
          note={shareNote.note}
          cardSize={Math.min(width - 48, 400)}
          onClose={() => setShareNote(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controls: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 64,
    gap: 12,
  },
  noResultsText: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
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
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
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
  listContent: {
    padding: 16,
    paddingBottom: 100, // Espacio para tab bar (88px iOS / 68px Android)
  },
  noteItem: {
    backgroundColor: staticColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: staticColors.black,
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
    backgroundColor: staticColors.greenBgLight,
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
    color: staticColors.greenSuccess,
    marginBottom: 2,
  },
  noteDate: {
    fontSize: 12,
    color: staticColors.grayMuted,
  },
  noteAction: {
    padding: 8,
  },
  verseText: {
    fontSize: 14,
    lineHeight: 20,
    color: staticColors.grayTertiary,
    fontStyle: 'italic',
    marginBottom: 12,
    // Right-edge anti-clip slack for italic scripture preview (Sprint 94).
    paddingRight: verseTextRightSlack(14),
  },
  noteDivider: {
    height: 1,
    backgroundColor: staticColors.neutralBgLight,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: staticColors.grayDark,
  },
});
