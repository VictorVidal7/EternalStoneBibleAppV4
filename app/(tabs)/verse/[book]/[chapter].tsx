import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {useState, useEffect, useRef, useMemo} from 'react';
import {useLocalSearchParams, useRouter, Stack} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {haptics} from '@lib/haptics';
import bibleDB from '@lib/database';
import {BibleVerse} from '@/types/bible';
import {
  BIBLE_VERSIONS,
  getBookByName,
  getBookById,
  canonicalBookName,
} from '@/constants/bible';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  linkifyReferences,
  type ParsedReference,
} from '@/lib/references/parseReference';
import {HighlightColor} from '@lib/highlights';
import {getSyncEngine} from '@lib/sync';
import {buildNoteRemotePayload} from '@lib/sync/adapters/notes';
import {buildHighlightRemotePayload} from '@lib/sync/adapters/highlights';
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
import {
  isBookComplete,
  detectCompletedBooks,
} from '@lib/achievements/bookCompletion';
import {logger} from '@lib/utils/logger';
import {ImmersiveReader} from '@components/reading/ImmersiveReader';
import {NoteEditorModal} from '@components/reading/NoteEditorModal';
import {ImageShareModal} from '@components/reading/ImageShareModal';
import {ReaderPreferencesSheet} from '@components/reading/ReaderPreferencesSheet';
import {CrossReferencesSheet} from '@components/reading/CrossReferencesSheet';
import {AddToCollectionSheet} from '@/features/collections/AddToCollectionSheet';
import {favoriteVerseId} from '@/features/collections/collections';
import {
  spotlightOpacity,
  focusVerseOpacity,
  focusedVerseFromOffsets,
} from '@/lib/reader/spotlight';
import {
  useReaderPreferences,
  READER_MARGIN_PADDING,
} from '@context/ReaderPreferencesContext';
import {resolveFontFamily} from '@components/reading/ReaderPreferencesSheet';
import {getBookTheme} from '@/constants/bookThemes';
// Audio Bible Feature
import {
  useAudioPlayer,
  AudioVerse,
  getLastPosition,
  clampVerseIndex,
  toAudioVerses,
} from '@/features/audio';
import {usePremium} from '@context/PremiumContext';
// Navigation
// import {
//   AnimatedBottomNav,
//   useScrollDirection,
// } from '../../../../src/components/navigation/AnimatedBottomNav';

import {
  spacing,
  borderRadius,
  fontSize as fontSizes,
  staticColors,
} from '@/styles/designTokens';
import {resolveReaderTheme} from '@/styles/readerThemes';
import {
  resolveSecondaryVersion,
  secondaryVersionChoices,
  normalizeDualLayout,
  toggleDualLayout as nextDualLayout,
  swapVersions,
  type DualLayout,
} from '@lib/reading/secondaryVersion';
import {
  formatVerseList,
  buildPassageReference,
} from '@lib/reading/passageReference';
import {hitSlopToMinTarget} from '@lib/a11y/touchTarget';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useWindowDimensions} from 'react-native';

// The chapter nav row is ~40dp tall; expand its tap target to the 48dp minimum.
const NAV_HIT_SLOP = hitSlopToMinTarget(40);

