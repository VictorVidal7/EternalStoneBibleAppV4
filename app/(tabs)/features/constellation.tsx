/**
 * ✦ CONSTELLATION SCREEN — the cross-reference web as an interactive star map
 * (RUMBO #3, VISUAL).
 *
 * Seeded with a verse, it draws that verse as the central star and its merged
 * connections (curated parallels + the broad bundled web, RUMBO #3) orbiting it
 * on concentric rings — the strongest links largest and innermost. Tapping a
 * star reveals its verse; from there you can re-centre the map on it (the
 * journey threads via the SAME `advanceChain` trail the reference-chain uses) or
 * open it in the reader. Geometry comes from the pure {@link layoutConstellation};
 * this only layers Svg + the theme palette + verse-text fetching on top.
 *
 * Lives inside the tab navigator (href:null) so pressing back returns to the
 * reader via backBehavior="history" instead of dropping to Home.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, {Circle, Line} from 'react-native-svg';
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
import {getMergedStudyConnections} from '@/features/study/crossReferences';
import {
  buildConnections,
  layoutConstellation,
  type ConstellationLayout,
  type ConstellationNode,
} from '@/features/study/constellation';
import {
  advanceChain,
  chainStepKey,
  currentStep,
  truncateChainTo,
  type ChainStep,
} from '@lib/references/referenceChain';
import bibleDB from '@lib/database';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

export default function ConstellationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const {colors, gradient} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const cn = t.constellation;
  // Book names follow the READING version's language so they match the text.
  const bookLang: 'es' | 'en' = selectedVersion.language === 'es' ? 'es' : 'en';
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

  // Seed from route params (English book key resolved once).
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
  const [layout, setLayout] = useState<ConstellationLayout | null>(null);
  const [focusText, setFocusText] = useState<string | null>(null);
  const [selected, setSelected] = useState<ConstellationNode | null>(null);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Latest selected key, so a slow verse fetch never overwrites a newer tap.
  const selectedKeyRef = useRef<string | null>(null);

  // Deep-link params can arrive after the first render → (re)seed.
  const seedKey = seed ? chainStepKey(seed) : null;
  useEffect(() => {
    if (seed) setTrail([seed]);
  }, [seedKey]);

  const current = currentStep(trail);
  const size = Math.min(width - spacing.lg * 2, 420);

  const localize = (book: string) => {
    const info = getBookByName(book);
    return info ? (bookLang === 'en' ? info.nameEn : info.name) : book;
  };

  // Build the web + layout whenever the head of the trail changes.
  useEffect(() => {
    let cancelled = false;
    if (!current) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setSelected(null);
    setSelectedText(null);
    selectedKeyRef.current = null;
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

      const web = await getMergedStudyConnections(
        current.book,
        current.chapter,
        current.verse,
      );
      const placed = layoutConstellation(buildConnections(web), {size});
      if (cancelled) return;
      setFocusText(text);
      setLayout(placed);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [current ? chainStepKey(current) : null, selectedVersion.id, size]);

  const onSelectNode = useCallback(
    async (node: ConstellationNode) => {
      haptics.tap();
      selectedKeyRef.current = node.key;
      setSelected(node);
      setSelectedText(null);
      const info = getBookByName(node.book);
      if (!info) return;
      const row = await bibleDB
        .getVerse(info.id, node.chapter, node.verse, selectedVersion.id)
        .catch(() => null);
      // Ignore a stale fetch if the user tapped a different star meanwhile.
      if (selectedKeyRef.current === node.key) {
        setSelectedText(row?.text ?? null);
      }
    },
    [selectedVersion.id],
  );

  const onRecenter = (node: ConstellationNode) => {
    haptics.tap();
    setTrail(prev =>
      advanceChain(prev, {
        book: node.book,
        chapter: node.chapter,
        verse: node.verse,
      }),
    );
  };

  const onBreadcrumb = (index: number) => {
    haptics.tap();
    setTrail(prev => truncateChainTo(prev, index));
  };

  const openInReader = (step: {
    book: string;
    chapter: number;
    verse: number;
  }) => {
    haptics.tap();
    router.push(
      `/verse/${localize(step.book)}/${step.chapter}?verse=${step.verse}` as never,
    );
  };

  const nodeColor = (node: ConstellationNode) =>
    node.direction === 'out' ? colors.primary : colors.accent;

  const currentRef = current
    ? `${localize(current.book)} ${current.chapter}:${current.verse}`
    : '';
  const count = layout?.nodes.length ?? 0;
  const countLabel =
    count === 1
      ? cn.connectionsOne
      : cn.connections.replace('{{n}}', String(count));

  // The star map (edges + focus star + orbiting stars + hit targets) is
  // independent of which star is SELECTED, so memoize it: tapping a star then
  // only re-renders the lightweight selection-ring overlay below, not the whole
  // ~100-element SVG — which is what made the screen feel sluggish.
  const baseSvg = useMemo(() => {
    if (!layout) return null;
    const edges = layout.nodes.map(node => (
      <Line
        key={`edge-${node.key}`}
        x1={layout.center.x}
        y1={layout.center.y}
        x2={node.x}
        y2={node.y}
        stroke={node.direction === 'out' ? colors.primary : colors.accent}
        strokeOpacity={0.1 + node.weight * 0.22}
        strokeWidth={0.75 + node.weight * 1.5}
      />
    ));
    const center = (
      <React.Fragment key="center">
        <Circle
          cx={layout.center.x}
          cy={layout.center.y}
          r={layout.center.r * 1.7}
          fill={colors.primary}
          opacity={0.16}
        />
        <Circle
          cx={layout.center.x}
          cy={layout.center.y}
          r={layout.center.r}
          fill={colors.primary}
        />
        <Circle
          cx={layout.center.x}
          cy={layout.center.y}
          r={layout.center.r}
          fill="none"
          stroke={colors.onPrimary}
          strokeOpacity={0.55}
          strokeWidth={2}
        />
      </React.Fragment>
    );
    const stars = layout.nodes.map(node => (
      <React.Fragment key={`star-${node.key}`}>
        <Circle
          cx={node.x}
          cy={node.y}
          r={node.r}
          fill={node.direction === 'out' ? colors.primary : colors.accent}
          fillOpacity={Math.min(1, 0.34 + node.weight * 0.62)}
        />
        {/* Transparent, generous hit target. */}
        <Circle
          cx={node.x}
          cy={node.y}
          r={Math.max(node.r + 10, 22)}
          fill={colors.primary}
          fillOpacity={0}
          onPress={() => onSelectNode(node)}
        />
      </React.Fragment>
    ));
    return [...edges, center, ...stars];
  }, [layout, colors.primary, colors.accent, colors.onPrimary, onSelectNode]);

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
          <Ionicons name="sparkles" size={28} color="#ffffff" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{cn.title}</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {cn.subtitle}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Breadcrumb of the explored trail. */}
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

      <ScrollView
        contentContainerStyle={[
          styles.body,
          {paddingBottom: insets.bottom + 100},
        ]}>
        {/* The focus verse (centre of the map). */}
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
          {focusText ? (
            <Text style={[styles.currentText, {color: colors.text}]}>
              {focusText}
            </Text>
          ) : null}
        </TouchableOpacity>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : count === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="sparkles-outline"
              size={32}
              color={colors.textTertiary}
            />
            <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
              {cn.empty}
            </Text>
          </View>
        ) : (
          <>
            {/* The star map. */}
            <View
              style={[
                styles.canvasWrap,
                {
                  width: size,
                  height: size,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <Svg width={size} height={size}>
                {/* Memoized star map (edges + focus + stars + hit targets). */}
                {baseSvg}
                {/* Selection ring overlay — the only part that re-renders on a
                    tap, so the heavy base map stays cached. */}
                {selected ? (
                  <Circle
                    cx={selected.x}
                    cy={selected.y}
                    r={selected.r + 4}
                    fill="none"
                    stroke={colors.text}
                    strokeWidth={2}
                  />
                ) : null}
              </Svg>
            </View>

            {/* Legend + count. */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, {backgroundColor: colors.primary}]}
                />
                <Text
                  style={[styles.legendText, {color: colors.textSecondary}]}>
                  {cn.legendOut}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, {backgroundColor: colors.accent}]}
                />
                <Text
                  style={[styles.legendText, {color: colors.textSecondary}]}>
                  {cn.legendIn}
                </Text>
              </View>
              <Text style={[styles.countText, {color: colors.textTertiary}]}>
                {countLabel}
              </Text>
            </View>

            {/* Selected-star detail, or a hint to tap. */}
            {selected ? (
              <View
                style={[
                  styles.selectedCard,
                  {
                    backgroundColor: nodeColor(selected) + '0F',
                    borderColor: nodeColor(selected) + '55',
                  },
                ]}>
                <Text
                  style={[styles.selectedRef, {color: nodeColor(selected)}]}
                  numberOfLines={1}>
                  {localize(selected.book)} {selected.chapter}:{selected.verse}
                </Text>
                {selectedText ? (
                  <Text
                    style={[styles.selectedText, {color: colors.text}]}
                    numberOfLines={4}>
                    {selectedText}
                  </Text>
                ) : (
                  <ActivityIndicator
                    color={nodeColor(selected)}
                    style={styles.selectedLoading}
                  />
                )}
                <View style={styles.selectedActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, {borderColor: colors.primary}]}
                    onPress={() => onRecenter(selected)}
                    accessibilityRole="button"
                    accessibilityLabel={cn.recenter}>
                    <Ionicons
                      name="git-network"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={[styles.actionText, {color: colors.primary}]}>
                      {cn.recenter}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, {borderColor: colors.primary}]}
                    onPress={() => openInReader(selected)}
                    accessibilityRole="button"
                    accessibilityLabel={cn.openInReader}>
                    <Ionicons name="book" size={16} color={colors.primary} />
                    <Text style={[styles.actionText, {color: colors.primary}]}>
                      {cn.openInReader}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[styles.tapHint, {color: colors.textTertiary}]}>
                {cn.tapHint}
              </Text>
            )}
          </>
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
  breadcrumbRow: {paddingHorizontal: spacing.lg, paddingTop: spacing.md},
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
    alignItems: 'center',
    ...centeredMaxWidth(),
  },
  currentCard: {
    alignSelf: 'stretch',
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
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  loading: {paddingVertical: spacing['2xl'], alignItems: 'center'},
  empty: {alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl},
  emptyText: {fontSize: fontSizes.sm, fontWeight: '600', textAlign: 'center'},
  canvasWrap: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  legendDot: {width: 12, height: 12, borderRadius: 6},
  legendText: {fontSize: fontSizes.xs, fontWeight: '600'},
  countText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  selectedCard: {
    alignSelf: 'stretch',
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
  },
  selectedRef: {fontSize: fontSizes.base, fontWeight: '800'},
  selectedText: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    marginTop: spacing.sm,
    paddingRight: verseTextRightSlack(fontSizes.md),
  },
  selectedLoading: {marginTop: spacing.md, alignSelf: 'flex-start'},
  selectedActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  actionText: {fontSize: fontSizes.sm, fontWeight: '700'},
  tapHint: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
