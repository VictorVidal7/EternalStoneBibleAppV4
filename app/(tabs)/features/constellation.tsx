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
 * The star map also supports two-finger pinch-to-zoom and two-finger pan
 * (see the gesture setup below) with a "reset view" button once you've
 * strayed from the default 1x view. See constellationZoom.ts for the pure
 * zoom/pan clamp policy this drives.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, {Circle, Line} from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {haptics} from '@lib/haptics';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useBackHandlerStep} from '@hooks/useBackHandlerStep';
import {ExpandableVerseText} from '@components/ui/ExpandableVerseText';
import {getBookByName} from '@/constants/bible';
import {getMergedStudyConnections} from '@/features/study/crossReferences';
import {
  buildConnections,
  layoutConstellation,
  type ConstellationLayout,
  type ConstellationNode,
} from '@/features/study/constellation';
import {
  clampConstellationScale,
  clampConstellationTranslate,
  constellationHitBox,
  isConstellationTransformed,
  CONSTELLATION_MIN_SCALE,
} from '@/features/study/constellationZoom';
import {
  advanceChain,
  chainStepKey,
  currentStep,
  truncateChainTo,
  type ChainStep,
} from '@lib/references/referenceChain';
import bibleDB from '@lib/database';
import {FeatureGuideModal} from '@components/FeatureGuideModal';
import {getFeatureGuideContent} from '@lib/onboarding/featureGuides';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
  verseTextRightSlack,
} from '@/styles/designTokens';

// Clearance so the floating detail panel sits above the bottom tab bar
// (this screen lives in the (tabs) group, so the tab bar is present).
const TAB_BAR_CLEARANCE = Platform.OS === 'ios' ? 84 : 64;

