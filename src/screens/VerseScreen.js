import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  StyleSheet
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { useNavigation } from '@react-navigation/native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Slider from '@react-native-community/slider';
import { useBookmarks } from '../context/BookmarksContext';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { useNotes } from '../context/NotesContext';
import { useStyles } from '../hooks/useStyles';
import { useScreenReaderListener } from '../hooks/useScreenReaderListener';
import NoteModal from '../components/NoteModal';
import DistractionFreeMode from '../components/DistractionFreeMode';
import { useTranslation } from 'react-i18next';
import { withTheme } from '../hoc/withTheme';
import { AnalyticsService } from '../services/AnalyticsService';
import CustomIconButton from '../components/CustomIconButton';
import HapticFeedback from '../services/HapticFeedback';
import { getChapter, getBookChapters } from '../services/bibleDataManager';
import { getBookName } from '../data/bookNames';

const INITIAL_VERSES_TO_LOAD = 20;
const VERSES_PER_BATCH = 10;

const VerseItem = React.memo(({ item, onToggleBookmark, onShareVerse, onOpenNoteModal, onCopyVerse, styles, colors, isBookmarked, isHighlighted }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const { t } = useTranslation();

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
      })
    ]).start();
  }, []);

  const animatePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true })
    ]).start();
  }, [scaleAnim]);

  if (!item) return null;
  
  return (
    <Animated.View 
      style={[
        styles.verseContainer, 
        { 
          opacity: fadeAnim, 
          transform: [{ scale: scaleAnim }],
        },
        isHighlighted && styles.highlightedVerse
      ]}
      accessible={true}
      accessibilityLabel={t('Versículo') + ' ' + item.number}
      accessibilityRole="text"
      accessibilityHint={t('Desliza hacia arriba o abajo para navegar entre versículos')}
    >
      <View style={styles.verseHeader}>
        <Text style={styles.verseNumber}>{item.number}</Text>
        <View style={styles.verseActions}>
          <CustomIconButton 
            name={isBookmarked(item.number) ? "bookmark" : "bookmark-border"}
            onPress={() => {
              animatePress();
              HapticFeedback.light();
              onToggleBookmark(item.number);
            }}
            color={colors.primary}
            accessibilityLabel={isBookmarked(item.number) ? t('Quitar marcador') : t('Añadir marcador')}
            accessibilityHint={t('Toca para añadir o quitar este versículo de tus marcadores')}
          />
          <CustomIconButton 
            name="share"
            onPress={() => {
              animatePress();
              HapticFeedback.light();
              onShareVerse(item);
            }}
            color={colors.primary}
            accessibilityLabel={t('Compartir versículo')}
            accessibilityHint={t('Toca para compartir este versículo')}
          />
          <CustomIconButton 
            name="note-add"
            onPress={() => {
              animatePress();
              HapticFeedback.light();
              onOpenNoteModal(item);
            }}
            color={colors.primary}
            accessibilityLabel={t('Añadir nota')}
            accessibilityHint={t('Toca para añadir una nota a este versículo')}
          />
          <CustomIconButton 
            name="content-copy"
            onPress={() => {
              animatePress();
              HapticFeedback.light();
              onCopyVerse(item);
            }}
            color={colors.primary}
            accessibilityLabel={t('Copiar versículo')}
            accessibilityHint={t('Toca para copiar este versículo al portapapeles')}
          />
        </View>
      </View>
      <Text style={styles.verseText} testID={`verse-text-${item.number}`}>{item.text}</Text>
    </Animated.View>
  );
});

