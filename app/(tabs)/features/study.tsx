/**
 * 📖 STUDY MODE — verse deep-dive (Sprint 61)
 *
 * A full-screen "study" view for a single verse that goes beyond the quick
 * cross-references sheet: it shows the verse's TWO-WAY connection web — the
 * curated parallels it points TO ("References") AND the verses that point AT it
 * ("Referenced by", from the inverted cross-reference map) — each with its text
 * and tappable to jump straight into the reader.
 *
 * Reached from the cross-references sheet ("Study mode →") and via the deep link
 * eternalbible://features/study?book=John&chapter=3&verse=16. 100% JS: connection
 * math is the curated pure src/features/study/studyConnections.ts merged with the
 * broad bundled cross-reference web via getMergedStudyConnections (RUMBO #3);
 * verse text is fetched from the SQLite Bible DB; zero new native, zero Firestore.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {Stack, useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import type {StudyConnections} from '@/features/study/studyConnections';
import {getMergedStudyConnections} from '@/features/study/crossReferences';
import {
  getChristConnectionById,
  parseChristRef,
  formatChristRefLabel,
  christLangForVersion,
  versionAbbrev,
} from '@/features/study/christConnections';
import {translations} from '@/i18n/translations';
import {logger} from '@lib/utils/logger';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type LoadStatus = 'loading' | 'ready' | 'error';

/** A resolved connection row (canonical key + display name + fetched text). */
interface StudyRow {
  key: string;
  bookId: number | null;
  bookDisplay: string;
  chapter: number;
  verse: number;
  text: string | null;
}

const VERSION_KEY = '@bible_version';

/** Resolve a canonical "EnglishBook/Chapter/Verse" key to a display row. */
async function resolveRow(
  key: string,
  version: string,
  language: 'es' | 'en',
): Promise<StudyRow> {
  const slash = key.indexOf('/');
  const bookName = slash >= 0 ? key.slice(0, slash) : key;
  const [chapterStr, verseStr] = (slash >= 0 ? key.slice(slash + 1) : '').split(
    '/',
  );
  const chapter = Number(chapterStr);
  const verse = Number(verseStr);
  const book = getBookByName(bookName);
  const bookDisplay = book
    ? language === 'en'
      ? book.nameEn
      : book.name
    : bookName;

  if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) {
    return {key, bookId: null, bookDisplay, chapter: 0, verse: 0, text: null};
  }
  try {
    const row = await bibleDB.getVerse(book.id, chapter, verse, version);
    return {
      key,
      bookId: book.id,
      bookDisplay,
      chapter,
      verse,
      text: row?.text ?? null,
    };
  } catch {
    return {key, bookId: book.id, bookDisplay, chapter, verse, text: null};
  }
}

