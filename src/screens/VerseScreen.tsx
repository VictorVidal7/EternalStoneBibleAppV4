import React, {useState, useCallback, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ToastAndroid,
  Platform,
  Alert,
  Share,
  TextInput,
  FlatList,
  Animated,
  StyleSheet,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  PanGestureHandler,
  State,
  HandlerStateChangeEvent,
} from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import {useBookmarks} from '../context/BookmarksContext';
import {useUserPreferences} from '../context/UserPreferencesContext';
import {useNotes} from '../context/NotesContext';
import {useStyles} from '../hooks/useStyles';
import NoteModal from '../components/NoteModal';
import DistractionFreeMode from '../components/DistractionFreeMode';
import {useLanguage} from '../hooks/useLanguage';
import {withTheme} from '../hoc/withTheme';
import {AnalyticsService} from '../services/AnalyticsService';
import CustomIconButton from '../components/CustomIconButton';
import HapticFeedback from '../services/HapticFeedback';
import {getChapter, getBookChapters} from '../services/bibleDataManager';
import {getBookName} from '../data/bookNames';
import {logger} from '../lib/utils/logger';

const INITIAL_VERSES_TO_LOAD = 20;
const VERSES_PER_BATCH = 10;

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface Verse {
  number: number;
  text: string;
}

interface RouteParams {
  book: string;
  chapter: number;
  initialVerse?: number;
}

interface VerseScreenRoute {
  params: RouteParams;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  card: string;
  border: string;
  highlight: string;
}

interface Theme {
  colors: ThemeColors;
}

interface VerseItemProps {
  item: Verse;
  onToggleBookmark: (verseNumber: number) => void;
  onShareVerse: (verse: Verse) => void;
  onOpenNoteModal: (verse: Verse) => void;
  onCopyVerse: (verse: Verse) => void;
  styles: any;
  colors: ThemeColors;
  isBookmarked: (verseNumber: number) => boolean;
  isHighlighted: boolean;
}

interface VerseScreenProps {
  route: VerseScreenRoute;
  theme: Theme;
}

// ============================================================================
// VerseItem Component
// ============================================================================

const VerseItem: React.FC<VerseItemProps> = React.memo(
  ({
    item,
    onToggleBookmark,
    onShareVerse,
    onOpenNoteModal,
    onCopyVerse,
    styles,
    colors,
    isBookmarked,
    isHighlighted,
  }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const {t} = useLanguage();

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }, [fadeAnim, scaleAnim]);

    const animatePress = useCallback(() => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        }),
      ]).start();
    }, [scaleAnim]);

    if (!item) return null;

    return (
      <Animated.View
        style={[
          styles.verseContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
          isHighlighted && styles.highlightedVerse,
        ]}
        accessible={true}
        accessibilityLabel={`Versículo ${item.number}`}
        accessibilityRole="text"
        accessibilityHint="Desliza hacia arriba o abajo para navegar entre versículos">
        <View style={styles.verseHeader}>
          <Text style={styles.verseNumber}>{item.number}</Text>
          <View style={styles.verseActions}>
            <CustomIconButton
              name={isBookmarked(item.number) ? 'bookmark' : 'bookmark-border'}
              onPress={() => {
                animatePress();
                HapticFeedback.light();
                onToggleBookmark(item.number);
              }}
              color={colors.primary}
              style={{}}
              accessibilityLabel={
                isBookmarked(item.number)
                  ? t.verse.removeBookmark
                  : t.verse.addBookmark
              }
              accessibilityHint="Toca para añadir o quitar este versículo de tus marcadores"
            />
            <CustomIconButton
              name="share"
              onPress={() => {
                animatePress();
                HapticFeedback.light();
                onShareVerse(item);
              }}
              color={colors.primary}
              style={{}}
              accessibilityLabel={t.verse.shareVerse}
              accessibilityHint="Toca para compartir este versículo"
            />
            <CustomIconButton
              name="note-add"
              onPress={() => {
                animatePress();
                HapticFeedback.light();
                onOpenNoteModal(item);
              }}
              color={colors.primary}
              style={{}}
              accessibilityLabel={t.verse.addNote}
              accessibilityHint="Toca para añadir una nota a este versículo"
            />
            <CustomIconButton
              name="content-copy"
              onPress={() => {
                animatePress();
                HapticFeedback.light();
                onCopyVerse(item);
              }}
              color={colors.primary}
              style={{}}
              accessibilityLabel={t.verse.copyVerse}
              accessibilityHint="Toca para copiar este versículo al portapapeles"
            />
          </View>
        </View>
        <Text style={styles.verseText} testID={`verse-text-${item.number}`}>
          {item.text}
        </Text>
      </Animated.View>
    );
  },
);

