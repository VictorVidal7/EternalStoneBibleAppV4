/**
 * 🛤️ JOURNEY ROUTE — one Bible route's tappable rail map + stop list.
 *
 * Renders one of the 3 curated routes from [[journeyMaps]] as a vertical rail
 * (pure geometry from [[journeyMap]]): a dot per stop with its label, in walk
 * order. Tapping a dot OR its card in the list below jumps straight to that
 * stop's verse in the reader — "Visual + educativo + fiel", no live verse
 * text fetched here (the note is the content; the reader shows the passage).
 *
 * Reached from the journeys hub `/features/journeys`.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

import React, {useMemo} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Svg, {Line, Circle} from 'react-native-svg';
import {Stack, useRouter, useLocalSearchParams} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@hooks/useTheme';
import {centeredMaxWidth} from '@/styles/responsive';
import {useLanguage} from '@hooks/useLanguage';
import {useBibleVersion} from '@hooks/useBibleVersion';
import {haptics} from '@lib/haptics';
import {AppText} from '@components/ui/AppText';
import {getBookByName} from '@/constants/bible';
import {parseChristRef} from '@/features/study/christConnections';
import {
  getStopsForRoute,
  JOURNEY_ROUTE_ACCENT,
  JOURNEY_ROUTE_ICON,
  type JourneyRouteId,
  type JourneyStop,
} from '@/features/study/journeyMaps';
import {buildJourneyMap} from '@/features/study/journeyMap';
import {
  borderRadius,
  fontSize as fontSizes,
  spacing,
  staticColors,
} from '@/styles/designTokens';

const VALID_ROUTES: readonly JourneyRouteId[] = ['exodus', 'paul', 'jesus'];

export default function JourneyRouteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const {colors} = useTheme();
  const {t} = useLanguage();
  const {selectedVersion} = useBibleVersion();
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
  const items = tj.items as Record<string, {label: string; note: string}>;

  const canvasW = Math.min(width - spacing.lg * 2, 520);
  const map = useMemo(
    () =>
      buildJourneyMap(
        stops.map(s => s.id),
        {width: canvasW},
      ),
    [stops, canvasW],
  );

  const headerGradient: [string, string] = [colors.primary, colors.primaryDark];

  const localizedRef = (ref: string) => {
    const parsed = parseChristRef(ref);
    if (!parsed) return null;
    const book = getBookByName(parsed.book);
    if (!book) return null;
    const display = selectedVersion.language === 'es' ? book.name : book.nameEn;
    return {
      display,
      reference: `${display} ${parsed.chapter}:${parsed.verse}`,
      chapter: parsed.chapter,
      verse: parsed.verse,
    };
  };

  const openInReader = (stop: JourneyStop) => {
    const info = localizedRef(stop.ref);
    if (!info) return;
    haptics.tap();
    router.push(
      `/verse/${info.display}/${info.chapter}?verse=${info.verse}` as never,
    );
  };

  const firstY = map.nodes[0]?.y ?? 0;
  const lastY = map.nodes[map.nodes.length - 1]?.y ?? 0;

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
        </LinearGradient>

        <ScrollView
          contentContainerStyle={[
            styles.content,
            {paddingBottom: insets.bottom + spacing['2xl']},
            centeredMaxWidth(),
          ]}
          showsVerticalScrollIndicator={false}>
          <AppText style={[styles.description, {color: colors.textSecondary}]}>
            {routeMeta.description}
          </AppText>

          {/* The rail map: one dot per stop, connected by a single line, in
              walk order. Tap targets are an RN Pressable overlay (SVG has no
              interactive elements, and onPress inside a ScrollView is
              unreliable — the same gotcha the prophecy map hit). */}
          <View style={[styles.mapWrap, {width: canvasW, height: map.height}]}>
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
              {map.nodes.map(node => (
                <Circle
                  key={node.id}
                  cx={map.railX}
                  cy={node.y}
                  r={6}
                  fill={accent}
                />
              ))}
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

          {/* The full stop list — label, note, and a ref chip that jumps to
              the passage. The map above is a visual shortcut to the same
              action, not a separate source of information. */}
          <View style={styles.list}>
            {stops.map((stop, i) => {
              const info = localizedRef(stop.ref);
              const item = items[stop.id];
              return (
                <TouchableOpacity
                  key={stop.id}
                  style={[
                    styles.stopCard,
                    {backgroundColor: colors.card, borderColor: colors.border},
                  ]}
                  activeOpacity={0.85}
                  onPress={() => openInReader(stop)}
                  accessibilityRole="button"
                  accessibilityLabel={`${tj.openInReader}: ${item?.label ?? ''}`}>
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
                  </View>
                  {!!item?.note && (
                    <AppText
                      scaleRole="compact"
                      style={[styles.stopNote, {color: colors.textSecondary}]}>
                      {item.note}
                    </AppText>
                  )}
                  <View
                    style={[styles.stopRefChip, {borderColor: accent + '55'}]}>
                    <Ionicons name="book-outline" size={13} color={accent} />
                    <AppText
                      scaleRole="compact"
                      style={[styles.stopRefText, {color: accent}]}>
                      {info?.reference ?? tj.missingText}
                    </AppText>
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
  backButton: {width: 40, height: 40, justifyContent: 'center'},
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
  content: {padding: spacing.lg, gap: spacing.lg, alignItems: 'center'},
  description: {
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
    textAlign: 'center',
  },
  mapWrap: {},
  mapRow: {position: 'absolute', right: spacing.sm},
  mapLabel: {fontSize: fontSizes.sm, fontWeight: '700'},
  list: {alignSelf: 'stretch', gap: spacing.sm},
  stopCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.xs,
  },
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
  stopRefChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  stopRefText: {fontSize: fontSizes.xs, fontWeight: '700'},
});
