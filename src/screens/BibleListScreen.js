import React, { useCallback, useMemo } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import CustomIconButton from '../components/CustomIconButton';
import { useStyles } from '../hooks/useStyles';
import { withTheme } from '../hoc/withTheme';
import { AnalyticsService } from '../services/AnalyticsService';
import { useTranslation } from 'react-i18next';
import bibleBooks from '../data/bibleBooks.json';

const BibleListScreen = ({ theme }) => {
  const navigation = useNavigation();
  const { colors } = theme;
  const styles = useStyles(createStyles);
  const { t } = useTranslation();

  const sections = useMemo(() => [
    { title: t('Antiguo Testamento'), data: bibleBooks["Antiguo Testamento"] },
    { title: t('Nuevo Testamento'), data: bibleBooks["Nuevo Testamento"] }
  ], [t]);

  const getBookNameFromFileName = useCallback((fileName) => {
    return fileName.replace('.json', '').replace(/-/g, ' ').replace(/(\d+)\s/, '$1 ');
  }, []);

  const navigateToChapter = useCallback((bookFileName) => {
    const bookName = getBookNameFromFileName(bookFileName);
    navigation.navigate('Chapter', { book: bookName });
    AnalyticsService.logEvent('select_book', { book: bookName });
  }, [navigation, getBookNameFromFileName]);

  const renderItem = useCallback(({ item, index, section }) => (
    <TouchableOpacity
      style={styles.bookItem}
      onPress={() => navigateToChapter(item)}
      accessibilityRole="button"
      accessibilityLabel={t('Libro de') + ' ' + getBookNameFromFileName(item)}
      accessibilityHint={t('Toca para ver los capítulos de') + ' ' + getBookNameFromFileName(item)}
    >
      <CustomIconButton 
        name="book" 
        size={24} 
        color={colors.primary} 
        style={styles.bookIcon}
      />
      <Text style={styles.bookName}>{getBookNameFromFileName(item)}</Text>
      <CustomIconButton 
        name="chevron-right" 
        size={24} 
        color={colors.secondary}
      />
    </TouchableOpacity>
  ), [styles, navigateToChapter, getBookNameFromFileName, colors, t]);

  const renderSectionHeader = useCallback(({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  ), [styles]);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item}
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
  listContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    backgroundColor: colors.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bookIcon: {
    marginRight: 16,
  },
  bookName: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
});

export default withTheme(React.memo(BibleListScreen));