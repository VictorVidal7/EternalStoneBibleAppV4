/**
 * 🛤️ JOURNEY ROUTE — one Bible route's tappable rail map + stop list.
 *
 * Renders one of the curated routes from [[journeyMaps]] as a vertical rail
 * (pure geometry from [[journeyMap]]): a dot per stop with its label, in walk
 * order. Tapping a dot jumps straight to that stop's verse in the reader; a
 * list card below expands in place for an inline verse preview, with a
 * separate ref chip to open the reader — "Visual + educativo + fiel".
 *
 * Robustness round (2026-07-01): device-local progress ([[journeyProgress]])
 * + a SPECIAL achievement when every stop across every route is explored;
 * favorites ([[journeyFavorites]]); a narrated auto-advance walkthrough
 * (expo-speech reads each stop's label+note in sequence, mirroring the
 * Hilo profético pattern); an automatic "part of the prophetic thread" link
 * via [[findProphecyForVerseKey]] when a stop's exact verse is also a
 * prophecy/fulfillment; a curated `echoNote` for the rare stop that shares a
 * real location with another route (e.g. the Jordan); share-as-image
 * (react-native-view-shot, the same pipeline as the prophecy map); and a
 * purely decorative low-opacity route-icon watermark behind the rail (no
 * real geographic data — a deliberate "light touch" per the user's call).
 *
 * Reached from the journeys hub `/features/journeys`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, {Line, Circle} from 'react-native-svg';
import {captureRef} from 'react-native-view-shot';
import {Stack, useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {useToast} from '@context/ToastContext';
import {useServices} from '@context/ServicesContext';
import {useNarratedWalkthrough} from '@hooks/useNarratedWalkthrough';
import {shareOrDownloadImage} from '@/features/share/shareOrDownloadImage';
import {
  resolveSpeechLanguage,
  buildStopNarration,
} from '@/lib/speech/narration';
import {haptics} from '@lib/haptics';
import {logger} from '@lib/utils/logger';
import {AppText} from '@components/ui/AppText';
import bibleDB from '@lib/database';
import {getBookByName} from '@/constants/bible';
import {parseChristRef} from '@/features/study/christConnections';
import {findProphecyForVerseKey} from '@/features/study/messianicProphecies';
import {
  JOURNEY_STOPS,
  getStopsForRoute,
  JOURNEY_ROUTE_ACCENT,
  JOURNEY_ROUTE_ICON,
  type JourneyRouteId,
  type JourneyStop,
} from '@/features/study/journeyMaps';
import {buildJourneyMap} from '@/features/study/journeyMap';
import {
  getVisitedJourneyStops,
  markJourneyStopVisited,
} from '@/features/study/journeyProgress';
import {
  getFavoriteJourneyStops,
  toggleJourneyStopFavorite,
} from '@/features/study/journeyFavorites';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const VALID_ROUTES: readonly JourneyRouteId[] = [
  'abraham',
  'exodus',
  'exile',
  'jesus',
  'paul',
];

interface StopItem {
  label: string;
  note: string;
  echoNote?: string;
}

export default function JourneyRouteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const {colors, gradient, highContrast} = useTheme();
  const {t, language} = useLanguage();
  const {selectedVersion} = useBibleVersion();
  const toast = useToast();
  const {achievementService, notifyAchievements} = useServices();
  const tj = t.journeys;
  const params = useLocalSearchParams<{routeId?: string}>();
  const routeId: JourneyRouteId = VALID_ROUTES.includes(
    params.routeId as JourneyRouteId,
  )
    ? (params.routeId as JourneyRouteId)
    : 'exodus';

  const stops = useMemo(() => getStopsForRoute(routeId), [routeId]);
  const accent = JOURNEY_ROUTE_ACCENT[routeId];
  const routeMeta = (
    tj.routes as Record<
      string,
      {title: string; subtitle: string; description: string}
    >
  )[routeId];
  const items = tj.items as Record<string, StopItem>;

  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<Record<string, string | null>>(
    {},
  );
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const captureCardRef = useRef<View>(null);
  // Auto-scroll plumbing for the narrated walkthrough (see the effect near
  // `speakingId` below): a ref to the ScrollView + each stop card's measured
  // Y offset, kept fresh via `onLayout` since cards vary in height (an
  // expanded preview, an echo note, a prophecy-thread chip).
  const scrollViewRef = useRef<ScrollView>(null);
  const stopLayoutYRef = useRef<Record<string, number>>({});
  const listOffsetYRef = useRef(0);

  useEffect(() => {
    let active = true;
    void getVisitedJourneyStops().then(set => {
      if (active) setVisited(set);
    });
    void getFavoriteJourneyStops().then(set => {
      if (active) setFavorites(set);
    });
    return () => {
      active = false;
    };
  }, []);

  const markVisited = (id: string) => {
    void markJourneyStopVisited(id).then(next => {
      setVisited(next);
      if (next.size >= JOURNEY_STOPS.length && achievementService) {
        void achievementService.trackJourneyRoutesComplete().then(unlocked => {
          if (unlocked.length > 0) notifyAchievements(unlocked);
        });
      }
    });
  };

  const toggleFavorite = (id: string) => {
    haptics.tap();
    void toggleJourneyStopFavorite(id).then(setFavorites);
  };

  const canvasW = Math.min(width - spacing.lg * 2, 520);
  const map = useMemo(
    () =>
      buildJourneyMap(
        stops.map(s => s.id),
        {width: canvasW},
      ),
    [stops, canvasW],
  );

  const headerGradient: readonly [string, string, ...string[]] = highContrast
    ? (gradient.headerColors as readonly [string, string, ...string[]])
    : [colors.primary, colors.primaryDark];

  // A deep link straight into this screen leaves no back-stack entry, so
  // router.back() would throw a "GO_BACK not handled" navigation error.
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/features/journeys' as never);
  };

  const localizedRef = (ref: string) => {
    const parsed = parseChristRef(ref);
    if (!parsed) return null;
    const book = getBookByName(parsed.book);
    if (!book) return null;
    const display = selectedVersion.language === 'es' ? book.name : book.nameEn;
    return {
      display,
      reference: `${display} ${parsed.chapter}:${parsed.verse}`,
      bookId: book.id,
      chapter: parsed.chapter,
      verse: parsed.verse,
    };
  };

  const openInReader = (stop: JourneyStop) => {
    const info = localizedRef(stop.ref);
    if (!info) return;
    haptics.tap();
    markVisited(stop.id);
    router.push(
      `/verse/${info.display}/${info.chapter}?verse=${info.verse}` as never,
    );
  };

  const openProphecyLink = (verseKey: string) => {
    const found = findProphecyForVerseKey(verseKey);
    if (!found) return;
    haptics.tap();
    router.push(`/features/prophecies?start=${found.index}` as never);
  };

  const toggleExpand = (stop: JourneyStop) => {
    haptics.tap();
    markVisited(stop.id);
    if (expandedId === stop.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(stop.id);
    if (previewText[stop.id] !== undefined) return;
    const info = localizedRef(stop.ref);
    if (!info) {
      setPreviewText(prev => ({...prev, [stop.id]: null}));
      return;
    }
    setPreviewLoading(stop.id);
    void (async () => {
      try {
        await bibleDB.initialize();
        const row = await bibleDB
          .getVerse(info.bookId, info.chapter, info.verse, selectedVersion.id)
          .catch(() => null);
        setPreviewText(prev => ({...prev, [stop.id]: row?.text ?? null}));
      } finally {
        setPreviewLoading(null);
      }
    })();
  };

  // "Recorrido narrado" — reads each stop's label + note aloud in sequence,
  // from the first stop to the last, until stopped, via the shared narration
  // engine ([[useNarratedWalkthrough]], Tanda 3). No live verse text is
  // fetched here (the note IS the narration), so `segments` is always ready
  // (never `null`) — there is no async-race risk like the prophecy thread's
  // cross-step chaining has.
  const [activeIndex, setActiveIndex] = useState(0);
  const segments = useMemo(() => {
    const stop = stops[activeIndex];
    const item = stop ? items[stop.id] : undefined;
    const text = buildStopNarration(item?.label, item?.note);
    return text ? [text] : [];
  }, [stops, activeIndex, items]);

  const {
    speaking,
    walkthroughActive,
    toggle: toggleWalkthroughTour,
  } = useNarratedWalkthrough({
    total: stops.length,
    index: activeIndex,
    setIndex: setActiveIndex,
    segments,
    // The label/note come from the UI's i18n content (`t.journeys.items`),
    // not the selected Bible version's text — so the voice must follow the
    // UI language, not `selectedVersion.language` (they can differ, e.g. a
    // Spanish UI reading an English WEB version).
    getLanguage: () => resolveSpeechLanguage(language),
    onEnterStep: i => {
      const stop = stops[i];
      if (stop) markVisited(stop.id);
    },
  });
  const speakingId = speaking ? (stops[activeIndex]?.id ?? null) : null;

  // Keep the stop being narrated on screen: while the tour runs, follow
  // `activeIndex` as it advances so the user isn't left scrolling manually
  // to find which card is currently being read (real-device report). Cards
  // are measured via `onLayout` (below), so this only fires once the target
  // card has actually been laid out.
  useEffect(() => {
    if (!walkthroughActive) return;
    const stop = stops[activeIndex];
    if (!stop) return;
    const cardY = stopLayoutYRef.current[stop.id];
    if (cardY === undefined) return;
    const targetY = Math.max(0, listOffsetYRef.current + cardY - spacing.md);
    scrollViewRef.current?.scrollTo({y: targetY, animated: true});
  }, [activeIndex, walkthroughActive, stops]);

  const toggleWalkthrough = () => {
    haptics.tap();
    // Always restarts from the first stop, matching the pre-Tanda-3 behavior.
    toggleWalkthroughTour(0);
  };

  async function handleShareMap() {
    if (sharing || !captureCardRef.current) return;
    try {
      setSharing(true);
      haptics.press();
      const uri = await captureRef(captureCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      const result = await shareOrDownloadImage(uri, {dialogTitle: t.share});
      if (result === 'unavailable') {
        toast.error(t.verse.imageShareError);
        return;
      }
      if (result === 'downloaded') {
        toast.success(t.verse.imageDownloaded);
      }
    } catch (error) {
      logger.error('Error sharing journey map image', error as Error, {
        component: 'JourneyRouteScreen',
        action: 'handleShareMap',
      });
      toast.error(t.verse.imageShareError);
    } finally {
      setSharing(false);
    }
  }

  const firstY = map.nodes[0]?.y ?? 0;
  const lastY = map.nodes[map.nodes.length - 1]?.y ?? 0;
  const visitedInRoute = stops.filter(s => visited.has(s.id)).length;

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
              style={styles.iconButton}
              onPress={goBack}
              accessibilityRole="button"
              accessibilityLabel={t.bible.back}>
              <Ionicons
                name="arrow-back"
                size={24}
                color={staticColors.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => void handleShareMap()}
              disabled={sharing}
              accessibilityRole="button"
              accessibilityLabel={tj.shareMap}>
              {sharing ? (
                <ActivityIndicator color={staticColors.white} />
              ) : (
                <Ionicons
                  name="share-outline"
                  size={22}
                  color={staticColors.white}
                />
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.headerTextRow}>
            <View style={styles.headerIcon}>
              <Ionicons
                name={JOURNEY_ROUTE_ICON[routeId] as never}
                size={22}
                color={staticColors.white}
              />
            </View>
            <View style={styles.headerInfo}>
              <AppText scaleRole="compact" style={styles.headerLabel}>
                {routeMeta.subtitle}
              </AppText>
              <AppText scaleRole="display" style={styles.headerTitle}>
                {routeMeta.title}
              </AppText>
            </View>
          </View>
          <AppText scaleRole="compact" style={styles.headerProgress}>
            {tj.progress
              .replace('{{n}}', String(visitedInRoute))
              .replace('{{total}}', String(stops.length))}
          </AppText>
        </LinearGradient>

        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + spacing['2xl']},
            centeredMaxWidth(),
          ]}
          showsVerticalScrollIndicator={false}>
          <AppText style={[styles.description, {color: colors.textSecondary}]}>
            {routeMeta.description}
          </AppText>

          <TouchableOpacity
            style={[styles.walkthroughBtn, {borderColor: accent + '55'}]}
            onPress={toggleWalkthrough}
            accessibilityRole="button"
            accessibilityLabel={
              walkthroughActive ? tj.walkthroughStop : tj.walkthroughStart
            }>
            <Ionicons
              name={walkthroughActive ? 'stop-circle' : 'play-skip-forward'}
              size={18}
              color={accent}
            />
            <AppText
              scaleRole="compact"
              style={[styles.walkthroughText, {color: accent}]}>
              {walkthroughActive ? tj.walkthroughStop : tj.walkthroughStart}
            </AppText>
          </TouchableOpacity>

          {/* The capturable card: rail map + a faint per-route icon watermark
              (purely decorative — no real geographic data, per the user's
              "light touch" call) + signature, for the share-as-image action. */}
          <View
            ref={captureCardRef}
            collapsable={false}
            style={[styles.captureCard, {backgroundColor: colors.background}]}>
            <View
              style={[styles.mapWrap, {width: canvasW, height: map.height}]}>
              <Ionicons
                name={JOURNEY_ROUTE_ICON[routeId] as never}
                size={Math.min(canvasW, map.height) * 0.8}
                color={accent}
                style={[
                  styles.mapWatermark,
                  {
                    top:
                      map.height / 2 -
                      (Math.min(canvasW, map.height) * 0.8) / 2,
                    left:
                      canvasW / 2 - (Math.min(canvasW, map.height) * 0.8) / 2,
                  },
                ]}
              />
              <Svg width={canvasW} height={map.height}>
                <Line
                  x1={map.railX}
                  y1={firstY}
                  x2={map.railX}
                  y2={lastY}
                  stroke={accent}
                  strokeOpacity={0.5}
                  strokeWidth={2}
                />
                {map.nodes.map(node => {
                  const isSpeaking = stops[node.index]?.id === speakingId;
                  return (
                    <Circle
                      key={node.id}
                      cx={map.railX}
                      cy={node.y}
                      r={isSpeaking ? 9 : 6}
                      fill={accent}
                      fillOpacity={isSpeaking ? 1 : 0.85}
                    />
                  );
                })}
              </Svg>
              <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {stops.map((stop, i) => {
                  const node = map.nodes[i];
                  if (!node) return null;
                  return (
                    <Pressable
                      key={stop.id}
                      onPress={() => openInReader(stop)}
                      style={[
                        styles.mapRow,
                        {top: node.y - 16, left: map.railX + 16},
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={items[stop.id]?.label ?? stop.id}>
                      <AppText
                        scaleRole="compact"
                        style={[styles.mapLabel, {color: colors.text}]}
                        numberOfLines={1}>
                        {items[stop.id]?.label ?? ''}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View style={styles.signatureRow}>
              <Ionicons name="map" size={12} color={colors.textTertiary} />
              <AppText
                scaleRole="compact"
                style={[styles.signatureText, {color: colors.textTertiary}]}>
                Eternal Stone Bible · {routeMeta.title}
              </AppText>
            </View>
          </View>

          {/* The full stop list — tapping a card expands an inline verse
              preview; the ref chip is a separate action that opens the
              reader. The map above is a visual shortcut straight to the
              reader, not a separate source of information. */}
          <View
            style={styles.list}
            onLayout={e => {
              listOffsetYRef.current = e.nativeEvent.layout.y;
            }}>
            {stops.map((stop, i) => {
              const info = localizedRef(stop.ref);
              const item = items[stop.id];
              const expanded = expandedId === stop.id;
              const isSpeaking = speakingId === stop.id;
              const isFavorite = favorites.has(stop.id);
              const prophecyLink = findProphecyForVerseKey(stop.ref);
              return (
                <TouchableOpacity
                  key={stop.id}
                  style={[
                    styles.stopCard,
                    isSpeaking ? styles.stopCardSpeaking : null,
                    {
                      backgroundColor: colors.card,
                      borderColor: isSpeaking ? accent : colors.border,
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => toggleExpand(stop)}
                  onLayout={e => {
                    stopLayoutYRef.current[stop.id] = e.nativeEvent.layout.y;
                  }}
                  accessibilityRole="button"
                  accessibilityState={{expanded}}
                  accessibilityLabel={item?.label ?? ''}>
                  <View style={styles.stopHead}>
                    <View
                      style={[
                        styles.stopDot,
                        {backgroundColor: accent + '22'},
                      ]}>
                      <AppText
                        scaleRole="compact"
                        style={[styles.stopDotText, {color: accent}]}>
                        {String(i + 1)}
                      </AppText>
                    </View>
                    <AppText
                      style={[styles.stopLabel, {color: colors.text}]}
                      numberOfLines={1}>
                      {item?.label ?? ''}
                    </AppText>
                    <TouchableOpacity
                      onPress={() => toggleFavorite(stop.id)}
                      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isFavorite ? tj.unfavorite : tj.favorite
                      }
                      accessibilityState={{selected: isFavorite}}>
                      <Ionicons
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={18}
                        color={isFavorite ? accent : colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                  {!!item?.note && (
                    <AppText
                      scaleRole="compact"
                      style={[styles.stopNote, {color: colors.textSecondary}]}>
                      {item.note}
                    </AppText>
                  )}

                  {!!item?.echoNote && (
                    <View
                      style={[
                        styles.echoCard,
                        {
                          backgroundColor: accent + '12',
                          borderColor: accent + '33',
                        },
                      ]}>
                      <Ionicons name="sparkles" size={13} color={accent} />
                      <AppText
                        scaleRole="compact"
                        style={[
                          styles.echoText,
                          {color: colors.textSecondary},
                        ]}>
                        {item.echoNote}
                      </AppText>
                    </View>
                  )}

                  {expanded && (
                    <View style={styles.previewBox}>
                      {previewLoading === stop.id ? (
                        <ActivityIndicator color={accent} />
                      ) : (
                        <AppText
                          style={[styles.previewText, {color: colors.text}]}>
                          {previewText[stop.id] ?? tj.missingText}
                        </AppText>
                      )}
                    </View>
                  )}

                  <View style={styles.stopFooterRow}>
                    <TouchableOpacity
                      style={[styles.stopRefChip, {borderColor: accent + '55'}]}
                      onPress={() => openInReader(stop)}
                      accessibilityRole="button"
                      accessibilityLabel={`${tj.openInReader}: ${item?.label ?? ''}`}>
                      <Ionicons name="book-outline" size={13} color={accent} />
                      <AppText
                        scaleRole="compact"
                        style={[styles.stopRefText, {color: accent}]}>
                        {info?.reference ?? tj.missingText}
                      </AppText>
                    </TouchableOpacity>
                    {prophecyLink && (
                      <TouchableOpacity
                        style={[
                          styles.stopRefChip,
                          {borderColor: colors.primary + '55'},
                        ]}
                        onPress={() => openProphecyLink(stop.ref)}
                        accessibilityRole="button"
                        accessibilityLabel={tj.partOfThread}>
                        <Ionicons
                          name="git-network-outline"
                          size={13}
                          color={colors.primary}
                        />
                        <AppText
                          scaleRole="compact"
                          style={[styles.stopRefText, {color: colors.primary}]}>
                          {tj.partOfThread}
                        </AppText>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
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
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerProgress: {
    color: staticColors.glassWhite90,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  content: {padding: spacing.lg, gap: spacing.lg, alignItems: 'center'},
  description: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    textAlign: 'center',
  },
  walkthroughBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  walkthroughText: {fontSize: fontSizes.sm, fontWeight: '700'},
  captureCard: {alignItems: 'center', gap: spacing.sm},
  mapWrap: {},
  mapWatermark: {position: 'absolute', opacity: 0.06},
  mapRow: {position: 'absolute', right: spacing.sm},
  mapLabel: {fontSize: fontSizes.sm, fontWeight: '700'},
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  signatureText: {fontSize: fontSizes.xs, fontWeight: '600'},
  list: {alignSelf: 'stretch', gap: spacing.sm},
  stopCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.xs,
  },
  stopCardSpeaking: {borderWidth: 2},
  stopHead: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  stopDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopDotText: {fontSize: fontSizes.xs, fontWeight: '800'},
  stopLabel: {flex: 1, fontSize: fontSizes.md, fontWeight: '800'},
  stopNote: {fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.45},
  echoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  echoText: {flex: 1, fontSize: fontSizes.xs, lineHeight: fontSizes.xs * 1.5},
  previewBox: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: staticColors.overlayBlack60,
  },
  previewText: {fontSize: fontSizes.md, lineHeight: fontSizes.md * 1.5},
  stopFooterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stopRefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  stopRefText: {fontSize: fontSizes.xs, fontWeight: '700'},
});
