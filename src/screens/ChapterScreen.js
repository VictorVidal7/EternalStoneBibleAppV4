import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getBookChapters } from '../services/bibleDataManager';
import { useTheme } from '../context/ThemeContext';
import { useStyles } from '../hooks/useStyles';
import { AnalyticsService } from '../services/AnalyticsService';
import { useTranslation } from 'react-i18next';
import CustomIconButton from '../components/CustomIconButton';

const ChapterScreen = ({ route }) => {
  const { book } = route.params;
  const [chapters, setChapters] = useState([]);
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const { t } = useTranslation();

  useEffect(() => {
    const loadChapters = async () => {
      const chapterCount = await getBookChapters(book);
      setChapters(Array.from({ length: chapterCount }, (_, i) => i + 1));
    };
    loadChapters();
  }, [book]);

  const navigateToVerse = useCallback((chapter) => {
    navigation.navigate('Verse', { book, chapter });
    AnalyticsService.logEvent('select_chapter', { book, chapter });
  }, [navigation, book]);

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={styles.chapterItem}
      onPress={() => navigateToVerse(item)}
      accessibilityRole="button"
      accessibilityLabel={t('Capítulo') + ' ' + item}
      accessibilityHint={t('Toca para leer el capítulo') + ' ' + item + ' ' + t('de') + ' ' + book}
    >
      <Text style={styles.chapterText}>{item}</Text>
    </TouchableOpacity>
  ), [styles, navigateToVerse, book, t]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomIconButton 
          name="book" 
          size={24} 
          color={colors.primary}
        />
        <Text style={styles.bookTitle}>{book}</Text>
      </View>
      <FlatList
        data={chapters}
        renderItem={renderItem}
        keyExtractor={(item) => item.toString()}
        numColumns={3}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 16,
  },
  listContent: {
    padding: 16,
  },
  chapterItem: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  chapterText: {
    fontSize: 18,
    color: colors.text,
  },
});

export default React.memo(ChapterScreen);