VerseItem.displayName = 'VerseItem';

// ============================================================================
// VerseScreen Main Component
// ============================================================================

const VerseScreen: React.FC<VerseScreenProps> = ({route, theme}) => {
  const {book, chapter: initialChapter, initialVerse} = route.params;
  const [chapter, setChapter] = useState<number>(initialChapter);
  const {bookmarks, addBookmark, removeBookmark} = useBookmarks();
  const {addNote, getNote} = useNotes();
  const {fontSize, changeFontSize} = useUserPreferences();
  const [localFontSize, setLocalFontSize] = useState<number>(fontSize);
  const {colors} = theme;
  const styles = useStyles(createStyles);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [noteModalVisible, setNoteModalVisible] = useState<boolean>(false);
  const [currentVerse, setCurrentVerse] = useState<Verse | null>(null);
  const {t, language} = useLanguage();
  const bookName = getBookName(book, language);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [highlightedVerses, setHighlightedVerses] = useState<number[]>([]);
  const [totalChapters, setTotalChapters] = useState<number>(0);
  const [isDistractionFreeMode, setIsDistractionFreeMode] =
    useState<boolean>(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [hasMoreVerses, setHasMoreVerses] = useState<boolean>(true);

  const listRef = useRef<FlatList<Verse>>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ============================================================================
  // Load Verses Function
  // ============================================================================

  const loadVerses = useCallback(
    async (
      bookToLoad: string,
      chapterToLoad: number,
      start: number = 0,
      limit: number = INITIAL_VERSES_TO_LOAD,
    ) => {
      try {
        setLoading(true);
        setError(null);

        logger.breadcrumb('Loading verses', 'data', {
          book: bookToLoad,
          chapter: chapterToLoad,
          start,
          limit,
        });

        const chapterData = getChapter(bookToLoad, chapterToLoad);

        if (!chapterData) {
          throw new Error(t.verse.errorLoadingVerses);
        }

        // chapterData ya es un array de objetos {number, text}
        const allVerses: Verse[] = Array.isArray(chapterData)
          ? chapterData
          : [];
        const chapterVerses = allVerses.slice(start, start + limit);

        if (!chapterVerses || chapterVerses.length === 0) {
          throw new Error(t.verse.errorLoadingVerses);
        }

        setVerses(prevVerses =>
          start === 0 ? chapterVerses : [...prevVerses, ...chapterVerses],
        );
        setHasMoreVerses(chapterVerses.length === limit);
        setTotalChapters(getBookChapters(bookToLoad));

        AnalyticsService.logScreenView(`Verse_${bookToLoad}_${chapterToLoad}`);

        logger.breadcrumb('Verses loaded successfully', 'data', {
          book: bookToLoad,
          chapter: chapterToLoad,
          versesCount: chapterVerses.length,
        });
      } catch (error) {
        logger.error('Error loading verses', error as Error, {
          screen: 'VerseScreen',
          book: bookToLoad,
          chapter: chapterToLoad,
        });
        setError(t.verse.errorLoadingVerses);
      } finally {
        setLoading(false);
        setIsTransitioning(false);
      }
    },
    [t],
  );

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    loadVerses(book, chapter);
  }, [book, chapter, loadVerses]);

  useEffect(() => {
    if (initialVerse && listRef.current) {
      const index = verses.findIndex(v => v.number === initialVerse);
      if (index !== -1) {
        listRef.current.scrollToIndex({index, animated: true});
        setCurrentVerseIndex(index);

        logger.breadcrumb('Scrolled to initial verse', 'ui', {
          verse: initialVerse,
          index,
        });
      }
    }
  }, [initialVerse, verses]);

  // ============================================================================
  // Animation Functions
  // ============================================================================

  const animateTransition = useCallback(
    (direction: number) => {
      setIsTransitioning(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -100 * direction,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        slideAnim.setValue(100 * direction);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsTransitioning(false);
        });
      });
    },
    [fadeAnim, slideAnim],
  );

  // ============================================================================
  // Bookmark Functions
  // ============================================================================

  const isBookmarked = useCallback(
    (verse: number): boolean => {
      return bookmarks.some(
        (b: any) =>
          b.book === book && b.chapter === chapter && b.verse === verse,
      );
    },
    [bookmarks, book, chapter],
  );

  const toggleBookmark = useCallback(
    (verse: number) => {
      if (isBookmarked(verse)) {
        removeBookmark(book, chapter, verse);
        AnalyticsService.logEvent('remove_bookmark', {book, chapter, verse});

        logger.breadcrumb('Bookmark removed', 'user-action', {
          book,
          chapter,
          verse,
        });
      } else {
        addBookmark(book, chapter, verse);
        AnalyticsService.logEvent('add_bookmark', {book, chapter, verse});

        logger.breadcrumb('Bookmark added', 'user-action', {
          book,
          chapter,
          verse,
        });
      }
    },
    [isBookmarked, addBookmark, removeBookmark, book, chapter],
  );

  // ============================================================================
  // Verse Actions
  // ============================================================================

  const shareVerse = useCallback(
    async (verse: Verse) => {
      try {
        const result = await Share.share({
          message: `${verse.text} - ${book} ${chapter}:${verse.number}`,
          title: `${book} ${chapter}:${verse.number}`,
        });

        if (result.action === Share.sharedAction) {
          logger.breadcrumb('Verse shared', 'user-action', {
            book,
            chapter,
            verse: verse.number,
          });
          AnalyticsService.logEvent('share_verse', {
            book,
            chapter,
            verse: verse.number,
          });
        }
      } catch (error) {
        logger.error('Error sharing verse', error as Error, {
          screen: 'VerseScreen',
          book,
          chapter,
          verse: verse.number,
        });
        Alert.alert(t.error, t.verse.errorSharingVerse);
      }
    },
    [book, chapter, t],
  );

  const copyVerse = useCallback(
    (verse: Verse) => {
      Clipboard.setString(`${verse.text} - ${book} ${chapter}:${verse.number}`);

      if (Platform.OS === 'android') {
        ToastAndroid.show(t.verse.verseCopied, ToastAndroid.SHORT);
      } else {
        Alert.alert(t.copied, t.verse.verseCopied);
      }

      AnalyticsService.logEvent('copy_verse', {
        book,
        chapter,
        verse: verse.number,
      });

      logger.breadcrumb('Verse copied', 'user-action', {
        book,
        chapter,
        verse: verse.number,
      });
    },
    [book, chapter, t],
  );

  // ============================================================================
  // Note Functions
  // ============================================================================

  const openNoteModal = useCallback(
    (verse: Verse) => {
      setCurrentVerse(verse);
      setNoteModalVisible(true);

      logger.breadcrumb('Note modal opened', 'ui', {
        book,
        chapter,
        verse: verse.number,
      });
    },
    [book, chapter],
  );

  const closeNoteModal = useCallback(() => {
    setNoteModalVisible(false);
  }, []);

  const saveNote = useCallback(
    (noteText: string) => {
      if (currentVerse) {
        addNote(book, chapter, currentVerse.number, noteText);
        AnalyticsService.logEvent('add_note', {
          book,
          chapter,
          verse: currentVerse.number,
        });

        logger.breadcrumb('Note saved', 'user-action', {
          book,
          chapter,
          verse: currentVerse.number,
          noteLength: noteText.length,
        });
      }
      setNoteModalVisible(false);
    },
    [addNote, book, chapter, currentVerse],
  );

  // ============================================================================
  // Search Functions
  // ============================================================================

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() === '') {
      setHighlightedVerses([]);
      return;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const matchingVerses = verses
      .filter(verse => verse.text.toLowerCase().includes(lowercaseQuery))
      .map(verse => verse.number);

    setHighlightedVerses(matchingVerses);

    if (matchingVerses.length > 0 && listRef.current) {
      const index = verses.findIndex(v => v.number === matchingVerses[0]);
      if (index !== -1) {
        listRef.current.scrollToIndex({index, animated: true});
      }
    }

    AnalyticsService.logEvent('search_within_chapter', {
      book,
      chapter,
      query: searchQuery,
    });

    logger.breadcrumb('Search within chapter', 'user-action', {
      book,
      chapter,
      query: searchQuery,
      resultsCount: matchingVerses.length,
    });
  }, [searchQuery, verses, book, chapter]);

  // ============================================================================
  // Navigation Functions
  // ============================================================================

  const navigateToChapter = useCallback(
    (newChapter: number) => {
      if (newChapter > 0 && newChapter <= totalChapters && !isTransitioning) {
        const direction = newChapter > chapter ? 1 : -1;
        animateTransition(direction);
        setChapter(newChapter);
        setSearchQuery('');
        setHighlightedVerses([]);
        loadVerses(book, newChapter);
        AnalyticsService.logEvent('navigate_chapter', {
          book,
          from: chapter,
          to: newChapter,
        });

        logger.breadcrumb('Navigate to chapter', 'navigation', {
          book,
          fromChapter: chapter,
          toChapter: newChapter,
        });
      }
    },
    [
      totalChapters,
      chapter,
      book,
      animateTransition,
      isTransitioning,
      loadVerses,
    ],
  );

  const handleGesture = useCallback(
    ({nativeEvent}: HandlerStateChangeEvent) => {
      if (nativeEvent.state === State.END) {
        if (nativeEvent.translationX > 50) {
          const prevChapter = chapter > 1 ? chapter - 1 : 1;
          if (prevChapter !== chapter) {
            navigateToChapter(prevChapter);
          }
        } else if (nativeEvent.translationX < -50) {
          const nextChapter =
            chapter < totalChapters ? chapter + 1 : totalChapters;
          if (nextChapter !== chapter) {
            navigateToChapter(nextChapter);
          }
        }
      }
    },
    [chapter, totalChapters, navigateToChapter],
  );

  // ============================================================================
  // Distraction Free Mode Functions
  // ============================================================================

  const toggleDistractionFreeMode = useCallback(() => {
    setIsDistractionFreeMode(prev => !prev);
    AnalyticsService.logEvent('toggle_distraction_free_mode', {
      enabled: !isDistractionFreeMode,
    });

    logger.breadcrumb('Toggle distraction free mode', 'user-action', {
      enabled: !isDistractionFreeMode,
    });
  }, [isDistractionFreeMode]);

  const handleNextVerse = useCallback(() => {
    if (currentVerseIndex < verses.length - 1) {
      setCurrentVerseIndex(prev => prev + 1);
    }
  }, [currentVerseIndex, verses.length]);

  const handlePreviousVerse = useCallback(() => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(prev => prev - 1);
    }
  }, [currentVerseIndex]);

  // ============================================================================
  // Font Size Functions
  // ============================================================================

  const handleFontSizeChange = useCallback(
    (value: number) => {
      const newSize = Math.round(value);
      setLocalFontSize(newSize);
      changeFontSize(newSize);

      logger.breadcrumb('Font size changed', 'user-action', {
        newSize,
      });
    },
    [changeFontSize],
  );

  // ============================================================================
  // FlatList Functions
  // ============================================================================

  const renderItem = useCallback(
    ({item}: {item: Verse}) => (
      <VerseItem
        item={item}
        onToggleBookmark={toggleBookmark}
        onShareVerse={shareVerse}
        onOpenNoteModal={openNoteModal}
        onCopyVerse={copyVerse}
        styles={styles}
        colors={colors}
        isBookmarked={isBookmarked}
        isHighlighted={highlightedVerses.includes(item.number)}
      />
    ),
    [
      toggleBookmark,
      shareVerse,
      openNoteModal,
      copyVerse,
      styles,
      colors,
      isBookmarked,
      highlightedVerses,
    ],
  );

  const keyExtractor = useCallback((item: Verse) => `verse-${item.number}`, []);

  const onEndReached = useCallback(() => {
    if (!loading && hasMoreVerses) {
      loadVerses(book, chapter, verses.length, VERSES_PER_BATCH);
    }
  }, [loading, hasMoreVerses, book, chapter, verses.length, loadVerses]);

  const memoizedVerses = useMemo(() => verses, [verses]);

  // ============================================================================
  // Render Loading State
  // ============================================================================

  if (loading && verses.length === 0) {
    return (
      <View
        style={styles.loadingContainer}
        accessibilityLabel={t.verse.loadingVerses}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ============================================================================
  // Render Error State
  // ============================================================================

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text
          style={styles.errorText}
          accessibilityLabel={t.verse.errorLoadingVerses}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadVerses(book, chapter)}
          accessibilityLabel={t.verse.retry}
          accessibilityHint="Toca para intentar cargar los versículos nuevamente">
          <Text style={styles.retryButtonText}>{t.verse.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================================
  // Render Distraction Free Mode
  // ============================================================================

  if (isDistractionFreeMode) {
    return (
      <DistractionFreeMode
        verses={verses.map(v => ({...v, book, chapter}))}
        currentVerseIndex={currentVerseIndex}
        onNextVerse={handleNextVerse}
        onPreviousVerse={handlePreviousVerse}
        onClose={toggleDistractionFreeMode}
      />
    );
  }

  // ============================================================================
  // Render Main Screen
  // ============================================================================

  return (
    <PanGestureHandler onHandlerStateChange={handleGesture}>
      <View style={styles.container} testID="verse-screen-container">
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{translateX: slideAnim}],
            },
          ]}>
          <View style={styles.header}>
            <CustomIconButton
              name="chevron-left"
              onPress={() => navigateToChapter(chapter - 1)}
              disabled={chapter === 1}
              color={chapter === 1 ? colors.secondary : colors.primary}
              style={{}}
              accessibilityLabel={t.verse.prevChapter}
              accessibilityHint="Navegar al capítulo anterior"
            />
            <Text
              style={styles.chapterTitle}
              accessibilityRole="header">{`${bookName} ${chapter}`}</Text>
            <CustomIconButton
              name="chevron-right"
              onPress={() => navigateToChapter(chapter + 1)}
              disabled={chapter === totalChapters}
              color={
                chapter === totalChapters ? colors.secondary : colors.primary
              }
              style={{}}
              accessibilityLabel={t.verse.nextChapter}
              accessibilityHint="Navegar al siguiente capítulo"
            />
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.verse.searchInChapter}
              placeholderTextColor={colors.secondary}
              accessibilityLabel="Buscar en el capítulo actual"
              accessibilityHint="Ingresa texto para buscar en el capítulo actual"
            />
            <CustomIconButton
              name="search"
              onPress={handleSearch}
              color={colors.primary}
              style={{}}
              accessibilityLabel={t.search.title}
              accessibilityHint="Realizar búsqueda en el capítulo actual"
            />
          </View>
          <View style={styles.settingsContainer}>
            <Text style={styles.settingLabel}>
              {t.verse.fontSize}: {localFontSize}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={12}
              maximumValue={24}
              step={1}
              value={localFontSize}
              onValueChange={handleFontSizeChange}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.secondary}
              thumbTintColor={colors.primary}
              accessibilityLabel="Control deslizante de tamaño de fuente"
              accessibilityHint="Desliza para ajustar el tamaño de la fuente"
            />
          </View>
          <FlatList
            ref={listRef}
            data={memoizedVerses}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            initialNumToRender={INITIAL_VERSES_TO_LOAD}
            maxToRenderPerBatch={VERSES_PER_BATCH}
            windowSize={21}
            removeClippedSubviews={true}
            contentContainerStyle={styles.listContent}
            style={styles.list}
            ListFooterComponent={
              loading && verses.length > 0 ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.loadingMore}
                />
              ) : null
            }
            accessibilityLabel={t.verse.versesList}
            accessibilityHint="Desplázate para leer los versículos del capítulo"
          />
        </Animated.View>
        <CustomIconButton
          name="fullscreen"
          onPress={toggleDistractionFreeMode}
          style={styles.distractionFreeModeButton}
          color={colors.background}
          accessibilityLabel={t.verse.distractionFreeMode}
          accessibilityHint="Activa el modo de lectura sin distracciones"
        />
        <NoteModal
          visible={noteModalVisible}
          onClose={closeNoteModal}
          verse={currentVerse}
          onSave={saveNote}
          initialNote={
            currentVerse ? getNote(book, chapter, currentVerse.number) : ''
          }
        />
      </View>
    </PanGestureHandler>
  );
};

