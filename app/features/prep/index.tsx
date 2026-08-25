/**
 * 📋 MESA DE PREPARACIÓN — teaching / sermon prep table (Sprint 103)
 *
 * A local "study desk" for ANY believer who wants to study and share the Word
 * (a dedicated, deeper pastors-and-teachers toolkit is planned separately).
 * Give it a passage and it gathers everything the app already curates for it —
 * the parallel cross-
 * references, the topical themes, the "Cristo en este pasaje" note, the "Sobre
 * este libro" intro — and lays out the widely-held evangelical study scaffold
 * (Context → Observation → Interpretation → Big Idea → Christ → Application →
 * Questions) for the preparer to fill in their OWN prayerful words, autosaved
 * per passage to this device.
 *
 * 100% offline & deterministic — NO AI, NO backend. The pure assembly is
 * src/features/study/prepTable.ts; the preparer's prose is persisted by
 * prepNotesStore.ts; verse text comes from the SQLite Bible DB. The app never
 * writes the sermon — it only assembles the helps and holds the frame, so the
 * work stays the preparer's own before the Lord (2 Timoteo 2:15).
 *
 * Reached via the deep link
 *   eternalbible://features/prep?book=John&chapter=3&startVerse=16&endVerse=21
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Share,
  LayoutAnimation,
} from 'react-native';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import {useDebouncedCallback} from 'use-debounce';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {useToast} from '@context/ToastContext';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {ExpandableVerseText} from '@components/ui/ExpandableVerseText';
import {OfferingBadge} from '@components/ui/OfferingBadge';
import {MarkdownFormatToolbar} from '@components/ui/MarkdownFormatToolbar';
import {ContextualHintBanner} from '@components/hints/ContextualHintBanner';
import {useContextualHint} from '@hooks/useContextualHint';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {getBookIntro} from '@/constants/book-intros';
import {getTheme, parseThemeRef} from '@/features/study/themes';
import {
  suggestPassagesForTopic,
  type TopicPassageSuggestion,
} from '@/features/study/prepTopicSuggest';
import {
  christLangForVersion,
  formatChristRefLabel,
  parseChristRef,
  versionAbbrev,
} from '@/features/study/christConnections';
import {
  buildPrepTable,
  formatPassageLabel,
  getPrepTemplateSections,
  interpretationSlotFor,
  DEFAULT_PREP_TEMPLATE,
  PREP_MAX_CROSS_REFS,
  PREP_MAX_CROSS_REFS_PREMIUM,
  PREP_TEMPLATE_IDS,
  type PrepSection,
  type PrepTable,
  type PrepTemplateId,
} from '@/features/study/prepTable';
import {isPrepNotesEmpty} from '@/features/study/prepNotes';
import {getPrepNotes, savePrepNote} from '@/features/study/prepNotesStore';
import {
  PREP_SELF_REVIEW_CATEGORIES,
  PREP_SELF_REVIEW_QUESTION_IDS,
  emptyPrepSelfReview,
  setQuestionChecked,
  type PrepSelfReview,
  type PrepSelfReviewQuestionId,
} from '@/features/study/prepSelfReview';
import {
  getPrepSelfReview,
  setPrepSelfReviewQuestion,
} from '@/features/study/prepSelfReviewStore';
import {
  groupOriginalWordsByStrongs,
  type PrepOriginalVerseWords,
} from '@/features/study/prepOriginalWords';
import {
  getVerseOriginal,
  isOriginalsInstalled,
  pickGloss,
  glossLanguage,
  strongsLabel,
} from '@/features/study/originals';
import {
  decodeMorphologyCode,
  describeMorphology,
} from '@/features/study/morphologyDecoder';
import {
  downloadAndImportOriginals,
  importLocalOriginalsIfPresent,
} from '@lib/database/originals-download-service';
import {
  versionComparisonService,
  type BibleVersion,
  type VerseComparison,
} from '@lib/comparison/VersionComparison';
import {FeatureGuideModal} from '@components/FeatureGuideModal';
import {getFeatureGuideContent} from '@lib/onboarding/featureGuides';
import {encodeHttpsLink, makeStudyBundle} from '@lib/together';
import {
  buildPrepMarkdown,
  type PrepMarkdownInput,
  type PrepMarkdownSection,
} from '@/features/study/prepMarkdown';
import {buildPrepHtml, type PrepExportFormat} from '@/features/study/prepPdf';
import {PrepExportFormatSheet} from '@/features/study/PrepExportFormatSheet';
import {exportPreparedPdf} from '@/features/study/exportPrepPdf';
import {
  DEFAULT_WORDS_PER_MINUTE,
  WPM_MAX,
  WPM_MIN,
  WPM_STEP,
  clampWpm,
  countPrepNotesWords,
  estimateMinutes,
  estimateSectionDurations,
  formatEstimatedDuration,
} from '@/features/study/prepTiming';
import {
  type VerseRange,
  adjustStart,
  adjustEnd,
  canDecreaseStart,
  canIncreaseStart,
  canDecreaseEnd,
  canIncreaseEnd,
} from '@/features/study/prepRange';
import {translations} from '@/i18n/translations';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

const VERSION_KEY = '@bible_version';

type LoadStatus = 'loading' | 'ready' | 'error' | 'empty';

/** T8.4.2 — the "Palabras clave en el idioma original" section's own status. */
type OriginalsStatus =
  'idle' | 'loading' | 'notInstalled' | 'ready' | 'empty' | 'error';

/**
 * T8.4.3 — "Comparar versiones" section's own status. `onlyOneInstalled` is a
 * distinct state (not `empty`) because it needs its own graceful copy + a
 * link to Settings, not a generic empty state.
 */
type VersionCompareStatus =
  'idle' | 'loading' | 'onlyOneInstalled' | 'ready' | 'error';

interface VerseLine {
  verse: number;
  text: string | null;
}

interface CrossRow {
  key: string;
  bookDisplay: string;
  bookNav: string | null;
  chapter: number;
  verse: number;
  text: string | null;
}

interface ChristRow {
  id: string;
  note: string;
  pointsTo?: string;
  fulfillmentText?: string;
  versionAbbrev?: string;
}

/** A gathered original-language keyword, display-ready (T8.4.2). */
interface OriginalWordRow {
  strongs: string;
  word: string;
  translit: string | null;
  gloss: string | null;
  morphology: string | null;
  count: number;
}

/** Resolve the reading version the same way for verse text and gloss language. */
async function resolveVersion(paramVersion?: string): Promise<string> {
  return paramVersion ?? (await AsyncStorage.getItem(VERSION_KEY)) ?? 'RVR1960';
}

/** Per-section icon for the outline cards — every id from every template. */
const SECTION_ICONS: Record<PrepSection, keyof typeof Ionicons.glyphMap> = {
  context: 'book-outline',
  observation: 'eye-outline',
  interpretation: 'bulb-outline',
  bigIdea: 'key-outline',
  christ: 'sparkles-outline',
  application: 'walk-outline',
  questions: 'help-circle-outline',
  versePoints: 'list-outline',
  topicDevelopment: 'layers-outline',
  tension: 'warning-outline',
  resolution: 'checkmark-circle-outline',
};

/** One +/− button in the verse-range stepper. */
function StepButton({
  icon,
  onPress,
  disabled,
  color,
  disabledColor,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled: boolean;
  color: string;
  disabledColor: string;
  label: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
      style={styles.stepButton}>
      <Ionicons
        name={icon}
        size={20}
        color={disabled ? disabledColor : color}
      />
    </TouchableOpacity>
  );
}

