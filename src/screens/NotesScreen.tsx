import React, {useCallback, useMemo} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {useNotes} from '../context/NotesContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../hooks/useLanguage';
import CustomIconButton from '../components/CustomIconButton';
import {logger} from '../lib/utils/logger';

/**
 * Interface for a single note
 */
interface Note {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

/**
 * Interface for theme colors
 */
interface ThemeColors {
  background: string;
  border: string;
  primary: string;
  text: string;
  error: string;
  [key: string]: string;
}

/**
 * NotesScreen Component
 * Displays a list of user notes with the ability to navigate to verses and delete notes
 */
const NotesScreen: React.FC = () => {
  const navigation = useNavigation();
  const {notes, deleteNote} = useNotes();
  const {colors} = useTheme();
  const {t} = useLanguage();

  // Memoize styles based on theme colors
  const styles = useMemo(() => createStyles(colors), [colors]);

  /**
   * Navigate to the verse associated with the note
   */
  const handleNotePress = useCallback(
    (note: Note) => {
      logger.breadcrumb('Note pressed', 'user-action', {
        book: note.book,
        chapter: note.chapter,
        verse: note.verse,
        screen: 'NotesScreen',
      });

      (navigation as any).navigate('Biblia', {
        screen: 'Verse',
        params: {
          book: note.book,
          chapter: note.chapter,
          verse: note.verse,
        },
      });
    },
    [navigation],
  );

  /**
   * Delete a note
   */
  const handleDeleteNote = useCallback(
    (note: Note) => {
      try {
        logger.breadcrumb('Note deleted', 'user-action', {
          book: note.book,
          chapter: note.chapter,
          verse: note.verse,
          screen: 'NotesScreen',
        });

        deleteNote(note.book, note.chapter, note.verse);
      } catch (error) {
        logger.error('Error deleting note', error as Error, {
          screen: 'NotesScreen',
          action: 'handleDeleteNote',
          note: {
            book: note.book,
            chapter: note.chapter,
            verse: note.verse,
          },
        });
      }
    },
    [deleteNote],
  );

  /**
   * Render individual note item
   */
  const renderNoteItem = useCallback(
    ({item}: {item: Note}) => {
      logger.breadcrumb('Rendering note item', 'ui', {
        noteReference: `${item.book} ${item.chapter}:${item.verse}`,
        screen: 'NotesScreen',
      });

      return (
        <View style={styles.noteItem}>
          <TouchableOpacity
            onPress={() => handleNotePress(item)}
            style={styles.noteContent}
            accessibilityRole="button"
            accessibilityLabel={t.notes.goToVerse}
            accessibilityHint={`${t.notes.navigate} ${item.book} ${item.chapter}:${item.verse}`}>
            <Text
              style={
                styles.noteReference
              }>{`${item.book} ${item.chapter}:${item.verse}`}</Text>
            <Text style={styles.noteText} numberOfLines={2}>
              {item.text}
            </Text>
          </TouchableOpacity>
          <CustomIconButton
            name="delete"
            onPress={() => handleDeleteNote(item)}
            color={colors.error}
            size={24}
            style={{}}
            accessibilityLabel={t.notes.deleteNote}
            accessibilityHint={t.notes.deleteNote}
          />
        </View>
      );
    },
    [styles, handleNotePress, handleDeleteNote, colors, t],
  );

  /**
   * Generate unique key for each note
   */
  const keyExtractor = useCallback((item: Note, index: number) => {
    return `${item.book}-${item.chapter}-${item.verse}-${index}`;
  }, []);

  /**
   * Convert notes object to array
   */
  const notesArray = useMemo(() => {
    try {
      const array = Object.values(notes).filter(
        (note): note is Note => note !== null && typeof note === 'object',
      );

      logger.breadcrumb('Notes processed', 'data', {
        totalNotes: array.length,
        screen: 'NotesScreen',
      });

      return array;
    } catch (error) {
      logger.error('Error processing notes', error as Error, {
        screen: 'NotesScreen',
        action: 'notesArray',
      });
      return [];
    }
  }, [notes]);

  /**
   * Render empty state
   */
  const renderEmptyComponent = useCallback(() => {
    return (
      <View style={styles.emptyContainer}>
        <Text
          style={styles.emptyText}
          accessibilityRole="text"
          accessibilityLabel={t.notes.emptyState}>
          {t.notes.emptyState}
        </Text>
      </View>
    );
  }, [styles, t]);

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={t.notes.screenLabel}
      accessibilityHint={t.notes.screenHint}>
      <FlashList
        data={notesArray}
        renderItem={renderNoteItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={
          notesArray.length === 0 ? styles.emptyListContainer : undefined
        }
      />
    </View>
  );
};

/**
 * Create styles based on theme colors
 */
const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    noteItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    noteContent: {
      flex: 1,
    },
    noteReference: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
      letterSpacing: -0.2,
    },
    noteText: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 22,
      letterSpacing: 0.1,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
      color: colors.text,
    },
    emptyListContainer: {
      flex: 1,
    },
  });

export default React.memo(NotesScreen);