const VerseScreen = ({ route, theme }) => {
  const { book, chapter: initialChapter, initialVerse } = route.params;
  const [chapter, setChapter] = useState(initialChapter);
  const { bookmarks, addBookmark, removeBookmark } = useBookmarks();
  const { addNote, getNote } = useNotes();
  const { fontSize, changeFontSize, fontFamily, lineSpacing } = useUserPreferences();
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const { colors } = theme;
  const styles = useStyles(createStyles);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(null);
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const bookName = getBookName(book, i18n.language);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedVerses, setHighlightedVerses] = useState([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [isDistractionFreeMode, setIsDistractionFreeMode] = useState(false);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasMoreVerses, setHasMoreVerses] = useState(true);
  const screenReaderEnabled = useScreenReaderListener();

  const listRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const loadVerses = useCallback(async (bookToLoad, chapterToLoad, start = 0, limit = INITIAL_VERSES_TO_LOAD) => {
    try {
      setLoading(true);
      setError(null);
      const chapterData = getChapter(bookToLoad, chapterToLoad);
      if (!chapterData) {
        throw new Error('No se encontraron versículos para este capítulo');
      }
      // chapterData ya es un array de objetos {number, text}
      const allVerses = Array.isArray(chapterData) ? chapterData : [];
      const chapterVerses = allVerses.slice(start, start + limit);
      if (!chapterVerses || chapterVerses.length === 0) {
        throw new Error('No se encontraron versículos para este capítulo');
      }
      setVerses(prevVerses => start === 0 ? chapterVerses : [...prevVerses, ...chapterVerses]);
      setHasMoreVerses(chapterVerses.length === limit);
      setTotalChapters(getBookChapters(bookToLoad));
      AnalyticsService.logScreenView(`Verse_${bookToLoad}_${chapterToLoad}`);
    } catch (error) {
      console.error('Error al cargar versículos:', error);
      setError(t('errorLoadingVerses'));
    } finally {
      setLoading(false);
      setIsTransitioning(false);
    }
  }, [t]);

  useEffect(() => {
    loadVerses(book, chapter);
  }, [book, chapter, loadVerses]);

  useEffect(() => {
    if (initialVerse && listRef.current) {
      const index = verses.findIndex(v => v.number === initialVerse);
      if (index !== -1) {
        listRef.current.scrollToIndex({ index, animated: true });
        setCurrentVerseIndex(index);
      }
    }
  }, [initialVerse, verses]);

  const animateTransition = useCallback((direction) => {
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
  }, [fadeAnim, slideAnim]);

  const isBookmarked = useCallback((verse) => {
    return bookmarks.some(b => b.book === book && b.chapter === chapter && b.verse === verse);
  }, [bookmarks, book, chapter]);

  const toggleBookmark = useCallback((verse) => {
    if (isBookmarked(verse)) {
      removeBookmark(book, chapter, verse);
      AnalyticsService.logEvent('remove_bookmark', { book, chapter, verse });
    } else {
      addBookmark(book, chapter, verse);
      AnalyticsService.logEvent('add_bookmark', { book, chapter, verse });
    }
  }, [isBookmarked, addBookmark, removeBookmark, book, chapter]);

  const shareVerse = useCallback(async (verse) => {
    try {
      const result = await Share.share({
        message: `${verse.text} - ${book} ${chapter}:${verse.number}`,
        title: t('shareVerseTitle', { book, chapter, number: verse.number }),
      });
      if (result.action === Share.sharedAction) {
        console.log('Compartido exitosamente');
        AnalyticsService.logEvent('share_verse', { book, chapter, verse: verse.number });
      }
    } catch (error) {
      console.error('Error al compartir versículo:', error);
      Alert.alert(t('error'), t('errorSharingVerse'));
    }
  }, [book, chapter, t]);

  const copyVerse = useCallback((verse) => {
    Clipboard.setString(`${verse.text} - ${book} ${chapter}:${verse.number}`);
    if (Platform.OS === 'android') {
      ToastAndroid.show(t('verseCopied'), ToastAndroid.SHORT);
    } else {
      Alert.alert(t('copied'), t('verseCopied'));
    }
    AnalyticsService.logEvent('copy_verse', { book, chapter, verse: verse.number });
  }, [book, chapter, t]);

  const openNoteModal = useCallback((verse) => {
    setCurrentVerse(verse);
    setNoteModalVisible(true);
  }, []);

  const closeNoteModal = useCallback(() => {
    setNoteModalVisible(false);
  }, []);

  const saveNote = useCallback((noteText) => {
    if (currentVerse) {
      addNote(book, chapter, currentVerse.number, noteText);
      AnalyticsService.logEvent('add_note', { book, chapter, verse: currentVerse.number });
    }
    setNoteModalVisible(false);
  }, [addNote, book, chapter, currentVerse]);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim() === '') {
      setHighlightedVerses([]);
      return;
    }
    const lowercaseQuery = searchQuery.toLowerCase();
    const matchingVerses = verses.filter(verse => 
      verse.text.toLowerCase().includes(lowercaseQuery)
    ).map(verse => verse.number);
    setHighlightedVerses(matchingVerses);
    if (matchingVerses.length > 0 && listRef.current) {
      const index = verses.findIndex(v => v.number === matchingVerses[0]);
      if (index !== -1) {
        listRef.current.scrollToIndex({ index, animated: true });
      }
    }
    AnalyticsService.logEvent('search_within_chapter', { book, chapter, query: searchQuery });
  }, [searchQuery, verses, book, chapter]);

  const navigateToChapter = useCallback((newChapter) => {
    if (newChapter > 0 && newChapter <= totalChapters && !isTransitioning) {
      const direction = newChapter > chapter ? 1 : -1;
      animateTransition(direction);
      setChapter(newChapter);
      setSearchQuery('');
      setHighlightedVerses([]);
      loadVerses(book, newChapter);
      AnalyticsService.logEvent('navigate_chapter', { book, from: chapter, to: newChapter });
    }
  }, [totalChapters, chapter, book, animateTransition, isTransitioning, loadVerses]);

  const handleGesture = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 50) {
        const prevChapter = chapter > 1 ? chapter - 1 : 1;
        if (prevChapter !== chapter) {
          navigateToChapter(prevChapter);
        }
      } else if (nativeEvent.translationX < -50) {
        const nextChapter = chapter < totalChapters ? chapter + 1 : totalChapters;
        if (nextChapter !== chapter) {
          navigateToChapter(nextChapter);
        }
      }
    }
  };

  const toggleDistractionFreeMode = useCallback(() => {
    setIsDistractionFreeMode(prev => !prev);
    AnalyticsService.logEvent('toggle_distraction_free_mode', { enabled: !isDistractionFreeMode });
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

  const handleFontSizeChange = useCallback((value) => {
    const newSize = Math.round(value);
    setLocalFontSize(newSize);
    changeFontSize(newSize);
  }, [changeFontSize]);

  const renderItem = useCallback(({ item }) => (
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
  ), [toggleBookmark, shareVerse, openNoteModal, copyVerse, styles, colors, isBookmarked, highlightedVerses]);

  const keyExtractor = useCallback((item) => `verse-${item.number}`, []);

  const onEndReached = useCallback(() => {
    if (!loading && hasMoreVerses) {
      loadVerses(book, chapter, verses.length, VERSES_PER_BATCH);
    }
  }, [loading, hasMoreVerses, book, chapter, verses.length, loadVerses]);

  const memoizedVerses = useMemo(() => verses, [verses]);

  if (loading && verses.length === 0) {
    return (
      <View style={styles.loadingContainer} accessibilityLabel={t('Cargando versículos')}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText} accessibilityLabel={t('Error al cargar versículos')}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => loadVerses(book, chapter)}
          accessibilityLabel={t('Reintentar')}
          accessibilityHint={t('Toca para intentar cargar los versículos nuevamente')}
        >
          <Text style={styles.retryButtonText}>{t('retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

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

  return (
    <PanGestureHandler onHandlerStateChange={handleGesture}>
      <View style={styles.container} testID="verse-screen-container">
        <Animated.View style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }
        ]}>
          <View style={styles.header}>
            <CustomIconButton 
              name="chevron-left" 
              onPress={() => navigateToChapter(chapter - 1)} 
              disabled={chapter === 1}
              color={chapter === 1 ? colors.secondary : colors.primary}
              accessibilityLabel={t('Capítulo anterior')}
              accessibilityHint={t('Navegar al capítulo anterior')}
            />
            <Text style={styles.chapterTitle} accessibilityRole="header">{`${bookName} ${chapter}`}</Text>
            <CustomIconButton 
              name="chevron-right" 
              onPress={() => navigateToChapter(chapter + 1)} 
              disabled={chapter === totalChapters}
              color={chapter === totalChapters ? colors.secondary : colors.primary}
              accessibilityLabel={t('Siguiente capítulo')}
              accessibilityHint={t('Navegar al siguiente capítulo')}
            />
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('searchInChapter')}
              placeholderTextColor={colors.secondary}
              accessibilityLabel={t('Buscar en el capítulo actual')}
              accessibilityHint={t('Ingresa texto para buscar en el capítulo actual')}
            />
            <CustomIconButton 
              name="search"
              onPress={handleSearch}
              color={colors.primary}
              accessibilityLabel={t('Buscar')}
              accessibilityHint={t('Realizar búsqueda en el capítulo actual')}
            />
          </View>
          <View style={styles.settingsContainer}>
            <Text style={styles.settingLabel}>{t('fontSize')}: {localFontSize}</Text>
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
              accessibilityLabel={t('Control deslizante de tamaño de fuente')}
              accessibilityHint={t('Desliza para ajustar el tamaño de la fuente')}
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
            ListFooterComponent={loading && verses.length > 0 ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loadingMore} />
            ) : null}
            accessibilityLabel={t('Lista de versículos')}
            accessibilityHint={t('Desplázate para leer los versículos del capítulo')}
          />
        </Animated.View>
        <CustomIconButton 
          name="fullscreen"
          onPress={toggleDistractionFreeMode}
          style={styles.distractionFreeModeButton}
          color={colors.background}
          accessibilityLabel={t('Modo sin distracciones')}
          accessibilityHint={t('Activa el modo de lectura sin distracciones')}
        />
        <NoteModal 
          visible={noteModalVisible}
          onClose={closeNoteModal}
          verse={currentVerse}
          onSave={saveNote}
          initialNote={currentVerse ? getNote(book, chapter, currentVerse.number) : ''}
        />
      </View>
    </PanGestureHandler>
  );
};

const createStyles = (colors, fontSize, fontFamily) => StyleSheet.create({
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
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chapterTitle: {
    fontSize: fontSize + 4,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    color: colors.text,
    fontFamily,
    fontSize: fontSize,
  },
  settingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
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
    padding: 15,
    borderBottomWidth: 1,
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
    fontWeight: 'bold',
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
    lineHeight: fontSize * 1.5,
  },
  distractionFreeModeButton: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    backgroundColor: colors.primary,
  },
  loadingMore: {
    paddingVertical: 20,
  },
});

export default React.memo(withTheme(VerseScreen));