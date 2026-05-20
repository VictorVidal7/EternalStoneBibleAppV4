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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {useState, useEffect, useRef, useMemo} from 'react';
import {useLocalSearchParams, useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import {captureRef} from 'react-native-view-shot';
import bibleDB from '@lib/database';
import {BibleVerse} from '@/types/bible';
import {BIBLE_VERSIONS, getBookByName} from '@/constants/bible';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  linkifyReferences,
  type ParsedReference,
} from '@/lib/references/parseReference';
import {HighlightColor} from '@lib/highlights';
import {useTheme} from '@hooks/useTheme';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useLanguage} from '@hooks/useLanguage';
import {useServices} from '@context/ServicesContext';
import {useToast} from '@context/ToastContext';
import {useFavorites} from '@context/FavoritesContext';
import {useBookmarks} from '@context/BookmarksContext';
import {useReadingPlanProgress} from '@context/ReadingPlanProgressContext';
import {useReadingProgress} from '@context/ReadingProgressContext';
import {getReadingPlanById, getLocalizedPlan} from '@/constants/reading-plans';
import {logger} from '@lib/utils/logger';
import {ImmersiveReader} from '@components/reading/ImmersiveReader';
import {getBookTheme} from '@/constants/bookThemes';
// Audio Bible Feature
import {useAudioPlayer, AudioVerse} from '@/features/audio';
// Navigation
// import {
//   AnimatedBottomNav,
//   useScrollDirection,
// } from '../../../../src/components/navigation/AnimatedBottomNav';

import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  shadows,
} from '@/styles/designTokens';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {useWindowDimensions} from 'react-native';

/**
 * Builds a compact verse list, collapsing consecutive runs into ranges.
 * e.g. [16] -> "16", [16,17,18] -> "16-18", [1,4,5] -> "1,4-5".
 */