export default function VerseReadingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, isDark} = useTheme();
  const {selectedVersion, setVersion} = useBibleVersion();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {achievementService, highlightService, notifyAchievements} =
    useServices();
  const {favorites, addFavorite, removeFavorite} = useFavorites();
  const {addBookmark} = useBookmarks();
  const {markChapterRead} = useReadingPlanProgress();
  // Audio Bible
  const {
    loadChapter: loadAudioChapter,
    play,
    pause,
    goToVerse,
    state: audioState,
    isVisible: isAudioVisible,
  } = useAudioPlayer();
  const {isPremium} = usePremium();
  const {
    book,
    chapter,
    verse: highlightVerse,
    audioResume,
  } = useLocalSearchParams<{
    book: string;
    chapter: string;
    verse?: string;
    audioResume?: string;
  }>();

  const bookInfo = getBookByName(book);
  const chapterNum = parseInt(chapter);
  // Canonical, language-agnostic book identity for keying user data
  // (favorites / highlights / notes). The route `book` param can be Spanish
  // ("Génesis", from the book grid) or English ("Genesis", from a deep-link),
  // and the DB verse rows use the reading version's language — so all of these
  // must collapse to one key or a favorite/highlight silently fails to match
  // (Sprint 58 bug). See canonicalBookName.
  const canonicalBook = canonicalBookName(book);
  const bookTheme = getBookTheme(bookInfo?.name || '');
  // Display name follows the UI language so it stays consistent with the
  // Bible library (e.g. "Genesis" in English, not "Génesis").
  const localizedBookName = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : '';
  // Navigation is continuous across books: only Genesis 1 has no previous
  // chapter and only the final chapter of Revelation has no next chapter.
  const canGoPrev = bookInfo
    ? chapterNum > 1 || !!getBookById(bookInfo.id - 1)
    : false;
  const canGoNext = bookInfo
    ? chapterNum < bookInfo.chapters || !!getBookById(bookInfo.id + 1)
    : false;

  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const {preferences: readerPrefs} = useReaderPreferences();
  const fontSize = readerPrefs.fontSize;
  const readerFontFamily = useMemo(
    () => resolveFontFamily(readerPrefs.fontFamily),
    [readerPrefs.fontFamily],
  );
  const readerPaddingHorizontal = READER_MARGIN_PADDING[readerPrefs.margin];
  const [readerPrefsVisible, setReaderPrefsVisible] = useState(false);
  const [selectedVerseForNote, setSelectedVerseForNote] =
    useState<BibleVerse | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [crossRefsVisible, setCrossRefsVisible] = useState(false);
  const [crossRefsVerse, setCrossRefsVerse] = useState<number | null>(null);
  // "Add to collection" target (Sprint 68): the canonical verseId of the verse
  // whose collections the AddToCollectionSheet is editing. We track the verseId
  // (deterministic) rather than the random favorite id so the sheet opens
  // robustly the moment the favorite exists in the live store (it may be
  // created on demand when the verse wasn't a favorite yet).
  const [collectionVerseId, setCollectionVerseId] = useState<string | null>(
    null,
  );
  // The live favorite id for the verse being added to a collection — resolved
  // from the store by verseId, so it appears as soon as the favorite exists
  // (whether it pre-existed or was just created on demand). null keeps the
  // sheet closed.
  const collectionFavoriteId = useMemo(
    () =>
      collectionVerseId
        ? (favorites.find(f => f.verseId === collectionVerseId)?.id ?? null)
        : null,
    [collectionVerseId, favorites],
  );
  // Selection-toolbar overflow ("Más"): study-mode actions that don't
  // need to live in the top-level 4×2 grid.
  const [showOverflow, setShowOverflow] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [favoritedVerses, setFavoritedVerses] = useState<Set<number>>(
    new Set(),
  );
  const [immersiveModeActive, setImmersiveModeActive] = useState(false);
  // Verse highlights: map of verse number -> highlight color (hex).
  const [verseHighlights, setVerseHighlights] = useState<Map<number, string>>(
    new Map(),
  );
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  // Side-by-side mode: pairs each verse with its counterpart from a SECOND
  // translation so users can study two at once without leaving the reader.
  const [sideBySide, setSideBySide] = useState(false);
  const [secondaryVerses, setSecondaryVerses] = useState<BibleVerse[]>([]);
  // The user's chosen companion translation (persisted). With three versions
  // (RVR1960 / KJV / WEB) the companion is no longer "the other one" — it's a
  // real choice; null means "not chosen yet → first available" (Sprint 66).
  const [preferredSecondaryId, setPreferredSecondaryId] = useState<
    string | null
  >(null);
  // The companion to actually render: the preference when it's a real,
  // non-primary version, else the first available one (pure + tested).
  const secondaryVersion = useMemo(
    () =>
      resolveSecondaryVersion(
        selectedVersion.id,
        preferredSecondaryId,
        BIBLE_VERSIONS,
      ),
    [selectedVersion.id, preferredSecondaryId],
  );
  // The companion candidates (everything but the version being read) — the
  // chips shown in the dual-mode picker.
  const secondaryChoices = useMemo(
    () => secondaryVersionChoices(selectedVersion.id, BIBLE_VERSIONS),
    [selectedVersion.id],
  );
  // How the two translations are laid out in dual mode: the companion stacked
  // under each verse (default) or two equal-weight columns (Sprint 67),
  // persisted so the reader's choice sticks.
  const [dualLayout, setDualLayout] = useState<DualLayout>('stacked');

  // Dedicated Focus mode (Sprint 70): a toolbar toggle that spotlights the verse
  // centered in the viewport (dimming the rest) for distraction-free reading.
  // Persisted; reuses the pure spotlight model. `focusedVerse` follows scroll.
  const [focusMode, setFocusMode] = useState(false);
  const [focusedVerse, setFocusedVerse] = useState<number | null>(null);

  // Y offset of each verse row within the ScrollView, for audio auto-scroll
  // (Sprint 70 also reads them to find the centered verse for Focus mode).
  const verseOffsetsRef = useRef<Map<number, number>>(new Map());
  // Latest scroll Y, so toggling Focus mode ON can spotlight immediately.
  const lastScrollYRef = useRef(0);
  const {width: windowWidth} = useWindowDimensions();
  const navSideWidth = Math.min(windowWidth * 0.32, 140);

  const {setBottomOffset} = useAudioPlayer();

  // El reproductor de audio conserva su posición; la barra de selección de
  // versículos se dibuja por encima de él (ver estilo `selectionBar`), así
  // que no hace falta desplazar el player.
  useEffect(() => {
    setBottomOffset(0);
    return () => setBottomOffset(0);
  }, [setBottomOffset]);

  // Hydrate the dual-mode preferences once on mount: whether it's on, and
  // which companion translation was last chosen.
  useEffect(() => {
    AsyncStorage.getItem('@reader_side_by_side')
      .then(v => {
        if (v === '1') setSideBySide(true);
      })
      .catch(() => undefined);
    AsyncStorage.getItem('@reader_secondary_version')
      .then(v => {
        if (v) setPreferredSecondaryId(v);
      })
      .catch(() => undefined);
    AsyncStorage.getItem('@reader_dual_layout')
      .then(v => setDualLayout(normalizeDualLayout(v)))
      .catch(() => undefined);
    AsyncStorage.getItem('@reader_focus_mode')
      .then(v => setFocusMode(v === '1'))
      .catch(() => undefined);
  }, []);

  function toggleSideBySide() {
    haptics.tap();
    const next = !sideBySide;
    setSideBySide(next);
    AsyncStorage.setItem('@reader_side_by_side', next ? '1' : '0').catch(
      () => undefined,
    );
    // The companion chapter is fetched by the effect below, which reacts to
    // sideBySide / the chosen secondary version / the chapter.
  }

  // Toggle Focus mode (Sprint 70). Turning it ON spotlights the centered verse
  // immediately (computed from the last known scroll position); turning it OFF
  // clears the focused verse so every row returns to full opacity. Persisted.
  function toggleFocusMode() {
    haptics.tap();
    const next = !focusMode;
    setFocusMode(next);
    AsyncStorage.setItem('@reader_focus_mode', next ? '1' : '0').catch(
      () => undefined,
    );
    if (next) {
      const offsets = Array.from(verseOffsetsRef.current, ([verse, y]) => ({
        verse,
        y,
      }));
      setFocusedVerse(
        focusedVerseFromOffsets(
          offsets,
          lastScrollYRef.current,
          viewportHeightRef.current,
        ),
      );
    } else {
      setFocusedVerse(null);
    }
  }

  // Switch which translation is shown alongside the one being read, and
  // remember it. The fetch effect below reloads the companion chapter.
  function changeSecondaryVersion(versionId: string) {
    haptics.tap();
    setPreferredSecondaryId(versionId);
    AsyncStorage.setItem('@reader_secondary_version', versionId).catch(
      () => undefined,
    );
  }

  // Swap primary ↔ companion without a trip to Settings. The "primary" is the
  // app-wide reading version (setVersion persists @bible_version), so swapping
  // flips the whole app's version and pins the previous primary as the
  // companion — the honest meaning of "primary" (Sprint 67).
  function swapPrimaryAndSecondary() {
    if (!secondaryVersion) return;
    haptics.tap();
    const swapped = swapVersions(selectedVersion.id, secondaryVersion.id);
    setPreferredSecondaryId(swapped.secondaryId);
    AsyncStorage.setItem(
      '@reader_secondary_version',
      swapped.secondaryId,
    ).catch(() => undefined);
    // setVersion is async + persists @bible_version; the primary/companion
    // chapter effects react to the new selectedVersion.id / secondary id.
    void setVersion(swapped.primaryId);
  }

  // Toggle the dual layout (companion stacked vs equal-weight columns) + persist.
  function changeDualLayout() {
    haptics.tap();
    setDualLayout(prev => {
      const next = nextDualLayout(prev);
      AsyncStorage.setItem('@reader_dual_layout', next).catch(() => undefined);
      return next;
    });
  }

  // (Re)fetch the companion chapter whenever dual mode, the chosen secondary
  // version, or the chapter changes; clear it when dual mode is off. This is
  // the single source of the side-by-side text (previously duplicated inline
  // in the toggle and in loadChapter).
  useEffect(() => {
    if (!sideBySide || !secondaryVersion || !bookInfo) {
      setSecondaryVerses([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const secondary = await bibleDB.getChapter(
          bookInfo.id,
          chapterNum,
          secondaryVersion.id,
        );
        if (active) setSecondaryVerses(secondary);
      } catch (error) {
        logger.error('Side-by-side fetch failed', error as Error, {
          component: 'VerseReadingScreen',
          action: 'secondaryFetch',
        });
        if (active) setSecondaryVerses([]);
      }
    })();
    return () => {
      active = false;
    };
    // bookInfo is derived from `book`, so `book` in the deps covers it.
  }, [sideBySide, secondaryVersion?.id, book, chapterNum]);

  // Reading-progress tracking: how far the reader scrolled through the
  // chapter, persisted on chapter change / unmount so the chapter grid
  // can show real "read" indicators.
  const {progress, updateChapterProgress} = useReadingProgress();
  // Keep the latest updateChapterProgress so the unmount persist below
  // never writes through a stale closure.
  const updateChapterProgressRef = useRef(updateChapterProgress);
  updateChapterProgressRef.current = updateChapterProgress;
  // Books already reconciled in THIS screen session — guards the completion
  // sync from re-running on every scroll tick once a book is finished.
  const syncedBooksRef = useRef<Set<string>>(new Set());

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
    lastScrollYRef.current = contentOffset.y;
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

    // Focus mode (Sprint 70): spotlight the verse crossing the viewport center,
    // following the scroll. Only re-render when the centered verse changes.
    if (focusMode) {
      const offsets = Array.from(verseOffsetsRef.current, ([verse, y]) => ({
        verse,
        y,
      }));
      const next = focusedVerseFromOffsets(
        offsets,
        contentOffset.y,
        layoutMeasurement.height,
      );
      if (next !== focusedVerse) {
        setFocusedVerse(next);
      }
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

  // The reader follows its own reading theme (paper/sepia/night) layered
  // over the app theme; 'system' (default) falls through to the live app
  // colors so an existing user sees no change. `themedColors` also carries
  // the reader-specific `audioHighlight` (verse being read aloud) and
  // `onHighlight` (text over a user highlight swatch) extras.
  const themedColors = resolveReaderTheme(colors, readerPrefs.theme);
  const effectiveColors = {
    ...themedColors,
    favorite: themedColors.primary,
    verseHighlight: themedColors.primaryLight || 'rgba(74, 144, 226, 0.15)',
    warning: colors.warning,
  };

  // Whether the *reading* surface is dark. Drives the floating selection bar
  // so its `effectiveColors.text` stays legible when the reading theme
  // differs from the app theme (e.g. a Night reading theme on a light app).
  const readerIsDark =
    readerPrefs.theme === 'system'
      ? isDark
      : readerPrefs.theme === 'night' || readerPrefs.theme === 'high-contrast';

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
        favorite =>
          canonicalBookName(favorite.book) === canonicalBook &&
          favorite.chapter === chapterNum,
      )
      .map(favorite => favorite.verse);
    setFavoritedVerses(new Set(currentChapterFavorites));
  }, [favorites, book, canonicalBook, chapterNum]);

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

        // Track verses read — pass the canonical book so the read is also
        // accumulated in the per-book log (powers the REAL "most-read book").
        const newAchievements = await achievementService.trackVersesRead(
          verses.length,
          timeSpent,
          canonicalBook,
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
          // Celebrate them via the global modal. Pre-Sprint-64 these were
          // computed and dropped (the modal's setter was never wired), so
          // reader unlocks only ever showed in the Achievements tab.
          notifyAchievements(newAchievements);
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
    notifyAchievements,
    t,
    toast,
  ]);

  // 📚 Book-completion detection (Sprint 64). When the reading-progress map
  // shows the CURRENT book is now fully read (every chapter past the
  // threshold), reconcile the completed-books ledger — this unlocks the BOOKS
  // chain (first_book … books_66) and the per-book SPECIAL badges
  // (Psalms/Proverbs/the 4 Gospels) that were unreachable while the dead
  // `trackBookCompleted` was never called. Gated on the book actually being
  // complete + a per-session guard so it never re-runs on each scroll tick;
  // the heavy sync only fires the moment a book flips to done.
  useEffect(() => {
    if (!achievementService || !canonicalBook) return;
    const totalChapters = getBookByName(canonicalBook)?.chapters;
    if (!isBookComplete(progress[canonicalBook], totalChapters)) return;
    if (syncedBooksRef.current.has(canonicalBook)) return;
    syncedBooksRef.current.add(canonicalBook);

    let cancelled = false;
    (async () => {
      try {
        const completed = detectCompletedBooks(
          progress,
          name => getBookByName(name)?.chapters,
        );
        const unlocked = await achievementService.syncBookCompletion(completed);
        if (!cancelled && unlocked.length > 0) {
          logger.info('Book completed — achievements unlocked', {
            component: 'VerseReadingScreen',
            book: canonicalBook,
            achievements: unlocked.map(a => a.id),
          });
          notifyAchievements(unlocked);
        }
      } catch (err) {
        logger.warn('Book-completion sync failed', {
          component: 'VerseReadingScreen',
          error: err,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [progress, canonicalBook, achievementService, notifyAchievements]);

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

      // The side-by-side companion chapter is loaded by its own effect (which
      // reacts to dual mode / the chosen secondary version / the chapter), so
      // it no longer needs to be fetched here.

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

    haptics.tap();

    const existingNote = await bibleDB.getNoteForVerse(
      selectedVerseForNote.book,
      selectedVerseForNote.chapter,
      selectedVerseForNote.verse,
    );

    let savedNoteId: string | null = null;
    let savedNote: typeof existingNote = null;
    if (existingNote) {
      await bibleDB.updateNote(existingNote.id, noteText.trim());
      savedNoteId = existingNote.id;
      savedNote = {
        ...existingNote,
        note: noteText.trim(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      const now = new Date().toISOString();
      const noteToAdd = {
        // Canonical book so the stored note and the synced payload match what
        // getNoteForVerse looks up, across versions/devices (Sprint 58).
        book: canonicalBookName(selectedVerseForNote.book),
        chapter: selectedVerseForNote.chapter,
        verse: selectedVerseForNote.verse,
        text: selectedVerseForNote.text,
        note: noteText.trim(),
        createdAt: now,
        updatedAt: now,
      };
      savedNoteId = await bibleDB.addNote(noteToAdd);
      savedNote = {id: savedNoteId, ...noteToAdd};
    }

    if (savedNote && savedNoteId) {
      getSyncEngine()?.queueWrite(
        'notes',
        savedNoteId,
        buildNoteRemotePayload(savedNote),
      );
    }

    setNoteModalVisible(false);
    setNoteText('');
    toast.success(t.notes.saved);
  }

  // Toggle verse selection
  function toggleVerseSelection(verseNum: number) {
    haptics.tap();
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
    setShowOverflow(false);
  }

  // Load saved highlights for the current chapter
  useEffect(() => {
    let active = true;
    (async () => {
      if (!highlightService) return;
      try {
        const chapterHighlights = await highlightService.getHighlightsByChapter(
          canonicalBook,
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
  }, [highlightService, canonicalBook, chapterNum]);

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
    haptics.tap();
    const nums = Array.from(selectedVerses);
    const next = new Map(verseHighlights);
    const engine = getSyncEngine();
    try {
      for (const num of nums) {
        // Key highlights (and their Firestore doc id) on the canonical book so
        // the same verse highlights/unhighlights consistently across versions
        // and nav paths (Sprint 58).
        const verseId = `${canonicalBook}:${chapterNum}:${num}`;
        if (color === null) {
          // Snapshot the current highlight (if any) before removing so
          // the tombstone can carry the verse identity to other devices.
          const existing = await highlightService.getHighlightByVerse(verseId);
          await highlightService.removeHighlight(verseId);
          next.delete(num);
          engine?.queueDelete(
            'highlights',
            verseId,
            existing ? buildHighlightRemotePayload(existing) : undefined,
          );
        } else {
          const created = await highlightService.addHighlight(
            verseId,
            canonicalBook,
            chapterNum,
            num,
            color,
          );
          next.set(num, color);
          engine?.queueWrite(
            'highlights',
            verseId,
            buildHighlightRemotePayload(created),
          );
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
    return buildPassageReference(
      localizedBookName,
      chapterNum,
      Array.from(selectedVerses),
    );
  }

  // Copy selected verses
  async function handleCopySelected() {
    if (selectedVerses.size === 0) return;
    haptics.tap();
    await Clipboard.setStringAsync(getSelectedVersesText());
    toast.success(t.verse.verseCopied);
    clearSelection();
  }

  // Share selected verses
  async function handleShareSelected() {
    if (selectedVerses.size === 0) return;
    haptics.tap();
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

  // Favorite selected verses (save individually for indicators)
  async function handleFavoriteSelected() {
    if (selectedVerses.size === 0) return;
    haptics.press();

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

  // Add the FIRST selected verse to a collection (Sprint 68). A collection is a
  // favorite tag, so the verse must be a favorite first — favorite it on demand
  // if it isn't one, then open the AddToCollectionSheet keyed to its canonical
  // verseId (the sheet resolves the live favorite and edits its tags). Operating
  // on the first selected verse keeps the dense selection bar simple.
  async function handleAddToCollectionSelected() {
    if (selectedVerses.size === 0) return;
    haptics.tap();

    const firstNum = Array.from(selectedVerses).sort((a, b) => a - b)[0];
    const verse = verses.find(v => v.verse === firstNum);
    if (!verse) return;

    const verseId = favoriteVerseId(
      canonicalBookName(verse.book),
      verse.chapter,
      verse.verse,
    );
    if (!favorites.some(f => f.verseId === verseId)) {
      await addFavorite(verse, 'other', 5);
      setFavoritedVerses(prev => new Set(prev).add(firstNum));
    }

    setCollectionVerseId(verseId);
    setShowOverflow(false);
    clearSelection();
  }

  // Save the selected verses as named bookmarks (one per verse so the
  // user can come back to a specific point — distinct from the single
  // "Continue Reading" position the reader auto-tracks).
  async function handleBookmarkSelected() {
    if (selectedVerses.size === 0) return;
    haptics.press();

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
    haptics.press();

    const verseCanonicalBook = canonicalBookName(verseObj.book);
    const existingFav = favorites.find(
      f =>
        canonicalBookName(f.book) === verseCanonicalBook &&
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
    haptics.selection();
    const base = `/verse/${ref.book.name}/${ref.chapter}`;
    router.push(
      (ref.verse !== undefined ? `${base}?verse=${ref.verse}` : base) as never,
    );
  }

  function navigateChapter(direction: 'prev' | 'next') {
    if (!bookInfo) return;

    // Stay within the book when possible; otherwise flow across the book
    // boundary so the reader works as a continuous Genesis→Revelation scroll
    // (the last chapter of a book leads into chapter 1 of the next book, and
    // chapter 1 leads back to the previous book's final chapter).
    let targetBook = book;
    let newChapter = chapterNum + (direction === 'next' ? 1 : -1);

    if (newChapter < 1) {
      const prevBook = getBookById(bookInfo.id - 1);
      if (!prevBook) {
        haptics.warning();
        Alert.alert(t.app.endOfBook, t.app.firstChapterMessage);
        return;
      }
      targetBook = prevBook.name;
      newChapter = prevBook.chapters;
    } else if (newChapter > bookInfo.chapters) {
      const nextBook = getBookById(bookInfo.id + 1);
      if (!nextBook) {
        haptics.warning();
        Alert.alert(t.app.endOfBook, t.app.endOfBookMessage);
        return;
      }
      targetBook = nextBook.name;
      newChapter = 1;
    }

    haptics.tap();
    router.replace(`/verse/${targetBook}/${newChapter}` as never);
  }

  // Start Audio Bible playback
  async function startAudioPlayback() {
    if (verses.length === 0) return;

    try {
      haptics.press();
    } catch (_err) {
      // Ignore
    }

    // Convert BibleVerse to AudioVerse format (shared with the immersive reader's
    // listen path so both entry points coerce fields identically).
    const audioVerses: AudioVerse[] = toAudioVerses(verses);

    // Premium "Continue listening": resume where the user last was in THIS
    // chapter. Free users always start at verse 1 (unchanged behaviour). The
    // saved book is matched by language-agnostic id so it survives a version /
    // UI-language switch, and the index is re-clamped to the freshly loaded
    // chapter in case a different version has a different verse count.
    // Read the saved position BEFORE loadChapter — loading resets the player to
    // verse 0 and the persist effect would overwrite our saved index first.
    let resumeIndex = 0;
    if (isPremium) {
      const saved = await getLastPosition();
      const savedBookInfo = saved ? getBookByName(saved.book) : null;
      if (
        saved &&
        savedBookInfo?.id === bookInfo?.id &&
        saved.chapter === chapterNum &&
        saved.verseIndex > 0
      ) {
        resumeIndex = clampVerseIndex(saved.verseIndex, audioVerses.length);
      }
    }

    loadAudioChapter(audioVerses);

    if (resumeIndex > 0) {
      goToVerse(resumeIndex);
      const resumeVerse = audioVerses[resumeIndex];
      if (resumeVerse) {
        toast.info(
          t.audio.resume.toast.replace(
            '{{ref}}',
            `${localizedBookName} ${chapterNum}:${resumeVerse.verse}`,
          ),
        );
      }
    }

    // Small delay before playing to ensure loading is complete in context
    // (and that the resume index has propagated to the player's state ref).
    setTimeout(() => {
      play();
    }, 100);
  }

  // Auto-start audio when arriving via the Home "Continue listening" card
  // (deep-linked with ?audioResume=1). Premium only; fires once, after the
  // chapter's verses have loaded, then defers to the resume logic above.
  const audioResumeHandledRef = useRef(false);
  useEffect(() => {
    if (audioResumeHandledRef.current) return;
    if (audioResume !== '1' || !isPremium) return;
    if (loading || verses.length === 0) return;
    audioResumeHandledRef.current = true;
    void startAudioPlayback();
  }, [audioResume, isPremium, loading, verses.length]);

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
          headerTintColor: staticColors.white,
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
                    backgroundColor: staticColors.glassWhite20,
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
                  haptics.press();
                  setImmersiveModeActive(true);
                }}
                style={styles.headerButton}
                accessibilityRole="button"
                accessibilityLabel={t.verse.immersive}>
                <Ionicons name="expand-outline" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              {/* Sprint 54: font-size A+/A- retired from the header — size now
                  lives in the "Aa" reading-preferences sheet (with size, line
                  spacing, alignment, margins, typeface and reading theme). */}
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
              disabled={!canGoPrev}
              accessibilityRole="button"
              accessibilityState={{disabled: !canGoPrev}}
              accessibilityLabel={t.previous}
              hitSlop={NAV_HIT_SLOP}>
              <Ionicons
                name="chevron-back"
                size={24}
                color={
                  !canGoPrev
                    ? effectiveColors.textTertiary
                    : effectiveColors.primary
                }
              />
              <Text
                style={[
                  styles.navButtonText,
                  {
                    color: !canGoPrev
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
              disabled={!canGoNext}
              accessibilityRole="button"
              accessibilityState={{disabled: !canGoNext}}
              accessibilityLabel={t.next}
              hitSlop={NAV_HIT_SLOP}>
              <Text
                style={[
                  styles.navButtonText,
                  {
                    color: !canGoNext
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
                  !canGoNext
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
              haptics.tap();
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

          <TouchableOpacity
            style={[
              styles.toolbarButton,
              focusMode && {
                backgroundColor: effectiveColors.primary + '20',
              },
            ]}
            onPress={toggleFocusMode}
            accessibilityRole="button"
            accessibilityState={{selected: focusMode}}
            accessibilityLabel={t.verse.focusMode}>
            <Ionicons
              name="scan-outline"
              size={22}
              color={focusMode ? effectiveColors.primary : effectiveColors.text}
            />
            <Text
              style={[
                styles.toolbarButtonText,
                {
                  color: focusMode
                    ? effectiveColors.primary
                    : effectiveColors.textSecondary,
                },
              ]}>
              {t.verse.focusMode}
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
              haptics.tap();
              setReaderPrefsVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel={t.readerPrefs.openLabel}>
            <Ionicons
              name="text-outline"
              size={22}
              color={effectiveColors.text}
            />
            <Text
              style={[
                styles.toolbarButtonText,
                {color: effectiveColors.textSecondary},
              ]}>
              Aa
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dual-mode controls (Sprint 66 picker + Sprint 67 swap/layout):
            choose WHICH translation sits alongside the one being read (chips,
            only when >1 companion exists), swap primary ↔ companion, and switch
            between the stacked companion and equal-weight columns. Shown
            whenever dual mode is on. A wrapping row (not a horizontal scroller)
            so the chip labels actually paint on this app. */}
        {sideBySide && secondaryVersion ? (
          <View
            style={[
              styles.secondaryPicker,
              {
                backgroundColor: effectiveColors.surface,
                borderBottomColor: effectiveColors.border,
              },
            ]}>
            <Text
              style={[
                styles.secondaryPickerLabel,
                {color: effectiveColors.textSecondary},
              ]}>
              {t.verse.dualCompanionLabel}
            </Text>
            {secondaryChoices.length > 1 ? (
              secondaryChoices.map(v => {
                const active = secondaryVersion?.id === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => changeSecondaryVersion(v.id)}
                    accessibilityRole="button"
                    accessibilityState={{selected: active}}
                    accessibilityLabel={v.name}
                    style={[
                      styles.secondaryChip,
                      {
                        borderColor: active
                          ? effectiveColors.primary
                          : effectiveColors.border,
                        backgroundColor: active
                          ? effectiveColors.primary + '20'
                          : staticColors.transparent,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.secondaryChipText,
                        {
                          color: active
                            ? effectiveColors.primary
                            : effectiveColors.textSecondary,
                        },
                      ]}>
                      {v.abbreviation}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text
                style={[
                  styles.secondaryChipText,
                  {color: effectiveColors.primary},
                ]}>
                {secondaryVersion.abbreviation}
              </Text>
            )}

            {/* Swap primary ↔ companion + layout toggle */}
            <View style={styles.dualControls}>
              <TouchableOpacity
                onPress={swapPrimaryAndSecondary}
                accessibilityRole="button"
                accessibilityLabel={t.verse.swapVersions}
                style={[
                  styles.dualControlChip,
                  {borderColor: effectiveColors.border},
                ]}>
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={effectiveColors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={changeDualLayout}
                accessibilityRole="button"
                accessibilityState={{selected: dualLayout === 'columns'}}
                accessibilityLabel={
                  dualLayout === 'columns'
                    ? t.verse.dualLayoutStacked
                    : t.verse.dualLayoutColumns
                }
                style={[
                  styles.dualControlChip,
                  {
                    borderColor:
                      dualLayout === 'columns'
                        ? effectiveColors.primary
                        : effectiveColors.border,
                    backgroundColor:
                      dualLayout === 'columns'
                        ? effectiveColors.primary + '20'
                        : staticColors.transparent,
                  },
                ]}>
                <Ionicons
                  name={
                    dualLayout === 'columns'
                      ? 'browsers-outline'
                      : 'reorder-four-outline'
                  }
                  size={16}
                  color={
                    dualLayout === 'columns'
                      ? effectiveColors.primary
                      : effectiveColors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Verses - Clean inline format */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.versesContainer}
          contentContainerStyle={[
            styles.versesContent,
            {
              // Sprint 31: horizontal padding now follows the reader's
              // margin preference; vertical bottom padding leaves room so
              // the last verses are never hidden behind the tab bar, the
              // audio mini-player or the selection action bar.
              paddingHorizontal: readerPaddingHorizontal,
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
                ? effectiveColors.audioHighlight
                : userHighlight
                  ? effectiveColors.onHighlight
                  : isSelected
                    ? effectiveColors.primaryDark
                    : effectiveColors.text,
              fontSize,
              lineHeight: fontSize * readerPrefs.lineHeightMultiplier,
              textAlign: readerPrefs.textAlign,
              fontFamily: readerFontFamily,
            } as const;

            const numberStyle = {
              color: isBeingRead
                ? effectiveColors.audioHighlight
                : userHighlight
                  ? effectiveColors.onHighlight
                  : effectiveColors.primary,
            };

            // One coherent screen-reader node per verse: "Verse N, <text>"
            // (overrides the noisy 🔊/number prefix), with companion text
            // appended in side-by-side so nothing is hidden from TalkBack.
            const companionForA11y =
              sideBySide && secondaryVersion
                ? secondaryVerses.find(v => v.verse === verse.verse)?.text
                : undefined;
            const verseA11yLabel =
              t.verse.verseA11yLabel
                .replace('{{n}}', String(verse.verse))
                .replace('{{text}}', verse.text) +
              (companionForA11y ? `. ${companionForA11y}` : '');

            // Equal-weight two-column dual layout (Sprint 67): primary and
            // companion sit side by side at the same font size, vs the default
            // stacked/dimmed companion.
            const dualColumns =
              sideBySide && !!secondaryVersion && dualLayout === 'columns';

            return (
              <TouchableOpacity
                key={verse.verse}
                activeOpacity={0.7}
                onPress={() => toggleVerseSelection(verse.verse)}
                accessibilityLabel={verseA11yLabel}
                accessibilityHint={t.verse.verseA11yHint}
                accessibilityState={{selected: isSelected}}
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
                  userHighlight && styles.verseUserHighlightRadius,
                  userHighlight && {backgroundColor: userHighlight},
                  // Reading focus/spotlight: dim the verses around the active
                  // selection (Sprint 69) and, in Focus mode, around the verse
                  // centered in the viewport (Sprint 70). Static opacity (not a
                  // fade) → reduce-motion-safe; the dimmer of the two wins, and
                  // each is a no-op when its driver is inactive.
                  {
                    opacity: Math.min(
                      spotlightOpacity(verse.verse, selectedVerses),
                      focusVerseOpacity(verse.verse, focusedVerse, focusMode),
                    ),
                  },
                ]}>
                <View
                  style={[
                    styles.verseContent,
                    dualColumns && styles.verseContentColumns,
                  ]}>
                  <Text
                    style={[
                      styles.verseText,
                      textStyle,
                      dualColumns && styles.dualColumn,
                    ]}>
                    <Text style={[styles.verseNumber, numberStyle]}>
                      {/* "Now playing" cue for the verse being read aloud.
                          A vector glyph (not the old color emoji 🔊) — Android
                          mis-measures a color emoji's advance at the start of a
                          wrapping Text, which clipped the first line's right
                          edge; an icon-font glyph measures correctly. */}
                      {isBeingRead ? (
                        <Ionicons
                          name="volume-high"
                          size={fontSizes.sm}
                          color={effectiveColors.audioHighlight}
                        />
                      ) : null}
                      {isBeingRead ? '  ' : ''}
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
                            style={[styles.crossRefLink, {color: linkColor}]}>
                            {seg.text}
                          </Text>
                        ) : (
                          seg.text
                        ),
                      );
                    })()}
                  </Text>
                  {/* Side-by-side companion: the matching verse from the other
                      version. In STACKED layout it sits below the primary one,
                      smaller/dimmer, as supporting context. In COLUMNS layout
                      it sits in an equal-weight column at the SAME font size, so
                      neither reads as secondary (Sprint 67). The tap on this
                      region is harmless — selection still targets the primary
                      verse via the outer Touchable. */}
                  {sideBySide && secondaryVersion
                    ? (() => {
                        const companion = secondaryVerses.find(
                          v => v.verse === verse.verse,
                        );
                        if (!companion) return null;
                        if (dualColumns) {
                          return (
                            <View
                              style={[
                                styles.dualColumn,
                                styles.dualColumnCompanion,
                                {borderLeftColor: effectiveColors.border},
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
                                  styles.verseText,
                                  textStyle,
                                  {
                                    color: userHighlight
                                      ? effectiveColors.onHighlight
                                      : effectiveColors.text,
                                  },
                                ]}>
                                {companion.text}
                              </Text>
                            </View>
                          );
                        }
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
                                    ? effectiveColors.onHighlight
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
                backgroundColor: readerIsDark
                  ? staticColors.navySurface98
                  : staticColors.glassWhite98,
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
              <View style={styles.selectionHeaderActions}>
                <TouchableOpacity
                  onPress={() => {
                    setShowOverflow(v => !v);
                    setShowHighlightPicker(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t.verse.moreActions}
                  hitSlop={8}>
                  <Ionicons
                    name={showOverflow ? 'chevron-back' : 'ellipsis-horizontal'}
                    size={22}
                    color={
                      showOverflow
                        ? effectiveColors.primary
                        : effectiveColors.textSecondary
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={clearSelection}
                  accessibilityRole="button"
                  accessibilityLabel={t.verse.clearSelection}
                  hitSlop={8}>
                  <Ionicons
                    name="close"
                    size={22}
                    color={effectiveColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
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
                  accessibilityRole="button"
                  onPress={handleCopySelected}>
                  <Ionicons
                    name="copy-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.copy}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  accessibilityRole="button"
                  onPress={handleShareSelected}>
                  <Ionicons
                    name="share-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.share}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  accessibilityRole="button"
                  onPress={handleNoteSelected}>
                  <Ionicons
                    name="create-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.notes.note}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  accessibilityRole="button"
                  onPress={handleFavoriteSelected}>
                  <Ionicons
                    name="heart-outline"
                    size={20}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.verse.addFavorite}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  accessibilityRole="button"
                  onPress={handleBookmarkSelected}>
                  <Ionicons
                    name="bookmark-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.bookmarks.short}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  accessibilityRole="button"
                  onPress={() => setShowHighlightPicker(true)}>
                  <Ionicons
                    name="color-palette-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.verse.highlight}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  accessibilityRole="button"
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
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.verse.compare}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionButton}
                  accessibilityRole="button"
                  onPress={() => setImageModalVisible(true)}>
                  <Ionicons
                    name="image-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.selectionButtonText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.verse.image}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            {showOverflow && (
              <View style={styles.selectionOverflow}>
                <TouchableOpacity
                  style={styles.selectionOverflowButton}
                  onPress={() => {
                    const sortedNums = Array.from(selectedVerses).sort(
                      (a, b) => a - b,
                    );
                    setCrossRefsVerse(sortedNums[0] ?? null);
                    setCrossRefsVisible(true);
                    setShowOverflow(false);
                  }}>
                  <Ionicons
                    name="git-network-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    style={[
                      styles.selectionOverflowText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.crossRefs.buttonLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.selectionOverflowButton}
                  accessibilityRole="button"
                  accessibilityLabel={t.collections.addAction}
                  onPress={handleAddToCollectionSelected}>
                  <Ionicons
                    name="albums-outline"
                    size={22}
                    color={effectiveColors.primary}
                  />
                  <Text
                    style={[
                      styles.selectionOverflowText,
                      {color: effectiveColors.text},
                    ]}>
                    {t.collections.addAction}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Image Creator Modal — extracted to ImageShareModal in Sprint 28. */}
        <ImageShareModal
          visible={imageModalVisible}
          verseText={selectedVerses.size > 0 ? getImageVersesText() : ''}
          verseReference={getSelectedReference()}
          versionAbbr={selectedVersion.abbreviation}
          verseCount={selectedVerses.size}
          hasSelection={selectedVerses.size > 0}
          cardSize={windowWidth - spacing.xl * 2}
          onClose={() => setImageModalVisible(false)}
        />

        {/* Curated parallel passages for the first selected verse. */}
        <CrossReferencesSheet
          visible={crossRefsVisible}
          sourceBook={localizedBookName}
          sourceChapter={chapterNum}
          sourceVerse={crossRefsVerse}
          version={selectedVersion.id}
          onClose={() => setCrossRefsVisible(false)}
        />

        {/* Add the first selected verse to a collection (Sprint 68). */}
        <AddToCollectionSheet
          favoriteId={collectionFavoriteId}
          onClose={() => setCollectionVerseId(null)}
        />

        {/* Note Modal — extracted to NoteEditorModal in Sprint 21 #13. */}
        <NoteEditorModal
          visible={noteModalVisible}
          verseReference={
            selectedVerseForNote
              ? `${
                  localizedBookName || selectedVerseForNote.book
                } ${selectedVerseForNote.chapter}:${selectedVerseForNote.verse}`
              : ''
          }
          verseText={selectedVerseForNote?.text ?? ''}
          value={noteText}
          onChangeText={setNoteText}
          onSave={saveNote}
          onClose={() => setNoteModalVisible(false)}
        />

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

        {/* Reader Preferences Sheet — Sprint 31 typography + layout knobs. */}
        <ReaderPreferencesSheet
          visible={readerPrefsVisible}
          onClose={() => setReaderPrefsVisible(false)}
        />

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
    backgroundColor: staticColors.transparent,
  },
  verseSelected: {
    backgroundColor: staticColors.brandBlueTint15,
  },
  verseHighlighted: {
    backgroundColor: staticColors.brandBlueTint10,
    borderLeftWidth: 3,
    borderLeftColor: staticColors.brandBlue,
  },
  verseBeingRead: {
    backgroundColor: staticColors.goldTint08,
  },
  verseUserHighlightRadius: {
    borderRadius: 10,
  },
  crossRefLink: {
    textDecorationLine: 'underline',
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
    borderTopColor: staticColors.transparent,
    borderLeftColor: staticColors.transparent,
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
  secondaryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  secondaryPickerLabel: {
    fontSize: fontSizes.xs,
    marginRight: spacing['0.5'],
  },
  secondaryChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  secondaryChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  // Sprint 67 — dual-mode control chips (swap + layout toggle) + the
  // equal-weight column layout.
  dualControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: spacing.xs,
  },
  dualControlChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseContentColumns: {
    flexDirection: 'row',
    gap: spacing.base,
  },
  dualColumn: {
    flex: 1,
  },
  dualColumnCompanion: {
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
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
    shadowColor: staticColors.black,
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
    // 4×2 grid so the longer Spanish labels ("Compartir", "Marcadores",
    // "Favoritos", "Resaltar", "Comparar") render in full. At the previous
    // 8-in-one-row layout every label except "Nota" was visibly truncated
    // with an ellipsis (~136px per cell vs ~148px needed for "Compartir"
    // at 10pt). With 4 per row each cell gets ~4× the space.
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectionButton: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  selectionHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  selectionOverflow: {
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  selectionOverflowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  selectionOverflowText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  selectionButtonText: {
    fontSize: fontSizes.xs,
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
    backgroundColor: staticColors.transparent,
    borderWidth: 1.5,
  },
});
