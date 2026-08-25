/**
 * 💡 ¿SABÍAS QUÉ? — browsable hub of biblically-grounded curious facts.
 *
 * Geography, numbers/measurements, original-language nuances, historical and
 * cultural context, and cross-references between passages — every entry
 * anchored to a specific verse, curated with the same conservative fidelity
 * as the Hilo profético (`src/features/study/bibleFacts.ts`).
 *
 * A "Dato del día" hero rotates deterministically by calendar day (mirrors
 * the daily verse / daily prophecy), below it a browsable index grouped by
 * category with a favorites filter; each card expands in place to reveal the
 * full note + the actual verse text, with a one-tap jump to the reader.
 *
 * Reached from the Home "Explorar" tile and the deep link
 * eternalbible://features/facts.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useCallback, useEffect, useMemo, useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {Stack, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {parseChristRef} from '@/features/study/christConnections';
import {
  BIBLE_FACTS,
  FACT_CATEGORY_ACCENT,
  FACT_CATEGORY_ICON,
  getDailyFact,
  getFactsByCategory,
  type BibleFact,
  type FactCategory,
  type FactRefKey,
} from '@/features/study/bibleFacts';
import {
  getFavoriteFacts,
  toggleFactFavorite,
} from '@/features/study/factFavorites';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

type FactFilter = 'all' | 'favorites' | FactCategory;

interface ResolvedRef {
  display: string;
  reference: string;
  bookId: number;
  chapter: number;
  verse: number;
  text: string | null;
}

export default function BibleFactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient, highContrast} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const tf = t.bibleFacts;
  const items = tf.items as Record<string, {label: string; detail: string}>;
  const categoryLabels = tf.categories as Record<FactCategory, string>;

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FactFilter>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState<Record<string, ResolvedRef>>({});
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => {
    void getFavoriteFacts().then(setFavorites);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    haptics.tap();
    void toggleFactFavorite(id).then(setFavorites);
  }, []);

  const resolveFact = useCallback(
    (ref: FactRefKey) => {
      const parsed = parseChristRef(ref);
      if (!parsed) return;
      const book = getBookByName(parsed.book);
      if (!book) return;
      const display =
        selectedVersion.language === 'es' ? book.name : book.nameEn;
      const reference = `${display} ${parsed.chapter}:${parsed.verse}`;
      setResolved(prev =>
        prev[ref]
          ? prev
          : {
              ...prev,
              [ref]: {
                display,
                reference,
                bookId: book.id,
                chapter: parsed.chapter,
                verse: parsed.verse,
                text: null,
              },
            },
      );
      void bibleDB
        .getVerse(book.id, parsed.chapter, parsed.verse, selectedVersion.id)
        .then(row => {
          setResolved(prev => ({
            ...prev,
            [ref]: {
              display,
              reference,
              bookId: book.id,
              chapter: parsed.chapter,
              verse: parsed.verse,
              text: row?.text ?? null,
            },
          }));
        })
        .catch(() => {});
    },
    [selectedVersion.id, selectedVersion.language],
  );

  const dailyFact = useMemo(() => getDailyFact(), []);
  useEffect(() => {
    resolveFact(dailyFact.ref);
    // Re-resolves when the reading version changes so the hero verse text
    // (not just the reference) matches the active version.
  }, [dailyFact.ref, resolveFact]);

  const toggleExpanded = useCallback(
    (fact: BibleFact) => {
      haptics.tap();
      setExpanded(prev => {
        const next = new Set(prev);
        if (next.has(fact.id)) next.delete(fact.id);
        else {
          next.add(fact.id);
          resolveFact(fact.ref);
        }
        return next;
      });
    },
    [resolveFact],
  );

  const openInReader = useCallback(
    (ref: FactRefKey) => {
      const info = resolved[ref];
      if (!info) return;
      haptics.tap();
      router.push(
        `/verse/${info.display}/${info.chapter}?verse=${info.verse}` as never,
      );
    },
    [resolved, router],
  );

  // getFactsByCategory() already excludes draft entries (see bibleFacts.ts),
  // so this hub never surfaces unreviewed content — nor any category whose
  // entries are currently all draft.
  const publishedByCategory = useMemo(() => getFactsByCategory(), []);

  const sections = useMemo(() => {
    return publishedByCategory
      .map(section => ({
        category: section.category,
        entries: section.entries.filter(({fact}) => {
          if (filter === 'all') return true;
          if (filter === 'favorites') return favorites.has(fact.id);
          return fact.category === filter;
        }),
      }))
      .filter(section => section.entries.length > 0);
  }, [publishedByCategory, filter, favorites]);

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];
  const dailyAccent = FACT_CATEGORY_ACCENT[dailyFact.category];
  const dailyItem = items[dailyFact.id];
  const dailyResolved = resolved[dailyFact.ref];

  // Only categories with at least one PUBLISHED (non-draft) entry get a
  // filter chip — e.g. `commentary` has none right now, so its chip doesn't
  // appear until Victor un-drafts at least one entry (no code change needed
  // then; it reappears automatically).
  const filters: {key: FactFilter; label: string}[] = [
    {key: 'all', label: tf.filterAll},
    ...publishedByCategory.map(({category: c}) => ({
      key: c as FactFilter,
      label: categoryLabels[c],
    })),
    {key: 'favorites', label: tf.filterFavorites},
  ];

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
              <Ionicons name="bulb" size={24} color={staticColors.white} />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {tf.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {tf.title}
              </AppText>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <AppText
            scaleRole="compact"
            style={[styles.browseHint, {color: colors.textTertiary}]}>
            {tf.browseHint}
          </AppText>

          {/* ── Dato del día ── */}
          {dailyItem && (
            <View
              style={[
                styles.heroCard,
                {backgroundColor: colors.card, borderColor: dailyAccent},
              ]}>
              <View style={styles.heroTopRow}>
                <View
                  style={[
                    styles.categoryChip,
                    {backgroundColor: dailyAccent + '22'},
                  ]}>
                  <Ionicons
                    name={FACT_CATEGORY_ICON[dailyFact.category] as never}
                    size={13}
                    color={dailyAccent}
                  />
                  <AppText
                    scaleRole="compact"
                    style={[styles.categoryChipText, {color: dailyAccent}]}>
                    {categoryLabels[dailyFact.category]}
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={() => toggleFavorite(dailyFact.id)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                  accessibilityRole="button"
                  accessibilityLabel={
                    favorites.has(dailyFact.id) ? tf.unfavorite : tf.favorite
                  }
                  accessibilityState={{selected: favorites.has(dailyFact.id)}}>
                  <Ionicons
                    name={
                      favorites.has(dailyFact.id) ? 'heart' : 'heart-outline'
                    }
                    size={20}
                    color={
                      favorites.has(dailyFact.id)
                        ? dailyAccent
                        : colors.textTertiary
                    }
                  />
                </TouchableOpacity>
              </View>
              <AppText
                scaleRole="compact"
                style={[styles.heroEyebrow, {color: colors.textTertiary}]}>
                {tf.todayTitle}
              </AppText>
              <AppText style={[styles.heroLabel, {color: colors.text}]}>
                {dailyItem.label}
              </AppText>
              <AppText
                style={[styles.heroDetail, {color: colors.textSecondary}]}>
                {dailyItem.detail}
              </AppText>
              <TouchableOpacity
                style={[styles.verseChip, {borderColor: colors.border}]}
                onPress={() => openInReader(dailyFact.ref)}
                accessibilityRole="button"
                accessibilityLabel={`${tf.openInReader}: ${dailyResolved?.reference ?? ''}`}>
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={colors.primary}
                />
                <AppText
                  scaleRole="compact"
                  style={[styles.verseChipText, {color: colors.primary}]}>
                  {dailyResolved?.reference ?? ''}
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={colors.primary}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Fuentes y método ── */}
          <TouchableOpacity
            style={styles.sourcesToggle}
            onPress={() => {
              haptics.tap();
              setSourcesOpen(o => !o);
            }}
            accessibilityRole="button"
            accessibilityLabel={tf.sourcesTitle}
            accessibilityHint={tf.sourcesHint}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textTertiary}
            />
            <AppText
              scaleRole="compact"
              style={[styles.sourcesToggleText, {color: colors.textTertiary}]}>
              {tf.sourcesTitle}
            </AppText>
            <Ionicons
              name={sourcesOpen ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          {sourcesOpen && (
            <AppText
              scaleRole="compact"
              style={[styles.sourcesBody, {color: colors.textSecondary}]}>
              {tf.sourcesBody}
            </AppText>
          )}

          {/* ── Filtros ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterRowContent}>
            {filters.map(f => {
              const active = filter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active ? colors.primary : colors.card,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    haptics.tap();
                    setFilter(f.key);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{selected: active}}>
                  <AppText
                    scaleRole="compact"
                    style={[
                      styles.filterChipText,
                      {
                        color: active ? colors.onPrimary : colors.textSecondary,
                      },
                    ]}>
                    {f.label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Índice ── */}
          {sections.length === 0 && filter === 'favorites' && (
            <AppText
              scaleRole="compact"
              style={[styles.noFavorites, {color: colors.textTertiary}]}>
              {tf.noFavorites}
            </AppText>
          )}

          {sections.map(section => {
            const accent = FACT_CATEGORY_ACCENT[section.category];
            return (
              <View key={section.category} style={styles.section}>
                <AppText
                  scaleRole="compact"
                  style={[styles.sectionTitle, {color: colors.textTertiary}]}>
                  {categoryLabels[section.category]}
                </AppText>
                {section.entries.map(({fact}) => {
                  const item = items[fact.id];
                  if (!item) return null;
                  const isOpen = expanded.has(fact.id);
                  const info = resolved[fact.ref];
                  return (
                    <View
                      key={fact.id}
                      style={[
                        styles.factCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}>
                      <TouchableOpacity
                        style={styles.factHeader}
                        onPress={() => toggleExpanded(fact)}
                        accessibilityRole="button"
                        accessibilityState={{expanded: isOpen}}
                        accessibilityLabel={item.label}>
                        <View
                          style={[
                            styles.factIcon,
                            {backgroundColor: accent + '22'},
                          ]}>
                          <Ionicons
                            name={FACT_CATEGORY_ICON[section.category] as never}
                            size={16}
                            color={accent}
                          />
                        </View>
                        <View style={styles.factLabelCol}>
                          {fact.draft && (
                            <View
                              style={[
                                styles.draftBadge,
                                {backgroundColor: accent + '22'},
                              ]}>
                              <AppText
                                scaleRole="compact"
                                style={[
                                  styles.draftBadgeText,
                                  {color: accent},
                                ]}>
                                {tf.draftBadge}
                              </AppText>
                            </View>
                          )}
                          <AppText
                            style={[styles.factLabel, {color: colors.text}]}
                            numberOfLines={isOpen ? undefined : 2}>
                            {item.label}
                          </AppText>
                        </View>
                        <Ionicons
                          name={isOpen ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.textTertiary}
                        />
                      </TouchableOpacity>
                      {isOpen && (
                        <View style={styles.factBody}>
                          <AppText
                            style={[
                              styles.factDetail,
                              {color: colors.textSecondary},
                            ]}>
                            {item.detail}
                          </AppText>
                          {info?.text ? (
                            <View
                              style={[
                                styles.factVerseQuote,
                                {borderLeftColor: colors.primary + '55'},
                              ]}>
                              <AppText
                                scaleRole="body"
                                style={[
                                  styles.factVerseText,
                                  {color: colors.text},
                                ]}>
                                {`“${info.text}”`}
                              </AppText>
                            </View>
                          ) : null}
                          <View style={styles.factBottomRow}>
                            <TouchableOpacity
                              style={[
                                styles.verseChip,
                                {borderColor: colors.border},
                              ]}
                              onPress={() => openInReader(fact.ref)}
                              accessibilityRole="button"
                              accessibilityLabel={`${tf.openInReader}: ${info?.reference ?? ''}`}>
                              <Ionicons
                                name="book-outline"
                                size={14}
                                color={colors.primary}
                              />
                              <AppText
                                scaleRole="compact"
                                style={[
                                  styles.verseChipText,
                                  {color: colors.primary},
                                ]}>
                                {info?.reference ?? tf.missingText}
                              </AppText>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => toggleFavorite(fact.id)}
                              hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10,
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={
                                favorites.has(fact.id)
                                  ? tf.unfavorite
                                  : tf.favorite
                              }
                              accessibilityState={{
                                selected: favorites.has(fact.id),
                              }}>
                              <Ionicons
                                name={
                                  favorites.has(fact.id)
                                    ? 'heart'
                                    : 'heart-outline'
                                }
                                size={20}
                                color={
                                  favorites.has(fact.id)
                                    ? accent
                                    : colors.textTertiary
                                }
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}

/** Total facts in the catalog, exported for tests. */
export const TOTAL_FACTS = BIBLE_FACTS.length;

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
  },
  browseHint: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
  },
  heroCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroEyebrow: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.xs,
  },
  heroLabel: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
  },
  heroDetail: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  categoryChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  verseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  verseChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  sourcesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
  },
  sourcesToggleText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    flex: 1,
  },
  sourcesBody: {
    fontSize: fontSizes.xs,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  filterRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  filterRowContent: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
  },
  noFavorites: {
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  factCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  factIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  factLabelCol: {
    flex: 1,
    gap: 2,
  },
  factLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  draftBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  draftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  factBody: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  factDetail: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  factVerseQuote: {
    borderLeftWidth: 3,
    paddingLeft: spacing.md,
  },
  factVerseText: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    fontStyle: 'italic',
    paddingRight: verseTextRightSlack(fontSizes.sm),
  },
  factBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