function formatVerseList(nums: number[]): string {
  if (nums.length === 0) return '';
  const sorted = [...nums].sort((a, b) => a - b);
  const parts: string[] = [];
  let runStart = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
      continue;
    }
    parts.push(runStart === prev ? `${runStart}` : `${runStart}-${prev}`);
    runStart = current;
    prev = current;
  }
  return parts.join(',');
}

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
  const {t, language} = useLanguage();
  const toast = useToast();
  const {achievementService, highlightService} = useServices();
  const {favorites, addFavorite, removeFavorite} = useFavorites();
  const {addBookmark} = useBookmarks();
  const {markChapterRead} = useReadingPlanProgress();
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
  // Display name follows the UI language so it stays consistent with the
  // Bible library (e.g. "Genesis" in English, not "Génesis").
  const localizedBookName = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : '';

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
  // Verse highlights: map of verse number -> highlight color (hex).
  const [verseHighlights, setVerseHighlights] = useState<Map<number, string>>(
    new Map(),
  );
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  // Side-by-side mode: pairs each verse with its counterpart from the
  // other available Bible version (RVR1960 ↔ KJV) so users can study
  // both translations at once without leaving the reader.
  const [sideBySide, setSideBySide] = useState(false);
  const [secondaryVerses, setSecondaryVerses] = useState<BibleVerse[]>([]);
  // The "other" version (whichever one isn't currently active for
  // reading). Memoized so it survives renders cheaply.
  const secondaryVersion = useMemo(
    () => BIBLE_VERSIONS.find(v => v.id !== selectedVersion.id),
    [selectedVersion.id],
  );

  const imagePreviewRef = useRef<any>(null);
  // Y offset of each verse row within the ScrollView, for audio auto-scroll.
  const verseOffsetsRef = useRef<Map<number, number>>(new Map());
  const {width: windowWidth} = useWindowDimensions();
  const navSideWidth = Math.min(windowWidth * 0.32, 140);

  const {setBottomOffset} = useAudioPlayer();
  const imageSelectedTextColor = isDark ? colors.primaryDark : colors.primary;

  // El reproductor de audio conserva su posición; la barra de selección de
  // versículos se dibuja por encima de él (ver estilo `selectionBar`), así
  // que no hace falta desplazar el player.
  useEffect(() => {
    setBottomOffset(0);
    return () => setBottomOffset(0);
  }, [setBottomOffset]);

  // Hydrate the side-by-side preference once on mount.
  useEffect(() => {
    AsyncStorage.getItem('@reader_side_by_side')
      .then(v => {
        if (v === '1') setSideBySide(true);
      })
      .catch(() => undefined);
  }, []);

  async function toggleSideBySide() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !sideBySide;
    setSideBySide(next);
    AsyncStorage.setItem('@reader_side_by_side', next ? '1' : '0').catch(
      () => undefined,
    );
    // Going from off → on outside of a chapter (re)load: fetch the
    // companion chapter inline. Going off → off clears.
    if (next && secondaryVersion && bookInfo) {
      try {
        const secondary = await bibleDB.getChapter(
          bookInfo.id,
          chapterNum,
          secondaryVersion.id,
        );
        setSecondaryVerses(secondary);
      } catch (error) {
        logger.error('Side-by-side fetch failed', error as Error, {
          component: 'VerseReadingScreen',
          action: 'toggleSideBySide',
        });
        setSecondaryVerses([]);
      }
    } else if (!next) {
      setSecondaryVerses([]);
    }
  }

  // Reading-progress tracking: how far the reader scrolled through the
  // chapter, persisted on chapter change / unmount so the chapter grid
  // can show real "read" indicators.
  const {updateChapterProgress} = useReadingProgress();
  // Keep the latest updateChapterProgress so the unmount persist below
  // never writes through a stale closure.
  const updateChapterProgressRef = useRef(updateChapterProgress);
  updateChapterProgressRef.current = updateChapterProgress;

  const maxScrollPctRef = useRef(0);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const lastPersistedPctRef = useRef(0);

  // Effective read-progress %: furthest scroll depth, or 100 when the whole
  // chapter fits the viewport (there is nothing to scroll).
  const computeChapterProgress = () => {
    let pct = maxScrollPctRef.current;
    if (
      pct < 100 &&
      viewportHeightRef.current > 0 &&
      contentHeightRef.current > 0 &&
      contentHeightRef.current <= viewportHeightRef.current
    ) {
      pct = 100;
    }
    return pct;
  };

  // Persist progress once it advances. Called when a scroll gesture settles
  // (and as a backstop on chapter change / unmount) so the chapter grid
  // reflects what was actually read even if the app is killed mid-session.
  const persistChapterProgress = () => {
    const pct = computeChapterProgress();
    if (pct > lastPersistedPctRef.current && bookInfo?.name) {
      lastPersistedPctRef.current = pct;
      updateChapterProgressRef.current(bookInfo.name, String(chapterNum), pct);
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const {contentOffset, layoutMeasurement, contentSize} = e.nativeEvent;
    if (contentSize.height <= 0) {
      return;
    }
    const pct = Math.min(
      100,
      Math.round(
        ((contentOffset.y + layoutMeasurement.height) / contentSize.height) *
          100,
      ),
    );
    if (pct > maxScrollPctRef.current) {
      maxScrollPctRef.current = pct;
    }
  };

  // Reset trackers for each new chapter; the cleanup is a final backstop in
  // case the chapter was left without a scroll gesture settling.
  useEffect(() => {
    maxScrollPctRef.current = 0;
    contentHeightRef.current = 0;
    lastPersistedPctRef.current = 0;
    return () => {
      const pct = computeChapterProgress();
      if (pct > lastPersistedPctRef.current && bookInfo?.name) {
        updateChapterProgressRef.current(
          bookInfo.name,
          String(chapterNum),
          pct,
        );
      }
    };
  }, [book, chapterNum, bookInfo?.name]);

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
    // A verse selection belongs to the chapter it was made in — drop it when
    // the chapter changes so stale verse numbers don't re-highlight here.
    setSelectedVerses(new Set());
    setShowHighlightPicker(false);
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

        // Auto-complete any reading-plan day whose chapters are now all read.
        try {
          const autoDone = await markChapterRead(book, chapterNum);
          if (autoDone.length > 0) {
            const {planId, day} = autoDone[0];
            const plan = getReadingPlanById(planId);
            const planName = plan ? getLocalizedPlan(plan, t).name : '';
            toast.success(
              t.readingPlan.dayAutoCompleted
                .replace('{{day}}', String(day))
                .replace('{{plan}}', planName),
            );
          }
        } catch (autoErr) {
          logger.warn('Could not auto-complete reading plan day', {
            component: 'VerseReadingScreen',
            error: autoErr,
          });
        }

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
  }, [
    verses,
    loading,
    achievementService,
    book,
    chapterNum,
    markChapterRead,
    t,
    toast,
  ]);

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

      // Side-by-side: also pull the matching chapter from the other
      // version so each verse can render its counterpart. Fire-and-
      // forget — the primary reading flow doesn't depend on it.
      if (sideBySide && secondaryVersion) {
        try {
          const secondary = await bibleDB.getChapter(
            bookInfo.id,
            chapterNum,
            secondaryVersion.id,
          );
          setSecondaryVerses(secondary);
        } catch (error) {
          logger.error('Side-by-side fetch failed', error as Error, {
            component: 'VerseReadingScreen',
            action: 'loadChapter.secondary',
          });
          setSecondaryVerses([]);
        }
      } else {
        setSecondaryVerses([]);
      }

      setLoading(false);

      // Scroll to the highlighted verse (e.g. when arriving from search).
      // Verse offsets are filled in by each row's onLayout, so retry a few
      // times until the target verse has reported its position.
      if (highlightVerse) {
        const verseNum = parseInt(highlightVerse as string);
        if (!Number.isNaN(verseNum)) {
          let attempts = 0;
          const tryScroll = () => {
            const offset = verseOffsetsRef.current.get(verseNum);
            if (offset != null && scrollViewRef.current) {
              scrollViewRef.current.scrollTo({
                y: Math.max(offset - 120, 0),
                animated: true,
              });
            } else if (attempts < 10) {
              attempts += 1;
              setTimeout(tryScroll, 120);
            }
          };
          setTimeout(tryScroll, 250);
        }
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
    setShowHighlightPicker(false);
  }

  // Load saved highlights for the current chapter
  useEffect(() => {
    let active = true;
    (async () => {
      if (!highlightService) return;
      try {
        const chapterHighlights = await highlightService.getHighlightsByChapter(
          book,
          chapterNum,
        );
        if (!active) return;
        const map = new Map<number, string>();
        chapterHighlights.forEach(h => map.set(h.verse, h.color));
        setVerseHighlights(map);
      } catch {
        logger.warn('Could not load highlights', {
          component: 'VerseReadingScreen',
        });
      }
    })();
    return () => {
      active = false;
    };
  }, [highlightService, book, chapterNum]);

  // Auto-scroll so the verse currently read aloud stays visible
  useEffect(() => {
    if (!audioState.isPlaying) return;
    const verseNum = verses[audioState.currentVerseIndex]?.verse;
    if (verseNum == null) return;
    const offset = verseOffsetsRef.current.get(verseNum);
    if (offset != null && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: Math.max(offset - 140, 0),
        animated: true,
      });
    }
  }, [audioState.currentVerseIndex, audioState.isPlaying, verses]);

  // Apply or remove a highlight color on the selected verses
  async function handleApplyHighlight(color: HighlightColor | null) {
    if (!highlightService || selectedVerses.size === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nums = Array.from(selectedVerses);
    const next = new Map(verseHighlights);
    try {
      for (const num of nums) {
        const verseId = `${book}:${chapterNum}:${num}`;
        if (color === null) {
          await highlightService.removeHighlight(verseId);
          next.delete(num);
        } else {
          await highlightService.addHighlight(
            verseId,
            book,
            chapterNum,
            num,
            color,
          );
          next.set(num, color);
        }
      }
      setVerseHighlights(next);
    } catch (err) {
      logger.error('Error applying highlight', err as Error, {
        component: 'VerseReadingScreen',
      });
    }
    setShowHighlightPicker(false);
    clearSelection();
  }

  // Get selected verses as text
  function getSelectedVersesText(): string {
    const sortedNums = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedVersesData = sortedNums
      .map(num => verses.find(v => v.verse === num))
      .filter(Boolean) as BibleVerse[];

    const reference = `${localizedBookName} ${chapterNum}:${formatVerseList(
      sortedNums,
    )}`;

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

  // Reference label for the selected verses, e.g. "John 3:16" or "John 3:16-18"
  function getSelectedReference(): string {
    const sortedNums = Array.from(selectedVerses).sort((a, b) => a - b);
    if (sortedNums.length === 0) {
      return `${localizedBookName} ${chapterNum}`;
    }
    return `${localizedBookName} ${chapterNum}:${formatVerseList(sortedNums)}`;
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

  // Save the selected verses as named bookmarks (one per verse so the
  // user can come back to a specific point — distinct from the single
  // "Continue Reading" position the reader auto-tracks).
  async function handleBookmarkSelected() {
    if (selectedVerses.size === 0) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const sortedNums = Array.from(selectedVerses).sort((a, b) => a - b);
    const selectedVersesData = sortedNums
      .map(num => verses.find(v => v.verse === num))
      .filter(Boolean) as BibleVerse[];

    for (const verse of selectedVersesData) {
      await addBookmark({
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
      });
    }

    toast.success(
      sortedNums.length === 1
        ? t.bookmarks.added
        : t.bookmarks.addedMany.replace('{{n}}', String(sortedNums.length)),
    );
    clearSelection();
  }

  // Toggle favorite for a single verse (when clicking the heart icon)
  async function handleToggleSingleFavorite(verseObj: BibleVerse) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const existingFav = favorites.find(
      f =>
        f.book === verseObj.book &&
        f.chapter === verseObj.chapter &&
        f.verse === verseObj.verse,
    );

    if (existingFav) {
      await removeFavorite(existingFav.id);
      toast.info(t.verse.removedFromFavorites || 'Eliminado de favoritos');
    } else {
      await addFavorite(verseObj, 'other', 5);
      toast.success(t.verse.addedToFavorites || 'Agregado a favoritos');
    }
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

  // Cross-reference jump used by inline-linked book/chapter:verse spans
  // inside the rendered verse text (see #8 of the Sprint-17 plan).
  function jumpToReference(ref: ParsedReference) {
    Haptics.selectionAsync();
    const base = `/verse/${ref.book.name}/${ref.chapter}`;
    router.push(
      (ref.verse !== undefined ? `${base}?verse=${ref.verse}` : base) as never,
    );
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

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_err) {
      // Ignore
    }

    // Convert BibleVerse to AudioVerse format with defensive text check
    const audioVerses: AudioVerse[] = verses.map(v => ({
      book: v.book || '',
      chapter: v.chapter || 0,
      verse: v.verse || 0,
      text: String(v.text || ''),
    }));

    loadAudioChapter(audioVerses);

    // Small delay before playing to ensure loading is complete in context
    setTimeout(() => {
      play();
    }, 100);
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
          title: `${localizedBookName} ${chapterNum}`,
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
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  audioState.isPlaying ? t.verse.pause : t.verse.audio
                }>
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
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel={t.verse.immersive}>
                <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFontSize(prev => Math.min(prev + 2, 24));
                }}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel={t.verse.increaseFontSize}>
                <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFontSize(prev => Math.max(prev - 2, 12));
                }}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel={t.verse.decreaseFontSize}>
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
              {localizedBookName} {chapterNum}
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
              {audioState.isPlaying ? t.verse.pause : t.verse.audio}
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
              {t.verse.immersive}
            </Text>
          </TouchableOpacity>

          {secondaryVersion ? (
            <TouchableOpacity
              style={[
                styles.toolbarButton,
                sideBySide && {
                  backgroundColor: effectiveColors.primary + '20',
                },
              ]}
              onPress={toggleSideBySide}
              accessibilityRole="button"
              accessibilityState={{selected: sideBySide}}
              accessibilityLabel={t.verse.sideBySide}>
              <Ionicons
                name="copy-outline"
                size={22}
                color={
                  sideBySide ? effectiveColors.primary : effectiveColors.text
                }
              />
              <Text
                style={[
                  styles.toolbarButtonText,
                  {
                    color: sideBySide
                      ? effectiveColors.primary
                      : effectiveColors.textSecondary,
                  },
                ]}>
                {t.verse.dualView}
              </Text>
            </TouchableOpacity>
          ) : null}

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
            {
              // Leave room so the last verses are never hidden behind the
              // tab bar, the audio mini-player or the selection action bar.
              paddingBottom:
                insets.bottom +
                100 +
                (isAudioVisible ? 80 : 0) +
                (selectedVerses.size > 0 ? 130 : 0),
            },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollEndDrag={persistChapterProgress}
          onMomentumScrollEnd={persistChapterProgress}
          onLayout={e => {
            viewportHeightRef.current = e.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_w, h) => {
            contentHeightRef.current = h;
          }}>
          {verses.map((verse, index) => {
            const isFavorited = favoritedVerses.has(verse.verse);
            const isSelected = selectedVerses.has(verse.verse);
            const isHighlighted =
              highlightVerse &&
              parseInt(highlightVerse as string) === verse.verse;
            const isBeingRead =
              audioState.isPlaying && audioState.currentVerseIndex === index;
            const userHighlight = verseHighlights.get(verse.verse);

            const textStyle = {
              color: isBeingRead
                ? '#D4AF37'
                : userHighlight
                  ? '#1A1D2E'
                  : isSelected
                    ? effectiveColors.primaryDark
                    : effectiveColors.text,
              fontSize,
              lineHeight: fontSize * 1.6,
            };

            const numberStyle = {
              color: isBeingRead
                ? '#D4AF37'
                : userHighlight
                  ? '#1A1D2E'
                  : effectiveColors.primary,
            };

            return (
              <TouchableOpacity
                key={verse.verse}
                activeOpacity={0.7}
                onPress={() => toggleVerseSelection(verse.verse)}
                onLayout={e => {
                  verseOffsetsRef.current.set(
                    verse.verse,
                    e.nativeEvent.layout.y,
                  );
                }}
                style={[
                  styles.verseItem,
                  isSelected && styles.verseSelected,
                  isHighlighted && styles.verseHighlighted,
                  isBeingRead && styles.verseBeingRead,
                  userHighlight && {
                    backgroundColor: userHighlight,
                    borderRadius: 10,
                  },
                ]}>
                <View style={styles.verseContent}>
                  <Text style={[styles.verseText, textStyle]}>
                    <Text style={[styles.verseNumber, numberStyle]}>
                      {isBeingRead ? '🔊 ' : ''}
                      {verse.verse}
                      {'  '}
                    </Text>
                    {/* Linkify inline references ("Isaías 53:5", "John 3:16")
                        inside the verse text so they become tappable jumps. */}
                    {(() => {
                      const segments = linkifyReferences(verse.text);
                      if (segments.length === 1 && !segments[0].ref) {
                        return verse.text;
                      }
                      const linkColor = userHighlight
                        ? effectiveColors.primaryDark
                        : effectiveColors.primary;
                      return segments.map((seg, i) =>
                        seg.ref ? (
                          <Text
                            key={i}
                            onPress={() => jumpToReference(seg.ref!)}
                            style={{
                              color: linkColor,
                              textDecorationLine: 'underline',
                            }}>
                            {seg.text}
                          </Text>
                        ) : (
                          seg.text
                        ),
                      );
                    })()}
                  </Text>
                  {/* Side-by-side companion: render the matching verse
                      from the other version directly below the primary
                      one, separated by a thin divider and styled smaller
                      / dimmer so it reads as supporting context. The
                      tap on this region is harmless — selection still
                      targets the primary verse via the outer Touchable. */}
                  {sideBySide && secondaryVersion
                    ? (() => {
                        const companion = secondaryVerses.find(
                          v => v.verse === verse.verse,
                        );
                        if (!companion) return null;
                        return (
                          <View
                            style={[
                              styles.sideBySideCompanion,
                              {
                                borderTopColor: effectiveColors.border,
                                borderLeftColor: effectiveColors.primary,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.sideBySideLabel,
                                {color: effectiveColors.primary},
                              ]}>
                              {secondaryVersion.abbreviation}
                            </Text>
                            <Text
                              style={[
                                styles.sideBySideText,
                                {
                                  color: userHighlight
                                    ? '#1A1D2E'
                                    : effectiveColors.textSecondary,
                                  fontSize: Math.max(fontSize - 2, 12),
                                  lineHeight: Math.max(fontSize - 2, 12) * 1.5,
                                },
                              ]}>
                              {companion.text}
                            </Text>
                          </View>
                        );
                      })()
                    : null}
                </View>
                {isFavorited && (
                  <TouchableOpacity
                    onPress={() => handleToggleSingleFavorite(verse)}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    style={styles.favoriteIndicator}>
                    <Ionicons
                      name="heart"
                      size={18}
                      color={effectiveColors.favorite}
                    />
                  </TouchableOpacity>
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
                // Float clear above the tab bar (which now includes the
                // system inset). When the audio mini-player is visible, sit
                // above it too.
                bottom:
                  insets.bottom +
                  (Platform.OS === 'ios' ? 88 : 68) +
                  (isAudioVisible ? 92 : 12),
              },
            ]}>
            <View style={styles.selectionHeader}>
              <Text
                style={[styles.selectionCount, {color: effectiveColors.text}]}>
                {selectedVerses.size}{' '}
                {selectedVerses.size === 1 ? t.verse.singular : t.verse.plural}
              </Text>
              <TouchableOpacity
                onPress={clearSelection}
                accessibilityRole="button"
                accessibilityLabel={t.verse.clearSelection}>
                <Ionicons
                  name="close"
                  size={22}
                  color={effectiveColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {showHighlightPicker ? (
              <View style={styles.highlightPicker}>
                {(
                  Object.entries(HighlightColor) as [
                    keyof typeof HighlightColor,
                    HighlightColor,
                  ][]
                ).map(([key, c]) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.highlightSwatch, {backgroundColor: c}]}
                    onPress={() => handleApplyHighlight(c)}
                    accessibilityRole="button"
                    accessibilityLabel={t.verse.highlightInColor.replace(
                      '{{color}}',
                      t.verse.highlightColorNames[
                        key.toLowerCase() as keyof typeof t.verse.highlightColorNames
                      ] ?? key.toLowerCase(),
                    )}
                  />
                ))}
                <TouchableOpacity
                  style={[
                    styles.highlightSwatch,
                    styles.highlightRemoveSwatch,
                    {borderColor: effectiveColors.border},
                  ]}
                  onPress={() => handleApplyHighlight(null)}
                  accessibilityRole="button"
                  accessibilityLabel={t.verse.removeHighlight}>
                  <Ionicons
                    name="close"
                    size={18}
                    color={effectiveColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ) : (
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.verse.addFavorite}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={handleBookmarkSelected}>
                  <Ionicons
                    name="bookmark-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.bookmarks.short}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={() => setShowHighlightPicker(true)}>
                  <Ionicons
                    name="color-palette-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.verse.highlight}
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.verse.image}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
              <TouchableOpacity
                onPress={() => setImageModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={t.close}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.imageCreatorTitle, {color: colors.text}]}>
                {t.verse.shareAsImage}
              </Text>
              <TouchableOpacity
                onPress={handleShareImage}
                disabled={isSharingImage}
                style={isSharingImage && {opacity: 0.6}}
                accessibilityRole="button"
                accessibilityLabel={t.verse.shareVerse}>
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
                        : t.verse.selectVersesFirst}
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
                      {getSelectedReference()}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.imageOptionsContainer}>
                <Text
                  style={[styles.optionsTitle, {color: colors.textSecondary}]}>
                  {t.verse.imageStyle}
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
                    {t.verse.imageFontSize}
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
                    {t.verse.imageAlignment}
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
                    {t.verse.imageFontStyle}
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
                    ? `${
                        localizedBookName || selectedVerseForNote.book
                      } ${selectedVerseForNote.chapter}:${selectedVerseForNote.verse}`
                    : t.notes.add}
                </Text>
                <TouchableOpacity
                  onPress={() => setNoteModalVisible(false)}
                  accessibilityRole="button"
                  accessibilityLabel={t.close}>
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
          presentationStyle="fullScreen"
          onRequestClose={() => setImmersiveModeActive(false)}>
          <ImmersiveReader
            verses={verses}
            onClose={() => setImmersiveModeActive(false)}
            startIndex={0}
          />
        </Modal>

        {/* Bottom Navigation - hides on scroll down or when selection is active */}
        {/* Bottom Navigation is now handled by TabLayout */}
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
  },
  verseNumber: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  verseText: {
    fontSize: fontSizes.base,
  },
  sideBySideCompanion: {
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    paddingLeft: spacing.sm,
    borderTopWidth: 1,
    borderLeftWidth: 2,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  sideBySideLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  sideBySideText: {
    fontStyle: 'italic',
  },
  favoriteIndicator: {
    marginLeft: spacing.sm,
    marginTop: 5, // Alineación visual con el centro de la primera línea
  },
  // BARRA DE SELECCIÓN
  selectionBar: {
    position: 'absolute',
    bottom: 84, // Base value, dynamically overridden to account for tab bar height
    left: 16,
    right: 16,
    // No fixed height: the bar grows to fit the header row + the action row
    // so the buttons are never clipped.
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
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
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  highlightPicker: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  highlightSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightRemoveSwatch: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
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