export default function ConstellationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {width, height} = useWindowDimensions();
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
  const [guideVisible, setGuideVisible] = useState(false);
  // Latest selected key, so a slow verse fetch never overwrites a newer tap.
  const selectedKeyRef = useRef<string | null>(null);

  // Deep-link params can arrive after the first render → (re)seed.
  const seedKey = seed ? chainStepKey(seed) : null;
  useEffect(() => {
    if (seed) setTrail([seed]);
  }, [seedKey]);

  const current = currentStep(trail);
  // Size the square star map by BOTH width and the available height, so the
  // whole constellation always sits ABOVE the floating detail panel instead of
  // having its lower stars covered (user feedback). The reserve accounts for
  // the header + focus card + legend + the floating panel + the tab bar; the
  // floor keeps it usable on short screens. Trimmed the outer margin too.
  const CANVAS_HEIGHT_RESERVE = 540;
  const size = Math.max(
    220,
    Math.min(
      width - spacing.md * 2,
      420,
      height - CANVAS_HEIGHT_RESERVE - insets.top - insets.bottom,
    ),
  );

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

  // Hardware back: close the selected-star panel first, then retreat one
  // link in the chain (same as tapping the previous breadcrumb), then fall
  // through to the route pop at the seed.
  useBackHandlerStep(() => {
    if (selected) {
      setSelected(null);
      return true;
    }
    if (trail.length > 1) {
      setTrail(prev => truncateChainTo(prev, prev.length - 2));
      return true;
    }
    return false;
  });

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

  // ── Pinch-to-zoom / two-finger-pan for the star map ──────────────────────
  // Both the <Svg> canvas AND the per-star hit-target <Pressable> overlay
  // below live inside ONE shared Animated.View (mapTransformStyle) so the
  // SAME transform relocates + rescales both together. This is the fix for
  // the sibling of the landmine noted above: if only the <Svg> panned/zoomed
  // while the Pressables kept their original absolute left/top, taps would
  // hit the wrong star (or nothing) the instant the user pinched or dragged.
  // React Native's transform affects hit-testing, not just paint, so wrapping
  // both together keeps every star's tap target exactly where it's drawn at
  // any zoom/pan state. See constellationZoom.ts for the pure clamp policy.
  const scale = useSharedValue(CONSTELLATION_MIN_SCALE);
  const savedScale = useSharedValue(CONSTELLATION_MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  // Drives the "reset view" button — only shown once the map has actually
  // strayed from its default 1x/no-pan state. Updated from the UI thread at
  // the end of each gesture rather than every frame (cheap; a button showing
  // one frame late is imperceptible).
  const [transformed, setTransformed] = useState(false);

  // Snap the transform back to the default 1x/no-pan view whenever a NEW
  // constellation is laid out — re-centring on a star (Centrar aquí),
  // following a breadcrumb, or switching Bible version all rebuild `layout`
  // (see the effect above keyed on the same values) with a brand-new focus
  // star at canvas centre. Without this, a map zoomed/panned into a corner
  // would hand the user a fresh map that's ALSO off-screen at the old pan
  // offset — the reset button would still recover it, but the correct
  // default behaviour is that a new map always arrives at the default view.
  // Snaps instantly (no withTiming) since this coincides with the whole map
  // being replaced under it, not a standalone gesture release.
  useEffect(() => {
    scale.value = CONSTELLATION_MIN_SCALE;
    translateX.value = 0;
    translateY.value = 0;
    savedScale.value = CONSTELLATION_MIN_SCALE;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setTransformed(false);
  }, [
    current ? chainStepKey(current) : null,
    selectedVersion.id,
    size,
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
  ]);

  // JUDGMENT CALL — pinch anchor: scaling is CENTRE-anchored (React Native's
  // default transform origin is the view's own centre), not focal-point
  // anchored on the pinch midpoint. A focal-point anchor (the content point
  // under your fingers stays under your fingers as you pinch, like a photo
  // viewer) is the fancier option but needs the focal point's OFFSET from
  // centre folded into the translate math on every update, which meaningfully
  // raises the risk of a subtle drift bug in exactly the code responsible for
  // this screen's core requirement (hit-target alignment). Centre-anchored
  // zoom is simple, has no such drift risk, and is a completely standard,
  // easily-recognisable zoom behaviour for a small map like this one — but it
  // IS a different feel than a typical photo-viewer pinch, so flagging it
  // rather than deciding silently.
  const pinchGesture = Gesture.Pinch()
    .onUpdate(e => {
      const nextScale = clampConstellationScale(savedScale.value * e.scale);
      scale.value = nextScale;
      // Re-clamp pan too: zooming back out shrinks how far the map is
      // allowed to have wandered, so a pinch-out at the pan limit should
      // pull the map back toward centre instead of leaving a gap.
      translateX.value = clampConstellationTranslate(
        translateX.value,
        nextScale,
        size,
      );
      translateY.value = clampConstellationTranslate(
        translateY.value,
        nextScale,
        size,
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(setTransformed)(
        isConstellationTransformed(
          scale.value,
          translateX.value,
          translateY.value,
        ),
      );
    });

  // TWO fingers only (minPointers/maxPointers) — JUDGMENT CALL: this screen's
  // outer content sits in a vertical ScrollView, and a ONE-finger pan on the
  // canvas needs to keep scrolling the screen exactly like it did before this
  // feature (purely additive at rest). Gating a one-finger pan by "only once
  // zoomed in" was the alternative, but that needs a JS round-trip to flip
  // `.enabled()` right as the user crosses back to 1x and would still eat the
  // very first one-finger drag on a freshly-zoomed view. Requiring two
  // fingers means this gesture and the ScrollView's one-finger scroll gesture
  // never compete for the same touch stream at all, at any zoom level —
  // the safest way to guarantee zero regression to the existing scroll.
  const panGesture = Gesture.Pan()
    .minPointers(2)
    .maxPointers(2)
    .onUpdate(e => {
      translateX.value = clampConstellationTranslate(
        savedTranslateX.value + e.translationX,
        scale.value,
        size,
      );
      translateY.value = clampConstellationTranslate(
        savedTranslateY.value + e.translationY,
        scale.value,
        size,
      );
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
      runOnJS(setTransformed)(
        isConstellationTransformed(
          scale.value,
          translateX.value,
          translateY.value,
        ),
      );
    });

  // Simultaneous (not Exclusive/Race) so a natural two-finger pinch-and-drag
  // updates scale and translation together in the same gesture.
  const mapGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const mapTransformStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
  }));

  // Reset-view affordance — JUDGMENT CALL: a small visible button rather than
  // a double-tap gesture. A double-tap Gesture.Tap() would sit in the SAME
  // view subtree as the per-star hit-target Pressables (it has to, to be
  // recognised over the whole canvas), risking exactly the class of Android
  // touch-arbitration flakiness the file-level landmine comment already
  // flags for SVG onPress — two independent tap recognisers layered over the
  // same area is asking for trouble on the one interaction (star selection)
  // this screen cannot regress. A plain RN Pressable button carries none of
  // that risk and is also more discoverable/accessible than a hidden gesture.
  const resetMapView = useCallback(() => {
    haptics.tap();
    scale.value = withTiming(CONSTELLATION_MIN_SCALE);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = CONSTELLATION_MIN_SCALE;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    setTransformed(false);
  }, [
    scale,
    translateX,
    translateY,
    savedScale,
    savedTranslateX,
    savedTranslateY,
  ]);

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
    // Only the VISIBLE stars live in the SVG now. The tap targets used to be
    // transparent <Circle onPress> here, but react-native-svg's onPress is
    // unreliable on Android when the <Svg> sits inside a ScrollView (the
    // ScrollView claims the touch) — which is why "almost no circle responded"
    // (UX review #5). The hit targets are now real RN <Pressable> overlays
    // rendered above the canvas (see hitTargets below).
    const stars = layout.nodes.map(node => (
      <Circle
        key={`star-${node.key}`}
        cx={node.x}
        cy={node.y}
        r={node.r}
        fill={node.direction === 'out' ? colors.primary : colors.accent}
        fillOpacity={Math.min(1, 0.34 + node.weight * 0.62)}
      />
    ));
    return [...edges, center, ...stars];
  }, [layout, colors.primary, colors.accent, colors.onPrimary]);

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
          <TouchableOpacity
            onPress={() => {
              haptics.tap();
              setGuideVisible(true);
            }}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            accessibilityRole="button"
            accessibilityLabel={cn.guide.openLabel}>
            <Ionicons name="help-circle-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
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
            {/* The star map — wrapped in a GestureDetector so a two-finger
                pinch/pan can zoom and pan it (see the gesture setup above).
                A one-finger drag here is NOT claimed by this gesture, so the
                screen's vertical ScrollView keeps scrolling exactly as
                before. */}
            <GestureDetector gesture={mapGesture}>
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
                {/* Shared transform — both the Svg canvas AND the hit-target
                    Pressables below live inside this ONE Animated.View so
                    they pan/zoom together (see the gesture setup above for
                    why that matters). At rest (1x, no pan) this is an
                    identity transform, so the default view is pixel-identical
                    to before this feature. */}
                <Animated.View
                  style={[{width: size, height: size}, mapTransformStyle]}>
                  <Svg width={size} height={size}>
                    {/* Memoized star map (edges + focus + stars + hit targets). */}
                    {baseSvg}
                    {/* Selection ring overlay — the only part that re-renders
                        on a tap, so the heavy base map stays cached. */}
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

                  {/* Tap targets as real RN Pressables layered over the
                      canvas — robust on Android where SVG onPress inside a
                      ScrollView often never fires (UX review #5). box-none
                      lets the empty gaps fall through to the ScrollView so
                      vertical scrolling still works. Positions stay computed
                      from the RAW (untransformed) node.x/node.y — the parent
                      Animated.View's transform relocates + rescales this
                      whole subtree (RN transforms move hit-testing, not just
                      paint), so every star stays tappable exactly where it's
                      drawn at any zoom/pan state without recomputing anything
                      here. */}
                  <View
                    style={StyleSheet.absoluteFill}
                    pointerEvents="box-none">
                    {layout?.nodes.map(node => {
                      const hitBox = constellationHitBox(node);
                      return (
                        <Pressable
                          key={`hit-${node.key}`}
                          onPress={() => onSelectNode(node)}
                          style={[
                            styles.hitTarget,
                            {
                              left: hitBox.left,
                              top: hitBox.top,
                              width: hitBox.size,
                              height: hitBox.size,
                              borderRadius: hitBox.size / 2,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`${localize(node.book)} ${node.chapter}:${node.verse}`}
                        />
                      );
                    })}
                  </View>
                </Animated.View>

                {/* Reset-view button — fixed in the canvas corner (a sibling
                    of the transformed Animated.View, so it never itself
                    pans/zooms), shown only once the map has actually strayed
                    from its default view. */}
                {transformed && (
                  <Pressable
                    onPress={resetMapView}
                    style={[
                      styles.resetButton,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={cn.resetZoom}>
                    <Ionicons
                      name="contract-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </Pressable>
                )}
              </View>
            </GestureDetector>

            {/* Legend + count — hidden while the floating detail panel is
                open (below): it sits fixed near the bottom of the screen, so
                with a star selected this row would otherwise land right
                behind the panel's rounded corners, showing through and
                competing with its text (UX follow-up). */}
            {!selected && (
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      {backgroundColor: colors.primary},
                    ]}
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
            )}

            {/* Hint to tap — the selected-star detail floats over the canvas
                (below), so it never requires scrolling per connection. */}
            {!selected && (
              <Text style={[styles.tapHint, {color: colors.textTertiary}]}>
                {cn.tapHint}
              </Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Selected-star detail as a FLOATING panel pinned above the tab bar
          (UX follow-up): tapping a star shows its verse here instantly and the
          panel just updates as you tap others, so consulting many connections
          never needs a scroll. A close button deselects. */}
      {selected && count > 0 ? (
        <View
          style={[
            styles.floatingDetail,
            {
              bottom: insets.bottom + TAB_BAR_CLEARANCE,
              backgroundColor: colors.surface,
              borderColor: nodeColor(selected) + '55',
            },
          ]}>
          <View style={styles.floatingHeader}>
            <Text
              style={[styles.selectedRef, {color: nodeColor(selected)}]}
              numberOfLines={1}>
              {localize(selected.book)} {selected.chapter}:{selected.verse}
            </Text>
            <TouchableOpacity
              onPress={() => {
                haptics.tap();
                selectedKeyRef.current = null;
                setSelected(null);
                setSelectedText(null);
              }}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              accessibilityRole="button"
              accessibilityLabel={t.close}>
              <Ionicons name="close" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
          {selectedText ? (
            <ExpandableVerseText
              style={[styles.selectedText, {color: colors.text}]}
              numberOfLines={2}>
              {selectedText}
            </ExpandableVerseText>
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
              <Ionicons name="git-network" size={16} color={colors.primary} />
              <Text
                style={[styles.actionText, {color: colors.primary}]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {cn.recenter}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, {borderColor: colors.primary}]}
              onPress={() => openInReader(selected)}
              accessibilityRole="button"
              accessibilityLabel={cn.openInReader}>
              <Ionicons name="book" size={16} color={colors.primary} />
              <Text
                style={[styles.actionText, {color: colors.primary}]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}>
                {cn.openInReader}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <FeatureGuideModal
        visible={guideVisible}
        onClose={() => setGuideVisible(false)}
        {...getFeatureGuideContent('constellation', t)}
      />
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
    padding: spacing.md,
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
  hitTarget: {position: 'absolute'},
  resetButton: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
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
  floatingDetail: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    // Float above the canvas; a clear shadow so it reads as a layer.
    shadowColor: staticColors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  selectedRef: {fontSize: fontSizes.base, fontWeight: '800', flexShrink: 1},
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
  actionText: {fontSize: fontSizes.sm, fontWeight: '700', flexShrink: 1},
  tapHint: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
