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
import { getBookName } from '../data/bookNames';

const BibleListScreen = ({ theme }) => {
  const navigation = useNavigation();
  const { colors } = theme;
  const styles = useStyles(createStyles);
  const { t, i18n } = useTranslation();

  const sections = useMemo(() => [
    { title: t('Antiguo Testamento'), data: bibleBooks["Antiguo Testamento"] },
    { title: t('Nuevo Testamento'), data: bibleBooks["Nuevo Testamento"] }
  ], [t]);

  const getBookKeyFromFileName = useCallback((fileName) => {
    // Convierte "genesis.json" -> "genesis", "1-samuel.json" -> "1samuel"
    return fileName.replace('.json', '').replace(/-/g, '');
  }, []);

  const navigateToChapter = useCallback((bookFileName) => {
    const bookKey = getBookKeyFromFileName(bookFileName);
    navigation.navigate('Chapter', { book: bookKey });
    AnalyticsService.logEvent('select_book', { book: bookKey });
  }, [navigation, getBookKeyFromFileName]);

  const renderItem = useCallback(({ item, index, section }) => {
    const bookKey = getBookKeyFromFileName(item);
    const bookName = getBookName(bookKey, i18n.language);
    return (
      <TouchableOpacity
        style={styles.bookItem}
        onPress={() => navigateToChapter(item)}
        accessibilityRole="button"
        accessibilityLabel={t('Libro de') + ' ' + bookName}
        accessibilityHint={t('Toca para ver los capítulos de') + ' ' + bookName}
      >
        <CustomIconButton
          name="book"
          size={24}
          color={colors.primary}
          style={styles.bookIcon}
        />
        <Text style={styles.bookName}>{bookName}</Text>
        <CustomIconButton
          name="chevron-right"
          size={24}
          color={colors.secondary}
        />
      </TouchableOpacity>
    );
  }, [styles, navigateToChapter, getBookKeyFromFileName, colors, t, i18n.language]);

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