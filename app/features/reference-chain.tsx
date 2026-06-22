/**
 * 🧵 REFERENCE CHAIN SCREEN — a guided verse→verse thread (Sprint 86).
 *
 * Seeded with a verse, it shows that verse, a breadcrumb of the thread so far,
 * and the verse's cross-references as the next steps. Tapping a reference
 * advances the thread (pure {@link advanceChain}); tapping a breadcrumb retraces
 * to it. The cross-reference graph + verse text reuse the SAME
 * `getMergedCrossReferences` (curated + broad web, RUMBO #3) + `bibleDB` the
 * CrossReferencesSheet uses — this only adds the journey on top.
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
import {useBibleVersion} from '@hooks/useBibleVersion';
import {getBookByName} from '@/constants/bible';
import {getMergedCrossReferences} from '@/features/study/crossReferences';
import {parseReference} from '@lib/references/parseReference';
import bibleDB from '@lib/database';
import {
  advanceChain,
  chainStepKey,
  currentStep,
  truncateChainTo,
  type ChainStep,
} from '@lib/references/referenceChain';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

interface NextRef {
  step: ChainStep;
  display: string;
  text: string | null;
}

export default function ReferenceChainScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {colors, gradient} = useTheme();
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const rc = t.referenceChain;
  const params = useLocalSearchParams<{
    book?: string;
    chapter?: string;
    verse?: string;
  }>();

  const headerGradient = (
    gradient?.headerColors
      ? [...gradient.headerColors]
      : ['#4f46e5', '#7c3aed', '#a855f7']
  ) as [string, string, ...string[]];

  // Seed the thread from the route params (English book key resolved once).
  const seed = useMemo<ChainStep | null>(() => {
    const book = params.book;
    const chapter = Number(params.chapter);
    const verse = Number(params.verse);
    if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) {
      return null;
    }
    const info = getBookByName(book);
    return {book: info?.nameEn ?? book, chapter, verse};
  }, [params.book, params.chapter, params.verse]);

  const [trail, setTrail] = useState<ChainStep[]>(seed ? [seed] : []);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const [nextRefs, setNextRefs] = useState<NextRef[]>([]);
  const [loading, setLoading] = useState(true);

  // Deep-link params can arrive AFTER the first render, when the useState
  // initializer already saw a null seed → seed (or re-seed) the thread whenever
  // the seed verse resolves/changes.
  const seedKey = seed ? chainStepKey(seed) : null;
  useEffect(() => {
    if (seed) setTrail([seed]);
  }, [seedKey]);

  const current = currentStep(trail);

  const localize = (book: string) => {
    const info = getBookByName(book);
    return info ? (language === 'en' ? info.nameEn : info.name) : book;
  };

  // Resolve the current verse's text + its cross-references whenever the head
  // of the thread changes.
  useEffect(() => {
    let cancelled = false;
    if (!current) {
      setLoading(false);
      return;
    }
    setLoading(true);
    (async () => {
      await bibleDB.initialize();
      const info = getBookByName(current.book);
      const text = info
        ? ((
            await bibleDB
              .getVerse(
                info.id,
                current.chapter,
                current.verse,
                selectedVersion.id,
              )
              .catch(() => null)
          )?.text ?? null)
        : null;

      // Curated parallels first, then the broad bundled web (RUMBO #3).
      const raws = await getMergedCrossReferences(
        current.book,
        current.chapter,
        current.verse,
      );
      const resolved = await Promise.all(
        raws.map(async raw => {
          const friendly = raw.replace(/\//g, ' ').replace(/ (\d+)$/, ':$1');
          const parsed = parseReference(friendly);
          if (!parsed || parsed.verse == null) return null;
          const verseRow = await bibleDB
            .getVerse(
              parsed.book.id,
              parsed.chapter,
              parsed.verse,
              selectedVersion.id,
            )
            .catch(() => null);
          return {
            step: {
              book: parsed.book.nameEn,
              chapter: parsed.chapter,
              verse: parsed.verse,
            },
            display: language === 'en' ? parsed.book.nameEn : parsed.book.name,
            text: verseRow?.text ?? null,
          } as NextRef;
        }),
      );
      if (cancelled) return;
      setCurrentText(text);
      setNextRefs(resolved.filter((r): r is NextRef => r !== null));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [current ? chainStepKey(current) : null, selectedVersion.id, language]);

  const onFollow = (next: ChainStep) => {
    haptics.tap();
    setTrail(prev => advanceChain(prev, next));
  };

  const onBreadcrumb = (index: number) => {
    haptics.tap();
    setTrail(prev => truncateChainTo(prev, index));
  };

  const openInReader = (step: ChainStep) => {
    haptics.tap();
    router.push(
      `/verse/${localize(step.book)}/${step.chapter}?verse=${step.verse}` as never,
    );
  };

  const currentRef = current
    ? `${localize(current.book)} ${current.chapter}:${current.verse}`
    : '';

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
          <Ionicons name="git-network" size={28} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{rc.title}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {rc.subtitle}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Breadcrumb of the thread so far. */}
      {trail.length > 1 && (
        <View style={styles.breadcrumbRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {trail.map((step, index) => {
              const isLast = index === trail.length - 1;
              return (
                <View key={chainStepKey(step)} style={styles.crumbWrap}>
                  {index > 0 && (
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={colors.textTertiary}
                    />
                  )}
                  <TouchableOpacity
                    disabled={isLast}
                    onPress={() => onBreadcrumb(index)}
                    style={[
                      styles.crumb,
                      {
                        backgroundColor: isLast
                          ? colors.primary + '22'
                          : colors.surface,
                        borderColor: isLast ? colors.primary : colors.border,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.crumbText,
                        {color: isLast ? colors.primary : colors.textSecondary},
                      ]}
                      numberOfLines={1}>
                      {`${localize(step.book)} ${step.chapter}:${step.verse}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body}>
        {/* The verse the reader is currently on. */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => current && openInReader(current)}
          style={[
            styles.currentCard,
            {backgroundColor: colors.surface, borderColor: colors.primary},
          ]}>
          <View style={styles.currentHeader}>
            <Text style={[styles.currentRef, {color: colors.primary}]}>
              {currentRef}
            </Text>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
          </View>
          {currentText ? (
            <Text style={[styles.currentText, {color: colors.text}]}>
              {currentText}
            </Text>
          ) : null}
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, {color: colors.textSecondary}]}>
          {rc.continueLabel}
        </Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : nextRefs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="flag-outline"
              size={32}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              {rc.threadEnds}
            </Text>
          </View>
        ) : (
          nextRefs.map(ref => (
            <TouchableOpacity
              key={chainStepKey(ref.step)}
              activeOpacity={0.85}
              onPress={() => onFollow(ref.step)}
              style={[
                styles.nextRow,
                {
                  backgroundColor: colors.primary + '0F',
                  borderColor: colors.primary + '33',
                },
              ]}>
              <View style={styles.nextMain}>
                <Text
                  style={[styles.nextRef, {color: colors.primary}]}
                  numberOfLines={1}>
                  {ref.display} {ref.step.chapter}:{ref.step.verse}
                </Text>
                {ref.text ? (
                  <Text
                    style={[styles.nextText, {color: colors.textSecondary}]}
                    numberOfLines={2}>
                    {ref.text}
                  </Text>
                ) : null}
              </View>
              <Ionicons
                name="arrow-forward-circle"
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  breadcrumbRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  crumbWrap: {flexDirection: 'row', alignItems: 'center'},
  crumb: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginHorizontal: 2,
  },
  crumbText: {fontSize: fontSizes.xs, fontWeight: '700', maxWidth: 140},
  body: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
    ...centeredMaxWidth(),
  },
  currentCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.base,
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  currentRef: {fontSize: fontSizes.base, fontWeight: '800'},
  currentText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    marginTop: spacing.sm,
    // Right-edge anti-clip slack (Sprint 94).
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  sectionLabel: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  loading: {paddingVertical: spacing['2xl'], alignItems: 'center'},
  empty: {alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl},
  emptyText: {fontSize: fontSizes.sm, fontWeight: '600', textAlign: 'center'},
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  nextMain: {flex: 1, paddingRight: spacing.sm},
  nextRef: {fontSize: fontSizes.sm, fontWeight: '800', marginBottom: 4},
  nextText: {fontSize: fontSizes.sm, lineHeight: 18},
});
