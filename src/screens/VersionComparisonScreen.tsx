/**
 * 📚 VERSION COMPARISON SCREEN
 *
 * Pantalla para comparar múltiples versiones de la Biblia lado a lado
 * Permite análisis profundo con visualización de diferencias
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useState, useEffect, useRef} from 'react';
import {useRouter} from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {staticColors, verseTextRightSlack} from '@/styles/designTokens';
import {centeredMaxWidth} from '@/styles/responsive';
import {Ionicons} from '@expo/vector-icons';
import {SaveComparisonDialog} from '../components/comparison/SaveComparisonDialog';
import {CompareImageModal} from '../components/comparison/CompareImageModal';
import {ConfirmDialog} from '../components/ui/ConfirmDialog';
import {
  buildComparisonCard,
  buildComparisonCards,
  type ComparisonCardModel,
} from '../lib/comparison/comparisonCard';
import {useTheme} from '../hooks/useTheme';
import {useLanguage} from '../hooks/useLanguage';
import {focusTrapProps} from '@lib/a11y/focusTrap';
import {useToast} from '../context/ToastContext';
import {haptics} from '@lib/haptics';
import {useAudioPlayer} from '../features/audio';
import {getBookByName} from '../constants/bible';
import bibleDB from '../lib/database';
import {
  versionComparisonService,
  BibleVersion,
  VerseComparison,
  ComparisonAnalysis,
} from '../lib/comparison/VersionComparison';
import {
  markDivergentWords,
  sameLanguage,
  commonWordsForVersions,
} from '../lib/comparison/wordContrast';
import {
  gridScrollOffsetForChapter,
  wrappedGridPerRow,
} from '../lib/reading/chapterProgress';

// Verse-picker grid metrics — mirror styles.verseGridItem / verseGridContent
// so the auto-scroll row math matches the rendered layout (Sprint 75).
const VERSE_GRID_ITEM = 46;
const VERSE_GRID_GAP = 12;
const VERSE_GRID_PADDING = 16;
const VERSE_GRID_ROW = VERSE_GRID_ITEM + VERSE_GRID_GAP;

interface VersionComparisonScreenProps {
  book: string;
  chapter: number;
  initialVerse?: number;
  userId: string;
}

export const VersionComparisonScreen: React.FC<
  VersionComparisonScreenProps
> = ({book, chapter, initialVerse = 1, userId}) => {
  const router = useRouter();
  const {colors} = useTheme();
  const {t, language} = useLanguage();
  const toast = useToast();
  const {setSuppressed} = useAudioPlayer();

  // State
  const [availableVersions, setAvailableVersions] = useState<BibleVersion[]>(
    [],
  );
  const [selectedVersions, setSelectedVersions] = useState<string[]>([
    'rvr1960',
  ]);
  const [currentVerse, setCurrentVerse] = useState(initialVerse);
  const [selectedVerses, setSelectedVerses] = useState<number[]>([
    initialVerse,
  ]); // Múltiples versículos
  const [comparison, setComparison] = useState<VerseComparison | null>(null);
  const [comparisons, setComparisons] = useState<VerseComparison[]>([]); // Para múltiples versículos
  const [analysis, setAnalysis] = useState<ComparisonAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showSavedComparisons, setShowSavedComparisons] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  // Share-as-image (Sprint 69): the built card model(s) + the modal visibility.
  // Sprint 70: an ARRAY — one card per selected verse (single-verse mode keeps a
  // 1-element array, rendered without carousel chrome). Open ⇔ length > 0.
  const [shareCards, setShareCards] = useState<ComparisonCardModel[]>([]);

  // Suppress the floating mini player while ANY of this screen's overlay
  // sheets is open — the player's elevation/zIndex otherwise draws over the
  // sheet's bottom row. Audio keeps playing; only the UI is hidden.
  useEffect(() => {
    const anyOpen =
      showVersionPicker ||
      showSaveDialog ||
      showSavedComparisons ||
      showVersePicker ||
      shareCards.length > 0;
    setSuppressed(anyOpen);
    return () => setSuppressed(false);
  }, [
    showVersionPicker,
    showSaveDialog,
    showSavedComparisons,
    showVersePicker,
    shareCards,
    setSuppressed,
  ]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  // Verse-picker auto-scroll (Sprint 75): jump the grid to the active verse's
  // row once per open — a 150-verse psalm no longer starts at verse 1 when
  // you're comparing verse 119. Width lives in a ref (onLayout fires before
  // onContentSizeChange, where the one-shot scroll runs).
  const verseGridScrollRef = useRef<ScrollView>(null);
  const verseGridWidthRef = useRef(0);
  const versePickerScrolledRef = useRef(false);
  useEffect(() => {
    if (!showVersePicker) versePickerScrolledRef.current = false;
  }, [showVersePicker]);

  interface SavedComparison {
    id: string;
    name: string;
    book: string;
    chapter: number;
    versesRange: string;
    versionIds: string[];
    notes: string;
    createdAt: string;
    created_at?: string; // Por compatibilidad
    version_ids?: string; // Por compatibilidad
    verses_range?: string; // Por compatibilidad
  }

  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>(
    [],
  );
  // Real verse count of the compared chapter (Sprint 76). Starts on a safe
  // default until the COUNT query lands — it used to be PINNED there, which
  // truncated the picker grid on long chapters (Psalms 119 has 176) and let
  // the next-verse arrow walk past the chapter's end.
  const [totalVerses, setTotalVerses] = useState(31);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [deleteComparisonId, setDeleteComparisonId] = useState<string | null>(
    null,
  );
  const [editingComparisonId, setEditingComparisonId] = useState<string | null>(
    null,
  );
  // Word-level translation contrast (Sprint 68): inline-highlight the words that
  // differ between the compared versions (the `analysis.commonWords` complement).
  const [showContrast, setShowContrast] = useState(false);

  // Are all the compared versions in one language? Word contrast is meaningful
  // for same-language pairs (KJV ↔ WEB) and noise across languages (KJV vs
  // RVR1960, where nearly every word differs) — so we default it accordingly.
  const comparisonLanguages = selectedVersions
    .map(id => availableVersions.find(v => v.id === id)?.language ?? '')
    .filter(Boolean);
  const isSameLanguage = sameLanguage(comparisonLanguages);

  useEffect(() => {
    loadVersions();
  }, []);

  // Load the real verse count for the compared chapter (cheap COUNT against
  // the primary selected version — verse numbering matches across versions).
  // Also clamps a deep-linked verse that points past the chapter's end.
  useEffect(() => {
    const info = getBookByName(book);
    const version = selectedVersions[0];
    if (!info || !version) return;
    let cancelled = false;
    (async () => {
      try {
        await bibleDB.initialize();
        const count = await bibleDB.getChapterVerseCount(
          info.id,
          chapter,
          version,
        );
        if (cancelled || count <= 0) return;
        setTotalVerses(count);
        setCurrentVerse(prev => Math.min(prev, count));
        setSelectedVerses(prev =>
          prev.some(v => v > count)
            ? [...new Set(prev.map(v => Math.min(v, count)))]
            : prev,
        );
      } catch (error) {
        console.error('Error loading chapter verse count:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [book, chapter, selectedVersions]);

  // Default contrast on for same-language comparisons, off for cross-language
  // ones. Keyed on the language composition so it never fights a manual toggle
  // made within the same set of versions.
  useEffect(() => {
    setShowContrast(isSameLanguage);
  }, [isSameLanguage]);

  // Render a version's verse, inline-highlighting the divergent words (those
  // not in `commonWords`) when the contrast toggle is on. Works for BOTH modes:
  // single-verse passes `analysis.commonWords`; multi-verse passes the set
  // computed per comparison (Sprint 69). Returns a plain string when contrast
  // is off or no common set is available, so nothing changes for the default
  // view.
  const renderVerseBody = (
    text: string,
    commonWords?: Set<string>,
  ): React.ReactNode => {
    if (!showContrast || !commonWords) return text;
    return markDivergentWords(text, commonWords).map((tok, i) =>
      tok.divergent ? (
        <Text
          key={i}
          style={[
            styles.divergentWord,
            {color: colors.accent, backgroundColor: colors.accent + '22'},
          ]}>
          {tok.text}
        </Text>
      ) : (
        tok.text
      ),
    );
  };

  // When a SELECTED version has no row for this verse it simply drops out of the
  // comparison — which looks like a glitch. This happens for the ~16 verses the
  // critical text omits (Matt 17:21, Mark 7:16, John 5:4, Acts 8:37 …): a
  // version like BSB keeps the numbering but leaves them blank. Render a clear,
  // pastoral note for each omitting version so a blank is never mistaken for a
  // missing download — and so the reader learns it's a textual-variant choice.
  const renderOmittedNotes = (comp: VerseComparison): React.ReactNode => {
    const present = new Set(comp.versions.map(v => v.versionId.toLowerCase()));
    const omitted = selectedVersions.filter(
      id => !present.has(id.toLowerCase()),
    );
    if (omitted.length === 0) return null;
    return omitted.map(id => {
      const meta = availableVersions.find(
        v => v.id.toLowerCase() === id.toLowerCase(),
      );
      const abbr = meta?.abbreviation ?? id.toUpperCase();
      return (
        <View
          key={`omit-${comp.verseNumber}-${id}`}
          style={[
            styles.omittedCard,
            {backgroundColor: colors.surface, borderColor: colors.border},
          ]}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.textTertiary}
          />
          <Text style={[styles.omittedText, {color: colors.textSecondary}]}>
            {t.versionComparison.verseOmitted.replace('{{version}}', abbr)}
          </Text>
        </View>
      );
    });
  };

  // Inline word-contrast toggle row (Sprint 68/69). Shown in both single- and
  // multi-verse mode whenever ≥2 versions are compared. The same-language
  // default + hint policy is identical across modes.
  const renderContrastToggle = () => (
    <View style={styles.contrastRow}>
      <TouchableOpacity
        style={[
          styles.contrastToggle,
          {
            borderColor: showContrast ? colors.accent : colors.border,
            backgroundColor: showContrast
              ? colors.accent + '15'
              : staticColors.transparent,
          },
        ]}
        onPress={() => setShowContrast(v => !v)}
        accessibilityRole="switch"
        accessibilityState={{checked: showContrast}}
        accessibilityLabel={t.versionComparison.highlightDifferences}>
        <Ionicons
          name={showContrast ? 'checkbox' : 'square-outline'}
          size={20}
          color={showContrast ? colors.accent : colors.textSecondary}
        />
        <Text
          style={[
            styles.contrastLabel,
            {color: showContrast ? colors.accent : colors.text},
          ]}>
          {t.versionComparison.highlightDifferences}
        </Text>
      </TouchableOpacity>
      {!isSameLanguage && (
        <Text
          style={[styles.contrastHint, {color: colors.textTertiary}]}
          numberOfLines={2}>
          {t.versionComparison.contrastSameLangHint}
        </Text>
      )}
    </View>
  );

  // Build the shareable comparison card(s) and open the image modal. Needs ≥2
  // versions per verse for a meaningful card. The divergent-word highlighting is
  // baked into each card per the same-language policy. (Sprint 69 → 70)
  //
  // Single-verse mode → one card (reusing the live `analysis`). Multi-verse mode
  // → ONE card per selected verse (Sprint 70), computing each verse's similarity
  // on demand (analysis is only kept for single mode); the modal shows them as a
  // swipeable carousel and shares whichever card the user is viewing.
  const handleShareImage = () => {
    if (multiSelectMode) {
      const valid = comparisons.filter(c => c.versions.length >= 2);
      if (valid.length === 0) {
        toast.warning(t.versionComparison.minVersionsError);
        return;
      }
      haptics.tap();
      setShareCards(
        buildComparisonCards(
          valid.map(comp => ({
            reference: `${localizedBook} ${chapter}:${comp.verseNumber}`,
            similarity: versionComparisonService.analyzeComparison(comp, t)
              .similarity,
            highlight: isSameLanguage,
            versions: comp.versions.map(v => ({
              abbr: v.versionAbbr,
              text: v.text,
            })),
          })),
        ),
      );
      return;
    }

    const comp = comparison;
    if (!comp || comp.versions.length < 2) {
      toast.warning(t.versionComparison.minVersionsError);
      return;
    }
    haptics.tap();
    setShareCards([
      buildComparisonCard(
        `${localizedBook} ${chapter}:${comp.verseNumber}`,
        analysis?.similarity ?? 0,
        isSameLanguage,
        comp.versions.map(v => ({abbr: v.versionAbbr, text: v.text})),
      ),
    ]);
  };

  // book/chapter are in the deps defensively: the route wrapper re-keys this
  // screen per target, but a reload on prop change keeps the comparison
  // coherent even if that key is ever removed.
  useEffect(() => {
    if (selectedVersions.length > 0) {
      loadComparison();
    }
  }, [
    book,
    chapter,
    currentVerse,
    selectedVersions,
    selectedVerses,
    multiSelectMode,
  ]);

  const loadVersions = async () => {
    try {
      const versions =
        await versionComparisonService.getAvailableVersions('es');
      setAvailableVersions(versions);
    } catch (error) {
      console.error('Error loading versions:', error);
    }
  };

  const loadComparison = async () => {
    try {
      setLoading(true);

      if (multiSelectMode && selectedVerses.length > 0) {
        // Cargar comparaciones para múltiples versículos
        const comps = await Promise.all(
          selectedVerses.map(verseNum =>
            versionComparisonService.compareVerse(
              book,
              chapter,
              verseNum,
              selectedVersions,
            ),
          ),
        );
        setComparisons(comps);
      } else {
        // Modo single verse
        const comp = await versionComparisonService.compareVerse(
          book,
          chapter,
          currentVerse,
          selectedVersions,
        );
        setComparison(comp);

        if (comp.versions.length >= 2) {
          const analysisResult = versionComparisonService.analyzeComparison(
            comp,
            t,
          );
          setAnalysis(analysisResult);
        }
      }
    } catch (err) {
      console.error('Error loading comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVersion = (versionId: string) => {
    if (selectedVersions.includes(versionId)) {
      if (selectedVersions.length > 1) {
        setSelectedVersions(selectedVersions.filter(id => id !== versionId));
      }
    } else {
      if (selectedVersions.length < 4) {
        setSelectedVersions([...selectedVersions, versionId]);
      } else {
        toast.warning(t.versionComparison.maxVersionsWarning);
      }
    }
  };

  const loadSavedComparisons = async () => {
    try {
      const comparisons =
        await versionComparisonService.getSavedComparisons(userId);
      setSavedComparisons(comparisons);
    } catch (error) {
      console.error('Error loading saved comparisons:', error);
      toast.error(t.versionComparison.loadComparisonsError);
    }
  };

  const handleSaveComparison = async (name: string, notes: string) => {
    if (!name.trim()) {
      toast.warning(t.versionComparison.nameRequired);
      return;
    }

    try {
      if (editingComparisonId) {
        // Actualizar existente
        await versionComparisonService.updateComparison(
          editingComparisonId,
          name,
          notes,
        );
        toast.success(t.versionComparison.updateSuccess);
      } else {
        // Crear nueva
        const versesRange =
          multiSelectMode && selectedVerses.length > 0
            ? selectedVerses.sort((a, b) => a - b).join(',')
            : `${currentVerse}`;

        await versionComparisonService.saveComparison(
          userId,
          name,
          book,
          chapter,
          versesRange,
          selectedVersions,
          notes,
        );
        toast.success(t.versionComparison.saveSuccess);
      }

      closeSaveDialog();
      loadSavedComparisons();
    } catch {
      toast.error(t.versionComparison.saveError);
    }
  };

  const handleEditComparison = (comp: SavedComparison) => {
    setEditingComparisonId(comp.id);
    // Estos se pasarán como props iniciales al diálogo
    setShowSaveDialog(true);
    setShowSavedComparisons(false);
  };

  const closeSaveDialog = () => {
    setShowSaveDialog(false);
    setEditingComparisonId(null);
  };

  const handleLoadComparison = (comp: SavedComparison) => {
    try {
      if (!comp) {
        throw new Error(t.versionComparison.invalidData);
      }

      // El servicio mapea los campos a camelCase
      const versionIds = (comp.versionIds || comp.version_ids) as
        | string
        | string[];
      const versesRangeRaw = comp.versesRange || comp.verses_range || '';

      if (
        !versionIds ||
        (Array.isArray(versionIds) && versionIds.length === 0)
      ) {
        throw new Error(t.versionComparison.noVersionsSelected);
      }

      let finalVersionIds: string[] = [];
      if (typeof versionIds === 'string') {
        if (versionIds.startsWith('[')) {
          finalVersionIds = JSON.parse(versionIds);
        } else {
          finalVersionIds = versionIds.split(',').filter(Boolean);
        }
      } else if (Array.isArray(versionIds)) {
        finalVersionIds = versionIds;
      }

      if (finalVersionIds.length === 0) {
        throw new Error(t.versionComparison.noValidVersions);
      }

      setSelectedVersions(finalVersionIds);

      const rangeStr = String(versesRangeRaw);
      if (rangeStr.includes(',')) {
        const verseNums = rangeStr
          .split(',')
          .map((v: string) => parseInt(v.trim()))
          .filter(v => !isNaN(v));

        if (verseNums.length > 0) {
          setSelectedVerses(verseNums);
          setMultiSelectMode(true);
        } else {
          const firstVerse = parseInt(rangeStr) || 1;
          setCurrentVerse(firstVerse);
          setSelectedVerses([firstVerse]);
          setMultiSelectMode(false);
        }
      } else {
        const verseNum = parseInt(rangeStr) || 1;
        setCurrentVerse(verseNum);
        setSelectedVerses([verseNum]);
        setMultiSelectMode(false);
      }

      setShowSavedComparisons(false);
      toast.info(
        t.versionComparison.loadedComparison.replace(
          '{{name}}',
          comp.name || t.versionComparison.untitledComparison,
        ),
      );
    } catch (error: any) {
      console.error('Error loading comparison:', error);
      toast.error(error.message || t.versionComparison.loadError);
      setShowSavedComparisons(false);
    }
  };

  const handleDeleteComparison = (comparisonId: string) => {
    setDeleteComparisonId(comparisonId);
  };

  const confirmDeleteComparison = async () => {
    const comparisonId = deleteComparisonId;
    if (!comparisonId) return;
    setDeleteComparisonId(null);
    try {
      await versionComparisonService.deleteComparison(comparisonId);
      await loadSavedComparisons();
      toast.success(t.versionComparison.deleteSuccess);
    } catch {
      toast.error(t.versionComparison.deleteError);
    }
  };

  const getVersionColor = (index: number) => {
    const versionColors = [
      colors.primary,
      '#10B981', // Green
      '#F59E0B', // Orange
      '#8B5CF6', // Purple
    ];
    return versionColors[index % versionColors.length];
  };

  // Localize the book name in the reference so it matches the app language.
  const bookInfo = getBookByName(book);
  const localizedBook = bookInfo
    ? language === 'en'
      ? bookInfo.nameEn
      : bookInfo.name
    : book;

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.title, {color: colors.text}]} numberOfLines={1}>
            {t.versionComparison.title}
          </Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.iconActionButton}
              onPress={() =>
                setViewMode(viewMode === 'list' ? 'grid' : 'list')
              }>
              <Ionicons
                name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconActionButton}
              onPress={() => {
                loadSavedComparisons();
                setShowSavedComparisons(true);
              }}>
              <Ionicons
                name="bookmarks-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconActionButton}
              onPress={handleShareImage}
              accessibilityRole="button"
              accessibilityLabel={t.versionComparison.shareImage}>
              <Ionicons
                name="share-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.saveCircleButton,
                {backgroundColor: colors.primary},
              ]}
              onPress={() => setShowSaveDialog(true)}>
              <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.reference, {color: colors.textSecondary}]}>
          {localizedBook} {chapter}:
          {multiSelectMode && selectedVerses.length > 0
            ? selectedVerses.sort((a, b) => a - b).join(',')
            : currentVerse}
        </Text>

        {/* Version Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.versionPills}
          contentContainerStyle={styles.versionPillsContent}>
          {selectedVersions.map((versionId, index) => {
            const version = availableVersions.find(v => v.id === versionId);
            return (
              <View
                key={versionId}
                style={[
                  styles.versionPill,
                  {
                    backgroundColor: getVersionColor(index),
                    borderColor: getVersionColor(index),
                  },
                ]}>
                <Text style={styles.versionPillText}>
                  {version?.abbreviation || versionId.toUpperCase()}
                </Text>
              </View>
            );
          })}
          <TouchableOpacity
            style={[
              styles.addVersionButton,
              {
                borderColor: colors.primary + '40',
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => setShowVersionPicker(true)}>
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={[styles.addVersionText, {color: colors.primary}]}>
              {t.add}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, centeredMaxWidth()]}>
          {/* Multi-Verse Mode */}
          {multiSelectMode && comparisons.length > 0 ? (
            <>
              {/* Word-contrast toggle (Sprint 69) — now available in multi-verse
                  mode, highlighting per-verse divergent words below. */}
              {(comparisons[0]?.versions.length ?? 0) >= 2 &&
                renderContrastToggle()}
              {comparisons.map((comp, compIndex) => {
                // Words shared by every version of THIS verse (Sprint 69). Each
                // verse gets its own common-word set so the inline highlight is
                // correct per row, mirroring the single-verse `analysis`.
                const commonWords =
                  comp.versions.length >= 2
                    ? commonWordsForVersions(comp.versions.map(v => v.text))
                    : undefined;
                return (
                  <View key={`comparison-${comp.verseNumber}`}>
                    {/* Verse Number Header */}
                    <View
                      style={[
                        styles.multiVerseHeader,
                        {backgroundColor: colors.primaryLight},
                      ]}>
                      <Text
                        style={[styles.multiVerseTitle, {color: colors.text}]}>
                        {t.versionComparison.verse} {comp.verseNumber}
                      </Text>
                    </View>

                    {/* Versions for this verse */}
                    <View
                      style={viewMode === 'grid' ? styles.gridContainer : null}>
                      {comp.versions.map((version, index) => (
                        <View
                          key={`${comp.verseNumber}-${version.versionId}`}
                          style={[
                            viewMode === 'grid'
                              ? styles.gridCard
                              : styles.versionCard,
                            {
                              backgroundColor: colors.surface,
                              borderLeftColor:
                                viewMode === 'list'
                                  ? getVersionColor(index)
                                  : undefined,
                              borderTopColor:
                                viewMode === 'grid'
                                  ? getVersionColor(index)
                                  : undefined,
                            },
                          ]}>
                          <View style={styles.versionHeader}>
                            <View
                              style={[
                                styles.versionBadge,
                                {backgroundColor: getVersionColor(index)},
                              ]}>
                              <Text style={styles.versionBadgeText}>
                                {version.versionAbbr}
                              </Text>
                            </View>
                            {version.versionName !== version.versionAbbr && (
                              <Text
                                style={[
                                  styles.versionName,
                                  {color: colors.textSecondary},
                                ]}
                                numberOfLines={1}>
                                {version.versionName}
                              </Text>
                            )}
                          </View>

                          <Text
                            style={[
                              viewMode === 'grid'
                                ? styles.gridVerseText
                                : styles.verseText,
                              {color: colors.text},
                            ]}
                            numberOfLines={viewMode === 'grid' ? 6 : undefined}>
                            {renderVerseBody(version.text, commonWords)}
                          </Text>

                          {viewMode === 'list' && (
                            <View style={styles.versionMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons
                                  name="text"
                                  size={12}
                                  color={colors.textTertiary}
                                />
                                <Text
                                  style={[
                                    styles.metaText,
                                    {color: colors.textTertiary},
                                  ]}>
                                  {version.wordCount}{' '}
                                  {t.versionComparison.words}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                      ))}
                      {renderOmittedNotes(comp)}
                    </View>

                    {/* Divider between verses */}
                    {compIndex < comparisons.length - 1 && (
                      <View
                        style={[
                          styles.verseDivider,
                          {backgroundColor: colors.border},
                        ]}
                      />
                    )}
                  </View>
                );
              })}
            </>
          ) : (
            <>
              {/* Single Verse Mode - Versions Comparison */}
              <View style={viewMode === 'grid' ? styles.gridContainer : null}>
                {comparison?.versions.map((version, index) => (
                  <View
                    key={version.versionId}
                    style={[
                      viewMode === 'grid'
                        ? styles.gridCard
                        : styles.versionCard,
                      {
                        backgroundColor: colors.surface,
                        borderLeftColor:
                          viewMode === 'list'
                            ? getVersionColor(index)
                            : undefined,
                        borderTopColor:
                          viewMode === 'grid'
                            ? getVersionColor(index)
                            : undefined,
                      },
                    ]}>
                    <View style={styles.versionHeader}>
                      <View
                        style={[
                          styles.versionBadge,
                          {backgroundColor: getVersionColor(index)},
                        ]}>
                        <Text style={styles.versionBadgeText}>
                          {version.versionAbbr}
                        </Text>
                      </View>
                      {version.versionName !== version.versionAbbr && (
                        <Text
                          style={[
                            styles.versionName,
                            {color: colors.textSecondary},
                          ]}
                          numberOfLines={1}>
                          {version.versionName}
                        </Text>
                      )}
                    </View>

                    <Text
                      style={[
                        viewMode === 'grid'
                          ? styles.gridVerseText
                          : styles.verseText,
                        {color: colors.text},
                      ]}
                      numberOfLines={viewMode === 'grid' ? 6 : undefined}>
                      {renderVerseBody(version.text, analysis?.commonWords)}
                    </Text>

                    {viewMode === 'list' && (
                      <View style={styles.versionMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons
                            name="text"
                            size={12}
                            color={colors.textTertiary}
                          />
                          <Text
                            style={[
                              styles.metaText,
                              {color: colors.textTertiary},
                            ]}>
                            {version.wordCount} {t.versionComparison.words}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ))}
                {comparison && renderOmittedNotes(comparison)}
              </View>

              {/* Word-contrast toggle (Sprint 68/69) — highlights the words that
                  differ across the versions above. */}
              {analysis && renderContrastToggle()}

              {/* Analysis Section */}
              {analysis && (
                <View
                  style={[
                    styles.analysisCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}>
                  <View style={styles.analysisHeader}>
                    <Ionicons
                      name="analytics"
                      size={20}
                      color={colors.accent}
                    />
                    <Text style={[styles.analysisTitle, {color: colors.text}]}>
                      {t.versionComparison.analysis}
                    </Text>
                  </View>

                  {/* Similarity Score */}
                  <View style={styles.similaritySection}>
                    <Text
                      style={[
                        styles.similarityLabel,
                        {color: colors.textSecondary},
                      ]}>
                      {t.versionComparison.similarity}
                    </Text>
                    <View style={styles.similarityBar}>
                      <View
                        style={[
                          styles.similarityFill,
                          {
                            width: `${analysis.similarity}%`,
                            backgroundColor:
                              analysis.similarity >= 80
                                ? staticColors.emerald
                                : analysis.similarity >= 60
                                  ? colors.warning
                                  : colors.error,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.similarityValue, {color: colors.text}]}>
                      {analysis.similarity}%
                    </Text>
                  </View>

                  {/* Word Stats */}
                  <View style={styles.wordStats}>
                    <View style={styles.statCard}>
                      <Text style={[styles.statValue, {color: colors.accent}]}>
                        {analysis.commonWords.size}
                      </Text>
                      <Text
                        style={[
                          styles.statLabel,
                          {color: colors.textSecondary},
                        ]}>
                        {t.versionComparison.commonWords}
                      </Text>
                    </View>
                    <View style={styles.statCard}>
                      <Text style={[styles.statValue, {color: colors.warning}]}>
                        {analysis.uniqueWords.size}
                      </Text>
                      <Text
                        style={[
                          styles.statLabel,
                          {color: colors.textSecondary},
                        ]}>
                        {t.versionComparison.uniqueWords}
                      </Text>
                    </View>
                  </View>

                  {/* Insights */}
                  {analysis.insights.length > 0 && (
                    <View style={styles.insightsSection}>
                      <Text
                        style={[styles.insightsTitle, {color: colors.text}]}>
                        {t.versionComparison.observations}
                      </Text>
                      {analysis.insights.map((insight, index) => (
                        <View key={index} style={styles.insightItem}>
                          <Ionicons
                            name="bulb"
                            size={14}
                            color={colors.warning}
                          />
                          <Text
                            style={[
                              styles.insightText,
                              {color: colors.textSecondary},
                            ]}>
                            {insight}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Verse Navigation */}
      <View
        style={[
          styles.navigationBar,
          {backgroundColor: colors.surface, borderTopColor: colors.border},
        ]}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentVerse <= 1 && styles.navButtonDisabled,
          ]}
          onPress={() => setCurrentVerse(prev => Math.max(1, prev - 1))}
          disabled={currentVerse <= 1}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentVerse <= 1 ? colors.textTertiary : colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.verseNumberButton}
          onPress={() => setShowVersePicker(true)}>
          <Text style={[styles.verseNumber, {color: colors.text}]}>
            {t.versionComparison.verse} {currentVerse}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            currentVerse >= totalVerses && styles.navButtonDisabled,
          ]}
          onPress={() =>
            setCurrentVerse(prev => Math.min(totalVerses, prev + 1))
          }
          disabled={currentVerse >= totalVerses}>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={
              currentVerse >= totalVerses ? colors.textTertiary : colors.primary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Version Picker Modal */}
      <Modal
        visible={showVersionPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVersionPicker(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: colors.surface, borderTopColor: colors.border},
            ]}
            {...focusTrapProps()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {t.versionComparison.selectVersions}
              </Text>
              <TouchableOpacity onPress={() => setShowVersionPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.versionList}>
              {availableVersions.map(version => {
                const isSelected = selectedVersions.includes(version.id);
                return (
                  <TouchableOpacity
                    key={version.id}
                    style={[
                      styles.versionListItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primary + '10'
                          : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border + '40',
                      },
                    ]}
                    onPress={() => toggleVersion(version.id)}>
                    <View style={styles.versionInfo}>
                      <Text
                        style={[
                          styles.versionListName,
                          {color: isSelected ? colors.primary : colors.text},
                        ]}>
                        {version.name}
                      </Text>
                      <Text
                        style={[
                          styles.versionListDesc,
                          {color: colors.textSecondary},
                        ]}>
                        {(
                          t.versionComparison.versionDescriptions as Record<
                            string,
                            string
                          >
                        )[version.id] ?? version.description}
                      </Text>
                    </View>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isSelected ? colors.primary : colors.border}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Save Dialog */}
      <SaveComparisonDialog
        visible={showSaveDialog}
        onClose={closeSaveDialog}
        onSave={handleSaveComparison}
        initialName={
          editingComparisonId
            ? savedComparisons.find(c => c.id === editingComparisonId)?.name
            : ''
        }
        initialNotes={
          editingComparisonId
            ? savedComparisons.find(c => c.id === editingComparisonId)?.notes
            : ''
        }
        isEditing={!!editingComparisonId}
      />

      {/* Share-as-image (Sprint 69): a designer card of the active comparison
          with the divergent words highlighted, captured via the view-shot
          pipeline. */}
      <CompareImageModal
        visible={shareCards.length > 0}
        cards={shareCards}
        cardSize={Dimensions.get('window').width - 80}
        onClose={() => setShareCards([])}
      />

      {/* Saved Comparisons Modal */}
      <Modal
        visible={showSavedComparisons}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSavedComparisons(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: colors.surface, borderTopColor: colors.border},
            ]}
            {...focusTrapProps()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {t.versionComparison.savedComparisons}
              </Text>
              <TouchableOpacity onPress={() => setShowSavedComparisons(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.savedList}>
              {savedComparisons.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="bookmark-outline"
                    size={48}
                    color={colors.textTertiary}
                  />
                  <Text
                    style={[styles.emptyText, {color: colors.textSecondary}]}>
                    {t.versionComparison.noComparisons}
                  </Text>
                </View>
              ) : (
                savedComparisons.map(comp => (
                  <TouchableOpacity
                    key={comp.id}
                    style={[
                      styles.savedItem,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => handleLoadComparison(comp)}>
                    <View style={styles.savedItemContent}>
                      <Text style={[styles.savedName, {color: colors.text}]}>
                        {comp.name}
                      </Text>
                      <Text
                        style={[
                          styles.savedReference,
                          {color: colors.textSecondary},
                        ]}>
                        {comp.book} {comp.chapter}:
                        {comp.versesRange || comp.verses_range}
                      </Text>
                      {comp.notes && (
                        <Text
                          style={[
                            styles.savedNotes,
                            {color: colors.textTertiary},
                          ]}
                          numberOfLines={2}>
                          {comp.notes}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.savedDate,
                          {color: colors.textTertiary},
                        ]}>
                        {(() => {
                          try {
                            const dateVal = comp.createdAt || comp.created_at;
                            if (!dateVal) return '';
                            // Manejar formato SQLite YYYY-MM-DD HH:MM:SS
                            const dateStr = String(dateVal).replace(' ', 'T');
                            const date = new Date(dateStr);
                            return isNaN(date.getTime())
                              ? dateVal
                              : date.toLocaleDateString();
                          } catch (e) {
                            return comp.createdAt || comp.created_at || '';
                          }
                        })()}
                      </Text>
                    </View>
                    <View style={styles.savedItemButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          handleEditComparison(comp);
                        }}>
                        <Ionicons
                          name="pencil-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={e => {
                          e.stopPropagation();
                          handleDeleteComparison(comp.id);
                        }}>
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Verse Picker Modal */}
      <Modal
        visible={showVersePicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowVersePicker(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: colors.surface, borderTopColor: colors.border},
            ]}
            {...focusTrapProps()}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.text}]}>
                {t.versionComparison.selectVerse}
                {multiSelectMode ? 's' : ''}
              </Text>
              <TouchableOpacity onPress={() => setShowVersePicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.versePickerHeader}>
              <Text style={[styles.versePickerSubtitle, {color: colors.text}]}>
                {book} {chapter}
              </Text>
              <TouchableOpacity
                style={[
                  styles.multiSelectToggle,
                  {
                    backgroundColor: multiSelectMode
                      ? colors.primary
                      : colors.background,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setMultiSelectMode(!multiSelectMode);
                  if (!multiSelectMode) {
                    setSelectedVerses([currentVerse]);
                  }
                }}>
                <Ionicons
                  name={multiSelectMode ? 'checkmark-done' : 'copy-outline'}
                  size={16}
                  color={multiSelectMode ? colors.onPrimary : colors.text}
                />
                <Text
                  style={[
                    styles.multiSelectText,
                    {color: multiSelectMode ? colors.onPrimary : colors.text},
                  ]}>
                  {multiSelectMode
                    ? t.versionComparison.multiSelectMode
                    : t.versionComparison.simpleMode}
                </Text>
              </TouchableOpacity>
            </View>

            {multiSelectMode && (
              <View
                style={[
                  styles.selectionInfo,
                  {backgroundColor: colors.background},
                ]}>
                <Text style={[styles.selectionText, {color: colors.text}]}>
                  {selectedVerses.length} versículo
                  {selectedVerses.length !== 1 ? 's' : ''} seleccionado
                  {selectedVerses.length !== 1 ? 's' : ''}
                </Text>
                {selectedVerses.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSelectedVerses([])}
                    style={styles.clearButton}>
                    <Text style={[styles.clearText, {color: colors.error}]}>
                      {t.versionComparison.clearSelection}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <ScrollView
              ref={verseGridScrollRef}
              style={styles.verseGrid}
              contentContainerStyle={styles.verseGridContent}
              onLayout={e => {
                verseGridWidthRef.current = e.nativeEvent.layout.width;
              }}
              onContentSizeChange={() => {
                // One non-animated jump per open to the active verse's row —
                // mirrors the S74 chapter-grid auto-scroll (RM-safe initial
                // position, no motion).
                if (versePickerScrolledRef.current) return;
                const width = verseGridWidthRef.current;
                if (width <= 0) return;
                versePickerScrolledRef.current = true;
                const target = multiSelectMode
                  ? (selectedVerses[0] ?? currentVerse)
                  : currentVerse;
                const perRow = wrappedGridPerRow(
                  width,
                  VERSE_GRID_ITEM,
                  VERSE_GRID_GAP,
                  VERSE_GRID_PADDING,
                );
                const offset = gridScrollOffsetForChapter(
                  target,
                  perRow,
                  VERSE_GRID_ROW,
                );
                if (offset > 0) {
                  verseGridScrollRef.current?.scrollTo({
                    y: offset,
                    animated: false,
                  });
                }
              }}>
              {Array.from({length: totalVerses}, (_, i) => i + 1).map(
                verseNum => {
                  const isSelected = multiSelectMode
                    ? selectedVerses.includes(verseNum)
                    : currentVerse === verseNum;

                  return (
                    <TouchableOpacity
                      key={verseNum}
                      style={[
                        styles.verseGridItem,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => {
                        if (multiSelectMode) {
                          setSelectedVerses(prev =>
                            prev.includes(verseNum)
                              ? prev.filter(v => v !== verseNum)
                              : [...prev, verseNum].sort((a, b) => a - b),
                          );
                        } else {
                          setCurrentVerse(verseNum);
                          setSelectedVerses([verseNum]);
                          setShowVersePicker(false);
                        }
                      }}>
                      <Text
                        style={[
                          styles.verseGridText,
                          {
                            color: isSelected ? colors.onPrimary : colors.text,
                          },
                        ]}>
                        {verseNum}
                      </Text>
                      {multiSelectMode && isSelected && (
                        <View style={styles.checkmarkBadge}>
                          <Ionicons
                            name="checkmark"
                            size={12}
                            color={colors.onPrimary}
                          />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                },
              )}
            </ScrollView>

            {multiSelectMode && selectedVerses.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.applyMultiButton,
                  {backgroundColor: colors.primary},
                ]}
                onPress={() => setShowVersePicker(false)}>
                <Text
                  style={[styles.applyMultiText, {color: colors.onPrimary}]}>
                  Comparar {selectedVerses.length} Versículo
                  {selectedVerses.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Themed delete confirm (UX audit, replaces native Alert.alert) */}
      <ConfirmDialog
        visible={!!deleteComparisonId}
        title={t.versionComparison.deleteTitle}
        message={t.versionComparison.deleteConfirm}
        confirmLabel={t.versionComparison.delete}
        cancelLabel={t.versionComparison.cancel}
        onConfirm={() => void confirmDeleteComparison()}
        onCancel={() => setDeleteComparisonId(null)}
        destructive
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
  },
  backButton: {
    marginLeft: -10,
    marginRight: 4,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconActionButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    elevation: 2,
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reference: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  versionPills: {
    marginTop: 8,
  },
  versionPillsContent: {
    gap: 8,
  },
  versionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
  },
  versionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: staticColors.white,
  },
  addVersionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 4,
  },
  addVersionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  versionCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  omittedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  omittedText: {flex: 1, fontSize: 13.5, lineHeight: 19, fontStyle: 'italic'},
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  versionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: staticColors.white,
  },
  versionName: {
    fontSize: 13,
    fontWeight: '600',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
    // Right-edge anti-clip slack (Sprint 94).
    paddingRight: verseTextRightSlack(16),
  },
  divergentWord: {
    fontWeight: '700',
    borderRadius: 4,
  },
  contrastRow: {
    marginBottom: 12,
    gap: 6,
  },
  contrastToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  contrastLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  contrastHint: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingHorizontal: 2,
  },
  versionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  analysisCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  similaritySection: {
    marginBottom: 16,
  },
  similarityLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  similarityBar: {
    height: 8,
    backgroundColor: staticColors.overlayBlack10,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  similarityFill: {
    height: '100%',
    borderRadius: 4,
  },
  similarityValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  wordStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: staticColors.overlayBlack03,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  insightsSection: {
    gap: 8,
  },
  insightsTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  navButton: {
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  verseNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: staticColors.overlayBlack50,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.overlayBlack05,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  versionList: {
    padding: 20,
  },
  versionListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  versionInfo: {
    flex: 1,
  },
  versionListName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  versionListDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  savedList: {
    maxHeight: 500,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  savedItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  savedItemContent: {
    flex: 1,
  },
  savedName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  savedReference: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  savedNotes: {
    fontSize: 12,
    marginBottom: 6,
    lineHeight: 18,
  },
  savedDate: {
    fontSize: 11,
  },
  savedItemButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: staticColors.overlayBlack03,
  },
  verseNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  versePickerSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'left',
  },
  verseGrid: {
    maxHeight: 350,
  },
  verseGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'center',
    gap: 12,
  },
  verseGridItem: {
    width: 46,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  verseGridText: {
    fontSize: 18,
    fontWeight: '700',
  },
  versePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.overlayBlack05,
  },
  multiSelectToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  multiSelectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: staticColors.overlayBlack05,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyMultiButton: {
    marginHorizontal: 20,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyMultiText: {
    fontSize: 16,
    fontWeight: '700',
  },
  multiVerseHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  multiVerseTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  verseDivider: {
    height: 2,
    marginVertical: 20,
  },
  // Split View Styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderTopWidth: 4,
    minHeight: 180,
  },
  gridVerseText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
