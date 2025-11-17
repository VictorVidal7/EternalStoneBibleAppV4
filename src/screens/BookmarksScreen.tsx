import React, {useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FlashList} from '@shopify/flash-list';
import {useBookmarks} from '../context/BookmarksContext';
import {useTheme} from '../context/ThemeContext';
import {useUserPreferences} from '../context/UserPreferencesContext';
import {useLanguage} from '../hooks/useLanguage';
import CustomIconButton from '../components/CustomIconButton';
import HapticFeedback from '../services/HapticFeedback';
import {logger} from '../lib/utils/logger';

// Interfaces
interface Bookmark {
  book: string;
  chapter: number;
  verse: number;
}

interface BookmarkItemProps {
  item: Bookmark;
  onPress: () => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}

interface ThemeColors {
  background: string;
  card: string;
  text: string;
  primary: string;
  border: string;
  notification: string;
}

// Memoized BookmarkItem component
const BookmarkItem = React.memo<BookmarkItemProps>(
  ({item, onPress, onRemove, styles, colors}) => {
    const {t} = useLanguage();

    return (
      <View style={[styles.bookmarkItem, {backgroundColor: colors.card}]}>
        <TouchableOpacity
          onPress={onPress}
          style={styles.bookmarkContent}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t.bookmarks.itemLabel
            .replace('{{book}}', item.book)
            .replace('{{chapter}}', String(item.chapter))
            .replace('{{verse}}', String(item.verse))}
          accessibilityHint={t.bookmarks.itemHint}>
          <Text style={[styles.bookmarkText, {color: colors.text}]}>
            {item.book} {item.chapter}:{item.verse}
          </Text>
        </TouchableOpacity>
        <CustomIconButton
          name="delete"
          onPress={onRemove}
          color={colors.primary}
          style={{}}
          accessibilityLabel={t.bookmarks.deleteLabel}
          accessibilityHint={t.bookmarks.deleteHint}
        />
      </View>
    );
  },
);

BookmarkItem.displayName = 'BookmarkItem';

const BookmarksScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {bookmarks: rawBookmarks, removeBookmark} = useBookmarks();
  const {colors} = useTheme();
  const {fontSize, fontFamily} = useUserPreferences();
  const {t} = useLanguage();

  // Type-safe bookmarks array
  const bookmarks = useMemo<Bookmark[]>(() => {
    if (!Array.isArray(rawBookmarks)) {
      return [];
    }
    return rawBookmarks.filter(
      (item): item is Bookmark =>
        item !== null &&
        typeof item === 'object' &&
        'book' in item &&
        'chapter' in item &&
        'verse' in item,
    );
  }, [rawBookmarks]);

  // Memoized styles
  const styles = useMemo(
    () => createStyles(fontSize, fontFamily),
    [fontSize, fontFamily],
  );

  // Key extractor for FlashList
  const keyExtractor = useCallback(
    (item: Bookmark, index: number) =>
      `${item.book}-${item.chapter}-${item.verse}-${index}`,
    [],
  );

  // Handle bookmark press
  const handleBookmarkPress = useCallback(
    (item: Bookmark) => {
      try {
        navigation.navigate('Biblia', {
          screen: 'Verse',
          params: {book: item.book, chapter: item.chapter, verse: item.verse},
        });

        HapticFeedback.light();

        logger.breadcrumb('Bookmark selected', 'user-action', {
          screen: 'BookmarksScreen',
          book: item.book,
          chapter: item.chapter,
          verse: item.verse,
        });
      } catch (error) {
        logger.error(
          'Error navigating to verse from bookmark',
          error as Error,
          {
            screen: 'BookmarksScreen',
            action: 'handleBookmarkPress',
            bookmark: item,
          },
        );
      }
    },
    [navigation],
  );

  // Handle bookmark removal
  const handleBookmarkRemove = useCallback(
    (item: Bookmark) => {
      try {
        removeBookmark(item.book, item.chapter, item.verse);

        HapticFeedback.medium();

        // Announce for accessibility
        AccessibilityInfo.announceForAccessibility(t.bookmarks.removed);

        logger.breadcrumb('Bookmark removed', 'user-action', {
          screen: 'BookmarksScreen',
          book: item.book,
          chapter: item.chapter,
          verse: item.verse,
        });
      } catch (error) {
        logger.error('Error removing bookmark', error as Error, {
          screen: 'BookmarksScreen',
          action: 'handleBookmarkRemove',
          bookmark: item,
        });
      }
    },
    [removeBookmark, t],
  );

  // Render item for FlashList
  const renderItem = useCallback(
    ({item}: {item: Bookmark}) => (
      <BookmarkItem
        item={item}
        onPress={() => handleBookmarkPress(item)}
        onRemove={() => handleBookmarkRemove(item)}
        styles={styles}
        colors={colors}
      />
    ),
    [handleBookmarkPress, handleBookmarkRemove, styles, colors],
  );

  // Empty list component
  const renderEmptyComponent = useCallback(
    () => (
      <Text
        style={[styles.emptyText, {color: colors.text}]}
        accessibilityLabel={t.bookmarks.noBookmarksA11y}>
        {t.bookmarks.noBookmarks}
      </Text>
    ),
    [styles, colors, t],
  );

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background}]}
      accessible={true}
      accessibilityLabel={t.bookmarks.screenLabel}
      accessibilityHint={t.bookmarks.screenHint}>
      <Text
        style={[styles.title, {color: colors.text}]}
        accessibilityRole="header">
        {t.bookmarks.title}
      </Text>
      <FlashList
        data={bookmarks}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
};

// Create styles function
const createStyles = (fontSize: number, fontFamily: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    title: {
      fontSize: fontSize + 6,
      fontWeight: '700',
      marginBottom: 20,
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    bookmarkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    bookmarkContent: {
      flex: 1,
    },
    bookmarkText: {
      fontFamily,
      fontSize: fontSize + 1,
      fontWeight: '600',
      letterSpacing: -0.2,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 20,
      fontFamily,
      fontSize: fontSize,
    },
  });

export default React.memo(BookmarksScreen);