export default function PrepTableScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const toast = useToast();
  const p = t.prepTable;
  const sr = t.prepSelfReview;
  // Contextual hint (T: onboarding-contextual-hints) — the 3 header icons
  // (Historial / Series / Ilustraciones) are icon-only with no visible
  // label, right next to the back button; easy to overlook entirely.
  const headerActionsHint = useContextualHint('prepHeaderActions');

  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    startVerse?: string;
    endVerse?: string;
    verse?: string;
    version?: string;
  }>();
  const book = params.book ?? '';
  const chapter = Number(params.chapter ?? 0);
  const paramStart = Number(params.startVerse ?? params.verse ?? 0);
  const paramEnd = params.endVerse ? Number(params.endVerse) : paramStart;

  // The verse range is editable in-screen (the range picker), seeded from the
  // incoming params and reset whenever a new passage arrives via navigation.
  const [range, setRange] = useState<VerseRange>(() => ({
    start: paramStart >= 1 ? paramStart : 1,
    end:
      Math.max(paramStart, paramEnd) >= 1 ? Math.max(paramStart, paramEnd) : 1,
  }));
  useEffect(() => {
    setRange({
      start: paramStart >= 1 ? paramStart : 1,
      end:
        Math.max(paramStart, paramEnd) >= 1
          ? Math.max(paramStart, paramEnd)
          : 1,
    });
  }, [book, chapter, paramStart, paramEnd]);

  // T8.4.2 — a premium reader gets a higher (but still bounded) cross-ref
  // cap; a free reader sees the SAME 12-ref table as before this tanda. The
  // cap decision lives here, never inside the pure `buildPrepTable`.
  const table: PrepTable | null = useMemo(
    () =>
      buildPrepTable(book, chapter, range.start, range.end, {
        maxCrossRefs: isPremium
          ? PREP_MAX_CROSS_REFS_PREMIUM
          : PREP_MAX_CROSS_REFS,
      }),
    [book, chapter, range.start, range.end, isPremium],
  );

  // How many MORE curated parallels exist beyond the free cap — cheap (pure,
  // no DB) to compute a second time just for the count, and only needed for a
  // free reader's "+N more" invitation; a premium reader already sees them.
  const extraCrossRefCount = useMemo(() => {
    if (isPremium) return 0;
    const full = buildPrepTable(book, chapter, range.start, range.end, {
      maxCrossRefs: PREP_MAX_CROSS_REFS_PREMIUM,
    });
    const shown = table?.crossRefs.length ?? 0;
    return Math.max(0, (full?.crossRefs.length ?? 0) - shown);
  }, [isPremium, table, book, chapter, range.start, range.end]);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [reloading, setReloading] = useState(false);
  const hasLoadedRef = useRef(false);
  const [maxVerse, setMaxVerse] = useState(0);
  const [lines, setLines] = useState<VerseLine[]>([]);
  const [crossRows, setCrossRows] = useState<CrossRow[]>([]);
  const [christRows, setChristRows] = useState<ChristRow[]>([]);
  const [intro, setIntro] = useState<{
    author: string;
    date: string;
    theme: string;
    context: string;
  } | null>(null);
  const [drafts, setDrafts] = useState<Partial<Record<PrepSection, string>>>(
    {},
  );
  // Per-section selection range + TextInput ref for the Markdown format
  // toolbar — keyed by section since `templateSections.map` renders one
  // note input (and one toolbar) per outline section. Each section gets ONE
  // stable ref OBJECT (created lazily, memoized for the component's whole
  // lifetime) rather than a plain `TextInput | null` map — React accepts a
  // ref object directly on `ref=`, and the SAME object is handed to the
  // toolbar, so both always see the current instance with no extra plumbing.
  // A section with no recorded selection yet falls back to the END of its
  // current draft (not a hardcoded {0, 0}) at each call site below, so
  // pressing a toolbar button before ever focusing that section's field
  // inserts after the loaded note, not at its very start.
  const [noteSelections, setNoteSelections] = useState<
    Partial<Record<PrepSection, {start: number; end: number}>>
  >({});
  const noteInputRefs = useRef<
    Partial<Record<PrepSection, React.RefObject<TextInput | null>>>
  >({}).current;
  const getNoteInputRef = useCallback(
    (section: PrepSection): React.RefObject<TextInput | null> => {
      if (!noteInputRefs[section]) {
        noteInputRefs[section] = {current: null};
      }
      return noteInputRefs[section]!;
    },
    [noteInputRefs],
  );
  // Tanda "plantillas de sermón" — the CURRENT entry's homiletic structure.
  // Resolved from storage in `load()` (unconditionally, so switching passages
  // never leaks a stale choice); the narrow refocus effect below only adopts
  // a NEWLY-persisted template, never resetting an as-yet-unsaved pick made
  // via the picker. See its own comment for why the two are asymmetric.
  const [template, setTemplate] = useState<PrepTemplateId>(
    DEFAULT_PREP_TEMPLATE,
  );
  // This entry's own ordered section-id list + which of its ids plays
  // "interpretation"'s role — every call site below resolves through these
  // two instead of importing `PREP_SECTIONS` directly, so a template choice
  // actually changes what renders/exports/flushes/times.
  const templateSections = useMemo(
    () => getPrepTemplateSections(template),
    [template],
  );
  const interpSlot = useMemo(() => interpretationSlotFor(template), [template]);
  const [versionLabel, setVersionLabel] = useState('');
  const [copied, setCopied] = useState(false);
  // T8.4.5 — PDF export (premium): a separate in-flight flag from `copied`
  // since printToFileAsync + shareAsync are real async I/O, not a clipboard
  // write.
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  // Tanda 3 — the export-format choice sheet. A premium tap on "Export to
  // PDF" opens this instead of generating a manuscript immediately; a free
  // tap never sees it (openOfferingSheet runs directly, unchanged).
  const [formatSheetVisible, setFormatSheetVisible] = useState(false);

  // Modo púlpito — configurable words-per-minute for the duration estimate.
  const [pulpitWpm, setPulpitWpm] = useState(DEFAULT_WORDS_PER_MINUTE);
  // Per-section pacing breakdown, collapsed by default (a preacher wants the
  // single total most of the time; the breakdown is a deliberate drill-down).
  const [pulpitBreakdownVisible, setPulpitBreakdownVisible] = useState(false);

  // Autorrevisión antes de predicar — a free, checkbox-only structural
  // self-check (see prepSelfReview.ts's own guardrail docstring: no free
  // text, ever). Collapsed by default, same drill-down pattern as the
  // pulpit breakdown above. Reset to empty on load; `load()`/the focus
  // effect below don't need to touch this — it's re-fetched per passage the
  // same way `drafts` is.
  const [selfReview, setSelfReview] = useState<PrepSelfReview>(
    emptyPrepSelfReview(),
  );
  const [selfReviewVisible, setSelfReviewVisible] = useState(false);

  // Topic suggester — "I have a topic, not a passage yet" (premium). Only
  // reachable from the EMPTY state (no passage selected), so this never
  // touches the free, unchanged, with-a-passage experience. Pure keyword
  // matching over the already-curated theme taxonomy — see
  // prepTopicSuggest.ts's own docstring for the "no AI" discipline.
  const [topicQuery, setTopicQuery] = useState('');
  const topicSuggestions = useMemo(
    () =>
      topicQuery.trim().length > 0 ? suggestPassagesForTopic(topicQuery) : [],
    [topicQuery],
  );

  const [guideVisible, setGuideVisible] = useState(false);

  // T8.4.2 — "Palabras clave en el idioma original" (entirely premium).
  const [originalsStatus, setOriginalsStatus] =
    useState<OriginalsStatus>('idle');
  const [originalWordRows, setOriginalWordRows] = useState<OriginalWordRow[]>(
    [],
  );
  const [originalsDownloading, setOriginalsDownloading] = useState(false);
  const [originalsProgress, setOriginalsProgress] = useState(0);

  // T8.4.3 — "Comparar versiones": 2-3 ALREADY-INSTALLED translations of the
  // current passage range, side by side. Entirely premium. `compareVersions`
  // is the catalog of what the reader actually has (never the full catalog);
  // `selectedCompareIds` is the reader's own pick, seeded once with a
  // reasonable default and then left alone across passage/range changes.
  const [compareStatus, setCompareStatus] =
    useState<VersionCompareStatus>('idle');
  const [compareVersions, setCompareVersions] = useState<BibleVersion[]>([]);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [compareRows, setCompareRows] = useState<VerseComparison[]>([]);

  const load = useCallback(async () => {
    if (!table) {
      setStatus('empty');
      return;
    }
    // First open shows the spinner; later range tweaks keep the content on
    // screen and show a subtle inline indicator instead of blanking it.
    if (hasLoadedRef.current) {
      setReloading(true);
    } else {
      setStatus('loading');
    }
    try {
      const version = await resolveVersion(params.version);
      const lang = christLangForVersion(version);

      // The chapter's verse count bounds the range picker.
      try {
        const count = await bibleDB.getChapterVerseCount(
          table.bookId,
          table.chapter,
          version,
        );
        if (count > 0) setMaxVerse(count);
      } catch {
        // Leave maxVerse open (0) — the picker still works, just unbounded up.
      }

      // Passage text (each verse in the range).
      const verseNums: number[] = [];
      for (let v = table.startVerse; v <= table.endVerse; v++)
        verseNums.push(v);
      const verseRows = await Promise.all(
        verseNums.map(async v => {
          try {
            const row = await bibleDB.getVerse(
              table.bookId,
              table.chapter,
              v,
              version,
            );
            return {verse: v, text: row?.text ?? null};
          } catch {
            return {verse: v, text: null};
          }
        }),
      );

      // Cross-reference parallels.
      const crossResolved = await Promise.all(
        table.crossRefs.map(async key => {
          const slash = key.indexOf('/');
          const bookName = slash >= 0 ? key.slice(0, slash) : key;
          const [cStr, vStr] = (slash >= 0 ? key.slice(slash + 1) : '').split(
            '/',
          );
          const c = Number(cStr);
          const v = Number(vStr);
          const info = getBookByName(bookName);
          const display = info
            ? lang === 'en'
              ? info.nameEn
              : info.name
            : bookName;
          let text: string | null = null;
          if (info && Number.isFinite(c) && Number.isFinite(v)) {
            try {
              const row = await bibleDB.getVerse(info.id, c, v, version);
              text = row?.text ?? null;
            } catch {
              text = null;
            }
          }
          return {
            key,
            bookDisplay: display,
            bookNav: info ? (lang === 'en' ? info.nameEn : info.name) : null,
            chapter: c,
            verse: v,
            text,
          };
        }),
      );

      // "Cristo en este pasaje" notes (curated; speak the version's language).
      const cc = translations[lang].christConnections;
      const christResolved = await Promise.all(
        table.christConnections.map(async conn => {
          const note = (cc.notes as Record<string, string>)[conn.id];
          let pointsTo: string | undefined;
          let fulfillmentText: string | undefined;
          if (conn.fulfillment) {
            const fp = parseChristRef(conn.fulfillment);
            const fbook = fp ? getBookByName(fp.book) : undefined;
            if (fp && fbook) {
              pointsTo = formatChristRefLabel(conn.fulfillment, lang);
              try {
                const frow = await bibleDB.getVerse(
                  fbook.id,
                  fp.chapter,
                  fp.verse,
                  version,
                );
                fulfillmentText = frow?.text ?? undefined;
              } catch {
                fulfillmentText = undefined;
              }
            }
          }
          return {
            id: conn.id,
            note,
            pointsTo,
            fulfillmentText,
            versionAbbrev: versionAbbrev(version),
          };
        }),
      );

      const bookIntro = getBookIntro(table.bookId, lang);

      const saved = await getPrepNotes(table.passageKey);
      const savedSelfReview = await getPrepSelfReview(table.passageKey);

      setLines(verseRows);
      setCrossRows(crossResolved);
      setChristRows(christResolved.filter(r => Boolean(r.note)));
      setIntro(bookIntro);
      setDrafts(saved.sections);
      setSelfReview(savedSelfReview);
      // Unconditional (unlike the narrow refocus effect below): this is a
      // whole-passage (re)load, possibly for a DIFFERENT passageKey than
      // before (the range stepper just moved), so it must always resolve to
      // THAT entry's own stored template — never carry over a stale pick.
      setTemplate(saved.template ?? DEFAULT_PREP_TEMPLATE);
      setVersionLabel(versionAbbrev(version));
      hasLoadedRef.current = true;
      setStatus('ready');
    } catch (err) {
      logger.error('Prep table load failed', err as Error, {
        component: 'PrepTableScreen',
        action: 'load',
      });
      if (!hasLoadedRef.current) setStatus('error');
    } finally {
      setReloading(false);
    }
  }, [table, params.version]);

  useEffect(() => {
    load();
  }, [load]);

  // Tanda 4 — re-read ONLY the saved notes on refocus, not the whole heavy
  // `load()` above (which re-fetches cross-refs, book intro, comparison
  // versions, etc.). A plain `useEffect(() => load(), [load])` doesn't
  // re-run just because the reader navigated away (e.g. to the
  // illustrations bank to insert a saved illustration into these notes) and
  // came back — `load`'s deps (`table`, `params.version`) don't change on
  // that round trip, so the inserted text would otherwise sit unseen in
  // storage until an unrelated reload. This is narrowly scoped to the notes
  // read alone so it stays cheap enough to run on every focus.
  useFocusEffect(
    useCallback(() => {
      if (table) {
        getPrepNotes(table.passageKey).then(saved => {
          setDrafts(saved.sections);
          // CONDITIONAL, unlike `load()` above: a focus round-trip (e.g. to
          // the illustrations bank and back) must adopt a template another
          // screen just PERSISTED for this SAME entry, but must never reset
          // a template the picker just chose locally and hasn't been saved
          // yet (picking narrativo, then navigating to insert an
          // illustration before typing a word, must not silently revert the
          // pick to 'expository' on return).
          if (saved.template) setTemplate(saved.template);
        });
      }
    }, [table]),
  );

  // T8.4.2 — "Palabras clave en el idioma original". Entirely premium: a free
  // reader never even reaches the pack-installed check or a DB read, same
  // discipline as the T8.4.1 history screen ("premium stays a pure addition,
  // nothing here costs the free path anything").
  const loadOriginalWords = useCallback(async () => {
    if (!table || !isPremium) return;
    setOriginalsStatus('loading');
    try {
      let installed = await isOriginalsInstalled();
      if (!installed) installed = await importLocalOriginalsIfPresent();
      if (!installed) {
        setOriginalsStatus('notInstalled');
        return;
      }

      const version = await resolveVersion(params.version);
      const glossLang = glossLanguage(language, version);

      const verseNums: number[] = [];
      for (let v = table.startVerse; v <= table.endVerse; v++)
        verseNums.push(v);
      const perVerse: PrepOriginalVerseWords[] = await Promise.all(
        verseNums.map(async v => ({
          verse: v,
          words: await getVerseOriginal(table.bookNameEn, table.chapter, v),
        })),
      );

      const groups = groupOriginalWordsByStrongs(perVerse);
      const rows: OriginalWordRow[] = groups.map(g => {
        const morphology = decodeMorphologyCode(g.grammar, g.lang);
        return {
          strongs: g.strongs,
          word: g.word,
          translit: g.translit,
          gloss: pickGloss(g, glossLang),
          morphology: morphology
            ? describeMorphology(morphology, language)
            : null,
          count: g.count,
        };
      });
      setOriginalWordRows(rows);
      setOriginalsStatus(rows.length > 0 ? 'ready' : 'empty');
    } catch (err) {
      logger.warn('Prep original words load failed', {error: String(err)});
      setOriginalsStatus('error');
    }
  }, [table, isPremium, language, params.version]);

  useEffect(() => {
    loadOriginalWords();
  }, [loadOriginalWords]);

  // T8.4.3 — "Comparar versiones". Loads the catalog of versions the reader
  // ACTUALLY has installed (never the full catalog) and seeds a default
  // selection: the current reading version first, then up to two more —
  // exactly the pitch's "current + up to 2 more of the installed ones".
  // Entirely premium: a free reader never reaches `getAvailableVersions`,
  // same discipline as the originals section above. Keyed on isPremium/
  // language only (NOT on the passage) so widening the verse range or
  // jumping to a new passage never resets the reader's own version picks.
  const loadCompareVersions = useCallback(async () => {
    if (!isPremium) return;
    setCompareStatus('loading');
    try {
      const versions =
        await versionComparisonService.getAvailableVersions(language);
      setCompareVersions(versions);
      if (versions.length <= 1) {
        setCompareStatus('onlyOneInstalled');
        return;
      }
      setSelectedCompareIds(prev => {
        if (prev.length > 0) return prev; // keep the reader's own picks
        const currentId = selectedVersion.id.toLowerCase();
        const defaults: string[] = [];
        const current = versions.find(v => v.id.toLowerCase() === currentId);
        if (current) defaults.push(current.id);
        for (const v of versions) {
          if (defaults.length >= 3) break;
          if (v.id.toLowerCase() === currentId) continue;
          defaults.push(v.id);
        }
        return defaults;
      });
      setCompareStatus('ready');
    } catch (err) {
      logger.warn('Prep version compare: failed to load available versions', {
        error: String(err),
      });
      setCompareStatus('error');
    }
  }, [isPremium, language, selectedVersion.id]);

  useEffect(() => {
    loadCompareVersions();
  }, [loadCompareVersions]);

  // Resolve the selected versions' text for the FULL passage range (reuses
  // `compareVerseRange` — the same service that powers VersionComparisonScreen
  // — rather than re-deriving verse-by-verse lookups here).
  const loadCompareRows = useCallback(async () => {
    if (
      !table ||
      !isPremium ||
      compareStatus !== 'ready' ||
      selectedCompareIds.length === 0
    ) {
      return;
    }
    try {
      const rows = await versionComparisonService.compareVerseRange(
        table.bookNameEn,
        table.chapter,
        table.startVerse,
        table.endVerse,
        selectedCompareIds,
      );
      setCompareRows(rows);
    } catch (err) {
      logger.warn('Prep version compare: failed to load verse texts', {
        error: String(err),
      });
      setCompareRows([]);
    }
  }, [table, isPremium, compareStatus, selectedCompareIds]);

  useEffect(() => {
    loadCompareRows();
  }, [loadCompareRows]);

  const handleDownloadOriginals = useCallback(async () => {
    setOriginalsDownloading(true);
    setOriginalsProgress(0);
    try {
      await downloadAndImportOriginals(setOriginalsProgress);
      await loadOriginalWords();
    } catch {
      setOriginalsStatus('error');
    } finally {
      setOriginalsDownloading(false);
    }
  }, [loadOriginalWords]);

  const handleUnlockOriginalWords = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  const handleUnlockMoreCrossRefs = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  const handleUnlockVersionCompare = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  // Toggle a version in/out of the comparison. Floor of 2 (a "comparison" of
  // one translation isn't one) and a ceiling of 3 (the pitch's "2-3 side by
  // side") — both silently no-op at the edges rather than needing a toast.
  const handleToggleCompareVersion = useCallback((id: string) => {
    haptics.tap();
    setSelectedCompareIds(prev => {
      const already = prev.some(
        existing => existing.toLowerCase() === id.toLowerCase(),
      );
      if (already) {
        if (prev.length <= 2) return prev;
        return prev.filter(
          existing => existing.toLowerCase() !== id.toLowerCase(),
        );
      }
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }, []);

  // "Only one version installed" invites to Settings, where downloading more
  // versions already lives (ManageVersionsSection) — no new download flow here.
  const handleGoToVersionSettings = useCallback(() => {
    haptics.tap();
    router.push('/(tabs)/settings' as never);
  }, [router]);

  const handleJump = useCallback(
    (row: CrossRow) => {
      if (!row.bookNav) return;
      haptics.tap();
      router.push({
        pathname: `/verse/${row.bookNav}/${row.chapter}` as never,
        params: {verse: row.verse},
      });
    },
    [router],
  );

  const handleRange = useCallback((next: VerseRange) => {
    haptics.tap();
    setRange(next);
  }, []);

  // Topic suggester — open a suggested passage. Uses `router.setParams`
  // rather than `router.push`: this screen is ALREADY mounted on
  // `/features/prep` (that's the only way the topic suggester itself is
  // reachable — see handleOpenTopicSearch below), so a `push` here doesn't
  // navigate to a new screen, it stacks a SECOND instance of this same
  // route on top of the first and plays a full native transition to slide
  // it in. That transition briefly leaves the incoming screen's touch
  // targets unresponsive — confirmed live: a tap on the header's
  // "Banco de ilustraciones" icon landing during that window (e.g. a fast
  // follow-up tap right after picking a suggestion) was silently swallowed
  // by the in-flight transition, never even reaching `handleOpenIllustrations`
  // (its `if (!table) return` guard was NOT the culprit — `table` itself
  // was already correctly resolved by then). `setParams` updates the
  // CURRENT screen's params in place with no stack push and no transition,
  // which removes that dead window entirely and also stops topic-search
  // round trips from growing the back stack one entry per pick.
  // `suggestPassagesForTopic` only ever returns refs that already resolve
  // to a real canonical book, but parseThemeRef/getBookByName are still
  // checked defensively rather than assumed. `endVerse`/`verse` are
  // explicitly cleared (unlike `push`, `setParams` merges into the
  // existing params instead of replacing them wholesale, so a previously
  // multi-verse range or legacy `verse` param would otherwise leak into
  // this new single-verse suggestion).
  const handleOpenTopicSuggestion = useCallback(
    (suggestion: TopicPassageSuggestion) => {
      const parsed = parseThemeRef(suggestion.ref);
      if (!parsed) return;
      const bookInfo = getBookByName(parsed.book);
      if (!bookInfo) return;
      haptics.tap();
      router.setParams({
        book: bookInfo.nameEn,
        chapter: String(parsed.chapter),
        startVerse: String(parsed.verse),
        endVerse: undefined,
        verse: undefined,
      });
    },
    [router],
  );

  // Entry point for the topic suggester above — it only renders on the
  // EMPTY (no-passage) state, but every real navigation into this screen
  // always seeds a passage, so that state was otherwise unreachable through
  // the UI. Clears this same screen's own passage params via `setParams`
  // (exactly like handleOpenTopicSuggestion does in reverse, and for the
  // same reason — see its comment above) instead of `push`-ing a second
  // stacked instance of this route with a native transition.
  const handleOpenTopicSearch = useCallback(() => {
    haptics.tap();
    router.setParams({
      book: undefined,
      chapter: undefined,
      startVerse: undefined,
      endVerse: undefined,
      verse: undefined,
    });
  }, [router]);

  // T8.4.1 — the "Historial de preparaciones" entry point. Always navigates
  // (the destination screen itself shows the premium teaser for a free
  // reader); the small leaf badge below is just a visual heads-up. Carries
  // the CURRENT passage's key (when one is selected) so the history list can
  // surface the preacher's OWN past preps most relevant to it first —
  // reorder only, mirrors handleOpenSeries' own passageKey convention below.
  const handleOpenHistory = useCallback(() => {
    haptics.tap();
    router.push({
      pathname: '/features/prep/history' as never,
      params: table ? {relevantToPassageKey: table.passageKey} : undefined,
    });
  }, [router, table]);

  // T8.4.4 — the "Series de predicación" entry point. Same discipline as
  // history above: always navigates, the destination gates itself for a
  // free reader. Carries the CURRENT passage's key so the series list can
  // offer "add this passage to a series" (see that screen's docstring).
  const handleOpenSeries = useCallback(() => {
    haptics.tap();
    router.push({
      pathname: '/features/prep/series' as never,
      params: table ? {passageKey: table.passageKey} : undefined,
    });
  }, [router, table]);

  // Tanda 4 — the "Banco de ilustraciones" entry point, opened in INSERT
  // mode (carries `insertPassageKey`): picking an illustration there appends
  // it to this passage's notes and navigates back, instead of just browsing.
  // Placement judgment call: grouped with history/series above (same header
  // row, same "always navigate, destination gates/handles itself"
  // discipline) rather than beside the export buttons — flagged for
  // revisit, since unlike history/series this entry point always opens in a
  // special insert mode rather than plain browsing.
  const handleOpenIllustrations = useCallback(async () => {
    if (!table) return;
    haptics.tap();
    // Same race handleOpenPulpit below guards against: flush any in-flight
    // note edits BEFORE navigating, so the illustrations screen's own read
    // (when it appends the inserted illustration) sees the latest typed
    // content rather than a stale AsyncStorage snapshot. Flushes THIS entry's
    // own template sections (not the bare `PREP_SECTIONS` 7) so a
    // non-'expository' entry's just-typed prose (e.g. a `tension` note) is
    // actually persisted before the illustrations screen reads it back.
    await Promise.all(
      templateSections.map(section =>
        savePrepNote(
          table.passageKey,
          section,
          drafts[section] ?? '',
          undefined,
          template,
        ),
      ),
    );
    router.push({
      pathname: '/features/prep/illustrations' as never,
      params: {insertPassageKey: table.passageKey},
    });
  }, [router, table, drafts, templateSections, template]);

  // Modo púlpito — the presenter view. Always navigates with the current
  // passage (the destination gates itself + shows an empty state when there
  // are no notes yet), same discipline as history/series above.
  const handleOpenPulpit = useCallback(async () => {
    if (!table) return;
    haptics.tap();
    // Persist any in-flight note edits BEFORE navigating. The presenter screen
    // reads notes from STORAGE, so a note just typed (whose onBlur save is still
    // queued when this button's tap fires) could otherwise lose the race and
    // make the presenter show its empty state. Flushing here closes that gap.
    // Uses THIS entry's own template sections (not the bare `PREP_SECTIONS`
    // 7) so a non-'expository' entry's prose is fully flushed too — the
    // pulpit screen resolves the SAME template independently from storage.
    await Promise.all(
      templateSections.map(section =>
        savePrepNote(
          table.passageKey,
          section,
          drafts[section] ?? '',
          undefined,
          template,
        ),
      ),
    );
    // Resolve the version the SAME way this screen resolves it (explicit
    // param, else the device's last-picked reading version) and ALWAYS
    // forward it. The pulpit screen falls back independently to the
    // UI-language-based selectedVersion when no version param arrives,
    // which can silently disagree with the version the Mesa is showing
    // (e.g. deep link with no version param + English UI: Mesa shows
    // RVR1960 via its own fallback, pulpit would show WEB via its own).
    // Forwarding the resolved version unconditionally closes that gap.
    const version = await resolveVersion(params.version);
    router.push({
      pathname: '/features/prep/pulpit' as never,
      params: {
        book: table.bookNameEn,
        chapter: String(table.chapter),
        startVerse: String(table.startVerse),
        endVerse: String(table.endVerse),
        version,
      },
    });
  }, [router, table, params.version, drafts, templateSections, template]);

  const handleUnlockPulpit = useCallback(() => {
    haptics.tap();
    openOfferingSheet();
  }, [openOfferingSheet]);

  // Autosave note edits shortly after typing stops. On Android the hardware
  // back button dismisses the keyboard WITHOUT firing onBlur, so relying on
  // blur alone lets a typed note vanish if the reader backs out of the
  // screen right after (the process is still alive — this debounce is the
  // save path that actually catches that case). onBlur below stays as a
  // harmless, redundant safety net for the common case where it does fire.
  const debouncedSaveNote = useDebouncedCallback(
    (
      passageKey: string,
      section: PrepSection,
      value: string,
      templateId: PrepTemplateId,
    ) => {
      savePrepNote(passageKey, section, value, undefined, templateId);
    },
    700,
  );

  // use-debounce cancels its pending trailing call once this component
  // unmounts, so a save queued right before the screen closes (the exact
  // "type, back, back" repro this debounce exists for) would otherwise be
  // silently dropped. Flushing on unmount forces that queued save through —
  // savePrepNote is idempotent + serialized, so this is harmless even when
  // onBlur/handleOpenPulpit already saved the same value.
  useEffect(() => () => debouncedSaveNote.flush(), [debouncedSaveNote]);

  const handleNoteChange = useCallback(
    (section: PrepSection, value: string) => {
      setDrafts(prev => ({...prev, [section]: value}));
      if (!table) return;
      debouncedSaveNote(table.passageKey, section, value, template);
    },
    [table, debouncedSaveNote, template],
  );

  const handleNoteBlur = useCallback(
    (section: PrepSection) => {
      if (!table) return;
      savePrepNote(
        table.passageKey,
        section,
        drafts[section] ?? '',
        undefined,
        template,
      );
    },
    [table, drafts, template],
  );

  const handleNoteSelectionChange = useCallback(
    (section: PrepSection, sel: {start: number; end: number}) => {
      setNoteSelections(prev => ({...prev, [section]: sel}));
    },
    [],
  );

  // Autorrevisión — toggles one question's checked state. Optimistic local
  // update (mirrors handleNoteChange's own draft-first pattern) + a
  // fire-and-forget store write (setPrepSelfReviewQuestion is already
  // serialized/failure-safe, same contract as savePrepNote).
  const handleToggleSelfReviewQuestion = useCallback(
    (id: PrepSelfReviewQuestionId, checked: boolean) => {
      if (!table) return;
      haptics.tap();
      setSelfReview(prev => setQuestionChecked(prev, id, checked));
      setPrepSelfReviewQuestion(table.passageKey, id, checked);
    },
    [table],
  );

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];
  // The passage label follows the reading version's language (RVR1960 → "Juan").
  const passageLabel = table
    ? formatPassageLabel(table, selectedVersion.language === 'es' ? 'es' : 'en')
    : '';
  const bookLang = selectedVersion.language === 'es' ? 'es' : 'en';

  // Topic suggester — a display label for a suggested ref, same language
  // convention as `passageLabel` above ("Juan 3:16" for an 'es' reader).
  // Falls back to the raw canonical ref on the defensive parse-miss path
  // (kept in step with handleOpenTopicSuggestion's own guards).
  const formatSuggestionLabel = useCallback(
    (suggestion: TopicPassageSuggestion): string => {
      const parsed = parseThemeRef(suggestion.ref);
      const bookInfo = parsed ? getBookByName(parsed.book) : null;
      if (!parsed || !bookInfo) return suggestion.ref;
      const name = bookLang === 'es' ? bookInfo.name : bookInfo.nameEn;
      return `${name} ${parsed.chapter}:${parsed.verse}`;
    },
    [bookLang],
  );

  // T8.4.3 — the "Comparar versiones" card width follows the reader's
  // SELECTION count (not what a given verse happens to resolve to), so the
  // grid stays visually consistent across the whole passage even when one
  // version omits a particular verse.
  const compareCardWidthStyle =
    selectedCompareIds.length >= 3
      ? styles.compareVersionCardThird
      : selectedCompareIds.length === 2
        ? styles.compareVersionCardHalf
        : styles.compareVersionCardFull;

  // T8.4.5 — the same assembled PrepMarkdownInput feeds BOTH exports: the
  // free Markdown export (buildPrepMarkdown, unchanged) and the premium PDF
  // export (buildPrepHtml, new). Extracted here so neither `handleExport`
  // nor `handleExportPdf` re-derives the sections/cross-refs/themes/Christ
  // helps assembly on its own.
  const buildPrepInput = useCallback((): PrepMarkdownInput | null => {
    if (!table) return null;
    const themeLabel = (id: string) =>
      (t.themes.list as Record<string, {name: string; description: string}>)[id]
        ?.name ?? id;
    const sections: PrepMarkdownSection[] = templateSections.map(section => {
      let helps: string[] = [];
      if (section === 'context' && intro) {
        helps = [
          `${p.bookIntroTitle} — ${intro.author} · ${intro.date}`,
          intro.context,
        ];
      } else if (section === interpSlot) {
        helps = [
          ...crossRows.map(r =>
            r.text
              ? `${r.bookDisplay} ${r.chapter}:${r.verse} — ${r.text}`
              : `${r.bookDisplay} ${r.chapter}:${r.verse}`,
          ),
          ...(table.themeIds.length > 0
            ? [`${p.themesTitle}: ${table.themeIds.map(themeLabel).join(', ')}`]
            : []),
        ];
      } else if (section === 'christ') {
        helps = christRows.map(r =>
          r.pointsTo ? `${r.note} (→ ${r.pointsTo})` : r.note,
        );
      }
      return {
        id: section,
        label: p.sections[section].label,
        prompt: p.sections[section].prompt,
        note: drafts[section],
        helps,
      };
    });
    return {
      passageLabel,
      versionLabel,
      passageText: lines.map(l => ({verse: l.verse, text: l.text ?? ''})),
      sections,
      guardrail: p.guardrail,
      generatedWith: p.title,
    };
  }, [
    table,
    intro,
    crossRows,
    christRows,
    drafts,
    lines,
    passageLabel,
    versionLabel,
    p,
    t,
    templateSections,
    interpSlot,
  ]);

  const handleExport = useCallback(async () => {
    const input = buildPrepInput();
    if (!input) return;
    haptics.tap();
    const markdown = buildPrepMarkdown(input);
    try {
      await Clipboard.setStringAsync(markdown);
      haptics.success();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.warn('Prep export copy failed', {error: String(err)});
    }
  }, [buildPrepInput]);

  // T8.4.5 — export a designed PDF (premium upgrade of the free Markdown
  // export above). Locked for a free reader: tapping opens the offering
  // sheet instead of generating anything, WITHOUT ever showing the
  // format-choice sheet (a free reader has nothing to choose among). A
  // premium tap now opens the format sheet (Tanda 3) instead of generating a
  // manuscript immediately — see handleSelectExportFormat below for the
  // actual generate-and-share step.
  const handleExportPdf = useCallback(() => {
    if (isExportingPdf) return;
    haptics.tap();
    if (!isPremium) {
      openOfferingSheet();
      return;
    }
    setFormatSheetVisible(true);
  }, [isExportingPdf, isPremium, openOfferingSheet]);

  // Tanda 3 — generate + share the PDF in the reader's chosen format, once
  // the format sheet reports a pick. This is the exact isExportingPdf/try-
  // catch-finally body handleExportPdf used to run directly before this
  // tanda; only WHEN it runs changed (after a format choice, not on the
  // button tap itself), plus `format` now flows into buildPrepHtml instead
  // of relying on its 'manuscript' default.
  //
  // The actual generate-and-hand-off step is `exportPreparedPdf` — on native
  // it's byte-identical to the old inline `Print.printToFileAsync` +
  // `sharePreparedPdf` pair; on web it fixes a real bug (expo-print's web
  // implementation ignores the `html` we hand it and never returns a
  // `{uri}`, so the old code silently threw and did nothing) by printing
  // the built HTML directly through the browser's own print dialog. Either
  // way, a `false`/thrown result now surfaces an honest error toast instead
  // of failing silently.
  const handleSelectExportFormat = useCallback(
    async (format: PrepExportFormat) => {
      setFormatSheetVisible(false);
      const input = buildPrepInput();
      if (!input) return;
      try {
        setIsExportingPdf(true);
        const html = buildPrepHtml(input, format);
        const ok = await exportPreparedPdf(
          html,
          passageLabel,
          p.exportPdfDialogTitle,
        );
        if (!ok) {
          toast.error(p.exportPdfError);
        }
      } catch (err) {
        logger.warn('Prep PDF export failed', {error: String(err)});
        toast.error(p.exportPdfError);
      } finally {
        setIsExportingPdf(false);
      }
    },
    [buildPrepInput, passageLabel, p, toast],
  );

  // Share the outline as a read-only study LINK (Sprint 109): the passage + the
  // preparer's per-section prose, carried in the link; the recipient's app
  // re-assembles the curated helps locally. Peer-to-peer, nothing stored.
  const handleShareStudy = useCallback(async () => {
    if (!table) return;
    haptics.tap();
    const bundle = makeStudyBundle(
      {
        bookId: table.bookId,
        chapter: table.chapter,
        startVerse: table.startVerse,
        endVerse: table.endVerse,
      },
      undefined,
      drafts,
    );
    const link = encodeHttpsLink(bundle);
    const message = t.together.shareStudyMessage
      .replace('{{passage}}', passageLabel)
      .replace('{{link}}', link);
    Share.share({message}).catch(() => undefined);
  }, [table, drafts, passageLabel, t]);

  const renderHelpsForSection = (section: PrepSection) => {
    if (section === 'context' && intro) {
      return (
        <View
          style={[
            styles.helpCard,
            {backgroundColor: colors.card, borderColor: colors.border},
          ]}>
          <AppText
            scaleRole="compact"
            style={[styles.helpTitle, {color: colors.primary}]}>
            {p.bookIntroTitle}
          </AppText>
          <Text style={[styles.helpMeta, {color: colors.textTertiary}]}>
            {intro.author} · {intro.date}
          </Text>
          <Text style={[styles.helpBody, {color: colors.textSecondary}]}>
            {intro.context}
          </Text>
        </View>
      );
    }

    if (section === interpSlot) {
      return (
        <>
          {crossRows.length > 0 && (
            <View style={styles.helpGroup}>
              <View style={styles.crossRefsHeaderRow}>
                <AppText
                  scaleRole="compact"
                  style={[styles.helpGroupLabel, {color: colors.textTertiary}]}>
                  {p.crossRefsTitle}
                </AppText>
                {/* T8.4.2 — a quiet heads-up that this list was extended by
                    the reader's own offering; it never GATES the base 12. */}
                {isPremium &&
                  table &&
                  table.crossRefs.length > PREP_MAX_CROSS_REFS && (
                    <View
                      style={[
                        styles.exclusiveBadge,
                        {backgroundColor: colors.primary + '1a'},
                      ]}>
                      <Text
                        style={[styles.exclusiveText, {color: colors.primary}]}>
                        {p.exclusiveLabel}
                      </Text>
                    </View>
                  )}
              </View>
              {crossRows.map(row => (
                <TouchableOpacity
                  key={row.key}
                  style={[
                    styles.refCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  onPress={() => handleJump(row)}
                  disabled={!row.bookNav}
                  accessibilityRole="button"
                  accessibilityLabel={`${row.bookDisplay} ${row.chapter}:${row.verse}`}
                  accessibilityHint={p.openHint}>
                  <View style={styles.refHeader}>
                    <AppText
                      scaleRole="compact"
                      style={[styles.refLabel, {color: colors.primary}]}>
                      {`${row.bookDisplay} ${row.chapter}:${row.verse}`}
                    </AppText>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textTertiary}
                    />
                  </View>
                  {row.text != null && (
                    <ExpandableVerseText
                      style={[styles.refText, {color: colors.textSecondary}]}
                      numberOfLines={3}>
                      {row.text}
                    </ExpandableVerseText>
                  )}
                </TouchableOpacity>
              ))}
              {/* T8.4.2 — the free list is UNCHANGED (still 12); this is a
                  quiet invitation, never a degradation of what already
                  worked. */}
              {!isPremium && extraCrossRefCount > 0 && (
                <TouchableOpacity
                  style={[
                    styles.crossRefsMoreRow,
                    {
                      backgroundColor: colors.primary + '0F',
                      borderColor: colors.primary + '33',
                    },
                  ]}
                  onPress={handleUnlockMoreCrossRefs}
                  accessibilityRole="button"
                  accessibilityLabel={p.crossRefsMore.replace(
                    '{{n}}',
                    String(extraCrossRefCount),
                  )}>
                  <OfferingBadge
                    size={14}
                    color={colors.primary}
                    onPress={handleUnlockMoreCrossRefs}
                  />
                  <Text
                    style={[styles.crossRefsMoreText, {color: colors.primary}]}>
                    {p.crossRefsMore.replace(
                      '{{n}}',
                      String(extraCrossRefCount),
                    )}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {table && table.themeIds.length > 0 && (
            <View style={styles.helpGroup}>
              <AppText
                scaleRole="compact"
                style={[styles.helpGroupLabel, {color: colors.textTertiary}]}>
                {p.themesTitle}
              </AppText>
              <View style={styles.chipWrap}>
                {table.themeIds.map(id => {
                  const theme = getTheme(id);
                  const label =
                    (
                      t.themes.list as Record<
                        string,
                        {name: string; description: string}
                      >
                    )[id]?.name ?? id;
                  return (
                    <View
                      key={id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}>
                      {theme?.icon ? (
                        <Ionicons
                          name={theme.icon as keyof typeof Ionicons.glyphMap}
                          size={14}
                          color={colors.primary}
                        />
                      ) : null}
                      <Text style={[styles.chipText, {color: colors.text}]}>
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      );
    }

    if (section === 'christ' && christRows.length > 0) {
      return (
        <View style={styles.helpGroup}>
          {christRows.map(row => (
            <View
              key={row.id}
              style={[
                styles.helpCard,
                {backgroundColor: colors.card, borderColor: colors.border},
              ]}>
              <Text style={[styles.helpBody, {color: colors.textSecondary}]}>
                {row.note}
              </Text>
              {row.pointsTo && (
                <Text style={[styles.helpMeta, {color: colors.primary}]}>
                  → {row.pointsTo}
                  {row.versionAbbrev ? ` · ${row.versionAbbrev}` : ''}
                </Text>
              )}
              {row.fulfillmentText && (
                <ExpandableVerseText
                  style={[styles.helpBody, {color: colors.textTertiary}]}
                  numberOfLines={3}>
                  {row.fulfillmentText}
                </ExpandableVerseText>
              )}
            </View>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <>
      <Stack.Screen options={{headerShown: false}} />
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <LinearGradient
          colors={headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={[styles.header, {paddingTop: insets.top + spacing.md}]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={staticColors.white}
              />
            </TouchableOpacity>
            {/* T8.4.1 + T8.4.4 — grouped so both icon buttons sit together
                on the right; each is an isolated addition from its own
                tanda, neither reorders nor touches the other. */}
            <View style={styles.headerActionsRow}>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={handleOpenHistory}
                accessibilityRole="button"
                accessibilityLabel={
                  isPremium
                    ? t.prepHistory.entryLabel
                    : `${t.prepHistory.entryLabel} — ${t.offering.badgeA11y}`
                }>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={staticColors.white}
                />
                {!isPremium && (
                  <View
                    style={[
                      styles.historyBadge,
                      {backgroundColor: colors.primary},
                    ]}>
                    <Ionicons
                      name="leaf-outline"
                      size={9}
                      color={colors.onPrimary}
                    />
                  </View>
                )}
              </TouchableOpacity>
              {/* T8.4.4 — "Series de predicación" entry point. */}
              <TouchableOpacity
                style={styles.historyButton}
                onPress={handleOpenSeries}
                accessibilityRole="button"
                accessibilityLabel={
                  isPremium
                    ? t.prepSeries.entryLabel
                    : `${t.prepSeries.entryLabel} — ${t.offering.badgeA11y}`
                }>
                <Ionicons
                  name="albums-outline"
                  size={22}
                  color={staticColors.white}
                />
                {!isPremium && (
                  <View
                    style={[
                      styles.historyBadge,
                      {backgroundColor: colors.primary},
                    ]}>
                    <Ionicons
                      name="leaf-outline"
                      size={9}
                      color={colors.onPrimary}
                    />
                  </View>
                )}
              </TouchableOpacity>
              {/* Tanda 4 — "Banco de ilustraciones" entry point, opened in
                  insert mode (see handleOpenIllustrations above for the
                  placement judgment call). */}
              <TouchableOpacity
                style={styles.historyButton}
                onPress={handleOpenIllustrations}
                accessibilityRole="button"
                accessibilityLabel={
                  isPremium
                    ? t.prepIllustrations.entryLabel
                    : `${t.prepIllustrations.entryLabel} — ${t.offering.badgeA11y}`
                }>
                <Ionicons
                  name="bulb-outline"
                  size={22}
                  color={staticColors.white}
                />
                {!isPremium && (
                  <View
                    style={[
                      styles.historyBadge,
                      {backgroundColor: colors.primary},
                    ]}>
                    <Ionicons
                      name="leaf-outline"
                      size={9}
                      color={colors.onPrimary}
                    />
                  </View>
                )}
              </TouchableOpacity>
              {/* "Buscar por tema" — premium only, matches the topic
                  suggester's own gate below (no teaser for free readers,
                  same as that block already being invisible to them). */}
              {isPremium && (
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={handleOpenTopicSearch}
                  accessibilityRole="button"
                  accessibilityLabel={p.topicSuggestLabel}>
                  <Ionicons
                    name="search-outline"
                    size={22}
                    color={staticColors.white}
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => {
                  haptics.tap();
                  setGuideVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={p.guide.openLabel}>
                <Ionicons
                  name="help-circle-outline"
                  size={22}
                  color={staticColors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="reader" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {p.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {passageLabel || p.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        {/* Contextual hint (T: onboarding-contextual-hints) — see
            headerActionsHint above. Shown regardless of loading/empty/ready
            state, directly under the header row that carries those 3 icons. */}
        <View style={styles.hintWrapper}>
          <ContextualHintBanner
            visible={headerActionsHint.visible}
            onDismiss={headerActionsHint.dismiss}
            message={t.contextualHints.prepHeaderActions}
          />
        </View>

        {status === 'loading' && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        {status === 'empty' && (
          <View style={styles.centerState}>
            <Ionicons
              name="reader-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text style={[styles.stateText, {color: colors.textSecondary}]}>
              {p.missingPassage}
            </Text>
            {/* Topic suggester ("I have a topic, not a passage yet") — a
                PURE addition, premium only, reachable ONLY from this empty
                state. A free reader sees the exact same two elements above
                as before this addition — nothing here changes that path.
                100% offline/deterministic keyword matching against the
                already-curated theme taxonomy; see prepTopicSuggest.ts. */}
            {isPremium && (
              <View style={[centeredMaxWidth(), styles.topicSuggestWrap]}>
                <Text
                  style={[
                    styles.topicSuggestLabel,
                    {color: colors.textSecondary},
                  ]}>
                  {p.topicSuggestLabel}
                </Text>
                <TextInput
                  style={[
                    styles.topicSuggestInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  value={topicQuery}
                  onChangeText={setTopicQuery}
                  placeholder={p.topicSuggestPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="search"
                  accessibilityLabel={p.topicSuggestLabel}
                />
                {topicSuggestions.length > 0 && (
                  <View style={styles.topicSuggestList}>
                    {topicSuggestions.map(suggestion => (
                      <TouchableOpacity
                        key={suggestion.ref}
                        style={[
                          styles.topicSuggestRow,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => handleOpenTopicSuggestion(suggestion)}
                        accessibilityRole="button"
                        accessibilityLabel={formatSuggestionLabel(suggestion)}
                        accessibilityHint={p.openHint}>
                        <Text
                          style={[
                            styles.topicSuggestRefText,
                            {color: colors.primary},
                          ]}>
                          {formatSuggestionLabel(suggestion)}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {topicQuery.trim().length > 0 &&
                  topicSuggestions.length === 0 && (
                    <Text
                      style={[
                        styles.topicSuggestEmptyText,
                        {color: colors.textTertiary},
                      ]}>
                      {p.topicSuggestNoResults}
                    </Text>
                  )}
              </View>
            )}
          </View>
        )}

        {status === 'error' && (
          <View style={styles.centerState}>
            <Text style={[styles.stateText, {color: colors.textSecondary}]}>
              {p.error}
            </Text>
          </View>
        )}

        {status === 'ready' && table && (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {paddingBottom: insets.bottom + spacing.xl},
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={centeredMaxWidth()}>
              {/* Verse-range picker — widen the passage in place. */}
              <View
                style={[
                  styles.rangeCard,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <View style={styles.rangeHeaderRow}>
                  <Text
                    style={[styles.rangeTitle, {color: colors.textSecondary}]}>
                    {p.passageLabel}
                  </Text>
                  {reloading && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                </View>
                <View style={styles.rangeRow}>
                  <View style={styles.stepperGroup}>
                    <Text
                      style={[
                        styles.stepperLabel,
                        {color: colors.textTertiary},
                      ]}>
                      {p.rangeStartLabel}
                    </Text>
                    <View style={styles.stepper}>
                      <StepButton
                        icon="remove-circle-outline"
                        onPress={() =>
                          handleRange(adjustStart(range, -1, maxVerse))
                        }
                        disabled={!canDecreaseStart(range)}
                        color={colors.primary}
                        disabledColor={colors.textTertiary}
                        label={`${p.decrease} ${p.rangeStartLabel}`}
                      />
                      <Text
                        style={[styles.stepperValue, {color: colors.text}]}
                        accessibilityLabel={`${p.rangeStartLabel} ${range.start}`}>
                        {range.start}
                      </Text>
                      <StepButton
                        icon="add-circle-outline"
                        onPress={() =>
                          handleRange(adjustStart(range, 1, maxVerse))
                        }
                        disabled={!canIncreaseStart(range)}
                        color={colors.primary}
                        disabledColor={colors.textTertiary}
                        label={`${p.increase} ${p.rangeStartLabel}`}
                      />
                    </View>
                  </View>

                  <Text
                    style={[styles.rangeDash, {color: colors.textTertiary}]}>
                    –
                  </Text>

                  <View style={styles.stepperGroup}>
                    <Text
                      style={[
                        styles.stepperLabel,
                        {color: colors.textTertiary},
                      ]}>
                      {p.rangeEndLabel}
                    </Text>
                    <View style={styles.stepper}>
                      <StepButton
                        icon="remove-circle-outline"
                        onPress={() =>
                          handleRange(adjustEnd(range, -1, maxVerse))
                        }
                        disabled={!canDecreaseEnd(range)}
                        color={colors.primary}
                        disabledColor={colors.textTertiary}
                        label={`${p.decrease} ${p.rangeEndLabel}`}
                      />
                      <Text
                        style={[styles.stepperValue, {color: colors.text}]}
                        accessibilityLabel={`${p.rangeEndLabel} ${range.end}`}>
                        {range.end}
                      </Text>
                      <StepButton
                        icon="add-circle-outline"
                        onPress={() =>
                          handleRange(adjustEnd(range, 1, maxVerse))
                        }
                        disabled={!canIncreaseEnd(range, maxVerse)}
                        color={colors.primary}
                        disabledColor={colors.textTertiary}
                        label={`${p.increase} ${p.rangeEndLabel}`}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* The passage itself. */}
              <View
                style={[
                  styles.passageCard,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                {lines.map(line => (
                  <Text
                    key={line.verse}
                    style={[styles.passageText, {color: colors.text}]}>
                    <Text style={{color: colors.primary}}>{line.verse} </Text>
                    {line.text ?? ''}
                  </Text>
                ))}
              </View>

              {/* T8.4.2 — "Palabras clave en el idioma original": entirely
                  premium, passage-wide (every distinct Strong's number in the
                  range, deduplicated). */}
              <View
                style={[
                  styles.sectionCard,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="language-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <AppText
                    scaleRole="body"
                    style={[
                      styles.sectionLabel,
                      styles.flexOne,
                      {color: colors.text},
                    ]}>
                    {p.originalWordsTitle}
                  </AppText>
                  <View
                    style={[
                      styles.exclusiveBadge,
                      {backgroundColor: colors.primary + '1a'},
                    ]}>
                    <Text
                      style={[styles.exclusiveText, {color: colors.primary}]}>
                      {p.exclusiveLabel}
                    </Text>
                  </View>
                </View>

                {!isPremium ? (
                  <TouchableOpacity
                    style={styles.originalWordsLockedRow}
                    onPress={handleUnlockOriginalWords}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.originalWordsTitle} — ${t.offering.badgeA11y}`}>
                    <OfferingBadge
                      size={20}
                      color={colors.primary}
                      onPress={handleUnlockOriginalWords}
                    />
                    <Text
                      style={[
                        styles.helpBody,
                        styles.flexOne,
                        {color: colors.textSecondary},
                      ]}>
                      {p.originalWordsLockedBody}
                    </Text>
                  </TouchableOpacity>
                ) : originalsStatus === 'loading' ||
                  originalsStatus === 'idle' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : originalsStatus === 'notInstalled' ||
                  originalsStatus === 'error' ? (
                  <View style={styles.originalWordsDownloadWrap}>
                    <Text
                      style={[styles.helpBody, {color: colors.textSecondary}]}>
                      {originalsStatus === 'error'
                        ? t.originals.downloadError
                        : p.originalWordsNotInstalledBody}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.downloadButtonSmall,
                        {backgroundColor: colors.primary},
                        originalsDownloading && styles.downloadButtonDisabled,
                      ]}
                      onPress={handleDownloadOriginals}
                      disabled={originalsDownloading}
                      accessibilityRole="button"
                      accessibilityLabel={t.originals.download}>
                      {originalsDownloading ? (
                        <ActivityIndicator
                          color={colors.onPrimary}
                          size="small"
                        />
                      ) : (
                        <Ionicons
                          name="cloud-download-outline"
                          size={16}
                          color={colors.onPrimary}
                        />
                      )}
                      <AppText
                        scaleRole="compact"
                        style={[styles.exportText, {color: colors.onPrimary}]}>
                        {originalsDownloading
                          ? originalsProgress > 0
                            ? `${t.originals.downloading} ${Math.round(originalsProgress * 100)}%`
                            : t.originals.downloading
                          : t.originals.download}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ) : originalsStatus === 'empty' ? (
                  <Text
                    style={[styles.helpBody, {color: colors.textSecondary}]}>
                    {p.originalWordsEmpty}
                  </Text>
                ) : (
                  <>
                    <Text
                      style={[styles.helpMeta, {color: colors.textTertiary}]}>
                      {originalWordRows.length === 1
                        ? p.originalWordsCountOne
                        : p.originalWordsCount.replace(
                            '{{n}}',
                            String(originalWordRows.length),
                          )}
                    </Text>
                    {originalWordRows.map(row => (
                      <View
                        key={row.strongs}
                        style={[
                          styles.helpCard,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}>
                        <View style={styles.originalWordHeaderRow}>
                          <Text
                            style={[
                              styles.originalWordText,
                              {color: colors.text},
                            ]}>
                            {row.word}
                          </Text>
                          <View
                            style={[
                              styles.strongsChip,
                              {backgroundColor: colors.primary + '1A'},
                            ]}>
                            <Text
                              style={[
                                styles.strongsChipText,
                                {color: colors.primary},
                              ]}>
                              {strongsLabel(row.strongs)}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={[
                            styles.helpMeta,
                            {color: colors.textTertiary},
                          ]}>
                          {[row.translit, row.gloss]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                        {row.morphology ? (
                          <Text
                            style={[
                              styles.helpBody,
                              {color: colors.textSecondary},
                            ]}>
                            {row.morphology}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            styles.helpMeta,
                            {color: colors.textTertiary},
                          ]}>
                          {row.count > 1
                            ? `${row.count} ${t.originals.occurrences}`
                            : `1 ${t.originals.occurrencesOne}`}
                        </Text>
                      </View>
                    ))}
                    <Text
                      style={[
                        styles.attribution,
                        {color: colors.textTertiary},
                      ]}>
                      {t.originals.attribution}
                    </Text>
                  </>
                )}
              </View>

              {/* T8.4.3 — "Comparar versiones": 2-3 ALREADY-installed
                  translations of the whole passage range, side by side.
                  Entirely premium; reuses versionComparisonService verbatim. */}
              <View
                style={[
                  styles.sectionCard,
                  {backgroundColor: colors.card, borderColor: colors.border},
                ]}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="swap-horizontal-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <AppText
                    scaleRole="body"
                    style={[
                      styles.sectionLabel,
                      styles.flexOne,
                      {color: colors.text},
                    ]}>
                    {p.versionCompareTitle}
                  </AppText>
                  <View
                    style={[
                      styles.exclusiveBadge,
                      {backgroundColor: colors.primary + '1a'},
                    ]}>
                    <Text
                      style={[styles.exclusiveText, {color: colors.primary}]}>
                      {p.exclusiveLabel}
                    </Text>
                  </View>
                </View>

                {!isPremium ? (
                  <TouchableOpacity
                    style={styles.originalWordsLockedRow}
                    onPress={handleUnlockVersionCompare}
                    accessibilityRole="button"
                    accessibilityLabel={`${p.versionCompareTitle} — ${t.offering.badgeA11y}`}>
                    <OfferingBadge
                      size={20}
                      color={colors.primary}
                      onPress={handleUnlockVersionCompare}
                    />
                    <Text
                      style={[
                        styles.helpBody,
                        styles.flexOne,
                        {color: colors.textSecondary},
                      ]}>
                      {p.versionCompareLockedBody}
                    </Text>
                  </TouchableOpacity>
                ) : compareStatus === 'loading' || compareStatus === 'idle' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : compareStatus === 'error' ? (
                  <Text
                    style={[styles.helpBody, {color: colors.textSecondary}]}>
                    {p.versionCompareError}
                  </Text>
                ) : compareStatus === 'onlyOneInstalled' ? (
                  <View style={styles.originalWordsDownloadWrap}>
                    <Text
                      style={[styles.helpBody, {color: colors.textSecondary}]}>
                      {p.versionCompareOnlyOneBody}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.downloadButtonSmall,
                        {backgroundColor: colors.primary},
                      ]}
                      onPress={handleGoToVersionSettings}
                      accessibilityRole="button"
                      accessibilityLabel={p.versionCompareGoToSettings}>
                      <Ionicons
                        name="settings-outline"
                        size={16}
                        color={colors.onPrimary}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[styles.exportText, {color: colors.onPrimary}]}>
                        {p.versionCompareGoToSettings}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text
                      style={[styles.helpMeta, {color: colors.textTertiary}]}>
                      {p.versionCompareSelectHint}
                    </Text>
                    <View style={styles.chipWrap}>
                      {compareVersions.map(v => {
                        const isSelected = selectedCompareIds.some(
                          id => id.toLowerCase() === v.id.toLowerCase(),
                        );
                        const atCap =
                          !isSelected && selectedCompareIds.length >= 3;
                        return (
                          <TouchableOpacity
                            key={v.id}
                            onPress={() => handleToggleCompareVersion(v.id)}
                            disabled={atCap}
                            accessibilityRole="button"
                            accessibilityState={{
                              selected: isSelected,
                              disabled: atCap,
                            }}
                            accessibilityLabel={v.abbreviation}
                            style={[
                              styles.chip,
                              atCap && styles.chipAtCap,
                              {
                                backgroundColor: isSelected
                                  ? colors.primary + '1A'
                                  : colors.background,
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.border,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.chipText,
                                {
                                  color: isSelected
                                    ? colors.primary
                                    : colors.text,
                                },
                              ]}>
                              {v.abbreviation}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {compareRows.map(row => {
                      const present = new Set(
                        row.versions.map(v => v.versionId.toLowerCase()),
                      );
                      const omittedIds = selectedCompareIds.filter(
                        id => !present.has(id.toLowerCase()),
                      );
                      return (
                        <View
                          key={row.verseNumber}
                          style={styles.compareVerseBlock}>
                          <Text
                            style={[
                              styles.compareVerseLabel,
                              {color: colors.primary},
                            ]}>
                            {row.verseNumber}
                          </Text>
                          <View style={styles.compareVersionsRow}>
                            {row.versions.map(v => (
                              <View
                                key={v.versionId}
                                style={[
                                  styles.compareVersionCard,
                                  compareCardWidthStyle,
                                  {
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                  },
                                ]}>
                                <Text
                                  style={[
                                    styles.compareVersionAbbr,
                                    {color: colors.primary},
                                  ]}>
                                  {v.versionAbbr}
                                </Text>
                                <Text
                                  style={[
                                    styles.helpBody,
                                    {color: colors.text},
                                  ]}>
                                  {v.text}
                                </Text>
                              </View>
                            ))}
                          </View>
                          {omittedIds.map(id => {
                            const meta = compareVersions.find(
                              v => v.id.toLowerCase() === id.toLowerCase(),
                            );
                            const abbr = meta?.abbreviation ?? id.toUpperCase();
                            return (
                              <Text
                                key={`omit-${row.verseNumber}-${id}`}
                                style={[
                                  styles.helpMeta,
                                  {color: colors.textTertiary},
                                ]}>
                                {t.versionComparison.verseOmitted.replace(
                                  '{{version}}',
                                  abbr,
                                )}
                              </Text>
                            );
                          })}
                        </View>
                      );
                    })}
                  </>
                )}
              </View>

              {/* Tanda "plantillas de sermón" — the structure picker. Shown
                  ONLY while this entry is still empty (no section has real
                  prose yet, in-memory OR saved): once the preparer writes a
                  single word the choice locks in (stamped onto storage by
                  the very next save) and this card disappears, so switching
                  templates mid-preparation — which would leave already-
                  written prose sitting under a hidden section id — is never
                  offered as an option. Defaults to 'expository', unchanged. */}
              {status === 'ready' &&
                isPrepNotesEmpty({sections: drafts, updatedAt: 0}) && (
                  <View
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name="git-branch-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <AppText
                        scaleRole="body"
                        style={[styles.sectionLabel, {color: colors.text}]}>
                        {p.templatePickerTitle}
                      </AppText>
                    </View>
                    <Text
                      style={[
                        styles.sectionPrompt,
                        {color: colors.textSecondary},
                      ]}>
                      {p.templatePickerHint}
                    </Text>
                    <View style={styles.templateOptionsWrap}>
                      {PREP_TEMPLATE_IDS.map(id => {
                        const isSelected = template === id;
                        const tpl = p.templates[id];
                        return (
                          <TouchableOpacity
                            key={id}
                            onPress={() => {
                              haptics.tap();
                              setTemplate(id);
                            }}
                            accessibilityRole="button"
                            accessibilityState={{selected: isSelected}}
                            accessibilityLabel={`${tpl.label} — ${tpl.description}`}
                            style={[
                              styles.templateOption,
                              {
                                borderColor: isSelected
                                  ? colors.primary
                                  : colors.border,
                                backgroundColor: isSelected
                                  ? colors.primary + '14'
                                  : colors.background,
                              },
                            ]}>
                            <View style={styles.templateOptionHeaderRow}>
                              <Text
                                style={[
                                  styles.templateOptionLabel,
                                  {
                                    color: isSelected
                                      ? colors.primary
                                      : colors.text,
                                  },
                                ]}>
                                {tpl.label}
                              </Text>
                              {isSelected && (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={16}
                                  color={colors.primary}
                                />
                              )}
                            </View>
                            <Text
                              style={[
                                styles.templateOptionDesc,
                                {color: colors.textSecondary},
                              ]}>
                              {tpl.description}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

              {/* The outline scaffold — THIS entry's own template order. */}
              {templateSections.map(section => {
                const sc = p.sections[section];
                return (
                  <View
                    key={section}
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name={SECTION_ICONS[section]}
                        size={18}
                        color={colors.primary}
                      />
                      <AppText
                        scaleRole="body"
                        style={[styles.sectionLabel, {color: colors.text}]}>
                        {sc.label}
                      </AppText>
                    </View>
                    <Text
                      style={[
                        styles.sectionPrompt,
                        {color: colors.textSecondary},
                      ]}>
                      {sc.prompt}
                    </Text>

                    {renderHelpsForSection(section)}

                    <MarkdownFormatToolbar
                      value={drafts[section] ?? ''}
                      selection={
                        noteSelections[section] ?? {
                          start: (drafts[section] ?? '').length,
                          end: (drafts[section] ?? '').length,
                        }
                      }
                      inputRef={getNoteInputRef(section)}
                      onChangeText={value => handleNoteChange(section, value)}
                      onSelectionChange={sel =>
                        handleNoteSelectionChange(section, sel)
                      }
                      style={styles.markdownToolbar}
                    />
                    <TextInput
                      ref={getNoteInputRef(section)}
                      style={[
                        styles.noteInput,
                        {
                          color: colors.text,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      value={drafts[section] ?? ''}
                      onChangeText={value => handleNoteChange(section, value)}
                      onSelectionChange={e =>
                        handleNoteSelectionChange(
                          section,
                          e.nativeEvent.selection,
                        )
                      }
                      onBlur={() => handleNoteBlur(section)}
                      placeholder={p.notePlaceholder}
                      placeholderTextColor={colors.textTertiary}
                      multiline
                      textAlignVertical="top"
                      accessibilityLabel={sc.label}
                    />
                  </View>
                );
              })}

              {/* Autorrevisión antes de predicar — free, checkbox-only
                  structural self-check (see prepSelfReview.ts's own
                  guardrail docstring: no free text, ever, never graded,
                  never synced/exported/backed up). Shown ONLY once the
                  preparer has written something — an empty outline has
                  nothing yet to self-review. Placed directly above "Modo
                  púlpito", mirroring its collapsed-by-default drill-down
                  toggle pattern. */}
              {!isPrepNotesEmpty({sections: drafts, updatedAt: 0}) && (
                <View
                  style={[
                    styles.sectionCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons
                      name="checkmark-done-outline"
                      size={18}
                      color={colors.primary}
                    />
                    <AppText
                      scaleRole="body"
                      style={[
                        styles.sectionLabel,
                        styles.flexOne,
                        {color: colors.text},
                      ]}>
                      {sr.cardTitle}
                    </AppText>
                  </View>
                  <Text
                    style={[
                      styles.sectionPrompt,
                      {color: colors.textSecondary},
                    ]}>
                    {sr.cardSubtitle}
                  </Text>
                  <TouchableOpacity
                    style={styles.selfReviewToggleRow}
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut,
                      );
                      haptics.tap();
                      setSelfReviewVisible(v => !v);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${
                      selfReviewVisible ? sr.hideToggle : sr.showToggle
                    } · ${sr.progressLabel
                      .replace(
                        '{{checked}}',
                        String(Object.keys(selfReview.checkedIds).length),
                      )
                      .replace(
                        '{{total}}',
                        String(PREP_SELF_REVIEW_QUESTION_IDS.length),
                      )}`}
                    accessibilityState={{expanded: selfReviewVisible}}>
                    <View style={styles.selfReviewToggleLeft}>
                      <Text
                        style={[
                          styles.pulpitBreakdownToggleText,
                          {color: colors.primary},
                        ]}>
                        {selfReviewVisible ? sr.hideToggle : sr.showToggle}
                      </Text>
                      <Ionicons
                        name={selfReviewVisible ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.selfReviewProgress,
                        {color: colors.textSecondary},
                      ]}>
                      {sr.progressLabel
                        .replace(
                          '{{checked}}',
                          String(Object.keys(selfReview.checkedIds).length),
                        )
                        .replace(
                          '{{total}}',
                          String(PREP_SELF_REVIEW_QUESTION_IDS.length),
                        )}
                    </Text>
                  </TouchableOpacity>
                  {selfReviewVisible && (
                    <View style={styles.selfReviewList}>
                      {PREP_SELF_REVIEW_CATEGORIES.map(category => (
                        <View
                          key={category.id}
                          style={styles.selfReviewCategory}>
                          <Text
                            style={[
                              styles.selfReviewCategoryLabel,
                              {color: colors.textSecondary},
                            ]}>
                            {
                              sr.categories[
                                category.id as keyof typeof sr.categories
                              ].label
                            }
                          </Text>
                          {category.questionIds.map(id => {
                            const checked = Boolean(selfReview.checkedIds[id]);
                            return (
                              <TouchableOpacity
                                key={id}
                                style={styles.selfReviewQuestionRow}
                                onPress={() =>
                                  handleToggleSelfReviewQuestion(id, !checked)
                                }
                                accessibilityRole="checkbox"
                                accessibilityState={{checked}}
                                accessibilityLabel={sr.questions[id].label}>
                                <Ionicons
                                  name={checked ? 'checkbox' : 'square-outline'}
                                  size={20}
                                  color={
                                    checked
                                      ? colors.primary
                                      : colors.textSecondary
                                  }
                                />
                                <Text
                                  style={[
                                    styles.selfReviewQuestionText,
                                    {color: colors.text},
                                  ]}>
                                  {sr.questions[id].label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Modo púlpito — presenter view + duration estimate (premium). */}
              {(() => {
                const pulpitWords = countPrepNotesWords(
                  {sections: drafts, updatedAt: 0},
                  templateSections,
                );
                const pulpitEstimate = formatEstimatedDuration(
                  estimateMinutes(pulpitWords, pulpitWpm),
                  {
                    lessThanOneMinute: p.pulpitEstimateLessThanMinute,
                    aboutMinutes: p.pulpitEstimateLabel,
                  },
                );
                const pulpitBreakdown = estimateSectionDurations(
                  {sections: drafts, updatedAt: 0},
                  templateSections,
                  pulpitWpm,
                ).filter(s => s.words > 0);
                return (
                  <View
                    style={[
                      styles.sectionCard,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name="mic-outline"
                        size={18}
                        color={colors.primary}
                      />
                      {/* `flexOne` on the title matches the "Palabras clave"
                          and "Comparar versiones" cards above — without it
                          the EXCLUSIVO badge sat right next to the short
                          "Modo púlpito" title instead of pinned to the
                          card's right edge like the other two, an
                          inconsistent shell confirmed live on-device. */}
                      <AppText
                        scaleRole="body"
                        style={[
                          styles.sectionLabel,
                          styles.flexOne,
                          {color: colors.text},
                        ]}>
                        {p.pulpitTitle}
                      </AppText>
                      {!isPremium && (
                        <View
                          style={[
                            styles.exclusiveBadge,
                            {backgroundColor: colors.primary + '1a'},
                          ]}>
                          <Text
                            style={[
                              styles.exclusiveText,
                              {color: colors.primary},
                            ]}>
                            {p.exclusiveLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                    {!isPremium ? (
                      <TouchableOpacity
                        style={styles.pulpitLockedRow}
                        onPress={handleUnlockPulpit}
                        accessibilityRole="button"
                        accessibilityLabel={`${p.pulpitTitle} · ${t.offering.badgeA11y}`}>
                        <Text
                          style={[
                            styles.sectionPrompt,
                            styles.pulpitLockedText,
                            {color: colors.textSecondary},
                          ]}>
                          {p.pulpitLockedBody}
                        </Text>
                        <OfferingBadge
                          size={16}
                          color={colors.primary}
                          onPress={handleUnlockPulpit}
                        />
                      </TouchableOpacity>
                    ) : (
                      <>
                        {pulpitWords > 0 ? (
                          <>
                            <View style={styles.pulpitStatsRow}>
                              <Text
                                style={[
                                  styles.pulpitStat,
                                  {color: colors.text},
                                ]}>
                                {p.pulpitWordCount.replace(
                                  '{{n}}',
                                  String(pulpitWords),
                                )}
                              </Text>
                              <Text
                                style={[
                                  styles.pulpitStat,
                                  styles.pulpitEstimateStat,
                                  {color: colors.primary},
                                ]}>
                                {pulpitEstimate}
                              </Text>
                            </View>
                            <View style={styles.pulpitWpmRow}>
                              <Text
                                style={[
                                  styles.pulpitWpmLabel,
                                  {color: colors.textSecondary},
                                ]}>
                                {p.pulpitWpmLabel}
                              </Text>
                              <View style={styles.pulpitWpmControls}>
                                <StepButton
                                  icon="remove"
                                  onPress={() =>
                                    setPulpitWpm(w => clampWpm(w - WPM_STEP))
                                  }
                                  disabled={pulpitWpm <= WPM_MIN}
                                  color={colors.primary}
                                  disabledColor={colors.border}
                                  label={p.pulpitWpmLabel}
                                />
                                <Text
                                  style={[
                                    styles.pulpitWpmValue,
                                    {color: colors.text},
                                  ]}>
                                  {pulpitWpm}
                                </Text>
                                <StepButton
                                  icon="add"
                                  onPress={() =>
                                    setPulpitWpm(w => clampWpm(w + WPM_STEP))
                                  }
                                  disabled={pulpitWpm >= WPM_MAX}
                                  color={colors.primary}
                                  disabledColor={colors.border}
                                  label={p.pulpitWpmLabel}
                                />
                              </View>
                            </View>
                            {pulpitBreakdown.length > 1 && (
                              <>
                                <TouchableOpacity
                                  style={styles.pulpitBreakdownToggle}
                                  onPress={() => {
                                    LayoutAnimation.configureNext(
                                      LayoutAnimation.Presets.easeInEaseOut,
                                    );
                                    haptics.tap();
                                    setPulpitBreakdownVisible(v => !v);
                                  }}
                                  accessibilityRole="button"
                                  accessibilityLabel={
                                    pulpitBreakdownVisible
                                      ? p.pulpitBreakdownHide
                                      : p.pulpitBreakdownShow
                                  }
                                  accessibilityState={{
                                    expanded: pulpitBreakdownVisible,
                                  }}>
                                  <Text
                                    style={[
                                      styles.pulpitBreakdownToggleText,
                                      {color: colors.primary},
                                    ]}>
                                    {pulpitBreakdownVisible
                                      ? p.pulpitBreakdownHide
                                      : p.pulpitBreakdownShow}
                                  </Text>
                                  <Ionicons
                                    name={
                                      pulpitBreakdownVisible
                                        ? 'chevron-up'
                                        : 'chevron-down'
                                    }
                                    size={14}
                                    color={colors.primary}
                                  />
                                </TouchableOpacity>
                                {pulpitBreakdownVisible && (
                                  <View style={styles.pulpitBreakdownList}>
                                    {pulpitBreakdown.map(s => (
                                      <View
                                        key={s.section}
                                        style={styles.pulpitBreakdownRow}>
                                        <Text
                                          style={[
                                            styles.pulpitBreakdownLabel,
                                            {color: colors.textSecondary},
                                          ]}
                                          numberOfLines={1}>
                                          {p.sections[s.section].label}
                                        </Text>
                                        <Text
                                          style={[
                                            styles.pulpitBreakdownValue,
                                            {color: colors.text},
                                          ]}>
                                          {formatEstimatedDuration(s.minutes, {
                                            lessThanOneMinute:
                                              p.pulpitEstimateLessThanMinute,
                                            aboutMinutes: p.pulpitEstimateLabel,
                                          })}
                                        </Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <Text
                            style={[
                              styles.sectionPrompt,
                              {color: colors.textSecondary},
                            ]}>
                            {p.pulpitEmptyBody}
                          </Text>
                        )}
                        <TouchableOpacity
                          style={[
                            styles.pulpitEnterButton,
                            {backgroundColor: colors.primary},
                          ]}
                          onPress={handleOpenPulpit}
                          accessibilityRole="button"
                          accessibilityLabel={p.pulpitEnterButton}>
                          <Ionicons
                            name="expand-outline"
                            size={18}
                            color={colors.onPrimary}
                          />
                          <AppText
                            scaleRole="compact"
                            style={[
                              styles.pulpitEnterText,
                              {color: colors.onPrimary},
                            ]}>
                            {p.pulpitEnterButton}
                          </AppText>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                );
              })()}

              {/* Export the assembled outline + the preparer's notes. */}
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  {backgroundColor: colors.card, borderColor: colors.primary},
                ]}
                onPress={handleExport}
                accessibilityRole="button"
                accessibilityLabel={p.exportLabel}>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={18}
                  color={colors.primary}
                />
                <AppText
                  scaleRole="compact"
                  style={[styles.exportText, {color: colors.primary}]}>
                  {copied ? p.copied : p.exportLabel}
                </AppText>
              </TouchableOpacity>

              {/* T8.4.5 — export a designed PDF (premium). The free Markdown
                  export above is untouched; this is a pure addition, a
                  different export FORMAT of the same assembled content.
                  Locked for a free reader: leaf badge + "Exclusivo" pill,
                  tapping opens the offering sheet instead of generating. */}
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  // Only spread the leading content + badge apart when the
                  // locked badge is actually present; a premium reader has no
                  // badge, so the label should stay centered like the other
                  // export buttons instead of hugging the left edge.
                  !isPremium && styles.pdfExportButton,
                  {backgroundColor: colors.card, borderColor: colors.primary},
                ]}
                onPress={handleExportPdf}
                accessibilityRole="button"
                accessibilityLabel={
                  isPremium
                    ? p.exportPdfLabel
                    : `${p.exportPdfLabel} · ${t.offering.badgeA11y}`
                }
                accessibilityState={{busy: isExportingPdf}}>
                <View style={styles.pdfExportLeading}>
                  {isExportingPdf ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name="document-outline"
                      size={18}
                      color={colors.primary}
                    />
                  )}
                  <AppText
                    scaleRole="compact"
                    style={[styles.exportText, {color: colors.primary}]}>
                    {isExportingPdf ? p.exportPdfGenerating : p.exportPdfLabel}
                  </AppText>
                </View>
                {!isPremium && (
                  <View style={styles.pdfExportBadgeRow}>
                    <OfferingBadge
                      size={14}
                      color={colors.primary}
                      onPress={handleExportPdf}
                    />
                    <View
                      style={[
                        styles.exclusiveBadge,
                        {backgroundColor: colors.primary + '1a'},
                      ]}>
                      <Text
                        style={[styles.exclusiveText, {color: colors.primary}]}>
                        {p.exclusiveLabel}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Share the outline as a read-only study LINK (Sprint 109). */}
              <TouchableOpacity
                style={[
                  styles.exportButton,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                ]}
                onPress={handleShareStudy}
                accessibilityRole="button"
                accessibilityLabel={t.together.shareStudy}>
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={colors.onPrimary}
                />
                <AppText
                  scaleRole="compact"
                  style={[styles.exportText, {color: colors.onPrimary}]}>
                  {t.together.shareStudy}
                </AppText>
              </TouchableOpacity>

              {/* Pastoral guardrail. */}
              <View style={styles.guardrailWrap}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={colors.textTertiary}
                />
                <Text style={[styles.guardrail, {color: colors.textTertiary}]}>
                  {p.guardrail}
                </Text>
              </View>
              <Text style={[styles.savedHint, {color: colors.textTertiary}]}>
                {p.savedHint}
              </Text>
            </View>
          </ScrollView>
        )}

        {/* Tanda 3 — the export-format choice sheet. Only ever opened for a
            premium reader (handleExportPdf sends a free tap straight to the
            offering sheet instead), so every row it shows is unlocked in
            practice; onLockedAction stays wired for the sheet's own
            fully-controlled contract (pinned in PrepExportFormatSheet.test.tsx). */}
        <PrepExportFormatSheet
          visible={formatSheetVisible}
          isPremium={isPremium}
          onSelect={handleSelectExportFormat}
          onLockedAction={() => {
            setFormatSheetVisible(false);
            openOfferingSheet();
          }}
          onClose={() => setFormatSheetVisible(false)}
        />

        <FeatureGuideModal
          visible={guideVisible}
          onClose={() => setGuideVisible(false)}
          {...getFeatureGuideContent('prepTable', t)}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  // Horizontal inset only (no background/border) so this renders as
  // nothing at all while ContextualHintBanner is null.
  hintWrapper: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  backButton: {},
  headerActionsRow: {flexDirection: 'row'},
  historyButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyBadge: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextRow: {flexDirection: 'row', alignItems: 'center'},
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: staticColors.glassWhite18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.white,
    opacity: 0.85,
    fontSize: fontSizes.sm,
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes.xl,
    fontWeight: '700',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  stateText: {fontSize: fontSizes.md, textAlign: 'center'},
  content: {padding: spacing.lg},
  rangeCard: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rangeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rangeTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.md,
  },
  stepperGroup: {alignItems: 'center', gap: spacing.xs},
  stepperLabel: {fontSize: fontSizes.xs},
  stepper: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  stepButton: {padding: spacing.xs},
  stepperValue: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  rangeDash: {fontSize: fontSizes.lg, marginBottom: spacing.sm},
  passageCard: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  passageText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    // paddingRight (not marginRight) so Android's Text clip rect extends to give
    // an overhanging last glyph room to paint — left-aligned here, so no justify
    // concern (see the reader's Sprint 110 rationale).
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  sectionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionLabel: {fontWeight: '700', fontSize: fontSizes.md},
  sectionPrompt: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.45,
    marginBottom: spacing.md,
  },
  pulpitLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pulpitStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  pulpitStat: {fontSize: fontSizes.md, fontWeight: '600'},
  pulpitEstimateStat: {fontWeight: '800'},
  pulpitLockedText: {flex: 1, marginBottom: 0},
  pulpitWpmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  pulpitWpmLabel: {fontSize: fontSizes.sm},
  pulpitWpmControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pulpitWpmValue: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  pulpitBreakdownToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  pulpitBreakdownToggleText: {fontSize: fontSizes.sm, fontWeight: '600'},
  pulpitBreakdownList: {marginTop: spacing.sm, gap: spacing.xs},
  pulpitBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pulpitBreakdownLabel: {fontSize: fontSizes.sm, flexShrink: 1},
  pulpitBreakdownValue: {fontSize: fontSizes.sm, fontWeight: '700'},
  pulpitEnterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  pulpitEnterText: {
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  selfReviewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  selfReviewToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  selfReviewProgress: {fontSize: fontSizes.sm, fontWeight: '600'},
  selfReviewList: {marginTop: spacing.md, gap: spacing.md},
  selfReviewCategory: {gap: spacing.xs},
  selfReviewCategoryLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selfReviewQuestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selfReviewQuestionText: {
    flex: 1,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.45,
  },
  helpGroup: {marginBottom: spacing.md, gap: spacing.sm},
  helpGroupLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helpCard: {
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  helpTitle: {fontWeight: '700', fontSize: fontSizes.sm},
  helpMeta: {fontSize: fontSizes.xs},
  helpBody: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.45,
  },
  refCard: {
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  refHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  refLabel: {fontWeight: '700', fontSize: fontSizes.sm},
  refText: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.45,
    // paddingRight (see passageText): extends the Android Text clip rect.
    paddingRight: verseTextRightSlack(fontSizes.sm),
  },
  chipWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {fontSize: fontSizes.sm, fontWeight: '600'},
  chipAtCap: {opacity: 0.5},
  templateOptionsWrap: {gap: spacing.sm},
  templateOption: {
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  templateOptionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateOptionLabel: {fontWeight: '700', fontSize: fontSizes.sm},
  templateOptionDesc: {
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * 1.4,
    marginTop: 2,
  },
  flexOne: {flex: 1},
  crossRefsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exclusiveBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  exclusiveText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  crossRefsMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  crossRefsMoreText: {fontSize: fontSizes.sm, fontWeight: '700', flex: 1},
  originalWordsLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  originalWordsDownloadWrap: {gap: spacing.sm, alignItems: 'flex-start'},
  downloadButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  downloadButtonDisabled: {opacity: 0.7},
  originalWordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  originalWordText: {fontSize: fontSizes.lg, fontWeight: '700'},
  strongsChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  strongsChipText: {fontSize: fontSizes.xs, fontWeight: '800'},
  attribution: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  compareVerseBlock: {marginBottom: spacing.md, gap: spacing.xs},
  compareVerseLabel: {fontWeight: '700', fontSize: fontSizes.sm},
  compareVersionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  compareVersionCard: {
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  compareVersionCardFull: {flexBasis: '100%'},
  compareVersionCardHalf: {flexBasis: '48%', flexGrow: 1},
  compareVersionCardThird: {flexBasis: '31%', flexGrow: 1},
  compareVersionAbbr: {
    fontSize: fontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  markdownToolbar: {marginBottom: spacing.xs},
  noteInput: {
    minHeight: 88,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.4,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  exportText: {fontWeight: '700', fontSize: fontSizes.md},
  // T8.4.5 — PDF export button: same base look as `exportButton`, but
  // `space-between` so the locked state's leaf badge + "Exclusivo" pill can
  // sit at the trailing edge instead of centered with the label.
  pdfExportButton: {
    justifyContent: 'space-between',
  },
  pdfExportLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pdfExportBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  guardrailWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  guardrail: {
    flex: 1,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * 1.5,
    fontStyle: 'italic',
  },
  savedHint: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  // Topic suggester (empty state, premium only) — see the status === 'empty'
  // block above.
  topicSuggestWrap: {width: '100%', marginTop: spacing.lg, gap: spacing.sm},
  topicSuggestLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  topicSuggestInput: {
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.md,
  },
  topicSuggestList: {gap: spacing.sm},
  topicSuggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  topicSuggestRefText: {fontWeight: '700', fontSize: fontSizes.md},
  topicSuggestEmptyText: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
