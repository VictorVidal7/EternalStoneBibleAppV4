/**
 * 📖 WORD STUDY SCREEN — the visual concordance for one original-language word
 * (flagship #2).
 *
 * Seeded with a Strong's number, it shows that word's lexicon entry, how often
 * it occurs, how those occurrences spread across the books (a bar chart), its
 * first and last appearance, and the full tappable occurrence list. The
 * chart-shaping is the pure {@link buildBookBars}; this layers the theme palette,
 * the chart primitive, and reader navigation on top.
 *
 * Lives inside the tab navigator (href:null) so pressing back returns to the
 * reader via backBehavior="history" instead of dropping to Home. Reached from
 * the original-languages sheet's lexicon card; deep-linkable as
 * eternalbible://features/word-study?strongs=G25&version=RVR1960.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {getBookById} from '@/constants/bible';
import {MiniBarChart} from '@components/charts/MiniBarChart';
import {ContextualHintBanner} from '@components/hints/ContextualHintBanner';
import {useContextualHint} from '@hooks/useContextualHint';
import {usePremium} from '@context/PremiumContext';
import {useOfferingSheet} from '@context/OfferingSheetContext';
import {
  isOriginalsInstalled,
  occurrenceRef,
  strongsLabel,
  type StrongsOccurrence,
} from '@/features/study/originals';
import {bookLangForVersion} from '@/features/study/christConnections';
import {
  buildBookBars,
  distinctBookCount,
  getOccurrenceSnippet,
  getWordStudy,
  getWordStudyBookOccurrences,
  occurrenceSnippetKey,
  testamentTotals,
  type WordStudy,
} from '@/features/study/wordStudy';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type Status = 'loading' | 'notInstalled' | 'ready' | 'empty';

// Occurrence lists run 200-500 rows; fetching a verse snippet for every row
// up front would be 200-500 DB round trips most of which never scroll into
// view. Instead only this many rows (from the top of whatever list is
// currently showing) get a resolved snippet, growing by the same amount each
// time the list is scrolled (see `onMomentumScrollEnd` below).
const SNIPPET_WINDOW = 30;

export default function WordStudyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const {isPremium} = usePremium();
  const {open: openOfferingSheet} = useOfferingSheet();
  const w = t.wordStudy;
  const o = t.originals;
  const params = useLocalSearchParams<{
    strongs?: string;
    version?: string;
    gloss?: string;
  }>();
  const strongs = (params.strongs ?? '').trim();
  const version = params.version;
  const seedGloss = params.gloss?.trim() || null;
  // Verse references follow the reading version's language (RVR1960 → "Juan"),
  // matching Home's book-name pattern. Falls back to the UI language (not a
  // hard 'en') when `version` is missing/unrecognized, so a Spanish-first
  // install never shows English book names by silent default — this is the
  // root cause of the "Última aparición" field showing "Isaiah" instead of
  // "Isaías": it wasn't that field alone, `bookLang` itself was 'en' for the
  // whole screen whenever the version id didn't resolve.
  const bookLang = bookLangForVersion(version, language);

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : ['#4f46e5', '#7c3aed', '#a855f7']
  ) as [string, string, ...string[]];

  // Contextual hint (T: contextual-hints-expansion) — the distribution bar
  // chart looks purely decorative but each bar is tappable (see bookFilter
  // below); called unconditionally alongside the screen's other hooks (no
  // early return on this screen precedes it) even though the banner itself
  // only renders once the chart exists (bars.length > 1, below).
  const barChartHint = useContextualHint('wordStudyBarChart');
  const [status, setStatus] = useState<Status>('loading');
  const [study, setStudy] = useState<WordStudy | null>(null);
  // The Strong's definition is English-only; in a Spanish UI it hides behind
  // this toggle so the card stays Spanish.
  const [defExpanded, setDefExpanded] = useState(false);
  // Tap a distribution bar to filter the occurrence list to that book (Ficha
  // #14 — the bars used to be purely decorative). `null` = no filter.
  const [bookFilter, setBookFilter] = useState<number | null>(null);
  // The selected book's occurrences, fetched FRESH and scoped to that book
  // (never a client-side narrowing of `study.occurrences`, which is globally
  // capped in canonical book order — see wordStudy.ts). `null` while no
  // filter is active or the fetch hasn't resolved yet.
  const [filterOccurrences, setFilterOccurrences] = useState<
    StrongsOccurrence[] | null
  >(null);
  const [filterLoading, setFilterLoading] = useState(false);
  // How many rows (from the top of whatever occurrence list is currently
  // showing) have a resolved verse snippet fetched/requested for them —
  // grows on scroll, resets whenever the underlying list changes wholesale
  // (a new Strong's number or a new book filter) so it never keeps fetching
  // against a list that's no longer displayed.
  const [snippetWindow, setSnippetWindow] = useState(SNIPPET_WINDOW);
  // Resolved verse text per occurrence, keyed by `occurrenceSnippetKey` —
  // persists across window growth (a row fetched once is never re-fetched),
  // cleared alongside the window reset above.
  const [snippetCache, setSnippetCache] = useState<
    Record<string, string | null>
  >({});

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setStudy(null);
    setDefExpanded(false);
    setBookFilter(null);
    (async () => {
      const installed = await isOriginalsInstalled();
      if (cancelled) return;
      if (!installed) {
        setStatus('notInstalled');
        return;
      }
      const data = await getWordStudy(strongs);
      if (cancelled) return;
      setStudy(data);
      setStatus(data.count > 0 ? 'ready' : 'empty');
    })();
    return () => {
      cancelled = true;
    };
  }, [strongs]);

  // Fetch the selected book's real, complete occurrence list whenever the
  // filter changes — replacing (not narrowing) the displayed list. Clearing
  // the filter (bookFilter → null) simply reverts to `study.occurrences`
  // below, no fetch needed.
  useEffect(() => {
    if (bookFilter === null) {
      setFilterOccurrences(null);
      setFilterLoading(false);
      return;
    }
    let cancelled = false;
    setFilterLoading(true);
    (async () => {
      const occs = await getWordStudyBookOccurrences(strongs, bookFilter);
      if (cancelled) return;
      setFilterOccurrences(occs);
      setFilterLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [strongs, bookFilter]);

  // The displayed occurrence list is a wholly different array whenever the
  // Strong's number or the book filter changes (never a client-side
  // narrowing of the previous one — see the effect above) — so both the
  // snippet window and its cache reset here rather than trying to reconcile
  // stale keys against a new list.
  useEffect(() => {
    setSnippetWindow(SNIPPET_WINDOW);
    setSnippetCache({});
  }, [strongs, bookFilter]);

  const bars = useMemo(
    () => (study ? buildBookBars(study.distribution, bookLang) : []),
    [study, bookLang],
  );
  const selectedBarIndex =
    bookFilter === null ? null : bars.findIndex(b => b.book_id === bookFilter);
  const filteredOccurrences =
    bookFilter === null
      ? (study?.occurrences ?? [])
      : (filterOccurrences ?? []);
  // The TRUE total for the current view — the grand total when unfiltered
  // (unchanged from before), or the book's real, uncapped count from the
  // distribution aggregate when filtered. Comparing against this (rather
  // than just "did the fetch hit its cap") means the "showing the first N"
  // disclosure is honest even in the rare case a single book's occurrences
  // of one Strong's number exceed the defensive fetch cap.
  const totalForView =
    bookFilter === null
      ? (study?.count ?? 0)
      : (study?.distribution.find(d => d.book_id === bookFilter)?.count ??
        filteredOccurrences.length);
  const filterBookName = useMemo(() => {
    if (bookFilter === null) return null;
    const book = getBookById(bookFilter);
    if (!book) return null;
    return bookLang === 'en' ? book.nameEn : book.name;
  }, [bookFilter, bookLang]);

  // Resolve verse snippets for the rows currently within `snippetWindow` —
  // never the whole (possibly 200-500-row) list. Already-cached rows are
  // skipped, so growing the window (scroll) only fetches the newly-exposed
  // slice, and switching version/strongs/bookFilter starts a fresh window
  // (see the reset effect above) rather than mixing snippets across lists.
  useEffect(() => {
    const windowed = filteredOccurrences.slice(0, snippetWindow);
    const toFetch = windowed.filter(
      occ => !(occurrenceSnippetKey(occ) in snippetCache),
    );
    if (toFetch.length === 0) return;
    let cancelled = false;
    (async () => {
      const resolvedVersion = version ?? 'RVR1960';
      const entries = await Promise.all(
        toFetch.map(
          async occ =>
            [
              occurrenceSnippetKey(occ),
              await getOccurrenceSnippet(occ, resolvedVersion),
            ] as const,
        ),
      );
      if (cancelled) return;
      setSnippetCache(prev => {
        const next = {...prev};
        for (const [key, text] of entries) next[key] = text;
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
    // `snippetCache` is deliberately NOT a dependency: it's read here only to
    // skip already-fetched rows, not a trigger — depending on it would
    // re-run this effect every time it's written, an infinite fetch loop.
  }, [filteredOccurrences, snippetWindow, version]);

  // Grows the snippet window by one page — a coarse "getting close to the
  // bottom" heuristic (whole-screen momentum-scroll-end, not a precise
  // near-the-occurrence-list-end check), matching the task's brief for this
  // tanda. Capped at `totalForView` (the TRUE total for whatever's showing,
  // known as soon as `study`/its distribution resolve — unlike
  // `filteredOccurrences.length`, which is transiently 0 while a book
  // filter's scoped fetch is still in flight) so a handful of stray flicks
  // can't balloon the window past the real list size and defeat the whole
  // point of windowing. Falls back to unclamped growth only while that true
  // total isn't known yet.
  const handleOccurrenceListScrollEnd = () => {
    setSnippetWindow(w =>
      totalForView > 0
        ? Math.min(w + SNIPPET_WINDOW, totalForView)
        : w + SNIPPET_WINDOW,
    );
  };

  const handleBarPress = (index: number) => {
    const bar = bars[index];
    if (!bar) return;
    haptics.tap();
    setBookFilter(prev => (prev === bar.book_id ? null : bar.book_id));
  };

  // Passes `strongs` along so the reader can show a discreet "original word ·
  // gloss" chip (Ficha #13) — the verse tint alone doesn't tell the user WHICH
  // Spanish word corresponds to it (RVR1960 carries no word-for-word tagging;
  // the reader resolves the exact per-occurrence gloss itself, keeping this
  // tap instant rather than awaiting a DB lookup before navigating).
  const openInReader = (occ: StrongsOccurrence) => {
    const book = getBookById(occ.book_id);
    if (!book) return;
    haptics.tap();
    const name = bookLang === 'en' ? book.nameEn : book.name;
    router.push(
      `/verse/${name}/${occ.chapter}?verse=${occ.verse}&strongs=${encodeURIComponent(strongs)}` as never,
    );
  };

  const lex = study?.lexicon ?? null;
  const lemma = lex?.lemma ?? null;
  const bookCount = study ? distinctBookCount(study.distribution) : 0;

  // A single-book distribution degenerates a bar chart to one bar — a stat
  // line reads better than a chart with nothing to compare against.
  const singleBookName = useMemo(() => {
    if (bars.length !== 1) return null;
    const book = getBookById(bars[0].book_id);
    if (!book) return null;
    return bookLang === 'en' ? book.nameEn : book.name;
  }, [bars, bookLang]);

  const countLabel = study
    ? `${study.count} ${
        study.count === 1 ? w.occurrencesOne : w.occurrences
      } · ${
        bookCount === 1
          ? w.inBooksOne
          : w.inBooks.replace('{{n}}', String(bookCount))
      }`
    : '';

  // Old/new testament split (T: word-study-testament-split) — summed across
  // the FULL distribution (never just the top-8 charted bars), so a word
  // that's charted as mostly-Matthew but also appears twice in Romans still
  // shows an honest NT total. Reading as fully one-testament (e.g. "AT 248 ·
  // NT 0" for a Hebrew word) is a correct, expected result, not a bug.
  const testamentSummary = useMemo(() => {
    if (!study || study.distribution.length === 0) return null;
    const totals = testamentTotals(study.distribution);
    return w.testamentSplit
      .replace('{{ot}}', String(totals.old))
      .replace('{{nt}}', String(totals.new));
  }, [study, w.testamentSplit]);

  // Testament → theme-token color for the distribution chart, mirroring the
  // same accent/secondary token pair the constellation screen's testament
  // hues use, for a consistent OT/NT visual vocabulary across the app.
  const coloredBars = useMemo(
    () =>
      bars.map(b => ({
        ...b,
        color: b.testament === 'new' ? colors.accent : colors.secondary,
      })),
    [bars, colors.accent, colors.secondary],
  );

  const renderOccurrence = (occ: StrongsOccurrence, key: string) => {
    const snippet = snippetCache[occurrenceSnippetKey(occ)];
    return (
      <TouchableOpacity
        key={key}
        style={[styles.occRow, {borderTopColor: colors.border}]}
        onPress={() => openInReader(occ)}
        accessibilityRole="button"
        accessibilityLabel={occurrenceRef(occ, bookLang)}>
        <View style={styles.occHeaderLine}>
          <Text
            style={[styles.occRef, {color: colors.primary}]}
            numberOfLines={1}>
            {occurrenceRef(occ, bookLang)}
          </Text>
          <Text
            style={[styles.occWord, {color: colors.textSecondary}]}
            numberOfLines={1}>
            {occ.word}
          </Text>
        </View>
        {snippet ? (
          <Text
            style={[styles.occSnippet, {color: colors.textSecondary}]}
            numberOfLines={2}>
            {snippet}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <LinearGradient
        colors={headerGradient}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[styles.header, {paddingTop: insets.top + 12}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.bible.back}>
          <Ionicons name="arrow-back" size={24} color={staticColors.white} />
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Ionicons name="search" size={26} color={staticColors.white} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{w.title}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {lemma ? `${lemma} · ${strongsLabel(strongs)}` : w.subtitle}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {status === 'loading' ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : status === 'notInstalled' ? (
        <View style={styles.centerState}>
          <Ionicons
            name="language-outline"
            size={40}
            color={colors.textTertiary}
          />
          <Text style={[styles.stateTitle, {color: colors.text}]}>
            {w.notInstalledTitle}
          </Text>
          <Text style={[styles.stateBody, {color: colors.textSecondary}]}>
            {w.notInstalledBody}
          </Text>
        </View>
      ) : status === 'empty' || !study ? (
        <View style={styles.centerState}>
          <Ionicons name="search" size={36} color={colors.textTertiary} />
          <Text style={[styles.stateBody, {color: colors.textSecondary}]}>
            {w.empty}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.body,
            {paddingBottom: insets.bottom + 100},
          ]}
          onMomentumScrollEnd={handleOccurrenceListScrollEnd}>
          {/* Lexicon card: lemma + Strong's + gloss + definition. */}
          <View
            style={[
              styles.lexCard,
              {backgroundColor: colors.surface, borderColor: colors.primary},
            ]}>
            <View style={styles.lexHeader}>
              <Text style={[styles.lemma, {color: colors.text}]}>
                {lemma ?? strongsLabel(strongs)}
              </Text>
              <View
                style={[
                  styles.strongsChip,
                  {backgroundColor: colors.primary + '1A'},
                ]}>
                <Text style={[styles.strongsChipText, {color: colors.primary}]}>
                  {strongsLabel(strongs)}
                </Text>
              </View>
            </View>
            {lex?.translit ? (
              <Text style={[styles.translit, {color: colors.textTertiary}]}>
                {lex.translit}
              </Text>
            ) : null}
            {seedGloss ? (
              <Text style={[styles.gloss, {color: colors.textSecondary}]}>
                {seedGloss}
              </Text>
            ) : null}
            {language === 'es' ? (
              lex?.definition_es ? (
                <Text
                  style={[styles.definition, {color: colors.textSecondary}]}>
                  {lex.definition_es}
                </Text>
              ) : lex?.definition ? (
                <>
                  <TouchableOpacity
                    style={styles.defToggle}
                    onPress={() => {
                      haptics.tap();
                      setDefExpanded(v => !v);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t.originals.definitionEnglish}
                    accessibilityState={{expanded: defExpanded}}>
                    <Text
                      style={[styles.defToggleText, {color: colors.primary}]}>
                      {t.originals.definitionEnglish}
                    </Text>
                    <Ionicons
                      name={defExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  {defExpanded ? (
                    <Text
                      style={[
                        styles.definition,
                        {color: colors.textSecondary},
                      ]}>
                      {lex.definition}
                    </Text>
                  ) : null}
                </>
              ) : null
            ) : lex?.definition ? (
              <Text style={[styles.definition, {color: colors.textSecondary}]}>
                {lex.definition}
              </Text>
            ) : null}

            {lex?.kjv_def ? (
              <View
                style={[styles.kjvSection, {borderTopColor: colors.border}]}>
                <View style={styles.kjvHeaderRow}>
                  <Text style={[styles.kjvLabel, {color: colors.text}]}>
                    {o.kjvGloss}
                  </Text>
                  <View
                    style={[
                      styles.exclusiveBadge,
                      {backgroundColor: colors.primary + '1a'},
                    ]}>
                    <Text
                      style={[styles.exclusiveText, {color: colors.primary}]}>
                      {o.exclusiveLabel}
                    </Text>
                  </View>
                </View>
                {isPremium ? (
                  <Text
                    style={[styles.definition, {color: colors.textSecondary}]}>
                    {lex.kjv_def}
                  </Text>
                ) : (
                  <TouchableOpacity
                    style={styles.kjvLockedRow}
                    onPress={() => {
                      haptics.tap();
                      openOfferingSheet();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`${o.kjvGloss} — ${t.offering.badgeA11y}`}>
                    <View
                      style={[
                        styles.kjvLockBadge,
                        {backgroundColor: colors.primary},
                      ]}>
                      <Ionicons
                        name="leaf-outline"
                        size={11}
                        color={colors.onPrimary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.kjvLockedText,
                        {color: colors.textSecondary},
                      ]}>
                      {o.kjvLocked}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            <Text style={[styles.countLabel, {color: colors.textTertiary}]}>
              {countLabel}
            </Text>
          </View>

          {/* Distribution across books. */}
          {bars.length === 1 && singleBookName ? (
            <TouchableOpacity
              style={[
                styles.section,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}
              onPress={() => study?.first && openInReader(study.first)}
              accessibilityRole="button"
              accessibilityLabel={w.distributionSingleBook.replace(
                '{{book}}',
                singleBookName,
              )}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                {w.distribution}
              </Text>
              {testamentSummary ? (
                <Text
                  style={[
                    styles.testamentSummary,
                    {color: colors.textTertiary},
                  ]}>
                  {testamentSummary}
                </Text>
              ) : null}
              <Text style={[styles.extentRef, {color: colors.primary}]}>
                {w.distributionSingleBook.replace('{{book}}', singleBookName)}
              </Text>
            </TouchableOpacity>
          ) : bars.length > 1 ? (
            <View
              style={[
                styles.section,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                {w.distribution}
              </Text>
              {testamentSummary ? (
                <Text
                  style={[
                    styles.testamentSummary,
                    {color: colors.textTertiary},
                  ]}>
                  {testamentSummary}
                </Text>
              ) : null}
              <MiniBarChart
                data={coloredBars}
                barColor={colors.primary}
                trackColor={colors.primary + '14'}
                labelColor={colors.textSecondary}
                valueColor={colors.textTertiary}
                onBarPress={handleBarPress}
                selectedIndex={selectedBarIndex}
              />
              {/* Contextual hint (T: contextual-hints-expansion) — see
                  barChartHint above. duration={0}: the feature being
                  explained IS tapping a bar, and this banner sits directly
                  below the chart, above the first/last-appearance cards —
                  an auto-dismiss while the user is exploring the bars would
                  shift those cards under a reaching finger, the same
                  layout-jump risk readerFocusMode's duration={0} avoids in
                  the reader. */}
              <ContextualHintBanner
                visible={barChartHint.visible}
                onDismiss={barChartHint.dismiss}
                message={t.contextualHints.wordStudyBarChart}
                duration={0}
              />
            </View>
          ) : null}

          {/* First & last appearance. */}
          {study.first && study.last ? (
            <View style={styles.extentRow}>
              <TouchableOpacity
                style={[
                  styles.extentCard,
                  {backgroundColor: colors.surface, borderColor: colors.border},
                ]}
                onPress={() => study.first && openInReader(study.first)}
                accessibilityRole="button"
                accessibilityLabel={`${w.firstAppearance}: ${occurrenceRef(
                  study.first,
                  bookLang,
                )}`}>
                <Text
                  style={[styles.extentLabel, {color: colors.textTertiary}]}>
                  {w.firstAppearance}
                </Text>
                <Text style={[styles.extentRef, {color: colors.primary}]}>
                  {occurrenceRef(study.first, bookLang)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.extentCard,
                  {backgroundColor: colors.surface, borderColor: colors.border},
                ]}
                onPress={() => study.last && openInReader(study.last)}
                accessibilityRole="button"
                accessibilityLabel={`${w.lastAppearance}: ${occurrenceRef(
                  study.last,
                  bookLang,
                )}`}>
                <Text
                  style={[styles.extentLabel, {color: colors.textTertiary}]}>
                  {w.lastAppearance}
                </Text>
                <Text style={[styles.extentRef, {color: colors.primary}]}>
                  {occurrenceRef(study.last, bookLang)}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Full occurrence list. */}
          <View
            style={[
              styles.section,
              {backgroundColor: colors.surface, borderColor: colors.border},
            ]}>
            <View style={styles.occHeaderRow}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                {w.occurrencesHeader}
              </Text>
              {filterBookName ? (
                <TouchableOpacity
                  onPress={() => {
                    haptics.tap();
                    setBookFilter(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${w.filteringByBook.replace(
                    '{{book}}',
                    filterBookName,
                  )} — ${w.clearFilter}`}
                  style={[
                    styles.filterChip,
                    {backgroundColor: colors.primary + '1a'},
                  ]}>
                  <Text
                    style={[styles.filterChipText, {color: colors.primary}]}>
                    {w.filteringByBook.replace('{{book}}', filterBookName)}
                  </Text>
                  <Ionicons
                    name="close-circle"
                    size={14}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              ) : null}
            </View>
            {filterLoading ? (
              <View style={styles.filterLoadingRow}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : (
              <>
                {filteredOccurrences.map((occ, i) =>
                  renderOccurrence(
                    occ,
                    `${occ.book_id}-${occ.chapter}-${occ.verse}-${i}`,
                  ),
                )}
                {filteredOccurrences.length > 0 &&
                totalForView > filteredOccurrences.length ? (
                  <Text style={[styles.moreNote, {color: colors.textTertiary}]}>
                    {w.moreOccurrences.replace(
                      '{{n}}',
                      String(filteredOccurrences.length),
                    )}
                  </Text>
                ) : null}
              </>
            )}
          </View>

          <Text style={[styles.attribution, {color: colors.textTertiary}]}>
            {w.attribution}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: staticColors.glassWhite20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  headerText: {flex: 1},
  headerTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '800',
    color: staticColors.white,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: staticColors.glassWhite90,
    fontWeight: '500',
    marginTop: 2,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  stateTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateBody: {fontSize: fontSizes.sm, textAlign: 'center', lineHeight: 20},
  body: {
    padding: spacing.lg,
    gap: spacing.lg,
    ...centeredMaxWidth(),
  },
  lexCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.base,
    gap: spacing.xs,
  },
  lexHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  lemma: {fontSize: fontSizes.xl, fontWeight: '800', flexShrink: 1},
  strongsChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  strongsChipText: {fontSize: fontSizes.xs, fontWeight: '800'},
  translit: {fontSize: fontSizes.sm, fontStyle: 'italic'},
  gloss: {fontSize: fontSizes.md, fontWeight: '600'},
  definition: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    paddingRight: verseTextRightSlack(fontSizes.sm),
  },
  defToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  defToggleText: {fontSize: fontSizes.sm, fontWeight: '700'},
  kjvSection: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  kjvHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  kjvLabel: {fontSize: fontSizes.sm, fontWeight: '700'},
  kjvLockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  kjvLockBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kjvLockedText: {fontSize: fontSizes.sm, flexShrink: 1},
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
  countLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  section: {
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    gap: spacing.md,
  },
  sectionTitle: {fontSize: fontSizes.base, fontWeight: '800'},
  testamentSummary: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  occHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['0.5'],
  },
  filterChipText: {fontSize: fontSizes.xs, fontWeight: '700'},
  extentRow: {flexDirection: 'row', gap: spacing.md},
  extentCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.base,
    gap: spacing.xs,
  },
  extentLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  extentRef: {fontSize: fontSizes.base, fontWeight: '800'},
  occRow: {
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  occHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  occRef: {fontSize: fontSizes.sm, fontWeight: '700'},
  occWord: {fontSize: fontSizes.sm, flexShrink: 1, textAlign: 'right'},
  // The resolved verse snippet (T: word-study-snippets) — a secondary line
  // under the ref/word row, only rendered once its bounded-window fetch
  // resolves (see `snippetCache`/`SNIPPET_WINDOW` above); no per-row spinner
  // while it's pending.
  occSnippet: {
    fontSize: fontSizes.xs,
    lineHeight: 16,
    paddingRight: verseTextRightSlack(fontSizes.xs),
  },
  filterLoadingRow: {paddingVertical: spacing.lg, alignItems: 'center'},
  moreNote: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  attribution: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