// ============================================================================
// Styles
// ============================================================================

const createStyles = (
  colors: ThemeColors,
  fontSize: number,
  fontFamily: string,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    errorText: {
      color: colors.text,
      fontSize: 16,
      marginBottom: 20,
      textAlign: 'center',
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryButtonText: {
      color: colors.background,
      fontSize: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    chapterTitle: {
      fontSize: fontSize + 4,
      fontWeight: '700',
      color: colors.text,
      fontFamily,
      letterSpacing: -0.3,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    searchInput: {
      flex: 1,
      height: 44,
      borderWidth: 0,
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 16,
      marginRight: 12,
      color: colors.text,
      fontFamily,
      fontSize: fontSize,
    },
    settingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      color: colors.text,
      fontFamily,
      fontSize: fontSize,
      marginRight: 10,
    },
    slider: {
      flex: 1,
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 40,
    },
    verseContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    verseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    verseNumber: {
      color: colors.secondary,
      fontFamily,
      fontSize: fontSize - 2,
      fontWeight: '700',
      letterSpacing: -0.2,
    },
    verseActions: {
      flexDirection: 'row',
    },
    highlightedVerse: {
      backgroundColor: colors.highlight,
    },
    verseText: {
      color: colors.text,
      fontFamily,
      fontSize: fontSize,
      lineHeight: fontSize * 1.6,
      letterSpacing: 0.1,
    },
    distractionFreeModeButton: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      backgroundColor: colors.primary,
    },
    loadingMore: {
      paddingVertical: 20,
    },
  });

export default React.memo(withTheme(VerseScreen));
