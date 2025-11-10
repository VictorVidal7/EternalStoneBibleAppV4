import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotes } from '../context/NotesContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import CustomIconButton from '../components/CustomIconButton';

const NotesScreen = () => {
  const navigation = useNavigation();
  const { notes, deleteNote } = useNotes();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleNotePress = useCallback((note) => {
    navigation.navigate('Biblia', {
      screen: 'Verse',
      params: { book: note.book, chapter: note.chapter, verse: note.verse }
    });
  }, [navigation]);

  const handleDeleteNote = useCallback((note) => {
    deleteNote(note.book, note.chapter, note.verse);
  }, [deleteNote]);

  const renderNoteItem = useCallback(({ item }) => {
    console.log('Renderizando nota:', item);
    return (
      <View style={styles.noteItem}>
        <TouchableOpacity onPress={() => handleNotePress(item)} style={styles.noteContent}>
          <Text style={styles.noteReference}>{`${item.book} ${item.chapter}:${item.verse}`}</Text>
          <Text style={styles.noteText} numberOfLines={2}>{item.text}</Text>
        </TouchableOpacity>
        <CustomIconButton
          name="delete"
          onPress={() => handleDeleteNote(item)}
          color={colors.error}
          size={24}
          accessibilityLabel={t('Eliminar nota')}
        />
      </View>
    );
  }, [styles, handleNotePress, handleDeleteNote, colors, t]);

  const keyExtractor = useCallback((item) => {
    return `${item.book}-${item.chapter}-${item.verse}`;
  }, []);

  const notesArray = useMemo(() => {
    return Object.values(notes).filter(note => note && typeof note === 'object');
  }, [notes]);

  console.log('Notas procesadas:', notesArray);

  return (
    <View style={styles.container}>
      <FlatList
        data={notesArray}
        renderItem={renderNoteItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('No tienes notas guardadas')}</Text>
        }
      />
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noteContent: {
    flex: 1,
  },
  noteReference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: colors.text,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: colors.text,
  },
});

export default React.memo(NotesScreen);