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

import React, {useEffect, useMemo, useState} from 'react';
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
import {
  isOriginalsInstalled,
  occurrenceRef,
  strongsLabel,
  type StrongsOccurrence,
} from '@/features/study/originals';
import {christLangForVersion} from '@/features/study/christConnections';
import {
  buildBookBars,
  distinctBookCount,
  getWordStudy,
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

export default function WordStudyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const w = t.wordStudy;
  const params = useLocalSearchParams<{
    strongs?: string;
    version?: string;
    gloss?: string;
  }>();
  const strongs = (params.strongs ?? '').trim();
  const version = params.version;
  const seedGloss = params.gloss?.trim() || null;
  // Verse references follow the reading version's language (RVR1960 → "Juan").
  const bookLang = christLangForVersion(version);

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : ['#4f46e5', '#7c3aed', '#a855f7']
  ) as [string, string, ...string[]];

  const [status, setStatus] = useState<Status>('loading');
  const [study, setStudy] = useState<WordStudy | null>(null);
  // The Strong's definition is English-only; in a Spanish UI it hides behind
  // this toggle so the card stays Spanish.
  const [defExpanded, setDefExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setStudy(null);
    setDefExpanded(false);
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

  const bars = useMemo(
    () => (study ? buildBookBars(study.distribution, bookLang) : []),
    [study, bookLang],
  );

  const openInReader = (occ: StrongsOccurrence) => {
    const book = getBookById(occ.book_id);
    if (!book) return;
    haptics.tap();
    const name = bookLang === 'en' ? book.nameEn : book.name;
    router.push(`/verse/${name}/${occ.chapter}?verse=${occ.verse}` as never);
  };

  const lex = study?.lexicon ?? null;
  const lemma = lex?.lemma ?? null;
  const bookCount = study ? distinctBookCount(study.distribution) : 0;

  const countLabel = study
    ? `${study.count} ${
        study.count === 1 ? w.occurrencesOne : w.occurrences
      } · ${
        bookCount === 1
          ? w.inBooksOne
          : w.inBooks.replace('{{n}}', String(bookCount))
      }`
    : '';

  const renderOccurrence = (occ: StrongsOccurrence, key: string) => (
    <TouchableOpacity
      key={key}
      style={[styles.occRow, {borderTopColor: colors.border}]}
      onPress={() => openInReader(occ)}
      accessibilityRole="button"
      accessibilityLabel={occurrenceRef(occ, bookLang)}>
      <Text style={[styles.occRef, {color: colors.primary}]} numberOfLines={1}>
        {occurrenceRef(occ, bookLang)}
      </Text>
      <Text
        style={[styles.occWord, {color: colors.textSecondary}]}
        numberOfLines={1}>
        {occ.word}
      </Text>
    </TouchableOpacity>
  );

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
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Ionicons name="search" size={26} color="#ffffff" />
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
          ]}>
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
            {lex?.definition ? (
              language === 'es' ? (
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
              ) : (
                <Text
                  style={[styles.definition, {color: colors.textSecondary}]}>
                  {lex.definition}
                </Text>
              )
            ) : null}
            <Text style={[styles.countLabel, {color: colors.textTertiary}]}>
              {countLabel}
            </Text>
          </View>

          {/* Distribution across books. */}
          {bars.length > 0 ? (
            <View
              style={[
                styles.section,
                {backgroundColor: colors.surface, borderColor: colors.border},
              ]}>
              <Text style={[styles.sectionTitle, {color: colors.text}]}>
                {w.distribution}
              </Text>
              <MiniBarChart
                data={bars}
                barColor={colors.primary}
                trackColor={colors.primary + '14'}
                labelColor={colors.textSecondary}
                valueColor={colors.textTertiary}
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
            <Text style={[styles.sectionTitle, {color: colors.text}]}>
              {w.occurrencesHeader}
            </Text>
            {study.occurrences.map((occ, i) =>
              renderOccurrence(
                occ,
                `${occ.book_id}-${occ.chapter}-${occ.verse}-${i}`,
              ),
            )}
            {study.count > study.occurrences.length ? (
              <Text style={[styles.moreNote, {color: colors.textTertiary}]}>
                {w.moreOccurrences.replace(
                  '{{n}}',
                  String(study.occurrences.length),
                )}
              </Text>
            ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  occRef: {fontSize: fontSizes.sm, fontWeight: '700'},
  occWord: {fontSize: fontSizes.sm, flexShrink: 1, textAlign: 'right'},
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
