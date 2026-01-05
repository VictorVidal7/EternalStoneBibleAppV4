import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Share,
  Platform,
} from 'react-native';
import {useState, useEffect, useRef} from 'react';
import {useLocalSearchParams, useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import {captureRef} from 'react-native-view-shot';
import bibleDB from '../../../src/lib/database';
import {BibleVerse} from '../../../src/types/bible';
import {getBookByName} from '../../../src/constants/bible';
import {useTheme} from '../../../src/hooks/useTheme';
import {useBibleVersion} from '../../../src/hooks/useBibleVersion';
import {useLanguage} from '../../../src/hooks/useLanguage';
import {useServices} from '../../../src/context/ServicesContext';
import {useToast} from '../../../src/context/ToastContext';
import {useFavorites} from '../../../src/context/FavoritesContext';
import {logger} from '../../../src/lib/utils/logger';
import {ImmersiveReader} from '../../../src/components/reading/ImmersiveReader';
import {getBookTheme} from '../../../src/constants/bookThemes';
// Audio Bible Feature
import {useAudioPlayer, AudioVerse} from '../../../src/features/audio';
// Navigation
import {
  AnimatedBottomNav,
  useScrollDirection,
} from '../../../src/components/navigation/AnimatedBottomNav';

import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
} from '../../../src/styles/designTokens';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {useWindowDimensions} from 'react-native';

const IMAGE_THEMES = [
  {
    id: 'classic',
    colors: ['#1A1D2E', '#2A2E45'] as const,
    textColor: '#D4AF37',
    attributionColor: 'rgba(212, 175, 55, 0.8)',
    icon: 'book-outline',
  },
  {
    id: 'sunrise',
    colors: ['#FF8C00', '#F27121'] as const,
    textColor: '#FFFFFF',
    attributionColor: 'rgba(255, 255, 255, 0.8)',
    icon: 'sunny-outline',
  },
  {
    id: 'nature',
    colors: ['#234D20', '#36802D'] as const,
    textColor: '#FFFFFF',
    attributionColor: 'rgba(255, 255, 255, 0.8)',
    icon: 'leaf-outline',
  },
  {
    id: 'spiritual',
    colors: ['#4E006E', '#8E24AA'] as const,
    textColor: '#FFFFFF',
    attributionColor: 'rgba(255, 255, 255, 0.8)',
    icon: 'sparkles-outline',
  },
  {
    id: 'ocean',
    colors: ['#0F2027', '#203A43', '#2C5364'] as const,
    textColor: '#00D2FF',
    attributionColor: 'rgba(0, 210, 255, 0.6)',
    icon: 'water-outline',
  },
  {
    id: 'royal',
    colors: ['#600000', '#C41E3A'] as const,
    textColor: '#FFD700',
    attributionColor: 'rgba(255, 215, 0, 0.7)',
    icon: 'ribbon-outline',
  },
  {
    id: 'midnight',
    colors: ['#000000', '#1C1C1C'] as const,
    textColor: '#E0E0E0',
    attributionColor: 'rgba(224, 224, 224, 0.6)',
    icon: 'moon-outline',
  },
  {
    id: 'minimal',
    colors: ['#FFFFFF', '#F5F5F7'] as const,
    textColor: '#2C3E50',
    attributionColor: 'rgba(44, 62, 80, 0.6)',
    icon: 'document-text-outline',
  },
  {
    id: 'aura',
    colors: ['#3A1C71', '#D76D77', '#FFAF7B'] as const,
    textColor: '#FFFFFF',
    attributionColor: 'rgba(255, 255, 255, 0.8)',
    icon: 'color-palette-outline',
  },
  {
    id: 'rose',
    colors: ['#F7CAC9', '#92A8D1'] as const,
    textColor: '#5D4037',
    attributionColor: 'rgba(93, 64, 55, 0.6)',
    icon: 'heart-outline',
  },
];