export default function StudyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const s = t.study;

  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    verse?: string;
    version?: string;
  }>();
  const book = params.book ?? '';
  const chapter = Number(params.chapter ?? 0);
  const verse = Number(params.verse ?? 0);

  const [connections, setConnections] = useState<StudyConnections>({
    focus: null,
    references: [],
    referencedBy: [],
    totalConnections: 0,
  });

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [focusRow, setFocusRow] = useState<StudyRow | null>(null);
  const [references, setReferences] = useState<StudyRow[]>([]);
  const [referencedBy, setReferencedBy] = useState<StudyRow[]>([]);
  // "Christ in this passage" (Sprint 98) — a curated, faithful note for the
  // focus verse, with the fulfillment verse text in the selected version.
  const [christ, setChrist] = useState<{
    note: string;
    cardTitle: string;
    pointsToWord: string;
    pointsTo?: string;
    fulfillmentText?: string;
    versionAbbrev?: string;
    nav?: {book: string; chapter: number; verse: number};
  } | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus('loading');
      const version =
        params.version ??
        (await AsyncStorage.getItem(VERSION_KEY)) ??
        'RVR1960';
      // Book names follow the READING version's language, not the app interface
      // language: a verse shown in RVR1960 reads "2 Corintios 4:14", not
      // "2 Corinthians 4:14", even when the UI is English (and vice-versa) —
      // matching the verse text right beside it and the "Christ in this passage"
      // card below.
      const bookLang = christLangForVersion(version);
      // Curated two-way web + the broad bundled cross-reference web (RUMBO #3).
      const conns = await getMergedStudyConnections(book, chapter, verse);
      setConnections(conns);
      const focusKey = conns.focus ?? `${book}/${chapter}/${verse}`;
      const [focus, refs, refBy] = await Promise.all([
        resolveRow(focusKey, version, bookLang),
        Promise.all(
          conns.references.map(k => resolveRow(k, version, bookLang)),
        ),
        Promise.all(
          conns.referencedBy.map(k => resolveRow(k, version, bookLang)),
        ),
      ]);
      setFocusRow(focus);
      setReferences(refs);
      setReferencedBy(refBy);

      // "Christ in this passage" for the focus verse, when curated (S98). The
      // card speaks the SELECTED Bible version's language so it matches the
      // verse, even when the app interface language differs.
      const christLang = christLangForVersion(version);
      const cc = translations[christLang].christConnections;
      const focusBook = getBookByName(book);
      const conn = focusBook
        ? getChristConnectionById(focusBook.id, chapter, verse)
        : null;
      const note = conn
        ? (cc.notes as Record<string, string>)[conn.id]
        : undefined;
      if (conn && note) {
        let pointsTo: string | undefined;
        let fulfillmentText: string | undefined;
        let nav: {book: string; chapter: number; verse: number} | undefined;
        if (conn.fulfillment) {
          const fp = parseChristRef(conn.fulfillment);
          const fbook = fp ? getBookByName(fp.book) : undefined;
          if (fp && fbook) {
            pointsTo = formatChristRefLabel(conn.fulfillment, christLang);
            nav = {
              book: christLang === 'en' ? fbook.nameEn : fbook.name,
              chapter: fp.chapter,
              verse: fp.verse,
            };
            const frow = await bibleDB.getVerse(
              fbook.id,
              fp.chapter,
              fp.verse,
              version,
            );
            fulfillmentText = frow?.text ?? undefined;
          }
        }
        setChrist({
          note,
          cardTitle: cc.cardTitle,
          pointsToWord: cc.pointsTo,
          pointsTo,
          fulfillmentText,
          versionAbbrev: versionAbbrev(version),
          nav,
        });
      } else {
        setChrist(null);
      }
      setStatus('ready');
    } catch (err) {
      logger.error('Study load failed', err as Error, {
        component: 'StudyScreen',
        action: 'load',
      });
      setStatus('error');
    }
  }, [params.version, book, chapter, verse]);

  useEffect(() => {
    load();
  }, [load]);

  const handleJump = useCallback(
    (row: StudyRow) => {
      if (row.bookId == null) return;
      haptics.tap();
      router.push({
        pathname: `/verse/${row.bookDisplay}/${row.chapter}` as never,
        params: {verse: row.verse},
      });
    },
    [router],
  );

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];
  const hasConnections = references.length > 0 || referencedBy.length > 0;

  const renderRow = (row: StudyRow, section: string) => {
    const ref = `${row.bookDisplay} ${row.chapter}:${row.verse}`;
    return (
      <TouchableOpacity
        key={`${section}-${row.key}`}
        style={[
          styles.refCard,
          {backgroundColor: colors.card, borderColor: colors.border},
        ]}
        onPress={() => handleJump(row)}
        disabled={row.bookId == null}
        accessibilityRole="button"
        accessibilityLabel={ref}
        accessibilityHint={s.openHint}>
        <View style={styles.refHeader}>
          <AppText
            scaleRole="compact"
            style={[styles.refLabel, {color: colors.primary}]}>
            {ref}
          </AppText>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        </View>
        <Text
          style={[styles.refText, {color: colors.textSecondary}]}
          numberOfLines={3}>
          {row.text ?? s.missingText}
        </Text>
      </TouchableOpacity>
    );
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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.bible.back}>
            <Ionicons name="arrow-back" size={24} color={staticColors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="git-network"
                size={24}
                color={staticColors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {s.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {s.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            // This screen now lives inside the tab navigator, so reserve room so
            // the last connection rows clear the floating bottom tab bar.
            {paddingBottom: insets.bottom + 100},
          ]}
          showsVerticalScrollIndicator={false}>
          {status === 'loading' && (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {status === 'error' && (
            <View style={styles.centerState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={colors.textTertiary}
              />
              <AppText
                style={[styles.stateText, {color: colors.textSecondary}]}>
                {s.error}
              </AppText>
            </View>
          )}

          {status === 'ready' && (
            <>
              {/* Focus verse */}
              {focusRow && (
                <View
                  style={[
                    styles.focusCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  accessibilityRole="header">
                  <AppText
                    scaleRole="compact"
                    style={[styles.focusRef, {color: colors.primary}]}>
                    {`${focusRow.bookDisplay} ${focusRow.chapter}:${focusRow.verse}`}
                  </AppText>
                  <Text style={[styles.focusText, {color: colors.text}]}>
                    {focusRow.text ?? s.missingText}
                  </Text>
                  <View style={styles.connRow}>
                    <Ionicons
                      name="git-network-outline"
                      size={16}
                      color={colors.textTertiary}
                    />
                    <AppText
                      scaleRole="compact"
                      style={[styles.connText, {color: colors.textTertiary}]}>
                      {`${connections.totalConnections} ${s.connections}`}
                    </AppText>
                  </View>
                </View>
              )}

              {/* Entry to the "Mesa de preparación" — gather everything for
                  teaching/preaching this passage (Sprint 103). */}
              <TouchableOpacity
                style={[
                  styles.prepEntry,
                  {
                    backgroundColor: colors.primary + '14',
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => {
                  haptics.tap();
                  router.push({
                    pathname: '/features/prep' as never,
                    params: {
                      book,
                      chapter,
                      startVerse: verse,
                      version: params.version,
                    },
                  });
                }}
                accessibilityRole="button"
                accessibilityLabel={t.prepTable.title}
                accessibilityHint={t.prepTable.cardSubtitle}>
                <Ionicons
                  name="reader-outline"
                  size={20}
                  color={colors.primary}
                />
                <View style={styles.prepEntryBody}>
                  <AppText
                    scaleRole="compact"
                    style={[styles.prepEntryTitle, {color: colors.primary}]}>
                    {t.prepTable.title}
                  </AppText>
                  <Text
                    style={[
                      styles.prepEntrySub,
                      {color: colors.textSecondary},
                    ]}>
                    {t.prepTable.cardSubtitle}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.primary}
                />
              </TouchableOpacity>

              {/* Christ in this passage (S98) — faithful note + the fulfillment
                  verse in the selected version + a tap to open it. */}
              {christ && (
                <View
                  style={[
                    styles.christCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}>
                  <View style={styles.christHeader}>
                    <Ionicons
                      name="sparkles"
                      size={16}
                      color={colors.primary}
                    />
                    <AppText
                      scaleRole="compact"
                      style={[styles.christLabel, {color: colors.primary}]}>
                      {christ.cardTitle}
                    </AppText>
                  </View>
                  <Text style={[styles.christNote, {color: colors.text}]}>
                    {christ.note}
                  </Text>
                  {christ.fulfillmentText && christ.pointsTo ? (
                    <View
                      style={[
                        styles.christVerse,
                        {borderLeftColor: colors.primary + '55'},
                      ]}>
                      <Text
                        style={[styles.christVerseText, {color: colors.text}]}>
                        {`“${christ.fulfillmentText}”`}
                      </Text>
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.christVerseRef,
                          {color: colors.textSecondary},
                        ]}>
                        {christ.versionAbbrev
                          ? `— ${christ.pointsTo} · ${christ.versionAbbrev}`
                          : `— ${christ.pointsTo}`}
                      </AppText>
                    </View>
                  ) : null}
                  {christ.pointsTo && christ.nav ? (
                    <TouchableOpacity
                      style={[
                        styles.christChip,
                        {
                          borderColor: colors.primary + '55',
                          backgroundColor: colors.primary + '12',
                        },
                      ]}
                      onPress={() => {
                        if (!christ.nav) return;
                        haptics.tap();
                        router.push(
                          `/verse/${christ.nav.book}/${christ.nav.chapter}?verse=${christ.nav.verse}` as never,
                        );
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${christ.pointsToWord}: ${christ.pointsTo}`}>
                      <Ionicons
                        name="arrow-forward"
                        size={14}
                        color={colors.primary}
                      />
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.christChipText,
                          {color: colors.primary},
                        ]}>
                        {`${christ.pointsToWord} · ${christ.pointsTo}`}
                      </AppText>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}

              {!hasConnections && (
                <View style={styles.centerState}>
                  <Ionicons
                    name="link-outline"
                    size={40}
                    color={colors.textTertiary}
                  />
                  <AppText style={[styles.stateText, {color: colors.text}]}>
                    {s.empty}
                  </AppText>
                  <AppText
                    scaleRole="compact"
                    style={[styles.stateHint, {color: colors.textSecondary}]}>
                    {s.emptyHint}
                  </AppText>
                </View>
              )}

              {references.length > 0 && (
                <View style={styles.section}>
                  <AppText
                    scaleRole="display"
                    style={[styles.sectionTitle, {color: colors.text}]}>
                    {s.referencesTitle}
                  </AppText>
                  <AppText
                    scaleRole="compact"
                    style={[styles.sectionHint, {color: colors.textTertiary}]}>
                    {s.referencesHint}
                  </AppText>
                  {references.map(row => renderRow(row, 'ref'))}
                </View>
              )}

              {referencedBy.length > 0 && (
                <View style={styles.section}>
                  <AppText
                    scaleRole="display"
                    style={[styles.sectionTitle, {color: colors.text}]}>
                    {s.referencedByTitle}
                  </AppText>
                  <AppText
                    scaleRole="compact"
                    style={[styles.sectionHint, {color: colors.textTertiary}]}>
                    {s.referencedByHint}
                  </AppText>
                  {referencedBy.map(row => renderRow(row, 'by'))}
                </View>
              )}

              {hasConnections && (
                <AppText
                  scaleRole="compact"
                  style={[styles.attribution, {color: colors.textTertiary}]}>
                  {t.crossRefs.attribution}
                </AppText>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: staticColors.glassWhite25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {flex: 1},
  headerLabel: {
    color: staticColors.glassWhite95,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: staticColors.white,
    fontSize: fontSizes['2xl'],
    fontWeight: '800',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
    ...centeredMaxWidth(),
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
  },
  stateText: {
    fontSize: fontSizes.md,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateHint: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  focusCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  focusRef: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  focusText: {
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.5,
    paddingRight: verseTextRightSlack(fontSizes.lg),
  },
  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  connText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  prepEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  prepEntryBody: {flex: 1},
  prepEntryTitle: {fontWeight: '700', fontSize: fontSizes.md},
  prepEntrySub: {fontSize: fontSizes.sm, marginTop: 2},
  christCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  christHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['1.5'],
  },
  christLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  christNote: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.55,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  christVerse: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
    marginTop: spacing.xs,
    gap: spacing['0.5'],
  },
  christVerseText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    fontStyle: 'italic',
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  christVerseRef: {fontSize: fontSizes.sm, fontWeight: '600'},
  christChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  christChipText: {fontSize: fontSizes.xs, fontWeight: '700'},
  section: {gap: spacing.sm},
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },
  sectionHint: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  refCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  refHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refLabel: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  refText: {
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.5,
    paddingRight: verseTextRightSlack(fontSizes.sm),
  },
  attribution: {
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
