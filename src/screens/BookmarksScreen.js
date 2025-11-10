import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, VirtualizedList, AccessibilityInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBookmarks } from '../context/BookmarksContext';
import { useStyles } from '../hooks/useStyles';
import { withTheme } from '../hoc/withTheme';
import { useTranslation } from 'react-i18next';
import { AnalyticsService } from '../services/AnalyticsService';
import CustomIconButton from '../components/CustomIconButton';
import HapticFeedback from '../services/HapticFeedback';

const BookmarkItem = React.memo(({ item, onPress, onRemove, styles, colors }) => {
  const { t } = useTranslation();
  return (
    <View style={[styles.bookmarkItem, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        onPress={onPress} 
        style={styles.bookmarkContent}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t('Marcador para {{book}} {{chapter}}:{{verse}}', { book: item.book, chapter: item.chapter, verse: item.verse })}
        accessibilityHint={t('Toca para ir a este versículo')}
      >
        <Text style={[styles.bookmarkText, { color: colors.text }]}>{item.book} {item.chapter}:{item.verse}</Text>
      </TouchableOpacity>
      <CustomIconButton
        name="delete"
        onPress={onRemove}
        color={colors.primary}
        accessibilityLabel={t('Eliminar marcador')}
        accessibilityHint={t('Toca para eliminar este marcador')}
      />
    </View>
  );
});

const BookmarksScreen = ({ theme }) => {
  const navigation = useNavigation();
  const { bookmarks, removeBookmark } = useBookmarks();
  const { colors } = theme;
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(
      screenReaderEnabled => {
        setScreenReaderEnabled(screenReaderEnabled);
      }
    );

    const listener = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      screenReaderEnabled => {
        setScreenReaderEnabled(screenReaderEnabled);
      }
    );

    return () => {
      listener.remove();
    };
  }, []);

  const getItem = useCallback((data, index) => data[index], []);
  const getItemCount = useCallback((data) => data.length, []);
  const keyExtractor = useCallback((item, index) => `${item.book}-${item.chapter}-${item.verse}-${index}`, []);

  const renderItem = useCallback(({ item }) => (
    <BookmarkItem
      item={item}
      onPress={() => {
        navigation.navigate('Biblia', {
          screen: 'Verse',
          params: { book: item.book, chapter: item.chapter, verse: item.verse }
        });
        AnalyticsService.logEvent('favorite_verse_selected', { book: item.book, chapter: item.chapter, verse: item.verse });
        HapticFeedback.light();
      }}
      onRemove={() => {
        removeBookmark(item.book, item.chapter, item.verse);
        AnalyticsService.logEvent('favorite_verse_removed', { book: item.book, chapter: item.chapter, verse: item.verse });
        HapticFeedback.medium();
        AccessibilityInfo.announceForAccessibility(t('Marcador eliminado'));
      }}
      styles={styles}
      colors={colors}
    />
  ), [navigation, removeBookmark, styles, colors, t]);

  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
      accessible={true}
      accessibilityLabel={t('Pantalla de marcadores')}
      accessibilityHint={t('Lista de tus versículos favoritos')}
    >
      <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">{t('Mis versículos favoritos')}</Text>
      <VirtualizedList
        data={bookmarks}
        initialNumToRender={10}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemCount={getItemCount}
        getItem={getItem}
        maxToRenderPerBatch={10}
        windowSize={21}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        ListEmptyComponent={
          <Text 
            style={[styles.emptyText, { color: colors.text }]}
            accessibilityLabel={t('No tienes versículos favoritos')}
          >
            {t('Aún no tienes versículos favoritos')}
          </Text>
        }
        accessibilityLabel={t('Lista de marcadores')}
        accessibilityHint={t('Desplázate para explorar tus versículos favoritos')}
      />
    </View>
  );
};

const createStyles = (colors, fontSize, fontFamily) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: fontSize + 4,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  bookmarkContent: {
    flex: 1,
  },
  bookmarkText: {
    fontFamily,
    fontSize: fontSize,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontFamily,
    fontSize: fontSize,
  },
});

export default withTheme(React.memo(BookmarksScreen));