export default function VerseReadingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, isDark} = useTheme();
  const {selectedVersion} = useBibleVersion();
  const {t} = useLanguage();
  const toast = useToast();
  const {achievementService} = useServices();
  const {favorites, addFavorite} = useFavorites();
  // Audio Bible
  const {
    loadChapter: loadAudioChapter,
    play,
    pause,
    state: audioState,
    isVisible: isAudioVisible,
  } = useAudioPlayer();
  const {
    book,
    chapter,
    verse: highlightVerse,
  } = useLocalSearchParams<{
    book: string;
    chapter: string;
    verse?: string;
  }>();

  const bookInfo = getBookByName(book);
  const chapterNum = parseInt(chapter);
  const bookTheme = getBookTheme(bookInfo?.name || '');

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [selectedVerseForNote, setSelectedVerseForNote] =
    useState<BibleVerse | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [favoritedVerses, setFavoritedVerses] = useState<Set<number>>(
    new Set(),
  );
  const [selectedImageThemeIndex, setSelectedImageThemeIndex] = useState(0);
  const [imageFontSize, setImageFontSize] = useState(20);
  const [imageTextAlign, setImageTextAlign] = useState<
    'center' | 'left' | 'right'
  >('center');
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [useSerifFont, setUseSerifFont] = useState(true);
  const [immersiveModeActive, setImmersiveModeActive] = useState(false);

  const imagePreviewRef = useRef<any>(null);
  const {width: windowWidth} = useWindowDimensions();
  const navSideWidth = Math.min(windowWidth * 0.32, 140);

  const {setBottomOffset} = useAudioPlayer();
  const imageSelectedTextColor = isDark ? colors.primaryDark : colors.primary;

  // Actualizar offset del reproductor de audio cuando hay selección
  useEffect(() => {
    // Si hay selección, movemos el player hacia arriba
    if (selectedVerses.size > 0) {
      setBottomOffset(120); // Ajustado para una barra de selección más baja
      // <MiniAudioPlayer bottomOffset={bottomOffset} />
    }

    return () => setBottomOffset(0); // Limpiar al desmontar
  }, [selectedVerses.size, isAudioVisible, setBottomOffset]);

  // Bottom nav visibility based on scroll direction
  const {isVisible: isNavVisible, handleScroll} = useScrollDirection();

  // Use theme colors directly
  const effectiveColors = {
    ...colors,
    favorite: colors.primary,
    verseHighlight: colors.primaryLight || 'rgba(74, 144, 226, 0.15)',
    warning: colors.warning,
  };

  const scrollViewRef = useRef<ScrollView>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    loadChapter();
  }, [book, chapter, selectedVersion.id]);

  useEffect(() => {
    const currentChapterFavorites = favorites
      .filter(
        favorite => favorite.book === book && favorite.chapter === chapterNum,
      )
      .map(favorite => favorite.verse);
    setFavoritedVerses(new Set(currentChapterFavorites));
  }, [favorites, book, chapterNum]);

  // ✨ Track reading progress after 5 seconds
  useEffect(() => {
    if (loading || verses.length === 0 || !achievementService) return;

    // Reset start time when chapter changes
    startTimeRef.current = Date.now();

    const trackingTimer = setTimeout(async () => {
      try {
        const timeSpent = Math.floor(
          (Date.now() - startTimeRef.current) / 1000,
        ); // seconds

        logger.info('Tracking verse reading', {
          component: 'VerseReadingScreen',
          book,
          chapter: chapterNum,
          versesCount: verses.length,
          timeSpent,
        });

        // Track verses read
        const newAchievements = await achievementService.trackVersesRead(
          verses.length,
          timeSpent,
        );

        // Track chapter completed
        await achievementService.trackChapterCompleted();

        if (newAchievements.length > 0) {
          logger.info('New achievements unlocked!', {
            component: 'VerseReadingScreen',
            achievements: newAchievements.map(
              a => a.name || (a as {title?: string}).title,
            ),
          });
        }
      } catch (error) {
        logger.error('Error tracking reading progress', error as Error, {
          component: 'VerseReadingScreen',
          action: 'trackReading',
        });
      }
    }, 5000); // 5 seconds

    return () => clearTimeout(trackingTimer);
  }, [verses, loading, achievementService, book, chapterNum]);

  async function loadChapter() {
    try {
      setLoading(true);
      logger.info('Loading chapter', {
        component: 'VerseReadingScreen',
        action: 'loadChapter',
        book,
        chapter: chapterNum,
        version: selectedVersion.id,
      });

      if (!bookInfo) {
        logger.error('Book not found', new Error(`Book not found: ${book}`), {
          component: 'VerseReadingScreen',
          action: 'loadChapter',
          book,
        });
        setLoading(false);
        return;
      }

      await bibleDB.initialize();

      const chapterVerses = await bibleDB.getChapter(
        bookInfo.id,
        chapterNum,
        selectedVersion.id,
      );
      logger.info('Chapter loaded successfully', {
        component: 'VerseReadingScreen',
        action: 'loadChapter',
        versesCount: chapterVerses.length,
      });

      setVerses(chapterVerses);

      // Update reading progress
      if (chapterVerses.length > 0) {
        await bibleDB.updateReadingProgress(book, chapterNum, 1);
      }

      setLoading(false);

      // Scroll to highlighted verse if provided
      if (highlightVerse && scrollViewRef.current) {
        setTimeout(() => {
          // Parse verse number for potential scrolling implementation
          const _verseNum = parseInt(highlightVerse as string);
          // Simplified scrolling - in production would use measurement
          void _verseNum; // Mark as intentionally unused for now
        }, 300);
      }
    } catch (error) {
      logger.error('Error loading chapter', error as Error, {
        component: 'VerseReadingScreen',
        action: 'loadChapter',
        book,
        chapter: chapterNum,
      });
      setLoading(false);
    }
  }

  async function saveNote() {
    if (!selectedVerseForNote || !noteText.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const existingNote = await bibleDB.getNoteForVerse(
      selectedVerseForNote.book,
      selectedVerseForNote.chapter,
      selectedVerseForNote.verse,
    );

    if (existingNote) {
      await bibleDB.updateNote(existingNote.id, noteText.trim());
    } else {
      const now = new Date().toISOString();
      await bibleDB.addNote({
        book: selectedVerseForNote.book,
        chapter: selectedVerseForNote.chapter,
        verse: selectedVerseForNote.verse,
        text: selectedVerseForNote.text,
        note: noteText.trim(),
        createdAt: now,
        updatedAt: now,
      });
    }

    setNoteModalVisible(false);
    setNoteText('');
    toast.success(t.notes.saved);
  }

  // Toggle verse selection
  function toggleVerseSelection(verseNum: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVerses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(verseNum)) {
        newSet.delete(verseNum);
      } else {
        newSet.add(verseNum);
      }
      return newSet;
    });
  }

  // Clear selection
  function clearSelection() {
    setSelectedVerses(new Set());
  }

  // Get selected verses as text
  function getSelectedVersesText(): string {
    const sortedNums = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedVersesData = sortedNums
      .map(num => verses.find(v => v.verse === num))
      .filter(Boolean) as BibleVerse[];

    const reference =
      sortedNums.length === 1
        ? `${book} ${chapterNum}:${sortedNums[0]}`
        : `${book} ${chapterNum}:${sortedNums[0]}-${sortedNums[sortedNums.length - 1]}`;

    const versesText = selectedVersesData
      .map(v => `${v.verse}. ${v.text}`)
      .join('\n');

    return `"${versesText}"\n\n— ${reference} (${selectedVersion.abbreviation})`;
  }

  // Get verses text for image creator (without extra quotes or reference)
  function getImageVersesText(): string {
    const sortedNums = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedVersesData = sortedNums
      .map(num => verses.find(v => v.verse === num))
      .filter(Boolean) as BibleVerse[];

    return selectedVersesData
      .map(
        v =>
          `${v.verse}. ${v.text.replace(/^["'«„]/, '').replace(/["'»“]$/, '')}`,
      )
      .join('\n\n');
  }

  // Copy selected verses
  async function handleCopySelected() {
    if (selectedVerses.size === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(getSelectedVersesText());
    toast.success(t.verse.verseCopied);
    clearSelection();
  }

  // Share selected verses
  async function handleShareSelected() {
    if (selectedVerses.size === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({message: getSelectedVersesText()});
      clearSelection();
    } catch (error) {
      logger.error('Error sharing verses', error as Error, {
        component: 'VerseReadingScreen',
        action: 'handleShareSelected',
      });
    }
  }

  async function handleShareImage() {
    if (isSharingImage || !imagePreviewRef.current) return;

    try {
      setIsSharingImage(true);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = await captureRef(imagePreviewRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        toast.error(t.verse.imageShareError);
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t.share,
        UTI: 'public.png',
      });

      toast.success(t.verse.imageReady);
      setImageModalVisible(false);
    } catch (error) {
      logger.error('Error sharing image', error as Error, {
        component: 'VerseReadingScreen',
        action: 'handleShareImage',
      });
      toast.error(t.verse.imageShareError);
    } finally {
      setIsSharingImage(false);
    }
  }

  // Favorite selected verses (save individually for indicators)
  async function handleFavoriteSelected() {
    if (selectedVerses.size === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const sortedNums = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedVersesData = sortedNums
      .map(num => verses.find(v => v.verse === num))
      .filter(Boolean) as BibleVerse[];

    for (const verse of selectedVersesData) {
      await addFavorite(verse, 'other', 5);
    }

    setFavoritedVerses(prev => {
      const next = new Set(prev);
      sortedNums.forEach(n => next.add(n));
      return next;
    });

    clearSelection();
  }

  // Add note to selected verses (joined)
  async function handleNoteSelected() {
    if (selectedVerses.size === 0) return;

    const sortedNums = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedVersesData = sortedNums
      .map(num => verses.find(v => v.verse === num))
      .filter(Boolean) as BibleVerse[];

    if (selectedVersesData.length === 0) return;

    const joinedText = selectedVersesData
      .map(v => `${v.verse}. ${v.text}`)
      .join('\n');

    // Check if a note already exists for this verse range (using first verse as key)
    const firstVerse = selectedVersesData[0];
    const existingNote = await bibleDB.getNoteForVerse(
      firstVerse.book,
      firstVerse.chapter,
      firstVerse.verse,
    );

    setSelectedVerseForNote({
      ...firstVerse,
      text: joinedText, // Temporary override for display in modal
    });

    if (existingNote) {
      setNoteText(existingNote.note);
    } else {
      setNoteText('');
    }

    setNoteModalVisible(true);
    clearSelection();
  }

  function navigateChapter(direction: 'prev' | 'next') {
    if (!bookInfo) return;

    const newChapter = chapterNum + (direction === 'next' ? 1 : -1);

    if (newChapter < 1 || newChapter > bookInfo.chapters) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        t.app.endOfBook,
        direction === 'next'
          ? t.app.endOfBookMessage
          : t.app.firstChapterMessage,
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace(`/verse/${book}/${newChapter}` as any);
  }

  // Start Audio Bible playback
  function startAudioPlayback() {
    if (verses.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Convert BibleVerse to AudioVerse format
    const audioVerses: AudioVerse[] = verses.map(v => ({
      book: v.book,
      chapter: v.chapter,
      verse: v.verse,
      text: v.text,
    }));

    loadAudioChapter(audioVerses);
    play();
  }

  if (!bookInfo || loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {backgroundColor: effectiveColors.background},
        ]}>
        <ActivityIndicator size="large" color={effectiveColors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${bookInfo.name} ${chapterNum}`,
          headerStyle: {backgroundColor: bookTheme.primary},
          headerTintColor: '#FFFFFF',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={() => {
                  if (audioState.isPlaying) {
                    pause();
                  } else {
                    startAudioPlayback();
                  }
                }}
                style={[
                  styles.headerButton,
                  audioState.isPlaying && {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  },
                ]}>
                <Ionicons
                  name={audioState.isPlaying ? 'pause' : 'play'}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setImmersiveModeActive(true);
                }}
                style={styles.headerButton}>
                <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFontSize(prev => Math.min(prev + 2, 24));
                }}
                style={styles.headerButton}>
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFontSize(prev => Math.max(prev - 2, 12));
                }}
                style={styles.headerButton}>
                <Ionicons
                  name="remove-circle-outline"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: effectiveColors.background,
          },
        ]}>
        {/* Navigation Bar */}
        <View
          style={[
            styles.navBar,
            {
              backgroundColor: effectiveColors.surface,
              borderBottomColor: effectiveColors.border,
              paddingTop: (insets.top || 44) + spacing['0.5'],
            },
          ]}>
          <View
            style={[styles.navSide, styles.navSideLeft, {width: navSideWidth}]}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateChapter('prev')}
              disabled={chapterNum === 1}>
              <Ionicons
                name="chevron-back"
                size={24}
                color={
                  chapterNum === 1
                    ? effectiveColors.textTertiary
                    : effectiveColors.primary
                }
              />
              <Text
                style={[
                  styles.navButtonText,
                  {
                    color:
                      chapterNum === 1
                        ? effectiveColors.textTertiary
                        : effectiveColors.primary,
                  },
                ]}>
                {t.previous}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.navTitleContainer} pointerEvents="none">
            <Text
              style={[styles.navTitle, {color: effectiveColors.text}]}
              numberOfLines={1}>
              {bookInfo.name} {chapterNum}
            </Text>
          </View>

          <View
            style={[
              styles.navSide,
              styles.navSideRight,
              {width: navSideWidth},
            ]}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateChapter('next')}
              disabled={chapterNum === bookInfo.chapters}>
              <Text
                style={[
                  styles.navButtonText,
                  {
                    color:
                      chapterNum === bookInfo.chapters
                        ? effectiveColors.textTertiary
                        : effectiveColors.primary,
                  },
                ]}>
                {t.next}
              </Text>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={
                  chapterNum === bookInfo.chapters
                    ? effectiveColors.textTertiary
                    : effectiveColors.primary
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Toolbar with Audio, Immersive, Font Size */}
        <View
          style={[
            styles.toolbar,
            {
              backgroundColor: effectiveColors.surface,
              borderBottomColor: effectiveColors.border,
            },
          ]}>
          <TouchableOpacity
            style={[
              styles.toolbarButton,
              audioState.isPlaying && {
                backgroundColor: effectiveColors.primary + '20',
              },
            ]}
            onPress={() => {
              if (audioState.isPlaying) {
                pause();
              } else {
                startAudioPlayback();
              }
            }}>
            <Ionicons
              name={audioState.isPlaying ? 'pause' : 'play'}
              size={22}
              color={
                audioState.isPlaying
                  ? effectiveColors.primary
                  : effectiveColors.text
              }
            />
            <Text
              style={[
                styles.toolbarButtonText,
                {color: effectiveColors.textSecondary},
              ]}>
              {audioState.isPlaying ? 'Pausar' : 'Audio'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setImmersiveModeActive(true);
            }}>
            <Ionicons
              name="expand-outline"
              size={22}
              color={effectiveColors.text}
            />
            <Text
              style={[
                styles.toolbarButtonText,
                {color: effectiveColors.textSecondary},
              ]}>
              Inmersivo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFontSize(prev => Math.min(prev + 2, 24));
            }}>
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={effectiveColors.text}
            />
            <Text
              style={[
                styles.toolbarButtonText,
                {color: effectiveColors.textSecondary},
              ]}>
              A+
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFontSize(prev => Math.max(prev - 2, 12));
            }}>
            <Ionicons
              name="remove-circle-outline"
              size={22}
              color={effectiveColors.text}
            />
            <Text
              style={[
                styles.toolbarButtonText,
                {color: effectiveColors.textSecondary},
              ]}>
              A-
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verses - Clean inline format */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.versesContainer}
          contentContainerStyle={[
            styles.versesContent,
            {paddingBottom: selectedVerses.size > 0 ? 120 : 100},
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}>
          {verses.map((verse, index) => {
            const isFavorited = favoritedVerses.has(verse.verse);
            const isSelected = selectedVerses.has(verse.verse);
            const isHighlighted =
              highlightVerse &&
              parseInt(highlightVerse as string) === verse.verse;
            const isBeingRead =
              audioState.isPlaying && audioState.currentVerseIndex === index;

            const textStyle = {
              color: isBeingRead
                ? '#D4AF37'
                : isSelected
                  ? effectiveColors.primaryDark
                  : effectiveColors.text,
              fontSize,
              lineHeight: fontSize * 1.6,
            };

            const numberStyle = {
              color: isBeingRead ? '#D4AF37' : effectiveColors.primary,
            };

            return (
              <TouchableOpacity
                key={verse.verse}
                activeOpacity={0.7}
                onPress={() => toggleVerseSelection(verse.verse)}
                style={[
                  styles.verseItem,
                  isSelected && styles.verseSelected,
                  isHighlighted && styles.verseHighlighted,
                  isBeingRead && styles.verseBeingRead,
                ]}>
                <View style={styles.verseContent}>
                  <Text style={[styles.verseText, textStyle]}>
                    <Text style={[styles.verseNumber, numberStyle]}>
                      {isBeingRead ? '🔊 ' : ''}
                      {verse.verse}{' '}
                    </Text>
                    {verse.text}
                  </Text>
                </View>
                {isFavorited && (
                  <View style={styles.favoriteIndicator}>
                    <Ionicons
                      name="heart"
                      size={16}
                      color={effectiveColors.primary}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Selection Action Bar */}
        {selectedVerses.size > 0 && (
          <View
            style={[
              styles.selectionBar,
              {
                backgroundColor: isDark
                  ? 'rgba(26, 29, 46, 0.98)'
                  : 'rgba(255, 255, 255, 0.98)',
                borderColor: effectiveColors.border,
                bottom: isAudioVisible ? 84 : 28,
              },
            ]}>
            <View style={styles.selectionHeader}>
              <Text
                style={[styles.selectionCount, {color: effectiveColors.text}]}>
                {selectedVerses.size}{' '}
                {selectedVerses.size === 1 ? t.verse.singular : t.verse.plural}
              </Text>
              <TouchableOpacity onPress={clearSelection}>
                <Ionicons
                  name="close"
                  size={22}
                  color={effectiveColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <View style={styles.selectionActions}>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={handleCopySelected}>
                <Ionicons
                  name="copy-outline"
                  size={22}
                  color={effectiveColors.primary}
                />
                <Text
                  style={[
                    styles.selectionButtonText,
                    {color: effectiveColors.text},
                  ]}>
                  {t.copy}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={handleShareSelected}>
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={effectiveColors.primary}
                />
                <Text
                  style={[
                    styles.selectionButtonText,
                    {color: effectiveColors.text},
                  ]}>
                  {t.share}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={handleNoteSelected}>
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={effectiveColors.primary}
                />
                <Text
                  style={[
                    styles.selectionButtonText,
                    {color: effectiveColors.text},
                  ]}>
                  {t.notes.note}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={handleFavoriteSelected}>
                <Ionicons
                  name="heart-outline"
                  size={20}
                  color={effectiveColors.primary}
                />
                <Text
                  style={[
                    styles.selectionButtonText,
                    {color: effectiveColors.text},
                  ]}>
                  {t.verse.addFavorite}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => {
                  const sortedNums = Array.from(selectedVerses).sort(
                    (a, b) => a - b,
                  );
                  router.push({
                    pathname: '/features/version-comparison',
                    params: {
                      book,
                      chapter,
                      verse: sortedNums[0],
                    },
                  });
                  clearSelection();
                }}>
                <Ionicons
                  name="git-compare-outline"
                  size={22}
                  color={effectiveColors.primary}
                />
                <Text
                  style={[
                    styles.selectionButtonText,
                    {color: effectiveColors.text},
                  ]}>
                  {t.verse.compare}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.selectionButton}
                onPress={() => setImageModalVisible(true)}>
                <Ionicons
                  name="image-outline"
                  size={22}
                  color={effectiveColors.primary}
                />
                <Text
                  style={[
                    styles.selectionButtonText,
                    {color: effectiveColors.text},
                  ]}>
                  Imagen
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Image Creator Modal */}
        <Modal
          visible={imageModalVisible}
          animationType="slide"
          onRequestClose={() => setImageModalVisible(false)}>
          <View
            style={[
              styles.imageCreatorContainer,
              {backgroundColor: colors.background},
            ]}>
            <View
              style={[
                styles.imageCreatorHeader,
                {paddingTop: insets.top + 10},
              ]}>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.imageCreatorTitle, {color: colors.text}]}>
                Compartir como Imagen
              </Text>
              <TouchableOpacity
                onPress={handleShareImage}
                disabled={isSharingImage}
                style={isSharingImage && {opacity: 0.6}}>
                <Ionicons
                  name="share-outline"
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{flex: 1}}
              contentContainerStyle={{paddingBottom: spacing['4xl']}}>
              <View style={styles.imagePreviewContainer}>
                <LinearGradient
                  colors={IMAGE_THEMES[selectedImageThemeIndex].colors}
                  style={[
                    styles.verseImageCard,
                    {minHeight: windowWidth - spacing.xl * 2},
                  ]}
                  ref={imagePreviewRef}
                  collapsable={false}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}>
                  <View style={styles.imageHeaderArea}>
                    <Ionicons
                      name={IMAGE_THEMES[selectedImageThemeIndex].icon as any}
                      size={32}
                      color={IMAGE_THEMES[selectedImageThemeIndex].textColor}
                      style={styles.watermarkIcon}
                    />
                  </View>

                  <View style={styles.imageMainArea}>
                    <Ionicons
                      name="chatbubble-outline"
                      size={24}
                      color={IMAGE_THEMES[selectedImageThemeIndex].textColor}
                      style={styles.quoteIcon}
                    />
                    <Text
                      style={[
                        styles.verseImageText,
                        {
                          color:
                            IMAGE_THEMES[selectedImageThemeIndex].textColor,
                          fontSize: imageFontSize,
                          textAlign: imageTextAlign,
                          fontFamily: useSerifFont
                            ? Platform.OS === 'ios'
                              ? 'Georgia'
                              : 'serif'
                            : undefined,
                          paddingBottom: spacing.sm,
                        },
                      ]}>
                      {selectedVerses.size > 0
                        ? getImageVersesText()
                        : 'Selecciona versículos primero'}
                    </Text>
                  </View>

                  <View style={styles.imageBrandContainer}>
                    <View
                      style={[
                        styles.brandDivider,
                        {
                          backgroundColor:
                            IMAGE_THEMES[selectedImageThemeIndex].textColor,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.brandText,
                        {
                          color:
                            IMAGE_THEMES[selectedImageThemeIndex].textColor,
                        },
                      ]}>
                      Eternal Stone Bible
                    </Text>
                    <Text
                      style={[
                        styles.brandReference,
                        {
                          color:
                            IMAGE_THEMES[selectedImageThemeIndex].textColor,
                        },
                      ]}>
                      {book} {chapter}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.imageOptionsContainer}>
                <Text
                  style={[styles.optionsTitle, {color: colors.textSecondary}]}>
                  Elige un estilo
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.optionsRow}>
                  {IMAGE_THEMES.map((theme, index) => (
                    <TouchableOpacity
                      key={theme.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedImageThemeIndex(index);
                      }}
                      style={[
                        styles.styleCircle,
                        index === selectedImageThemeIndex && {
                          borderColor: colors.primary,
                          borderWidth: 3,
                        },
                      ]}>
                      <LinearGradient
                        colors={theme.colors}
                        style={styles.styleCircleGradient}>
                        <Ionicons
                          name={theme.icon as any}
                          size={20}
                          color={theme.textColor}
                        />
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.optionSection}>
                  <Text
                    style={[
                      styles.optionsTitle,
                      {color: colors.textSecondary},
                    ]}>
                    Tamaño de Fuente
                  </Text>
                  <View style={styles.optionsRow}>
                    {[16, 20, 24, 28].map(size => (
                      <TouchableOpacity
                        key={size}
                        onPress={() => setImageFontSize(size)}
                        style={[
                          styles.sizeButton,
                          imageFontSize === size && {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                          },
                        ]}>
                        <Text
                          style={{
                            color:
                              imageFontSize === size
                                ? imageSelectedTextColor
                                : colors.text,
                            fontWeight: 'bold',
                          }}>
                          {size}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.optionSection}>
                  <Text
                    style={[
                      styles.optionsTitle,
                      {color: colors.textSecondary},
                    ]}>
                    Alineación
                  </Text>
                  <View style={styles.optionsRow}>
                    {(['left', 'center', 'right'] as const).map(align => (
                      <TouchableOpacity
                        key={align}
                        onPress={() => setImageTextAlign(align)}
                        style={[
                          styles.sizeButton,
                          styles.flex1,
                          imageTextAlign === align && {
                            borderColor: colors.primary,
                            backgroundColor: colors.primaryLight,
                          },
                        ]}>
                        <Ionicons
                          name={
                            align === 'left'
                              ? 'list-outline'
                              : align === 'center'
                                ? 'menu-outline'
                                : 'reorder-three-outline'
                          }
                          size={20}
                          color={
                            imageTextAlign === align
                              ? imageSelectedTextColor
                              : colors.text
                          }
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.optionSection}>
                  <Text
                    style={[
                      styles.optionsTitle,
                      {color: colors.textSecondary},
                    ]}>
                    Estilo de Fuente
                  </Text>
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      onPress={() => setUseSerifFont(true)}
                      style={[
                        styles.sizeButton,
                        styles.flex1,
                        useSerifFont && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primaryLight,
                        },
                      ]}>
                      <Text
                        style={{
                          color: useSerifFont
                            ? imageSelectedTextColor
                            : colors.text,
                          fontWeight: 'bold',
                          fontFamily:
                            Platform.OS === 'ios' ? 'Georgia' : 'serif',
                        }}>
                        Serif
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setUseSerifFont(false)}
                      style={[
                        styles.sizeButton,
                        styles.flex1,
                        !useSerifFont && {
                          borderColor: colors.primary,
                          backgroundColor: colors.primaryLight,
                        },
                      ]}>
                      <Text
                        style={{
                          color: !useSerifFont
                            ? imageSelectedTextColor
                            : colors.text,
                          fontWeight: 'bold',
                        }}>
                        Sans
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Note Modal */}
        <Modal
          visible={noteModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setNoteModalVisible(false)}>
          <View
            style={[styles.modalOverlay, {backgroundColor: colors.overlay}]}>
            <View
              style={[styles.modalContent, {backgroundColor: colors.surface}]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, {color: colors.text}]}>
                  {selectedVerseForNote
                    ? `${selectedVerseForNote.book} ${selectedVerseForNote.chapter}:${selectedVerseForNote.verse}`
                    : t.notes.add}
                </Text>
                <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {selectedVerseForNote && (
                <Text
                  style={[
                    styles.modalVerse,
                    {
                      color: colors.textSecondary,
                      backgroundColor: colors.surfaceVariant,
                    },
                  ]}>
                  "{selectedVerseForNote.text}"
                </Text>
              )}

              <TextInput
                style={[
                  styles.noteInput,
                  {color: colors.text, borderColor: colors.border},
                ]}
                placeholder={t.notes.placeholder}
                placeholderTextColor={colors.textTertiary}
                value={noteText}
                onChangeText={setNoteText}
                multiline
                autoFocus
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: noteText.trim()
                      ? colors.success
                      : colors.textTertiary,
                  },
                ]}
                onPress={saveNote}
                disabled={!noteText.trim()}>
                <Text style={styles.saveButtonText}>{t.notes.saveNote}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Immersive Reading Mode Modal */}
        <Modal
          visible={immersiveModeActive}
          animationType="fade"
          presentationStyle="fullScreen">
          <ImmersiveReader
            verses={verses}
            onClose={() => setImmersiveModeActive(false)}
            startIndex={0}
          />
        </Modal>

        {/* Bottom Navigation - hides on scroll down or when selection is active */}
        <AnimatedBottomNav
          visible={isNavVisible && selectedVerses.size === 0}
          activeTab="bible"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: spacing.base,
  },

  // NAVEGACIÓN - COMPACTA
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['0.5'],
    paddingHorizontal: spacing.md,
    borderBottomWidth: 0,
  },
  navSide: {
    justifyContent: 'center',
  },
  navSideLeft: {
    alignItems: 'flex-start',
  },
  navSideRight: {
    alignItems: 'flex-end',
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing['1.5'],
    paddingHorizontal: spacing.sm,
  },
  navButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  navTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // TOOLBAR - COMPACTA
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing['0.5'],
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
  },
  toolbarButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 56,
  },
  toolbarButtonText: {
    fontSize: fontSizes.xs,
    marginTop: 2,
    fontWeight: '500',
  },

  // CONTENEDOR DE VERSÍCULOS
  versesContainer: {
    flex: 1,
  },
  versesContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  // VERSÍCULO - Sin tarjeta, formato inline
  verseItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: 4,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  verseSelected: {
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  verseHighlighted: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#4A90E2',
  },
  verseBeingRead: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  verseContent: {
    flex: 1,
    paddingRight: 4,
  },
  verseNumber: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  verseText: {
    fontSize: fontSizes.base,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  // BARRA DE SELECCIÓN
  selectionBar: {
    position: 'absolute',
    bottom: 40, // Elevado del fondo
    left: 16, // Margen izquierdo
    right: 16, // Margen derecho
    borderRadius: 24, // Bordes totalmente redondeados
    borderWidth: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2, // Sombra más pronunciada
    shadowRadius: 16,
    elevation: 20,
  },
  selectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectionCount: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  selectionButtonText: {
    fontSize: fontSizes.xs,
    marginTop: 4,
    fontWeight: '500',
  },

  // MODAL MEJORADO
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing.xl,
    minHeight: 450,
    ...shadows['3xl'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalVerse: {
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * 1.6,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    opacity: 0.8,
  },
  noteInput: {
    borderWidth: 1.5,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: fontSizes.base,
    minHeight: 160,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.md,
  },
  saveButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // IMAGE CREATOR STYLES
  imageCreatorContainer: {
    flex: 1,
  },
  imageCreatorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  imageCreatorTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  verseImageCard: {
    padding: spacing.xl,
    borderRadius: borderRadius.xl,
    width: '100%',
    // Eliminamos aspectRatio fijo para permitir crecimiento vertical
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  verseImageText: {
    fontSize: fontSizes.lg,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  imageOptionsContainer: {
    padding: spacing.xl,
    paddingBottom: 40,
  },
  optionsTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  optionsRow: {
    flexDirection: 'row',
  },
  styleCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCircleGradient: {
    flex: 1,
    width: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHeaderArea: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    height: 40,
  },
  imageMainArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    width: '100%',
  },
  quoteIcon: {
    opacity: 0.3,
    marginBottom: spacing.xs,
  },
  brandText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  styleIcon: {
    opacity: 0.6,
  },
  sizeButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  imageBrandContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  brandDivider: {
    width: 30,
    height: 2,
    marginBottom: spacing.md,
    opacity: 0.2,
  },
  brandReference: {
    fontSize: fontSizes.xs,
    marginTop: 4,
    fontWeight: '500',
    opacity: 0.7,
  },
  watermarkIcon: {
    opacity: 0.4,
  },
  optionSection: {
    marginTop: spacing.lg,
  },
  flex1: {
    flex: 1,
  },
});
